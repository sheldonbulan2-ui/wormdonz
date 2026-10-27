"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redeemRouter = void 0;
const express_1 = require("express");
const creditEngine_1 = require("../creditEngine");
exports.redeemRouter = (0, express_1.Router)();
/**
 * Redeem promo code for instant credit boost
 */
exports.redeemRouter.post('/', (req, res) => {
    const { userId, code } = req.body;
    if (!userId || !code) {
        return res.status(400).json({ error: 'userId and code are required' });
    }
    try {
        const result = creditEngine_1.creditEngine.redeemCode(userId, code);
        return res.json(result);
    }
    catch (err) {
        return res.status(400).json({
            success: false,
            error: err.message || 'Failed to redeem code'
        });
    }
});
