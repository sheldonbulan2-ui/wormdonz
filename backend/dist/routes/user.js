"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRouter = void 0;
const express_1 = require("express");
const db_1 = require("../db");
exports.userRouter = (0, express_1.Router)();
/**
 * Get user profile & credit balance
 */
exports.userRouter.get('/profile/:userId', (req, res) => {
    const { userId } = req.params;
    const user = db_1.db.users.get(userId);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
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
