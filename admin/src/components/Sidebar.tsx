import React from 'react';
import { 
  LayoutDashboard, 
  KeyRound, 
  Gift, 
  Users, 
  Sliders, 
  ShieldCheck,
  ExternalLink,
  Zap,
  LogOut
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onLogout?: () => void;
  activeKeysCount: number;
  exhaustedKeysCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onLogout,
  activeKeysCount,
  exhaustedKeysCount
}) => {
  const navItems = [
    { id: 'overview', label: 'Executive Dashboard', icon: LayoutDashboard },
    { id: 'assistant', label: 'AI Executive Copilot', icon: Zap, badge: 'Live AI' },
    { id: 'feedback', label: 'Bug Reports & Requests', icon: ShieldCheck },
    { id: 'users', label: 'User & Credit Manager', icon: Users },
    { 
      id: 'keys', 
      label: 'API Key Failover Pool', 
      icon: KeyRound,
      badge: `${activeKeysCount} Active`
    },
    { id: 'codes', label: 'Redeem Code Engine', icon: Gift },
    { id: 'plans', label: 'Tier Configurator', icon: Sliders },
  ];

  return (
    <aside className="w-64 bg-charcoal-800 border-r border-charcoal-700/80 flex flex-col justify-between h-screen shrink-0 select-none">
      <div>
        {/* Brand */}
        <div className="p-5 border-b border-charcoal-700/60 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-electric-600 to-electric-500 flex items-center justify-center shadow-lg shadow-electric-500/20">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-white tracking-tight flex items-center gap-1.5">
                <span>WormDonz</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-electric-500/20 text-electric-500 border border-electric-500/30">ADMIN</span>
              </div>
              <p className="text-xs text-neutral-400">Failover Control Center</p>
            </div>
          </div>
        </div>

        {/* Live Pool Health Banner */}
        <div className="mx-3 mt-4 p-3 rounded-xl bg-charcoal-900/80 border border-charcoal-700/60">
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-400 font-medium">Failover Status</span>
            <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              ONLINE
            </span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1 text-[11px] font-mono">
            <div className="bg-charcoal-800 px-2 py-1 rounded text-emerald-400">
              Active: {activeKeysCount}
            </div>
            <div className="bg-charcoal-800 px-2 py-1 rounded text-rose-400">
              Depleted: {exhaustedKeysCount}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1.5 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-electric-500 text-white shadow-md shadow-electric-500/25'
                    : 'text-neutral-300 hover:text-white hover:bg-charcoal-700/60'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-neutral-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-mono ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer User Info & Public Landing Quick Link */}
      <div className="p-4 border-t border-charcoal-700/60 bg-charcoal-900/60 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-electric-500/20 border border-electric-500/30 flex items-center justify-center font-bold text-xs text-electric-400">
              DJ
            </div>
            <div>
              <div className="text-xs font-semibold text-white">Sheldon Bulan (DJ)</div>
              <div className="text-[10px] text-neutral-400 font-mono">sheldonbulan2@gmail.com</div>
            </div>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            ROOT
          </span>
        </div>

        <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1 border-t border-charcoal-800">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-neutral-400 hover:text-white transition"
          >
            <span>Public Site</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-1 text-rose-400 hover:text-rose-300 font-medium transition"
              title="Sign out of Admin Dashboard"
            >
              <LogOut className="w-3 h-3" />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
