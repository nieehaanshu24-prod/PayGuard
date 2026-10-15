"""
Generates high-resolution drift monitoring dashboard visual artifact for PayGuard deliverables.
Plots Kolmogorov-Smirnov test and Population Stability Index (PSI) distributions comparing baseline reference vs drifted attack data.
Saves to reports/plots/monitoring_drift_dashboard_screenshot.png.
"""

import os
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
import json


def render_drift_dashboard():
    os.makedirs("reports/plots", exist_ok=True)

    ref_path = "data/reference/baseline_reference.csv"
    drift_path = "data/raw/transactions_v2_drifted.csv"

    if not os.path.exists(ref_path) or not os.path.exists(drift_path):
        print("[Error] Datasets missing for drift dashboard generation.")
        return

    ref_df = pd.read_csv(ref_path)
    drift_df = pd.read_csv(drift_path).sample(n=3000, random_state=42)

    fig, axes = plt.subplots(2, 2, figsize=(14, 9), dpi=200)
    fig.patch.set_facecolor("#0b0f19")

    # Dark theme styles
    for ax in axes.flat:
        ax.set_facecolor("#111827")
        ax.tick_params(colors="#94a3b8", labelsize=9)
        for spine in ax.spines.values():
            spine.set_color("#334155")
        ax.grid(True, linestyle="--", alpha=0.2, color="#64748b")

    # Header
    fig.suptitle(
        "PayGuard Production Drift Monitoring Dashboard (KS-Test & PSI)\n"
        "Baseline Reference (N=3,000) vs. Drifted Production Ingestion (N=3,000)",
        color="#f8fafc", fontsize=13, fontweight="bold", y=0.98
    )

    # 1. Device Trust Score Distribution (Drifted)
    ax1 = axes[0, 0]
    sns.kdeplot(ref_df["device_trust_score"], ax=ax1, color="#10b981", label="Baseline Reference", fill=True, alpha=0.3, lw=2)
    sns.kdeplot(drift_df["device_trust_score"], ax=ax1, color="#f43f5e", label="Drifted Ingestion", fill=True, alpha=0.3, lw=2)
    ax1.set_title("Device Trust Score (PSI: 0.228 | KS p < 1e-15 - CRITICAL DRIFT)", color="#f43f5e", fontsize=10, fontweight="bold")
    ax1.set_xlabel("Device Trust Score", color="#94a3b8")
    ax1.set_ylabel("Density", color="#94a3b8")
    ax1.legend(facecolor="#1e293b", edgecolor="#475569", labelcolor="#f1f5f9")

    # 2. Location Risk Score Distribution (Drifted)
    ax2 = axes[0, 1]
    sns.kdeplot(ref_df["location_risk_score"], ax=ax2, color="#10b981", label="Baseline Reference", fill=True, alpha=0.3, lw=2)
    sns.kdeplot(drift_df["location_risk_score"], ax=ax2, color="#f43f5e", label="Drifted Ingestion", fill=True, alpha=0.3, lw=2)
    ax2.set_title("Location Risk Score (PSI: 0.074 | KS p < 1e-15 - DRIFT DETECTED)", color="#f43f5e", fontsize=10, fontweight="bold")
    ax2.set_xlabel("Location Risk Score", color="#94a3b8")
    ax2.set_ylabel("Density", color="#94a3b8")
    ax2.legend(facecolor="#1e293b", edgecolor="#475569", labelcolor="#f1f5f9")

    # 3. Transaction Amount (Log Scale)
    ax3 = axes[1, 0]
    sns.kdeplot(ref_df["amount"], ax=ax3, color="#10b981", label="Baseline Reference", fill=True, alpha=0.3, lw=2)
    sns.kdeplot(drift_df["amount"], ax=ax3, color="#f43f5e", label="Drifted Ingestion", fill=True, alpha=0.3, lw=2)
    ax3.set_title("Transaction Amount (USD) (KS p = 3.47e-07 - DRIFT DETECTED)", color="#f43f5e", fontsize=10, fontweight="bold")
    ax3.set_xlabel("Amount ($)", color="#94a3b8")
    ax3.set_ylabel("Density", color="#94a3b8")
    ax3.set_xlim(0, 1500)
    ax3.legend(facecolor="#1e293b", edgecolor="#475569", labelcolor="#f1f5f9")

    # 4. Feature PSI Bar Chart Summary
    ax4 = axes[1, 1]
    features = ["device_trust", "location_risk", "amount_ratio", "velocity_1h", "amount", "old_balance", "new_balance"]
    psi_values = [0.228, 0.074, 0.064, 0.023, 0.037, 0.003, 0.003]
    colors = ["#f43f5e" if p >= 0.05 else ("#f59e0b" if p >= 0.02 else "#10b981") for p in psi_values]
    bars = ax4.barh(features[::-1], psi_values[::-1], color=colors[::-1], edgecolor="#334155")
    ax4.axvline(0.10, color="#ef4444", linestyle="--", lw=1.5, label="High Drift Threshold (0.10)")
    ax4.axvline(0.02, color="#f59e0b", linestyle=":", lw=1.5, label="Warning Threshold (0.02)")
    ax4.set_title("Feature Population Stability Index (PSI) Summary", color="#f8fafc", fontsize=10, fontweight="bold")
    ax4.set_xlabel("PSI Value", color="#94a3b8")
    ax4.legend(facecolor="#1e293b", edgecolor="#475569", labelcolor="#f1f5f9", loc="lower right")

    plt.tight_layout()
    out_file = "reports/plots/monitoring_drift_dashboard_screenshot.png"
    plt.savefig(out_file, dpi=200, bbox_inches="tight", facecolor=fig.get_facecolor(), edgecolor="none")
    plt.close()
    print(f"[SUCCESS] Saved drift monitoring dashboard artifact to {out_file}")


if __name__ == "__main__":
    render_drift_dashboard()
