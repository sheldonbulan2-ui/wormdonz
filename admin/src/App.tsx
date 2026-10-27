import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { OverviewPage } from './pages/OverviewPage';
import { ApiKeyPoolPage } from './pages/ApiKeyPoolPage';
import { RedeemCodesPage } from './pages/RedeemCodesPage';
import { UsersPage } from './pages/UsersPage';
import { PlansConfiguratorPage } from './pages/PlansConfiguratorPage';
import { LandingPage } from './pages/LandingPage';
import { adminApi } from './api';
import { OverviewMetrics, ApiKeyItem, RedeemCodeItem, UserItem, SubscriptionPlanItem } from './types';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [metrics, setMetrics] = useState<OverviewMetrics>({
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
  });

  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [codes, setCodes] = useState<RedeemCodeItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlanItem[]>([]);

  const loadAllData = async () => {
    setIsRefreshing(true);
    try {
      const [overviewRes, keysRes, codesRes, usersRes, plansRes] = await Promise.all([
        adminApi.getOverview(),
        adminApi.getKeys(),
        adminApi.getCodes(),
        adminApi.getUsers(),
        adminApi.getPlans()
      ]);

      if (overviewRes?.metrics) setMetrics(overviewRes.metrics);
      if (keysRes?.keys) setKeys(keysRes.keys);
      if (codesRes?.codes) setCodes(codesRes.codes);
      if (usersRes?.users) setUsers(usersRes.users);
      if (plansRes?.plans) setPlans(plansRes.plans);
    } catch (e) {
      console.error('Failed to sync admin data:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const getPageTitle = () => {
    switch (currentTab) {
      case 'landing':
        return { title: 'Mobile APK Landing & Download Hub', subtitle: 'Public landing page, live mobile emulator preview, and APK binary downloads' };
      case 'overview':
        return { title: 'Executive Overview', subtitle: 'Global usage, credit consumption, and multi-key failover metrics' };
      case 'keys':
        return { title: 'API Key Failover Pool', subtitle: 'Real-time multi-provider failover rotation, status monitors, and priority ordering' };
      case 'codes':
        return { title: 'Redeem Code Engine', subtitle: 'Manage promotional vouchers, credit rewards, and single-use redemption enforcement' };
      case 'users':
        return { title: 'User & Credit Management', subtitle: 'Inspect active accounts, adjust balances, and enforce subscription tiers' };
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
          onEnterDashboard={() => setCurrentTab('overview')}
          activeKeysCount={metrics.activeKeysCount}
        />
        {/* Floating Quick Switch to Admin */}
        <button
          onClick={() => setCurrentTab('overview')}
          className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-full bg-charcoal-800 hover:bg-charcoal-700 border border-charcoal-600 text-xs font-semibold text-white shadow-2xl flex items-center gap-2 transition"
        >
          <span>Admin Control Center</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-oled text-white">
      {/* Navigation Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        activeKeysCount={metrics.activeKeysCount}
        exhaustedKeysCount={metrics.exhaustedKeysCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header
          title={title}
          subtitle={subtitle}
          onRefresh={loadAllData}
          isRefreshing={isRefreshing}
        />

        <main className="flex-1 overflow-y-auto p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'overview' && (
            <OverviewPage metrics={metrics} onNavigate={setCurrentTab} />
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
          {currentTab === 'plans' && (
            <PlansConfiguratorPage plans={plans} onRefresh={loadAllData} />
          )}
        </main>
      </div>
    </div>
  );
};
