---
name: skill-pruner
description: Audit and prune unused skills from your agent setup. Tracks skill invocations, identifies ghost skills consuming context window tokens, and helps you retire dead weight. Use when context feels bloated, when you have many installed skills, when you want to optimize token usage, or when doing periodic cleanup. Triggers on "skill audit", "prune skills", "unused skills", "context bloat", "skill cleanup", "too many skills", "token optimization".
---

# Skill Pruner

Stop hoarding skills. 73% of installed tools are never used again.

## The Problem

Every skill loaded in context costs tokens — on every operation. 47 skills where 3 are useful means a 23% tax on every interaction. This skill helps you measure, audit, and cut.

## Quick Start

### 1. Track invocations

Log every skill activation to `~/.openclaw/workspace/memory/skill-usage.jsonl`:

```jsonl
{"ts":"2026-03-29T10:00:00Z","skill":"weather","task":"get forecast","outcome":"used"}
{"ts":"2026-03-29T10:15:00Z","skill":"github","task":"check PR","outcome":"used"}
{"ts":"2026-03-29T11:00:00Z","skill":"gifgrep","task":"find gif","outcome":"never_loaded"}
```

**Fields:**
- `ts` — ISO timestamp
- `skill` — skill name (from SKILL.md frontmatter)
- `task` — what you used it for
- `outcome` — `used`, `loaded_not_used`, `failed`, `never_loaded`

### 2. Run the audit

```bash
python3 scripts/skill_audit.py ~/.openclaw/workspace/memory/skill-usage.jsonl
```

### 3. Categorize and act

The audit produces categories:

| Category | Meaning | Action |
|----------|---------|--------|
| **Core** (used 5+/week) | Your workhorses | Keep |
| **Active** (used 1-4/week) | Regular use | Keep |
| **Zombie** (used 1-3/month) | Bending it for edge cases | Evaluate — can core skill cover this? |
| **Ghost** (0 uses in 60+ days) | Dead weight | Remove from context |
| **Superseded** | Replaced by better option | Remove the old one |

## Manual Audit Process

If you don't have usage data yet:

1. **List all installed skills** — `ls ~/.openclaw/workspace/skills/`
2. **Check last file modification** — `find skills/ -name "SKILL.md" -mtime +60` shows untouched skills
3. **For each skill, ask:**
   - Have I used this in the last 30 days?
   - Does another skill cover the same ground?
   - Would I install it again today?
4. **If no to all three → remove it**

## Token Budget Estimation

Rough formula for context cost:
- Each SKILL.md frontmatter (name + description): ~100 tokens
- Each loaded SKILL.md body: ~500–2000 tokens
- Skill metadata in system prompt: ~50 tokens each

**Example:** 47 skills × ~800 tokens avg = ~37,600 tokens of overhead per session.
With 3 core skills: ~2,400 tokens. Savings: ~35,000 tokens per session.

## Quarterly Pruning Ritual

Every 90 days:
1. Run the audit
2. Archive ghost skills to `~/.openclaw/workspace/skills/.archive/`
3. Document what was removed and why in memory
4. If you need a pruned skill later, reinstall it — that's the test of whether it was actually needed

## Archive, Don't Delete

```bash
mkdir -p ~/.openclaw/workspace/skills/.archive
mv ~/.openclaw/workspace/skills/unused-skill ~/.openclaw/workspace/skills/.archive/
```

Archived skills are out of context but recoverable. If you reinstall within 30 days, it was a real need. If not, it was hoarding.
