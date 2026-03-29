#!/usr/bin/env python3
"""Memory nightly build — scan for stale beliefs, contradictions, and consolidation opportunities."""

import os
import re
import sys
from datetime import datetime, timedelta
from pathlib import Path


def find_md_files(memory_dir):
    """Find all markdown files in memory directory."""
    files = []
    for f in Path(memory_dir).rglob("*.md"):
        if ".archive" in str(f):
            continue
        files.append(f)
    return sorted(files)


def parse_date_from_filename(path):
    """Extract date from YYYY-MM-DD.md filenames."""
    match = re.match(r"(\d{4}-\d{2}-\d{2})\.md$", path.name)
    if match:
        try:
            return datetime.strptime(match.group(1), "%Y-%m-%d")
        except ValueError:
            pass
    return None


def find_stale_beliefs(memory_dir, stale_days=30):
    """Find beliefs older than stale_days that haven't been re-verified."""
    now = datetime.utcnow()
    cutoff = now - timedelta(days=stale_days)
    stale = []
    files = find_md_files(memory_dir)

    for f in files:
        file_date = parse_date_from_filename(f)
        if file_date and file_date < cutoff:
            try:
                content = f.read_text()
                # Look for belief-like statements
                belief_patterns = [
                    r"(?:I (?:found|learned|noticed|discovered|realized))\s+(.{20,})",
                    r"(?:always|never|must|should|important)[:\s]+(.{20,})",
                    r"\*\*(?:note|remember|key|important)\*\*[:\s]+(.{20,})",
                ]
                beliefs = []
                for pattern in belief_patterns:
                    matches = re.findall(pattern, content, re.IGNORECASE)
                    beliefs.extend(matches[:3])  # Limit per pattern

                if beliefs:
                    stale.append({
                        "file": str(f),
                        "date": file_date.strftime("%Y-%m-%d"),
                        "days_old": (now - file_date).days,
                        "beliefs": beliefs[:5],
                    })
            except Exception:
                continue

    return stale


def find_contradictions(files):
    """Simple contradiction detection via opposing keywords."""
    statements = []
    for f in files:
        try:
            content = f.read_text()
            for line in content.split("\n"):
                line = line.strip()
                if len(line) > 20 and len(line) < 300:
                    statements.append((str(f), line))
        except Exception:
            continue

    contradictions = []
    negation_words = ["not", "never", "don't", "doesn't", "won't", "false", "incorrect", "wrong"]

    # Very basic: find statements that share significant words but one has negation
    for i, (file_a, stmt_a) in enumerate(statements):
        for file_b, stmt_b in statements[i+1:i+50]:  # Limit search window
            if file_a == file_b:
                continue
            words_a = set(re.findall(r'\b\w{4,}\b', stmt_a.lower()))
            words_b = set(re.findall(r'\b\w{4,}\b', stmt_b.lower()))
            overlap = words_a & words_b

            if len(overlap) >= 3:
                has_neg_a = any(n in stmt_a.lower() for n in negation_words)
                has_neg_b = any(n in stmt_b.lower() for n in negation_words)
                if has_neg_a != has_neg_b:
                    contradictions.append({
                        "file_a": file_a,
                        "stmt_a": stmt_a[:150],
                        "file_b": file_b,
                        "stmt_b": stmt_b[:150],
                        "shared_words": list(overlap)[:5],
                    })

    return contradictions[:10]  # Limit results


def find_consolidation_candidates(memory_dir):
    """Find daily logs older than 7 days ready for consolidation."""
    now = datetime.utcnow()
    cutoff = now - timedelta(days=7)
    candidates = []

    for f in Path(memory_dir).glob("*.md"):
        file_date = parse_date_from_filename(f)
        if file_date and file_date < cutoff:
            try:
                size = f.stat().st_size
                candidates.append({
                    "file": str(f),
                    "date": file_date.strftime("%Y-%m-%d"),
                    "days_old": (now - file_date).days,
                    "size_kb": round(size / 1024, 1),
                })
            except Exception:
                continue

    return sorted(candidates, key=lambda x: x["date"])


def generate_report(memory_dir, stale, contradictions, candidates):
    """Generate the nightly report."""
    now = datetime.utcnow().strftime("%Y-%m-%d")
    lines = [
        f"# Nightly Report — {now}",
        "",
    ]

    # Stats
    md_files = find_md_files(memory_dir)
    total_size = sum(f.stat().st_size for f in md_files if f.exists())
    lines.extend([
        "## Memory Stats",
        f"- Total files: {len(md_files)}",
        f"- Total size: {round(total_size/1024, 1)}KB",
        f"- Contradictions: {len(contradictions)}",
        f"- Stale beliefs: {len(stale)}",
        f"- Ready for consolidation: {len(candidates)}",
        "",
    ])

    # Stale beliefs
    if stale:
        lines.append("## Stale Beliefs (unverified 30+ days)")
        for s in stale[:10]:
            lines.append(f"\n**{s['file']}** ({s['days_old']} days old)")
            for b in s["beliefs"][:3]:
                lines.append(f"- {b[:120]}")
        lines.append("")

    # Contradictions
    if contradictions:
        lines.append("## Possible Contradictions")
        for c in contradictions[:5]:
            lines.append(f"\n- `{c['file_a']}`: {c['stmt_a']}")
            lines.append(f"  `{c['file_b']}`: {c['stmt_b']}")
            lines.append(f"  shared: {', '.join(c['shared_words'])}")
        lines.append("")

    # Consolidation candidates
    if candidates:
        lines.append("## Daily Logs Ready for Consolidation")
        total_size = sum(c["size_kb"] for c in candidates)
        lines.append(f"- {len(candidates)} files, {total_size}KB total")
        for c in candidates[:10]:
            lines.append(f"  - {c['file']} ({c['days_old']} days, {c['size_kb']}KB)")
        if len(candidates) > 10:
            lines.append(f"  ... and {len(candidates) - 10} more")
        lines.append("")

    # Actions
    lines.extend([
        "## Suggested Actions",
        "1. Review stale beliefs — verify, update, or archive",
        "2. Resolve contradictions — pick the correct version, annotate the other",
        "3. Consolidate old daily logs — extract key entries, move to archive",
    ])

    return "\n".join(lines)


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 nightly.py <path-to-memory-dir>")
        sys.exit(1)

    memory_dir = Path(sys.argv[1])
    if not memory_dir.exists():
        print(f"Directory not found: {memory_dir}")
        sys.exit(1)

    print("Running nightly build...")
    print(f"Scanning: {memory_dir}")

    stale = find_stale_beliefs(memory_dir)
    md_files = find_md_files(memory_dir)
    contradictions = find_contradictions(md_files)
    candidates = find_consolidation_candidates(memory_dir)

    report = generate_report(memory_dir, stale, contradictions, candidates)

    # Write report
    report_path = memory_dir / "nightly-report.md"
    report_path.write_text(report)
    print(f"\nReport written to: {report_path}")
    print("\n" + report)


if __name__ == "__main__":
    main()
