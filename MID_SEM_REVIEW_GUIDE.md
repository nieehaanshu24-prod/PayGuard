# PayGuard: The Complete Mid-Semester Review Master Guide
### Topic 2: Real-Time Digital Payment Fraud Detection (MLOps)
**Repository**: [https://github.com/nieehaanshu24-prod/PayGuard](https://github.com/nieehaanshu24-prod/PayGuard)  
**Status**: All 5 Services Running Live in Docker & Native Standalone Mode  

---

# PART 1: THE BIG PICTURE (WHAT IS THIS PROJECT?)

### 1. What is PayGuard in simple human words?
Imagine you are buying groceries or shopping online with **UPI (Google Pay, PhonePe), Credit Card, or Net Banking**.
You enter your PIN and press "Pay".
Before the transaction is completed and before your phone buzzes with "Payment Successful", the bank has **less than 30 milliseconds** to decide:
> *"Is this really the genuine account owner, or did a fraudster steal their card/phone?"*

**PayGuard is the real-time AI security engine inside that payment gateway.**
It looks at the transaction details, runs an AI machine learning model in **11 milliseconds**, and instantly returns one of two verdicts:
- **`APPROVED`** (Transaction is safe $\to$ money is sent)
- **`BLOCKED`** (Suspicious transaction $\to$ declined before fraudster steals money)

### 2. Why is this an MLOps project, not just a Machine Learning project?
A beginner ML project is just a Jupyter Notebook that trains a model and prints accuracy.
**PayGuard is a complete production MLOps system.** That means:
- We version datasets using **DVC**.
- We compare and track 3 models in **MLflow**.
- We automate the entire 7-stage pipeline in **Apache Airflow**.
- We deploy a sub-15ms REST API using **FastAPI**.
- We explain decisions using **SHAP** (Responsible AI).
- We monitor real-time traffic, latency, and data drift using **Prometheus & Grafana**.
- We containerize everything in **Docker Compose**.
- We automatically test every change on **GitHub Actions CI/CD**.
- We have cloud scripts for **AWS S3, SageMaker, and CloudWatch**.

---

# PART 2: THE DATASET & REAL-TIME SIMULATION

### 1. Where did the dataset come from?
In banking, real payment transactions cannot be shared with universities or published on GitHub due to strict privacy regulations (RBI guidelines, GDPR, and PCI-DSS financial security standards).
Therefore, we wrote a deterministic synthetic data generator (`scripts/generate_dataset.py`) based on real-world banking fraud distributions (modeled after the Kaggle European Card Fraud & IEEE-CIS benchmarks):
- **`data/raw/transactions_v1.csv`**: Baseline dataset with **15,000 transactions**.
- **Fraud Rate**: **1.53%** (only 230 fraudulent transactions out of 15,000).
- **`data/raw/transactions_v2_drifted.csv`**: Production drifted dataset with **5,000 transactions** simulating a sudden cyber-attack wave (11.76% fraud rate).
- **`data/reference/baseline_reference.csv`**: A golden 3,000-transaction reference set used for statistical drift monitoring.

### 2. What is "Class Imbalance" and why does it matter?
This is the **#1 favorite question of professors**:
- In banking, 98.5% of transactions are legitimate, and only 1.5% are fraud.
- If you use standard "Accuracy", a dumb model that predicts "Legitimate" for 100% of transactions will be **98.5% accurate**, but it catches **0% of fraud**!
- Therefore, we **never** judge our model by Accuracy. We judge it by:
  - **PR-AUC (Precision-Recall Area Under Curve)**: Measures how well the model separates real fraud without raising false alarms.
  - **Recall**: Measures what percentage of actual thieves were caught (our model catches 100%).

### 3. What are the 12 features in each transaction?
Every transaction sent to PayGuard contains these 12 fields:
1. `user_id`: Customer identifier (e.g., `USR_0412`).
2. `amount`: Transaction amount in dollars/rupees (e.g., `$450.00`).
3. `old_balance` & `new_balance`: Bank balance before and after transaction.
4. `user_avg_amount_30d`: What this specific user normally spends (e.g., `$45.00`).
5. `channel`: Payment method (`UPI`, `CREDIT_CARD`, `DEBIT_CARD`, `NET_BANKING`, `WALLET`).
6. `merchant_category`: Merchant type (`grocery`, `electronics`, `crypto_exchange`, `luxury`, `dining`, etc.).
7. `is_foreign_transaction`: `0` for domestic, `1` for international cross-border payment.
8. `device_trust_score`: Trustworthiness of the phone/computer (0.0 to 1.0). If you use your daily iPhone, it's `0.95`. If a hacker uses a cloud virtual machine or TOR browser, it's `0.05`.
9. `location_risk_score`: IP address / geographic risk (0.0 to 1.0). `0.05` = your home city; `0.95` = sudden login from another country 10 minutes after a local swipe.
10. `velocity_1h`: Number of transactions attempted by this card in the last 1 hour.
11. `velocity_24h`: Number of transactions attempted in the last 24 hours.

### 4. How did we generate and simulate real-time traffic?
In `scripts/generate_dataset.py`, we created two distinct mathematical behavior profiles:
- **Normal Customer Behavior**:
  - Spends close to their 30-day average ($10 to $100).
  - High device trust (`0.80 – 0.99`), low location risk (`0.01 – 0.30`).
  - Low velocity (0 to 1 transactions per hour).
  - Standard daytime shopping hours (8 AM – 10 PM).
- **Fraudulent Attack Behavior**:
  - Huge amount spike (3x to 10x higher than their 30-day average).
  - Low device trust (`0.02 – 0.35`) and high location risk (`0.60 – 0.99`).
  - High velocity bursts (3 to 7 swipes in a single hour).
  - High-risk merchants (`crypto_exchange`, `luxury_goods`, `gambling`).
  - Odd hours (midnight to 4 AM).

**How Real-Time Streaming Works in the UI**:
- On the web UI (`http://localhost:8000/ui`), there is a **"Start Live Stream"** button.
- When clicked, a JavaScript timer fires every **1.5 seconds**, grabs a random transaction from our simulated gateway pool, and sends an HTTP `POST` request to `/predict`.
- The backend scores it in **11 milliseconds**, and the UI instantly prepends a new row into the **Live Transaction Ingestion Feed** with `APPROVED` or `BLOCKED` badges, updating live counts without you touching anything!

---

# PART 3: WHAT THE WEB UI DOES

The UI is built as an enterprise fintech console (PayGuard v2, built with React 19, TypeScript, Tailwind CSS, and Lucide icons), served directly from FastAPI at `http://localhost:8000/ui` (and `http://localhost:8000/`):

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ PAYGUARD v2 ENTERPRISE RISK CONSOLE                                          │
│ [Overview] [Live Stream] [Txn Analysis] [Explainability] [Drift] [Health]    │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Overview Dashboard: Executive KPI cards (Fraud Rate, Total Scored, Latency)
│ 2. Live Streaming Ticker: Real-time incoming transactions scored in ~11 ms   │
│ 3. Transaction Analysis: Investigator sandbox with sliders & instant verdict │
│ 4. SHAP Explainability: Mathematical feature attribution waterfall & reasons │
│ 5. Drift Monitoring: PSI & KS statistical drift tests & retraining triggers  │
│ 6. Model Performance: Champion vs Challenger metrics & $23k Financial Matrix│
│ 7. System Health: Live API status, container health, and model registry state│
└─────────────────────────────────────────────────────────────────────────────┘
```

### The 7 Views You Can Click During The Review:
1. **Overview Dashboard**: Top-line bank metrics: Total transactions processed, fraud detection rate (1.5%), average inference latency (**11.2 ms** vs 30ms SLA limit), and active model `RandomForest_Candidate @champion`.
2. **Live Streaming Feed**: Click **"Live Stream"** $\to$ **"Start Stream"** to watch simulated incoming bank transactions scored every 1.5s with color-coded badges (`APPROVED`, `REVIEW`, `BLOCKED`).
3. **Transaction Analysis (Investigator Sandbox)**: For viva testing! If a professor asks: *"What happens if a user spends \$5,000 on crypto with an unverified device?"*, change inputs, click **Evaluate**, and see the instant `BLOCKED` verdict.
4. **SHAP Explainability**: Displays TreeSHAP waterfall charts explaining **why** the transaction was flagged (e.g., location risk +0.17, amount-to-average ratio +0.15).
5. **Drift Monitoring**: Click **"Simulate Drift"** $\to$ the backend compares 3,000 baseline transactions against drifted traffic, displaying PSI $> 0.10$ and triggering retraining.
6. **Model Performance**: Visualizes PR-AUC (1.00), Recall (1.00), Precision (0.92), and the **\$23,000.00 Net Savings** financial impact matrix.
7. **System Health**: Shows live heartbeat status for FastAPI, loaded models, container uptime, and Prometheus metrics scraping.

---

# PART 4: THE TECHNICAL STACK & TOOLS (WHAT DOES EACH TOOL DO?)

| Tool | What It Does In PayGuard | Where To View It |
| :--- | :--- | :--- |
| **Python 3.11 / 3.14** | Core programming language for data generation, training, and APIs. | Local environment |
| **Git & GitHub** | Source code version control and collaborative repository. | [github.com/nieehaanshu24-prod/PayGuard](https://github.com/nieehaanshu24-prod/PayGuard) |
| **DVC (Data Version Control)**| Tracks large CSV datasets using cryptographic MD5 hashes (`.dvc` files) so we don't bloat Git. | Run `dvc status` |
| **Scikit-Learn & XGBoost** | Machine learning libraries used to build our Baseline Logistic Regression, Random Forest, and XGBoost models. | `src/train.py` |
| **MLflow** | Experiment tracking and Model Registry. Logs parameters, metrics (PR-AUC, F1, Recall), PR curves, confusion matrices, and stores the champion model. | `http://localhost:5000` |
| **Apache Airflow** | Workflow orchestrator. Defines the 7-stage automated retraining pipeline DAG. | `http://localhost:8080` |
| **FastAPI** | High-performance Python REST API framework that serves predictions in sub-12 milliseconds. | `http://localhost:8000/docs` |
| **SHAP (Shapley Explanations)**| Responsible AI library that explains the mathematical importance of each feature for every prediction. | Visible on UI & `/explain` |
| **Prometheus** | Time-series database that scrapes operational metrics (requests/sec, p95 latency, fraud distribution) from `/metrics`. | `http://localhost:9090` |
| **Grafana** | Observability dashboard visualizing Prometheus metrics and drift alerts. | `http://localhost:3000` |
| **Docker & Docker Compose**| Containerizes all 5 services (`api`, `airflow`, `mlflow`, `prometheus`, `grafana`) into isolated containers. | Run `docker ps` |
| **GitHub Actions** | Automated CI/CD pipeline that runs 13 unit tests, checks quality gates, and builds the Docker image on every Git push. | GitHub "Actions" tab |
| **AWS (S3, SageMaker, CloudWatch)**| Cloud extension scripts for remote artifact storage, SageMaker training/endpoints, and structured logging. | `scripts/` folder |

---

# PART 5: THE 7 PIPELINE STAGES (MATCHING AIRFLOW & COURSE PDF)

Whenever your professor asks: *"Explain your ML pipeline from start to finish"*, describe these **7 stages**:

1. **Stage 1: Data Ingestion (`src/ingestion.py`)**:
   - Reads `data/raw/transactions_v1.csv` (15,000 transactions).
   - Performs a **stratified 80/20 train-test split** using `SEED = 42`.
   - "Stratified" means the 1.53% fraud ratio is preserved identically in both train (12,000 rows, 184 frauds) and test (3,000 rows, 46 frauds) sets.
2. **Stage 2: Data Validation (`src/validation.py`)**:
   - Acts as a quality firewall before training.
   - Checks that amounts are $> 0$, balances are non-negative, channels are in the approved whitelist (`UPI`, `CREDIT_CARD`, etc.), and no null values exist.
3. **Stage 3: Preprocessing (`src/preprocessing.py`)**:
   - Fits a Scikit-Learn `ColumnTransformer`.
   - Uses `StandardScaler` on numerical features (amount, balance, velocity).
   - Uses `OneHotEncoder` on categorical features (channel, merchant).
   - **Crucial**: Preprocessing is fitted **ONLY** on the training set, then applied to the test set, preventing **data leakage**.
4. **Stage 4: Feature Engineering (`src/feature_engineering.py`)**:
   - Calculates behavioral signals:
     - `amount_to_avg_ratio`: $\frac{\text{Current Amount}}{\text{Historical 30-Day Average}}$. If this is $> 5.0$, it signals a spending anomaly.
     - `balance_diff`: Confirms math consistency ($\text{old\_balance} - \text{new\_balance}$).
     - `velocity_1h` & `velocity_24h`: Rapid card swipe counters.
5. **Stage 5: Multi-Model Training (`src/train.py`)**:
   - We train **3 competing architectures** and log all runs into MLflow:
     1. **Baseline**: Logistic Regression (fast, linear benchmark).
     2. **Candidate 1**: Random Forest ($150$ decision trees, depth $12$).
     3. **Candidate 2**: XGBoost ($200$ boosted trees, learning rate $0.05$).
6. **Stage 6: Model Evaluation & Financial Impact Matrix (`src/evaluate.py`)**:
   - Compares PR-AUC, ROC-AUC, Recall, and Precision.
   - Computes the **Financial Dollar Matrix**:
     - False Negative (Uncaught fraud) = **\$500 direct loss**.
     - False Positive (False alarm review) = **\$25 investigator friction cost**.
     - Net Dollar Savings = $(TP \times \$500) - (FP \times \$25) = \mathbf{+\$23,000.00}$.
7. **Stage 7: Model Registration & Promotion Gate (`src/register.py`)**:
   - Enforces automated quality assertions:
     - $\text{PR-AUC} \ge 0.70$ (PASSED: 1.0000)
     - $\text{Recall} \ge 0.75$ (PASSED: 1.0000)
   - Promotes the winning model (`RandomForest_Candidate`) into the MLflow Model Registry under the alias **`@champion`** and exports `models/champion_model.joblib`.

---

# PART 6: CONCEPT DRIFT (WHAT IS IT & HOW DO WE DETECT IT?)

### What is Drift?
In the real world, fraud patterns change over time:
- In month 1, fraudsters might attack via high-value international credit card swipes.
- In month 2, after banks block international cards, fraudsters pivot to domestic UPI micro-transactions on gaming apps.
When input feature distributions shift, the model's accuracy degrades. This is called **Data Drift / Concept Drift**.

### How PayGuard Detects Drift:
In `src/drift.py` and `scripts/simulate_drift.py`:
1. We take our **3,000-record baseline reference dataset** and compare it against the **incoming production stream (`transactions_v2_drifted.csv`)**.
2. We run two statistical tests across all features:
   - **Kolmogorov-Smirnov (KS) Test**: Compares the cumulative distribution functions of the two datasets. If $p\text{-value} < 0.05$, a statistically significant shift has occurred.
   - **Population Stability Index (PSI)**: Standard banking risk metric:
     - $\text{PSI} < 0.02$: Normal, stable.
     - $0.02 \le \text{PSI} < 0.10$: Slight shift (Warning).
     - $\text{PSI} \ge 0.10$: **Severe Drift $\to$ Requires Automated Retraining**.
3. **Our Results**:
   - `device_trust_score` ($\text{PSI} = 0.228$) $\to$ **CRITICAL DRIFT**.
   - `location_risk_score` ($\text{PSI} = 0.074$) $\to$ **DRIFT DETECTED**.
   - `amount_to_avg_ratio` ($\text{PSI} = 0.064$) $\to$ **DRIFT DETECTED**.
   - Overall: **5 out of 7 features drifted**, triggering an automated alert in Prometheus to launch an Airflow retraining run!

---

# PART 7: WHY ARE WE USING AWS IN DRY-RUN MODE NOW?

### The Question:
> *"Why aren't you running AWS SageMaker 24/7 on an active EC2 instance right now?"*

### The Answer to Give:
1. **AWS Credits Preservation**:
   - Everyone gets **\$200 in free AWS credits** on sign-up.
   - An AWS SageMaker real-time inference instance (`ml.m5.xlarge`) costs **\$0.269 per hour**, which equals **\$195.00 per month**.
   - If we left SageMaker running 24/7 today, it would **completely exhaust our \$200 budget before our final viva**!
2. **100% Production Code is Written**:
   - We did not fake or skip AWS. We wrote full, production-ready Python Boto3 scripts:
     - `scripts/s3_storage_sync.py`: Syncs datasets and models to S3.
     - `scripts/sagemaker_deploy.py`: Configures SageMaker endpoints and triggers SageMaker Training Jobs.
     - `app/cloudwatch_logger.py`: Emits structured JSON logs for AWS CloudWatch Logs Insights.
     - `scripts/cloud_cleanup.py`: Deletes endpoints and configs to guarantee **\$0.00 dangling cloud bills**.
3. **Dry-Run Validation**:
   - Enterprise engineering teams always test AWS scripts locally in dry-run mode before incurring billable costs.
   - For the **final end-semester evaluation**, we simply pass `--dry-run=False` to deploy live to AWS for 10 minutes and immediately tear it down using `cloud_cleanup.py`.

---

# PART 8: 5-MINUTE LIVE DEMONSTRATION SCRIPT

Follow this exact walkthrough during your review:

### Step 1 (0:00 – 1:00): Introduction
> *"Good morning professors. Our project is **PayGuard: Real-Time Digital Payment Fraud Detection**. Digital payment fraud is an imbalanced classification problem where fraud accounts for only 1.5% of transactions. Our goal is to detect fraud in real-time with sub-30ms latency before funds clear.*
>
> *We have built an end-to-end MLOps platform featuring DVC versioning, an Airflow 7-stage DAG, MLflow experiment tracking, FastAPI real-time serving, SHAP explainability, and Prometheus/Grafana drift monitoring."*

### Step 2 (1:00 – 2:30): Live Real-Time v2 UI Demo
1. Open your browser to **`http://localhost:8000/ui`** (or `http://localhost:8000`).
2. Show the **Executive Dashboard**:
   > *"Here is our live B2B fintech risk console. It tracks total processed transactions, fraud rate, and an average inference latency of **11.2 milliseconds**, comfortably beating our 30ms SLA."*
3. Click **"Live Stream"** on the sidebar $\to$ Click **"Start Stream"**:
   > *"This streams simulated live payment transactions. Each transaction is classified within milliseconds into APPROVED, REVIEW, or BLOCKED."*
4. Click **"Transaction Analysis"**:
   > *"This is our investigator sandbox. If a suspicious $3,500 international crypto transaction arrives with 0.10 device trust, we hit 'Evaluate Transaction' and get an instant red BLOCKED decision."*
5. Click **"SHAP Explainability"**:
   > *"Financial regulations require transparency. Our TreeSHAP engine attributes exact mathematical impact: high location risk (+0.17) and device trust mismatch drove the risk score."*
6. Click **"Drift Monitoring"**:
   > *"Here we monitor concept drift across our 7 features using Kolmogorov-Smirnov and Population Stability Index (PSI)."*

### Step 3 (2:30 – 3:30): Apache Airflow & MLflow
1. Open **`http://localhost:8080`**:
   > *"Here is Apache Airflow running our 7-stage orchestrated pipeline. When we click 'Trigger DAG', it sequentially executes Ingestion, Validation, Preprocessing, Feature Engineering, Training, Evaluation, and Registration."*
2. Open **`http://localhost:5000`**:
   > *"In MLflow, we tracked 3 models: Baseline Logistic Regression, Random Forest, and XGBoost. The Random Forest won with 1.00 PR-AUC and was automatically promoted to `@champion` in the Model Registry."*

### Step 4 (3:30 – 4:15): Docker & CI/CD
1. Open PowerShell and run `docker ps`:
   > *"All 5 services are containerized and running in Docker: FastAPI, Airflow, MLflow, Prometheus, and Grafana."*
2. Open your GitHub repository [https://github.com/nieehaanshu24-prod/PayGuard](https://github.com/nieehaanshu24-prod/PayGuard):
   > *"On GitHub Actions, our CI/CD pipeline runs unit tests, integration tests, quality gates, latency benchmarks, and Docker health tests on every push, all passing with green checkmarks."*

### Step 5 (4:15 – 5:00): Conclusion
> *"For cloud deployment, our AWS S3, SageMaker, and CloudWatch scripts are fully coded and validated in dry-run mode to preserve our \$200 AWS credit for the final viva. Thank you, and we are happy to answer your questions."*

---

# PART 9: TOP 15 VIVA QUESTIONS & SHORT ANSWERS

#### Q1: "What model is currently running in production?"
**Answer**: *"Random Forest Classifier with 150 estimators and max depth of 12, registered as `@champion` in MLflow."*

#### Q2: "What is your measured p95 latency?"
**Answer**: *"11.75 milliseconds, measured across 1,000 requests, which easily satisfies the sub-30ms payment gateway SLA."*

#### Q3: "Why did you use PR-AUC instead of ROC-AUC or Accuracy?"
**Answer**: *"Because fraud is only 1.5% of the data. Accuracy is misleading because predicting 'all legitimate' gets 98.5% accuracy but catches zero fraud. ROC-AUC is distorted by large true-negative counts. PR-AUC focuses directly on the minority fraud class."*

#### Q4: "How do you prevent data leakage?"
**Answer**: *"We split the dataset into train and test sets before fitting any preprocessors or scalers. The `StandardScaler` is fitted only on the training set and simply transforms the test set."*

#### Q5: "How does your system explain decisions to a customer support agent?"
**Answer**: *"Using TreeSHAP (Shapley Additive Explanations). Our `/explain` endpoint outputs the exact numerical contribution of each feature to the fraud probability."*

#### Q6: "What is your business financial metric?"
**Answer**: *"Net dollar savings. Uncaught fraud costs \$500 per incident; false alarm reviews cost \$25 in analyst time. On our 3,000 test transactions, PayGuard created **+\$23,000 in net fraud savings**."*

#### Q7: "What is the purpose of DVC in your architecture?"
**Answer**: *"DVC tracks large datasets using cryptographic MD5 hashes without pushing heavy CSV files to GitHub. Git tracks only lightweight `.dvc` metadata files."*

#### Q8: "How does your promotion gate work?"
**Answer**: *"In `src/register.py`, before promoting any candidate to the Model Registry, it must pass two automated threshold assertions: PR-AUC $\ge 0.70$ and Recall $\ge 0.75$. If a model fails, the pipeline halts."*

#### Q9: "How do you detect feature drift in production?"
**Answer**: *"We run two-sample Kolmogorov-Smirnov (KS) tests and calculate the Population Stability Index (PSI). When PSI $> 0.10$, an alert triggers automated retraining in Airflow."*

#### Q10: "What happens when delayed chargeback labels arrive from the bank?"
**Answer**: *"Banks discover uncaught fraud weeks later when customers report chargebacks. Our `/feedback` endpoint accepts these delayed labels, matches them against cached transaction IDs, and updates Prometheus True Positive and False Positive counters."*

#### Q11: "What are the 7 stages of your Airflow DAG?"
**Answer**: *"1. Ingestion, 2. Validation, 3. Preprocessing, 4. Feature Engineering, 5. Training, 6. Evaluation, 7. Model Registration."*

#### Q12: "How is your application deployed?"
**Answer**: *"Containerized via Docker Compose running 5 services: FastAPI (port 8000), Airflow (port 8080), MLflow (port 5000), Prometheus (port 9090), and Grafana (port 3000)."*

#### Q13: "What CI/CD automation do you have?"
**Answer**: *"GitHub Actions runs on every push: installing dependencies, running 13 Pytest tests, verifying model quality gates, running latency benchmarks, simulating drift, and performing a Docker build & healthcheck test."*

#### Q14: "Why are you using AWS in dry-run mode?"
**Answer**: *"To preserve our \$200 signup credits. SageMaker endpoints cost ~\$195/month. Our Boto3 scripts for S3, SageMaker, and CloudWatch are fully written and validated in dry-run mode; we will launch them live for the final end-sem viva."*

#### Q15: "What is the role of Prometheus and Grafana?"
**Answer**: *"Prometheus scrapes real-time operational metrics like request throughput, latency percentiles, and PSI drift gauges from `/metrics`. Grafana provides the visual monitoring dashboard."*
