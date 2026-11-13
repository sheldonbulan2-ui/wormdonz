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

export interface FeedbackItem {
  id: string;
  user_id: string;
  user_email?: string;
  user_name?: string;
  type: 'bug' | 'feature';
  title: string;
  description: string;
  status: 'pending' | 'verified' | 'rejected';
  credits_rewarded: number;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ApkReleaseItem {
  id: string;
  version: string;
  title: string;
  release_notes: string;
  download_url: string;
  file_size_mb: number;
  sha256_checksum?: string;
  min_android_version: string;
  is_active: boolean;
  download_count: number;
  created_at: string;
}

export interface ApkDownloadItem {
  id: string;
  release_id?: string;
  version: string;
  ip_address?: string;
  user_agent?: string;
  device_model?: string;
  downloaded_at: string;
}

export interface TelemetryLogItem {
  id: string;
  device_id?: string;
  action_type: string;
  tool_name: string;
  status: 'success' | 'failed' | 'executing';
  details?: string;
  created_at: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConfigured: boolean;
}

export interface JarvisCommandResponse {
  status: string;
  query: string;
  response: string;
  toolCall?: {
    name: string;
    arguments: Record<string, any>;
    result?: any;
  } | null;
  steps: Array<{ step: string; timestamp: string }>;
  executionTimeMs: number;
  mode: string;
  voiceInput: boolean;
}

export interface JarvisStatus {
  name: string;
  version: string;
  status: string;
  voiceActivation: string;
  wakeWord: string;
  activeKeysCount: number;
  toolsLoaded: string[];
  timestamp: string;
}

