"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRouter = void 0;
const express_1 = require("express");
const db_1 = require("../db");
const creditEngine_1 = require("../creditEngine");
exports.userRouter = (0, express_1.Router)();
/**
 * Get user profile & credit balance along with vision image quota metrics
 */
exports.userRouter.get('/profile/:userId', (req, res) => {
    const { userId } = req.params;
    const user = db_1.db.users.get(userId);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    const imageAllowance = creditEngine_1.creditEngine.verifyImageUploadAllowance(userId, 0);
    res.json({
        user: {
            ...user,
            image_used_lifetime: user.image_used_lifetime || 0,
            image_used_today: user.image_used_today || 0,
        },
        imageAllowance
    });
});
/**
 * Get active subscription plans for comparative paywall
 */
exports.userRouter.get('/plans', (req, res) => {
    const plans = Array.from(db_1.db.subscriptionPlans.values()).filter(p => p.is_active);
    res.json({ plans });
});
/**
 * Upgrade user subscription tier
 */
exports.userRouter.post('/upgrade', (req, res) => {
    const { userId, targetTier } = req.body;
    if (!userId || !targetTier) {
        return res.status(400).json({ error: 'userId and targetTier are required' });
    }
    const user = db_1.db.users.get(userId);
    if (!user)
        return res.status(404).json({ error: 'User not found' });
    const plan = db_1.db.subscriptionPlans.get(targetTier);
    if (!plan)
        return res.status(400).json({ error: 'Invalid subscription tier' });
    user.tier = targetTier;
    // Grant tier monthly allowance
    user.credits += plan.credit_allowance;
    user.updated_at = new Date().toISOString();
    db_1.db.users.set(userId, user);
    res.json({
        success: true,
        message: `Upgraded to ${plan.display_name}! Granted ${plan.credit_allowance} credits.`,
        user
    });
});
/**
 * Submit Bug Report or Feature Request
 */
exports.userRouter.post('/feedback', (req, res) => {
    const { userId, type, title, description } = req.body;
    if (!userId || !type || !title || !description) {
        return res.status(400).json({ error: 'userId, type (bug|feature), title, and description are required' });
    }
    const cleanType = type === 'feature' ? 'feature' : 'bug';
    const cleanTitle = String(title).trim();
    const cleanDesc = String(description).trim();
    if (cleanTitle.length < 3 || cleanDesc.length < 5) {
        return res.status(400).json({ error: 'Title and description must be detailed enough to review.' });
    }
    const user = db_1.db.users.get(userId);
    if (!user)
        return res.status(404).json({ error: 'User not found' });
    const id = `fb-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const feedbackItem = {
        id,
        user_id: userId,
        type: cleanType,
        title: cleanTitle,
        description: cleanDesc,
        status: 'pending',
        credits_rewarded: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    db_1.db.feedbackItems.set(id, feedbackItem);
    res.status(201).json({
        success: true,
        message: 'Thank you! Your feedback has been submitted to the admin team. Once verified, you will be rewarded with credits.',
        feedback: feedbackItem
    });
});
/**
 * Get User's submitted feedbacks
 */
exports.userRouter.get('/feedback/:userId', (req, res) => {
    const { userId } = req.params;
    const items = Array.from(db_1.db.feedbackItems.values())
        .filter(f => f.user_id === userId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    res.json({ feedback: items });
});
