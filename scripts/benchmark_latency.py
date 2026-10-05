"""
Latency and Throughput Benchmarking Utility for PayGuard.
Validates real-time inference requirements: p95 latency < 30ms, throughput RPS, and 0% error rate.
"""

import os
import sys
import json
import time
import numpy as np

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from app.model_loader import get_model_service


def run_benchmark(num_iterations: int = 1000):
    print("=" * 65)
    print("PAYGUARD: REAL-TIME INFERENCE LATENCY & THROUGHPUT BENCHMARK")
    print("=" * 65)

    service = get_model_service()

    sample_tx = {
        "transaction_id": "TXN_BENCHMARK",
        "timestamp": "2026-10-05 14:00:00",
        "user_id": "USR_0999",
        "amount": 125.50,
        "old_balance": 1500.00,
        "new_balance": 1374.50,
        "user_avg_amount_30d": 90.00,
        "channel": "UPI",
        "merchant_category": "electronics",
        "is_foreign_transaction": 0,
        "device_trust_score": 0.92,
        "location_risk_score": 0.08,
        "velocity_1h": 1,
        "velocity_24h": 2
    }

    # Warmup
    print("[Benchmark] Running 50 warmup iterations...")
    for _ in range(50):
        service.predict_single(sample_tx)

    # Benchmark run
    print(f"[Benchmark] Executing {num_iterations} timed inference requests...")
    latencies_ms = []
    errors = 0

    t_start = time.perf_counter()
    for _ in range(num_iterations):
        try:
            _, _, _, _, lat = service.predict_single(sample_tx)
            latencies_ms.append(lat)
        except Exception:
            errors += 1
    total_time_sec = time.perf_counter() - t_start

    throughput_rps = num_iterations / total_time_sec
    p50 = float(np.percentile(latencies_ms, 50))
    p90 = float(np.percentile(latencies_ms, 90))
    p95 = float(np.percentile(latencies_ms, 95))
    p99 = float(np.percentile(latencies_ms, 99))
    error_rate = (errors / num_iterations) * 100.0

    print("\n" + "-" * 65)
    print(f"Total Requests Scored   : {num_iterations}")
    print(f"Total Elapsed Time      : {total_time_sec:.3f} seconds")
    print(f"Throughput (RPS)        : {throughput_rps:.1f} requests/sec")
    print(f"Inference Latency (p50) : {p50:.2f} ms")
    print(f"Inference Latency (p90) : {p90:.2f} ms")
    print(f"Inference Latency (p95) : {p95:.2f} ms (Target: < 30.00 ms)")
    print(f"Inference Latency (p99) : {p99:.2f} ms")
    print(f"Error Rate              : {error_rate:.2f}%")
    print("-" * 65)

    status_p95 = "PASSED (< 30ms)" if p95 < 30.0 else "FAILED"
    print(f"Sub-30ms Real-Time SLA  : {status_p95}")

    results = {
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "total_requests": num_iterations,
        "elapsed_seconds": round(total_time_sec, 3),
        "throughput_rps": round(throughput_rps, 1),
        "p50_latency_ms": round(p50, 2),
        "p90_latency_ms": round(p90, 2),
        "p95_latency_ms": round(p95, 2),
        "p99_latency_ms": round(p99, 2),
        "error_rate_pct": round(error_rate, 2),
        "sla_target_met": bool(p95 < 30.0)
    }

    os.makedirs("reports", exist_ok=True)
    out_path = "reports/BENCHMARK_RESULTS.json"
    with open(out_path, "w") as f:
        json.dump(results, f, indent=2)
    print(f"[Evidence] Benchmark results saved to {out_path}")
    print("=" * 65)


if __name__ == "__main__":
    run_benchmark(1000)
