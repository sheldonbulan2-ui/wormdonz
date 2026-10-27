import { Router, Request, Response } from 'express';
import { db, UserTier } from '../db';
import { creditEngine } from '../creditEngine';

export const userRouter = Router();

/**
 * Get user profile & credit balance along with vision image quota metrics
 */
userRouter.get('/profile/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  const user = db.users.get(userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const imageAllowance = creditEngine.verifyImageUploadAllowance(userId, 0);

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

/**
 * Submit Bug Report or Feature Request
 */
userRouter.post('/feedback', (req: Request, res: Response) => {
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

  const user = db.users.get(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const id = `fb-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const feedbackItem = {
    id,
    user_id: userId,
    type: cleanType as 'bug' | 'feature',
    title: cleanTitle,
    description: cleanDesc,
    status: 'pending' as const,
    credits_rewarded: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  db.feedbackItems.set(id, feedbackItem);

  res.status(201).json({
    success: true,
    message: 'Thank you! Your feedback has been submitted to the admin team. Once verified, you will be rewarded with credits.',
    feedback: feedbackItem
  });
});

/**
 * Get User's submitted feedbacks
 */
userRouter.get('/feedback/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  const items = Array.from(db.feedbackItems.values())
    .filter(f => f.user_id === userId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  res.json({ feedback: items });
});
