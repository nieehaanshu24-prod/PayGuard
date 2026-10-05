"""
Explainable AI (XAI) module for PayGuard using SHAP (SHapley Additive exPlanations).
Computes exact Shapley values and feature attributions for real-time fraud decisions,
returning structured explanations and human-interpretable summaries for bank analysts.
"""

import shap
import pandas as pd
import numpy as np
from typing import Dict, Any, List

from src.feature_engineering import engineer_features
from app.model_loader import get_model_service


class PayGuardExplainer:
    def __init__(self):
        self.service = get_model_service()
        self.model = self.service.model
        self.preprocessor = self.service.preprocessor
        self.feature_names = self.preprocessor.feature_names

        print("[Explainer] Initializing SHAP TreeExplainer...")
        try:
            self.explainer = shap.TreeExplainer(self.model)
        except Exception as e:
            print(f"[Explainer] Fallback generic explainer: {e}")
            self.explainer = shap.Explainer(self.model)

    def explain_transaction(self, txn_dict: Dict[str, Any], top_k: int = 5) -> Dict[str, Any]:
        df_raw = pd.DataFrame([txn_dict])
        df_fe = engineer_features(df_raw)
        X_trans = self.preprocessor.transform(df_fe)

        # Get fraud prediction probability
        prob = float(self.model.predict_proba(X_trans)[0, 1])
        is_fraud = bool(prob >= self.service.threshold)

        # Compute SHAP values
        shap_values = self.explainer.shap_values(X_trans)

        # Handle binary classification shapes from different tree implementations
        if isinstance(shap_values, list):
            sv = shap_values[1][0] # class 1 (fraud)
        elif len(shap_values.shape) == 3:
            sv = shap_values[0, :, 1]
        elif len(shap_values.shape) == 2:
            sv = shap_values[0]
        else:
            sv = np.array(shap_values).flatten()

        # Match with feature names and values
        attributions = []
        for i, feat_name in enumerate(self.feature_names):
            val = float(X_trans[0, i]) if i < X_trans.shape[1] else 0.0
            shap_val = float(sv[i])
            impact = "INCREASES_FRAUD_RISK" if shap_val > 0 else "DECREASES_FRAUD_RISK"
            attributions.append({
                "feature": feat_name,
                "feature_value": round(val, 3),
                "shap_value": round(shap_val, 4),
                "impact": impact,
                "abs_importance": abs(shap_val)
            })

        # Sort by absolute impact
        attributions.sort(key=lambda x: x["abs_importance"], reverse=True)
        top_factors = attributions[:top_k]

        # Generate analyst summary
        top_risks = [f"{f['feature']} (impact: {f['shap_value']:+.3f})" for f in top_factors if f['shap_value'] > 0]
        if is_fraud:
            summary = (
                f"Transaction flagged as SUSPICIOUS with {prob * 100:.1f}% fraud probability. "
                f"Primary drivers pushing the risk score were: {', '.join(top_risks[:3])}."
            )
        else:
            summary = (
                f"Transaction assessed as LEGITIMATE with {prob * 100:.1f}% risk score "
                f"(below {self.service.threshold:.2f} threshold). Features show normal consumer baseline behavior."
            )

        return {
            "transaction_id": txn_dict.get("transaction_id", "TXN_LIVE"),
            "fraud_probability": round(prob, 4),
            "is_fraud": is_fraud,
            "top_risk_factors": top_factors,
            "plain_language_summary": summary
        }


_explainer = None

def get_explainer() -> PayGuardExplainer:
    global _explainer
    if _explainer is None:
        _explainer = PayGuardExplainer()
    return _explainer
