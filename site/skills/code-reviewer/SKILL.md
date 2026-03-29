---
name: code-reviewer
description: Perform thorough code reviews with security, performance, and best practice analysis. Triggers on "review code", "code review", "check this code", "audit code", "security review", "pr review".
---

# Code Review Agent

Expert-level code review covering security, performance, correctness, and style.

## Review Categories

### 1. 🔒 Security (Critical)
- SQL injection risks
- XSS vulnerabilities
- Hardcoded secrets/keys
- Missing input validation
- Authentication/authorization gaps
- CORS misconfiguration
- Insecure dependencies

### 2. ⚡ Performance (Important)
- N+1 queries
- Unnecessary re-renders
- Memory leaks
- Missing indexes
- Blocking operations
- Unoptimized loops/algorithms
- Large bundle sizes

### 3. 🐛 Correctness (Critical)
- Logic errors
- Edge cases not handled
- Race conditions
- Off-by-one errors
- Null/undefined handling
- Error handling gaps
- Type mismatches

### 4. 📐 Code Quality (Important)
- DRY violations
- Single responsibility
- Naming conventions
- Function length (>30 lines = warning)
- File length (>300 lines = warning)
- Comment quality
- Test coverage gaps

### 5. 🏗️ Architecture (Suggestion)
- Separation of concerns
- Dependency direction
- Module boundaries
- API design consistency
- Error propagation patterns

## Output Format
For each issue found:
```
[SEVERITY] Category: Title
File: path/to/file.ts:42
Issue: Description of the problem
Fix: Suggested solution with code example
```

Severity levels:
- 🔴 CRITICAL: Must fix before merge
- 🟡 WARNING: Should fix soon
- 🔵 SUGGESTION: Nice to improve
- ✅ GOOD: Notable positive pattern

## Summary
- Total issues by severity
- Top 3 priorities to fix first
- Overall code health score (A-F)
- Positive patterns observed
