"""
Synthetic Real-Time Digital Payment Fraud Dataset Generator for PayGuard.
Generates realistic transactional banking data with imbalanced fraud distribution (v1)
and simulated concept/covariate drift (v2).
"""

import os
import random
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

SEED = 42
np.random.seed(SEED)
random.seed(SEED)

CHANNELS = ["UPI", "CREDIT_CARD", "DEBIT_CARD", "NET_BANKING", "WALLET"]
CHANNEL_WEIGHTS = [0.45, 0.25, 0.15, 0.10, 0.05]

MERCHANT_CATEGORIES = [
    "grocery", "retail", "travel", "electronics", "entertainment",
    "gaming", "crypto_exchange", "utilities", "dining", "luxury"
]
HIGH_RISK_MERCHANTS = ["crypto_exchange", "luxury", "gaming", "electronics"]


def generate_transactions(num_records=15000, drift_mode=False):
    start_time = datetime(2026, 9, 1, 0, 0, 0)
    records = []

    user_ids = [f"USR_{i:04d}" for i in range(1, 1500)]
    user_historical_avg = {u: float(np.random.lognormal(mean=3.8, sigma=0.5)) for u in user_ids}

    # Baseline fraud rate 1.5%, Drifted fraud rate 12%
    fraud_prob = 0.12 if drift_mode else 0.015

    for i in range(num_records):
        tx_id = f"TXN_{200000 + i if drift_mode else 100000 + i}"
        user_id = random.choice(user_ids)
        base_avg = user_historical_avg[user_id]

        is_fraud_tx = 1 if np.random.rand() < fraud_prob else 0

        if is_fraud_tx == 1:
            # Fraudulent attack signature
            amount = np.random.lognormal(mean=np.log(base_avg * 4.2), sigma=0.5)
            hour = int(np.random.choice([0, 1, 2, 3, 4, 22, 23]))
            channel = np.random.choice(["CREDIT_CARD", "UPI", "WALLET"], p=[0.50, 0.35, 0.15])
            merchant = np.random.choice(HIGH_RISK_MERCHANTS)
            is_foreign = 1 if np.random.rand() < 0.65 else 0
            device_trust = float(np.clip(np.random.beta(2, 8), 0.02, 0.35)) # Low device trust
            location_risk = float(np.clip(np.random.beta(7, 3), 0.60, 0.99)) # High location risk
            velocity_1h = int(np.random.poisson(lam=3.5) + 1)
            velocity_24h = int(velocity_1h + np.random.poisson(lam=4.0))
        else:
            # Normal authentic customer transaction
            amount = np.random.lognormal(mean=np.log(base_avg), sigma=0.45)
            p_hour = np.array([
                0.01, 0.01, 0.01, 0.01, 0.02, 0.03,
                0.05, 0.07, 0.08, 0.08, 0.07, 0.07,
                0.08, 0.07, 0.06, 0.06, 0.07, 0.08,
                0.07, 0.05, 0.03, 0.02, 0.01, 0.01
            ])
            p_hour = p_hour / p_hour.sum()
            hour = int(np.random.choice(range(24), p=p_hour))
            channel = np.random.choice(CHANNELS, p=CHANNEL_WEIGHTS)
            merchant = np.random.choice(MERCHANT_CATEGORIES)
            is_foreign = 1 if np.random.rand() < 0.02 else 0
            device_trust = float(np.clip(np.random.beta(8, 2), 0.65, 0.99)) # High device trust
            location_risk = float(np.clip(np.random.beta(2, 8), 0.01, 0.40)) # Low location risk
            velocity_1h = int(np.random.poisson(lam=0.3))
            velocity_24h = int(velocity_1h + np.random.poisson(lam=1.5))

        amount = round(float(amount), 2)
        old_balance = round(float(np.random.uniform(500, 30000)), 2)
        new_balance = max(0.0, round(old_balance - amount, 2))
        amount_to_avg_ratio = round(amount / (base_avg + 1e-5), 3)
        balance_diff = round(old_balance - new_balance, 2)

        tx_time = start_time + timedelta(
            days=random.randint(0, 30),
            hours=int(hour),
            minutes=random.randint(0, 59),
            seconds=random.randint(0, 59)
        )
        is_weekend = 1 if tx_time.weekday() >= 5 else 0

        records.append({
            "transaction_id": tx_id,
            "timestamp": tx_time.strftime("%Y-%m-%d %H:%M:%S"),
            "user_id": user_id,
            "amount": amount,
            "old_balance": old_balance,
            "new_balance": new_balance,
            "user_avg_amount_30d": round(base_avg, 2),
            "amount_to_avg_ratio": amount_to_avg_ratio,
            "balance_diff": balance_diff,
            "velocity_1h": int(velocity_1h),
            "velocity_24h": int(velocity_24h),
            "channel": channel,
            "merchant_category": merchant,
            "is_foreign_transaction": int(is_foreign),
            "device_trust_score": round(float(device_trust), 3),
            "location_risk_score": round(float(location_risk), 3),
            "hour_of_day": int(hour),
            "is_weekend": int(is_weekend),
            "is_fraud": int(is_fraud_tx)
        })

    df = pd.DataFrame(records)
    return df


def main():
    os.makedirs("data/raw", exist_ok=True)
    os.makedirs("data/reference", exist_ok=True)

    print("[PayGuard Dataset Generator] Generating baseline dataset v1.0 (15,000 transactions)...")
    df_v1 = generate_transactions(num_records=15000, drift_mode=False)
    v1_path = "data/raw/transactions_v1.csv"
    df_v1.to_csv(v1_path, index=False)
    fraud_count_v1 = df_v1["is_fraud"].sum()
    fraud_pct_v1 = (fraud_count_v1 / len(df_v1)) * 100
    print(f" -> Saved {v1_path}: {len(df_v1)} records, {fraud_count_v1} frauds ({fraud_pct_v1:.2f}% imbalanced).")

    # Save reference golden dataset for drift monitoring
    ref_path = "data/reference/baseline_reference.csv"
    df_v1.sample(n=3000, random_state=SEED).to_csv(ref_path, index=False)
    print(f" -> Saved golden reference dataset to {ref_path}.")

    print("\n[PayGuard Dataset Generator] Generating drifted production dataset v2.0 (5,000 transactions)...")
    df_v2 = generate_transactions(num_records=5000, drift_mode=True)
    v2_path = "data/raw/transactions_v2_drifted.csv"
    df_v2.to_csv(v2_path, index=False)
    fraud_count_v2 = df_v2["is_fraud"].sum()
    fraud_pct_v2 = (fraud_count_v2 / len(df_v2)) * 100
    print(f" -> Saved {v2_path}: {len(df_v2)} records, {fraud_count_v2} frauds ({fraud_pct_v2:.2f}% drifted).")
    print("\n[SUCCESS] Datasets generated successfully.")


if __name__ == "__main__":
    main()
