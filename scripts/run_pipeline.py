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
    print("PAYGUARD: REAL-TIME DIGITAL PAYMENT FRAUD DETECTION PIPELINE")
    print("=" * 70)

    # Step 1: Data Ingestion & Validation
    print("\n>>> STAGE 1: DATA INGESTION & VALIDATION")
    train_df, test_df = ingest_and_split()

    # Step 2: Training & MLflow Logging
    print("\n>>> STAGE 2: EXPERIMENT MANAGEMENT & MULTI-MODEL TRAINING")
    results = train_models()

    # Step 3: Evaluation & Model Registry Promotion Gate
    print("\n>>> STAGE 3: EVALUATION & MODEL REGISTRY PROMOTION")
    champion_metadata = register_and_promote(results)

    elapsed = time.time() - start_time
    print("\n" + "=" * 70)
    print(f"PIPELINE COMPLETED SUCCESSFULLY IN {elapsed:.2f} SECONDS")
    print(f"Promoted Model: {champion_metadata['model_name']}")
    print(f"PR-AUC: {champion_metadata['metrics']['pr_auc']:.4f}")
    print(f"Recall: {champion_metadata['metrics']['recall']:.4f}")
    print(f"Net Financial Savings: ${champion_metadata['metrics']['net_dollar_savings_usd']:.2f}")
    print("=" * 70)


if __name__ == "__main__":
    run_pipeline()
