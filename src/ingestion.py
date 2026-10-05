"""
Data ingestion module for PayGuard.
Loads raw transactions, executes validation gates, performs stratified train-test splits,
and persists versioned processed datasets.
"""

import os
import yaml
import pandas as pd
from sklearn.model_selection import train_test_split
from src.validation import validate_dataframe


def ingest_and_split(config_path: str = "config/config.yaml"):
    with open(config_path, "r") as f:
        cfg = yaml.safe_load(f)

    raw_path = cfg["paths"]["raw_data_v1"]
    processed_train_path = cfg["paths"]["processed_train"]
    processed_test_path = cfg["paths"]["processed_test"]
    seed = cfg["project"]["random_seed"]
    test_size = cfg["training"]["test_size"]

    print(f"[Ingestion] Loading raw data from: {raw_path}")
    if not os.path.exists(raw_path):
        raise FileNotFoundError(f"Raw data file not found: {raw_path}")

    df = pd.read_csv(raw_path)
    print(f"[Ingestion] Loaded {len(df)} transactions.")

    # Validation gate
    is_valid, errors = validate_dataframe(df, is_training=True)
    if not is_valid:
        raise ValueError(f"Data validation failed before ingestion: {errors}")
    print("[Ingestion] Data validation passed successfully.")

    # Stratified train-test split
    train_df, test_df = train_test_split(
        df,
        test_size=test_size,
        random_state=seed,
        stratify=df["is_fraud"]
    )

    os.makedirs(os.path.dirname(processed_train_path), exist_ok=True)
    train_df.to_csv(processed_train_path, index=False)
    test_df.to_csv(processed_test_path, index=False)

    print(f"[Ingestion] Saved train set ({len(train_df)} rows, {train_df['is_fraud'].sum()} frauds) to {processed_train_path}")
    print(f"[Ingestion] Saved test set ({len(test_df)} rows, {test_df['is_fraud'].sum()} frauds) to {processed_test_path}")

    return train_df, test_df


if __name__ == "__main__":
    ingest_and_split()
