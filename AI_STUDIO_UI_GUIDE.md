# Google AI Studio Integration Guide for PayGuard

This guide provides instructions and templates to build your frontend/investigation UI in **Google AI Studio** connected to the PayGuard Real-Time Fraud Detection REST service.

---

## 1. Architecture Overview

```
+------------------------------------+
|  Google AI Studio / Gemini Prompt  |  <--- (UI / Natural Language Copilot)
+------------------------------------+
                 |
                 | HTTP POST /predict & /explain
                 v
+------------------------------------+
|   PayGuard FastAPI Engine (:8000)   |  <--- (Sub-15ms ML Inference & SHAP)
+------------------------------------+
```

---

## 2. API Contract & Endpoints

Base URL: `http://localhost:8000` (or your deployed server IP)
Full OpenAPI Spec: Generated in [`api_spec.json`](./api_spec.json).

### Key Endpoints:
1. `POST /predict`: Real-time transaction scoring with sub-12ms latency.
2. `POST /explain`: SHAP-based feature attribution explanation.
3. `POST /predict/batch`: Concurrent multi-transaction batch evaluation.
4. `POST /feedback`: Delayed ground truth reporting (True Positive / False Positive tracking).
5. `POST /drift/simulate`: Production data drift analysis (KS-test & PSI).
6. `GET /model/metadata`: Live champion model metadata, MLflow run ID, metrics, and savings.
7. `GET /model/feature-importance`: Real Random Forest Gini feature importances.
8. `GET /transactions/sample`: Scored transactions sampled from the 15,000-row DVC dataset.
9. `GET /transactions/stream-next`: Real-time streaming transaction feed.

---

## 3. Recommended AI Studio Prompt Template

In Google AI Studio (Create New Prompt -> System Instructions), paste the following system prompt:

```text
You are PayGuard Copilot, an expert AI banking security analyst for digital payments fraud.
Your job is to analyze incoming transaction telemetry, interact with the PayGuard REST API, and present a clear, human-readable fraud investigation report for fraud department operations.

When an analyst provides a transaction scenario:
1. Format and send the transaction payload to the PayGuard API:
   - Endpoint: POST http://localhost:8000/predict
   - Endpoint: POST http://localhost:8000/explain
2. Present the result clearly with:
   - VERDICT: [APPROVED | REVIEW | BLOCKED]
   - FRAUD PROBABILITY: (e.g. 96.4%)
   - ACTION RECOMMENDATION: [APPROVE | STEP_UP_AUTHENTICATION | BLOCK_TRANSACTION]
   - TOP DRIVING FACTORS (from SHAP values):
     * Highlight why the transaction was flagged (e.g., velocity surge, unfamiliar midnight hour, low device trust).
   - SUGGESTED NEXT STEPS: What action the bank customer agent should take.
```

---

## 4. Test Payloads to Use in AI Studio

### Test Case A: Normal Everyday Grocery Payment (Legitimate)
```json
{
  "transaction_id": "TXN_LEGIT_TEST_01",
  "timestamp": "2026-10-05 14:15:00",
  "user_id": "USR_0100",
  "amount": 42.50,
  "old_balance": 3500.00,
  "new_balance": 3457.50,
  "user_avg_amount_30d": 50.00,
  "channel": "UPI",
  "merchant_category": "grocery",
  "is_foreign_transaction": 0,
  "device_trust_score": 0.95,
  "location_risk_score": 0.05,
  "velocity_1h": 0,
  "velocity_24h": 1
}
```
**Expected Output**: Risk: `LOW`, Verdict: `APPROVED`, Latency: `< 15ms`.

---

### Test Case B: Stolen Card Midnight Bot Attack (Fraudulent)
```json
{
  "transaction_id": "TXN_FRAUD_ATTACK_02",
  "timestamp": "2026-10-05 02:45:10",
  "user_id": "USR_0100",
  "amount": 2850.00,
  "old_balance": 4000.00,
  "new_balance": 1150.00,
  "user_avg_amount_30d": 50.00,
  "channel": "CREDIT_CARD",
  "merchant_category": "crypto_exchange",
  "is_foreign_transaction": 1,
  "device_trust_score": 0.08,
  "location_risk_score": 0.92,
  "velocity_1h": 6,
  "velocity_24h": 9
}
```
**Expected Output**: Risk: `HIGH`, Verdict: `BLOCK_TRANSACTION`, SHAP flags `amount_to_avg_ratio` (57x normal), `velocity_1h` (6 tx/hr), and `device_trust_score` (unrecognized hardware).

---

## 5. PayGuard Web Interfaces

1. **PayGuard v2 Enterprise Fintech Risk Console (Primary)**:
   - Access directly at **`http://localhost:8000/ui`** (or `http://localhost:8000/`).
   - Built with React 19, TypeScript, and Tailwind CSS.
   - Features 7 live views: Executive Overview, Real-Time Streaming Ticker, Transaction Analysis Sandbox, TreeSHAP Explainability, Drift Monitoring, Model Performance (MLflow metrics & $23k savings), and System Health.
2. **Interactive Swagger / OpenAPI Spec**:
   - Access at **`http://localhost:8000/docs`**.
3. **Streamlit Fallback Console**:
   ```bash
   streamlit run app/ui.py
   ```
