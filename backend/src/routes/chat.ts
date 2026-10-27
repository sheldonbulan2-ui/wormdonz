import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db, Message, Chat } from '../db';
import { keyPoolManager } from '../keyPoolManager';
import { creditEngine } from '../creditEngine';

export const chatRouter = Router();

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
  const { userId, chatId, message, model, stream = false } = req.body;

  if (!userId || !message) {
    return res.status(400).json({ error: 'userId and message are required' });
  }

  // 1. Credit Check
  try {
    const allowance = creditEngine.verifyCreditAllowance(userId);
    if (!allowance.allowed) {
      return res.status(403).json({
        error: 'INSUFFICIENT_CREDITS',
        message: 'You have 0 credits remaining. Please enter a promo redeem code or upgrade your subscription plan.',
        remainingCredits: 0
      });
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

  // Record user message
  const userMsg: Message = {
    id: uuidv4(),
    chat_id: activeChatId,
    user_id: userId,
    role: 'user',
    content: message,
    tokens_used: Math.ceil(message.length / 4),
    created_at: new Date().toISOString()
  };

  const currentMessages = db.messages.get(activeChatId) || [];
  currentMessages.push(userMsg);
  db.messages.set(activeChatId, currentMessages);

  // 3. Build upstream message payload
  const upstreamPayload = {
    model: model || 'wormdonz-base',
    messages: currentMessages.map(m => ({ role: m.role, content: m.content })),
    stream
  };

  // 4. Handle Streaming vs Non-Streaming
  if (stream) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      // Execute through failover engine
      const failoverResult = await keyPoolManager.executeWithFailover(upstreamPayload);

      // Stream the response tokens back via SSE
      const tokens = failoverResult.content.split(' ');
      for (const token of tokens) {
        res.write(`data: ${JSON.stringify({ token: token + ' ' })}\n\n`);
        await new Promise(r => setTimeout(r, 25));
      }

      // Deduct credit atomically
      const remainingCredits = creditEngine.deductCredit(userId, 1, 'chat_deduction', activeChatId);

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
        remainingCredits,
        servedByKeyAlias: failoverResult.servedByKeyAlias,
        failoverAttempts: failoverResult.failoverAttempts
      })}\n\n`);
      res.end();
    } catch (err: any) {
      console.error('[ChatRouter] Stream failover exhausted:', err.message);
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    }
  } else {
    // Non-streaming response
    try {
      const failoverResult = await keyPoolManager.executeWithFailover(upstreamPayload);

      // Deduct credit atomically
      const remainingCredits = creditEngine.deductCredit(userId, 1, 'chat_deduction', activeChatId);

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
