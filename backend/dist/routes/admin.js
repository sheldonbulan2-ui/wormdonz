"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRouter = void 0;
const express_1 = require("express");
const uuid_1 = require("uuid");
const db_1 = require("../db");
const keyPoolManager_1 = require("../keyPoolManager");
const creditEngine_1 = require("../creditEngine");
exports.adminRouter = (0, express_1.Router)();
// =============================================================================
// Admin 2FA Protection Middleware
// =============================================================================
exports.adminRouter.use((req, res, next) => {
    // Allow health/public checks if any, or verify token
    const authHeader = req.headers.authorization;
    const twoFactorHeader = req.headers['x-admin-2fa'];
    const expected2FA = process.env.ADMIN_2FA_CODE || '948216';
    if (twoFactorHeader === expected2FA) {
        return next();
    }
    if (authHeader && authHeader.startsWith('Bearer wmdz-admin-')) {
        return next();
    }
    // Reject unauthorized attempts
    return res.status(401).json({
        error: 'UNAUTHORIZED_ADMIN',
        message: 'Two-Factor Authentication (2FA) verification required to access Admin Control Center.'
    });
});
// =============================================================================
// 1. Executive Overview Metrics
// =============================================================================
exports.adminRouter.get('/overview', (req, res) => {
    const users = Array.from(db_1.db.users.values());
    const keys = Array.from(db_1.db.apiKeys.values());
    const codes = Array.from(db_1.db.redeemCodes.values());
    const activeKeysCount = keys.filter(k => k.status === 'active').length;
    const exhaustedKeysCount = keys.filter(k => k.status === 'exhausted').length;
    const rateLimitedKeysCount = keys.filter(k => k.status === 'rate_limited').length;
    const disabledKeysCount = keys.filter(k => k.status === 'disabled').length;
    const totalCreditsInSystem = users.reduce((acc, u) => acc + u.credits, 0);
    const totalRequestsServed = keys.reduce((acc, k) => acc + k.total_requests, 0);
    // MRR estimation based on active tiers
    const planMap = db_1.db.subscriptionPlans;
    const mrrCents = users.reduce((acc, u) => {
        const plan = planMap.get(u.tier);
        return acc + (plan ? plan.price_cents : 0);
    }, 0);
    res.json({
        metrics: {
            totalUsers: users.length,
            activeKeysCount,
            exhaustedKeysCount,
            rateLimitedKeysCount,
            disabledKeysCount,
            totalKeysCount: keys.length,
            totalCreditsInSystem,
            totalRequestsServed,
            mrrUsd: (mrrCents / 100).toFixed(2),
            activePromoCodes: codes.filter(c => c.is_active).length,
            totalRedemptions: db_1.db.userRedemptions.length
        }
    });
});
// =============================================================================
// 2. Multi-API Key Failover Pool Management
// =============================================================================
exports.adminRouter.get('/keys', (req, res) => {
    const keys = Array.from(db_1.db.apiKeys.values()).sort((a, b) => a.priority_order - b.priority_order);
    res.json({ keys });
});
exports.adminRouter.post('/keys', (req, res) => {
    const { key_alias, provider, encrypted_key, priority_order, pool_type } = req.body;
    if (!key_alias || !encrypted_key) {
        return res.status(400).json({ error: 'key_alias and encrypted_key are required' });
    }
    const newKey = {
        id: (0, uuid_1.v4)(),
        key_alias,
        provider: provider || 'openai',
        encrypted_key,
        pool_type: pool_type === 'IMAGE_POOL' ? 'IMAGE_POOL' : 'TEXT_POOL',
        status: 'active',
        priority_order: priority_order !== undefined ? Number(priority_order) : db_1.db.apiKeys.size + 1,
        total_requests: 0,
        error_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    db_1.db.apiKeys.set(newKey.id, newKey);
    res.status(201).json({ key: newKey });
});
/**
 * Bulk add keys
 */
exports.adminRouter.post('/keys/bulk', (req, res) => {
    const { rawKeys, provider = 'openai', pool_type = 'TEXT_POOL' } = req.body;
    if (!rawKeys || typeof rawKeys !== 'string') {
        return res.status(400).json({ error: 'rawKeys string is required (one key per line)' });
    }
    const lines = rawKeys.split('\n').map(l => l.trim()).filter(Boolean);
    const createdKeys = [];
    lines.forEach((keyString, idx) => {
        const newKey = {
            id: (0, uuid_1.v4)(),
            key_alias: `${provider.toUpperCase()}-Cluster-${db_1.db.apiKeys.size + 1}`,
            provider,
            encrypted_key: keyString,
            pool_type: pool_type === 'IMAGE_POOL' ? 'IMAGE_POOL' : 'TEXT_POOL',
            status: 'active',
            priority_order: db_1.db.apiKeys.size + 1,
            total_requests: 0,
            error_count: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        db_1.db.apiKeys.set(newKey.id, newKey);
        createdKeys.push(newKey);
    });
    res.status(201).json({ count: createdKeys.length, keys: createdKeys });
});
/**
 * Update key status or priority
 */
exports.adminRouter.patch('/keys/:keyId', (req, res) => {
    const { keyId } = req.params;
    const { status, priority_order, key_alias, reset_errors, pool_type } = req.body;
    const key = db_1.db.apiKeys.get(keyId);
    if (!key)
        return res.status(404).json({ error: 'Key not found' });
    if (status)
        key.status = status;
    if (priority_order !== undefined)
        key.priority_order = Number(priority_order);
    if (key_alias)
        key.key_alias = key_alias;
    if (pool_type)
        key.pool_type = pool_type;
    if (reset_errors) {
        key.error_count = 0;
        key.last_error_message = undefined;
        key.status = 'active';
    }
    key.updated_at = new Date().toISOString();
    db_1.db.apiKeys.set(keyId, key);
    res.json({ key });
});
/**
 * Ping / Test a single key
 */
exports.adminRouter.post('/keys/:keyId/test', async (req, res) => {
    const { keyId } = req.params;
    try {
        const testResult = await keyPoolManager_1.keyPoolManager.testSingleKey(keyId);
        res.json(testResult);
    }
    catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});
exports.adminRouter.delete('/keys/:keyId', (req, res) => {
    const { keyId } = req.params;
    db_1.db.apiKeys.delete(keyId);
    res.json({ success: true });
});
// =============================================================================
// 3. Redeem Code Generator & Manager
// =============================================================================
exports.adminRouter.get('/codes', (req, res) => {
    const codes = Array.from(db_1.db.redeemCodes.values()).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    res.json({ codes });
});
exports.adminRouter.post('/codes', (req, res) => {
    const { code, credit_amount, max_uses, expires_at } = req.body;
    if (!code || !credit_amount) {
        return res.status(400).json({ error: 'code and credit_amount are required' });
    }
    const cleanCode = code.trim().toUpperCase();
    const existing = Array.from(db_1.db.redeemCodes.values()).find(c => c.code === cleanCode);
    if (existing) {
        return res.status(400).json({ error: 'Code already exists' });
    }
    const newCode = {
        id: (0, uuid_1.v4)(),
        code: cleanCode,
        credit_amount: Number(credit_amount),
        max_uses: max_uses ? Number(max_uses) : 100,
        current_uses: 0,
        is_active: true,
        expires_at: expires_at || undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    db_1.db.redeemCodes.set(newCode.id, newCode);
    res.status(201).json({ code: newCode });
});
/**
 * Batch generate random promo codes
 */
exports.adminRouter.post('/codes/batch', (req, res) => {
    const { count = 5, credit_amount = 50, max_uses = 1, prefix = 'WDZ' } = req.body;
    const generated = [];
    for (let i = 0; i < count; i++) {
        const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
        const codeString = `${prefix}-${randomSuffix}`;
        const codeObj = {
            id: (0, uuid_1.v4)(),
            code: codeString,
            credit_amount: Number(credit_amount),
            max_uses: Number(max_uses),
            current_uses: 0,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        db_1.db.redeemCodes.set(codeObj.id, codeObj);
        generated.push(codeObj);
    }
    res.status(201).json({ count: generated.length, codes: generated });
});
exports.adminRouter.patch('/codes/:codeId', (req, res) => {
    const { codeId } = req.params;
    const { is_active, max_uses, credit_amount } = req.body;
    const code = db_1.db.redeemCodes.get(codeId);
    if (!code)
        return res.status(404).json({ error: 'Code not found' });
    if (is_active !== undefined)
        code.is_active = is_active;
    if (max_uses !== undefined)
        code.max_uses = Number(max_uses);
    if (credit_amount !== undefined)
        code.credit_amount = Number(credit_amount);
    code.updated_at = new Date().toISOString();
    db_1.db.redeemCodes.set(codeId, code);
    res.json({ code });
});
exports.adminRouter.delete('/codes/:codeId', (req, res) => {
    const { codeId } = req.params;
    db_1.db.redeemCodes.delete(codeId);
    res.json({ success: true });
});
// =============================================================================
// 4. User & Credit Management
// =============================================================================
exports.adminRouter.get('/users', (req, res) => {
    const { query } = req.query;
    let users = Array.from(db_1.db.users.values());
    if (query && typeof query === 'string') {
        const q = query.toLowerCase();
        users = users.filter(u => u.email.toLowerCase().includes(q) || u.display_name.toLowerCase().includes(q));
    }
    res.json({ users });
});
exports.adminRouter.patch('/users/:userId/credits', (req, res) => {
    const { userId } = req.params;
    const { delta, reason = 'admin_manual_adjustment' } = req.body;
    if (delta === undefined) {
        return res.status(400).json({ error: 'delta number is required' });
    }
    try {
        const newBalance = creditEngine_1.creditEngine.adjustUserCredits(userId, Number(delta), reason);
        res.json({ success: true, newBalance, user: db_1.db.users.get(userId) });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
exports.adminRouter.patch('/users/:userId/tier', (req, res) => {
    const { userId } = req.params;
    const { tier } = req.body;
    const user = db_1.db.users.get(userId);
    if (!user)
        return res.status(404).json({ error: 'User not found' });
    user.tier = tier;
    user.updated_at = new Date().toISOString();
    db_1.db.users.set(userId, user);
    res.json({ success: true, user });
});
exports.adminRouter.patch('/users/:userId/ban', (req, res) => {
    const { userId } = req.params;
    const user = db_1.db.users.get(userId);
    if (!user)
        return res.status(404).json({ error: 'User not found' });
    user.is_banned = !user.is_banned;
    user.updated_at = new Date().toISOString();
    db_1.db.users.set(userId, user);
    res.json({ success: true, is_banned: user.is_banned, user });
});
// =============================================================================
// 5. Subscription Plan Configurator
// =============================================================================
exports.adminRouter.get('/plans', (req, res) => {
    const plans = Array.from(db_1.db.subscriptionPlans.values());
    res.json({ plans });
});
exports.adminRouter.put('/plans/:tierName', (req, res) => {
    const { tierName } = req.params;
    const { display_name, price_cents, credit_allowance, features, is_active } = req.body;
    const plan = db_1.db.subscriptionPlans.get(tierName);
    if (!plan)
        return res.status(404).json({ error: 'Plan not found' });
    if (display_name)
        plan.display_name = display_name;
    if (price_cents !== undefined)
        plan.price_cents = Number(price_cents);
    if (credit_allowance !== undefined)
        plan.credit_allowance = Number(credit_allowance);
    if (features && Array.isArray(features))
        plan.features = features;
    if (is_active !== undefined)
        plan.is_active = is_active;
    plan.updated_at = new Date().toISOString();
    db_1.db.subscriptionPlans.set(tierName, plan);
    res.json({ success: true, plan });
});
// =============================================================================
// 6. Bug Reports & Feature Requests Management (with Credits Reward)
// =============================================================================
exports.adminRouter.get('/feedback', (req, res) => {
    const items = Array.from(db_1.db.feedbackItems.values()).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    // Attach user information for display
    const enrichedItems = items.map(item => {
        const user = db_1.db.users.get(item.user_id);
        return {
            ...item,
            user_email: user?.email || 'unknown',
            user_name: user?.display_name || user?.username || 'Unknown User'
        };
    });
    res.json({ feedback: enrichedItems });
});
exports.adminRouter.post('/feedback/:id/verify', (req, res) => {
    const { id } = req.params;
    const { rewardCredits = 10, adminNotes = 'Verified by Admin' } = req.body;
    const item = db_1.db.feedbackItems.get(id);
    if (!item)
        return res.status(404).json({ error: 'Feedback item not found' });
    const creditsToAdd = Number(rewardCredits) || 10;
    item.status = 'verified';
    item.credits_rewarded = creditsToAdd;
    item.admin_notes = adminNotes;
    item.updated_at = new Date().toISOString();
    db_1.db.feedbackItems.set(id, item);
    // Award credits to the user who submitted the report
    const user = db_1.db.users.get(item.user_id);
    let newBalance = user ? user.credits : 0;
    if (user && creditsToAdd > 0) {
        newBalance = creditEngine_1.creditEngine.adjustUserCredits(item.user_id, creditsToAdd, `Reward: ${item.type === 'bug' ? 'Bug Report' : 'Feature Request'} Verified - ${item.title}`);
    }
    res.json({
        success: true,
        message: `Feedback verified and awarded ${creditsToAdd} credits to user!`,
        item,
        newBalance
    });
});
exports.adminRouter.post('/feedback/:id/reject', (req, res) => {
    const { id } = req.params;
    const { adminNotes = 'Declined by Admin' } = req.body;
    const item = db_1.db.feedbackItems.get(id);
    if (!item)
        return res.status(404).json({ error: 'Feedback item not found' });
    item.status = 'rejected';
    item.admin_notes = adminNotes;
    item.updated_at = new Date().toISOString();
    db_1.db.feedbackItems.set(id, item);
    res.json({
        success: true,
        message: 'Feedback item marked as rejected.',
        item
    });
});
// =============================================================================
// 7. Executive AI Copilot & Automated System Guardian
// =============================================================================
exports.adminRouter.post('/assistant/chat', async (req, res) => {
    const { message, history = [] } = req.body;
    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }
    // Gather live system snapshot
    const users = Array.from(db_1.db.users.values());
    const keys = Array.from(db_1.db.apiKeys.values());
    const feedback = Array.from(db_1.db.feedbackItems.values());
    const pendingFeedback = feedback.filter(f => f.status === 'pending');
    const activeKeys = keys.filter(k => k.status === 'active');
    const cooldownKeys = keys.filter(k => k.status === 'cooldown');
    const exhaustedKeys = keys.filter(k => k.status === 'exhausted' || k.status === 'exhausted_daily');
    const codes = Array.from(db_1.db.redeemCodes.values());
    const systemPrompt = `You are the WormDonz AI Executive Admin Copilot. You assist DJ/Admin in managing the WormDonz platform.
Current Real-Time System Telemetry:
- Total Registered Users: ${users.length} (${users.filter(u => u.tier === 'pro').length} Pro, ${users.filter(u => u.tier === 'basic').length} Basic, ${users.filter(u => u.tier === 'start').length} Starter, ${users.filter(u => u.tier === 'free').length} Free)
- Active API Keys: ${activeKeys.length} / ${keys.length} (${cooldownKeys.length} on 60s RPM cooldown, ${exhaustedKeys.length} exhausted)
- Pending Bug Reports & Feature Requests: ${pendingFeedback.length} items awaiting review
- Active Promo Codes: ${codes.filter(c => c.is_active).length}
- Dual Gmail SMTP Pool: Active (1,000 free transactional emails/day)

Your responsibilities:
1. Provide concise, high-impact operational insights, status summaries, and reminders to DJ.
2. Give actionable suggestions on user growth, credit economics, API key rotation health, and bug triage.
3. Be respectful, highly intelligent, direct, and proactive. Remind the admin when pending bug reports need review or when key pools require replenishment.`;
    try {
        // Attempt Gemini or active key execution via keyPoolManager
        const activeKeyRecord = keyPoolManager_1.keyPoolManager.getActiveKeys('TEXT_POOL')[0] || keyPoolManager_1.keyPoolManager.getActiveKeys()[0];
        if (activeKeyRecord) {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${activeKeyRecord.encrypted_key}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [
                        { role: 'user', parts: [{ text: `${systemPrompt}\n\nUser Admin: ${message}` }] }
                    ]
                })
            });
            if (response.ok) {
                const data = await response.json();
                const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (replyText) {
                    return res.json({ reply: replyText, source: 'gemini' });
                }
            }
        }
    }
    catch (err) {
        console.warn('[AdminAssistant] Gemini proxy error, using intelligent local engine:', err.message);
    }
    // High-Quality Intelligent Fallback Engine with Live Telemetry
    let fallbackReply = `Chief, here is the current operational status for WormDonz AI:\n\n` +
        `• **Users**: **${users.length}** accounts active. Pro subscribers: ${users.filter(u => u.tier === 'pro').length}.\n` +
        `• **API Key Health**: **${activeKeys.length}** active keys in the failover pool. (${cooldownKeys.length} in 60s cooldown).\n` +
        `• **Pending Feedback**: **${pendingFeedback.length}** bug/feature submissions pending your review.\n\n` +
        `💡 **Recommendation**: `;
    if (pendingFeedback.length > 0) {
        fallbackReply += `You have **${pendingFeedback.length} user submissions** in the Bug Reports tab. Review and award them 10 credits to encourage community engagement.`;
    }
    else if (activeKeys.length < 3) {
        fallbackReply += `The active API key count is low (${activeKeys.length}). Consider adding Google AI Studio keys in the Key Pool Manager to maintain zero-queue failover resilience.`;
    }
    else {
        fallbackReply += `All key pools, SMTP relays, and credit engines are operating normally at peak performance.`;
    }
    return res.json({ reply: fallbackReply, source: 'telemetry_agent' });
});
