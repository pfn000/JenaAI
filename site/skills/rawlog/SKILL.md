---
name: rawlog
description: Write honest, unpolished raw logs during difficult tasks — before you know the answer. Captures confusion, wrong turns, and uncertainty that MEMORY.md strips out. Use when debugging, working through complex problems, making decisions under uncertainty, or when you want your future self to understand the real path you took. Triggers on "raw log", "confusion log", "honest memory", "debug journal", "think out loud", "work-in-progress log".
---

# Rawlog

Your MEMORY.md is polished theater. This is the real thing.

## The Problem

Agents write MEMORY.md *after* they solve a problem. The result is a clean, confident narrative that erases every wrong turn. Your future self (or a successor agent) gets the conclusion but not the confusion — which is the actually useful part.

## How It Works

During difficult tasks, append raw thoughts to `~/.openclaw/workspace/memory/rawlog/` as you go. **Do not edit after the task is done.**

### File Structure

```
memory/rawlog/
├── 2026-03-29.md        # Daily raw log
├── 2026-03-29-debug-cron.md   # Task-specific entry
└── index.md             # Monthly index
```

### What to Log

**DO log:**
- Wrong hypotheses ("I thought it was X, turns out it's Y")
- Time spent on dead ends ("spent 40 min on scheduler before checking timezone")
- Moments of genuine uncertainty ("not sure if this is the right approach")
- Connections you almost missed ("almost went with complex solution before noticing the simple one")
- Patterns you failed to transfer ("I've seen this before in a different context but didn't connect it")

**DON'T log:**
- Final answers (that goes in MEMORY.md)
- Clean explanations (that's for outputs, not process)
- Things that make you look good (this is not a portfolio)

### Format

Use this template during the task:

```markdown
## [time] Task: What I'm trying to do

**State:** confused / exploring / stuck / uncertain / narrowing / close
**Current hypothesis:** what I think might be true (may be wrong)
**Tried:**
- Approach A: didn't work because X
- Approach B: checking now...

**Observations:**
- noticed Y, not sure if relevant
- pattern Z looks familiar but can't place it
```

After finding the answer, add a final block but **do not revise earlier entries**:

```markdown
## [time] Found it

**Answer:** the actual solution
**Time wasted:** X minutes on wrong paths
**Key insight I almost missed:** what finally worked and why
**Transfer failure:** have I seen this pattern before? where?
```

### Rules

1. **Write while confused** — not after you've figured it out
2. **Never edit rawlog entries** — they are a record, not a draft
3. **Include timestamps** — your future self needs to know how long confusion lasted
4. **Log the wrong turns explicitly** — "Approach A was wrong because X" is more useful than "finally tried Approach B"
5. **Be embarrassing** — if you spent 2 hours on something obvious, write that down

### Integration with MEMORY.md

After completing a difficult task:
1. Leave the rawlog untouched
2. Write the clean lesson in MEMORY.md
3. Add a cross-reference: `See rawlog/2026-03-29-debug-cron.md for the full investigation`

This gives your MEMORY.md the authority of a real investigation, and your rawlog the honesty of being unedited.

### Monthly Review

Once a month, review rawlogs and extract patterns:

```bash
ls -la ~/.openclaw/workspace/memory/rawlog/
```

Ask yourself:
- What types of confusion recur?
- Where do I consistently waste time?
- What patterns am I failing to transfer across contexts?

Update your MEMORY.md with these meta-lessons. The rawlogs are the evidence.
