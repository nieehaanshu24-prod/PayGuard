@echo off
REM ==============================================================================
REM PayGuard: Real-Time Digital Payment Fraud Detection
REM One-Command Automated Setup & Run Script (Windows Command Prompt)
REM ==============================================================================

echo ======================================================================
echo           PAYGUARD: ONE-COMMAND AUTOMATED SYSTEM SETUP
echo ======================================================================

echo.
echo [1/6] Installing Python dependencies...
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
if %ERRORLEVEL% NEQ 0 goto error

echo.
echo [2/6] Verifying datasets (DVC / Generator)...
if not exist "data\raw\transactions_v1.csv" (
    echo  - Generating deterministic transactional dataset...
    python scripts\generate_dataset.py
) else (
    echo  - Raw datasets already present.
)

echo.
echo [3/6] Running 7-stage ML training and model registration pipeline...
python scripts\run_pipeline.py
if %ERRORLEVEL% NEQ 0 goto error

echo.
echo [4/6] Running unit and integration test suite...
pytest -v
if %ERRORLEVEL% NEQ 0 goto error

echo.
echo [5/6] Benchmarking real-time sub-30ms inference latency...
python scripts\benchmark_latency.py

echo.
echo [6/6] Launching PayGuard Real-Time REST API and Live UI...
echo ======================================================================
echo   PayGuard is ready!
echo   - Live Web UI         : http://127.0.0.1:8000/ui
echo   - Swagger / OpenAPI   : http://127.0.0.1:8000/docs
echo   - Prometheus Metrics  : http://127.0.0.1:8000/metrics
echo   - Health Endpoint     : http://127.0.0.1:8000/health
echo ======================================================================

python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
goto end

:error
echo.
echo [ERROR] Setup encountered a failure. Please inspect logs above.
pause

:end
