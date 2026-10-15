#!/usr/bin/env bash
# ==============================================================================
# PayGuard: Real-Time Digital Payment Fraud Detection
# One-Command Automated Setup & Run Script (Linux / macOS / WSL)
# ==============================================================================

set -e

echo "======================================================================"
echo "          PAYGUARD: ONE-COMMAND AUTOMATED SYSTEM SETUP                "
echo "======================================================================"

# Step 1: Install Python dependencies
echo -e "\n[1/6] Installing Python dependencies..."
python3 -m pip install --upgrade pip
python3 -m pip install -r requirements.txt

# Step 2: Ensure datasets are present
echo -e "\n[2/6] Verifying datasets (DVC / Generator)..."
if [ ! -f "data/raw/transactions_v1.csv" ]; then
    echo " -> Generating deterministic transactional dataset..."
    python3 scripts/generate_dataset.py
else
    echo " -> Raw datasets already present."
fi

# Step 3: Run the 7-stage ML pipeline
echo -e "\n[3/6] Running 7-stage ML training & model registration pipeline..."
python3 scripts/run_pipeline.py

# Step 4: Run test suite
echo -e "\n[4/6] Running unit and integration test suite..."
pytest -v

# Step 5: Run latency benchmark
echo -e "\n[5/6] Benchmarking real-time sub-30ms inference latency..."
python3 scripts/benchmark_latency.py

# Step 6: Launch services
echo -e "\n[6/6] Launching PayGuard Real-Time REST API & Live UI..."
echo "======================================================================"
echo "  PayGuard is ready!"
echo "  • Live Web UI         : http://127.0.0.1:8000/ui"
echo "  • Swagger / OpenAPI   : http://127.0.0.1:8000/docs"
echo "  • Prometheus Metrics  : http://127.0.0.1:8000/metrics"
echo "  • Health Endpoint     : http://127.0.0.1:8000/health"
echo "======================================================================"

python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000
