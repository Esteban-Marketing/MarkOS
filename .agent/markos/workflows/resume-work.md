---
description: Resume marketing work from previous session with full context restoration
---

# /markos-resume-work

<purpose>
Restore context from a paused session and continue execution from where it stopped.
</purpose>

## Process

### 1. Find CONTINUE-HERE.md

Search `.planning/phases/` for the most recent `CONTINUE-HERE.md`.

### 2. Display Restored Context

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 MARKOS ► RESUMING WORK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Paused: {timestamp}
Phase: {N} — {Name}
Plan: {plan_id}
Task: {task_number} of {total}

Completed: {completed_count} tasks
Remaining: {remaining_count} tasks
```

### 3. Route to Execution

Read the "Next Action" from CONTINUE-HERE.md and route appropriately:
- If mid-plan → resume execution at the specified task
- If between plans → continue to next plan
- If checkpoint pending → present checkpoint to user

### 4. Cleanup

After successful resumption, delete CONTINUE-HERE.md.
