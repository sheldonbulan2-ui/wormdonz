# WormDonz — AI Chat Ecosystem & Multi-API Key Failover Engine

> **High-Performance Cross-Platform AI Chat Application (Flutter) & Modern Admin Control Center (React/Vite) backed by an Automatic Multi-Provider Key Rotation & Quota Failover Engine.**

---

## 🌟 Architecture Overview

```
                      ┌────────────────────────────────────────┐
                      │    WormDonz Flutter Mobile Client      │
                      │  (OLED Pure Black #000000 / Light Mode) │
                      └──────────────────┬─────────────────────┘
                                         │  (JSON / SSE Streaming)
                                         ▼
                      ┌────────────────────────────────────────┐
                      │     WormDonz Express Proxy Backend     │
                      │       - Atomic Credit Deduction        │
                      │       - Redeem Code Validation         │
                      └──────────────────┬─────────────────────┘
                                         │
             ┌───────────────────────────┴───────────────────────────┐
             │                                                       │
             ▼                                                       ▼
┌─────────────────────────┐                             ┌─────────────────────────┐
│ Multi-Key Failover Pool │                             │   PostgreSQL / SQLite   │
│  - Priority ASC Sort    │                             │  - Users & Wallets      │
│  - 429 / 402 Auto-Shift │                             │  - API Key Registry     │
│  - Zero Downtime Loop   │                             │  - Chat History         │
└────────────┬────────────┘                             │  - Redeem Codes         │
             │                                          │  - Subscription Tiers   │
    ┌────────┼────────┬────────┐                        └─────────────────────────┘
    ▼        ▼        ▼        ▼                                     ▲
 OpenAI  Anthropic  Gemini  OpenRouter                               │
                                                                     │
                      ┌────────────────────────────────────────┐     │
                      │       Modern Admin Web Dashboard       │─────┘
                      │ (Live Status Badges / Key Pool / Tiers)│
                      └────────────────────────────────────────┘
```

---

## 📦 Directory Structure

```
c:\wormdonz\
├── backend/                        # Node.js / TypeScript Proxy & Failover Service
│   ├── src/
│   │   ├── db.ts                   # In-memory / PostgreSQL database repository
│   │   ├── keyPoolManager.ts       # Core recursive multi-key failover & rotation engine
│   │   ├── creditEngine.ts         # User credit allowance & promo code engine
│   │   ├── routes/
│   │   │   ├── chat.ts             # Proxy chat endpoint with streaming & failover
│   │   │   ├── redeem.ts           # Promo code redemption endpoint
│   │   │   ├── user.ts             # Profile, subscription & tier upgrade
│   │   │   └── admin.ts            # Executive overview, key pool CRUD, user manager
│   │   └── server.ts               # Express application entrypoint
│   ├── package.json
│   └── tsconfig.json
│
├── mobile/                         # Flutter Cross-Platform Mobile Application
│   ├── lib/
│   │   ├── theme/
│   │   │   └── theme_provider.dart # OLED Pure Black (#000000) & Clean Light theme
│   │   ├── models/
│   │   │   └── models.dart         # User, Chat, Message, Subscription, Redeem models
│   │   ├── services/
│   │   │   └── api_service.dart    # Network communication & offline fallback engine
│   │   ├── widgets/
│   │   │   ├── custom_drawer.dart  # 85% width slide-out drawer (Search, History, Footer)
│   │   │   └── redeem_code_modal.dart # Modal bottom sheet with instant credit increment
│   │   ├── screens/
│   │   │   ├── home_chat_screen.dart # Staggered '=', 'WormDonz >', Credit Pill, Floating Bar
│   │   │   └── subscription_screen.dart # Comparative paywall (Start, Basic, Pro)
│   │   └── main.dart               # ThemeProvider & app bootstrap
│   └── pubspec.yaml
│
├── admin/                          # Modern React / Vite SaaS Control Center
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.tsx         # Navigation & live pool health indicator
│   │   │   └── Header.tsx          # Real-time sync & engine status
│   │   ├── pages/
│   │   │   ├── OverviewPage.tsx    # Executive KPIs, MRR, distribution bar
│   │   │   ├── ApiKeyPoolPage.tsx  # Multi-Key Failover table with test/re-enable actions
│   │   │   ├── RedeemCodesPage.tsx # Single code & batch voucher generator
│   │   │   ├── UsersPage.tsx       # User search, credit adjustment, ban toggle
│   │   │   └── PlansConfiguratorPage.tsx # Dynamic plan pricing & feature editor
│   │   ├── api.ts                  # REST API client
│   │   ├── types.ts                # TypeScript interfaces
│   │   ├── App.tsx                 # Dashboard orchestrator
│   │   └── main.tsx
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
│
└── database/
    ├── schema.sql                  # PostgreSQL production DDL schema
    └── seeds.sql                   # Default tiers, API keys, users & promo codes
```

---

## ⚡ 1. The Multi-API Key Failover Engine

### The Problem
Traditional AI backends rely on a single API key. When that key hits rate limits (HTTP 429) or runs out of credits (HTTP 402), user chat experiences crash completely.

### The WormDonz Solution (`keyPoolManager.ts`)
1. **Dynamic Pool Sorting:** The pool fetches keys with `status = 'active'`, ordered by `priority_order ASC`, `error_count ASC`, and `last_used_at ASC`.
2. **Recursive Zero-Downtime Fallback:**
   ```typescript
   try {
     const result = await this.callUpstreamProvider(currentKey, request);
     this.markKeySuccess(currentKey.id);
     return result;
   } catch (err: any) {
     // Mark key as 'rate_limited' or 'exhausted' in database
     this.markKeyFailure(currentKey.id, nextStatus, err.message);
     // Seamlessly call next key in real time
     return this.executeWithFailover(request, attemptCount + 1);
   }
   ```
3. **Admin Self-Healing Controls:**
   - Keys can be tested on demand with live latency reporting (`adminApi.testKey(keyId)`).
   - Depleted or rate-limited keys can be reset with 1 click once funds are topped up.

---

## 💳 2. Credit System & Promo Code Engine

1. **Initial Grant:** Every newly registered user automatically starts with **10 Free Credits**.
2. **Per-Prompt Deduction:** 1 credit is deducted per standard prompt execution.
3. **Depletion Handling:** When credits reach 0, prompts are blocked and a bottom sheet modal asks the user to either:
   - **Enter a Redeem Code** (e.g., `WORMDONZ2026`, `WELCOME50`, `VIPLAUNCH`).
   - **Upgrade Subscription** (`Start`, `Basic`, `Pro`).
4. **Redemption Constraints:**
   - Enforces expiration timestamps.
   - Enforces global max redemption counts (`current_uses < max_uses`).
   - Enforces strict 1-use-per-user constraint via `user_redeemed_codes`.

---

## 📱 3. Mobile UI Specifications (Flutter)

- **Pure OLED Dark Mode:** `#000000` background, `#1C1C1E` surfaces, `#FFFFFF` high contrast text, `#0A84FF` electric blue accent.
- **Top Header:** Staggered two-line hamburger icon (`=`), clickable `"WormDonz >"` AI model selector, live `⚡ 10` credit badge, invite icon, and clear chat icon.
- **Empty State:** Suggested prompt chips (Python code, OLED rules, Failover design, Brainstorming).
- **Floating Input Bar:** Attachment `+` circular button, pill-shaped text field, microphone icon, and blue circular send button.
- **85% Slide-Out Drawer:** Pill search bar, compose button, highlighted `WormDonz` pill (`#2C2C2E`), Redeem Code modal trigger, Subscription Plans modal trigger, pinned & recent chats with rename/pin/delete context actions, sticky bottom user profile footer with theme toggle.

---

## 🚀 Running the Services

### 1. Backend Service
```bash
cd backend
npm install
npm run build
npm start
# Server boots on http://localhost:4000
```

### 2. Admin Web Control Center
```bash
cd admin
npm install
npm run dev
# Dashboard opens on http://localhost:3000
```

### 3. Flutter Mobile Application
```bash
cd mobile
flutter pub get
flutter run
```
