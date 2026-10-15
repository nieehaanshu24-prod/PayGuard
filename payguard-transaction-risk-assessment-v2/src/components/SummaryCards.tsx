import React from 'react';
import {
  CreditCard,
  AlertTriangle,
  Ban,
  Percent,
  Clock
} from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';

export const SummaryCards: React.FC = () => {
  const { transactions, timeFilter, setTimeFilter } = useDashboard();

  // Filter transactions based on selected time filter
  const now = Date.now();
  const filtered = transactions.filter(t => {
    if (timeFilter === 'all') return true;
    const txTime = new Date(t.timestamp).getTime();
    if (timeFilter === '1h') {
      return now - txTime <= 60 * 60 * 1000;
    }
    if (timeFilter === 'today') {
      const txDate = new Date(t.timestamp).toDateString();
      return txDate === new Date().toDateString();
    }
    return true;
  });

  const totalCount = filtered.length;
  const flaggedCount = filtered.filter(t => t.verdict === 'REVIEW' || t.risk_level === 'MEDIUM').length;
  const blockedCount = filtered.filter(t => t.verdict === 'BLOCKED' || t.risk_level === 'HIGH').length;
  const approvedCount = filtered.filter(t => t.verdict === 'APPROVED' || t.risk_level === 'LOW').length;

  const avgProbability = totalCount > 0
    ? (filtered.reduce((acc, t) => acc + (t.fraud_probability || 0), 0) / totalCount) * 100
    : 0;

  return (
    <div className="space-y-3">
      {/* Time Filter Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-medium text-slate-700">Live Session Aggregation</span>
          <span className="text-slate-300">·</span>
          <span className="font-mono text-[11px] text-slate-400">Deterministic Real-time Ledger</span>
        </div>

        <div className="flex items-center bg-slate-100 p-0.5 rounded border border-slate-200/80 text-[11px]">
          <button
            onClick={() => setTimeFilter('all')}
            className={`px-2.5 py-1 rounded font-medium transition-all cursor-pointer ${
              timeFilter === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Time
          </button>
          <button
            onClick={() => setTimeFilter('today')}
            className={`px-2.5 py-1 rounded font-medium transition-all cursor-pointer ${
              timeFilter === 'today'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setTimeFilter('1h')}
            className={`px-2.5 py-1 rounded font-medium transition-all cursor-pointer ${
              timeFilter === '1h'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Last 1h
          </button>
        </div>
      </div>

      {/* 4 Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Total Processed */}
        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
              Total Transactions
            </span>
            <div className="w-7 h-7 rounded bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-600">
              <CreditCard className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-slate-900 tabular-nums">
              {totalCount.toLocaleString()}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5 pt-1">
            <span className="text-emerald-700 font-medium">{approvedCount} approved</span>
            <span className="text-slate-300">·</span>
            <span className="text-slate-400">100% evaluated</span>
          </div>
        </div>

        {/* Card 2: Flagged for Review */}
        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
              Step-Up / Review
            </span>
            <div className="w-7 h-7 rounded bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-700">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-amber-700 tabular-nums">
              {flaggedCount}
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              ({totalCount > 0 ? ((flaggedCount / totalCount) * 100).toFixed(1) : 0}%)
            </span>
          </div>
          <div className="text-[11px] text-slate-500 font-mono pt-1">
            <span>Score: 0.45 – 0.74 threshold</span>
          </div>
        </div>

        {/* Card 3: Blocked Transactions */}
        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
              Blocked Transactions
            </span>
            <div className="w-7 h-7 rounded bg-rose-50 border border-rose-200/80 flex items-center justify-center text-rose-700">
              <Ban className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-rose-700 tabular-nums">
              {blockedCount}
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              ({totalCount > 0 ? ((blockedCount / totalCount) * 100).toFixed(1) : 0}%)
            </span>
          </div>
          <div className="text-[11px] text-slate-500 font-mono pt-1">
            <span>Score: &ge; 0.74 cutoff</span>
          </div>
        </div>

        {/* Card 4: Average Fraud Probability */}
        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
              Avg Fraud Probability
            </span>
            <div className="w-7 h-7 rounded bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-700">
              <Percent className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-slate-900 tabular-nums">
              {avgProbability.toFixed(1)}%
            </span>
          </div>
          <div className="text-[11px] text-slate-500 font-mono pt-1">
            <span>Model calibration baseline</span>
          </div>
        </div>
      </div>
    </div>
  );
};
