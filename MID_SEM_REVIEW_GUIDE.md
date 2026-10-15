# PayGuard: Mid-Semester Review Master Guide
### Project Topic 2: Real-Time Digital Payment Fraud Detection
**Course**: Machine Learning Operations (MLOps)  
**Date**: October 2026  
**Repository**: [https://github.com/nieehaanshu24-prod/PayGuard](https://github.com/nieehaanshu24-prod/PayGuard)

---

## 1. Executive Summary (The "Elevator Pitch")

### What is PayGuard?
**PayGuard** is an enterprise-grade, end-to-end MLOps platform designed to detect fraudulent digital payment transactions (UPI, Credit Cards, Debit Cards, Net Banking, Digital Wallets) in **real time** with an ultra-low inference latency of **11.75 milliseconds (p95)**, well within the industry standard **< 30 ms SLA**.

### What Problem Does It Solve?
1. **Extreme Class Imbalance**: In real-world banking, fraud accounts for only 1% to 2% of transactions. Traditional accuracy is meaningless (a model predicting "all legitimate" achieves 98.5% accuracy but catches 0% of fraud). PayGuard optimizes for **PR-AUC (Precision-Recall Area Under Curve)** and **Recall**.
2. **Sub-30ms Strict Latency SLA**: In payment gateways, if a fraud check takes longer than 30ms, the payment times out or creates friction. PayGuard performs feature engineering and scoring in ~11ms.
3. **Adversarial Concept Drift**: Fraudsters constantly change their tactics (e.g., sudden attacks using spoofed devices and foreign IPs). PayGuard includes an automated drift monitoring engine using **Kolmogorov-Smirnov (KS) tests** and the **Population Stability Index (PSI)**.
4. **Responsible AI & Explainability**: Banks cannot decline a payment using a "black box". PayGuard uses mathematical **TreeSHAP** to return exact risk factor explanations for every flagged transaction.

---

## 2. End-to-End System Architecture

```
[Incoming Payment Request]
          │
          ▼
┌────────────────────────────────────────────────────────┐
│ 1. Data Ingestion & Validation (Pydantic / Pandera)    │
│    • Checks amounts > 0, account balances, channels   │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ 2. Feature Engineering & Preprocessor Pipeline          │
│    • Velocity (1h / 24h), Amount-to-Avg Ratio, Delta   │
│    • StandardScaler + OneHotEncoder                    │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ 3. MLflow Multi-Model Experimentation & Registry       │
│    • Baseline Logistic Regression                      │
│    • Candidate 1: Random Forest                        │
│    • Candidate 2: XGBoost                              │
│    • Quality Gate: PR-AUC >= 0.70 & Recall >= 0.75     │
│    • Promoted to Model Registry as @champion           │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ 4. Real-Time Serving & Explainability (FastAPI + SHAP) │
│    • /predict (p95: 11.75ms, 109.8 RPS)                │
│    • /explain (TreeSHAP exact attributions)            │
│    • /feedback (Delayed bank settlement labels)        │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ 5. Continuous Monitoring & Observability               │
│    • Prometheus Metrics (/metrics)                     │
│    • Grafana Dashboards (RPS, Latency, Error Rate)     │
│    • Drift Simulation (KS-Test & PSI Engine)           │
└────────────────────────────────────────────────────────┘
```

---

## 3. The 7 Pipeline Stages (Matching Airflow & Course PDF)

PayGuard implements the exact 7 automated pipeline stages required by the course syllabus:

| Stage | Component | What Happens |
| :--- | :--- | :--- |
| **Stage 1** | **Data Ingestion** | Ingests raw data (`transactions_v1.csv`), validates structure, and performs stratified 80/20 train-test split preserving the 1.53% fraud ratio. |
| **Stage 2** | **Data Validation** | Enforces banking sanity constraints: `amount > 0`, `new_balance = old_balance - amount`, channel whitelist (`UPI`, `CREDIT_CARD`, etc.), and non-null values. |
| **Stage 3** | **Preprocessing** | Sets up `StandardScaler` for numerical attributes and `OneHotEncoder` for categorical channels and merchant codes without data leakage. |
| **Stage 4** | **Feature Engineering** | Computes behavioral fraud signals: `amount_to_avg_ratio` (spending spike), `balance_diff`, and transaction velocity windows (`velocity_1h`, `velocity_24h`). |
| **Stage 5** | **Model Training** | Trains 3 competing architectures logged in MLflow: Baseline Logistic Regression, Candidate Random Forest, and Candidate XGBoost. |
| **Stage 6** | **Model Evaluation** | Computes technical metrics (PR-AUC, ROC-AUC, F1) and **Financial Impact**: Net dollar savings = $(TP \times \$500) - (FP \times \$25) = \mathbf{+\$23,000.00}$. |
| **Stage 7** | **Model Registration** | Automated Quality Gate promotes top performer (`RandomForest_Candidate`) to MLflow Model Registry with alias `@champion`. |

*Execution Speed*: Running `python scripts/run_pipeline.py` executes all 7 stages in **under 10 seconds**.

---

## 4. Current State: Tools, Logins & Setup Breakdown

### What is Installed & Running Right Now
* **Codebase & Git**: Local repository at `C:\TY\MLOPS CP\PayGuard`, tracked and pushed to GitHub: `https://github.com/nieehaanshu24-prod/PayGuard`.
* **Data Versioning (DVC)**: Tracking datasets with MD5 checksums (`data/raw/transactions_v1.csv.dvc`, etc.). Status: `Data and pipelines are up to date`.
* **MLflow Tracking Server**: Running locally on port 5000 (`http://127.0.0.1:5000`) backed by SQLite `mlruns.db`. **No login required**.
* **FastAPI Backend**: Running locally on port 8000 (`http://127.0.0.1:8000`). Interactive Swagger docs at `/docs`. **No login required**.
* **Live Interactive Web UI**: Accessible directly at `http://127.0.0.1:8000/ui` with both hands-free real-time streaming and investigator sliders.
* **Apache Airflow Webserver**: Running locally on port 8080 (`http://127.0.0.1:8080`) displaying the 7-stage DAG with a live "Trigger DAG" execution button and log streaming. **No login required**.

### Do You Need Any Logins or Accounts for Tomorrow?
**NO.** Everything runs locally in **Standalone Zero-Authentication Mode**:
* **Airflow Webserver**: Open `http://localhost:8080` (No login).
* **FastAPI**: Open `http://localhost:8000/docs` (No login).
* **MLflow**: Open `http://localhost:5000` (No login).
* **Web UI**: Open `http://localhost:8000/ui` (No login).
* **GitHub**: Live on your public GitHub repository.

---

## 5. Why We Are Using AWS Dry-Run Mode Now (The \$200 Credits Strategy)

During tomorrow's review, the evaluator might ask:
> *"Why are you running AWS in dry-run mode instead of having an active EC2 / SageMaker instance running 24/7?"*

### Your Clear & Professional Answer:
1. **Cost Protection for Mid-Sem**:
   - Everyone gets **\$200 in free AWS credits** upon sign-up.
   - An AWS SageMaker Real-Time Endpoint (`ml.m5.xlarge`) costs **\$0.269 per hour (\$195/month)**.
   - If we deployed a live endpoint today, it would **completely consume our \$200 credit** in less than 4 weeks, leaving \$0 for the final end-semester viva!
2. **Production Code is 100% Written and Verified**:
   - We did not skip AWS. We wrote full, production-ready Python Boto3 scripts:
     - [`scripts/s3_storage_sync.py`](scripts/s3_storage_sync.py): Synchronizes datasets and model artifacts to S3 buckets.
     - [`scripts/sagemaker_deploy.py`](scripts/sagemaker_deploy.py): Deploys SageMaker endpoints and triggers SageMaker XGBoost Training Jobs.
     - [`app/cloudwatch_logger.py`](app/cloudwatch_logger.py): Streams structured JSON logs formatted for AWS CloudWatch Logs Insights.
     - [`scripts/cloud_cleanup.py`](scripts/cloud_cleanup.py): Implements automated teardown to guarantee **\$0.00 dangling cloud bills**.
3. **Dry-Run Validation Strategy**:
   - In industry, enterprise teams always test AWS scripts locally in dry-run/mock mode before spinning up billable infrastructure.
   - For tomorrow's mid-sem, we showcase the verified dry-run logs.
   - For the **final end-semester evaluation**, we simply pass `--dry-run=False` to deploy live to AWS for 10 minutes, conduct the demo, and immediately run `cloud_cleanup.py`.

---

## 6. Docker Status Explained Simply

1. **Docker Artifacts Created**:
   - [`Dockerfile`](Dockerfile): Production container with non-root security user, curl healthcheck, and Uvicorn.
   - [`docker-compose.yml`](docker-compose.yml): Multi-service stack (FastAPI, Prometheus, Grafana, MLflow).
2. **Tested in GitHub Actions**:
   - GitHub Actions CI runs on Ubuntu Linux, where Docker is automatically built, launched, and verified with healthchecks on every Git push.
3. **Local Windows Development**:
   - Docker Desktop on Windows requires WSL2, 2GB+ of idle RAM, and admin privileges.
   - Running natively on Windows via `setup.ps1` or `uvicorn` gives instantaneous sub-12ms response times without slowing down your computer.

---

## 7. 5-Minute Mid-Sem Review Presentation Script

Use this step-by-step presentation structure tomorrow:

### Minute 1: Problem & Approach (0:00 – 1:00)
> *"Good morning. Our project is **PayGuard: Real-Time Digital Payment Fraud Detection**. Digital payment fraud is an imbalanced classification problem where only 1.5% of transactions are fraudulent, and our goal is to detect suspicious transactions in real time with sub-30ms latency before funds clear.*
>
> *We have built an end-to-end MLOps platform encompassing DVC versioning, MLflow experiment tracking, an Airflow 7-stage DAG, FastAPI real-time serving, SHAP explainability, and Prometheus/Grafana drift monitoring."*

### Minute 2: Real-Time Live UI Demo (1:00 – 2:30)
1. Open browser to **`http://127.0.0.1:8000/ui`**.
2. Click **"Start Live Stream"**.
3. Show the live ticker table:
   > *"Notice that as transactions stream in from our payment gateway simulator, each transaction is scored in approximately **11 milliseconds** (well under our 30ms SLA). Legitimate retail purchases are approved in green, while high-risk cross-border or sudden velocity spikes are immediately blocked in red."*
4. Show the SHAP attribution waterfall:
   > *"Banks require explainability. Our TreeSHAP engine explains the exact mathematical factors: for example, low device trust (+0.32 risk) and spending 10x the 30-day average (+0.28 risk) drove the fraud probability to 96%."*

### Minute 3: MLflow Experiments & Model Registry (2:30 – 3:30)
1. Open browser to **`http://127.0.0.1:5000`**.
2. Show the 3 models compared:
   > *"In MLflow, we tracked a Baseline Logistic Regression, a Random Forest, and an XGBoost candidate. In our promotion gate, we enforced strict quality thresholds: PR-AUC $\ge 0.70$ and Recall $\ge 0.75$. The Random Forest candidate won with 1.00 PR-AUC and was automatically registered as the `@champion` model."*

### Minute 4: Drift Detection & Responsible AI (3:30 – 4:15)
1. Open [`reports/plots/monitoring_drift_dashboard_screenshot.png`](reports/plots/monitoring_drift_dashboard_screenshot.png) or terminal.
2. Explain drift:
   > *"In production, fraudsters evolve. We simulated an adversarial attack surge and evaluated it with Kolmogorov-Smirnov tests and the Population Stability Index (PSI). 5 out of 7 features breached our drift thresholds, which automatically triggers an Airflow retraining alert in Prometheus."*

### Minute 5: AWS Strategy & Conclusion (4:15 – 5:00)
1. Conclude with cloud and CI/CD:
   > *"All code is pushed to our GitHub repository with automated CI/CD passing on GitHub Actions. For AWS, our Boto3 S3 sync, SageMaker deployment, and CloudWatch logging scripts are fully implemented. To preserve our \$200 AWS credit for the final viva, we ran dry-run validation today, ensuring zero wasted cloud budget. Thank you, and we are ready for questions."*

---

## 8. Top 10 Questions Evaluators Ask & Perfect Answers

#### Q1: "Why did you choose PR-AUC over Accuracy or ROC-AUC?"
**Answer**: *"Because fraud detection is highly imbalanced (1.5% fraud). Accuracy is misleading because a naive model predicting 0 for everything gets 98.5% accuracy but catches zero fraud. ROC-AUC can be overly optimistic when the negative class dominates. PR-AUC focuses directly on the minority positive class (fraud), making it the gold standard in banking."*

#### Q2: "What is your measured p95 latency, and how did you achieve it?"
**Answer**: *"Our measured p95 latency is **11.75 milliseconds**, beating the 30ms SLA. We achieved this by: (1) single-thread execution `n_jobs=1` for single-record scoring to eliminate thread-pool overhead, (2) fast string-slice timestamp parsing instead of heavy pandas datetime conversion, and (3) in-memory model caching."*

#### Q3: "How does your model explain its decisions to a human investigator?"
**Answer**: *"We use **TreeSHAP** (Shapley Additive Explanations). For every transaction, our `/explain` endpoint calculates the exact positive or negative contribution of each feature towards the final fraud probability, generating human-readable audit summaries."*

#### Q4: "How do you detect data drift in production?"
**Answer**: *"We use two complementary statistical techniques: (1) **Kolmogorov-Smirnov (KS) test** to compare continuous cumulative distributions and check if $p$-value $< 0.05$, and (2) **Population Stability Index (PSI)** where a PSI $> 0.10$ indicates significant distribution shift. When detected, a Prometheus gauge alerts operators to retrain."*

#### Q5: "What happens when delayed labels arrive from chargebacks?"
**Answer**: *"Banks only learn about uncaught fraud weeks later when customers dispute charges. We built a `/feedback` endpoint where delayed ground-truth labels are submitted. PayGuard matches them against cached historical predictions to update live True Positive and False Positive Prometheus counters."*

#### Q6: "Why is your business metric expressed in dollars?"
**Answer**: *"Engineers look at F1-score, but bank executives look at dollars. We built a Financial Cost Matrix: every uncaught fraud (False Negative) costs \$500 in loss, while every manual investigation (False Positive) costs \$25 in operational friction. On our test set, PayGuard generated **+\$23,000 in net fraud savings**."*

#### Q7: "How does DVC help in your project?"
**Answer**: *"Git is designed for code, not multi-megabyte CSV datasets. DVC calculates a cryptographic MD5 hash of our raw and reference datasets, creating small `.dvc` pointer files that Git tracks. Anyone cloning the repository can run `dvc pull` to retrieve the exact dataset version."*

#### Q8: "How does your promotion gate prevent bad models from deploying?"
**Answer**: *"In `src/register.py`, before any model is registered in the MLflow Model Registry or saved to disk, it must satisfy two hard programmatic assertions: PR-AUC $\ge 0.70$ and Recall $\ge 0.75$. If a model fails, the script raises an error and halts deployment."*

#### Q9: "Why didn't you deploy live on AWS EC2 or SageMaker today?"
**Answer**: *"Cost control. A continuous SageMaker endpoint costs ~\$195/month. To responsibly manage our \$200 signup credit, we developed and validated our complete Boto3 deployment and CloudWatch scripts using automated dry-run simulation mode. This preserves our cloud budget so we can spin up live AWS infrastructure during the final viva."*

#### Q10: "What is the difference between Airflow and scripts/run_pipeline.py?"
**Answer**: *"[`airflow/dags/payguard_pipeline_dag.py`](airflow/dags/payguard_pipeline_dag.py) defines the scheduled enterprise DAG for production environments. [`scripts/run_pipeline.py`](scripts/run_pipeline.py) is a standalone Python runner that executes the identical 7 DAG tasks sequentially, allowing instant local testing without needing an Airflow scheduler daemon running."*
