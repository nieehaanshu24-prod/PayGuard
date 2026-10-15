import React, { useState } from 'react';
import {
  Shield,
  RefreshCw,
  Download,
  Settings,
  Activity,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  FileCode
} from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';

export const Header: React.FC = () => {
  const {
    healthStatus,
    refreshDashboard,
    exportData,
    apiBaseUrl,
    setApiBaseUrl,
    resetApiBaseUrl,
    transactions
  } = useDashboard();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [tempUrl, setTempUrl] = useState(apiBaseUrl);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshDashboard();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleSaveConfig = () => {
    setApiBaseUrl(tempUrl);
    setShowConfigModal(false);
  };

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 h-14 flex items-center justify-between px-4 sm:px-6">
        {/* Brand & Title */}
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded bg-slate-900 flex items-center justify-center text-white shadow-xs">
            <Shield className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-semibold tracking-tight text-slate-900 text-sm">PayGuard</span>
            <span className="text-slate-300 font-light text-xs">/</span>
            <span className="text-xs font-mono text-slate-500 font-normal hidden sm:inline">
              Fraud Detection & Risk Ops
            </span>
            <span className="text-[11px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/60 hidden md:inline">
              {healthStatus.model_version.split(' ')[0]}
            </span>
          </div>
        </div>

        {/* Right Actions: Telemetry, SLA, Refresh & Export */}
        <div className="flex items-center gap-2.5 sm:gap-3 text-xs">
          {/* Live Backend Connection Indicator */}
          <div
            onClick={() => setShowConfigModal(true)}
            className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 px-2.5 py-1 rounded text-slate-700 cursor-pointer transition-colors"
            title="Click to configure backend host"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                healthStatus.is_live ? 'bg-emerald-500 shadow-xs' : 'bg-slate-400'
              }`}
            />
            <span className="font-mono text-[11px] text-slate-700 font-medium">
              {healthStatus.is_live ? 'API: Live (8000)' : 'API: Standby'}
            </span>
            <span className="font-mono text-[10px] text-slate-400 hidden sm:inline">
              {healthStatus.latency_ms}ms
            </span>
            <Settings className="w-3 h-3 text-slate-400 hover:text-slate-600 ml-0.5" />
          </div>

          {/* p95 SLA Badge */}
          <div className="hidden lg:flex items-center gap-1 text-[11px] font-mono text-slate-500 bg-slate-50 border border-slate-200/80 px-2 py-1 rounded">
            <span>SLA:</span>
            <span className="text-slate-900 font-medium">11.75ms</span>
          </div>

          {/* Refresh Action */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-1.5 rounded border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            title="Refresh backend telemetry & metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-slate-900' : ''}`} />
          </button>

          {/* Export Report Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium px-2.5 py-1 rounded text-xs transition-colors shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export Report</span>
            </button>

            {showExportMenu && (
              <div
                className="absolute right-0 mt-1.5 w-44 bg-white border border-slate-200 rounded-md shadow-lg py-1 z-40 text-xs"
                onMouseLeave={() => setShowExportMenu(false)}
              >
                <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-slate-400 font-medium border-b border-slate-100">
                  Export Data ({transactions.length} rows)
                </div>
                <button
                  onClick={() => {
                    exportData('csv');
                    setShowExportMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Download as CSV</span>
                </button>
                <button
                  onClick={() => {
                    exportData('json');
                    setShowExportMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                >
                  <FileCode className="w-3.5 h-3.5 text-blue-600" />
                  <span>Download as JSON</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Backend API Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-md max-w-sm w-full p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-slate-700" />
                <h3 className="text-xs font-semibold text-slate-900">Backend Daemon Host</h3>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-slate-400 hover:text-slate-600 font-mono text-sm cursor-pointer"
              >
                &times;
              </button>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              PayGuard connects to your FastAPI service running locally or in Docker. When the daemon is offline,
              a calibrated local model emulation engine maintains interactive functionality.
            </p>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-medium text-slate-700">FastAPI Base URL</label>
              <input
                type="text"
                value={tempUrl}
                onChange={e => setTempUrl(e.target.value)}
                placeholder="http://localhost:8000"
                className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white"
              />
            </div>

            <div className="bg-slate-50 p-2.5 rounded border border-slate-100 text-[11px] space-y-1 font-mono text-slate-600">
              <div className="flex justify-between">
                <span>Status:</span>
                <span className={healthStatus.is_live ? 'text-emerald-700 font-semibold' : 'text-slate-500'}>
                  {healthStatus.is_live ? 'Connected (200 OK)' : 'Standby / Local Emulation'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Latency:</span>
                <span>{healthStatus.latency_ms} ms</span>
              </div>
              <div className="flex justify-between">
                <span>Model:</span>
                <span className="truncate max-w-[170px]">{healthStatus.model_version}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  resetApiBaseUrl();
                  setTempUrl('http://localhost:8000');
                }}
                className="px-2.5 py-1.5 text-[11px] text-slate-600 hover:text-slate-900 border border-slate-200 rounded cursor-pointer"
              >
                Reset Default
              </button>
              <button
                type="button"
                onClick={handleSaveConfig}
                className="px-3 py-1.5 text-[11px] font-medium bg-slate-900 hover:bg-slate-800 text-white rounded cursor-pointer"
              >
                Save & Probe
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
