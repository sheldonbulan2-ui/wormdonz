import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { OverviewPage } from './pages/OverviewPage';
import { ApiKeyPoolPage } from './pages/ApiKeyPoolPage';
import { RedeemCodesPage } from './pages/RedeemCodesPage';
import { UsersPage } from './pages/UsersPage';
import { PlansConfiguratorPage } from './pages/PlansConfiguratorPage';
import { FeedbackPage } from './pages/FeedbackPage';
import { AdminAssistantPage } from './pages/AdminAssistantPage';
import { LandingPage } from './pages/LandingPage';
import { Admin2FAGate } from './components/Admin2FAGate';
import { adminApi } from './api';
import { OverviewMetrics, ApiKeyItem, RedeemCodeItem, UserItem, SubscriptionPlanItem, FeedbackItem } from './types';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [is2FAVerified, setIs2FAVerified] = useState(true);
  const [show2FAModal, setShow2FAModal] = useState(false);

  const [metrics, setMetrics] = useState<OverviewMetrics>({
    totalUsers: 0,
    activeKeysCount: 0,
    exhaustedKeysCount: 0,
    rateLimitedKeysCount: 0,
    disabledKeysCount: 0,
    totalKeysCount: 0,
    totalCreditsInSystem: 0,
    totalRequestsServed: 0,
    mrrUsd: '0.00',
    activePromoCodes: 0,
    totalRedemptions: 0,
  });

  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [codes, setCodes] = useState<RedeemCodeItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlanItem[]>([]);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);

  const loadAllData = async () => {
    setIsRefreshing(true);
    try {
      const [overviewRes, keysRes, codesRes, usersRes, plansRes, feedbackRes] = await Promise.all([
        adminApi.getOverview(),
        adminApi.getKeys(),
        adminApi.getCodes(),
        adminApi.getUsers(),
        adminApi.getPlans(),
        adminApi.getFeedback()
      ]);

      if (overviewRes?.metrics) setMetrics(overviewRes.metrics);
      if (keysRes?.keys) setKeys(keysRes.keys);
      if (codesRes?.codes) setCodes(codesRes.codes);
      if (usersRes?.users) setUsers(usersRes.users);
      if (plansRes?.plans) setPlans(plansRes.plans);
      if (feedbackRes?.feedback) setFeedback(feedbackRes.feedback);
    } catch (e) {
      console.error('Failed to sync admin data:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (is2FAVerified) {
      loadAllData();
    }
  }, [is2FAVerified]);

  const handleSelectTab = (tab: string) => {
    setCurrentTab(tab);
  };

  const handleLogout = () => {
    adminApi.logoutAdmin();
    sessionStorage.clear();
    localStorage.removeItem('wmdz_admin_token');
    setCurrentTab('landing');
  };

  const handle2FASuccess = () => {
    setIs2FAVerified(true);
    setShow2FAModal(false);
    setCurrentTab('overview');
    loadAllData();
  };

  const getPageTitle = () => {
    switch (currentTab) {
      case 'landing':
        return { title: 'Mobile APK Landing & Download Hub', subtitle: 'Public landing page, live mobile emulator preview, and APK binary downloads' };
      case 'assistant':
        return { title: 'Executive AI Copilot', subtitle: 'Real-time telemetry monitoring, proactive platform reminders, and autonomous management' };
      case 'overview':
        return { title: 'Executive Overview', subtitle: 'Global usage, credit consumption, and multi-key failover metrics' };
      case 'keys':
        return { title: 'API Key Failover Pool', subtitle: 'Real-time multi-provider failover rotation, status monitors, and priority ordering' };
      case 'codes':
        return { title: 'Redeem Code Engine', subtitle: 'Manage promotional vouchers, credit rewards, and single-use redemption enforcement' };
      case 'users':
        return { title: 'User & Credit Management', subtitle: 'Inspect active accounts, adjust balances, and enforce subscription tiers' };
      case 'feedback':
        return { title: 'Bug Reports & Feature Requests', subtitle: 'Review user submissions, verify issues, and award credits' };
      case 'plans':
        return { title: 'Subscription Tier Configurator', subtitle: 'Dynamically configure pricing, credits, and feature bullets across platforms' };
      default:
        return { title: 'WormDonz Control Center', subtitle: 'Platform administration' };
    }
  };

  const { title, subtitle } = getPageTitle();

  if (currentTab === 'landing') {
    return (
      <div className="relative">
        <LandingPage
          onEnterDashboard={() => {
            if (is2FAVerified) {
              setCurrentTab('overview');
            } else {
              setShow2FAModal(true);
            }
          }}
          activeKeysCount={metrics.activeKeysCount}
        />

        {/* 2FA Protected Admin Switcher */}
        <button
          onClick={() => {
            if (is2FAVerified) {
              setCurrentTab('overview');
            } else {
              setShow2FAModal(true);
            }
          }}
          className="fixed bottom-6 right-6 z-40 px-4 py-2.5 rounded-full bg-charcoal-800 hover:bg-charcoal-700 border border-charcoal-600 text-xs font-semibold text-white shadow-2xl flex items-center gap-2 transition"
        >
          <span>Admin Control Center (2FA Protected)</span>
          <span className={`w-2 h-2 rounded-full ${is2FAVerified ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'}`} />
        </button>

        {show2FAModal && (
          <Admin2FAGate
            onSuccess={handle2FASuccess}
            onCancel={() => setShow2FAModal(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-oled text-white">
      {/* Navigation Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        onLogout={handleLogout}
        activeKeysCount={metrics.activeKeysCount}
        exhaustedKeysCount={metrics.exhaustedKeysCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header
          title={title}
          subtitle={subtitle}
          onRefresh={loadAllData}
          onLogout={handleLogout}
          isRefreshing={isRefreshing}
        />

        <main className="flex-1 overflow-y-auto p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'assistant' && (
            <AdminAssistantPage metrics={metrics} feedback={feedback} keys={keys} onNavigate={handleSelectTab} />
          )}
          {currentTab === 'overview' && (
            <OverviewPage metrics={metrics} onNavigate={handleSelectTab} />
          )}
          {currentTab === 'keys' && (
            <ApiKeyPoolPage keys={keys} onRefresh={loadAllData} />
          )}
          {currentTab === 'codes' && (
            <RedeemCodesPage codes={codes} onRefresh={loadAllData} />
          )}
          {currentTab === 'users' && (
            <UsersPage users={users} onRefresh={loadAllData} />
          )}
          {currentTab === 'feedback' && (
            <FeedbackPage feedback={feedback} onRefresh={loadAllData} />
          )}
          {currentTab === 'plans' && (
            <PlansConfiguratorPage plans={plans} onRefresh={loadAllData} />
          )}
        </main>
      </div>

      {show2FAModal && (
        <Admin2FAGate
          onSuccess={handle2FASuccess}
          onCancel={() => setShow2FAModal(false)}
        />
      )}
    </div>
  );
};
