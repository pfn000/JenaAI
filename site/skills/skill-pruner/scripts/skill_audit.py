#!/usr/bin/env python3
"""Audit skill usage from JSONL log and categorize skills."""

import json
import sys
from collections import defaultdict
from datetime import datetime, timedelta
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


def analyze(entries, days=90):
    now = datetime.utcnow()
    cutoff = now - timedelta(days=days)

    skills = defaultdict(lambda: {
        "total": 0,
        "recent": 0,
        "last_used": None,
        "outcomes": defaultdict(int),
        "tasks": []
    })

    for e in entries:
        ts_str = e.get("ts", "")
        skill = e.get("skill", "unknown")
        outcome = e.get("outcome", "unknown")
        task = e.get("task", "")

        try:
            ts = datetime.fromisoformat(ts_str.replace("Z", "+00:00")).replace(tzinfo=None)
        except (ValueError, AttributeError):
            ts = now

        skills[skill]["total"] += 1
        skills[skill]["outcomes"][outcome] += 1

        if ts > cutoff:
            skills[skill]["recent"] += 1

        if skills[skill]["last_used"] is None or ts > skills[skill]["last_used"]:
            skills[skill]["last_used"] = ts

        if task:
            skills[skill]["tasks"].append(task)

    return skills


def categorize(skills, now=None):
    if now is None:
        now = datetime.utcnow()

    categories = {"core": [], "active": [], "zombie": [], "ghost": [], "unused": []}

    for name, data in sorted(skills.items()):
        last = data["last_used"]
        days_since = (now - last).days if last else 999

        if data["recent"] >= 10:
            categories["core"].append((name, data))
        elif data["recent"] >= 3:
            categories["active"].append((name, data))
        elif data["recent"] >= 1:
            categories["zombie"].append((name, data))
        elif days_since > 60:
            categories["ghost"].append((name, data))
        else:
            categories["unused"].append((name, data))

    return categories


def print_report(categories):
    print("SKILL AUDIT REPORT")
    print("=" * 60)

    total = sum(len(v) for v in categories.values())
    ghost_count = len(categories["ghost"])
    zombie_count = len(categories["zombie"])

    for cat_name, label, emoji in [
        ("core", "CORE (5+ uses/period)", "🟢"),
        ("active", "ACTIVE (1-4/period)", "🔵"),
        ("zombie", "ZOMBIE (occasional, edge cases)", "🟡"),
        ("ghost", "GHOST (60+ days unused)", "🔴"),
        ("unused", "OTHER", "⚪"),
    ]:
        items = categories[cat_name]
        if items:
            print(f"\n{emoji} {label} — {len(items)} skills")
            for name, data in items:
                last_str = data["last_used"].strftime("%Y-%m-%d") if data["last_used"] else "never"
                tasks = ", ".join(set(data["tasks"][-3:])) if data["tasks"] else "no tasks logged"
                print(f"  • {name} — {data['total']} uses, last: {last_str}")
                print(f"    recent tasks: {tasks}")

    print(f"\n{'=' * 60}")
    print(f"Total skills: {total}")
    print(f"Core/Active: {len(categories['core']) + len(categories['active'])} (keep these)")
    print(f"Zombie: {zombie_count} (evaluate)")
    print(f"Ghost: {ghost_count} (archive these)")

    if ghost_count > 0:
        estimated_tokens = ghost_count * 800
        print(f"\n🔴 Removing {ghost_count} ghost skills saves ~{estimated_tokens:,} tokens/session")

    if zombie_count > 0:
        print(f"\n🟡 {zombie_count} zombie skills — can any core skill cover their use cases?")


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 skill_audit.py <path-to-skill-usage.jsonl>")
        sys.exit(1)

    path = Path(sys.argv[1])
    if not path.exists():
        print(f"File not found: {path}")
        print("Start logging with: echo '{\"ts\":\"...\",\"skill\":\"name\",\"task\":\"...\",\"outcome\":\"used\"}' >> ~/.openclaw/workspace/memory/skill-usage.jsonl")
        sys.exit(1)

    entries = load_log(path)
    skills = analyze(entries)
    categories = categorize(skills)
    print_report(categories)


if __name__ == "__main__":
    main()
