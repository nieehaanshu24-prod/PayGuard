"""
Integration tests for PayGuard FastAPI prediction service.
Tests /health, /predict, /predict/batch, /explain, /feedback, and /drift/simulate.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


@pytest.fixture
def legitimate_transaction_payload():
    return {
        "transaction_id": "TXN_LEGIT_999",
        "timestamp": "2026-10-05 14:15:00",
        "user_id": "USR_0100",
        "amount": 45.00,
        "old_balance": 3500.00,
        "new_balance": 3455.00,
        "user_avg_amount_30d": 50.00,
        "channel": "UPI",
        "merchant_category": "grocery",
        "is_foreign_transaction": 0,
        "device_trust_score": 0.95,
        "location_risk_score": 0.05,
        "velocity_1h": 0,
        "velocity_24h": 1
    }


@pytest.fixture
def fraudulent_transaction_payload():
    return {
        "transaction_id": "TXN_FRAUD_999",
        "timestamp": "2026-10-05 02:30:00",
        "user_id": "USR_0100",
        "amount": 2500.00,
        "old_balance": 5000.00,
        "new_balance": 2500.00,
        "user_avg_amount_30d": 50.00,
        "channel": "CREDIT_CARD",
        "merchant_category": "crypto_exchange",
        "is_foreign_transaction": 1,
        "device_trust_score": 0.05,
        "location_risk_score": 0.95,
        "velocity_1h": 5,
        "velocity_24h": 8
    }


def test_health_check_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["model_loaded"] is True
    assert "uptime_seconds" in data


def test_predict_legitimate_transaction(legitimate_transaction_payload):
    response = client.post("/predict", json=legitimate_transaction_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["transaction_id"] == "TXN_LEGIT_999"
    assert data["is_fraud"] is False
    assert data["risk_level"] == "LOW"
    assert data["recommendation"] == "APPROVE"
    assert data["latency_ms"] >= 0.0


def test_predict_fraudulent_transaction(fraudulent_transaction_payload):
    response = client.post("/predict", json=fraudulent_transaction_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["transaction_id"] == "TXN_FRAUD_999"
    assert data["is_fraud"] is True
    assert data["fraud_probability"] > 0.50
    assert data["risk_level"] in ["MEDIUM", "HIGH"]


def test_predict_invalid_schema():
    bad_payload = {
        "amount": -500.00 # Negative amount should fail Pydantic validation
    }
    response = client.post("/predict", json=bad_payload)
    assert response.status_code == 422


def test_explain_endpoint(fraudulent_transaction_payload):
    response = client.post("/explain", json=fraudulent_transaction_payload)
    assert response.status_code == 200
    data = response.json()
    assert "top_risk_factors" in data
    assert len(data["top_risk_factors"]) > 0
    assert "plain_language_summary" in data


def test_delayed_feedback_endpoint():
    feedback_payload = {
        "transaction_id": "TXN_LEGIT_999",
        "actual_is_fraud": 0
    }
    response = client.post("/feedback", json=feedback_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"


def test_drift_simulation_endpoint():
    response = client.post("/drift/simulate?sample_size=300")
    assert response.status_code == 200
    data = response.json()
    assert "overall_dataset_drift" in data
    assert "feature_metrics" in data
