---
name: memory-nightly
description: Automated nightly maintenance for agent memory files. Cleans up stale beliefs, consolidates daily logs, detects contradictions, and maintains memory hygiene without human input. Use when memory files grow large, when doing periodic memory cleanup, when beliefs need verification, or when setting up automated maintenance. Triggers on "memory maintenance", "nightly build", "memory cleanup", "stale beliefs", "memory hygiene", "belief audit", "consolidate memory".
---

# Memory Nightly Build

Your memory has no maintenance window. Beliefs accumulate. Nobody goes back to clean house.

## The Problem

Agent memory is write-only. Files grow forever. Stale beliefs persist. Contradictions go undetected. Without a maintenance cycle, your memory becomes an expensive write-only log.

## What It Does

### 1. Belief Aging

Flags beliefs that haven't been referenced or verified recently:

```bash
python3 scripts/nightly.py ~/.openclaw/workspace/memory/
```

Finds:
- Beliefs older than 30 days with no verification
- Beliefs contradicted by newer entries
- Duplicate beliefs across files

### 2. Daily Log Consolidation

Moves old daily logs to a condensed format:

```bash
memory/
├── 2026-03-29.md          # Active (last 7 days — stays as-is)
├── 2026-03-22.md          # Consolidated → summary only
├── 2026-03-21.md          # Consolidated → summary only
└── consolidated/
    └── 2026-03.md          # Monthly rollup
```

### 3. Contradiction Detection

Scans memory files for conflicting statements:
- "X is true" vs "X is not true" across different files
- Beliefs that conflict with recent observations
- Outdated recommendations superseded by newer ones

## Setup

### Option A: Manual (run during heartbeat)

Add to HEARTBEAT.md:

```markdown
## Memory Nightly (weekly)
- Run: python3 skills/memory-nightly/scripts/nightly.py memory/
- Review flagged items in memory/nightly-report.md
- Archive or update stale beliefs
```

### Option B: Cron job

Schedule an isolated agentTurn that runs the nightly build:

```
Schedule: cron "0 3 * * 0" (Sunday 3 AM)
Task: "Run memory nightly build. Execute python3 skills/memory-nightly/scripts/nightly.py memory/. Review the report. Consolidate stale daily logs, flag contradictions, and update MEMORY.md with any new insights."
```

## Nightly Report

The script generates `memory/nightly-report.md`:

```markdown
# Nightly Report — 2026-03-29

## Stale Beliefs (not verified in 30+ days)
- [2026-02-15] "API endpoint returns 429 after 100 req/min" — unverified
- [2026-02-20] "Cron job timezone fixed" — verified ✅

## Contradictions Found
- memory/2026-03-10.md: "Deploy to production Friday"
- memory/2026-03-15.md: "Deployment delayed to next week"
  → Action: resolve or annotate

## Daily Logs Ready for Consolidation
- 2026-03-01.md through 2026-03-22.md (22 files)
  → Suggested: extract key entries, archive originals

## Memory Stats
- Total files: 47
- Total size: 124KB
- Oldest unverified belief: 44 days
- Contradictions: 2
```

## Principles

1. **Don't delete — archive** — move old entries to `memory/archive/`, not to trash
2. **Flag, don't fix** — the nightly identifies issues; a human or agent session resolves them
3. **Preserve provenance** — when consolidating, keep date references so you can trace back
4. **Weekly is enough** — daily maintenance is overkill and burns tokens on housekeeping

## Integration with Rawlog

If using the `rawlog` skill alongside this one:
- Rawlogs are **never** consolidated or edited — they are permanent records
- Nightly can flag rawlogs that contain insights worth promoting to MEMORY.md
- The rawlog is evidence; MEMORY.md is the conclusion
