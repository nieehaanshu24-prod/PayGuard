import React, { useState, useEffect } from 'react';
import {
  Server,
  Activity,
  CheckCircle2,
  AlertCircle,
  Clock,
  Cpu,
  Database,
  Terminal,
  Copy,
  Check
} from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import { apiClient } from '../../api/client';

export const SystemHealthView: React.FC = () => {
  const { healthStatus, refreshDashboard, apiBaseUrl } = useDashboard();
  const [metricsText, setMetricsText] = useState<string>('Loading Prometheus metrics...');
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    apiClient.getMetrics().then(txt => setMetricsText(txt));
  }, []);

  const handleCopyMetrics = () => {
    navigator.clipboard.writeText(metricsText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const endpoints = [
    { method: 'GET', path: '/health', description: 'System health probe and model metadata', latency: `${healthStatus.latency_ms}ms`, status: healthStatus.is_live ? 'ONLINE' : 'STANDBY' },
    { method: 'POST', path: '/predict', description: 'Real-time transaction fraud scoring', latency: '11.2ms', status: healthStatus.is_live ? 'ONLINE' : 'STANDBY' },
    { method: 'POST', path: '/predict/batch', description: 'Concurrent multi-transaction batch evaluator', latency: '28.4ms', status: healthStatus.is_live ? 'ONLINE' : 'STANDBY' },
    { method: 'POST', path: '/explain', description: 'TreeSHAP log-odds feature attribution breakdown', latency: '14.8ms', status: healthStatus.is_live ? 'ONLINE' : 'STANDBY' },
    { method: 'POST', path: '/feedback', description: 'Analyst ground-truth feedback loop ingest', latency: '8.2ms', status: healthStatus.is_live ? 'ONLINE' : 'STANDBY' },
    { method: 'POST', path: '/drift/simulate', description: 'Population Stability Index (PSI) drift engine', latency: '19.5ms', status: healthStatus.is_live ? 'ONLINE' : 'STANDBY' },
    { method: 'GET', path: '/metrics', description: 'Prometheus telemetry scraper endpoint', latency: '4.1ms', status: healthStatus.is_live ? 'ONLINE' : 'STANDBY' }
  ];

  return (
    <div className="space-y-5">
      {/* Health Status Banner */}
      <div className="bg-white border border-slate-200 rounded-md p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-slate-700" />
            <h2 className="text-sm font-semibold tracking-tight text-slate-900">
              System Health & Telemetry Console
            </h2>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                healthStatus.is_live
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              {healthStatus.is_live ? 'FASTAPI DAEMON ACTIVE' : 'CLIENT EMULATION STANDBY'}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Target Host: <code className="font-mono text-slate-700 bg-slate-100 px-1 py-0.5 rounded">{apiBaseUrl}</code>
          </p>
        </div>

        <button
          onClick={refreshDashboard}
          className="bg-slate-900 hover:bg-slate-800 text-white font-medium py-1.5 px-4 rounded text-xs transition-colors shadow-xs cursor-pointer"
        >
          Check All Probes
        </button>
      </div>

      {/* Telemetry Summary 4-Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded p-3.5 shadow-xs">
          <span className="block text-[10px] font-medium uppercase tracking-wider text-slate-400">
            Backend State
          </span>
          <span className="text-sm font-bold font-mono text-slate-900 pt-1 block">
            {healthStatus.is_live ? 'Live :8000' : 'Local Emulation'}
          </span>
          <span className="text-[10px] text-slate-400 block font-mono">Last check: {healthStatus.last_checked}</span>
        </div>

        <div className="bg-white border border-slate-200 rounded p-3.5 shadow-xs">
          <span className="block text-[10px] font-medium uppercase tracking-wider text-slate-400">
            Probe Latency
          </span>
          <span className="text-xl font-bold font-mono text-slate-900 tabular-nums">
            {healthStatus.latency_ms} ms
          </span>
          <span className="text-[10px] text-slate-400 block font-mono">Roundtrip GET /health</span>
        </div>

        <div className="bg-white border border-slate-200 rounded p-3.5 shadow-xs">
          <span className="block text-[10px] font-medium uppercase tracking-wider text-slate-400">
            Model Version
          </span>
          <span className="text-xs font-bold font-mono text-slate-800 pt-1 block truncate">
            {healthStatus.model_version}
          </span>
          <span className="text-[10px] text-slate-400 block font-mono">Champion model</span>
        </div>

        <div className="bg-white border border-slate-200 rounded p-3.5 shadow-xs">
          <span className="block text-[10px] font-medium uppercase tracking-wider text-slate-400">
            Prometheus Scraper
          </span>
          <span className="text-sm font-bold font-mono text-emerald-700 pt-1 block">
            Active (/metrics)
          </span>
          <span className="text-[10px] text-slate-400 block font-mono">OpenMetrics 1.0</span>
        </div>
      </div>

      {/* Endpoints Contract & Status Table */}
      <div className="bg-white border border-slate-200 rounded-md shadow-xs overflow-hidden">
        <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-tight text-slate-900">
            FastAPI Production Endpoint Registry
          </h3>
          <span className="text-[11px] font-mono text-slate-400">OpenAPI 3.1 Spec</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-[10px] font-medium text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3.5 w-20">Method</th>
                <th className="py-2.5 px-3">Endpoint Path</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3 text-right font-mono">Latency</th>
                <th className="py-2.5 px-3">Daemon Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {endpoints.map((ep, i) => (
                <tr key={i} className="hover:bg-slate-50/80">
                  <td className="py-2.5 px-3.5 font-mono font-bold text-[11px] text-slate-700">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] ${
                        ep.method === 'GET'
                          ? 'bg-blue-50 text-blue-800 border border-blue-200'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {ep.method}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono font-semibold text-slate-900">{ep.path}</td>
                  <td className="py-2.5 px-3 text-slate-600 text-[11px]">{ep.description}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-500 text-[11px]">{ep.latency}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.2 rounded text-[10px] font-mono font-semibold ${
                        healthStatus.is_live
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {healthStatus.is_live ? '200 OK' : 'STANDBY'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Raw Prometheus Telemetry Output Box */}
      <div className="bg-slate-900 text-slate-200 rounded-md p-4 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-100 font-semibold font-mono text-[11px]">
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span>Prometheus Scrape Buffer (/metrics)</span>
          </div>
          <button
            onClick={handleCopyMetrics}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-100 font-mono underline cursor-pointer"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Copy Buffer'}</span>
          </button>
        </div>
        <pre className="bg-slate-950 p-3 rounded border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-56 leading-tight">
          {metricsText}
        </pre>
      </div>
    </div>
  );
};
