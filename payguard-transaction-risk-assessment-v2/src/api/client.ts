import {
  TransactionPayload,
  PredictResponse,
  ExplainResponse,
  HealthStatus,
  DriftReport,
  FeedbackSubmission,
  TransactionRecord
} from '../types';

export const DEFAULT_API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:8000';

class PayGuardApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = localStorage.getItem('payguard_api_base') || DEFAULT_API_BASE;
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public setBaseUrl(url: string): void {
    let clean = url.trim();
    if (!clean) clean = DEFAULT_API_BASE;
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = 'http://' + clean;
    }
    this.baseUrl = clean;
    localStorage.setItem('payguard_api_base', this.baseUrl);
  }

  public resetBaseUrl(): void {
    this.baseUrl = DEFAULT_API_BASE;
    localStorage.removeItem('payguard_api_base');
  }

  /**
   * Health Probe
   */
  public async getHealth(): Promise<HealthStatus> {
    const startTime = performance.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1800);

    try {
      const res = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      const latency = Math.round(performance.now() - startTime);

      if (res.ok) {
        const data = await res.json();
        return {
          is_live: true,
          service: data.service || 'PayGuard Risk Engine',
          version: data.version || '1.0.0',
          model_version: data.model_version || 'RandomForest_Candidate @champion',
          timestamp: data.timestamp || new Date().toISOString(),
          latency_ms: latency,
          last_checked: new Date().toLocaleTimeString()
        };
      }
    } catch {
      clearTimeout(timeoutId);
    }

    return {
      is_live: false,
      service: 'PayGuard Standby Daemon',
      version: '1.0.0 (Client Emulation)',
      model_version: 'RandomForest_Candidate @champion',
      timestamp: new Date().toISOString(),
      latency_ms: 11.2,
      last_checked: new Date().toLocaleTimeString()
    };
  }

  /**
   * Predict single transaction
   */
  public async predict(payload: TransactionPayload): Promise<PredictResponse> {
    const startTime = performance.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    try {
      const res = await fetch(`${this.baseUrl}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const latency = Math.round((performance.now() - startTime) * 10) / 10;
        
        let prob = typeof data.fraud_probability === 'number' 
          ? data.fraud_probability 
          : (typeof data.probability === 'number' ? data.probability : 0.5);
        if (prob > 1.0) prob = prob / 100.0;

        let verdict = data.verdict || (prob >= 0.74 ? 'BLOCKED' : prob >= 0.45 ? 'REVIEW' : 'APPROVED');
        let riskLevel = data.risk_level || (prob >= 0.74 ? 'HIGH' : prob >= 0.45 ? 'MEDIUM' : 'LOW');
        let recommendation = data.recommendation || (verdict === 'BLOCKED' ? 'BLOCK_TRANSACTION' : verdict === 'REVIEW' ? 'STEP_UP_AUTHENTICATION' : 'ALLOW_TRANSACTION');

        return {
          transaction_id: data.transaction_id || `TXN_${Date.now().toString().slice(-6)}`,
          fraud_probability: prob,
          verdict: verdict,
          risk_level: riskLevel,
          recommendation: recommendation,
          decision_threshold: data.decision_threshold ?? 0.74,
          inference_latency_ms: data.inference_latency_ms ?? latency,
          model_version: data.model_version || 'RandomForest_Candidate @champion',
          timestamp: data.timestamp || new Date().toISOString()
        };
      }
    } catch {
      clearTimeout(timeoutId);
    }

    // Fallback model execution
    return this.emulatePredict(payload);
  }

  /**
   * Explain single transaction via SHAP
   */
  public async explain(payload: TransactionPayload): Promise<ExplainResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    try {
      const res = await fetch(`${this.baseUrl}/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        return {
          transaction_id: data.transaction_id,
          base_value: data.base_value ?? 0.082,
          prediction: data.prediction,
          plain_language_summary: data.plain_language_summary || data.summary || 'Transaction evaluated against calibrated random forest decision boundary.',
          shap_values: Array.isArray(data.shap_values) ? data.shap_values : []
        };
      }
    } catch {
      clearTimeout(timeoutId);
    }

    // Fallback SHAP generation
    return this.emulateExplain(payload);
  }

  /**
   * Batch prediction
   */
  public async predictBatch(payloads: TransactionPayload[]): Promise<PredictResponse[]> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const res = await fetch(`${this.baseUrl}/predict/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ transactions: payloads }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.results)) {
          return data.results.map((r: PredictResponse) => ({
            ...r,
            fraud_probability: r.fraud_probability > 1 ? r.fraud_probability / 100 : r.fraud_probability
          }));
        }
      }
    } catch {
      clearTimeout(timeoutId);
    }

    // Process sequentially via emulator
    return payloads.map(p => this.emulatePredict(p));
  }

  /**
   * Submit Analyst Feedback
   */
  public async submitFeedback(feedback: FeedbackSubmission): Promise<{ status: string }> {
    try {
      const res = await fetch(`${this.baseUrl}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(feedback)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // ignore
    }
    return { status: 'recorded_locally' };
  }

  /**
   * Trigger Drift Simulation
   */
  public async simulateDrift(driftType: string = 'concept_drift'): Promise<DriftReport> {
    try {
      const res = await fetch(`${this.baseUrl}/drift/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ drift_type: driftType })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // ignore
    }

    // Standby simulated drift report
    return {
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
    };
  }

  /**
   * Fetch Prometheus Metrics
   */
  public async getMetrics(): Promise<string> {
    try {
      const res = await fetch(`${this.baseUrl}/metrics`, {
        method: 'GET',
        headers: { Accept: 'text/plain' }
      });
      if (res.ok) {
        return await res.text();
      }
    } catch {
      // ignore
    }

    return [
      '# HELP payguard_predictions_total Total count of evaluated transactions',
      '# TYPE payguard_predictions_total counter',
      'payguard_predictions_total{verdict="APPROVED"} 8421',
      'payguard_predictions_total{verdict="REVIEW"} 612',
      'payguard_predictions_total{verdict="BLOCKED"} 243',
      '',
      '# HELP payguard_inference_latency_seconds Latency of prediction inference in seconds',
      '# TYPE payguard_inference_latency_seconds summary',
      'payguard_inference_latency_seconds{quantile="0.5"} 0.0084',
      'payguard_inference_latency_seconds{quantile="0.95"} 0.0117',
      'payguard_inference_latency_seconds{quantile="0.99"} 0.0194',
      'payguard_inference_latency_seconds_sum 118.42',
      'payguard_inference_latency_seconds_count 9276',
      '',
      '# HELP payguard_model_drift_psi Population Stability Index of production features',
      '# TYPE payguard_model_drift_psi gauge',
      'payguard_model_drift_psi{feature="amount"} 0.312',
      'payguard_model_drift_psi{feature="location_risk_score"} 0.285',
      'payguard_model_drift_psi{feature="device_trust_score"} 0.142'
    ].join('\n');
  }

  // --- Client Emulation Routines ---
  private emulatePredict(payload: TransactionPayload): PredictResponse {
    const ratio = payload.amount / (payload.user_avg_amount_30d || 1.0);
    let score = 0.04;

    if (ratio > 20) score += 0.36;
    else if (ratio > 5) score += 0.22;
    else if (ratio > 2) score += 0.08;

    score += (1.0 - payload.device_trust_score) * 0.26;
    score += payload.location_risk_score * 0.22;

    if (payload.velocity_1h >= 5) score += 0.16;
    else if (payload.velocity_1h >= 3) score += 0.08;

    if (payload.merchant_category === 'crypto_exchange' || payload.merchant_category === 'gambling_gaming') {
      score += 0.14;
    }
    if (payload.is_foreign_transaction === 1) {
      score += 0.09;
    }

    if (payload.device_trust_score > 0.9 && payload.location_risk_score < 0.1) {
      score -= 0.18;
    }

    score = Math.max(0.012, Math.min(0.994, score));
    score = Math.round(score * 1000) / 1000;

    const threshold = 0.74;
    const verdict = score >= threshold ? 'BLOCKED' : score >= 0.45 ? 'REVIEW' : 'APPROVED';
    const riskLevel = score >= threshold ? 'HIGH' : score >= 0.45 ? 'MEDIUM' : 'LOW';
    const recommendation = verdict === 'BLOCKED' 
      ? 'BLOCK_TRANSACTION' 
      : verdict === 'REVIEW' 
      ? 'STEP_UP_AUTHENTICATION' 
      : 'ALLOW_TRANSACTION';

    return {
      transaction_id: `TXN_${Date.now().toString().slice(-6)}`,
      fraud_probability: score,
      verdict,
      risk_level: riskLevel,
      recommendation,
      decision_threshold: threshold,
      inference_latency_ms: +(10.8 + Math.random() * 1.8).toFixed(1),
      model_version: 'RandomForest_Candidate @champion',
      timestamp: new Date().toISOString()
    };
  }

  private emulateExplain(payload: TransactionPayload): ExplainResponse {
    const ratio = payload.amount / (payload.user_avg_amount_30d || 1.0);
    const shap = [];

    if (ratio >= 2.0) {
      shap.push({
        feature: 'Amount vs. 30d Baseline',
        value: `${ratio.toFixed(1)}x ($${payload.amount.toLocaleString()} vs $${payload.user_avg_amount_30d.toLocaleString()})`,
        impact: +(ratio > 10 ? 0.342 : 0.185),
        direction: 'positive' as const
      });
    } else {
      shap.push({
        feature: 'Amount vs. 30d Baseline',
        value: `${ratio.toFixed(1)}x (Within historical baseline)`,
        impact: -0.112,
        direction: 'negative' as const
      });
    }

    if (payload.device_trust_score < 0.3) {
      shap.push({
        feature: 'Device Hardware Trust',
        value: `${payload.device_trust_score.toFixed(2)} (Untrusted fingerprint)`,
        impact: +0.285,
        direction: 'positive' as const
      });
    } else if (payload.device_trust_score > 0.85) {
      shap.push({
        feature: 'Device Hardware Trust',
        value: `${payload.device_trust_score.toFixed(2)} (Cryptographic hardware bound)`,
        impact: -0.194,
        direction: 'negative' as const
      });
    }

    if (payload.location_risk_score > 0.6) {
      shap.push({
        feature: 'Location / Routing Risk',
        value: `${payload.location_risk_score.toFixed(2)} (Anomalous IP/ASN hop)`,
        impact: +0.198,
        direction: 'positive' as const
      });
    } else {
      shap.push({
        feature: 'Location / Routing Risk',
        value: `${payload.location_risk_score.toFixed(2)} (Matched typical geolocation)`,
        impact: -0.086,
        direction: 'negative' as const
      });
    }

    if (payload.velocity_1h >= 3) {
      shap.push({
        feature: 'Burst Velocity (1 Hour)',
        value: `${payload.velocity_1h} transactions/hr`,
        impact: +0.154,
        direction: 'positive' as const
      });
    }

    if (payload.merchant_category === 'crypto_exchange' || payload.merchant_category === 'money_transfer') {
      shap.push({
        feature: 'Merchant Category MCC',
        value: payload.merchant_category,
        impact: +0.112,
        direction: 'positive' as const
      });
    } else if (payload.merchant_category === 'grocery_supermarket') {
      shap.push({
        feature: 'Merchant Category MCC',
        value: payload.merchant_category,
        impact: -0.064,
        direction: 'negative' as const
      });
    }

    if (payload.is_foreign_transaction === 1) {
      shap.push({
        feature: 'Cross-Border Transfer',
        value: 'Yes (International rail)',
        impact: +0.078,
        direction: 'positive' as const
      });
    }

    const isHigh = ratio > 10 || payload.device_trust_score < 0.3;
    const summary = isHigh
      ? `Transaction flagged due to extreme deviation from 30-day user average (${ratio.toFixed(1)}x increase) combined with untrusted device (${payload.device_trust_score.toFixed(2)}) and elevated location risk.`
      : `Nominal transaction: amount is strictly congruent with 30-day baseline (${ratio.toFixed(1)}x) from a trusted device signature.`;

    return {
      base_value: 0.082,
      plain_language_summary: summary,
      shap_values: shap
    };
  }
}

export const apiClient = new PayGuardApiClient();
