import React from 'react';
import { DashboardProvider, useDashboard } from './context/DashboardContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { TransactionDetailsModal } from './components/TransactionDetailsModal';
import { DashboardView } from './components/views/DashboardView';
import { TransactionAnalysisView } from './components/views/TransactionAnalysisView';
import { LiveStreamingView } from './components/views/LiveStreamingView';
import { ModelPerformanceView } from './components/views/ModelPerformanceView';
import { DriftMonitoringView } from './components/views/DriftMonitoringView';
import { ExplainabilityView } from './components/views/ExplainabilityView';
import { SystemHealthView } from './components/views/SystemHealthView';

const DashboardContent: React.FC = () => {
  const { activeTab } = useDashboard();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-slate-200">
      {/* Top Header */}
      <Header />

      {/* Main Viewport Split with Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Fixed Left Sidebar */}
        <Sidebar />

        {/* Scrollable View Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7 max-w-7xl mx-auto w-full">
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'transaction_analysis' && <TransactionAnalysisView />}
          {activeTab === 'live_streaming' && <LiveStreamingView />}
          {activeTab === 'model_performance' && <ModelPerformanceView />}
          {activeTab === 'drift_monitoring' && <DriftMonitoringView />}
          {activeTab === 'explainability' && <ExplainabilityView />}
          {activeTab === 'system_health' && <SystemHealthView />}
        </main>
      </div>

      {/* Slide-over Transaction Details Dossier */}
      <TransactionDetailsModal />
    </div>
  );
};

export default function App() {
  return (
    <DashboardProvider>
      <DashboardContent />
    </DashboardProvider>
  );
}
