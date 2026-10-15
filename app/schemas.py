"""
Pydantic schemas for PayGuard Real-Time Fraud Detection REST API.
Enforces strict schema validation, banking field limits, and typed response payloads.
"""

from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict, Any
from datetime import datetime


class TransactionInput(BaseModel):
    transaction_id: Optional[str] = Field(None, json_schema_extra={"example": "TXN_987654"})
    timestamp: Optional[str] = Field(None, json_schema_extra={"example": "2026-10-05 14:30:00"})
    user_id: str = Field(..., json_schema_extra={"example": "USR_0412"})
    amount: float = Field(..., gt=0.0, description="Transaction amount in currency units", json_schema_extra={"example": 450.00})
    old_balance: float = Field(..., ge=0.0, description="Account balance before transaction", json_schema_extra={"example": 2500.00})
    new_balance: float = Field(..., ge=0.0, description="Account balance after transaction", json_schema_extra={"example": 2050.00})
    user_avg_amount_30d: float = Field(..., gt=0.0, description="Historical 30-day average transaction amount", json_schema_extra={"example": 75.00})
    channel: str = Field(..., description="Payment channel: UPI, CREDIT_CARD, DEBIT_CARD, NET_BANKING, WALLET", json_schema_extra={"example": "UPI"})
    merchant_category: str = Field(..., description="Merchant category code or tag", json_schema_extra={"example": "electronics"})
    is_foreign_transaction: int = Field(0, ge=0, le=1, description="1 if international transaction, 0 if domestic", json_schema_extra={"example": 0})
    device_trust_score: float = Field(..., ge=0.0, le=1.0, description="Device behavioral trust score between 0.0 and 1.0", json_schema_extra={"example": 0.88})
    location_risk_score: float = Field(..., ge=0.0, le=1.0, description="Geographic IP risk score between 0.0 and 1.0", json_schema_extra={"example": 0.15})
    velocity_1h: Optional[int] = Field(1, ge=0, description="Transactions completed by user in last 1 hour", json_schema_extra={"example": 2})
    velocity_24h: Optional[int] = Field(2, ge=0, description="Transactions completed by user in last 24 hours", json_schema_extra={"example": 4})

    @field_validator("channel")
    def validate_channel(cls, v):
        valid = {"UPI", "CREDIT_CARD", "DEBIT_CARD", "NET_BANKING", "WALLET"}
        if v.upper() not in valid:
            raise ValueError(f"Invalid channel '{v}'. Must be one of {valid}")
        return v.upper()


class BatchTransactionInput(BaseModel):
    transactions: List[TransactionInput]


class PredictionResponse(BaseModel):
    transaction_id: str
    is_fraud: bool
    fraud_probability: float
    risk_level: str # LOW, MEDIUM, HIGH
    recommendation: str # APPROVE, STEP_UP_AUTHENTICATION_OTP, BLOCK_TRANSACTION
    decision_threshold: float
    latency_ms: float
    inference_latency_ms: Optional[float] = None
    verdict: Optional[str] = None # "BLOCKED", "STEP-UP / REVIEW", "APPROVED"
    model_name: str
    model_version: str
    timestamp: str


class BatchPredictionResponse(BaseModel):
    total_processed: int
    total_flagged_fraud: int
    fraud_rate_pct: float
    average_latency_ms: float
    predictions: List[PredictionResponse]
    results: Optional[List[PredictionResponse]] = None


class FeatureAttribution(BaseModel):
    feature: str
    feature_value: Any
    value: Optional[Any] = None # Alias for UI table
    shap_value: float
    impact: Any # float or string
    impact_value: Optional[float] = None
    direction: Optional[str] = "positive"


class ExplanationResponse(BaseModel):
    transaction_id: str
    fraud_probability: float
    is_fraud: bool
    base_value: Optional[float] = 0.082
    prediction: Optional[float] = None
    top_risk_factors: List[FeatureAttribution]
    shap_values: Optional[List[Dict[str, Any]]] = None # Alias for UI table
    plain_language_summary: str


class FeedbackInput(BaseModel):
    transaction_id: str
    actual_is_fraud: Optional[int] = Field(None, ge=0, le=1)
    actual_label: Optional[int] = Field(None, ge=0, le=1)
    analyst_notes: Optional[str] = None
    analyst_id: Optional[str] = None
    feedback_timestamp: Optional[str] = None


class FeedbackResponse(BaseModel):
    status: str
    message: str
    recorded_records_count: int


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    model_loaded: bool
    champion_model_name: Optional[str] = None
    champion_model_version: Optional[str] = None
    uptime_seconds: float
    is_live: Optional[bool] = True
    model_version: Optional[str] = None
    timestamp: Optional[str] = None
    latency_ms: Optional[float] = None
    last_checked: Optional[str] = None


class DriftSimulationRequest(BaseModel):
    drift_type: Optional[str] = "concept_drift"
    sample_size: Optional[int] = 1000


class DriftFeatureDetail(BaseModel):
    feature: str
    psi: float
    status: str
    ks_p_value: float


class DriftSimulationResponse(BaseModel):
    overall_dataset_drift: bool
    drifted_features_count: int
    drifted_features: List[str]
    sample_records_analyzed: int
    feature_metrics: Dict[str, Any]
    action_required: str
    status: Optional[str] = "drift_detected"
    overall_psi: Optional[float] = 0.0588
    drift_threshold: Optional[float] = 0.10
    features_monitored: Optional[int] = 7
    timestamp: Optional[str] = None
    details: Optional[List[Dict[str, Any]]] = None
