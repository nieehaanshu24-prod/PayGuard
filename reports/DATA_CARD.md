# PayGuard Data Card

Following the Gebru et al. *Datasheets for Datasets* standard for machine learning in digital finance.

---

## 1. Dataset Overview

- **Dataset Name**: PayGuard Digital Payment Transaction Stream
- **Domain**: Real-Time Electronic Payment Systems (UPI, Cards, NetBanking, Wallets)
- **Primary Task**: Imbalanced Binary Classification (Fraud Detection)
- **Target Variable**: `is_fraud` (0 = Legitimate Customer Transaction, 1 = Fraudulent Attack)
- **Dataset Versions**:
  - `transactions_v1.csv` (Baseline training & testing, 15,000 records, 1.53% fraud rate)
  - `transactions_v2_drifted.csv` (Production drifted stream, 5,000 records, 11.76% attack surge)
  - `baseline_reference.csv` (Golden benchmark reference dataset, 3,000 records)
- **Versioning Tool**: Data Version Control (DVC) tracked via Git metadata (`.dvc`).

---

## 2. Dataset Schema & Feature Dictionary

| Feature Name | Data Type | Value Range / Categories | Description |
| :--- | :--- | :--- | :--- |
| `transaction_id` | String | Unique UUID / Identifier | Unique transactional trace identifier |
| `timestamp` | Datetime String | `YYYY-MM-DD HH:MM:SS` | Transaction authorization timestamp |
| `user_id` | String | `USR_0001` - `USR_1500` | Account/cardholder entity identifier |
| `amount` | Float | $1.00 - $35,000.00 | Monetary transaction amount in USD |
| `old_balance` | Float | $0.00 - $50,000.00 | Originating account balance prior to payment |
| `new_balance` | Float | $0.00 - $50,000.00 | Originating account balance post payment |
| `user_avg_amount_30d`| Float | $10.00 - $1,500.00 | Rolling 30-day baseline spending average |
| `channel` | Categorical | `UPI`, `CREDIT_CARD`, `DEBIT_CARD`, `NET_BANKING`, `WALLET` | Payment rail used |
| `merchant_category`| Categorical | `grocery`, `crypto_exchange`, `luxury`, `retail`, etc. | Merchant category code (MCC classification) |
| `is_foreign_transaction` | Binary | `0` (Domestic), `1` (Cross-border) | Cross-border transaction indicator |
| `device_trust_score` | Float | `0.00` to `1.00` | Hardware fingerprinting & biometric trust score |
| `location_risk_score`| Float | `0.00` to `1.00` | Geographic IP anomaly and geolocation risk score |
| `velocity_1h` | Integer | `0` to `20` | Transaction count by cardholder in last 1 hour |
| `velocity_24h` | Integer | `0` to `50` | Transaction count by cardholder in last 24 hours |
| `is_fraud` | Binary | `0` (Legit), `1` (Fraud) | Ground truth authorization outcome |

---

## 3. Data Collection, Preprocessing & Quality Assurance

- **Validation Rules**:
  - Null value constraint: Zero null values allowed across core telemetry.
  - Logical constraint: `amount > 0`, `old_balance >= 0`, `device_trust_score in [0, 1]`.
  - Channel constraint: Only compliant banking payment rails accepted.
- **Class Imbalance Strategy**:
  - Baseline distribution displays an extreme 98.47% legit to 1.53% fraud imbalance, closely reflecting production payment switches.
  - Stratified sampling is strictly enforced across train/test splits.
  - Tree-based candidate models leverage weighted loss functions (`class_weight='balanced_subsample'`, `scale_pos_weight=15.0`) to avoid majority class bias.

---

## 4. Ethical & Privacy Considerations

- **Data Privacy**: No personally identifiable information (PII) such as full names, unmasked credit card PANs, or SSNs are stored. Synthetic representations are completely anonymized.
- **Compliance**: Complies with PCI-DSS guidelines on data minimization and tokenization.
