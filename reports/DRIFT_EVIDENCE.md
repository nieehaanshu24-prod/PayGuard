# PayGuard Data & Feature Drift Monitoring Evidence

- **Overall Dataset Drift Detected**: `True`
- **Drifted Features Count**: `5`
- **Triggered Action**: `TRIGGER_AUTOMATED_RETRAINING_DAG`

### Feature-Level Drift Metrics

| Monitored Feature | Population Stability Index (PSI) | KS Test Statistic | KS p-value | Status |
| :--- | :--- | :--- | :--- | :--- |
| `amount` | 0.0367 | 0.0643 | 3.4663e-07 | **DRIFT ALERT** |
| `old_balance` | 0.0032 | 0.0220 | 3.2007e-01 | STABLE |
| `new_balance` | 0.0031 | 0.0238 | 2.3529e-01 | STABLE |
| `amount_to_avg_ratio` | 0.0644 | 0.0911 | 5.6697e-14 | **DRIFT ALERT** |
| `velocity_1h` | 0.0230 | 0.0931 | 1.4178e-14 | **DRIFT ALERT** |
| `device_trust_score` | 0.2278 | 0.1043 | 3.4488e-18 | **DRIFT ALERT** |
| `location_risk_score` | 0.0740 | 0.1043 | 3.4488e-18 | **DRIFT ALERT** |
