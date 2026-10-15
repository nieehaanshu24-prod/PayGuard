"""
Apache Airflow DAG for PayGuard: Real-Time Digital Payment Fraud Detection.
Covers: Data Ingestion -> Validation -> Preprocessing -> Feature Engineering -> Training -> Evaluation -> Model Registration.
"""

from datetime import datetime, timedelta
import os
import sys

# Airflow standard imports (mock-compatible when airflow is not installed locally)
try:
    from airflow import DAG
    from airflow.operators.python import PythonOperator
    AIRFLOW_AVAILABLE = True
except ImportError:
    AIRFLOW_AVAILABLE = False


default_args = {
    "owner": "mlops_payguard",
    "depends_on_past": False,
    "email_on_failure": False,
    "email_on_retry": False,
    "retries": 1,
    "retry_delay": timedelta(minutes=5),
}


def task_data_ingestion():
    print("[Airflow Task] Running Data Ingestion...")
    from src.ingestion import ingest_and_split
    ingest_and_split()
    print("[Airflow Task] Ingestion completed.")


def task_data_validation():
    print("[Airflow Task] Running Data Validation...")
    import pandas as pd
    from src.validation import validate_dataframe
    df = pd.read_csv("data/processed/train.csv")
    is_valid, errors = validate_dataframe(df, is_training=True)
    if not is_valid:
        raise ValueError(f"Validation failed: {errors}")
    print("[Airflow Task] Data validation passed.")


def task_preprocessing():
    print("[Airflow Task 3/7] Running Data Preprocessing...")
    import pandas as pd
    from src.preprocessing import PreprocessingPipeline
    df = pd.read_csv("data/processed/train.csv")
    # Clean and initialize preprocessor pipeline
    preprocessor = PreprocessingPipeline("models/preprocessor.joblib")
    print(f"[Airflow Task 3/7] Preprocessing initialized on {len(df)} rows.")


def task_feature_engineering():
    print("[Airflow Task 4/7] Running Feature Engineering...")
    import pandas as pd
    from src.feature_engineering import engineer_features
    from src.preprocessing import PreprocessingPipeline
    df = pd.read_csv("data/processed/train.csv")
    df_fe = engineer_features(df)
    preprocessor = PreprocessingPipeline("models/preprocessor.joblib")
    preprocessor.fit_transform(df_fe)
    print(f"[Airflow Task 4/7] Feature engineering completed. Output features: {df_fe.shape[1]}")


def task_model_training():
    print("[Airflow Task 5/7] Running Model Training for Baseline, Random Forest, and XGBoost...")
    from src.train import train_models
    results = train_models()
    # Save temporary results for evaluation task
    import joblib
    os.makedirs("models/tmp", exist_ok=True)
    joblib.dump(results, "models/tmp/airflow_training_results.joblib")
    print("[Airflow Task 5/7] Model training completed.")


def task_model_evaluation():
    print("[Airflow Task 6/7] Running Model Evaluation & Comparison...")
    import joblib
    results = joblib.load("models/tmp/airflow_training_results.joblib")
    for r in results:
        f1_val = r['metrics'].get('f1_score', r['metrics'].get('f1', 0.0))
        print(f" -> {r['name']}: PR-AUC={r['metrics']['pr_auc']:.4f}, ROC-AUC={r['metrics']['roc_auc']:.4f}, F1={f1_val:.4f}")
    print(f"[Airflow Task 6/7] Evaluated {len(results)} candidate models successfully.")


def task_model_registration():
    print("[Airflow Task 7/7] Running Model Registration & Quality Gate Promotion...")
    import joblib
    from src.register import register_and_promote
    results = joblib.load("models/tmp/airflow_training_results.joblib")
    meta = register_and_promote(results)
    print(f"[Airflow Task 7/7] Champion model registered: {meta['model_name']} v{meta['model_version']}")


if AIRFLOW_AVAILABLE:
    dag = DAG(
        "payguard_fraud_detection_pipeline",
        default_args=default_args,
        description="End-to-End Orchestrated ML Pipeline for Payment Fraud Detection (7 Stages)",
        schedule_interval=timedelta(days=7),
        start_date=datetime(2026, 1, 1),
        catchup=False,
        tags=["mlops", "fraud-detection", "payguard", "xgboost", "airflow"]
    )

    t1_ingest = PythonOperator(
        task_id="data_ingestion",
        python_callable=task_data_ingestion,
        dag=dag
    )

    t2_validate = PythonOperator(
        task_id="data_validation",
        python_callable=task_data_validation,
        dag=dag
    )

    t3_preprocess = PythonOperator(
        task_id="data_preprocessing",
        python_callable=task_preprocessing,
        dag=dag
    )

    t4_feature_eng = PythonOperator(
        task_id="feature_engineering",
        python_callable=task_feature_engineering,
        dag=dag
    )

    t5_train = PythonOperator(
        task_id="model_training",
        python_callable=task_model_training,
        dag=dag
    )

    t6_evaluate = PythonOperator(
        task_id="model_evaluation",
        python_callable=task_model_evaluation,
        dag=dag
    )

    t7_register = PythonOperator(
        task_id="model_registration",
        python_callable=task_model_registration,
        dag=dag
    )

    # Airflow 7-stage task dependencies
    t1_ingest >> t2_validate >> t3_preprocess >> t4_feature_eng >> t5_train >> t6_evaluate >> t7_register
