"""
CloudWatch and Structured Logging Integration for PayGuard.
Emits structured JSON logs compatible with AWS CloudWatch Logs Insights.
"""

import os
import json
import logging
from datetime import datetime, timezone

logger = logging.getLogger("payguard")
logger.setLevel(logging.INFO)

# Formatter producing structured JSON log lines
class JsonFormatter(logging.Formatter):
    def format(self, record):
        log_obj = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "message": record.getMessage(),
            "logger": record.name,
            "service": "payguard-inference-api"
        }
        if hasattr(record, "extra_fields"):
            log_obj.update(record.extra_fields)
        return json.dumps(log_obj)

handler = logging.StreamHandler()
handler.setFormatter(JsonFormatter())
if not logger.handlers:
    logger.addHandler(handler)


def log_prediction(transaction_id: str, is_fraud: bool, prob: float, latency_ms: float, user_id: str):
    log_obj = {
        "event_type": "transaction_scored",
        "transaction_id": transaction_id,
        "user_id": user_id,
        "is_fraud": is_fraud,
        "fraud_probability": prob,
        "latency_ms": round(latency_ms, 2)
    }
    logger.info(f"Transaction scored: {transaction_id}", extra={"extra_fields": log_obj})
