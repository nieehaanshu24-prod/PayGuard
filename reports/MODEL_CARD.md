# PayGuard Model Card

Following the Mitchell et al. *Model Cards for Model Reporting* standard.

---

## 1. Model Details

- **Model Name**: PayGuard Real-Time Fraud Classifier
- **Model Type**: Ensemble Machine Learning / Gradient Boosted Decision Trees
- **Champion Architecture**: Random Forest Classifier (`RandomForest_Candidate`) / XGBoost (`XGBoost_Candidate`)
- **Version**: `v1.0` (MLflow Registered Model: `PayGuard_Fraud_Detection_Champion`, Alias: `@champion`)
- **Frameworks**: Scikit-Learn 1.9, XGBoost 3.4, MLflow 3.16
- **Developer**: PayGuard MLOps Team

---

## 2. Intended Use & Scope

- **Primary Application**: Real-time scoring of incoming digital payment transactions prior to clearing and settlement.
- **Decision Workflow**:
  - Probability $< 0.50$ (`LOW RISK`): Transaction auto-approved.
  - Probability $0.50 - 0.79$ (`MEDIUM RISK`): Step-up authentication challenge (OTP / Biometric prompt).
  - Probability $\ge 0.80$ (`HIGH RISK`): Transaction blocked, card temporarily frozen, alerted to anti-fraud operations.
- **Out-of-Scope Uses**: Long-term credit underwriting, consumer credit scoring, or loan default prediction.

---

## 3. Experimentation & Model Comparison

Evaluated on held-out test set (3,000 transactions, 46 frauds, stratified 1.53% prevalence):

| Model Candidate | Algorithm & Strategy | PR-AUC | Recall | Precision | F1-Score | Net Financial Savings ($) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Model 1 (Baseline)** | Logistic Regression (`class_weight='balanced'`) | 1.0000 | 1.0000 | 1.0000 | 1.0000 | $23,000.00 |
| **Model 2 (Candidate 1)** | Random Forest (`n_estimators=150`, balanced) | **1.0000** | **1.0000** | **1.0000** | **1.0000** | **$23,000.00** |
| **Model 3 (Candidate 2)** | XGBoost (`scale_pos_weight=15`, lr=0.05) | 1.0000 | 1.0000 | 1.0000 | 1.0000 | $23,000.00 |

*Note: All 3 models achieved high separation on the multi-factor attack signatures. Candidate 1 was registered as Champion `@champion` based on optimal latency trade-off and deterministic memory footprint.*

---

## 4. Subgroup Fairness & Disparate Impact Analysis

To ensure algorithmic fairness across diverse user segments, model performance was evaluated across individual payment channels:

| Payment Channel | Test Volume | Actual Frauds | Channel Recall | False Positive Rate | Equal Opportunity Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **UPI** | 1,350 | 12 | 100.0% | 0.00% | **PASSED** |
| **CREDIT_CARD** | 750 | 25 | 100.0% | 0.00% | **PASSED** |
| **DEBIT_CARD** | 450 | 5 | 100.0% | 0.00% | **PASSED** |
| **NET_BANKING** | 300 | 2 | 100.0% | 0.00% | **PASSED** |
| **WALLET** | 150 | 2 | 100.0% | 0.00% | **PASSED** |

**Fairness Assessment**: Disparate Impact Ratio across all channels satisfies the 80% rule (1.00 parity), demonstrating that legitimate consumers using specific channels (e.g. Wallets or UPI) are not disproportionately subjected to false declines.

---

## 5. Technical Limitations & Mitigation

1. **Adversarial Concept Drift**: Fraud syndicates continuously alter bot behavior (e.g. testing lower dollar amounts).
   - *Mitigation*: Daily automated KS-test and PSI drift alerts trigger retraining DAGs in Airflow.
2. **Cold Start User Entity**: New cardholders without a 30-day baseline spend history (`user_avg_amount_30d`).
   - *Mitigation*: Imputed cohort median baseline is automatically assigned until 10 transactions elapse.
