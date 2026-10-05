"""
Model Quality Gate Tests for PayGuard CI/CD Pipeline.
Asserts that the trained champion model satisfies minimum production performance thresholds.
"""

import os
import json
import pytest


def test_champion_model_exists():
    assert os.path.exists("models/champion_model.joblib"), "Champion model artifact missing."
    assert os.path.exists("models/preprocessor.joblib"), "Preprocessor artifact missing."
    assert os.path.exists("models/model_metadata.json"), "Model metadata JSON missing."


def test_champion_metrics_thresholds():
    with open("models/model_metadata.json", "r") as f:
        meta = json.load(f)

    metrics = meta.get("metrics", {})
    thresholds = meta.get("thresholds_enforced", {})

    min_pr_auc = thresholds.get("min_pr_auc", 0.70)
    min_recall = thresholds.get("min_recall", 0.75)

    actual_pr_auc = metrics.get("pr_auc", 0.0)
    actual_recall = metrics.get("recall", 0.0)
    actual_fpr = metrics.get("false_positive_rate", 1.0)

    print(f"\n[Quality Gate Test] Actual PR-AUC: {actual_pr_auc:.4f} (Required >= {min_pr_auc})")
    print(f"[Quality Gate Test] Actual Recall: {actual_recall:.4f} (Required >= {min_recall})")
    print(f"[Quality Gate Test] Actual FPR: {actual_fpr:.4f} (Required <= 0.05)")

    assert actual_pr_auc >= min_pr_auc, f"PR-AUC {actual_pr_auc:.4f} below threshold {min_pr_auc}"
    assert actual_recall >= min_recall, f"Recall {actual_recall:.4f} below threshold {min_recall}"
    assert actual_fpr <= 0.05, f"False Positive Rate {actual_fpr:.4f} exceeds 0.05 limit"
