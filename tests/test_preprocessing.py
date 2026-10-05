"""
Unit tests for PayGuard preprocessing and feature engineering.
"""

import pytest
import pandas as pd
import numpy as np

from src.validation import validate_dataframe, validate_single_transaction
from src.feature_engineering import engineer_features
from src.preprocessing import PreprocessingPipeline


@pytest.fixture
def sample_raw_dataframe():
    return pd.DataFrame([{
        "transaction_id": "TXN_001",
        "timestamp": "2026-10-05 14:30:00",
        "user_id": "USR_001",
        "amount": 250.00,
        "old_balance": 1000.00,
        "new_balance": 750.00,
        "user_avg_amount_30d": 50.00,
        "channel": "UPI",
        "merchant_category": "electronics",
        "is_foreign_transaction": 0,
        "device_trust_score": 0.85,
        "location_risk_score": 0.10,
        "velocity_1h": 1,
        "velocity_24h": 3,
        "is_fraud": 0
    }])


def test_validation_success(sample_raw_dataframe):
    is_valid, errors = validate_dataframe(sample_raw_dataframe, is_training=True)
    assert is_valid is True
    assert len(errors) == 0


def test_validation_negative_amount(sample_raw_dataframe):
    bad_df = sample_raw_dataframe.copy()
    bad_df.loc[0, "amount"] = -10.0
    is_valid, errors = validate_dataframe(bad_df, is_training=True)
    assert is_valid is False
    assert any("Negative or zero transaction amounts" in e for e in errors)


def test_validation_invalid_channel(sample_raw_dataframe):
    bad_df = sample_raw_dataframe.copy()
    bad_df.loc[0, "channel"] = "BITCOIN_ILLEGAL"
    is_valid, errors = validate_dataframe(bad_df, is_training=True)
    assert is_valid is False
    assert any("Unrecognized payment channels" in e for e in errors)


def test_feature_engineering(sample_raw_dataframe):
    df_fe = engineer_features(sample_raw_dataframe)
    assert "amount_to_avg_ratio" in df_fe.columns
    assert "balance_diff" in df_fe.columns
    assert "hour_of_day" in df_fe.columns
    assert "is_weekend" in df_fe.columns
    assert df_fe.loc[0, "amount_to_avg_ratio"] == pytest.approx(5.0, 0.01)
    assert df_fe.loc[0, "balance_diff"] == pytest.approx(250.0, 0.01)
    assert df_fe.loc[0, "hour_of_day"] == 14
