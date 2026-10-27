import { v4 as uuidv4 } from 'uuid';

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
  public feedbackItems: Map<string, FeedbackItem> = new Map();

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
    const defaultUser: User = {
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
  }
}

export const db = new DatabaseStore();
