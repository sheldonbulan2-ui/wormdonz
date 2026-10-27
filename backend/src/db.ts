import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

export type UserTier = 'free' | 'start' | 'basic' | 'pro';
export type ApiKeyStatus = 'active' | 'cooldown' | 'exhausted_daily' | 'exhausted' | 'rate_limited' | 'disabled';
export type ApiKeyPoolType = 'TEXT_POOL' | 'IMAGE_POOL';
export type ApiProvider = 'openai' | 'anthropic' | 'gemini' | 'openrouter' | 'dahl';
export type MessageRole = 'user' | 'assistant' | 'system';

export interface User {
  id: string;
  email: string;
  username?: string;
  password_hash?: string;
  is_email_verified?: boolean;
  telegram_id?: string;
  telegram_username?: string;
  display_name: string;
  avatar_url?: string;
  credits: number;
  tier: UserTier;
  referral_code: string;
  referred_by?: string;
  registration_ip?: string;
  device_id?: string;
  image_used_lifetime: number;
  image_used_today: number;
  last_image_upload_date?: string;
  is_banned: boolean;
  created_at: string;
  updated_at: string;
}

export interface PendingRegistration {
  username: string;
  email: string;
  password_hash: string;
  otp: string;
  referral_code_used?: string;
  registration_ip?: string;
  device_id?: string;
  expires_at: number;
}

export interface PasswordResetRequest {
  email: string;
  otp: string;
  expires_at: number;
}

export interface ApiKeyRecord {
  id: string;
  key_alias: string;
  provider: ApiProvider;
  pool_type: ApiKeyPoolType;
  encrypted_key: string;
  status: ApiKeyStatus;
  priority_order: number;
  total_requests: number;
  error_count: number;
  cooldown_until?: string;
  last_used_at?: string;
  last_error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface Chat {
  id: string;
  user_id: string;
  title: string;
  is_pinned: boolean;
  model: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  chat_id: string;
  user_id: string;
  role: MessageRole;
  content: string;
  images?: string[];
  tokens_used: number;
  created_at: string;
}

export interface RedeemCode {
  id: string;
  code: string;
  credit_amount: number;
  max_uses: number;
  current_uses: number;
  is_active: boolean;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface UserRedeemedCode {
  id: string;
  user_id: string;
  code_id: string;
  credits_awarded: number;
  redeemed_at: string;
}

export interface SubscriptionPlan {
  id: string;
  tier_name: UserTier;
  display_name: string;
  price_cents: number;
  billing_cycle: string;
  credit_allowance: number;
  features: string[];
  is_active: boolean;
  updated_at: string;
}

export interface CreditTransaction {
  id: string;
  user_id: string;
  amount: number;
  balance_after: number;
  reason: string;
  reference_id?: string;
  created_at: string;
}

export interface FeedbackItem {
  id: string;
  user_id: string;
  type: 'bug' | 'feature';
  title: string;
  description: string;
  status: 'pending' | 'verified' | 'rejected';
  credits_rewarded: number;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ReferralRecord {
  id: string;
  inviter_id: string;
  invited_user_id: string;
  referral_code: string;
  credits_awarded: number;
  status: 'rewarded' | 'flagged_farming' | 'pending';
  flag_reason?: string;
  ip_address?: string;
  device_id?: string;
  created_at: string;
}

// In-Memory Repository with TiDB Synchronization
class DatabaseStore {
  public users: Map<string, User> = new Map();
  public apiKeys: Map<string, ApiKeyRecord> = new Map(); // Clean pool: 0 pre-seeded keys
  public chats: Map<string, Chat> = new Map();
  public messages: Map<string, Message[]> = new Map();
  public redeemCodes: Map<string, RedeemCode> = new Map(); // Clean codes: 0 pre-seeded codes
  public userRedemptions: UserRedeemedCode[] = [];
  public subscriptionPlans: Map<UserTier, SubscriptionPlan> = new Map();
  public transactions: CreditTransaction[] = [];
  public pendingRegistrations: Map<string, PendingRegistration> = new Map();
  public passwordResets: Map<string, PasswordResetRequest> = new Map();
  public feedbackItems: Map<string, FeedbackItem> = new Map();
  public referrals: Map<string, ReferralRecord> = new Map();

  constructor() {
    this.seed();
  }

  private seed() {
    // Seed default subscription tiers
    const plans: SubscriptionPlan[] = [
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
          '15 daily vision image uploads',
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
          '25 daily vision image uploads',
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
          'Unlimited vision image uploads',
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
    const defaultUser: User = {
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
    const sheldonUser: User = {
      id: 'user-sheldon',
      email: 'sheldonbulan2@gmail.com',
      username: 'sheldon',
      password_hash: crypto.createHash('sha256').update('WormDonz@Admin2026' + 'wormdonz_salt_2026').digest('hex'),
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

export const db = new DatabaseStore();
