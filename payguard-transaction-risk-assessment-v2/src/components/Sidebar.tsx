import React from 'react';
import {
  LayoutDashboard,
  Sliders,
  Activity,
  BarChart3,
  GitCompare,
  Layers,
  Server,
  Play,
  Square,
  ShieldCheck
} from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { NavTab } from '../types';

interface NavItem {
  id: NavTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
}

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    isStreaming,
    startStream,
    stopStream,
    streamStats,
    transactions,
    healthStatus
  } = useDashboard();

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transaction_analysis', label: 'Transaction Analysis', icon: Sliders },
    {
      id: 'live_streaming',
      label: 'Live Transactions',
      icon: Activity,
      badge: isStreaming ? `${streamStats.currentTps} TPS` : undefined
    },
    { id: 'model_performance', label: 'Model Performance', icon: BarChart3 },
    { id: 'drift_monitoring', label: 'Drift Monitoring', icon: GitCompare },
    { id: 'explainability', label: 'Model Explainability', icon: Layers },
    { id: 'system_health', label: 'System Health', icon: Server }
  ];

  return (
    <aside className="w-60 bg-white border-r border-slate-200 flex flex-col shrink-0 select-none">
      {/* Navigation Links */}
      <div className="p-3 space-y-1 flex-1">
        <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-slate-400 font-medium">
          Navigation
        </div>

        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-medium transition-colors cursor-pointer ${
                isActive
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-slate-900 stroke-[2.2]' : 'text-slate-500'
                  }`}
                />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-medium animate-pulse">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Traffic Simulator Quick Control Widget */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/70 space-y-2.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-medium text-slate-700">Traffic Streamer</span>
          <span
            className={`font-mono text-[10px] px-1.5 py-0.2 rounded font-medium ${
              isStreaming
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-slate-200 text-slate-600'
            }`}
          >
            {isStreaming ? 'STREAMING' : 'IDLE'}
          </span>
        </div>

        <p className="text-[10px] text-slate-500 leading-tight">
          Client generator compatible with <code className="font-mono text-[9px]">scripts/stream_traffic.py</code>.
        </p>

        <div className="pt-1">
          {isStreaming ? (
            <button
              onClick={stopStream}
              className="w-full flex items-center justify-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 py-1.5 px-3 rounded text-xs font-medium transition-colors cursor-pointer shadow-xs"
            >
              <Square className="w-3 h-3 fill-rose-700" />
              <span>Stop Stream</span>
            </button>
          ) : (
            <button
              onClick={startStream}
              className="w-full flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white py-1.5 px-3 rounded text-xs font-medium transition-colors cursor-pointer shadow-xs"
            >
              <Play className="w-3 h-3 fill-white" />
              <span>Start Stream</span>
            </button>
          )}
        </div>
      </div>

      {/* System Footer Metadata */}
      <div className="p-3 border-t border-slate-200 text-[11px] text-slate-500 space-y-1">
        <div className="flex items-center justify-between text-[10px] font-mono">
          <span>Active Ledger:</span>
          <span className="text-slate-900 font-medium tabular-nums">{transactions.length} txns</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono truncate" title={healthStatus.model_version}>
          <ShieldCheck className="w-3 h-3 text-slate-500 shrink-0" />
          <span className="truncate">RF_Candidate @champ</span>
        </div>
      </div>
    </aside>
  );
};
