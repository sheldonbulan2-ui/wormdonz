const mysql = require('mysql2/promise');

async function migrateTiDB() {
  console.log('🚀 Updating WormDonz Schema on TiDB Cloud (Telegram Auth + Clean Pool)...');

  const connection = await mysql.createConnection({
    host: process.env.TIDB_HOST || 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
    port: Number(process.env.TIDB_PORT) || 4000,
    user: process.env.TIDB_USER || '2MMZ3bZGCHjw5Bt.root',
    password: process.env.TIDB_PASSWORD || 'm1F0ie0iZuh278mZ',
    database: process.env.TIDB_DATABASE || 'wormdonz',
    ssl: {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: true
    }
  });

  console.log('✅ Connected to database `wormdonz` on TiDB Cloud');

  // Alter users table to support telegram_id and telegram_username
  try {
    await connection.query(`
      ALTER TABLE users 
      ADD COLUMN telegram_id VARCHAR(100) UNIQUE NULL AFTER email,
      ADD COLUMN telegram_username VARCHAR(100) NULL AFTER telegram_id;
    `);
    console.log('✅ Added telegram_id and telegram_username columns to users table');
  } catch (e) {
    console.log('ℹ️ Telegram columns already exist or skipped:', e.message);
  }

  // Remove all pre-seeded sample API keys as requested
  await connection.query('DELETE FROM api_keys WHERE encrypted_key LIKE "%vault%" OR encrypted_key LIKE "%test%"');
  console.log('✅ Removed all sample API keys from TiDB pool');

  // Remove all pre-seeded sample redeem codes as requested
  await connection.query('DELETE FROM redeem_codes WHERE code IN ("WORMDONZ2026", "WELCOME50", "VIPLAUNCH", "EXPIREDTEST")');
  console.log('✅ Removed all sample free redeem codes from TiDB pool');

  // Ensure Subscription plans exist
  const plansSql = `
    INSERT INTO subscription_plans (id, tier_name, display_name, price_cents, billing_cycle, credit_allowance, features) VALUES
    ('plan-free', 'free', 'Free Plan', 0, 'monthly', 10, '["10 Free initial credits", "Base WormDonz Model", "Standard response speed"]'),
    ('plan-start', 'start', 'Start Tier', 499, 'monthly', 150, '["150 Credits monthly allowance", "Standard response speed", "Full chat search", "Priority support"]'),
    ('plan-basic', 'basic', 'Basic Tier', 1499, 'monthly', 600, '["600 Credits monthly allowance", "Priority routing queue", "Image & file uploads", "Fast & Vision models", "Code copy button"]'),
    ('plan-pro', 'pro', 'Pro Tier', 2999, 'monthly', 5000, '["Unlimited / 5,000 High-Compute credits", "Fastest zero-queue routing", "Advanced reasoning (o3-mini / Claude 3.7)", "Custom instructions", "Live waveform voice"]')
    ON DUPLICATE KEY UPDATE display_name=VALUES(display_name), price_cents=VALUES(price_cents), credit_allowance=VALUES(credit_allowance), features=VALUES(features);
  `;
  await connection.query(plansSql);
  console.log('✅ Subscription plans updated');

  await connection.end();
  console.log('🎉 TiDB Cloud Migration Completed Successfully!');
}

migrateTiDB().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
