"""
AWS S3 storage sync script for PayGuard datasets and model artifacts.
Supports live AWS S3 sync via Boto3 as well as dry-run simulation mode.
"""

import os
import sys
import argparse
import boto3
from botocore.exceptions import NoCredentialsError, ClientError


def sync_to_s3(bucket_name: str = "payguard-mlops-artifacts", region: str = "us-east-1", dry_run: bool = False):
    print("=" * 65)
    print("PAYGUARD: AWS S3 ARTIFACT STORAGE SYNC")
    print("=" * 65)
    print(f"Target Bucket : s3://{bucket_name}")
    print(f"Region        : {region}")
    print(f"Execution Mode: {'DRY-RUN (Simulated)' if dry_run else 'LIVE AWS'}")
    print("-" * 65)

    files_to_sync = [
        ("data/raw/transactions_v1.csv", "datasets/transactions_v1.csv"),
        ("data/raw/transactions_v2_drifted.csv", "datasets/transactions_v2_drifted.csv"),
        ("data/reference/baseline_reference.csv", "datasets/baseline_reference.csv"),
        ("models/champion_model.joblib", "models/champion_model.joblib"),
        ("models/preprocessor.joblib", "models/preprocessor.joblib"),
        ("models/model_metadata.json", "models/model_metadata.json")
    ]

    if dry_run:
        print("\n[Dry-Run] Simulating S3 upload for PayGuard production artifacts:")
        for local_file, s3_key in files_to_sync:
            if os.path.exists(local_file):
                size_kb = os.path.getsize(local_file) / 1024.0
                print(f" [SIMULATED UPLOAD] {local_file} ({size_kb:.1f} KB) -> s3://{bucket_name}/{s3_key}")
            else:
                print(f" [WARNING] Local file not found: {local_file}")
        print("\n[SUCCESS] S3 sync dry-run verification completed successfully.")
        return True

    try:
        s3 = boto3.client("s3", region_name=region)
        for local_file, s3_key in files_to_sync:
            if os.path.exists(local_file):
                print(f"Uploading {local_file} -> s3://{bucket_name}/{s3_key}...")
                s3.upload_file(local_file, bucket_name, s3_key)
                print(f" -> Uploaded successfully.")
        print("\n[SUCCESS] All artifacts synced to AWS S3.")
        return True
    except NoCredentialsError:
        print("[NOTICE] AWS credentials not configured. Use --dry-run for offline verification.")
        return False
    except ClientError as e:
        print(f"[AWS Error] {e}")
        return False


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", default=True, help="Simulate S3 sync without active AWS bill")
    parser.add_argument("--bucket", default="payguard-mlops-artifacts", help="Target S3 bucket name")
    args = parser.parse_args()
    sync_to_s3(bucket_name=args.bucket, dry_run=args.dry_run)
