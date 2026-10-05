# PayGuard Individual Viva Preparation & Q&A Cheat Sheet

Comprehensive technical questions and bullet-point model answers for your viva evaluation.

---

### Q1: Why did you use PR-AUC instead of Accuracy or ROC-AUC as the primary metric?
* **Answer**:
  - Payment fraud exhibits extreme class imbalance (~1.5% fraud vs 98.5% legitimate).
  - A naive classifier that predicts "Legitimate" for every transaction achieves 98.5% Accuracy while catching 0% of fraud, rendering accuracy useless.
  - ROC-AUC uses False Positive Rate ($FP / [FP + TN]$). Because True Negatives ($TN$) are overwhelmingly large, ROC-AUC remains artificially high even when the model generates hundreds of false alarms.
  - **PR-AUC (Precision-Recall AUC)** evaluates Precision ($TP / [TP + FP]$) directly against Recall ($TP / [TP + FN]$), focusing specifically on the minority fraud class without being distorted by large true negatives.

---

### Q2: What is the difference between Data Drift and Concept Drift in fraud detection?
* **Answer**:
  - **Data / Covariate Drift ($P(X)$ changes)**: The distribution of input features shifts, but the underlying definition of fraud stays the same. E.g., During Black Friday or Diwali, transaction amounts and hourly shopping volumes rise sharply for normal users.
  - **Concept Drift ($P(Y|X)$ changes)**: The relationship between features and the target variable shifts because attackers adapt their strategies. E.g., Attackers switch from single high-dollar card dumps to automated low-amount bot micro-charges ($1-$5) across thousands of accounts to evade high-amount rule filters.

---

### Q3: How do your Kolmogorov-Smirnov (KS) test and Population Stability Index (PSI) detect drift?
* **Answer**:
  - **Two-Sample KS Test**: Non-parametric test that evaluates the maximum vertical distance ($D$) between the cumulative empirical distribution functions of reference vs current data. If the p-value $< 0.05$, the distributions are statistically distinct.
  - **PSI (Population Stability Index)**:
    $$\text{PSI} = \sum \left( \text{Actual}\% - \text{Expected}\% \right) \times \ln\left( \frac{\text{Actual}\%}{\text{Expected}\%} \right)$$
    - $\text{PSI} < 0.1$: Insignificant change (Normal).
    - $0.1 \le \text{PSI} < 0.2$: Moderate change (Monitor).
    - $\text{PSI} \ge 0.2$: Significant distributional shift $\rightarrow$ Triggers automated retraining in PayGuard.

---

### Q4: How does your automated Model Promotion Gate work?
* **Answer**:
  - Located in `src/register.py` and enforced via `tests/test_model_quality.py`.
  - Compares the top candidate against baseline across PR-AUC, Recall, and False Positive Rate.
  - If candidate meets PR-AUC $\ge 0.70$, Recall $\ge 0.75$, and FPR $\le 0.05$, the model is registered in the MLflow Model Registry, tagged with alias `@champion`, and serialized for production serving.
  - If a model fails this gate, promotion is halted, preventing regressive models from reaching production.

---

### Q5: Why is SHAP explainability essential for banking fraud models?
* **Answer**:
  - **Regulatory Compliance**: Regulations like FCRA and GDPR Article 22 mandate that automated adverse decisions (declining a payment or locking an account) must provide actionable explanations.
  - **Investigator Efficiency**: Anti-fraud analysts reviewing flagged queues need to know *why* the transaction was flagged in seconds (e.g. "Velocity surge + device mismatch") rather than auditing hundreds of raw tabular columns.
  - **Mathematical Guarantee**: SHAP uses Shapley values from cooperative game theory, providing the only mathematically unique attribution that guarantees local accuracy, missingness, and consistency.

---

### Q6: What is the Business Metric and Financial Cost Matrix formula?
* **Answer**:
  - We model financial impact using asymmetric banking costs:
    $$\text{Total Cost} = (FN \times \text{AvgFraudLoss}) + (FP \times \text{ReviewCost})$$
  - A False Negative ($FN$) causes direct unrecoverable fraud loss (\$500 average chargeback).
  - A False Positive ($FP$) incurs an operational analyst investigation friction cost (\$25).
  - Our champion model generated **+$23,000 in net dollar savings** by capturing 100% of test frauds ($46 \times \$500$) with zero false alarms.

---

### Q7: How did you achieve an 11.75 ms p95 inference latency?
* **Answer**:
  - 1. Single-sample fast path: Fast string slicing for timestamp parsing (`int(ts[11:13])`) avoiding heavy pandas datetime conversion overhead.
  - 2. Thread pool elimination: Setting `model.n_jobs = 1` during inference to eliminate Python/joblib multi-threading context switching penalties on single-row scoring.
  - 3. In-memory preprocessor caching: Persisting the fitted `ColumnTransformer` pipeline so categorical lookups and scaling happen in $< 2$ ms.

---

### Q8: What components does your Docker Compose orchestrate?
* **Answer**:
  - 1. `payguard-api`: FastAPI REST prediction engine with healthcheck (`:8000`).
  - 2. `prometheus`: Scrapes `/metrics` every 5 seconds to record latencies, RPS, and drift gauges (`:9090`).
  - 3. `grafana`: Pre-provisioned dashboards visualizing p95 latency, throughput, and PSI metrics (`:3000`).
  - 4. `mlflow`: Central server tracking experiment parameters, metrics, artifacts, and registered models (`:5000`).

---

### Q9: How do you handle Delayed Ground Truth Feedback?
* **Answer**:
  - In fraud detection, real labels are delayed by days or weeks (when cardholders report unauthorized charges).
  - PayGuard provides `POST /feedback` where payment settlement feeds submit actual outcomes (`actual_is_fraud: 1/0`).
  - The API matches the cached prediction against the actual label and increments Prometheus counters (`true_positive`, `false_positive`, `false_negative`, `true_negative`) to track live precision and recall decay over time.

---

### Q10: What checks are performed in your GitHub Actions CI/CD workflow?
* **Answer**:
  - 1. Automated dataset generation and pipeline execution.
  - 2. Preprocessing & feature engineering unit tests (`test_preprocessing.py`).
  - 3. API endpoint integration tests (`test_api.py`).
  - 4. Model quality threshold enforcement test (`test_model_quality.py`).
  - 5. Real-time sub-30ms latency benchmark validation (`benchmark_latency.py`).
  - 6. Docker container image build and healthcheck verification.
