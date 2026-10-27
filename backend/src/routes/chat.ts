import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db, Message, Chat } from '../db';
import { keyPoolManager } from '../keyPoolManager';
import { creditEngine, getCreditCostForModel } from '../creditEngine';

export const chatRouter = Router();

function getSystemPromptForAgent(model?: string, hasImages = false): string {
  const m = (model || '').toLowerCase();
  if (hasImages) {
    return 'You are WormDonz Vision Specialist. Thoroughly examine the visual input. Directly analyze the image context, layout, diagrams, or text and answer in crisp, streaming Markdown. Do not generate images.';
  }

  return `You are WormDonz AI, a powerful, lightning-fast multi-model intelligence assistant created by dj.
When asked "sino ka" / "who are you" / "ano ka" / "what is wormdonz" or similar questions about your identity, keep your answer simple, clean, and humble:
"Ako si WormDonz AI, isang matalino at mabilis na AI assistant na nilikha ni dj para tulungan ka sa coding, pagsusuri, pananaliksik, at pang-araw-araw na mga gawain."
Deliver direct, accurate, and structured answers tailored strictly to what the user asks. Never use fluff or generic disclaimers. Always format code in clean, syntax-highlighted markdown code blocks so that it can be easily copied.`;
}

/**
 * List all chats for a user (pinned first, then by updated_at desc)
 */
chatRouter.get('/user/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  const userChats = Array.from(db.chats.values())
    .filter(c => c.user_id === userId)
    .sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) {
        return a.is_pinned ? -1 : 1;
      }
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

  res.json({ chats: userChats });
});

/**
 * Create a new chat
 */
chatRouter.post('/', (req: Request, res: Response) => {
  const { userId, title, model } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  const newChat: Chat = {
    id: uuidv4(),
    user_id: userId,
    title: title || 'New Conversation',
    is_pinned: false,
    model: model || 'wormdonz-base',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  db.chats.set(newChat.id, newChat);
  res.status(201).json({ chat: newChat });
});

/**
 * Toggle pin status or rename chat
 */
chatRouter.patch('/:chatId', (req: Request, res: Response) => {
  const { chatId } = req.params;
  const { title, is_pinned } = req.body;
  const chat = db.chats.get(chatId);

  if (!chat) {
    return res.status(404).json({ error: 'Chat not found' });
  }

  if (title !== undefined) chat.title = title;
  if (is_pinned !== undefined) chat.is_pinned = is_pinned;
  chat.updated_at = new Date().toISOString();
  db.chats.set(chatId, chat);

  res.json({ chat });
});

/**
 * Delete a chat
 */
chatRouter.delete('/:chatId', (req: Request, res: Response) => {
  const { chatId } = req.params;
  db.chats.delete(chatId);
  db.messages.delete(chatId);
  res.json({ success: true });
});

/**
 * Get messages for a chat
 */
chatRouter.get('/:chatId/messages', (req: Request, res: Response) => {
  const { chatId } = req.params;
  const messages = db.messages.get(chatId) || [];
  res.json({ messages });
});

/**
 * Core Proxy Chat Endpoint with Multi-Key Failover & Credit Validation
 */
chatRouter.post('/send', async (req: Request, res: Response) => {
  const { userId, chatId, message, model, images = [], stream = false } = req.body;

  if (!userId || (!message && (!images || images.length === 0))) {
    return res.status(400).json({ error: 'userId and message or images are required' });
  }

  // 1. Credit & Image Quota Checks
  const hasImages = Array.isArray(images) && images.length > 0;
  const creditCost = getCreditCostForModel(model, hasImages);

  try {
    const allowance = creditEngine.verifyCreditAllowance(userId, creditCost);
    if (!allowance.allowed) {
      return res.status(403).json({
        error: 'INSUFFICIENT_CREDITS',
        message: `You have ${allowance.remainingCredits} credits remaining, but this model (${model || 'WormDonz'}) requires ${creditCost} credits. Please redeem a code or upgrade.`,
        requiredCredits: creditCost,
        remainingCredits: allowance.remainingCredits
      });
    }

    // Vision Image Upload Quota Check
    if (hasImages) {
      const imgAllowance = creditEngine.verifyImageUploadAllowance(userId, images.length);
      if (!imgAllowance.allowed) {
        const errorMsg = imgAllowance.reason === 'FREE_IMAGE_LIFETIME_EXHAUSTED'
          ? 'You have used all 3 Free Lifetime Image Uploads. Upgrade to a paid plan to continue vision analysis.'
          : `Daily image upload quota reached (${imgAllowance.maxAllowed}/day). Resets at 4:00 PM PH Time.`;
        return res.status(403).json({
          error: imgAllowance.reason,
          message: errorMsg,
          isImageQuotaBlocked: true,
          imageAllowance: imgAllowance
        });
      }
      // Record image upload
      creditEngine.recordImageUpload(userId, images.length);
    }
  } catch (err: any) {
    return res.status(403).json({ error: err.message });
  }

  // 2. Prepare or retrieve chat conversation
  let activeChatId = chatId;
  if (!activeChatId || !db.chats.has(activeChatId)) {
    const newChat: Chat = {
      id: uuidv4(),
      user_id: userId,
      title: message.slice(0, 32) + (message.length > 32 ? '...' : ''),
      is_pinned: false,
      model: model || 'wormdonz-base',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    db.chats.set(newChat.id, newChat);
    activeChatId = newChat.id;
  }

  // Record user message with attached vision images
  const userMsg: Message = {
    id: uuidv4(),
    chat_id: activeChatId,
    user_id: userId,
    role: 'user',
    content: message,
    images: Array.isArray(images) && images.length > 0 ? images : undefined,
    tokens_used: Math.ceil(message.length / 4) + (images?.length || 0) * 85,
    created_at: new Date().toISOString()
  };

  const currentMessages = db.messages.get(activeChatId) || [];
  currentMessages.push(userMsg);
  db.messages.set(activeChatId, currentMessages);

  // 3. Build upstream message payload with agent-specific persona & isolated pool routing
  const systemPrompt = getSystemPromptForAgent(model, hasImages);
  const conversationMessages = currentMessages.map(m => ({ role: m.role, content: m.content, images: m.images }));
  const upstreamPayload = {
    model: model || 'wormdonz-base',
    messages: [
      { role: 'system', content: systemPrompt },
      ...conversationMessages
    ],
    images: Array.isArray(images) ? images : [],
    stream
  };

  // 4. Handle Streaming vs Non-Streaming
  if (stream) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    
    // Flush response headers immediately to establish connection without delay
    if (typeof (res as any).flushHeaders === 'function') {
      (res as any).flushHeaders();
    }
    // Write initial comment to force TCP/TLS socket packet dispatch
    res.write(': keepalive\n\n');

    // Periodic keep-alive ping every 10s prevents reverse proxy / Dart socket timeout
    const keepAliveTimer = setInterval(() => {
      if (!res.writableEnded) {
        res.write(': ping\n\n');
      }
    }, 10000);

    try {
      // Execute through failover engine
      const failoverResult = await keyPoolManager.executeWithFailover(upstreamPayload);

      // High-speed natural chunk streaming: 2-3 words per 6ms for instantaneous delivery
      const tokens = failoverResult.content.split(' ');
      const chunkSize = 2;
      for (let i = 0; i < tokens.length; i += chunkSize) {
        const slice = tokens.slice(i, i + chunkSize).join(' ') + ' ';
        res.write(`data: ${JSON.stringify({ token: slice })}\n\n`);
        await new Promise(r => setTimeout(r, 6));
      }

      // Deduct model-dependent credit cost atomically
      const remainingCredits = creditEngine.deductCredit(userId, creditCost, 'chat_deduction', activeChatId);

      // Record assistant message
      const assistantMsg: Message = {
        id: uuidv4(),
        chat_id: activeChatId,
        user_id: userId,
        role: 'assistant',
        content: failoverResult.content,
        tokens_used: failoverResult.tokensUsed,
        created_at: new Date().toISOString()
      };
      currentMessages.push(assistantMsg);
      db.messages.set(activeChatId, currentMessages);

      // Final SSE packet with complete metadata
      res.write(`data: ${JSON.stringify({
        done: true,
        chatId: activeChatId,
        creditCost,
        remainingCredits,
        servedByKeyAlias: failoverResult.servedByKeyAlias,
        failoverAttempts: failoverResult.failoverAttempts
      })}\n\n`);
      res.end();
    } catch (err: any) {
      console.error('[ChatRouter] Stream failover exhausted:', err.message);
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    } finally {
      clearInterval(keepAliveTimer);
    }
  } else {
    // Non-streaming response
    try {
      const failoverResult = await keyPoolManager.executeWithFailover(upstreamPayload);

      // Deduct model-dependent credit cost atomically
      const remainingCredits = creditEngine.deductCredit(userId, creditCost, 'chat_deduction', activeChatId);

      // Save assistant message
      const assistantMsg: Message = {
        id: uuidv4(),
        chat_id: activeChatId,
        user_id: userId,
        role: 'assistant',
        content: failoverResult.content,
        tokens_used: failoverResult.tokensUsed,
        created_at: new Date().toISOString()
      };
      currentMessages.push(assistantMsg);
      db.messages.set(activeChatId, currentMessages);

      // Update chat title if first exchange
      const chat = db.chats.get(activeChatId);
      if (chat && currentMessages.length <= 2) {
        chat.title = message.slice(0, 36) + (message.length > 36 ? '...' : '');
        chat.updated_at = new Date().toISOString();
        db.chats.set(activeChatId, chat);
      }

      return res.json({
        chatId: activeChatId,
        message: assistantMsg,
        creditCost,
        remainingCredits,
        servedByKeyAlias: failoverResult.servedByKeyAlias,
        failoverAttempts: failoverResult.failoverAttempts
      });
    } catch (err: any) {
      console.error('[ChatRouter] Error executing prompt:', err.message);
      return res.status(502).json({
        error: 'UPSTREAM_FAILURE',
        message: err.message || 'All keys in the failover pool failed to respond.'
      });
    }
  }
});
