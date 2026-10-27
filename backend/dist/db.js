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
                display_name: 'Start Tier',
                price_cents: 499,
                billing_cycle: 'monthly',
                credit_allowance: 150,
                features: [
                    '150 Credits monthly allowance',
                    'Standard response speed',
                    'Full chat history search',
                    'Priority support'
                ],
                is_active: true,
                updated_at: new Date().toISOString()
            },
            {
                id: 'plan-basic',
                tier_name: 'basic',
                display_name: 'Basic Tier',
                price_cents: 1499,
                billing_cycle: 'monthly',
                credit_allowance: 600,
                features: [
                    '600 Credits monthly allowance',
                    'Priority routing queue',
                    'Image & document attachments',
                    'WormDonz Fast & Vision models',
                    'Code execution with copy block'
                ],
                is_active: true,
                updated_at: new Date().toISOString()
            },
            {
                id: 'plan-pro',
                tier_name: 'pro',
                display_name: 'Pro Tier',
                price_cents: 2999,
                billing_cycle: 'monthly',
                credit_allowance: 5000,
                features: [
                    'Unlimited / 5,000 High-Compute credits',
                    'Fastest zero-queue API routing',
                    'Advanced reasoning (o3-mini / Claude 3.7)',
                    'Custom instructions & Knowledge memory',
                    'Live waveform voice mode',
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
