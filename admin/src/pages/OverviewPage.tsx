import React from 'react';
import { OverviewMetrics } from '../types';
import { Users, KeyRound, DollarSign, Activity, Gift, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface OverviewPageProps {
  metrics: OverviewMetrics;
  onNavigate: (tab: string) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ metrics, onNavigate }) => {
  const cards = [
    {
      title: 'Total Registered Users',
      value: metrics.totalUsers.toLocaleString(),
      sub: '4 Active test accounts',
      icon: Users,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      action: () => onNavigate('users')
    },
    {
      title: 'Monthly Recurring Revenue',
      value: `$${metrics.mrrUsd}`,
      sub: 'Based on active tier subscriptions',
      icon: DollarSign,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      action: () => onNavigate('plans')
    },
    {
      title: 'Failover API Keys Active',
      value: `${metrics.activeKeysCount} / ${metrics.totalKeysCount}`,
      sub: `${metrics.exhaustedKeysCount} exhausted • ${metrics.rateLimitedKeysCount} rate limited`,
      icon: KeyRound,
      color: metrics.activeKeysCount > 0 ? 'text-emerald-400' : 'text-rose-400',
      bg: metrics.activeKeysCount > 0 ? 'bg-emerald-500/10' : 'bg-rose-500/10',
      border: metrics.activeKeysCount > 0 ? 'border-emerald-500/20' : 'border-rose-500/20',
      action: () => onNavigate('keys')
    },
    {
      title: 'Total Prompts Served',
      value: metrics.totalRequestsServed.toLocaleString(),
      sub: 'Through zero-downtime key rotation',
      icon: Activity,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
      action: () => onNavigate('keys')
    },
    {
      title: 'System Credits Outstanding',
      value: metrics.totalCreditsInSystem.toLocaleString(),
      sub: 'Across all active user wallets',
      icon: Activity,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      action: () => onNavigate('users')
    },
    {
      title: 'Promo Redemptions',
      value: metrics.totalRedemptions.toLocaleString(),
      sub: `${metrics.activePromoCodes} active campaign codes`,
      icon: Gift,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/20',
      action: () => onNavigate('codes')
    },
  ];

  const totalKeys = metrics.totalKeysCount || 1;
  const activePct = Math.round((metrics.activeKeysCount / totalKeys) * 100);
  const exhaustedPct = Math.round((metrics.exhaustedKeysCount / totalKeys) * 100);
  const rateLimitPct = Math.round((metrics.rateLimitedKeysCount / totalKeys) * 100);

  return (
    <div className="space-y-6">
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div
              key={i}
              onClick={c.action}
              className={`p-5 rounded-2xl bg-charcoal-800 border ${c.border} hover:border-neutral-500/50 transition cursor-pointer group`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  {c.title}
                </span>
                <div className={`p-2 rounded-xl ${c.bg} ${c.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 text-2xl font-extrabold text-white font-mono tracking-tight group-hover:text-electric-500 transition">
                {c.value}
              </div>
              <div className="mt-1 text-xs text-neutral-400">{c.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Failover Health & Architecture Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Key Health Ratio */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-charcoal-800 border border-charcoal-700/80">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Multi-API Key Pool Health Distribution
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Real-time status of upstream API endpoints & auto-rotation buffers
              </p>
            </div>
            <button
              onClick={() => onNavigate('keys')}
              className="text-xs font-semibold text-electric-500 hover:text-electric-600 transition"
            >
              Manage Pool →
            </button>
          </div>

          {/* Distribution Bar */}
          <div className="h-4 w-full bg-charcoal-900 rounded-full overflow-hidden flex border border-charcoal-700/60 p-0.5">
            <div
              style={{ width: `${activePct}%` }}
              className="bg-emerald-500 h-full rounded-l-full transition-all duration-500"
              title={`Active: ${activePct}%`}
            />
            <div
              style={{ width: `${rateLimitPct}%` }}
              className="bg-amber-500 h-full transition-all duration-500"
              title={`Rate Limited: ${rateLimitPct}%`}
            />
            <div
              style={{ width: `${exhaustedPct}%` }}
              className="bg-rose-500 h-full rounded-r-full transition-all duration-500"
              title={`Exhausted: ${exhaustedPct}%`}
            />
          </div>

          <div className="grid grid-cols-3 gap-4 mt-5 text-xs">
            <div className="p-3 rounded-xl bg-charcoal-900/60 border border-charcoal-700/40">
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Active ({metrics.activeKeysCount})
              </div>
              <div className="mt-1 text-neutral-400 text-[11px]">Serving live user queries with 0ms switchover</div>
            </div>

            <div className="p-3 rounded-xl bg-charcoal-900/60 border border-charcoal-700/40">
              <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Rate Limited ({metrics.rateLimitedKeysCount})
              </div>
              <div className="mt-1 text-neutral-400 text-[11px]">Temporarily backed off; auto-recovers after window</div>
            </div>

            <div className="p-3 rounded-xl bg-charcoal-900/60 border border-charcoal-700/40">
              <div className="flex items-center gap-1.5 text-rose-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Quota Exhausted ({metrics.exhaustedKeysCount})
              </div>
              <div className="mt-1 text-neutral-400 text-[11px]">Out of credits or revoked; skipped during dispatch</div>
            </div>
          </div>
        </div>

        {/* Quick System Architecture Log */}
        <div className="p-6 rounded-2xl bg-charcoal-800 border border-charcoal-700/80">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
            Failover Engine Architecture
          </h2>
          <div className="space-y-3 text-xs">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-white">Zero Downtime Fallback:</span>
                <p className="text-neutral-400 mt-0.5">
                  Catches upstream HTTP 429, 401, 402, and 503 errors and rotates to next prioritized key instantly.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-white">Atomic Credit Deduction:</span>
                <p className="text-neutral-400 mt-0.5">
                  1 credit deducted per prompt. Pro tier users enjoy unrestricted priority access.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-white">Single-Use Code Engine:</span>
                <p className="text-neutral-400 mt-0.5">
                  Cryptographically enforces maximum global uses and 1-per-user redemption limit.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
