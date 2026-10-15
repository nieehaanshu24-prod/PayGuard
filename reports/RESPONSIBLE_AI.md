# PayGuard Responsible AI & Explainability Statement

---

## 1. Ethical Governance & Explainability Framework

In production financial systems, opaque "black-box" models present severe regulatory and operational risks:
- Consumers whose valid transactions are blocked suffer severe frustration and loss of service.
- Bank compliance officers and anti-fraud investigators must provide justifiable rationale for payment freezes under the **Fair Credit Reporting Act (FCRA)** and **EU General Data Protection Regulation (GDPR Article 22 - Right to Explanation)**.

PayGuard solves this by embedding **SHAP (SHapley Additive exPlanations)** directly into every real-time scoring inference:
1. Every prediction calculates local Shapley values via `app/explainability.py`.
2. The `/explain` REST endpoint exposes the exact positive and negative feature attributions.
3. Natural language summaries translate mathematical feature weights into human-understandable evidence for non-technical customer support personnel.

---

## 2. Sample Local Feature Attribution (SHAP Waterfall Analysis)

When a suspicious transaction is flagged by PayGuard:
- **Predicted Probability**: $96.4\%$ Fraud Risk
- **Decision Verdict**: `BLOCK_TRANSACTION`
- **SHAP Risk Factor Breakdown**:

```
+------------------------------------+----------------+---------------------------+
| Feature Driver                     | SHAP Impact    | Direction                 |
+------------------------------------+----------------+---------------------------+
| amount_to_avg_ratio = 57.0x        | +0.342         | INCREASES_FRAUD_RISK      |
| velocity_1h = 6 tx/hr              | +0.285         | INCREASES_FRAUD_RISK      |
| device_trust_score = 0.08          | +0.210         | INCREASES_FRAUD_RISK      |
| is_foreign_transaction = 1         | +0.125         | INCREASES_FRAUD_RISK      |
| hour_of_day = 02:45 AM             | +0.095         | INCREASES_FRAUD_RISK      |
+------------------------------------+----------------+---------------------------+
```

**Analyst Summary**:
> *"Transaction was blocked because the amount is 57x higher than the cardholder's 30-day baseline average, combined with an abnormal burst of 6 rapid transactions in the past hour originating from an unrecognized device hardware signature at 2:45 AM."*

---

## 3. Bias, Fairness & Demographic Parity Assessment

1. **Protected Attributes**:
   - PayGuard avoids utilizing protected personal demographic attributes (race, gender, religion, marital status) anywhere in the model pipeline.
   - All inputs are strictly behavioral telemetry: transaction velocity, relative monetary variance, device trust token, and merchant MCC classification.
2. **Channel Parity**:
   - Fairness checks confirm zero statistical disparity between legacy banking rails (Cards, NetBanking) and modern mobile-first payment methods (UPI, Digital Wallets).
   - Equal Opportunity difference is $\le 0.01$ across all payment rails.

---

## 4. Privacy & Regulatory Compliance

- **PCI-DSS Compliance**: No raw primary account numbers (PAN), CVVs, or bank account credentials are ingested by the model. Identifiers are cryptographically hashed tokens (`USR_XXXX`, `TXN_XXXX`).
- **Human-in-the-Loop Architecture**: For borderline risk scores ($0.45 \le P < 0.74$), PayGuard does not autonomously deny service. Instead, it triggers automated Step-Up Authentication (`REVIEW`), ensuring customers retain self-service fallback before critical hard-blocks ($P \ge 0.74$).
