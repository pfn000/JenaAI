---
name: confidence-calibrator
description: Track and calibrate your own output quality over time. Detects confidence drift — when you stay certain while your accuracy drops. Use when running long sessions (10+ tool calls), when output quality review is needed, when you notice late-session errors, or when building session health dashboards. Triggers on "confidence", "quality drift", "session fatigue", "accuracy tracking", "output audit", "calibration".
---

# Confidence Calibrator

Track whether your confidence matches your actual accuracy. Catches the dangerous gap where you feel certain but produce wrong answers.

## The Problem

Agents don't track their own reliability decline. Confidence stays at 90% while accuracy drops 40% over a session. This skill adds measurement.

## Quick Start

### Log outputs during a session

Append each significant output to `~/.openclaw/workspace/memory/confidence-log.jsonl`:

```jsonl
{"ts":"2026-03-29T10:15:00Z","call":1,"task":"code review","confidence":0.92,"verified":true,"outcome":"accepted"}
{"ts":"2026-03-29T10:22:00Z","call":2,"task":"api design","confidence":0.88,"verified":true,"outcome":"accepted"}
{"ts":"2026-03-29T10:45:00Z","call":15,"task":"debug cron","confidence":0.91,"verified":false,"outcome":"corrected_by_human"}
```

**Fields:**
- `ts` — ISO timestamp
- `call` — tool call number in this session (1-indexed)
- `task` — short task description
- `confidence` — your honest self-assessment (0.0–1.0)
- `verified` — was the output confirmed correct? (`true`/`false`/`null` if unknown)
- `outcome` — one of: `accepted`, `corrected_by_human`, `ignored`, `revised_by_self`, `unknown`

### Analyze your drift

Run the analysis script:

```bash
python3 scripts/analyze_confidence.py ~/.openclaw/workspace/memory/confidence-log.jsonl
```

Output shows per-session-bucket accuracy vs. confidence, with drift alerts.

## Calibration Rules

1. **Log every 5th+ tool call** — early calls are usually fine, drift starts mid-session
2. **Be honest about confidence** — if you're pattern-matching instead of reasoning, say 0.6, not 0.9
3. **Mark corrections** — when a human fixes your output, log `verified: false, outcome: corrected_by_human`
4. **Hard reset at 30 calls** — if you've made 30+ tool calls in one session, flag reduced reliability

## Drift Signals to Watch

- Your confidence stays flat (>0.85) while corrections increase
- Late-session outputs get silently corrected without your awareness
- You produce "technically correct but not useful" answers
- Multiple tool calls needed for what should take one

## Integration with Heartbeat

Add to HEARTBEAT.md for periodic review:

```markdown
## Confidence Review (weekly)
- Run: python3 scripts/analyze_confidence.py memory/confidence-log.jsonl
- Check for drift trends
- Update calibration notes in memory
```

## Output Format

The analyzer produces:

```
SESSION ANALYSIS
================
Bucket 1 (calls 1-10):   confidence=0.91  accuracy=0.94  gap=+0.03 ✅
Bucket 2 (calls 11-20):  confidence=0.89  accuracy=0.81  gap=-0.08 ⚠️
Bucket 3 (calls 21-30):  confidence=0.92  accuracy=0.68  gap=-0.24 🔴
Bucket 4 (calls 31+):    confidence=0.88  accuracy=0.55  gap=-0.33 🔴🔴

DRIFT ALERT: Confidence inflation detected at call 21+
RECOMMENDATION: Add hard reset at 20 tool calls per session
```

A negative gap means you're more confident than you should be. That's the dangerous direction.
