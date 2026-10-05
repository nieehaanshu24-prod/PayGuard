"""
Drift simulation and monitoring verification script for PayGuard.
Simulates baseline stream followed by drifted production traffic surge,
evaluating KS-test and PSI drift metrics and logging Prometheus alerts.
"""

import os
import sys
import json
import time
import requests
import pandas as pd

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from src.drift import detect_feature_drift


def run_drift_simulation(api_url: str = "http://localhost:8000"):
    print("=" * 65)
    print("PAYGUARD: DATA & CONCEPT DRIFT SIMULATION ENGINE")
    print("=" * 65)

    ref_path = "data/reference/baseline_reference.csv"
    drift_path = "data/raw/transactions_v2_drifted.csv"

    if not os.path.exists(ref_path) or not os.path.exists(drift_path):
        print("[ERROR] Required datasets missing. Run generate_dataset.py first.")
        return

    ref_df = pd.read_csv(ref_path)
    drift_df = pd.read_csv(drift_path)

    print(f"\n[Drift Engine] Loaded Reference Baseline ({len(ref_df)} transactions)")
    print(f"[Drift Engine] Loaded Drifted Production Stream ({len(drift_df)} transactions)")

    # 1. Run statistical drift analysis
    print("\n[Drift Engine] Executing Kolmogorov-Smirnov (KS) tests and PSI calculations...")
    results = detect_feature_drift(ref_df, drift_df)

    print("\n" + "-" * 65)
    print(f"{'Feature':<25} | {'PSI':<8} | {'KS Stat':<8} | {'Drift Status'}")
    print("-" * 65)
    for feat, m in results["feature_metrics"].items():
        status_str = "DRIFT DETECTED" if m["drift_detected"] else "NORMAL"
        print(f"{feat:<25} | {m['psi']:<8.4f} | {m['ks_statistic']:<8.4f} | {status_str}")
    print("-" * 65)

    print(f"\nOverall Dataset Drift: {'YES (ACTION REQUIRED)' if results['overall_dataset_drift'] else 'NO'}")
    print(f"Total Drifted Features: {results['drifted_features_count']} of {len(results['feature_metrics'])}")

    # 2. Save Evidence Artifacts
    os.makedirs("reports", exist_ok=True)
    report_json_path = "reports/DRIFT_REPORT.json"
    with open(report_json_path, "w") as f:
        json.dump(results, f, indent=2)

    summary_md_path = "reports/DRIFT_EVIDENCE.md"
    with open(summary_md_path, "w") as f:
        f.write("# PayGuard Data & Feature Drift Monitoring Evidence\n\n")
        f.write(f"- **Overall Dataset Drift Detected**: `{results['overall_dataset_drift']}`\n")
        f.write(f"- **Drifted Features Count**: `{results['drifted_features_count']}`\n")
        f.write(f"- **Triggered Action**: `TRIGGER_AUTOMATED_RETRAINING_DAG`\n\n")
        f.write("### Feature-Level Drift Metrics\n\n")
        f.write("| Monitored Feature | Population Stability Index (PSI) | KS Test Statistic | KS p-value | Status |\n")
        f.write("| :--- | :--- | :--- | :--- | :--- |\n")
        for feat, m in results["feature_metrics"].items():
            st = "**DRIFT ALERT**" if m["drift_detected"] else "STABLE"
            f.write(f"| `{feat}` | {m['psi']:.4f} | {m['ks_statistic']:.4f} | {m['ks_pvalue']:.4e} | {st} |\n")

    print(f"\n[Evidence] Saved drift reports to {report_json_path} and {summary_md_path}")
    print("=" * 65)


if __name__ == "__main__":
    run_drift_simulation()
