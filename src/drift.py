"""
Data and feature drift detection module for PayGuard.
Computes Population Stability Index (PSI) and two-sample Kolmogorov-Smirnov (KS) tests
to detect distribution shifts between baseline reference data and incoming production streams.
"""

import numpy as np
import pandas as pd
from scipy.stats import ks_2samp
from typing import Dict, Any, List


def calculate_psi(reference: np.ndarray, current: np.ndarray, num_bins: int = 10) -> float:
    """
    Computes Population Stability Index (PSI) between reference and current feature arrays.
    """
    # Filter out NaNs
    ref = reference[~np.isnan(reference)]
    curr = current[~np.isnan(current)]

    if len(ref) == 0 or len(curr) == 0:
        return 0.0

    # Determine quantile bins from reference
    quantiles = np.linspace(0, 100, num_bins + 1)
    bin_edges = np.percentile(ref, quantiles)
    bin_edges[0] -= 1e-5
    bin_edges[-1] += 1e-5

    # Ensure unique edges
    bin_edges = np.unique(bin_edges)
    if len(bin_edges) < 2:
        return 0.0

    ref_counts, _ = np.histogram(ref, bins=bin_edges)
    curr_counts, _ = np.histogram(curr, bins=bin_edges)

    ref_pct = (ref_counts + 1e-4) / (len(ref) + 1e-4 * len(ref_counts))
    curr_pct = (curr_counts + 1e-4) / (len(curr) + 1e-4 * len(curr_counts))

    psi = np.sum((curr_pct - ref_pct) * np.log(curr_pct / ref_pct))
    return float(psi)


def detect_feature_drift(
    ref_df: pd.DataFrame,
    curr_df: pd.DataFrame,
    numerical_cols: List[str] = None,
    psi_threshold: float = 0.20,
    ks_alpha: float = 0.05
) -> Dict[str, Any]:
    """
    Runs KS-test and PSI across numerical features.
    """
    if numerical_cols is None:
        numerical_cols = [
            "amount", "old_balance", "new_balance", "amount_to_avg_ratio",
            "velocity_1h", "device_trust_score", "location_risk_score"
        ]

    drift_results = {}
    drifted_features = []

    for col in numerical_cols:
        if col in ref_df.columns and col in curr_df.columns:
            ref_vals = ref_df[col].dropna().values
            curr_vals = curr_df[col].dropna().values

            # KS-test
            ks_stat, ks_pval = ks_2samp(ref_vals, curr_vals)

            # PSI
            psi_val = calculate_psi(ref_vals, curr_vals)

            is_drifted = (psi_val >= psi_threshold) or (ks_pval < ks_alpha)
            if is_drifted:
                drifted_features.append(col)

            drift_results[col] = {
                "ks_statistic": round(float(ks_stat), 4),
                "ks_pvalue": float(ks_pval),
                "psi": round(float(psi_val), 4),
                "drift_detected": bool(is_drifted)
            }

    overall_drift = len(drifted_features) >= 2

    return {
        "overall_dataset_drift": overall_drift,
        "drifted_features_count": len(drifted_features),
        "drifted_features": drifted_features,
        "feature_metrics": drift_results
    }
