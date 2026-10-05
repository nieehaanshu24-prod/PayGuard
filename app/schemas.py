"""
Pydantic schemas for PayGuard Real-Time Fraud Detection REST API.
Enforces strict schema validation, banking field limits, and typed response payloads.
"""

from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict, Any
from datetime import datetime


class TransactionInput(BaseModel):
    transaction_id: Optional[str] = Field(None, example="TXN_987654")
    timestamp: Optional[str] = Field(None, example="2026-10-05 14:30:00")
    user_id: str = Field(..., example="USR_0412")
    amount: float = Field(..., gt=0.0, example=450.00, description="Transaction amount in currency units")
    old_balance: float = Field(..., ge=0.0, example=2500.00, description="Account balance before transaction")
    new_balance: float = Field(..., ge=0.0, example=2050.00, description="Account balance after transaction")
    user_avg_amount_30d: float = Field(..., gt=0.0, example=75.00, description="Historical 30-day average transaction amount")
    channel: str = Field(..., example="UPI", description="Payment channel: UPI, CREDIT_CARD, DEBIT_CARD, NET_BANKING, WALLET")
    merchant_category: str = Field(..., example="electronics", description="Merchant category code or tag")
    is_foreign_transaction: int = Field(0, ge=0, le=1, example=0, description="1 if international transaction, 0 if domestic")
    device_trust_score: float = Field(..., ge=0.0, le=1.0, example=0.88, description="Device behavioral trust score between 0.0 and 1.0")
    location_risk_score: float = Field(..., ge=0.0, le=1.0, example=0.15, description="Geographic IP risk score between 0.0 and 1.0")
    velocity_1h: Optional[int] = Field(1, ge=0, example=2, description="Transactions completed by user in last 1 hour")
    velocity_24h: Optional[int] = Field(2, ge=0, example=4, description="Transactions completed by user in last 24 hours")

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
    model_name: str
    model_version: str
    timestamp: str


class BatchPredictionResponse(BaseModel):
    total_processed: int
    total_flagged_fraud: int
    fraud_rate_pct: float
    average_latency_ms: float
    predictions: List[PredictionResponse]


class FeatureAttribution(BaseModel):
    feature: str
    feature_value: Any
    shap_value: float
    impact: str # INCREASES_FRAUD_RISK or DECREASES_FRAUD_RISK


class ExplanationResponse(BaseModel):
    transaction_id: str
    fraud_probability: float
    is_fraud: bool
    top_risk_factors: List[FeatureAttribution]
    plain_language_summary: str


class FeedbackInput(BaseModel):
    transaction_id: str
    actual_is_fraud: int = Field(..., ge=0, le=1)
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


class DriftSimulationResponse(BaseModel):
    overall_dataset_drift: bool
    drifted_features_count: int
    drifted_features: List[str]
    sample_records_analyzed: int
    feature_metrics: Dict[str, Any]
    action_required: str
