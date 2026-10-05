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


def task_feature_engineering_and_preprocessing():
    print("[Airflow Task] Running Feature Engineering & Preprocessing...")
    import pandas as pd
    from src.feature_engineering import engineer_features
    from src.preprocessing import PreprocessingPipeline
    df = pd.read_csv("data/processed/train.csv")
    df_fe = engineer_features(df)
    preprocessor = PreprocessingPipeline("models/preprocessor.joblib")
    preprocessor.fit_transform(df_fe)
    print("[Airflow Task] Feature engineering and preprocessing completed.")


def task_model_training():
    print("[Airflow Task] Running Model Training for Baseline, Random Forest, and XGBoost...")
    from src.train import train_models
    results = train_models()
    # Save temporary results for evaluation task
    import joblib
    os.makedirs("models/tmp", exist_ok=True)
    joblib.dump(results, "models/tmp/airflow_training_results.joblib")
    print("[Airflow Task] Model training completed.")


def task_model_evaluation():
    print("[Airflow Task] Running Model Evaluation...")
    import joblib
    results = joblib.load("models/tmp/airflow_training_results.joblib")
    print(f"[Airflow Task] Evaluated {len(results)} candidate models.")


def task_model_registration():
    print("[Airflow Task] Running Model Registration & Quality Gate Promotion...")
    import joblib
    from src.register import register_and_promote
    results = joblib.load("models/tmp/airflow_training_results.joblib")
    meta = register_and_promote(results)
    print(f"[Airflow Task] Champion model registered: {meta['model_name']}")


if AIRFLOW_AVAILABLE:
    dag = DAG(
        "payguard_fraud_detection_pipeline",
        default_args=default_args,
        description="End-to-End Orchestrated ML Pipeline for Payment Fraud Detection",
        schedule_interval=timedelta(days=7),
        start_date=datetime(2026, 1, 1),
        catchup=False,
        tags=["mlops", "fraud-detection", "payguard", "xgboost"]
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

    t3_feature_eng = PythonOperator(
        task_id="feature_engineering_and_preprocessing",
        python_callable=task_feature_engineering_and_preprocessing,
        dag=dag
    )

    t4_train = PythonOperator(
        task_id="model_training",
        python_callable=task_model_training,
        dag=dag
    )

    t5_evaluate = PythonOperator(
        task_id="model_evaluation",
        python_callable=task_model_evaluation,
        dag=dag
    )

    t6_register = PythonOperator(
        task_id="model_registration",
        python_callable=task_model_registration,
        dag=dag
    )

    # Airflow task dependencies
    t1_ingest >> t2_validate >> t3_feature_eng >> t4_train >> t5_evaluate >> t6_register
