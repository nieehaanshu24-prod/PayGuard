# PayGuard: Real-Time Digital Payment Fraud Detection Platform

[![MLOps CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub_Actions-green.svg)](.github/workflows/ci.yml)
[![FastAPI](https://img.shields.io/badge/API-FastAPI_0.110-blue.svg)](https://fastapi.tiangolo.com)
[![MLflow](https://img.shields.io/badge/Tracking-MLflow_3.16-orange.svg)](https://mlflow.org)
[![Prometheus](https://img.shields.io/badge/Monitoring-Prometheus-red.svg)](https://prometheus.io)
[![DVC](https://img.shields.io/badge/Data-DVC_Versioned-purple.svg)](https://dvc.org)
[![SLA](https://img.shields.io/badge/p95_Latency-11.75ms-success.svg)](#benchmarks)

PayGuard is a production-grade, end-to-end MLOps platform engineered to detect digital payment fraud in real time with sub-15ms inference latency, automated pipeline orchestration, experiment tracking, model registry, live Prometheus/Grafana drift monitoring, and SHAP explainability.

Designed in strict compliance with the **Common Technical Requirements** and **Required Final Submission** guidelines of the Industry-Oriented MLOps curriculum.

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph DataOps["1. DataOps & Versioning (DVC + Git)"]
        RawData["Raw Transactions (v1.0 & v2.0 Drifted)"] --> DataVal["Data Validation (Schema & Bounds)"]
        DataVal --> DVC["DVC Tracking (.dvc + dvc.yaml)"]
    end

    subgraph Pipeline["2. Automated ML Workflow (Airflow & Standalone Runner)"]
        DVC --> Ingestion["Data Ingestion & Stratified Split"]
        Ingestion --> Preprocess["Preprocessing & Feature Engineering"]
        Preprocess --> MultiTrain["Multi-Model Training\n(Baseline + RF + XGBoost)"]
        MultiTrain --> EvalGate["Evaluation & Promotion Gate\n(PR-AUC, Recall, Cost Matrix)"]
    end

    subgraph Registry["3. Experiment Management (MLflow)"]
        MultiTrain -.-> MLflowExp["MLflow Experiments\n(Params, Metrics, Artifacts)"]
        EvalGate --> ModelReg["MLflow Model Registry\n(Champion Model @champion)"]
    end

    subgraph Serving["4. Real-Time Deployment (FastAPI REST)"]
        ModelReg --> FastAPISvc["FastAPI Prediction Service\n(/predict, /batch, /explain, /health)"]
        FastAPISvc --> SHAPEx["SHAP Explainer (Feature Attributions)"]
        FastAPISvc --> PromMetrics["Prometheus Metrics Exporter\n(Latencies, RPS, Fraud Distribution)"]
    end

    subgraph Monitoring["5. Observability & Drift (Prometheus + Grafana)"]
        PromMetrics --> Prometheus["Prometheus Server (Scrape :8000/metrics)"]
        Prometheus --> Grafana["Grafana Dashboard\n(p95 Latency, Error Rate, PSI Drift)"]
        FastAPISvc --> DriftEngine["Drift Simulation & Evidentiary Reporting\n(KS-Test & PSI Engine)"]
    end

    subgraph CICD["6. CI/CD & Testing (GitHub Actions)"]
        UnitTests["Unit Tests (Data, Preprocessing, Inference)"]
        DockerBuild["Docker Build & Test"]
        ModelThreshold["Model-Quality Threshold Test"]
        UnitTests --> GHActions["GitHub Actions CI Pipeline"]
        DockerBuild --> GHActions
        ModelThreshold --> GHActions
    end
```

---

## 🚀 One-Command Quick Start

PayGuard supports both **Local Standalone Mode** (zero Docker friction on Windows) and **Docker Compose Mode**.

### Option A: Local Standalone Setup (Recommended for Windows)

1. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Generate datasets (v1.0 Baseline + v2.0 Drifted)**:
   ```bash
   python scripts/generate_dataset.py
   ```

3. **Execute full ML pipeline (Ingestion -> Multi-Model Train -> Register Champion)**:
   ```bash
   python scripts/run_pipeline.py
   ```

4. **Start the FastAPI real-time prediction service**:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```
   * Open Swagger Documentation: **[http://localhost:8000/docs](http://localhost:8000/docs)**
   * Open Health Check: **[http://localhost:8000/health](http://localhost:8000/health)**
   * Open Prometheus Metrics: **[http://localhost:8000/metrics](http://localhost:8000/metrics)**

5. **(Optional) Launch MLflow UI**:
   ```bash
   mlflow ui --backend-store-uri sqlite:///mlruns.db --port 5000
   ```
   * Open MLflow Dashboard: **[http://localhost:5000](http://localhost:5000)**

---

### Option B: Containerized Setup (Docker Compose)

Launch API, Prometheus, Grafana, and MLflow in orchestrated containers:
```bash
docker compose -f docker/docker-compose.yml up --build -d
```
* **FastAPI Service**: `http://localhost:8000/docs`
* **Prometheus Dashboard**: `http://localhost:9090`
* **Grafana Observability**: `http://localhost:3000` (User: `admin` / Password: `admin`)
* **MLflow Tracking**: `http://localhost:5000`

---

## 📊 Key Operational Benchmarks

Measured over 1,000 requests using [`scripts/benchmark_latency.py`](scripts/benchmark_latency.py):

| Metric | Target SLA | Measured Performance | Result |
| :--- | :--- | :--- | :--- |
| **p95 Latency** | $< 30.00$ ms | **11.75 ms** | **PASSED** |
| **p50 Latency** | - | **8.71 ms** | **PASSED** |
| **Throughput** | $\ge 50$ RPS | **109.8 requests/sec** | **PASSED** |
| **Error Rate** | $< 1.00\%$ | **0.00%** (0 errors) | **PASSED** |
| **PR-AUC** | $\ge 0.70$ | **1.0000** | **PASSED** |
| **Net Financial Savings** | $> \$0$ | **+$23,000.00** | **PASSED** |

---

## 🧪 Running Automated Tests

Run the complete test suite covering unit tests, API integration tests, and model quality promotion gates:
```bash
pytest -v
```

Run latency and throughput benchmark:
```bash
python scripts/benchmark_latency.py
```

Run statistical drift simulation (Kolmogorov-Smirnov & Population Stability Index):
```bash
python scripts/simulate_drift.py
```

---

## 📡 API Usage & Test Payloads

### 1. Real-Time Fraud Scoring (`POST /predict`)
```bash
curl -X POST "http://localhost:8000/predict" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "USR_0100",
    "amount": 2850.00,
    "old_balance": 4000.00,
    "new_balance": 1150.00,
    "user_avg_amount_30d": 50.00,
    "channel": "CREDIT_CARD",
    "merchant_category": "crypto_exchange",
    "is_foreign_transaction": 1,
    "device_trust_score": 0.08,
    "location_risk_score": 0.92,
    "velocity_1h": 6,
    "velocity_24h": 9
  }'
```

**Response**:
```json
{
  "transaction_id": "TXN_7E92A10F",
  "is_fraud": true,
  "fraud_probability": 0.964,
  "risk_level": "HIGH",
  "recommendation": "BLOCK_TRANSACTION",
  "decision_threshold": 0.74,
  "latency_ms": 11.2,
  "model_name": "RandomForest_Candidate",
  "model_version": "1"
}
```

### 2. SHAP Explainability (`POST /explain`)
Returns mathematical Shapley feature attributions and an analyst summary explaining why the transaction was flagged:
```bash
curl -X POST "http://localhost:8000/explain" \
  -H "Content-Type: application/json" \
  -d '{ ...same payload... }'
```

---

## 📁 Project Structure

```
PayGuard/
├── .github/workflows/ci.yml           # Multi-stage GitHub Actions CI/CD pipeline
├── airflow/dags/payguard_pipeline_dag.py # Apache Airflow 7-stage DAG
├── app/
│   ├── main.py                        # FastAPI REST prediction service
│   ├── schemas.py                     # Pydantic v2 validation models
│   ├── model_loader.py                # Sub-15ms champion model loader
│   ├── explainability.py              # SHAP TreeExplainer integration
│   ├── metrics.py                     # Prometheus exporter metrics
│   ├── cloudwatch_logger.py           # Structured CloudWatch logging
│   └── ui.py                          # 1-Click interactive Streamlit UI
├── config/config.yaml                 # Centralized configuration & thresholds
├── data/                              # Versioned data directories (tracked via DVC)
├── docker/
│   ├── Dockerfile                     # Production container image
│   ├── docker-compose.yml             # API + Prometheus + Grafana + MLflow
│   └── prometheus.yml                 # Prometheus scrape target
├── grafana/                           # Pre-provisioned Grafana monitoring dashboards
├── models/                            # Serialized champion model & metadata
├── reports/
│   ├── DATA_CARD.md                   # Data provenance, distributions & ethics
│   ├── MODEL_CARD.md                  # Model architecture, metrics & fairness
│   ├── RESPONSIBLE_AI.md              # SHAP, privacy, and bias assessment
│   ├── PERFORMANCE_REPORT.md          # Latencies, throughput, costs, drift
│   ├── DRIFT_REPORT.json              # Statistical KS & PSI drift results
│   └── BENCHMARK_RESULTS.json         # Timed latency percentile benchmarks
├── scripts/
│   ├── generate_dataset.py            # Reproducible payment data generator
│   ├── run_pipeline.py                # Standalone 1-click pipeline runner
│   ├── benchmark_latency.py           # Real-time p95 latency benchmark
│   ├── simulate_drift.py              # Concept drift injection & reporting
│   ├── s3_storage_sync.py             # AWS S3 artifact synchronization
│   ├── sagemaker_deploy.py            # AWS SageMaker endpoint configuration
│   └── cloud_cleanup.py               # Cloud teardown cost control script
├── src/                               # Core modular ML source components
│   ├── validation.py                  # Schema & data sanity checks
│   ├── ingestion.py                   # Stratified train/test splitter
│   ├── preprocessing.py               # Scikit-learn ColumnTransformer
│   ├── feature_engineering.py         # Velocity, ratio, and balance features
│   ├── train.py                       # Baseline + Random Forest + XGBoost
│   ├── evaluate.py                    # PR-AUC, Confusion Matrix, Cost Matrix
│   ├── register.py                    # MLflow Model Registry promotion gate
│   └── drift.py                       # KS-test & PSI drift algorithms
├── tests/                             # Pytest test suite
├── api_spec.json                      # Exported OpenAPI specification
├── AI_STUDIO_UI_GUIDE.md              # Google AI Studio prompt & integration guide
├── DEMO_SCRIPT.md                     # 5-minute timed viva demo presentation
├── VIVA_PREPARATION.md                # Comprehensive viva questions & answers
└── requirements.txt                   # Locked dependencies
```

---

## 📸 Final Submission Screenshot Checklist

For your final course submission package, capture the following screens:

1. **DVC Evidence**: Run `dvc status` in terminal to show data pipelines up-to-date.
2. **MLflow Experiments & Registry**: Open `http://localhost:5000` showing the 3 model runs, metrics comparison, and the `@champion` model in the Model Registry.
3. **Airflow DAG**: View `airflow/dags/payguard_pipeline_dag.py` or pipeline run output.
4. **FastAPI Swagger / OpenAPI**: Open `http://localhost:8000/docs` showing interactive Swagger docs with `/predict` and `/explain`.
5. **Prometheus / Grafana Monitoring**: Open `http://localhost:8000/metrics` or `http://localhost:3000` showing the monitoring dashboard.
6. **Drift Evidence**: Run `python scripts/simulate_drift.py` showing the KS/PSI drift table.
7. **GitHub Actions**: Push to GitHub to show the green CI/CD build checkmark.

---

## 📄 Submission Documentation Links

- **[Data Card](reports/DATA_CARD.md)**
- **[Model Card](reports/MODEL_CARD.md)**
- **[Responsible AI Statement](reports/RESPONSIBLE_AI.md)**
- **[Performance Benchmark Report](reports/PERFORMANCE_REPORT.md)**
- **[5-Minute Live Demo Pitch](DEMO_SCRIPT.md)**
- **[Viva Q&A Cheat Sheet](VIVA_PREPARATION.md)**
- **[AI Studio UI Guide](AI_STUDIO_UI_GUIDE.md)**
