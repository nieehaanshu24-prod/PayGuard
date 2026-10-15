import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  TransactionRecord,
  TransactionPayload,
  HealthStatus,
  NavTab,
  RiskLevel,
  Verdict
} from '../types';
import { apiClient } from '../api/client';

interface DashboardContextType {
  transactions: TransactionRecord[];
  selectedTransaction: TransactionRecord | null;
  setSelectedTransaction: (tx: TransactionRecord | null) => void;
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  healthStatus: HealthStatus;
  isStreaming: boolean;
  streamingTps: number;
  setStreamingTps: (tps: number) => void;
  streamStats: {
    totalStreamed: number;
    flaggedCount: number;
    blockedCount: number;
    currentTps: number;
  };
  timeFilter: 'all' | 'today' | '1h';
  setTimeFilter: (f: 'all' | 'today' | '1h') => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  riskFilter: 'ALL' | RiskLevel;
  setRiskFilter: (r: 'ALL' | RiskLevel) => void;
  verdictFilter: 'ALL' | Verdict;
  setVerdictFilter: (v: 'ALL' | Verdict) => void;
  refreshDashboard: () => Promise<void>;
  evaluateTransaction: (payload: TransactionPayload) => Promise<TransactionRecord>;
  submitFeedback: (txId: string, label: 0 | 1, notes: string) => Promise<void>;
  exportData: (format: 'csv' | 'json') => void;
  startStream: () => void;
  stopStream: () => void;
  clearTransactions: () => void;
  apiBaseUrl: string;
  setApiBaseUrl: (url: string) => void;
  resetApiBaseUrl: () => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

// Initial production-grounded transaction seed
const SEED_TRANSACTIONS: TransactionRecord[] = [
  {
    id: 'TXN_0100_9841',
    timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    user_id: 'USR_0100',
    amount: 2850.0,
    old_balance: 4000.0,
    new_balance: 1150.0,
    user_avg_amount_30d: 50.0,
    channel: 'CREDIT_CARD',
    merchant_category: 'crypto_exchange',
    is_foreign_transaction: 1,
    device_trust_score: 0.08,
    location_risk_score: 0.92,
    velocity_1h: 6,
    velocity_24h: 9,
    fraud_probability: 0.964,
    risk_level: 'HIGH',
    verdict: 'BLOCKED',
    recommendation: 'BLOCK_TRANSACTION',
    decision_threshold: 0.74,
    inference_latency_ms: 11.2,
    model_version: 'RandomForest_Candidate @champion',
    plain_language_summary: 'Transaction flagged due to extreme deviation from 30-day user average (57x increase) combined with untrusted device and crypto merchant velocity.',
    shap_values: [
      { feature: 'Amount vs. 30d Baseline', value: '57.0x ($2,850.00 vs $50.00)', impact: 0.342, direction: 'positive' },
      { feature: 'Device Hardware Trust', value: '0.08 (Untrusted fingerprint)', impact: 0.285, direction: 'positive' },
      { feature: 'Location / Routing Risk', value: '0.92 (Anomalous IP/ASN hop)', impact: 0.198, direction: 'positive' },
      { feature: 'Burst Velocity (1 Hour)', value: '6 transactions/hr', impact: 0.154, direction: 'positive' },
      { feature: 'Merchant Category MCC', value: 'crypto_exchange', impact: 0.112, direction: 'positive' },
      { feature: 'Cross-Border Transfer', value: 'Yes (International rail)', impact: 0.078, direction: 'positive' },
      { feature: 'Payment Rail', value: 'CREDIT_CARD', impact: -0.045, direction: 'negative' }
    ]
  },
  {
    id: 'TXN_0892_1042',
    timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    user_id: 'USR_0892',
    amount: 45.0,
    old_balance: 1840.0,
    new_balance: 1795.0,
    user_avg_amount_30d: 52.5,
    channel: 'UPI',
    merchant_category: 'grocery_supermarket',
    is_foreign_transaction: 0,
    device_trust_score: 0.96,
    location_risk_score: 0.04,
    velocity_1h: 1,
    velocity_24h: 2,
    fraud_probability: 0.038,
    risk_level: 'LOW',
    verdict: 'APPROVED',
    recommendation: 'ALLOW_TRANSACTION',
    decision_threshold: 0.74,
    inference_latency_ms: 9.8,
    model_version: 'RandomForest_Candidate @champion',
    plain_language_summary: 'Nominal transaction: amount is strictly congruent with 30-day baseline (0.9x) from a verified hardware signature.',
    shap_values: [
      { feature: 'Amount vs. 30d Baseline', value: '0.9x ($45.00 vs $52.50)', impact: -0.112, direction: 'negative' },
      { feature: 'Device Hardware Trust', value: '0.96 (Hardware cryptographically bound)', impact: -0.194, direction: 'negative' },
      { feature: 'Location / Routing Risk', value: '0.04 (Matched typical geolocation)', impact: -0.086, direction: 'negative' },
      { feature: 'Merchant Category MCC', value: 'grocery_supermarket', impact: -0.064, direction: 'negative' }
    ]
  },
  {
    id: 'TXN_0411_3329',
    timestamp: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
    user_id: 'USR_0411',
    amount: 680.0,
    old_balance: 3100.0,
    new_balance: 2420.0,
    user_avg_amount_30d: 120.0,
    channel: 'DEBIT_CARD',
    merchant_category: 'electronics_retail',
    is_foreign_transaction: 0,
    device_trust_score: 0.65,
    location_risk_score: 0.48,
    velocity_1h: 3,
    velocity_24h: 5,
    fraud_probability: 0.582,
    risk_level: 'MEDIUM',
    verdict: 'REVIEW',
    recommendation: 'STEP_UP_AUTHENTICATION',
    decision_threshold: 0.74,
    inference_latency_ms: 10.4,
    model_version: 'RandomForest_Candidate @champion',
    plain_language_summary: 'Elevated risk: 5.6x deviation from baseline amount and elevated 1h velocity on electronics merchant. Step-up authorization recommended.',
    shap_values: [
      { feature: 'Amount vs. 30d Baseline', value: '5.6x ($680.00 vs $120.00)', impact: 0.185, direction: 'positive' },
      { feature: 'Burst Velocity (1 Hour)', value: '3 transactions/hr', impact: 0.082, direction: 'positive' },
      { feature: 'Location / Routing Risk', value: '0.48 (Roaming city)', impact: 0.048, direction: 'positive' },
      { feature: 'Device Hardware Trust', value: '0.65 (Known browser cookie)', impact: -0.042, direction: 'negative' }
    ]
  },
  {
    id: 'TXN_0512_8120',
    timestamp: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
    user_id: 'USR_0512',
    amount: 14.20,
    old_balance: 620.0,
    new_balance: 605.80,
    user_avg_amount_30d: 18.0,
    channel: 'UPI',
    merchant_category: 'grocery_supermarket',
    is_foreign_transaction: 0,
    device_trust_score: 0.94,
    location_risk_score: 0.02,
    velocity_1h: 1,
    velocity_24h: 1,
    fraud_probability: 0.024,
    risk_level: 'LOW',
    verdict: 'APPROVED',
    recommendation: 'ALLOW_TRANSACTION',
    decision_threshold: 0.74,
    inference_latency_ms: 8.9,
    model_version: 'RandomForest_Candidate @champion'
  },
  {
    id: 'TXN_0771_9024',
    timestamp: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    user_id: 'USR_0771',
    amount: 4100.0,
    old_balance: 5000.0,
    new_balance: 900.0,
    user_avg_amount_30d: 85.0,
    channel: 'NET_BANKING',
    merchant_category: 'money_transfer',
    is_foreign_transaction: 1,
    device_trust_score: 0.04,
    location_risk_score: 0.98,
    velocity_1h: 7,
    velocity_24h: 12,
    fraud_probability: 0.988,
    risk_level: 'HIGH',
    verdict: 'BLOCKED',
    recommendation: 'BLOCK_TRANSACTION',
    decision_threshold: 0.74,
    inference_latency_ms: 12.1,
    model_version: 'RandomForest_Candidate @champion',
    plain_language_summary: 'Severe risk: Untrusted device signature with near-total account balance depletion via international money transfer.'
  },
  {
    id: 'TXN_0319_4411',
    timestamp: new Date(Date.now() - 48 * 60 * 1000).toISOString(),
    user_id: 'USR_0319',
    amount: 88.50,
    old_balance: 1420.0,
    new_balance: 1331.50,
    user_avg_amount_30d: 90.0,
    channel: 'CREDIT_CARD',
    merchant_category: 'digital_services',
    is_foreign_transaction: 0,
    device_trust_score: 0.91,
    location_risk_score: 0.08,
    velocity_1h: 2,
    velocity_24h: 3,
    fraud_probability: 0.052,
    risk_level: 'LOW',
    verdict: 'APPROVED',
    recommendation: 'ALLOW_TRANSACTION',
    decision_threshold: 0.74,
    inference_latency_ms: 9.4,
    model_version: 'RandomForest_Candidate @champion'
  }
];

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<TransactionRecord[]>(SEED_TRANSACTIONS);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionRecord | null>(SEED_TRANSACTIONS[0]);
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [healthStatus, setHealthStatus] = useState<HealthStatus>({
    is_live: false,
    service: 'PayGuard Risk Engine',
    version: '1.0.0',
    model_version: 'RandomForest_Candidate @champion',
    timestamp: new Date().toISOString(),
    latency_ms: 11.2,
    last_checked: new Date().toLocaleTimeString()
  });

  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [streamingTps, setStreamingTps] = useState<number>(2);
  const [streamStats, setStreamStats] = useState({
    totalStreamed: 0,
    flaggedCount: 0,
    blockedCount: 0,
    currentTps: 0
  });

  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | '1h'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [riskFilter, setRiskFilter] = useState<'ALL' | RiskLevel>('ALL');
  const [verdictFilter, setVerdictFilter] = useState<'ALL' | Verdict>('ALL');
  const [apiBaseUrl, setApiBaseUrlState] = useState<string>(apiClient.getBaseUrl());

  const streamTimerRef = useRef<NodeJS.Timeout | null>(null);

  const checkHealth = useCallback(async () => {
    const status = await apiClient.getHealth();
    setHealthStatus(status);
  }, []);

  useEffect(() => {
    checkHealth();
    apiClient.getSampleTransactions(20).then(samples => {
      if (samples && samples.length > 0) {
        setTransactions(samples);
        setSelectedTransaction(samples[0]);
      }
    });
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  const setApiBaseUrl = (url: string) => {
    apiClient.setBaseUrl(url);
    setApiBaseUrlState(apiClient.getBaseUrl());
    checkHealth();
  };

  const resetApiBaseUrl = () => {
    apiClient.resetBaseUrl();
    setApiBaseUrlState(apiClient.getBaseUrl());
    checkHealth();
  };

  const refreshDashboard = async () => {
    await checkHealth();
  };

  const evaluateTransaction = async (payload: TransactionPayload): Promise<TransactionRecord> => {
    const [predictRes, explainRes] = await Promise.all([
      apiClient.predict(payload),
      apiClient.explain(payload)
    ]);

    const newRecord: TransactionRecord = {
      ...payload,
      id: predictRes.transaction_id || `TXN_${Date.now().toString().slice(-6)}`,
      timestamp: predictRes.timestamp || new Date().toISOString(),
      fraud_probability: predictRes.fraud_probability,
      risk_level: (predictRes.risk_level as RiskLevel) || (predictRes.fraud_probability >= 0.74 ? 'HIGH' : predictRes.fraud_probability >= 0.45 ? 'MEDIUM' : 'LOW'),
      verdict: (predictRes.verdict as Verdict) || (predictRes.fraud_probability >= 0.74 ? 'BLOCKED' : predictRes.fraud_probability >= 0.45 ? 'REVIEW' : 'APPROVED'),
      recommendation: (predictRes.recommendation as any) || (predictRes.fraud_probability >= 0.74 ? 'BLOCK_TRANSACTION' : predictRes.fraud_probability >= 0.45 ? 'STEP_UP_AUTHENTICATION' : 'ALLOW_TRANSACTION'),
      decision_threshold: predictRes.decision_threshold ?? 0.74,
      inference_latency_ms: predictRes.inference_latency_ms ?? 11.2,
      model_version: predictRes.model_version || 'RandomForest_Candidate @champion',
      plain_language_summary: explainRes.plain_language_summary,
      shap_values: explainRes.shap_values
    };

    setTransactions(prev => [newRecord, ...prev]);
    setSelectedTransaction(newRecord);
    return newRecord;
  };

  const submitFeedback = async (txId: string, label: 0 | 1, notes: string) => {
    await apiClient.submitFeedback({
      transaction_id: txId,
      actual_label: label,
      analyst_notes: notes,
      analyst_id: 'ANALYST_01'
    });

    setTransactions(prev =>
      prev.map(t => (t.id === txId ? { ...t, feedback_logged: true } : t))
    );
    if (selectedTransaction && selectedTransaction.id === txId) {
      setSelectedTransaction(prev => (prev ? { ...prev, feedback_logged: true } : null));
    }
  };

  // Real-time Traffic Simulator loop (compatible with scripts/stream_traffic.py client payload)
  const generateSimulatedTransaction = useCallback((): TransactionPayload => {
    const isAnomalous = Math.random() < 0.22; // ~22% anomaly distribution
    const channels = ['UPI', 'CREDIT_CARD', 'DEBIT_CARD', 'NET_BANKING', 'WALLET'];
    const categories = ['grocery_supermarket', 'crypto_exchange', 'electronics_retail', 'luxury_goods', 'money_transfer', 'digital_services'];
    
    const userNum = Math.floor(100 + Math.random() * 900);
    const channel = channels[Math.floor(Math.random() * channels.length)];

    if (isAnomalous) {
      const avg = Math.floor(40 + Math.random() * 80);
      const mult = 15 + Math.random() * 45;
      const amount = Math.round(avg * mult * 100) / 100;
      const oldBal = amount + Math.floor(Math.random() * 2000);
      const newBal = oldBal - amount;

      return {
        user_id: `USR_${userNum}`,
        amount,
        old_balance: oldBal,
        new_balance: newBal,
        user_avg_amount_30d: avg,
        channel,
        merchant_category: Math.random() < 0.6 ? 'crypto_exchange' : 'money_transfer',
        is_foreign_transaction: Math.random() < 0.7 ? 1 : 0,
        device_trust_score: Math.round((0.02 + Math.random() * 0.25) * 100) / 100,
        location_risk_score: Math.round((0.75 + Math.random() * 0.23) * 100) / 100,
        velocity_1h: Math.floor(4 + Math.random() * 6),
        velocity_24h: Math.floor(8 + Math.random() * 10)
      };
    } else {
      const avg = Math.floor(30 + Math.random() * 150);
      const mult = 0.4 + Math.random() * 1.4;
      const amount = Math.round(avg * mult * 100) / 100;
      const oldBal = amount + Math.floor(1000 + Math.random() * 4000);
      const newBal = oldBal - amount;

      return {
        user_id: `USR_${userNum}`,
        amount,
        old_balance: oldBal,
        new_balance: newBal,
        user_avg_amount_30d: avg,
        channel,
        merchant_category: categories[Math.floor(Math.random() * categories.length)],
        is_foreign_transaction: Math.random() < 0.08 ? 1 : 0,
        device_trust_score: Math.round((0.85 + Math.random() * 0.14) * 100) / 100,
        location_risk_score: Math.round((0.02 + Math.random() * 0.15) * 100) / 100,
        velocity_1h: Math.floor(1 + Math.random() * 2),
        velocity_24h: Math.floor(1 + Math.random() * 4)
      };
    }
  }, []);

  const startStream = useCallback(() => {
    if (isStreaming) return;
    setIsStreaming(true);

    const intervalMs = Math.max(200, Math.floor(1000 / streamingTps));

    streamTimerRef.current = setInterval(async () => {
      let record: TransactionRecord | null = await apiClient.getStreamNextTransaction();

      if (!record) {
        const payload = generateSimulatedTransaction();
        const predictRes = await apiClient.predict(payload);

        record = {
          ...payload,
          id: predictRes.transaction_id || `TXN_${Date.now().toString().slice(-6)}`,
          timestamp: new Date().toISOString(),
          fraud_probability: predictRes.fraud_probability,
          risk_level: (predictRes.risk_level as RiskLevel) || (predictRes.fraud_probability >= 0.74 ? 'HIGH' : predictRes.fraud_probability >= 0.45 ? 'MEDIUM' : 'LOW'),
          verdict: (predictRes.verdict as Verdict) || (predictRes.fraud_probability >= 0.74 ? 'BLOCKED' : predictRes.fraud_probability >= 0.45 ? 'REVIEW' : 'APPROVED'),
          recommendation: (predictRes.recommendation as any) || (predictRes.fraud_probability >= 0.74 ? 'BLOCK_TRANSACTION' : predictRes.fraud_probability >= 0.45 ? 'STEP_UP_AUTHENTICATION' : 'ALLOW_TRANSACTION'),
          decision_threshold: predictRes.decision_threshold ?? 0.74,
          inference_latency_ms: predictRes.inference_latency_ms ?? 11.2,
          model_version: predictRes.model_version || 'RandomForest_Candidate @champion',
          is_simulated: true
        };
      }

      const activeRecord = record;
      setTransactions(prev => [activeRecord, ...prev.slice(0, 199)]);
      setStreamStats(prev => ({
        totalStreamed: prev.totalStreamed + 1,
        flaggedCount: prev.flaggedCount + (activeRecord.verdict === 'REVIEW' ? 1 : 0),
        blockedCount: prev.blockedCount + (activeRecord.verdict === 'BLOCKED' ? 1 : 0),
        currentTps: streamingTps
      }));
    }, intervalMs);
  }, [isStreaming, streamingTps, generateSimulatedTransaction]);

  const stopStream = useCallback(() => {
    if (streamTimerRef.current) {
      clearInterval(streamTimerRef.current);
      streamTimerRef.current = null;
    }
    setIsStreaming(false);
    setStreamStats(prev => ({ ...prev, currentTps: 0 }));
  }, []);

  useEffect(() => {
    return () => {
      if (streamTimerRef.current) {
        clearInterval(streamTimerRef.current);
      }
    };
  }, []);

  const clearTransactions = () => {
    setTransactions([]);
    setSelectedTransaction(null);
  };

  const exportData = (format: 'csv' | 'json') => {
    if (transactions.length === 0) return;

    if (format === 'json') {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(transactions, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `payguard_transactions_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } else {
      const headers = ['id', 'timestamp', 'user_id', 'amount', 'channel', 'merchant_category', 'fraud_probability', 'risk_level', 'verdict', 'inference_latency_ms'];
      const rows = transactions.map(t => [
        t.id,
        t.timestamp,
        t.user_id,
        t.amount,
        t.channel,
        t.merchant_category,
        t.fraud_probability,
        t.risk_level,
        t.verdict,
        t.inference_latency_ms
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `payguard_transactions_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  };

  return (
    <DashboardContext.Provider
      value={{
        transactions,
        selectedTransaction,
        setSelectedTransaction,
        activeTab,
        setActiveTab,
        healthStatus,
        isStreaming,
        streamingTps,
        setStreamingTps,
        streamStats,
        timeFilter,
        setTimeFilter,
        searchQuery,
        setSearchQuery,
        riskFilter,
        setRiskFilter,
        verdictFilter,
        setVerdictFilter,
        refreshDashboard,
        evaluateTransaction,
        submitFeedback,
        exportData,
        startStream,
        stopStream,
        clearTransactions,
        apiBaseUrl,
        setApiBaseUrl,
        resetApiBaseUrl
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};
