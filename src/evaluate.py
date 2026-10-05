"""
Evaluation and business metric calculation module for PayGuard.
Computes technical metrics (PR-AUC, ROC-AUC, Recall, Precision) and financial impact metrics
(fraud loss prevented, investigation friction costs, and total dollars saved).
"""

import os
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
from sklearn.metrics import (
    precision_score, recall_score, f1_score, roc_auc_score,
    average_precision_score, confusion_matrix, precision_recall_curve
)
from typing import Dict, Any, Tuple


def evaluate_model(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    y_prob: np.ndarray,
    investigation_cost: float = 25.0,
    fraud_loss: float = 500.0,
    artifact_prefix: str = "eval"
) -> Tuple[Dict[str, float], Dict[str, str]]:
    """
    Evaluates model predictions and generates technical & business metrics + plot artifacts.
    """
    tn, fp, fn, tp = confusion_matrix(y_true, y_pred).ravel()

    precision = float(precision_score(y_true, y_pred, zero_division=0))
    recall = float(recall_score(y_true, y_pred, zero_division=0))
    f1 = float(f1_score(y_true, y_pred, zero_division=0))
    roc_auc = float(roc_auc_score(y_true, y_prob)) if len(np.unique(y_true)) > 1 else 0.0
    pr_auc = float(average_precision_score(y_true, y_prob)) if len(np.unique(y_true)) > 1 else 0.0
    fp_rate = float(fp / (fp + tn)) if (fp + tn) > 0 else 0.0

    # Business Financial Metrics
    # In banking: Uncaught fraud costs money (FN * loss). False alarms cost analyst review time (FP * cost).
    total_fraud_loss_uncaught = fn * fraud_loss
    investigation_friction_cost = fp * investigation_cost
    fraud_amount_prevented = tp * fraud_loss
    net_dollar_savings = fraud_amount_prevented - investigation_friction_cost

    metrics = {
        "precision": precision,
        "recall": recall,
        "f1_score": f1,
        "roc_auc": roc_auc,
        "pr_auc": pr_auc,
        "false_positive_rate": fp_rate,
        "true_positives": int(tp),
        "false_positives": int(fp),
        "false_negatives": int(fn),
        "true_negatives": int(tn),
        "uncaught_fraud_loss_usd": float(total_fraud_loss_uncaught),
        "investigation_friction_cost_usd": float(investigation_friction_cost),
        "fraud_prevented_usd": float(fraud_amount_prevented),
        "net_dollar_savings_usd": float(net_dollar_savings)
    }

    # Plot artifacts
    plot_artifacts = {}
    os.makedirs("reports/plots", exist_ok=True)

    # 1. Confusion Matrix
    cm_path = f"reports/plots/{artifact_prefix}_confusion_matrix.png"
    plt.figure(figsize=(5, 4))
    sns.heatmap(
        [[tn, fp], [fn, tp]],
        annot=True,
        fmt="d",
        cmap="Blues",
        xticklabels=["Legit", "Fraud"],
        yticklabels=["Legit", "Fraud"]
    )
    plt.title(f"{artifact_prefix.capitalize()} Confusion Matrix")
    plt.ylabel("Actual")
    plt.xlabel("Predicted")
    plt.tight_layout()
    plt.savefig(cm_path, dpi=150)
    plt.close()
    plot_artifacts["confusion_matrix"] = cm_path

    # 2. Precision-Recall Curve
    pr_path = f"reports/plots/{artifact_prefix}_pr_curve.png"
    p_curve, r_curve, _ = precision_recall_curve(y_true, y_prob)
    plt.figure(figsize=(6, 4))
    plt.plot(r_curve, p_curve, marker=".", label=f"PR-AUC = {pr_auc:.3f}")
    plt.xlabel("Recall")
    plt.ylabel("Precision")
    plt.title(f"{artifact_prefix.capitalize()} Precision-Recall Curve")
    plt.legend()
    plt.grid(True, linestyle="--", alpha=0.6)
    plt.tight_layout()
    plt.savefig(pr_path, dpi=150)
    plt.close()
    plot_artifacts["pr_curve"] = pr_path

    return metrics, plot_artifacts
