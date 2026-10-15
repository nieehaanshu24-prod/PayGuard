import React, { useState } from 'react';
import {
  Play,
  Square,
  Activity,
  Terminal,
  Zap,
  Clock,
  Shield,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Ban
} from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';

export const LiveStreamingView: React.FC = () => {
  const {
    isStreaming,
    startStream,
    stopStream,
    streamingTps,
    setStreamingTps,
    streamStats,
    transactions,
    setSelectedTransaction
  } = useDashboard();

  const [filterType, setFilterType] = useState<'ALL' | 'BLOCKED' | 'REVIEW'>('ALL');

  const simulatedStream = transactions
    .filter(t => t.is_simulated || true)
    .filter(t => {
      if (filterType === 'ALL') return true;
      if (filterType === 'BLOCKED') return t.verdict === 'BLOCKED';
      if (filterType === 'REVIEW') return t.verdict === 'REVIEW';
      return true;
    })
    .slice(0, 50);

  return (
    <div className="space-y-5">
      {/* Stream Controls Banner */}
      <div className="bg-white border border-slate-200 rounded-md p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-slate-700" />
            <h2 className="text-sm font-semibold tracking-tight text-slate-900">
              Live Synthetic Transaction Simulator
            </h2>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded font-medium ${
                isStreaming
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {isStreaming ? 'STREAM ACTIVE' : 'STREAM IDLE'}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Simulates burst & nominal payment traffic, streaming live payloads directly to <code className="font-mono text-slate-700 bg-slate-100 px-1 py-0.5 rounded">POST /predict</code>
          </p>
        </div>

        {/* Action Controls & TPS Switcher */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs">
            <span className="text-[11px] font-medium text-slate-500">Velocity:</span>
            <div className="flex items-center gap-1">
              {[1, 2, 5].map(tps => (
                <button
                  key={tps}
                  onClick={() => setStreamingTps(tps)}
                  className={`px-2 py-0.5 rounded text-xs font-mono font-medium transition-colors cursor-pointer ${
                    streamingTps === tps
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  {tps} TPS
                </button>
              ))}
            </div>
          </div>

          {isStreaming ? (
            <button
              onClick={stopStream}
              className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-medium py-1.5 px-4 rounded text-xs transition-colors shadow-xs cursor-pointer"
            >
              <Square className="w-3.5 h-3.5 fill-white" />
              <span>Stop Simulator</span>
            </button>
          ) : (
            <button
              onClick={startStream}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-medium py-1.5 px-4 rounded text-xs transition-colors shadow-xs cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Start Stream Simulator</span>
            </button>
          )}
        </div>
      </div>

      {/* Stream Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded p-3.5 shadow-xs">
          <span className="block text-[10px] font-medium uppercase tracking-wider text-slate-400">
            Total Streamed
          </span>
          <span className="text-xl font-bold font-mono text-slate-900 tabular-nums">
            {streamStats.totalStreamed}
          </span>
        </div>
        <div className="bg-white border border-slate-200 rounded p-3.5 shadow-xs">
          <span className="block text-[10px] font-medium uppercase tracking-wider text-slate-400">
            Blocked (Score &ge; 74%)
          </span>
          <span className="text-xl font-bold font-mono text-rose-700 tabular-nums">
            {streamStats.blockedCount}
          </span>
        </div>
        <div className="bg-white border border-slate-200 rounded p-3.5 shadow-xs">
          <span className="block text-[10px] font-medium uppercase tracking-wider text-slate-400">
            Review (Score 45-73%)
          </span>
          <span className="text-xl font-bold font-mono text-amber-700 tabular-nums">
            {streamStats.flaggedCount}
          </span>
        </div>
        <div className="bg-white border border-slate-200 rounded p-3.5 shadow-xs">
          <span className="block text-[10px] font-medium uppercase tracking-wider text-slate-400">
            Target Velocity
          </span>
          <span className="text-xl font-bold font-mono text-slate-900 tabular-nums">
            {streamingTps} txns/sec
          </span>
        </div>
      </div>

      {/* Live Event Feed Table */}
      <div className="bg-white border border-slate-200 rounded-md shadow-xs overflow-hidden">
        <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-tight text-slate-900">
              Live Ingest Stream (Last 50 Scored Events)
            </span>
            {isStreaming && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[11px] text-slate-400 font-medium">Filter:</span>
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                filterType === 'ALL' ? 'bg-slate-200 text-slate-900' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              All Events
            </button>
            <button
              onClick={() => setFilterType('BLOCKED')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                filterType === 'BLOCKED' ? 'bg-rose-100 text-rose-800' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Blocked Only
            </button>
            <button
              onClick={() => setFilterType('REVIEW')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                filterType === 'REVIEW' ? 'bg-amber-100 text-amber-800' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Review Only
            </button>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[460px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-[10px] font-medium text-slate-500 uppercase tracking-wider sticky top-0 border-b border-slate-200 z-10">
              <tr>
                <th className="py-2 px-3">Transaction</th>
                <th className="py-2 px-3">Time</th>
                <th className="py-2 px-3 text-right">Amount</th>
                <th className="py-2 px-3">Rail</th>
                <th className="py-2 px-3">Category</th>
                <th className="py-2 px-3 text-right">Fraud Prob</th>
                <th className="py-2 px-3">Verdict</th>
                <th className="py-2 px-3 text-right">Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {simulatedStream.map((tx, idx) => {
                const prob = tx.fraud_probability;
                const probPercent = (prob * 100).toFixed(1);

                return (
                  <tr
                    key={tx.id || idx}
                    onClick={() => setSelectedTransaction(tx)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="py-2 px-3 font-mono font-medium text-slate-900 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                      <span>{tx.id}</span>
                    </td>
                    <td className="py-2 px-3 font-mono text-[11px] text-slate-500">
                      {new Date(tx.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-medium text-slate-900 tabular-nums">
                      ${tx.amount.toFixed(2)}
                    </td>
                    <td className="py-2 px-3 font-mono text-slate-600 text-[11px]">{tx.channel}</td>
                    <td className="py-2 px-3 font-mono text-slate-500 text-[11px] truncate max-w-[130px]">
                      {tx.merchant_category}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-semibold tabular-nums">
                      <span
                        className={
                          prob >= 0.74
                            ? 'text-rose-700'
                            : prob >= 0.45
                            ? 'text-amber-700'
                            : 'text-emerald-700'
                        }
                      >
                        {probPercent}%
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <span
                        className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold font-mono uppercase ${
                          tx.verdict === 'BLOCKED'
                            ? 'bg-rose-50 text-rose-800 border border-rose-200'
                            : tx.verdict === 'REVIEW'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {tx.verdict}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-slate-400 text-[11px]">
                      {tx.inference_latency_ms.toFixed(1)}ms
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* External Python CLI Streamer Documentation */}
      <div className="bg-slate-900 text-slate-200 rounded-md p-4 space-y-2 text-xs font-mono">
        <div className="flex items-center gap-2 text-slate-100 font-semibold text-[11px]">
          <Terminal className="w-3.5 h-3.5 text-emerald-400" />
          <span>External Python Traffic Generator (CLI Integration)</span>
        </div>
        <p className="text-slate-400 text-[11px] leading-relaxed">
          To run the background process streaming from CSV files directly via Python:
        </p>
        <div className="bg-slate-950 p-2.5 rounded border border-slate-800 text-[11px] text-emerald-400 select-all">
          python scripts/stream_traffic.py --api-url http://localhost:8000 --rate 2 --file data/test_stream.csv
        </div>
        <p className="text-[10px] text-slate-500">
          * Notice: Synthetic simulated events are clearly tagged with blue indicators and do not alter persistent production ledgers.
        </p>
      </div>
    </div>
  );
};
