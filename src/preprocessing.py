"""
Data preprocessing pipeline for PayGuard.
Constructs sklearn preprocessor with StandardScaler for continuous features
and OneHotEncoder for categorical payment channels and merchant categories.
"""

import os
import joblib
import pandas as pd
import numpy as np
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder

NUMERICAL_COLS = [
    "amount", "old_balance", "new_balance", "user_avg_amount_30d",
    "amount_to_avg_ratio", "balance_diff", "velocity_1h", "velocity_24h",
    "device_trust_score", "location_risk_score", "hour_of_day", "is_weekend"
]

CATEGORICAL_COLS = [
    "channel", "merchant_category", "is_foreign_transaction"
]


class PreprocessingPipeline:
    def __init__(self, preprocessor_path: str = "models/preprocessor.joblib"):
        self.preprocessor_path = preprocessor_path
        self.preprocessor = None
        self.feature_names = None

    def build_transformer(self) -> ColumnTransformer:
        transformer = ColumnTransformer(
            transformers=[
                ("num", StandardScaler(), NUMERICAL_COLS),
                ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), CATEGORICAL_COLS)
            ],
            remainder="drop"
        )
        return transformer

    def fit_transform(self, df: pd.DataFrame) -> Tuple[np.ndarray, List[str]]:
        self.preprocessor = self.build_transformer()
        X_trans = self.preprocessor.fit_transform(df)

        # Extract generated feature names
        cat_encoder = self.preprocessor.named_transformers_["cat"]
        cat_features = list(cat_encoder.get_feature_names_out(CATEGORICAL_COLS))
        self.feature_names = NUMERICAL_COLS + cat_features

        # Persist preprocessor
        os.makedirs(os.path.dirname(self.preprocessor_path), exist_ok=True)
        joblib.dump({
            "transformer": self.preprocessor,
            "feature_names": self.feature_names,
            "numerical_cols": NUMERICAL_COLS,
            "categorical_cols": CATEGORICAL_COLS
        }, self.preprocessor_path)

        return X_trans, self.feature_names

    def transform(self, df: pd.DataFrame) -> np.ndarray:
        if self.preprocessor is None:
            self.load()
        return self.preprocessor.transform(df)

    def load(self):
        if not os.path.exists(self.preprocessor_path):
            raise FileNotFoundError(f"Preprocessor artifact not found at {self.preprocessor_path}")
        data = joblib.load(self.preprocessor_path)
        self.preprocessor = data["transformer"]
        self.feature_names = data["feature_names"]
        return self


from typing import Tuple, List
