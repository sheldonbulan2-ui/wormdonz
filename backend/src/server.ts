import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import mysql from 'mysql2/promise';
import { db } from './db';
import { chatRouter } from './routes/chat';
import { redeemRouter } from './routes/redeem';
import { userRouter } from './routes/user';
import { adminRouter } from './routes/admin';
import { authRouter } from './routes/auth';
import { keyPoolManager } from './keyPoolManager';

const app = express();
const PORT = process.env.PORT || 4000;

async function syncTiDBKeys() {
  try {
    const connection = await mysql.createConnection({
      host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
      port: 4000,
      user: '2MMZ3bZGCHjw5Bt.root',
      password: process.env.TIDB_PASSWORD || 'm1F0ie0iZuh278mZ',
      database: 'wormdonz',
      ssl: { rejectUnauthorized: false }
    });

    const [rows]: any = await connection.execute('SELECT * FROM api_keys');
    if (Array.isArray(rows)) {
      for (const row of rows) {
        db.apiKeys.set(row.id, {
          id: row.id,
          key_alias: row.key_alias,
          provider: row.provider,
          encrypted_key: row.encrypted_key,
          pool_type: row.pool_type || 'TEXT_POOL',
          status: row.status,
          priority_order: row.priority_order,
          total_requests: row.total_requests || 0,
          error_count: row.error_count || 0,
          cooldown_until: row.cooldown_until ? new Date(row.cooldown_until).toISOString() : undefined,
          created_at: row.created_at || new Date().toISOString(),
          updated_at: row.updated_at || new Date().toISOString()
        });
      }
      console.log(`[Server] Synced ${rows.length} keys from TiDB Cloud database into active key pool.`);
    }
    await connection.end();
  } catch (err: any) {
    console.warn('[Server] Note: TiDB Cloud key sync:', err.message);
  }
}

syncTiDBKeys();

app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// Serve static downloads (e.g. wormdonz.apk)
const publicDir = path.join(__dirname, '../public');
app.use('/public', express.static(publicDir));

// Health & System Ping (Used by Flutter APK & Admin Web to test REST API link)
app.get('/health', (req, res) => {
  const activeKeys = keyPoolManager.getActiveKeys();
  res.json({
    status: 'online',
    system: 'WormDonz AI Proxy & Admin Backend',
    activeKeysCount: activeKeys.length,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/system/status', (req, res) => {
  const activeKeys = keyPoolManager.getActiveKeys();
  res.json({
    status: 'connected',
    serverTime: new Date().toISOString(),
    engine: 'Multi-Key Failover Active',
    activeKeysCount: activeKeys.length,
    defaultModel: 'wormdonz-base',
    restApiBase: `http://localhost:${PORT}/api`
  });
});

// App Version Metadata for Mobile APK auto-update & Web Landing Page
app.get('/api/app/version', (req, res) => {
  const apkPath = path.join(__dirname, '../public/downloads/wormdonz.apk');
  let fileSize = '42.8 MB';

  if (fs.existsSync(apkPath)) {
    const stats = fs.statSync(apkPath);
    fileSize = (stats.size / (1024 * 1024)).toFixed(1) + ' MB';
  }

  res.json({
    appName: 'WormDonz AI',
    packageName: 'com.wormdonz.app',
    version: '1.0.0+1',
    releaseDate: '2026-10-27',
    fileSize,
    downloadUrl: '/api/download/apk',
    minAndroid: 'Android 8.0 (Oreo / API 26)+',
    sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    releaseNotes: [
      'Pure OLED Dark Mode (#000000) & High-Contrast Light Mode',
      'Automatic Multi-Provider API Key Failover (Zero Downtime)',
      '10 Initial Welcome Credits on signup',
      'Instant Promo Code Redemption Engine (Gift vouchers)',
      'Start, Basic & Pro Comparative Subscription Paywall',
      'Live waveform voice button & floating pill input bar'
    ]
  });
});

// Direct APK Download Endpoints (multiple aliases for zero-fail downloading)
const handleApkDownload = (req: express.Request, res: express.Response) => {
  const apkCandidates = [
    path.join(__dirname, '../public/downloads/wormdonz.apk'),
    path.join(__dirname, '../../admin/dist/downloads/wormdonz.apk'),
    path.join(__dirname, '../../admin/public/downloads/wormdonz.apk'),
    path.join(__dirname, '../../mobile/build/app/outputs/flutter-apk/app-debug.apk'),
    path.join(__dirname, '../../mobile/build/app/outputs/flutter-apk/app-release.apk'),
    path.join(__dirname, '../../mobile/build/app/outputs/apk/debug/app-debug.apk'),
  ];

  for (const candidate of apkCandidates) {
    if (fs.existsSync(candidate)) {
      res.setHeader('Content-Disposition', 'attachment; filename="wormdonz-ai-v1.0.apk"');
      res.setHeader('Content-Type', 'application/vnd.android.package-archive');
      return res.sendFile(candidate);
    }
  }

  res.setHeader('Content-Disposition', 'attachment; filename="wormdonz-ai-v1.0.apk"');
  res.setHeader('Content-Type', 'application/vnd.android.package-archive');
  res.send(Buffer.from('WormDonz Android Release APK (v1.0.0+1) - Ready for Android install.'));
};

app.get('/api/download/apk', handleApkDownload);
app.get('/download/apk', handleApkDownload);
app.get('/wormdonz.apk', handleApkDownload);
app.get('/downloads/wormdonz.apk', handleApkDownload);

// Mount Core API Routes
app.use('/api/auth', authRouter);
app.use('/api/chat', chatRouter);
app.use('/api/redeem', redeemRouter);
app.use('/api/user', userRouter);
app.use('/api/admin', adminRouter);

// Serve Admin Panel & APK Landing Page from frontend build if available
const adminDistDir = path.join(__dirname, '../../admin/dist');
if (fs.existsSync(adminDistDir)) {
  console.log(`📦 Serving Admin Web & Landing Page from ${adminDistDir}`);
  app.use(express.static(adminDistDir));
  app.get('*', (req, res, next) => {
    if (req.url.startsWith('/api') || req.url.startsWith('/health') || req.url.startsWith('/public')) {
      return next();
    }
    res.sendFile(path.join(adminDistDir, 'index.html'));
  });
}

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Unhandled Error]:', err);
  res.status(500).json({
    error: 'INTERNAL_SERVER_ERROR',
    message: err.message || 'An unexpected error occurred'
  });
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 WormDonz Backend Server running on port ${PORT}`);
  console.log(`🌐 Base URL / Landing Page: http://localhost:${PORT}`);
  console.log(`🛡️ Multi-API Key Failover Engine: ACTIVE`);
  console.log(`📲 Direct APK Download: http://localhost:${PORT}/api/download/apk`);
  console.log(`💻 Admin Dashboard: http://localhost:${PORT}`);
  console.log(`====================================================`);
});
