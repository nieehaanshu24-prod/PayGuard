"""
Champion model and preprocessor loader for PayGuard FastAPI service.
Loads serialized artifacts and metadata, executing real-time feature engineering and inference.
"""

import os
import json
import time
import joblib
import pandas as pd
import numpy as np
from typing import Dict, Any, Tuple

from src.feature_engineering import engineer_features
from src.preprocessing import PreprocessingPipeline


class PayGuardModelService:
    def __init__(
        self,
        champion_path: str = "models/champion_model.joblib",
        preprocessor_path: str = "models/preprocessor.joblib",
        metadata_path: str = "models/model_metadata.json"
    ):
        self.champion_path = champion_path
        self.preprocessor_path = preprocessor_path
        self.metadata_path = metadata_path

        self.model = None
        self.preprocessor = None
        self.metadata = {}
        self.threshold = 0.5
        self.model_name = "Unknown"
        self.model_version = "v1.0"

        self.load()

    def load(self):
        if not os.path.exists(self.champion_path):
            raise FileNotFoundError(f"Champion model not found at {self.champion_path}. Run training pipeline first.")

        print(f"[ModelService] Loading champion model from {self.champion_path}...")
        self.model = joblib.load(self.champion_path)
        if hasattr(self.model, "n_jobs"):
            self.model.n_jobs = 1 # Eliminate joblib thread creation latency on single rows

        print(f"[ModelService] Loading preprocessor from {self.preprocessor_path}...")
        self.preprocessor = PreprocessingPipeline(self.preprocessor_path)
        self.preprocessor.load()

        if os.path.exists(self.metadata_path):
            with open(self.metadata_path, "r") as f:
                self.metadata = json.load(f)
                self.threshold = float(self.metadata.get("optimal_threshold", 0.5))
                self.model_name = self.metadata.get("model_name", "XGBoost_Candidate")
                self.model_version = str(self.metadata.get("model_version", "1"))
        print(f"[ModelService] Model ready: {self.model_name} (ver {self.model_version}, threshold {self.threshold:.3f})")

    def predict_single(self, txn_dict: Dict[str, Any]) -> Tuple[bool, float, str, str, float]:
        start = time.perf_counter()

        df_raw = pd.DataFrame([txn_dict])
        df_fe = engineer_features(df_raw)
        X_trans = self.preprocessor.transform(df_fe)

        prob = float(self.model.predict_proba(X_trans)[0, 1])
        is_fraud = bool(prob >= self.threshold)

        # Risk tiers and actionable banking recommendation
        if prob >= 0.80:
            risk_level = "HIGH"
            recommendation = "BLOCK_TRANSACTION"
        elif prob >= self.threshold:
            risk_level = "MEDIUM"
            recommendation = "STEP_UP_AUTHENTICATION_OTP"
        else:
            risk_level = "LOW"
            recommendation = "APPROVE"

        latency_ms = (time.perf_counter() - start) * 1000.0
        return is_fraud, prob, risk_level, recommendation, latency_ms

    def predict_batch(self, txn_list: list) -> Tuple[list, float]:
        start = time.perf_counter()
        df_raw = pd.DataFrame(txn_list)
        df_fe = engineer_features(df_raw)
        X_trans = self.preprocessor.transform(df_fe)

        probs = self.model.predict_proba(X_trans)[:, 1]
        preds = (probs >= self.threshold).astype(int)

        results = []
        for i, row in enumerate(txn_list):
            prob = float(probs[i])
            is_fraud = bool(preds[i])
            if prob >= 0.80:
                risk_level = "HIGH"
                rec = "BLOCK_TRANSACTION"
            elif prob >= self.threshold:
                risk_level = "MEDIUM"
                rec = "STEP_UP_AUTHENTICATION_OTP"
            else:
                risk_level = "LOW"
                rec = "APPROVE"

            results.append({
                "transaction_id": row.get("transaction_id", f"TXN_{i}"),
                "is_fraud": is_fraud,
                "fraud_probability": round(prob, 4),
                "risk_level": risk_level,
                "recommendation": rec,
                "decision_threshold": round(self.threshold, 4),
                "latency_ms": 0.0,
                "model_name": self.model_name,
                "model_version": self.model_version,
                "timestamp": str(row.get("timestamp", ""))
            })

        total_latency = (time.perf_counter() - start) * 1000.0
        return results, total_latency


# Singleton instance
_service = None

def get_model_service() -> PayGuardModelService:
    global _service
    if _service is None:
        _service = PayGuardModelService()
    return _service
