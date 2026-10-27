import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { db, User } from '../db';
import { EmailService } from '../services/emailService';

export const authRouter = Router();

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'WormDonz@Admin2026';
const ADMIN_2FA_CODE = process.env.ADMIN_2FA_CODE || '948216';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'wormdonz_salt_2026').digest('hex');
}

/**
 * 1. User Registration: Username, Gmail/Email & Password -> Dispatches Brevo OTP
 */
authRouter.post('/register', async (req: Request, res: Response) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Username, Gmail/Email, and Password are all required.'
    });
  }

  const cleanUsername = String(username).trim();
  const cleanEmail = String(email).trim().toLowerCase();
  const cleanPass = String(password).trim();

  if (cleanUsername.length < 3) {
    return res.status(400).json({
      success: false,
      error: 'Username must be at least 3 characters long.'
    });
  }

  if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
    return res.status(400).json({
      success: false,
      error: 'Please enter a valid email address.'
    });
  }

  if (cleanPass.length < 6) {
    return res.status(400).json({
      success: false,
      error: 'Password must be at least 6 characters long.'
    });
  }

  // Check if username is already taken by existing user
  const existingByUsername = Array.from(db.users.values()).find(
    u => u.username?.toLowerCase() === cleanUsername.toLowerCase() ||
         u.telegram_username?.toLowerCase() === cleanUsername.toLowerCase()
  );
  if (existingByUsername) {
    return res.status(409).json({
      success: false,
      error: `Username "${cleanUsername}" is already taken. Please choose another.`
    });
  }

  // Check if email is already registered
  const existingByEmail = Array.from(db.users.values()).find(
    u => u.email.toLowerCase() === cleanEmail
  );
  if (existingByEmail) {
    return res.status(409).json({
      success: false,
      error: `An account with email "${cleanEmail}" already exists. Please log in instead.`
    });
  }

  // Generate 6-digit OTP code
  const otp = EmailService.generateOtp();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  // Store in pending registrations
  db.pendingRegistrations.set(cleanEmail, {
    username: cleanUsername,
    email: cleanEmail,
    password_hash: hashPassword(cleanPass),
    otp,
    expires_at: expiresAt
  });

  // Dispatch via Brevo API
  const dispatchResult = await EmailService.sendVerificationOtp(cleanEmail, cleanUsername, otp);

  return res.status(200).json({
    success: true,
    message: `Verification code sent to ${cleanEmail}. Check your inbox or spam folder.`,
    email: cleanEmail,
    username: cleanUsername,
    previewOtp: dispatchResult.deliveredVia === 'simulated_fallback' ? otp : undefined
  });
});

/**
 * 2. Verify OTP and Activate Account with 10 Free Welcome Credits
 */
authRouter.post('/verify-otp', (req: Request, res: Response) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({
      success: false,
      error: 'Email and 6-digit verification code are required.'
    });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const cleanOtp = String(otp).trim();

  const pending = db.pendingRegistrations.get(cleanEmail);
  if (!pending) {
    return res.status(400).json({
      success: false,
      error: 'No pending registration found for this email, or the code has expired. Please register again.'
    });
  }

  if (Date.now() > pending.expires_at) {
    db.pendingRegistrations.delete(cleanEmail);
    return res.status(400).json({
      success: false,
      error: 'Verification code has expired. Please request a new code.'
    });
  }

  if (pending.otp !== cleanOtp) {
    return res.status(400).json({
      success: false,
      error: 'Invalid verification code. Please check your email and try again.'
    });
  }

  // Create new active user account
  const newUser: User = {
    id: uuidv4(),
    email: pending.email,
    username: pending.username,
    display_name: pending.username,
    password_hash: pending.password_hash,
    is_email_verified: true,
    credits: 10,
    tier: 'free',
    image_used_lifetime: 0,
    image_used_today: 0,
    is_banned: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  db.users.set(newUser.id, newUser);
  db.pendingRegistrations.delete(cleanEmail);

  // Award 10 Welcome Credits transaction
  db.transactions.push({
    id: uuidv4(),
    user_id: newUser.id,
    amount: 10,
    balance_after: 10,
    reason: 'signup_grant',
    created_at: new Date().toISOString()
  });

  console.log(`[Auth] 🎉 User registered & verified successfully: ${newUser.username} <${newUser.email}>`);

  // Return user without password_hash
  const safeUser = { ...newUser };
  delete safeUser.password_hash;

  return res.status(201).json({
    success: true,
    message: 'Account successfully verified! 10 Welcome Credits have been granted.',
    user: safeUser
  });
});

/**
 * 3. Resend OTP Code
 */
authRouter.post('/resend-otp', async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, error: 'Email is required.' });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const pending = db.pendingRegistrations.get(cleanEmail);

  if (!pending) {
    return res.status(400).json({
      success: false,
      error: 'No active registration found for this email. Please register first.'
    });
  }

  const newOtp = EmailService.generateOtp();
  pending.otp = newOtp;
  pending.expires_at = Date.now() + 10 * 60 * 1000;
  db.pendingRegistrations.set(cleanEmail, pending);

  const dispatchResult = await EmailService.sendVerificationOtp(cleanEmail, pending.username, newOtp);

  return res.json({
    success: true,
    message: `A new verification code has been dispatched to ${cleanEmail}.`,
    previewOtp: dispatchResult.deliveredVia === 'simulated_fallback' ? newOtp : undefined
  });
});

/**
 * 4. User Login with Email/Username + Password
 */
authRouter.post('/login', (req: Request, res: Response) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({
      success: false,
      error: 'Email/Username and Password are required.'
    });
  }

  const cleanId = String(identifier).trim().toLowerCase();
  const cleanPass = String(password).trim();
  const passHash = hashPassword(cleanPass);

  const user = Array.from(db.users.values()).find(
    u => u.email.toLowerCase() === cleanId ||
         u.username?.toLowerCase() === cleanId ||
         u.telegram_username?.toLowerCase() === cleanId
  );

  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'No account found with those credentials. Please check your username or register.'
    });
  }

  if (user.is_banned) {
    return res.status(403).json({
      success: false,
      error: 'This account has been suspended by administration.'
    });
  }

  if (user.password_hash && user.password_hash !== passHash) {
    return res.status(401).json({
      success: false,
      error: 'Incorrect password. Please try again.'
    });
  }

  console.log(`[Auth] 🔑 User logged in: ${user.username || user.email} (${user.credits} credits)`);

  const safeUser = { ...user };
  delete safeUser.password_hash;

  return res.json({
    success: true,
    user: safeUser
  });
});

/**
 * 5. Telegram Login (Preserved for seamless Telegram authentication)
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

    if (firstName) {
      existingUser.display_name = `${firstName} ${lastName || ''}`.trim();
    }
    if (photoUrl) existingUser.avatar_url = photoUrl;
    existingUser.updated_at = new Date().toISOString();
    db.users.set(existingUser.id, existingUser);

    return res.json({
      success: true,
      isNewUser: false,
      user: existingUser
    });
  }

  const fullName = `${firstName || ''} ${lastName || ''}`.trim() || cleanUsername || `Telegram User`;
  const newUser: User = {
    id: uuidv4(),
    email: `${cleanUsername || cleanId}@telegram.wormdonz.ai`,
    username: cleanUsername,
    telegram_id: cleanId,
    telegram_username: cleanUsername,
    display_name: fullName,
    avatar_url: photoUrl,
    credits: 10,
    tier: 'free',
    is_banned: false,
    image_used_lifetime: 0,
    image_used_today: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  db.users.set(newUser.id, newUser);

  db.transactions.push({
    id: uuidv4(),
    user_id: newUser.id,
    amount: 10,
    balance_after: 10,
    reason: 'signup_grant',
    created_at: new Date().toISOString()
  });

  return res.status(201).json({
    success: true,
    isNewUser: true,
    user: newUser
  });
});

/**
 * 6. Admin Login & 2FA Verification
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

  const adminToken = `wmdz-admin-${Buffer.from(`${Date.now()}-${uuidv4()}`).toString('base64')}`;

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
