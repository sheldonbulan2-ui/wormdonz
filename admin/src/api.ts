import { OverviewMetrics, ApiKeyItem, RedeemCodeItem, UserItem, SubscriptionPlanItem } from './types';

const BASE_URL = 'http://localhost:4000/api';

export const adminApi = {
  // 1. Overview
  async getOverview(): Promise<{ metrics: OverviewMetrics }> {
    try {
      const res = await fetch(`${BASE_URL}/admin/overview`);
      if (res.ok) return await res.json();
    } catch (_) {}
    return {
      metrics: {
        totalUsers: 4,
        activeKeysCount: 3,
        exhaustedKeysCount: 1,
        rateLimitedKeysCount: 1,
        disabledKeysCount: 0,
        totalKeysCount: 5,
        totalCreditsInSystem: 5560,
        totalRequestsServed: 10907,
        mrrUsd: '49.97',
        activePromoCodes: 3,
        totalRedemptions: 174,
      }
    };
  },

  // 2. Multi-API Key Failover Pool
  async getKeys(): Promise<{ keys: ApiKeyItem[] }> {
    try {
      const res = await fetch(`${BASE_URL}/admin/keys`);
      if (res.ok) return await res.json();
    } catch (_) {}
    return {
      keys: [
        {
          id: 'key-001',
          key_alias: 'OpenAI-Cluster-Primary',
          provider: 'openai',
          encrypted_key: 'sk-proj-live-primary-key-vault-001',
          status: 'active',
          priority_order: 1,
          total_requests: 1420,
          error_count: 0,
          last_used_at: new Date(Date.now() - 300000).toISOString(),
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
          last_used_at: new Date(Date.now() - 1500000).toISOString(),
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
          last_used_at: new Date(Date.now() - 3600000).toISOString(),
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
          last_used_at: new Date(Date.now() - 720000).toISOString(),
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
          last_used_at: new Date(Date.now() - 10800000).toISOString(),
          last_error_message: 'HTTP 402 Payment Required: Quota exhausted',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]
    };
  },

  async addKey(data: { key_alias: string; provider: string; encrypted_key: string; priority_order?: number }) {
    const res = await fetch(`${BASE_URL}/admin/keys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async bulkAddKeys(rawKeys: string, provider: string) {
    const res = await fetch(`${BASE_URL}/admin/keys/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rawKeys, provider })
    });
    return res.json();
  },

  async updateKey(keyId: string, updates: Partial<ApiKeyItem> & { reset_errors?: boolean }) {
    const res = await fetch(`${BASE_URL}/admin/keys/${keyId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return res.json();
  },

  async testKey(keyId: string): Promise<{ success: boolean; latencyMs: number; message: string }> {
    const res = await fetch(`${BASE_URL}/admin/keys/${keyId}/test`, {
      method: 'POST'
    });
    return res.json();
  },

  async deleteKey(keyId: string) {
    const res = await fetch(`${BASE_URL}/admin/keys/${keyId}`, { method: 'DELETE' });
    return res.json();
  },

  // 3. Redeem Codes
  async getCodes(): Promise<{ codes: RedeemCodeItem[] }> {
    try {
      const res = await fetch(`${BASE_URL}/admin/codes`);
      if (res.ok) return await res.json();
    } catch (_) {}
    return {
      codes: [
        {
          id: 'c1',
          code: 'WORMDONZ2026',
          credit_amount: 50,
          max_uses: 1000,
          current_uses: 42,
          is_active: true,
          expires_at: '2026-12-31T23:59:59Z',
          created_at: new Date().toISOString()
        },
        {
          id: 'c2',
          code: 'WELCOME50',
          credit_amount: 50,
          max_uses: 500,
          current_uses: 118,
          is_active: true,
          expires_at: '2026-06-30T23:59:59Z',
          created_at: new Date().toISOString()
        },
        {
          id: 'c3',
          code: 'VIPLAUNCH',
          credit_amount: 100,
          max_uses: 100,
          current_uses: 14,
          is_active: true,
          expires_at: '2026-12-31T23:59:59Z',
          created_at: new Date().toISOString()
        }
      ]
    };
  },

  async createCode(data: { code: string; credit_amount: number; max_uses?: number; expires_at?: string }) {
    const res = await fetch(`${BASE_URL}/admin/codes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async generateBatchCodes(params: { count: number; credit_amount: number; max_uses?: number; prefix?: string }) {
    const res = await fetch(`${BASE_URL}/admin/codes/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    return res.json();
  },

  async toggleCodeStatus(codeId: string, is_active: boolean) {
    const res = await fetch(`${BASE_URL}/admin/codes/${codeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active })
    });
    return res.json();
  },

  async deleteCode(codeId: string) {
    const res = await fetch(`${BASE_URL}/admin/codes/${codeId}`, { method: 'DELETE' });
    return res.json();
  },

  // 4. Users
  async getUsers(search?: string): Promise<{ users: UserItem[] }> {
    const url = search ? `${BASE_URL}/admin/users?query=${encodeURIComponent(search)}` : `${BASE_URL}/admin/users`;
    try {
      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch (_) {}
    return {
      users: [
        { id: 'u1', email: 'dj@wormdonz.ai', display_name: 'DJ', credits: 10, tier: 'free', is_banned: false, created_at: new Date().toISOString() },
        { id: 'u2', email: 'alex@techcorp.io', display_name: 'Alex Rivera', credits: 140, tier: 'start', is_banned: false, created_at: new Date().toISOString() },
        { id: 'u3', email: 'sarah.c@design.co', display_name: 'Sarah Chen', credits: 520, tier: 'basic', is_banned: false, created_at: new Date().toISOString() },
        { id: 'u4', email: 'marcus@quantum.ai', display_name: 'Marcus Vance', credits: 4890, tier: 'pro', is_banned: false, created_at: new Date().toISOString() }
      ]
    };
  },

  async adjustUserCredits(userId: string, delta: number) {
    const res = await fetch(`${BASE_URL}/admin/users/${userId}/credits`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delta })
    });
    return res.json();
  },

  async updateUserTier(userId: string, tier: string) {
    const res = await fetch(`${BASE_URL}/admin/users/${userId}/tier`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tier })
    });
    return res.json();
  },

  async toggleUserBan(userId: string) {
    const res = await fetch(`${BASE_URL}/admin/users/${userId}/ban`, {
      method: 'PATCH'
    });
    return res.json();
  },

  // 5. Subscription Plans
  async getPlans(): Promise<{ plans: SubscriptionPlanItem[] }> {
    try {
      const res = await fetch(`${BASE_URL}/admin/plans`);
      if (res.ok) return await res.json();
    } catch (_) {}
    return {
      plans: [
        {
          id: 'p1',
          tier_name: 'start',
          display_name: 'Start Tier',
          price_cents: 499,
          billing_cycle: 'monthly',
          credit_allowance: 150,
          features: ['150 Credits monthly', 'Base WormDonz Model', 'Standard Speed'],
          is_active: true,
          updated_at: new Date().toISOString()
        },
        {
          id: 'p2',
          tier_name: 'basic',
          display_name: 'Basic Tier',
          price_cents: 1499,
          billing_cycle: 'monthly',
          credit_allowance: 600,
          features: ['600 Credits monthly', 'Priority queue', 'Image & file attachments', 'Fast & Vision models'],
          is_active: true,
          updated_at: new Date().toISOString()
        },
        {
          id: 'p3',
          tier_name: 'pro',
          display_name: 'Pro Tier',
          price_cents: 2999,
          billing_cycle: 'monthly',
          credit_allowance: 5000,
          features: ['Unlimited / 5,000 High-Compute credits', 'Fastest zero-queue routing', 'o3-mini & Claude 3.7 access'],
          is_active: true,
          updated_at: new Date().toISOString()
        }
      ]
    };
  },

  async updatePlan(tierName: string, updates: Partial<SubscriptionPlanItem>) {
    const res = await fetch(`${BASE_URL}/admin/plans/${tierName}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return res.json();
  }
};
