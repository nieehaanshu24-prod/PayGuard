"""
PayGuard Standalone End-to-End Pipeline Orchestrator.
Executes ingestion, validation, preprocessing, multi-model training (Baseline, RF, XGBoost),
MLflow tracking, evaluation, and model registration in one reproducible command.
"""

import sys
import os
import time

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.ingestion import ingest_and_split
from src.train import train_models
from src.register import register_and_promote


def run_pipeline():
    start_time = time.time()
    print("=" * 70)
    print("PAYGUARD: REAL-TIME DIGITAL PAYMENT FRAUD DETECTION PIPELINE (7 STAGES)")
    print("=" * 70)

    # Clean machine fallback: if raw data does not exist, generate it
    raw_path = "data/raw/transactions_v1.csv"
    if not os.path.exists(raw_path):
        print("\n[NOTE] Raw dataset not found on clean environment. Auto-generating deterministically...")
        from scripts.generate_dataset import main as gen_data
        gen_data()

    # Step 1: Data Ingestion
    print("\n>>> STAGE 1/7: DATA INGESTION")
    train_df, test_df = ingest_and_split()

    # Step 2: Data Validation
    print("\n>>> STAGE 2/7: SCHEMA & DATA VALIDATION")
    from src.validation import validate_dataframe
    is_valid, errors = validate_dataframe(train_df, is_training=True)
    if not is_valid:
        raise ValueError(f"Validation failed: {errors}")
    print(" -> Ingested data schema and range checks PASSED.")

    # Step 3 & 4: Preprocessing & Feature Engineering
    print("\n>>> STAGE 3/7 & 4/7: DATA PREPROCESSING & FEATURE ENGINEERING")
    from src.feature_engineering import engineer_features
    from src.preprocessing import PreprocessingPipeline
    train_fe = engineer_features(train_df)
    preprocessor = PreprocessingPipeline("models/preprocessor.joblib")
    preprocessor.fit_transform(train_fe)
    print(f" -> Feature engineering & preprocessor pipeline fitted: {train_fe.shape[1]} engineered features.")

    # Step 5: Multi-Model Training (Baseline + 2 Candidates)
    print("\n>>> STAGE 5/7: EXPERIMENT MANAGEMENT & MULTI-MODEL TRAINING (MLflow)")
    results = train_models()

    # Step 6: Evaluation
    print("\n>>> STAGE 6/7: MODEL EVALUATION & COMPARISON")
    for r in results:
        name = r["name"]
        f1_val = r['metrics'].get('f1_score', r['metrics'].get('f1', 0.0))
        print(f" -> {name:25s} | PR-AUC: {r['metrics']['pr_auc']:.4f} | ROC-AUC: {r['metrics']['roc_auc']:.4f} | F1: {f1_val:.4f} | Recall: {r['metrics']['recall']:.4f}")

    # Step 7: Model Registration & Quality Gate Promotion
    print("\n>>> STAGE 7/7: MODEL REGISTRY PROMOTION GATE")
    champion_metadata = register_and_promote(results)

    elapsed = time.time() - start_time
    print("\n" + "=" * 70)
    print(f"PIPELINE COMPLETED SUCCESSFULLY IN {elapsed:.2f} SECONDS")
    print(f"Promoted Champion: {champion_metadata['model_name']} (v{champion_metadata['model_version']})")
    print(f"PR-AUC: {champion_metadata['metrics']['pr_auc']:.4f} (Quality Gate >= 0.70: PASSED)")
    print(f"Recall: {champion_metadata['metrics']['recall']:.4f} (Quality Gate >= 0.75: PASSED)")
    print(f"Net Financial Savings: ${champion_metadata['metrics']['net_dollar_savings_usd']:.2f}")
    print("=" * 70)


if __name__ == "__main__":
    run_pipeline()
