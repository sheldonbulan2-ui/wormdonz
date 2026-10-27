import React from 'react';
import { OverviewMetrics } from '../types';
import { 
  Users, 
  KeyRound, 
  Activity, 
  Gift, 
  CheckCircle2, 
  Zap, 
  Mail, 
  Smartphone, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  Server,
  Layers,
  MessageSquareCode,
  Flame,
  Radio
} from 'lucide-react';

interface OverviewPageProps {
  metrics: OverviewMetrics;
  onNavigate: (tab: string) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ metrics, onNavigate }) => {
  const totalKeys = metrics.totalKeysCount || 1;
  const activePct = Math.round((metrics.activeKeysCount / totalKeys) * 100);
  const exhaustedPct = Math.round((metrics.exhaustedKeysCount / totalKeys) * 100);
  const rateLimitPct = Math.round((metrics.rateLimitedKeysCount / totalKeys) * 100);

  const kpis = [
    {
      title: 'Total Active Users',
      value: metrics.totalUsers.toLocaleString(),
      sub: 'Accounts registered across web & mobile',
      badge: '+100% Verified',
      icon: Users,
      gradient: 'from-blue-600/20 via-blue-500/10 to-transparent',
      borderColor: 'border-blue-500/30',
      iconColor: 'text-blue-400',
      action: () => onNavigate('users')
    },
    {
      title: 'Dual-Gmail SMTP Pool',
      value: '1,000 / day',
      sub: 'sheldonbulan2@gmail.com + bulansheldon26@gmail.com',
      badge: 'Active Relay',
      icon: Mail,
      gradient: 'from-emerald-600/20 via-emerald-500/10 to-transparent',
      borderColor: 'border-emerald-500/30',
      iconColor: 'text-emerald-400',
      action: () => onNavigate('users')
    },
    {
      title: 'Failover API Keys',
      value: `${metrics.activeKeysCount} / ${metrics.totalKeysCount || 12}`,
      sub: `${metrics.exhaustedKeysCount} exhausted • ${metrics.rateLimitedKeysCount} in 60s cooldown`,
      badge: 'Zero-Downtime',
      icon: KeyRound,
      gradient: 'from-electric-600/20 via-electric-500/10 to-transparent',
      borderColor: 'border-electric-500/30',
      iconColor: 'text-electric-400',
      action: () => onNavigate('keys')
    },
    {
      title: 'Prompts Handled',
      value: metrics.totalRequestsServed.toLocaleString(),
      sub: 'Live upstream token generation & vision',
      badge: 'High Speed',
      icon: Activity,
      gradient: 'from-violet-600/20 via-violet-500/10 to-transparent',
      borderColor: 'border-violet-500/30',
      iconColor: 'text-violet-400',
      action: () => onNavigate('keys')
    },
    {
      title: 'Total Wallet Credits',
      value: metrics.totalCreditsInSystem.toLocaleString(),
      sub: 'Circulating balance across all accounts',
      badge: '1 credit / prompt',
      icon: Flame,
      gradient: 'from-amber-600/20 via-amber-500/10 to-transparent',
      borderColor: 'border-amber-500/30',
      iconColor: 'text-amber-400',
      action: () => onNavigate('users')
    },
    {
      title: 'Vouchers & Campaigns',
      value: metrics.totalRedemptions.toLocaleString(),
      sub: `${metrics.activePromoCodes} promo codes ready to redeem`,
      badge: 'Anti-Abuse On',
      icon: Gift,
      gradient: 'from-cyan-600/20 via-cyan-500/10 to-transparent',
      borderColor: 'border-cyan-500/30',
      iconColor: 'text-cyan-400',
      action: () => onNavigate('codes')
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner: Master Cluster Status & Copilot Shortcut */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-charcoal-800 via-charcoal-850 to-charcoal-900 border border-charcoal-700 p-6 sm:p-8 shadow-2xl">
        {/* Glow orb */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-electric-500/10 blur-[90px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                SYSTEM ONLINE
              </span>
              <span className="px-3 py-1 rounded-full bg-electric-500/15 border border-electric-500/30 text-electric-400 text-xs font-mono font-semibold">
                MOBILE APK v1.1.0 READY
              </span>
              <span className="px-3 py-1 rounded-full bg-charcoal-700/80 border border-charcoal-600 text-neutral-300 text-xs font-mono">
                SSE KEEPALIVE HEARTBEAT ACTIVE
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              WormDonz Control Center & AI Engine
            </h1>
            <p className="text-sm text-neutral-400 max-w-2xl leading-relaxed">
              Managing real-time failover across Google Gemini 2.5 Flash, Dahl GLM-5.3 & MiniMax inference, 
              Dual-Gmail pooled OTP relays, and autonomous community bug verification.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigate('assistant')}
              className="flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-gradient-to-r from-electric-600 to-electric-500 hover:from-electric-500 hover:to-electric-400 text-white font-bold text-sm shadow-xl shadow-electric-500/25 transition duration-150 transform hover:-translate-y-0.5"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>Launch Live AI Copilot</span>
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            </button>

            <button
              onClick={() => onNavigate('feedback')}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-charcoal-700 hover:bg-charcoal-600 border border-charcoal-600 text-neutral-200 font-semibold text-sm transition"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Review Bug Reports</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div
              key={i}
              onClick={kpi.action}
              className={`relative overflow-hidden p-6 rounded-3xl bg-charcoal-800/80 border ${kpi.borderColor} hover:border-neutral-500/60 shadow-xl transition-all duration-200 cursor-pointer group hover:-translate-y-1`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${kpi.gradient} opacity-50 group-hover:opacity-80 transition`} />
              
              <div className="relative z-10 flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-400 tracking-wider uppercase">
                  {kpi.title}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-charcoal-900/90 text-neutral-300 border border-charcoal-700">
                  {kpi.badge}
                </span>
              </div>

              <div className="relative z-10 mt-4 flex items-baseline justify-between">
                <div className="text-3xl font-extrabold text-white font-mono tracking-tight group-hover:text-electric-400 transition">
                  {kpi.value}
                </div>
                <div className={`p-2.5 rounded-2xl bg-charcoal-900/80 border border-charcoal-700/80 ${kpi.iconColor}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>

              <div className="relative z-10 mt-2 text-xs text-neutral-400 leading-relaxed">
                {kpi.sub}
              </div>
            </div>
          );
        })}
      </div>

      {/* Deep Telemetry Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Failover Topology & Engine Distribution */}
        <div className="lg:col-span-8 p-7 rounded-3xl bg-charcoal-800/90 border border-charcoal-700 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-electric-400" />
                Failover Key Pool Topology & Health Distribution
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                Real-time routing matrix across Dahl GLM, Google Gemini 2.5/2.0 Flash, and OpenRouter
              </p>
            </div>
            <button
              onClick={() => onNavigate('keys')}
              className="text-xs font-semibold text-electric-400 hover:text-electric-300 flex items-center gap-1 transition"
            >
              <span>Manage Keys</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Distribution Progress Bar */}
          <div className="space-y-2">
            <div className="h-4 w-full bg-charcoal-900 rounded-full overflow-hidden flex border border-charcoal-700 p-0.5">
              <div
                style={{ width: `${activePct}%` }}
                className="bg-emerald-500 h-full rounded-l-full transition-all duration-500 shadow-lg shadow-emerald-500/30"
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

            <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 pt-1">
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Active ({metrics.activeKeysCount})
              </span>
              <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                60s Cooldown ({metrics.rateLimitedKeysCount})
              </span>
              <span className="flex items-center gap-1.5 text-rose-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Exhausted ({metrics.exhaustedKeysCount})
              </span>
            </div>
          </div>

          {/* Subsystems Status Matrix */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-charcoal-900/90 border border-charcoal-700/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-neutral-300">
                <span className="flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-electric-400" />
                  Primary Reasoning
                </span>
                <span className="text-[10px] font-mono text-emerald-400">ACTIVE</span>
              </div>
              <p className="text-xs text-neutral-400">
                Dahl <code className="text-neutral-300 font-mono">GLM-5.3-Flash</code> & <code className="text-neutral-300 font-mono">MiniMax-M2.7</code>. High-speed reasoning with zero token lag.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-charcoal-900/90 border border-charcoal-700/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-neutral-300">
                <span className="flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-emerald-400" />
                  Vision Multimodal
                </span>
                <span className="text-[10px] font-mono text-emerald-400">ACTIVE</span>
              </div>
              <p className="text-xs text-neutral-400">
                Google <code className="text-neutral-300 font-mono">Gemini 2.5 Flash</code>. Dedicated image pool handles diagrams, text OCR, and vision tensors.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-charcoal-900/90 border border-charcoal-700/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-neutral-300">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-blue-400" />
                  Dual-Gmail SMTP
                </span>
                <span className="text-[10px] font-mono text-emerald-400">100% RELAY</span>
              </div>
              <p className="text-xs text-neutral-400">
                Pooled round-robin OTP dispatcher delivering high-speed OTP emails with 60-second client timers.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Mobile APK v1.1.0 & Community Feedback Widget */}
        <div className="lg:col-span-4 space-y-6">
          {/* Mobile App Health Card */}
          <div className="p-6 rounded-3xl bg-charcoal-800/90 border border-charcoal-700 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span>Mobile Client v1.1.0</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                STABLE
              </span>
            </div>

            <div className="space-y-2 text-xs text-neutral-300">
              <div className="flex items-center justify-between py-1 border-b border-charcoal-700/60">
                <span className="text-neutral-400">APK Size</span>
                <span className="font-mono text-white font-semibold">52.6 MB</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-charcoal-700/60">
                <span className="text-neutral-400">SSE Timeout Fix</span>
                <span className="text-emerald-400 font-mono font-semibold">Zero-Timeout (Heartbeat)</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-charcoal-700/60">
                <span className="text-neutral-400">Theme</span>
                <span className="text-white font-mono">OLED (#000000) & Light</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-neutral-400">Admin Account</span>
                <span className="text-electric-400 font-mono text-[11px]">sheldonbulan2@gmail.com</span>
              </div>
            </div>

            <a
              href="/api/download/apk"
              download="wormdonz-ai-v1.1.0.apk"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-charcoal-700 hover:bg-charcoal-600 border border-charcoal-600 text-xs font-semibold text-white transition"
            >
              <span>Download Release v1.1.0 APK</span>
            </a>
          </div>

          {/* Quick Actions Card */}
          <div className="p-6 rounded-3xl bg-charcoal-800/90 border border-charcoal-700 shadow-xl space-y-3">
            <div className="text-xs font-bold text-white uppercase tracking-wider">
              Quick Admin Actions
            </div>

            <div className="space-y-2 text-xs">
              <button
                onClick={() => onNavigate('assistant')}
                className="w-full p-3 rounded-xl bg-charcoal-900 hover:bg-charcoal-700/80 border border-charcoal-700 text-left flex items-center justify-between text-neutral-300 hover:text-white transition"
              >
                <div className="flex items-center gap-2.5">
                  <Zap className="w-4 h-4 text-electric-400" />
                  <span>Ask AI Copilot for Growth Advice</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-neutral-500" />
              </button>

              <button
                onClick={() => onNavigate('feedback')}
                className="w-full p-3 rounded-xl bg-charcoal-900 hover:bg-charcoal-700/80 border border-charcoal-700 text-left flex items-center justify-between text-neutral-300 hover:text-white transition"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Verify Bug Reports & Award Credits</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-neutral-500" />
              </button>

              <button
                onClick={() => onNavigate('users')}
                className="w-full p-3 rounded-xl bg-charcoal-900 hover:bg-charcoal-700/80 border border-charcoal-700 text-left flex items-center justify-between text-neutral-300 hover:text-white transition"
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-blue-400" />
                  <span>Manage Sheldon & User Credits</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-neutral-500" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
