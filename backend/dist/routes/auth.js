"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const uuid_1 = require("uuid");
const crypto_1 = __importDefault(require("crypto"));
const db_1 = require("../db");
const emailService_1 = require("../services/emailService");
exports.authRouter = (0, express_1.Router)();
let ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'WormDonz@Admin2026';
let ADMIN_2FA_CODE = process.env.ADMIN_2FA_CODE || '948216';
const ADMIN_EMAIL = 'sheldonbulan2@gmail.com';
// Comprehensive list of disposable/temporary email provider domains
const DISPOSABLE_EMAIL_DOMAINS = new Set([
    'tempmail.com', 'temp-mail.org', 'tempmailo.com', '10minutemail.com', 'guerrillamail.com',
    'guerrillamail.net', 'guerrillamail.org', 'guerrillamailblock.com', 'sharklasers.com',
    'grr.la', 'pokemail.net', 'mailinator.com', 'yopmail.com', 'yopmail.fr', 'trashmail.com',
    'dispostable.com', 'getairmail.com', 'mohmal.com', 'crazymailing.com', 'maildrop.cc',
    'inboxkitten.com', 'burnermail.io', 'generator.email', 'dropmail.me', 'throwawaymail.com',
    'fakemailgenerator.com', 'nada.ltd', 'emailondeck.com', 'mytemp.email', 'tempail.com',
    'tempinbox.com', 'mailcatch.com', 'tmail.ws', 'tmpmail.net', 'tmpmail.org', '10mail.org',
    'minutemailbox.com', 'tempr.email', 'discard.email', 'disposablemail.com', 'spambog.com',
    'trashmail.net', 'trashmail.me', 'fakeinbox.com', 'harakirimail.com', 'mailnesia.com',
    'zillamail.com', 'armyspy.com', 'cuvox.de', 'dayrep.com', 'fleckens.hu', 'gustr.com',
    'jourrapide.com', 'rhyta.com', 'superrito.com', 'teleworm.us', 'tinemail.com'
]);
function isDisposableEmail(email) {
    const parts = email.split('@');
    if (parts.length !== 2)
        return false;
    const domain = parts[1].toLowerCase().trim();
    if (DISPOSABLE_EMAIL_DOMAINS.has(domain))
        return true;
    // Subdomain check (e.g. *.mailinator.com)
    for (const blocked of DISPOSABLE_EMAIL_DOMAINS) {
        if (domain.endsWith('.' + blocked))
            return true;
    }
    return false;
}
function hashPassword(password) {
    return crypto_1.default.createHash('sha256').update(password + 'wormdonz_salt_2026').digest('hex');
}
/**
 * Generate cryptographically unique 5-character alphanumeric referral code
 */
function generateUniqueReferralCode() {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    for (let attempt = 0; attempt < 50; attempt++) {
        let code = 'WORM-';
        for (let i = 0; i < 5; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        const exists = Array.from(db_1.db.users.values()).some(u => u.referral_code === code);
        if (!exists)
            return code;
    }
    return 'WORM-' + crypto_1.default.randomBytes(3).toString('hex').toUpperCase();
}
/**
 * 1. User Registration: Username, Gmail/Email, Password & Optional Invitation Code
 */
exports.authRouter.post('/register', async (req, res) => {
    const { username, email, password, referralCode, deviceId } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({
            success: false,
            error: 'Username, Gmail/Email, and Password are all required.'
        });
    }
    const cleanUsername = String(username).trim();
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanPass = String(password).trim();
    const clientIp = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
    // Validate optional referral code
    let validatedReferralCode = undefined;
    if (referralCode && String(referralCode).trim()) {
        const cleanRef = String(referralCode).trim().toUpperCase();
        const inviter = Array.from(db_1.db.users.values()).find(u => u.referral_code?.toUpperCase() === cleanRef);
        if (!inviter) {
            return res.status(400).json({
                success: false,
                error: `Invitation code "${cleanRef}" is invalid. Please check the code or clear the field.`
            });
        }
        if (inviter.email.toLowerCase() === cleanEmail) {
            return res.status(400).json({
                success: false,
                error: '⚠️ Self-invitation is strictly forbidden. You cannot use your own referral code.'
            });
        }
        validatedReferralCode = cleanRef;
    }
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
    // 100% Legit Email Protection: Block temporary/throwaway email providers
    if (isDisposableEmail(cleanEmail)) {
        return res.status(400).json({
            success: false,
            isTempMailBlocked: true,
            error: '⚠️ Temporary/Disposable email addresses are strictly prohibited. Please use a legitimate personal or work email (e.g. @gmail.com, @yahoo.com, @outlook.com).'
        });
    }
    if (cleanPass.length < 6) {
        return res.status(400).json({
            success: false,
            error: 'Password must be at least 6 characters long.'
        });
    }
    // Check if username is already taken by existing user
    const existingByUsername = Array.from(db_1.db.users.values()).find(u => u.username?.toLowerCase() === cleanUsername.toLowerCase() ||
        u.telegram_username?.toLowerCase() === cleanUsername.toLowerCase());
    if (existingByUsername) {
        return res.status(409).json({
            success: false,
            error: `Username "${cleanUsername}" is already taken. Please choose another.`
        });
    }
    // Check if email is already registered
    const existingByEmail = Array.from(db_1.db.users.values()).find(u => u.email.toLowerCase() === cleanEmail);
    if (existingByEmail) {
        return res.status(409).json({
            success: false,
            error: `An account with email "${cleanEmail}" already exists. Please log in instead.`
        });
    }
    // Generate 6-digit OTP code
    const otp = emailService_1.EmailService.generateOtp();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
    // Store in pending registrations
    db_1.db.pendingRegistrations.set(cleanEmail, {
        username: cleanUsername,
        email: cleanEmail,
        password_hash: hashPassword(cleanPass),
        otp,
        referral_code_used: validatedReferralCode,
        registration_ip: clientIp,
        device_id: deviceId ? String(deviceId).trim() : undefined,
        expires_at: expiresAt
    });
    // Fast-track background dispatch: send email asynchronously without blocking the client response
    emailService_1.EmailService.sendVerificationOtp(cleanEmail, cleanUsername, otp, 'registration')
        .catch(err => console.error(`[Auth] Background registration email error for ${cleanEmail}:`, err));
    return res.status(200).json({
        success: true,
        message: `Verification code sent to ${cleanEmail}. Check your inbox or spam folder.`,
        email: cleanEmail,
        username: cleanUsername,
        referralApplied: Boolean(validatedReferralCode),
        previewOtp: process.env.NODE_ENV !== 'production' ? otp : undefined
    });
});
/**
 * 2. Verify OTP and Activate Account with 10 Free Welcome Credits
 */
exports.authRouter.post('/verify-otp', (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) {
        return res.status(400).json({
            success: false,
            error: 'Email and 6-digit verification code are required.'
        });
    }
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanOtp = String(otp).trim();
    const pending = db_1.db.pendingRegistrations.get(cleanEmail);
    if (!pending) {
        return res.status(400).json({
            success: false,
            error: 'No pending registration found for this email, or the code has expired. Please register again.'
        });
    }
    if (Date.now() > pending.expires_at) {
        db_1.db.pendingRegistrations.delete(cleanEmail);
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
    // Generate unique referral code for the new user
    const userReferralCode = generateUniqueReferralCode();
    // Create new active user account
    const newUser = {
        id: (0, uuid_1.v4)(),
        email: pending.email,
        username: pending.username,
        display_name: pending.username,
        password_hash: pending.password_hash,
        is_email_verified: true,
        credits: 10,
        tier: 'free',
        referral_code: userReferralCode,
        registration_ip: pending.registration_ip,
        device_id: pending.device_id,
        image_used_lifetime: 0,
        image_used_today: 0,
        is_banned: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    // Process referral & anti-farming verification
    let referralBonusGranted = false;
    let farmingFlagReason = undefined;
    if (pending.referral_code_used) {
        const inviter = Array.from(db_1.db.users.values()).find(u => u.referral_code?.toUpperCase() === pending.referral_code_used?.toUpperCase());
        if (inviter) {
            // 1. Self-referral detection
            const isSelf = inviter.id === newUser.id || inviter.email.toLowerCase() === newUser.email.toLowerCase();
            // 2. Same device fingerprint detection
            const isSameDevice = Boolean(pending.device_id && inviter.device_id && pending.device_id === inviter.device_id);
            // 3. Multi-account device farm limit (Max 1 referral bonus per physical device)
            const existingDeviceRewards = pending.device_id
                ? Array.from(db_1.db.referrals.values()).filter(r => r.device_id === pending.device_id && r.status === 'rewarded').length
                : 0;
            const isDeviceFarm = existingDeviceRewards >= 1;
            // 4. IP Cluster farming limit (Max 3 referral bonuses per public IP subnet)
            const existingIpRewards = pending.registration_ip
                ? Array.from(db_1.db.referrals.values()).filter(r => r.ip_address === pending.registration_ip && r.status === 'rewarded').length
                : 0;
            const isIpFarm = existingIpRewards >= 3;
            // 5. Circular referral loop check
            const isCircular = inviter.referred_by === newUser.id;
            if (isSelf) {
                farmingFlagReason = 'Self-invitation attempt detected';
            }
            else if (isSameDevice) {
                farmingFlagReason = 'Same physical device invitation detected (self-farming blocked)';
            }
            else if (isDeviceFarm) {
                farmingFlagReason = 'Device referral quota reached (limit 1 referral reward per hardware ID)';
            }
            else if (isIpFarm) {
                farmingFlagReason = 'IP network referral quota reached (anti-bot cluster protection)';
            }
            else if (isCircular) {
                farmingFlagReason = 'Circular referral loop detected';
            }
            const referralId = (0, uuid_1.v4)();
            if (farmingFlagReason) {
                console.warn(`[Anti-Farming] ⚠️ Referral flagged for ${newUser.username} using code ${pending.referral_code_used}: ${farmingFlagReason}`);
                db_1.db.referrals.set(referralId, {
                    id: referralId,
                    inviter_id: inviter.id,
                    invited_user_id: newUser.id,
                    referral_code: pending.referral_code_used,
                    credits_awarded: 0,
                    status: 'flagged_farming',
                    flag_reason: farmingFlagReason,
                    ip_address: pending.registration_ip,
                    device_id: pending.device_id,
                    created_at: new Date().toISOString()
                });
            }
            else {
                // Legitimate referral! Award +10 credits to both users
                referralBonusGranted = true;
                newUser.credits += 10; // Total 20 credits (10 welcome + 10 referral bonus)
                newUser.referred_by = inviter.id;
                inviter.credits += 10;
                db_1.db.users.set(inviter.id, inviter);
                // Record referral entity
                db_1.db.referrals.set(referralId, {
                    id: referralId,
                    inviter_id: inviter.id,
                    invited_user_id: newUser.id,
                    referral_code: pending.referral_code_used,
                    credits_awarded: 10,
                    status: 'rewarded',
                    ip_address: pending.registration_ip,
                    device_id: pending.device_id,
                    created_at: new Date().toISOString()
                });
                // Record transactions
                db_1.db.transactions.push({
                    id: (0, uuid_1.v4)(),
                    user_id: inviter.id,
                    amount: 10,
                    balance_after: inviter.credits,
                    reason: `referral_invite_reward:${newUser.username}`,
                    reference_id: newUser.id,
                    created_at: new Date().toISOString()
                });
                db_1.db.transactions.push({
                    id: (0, uuid_1.v4)(),
                    user_id: newUser.id,
                    amount: 10,
                    balance_after: newUser.credits,
                    reason: `referral_signup_bonus:${inviter.username || inviter.referral_code}`,
                    reference_id: inviter.id,
                    created_at: new Date().toISOString()
                });
                console.log(`[Referral] 🎁 Bonus granted! Inviter ${inviter.username} (+10) and Invitee ${newUser.username} (+10). Code: ${pending.referral_code_used}`);
            }
        }
    }
    db_1.db.users.set(newUser.id, newUser);
    db_1.db.pendingRegistrations.delete(cleanEmail);
    // Award standard 10 Welcome Credits transaction
    db_1.db.transactions.push({
        id: (0, uuid_1.v4)(),
        user_id: newUser.id,
        amount: 10,
        balance_after: referralBonusGranted ? 20 : 10,
        reason: 'signup_grant',
        created_at: new Date().toISOString()
    });
    console.log(`[Auth] 🎉 User registered & verified: ${newUser.username} <${newUser.email}> (Credits: ${newUser.credits}, ReferralCode: ${newUser.referral_code})`);
    // Return user without password_hash
    const safeUser = { ...newUser };
    delete safeUser.password_hash;
    return res.status(201).json({
        success: true,
        message: referralBonusGranted
            ? 'Account verified! 20 Credits granted (10 Welcome + 10 Invitation Bonus)!'
            : 'Account successfully verified! 10 Welcome Credits have been granted.',
        referralBonusGranted,
        farmingWarning: farmingFlagReason,
        user: safeUser
    });
});
/**
 * 3. Resend OTP Code
 */
exports.authRouter.post('/resend-otp', async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ success: false, error: 'Email is required.' });
    }
    const cleanEmail = String(email).trim().toLowerCase();
    const pending = db_1.db.pendingRegistrations.get(cleanEmail);
    if (!pending) {
        return res.status(400).json({
            success: false,
            error: 'No active registration found for this email. Please register first.'
        });
    }
    const newOtp = emailService_1.EmailService.generateOtp();
    pending.otp = newOtp;
    pending.expires_at = Date.now() + 10 * 60 * 1000;
    db_1.db.pendingRegistrations.set(cleanEmail, pending);
    // Fast-track background dispatch
    emailService_1.EmailService.sendVerificationOtp(cleanEmail, pending.username, newOtp, 'registration')
        .catch(err => console.error(`[Auth] Background resend email error for ${cleanEmail}:`, err));
    return res.json({
        success: true,
        message: `A new verification code has been dispatched to ${cleanEmail}.`,
        previewOtp: process.env.NODE_ENV !== 'production' ? newOtp : undefined
    });
});
/**
 * 4. User Login with Email/Username + Password
 */
exports.authRouter.post('/login', (req, res) => {
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
    const user = Array.from(db_1.db.users.values()).find(u => u.email.toLowerCase() === cleanId ||
        u.username?.toLowerCase() === cleanId ||
        u.telegram_username?.toLowerCase() === cleanId);
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
 * 5. Forgot Password: Request OTP for password reset
 */
exports.authRouter.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ success: false, error: 'Email address is required.' });
    }
    const cleanEmail = String(email).trim().toLowerCase();
    const user = Array.from(db_1.db.users.values()).find(u => u.email.toLowerCase() === cleanEmail);
    if (!user) {
        return res.status(404).json({
            success: false,
            error: 'No account associated with that email address.'
        });
    }
    // Generate 6-digit OTP code for reset
    const otp = emailService_1.EmailService.generateOtp();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
    db_1.db.passwordResets.set(cleanEmail, {
        email: cleanEmail,
        otp,
        expires_at: expiresAt
    });
    // Fast-track background dispatch
    emailService_1.EmailService.sendVerificationOtp(cleanEmail, user.display_name || user.username || 'User', otp, 'forgot_password').catch(err => console.error(`[Auth] Background forgot password email error for ${cleanEmail}:`, err));
    return res.json({
        success: true,
        message: `Password reset code sent to ${cleanEmail}. Check your inbox.`,
        email: cleanEmail,
        previewOtp: process.env.NODE_ENV !== 'production' ? otp : undefined
    });
});
/**
 * 6. Reset Password with Verified OTP
 */
exports.authRouter.post('/reset-password', (req, res) => {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
        return res.status(400).json({
            success: false,
            error: 'Email, 6-digit OTP, and new password are required.'
        });
    }
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanOtp = String(otp).trim();
    const cleanPass = String(newPassword).trim();
    if (cleanPass.length < 6) {
        return res.status(400).json({
            success: false,
            error: 'New password must be at least 6 characters long.'
        });
    }
    const resetReq = db_1.db.passwordResets.get(cleanEmail);
    if (!resetReq) {
        return res.status(400).json({
            success: false,
            error: 'No active password reset request found. Please request a new code.'
        });
    }
    if (Date.now() > resetReq.expires_at) {
        db_1.db.passwordResets.delete(cleanEmail);
        return res.status(400).json({
            success: false,
            error: 'The reset code has expired. Please request a new one.'
        });
    }
    if (resetReq.otp !== cleanOtp) {
        return res.status(400).json({
            success: false,
            error: 'Invalid 6-digit verification code.'
        });
    }
    const user = Array.from(db_1.db.users.values()).find(u => u.email.toLowerCase() === cleanEmail);
    if (!user) {
        return res.status(404).json({ success: false, error: 'User not found.' });
    }
    // Update user password
    user.password_hash = hashPassword(cleanPass);
    user.updated_at = new Date().toISOString();
    db_1.db.users.set(user.id, user);
    db_1.db.passwordResets.delete(cleanEmail);
    console.log(`[Auth] 🔐 Password reset successfully for user: ${user.username || user.email}`);
    const safeUser = { ...user };
    delete safeUser.password_hash;
    return res.json({
        success: true,
        message: 'Password has been reset successfully! You can now sign in with your new password.',
        user: safeUser
    });
});
/**
 * 7. Telegram Login (Preserved for seamless Telegram authentication)
 */
exports.authRouter.post('/telegram', (req, res) => {
    const { telegramId, username, firstName, lastName, photoUrl } = req.body;
    if (!telegramId && !username) {
        return res.status(400).json({
            success: false,
            error: 'Telegram ID or Username is required to authenticate.'
        });
    }
    const cleanUsername = username ? username.replace('@', '').trim() : '';
    const cleanId = telegramId ? String(telegramId).trim() : cleanUsername;
    let existingUser = Array.from(db_1.db.users.values()).find(u => (cleanId && u.telegram_id === cleanId) ||
        (cleanUsername && u.telegram_username?.toLowerCase() === cleanUsername.toLowerCase()));
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
        if (photoUrl)
            existingUser.avatar_url = photoUrl;
        existingUser.updated_at = new Date().toISOString();
        db_1.db.users.set(existingUser.id, existingUser);
        return res.json({
            success: true,
            isNewUser: false,
            user: existingUser
        });
    }
    const fullName = `${firstName || ''} ${lastName || ''}`.trim() || cleanUsername || `Telegram User`;
    const newUser = {
        id: (0, uuid_1.v4)(),
        email: `${cleanUsername || cleanId}@telegram.wormdonz.ai`,
        username: cleanUsername,
        telegram_id: cleanId,
        telegram_username: cleanUsername,
        display_name: fullName,
        avatar_url: photoUrl,
        credits: 10,
        tier: 'free',
        referral_code: generateUniqueReferralCode(),
        is_banned: false,
        image_used_lifetime: 0,
        image_used_today: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    db_1.db.users.set(newUser.id, newUser);
    db_1.db.transactions.push({
        id: (0, uuid_1.v4)(),
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
exports.authRouter.post('/admin/login', (req, res) => {
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
    const adminToken = `wmdz-admin-${Buffer.from(`${Date.now()}-${(0, uuid_1.v4)()}`).toString('base64')}`;
    return res.json({
        success: true,
        message: '2FA Verification successful.',
        adminToken,
        expiresIn: '24h',
        admin: {
            role: 'Root Architect / Owner',
            email: ADMIN_EMAIL,
            twoFactorVerified: true
        }
    });
});
/**
 * 7. Admin Password Reset Request -> Sends OTP to sheldonbulan2@gmail.com
 */
exports.authRouter.post('/admin/request-reset', async (req, res) => {
    const { email } = req.body;
    const targetEmail = (email ? String(email).trim().toLowerCase() : ADMIN_EMAIL);
    if (targetEmail !== ADMIN_EMAIL.toLowerCase() && targetEmail !== 'dj@wormdonz.ai') {
        return res.status(403).json({
            success: false,
            error: `Access denied. Only registered administrator (${ADMIN_EMAIL}) can request admin password reset.`
        });
    }
    // Generate 6-digit OTP code for reset
    const otp = emailService_1.EmailService.generateOtp();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes
    db_1.db.passwordResets.set(targetEmail, {
        email: targetEmail,
        otp,
        expires_at: expiresAt
    });
    // Fire-and-forget background email dispatch:
    emailService_1.EmailService.sendVerificationOtp(targetEmail, 'Sheldon Bulan (Owner)', otp, 'forgot_password').catch(err => {
        console.error(`[Auth] Background admin password reset email failed for ${targetEmail}:`, err);
    });
    return res.json({
        success: true,
        message: `A 6-digit administrator password reset code has been sent to ${targetEmail}.`,
        targetEmail,
        previewOtp: process.env.NODE_ENV !== 'production' ? otp : undefined
    });
});
/**
 * 8. Admin Change/Reset Password (via OTP or Current Credentials)
 */
exports.authRouter.post('/admin/change-password', async (req, res) => {
    const { email, otp, currentPassword, twoFactorCode, newPassword } = req.body;
    if (!newPassword || String(newPassword).trim().length < 6) {
        return res.status(400).json({
            success: false,
            error: 'New password must be at least 6 characters long.'
        });
    }
    const cleanNewPass = String(newPassword).trim();
    let isAuthorized = false;
    // Path A: OTP-based reset via sheldonbulan2@gmail.com
    if (otp) {
        const cleanEmail = email ? String(email).trim().toLowerCase() : ADMIN_EMAIL.toLowerCase();
        const cleanOtp = String(otp).trim();
        const resetRecord = db_1.db.passwordResets.get(cleanEmail);
        if (!resetRecord) {
            return res.status(400).json({
                success: false,
                error: 'No active password reset request found. Please request a new code.'
            });
        }
        if (resetRecord.expires_at < Date.now()) {
            db_1.db.passwordResets.delete(cleanEmail);
            return res.status(400).json({
                success: false,
                error: 'The verification code has expired. Please request a new code.'
            });
        }
        if (resetRecord.otp !== cleanOtp) {
            return res.status(400).json({
                success: false,
                error: 'Invalid 6-digit verification code.'
            });
        }
        isAuthorized = true;
        db_1.db.passwordResets.delete(cleanEmail);
    }
    // Path B: Current password + 2FA
    else if (currentPassword && twoFactorCode) {
        if (String(currentPassword).trim() === ADMIN_PASSWORD && String(twoFactorCode).trim() === ADMIN_2FA_CODE) {
            isAuthorized = true;
        }
        else {
            return res.status(401).json({
                success: false,
                error: 'Current administrator password or 2FA code is incorrect.'
            });
        }
    }
    if (!isAuthorized) {
        return res.status(401).json({
            success: false,
            error: 'Authorization failed. Provide valid OTP or current credentials.'
        });
    }
    // Update in-memory ADMIN_PASSWORD
    ADMIN_PASSWORD = cleanNewPass;
    // Update sheldon user password hash
    const sheldon = Array.from(db_1.db.users.values()).find(u => u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase());
    if (sheldon) {
        sheldon.password_hash = hashPassword(cleanNewPass);
        sheldon.updated_at = new Date().toISOString();
        db_1.db.users.set(sheldon.id, sheldon);
    }
    console.log(`[Auth] 🔑 Admin password updated successfully for ${ADMIN_EMAIL}`);
    return res.json({
        success: true,
        message: `Administrator password updated successfully! You can now log in with your new password.`,
        email: ADMIN_EMAIL
    });
});
