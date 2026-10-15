import React from 'react';
import {
  BarChart3,
  Award,
  GitBranch,
  Clock,
  AlertCircle,
  CheckCircle2,
  Cpu,
  Layers,
  Database
} from 'lucide-react';

export const ModelPerformanceView: React.FC = () => {
  return (
    <div className="space-y-5">
      {/* Model Registry Header */}
      <div className="bg-white border border-slate-200 rounded-md p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-slate-700" />
            <h2 className="text-sm font-semibold tracking-tight text-slate-900">
              Model Performance & MLflow Registry
            </h2>
            <span className="text-[10px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-medium">
              CHAMPION @prod
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Offline validation metrics and live latency telemetry for the active decision model
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono text-slate-500">
          <div className="bg-slate-50 border border-slate-200 px-2.5 py-1 rounded">
            Run ID: <span className="text-slate-900 font-semibold">mlflow_run_7f81a9</span>
          </div>
          <div className="bg-slate-50 border border-slate-200 px-2.5 py-1 rounded">
            Trained: <span className="text-slate-900 font-semibold">2026-10-12</span>
          </div>
        </div>
      </div>

      {/* Primary ML Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-slate-200 rounded p-3.5 shadow-xs">
          <span className="block text-[10px] font-medium uppercase tracking-wider text-slate-400">
            PR-AUC Score
          </span>
          <span className="text-xl font-bold font-mono text-slate-900 tabular-nums">0.984</span>
          <span className="text-[10px] text-slate-400 block pt-0.5 font-mono">Precision-Recall</span>
        </div>
        <div className="bg-white border border-slate-200 rounded p-3.5 shadow-xs">
          <span className="block text-[10px] font-medium uppercase tracking-wider text-slate-400">
            ROC-AUC
          </span>
          <span className="text-xl font-bold font-mono text-slate-900 tabular-nums">0.991</span>
          <span className="text-[10px] text-slate-400 block pt-0.5 font-mono">Discriminant Area</span>
        </div>
        <div className="bg-white border border-slate-200 rounded p-3.5 shadow-xs">
          <span className="block text-[10px] font-medium uppercase tracking-wider text-slate-400">
            Precision
          </span>
          <span className="text-xl font-bold font-mono text-slate-900 tabular-nums">0.942</span>
          <span className="text-[10px] text-slate-400 block pt-0.5 font-mono">True Positive / Pos</span>
        </div>
        <div className="bg-white border border-slate-200 rounded p-3.5 shadow-xs">
          <span className="block text-[10px] font-medium uppercase tracking-wider text-slate-400">
            Recall
          </span>
          <span className="text-xl font-bold font-mono text-slate-900 tabular-nums">0.918</span>
          <span className="text-[10px] text-slate-400 block pt-0.5 font-mono">Sensitivity Catch</span>
        </div>
        <div className="bg-white border border-slate-200 rounded p-3.5 shadow-xs">
          <span className="block text-[10px] font-medium uppercase tracking-wider text-slate-400">
            F1-Score
          </span>
          <span className="text-xl font-bold font-mono text-slate-900 tabular-nums">0.930</span>
          <span className="text-[10px] text-slate-400 block pt-0.5 font-mono">Harmonic Mean</span>
        </div>
        <div className="bg-white border border-slate-200 rounded p-3.5 shadow-xs">
          <span className="block text-[10px] font-medium uppercase tracking-wider text-slate-400">
            Decision Threshold
          </span>
          <span className="text-xl font-bold font-mono text-slate-900 tabular-nums">0.740</span>
          <span className="text-[10px] text-slate-400 block pt-0.5 font-mono">Policy Cutoff</span>
        </div>
      </div>

      {/* Confusion Matrix & Latency Breakdown (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Left: Confusion Matrix (6 cols) */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-md p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div>
              <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-tight">
                Held-Out Test Confusion Matrix
              </h3>
              <p className="text-[11px] text-slate-500">Evaluated on N = 86,324 synthetic test payments</p>
            </div>
            <span className="text-[11px] font-mono text-slate-400">Threshold: 0.74</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
            {/* TP */}
            <div className="bg-emerald-50/70 border border-emerald-200 rounded p-3 space-y-1">
              <span className="text-[10px] text-emerald-800 font-semibold block uppercase">
                True Positives (TP)
              </span>
              <span className="text-lg font-bold text-emerald-900">1,836</span>
              <p className="text-[10px] text-emerald-700 font-sans">
                Correctly blocked malicious transactions
              </p>
            </div>

            {/* FP */}
            <div className="bg-amber-50/70 border border-amber-200 rounded p-3 space-y-1">
              <span className="text-[10px] text-amber-800 font-semibold block uppercase">
                False Positives (FP)
              </span>
              <span className="text-lg font-bold text-amber-900">114</span>
              <p className="text-[10px] text-amber-700 font-sans">
                Legitimate payments flagged erroneously (0.13% FPR)
              </p>
            </div>

            {/* FN */}
            <div className="bg-rose-50/70 border border-rose-200 rounded p-3 space-y-1">
              <span className="text-[10px] text-rose-800 font-semibold block uppercase">
                False Negatives (FN)
              </span>
              <span className="text-lg font-bold text-rose-900">164</span>
              <p className="text-[10px] text-rose-700 font-sans">
                Fraud cases that evaded detection boundary
              </p>
            </div>

            {/* TN */}
            <div className="bg-slate-50 border border-slate-200 rounded p-3 space-y-1">
              <span className="text-[10px] text-slate-700 font-semibold block uppercase">
                True Negatives (TN)
              </span>
              <span className="text-lg font-bold text-slate-900">84,210</span>
              <p className="text-[10px] text-slate-600 font-sans">
                Legitimate transactions approved friction-free
              </p>
            </div>
          </div>
        </div>

        {/* Right: Latency & SLA Performance (6 cols) */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-md p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div>
              <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-tight">
                Inference Latency Percentiles
              </h3>
              <p className="text-[11px] text-slate-500">Live production roundtrip & pipeline execution</p>
            </div>
            <span className="text-[10px] font-mono text-emerald-700 font-medium bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              SLA Compliant (&lt;15ms)
            </span>
          </div>

          <div className="space-y-3 pt-1 text-xs">
            {/* p50 */}
            <div className="space-y-1">
              <div className="flex justify-between font-mono text-xs">
                <span className="text-slate-600 font-medium">p50 (Median Latency):</span>
                <span className="font-bold text-slate-900">8.4 ms</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5">
                <div className="bg-slate-900 h-1.5 rounded-full" style={{ width: '42%' }} />
              </div>
            </div>

            {/* p95 */}
            <div className="space-y-1">
              <div className="flex justify-between font-mono text-xs">
                <span className="text-slate-600 font-medium">p95 (Target SLA Ceiling):</span>
                <span className="font-bold text-slate-900">11.75 ms</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5">
                <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: '58%' }} />
              </div>
            </div>

            {/* p99 */}
            <div className="space-y-1">
              <div className="flex justify-between font-mono text-xs">
                <span className="text-slate-600 font-medium">p99 (Tail Latency):</span>
                <span className="font-bold text-slate-900">19.4 ms</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5">
                <div className="bg-amber-600 h-1.5 rounded-full" style={{ width: '85%' }} />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 space-y-1 font-mono">
            <div className="flex justify-between">
              <span>Model Architecture:</span>
              <span className="text-slate-800">RandomForestClassifier (n=120)</span>
            </div>
            <div className="flex justify-between">
              <span>Feature Preprocessing:</span>
              <span className="text-slate-800">StandardScaler + OneHotEncoding</span>
            </div>
          </div>
        </div>

      </div>

      {/* Scientific & ML Governance Limitations Card */}
      <div className="bg-slate-50 border border-slate-200 rounded-md p-4 space-y-2 text-xs leading-relaxed text-slate-700">
        <div className="flex items-center gap-1.5 font-semibold text-slate-900 text-xs">
          <AlertCircle className="w-4 h-4 text-slate-600" />
          <span>MLOps Scientific Assessment & Synthetic Data Limitations</span>
        </div>
        <p className="text-slate-600">
          In compliance with rigorous ML validation standards: High offline metric scores (PR-AUC 0.984) reflect
          evaluations on parameterized synthetic transaction generators with simulated fraud vectors. Target leakage
          precautions have been enforced by removing post-transaction account status from the prediction feature vector.
          True in-the-wild fraud detection effectiveness must be tracked through active shadow-testing and the analyst
          ground-truth feedback loop.
        </p>
      </div>
    </div>
  );
};
