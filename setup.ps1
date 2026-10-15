# ==============================================================================
# PayGuard: Real-Time Digital Payment Fraud Detection
# One-Command Automated Setup & Run Script (Windows PowerShell)
# ==============================================================================

$ErrorActionPreference = "Stop"

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "          PAYGUARD: ONE-COMMAND AUTOMATED SYSTEM SETUP                " -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan

# Step 1: Install Python dependencies
Write-Host "`n[1/6] Installing Python dependencies..." -ForegroundColor Yellow
python -m pip install --upgrade pip
python -m pip install -r requirements.txt

# Step 2: Ensure datasets are present
Write-Host "`n[2/6] Verifying datasets (DVC / Generator)..." -ForegroundColor Yellow
if (-not (Test-Path "data/raw/transactions_v1.csv")) {
    Write-Host " -> Generating deterministic transactional dataset..." -ForegroundColor White
    python scripts/generate_dataset.py
} else {
    Write-Host " -> Raw datasets already present." -ForegroundColor Green
}

# Step 3: Run the 7-stage ML pipeline
Write-Host "`n[3/6] Running 7-stage ML training & model registration pipeline..." -ForegroundColor Yellow
python scripts/run_pipeline.py

# Step 4: Run test suite
Write-Host "`n[4/6] Running unit and integration test suite..." -ForegroundColor Yellow
pytest -v

# Step 5: Run latency benchmark
Write-Host "`n[5/6] Benchmarking real-time sub-30ms inference latency..." -ForegroundColor Yellow
python scripts/benchmark_latency.py

# Step 6: Launch services
Write-Host "`n[6/6] Launching PayGuard Real-Time REST API & Live UI..." -ForegroundColor Yellow
Write-Host "======================================================================" -ForegroundColor Green
Write-Host "  PayGuard is ready!" -ForegroundColor Green
Write-Host "  * Live Web UI         : http://127.0.0.1:8000/ui" -ForegroundColor White
Write-Host "  * Swagger / OpenAPI   : http://127.0.0.1:8000/docs" -ForegroundColor White
Write-Host "  * Prometheus Metrics  : http://127.0.0.1:8000/metrics" -ForegroundColor White
Write-Host "  * Health Endpoint     : http://127.0.0.1:8000/health" -ForegroundColor White
Write-Host "======================================================================" -ForegroundColor Green

python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
