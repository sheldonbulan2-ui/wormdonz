-- =============================================================================
-- WormDonz AI Ecosystem - Initial Seed Data
-- =============================================================================

-- Default Subscription Tiers
INSERT INTO subscription_plans (tier_name, display_name, price_cents, billing_cycle, credit_allowance, features) VALUES
('free', 'Free Plan', 0, 'monthly', 10, '[
  "10 Free initial credits",
  "Base WormDonz AI model",
  "Standard generation latency",
  "Single-device access"
]'::jsonb),
('start', 'Start Tier', 499, 'monthly', 150, '[
  "150 Credits monthly allowance",
  "Base WormDonz AI Model",
  "Standard response speed",
  "Full chat history search",
  "Priority community support"
]'::jsonb),
('basic', 'Basic Tier', 1499, 'monthly', 600, '[
  "600 Credits monthly allowance",
  "Priority routing queue",
  "Image & file attachment processing",
  "WormDonz Fast & Vision models",
  "Code execution & syntax analysis",
  "Dedicated API endpoint acceleration"
]'::jsonb),
('pro', 'Pro Tier', 2999, 'monthly', 5000, '[
  "Unlimited / 5,000 High-Compute credits",
  "Fastest zero-queue API routing",
  "Access to Advanced Reasoning (o-series/Claude 3.7)",
  "Custom Instructions & Knowledge Base",
  "Multi-turn vision & live voice waveforms",
  "Unlimited project folders & pinned chats"
]'::jsonb)
ON CONFLICT (tier_name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  price_cents = EXCLUDED.price_cents,
  credit_allowance = EXCLUDED.credit_allowance,
  features = EXCLUDED.features;

-- Sample API Key Pool Entries (Demonstrating failover pool)
INSERT INTO api_keys (key_alias, provider, encrypted_key, status, priority_order, total_requests, error_count) VALUES
('OpenAI-Cluster-Primary', 'openai', 'sk-proj-primary-live-key-vault-001', 'active', 1, 1420, 0),
('OpenAI-Cluster-Backup', 'openai', 'sk-proj-backup-live-key-vault-002', 'active', 2, 485, 2),
('OpenRouter-Fallback-01', 'openrouter', 'sk-or-v1-fallback-cluster-vault-003', 'active', 3, 192, 0),
('Anthropic-Direct-Route', 'anthropic', 'sk-ant-prod-route-vault-004', 'rate_limited', 4, 310, 14),
('OpenAI-Legacy-Depleted', 'openai', 'sk-proj-exhausted-test-key-005', 'exhausted', 5, 8500, 120)
ON CONFLICT (key_alias) DO NOTHING;

-- Initial Demo Users
INSERT INTO users (id, email, display_name, credits, tier) VALUES
('a0000000-0000-0000-0000-000000000001', 'dj@wormdonz.ai', 'DJ', 10, 'free'),
('a0000000-0000-0000-0000-000000000002', 'alex@techcorp.io', 'Alex Rivera', 140, 'start'),
('a0000000-0000-0000-0000-000000000003', 'sarah.c@design.co', 'Sarah Chen', 520, 'basic'),
('a0000000-0000-0000-0000-000000000004', 'marcus@quantum.ai', 'Marcus Vance', 4890, 'pro')
ON CONFLICT (id) DO NOTHING;

-- Initial Promo / Redeem Codes
INSERT INTO redeem_codes (code, credit_amount, max_uses, current_uses, is_active, expires_at) VALUES
('WORMDONZ2026', 50, 1000, 42, TRUE, '2026-12-31 23:59:59+00'),
('WELCOME50', 50, 500, 118, TRUE, '2026-06-30 23:59:59+00'),
('VIPLAUNCH', 100, 100, 14, TRUE, '2026-12-31 23:59:59+00'),
('EXPIREDPROMO', 25, 50, 50, FALSE, '2025-01-01 00:00:00+00')
ON CONFLICT (code) DO NOTHING;
