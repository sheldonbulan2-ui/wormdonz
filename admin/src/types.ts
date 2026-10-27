export type ApiKeyStatus = 'active' | 'cooldown' | 'exhausted_daily' | 'exhausted' | 'rate_limited' | 'disabled';
export type ApiKeyPoolType = 'TEXT_POOL' | 'IMAGE_POOL';
export type ApiProvider = 'openai' | 'anthropic' | 'gemini' | 'openrouter' | 'dahl';
export type UserTier = 'free' | 'start' | 'basic' | 'pro';

export interface OverviewMetrics {
  totalUsers: number;
  activeKeysCount: number;
  exhaustedKeysCount: number;
  rateLimitedKeysCount: number;
  disabledKeysCount: number;
  totalKeysCount: number;
  totalCreditsInSystem: number;
  totalRequestsServed: number;
  mrrUsd: string;
  activePromoCodes: number;
  totalRedemptions: number;
}

export interface ApiKeyItem {
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

export interface RedeemCodeItem {
  id: string;
  code: string;
  credit_amount: number;
  max_uses: number;
  current_uses: number;
  is_active: boolean;
  expires_at?: string;
  created_at: string;
}

export interface UserItem {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  credits: number;
  tier: UserTier;
  is_banned: boolean;
  created_at: string;
}

export interface SubscriptionPlanItem {
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
