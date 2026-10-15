export type PaymentRail = 'UPI' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'NET_BANKING' | 'WALLET';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type Verdict = 'APPROVED' | 'REVIEW' | 'BLOCKED';

export type Recommendation = 'ALLOW_TRANSACTION' | 'STEP_UP_AUTHENTICATION' | 'BLOCK_TRANSACTION';

export interface ShapValue {
  feature: string;
  value: string;
  impact: number;
  direction: 'positive' | 'negative';
}

export interface TransactionPayload {
  user_id: string;
  amount: number;
  old_balance: number;
  new_balance: number;
  user_avg_amount_30d: number;
  channel: PaymentRail | string;
  merchant_category: string;
  is_foreign_transaction: number;
  device_trust_score: number;
  location_risk_score: number;
  velocity_1h: number;
  velocity_24h: number;
}

export interface PredictResponse {
  transaction_id?: string;
  fraud_probability: number;
  verdict?: Verdict | string;
  risk_level?: RiskLevel | string;
  recommendation?: Recommendation | string;
  decision_threshold?: number;
  inference_latency_ms?: number;
  model_version?: string;
  timestamp?: string;
}

export interface ExplainResponse {
  transaction_id?: string;
  base_value?: number;
  prediction?: number;
  plain_language_summary: string;
  shap_values: ShapValue[];
}

export interface TransactionRecord extends TransactionPayload {
  id: string;
  timestamp: string;
  fraud_probability: number;
  risk_level: RiskLevel;
  verdict: Verdict;
  recommendation: Recommendation;
  decision_threshold: number;
  inference_latency_ms: number;
  model_version: string;
  is_simulated?: boolean;
  shap_values?: ShapValue[];
  plain_language_summary?: string;
  feedback_logged?: boolean;
}

export interface HealthStatus {
  is_live: boolean;
  service: string;
  version: string;
  model_version: string;
  timestamp: string;
  latency_ms: number;
  last_checked: string;
}

export interface DriftFeatureDetail {
  feature: string;
  psi: number;
  status: 'DRIFT_ALERT' | 'MODERATE' | 'STABLE';
  ks_p_value: number;
}

export interface DriftReport {
  status: 'drift_detected' | 'nominal';
  overall_psi: number;
  drift_threshold: number;
  features_monitored: number;
  drifted_features: string[];
  timestamp: string;
  details: DriftFeatureDetail[];
}

export interface FeedbackSubmission {
  transaction_id: string;
  actual_label: 0 | 1;
  analyst_notes: string;
  analyst_id: string;
}

export interface ModelMetricsData {
  model_name: string;
  version: string;
  stage: string;
  pr_auc: number;
  roc_auc: number;
  precision: number;
  recall: number;
  f1: number;
  accuracy: number;
  latency_p50: number;
  latency_p95: number;
  latency_p99: number;
  confusion_matrix: {
    tp: number;
    fp: number;
    tn: number;
    fn: number;
  };
  dataset_records: number;
  features_count: number;
  last_trained: string;
}

export type NavTab = 
  | 'dashboard'
  | 'transaction_analysis'
  | 'live_streaming'
  | 'model_performance'
  | 'drift_monitoring'
  | 'explainability'
  | 'system_health';
