import { Router, Request, Response } from 'express';
import { db, UserTier } from '../db';

export const userRouter = Router();

/**
 * Get user profile & credit balance
 */
userRouter.get('/profile/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  const user = db.users.get(userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({ user });
});

/**
 * Get active subscription plans for comparative paywall
 */
userRouter.get('/plans', (req: Request, res: Response) => {
  const plans = Array.from(db.subscriptionPlans.values()).filter(p => p.is_active);
  res.json({ plans });
});

/**
 * Upgrade user subscription tier
 */
userRouter.post('/upgrade', (req: Request, res: Response) => {
  const { userId, targetTier } = req.body;

  if (!userId || !targetTier) {
    return res.status(400).json({ error: 'userId and targetTier are required' });
  }

  const user = db.users.get(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const plan = db.subscriptionPlans.get(targetTier as UserTier);
  if (!plan) return res.status(400).json({ error: 'Invalid subscription tier' });

  user.tier = targetTier as UserTier;
  // Grant tier monthly allowance
  user.credits += plan.credit_allowance;
  user.updated_at = new Date().toISOString();
  db.users.set(userId, user);

  res.json({
    success: true,
    message: `Upgraded to ${plan.display_name}! Granted ${plan.credit_allowance} credits.`,
    user
  });
});
