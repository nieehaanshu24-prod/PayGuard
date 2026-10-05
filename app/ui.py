"""
PayGuard Interactive Fraud Analysis Web Dashboard.
Connects to the PayGuard FastAPI REST Service at http://localhost:8000.
"""

import streamlit as st
import requests
import json

st.set_page_config(page_title="PayGuard Fraud Intelligence", page_icon="🛡️", layout="wide")

API_BASE_URL = "http://localhost:8000"

st.title("🛡️ PayGuard: Real-Time Payment Fraud Detection")
st.caption("Sub-15ms Real-Time Inference, SHAP Explainability & MLOps Observability")

# Quick test scenario selector
st.sidebar.header("🕹️ Quick Simulation Scenarios")
scenario = st.sidebar.radio(
    "Choose a preset transaction:",
    ["Normal Daytime Grocery (UPI)", "Midnight Overseas Crypto Surge (Credit Card)"]
)

if scenario == "Normal Daytime Grocery (UPI)":
    default_amount = 45.0
    default_channel = "UPI"
    default_merch = "grocery"
    default_foreign = 0
    default_device = 0.95
    default_loc = 0.05
    default_vel1 = 0
    default_vel24 = 1
    default_ts = "2026-10-05 14:15:00"
else:
    default_amount = 2850.0
    default_channel = "CREDIT_CARD"
    default_merch = "crypto_exchange"
    default_foreign = 1
    default_device = 0.08
    default_loc = 0.92
    default_vel1 = 6
    default_vel24 = 9
    default_ts = "2026-10-05 02:45:00"

col1, col2, col3 = st.columns(3)
with col1:
    amount = st.number_input("Transaction Amount ($)", value=default_amount, min_value=1.0)
    user_avg = st.number_input("User 30-Day Avg ($)", value=50.0, min_value=1.0)
    channel = st.selectbox("Payment Channel", ["UPI", "CREDIT_CARD", "DEBIT_CARD", "NET_BANKING", "WALLET"], index=["UPI", "CREDIT_CARD", "DEBIT_CARD", "NET_BANKING", "WALLET"].index(default_channel))

with col2:
    merchant = st.selectbox("Merchant Category", ["grocery", "retail", "travel", "electronics", "entertainment", "gaming", "crypto_exchange", "utilities", "dining", "luxury"], index=0 if default_merch=="grocery" else 6)
    is_foreign = st.selectbox("Foreign Transaction?", [0, 1], index=default_foreign)
    device_trust = st.slider("Device Trust Score", 0.0, 1.0, default_device)

with col3:
    location_risk = st.slider("Location Risk Score", 0.0, 1.0, default_loc)
    velocity_1h = st.number_input("Velocity (Last 1 hr)", value=default_vel1, min_value=0)
    velocity_24h = st.number_input("Velocity (Last 24 hrs)", value=default_vel24, min_value=0)

payload = {
    "transaction_id": "TXN_DEMO_WEB",
    "timestamp": default_ts,
    "user_id": "USR_0412",
    "amount": float(amount),
    "old_balance": 3500.0,
    "new_balance": max(0.0, 3500.0 - float(amount)),
    "user_avg_amount_30d": float(user_avg),
    "channel": channel,
    "merchant_category": merchant,
    "is_foreign_transaction": int(is_foreign),
    "device_trust_score": float(device_trust),
    "location_risk_score": float(location_risk),
    "velocity_1h": int(velocity_1h),
    "velocity_24h": int(velocity_24h)
}

if st.button("🚀 Analyze Transaction", type="primary"):
    try:
        res = requests.post(f"{API_BASE_URL}/predict", json=payload, timeout=5)
        if res.status_code == 200:
            data = res.json()
            is_fraud = data["is_fraud"]
            prob = data["fraud_probability"]
            risk = data["risk_level"]
            rec = data["recommendation"]
            lat = data["latency_ms"]

            st.divider()
            r1, r2, r3, r4 = st.columns(4)
            r1.metric("Decision Verdict", "FRAUD DETECTED" if is_fraud else "LEGITIMATE")
            r2.metric("Fraud Probability", f"{prob * 100:.1f}%")
            r3.metric("Action Recommendation", rec)
            r4.metric("Inference Latency", f"{lat:.2f} ms")

            # SHAP Explanation
            exp_res = requests.post(f"{API_BASE_URL}/explain", json=payload, timeout=5)
            if exp_res.status_code == 200:
                exp_data = exp_res.json()
                st.subheader("🔍 SHAP Explainability & Risk Attribution")
                st.info(exp_data["plain_language_summary"])
                st.dataframe(exp_data["top_risk_factors"], use_container_width=True)
        else:
            st.error(f"API Error {res.status_code}: {res.text}")
    except Exception as e:
        st.warning(f"Could not connect to FastAPI service at {API_BASE_URL}. Ensure it is running (`uvicorn app.main:app --port 8000`). Error: {e}")
