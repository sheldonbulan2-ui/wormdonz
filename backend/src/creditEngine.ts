import { v4 as uuidv4 } from 'uuid';
import { db, User } from './db';

export function getCreditCostForModel(modelName?: string, hasImages = false): number {
  const clean = (modelName || 'evilgpt-latest').toLowerCase().replace(/\s+/g, '-');
  let cost = 1;
  if (clean.includes('coder') || clean.includes('pro')) {
    cost = 2; // EvilGPT Coder Pro
  } else if (clean.includes('big') || clean.includes('reasoning')) {
    cost = 3; // EvilGPT BIG (Deep Reasoning)
  } else {
    cost = 1; // EvilGPT Latest (Fast Flagship)
  }

  if (hasImages) {
    cost += 1; // +1 credit for Vision processing
  }
  return cost;
}

export class CreditEngine {
  /**
   * Verifies if user has sufficient credits to initiate a prompt based on model cost.
   * Pro tier users have unlimited chat privileges.
   */
  public verifyCreditAllowance(userId: string, requiredCredits = 1): {
    allowed: boolean;
    requiredCredits: number;
    remainingCredits: number;
    user: User;
  } {
    const user = db.users.get(userId);
    if (!user) {
      throw new Error('USER_NOT_FOUND: User does not exist.');
    }

    if (user.is_banned) {
      throw new Error('USER_BANNED: Account has been suspended by administration.');
    }

    // Pro tier users have unconstrained access
    if (user.tier === 'pro') {
      return { allowed: true, requiredCredits, remainingCredits: user.credits, user };
    }

    if (user.credits < requiredCredits) {
      return { allowed: false, requiredCredits, remainingCredits: user.credits, user };
    }

    return { allowed: true, requiredCredits, remainingCredits: user.credits, user };
  }

  /**
   * Atomically deducts credits from a user's balance
   */
  public deductCredit(userId: string, amount = 1, reason = 'chat_deduction', referenceId?: string): number {
    const user = db.users.get(userId);
    if (!user) throw new Error('User not found');

    if (user.tier !== 'pro') {
      user.credits = Math.max(0, user.credits - amount);
    }

    user.updated_at = new Date().toISOString();
    db.users.set(userId, user);

    // Audit log
    db.transactions.push({
      id: uuidv4(),
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
   * Philippine Time (UTC+8) Quota Day Calculation.
   * Daily quota resets every day at 4:00 PM Philippine Time (Midnight Pacific Time).
   */
  public getPhilippineQuotaDay(): string {
    const now = new Date();
    // UTC+8 offset in ms
    const phTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    const phHour = phTime.getUTCHours();
    
    // If before 4:00 PM (16:00), it belongs to previous quota day
    if (phHour < 16) {
      phTime.setUTCDate(phTime.getUTCDate() - 1);
    }
    return phTime.toISOString().split('T')[0];
  }

  /**
   * Returns exact Date of the next 4:00 PM Philippine Time (UTC+8)
   */
  public getNext4PmPhilippineTime(): Date {
    const now = new Date();
    const phTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    const next4Pm = new Date(phTime);
    
    if (phTime.getUTCHours() >= 16) {
      next4Pm.setUTCDate(next4Pm.getUTCDate() + 1);
    }
    next4Pm.setUTCHours(16, 0, 0, 0);

    // Convert back from PH local time to UTC
    return new Date(next4Pm.getTime() - 8 * 60 * 60 * 1000);
  }

  /**
   * Verifies if user has sufficient image upload allowance based on tier.
   * Free Tier: 3 Image Uploads LIFETIME
   * Starter Plan: 10 Image Uploads per day (resets 4:00 PM PH Time)
   * Basic Plan: 20 Image Uploads per day (resets 4:00 PM PH Time)
   * Pro Plan: 50 Image Uploads per day (resets 4:00 PM PH Time)
   */
  public verifyImageUploadAllowance(userId: string, imageCount = 1): {
    allowed: boolean;
    reason?: string;
    tier: string;
    image_used_lifetime: number;
    image_used_today: number;
    remaining: number;
    maxAllowed: number;
  } {
    const user = db.users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const currentQuotaDay = this.getPhilippineQuotaDay();
    if (user.last_image_upload_date !== currentQuotaDay) {
      user.image_used_today = 0;
      user.last_image_upload_date = currentQuotaDay;
      db.users.set(userId, user);
    }

    user.image_used_lifetime = user.image_used_lifetime || 0;
    user.image_used_today = user.image_used_today || 0;

    // 1. Free Tier (Lifetime strictly 3 uploads)
    if (user.tier === 'free') {
      const remainingLifetime = Math.max(0, 3 - user.image_used_lifetime);
      if (user.image_used_lifetime + imageCount > 3) {
        return {
          allowed: false,
          reason: 'FREE_IMAGE_LIFETIME_EXHAUSTED',
          tier: 'free',
          image_used_lifetime: user.image_used_lifetime,
          image_used_today: user.image_used_today,
          remaining: 0,
          maxAllowed: 3
        };
      }
      return {
        allowed: true,
        tier: 'free',
        image_used_lifetime: user.image_used_lifetime,
        image_used_today: user.image_used_today,
        remaining: remainingLifetime,
        maxAllowed: 3
      };
    }

    // 2. Paid Tiers Daily Limits
    let dailyLimit = 10;
    if (user.tier === 'start') dailyLimit = 10;
    else if (user.tier === 'basic') dailyLimit = 20;
    else if (user.tier === 'pro') dailyLimit = 50;

    const remainingToday = Math.max(0, dailyLimit - user.image_used_today);
    if (user.image_used_today + imageCount > dailyLimit) {
      return {
        allowed: false,
        reason: 'DAILY_IMAGE_QUOTA_EXHAUSTED',
        tier: user.tier,
        image_used_lifetime: user.image_used_lifetime,
        image_used_today: user.image_used_today,
        remaining: 0,
        maxAllowed: dailyLimit
      };
    }

    return {
      allowed: true,
      tier: user.tier,
      image_used_lifetime: user.image_used_lifetime,
      image_used_today: user.image_used_today,
      remaining: remainingToday,
      maxAllowed: dailyLimit
    };
  }

  /**
   * Records image upload usage atomically
   */
  public recordImageUpload(userId: string, imageCount = 1) {
    const user = db.users.get(userId);
    if (!user) return;

    const currentQuotaDay = this.getPhilippineQuotaDay();
    if (user.last_image_upload_date !== currentQuotaDay) {
      user.image_used_today = 0;
      user.last_image_upload_date = currentQuotaDay;
    }

    user.image_used_lifetime = (user.image_used_lifetime || 0) + imageCount;
    user.image_used_today = (user.image_used_today || 0) + imageCount;
    user.updated_at = new Date().toISOString();
    db.users.set(userId, user);
  }

  /**
   * Validates and applies a promo / redeem code
   */
  public redeemCode(userId: string, rawCode: string): { success: boolean; creditsAwarded: number; newBalance: number; message: string } {
    const user = db.users.get(userId);
    if (!user) throw new Error('User not found');

    const cleanCode = rawCode.trim().toUpperCase();

    // 1. Search for code
    const promo = Array.from(db.redeemCodes.values()).find(
      c => c.code.toUpperCase() === cleanCode
    );

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
    const alreadyRedeemed = db.userRedemptions.some(
      r => r.user_id === userId && r.code_id === promo.id
    );

    if (alreadyRedeemed) {
      throw new Error('ALREADY_REDEEMED: You have already redeemed this promo code once.');
    }

    // 6. Atomically apply code
    promo.current_uses += 1;
    promo.updated_at = new Date().toISOString();
    db.redeemCodes.set(promo.id, promo);

    user.credits += promo.credit_amount;
    user.updated_at = new Date().toISOString();
    db.users.set(userId, user);

    // Record user redemption record
    db.userRedemptions.push({
      id: uuidv4(),
      user_id: userId,
      code_id: promo.id,
      credits_awarded: promo.credit_amount,
      redeemed_at: new Date().toISOString()
    });

    // Record credit transaction
    db.transactions.push({
      id: uuidv4(),
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
  public adjustUserCredits(userId: string, delta: number, reason: string): number {
    const user = db.users.get(userId);
    if (!user) throw new Error('User not found');

    user.credits = Math.max(0, user.credits + delta);
    user.updated_at = new Date().toISOString();
    db.users.set(userId, user);

    db.transactions.push({
      id: uuidv4(),
      user_id: userId,
      amount: delta,
      balance_after: user.credits,
      reason,
      created_at: new Date().toISOString()
    });

    return user.credits;
  }
}

export const creditEngine = new CreditEngine();
