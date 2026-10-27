"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.creditEngine = exports.CreditEngine = void 0;
const uuid_1 = require("uuid");
const db_1 = require("./db");
class CreditEngine {
    /**
     * Verifies if user has sufficient credits to initiate a prompt.
     * Pro tier users have unlimited chat privileges.
     */
    verifyCreditAllowance(userId) {
        const user = db_1.db.users.get(userId);
        if (!user) {
            throw new Error('USER_NOT_FOUND: User does not exist.');
        }
        if (user.is_banned) {
            throw new Error('USER_BANNED: Account has been suspended by administration.');
        }
        // Pro tier users have unconstrained access
        if (user.tier === 'pro') {
            return { allowed: true, remainingCredits: user.credits, user };
        }
        if (user.credits <= 0) {
            return { allowed: false, remainingCredits: 0, user };
        }
        return { allowed: true, remainingCredits: user.credits, user };
    }
    /**
     * Atomically deducts credits from a user's balance
     */
    deductCredit(userId, amount = 1, reason = 'chat_deduction', referenceId) {
        const user = db_1.db.users.get(userId);
        if (!user)
            throw new Error('User not found');
        if (user.tier !== 'pro') {
            user.credits = Math.max(0, user.credits - amount);
        }
        user.updated_at = new Date().toISOString();
        db_1.db.users.set(userId, user);
        // Audit log
        db_1.db.transactions.push({
            id: (0, uuid_1.v4)(),
            user_id: userId,
            amount: -amount,
            balance_after: user.credits,
            reason,
            reference_id: referenceId,
            created_at: new Date().toISOString()
        });
        return user.credits;
    }
    /**
     * Validates and applies a promo / redeem code
     */
    redeemCode(userId, rawCode) {
        const user = db_1.db.users.get(userId);
        if (!user)
            throw new Error('User not found');
        const cleanCode = rawCode.trim().toUpperCase();
        // 1. Search for code
        const promo = Array.from(db_1.db.redeemCodes.values()).find(c => c.code.toUpperCase() === cleanCode);
        if (!promo) {
            throw new Error('INVALID_CODE: The code entered does not exist.');
        }
        // 2. Active status
        if (!promo.is_active) {
            throw new Error('CODE_INACTIVE: This redeem code has been deactivated.');
        }
        // 3. Expiration date check
        if (promo.expires_at && new Date(promo.expires_at).getTime() < Date.now()) {
            throw new Error('CODE_EXPIRED: This promo code expired on ' + new Date(promo.expires_at).toLocaleDateString());
        }
        // 4. Global max uses check
        if (promo.current_uses >= promo.max_uses) {
            throw new Error('MAX_USES_REACHED: This code has reached its maximum global redemptions.');
        }
        // 5. User single-redemption check
        const alreadyRedeemed = db_1.db.userRedemptions.some(r => r.user_id === userId && r.code_id === promo.id);
        if (alreadyRedeemed) {
            throw new Error('ALREADY_REDEEMED: You have already redeemed this promo code once.');
        }
        // 6. Atomically apply code
        promo.current_uses += 1;
        promo.updated_at = new Date().toISOString();
        db_1.db.redeemCodes.set(promo.id, promo);
        user.credits += promo.credit_amount;
        user.updated_at = new Date().toISOString();
        db_1.db.users.set(userId, user);
        // Record user redemption record
        db_1.db.userRedemptions.push({
            id: (0, uuid_1.v4)(),
            user_id: userId,
            code_id: promo.id,
            credits_awarded: promo.credit_amount,
            redeemed_at: new Date().toISOString()
        });
        // Record credit transaction
        db_1.db.transactions.push({
            id: (0, uuid_1.v4)(),
            user_id: userId,
            amount: promo.credit_amount,
            balance_after: user.credits,
            reason: 'code_redemption',
            reference_id: promo.code,
            created_at: new Date().toISOString()
        });
        return {
            success: true,
            creditsAwarded: promo.credit_amount,
            newBalance: user.credits,
            message: `🎉 Successfully redeemed ${promo.credit_amount} credits! New balance: ${user.credits} credits.`
        };
    }
    /**
     * Admin manual credit adjustment
     */
    adjustUserCredits(userId, delta, reason) {
        const user = db_1.db.users.get(userId);
        if (!user)
            throw new Error('User not found');
        user.credits = Math.max(0, user.credits + delta);
        user.updated_at = new Date().toISOString();
        db_1.db.users.set(userId, user);
        db_1.db.transactions.push({
            id: (0, uuid_1.v4)(),
            user_id: userId,
            amount: delta,
            balance_after: user.credits,
            reason,
            created_at: new Date().toISOString()
        });
        return user.credits;
    }
}
exports.CreditEngine = CreditEngine;
exports.creditEngine = new CreditEngine();
