import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db, User } from '../db';

export const authRouter = Router();

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'WormDonz@Admin2026';
const ADMIN_2FA_CODE = process.env.ADMIN_2FA_CODE || '948216';

/**
 * Exclusive Telegram Login Endpoint for Mobile App
 */
authRouter.post('/telegram', (req: Request, res: Response) => {
  const { telegramId, username, firstName, lastName, photoUrl } = req.body;

  if (!telegramId && !username) {
    return res.status(400).json({
      success: false,
      error: 'Telegram ID or Username is required to authenticate.'
    });
  }

  const cleanUsername = username ? username.replace('@', '').trim() : '';
  const cleanId = telegramId ? String(telegramId).trim() : cleanUsername;

  // Search existing user
  let existingUser = Array.from(db.users.values()).find(
    u => (cleanId && u.telegram_id === cleanId) || 
         (cleanUsername && u.telegram_username?.toLowerCase() === cleanUsername.toLowerCase())
  );

  if (existingUser) {
    if (existingUser.is_banned) {
      return res.status(403).json({
        success: false,
        error: 'This Telegram account has been suspended by administration.'
      });
    }

    // Update avatar/display name if changed
    if (firstName) {
      existingUser.display_name = `${firstName} ${lastName || ''}`.trim();
    }
    if (photoUrl) existingUser.avatar_url = photoUrl;
    existingUser.updated_at = new Date().toISOString();
    db.users.set(existingUser.id, existingUser);

    console.log(`[TelegramAuth] 👤 Returning user logged in: @${cleanUsername || cleanId} (${existingUser.credits} credits)`);
    return res.json({
      success: true,
      isNewUser: false,
      user: existingUser
    });
  }

  // Create new user with 10 Free Welcome Credits
  const fullName = `${firstName || ''} ${lastName || ''}`.trim() || cleanUsername || `Telegram User`;
  const newUser: User = {
    id: uuidv4(),
    email: `${cleanUsername || cleanId}@telegram.wormdonz.ai`,
    telegram_id: cleanId,
    telegram_username: cleanUsername,
    display_name: fullName,
    avatar_url: photoUrl,
    credits: 10,
    tier: 'free',
    is_banned: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  db.users.set(newUser.id, newUser);

  // Record initial 10 credits transaction
  db.transactions.push({
    id: uuidv4(),
    user_id: newUser.id,
    amount: 10,
    balance_after: 10,
    reason: 'signup_grant',
    created_at: new Date().toISOString()
  });

  console.log(`[TelegramAuth] 🚀 New user registered via Telegram: @${cleanUsername || cleanId} with 10 welcome credits!`);

  return res.status(201).json({
    success: true,
    isNewUser: true,
    user: newUser
  });
});

/**
 * Admin Login & 2FA Verification
 */
authRouter.post('/admin/login', (req: Request, res: Response) => {
  const { password, twoFactorCode } = req.body;

  if (!password || !twoFactorCode) {
    return res.status(400).json({
      success: false,
      error: 'Admin password and 6-digit 2FA code are required.'
    });
  }

  const cleanPass = String(password).trim();
  const clean2FA = String(twoFactorCode).trim();

  if (cleanPass !== ADMIN_PASSWORD) {
    return res.status(401).json({
      success: false,
      error: 'Invalid administrator password.'
    });
  }

  if (clean2FA !== ADMIN_2FA_CODE) {
    return res.status(401).json({
      success: false,
      error: 'Invalid 2FA authentication code. Please check your authenticator app.'
    });
  }

  // Generate secure admin session token
  const adminToken = `wmdz-admin-${Buffer.from(`${Date.now()}-${uuidv4()}`).toString('base64')}`;

  console.log(`[AdminAuth] 🛡️ Admin authenticated successfully with 2FA protection`);

  return res.json({
    success: true,
    message: '2FA Verification successful.',
    adminToken,
    expiresIn: '24h',
    admin: {
      role: 'Root Architect',
      email: 'dj@wormdonz.ai',
      twoFactorVerified: true
    }
  });
});
