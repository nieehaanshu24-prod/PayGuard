# PayGuard: DVC Metadata and Data-Version Evidence Report

This report documents the Data Version Control (DVC) architecture, dataset tracking metadata, reproducible hashing, and clean-machine verification procedures for **PayGuard: Real-Time Digital Payment Fraud Detection**.

---

## 1. DVC Configuration and Architecture

PayGuard uses DVC to decouple large transactional datasets from Git version control while maintaining cryptographic tracking of data state and pipeline dependencies.

- **DVC Repository Root**: Project root (`.dvc/`)
- **Remote Name**: `localstorage` (Default local storage) / `s3remote` (AWS Cloud remote)
- **Local Remote Path**: `.dvc/storage`
- **Cloud S3 Remote**: `s3://payguard-mlops-artifacts-bucket/dvc_storage`
- **Autostage**: Enabled (`autostage = true`)

---

## 2. Tracked Data Artifacts & Cryptographic Checksums

The following datasets are versioned using DVC:

| File Path | Description | Records | File Size | DVC MD5 Hash |
| :--- | :--- | :--- | :--- | :--- |
| `data/raw/transactions_v1.csv` | Baseline training dataset (1.53% fraud class imbalance) | 15,000 | 1,856,962 bytes | `5f11dfda681424e13e11eaa904e45522` |
| `data/raw/transactions_v2_drifted.csv` | Drifted production dataset (11.76% attack surge) | 5,000 | 620,059 bytes | `c6035497091a82c6505ad19885f94a46` |
| `data/reference/baseline_reference.csv` | Golden reference subset for KS/PSI drift testing | 3,000 | 371,934 bytes | `56a5646f5e204c815937ddd6fe592066` |

### DVC Pointer File Contents

#### `data/raw/transactions_v1.csv.dvc`
```yaml
outs:
- md5: 5f11dfda681424e13e11eaa904e45522
  size: 1856962
  hash: md5
  path: transactions_v1.csv
```

#### `data/raw/transactions_v2_drifted.csv.dvc`
```yaml
outs:
- md5: c6035497091a82c6505ad19885f94a46
  size: 620059
  hash: md5
  path: transactions_v2_drifted.csv
```

#### `data/reference/baseline_reference.csv.dvc`
```yaml
outs:
- md5: 56a5646f5e204c815937ddd6fe592066
  size: 371934
  hash: md5
  path: baseline_reference.csv
```

---

## 3. Verification of DVC State

Running `dvc status` verifies that all tracked files match their cryptographic hashes:

```bash
$ dvc status
Data and pipelines are up to date.
```

Pushing data to local storage / remote cache:
```bash
$ dvc push
3 files pushed
```

---

## 4. Clean-Machine Reproducibility Procedure

When cloning this repository on a clean developer machine or CI runner:

### Option A: Restoring with DVC
If DVC remote storage or local cache is accessible:
```bash
git clone <repo-url>
cd PayGuard
dvc pull
```

### Option B: Deterministic Local Data Generation (Zero-Dependency Fallback)
If DVC remote credentials are not configured, the dataset generator will deterministically recreate the exact datasets using fixed random seeds (`SEED = 42`):
```bash
python scripts/generate_dataset.py
```
Or simply run the 1-command pipeline:
```bash
python scripts/run_pipeline.py
```
*Note*: `scripts/run_pipeline.py` automatically detects missing raw data on fresh clones and initiates generation with identical statistical distributions before executing ingestion, validation, and training.
