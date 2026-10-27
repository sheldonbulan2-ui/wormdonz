-- =============================================================================
-- WormDonz AI Ecosystem - Complete Database Schema (PostgreSQL / Supabase)
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Subscription Tiers Enum
CREATE TYPE user_tier AS ENUM ('free', 'start', 'basic', 'pro');
CREATE TYPE api_key_status AS ENUM ('active', 'exhausted', 'rate_limited', 'disabled');
CREATE TYPE api_provider AS ENUM ('openai', 'anthropic', 'gemini', 'openrouter');
CREATE TYPE message_role AS ENUM ('user', 'assistant', 'system');

-- 2. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL DEFAULT 'WormDonz Explorer',
    avatar_url TEXT DEFAULT NULL,
    credits INTEGER NOT NULL DEFAULT 10 CHECK (credits >= 0),
    tier user_tier NOT NULL DEFAULT 'free',
    is_banned BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_tier ON users(tier);

-- 3. Multi-API Key Failover Pool Table
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key_alias VARCHAR(100) NOT NULL UNIQUE,
    provider api_provider NOT NULL DEFAULT 'openai',
    encrypted_key TEXT NOT NULL,
    status api_key_status NOT NULL DEFAULT 'active',
    priority_order INTEGER NOT NULL DEFAULT 10,
    total_requests INTEGER NOT NULL DEFAULT 0,
    error_count INTEGER NOT NULL DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    last_error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_api_keys_status ON api_keys(status);
CREATE INDEX idx_api_keys_priority ON api_keys(priority_order ASC, error_count ASC, last_used_at ASC);

-- 4. Chats (Conversations) Table
CREATE TABLE IF NOT EXISTS chats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL DEFAULT 'New Conversation',
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    model VARCHAR(50) NOT NULL DEFAULT 'wormdonz-base',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chats_user ON chats(user_id);
CREATE INDEX idx_chats_pinned ON chats(user_id, is_pinned);

-- 5. Messages Table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role message_role NOT NULL,
    content TEXT NOT NULL,
    tokens_used INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_messages_chat ON messages(chat_id, created_at ASC);

-- 6. Redeem Codes Table
CREATE TABLE IF NOT EXISTS redeem_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    credit_amount INTEGER NOT NULL CHECK (credit_amount > 0),
    max_uses INTEGER NOT NULL DEFAULT 100,
    current_uses INTEGER NOT NULL DEFAULT 0 CHECK (current_uses <= max_uses),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_redeem_codes_code ON redeem_codes(code);

-- 7. User Redeem History (Enforces single-use per user per code)
CREATE TABLE IF NOT EXISTS user_redeemed_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code_id UUID NOT NULL REFERENCES redeem_codes(id) ON DELETE CASCADE,
    credits_awarded INTEGER NOT NULL,
    redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_code_redemption UNIQUE (user_id, code_id)
);

CREATE INDEX idx_user_redeemed_user ON user_redeemed_codes(user_id);

-- 8. Subscription Plans Configurator Table
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tier_name user_tier UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    price_cents INTEGER NOT NULL DEFAULT 0,
    billing_cycle VARCHAR(20) NOT NULL DEFAULT 'monthly',
    credit_allowance INTEGER NOT NULL DEFAULT 10,
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Credit Transactions Ledger (Auditable balance changes)
CREATE TABLE IF NOT EXISTS credit_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL, -- Negative for deduction, positive for grant/redeem
    balance_after INTEGER NOT NULL,
    reason VARCHAR(100) NOT NULL, -- 'signup_grant', 'chat_deduction', 'code_redemption', 'subscription_grant', 'admin_adjustment'
    reference_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transactions_user ON credit_transactions(user_id, created_at DESC);

-- =============================================================================
-- Triggers for updated_at timestamps
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_modtime BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_api_keys_modtime BEFORE UPDATE ON api_keys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chats_modtime BEFORE UPDATE ON chats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_redeem_codes_modtime BEFORE UPDATE ON redeem_codes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscription_plans_modtime BEFORE UPDATE ON subscription_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
