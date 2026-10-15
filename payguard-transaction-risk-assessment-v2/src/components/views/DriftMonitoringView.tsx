import React, { useState } from 'react';
import {
  GitCompare,
  AlertTriangle,
  Play,
  RotateCcw,
  CheckCircle2,
  Clock,
  Layers,
  HelpCircle
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { DriftReport } from '../../types';

export const DriftMonitoringView: React.FC = () => {
  const [report, setReport] = useState<DriftReport>({
    status: 'drift_detected',
    overall_psi: 0.264,
    drift_threshold: 0.200,
    features_monitored: 12,
    drifted_features: ['amount', 'location_risk_score', 'velocity_1h'],
    timestamp: new Date().toISOString(),
    details: [
      { feature: 'amount', psi: 0.312, status: 'DRIFT_ALERT', ks_p_value: 0.0012 },
      { feature: 'location_risk_score', psi: 0.285, status: 'DRIFT_ALERT', ks_p_value: 0.0034 },
      { feature: 'velocity_1h', psi: 0.218, status: 'DRIFT_ALERT', ks_p_value: 0.0120 },
      { feature: 'device_trust_score', psi: 0.142, status: 'MODERATE', ks_p_value: 0.0820 },
      { feature: 'user_avg_amount_30d', psi: 0.065, status: 'STABLE', ks_p_value: 0.4210 },
      { feature: 'velocity_24h', psi: 0.088, status: 'STABLE', ks_p_value: 0.3150 },
      { feature: 'channel', psi: 0.041, status: 'STABLE', ks_p_value: 0.6120 }
    ]
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSimulateDrift = async () => {
    setIsLoading(true);
    const newReport = await apiClient.simulateDrift('concept_drift');
    setReport(newReport);
    setIsLoading(false);
  };

  return (
    <div className="space-y-5">
      {/* Header Banner & Trigger Action */}
      <div className="bg-white border border-slate-200 rounded-md p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <GitCompare className="w-4 h-4 text-slate-700" />
            <h2 className="text-sm font-semibold tracking-tight text-slate-900">
              Data & Covariate Drift Monitoring
            </h2>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                report.overall_psi > report.drift_threshold
                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              }`}
            >
              {report.overall_psi > report.drift_threshold ? 'DRIFT ALERT (PSI > 0.20)' : 'STABLE BASELINE'}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Population Stability Index (PSI) and Kolmogorov-Smirnov distribution checks on incoming payments
          </p>
        </div>

        <button
          onClick={handleSimulateDrift}
          disabled={isLoading}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-medium py-1.5 px-4 rounded text-xs transition-colors shadow-xs cursor-pointer disabled:opacity-50"
        >
          <Play className="w-3.5 h-3.5 fill-white" />
          <span>{isLoading ? 'Simulating...' : 'Simulate Drift (POST /drift/simulate)'}</span>
        </button>
      </div>

      {/* KPI Metric Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded p-3.5 shadow-xs">
          <span className="block text-[10px] font-medium uppercase tracking-wider text-slate-400">
            Overall PSI Index
          </span>
          <span className="text-xl font-bold font-mono text-amber-700 tabular-nums">
            {report.overall_psi.toFixed(3)}
          </span>
          <span className="text-[10px] text-slate-400 block font-mono pt-0.5">Threshold: 0.200</span>
        </div>

        <div className="bg-white border border-slate-200 rounded p-3.5 shadow-xs">
          <span className="block text-[10px] font-medium uppercase tracking-wider text-slate-400">
            Features Monitored
          </span>
          <span className="text-xl font-bold font-mono text-slate-900 tabular-nums">
            {report.features_monitored}
          </span>
          <span className="text-[10px] text-slate-400 block font-mono pt-0.5">Pydantic input schema</span>
        </div>

        <div className="bg-white border border-slate-200 rounded p-3.5 shadow-xs">
          <span className="block text-[10px] font-medium uppercase tracking-wider text-slate-400">
            Drifted Features
          </span>
          <span className="text-xl font-bold font-mono text-rose-700 tabular-nums">
            {report.drifted_features.length}
          </span>
          <span className="text-[10px] text-slate-400 block font-mono pt-0.5">
            {report.drifted_features.join(', ')}
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded p-3.5 shadow-xs">
          <span className="block text-[10px] font-medium uppercase tracking-wider text-slate-400">
            Last Evaluation
          </span>
          <span className="text-sm font-semibold font-mono text-slate-800 pt-1 block">
            {new Date(report.timestamp).toLocaleTimeString()}
          </span>
          <span className="text-[10px] text-slate-400 block font-mono">Automated daily job</span>
        </div>
      </div>

      {/* Feature Drift Detailed Table */}
      <div className="bg-white border border-slate-200 rounded-md shadow-xs overflow-hidden">
        <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-tight text-slate-900">
            Feature Population Stability Table
          </h3>
          <span className="text-[11px] font-mono text-slate-400">
            Baseline: 100k Training Set vs Live Stream Window
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-[10px] font-medium text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3.5">Feature Name</th>
                <th className="py-2.5 px-3 text-right font-mono">PSI Score</th>
                <th className="py-2.5 px-3 text-right font-mono">KS-Test (p-value)</th>
                <th className="py-2.5 px-3">Drift Status</th>
                <th className="py-2.5 px-3">Recommended Retraining Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {report.details.map((d, i) => (
                <tr key={i} className="hover:bg-slate-50/80">
                  <td className="py-2.5 px-3.5 font-medium font-mono text-slate-900">{d.feature}</td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-slate-800">
                    {d.psi.toFixed(3)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600 text-[11px]">
                    {d.ks_p_value.toFixed(4)}
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                        d.status === 'DRIFT_ALERT'
                          ? 'bg-rose-50 text-rose-800 border border-rose-200'
                          : d.status === 'MODERATE'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {d.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                    {d.status === 'DRIFT_ALERT' ? (
                      <span className="text-rose-700 font-medium">Trigger automated Airflow retraining DAG</span>
                    ) : d.status === 'MODERATE' ? (
                      <span className="text-amber-700">Flag for weekly shadow-pipeline validation</span>
                    ) : (
                      <span className="text-slate-500">Distribution within nominal tolerance</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Technical Notes Card */}
      <div className="bg-slate-50 border border-slate-200 rounded-md p-4 space-y-2 text-xs leading-relaxed text-slate-700">
        <div className="flex items-center gap-1.5 font-semibold text-slate-900 text-xs">
          <HelpCircle className="w-4 h-4 text-slate-600" />
          <span>Understanding Data Drift vs. Model Degradation</span>
        </div>
        <p className="text-slate-600">
          <strong>Data Drift (Covariate Shift)</strong> occurs when incoming transaction distributions (such as average
          spending amounts or cross-border velocity) diverge from historical training distributions ($P(X)$ changes).
          This does not automatically mean model accuracy has decreased, but signals that the decision boundary may become
          less reliable over time. Scheduled DVC pipeline runs incorporate newly labeled transactions to maintain calibration.
        </p>
      </div>
    </div>
  );
};
