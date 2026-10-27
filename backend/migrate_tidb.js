const mysql = require('mysql2/promise');

async function migrateTiDB() {
  console.log('🚀 Initializing WormDonz Schema on TiDB Cloud (Serverless)...');

  const connection = await mysql.createConnection({
    host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
    port: 4000,
    user: '2MMZ3bZGCHjw5Bt.root',
    password: 'm1F0ie0iZuh278mZ',
    database: 'wormdonz',
    ssl: {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: true
    }
  });

  console.log('✅ Connected to database `wormdonz` on TiDB Cloud');

  const queries = [
    // 1. Users table
    `CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      display_name VARCHAR(100) NOT NULL DEFAULT 'WormDonz Explorer',
      avatar_url TEXT DEFAULT NULL,
      credits INT NOT NULL DEFAULT 10,
      tier ENUM('free', 'start', 'basic', 'pro') NOT NULL DEFAULT 'free',
      is_banned BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_users_email (email),
      INDEX idx_users_tier (tier)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    // 2. Multi-API Key Failover Pool
    `CREATE TABLE IF NOT EXISTS api_keys (
      id VARCHAR(36) PRIMARY KEY,
      key_alias VARCHAR(100) UNIQUE NOT NULL,
      provider ENUM('openai', 'anthropic', 'gemini', 'openrouter') NOT NULL DEFAULT 'openai',
      encrypted_key TEXT NOT NULL,
      status ENUM('active', 'exhausted', 'rate_limited', 'disabled') NOT NULL DEFAULT 'active',
      priority_order INT NOT NULL DEFAULT 10,
      total_requests INT NOT NULL DEFAULT 0,
      error_count INT NOT NULL DEFAULT 0,
      last_used_at TIMESTAMP NULL DEFAULT NULL,
      last_error_message TEXT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_api_keys_status (status),
      INDEX idx_api_keys_priority (priority_order, error_count)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    // 3. Chats table
    `CREATE TABLE IF NOT EXISTS chats (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      title VARCHAR(255) NOT NULL DEFAULT 'New Conversation',
      is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
      model VARCHAR(50) NOT NULL DEFAULT 'wormdonz-base',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_chats_user (user_id),
      INDEX idx_chats_pinned (user_id, is_pinned)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    // 4. Messages table
    `CREATE TABLE IF NOT EXISTS messages (
      id VARCHAR(36) PRIMARY KEY,
      chat_id VARCHAR(36) NOT NULL,
      user_id VARCHAR(36) NOT NULL,
      role ENUM('user', 'assistant', 'system') NOT NULL,
      content TEXT NOT NULL,
      tokens_used INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_messages_chat (chat_id, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    // 5. Redeem Codes
    `CREATE TABLE IF NOT EXISTS redeem_codes (
      id VARCHAR(36) PRIMARY KEY,
      code VARCHAR(50) UNIQUE NOT NULL,
      credit_amount INT NOT NULL,
      max_uses INT NOT NULL DEFAULT 100,
      current_uses INT NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      expires_at TIMESTAMP NULL DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_redeem_codes_code (code)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    // 6. User Redemptions (1-per-user enforcement)
    `CREATE TABLE IF NOT EXISTS user_redeemed_codes (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      code_id VARCHAR(36) NOT NULL,
      credits_awarded INT NOT NULL,
      redeemed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_user_code (user_id, code_id),
      INDEX idx_user_redeemed_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    // 7. Subscription Plans
    `CREATE TABLE IF NOT EXISTS subscription_plans (
      id VARCHAR(36) PRIMARY KEY,
      tier_name ENUM('free', 'start', 'basic', 'pro') UNIQUE NOT NULL,
      display_name VARCHAR(100) NOT NULL,
      price_cents INT NOT NULL DEFAULT 0,
      billing_cycle VARCHAR(20) NOT NULL DEFAULT 'monthly',
      credit_allowance INT NOT NULL DEFAULT 10,
      features JSON NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    // 8. Credit Transactions
    `CREATE TABLE IF NOT EXISTS credit_transactions (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      amount INT NOT NULL,
      balance_after INT NOT NULL,
      reason VARCHAR(100) NOT NULL,
      reference_id VARCHAR(255) DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_transactions_user (user_id, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
  ];

  for (const q of queries) {
    await connection.query(q);
  }
  console.log('✅ All 8 WormDonz tables created successfully on TiDB Cloud!');

  // Seed Subscription Plans
  const plansSql = `
    INSERT INTO subscription_plans (id, tier_name, display_name, price_cents, billing_cycle, credit_allowance, features) VALUES
    ('plan-free', 'free', 'Free Plan', 0, 'monthly', 10, '["10 Free initial credits", "Base WormDonz Model", "Standard response speed"]'),
    ('plan-start', 'start', 'Start Tier', 499, 'monthly', 150, '["150 Credits monthly allowance", "Standard response speed", "Full chat search", "Priority support"]'),
    ('plan-basic', 'basic', 'Basic Tier', 1499, 'monthly', 600, '["600 Credits monthly allowance", "Priority routing queue", "Image & file uploads", "Fast & Vision models", "Code copy button"]'),
    ('plan-pro', 'pro', 'Pro Tier', 2999, 'monthly', 5000, '["Unlimited / 5,000 High-Compute credits", "Fastest zero-queue routing", "Advanced reasoning (o3-mini / Claude 3.7)", "Custom instructions", "Live waveform voice"]')
    ON DUPLICATE KEY UPDATE display_name=VALUES(display_name), price_cents=VALUES(price_cents), credit_allowance=VALUES(credit_allowance), features=VALUES(features);
  `;
  await connection.query(plansSql);
  console.log('✅ Subscription plans seeded');

  // Seed Failover API Keys
  const keysSql = `
    INSERT INTO api_keys (id, key_alias, provider, encrypted_key, status, priority_order, total_requests, error_count) VALUES
    ('key-001', 'OpenAI-Cluster-Primary', 'openai', 'sk-proj-primary-live-key-vault-001', 'active', 1, 1420, 0),
    ('key-002', 'OpenAI-Cluster-Backup', 'openai', 'sk-proj-backup-live-key-vault-002', 'active', 2, 485, 1),
    ('key-003', 'OpenRouter-Fallback-01', 'openrouter', 'sk-or-v1-fallback-cluster-003', 'active', 3, 192, 0),
    ('key-004', 'Anthropic-Direct-Route', 'anthropic', 'sk-ant-prod-route-004', 'rate_limited', 4, 310, 14),
    ('key-005', 'OpenAI-Legacy-Depleted', 'openai', 'sk-proj-exhausted-test-key-005', 'exhausted', 5, 8500, 120)
    ON DUPLICATE KEY UPDATE key_alias=VALUES(key_alias);
  `;
  await connection.query(keysSql);
  console.log('✅ Multi-API Key Failover Pool seeded');

  // Seed Demo Users
  const usersSql = `
    INSERT INTO users (id, email, display_name, credits, tier) VALUES
    ('user-001', 'dj@wormdonz.ai', 'DJ', 10, 'free'),
    ('user-002', 'alex@techcorp.io', 'Alex Rivera', 140, 'start'),
    ('user-003', 'sarah.c@design.co', 'Sarah Chen', 520, 'basic'),
    ('user-004', 'marcus@quantum.ai', 'Marcus Vance', 4890, 'pro')
    ON DUPLICATE KEY UPDATE display_name=VALUES(display_name);
  `;
  await connection.query(usersSql);
  console.log('✅ Demo users seeded');

  // Seed Promo Codes
  const codesSql = `
    INSERT INTO redeem_codes (id, code, credit_amount, max_uses, current_uses, is_active, expires_at) VALUES
    ('code-001', 'WORMDONZ2026', 50, 1000, 42, TRUE, '2026-12-31 23:59:59'),
    ('code-002', 'WELCOME50', 50, 500, 118, TRUE, '2026-06-30 23:59:59'),
    ('code-003', 'VIPLAUNCH', 100, 100, 14, TRUE, '2026-12-31 23:59:59'),
    ('code-004', 'EXPIREDTEST', 25, 10, 10, FALSE, '2024-01-01 00:00:00')
    ON DUPLICATE KEY UPDATE credit_amount=VALUES(credit_amount);
  `;
  await connection.query(codesSql);
  console.log('✅ Promo codes seeded');

  await connection.end();
  console.log('🎉 TiDB Cloud Migration & Seeding Complete!');
}

migrateTiDB().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
