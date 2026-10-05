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
1. `POST /predict`: Real-time transaction scoring.
2. `POST /explain`: SHAP-based feature attribution explanation.
3. `POST /feedback`: Delayed ground truth reporting (True Positive / False Positive tracking).
4. `POST /drift/simulate`: Production data drift trigger.

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
   - VERDICT: [LEGITIMATE | SUSPICIOUS | CRITICAL FRAUD]
   - FRAUD PROBABILITY: (e.g. 96.4%)
   - ACTION RECOMMENDATION: [APPROVE | CHALLENGE OTP | BLOCK CARD]
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
**Expected Output**: Risk: `LOW`, Verdict: `APPROVE`, Latency: `< 15ms`.

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

## 5. (Bonus) Instant Local Fallback UI

If you want a 1-click visual dashboard for your viva demo, run:
```bash
streamlit run app/ui.py
```
This launches a web dashboard connected to `http://localhost:8000`.
