import React, { useState } from 'react';
import {
  X,
  Shield,
  Clock,
  Layers,
  MessageSquare,
  CheckCircle,
  AlertTriangle,
  Info,
  Copy,
  Check
} from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';

export const TransactionDetailsModal: React.FC = () => {
  const { selectedTransaction, setSelectedTransaction, submitFeedback } = useDashboard();
  const [feedbackLabel, setFeedbackLabel] = useState<0 | 1>(1);
  const [feedbackNotes, setFeedbackNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  if (!selectedTransaction) return null;

  const tx = selectedTransaction;
  const prob = tx.fraud_probability;
  const probPercent = (prob * 100).toFixed(1);
  const clampNeedle = Math.max(3, Math.min(97, prob * 100));

  const handleCopySummary = () => {
    const text = [
      `PAYGUARD AUDIT DOSSIER: ${tx.id}`,
      `Timestamp:      ${tx.timestamp}`,
      `User ID:        ${tx.user_id}`,
      `Amount:         $${tx.amount.toFixed(2)} (${tx.channel})`,
      `Fraud Prob:     ${probPercent}%`,
      `Risk Level:     ${tx.risk_level}`,
      `Final Verdict:  ${tx.verdict}`,
      `Recommendation: ${tx.recommendation}`,
      `Threshold:      ${tx.decision_threshold}`,
      `Inference Lat:  ${tx.inference_latency_ms.toFixed(1)} ms`,
      `Driver:         ${tx.plain_language_summary || 'Evaluated against candidate model threshold'}`
    ].join('\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await submitFeedback(tx.id, feedbackLabel, feedbackNotes);
    setIsSubmitting(false);
    setFeedbackNotes('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-end">
      {/* Slide-over Panel from right */}
      <div className="bg-white border-l border-slate-200 h-full w-full max-w-xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-slate-900 flex items-center justify-center text-white">
              <Shield className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-tight">
                  Transaction Audit Record
                </h2>
                <span className="font-mono text-xs text-slate-500 font-medium">{tx.id}</span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">
                Evaluated: {new Date(tx.timestamp).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySummary}
              className="p-1.5 rounded border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
              title="Copy Audit Summary"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => setSelectedTransaction(null)}
              className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          
          {/* Verdict Banner & Probability Meter */}
          <div className="bg-white border border-slate-200 rounded-md p-4 space-y-3.5 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-bold font-mono uppercase tracking-wider ${
                    tx.verdict === 'BLOCKED'
                      ? 'bg-rose-50 text-rose-800 border border-rose-200'
                      : tx.verdict === 'REVIEW'
                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {tx.verdict}
                </span>

                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold font-mono tracking-tight text-slate-900 tabular-nums">
                    {probPercent}%
                  </span>
                  <span className="text-xs text-slate-500 font-medium">Fraud Probability</span>
                </div>
              </div>

              <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                {tx.inference_latency_ms.toFixed(1)}ms latency
              </span>
            </div>

            {/* Continuous Calibrated Spectrum Bar */}
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span className="text-emerald-700">0 · Normal</span>
                <span className="text-amber-700">45 · Review</span>
                <span className="text-rose-700">74 · Block Cutoff</span>
                <span>100</span>
              </div>
              <div className="relative w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
                <div className="h-full bg-emerald-200/90 w-[45%]" />
                <div className="h-full bg-amber-200/90 w-[29%]" />
                <div className="h-full bg-rose-200/90 w-[26%]" />
              </div>
              <div className="relative w-full h-3">
                <div
                  className="absolute top-0 -translate-x-1/2 flex flex-col items-center transition-all duration-300"
                  style={{ left: `${clampNeedle}%` }}
                >
                  <div className="w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-b-[5px] border-b-slate-900" />
                </div>
              </div>
            </div>

            {/* Metadata 4-Cell Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <div className="bg-slate-50 border border-slate-200/70 rounded p-2 text-center">
                <span className="block text-[9px] uppercase font-medium text-slate-400">Decision Threshold</span>
                <span className="text-xs font-semibold font-mono text-slate-900">{tx.decision_threshold}</span>
              </div>
              <div className="bg-slate-50 border border-slate-200/70 rounded p-2 text-center">
                <span className="block text-[9px] uppercase font-medium text-slate-400">Policy Action</span>
                <span className="text-[10px] font-semibold font-mono text-slate-900 truncate block">
                  {tx.recommendation}
                </span>
              </div>
              <div className="bg-slate-50 border border-slate-200/70 rounded p-2 text-center">
                <span className="block text-[9px] uppercase font-medium text-slate-400">Risk Tier</span>
                <span className="text-xs font-semibold font-mono text-slate-900">{tx.risk_level}</span>
              </div>
              <div className="bg-slate-50 border border-slate-200/70 rounded p-2 text-center">
                <span className="block text-[9px] uppercase font-medium text-slate-400">Candidate Model</span>
                <span className="text-[10px] font-mono text-slate-700 truncate block" title={tx.model_version}>
                  RF @champion
                </span>
              </div>
            </div>
          </div>

          {/* Plain-Language Analyst Synthesis */}
          {tx.plain_language_summary && (
            <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs text-slate-700 leading-relaxed space-y-1">
              <div className="flex items-center gap-1.5 font-medium text-slate-900 text-[11px]">
                <Info className="w-3.5 h-3.5 text-slate-500" />
                <span>Primary Risk Factor Explanation</span>
              </div>
              <p className="pl-5 text-slate-600">{tx.plain_language_summary}</p>
            </div>
          )}

          {/* Input Feature Breakdown Grid */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Transaction Parameters & Features
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div className="border border-slate-200 rounded p-2 bg-white">
                <span className="text-[10px] text-slate-400 block font-mono">User ID</span>
                <span className="font-mono font-medium text-slate-900">{tx.user_id}</span>
              </div>
              <div className="border border-slate-200 rounded p-2 bg-white">
                <span className="text-[10px] text-slate-400 block font-mono">Amount / Rail</span>
                <span className="font-mono font-medium text-slate-900">
                  ${tx.amount.toFixed(2)} · {tx.channel}
                </span>
              </div>
              <div className="border border-slate-200 rounded p-2 bg-white">
                <span className="text-[10px] text-slate-400 block font-mono">30-Day Avg Amount</span>
                <span className="font-mono font-medium text-slate-900">${tx.user_avg_amount_30d.toFixed(2)}</span>
              </div>
              <div className="border border-slate-200 rounded p-2 bg-white">
                <span className="text-[10px] text-slate-400 block font-mono">Balance Prior &rarr; Post</span>
                <span className="font-mono font-medium text-slate-900">
                  ${tx.old_balance} &rarr; ${tx.new_balance}
                </span>
              </div>
              <div className="border border-slate-200 rounded p-2 bg-white">
                <span className="text-[10px] text-slate-400 block font-mono">Merchant Category</span>
                <span className="font-mono font-medium text-slate-900 truncate block">{tx.merchant_category}</span>
              </div>
              <div className="border border-slate-200 rounded p-2 bg-white">
                <span className="text-[10px] text-slate-400 block font-mono">Cross-Border</span>
                <span className="font-mono font-medium text-slate-900">
                  {tx.is_foreign_transaction === 1 ? 'Yes (International)' : 'No (Domestic)'}
                </span>
              </div>
              <div className="border border-slate-200 rounded p-2 bg-white">
                <span className="text-[10px] text-slate-400 block font-mono">Device Trust Score</span>
                <span className="font-mono font-medium text-slate-900">{tx.device_trust_score.toFixed(2)}</span>
              </div>
              <div className="border border-slate-200 rounded p-2 bg-white">
                <span className="text-[10px] text-slate-400 block font-mono">Location Risk Score</span>
                <span className="font-mono font-medium text-slate-900">{tx.location_risk_score.toFixed(2)}</span>
              </div>
              <div className="border border-slate-200 rounded p-2 bg-white">
                <span className="text-[10px] text-slate-400 block font-mono">Velocity (1h / 24h)</span>
                <span className="font-mono font-medium text-slate-900">
                  {tx.velocity_1h} / {tx.velocity_24h} txns
                </span>
              </div>
            </div>
          </div>

          {/* SHAP Explainability Table */}
          {tx.shap_values && tx.shap_values.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-slate-600" />
                  <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-tight">
                    TreeSHAP Feature Attributions
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-400">Local log-odds contributions</span>
              </div>

              <div className="border border-slate-200 rounded-md overflow-hidden bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] font-medium text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Feature Name</th>
                      <th className="py-2 px-3">Observed Value</th>
                      <th className="py-2 px-3 text-right font-mono">Impact</th>
                      <th className="py-2 px-3 w-28">Magnitude</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tx.shap_values.map((s, idx) => {
                      const isPos = s.impact >= 0;
                      const formatted = (isPos ? '+' : '') + s.impact.toFixed(3);
                      const widthPercent = Math.min(100, Math.max(8, (Math.abs(s.impact) / 0.35) * 100));

                      return (
                        <tr key={idx} className="hover:bg-slate-50/70">
                          <td className="py-2 px-3 font-medium text-slate-900">{s.feature}</td>
                          <td className="py-2 px-3 font-mono text-slate-600 text-[11px]">{s.value}</td>
                          <td
                            className={`py-2 px-3 text-right font-mono font-medium ${
                              isPos ? 'text-rose-700' : 'text-emerald-700'
                            }`}
                          >
                            {formatted}
                          </td>
                          <td className="py-2 px-3">
                            <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
                              <div
                                className={`h-1 rounded-full ${isPos ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                style={{ width: `${widthPercent}%` }}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <p className="text-[10px] text-slate-400 leading-normal italic">
                * Note: SHAP values represent individual feature contributions to model log-odds predictions, not
                definitive legal proof that a transaction is fraudulent.
              </p>
            </div>
          )}

          {/* Analyst Feedback Section (POST /feedback) */}
          <div className="border border-slate-200 rounded-md p-4 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900">
                <MessageSquare className="w-3.5 h-3.5 text-slate-600" />
                <span>Analyst Ground-Truth Feedback Loop</span>
              </div>
              {tx.feedback_logged && (
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Logged in MLflow Feedback Buffer
                </span>
              )}
            </div>

            <form onSubmit={handleFeedbackSubmit} className="space-y-3">
              <div className="flex items-center gap-3 text-xs">
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="feedbackLabel"
                    checked={feedbackLabel === 1}
                    onChange={() => setFeedbackLabel(1)}
                    className="text-rose-600 focus:ring-slate-900"
                  />
                  <span className="font-medium text-slate-800">Confirmed Fraud (1)</span>
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="feedbackLabel"
                    checked={feedbackLabel === 0}
                    onChange={() => setFeedbackLabel(0)}
                    className="text-emerald-600 focus:ring-slate-900"
                  />
                  <span className="font-medium text-slate-800">False Positive / Legitimate (0)</span>
                </label>
              </div>

              <input
                type="text"
                value={feedbackNotes}
                onChange={e => setFeedbackNotes(e.target.value)}
                placeholder="Optional notes: Cardholder verified travel exception, chargeback received, etc."
                className="w-full text-xs bg-white border border-slate-200 rounded px-2.5 py-1.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900"
              />

              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-slate-900 hover:bg-slate-800 text-white font-medium px-3 py-1.5 rounded text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Recording...' : 'Submit Ground-Truth to POST /feedback'}
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
};
