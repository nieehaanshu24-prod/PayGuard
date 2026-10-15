"""
Model registration and automated promotion gate for PayGuard.
Validates candidate performance against strict thresholds before promoting to @champion
in MLflow Model Registry and persisting deployment artifacts.
"""

import os
import json
import yaml
import joblib
from datetime import datetime, timezone
import mlflow
from mlflow.tracking import MlflowClient


def register_and_promote(results, config_path: str = "config/config.yaml"):
    with open(config_path, "r") as f:
        cfg = yaml.safe_load(f)

    tracking_uri = cfg["paths"]["mlflow_tracking_uri"]
    mlflow.set_tracking_uri(tracking_uri)
    client = MlflowClient()

    gate = cfg["promotion_gate"]
    min_pr_auc = gate["min_pr_auc"]
    min_recall = gate["min_recall"]

    # Select the model with highest PR-AUC
    candidates = sorted(results, key=lambda x: x["metrics"]["pr_auc"], reverse=True)
    best = candidates[0]

    print(f"\n[Promotion Gate] Top candidate: {best['name']} with PR-AUC = {best['metrics']['pr_auc']:.4f}, Recall = {best['metrics']['recall']:.4f}")

    # Check promotion thresholds
    pr_auc_passed = best["metrics"]["pr_auc"] >= min_pr_auc
    recall_passed = best["metrics"]["recall"] >= min_recall

    if not (pr_auc_passed and recall_passed):
        print(f"[Promotion Gate FAILED] Model failed quality thresholds (Min PR-AUC: {min_pr_auc}, Min Recall: {min_recall})")
        raise ValueError("Model quality did not satisfy promotion criteria.")

    print("[Promotion Gate PASSED] Model meets all production requirements.")

    # Register in MLflow Model Registry
    reg_name = "PayGuard_Fraud_Detection_Champion"
    model_uri = f"runs:/{best['run_id']}/model"

    print(f"[Model Registry] Registering model {model_uri} as '{reg_name}'...")
    mv = mlflow.register_model(model_uri, reg_name)

    # Set alias and tags
    alias_name = "champion"
    try:
        client.set_registered_model_alias(reg_name, alias_name, mv.version)
        print(f"[Model Registry] Assigned alias '@{alias_name}' to version {mv.version}.")
    except Exception as e:
        print(f"[Model Registry] Note on alias: {e}")

    # Update metadata
    metadata = {
        "model_name": best["name"],
        "model_version": mv.version,
        "run_id": best["run_id"],
        "alias": alias_name,
        "optimal_threshold": float(best.get("threshold", 0.5)),
        "registered_at": datetime.now(timezone.utc).isoformat(),
        "metrics": best["metrics"],
        "thresholds_enforced": {
            "min_pr_auc": min_pr_auc,
            "min_recall": min_recall
        }
    }

    # Save local deployment copy for real-time low-latency FastAPI inference
    os.makedirs(cfg["paths"]["model_dir"], exist_ok=True)
    champion_path = cfg["paths"]["champion_model_path"]
    joblib.dump(best["model"], champion_path)

    metadata_path = os.path.join(cfg["paths"]["model_dir"], "model_metadata.json")
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"[Model Registry] Successfully persisted local champion model to {champion_path}")
    print(f"[Model Registry] Metadata recorded in {metadata_path}")

    return metadata


if __name__ == "__main__":
    from src.train import train_models
    results = train_models()
    register_and_promote(results)
