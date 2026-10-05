"""
Data validation module for PayGuard transactions.
Performs strict schema validation, range checks, null checks, and logical banking consistency.
"""

import pandas as pd
import numpy as np
from typing import Tuple, List, Dict, Any


REQUIRED_COLUMNS = [
    "transaction_id", "timestamp", "user_id", "amount", "old_balance",
    "new_balance", "user_avg_amount_30d", "channel", "merchant_category",
    "is_foreign_transaction", "device_trust_score", "location_risk_score"
]

VALID_CHANNELS = {"UPI", "CREDIT_CARD", "DEBIT_CARD", "NET_BANKING", "WALLET"}


def validate_dataframe(df: pd.DataFrame, is_training: bool = True) -> Tuple[bool, List[str]]:
    """
    Validates transactional dataframe against banking compliance constraints.
    Returns (is_valid, list_of_error_messages).
    """
    errors = []

    # 1. Required column presence
    missing_cols = [col for col in REQUIRED_COLUMNS if col not in df.columns]
    if missing_cols:
        errors.append(f"Missing required columns: {missing_cols}")

    if is_training and "is_fraud" not in df.columns:
        errors.append("Target column 'is_fraud' missing from training dataset.")

    if errors:
        return False, errors

    # 2. Null checks
    null_counts = df[REQUIRED_COLUMNS].isnull().sum()
    cols_with_nulls = null_counts[null_counts > 0].to_dict()
    if cols_with_nulls:
        errors.append(f"Null values detected in columns: {cols_with_nulls}")

    # 3. Value range assertions
    if (df["amount"] <= 0).any():
        neg_count = (df["amount"] <= 0).sum()
        errors.append(f"Negative or zero transaction amounts found: {neg_count} rows.")

    if (df["old_balance"] < 0).any():
        errors.append("Negative old_balance values detected.")

    if (df["device_trust_score"] < 0.0).any() or (df["device_trust_score"] > 1.0).any():
        errors.append("device_trust_score outside valid [0.0, 1.0] interval.")

    if (df["location_risk_score"] < 0.0).any() or (df["location_risk_score"] > 1.0).any():
        errors.append("location_risk_score outside valid [0.0, 1.0] interval.")

    # 4. Categorical validity
    invalid_channels = set(df["channel"].dropna().unique()) - VALID_CHANNELS
    if invalid_channels:
        errors.append(f"Unrecognized payment channels detected: {invalid_channels}")

    is_valid = len(errors) == 0
    return is_valid, errors


def validate_single_transaction(txn: Dict[str, Any]) -> Tuple[bool, List[str]]:
    """
    Validates a single incoming real-time transaction payload.
    """
    df = pd.DataFrame([txn])
    return validate_dataframe(df, is_training=False)
