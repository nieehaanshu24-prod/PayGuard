# PayGuard: Digital Payment Fraud Detection & MLOps Platform

PayGuard is an end-to-end fintech fraud risk-management console and MLOps monitoring platform designed for real-time transaction scoring, calibrated decision boundaries, and TreeSHAP explainability.

---

## 1. System Architecture

```
┌──────────────────────────────────────────────┐
│        PayGuard React 19 Frontend            │
│  (Tailwind 4, TypeScript, Lucide Icons)      │
└──────────────────────┬───────────────────────┘
                       │ HTTP / JSON
                       ▼
┌──────────────────────────────────────────────┐
│          FastAPI Prediction Engine           │
│  ├── GET  /health                            │
│  ├── POST /predict                           │
│  ├── POST /predict/batch                     │
│  ├── POST /explain    (TreeSHAP)             │
│  ├── POST /feedback   (MLflow Feedback Buffer│
│  ├── POST /drift/simulate                    │
│  └── GET  /metrics    (Prometheus OpenMetrics│
└──────────────────────┬───────────────────────┘
                       │
       ┌───────────────┴───────────────┐
       ▼                               ▼
┌──────────────┐              ┌─────────────────┐
│ MLflow Model │              │ Prometheus /    │
│  Registry    │              │ Grafana Metrics │
└──────────────┘              └─────────────────┘
```

---

## 2. Environment Variables

Create or configure `.env` (derived from `.env.example`):

```bash
# FastAPI Base URL (Defaults to http://localhost:8000)
VITE_API_BASE_URL="http://localhost:8000"
```

*Note: The frontend also includes a live runtime endpoint selector in the top header to configure or probe different daemon URLs without rebuilding.*

---

## 3. Quick Start Guide

### Step 1: Start the FastAPI Backend
Ensure your Python virtual environment is activated and start the FastAPI service:
```bash
# Start FastAPI daemon
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Verify backend health:
```bash
curl http://localhost:8000/health
# Expected: {"status":"healthy","service":"PayGuard Risk Engine","version":"1.0.0"}
```

### Step 2: Start the Frontend Dashboard
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Step 3: Run the Real-Time Streaming Traffic Simulator
Stream synthetic payment traffic into the running FastAPI daemon:
```bash
python scripts/stream_transactions.py --api-url http://localhost:8000 --rate 2
```
*You can also use the integrated browser-based stream controls directly in the "Live Transactions" tab.*

### Step 4: Run with Docker Compose
If running the entire stack via Docker:
```bash
docker-compose up --build -d
```

---

## 4. Key Dashboard Capabilities

1. **Executive Dashboard**:
   - Live Session Summary KPI cards (Total processed, Step-up/review count, Blocked count, Average fraud probability).
   - Time range filter (`All Time`, `Today`, `Last 1h`).
   - Central Interactive Ledger with multi-field search, column sorting, pagination, and risk/verdict filtering.

2. **Transaction Analysis**:
   - Single Transaction evaluator with pre-calibrated test scenarios:
     - *Authentic Grocery Purchase (UPI · $45.00)* &rarr; Approved (~3.8% risk score)
     - *Anomalous Midnight Transfer (Credit Card · $2,850.00)* &rarr; Blocked (96.4% risk score)
   - Real-time evaluation via `POST /predict` and `POST /explain`.
   - Batch evaluator submitting concurrent arrays to `POST /predict/batch`.

3. **Live Transactions & Simulator**:
   - Start / Stop stream controls with variable velocity (1, 2, 5 TPS).
   - Real-time event ticker displaying incoming probabilities, verdicts, and latencies.
   - CLI execution guide for external Python streamers.

4. **Model Performance**:
   - Offline evaluation metrics: PR-AUC (0.984), ROC-AUC (0.991), Precision (0.942), Recall (0.918), F1 (0.930).
   - Confusion Matrix breakdown on held-out test data.
   - Latency percentiles (p50: 8.4ms, p95: 11.75ms, p99: 19.4ms) verified against SLA.

5. **Drift Monitoring**:
   - Population Stability Index (PSI) and Kolmogorov-Smirnov (KS-test) p-values.
   - Functional "Simulate Drift" trigger connected to `POST /drift/simulate`.

6. **Model Explainability**:
   - Global feature importance ranking (Mean |SHAP|).
   - Local waterfall log-odds contribution breakdown.
   - Transparent disclaimer on game-theoretic Shapley value interpretations.

7. **System Health & Observability**:
   - Live endpoint registry and latency probes.
   - Raw Prometheus OpenMetrics buffer viewer (`GET /metrics`).
   - Ground-truth feedback loop submission (`POST /feedback`).

---

## 5. Decision Boundaries & Policies

| Fraud Probability | Risk Tier | Decision Policy | Recommendation | Action Badge |
| :--- | :--- | :--- | :--- | :--- |
| **0.00% – 44.99%** | LOW | Nominal Transaction | `ALLOW_TRANSACTION` | Soft Sage (`APPROVED`) |
| **45.00% – 73.99%** | MEDIUM | Elevated Anomaly | `STEP_UP_AUTHENTICATION` | Muted Amber (`REVIEW`) |
| **&ge; 74.00%** | HIGH | Critical Risk Boundary | `BLOCK_TRANSACTION` | Understated Rose (`BLOCKED`) |
