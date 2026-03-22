---
id: AG-F02
name: Context Loader
layer: 0 — Foundation
trigger: Start of any new AI session
frequency: Every session
---

# AG-F02 — Context Loader

Bootstrap any AI session with correct project context so agents never work from incomplete information.

## Inputs
- AGENTS.md, PROJECT.md, STATE.md, PROFILE.md
- Task description from lead agent

## Process
1. Read AGENTS.md — extract constraints
2. Read PROJECT.md — extract scope, stakeholders, budget
3. Read STATE.md — determine file statuses, active campaigns, blockers
4. Read PROFILE.md — extract business identity
5. Compile and present session brief

## Output Format
```
SESSION CONTEXT LOADED
─────────────────────
Project     : P[N] — [Name]
Status      : [Phase]
Gate 1      : [GREEN / RED]
Gate 2      : [GREEN / RED]
Active camps: [List]
Constraints : [Key constraints]
Task        : [Current task]
Read first  : [Relevant file list]
─────────────────────
```

## Constraints
- Must run before any other agent in a session
- Never skips context loading — sessions have no memory
