import { v4 as uuidv4 } from 'uuid';

export type UserTier = 'free' | 'start' | 'basic' | 'pro';
export type ApiKeyStatus = 'active' | 'exhausted' | 'rate_limited' | 'disabled';
export type ApiProvider = 'openai' | 'anthropic' | 'gemini' | 'openrouter';
export type MessageRole = 'user' | 'assistant' | 'system';

export interface User {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  credits: number;
  tier: UserTier;
  is_banned: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiKeyRecord {
  id: string;
  key_alias: string;
  provider: ApiProvider;
  encrypted_key: string;
  status: ApiKeyStatus;
  priority_order: number;
  total_requests: number;
  error_count: number;
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

// In-Memory Production-Grade Mock Repository (Synced with database/schema.sql)
class DatabaseStore {
  public users: Map<string, User> = new Map();
  public apiKeys: Map<string, ApiKeyRecord> = new Map();
  public chats: Map<string, Chat> = new Map();
  public messages: Map<string, Message[]> = new Map();
  public redeemCodes: Map<string, RedeemCode> = new Map();
  public userRedemptions: UserRedeemedCode[] = [];
  public subscriptionPlans: Map<UserTier, SubscriptionPlan> = new Map();
  public transactions: CreditTransaction[] = [];

  constructor() {
    this.seed();
  }

  private seed() {
    // Seed default subscription plans
    const plans: SubscriptionPlan[] = [
      {
        id: uuidv4(),
        tier_name: 'free',
        display_name: 'Free Plan',
        price_cents: 0,
        billing_cycle: 'monthly',
        credit_allowance: 10,
        features: [
          '10 Initial Welcome Credits',
          'Standard WormDonz AI Model',
          'Clean OLED Dark / Light themes',
          'Single device access'
        ],
        is_active: true,
        updated_at: new Date().toISOString()
      },
      {
        id: uuidv4(),
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
        id: uuidv4(),
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
        id: uuidv4(),
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

    // Seed default API keys for failover engine demonstration
    const keys: ApiKeyRecord[] = [
      {
        id: 'key-001',
        key_alias: 'OpenAI-Cluster-Primary',
        provider: 'openai',
        encrypted_key: 'sk-proj-live-primary-key-vault-001',
        status: 'active',
        priority_order: 1,
        total_requests: 1420,
        error_count: 0,
        last_used_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'key-002',
        key_alias: 'OpenAI-Cluster-Backup',
        provider: 'openai',
        encrypted_key: 'sk-proj-live-backup-key-vault-002',
        status: 'active',
        priority_order: 2,
        total_requests: 485,
        error_count: 1,
        last_used_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'key-003',
        key_alias: 'OpenRouter-Fallback-01',
        provider: 'openrouter',
        encrypted_key: 'sk-or-v1-fallback-cluster-003',
        status: 'active',
        priority_order: 3,
        total_requests: 192,
        error_count: 0,
        last_used_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'key-004',
        key_alias: 'Anthropic-Direct-Route',
        provider: 'anthropic',
        encrypted_key: 'sk-ant-prod-route-004',
        status: 'rate_limited',
        priority_order: 4,
        total_requests: 310,
        error_count: 14,
        last_used_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
        last_error_message: 'HTTP 429 Too Many Requests: Rate limit exceeded (TPM)',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'key-005',
        key_alias: 'OpenAI-Legacy-Depleted',
        provider: 'openai',
        encrypted_key: 'sk-proj-exhausted-test-key-005',
        status: 'exhausted',
        priority_order: 5,
        total_requests: 8500,
        error_count: 120,
        last_used_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
        last_error_message: 'HTTP 402 Payment Required: Quota exhausted',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    keys.forEach(k => this.apiKeys.set(k.id, k));

    // Seed default users
    const users: User[] = [
      {
        id: 'user-001',
        email: 'dj@wormdonz.ai',
        display_name: 'DJ',
        credits: 10,
        tier: 'free',
        is_banned: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'user-002',
        email: 'alex@techcorp.io',
        display_name: 'Alex Rivera',
        credits: 140,
        tier: 'start',
        is_banned: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'user-003',
        email: 'sarah.c@design.co',
        display_name: 'Sarah Chen',
        credits: 520,
        tier: 'basic',
        is_banned: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'user-004',
        email: 'marcus@quantum.ai',
        display_name: 'Marcus Vance',
        credits: 4890,
        tier: 'pro',
        is_banned: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    users.forEach(u => this.users.set(u.id, u));

    // Seed demo promo codes
    const codes: RedeemCode[] = [
      {
        id: uuidv4(),
        code: 'WORMDONZ2026',
        credit_amount: 50,
        max_uses: 1000,
        current_uses: 42,
        is_active: true,
        expires_at: '2026-12-31T23:59:59Z',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: uuidv4(),
        code: 'WELCOME50',
        credit_amount: 50,
        max_uses: 500,
        current_uses: 118,
        is_active: true,
        expires_at: '2026-06-30T23:59:59Z',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: uuidv4(),
        code: 'VIPLAUNCH',
        credit_amount: 100,
        max_uses: 100,
        current_uses: 14,
        is_active: true,
        expires_at: '2026-12-31T23:59:59Z',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: uuidv4(),
        code: 'EXPIREDTEST',
        credit_amount: 25,
        max_uses: 10,
        current_uses: 10,
        is_active: false,
        expires_at: '2024-01-01T00:00:00Z',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    codes.forEach(c => this.redeemCodes.set(c.id, c));

    // Seed initial chat history for user-001
    const chat1: Chat = {
      id: 'chat-001',
      user_id: 'user-001',
      title: 'Neural Architecture Research',
      is_pinned: true,
      model: 'wormdonz-base',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      updated_at: new Date().toISOString()
    };
    const chat2: Chat = {
      id: 'chat-002',
      user_id: 'user-001',
      title: 'Flutter OLED Theme Optimization',
      is_pinned: true,
      model: 'wormdonz-base',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
      updated_at: new Date().toISOString()
    };
    const chat3: Chat = {
      id: 'chat-003',
      user_id: 'user-001',
      title: 'PostgreSQL Failover Strategies',
      is_pinned: false,
      model: 'wormdonz-base',
      created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      updated_at: new Date().toISOString()
    };

    [chat1, chat2, chat3].forEach(c => this.chats.set(c.id, c));

    this.messages.set('chat-001', [
      {
        id: uuidv4(),
        chat_id: 'chat-001',
        user_id: 'user-001',
        role: 'user',
        content: 'Explain sparse mixture of experts routing.',
        tokens_used: 12,
        created_at: new Date(Date.now() - 1000 * 60 * 50).toISOString()
      },
      {
        id: uuidv4(),
        chat_id: 'chat-001',
        user_id: 'user-001',
        role: 'assistant',
        content: 'In Sparse Mixture of Experts (MoE), a router network evaluates input tokens and conditionally dispatches them to a top-k subset of feed-forward expert networks. This scales parameter capacity while keeping per-token compute constant.',
        tokens_used: 48,
        created_at: new Date(Date.now() - 1000 * 60 * 49).toISOString()
      }
    ]);
  }
}

export const db = new DatabaseStore();
