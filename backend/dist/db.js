"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const crypto_1 = __importDefault(require("crypto"));
// In-Memory Repository with TiDB Synchronization
class DatabaseStore {
    users = new Map();
    apiKeys = new Map(); // Clean pool: 0 pre-seeded keys
    chats = new Map();
    messages = new Map();
    redeemCodes = new Map(); // Clean codes: 0 pre-seeded codes
    userRedemptions = [];
    subscriptionPlans = new Map();
    transactions = [];
    pendingRegistrations = new Map();
    passwordResets = new Map();
    feedbackItems = new Map();
    referrals = new Map();
    constructor() {
        this.seed();
    }
    seed() {
        // Seed default subscription tiers
        const plans = [
            {
                id: 'plan-free',
                tier_name: 'free',
                display_name: 'Free Plan',
                price_cents: 0,
                billing_cycle: 'monthly',
                credit_allowance: 10,
                features: [
                    '10 Initial Welcome Credits on signup',
                    'Standard WormDonz AI Model',
                    'Pure OLED Dark Mode (#000000)',
                    'Single device access'
                ],
                is_active: true,
                updated_at: new Date().toISOString()
            },
            {
                id: 'plan-start',
                tier_name: 'start',
                display_name: 'Starter Plan',
                price_cents: 149,
                billing_cycle: 'monthly',
                credit_allowance: 150,
                features: [
                    '150 monthly credit pool',
                    'Standard WormDonz AI model',
                    'Standard latency & processing',
                    'Complete chat history sync',
                    'Single device access'
                ],
                is_active: true,
                updated_at: new Date().toISOString()
            },
            {
                id: 'plan-basic',
                tier_name: 'basic',
                display_name: 'Basic Plan',
                price_cents: 399,
                billing_cycle: 'monthly',
                credit_allowance: 600,
                features: [
                    '600 monthly credit pool',
                    'Priority multi-key routing queue',
                    'Image vision & document attachments',
                    'Fast & Vision multimodal models',
                    'Syntax-highlighted code exporter',
                    'Zero queue delay'
                ],
                is_active: true,
                updated_at: new Date().toISOString()
            },
            {
                id: 'plan-pro',
                tier_name: 'pro',
                display_name: 'Pro Unlimited Plan',
                price_cents: 899,
                billing_cycle: 'monthly',
                credit_allowance: 5000,
                features: [
                    'Unlimited compute allowance',
                    'Dedicated high-priority API allocation',
                    'Advanced reasoning (o-series / Claude 3.7)',
                    'Fast Mode + Web Search + Thinking toggles',
                    'Custom instructions & Knowledge base',
                    'Unlimited projects & pinned chats'
                ],
                is_active: true,
                updated_at: new Date().toISOString()
            }
        ];
        plans.forEach(p => this.subscriptionPlans.set(p.tier_name, p));
        // Default system user for initial setup
        const defaultUser = {
            id: 'user-001',
            email: 'dj@wormdonz.ai',
            telegram_username: 'dj_wormdonz',
            display_name: 'DJ',
            credits: 10,
            tier: 'free',
            referral_code: 'WORM-001',
            is_banned: false,
            image_used_lifetime: 0,
            image_used_today: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        this.users.set(defaultUser.id, defaultUser);
        // Primary Administrator & Owner Account
        const sheldonUser = {
            id: 'user-sheldon',
            email: 'sheldonbulan2@gmail.com',
            username: 'sheldon',
            password_hash: crypto_1.default.createHash('sha256').update('WormDonz@Admin2026' + 'wormdonz_salt_2026').digest('hex'),
            is_email_verified: true,
            display_name: 'Sheldon Bulan (Owner)',
            credits: 1000,
            tier: 'pro',
            referral_code: 'WORM-OWNER',
            is_banned: false,
            image_used_lifetime: 0,
            image_used_today: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        this.users.set(sheldonUser.id, sheldonUser);
    }
}
exports.db = new DatabaseStore();
