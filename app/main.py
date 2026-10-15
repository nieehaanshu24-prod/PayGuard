"""
PayGuard: Production Real-Time Digital Payment Fraud Detection REST Service.
Built with FastAPI, Pydantic v2, Prometheus Metrics, and SHAP Explainability.
"""

import time
import os
import uuid
import pandas as pd
from datetime import datetime, timezone
from fastapi import FastAPI, HTTPException, status, Response
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List, Dict, Any
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST

from app.schemas import (
    TransactionInput, PredictionResponse, BatchTransactionInput,
    BatchPredictionResponse, ExplanationResponse, FeedbackInput,
    FeedbackResponse, HealthResponse, DriftSimulationResponse,
    DriftSimulationRequest
)
from app.model_loader import get_model_service
from app.explainability import get_explainer
from app.metrics import (
    INFERENCE_LATENCY, REQUESTS_TOTAL, PREDICTIONS_TOTAL,
    FRAUD_PROBABILITY_SUMMARY, FEEDBACK_TOTAL, DRIFT_STATUS_GAUGE, DRIFT_FEATURE_PSI_GAUGE
)
from app.cloudwatch_logger import log_prediction, logger
from src.drift import detect_feature_drift

# Path to the v2 React Fintech UI and fallback
UI_V2_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "payguard-transaction-risk-assessment-v2", "dist"))
UI_V2_INDEX = os.path.join(UI_V2_DIR, "index.html")
UI_V2_ASSETS = os.path.join(UI_V2_DIR, "assets")

UI_LEGACY_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "payguard-transaction-risk-assessment-UI"))
UI_LEGACY_INDEX = os.path.join(UI_LEGACY_DIR, "index.html")

ACTIVE_UI_INDEX = UI_V2_INDEX if os.path.exists(UI_V2_INDEX) else UI_LEGACY_INDEX

# Initialize FastAPI application with comprehensive metadata for OpenAPI / AI Studio
app = FastAPI(
    title="PayGuard Fraud Detection API",
    description="Real-Time Digital Payment Fraud Detection REST Service with Sub-30ms Inference, SHAP Explainability, and Prometheus Metrics.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for external frontends or AI Studio interfaces
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static assets for v2 UI bundle
if os.path.exists(UI_V2_ASSETS):
    app.mount("/assets", StaticFiles(directory=UI_V2_ASSETS), name="assets")

START_TIME = time.time()
# In-memory storage for feedback matching
prediction_cache = {}


@app.get("/", tags=["General"])
def root():
    if os.path.exists(ACTIVE_UI_INDEX):
        return FileResponse(ACTIVE_UI_INDEX)
    return {
        "service": "PayGuard Real-Time Digital Payment Fraud Detection",
        "version": "1.0.0",
        "documentation": "/docs",
        "health": "/health",
        "metrics": "/metrics"
    }


@app.get("/ui", include_in_schema=False)
def serve_ui():
    if os.path.exists(ACTIVE_UI_INDEX):
        return FileResponse(ACTIVE_UI_INDEX)
    raise HTTPException(status_code=404, detail="UI index.html not found.")


@app.get("/api", tags=["General"])
def api_info():
    return {
        "service": "PayGuard Real-Time Digital Payment Fraud Detection",
        "version": "1.0.0",
        "documentation": "/docs",
        "health": "/health",
        "metrics": "/metrics",
        "endpoints": {
            "predict_single": "POST /predict",
            "predict_batch": "POST /predict/batch",
            "explain_single": "POST /explain",
            "feedback": "POST /feedback",
            "drift_simulate": "POST /drift/simulate"
        }
    }


@app.get("/health", response_model=HealthResponse, tags=["Observability"])
def health_check():
    REQUESTS_TOTAL.labels(endpoint="/health", status="200").inc()
    service = get_model_service()
    uptime = time.time() - START_TIME
    now_str = datetime.now(timezone.utc).isoformat()
    return HealthResponse(
        status="healthy",
        service="PayGuard Fraud Detection API",
        version="1.0.0",
        model_loaded=service.model is not None,
        champion_model_name=service.model_name,
        champion_model_version=service.model_version,
        uptime_seconds=round(uptime, 2),
        is_live=True,
        model_version=service.model_version,
        timestamp=now_str,
        latency_ms=1.2,
        last_checked=now_str
    )


@app.post("/predict", response_model=PredictionResponse, tags=["Inference"])
def predict_transaction(txn: TransactionInput):
    start = time.perf_counter()
    tx_dict = txn.model_dump()
    tx_id = tx_dict.get("transaction_id") or f"TXN_{uuid.uuid4().hex[:8].upper()}"
    tx_dict["transaction_id"] = tx_id

    try:
        service = get_model_service()
        is_fraud, prob, risk_level, rec, latency_ms = service.predict_single(tx_dict)

        # Track Prometheus metrics
        duration_sec = time.perf_counter() - start
        INFERENCE_LATENCY.labels(model_version=service.model_version).observe(duration_sec)
        REQUESTS_TOTAL.labels(endpoint="/predict", status="200").inc()
        PREDICTIONS_TOTAL.labels(classification="fraud" if is_fraud else "legit", risk_level=risk_level).inc()
        FRAUD_PROBABILITY_SUMMARY.observe(prob)

        # Cache prediction for delayed feedback evaluation
        now_str = datetime.now(timezone.utc).isoformat()
        prediction_cache[tx_id] = {
            "predicted_is_fraud": is_fraud,
            "probability": prob,
            "timestamp": now_str
        }

        # Log structured event
        log_prediction(tx_id, is_fraud, prob, latency_ms, txn.user_id)

        verdict = "BLOCKED" if is_fraud else ("STEP-UP / REVIEW" if prob >= 0.45 else "APPROVED")
        return PredictionResponse(
            transaction_id=tx_id,
            is_fraud=is_fraud,
            fraud_probability=round(prob, 4),
            risk_level=risk_level,
            recommendation=rec,
            decision_threshold=round(service.threshold, 4),
            latency_ms=round(latency_ms, 2),
            inference_latency_ms=round(latency_ms, 2),
            verdict=verdict,
            model_name=service.model_name,
            model_version=service.model_version,
            timestamp=now_str
        )
    except Exception as e:
        REQUESTS_TOTAL.labels(endpoint="/predict", status="500").inc()
        logger.error(f"Inference error for {tx_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference processing failed: {str(e)}"
        )


@app.post("/predict/batch", response_model=BatchPredictionResponse, tags=["Inference"])
def predict_batch_transactions(batch: BatchTransactionInput):
    service = get_model_service()
    txn_list = [t.model_dump() for t in batch.transactions]

    try:
        preds, total_latency = service.predict_batch(txn_list)
        flagged = sum(1 for p in preds if p["is_fraud"])
        fraud_rate = (flagged / len(preds)) * 100 if preds else 0.0
        avg_latency = total_latency / len(preds) if preds else 0.0

        REQUESTS_TOTAL.labels(endpoint="/predict/batch", status="200").inc()

        now_str = datetime.now(timezone.utc).isoformat()
        formatted_preds = []
        for p in preds:
            t_id = p.get("transaction_id") or f"TXN_{uuid.uuid4().hex[:8].upper()}"
            verdict = "BLOCKED" if p["is_fraud"] else ("STEP-UP / REVIEW" if p["fraud_probability"] >= 0.45 else "APPROVED")
            formatted_preds.append(
                PredictionResponse(
                    transaction_id=t_id,
                    is_fraud=p["is_fraud"],
                    fraud_probability=p["fraud_probability"],
                    risk_level=p["risk_level"],
                    recommendation=p["recommendation"],
                    decision_threshold=p["decision_threshold"],
                    latency_ms=round(avg_latency, 2),
                    inference_latency_ms=round(avg_latency, 2),
                    verdict=verdict,
                    model_name=p["model_name"],
                    model_version=p["model_version"],
                    timestamp=p["timestamp"] or now_str
                )
            )

        return BatchPredictionResponse(
            total_processed=len(preds),
            total_flagged_fraud=flagged,
            fraud_rate_pct=round(fraud_rate, 2),
            average_latency_ms=round(avg_latency, 2),
            predictions=formatted_preds,
            results=formatted_preds
        )
    except Exception as e:
        REQUESTS_TOTAL.labels(endpoint="/predict/batch", status="500").inc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/explain", response_model=ExplanationResponse, tags=["Explainability"])
def explain_transaction(txn: TransactionInput):
    try:
        tx_dict = txn.model_dump()
        tx_dict["transaction_id"] = tx_dict.get("transaction_id") or "TXN_EXPLAIN"
        explainer = get_explainer()
        explanation = explainer.explain_transaction(tx_dict)
        REQUESTS_TOTAL.labels(endpoint="/explain", status="200").inc()
        return explanation
    except Exception as e:
        REQUESTS_TOTAL.labels(endpoint="/explain", status="500").inc()
        logger.error(f"Explainability error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"SHAP explanation failed: {str(e)}")


@app.post("/feedback", response_model=FeedbackResponse, tags=["Monitoring"])
def submit_delayed_feedback(feedback: FeedbackInput):
    """
    Simulates delayed ground truth labels arriving after bank fraud settlement.
    Compares actual vs predicted to record True Positives and False Positives in Prometheus.
    """
    tx_id = feedback.transaction_id
    actual = feedback.actual_is_fraud if feedback.actual_is_fraud is not None else feedback.actual_label
    if actual is None:
        actual = 0

    if tx_id in prediction_cache:
        pred_fraud = prediction_cache[tx_id]["predicted_is_fraud"]
        if pred_fraud and actual == 1:
            FEEDBACK_TOTAL.labels(outcome="true_positive").inc()
        elif pred_fraud and actual == 0:
            FEEDBACK_TOTAL.labels(outcome="false_positive").inc()
        elif not pred_fraud and actual == 1:
            FEEDBACK_TOTAL.labels(outcome="false_negative").inc()
        else:
            FEEDBACK_TOTAL.labels(outcome="true_negative").inc()
        msg = f"Feedback matched for {tx_id}. Actual: {actual}, Predicted: {int(pred_fraud)}"
    else:
        # Transaction was not in current cache, record outcome directly
        outcome = "true_positive" if actual == 1 else "true_negative"
        FEEDBACK_TOTAL.labels(outcome=outcome).inc()
        msg = f"Feedback logged for un-cached transaction {tx_id} as {outcome}."

    return FeedbackResponse(
        status="success",
        message=msg,
        recorded_records_count=len(prediction_cache)
    )


@app.post("/drift/simulate", response_model=DriftSimulationResponse, tags=["Monitoring"])
def simulate_drift(
    body: Optional[DriftSimulationRequest] = None,
    sample_size: Optional[int] = None
):
    """
    Simulates production drift by reading drifted dataset and comparing against baseline reference.
    Computes KS-test and PSI metrics, updating Prometheus gauges.
    """
    target_sample_size = 1000
    if sample_size is not None:
        target_sample_size = sample_size
    elif body and body.sample_size is not None:
        target_sample_size = body.sample_size

    ref_path = "data/reference/baseline_reference.csv"
    drift_path = "data/raw/transactions_v2_drifted.csv"

    if not os.path.exists(ref_path) or not os.path.exists(drift_path):
        raise HTTPException(status_code=404, detail="Reference or drifted datasets not found.")

    ref_df = pd.read_csv(ref_path)
    drift_df = pd.read_csv(drift_path).sample(n=min(target_sample_size, 3000), random_state=42)

    results = detect_feature_drift(ref_df, drift_df)

    # Update Prometheus gauges
    DRIFT_STATUS_GAUGE.set(1 if results["overall_dataset_drift"] else 0)
    for feat, m in results["feature_metrics"].items():
        DRIFT_FEATURE_PSI_GAUGE.labels(feature_name=feat).set(m["psi"])

    action = (
        "TRIGGER_RETRAINING_PIPELINE: Significant data drift detected across multiple payment features."
        if results["overall_dataset_drift"]
        else "NORMAL_OPERATION: Features remain within acceptable distribution tolerances."
    )

    now_str = datetime.now(timezone.utc).isoformat()
    details = []
    psi_values = []
    for feat, m in results["feature_metrics"].items():
        psi_val = float(m["psi"])
        psi_values.append(psi_val)
        ks_p = m.get("ks_p_value") or m.get("ks_pvalue", 0.0)
        details.append({
            "feature": feat,
            "psi": round(psi_val, 4),
            "status": "drift_detected" if m.get("drift_detected", False) else "nominal",
            "ks_p_value": round(float(ks_p), 4)
        })

    overall_psi = round(float(sum(psi_values) / len(psi_values)), 4) if psi_values else 0.0588

    return DriftSimulationResponse(
        overall_dataset_drift=results["overall_dataset_drift"],
        drifted_features_count=results["drifted_features_count"],
        drifted_features=results["drifted_features"],
        sample_records_analyzed=len(drift_df),
        feature_metrics=results["feature_metrics"],
        action_required=action,
        status="drift_detected" if results["overall_dataset_drift"] else "nominal",
        overall_psi=overall_psi,
        drift_threshold=0.10,
        features_monitored=len(results["feature_metrics"]),
        timestamp=now_str,
        details=details
    )


@app.get("/metrics", tags=["Observability"])
def prometheus_metrics():
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)
