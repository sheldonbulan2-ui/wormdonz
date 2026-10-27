import { Router, Request, Response } from 'express';
import { creditEngine } from '../creditEngine';

export const redeemRouter = Router();

/**
 * Redeem promo code for instant credit boost
 */
redeemRouter.post('/', (req: Request, res: Response) => {
  const { userId, code } = req.body;

  if (!userId || !code) {
    return res.status(400).json({ error: 'userId and code are required' });
  }

  try {
    const result = creditEngine.redeemCode(userId, code);
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: err.message || 'Failed to redeem code'
    });
  }
});
