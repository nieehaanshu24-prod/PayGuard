import React from 'react';
import { SummaryCards } from '../SummaryCards';
import { TransactionTable } from '../TransactionTable';
import { useDashboard } from '../../context/DashboardContext';
import { Shield, Activity, AlertTriangle, ArrowRight } from 'lucide-react';

export const DashboardView: React.FC = () => {
  const { isStreaming, streamStats, setActiveTab, transactions } = useDashboard();

  const highRiskCount = transactions.filter(t => t.risk_level === 'HIGH').length;
  const mediumRiskCount = transactions.filter(t => t.risk_level === 'MEDIUM').length;
  const lowRiskCount = transactions.filter(t => t.risk_level === 'LOW').length;

  return (
    <div className="space-y-6">
      {/* Streaming Active Banner if running */}
      {isStreaming && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-md p-3 flex items-center justify-between text-xs text-emerald-900">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
            <span className="font-semibold">Live Traffic Simulation Active</span>
            <span className="text-emerald-700 font-mono">
              ({streamStats.currentTps} TPS · {streamStats.totalStreamed} txns received)
            </span>
          </div>
          <button
            onClick={() => setActiveTab('live_streaming')}
            className="flex items-center gap-1 font-medium hover:underline text-emerald-800 cursor-pointer"
          >
            <span>View Live Feed</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Summary Metrics */}
      <SummaryCards />

      {/* Risk Distribution Strip */}
      <div className="bg-white border border-slate-200 rounded-md p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-slate-500" />
          <span className="font-semibold text-slate-900">Calibrated Risk Tier Partition:</span>
          <span className="text-slate-500 font-mono text-[11px]">
            High (&ge;74%), Medium (45-73%), Low (&lt;45%)
          </span>
        </div>

        <div className="flex items-center gap-3 font-mono text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="text-slate-700">{highRiskCount} High Risk</span>
          </div>
          <span className="text-slate-300">·</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-slate-700">{mediumRiskCount} Review</span>
          </div>
          <span className="text-slate-300">·</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-slate-700">{lowRiskCount} Approved</span>
          </div>
        </div>
      </div>

      {/* Central Transaction Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-slate-900">
              Live Transaction Ledger
            </h2>
            <p className="text-xs text-slate-500">
              Real-time audit log of scored transactions, fraud probabilities, and policy verdicts
            </p>
          </div>
        </div>

        <TransactionTable />
      </div>
    </div>
  );
};
