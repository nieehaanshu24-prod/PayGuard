import React, { useState } from 'react';
import {
  Layers,
  Info,
  HelpCircle,
  TrendingUp,
  Sliders,
  CheckCircle2
} from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';

export const ExplainabilityView: React.FC = () => {
  const { selectedTransaction } = useDashboard();

  // Global feature importance baseline
  const globalFeatures = [
    { name: 'Amount vs. 30d Avg Ratio', meanShap: 0.342, description: 'Deviation from user historical transaction size', rank: 1 },
    { name: 'Device Hardware Trust', meanShap: 0.285, description: 'Cryptographic binding vs rooted / emulated client', rank: 2 },
    { name: 'Location / Routing Risk', meanShap: 0.198, description: 'Geo-velocity anomalies and suspicious ASN routing', rank: 3 },
    { name: 'Burst Velocity (1h)', meanShap: 0.154, description: 'Frequency of attempted transactions in past 60 minutes', rank: 4 },
    { name: 'Merchant Category MCC', meanShap: 0.112, description: 'High-risk MCC categories (crypto, remittance, gaming)', rank: 5 },
    { name: 'Cross-Border Transfer', meanShap: 0.078, description: 'International settlement rail with foreign currency', rank: 6 },
    { name: 'Cumulative Velocity (24h)', meanShap: 0.052, description: '24-hour total payment attempts', rank: 7 },
    { name: 'Payment Rail (Channel)', meanShap: 0.041, description: 'UPI vs Credit Card vs Net Banking payment rails', rank: 8 }
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-md p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-1">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-slate-700" />
          <h2 className="text-sm font-semibold tracking-tight text-slate-900">
            Model Explainability & TreeSHAP Attribution
          </h2>
          <span className="text-[10px] font-mono bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded font-medium">
            Shapley Additive exPlanations
          </span>
        </div>
        <p className="text-xs text-slate-500">
          Deconstruct black-box random forest predictions into additive, game-theoretic feature contributions
        </p>
      </div>

      {/* Global Feature Importance Table */}
      <div className="bg-white border border-slate-200 rounded-md shadow-xs overflow-hidden">
        <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-tight text-slate-900">
              Global Feature Importance (Mean |SHAP Value|)
            </h3>
            <p className="text-[11px] text-slate-500">
              Averaged over 100,000 synthetic validation transactions in the champion model
            </p>
          </div>
          <span className="text-[11px] font-mono text-slate-400">TreeSHAP Fast Exact Path</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-[10px] font-medium text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3.5 w-12 text-center">Rank</th>
                <th className="py-2.5 px-3">Feature Name</th>
                <th className="py-2.5 px-3">Description & Signal Mechanism</th>
                <th className="py-2.5 px-3 text-right font-mono">Mean |SHAP|</th>
                <th className="py-2.5 px-3 w-44">Relative Impact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {globalFeatures.map(f => {
                const widthPercent = (f.meanShap / 0.35) * 100;

                return (
                  <tr key={f.rank} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-3.5 text-center font-mono text-slate-400 font-semibold text-[11px]">
                      0{f.rank}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 font-mono text-[11px]">{f.name}</td>
                    <td className="py-2.5 px-3 text-slate-600 text-[11px]">{f.description}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-900 tabular-nums">
                      +{f.meanShap.toFixed(3)}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-slate-900 h-1.5 rounded-full transition-all duration-300"
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
      </div>

      {/* Local Attribution Spotlight Card */}
      {selectedTransaction && selectedTransaction.shap_values && (
        <div className="bg-white border border-slate-200 rounded-md p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-tight text-slate-900">
                Active Local Transaction Breakdown: {selectedTransaction.id}
              </h3>
              <p className="text-[11px] text-slate-500">
                Base Value = 0.082 &rarr; Predicted Probability ={' '}
                {(selectedTransaction.fraud_probability * 100).toFixed(1)}%
              </p>
            </div>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                selectedTransaction.verdict === 'BLOCKED'
                  ? 'bg-rose-50 text-rose-800 border border-rose-200'
                  : selectedTransaction.verdict === 'REVIEW'
                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              }`}
            >
              {selectedTransaction.verdict}
            </span>
          </div>

          <div className="space-y-2">
            {selectedTransaction.shap_values.map((s, idx) => {
              const isPos = s.impact >= 0;
              const formatted = (isPos ? '+' : '') + s.impact.toFixed(3);
              const barWidth = Math.min(100, Math.max(8, (Math.abs(s.impact) / 0.35) * 100));

              return (
                <div key={idx} className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded border border-slate-100">
                  <div className="flex-1 max-w-sm">
                    <span className="font-medium text-slate-900 block">{s.feature}</span>
                    <span className="text-[11px] text-slate-500 font-mono">{s.value}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`font-mono font-semibold tabular-nums ${
                        isPos ? 'text-rose-700' : 'text-emerald-700'
                      }`}
                    >
                      {formatted}
                    </span>
                    <div className="w-24 bg-slate-200 rounded-full h-1 overflow-hidden">
                      <div
                        className={`h-1 rounded-full ${isPos ? 'bg-rose-500' : 'bg-emerald-500'}`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Explainer Scientific Disclaimer */}
      <div className="bg-slate-50 border border-slate-200 rounded-md p-4 space-y-2 text-xs leading-relaxed text-slate-700">
        <div className="flex items-center gap-1.5 font-semibold text-slate-900 text-xs">
          <Info className="w-4 h-4 text-slate-600" />
          <span>Interpreting SHAP Log-Odds Contributions in Fraud Engines</span>
        </div>
        <p className="text-slate-600">
          SHAP values represent the additive marginal contribution of each transaction feature to the model's log-odds
          prediction relative to the dataset baseline prior ($E[f(x)] = 0.082$). Positive values push the risk score upward
          toward the 0.74 block threshold; negative values indicate mitigating evidence (such as verified hardware trust or
          routine transaction amounts) that pull the prediction toward legitimate approval.
        </p>
      </div>
    </div>
  );
};
