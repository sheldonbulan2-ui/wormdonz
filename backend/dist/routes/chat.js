"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatRouter = void 0;
const express_1 = require("express");
const uuid_1 = require("uuid");
const db_1 = require("../db");
const keyPoolManager_1 = require("../keyPoolManager");
const creditEngine_1 = require("../creditEngine");
exports.chatRouter = (0, express_1.Router)();
/**
 * List all chats for a user (pinned first, then by updated_at desc)
 */
exports.chatRouter.get('/user/:userId', (req, res) => {
    const { userId } = req.params;
    const userChats = Array.from(db_1.db.chats.values())
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
exports.chatRouter.post('/', (req, res) => {
    const { userId, title, model } = req.body;
    if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
    }
    const newChat = {
        id: (0, uuid_1.v4)(),
        user_id: userId,
        title: title || 'New Conversation',
        is_pinned: false,
        model: model || 'wormdonz-base',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    db_1.db.chats.set(newChat.id, newChat);
    res.status(201).json({ chat: newChat });
});
/**
 * Toggle pin status or rename chat
 */
exports.chatRouter.patch('/:chatId', (req, res) => {
    const { chatId } = req.params;
    const { title, is_pinned } = req.body;
    const chat = db_1.db.chats.get(chatId);
    if (!chat) {
        return res.status(404).json({ error: 'Chat not found' });
    }
    if (title !== undefined)
        chat.title = title;
    if (is_pinned !== undefined)
        chat.is_pinned = is_pinned;
    chat.updated_at = new Date().toISOString();
    db_1.db.chats.set(chatId, chat);
    res.json({ chat });
});
/**
 * Delete a chat
 */
exports.chatRouter.delete('/:chatId', (req, res) => {
    const { chatId } = req.params;
    db_1.db.chats.delete(chatId);
    db_1.db.messages.delete(chatId);
    res.json({ success: true });
});
/**
 * Get messages for a chat
 */
exports.chatRouter.get('/:chatId/messages', (req, res) => {
    const { chatId } = req.params;
    const messages = db_1.db.messages.get(chatId) || [];
    res.json({ messages });
});
/**
 * Core Proxy Chat Endpoint with Multi-Key Failover & Credit Validation
 */
exports.chatRouter.post('/send', async (req, res) => {
    const { userId, chatId, message, model, images = [], stream = false } = req.body;
    if (!userId || (!message && (!images || images.length === 0))) {
        return res.status(400).json({ error: 'userId and message or images are required' });
    }
    // 1. Credit & Image Quota Checks
    try {
        const allowance = creditEngine_1.creditEngine.verifyCreditAllowance(userId);
        if (!allowance.allowed) {
            return res.status(403).json({
                error: 'INSUFFICIENT_CREDITS',
                message: 'You have 0 credits remaining. Please enter a promo redeem code or upgrade your subscription plan.',
                remainingCredits: 0
            });
        }
        // Vision Image Upload Quota Check
        if (Array.isArray(images) && images.length > 0) {
            const imgAllowance = creditEngine_1.creditEngine.verifyImageUploadAllowance(userId, images.length);
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
            creditEngine_1.creditEngine.recordImageUpload(userId, images.length);
        }
    }
    catch (err) {
        return res.status(403).json({ error: err.message });
    }
    // 2. Prepare or retrieve chat conversation
    let activeChatId = chatId;
    if (!activeChatId || !db_1.db.chats.has(activeChatId)) {
        const newChat = {
            id: (0, uuid_1.v4)(),
            user_id: userId,
            title: message.slice(0, 32) + (message.length > 32 ? '...' : ''),
            is_pinned: false,
            model: model || 'wormdonz-base',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        db_1.db.chats.set(newChat.id, newChat);
        activeChatId = newChat.id;
    }
    // Record user message with attached vision images
    const userMsg = {
        id: (0, uuid_1.v4)(),
        chat_id: activeChatId,
        user_id: userId,
        role: 'user',
        content: message,
        images: Array.isArray(images) && images.length > 0 ? images : undefined,
        tokens_used: Math.ceil(message.length / 4) + (images?.length || 0) * 85,
        created_at: new Date().toISOString()
    };
    const currentMessages = db_1.db.messages.get(activeChatId) || [];
    currentMessages.push(userMsg);
    db_1.db.messages.set(activeChatId, currentMessages);
    // 3. Build upstream message payload with isolated pool routing
    const upstreamPayload = {
        model: model || 'wormdonz-base',
        messages: currentMessages.map(m => ({ role: m.role, content: m.content, images: m.images })),
        images: Array.isArray(images) ? images : [],
        stream
    };
    // 4. Handle Streaming vs Non-Streaming
    if (stream) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        try {
            // Execute through failover engine
            const failoverResult = await keyPoolManager_1.keyPoolManager.executeWithFailover(upstreamPayload);
            // Stream the response tokens back via SSE
            const tokens = failoverResult.content.split(' ');
            for (const token of tokens) {
                res.write(`data: ${JSON.stringify({ token: token + ' ' })}\n\n`);
                await new Promise(r => setTimeout(r, 25));
            }
            // Deduct credit atomically
            const remainingCredits = creditEngine_1.creditEngine.deductCredit(userId, 1, 'chat_deduction', activeChatId);
            // Record assistant message
            const assistantMsg = {
                id: (0, uuid_1.v4)(),
                chat_id: activeChatId,
                user_id: userId,
                role: 'assistant',
                content: failoverResult.content,
                tokens_used: failoverResult.tokensUsed,
                created_at: new Date().toISOString()
            };
            currentMessages.push(assistantMsg);
            db_1.db.messages.set(activeChatId, currentMessages);
            // Final SSE packet with complete metadata
            res.write(`data: ${JSON.stringify({
                done: true,
                chatId: activeChatId,
                remainingCredits,
                servedByKeyAlias: failoverResult.servedByKeyAlias,
                failoverAttempts: failoverResult.failoverAttempts
            })}\n\n`);
            res.end();
        }
        catch (err) {
            console.error('[ChatRouter] Stream failover exhausted:', err.message);
            res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
            res.end();
        }
    }
    else {
        // Non-streaming response
        try {
            const failoverResult = await keyPoolManager_1.keyPoolManager.executeWithFailover(upstreamPayload);
            // Deduct credit atomically
            const remainingCredits = creditEngine_1.creditEngine.deductCredit(userId, 1, 'chat_deduction', activeChatId);
            // Save assistant message
            const assistantMsg = {
                id: (0, uuid_1.v4)(),
                chat_id: activeChatId,
                user_id: userId,
                role: 'assistant',
                content: failoverResult.content,
                tokens_used: failoverResult.tokensUsed,
                created_at: new Date().toISOString()
            };
            currentMessages.push(assistantMsg);
            db_1.db.messages.set(activeChatId, currentMessages);
            // Update chat title if first exchange
            const chat = db_1.db.chats.get(activeChatId);
            if (chat && currentMessages.length <= 2) {
                chat.title = message.slice(0, 36) + (message.length > 36 ? '...' : '');
                chat.updated_at = new Date().toISOString();
                db_1.db.chats.set(activeChatId, chat);
            }
            return res.json({
                chatId: activeChatId,
                message: assistantMsg,
                remainingCredits,
                servedByKeyAlias: failoverResult.servedByKeyAlias,
                failoverAttempts: failoverResult.failoverAttempts
            });
        }
        catch (err) {
            console.error('[ChatRouter] Error executing prompt:', err.message);
            return res.status(502).json({
                error: 'UPSTREAM_FAILURE',
                message: err.message || 'All keys in the failover pool failed to respond.'
            });
        }
    }
});
