# PayGuard 5-Minute Live Demonstration Script

Use this exact chronological walkthrough during your live project presentation to evaluators.

---

## ⏱️ Minute 0:00 - 1:00: Problem & Architecture (The Hook)

**What to Say**:
> *"Good morning evaluators. In electronic payments (UPI, Cards, Wallets), banks face a critical dilemma: if we take too long to detect fraud, consumer checkout experiences are ruined; if we miss a fraud attack, millions of dollars are lost.
>
> We present **PayGuard**, an end-to-end MLOps platform for real-time payment fraud detection that achieves **11.75 ms p95 inference latency**, automated Airflow orchestration, experiment tracking with MLflow, live Prometheus drift monitoring, and SHAP explainability.
>
> Let's look at our architecture diagram in the README..."*

**What to Show**:
- Open the [`README.md`](./README.md) and show the Mermaid architecture diagram (DataOps -> Automated Workflow -> MLflow Registry -> FastAPI REST -> Prometheus/Grafana Monitoring).

---

## ⏱️ Minute 1:00 - 2:00: Data Versioning & MLflow Experiment Lineage

**What to Say**:
> *"First, in DataOps, we enforce strict reproducibility using DVC. Both baseline and drifted datasets are tracked with DVC metadata pointers in Git.
>
> Second, in Experiment Management, we trained a Logistic Regression baseline, a Random Forest candidate, and an XGBoost candidate. Every run, parameter, confusion matrix, and PR curve was tracked in MLflow.
>
> Candidate 1 passed our strict automated promotion gate (requiring PR-AUC $\ge 0.70$ and Recall $\ge 0.75$) and was automatically registered into the MLflow Model Registry as `@champion`."*

**What to Show**:
- Terminal showing `dvc status` (All up to date).
- MLflow UI at `http://localhost:5000` showing the 3 runs, parameter comparisons, artifacts, and the registered `@champion` model.

---

## ⏱️ Minute 2:00 - 3:00: Real-Time API Inference & SHAP Explainability

**What to Say**:
> *"Now let's inspect the live deployment. Our FastAPI service runs with Pydantic v2 validation.
>
> Let's test a normal transaction: $45 grocery payment on UPI with high device trust. The API approves it in **8 ms**.
>
> Now let's simulate a sophisticated midnight attack: a $2,850 international transfer on an unrecognized device at 2:45 AM. The API immediately flags it as FRAUD with a 96% risk score and issues a `BLOCK_TRANSACTION` recommendation.
>
> Crucially, for banking compliance, we don't just return a score. Calling our `/explain` endpoint gives exact SHAP feature attributions explaining that abnormal velocity and amount ratios drove the block decision."*

**What to Show**:
- FastAPI Swagger UI at `http://localhost:8000/docs` executing `/predict` and `/explain` (or your AI Studio UI / Streamlit fallback at `http://localhost:8501`).

---

## ⏱️ Minute 3:00 - 4:00: Prometheus Observability & Drift Detection

**What to Say**:
> *"In production MLOps, models degrade as fraud patterns shift. PayGuard continuously monitors p95 latency, RPS throughput, and feature drift.
>
> Running our drift simulation script injects realistic concept drift. Using two-sample Kolmogorov-Smirnov tests and Population Stability Index (PSI), PayGuard immediately detects distribution drift across 5 features (amount, device trust, location risk) and updates Prometheus gauges to trigger automated Airflow retraining."*

**What to Show**:
- Run `python scripts/simulate_drift.py`. Show the terminal table of PSI and KS values.
- Show `/metrics` in browser or Grafana dashboard showing the Drift Alert change to RED and latency percentiles.

---

## ⏱️ Minute 4:00 - 5:00: Business ROI, CI/CD & Conclusion

**What to Say**:
> *"To quantify real-world business impact, our cost matrix demonstrates **$23,000 in net fraud losses prevented** with **0% false positive friction**.
>
> Our GitHub Actions CI/CD pipeline validates unit tests, integration tests, model quality threshold enforcement, and builds the production Docker container on every git commit.
>
> In summary, PayGuard fulfills every mandatory MLOps requirement with production-grade engineering. Thank you, and we are ready for your questions."*

**What to Show**:
- Show `reports/PERFORMANCE_REPORT.md` summary table.
- Show passing pytest / GitHub Actions workflow status.
