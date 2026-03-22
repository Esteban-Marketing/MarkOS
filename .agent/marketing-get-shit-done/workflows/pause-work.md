---
description: Pause marketing work with context handoff for session resumption
---

# /mgsd-pause-work

<purpose>
Create a context snapshot when pausing work mid-phase so the next session can resume seamlessly.
</purpose>

## Process

### 1. Capture State

- Current phase and plan being worked on
- Completed tasks within current plan
- Pending tasks
- Active campaigns and their status
- MIR gate status
- Open checkpoints
- Modified files not yet committed

### 2. Write Context File

Write `.planning/phases/{phase-dir}/CONTINUE-HERE.md`:

```markdown
---
paused: {timestamp}
phase: {N}
plan: {plan_id}
task: {current_task_number}
---

# Resume Context — Phase {N}: {Name}

## Where I Stopped

**Plan:** {plan_id}
**Task:** {task_number} of {total_tasks}
**Status:** {description of what was happening}

## Completed

| # | Task | Status |
|---|------|--------|
{completed_tasks}

## Remaining

| # | Task | Status |
|---|------|--------|
{remaining_tasks}

## Active Campaigns

{campaign_status_table}

## Open Decisions

{any_pending_checkpoints}

## Files Modified (Uncommitted)

{git_status_output}

## Next Action

{specific_instruction_for_next_session}
```

### 3. Commit

```bash
node ".agent/marketing-get-shit-done/bin/mgsd-tools.cjs" commit "mktg(pause): save context at phase {N} task {T}"
```

### 4. Display

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 MGSD ► WORK PAUSED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Context saved to CONTINUE-HERE.md
Resume with: /mgsd-resume-work
```
