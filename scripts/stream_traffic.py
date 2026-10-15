"""
Real-Time Transaction Stream Simulator for PayGuard.
Simulates a live electronic payment stream (UPI, Cards, NetBanking, Wallets),
continuously sending transactions to the FastAPI service at a configurable throughput rate
and printing a live operations terminal ticker.
"""

import os
import sys
import time
import random
import argparse
import requests
import pandas as pd

API_URL = "http://localhost:8000"


def stream_transactions(rate_per_sec: float = 2.0, max_transactions: int = 500):
    print("=" * 70)
    print("PAYGUARD: REAL-TIME PAYMENT STREAM INGESTION SIMULATOR")
    print("=" * 70)
    print(f"Target API Server : {API_URL}")
    print(f"Streaming Rate    : {rate_per_sec:.1f} transactions / second")
    print(f"Max Stream Volume : {max_transactions} transactions")
    print("-" * 70)

    # Load authentic and drifted datasets
    v1_path = "data/raw/transactions_v1.csv"
    v2_path = "data/raw/transactions_v2_drifted.csv"

    if not os.path.exists(v1_path) or not os.path.exists(v2_path):
        print("[ERROR] Datasets missing. Run 'python scripts/generate_dataset.py' first.")
        return

    df_normal = pd.read_csv(v1_path)
    df_fraud = pd.read_csv(v2_path)
    fraud_pool = df_fraud[df_fraud["is_fraud"] == 1].to_dict(orient="records")
    normal_pool = df_normal[df_normal["is_fraud"] == 0].to_dict(orient="records")

    delay = 1.0 / rate_per_sec
    total_sent = 0
    total_blocked = 0
    total_approved = 0

    print(f"{'Time':<10} | {'Tx ID':<15} | {'User':<10} | {'Channel':<12} | {'Amount':<10} | {'Risk':<7} | {'Verdict':<10} | {'Latency'}")
    print("-" * 85)

    try:
        while total_sent < max_transactions:
            # 92% normal customer activity, 8% attack injection bursts
            is_attack = random.random() < 0.08
            raw_tx = random.choice(fraud_pool) if (is_attack and fraud_pool) else random.choice(normal_pool)

            payload = {
                "transaction_id": f"TXN_STREAM_{total_sent + 1:05d}",
                "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
                "user_id": raw_tx["user_id"],
                "amount": float(raw_tx["amount"]),
                "old_balance": float(raw_tx["old_balance"]),
                "new_balance": float(raw_tx["new_balance"]),
                "user_avg_amount_30d": float(raw_tx["user_avg_amount_30d"]),
                "channel": raw_tx["channel"],
                "merchant_category": raw_tx["merchant_category"],
                "is_foreign_transaction": int(raw_tx["is_foreign_transaction"]),
                "device_trust_score": float(raw_tx["device_trust_score"]),
                "location_risk_score": float(raw_tx["location_risk_score"]),
                "velocity_1h": int(raw_tx["velocity_1h"]),
                "velocity_24h": int(raw_tx["velocity_24h"])
            }

            t0 = time.perf_counter()
            try:
                res = requests.post(f"{API_URL}/predict", json=payload, timeout=3.0)
                elapsed_ms = (time.perf_counter() - t0) * 1000.0

                if res.status_code == 200:
                    data = res.json()
                    verdict = data.get("verdict") or ("BLOCKED" if data.get("is_fraud") else "APPROVED")
                    prob = data.get("fraud_probability", 0.0) * 100.0
                    lat = data.get("latency_ms", elapsed_ms)

                    if data.get("is_fraud"):
                        total_blocked += 1
                        v_str = f"\033[91m{verdict:<10}\033[0m"
                    else:
                        total_approved += 1
                        v_str = f"\033[92m{verdict:<10}\033[0m"

                    now_str = time.strftime("%H:%M:%S")
                    print(f"{now_str:<10} | {payload['transaction_id']:<15} | {payload['user_id']:<10} | {payload['channel']:<12} | ${payload['amount']:<9.2f} | {prob:>5.1f}% | {v_str} | {lat:>5.1f}ms")

                    # Also asynchronously submit delayed feedback for ground-truth monitoring
                    actual_fraud = int(raw_tx.get("is_fraud", 0))
                    requests.post(f"{API_URL}/feedback", json={
                        "transaction_id": payload["transaction_id"],
                        "actual_is_fraud": actual_fraud
                    }, timeout=1.0)

                else:
                    print(f"[API ERROR {res.status_code}] {res.text}")
            except Exception as conn_err:
                print(f"[CONNECTION ERROR] Could not reach {API_URL}: {conn_err}")
                break

            total_sent += 1
            time.sleep(delay)

    except KeyboardInterrupt:
        print("\n[STREAM PAUSED BY USER]")

    print("\n" + "=" * 70)
    print("STREAMING SESSION SUMMARY")
    print(f"Total Transactions Scored : {total_sent}")
    print(f"Approved (Legitimate)     : {total_approved}")
    print(f"Blocked (Fraud Attacks)   : {total_blocked}")
    print(f"Fraud Detection Rate      : {(total_blocked / max(1, total_sent)) * 100:.1f}%")
    print("=" * 70)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--rate", type=float, default=2.0, help="Transactions per second (default: 2)")
    parser.add_argument("--count", type=int, default=300, help="Total transactions to stream (default: 300)")
    args = parser.parse_args()
    stream_transactions(rate_per_sec=args.rate, max_transactions=args.count)
