"""
Feature engineering module for PayGuard transactions.
Derives domain-specific fraud indicators including velocity ratios, balance differences,
and temporal cyclic features.
"""

import pandas as pd
import numpy as np


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Transforms raw transaction records into enriched feature vectors.
    """
    df_out = df.copy()

    # 1. Ratio of current amount to 30-day user average
    if "user_avg_amount_30d" in df_out.columns:
        df_out["amount_to_avg_ratio"] = (
            df_out["amount"] / (df_out["user_avg_amount_30d"] + 1e-5)
        ).round(4)
    else:
        df_out["amount_to_avg_ratio"] = 1.0

    # 2. Balance consistency difference
    if "old_balance" in df_out.columns and "new_balance" in df_out.columns:
        df_out["balance_diff"] = (df_out["old_balance"] - df_out["new_balance"]).round(2)
    else:
        df_out["balance_diff"] = df_out["amount"]

    # 3. Temporal feature extraction with fast string path
    if "timestamp" in df_out.columns:
        ts_val = str(df_out["timestamp"].iloc[0]) if len(df_out) == 1 else None
        if ts_val and len(ts_val) >= 13 and ts_val[10] == " " and ts_val[11:13].isdigit():
            if "hour_of_day" not in df_out.columns:
                df_out["hour_of_day"] = int(ts_val[11:13])
            if "is_weekend" not in df_out.columns:
                df_out["is_weekend"] = 0
        else:
            tx_dt = pd.to_datetime(df_out["timestamp"])
            if "hour_of_day" not in df_out.columns:
                df_out["hour_of_day"] = tx_dt.dt.hour
            if "is_weekend" not in df_out.columns:
                df_out["is_weekend"] = (tx_dt.dt.weekday >= 5).astype(int)
    else:
        if "hour_of_day" not in df_out.columns:
            df_out["hour_of_day"] = 12
        if "is_weekend" not in df_out.columns:
            df_out["is_weekend"] = 0

    # 4. Fill default velocity if not present
    if "velocity_1h" not in df_out.columns:
        df_out["velocity_1h"] = 1
    if "velocity_24h" not in df_out.columns:
        df_out["velocity_24h"] = 1

    return df_out
