import React from 'react';
import { RefreshCw, Play, ShieldAlert, Sparkles } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle: string;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onRefresh,
  isRefreshing = false
}) => {
  return (
    <header className="h-16 border-b border-charcoal-700/80 bg-charcoal-900/60 backdrop-blur-md px-8 flex items-center justify-between shrink-0">
      <div>
        <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
          {title}
        </h1>
        <p className="text-xs text-neutral-400">{subtitle}</p>
      </div>

      <div className="flex items-center space-x-3">
        {/* Failover engine pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-charcoal-800 border border-charcoal-700/60 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-neutral-300 font-mono">Engine: Auto-Failover Enabled</span>
        </div>

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-charcoal-800 hover:bg-charcoal-700 border border-charcoal-700/60 text-xs font-medium text-neutral-300 hover:text-white transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-electric-500' : ''}`} />
          <span>Sync</span>
        </button>
      </div>
    </header>
  );
};
