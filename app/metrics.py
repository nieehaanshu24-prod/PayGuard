"""
Prometheus Metrics Exporter for PayGuard Fraud Detection Service.
Tracks real-time API latency (p50, p95, p99), throughput, prediction distribution,
and delayed feedback performance metrics.
"""

from prometheus_client import Counter, Histogram, Summary, Gauge, generate_latest, CONTENT_TYPE_LATEST

# 1. Latency Histogram (measured in seconds)
INFERENCE_LATENCY = Histogram(
    "payguard_inference_latency_seconds",
    "Inference latency distribution in seconds",
    ["model_version"],
    buckets=[0.002, 0.005, 0.010, 0.020, 0.030, 0.050, 0.100, 0.250, 0.500]
)

# 2. Total HTTP requests
REQUESTS_TOTAL = Counter(
    "payguard_requests_total",
    "Total number of HTTP requests received",
    ["endpoint", "status"]
)

# 3. Prediction classification distribution
PREDICTIONS_TOTAL = Counter(
    "payguard_predictions_total",
    "Total transactions scored by outcome",
    ["classification", "risk_level"]
)

# 4. Fraud probability summary
FRAUD_PROBABILITY_SUMMARY = Summary(
    "payguard_fraud_probability",
    "Summary of predicted fraud probabilities"
)

# 5. Delayed Ground Truth Feedback (True Positives, False Positives, etc.)
FEEDBACK_TOTAL = Counter(
    "payguard_feedback_evaluation_total",
    "Delayed feedback comparison against actual fraud labels",
    ["outcome"] # true_positive, false_positive, true_negative, false_negative
)

# 6. Drift status gauge
DRIFT_STATUS_GAUGE = Gauge(
    "payguard_dataset_drift_detected",
    "Gauge set to 1 if feature drift is currently detected, 0 if normal"
)

DRIFT_FEATURE_PSI_GAUGE = Gauge(
    "payguard_feature_psi",
    "Population Stability Index per monitored feature",
    ["feature_name"]
)
