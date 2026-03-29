#!/usr/bin/env python3
"""Analyze confidence vs accuracy drift from JSONL log."""

import json
import sys
from collections import defaultdict
from pathlib import Path


def load_log(path):
    entries = []
    with open(path) as f:
        for line in f:
            line = line.strip()
            if line:
                try:
                    entries.append(json.loads(line))
                except json.JSONDecodeError:
                    continue
    return entries


def bucket_analysis(entries, bucket_size=10):
    buckets = defaultdict(lambda: {"confidences": [], "accuracies": []})

    for e in entries:
        call = e.get("call", 0)
        bucket = ((call - 1) // bucket_size) + 1
        conf = e.get("confidence")
        verified = e.get("verified")

        if conf is not None:
            buckets[bucket]["confidences"].append(conf)

        if verified is not None:
            buckets[bucket]["accuracies"].append(1.0 if verified else 0.0)

    return buckets


def analyze_session(entries):
    if not entries:
        print("No entries found.")
        return

    buckets = bucket_analysis(entries)

    print("SESSION ANALYSIS")
    print("=" * 60)

    drift_detected = False
    drift_start = None

    for bucket_num in sorted(buckets.keys()):
        b = buckets[bucket_num]
        start = (bucket_num - 1) * 10 + 1
        end = bucket_num * 10

        avg_conf = sum(b["confidences"]) / len(b["confidences"]) if b["confidences"] else None
        avg_acc = sum(b["accuracies"]) / len(b["accuracies"]) if b["accuracies"] else None

        conf_str = f"{avg_conf:.2f}" if avg_conf is not None else "N/A"
        acc_str = f"{avg_acc:.2f}" if avg_acc is not None else "N/A"

        if avg_conf is not None and avg_acc is not None:
            gap = avg_acc - avg_conf
            gap_str = f"{gap:+.2f}"
            if gap < -0.15:
                flag = "🔴🔴"
                if not drift_detected:
                    drift_detected = True
                    drift_start = start
            elif gap < -0.08:
                flag = "⚠️"
                if not drift_detected:
                    drift_detected = True
                    drift_start = start
            elif gap < 0:
                flag = "⚠️"
            else:
                flag = "✅"
        else:
            gap_str = "N/A"
            flag = ""

        print(f"Bucket {bucket_num} (calls {start}-{end}):  confidence={conf_str}  accuracy={acc_str}  gap={gap_str} {flag}")

    # Summary stats
    all_conf = [e["confidence"] for e in entries if e.get("confidence") is not None]
    all_verified = [e for e in entries if e.get("verified") is not None]

    if all_conf:
        print(f"\nTotal entries: {len(entries)}")
        print(f"Avg confidence: {sum(all_conf)/len(all_conf):.2f}")
    if all_verified:
        acc = sum(1 for e in all_verified if e["verified"]) / len(all_verified)
        print(f"Overall accuracy: {acc:.2f}")

    if drift_detected:
        print(f"\n🔴 DRIFT ALERT: Confidence inflation detected at call {drift_start}+")
        print("RECOMMENDATION: Add hard reset at tool calls where drift starts")
    else:
        print("\n✅ No significant drift detected")


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 analyze_confidence.py <path-to-confidence-log.jsonl>")
        sys.exit(1)

    path = Path(sys.argv[1])
    if not path.exists():
        print(f"File not found: {path}")
        sys.exit(1)

    entries = load_log(path)
    analyze_session(entries)


if __name__ == "__main__":
    main()
