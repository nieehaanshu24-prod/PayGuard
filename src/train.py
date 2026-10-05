"""
Model training and MLflow experiment management for PayGuard.
Trains 1 Baseline (Logistic Regression) and 2 Candidate models (Random Forest, XGBoost),
recording hyperparameters, technical & business metrics, and visualization artifacts to MLflow.
"""

import os
import yaml
import joblib
import pandas as pd
import numpy as np
import mlflow
import mlflow.sklearn
import mlflow.xgboost
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import precision_recall_curve
from xgboost import XGBClassifier

from src.feature_engineering import engineer_features
from src.preprocessing import PreprocessingPipeline
from src.evaluate import evaluate_model


def train_models(config_path: str = "config/config.yaml"):
    with open(config_path, "r") as f:
        cfg = yaml.safe_load(f)

    seed = cfg["project"]["random_seed"]
    tracking_uri = cfg["paths"]["mlflow_tracking_uri"]
    exp_name = cfg["paths"]["mlflow_experiment_name"]
    inv_cost = cfg["business_metrics"]["investigation_cost_per_flag"]
    fraud_loss = cfg["business_metrics"]["default_fraud_loss_if_uncaught"]

    mlflow.set_tracking_uri(tracking_uri)
    mlflow.set_experiment(exp_name)

    train_path = cfg["paths"]["processed_train"]
    test_path = cfg["paths"]["processed_test"]

    print(f"[Training] Loading train data from {train_path}")
    train_df = pd.read_csv(train_path)
    test_df = pd.read_csv(test_path)

    # 1. Feature Engineering
    print("[Training] Engineering features...")
    train_fe = engineer_features(train_df)
    test_fe = engineer_features(test_df)

    y_train = train_fe["is_fraud"].values
    y_test = test_fe["is_fraud"].values

    # 2. Preprocessing
    print("[Training] Fitting preprocessing pipeline...")
    preprocessor = PreprocessingPipeline(cfg["paths"]["preprocessor_path"])
    X_train_trans, feature_names = preprocessor.fit_transform(train_fe)
    X_test_trans = preprocessor.transform(test_fe)

    results = []

    # -------------------------------------------------------------
    # MODEL 1: BASELINE (Logistic Regression)
    # -------------------------------------------------------------
    baseline_cfg = cfg["training"]["baseline"]
    print(f"\n[Training] Training Model 1: Baseline ({baseline_cfg['name']})...")
    with mlflow.start_run(run_name=baseline_cfg["name"]) as run:
        clf_base = LogisticRegression(
            class_weight=baseline_cfg["class_weight"],
            max_iter=baseline_cfg["max_iter"],
            C=baseline_cfg["C"],
            random_state=seed
        )
        clf_base.fit(X_train_trans, y_train)

        y_prob_base = clf_base.predict_proba(X_test_trans)[:, 1]
        # Optimal threshold for imbalanced classification based on F1
        p_c, r_c, thresholds = precision_recall_curve(y_test, y_prob_base)
        f1_scores = 2 * (p_c * r_c) / (p_c + r_c + 1e-8)
        best_idx = np.argmax(f1_scores[:-1]) if len(thresholds) > 0 else 0
        opt_thresh_base = float(thresholds[best_idx]) if len(thresholds) > 0 else 0.5
        y_pred_base = (y_prob_base >= opt_thresh_base).astype(int)

        metrics_base, plots_base = evaluate_model(
            y_test, y_pred_base, y_prob_base, inv_cost, fraud_loss, artifact_prefix="baseline_lr"
        )
        metrics_base["optimal_threshold"] = opt_thresh_base

        mlflow.log_params({
            "model_type": "LogisticRegression",
            "class_weight": baseline_cfg["class_weight"],
            "max_iter": baseline_cfg["max_iter"],
            "C": baseline_cfg["C"],
            "features_count": len(feature_names),
            "optimal_threshold": opt_thresh_base
        })
        mlflow.log_metrics(metrics_base)
        for _, path in plots_base.items():
            mlflow.log_artifact(path)

        mlflow.sklearn.log_model(clf_base, "model", serialization_format="cloudpickle")
        print(f" -> Baseline PR-AUC: {metrics_base['pr_auc']:.4f}, Recall: {metrics_base['recall']:.4f}, Net Savings: ${metrics_base['net_dollar_savings_usd']:.2f}")

        results.append({
            "name": baseline_cfg["name"],
            "model": clf_base,
            "threshold": opt_thresh_base,
            "metrics": metrics_base,
            "run_id": run.info.run_id,
            "model_type": "sklearn"
        })

    # -------------------------------------------------------------
    # MODEL 2: CANDIDATE 1 (Random Forest)
    # -------------------------------------------------------------
    rf_cfg = cfg["training"]["candidate_1"]
    print(f"\n[Training] Training Model 2: Candidate 1 ({rf_cfg['name']})...")
    with mlflow.start_run(run_name=rf_cfg["name"]) as run:
        clf_rf = RandomForestClassifier(
            n_estimators=rf_cfg["n_estimators"],
            max_depth=rf_cfg["max_depth"],
            min_samples_split=rf_cfg["min_samples_split"],
            class_weight=rf_cfg["class_weight"],
            random_state=seed,
            n_jobs=-1
        )
        clf_rf.fit(X_train_trans, y_train)

        y_prob_rf = clf_rf.predict_proba(X_test_trans)[:, 1]
        p_c, r_c, thresholds = precision_recall_curve(y_test, y_prob_rf)
        f1_scores = 2 * (p_c * r_c) / (p_c + r_c + 1e-8)
        best_idx = np.argmax(f1_scores[:-1]) if len(thresholds) > 0 else 0
        opt_thresh_rf = float(thresholds[best_idx]) if len(thresholds) > 0 else 0.5
        y_pred_rf = (y_prob_rf >= opt_thresh_rf).astype(int)

        metrics_rf, plots_rf = evaluate_model(
            y_test, y_pred_rf, y_prob_rf, inv_cost, fraud_loss, artifact_prefix="candidate_rf"
        )
        metrics_rf["optimal_threshold"] = opt_thresh_rf

        mlflow.log_params({
            "model_type": "RandomForest",
            "n_estimators": rf_cfg["n_estimators"],
            "max_depth": rf_cfg["max_depth"],
            "min_samples_split": rf_cfg["min_samples_split"],
            "class_weight": rf_cfg["class_weight"],
            "optimal_threshold": opt_thresh_rf
        })
        mlflow.log_metrics(metrics_rf)
        for _, path in plots_rf.items():
            mlflow.log_artifact(path)

        mlflow.sklearn.log_model(clf_rf, "model", serialization_format="cloudpickle")
        print(f" -> RF PR-AUC: {metrics_rf['pr_auc']:.4f}, Recall: {metrics_rf['recall']:.4f}, Net Savings: ${metrics_rf['net_dollar_savings_usd']:.2f}")

        results.append({
            "name": rf_cfg["name"],
            "model": clf_rf,
            "threshold": opt_thresh_rf,
            "metrics": metrics_rf,
            "run_id": run.info.run_id,
            "model_type": "sklearn"
        })

    # -------------------------------------------------------------
    # MODEL 3: CANDIDATE 2 (XGBoost)
    # -------------------------------------------------------------
    xgb_cfg = cfg["training"]["candidate_2"]
    print(f"\n[Training] Training Model 3: Candidate 2 ({xgb_cfg['name']})...")
    with mlflow.start_run(run_name=xgb_cfg["name"]) as run:
        clf_xgb = XGBClassifier(
            n_estimators=xgb_cfg["n_estimators"],
            max_depth=xgb_cfg["max_depth"],
            learning_rate=xgb_cfg["learning_rate"],
            scale_pos_weight=xgb_cfg["scale_pos_weight"],
            subsample=xgb_cfg["subsample"],
            colsample_bytree=xgb_cfg["colsample_bytree"],
            random_state=seed,
            eval_metric="aucpr",
            n_jobs=-1
        )
        clf_xgb.fit(X_train_trans, y_train)

        y_prob_xgb = clf_xgb.predict_proba(X_test_trans)[:, 1]
        p_c, r_c, thresholds = precision_recall_curve(y_test, y_prob_xgb)
        f1_scores = 2 * (p_c * r_c) / (p_c + r_c + 1e-8)
        best_idx = np.argmax(f1_scores[:-1]) if len(thresholds) > 0 else 0
        opt_thresh_xgb = float(thresholds[best_idx]) if len(thresholds) > 0 else 0.5
        y_pred_xgb = (y_prob_xgb >= opt_thresh_xgb).astype(int)

        metrics_xgb, plots_xgb = evaluate_model(
            y_test, y_pred_xgb, y_prob_xgb, inv_cost, fraud_loss, artifact_prefix="candidate_xgb"
        )
        metrics_xgb["optimal_threshold"] = opt_thresh_xgb

        mlflow.log_params({
            "model_type": "XGBoost",
            "n_estimators": xgb_cfg["n_estimators"],
            "max_depth": xgb_cfg["max_depth"],
            "learning_rate": xgb_cfg["learning_rate"],
            "scale_pos_weight": xgb_cfg["scale_pos_weight"],
            "subsample": xgb_cfg["subsample"],
            "colsample_bytree": xgb_cfg["colsample_bytree"],
            "optimal_threshold": opt_thresh_xgb
        })
        mlflow.log_metrics(metrics_xgb)
        for _, path in plots_xgb.items():
            mlflow.log_artifact(path)

        mlflow.xgboost.log_model(clf_xgb, "model")
        print(f" -> XGBoost PR-AUC: {metrics_xgb['pr_auc']:.4f}, Recall: {metrics_xgb['recall']:.4f}, Net Savings: ${metrics_xgb['net_dollar_savings_usd']:.2f}")

        results.append({
            "name": xgb_cfg["name"],
            "model": clf_xgb,
            "threshold": opt_thresh_xgb,
            "metrics": metrics_xgb,
            "run_id": run.info.run_id,
            "model_type": "xgboost"
        })

    return results


if __name__ == "__main__":
    train_models()
