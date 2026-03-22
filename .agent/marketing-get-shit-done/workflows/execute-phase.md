---
description: Execute all plans in a marketing phase with wave-based parallelization
---

# /mgsd-execute-phase

<purpose>
Execute all plans in a marketing phase. Spawns executor agents per wave, handles creative checkpoints, and produces summaries.
</purpose>

## Arguments

- `{phase}` — Phase number (required)

## Process

### 1. Load Context

```bash
INIT=$(node ".agent/marketing-get-shit-done/bin/mgsd-tools.cjs" init execute-phase {phase} --raw)
PLANS=$(node ".agent/marketing-get-shit-done/bin/mgsd-tools.cjs" phase-plan-index {phase} --raw)
```

Validate:
- Phase directory exists with plans
- MIR gates pass (if enforcement enabled)
- At least 1 incomplete plan

### 2. Display Execution Header

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 MGSD ► EXECUTING — Phase {N}: {Name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Plans: {incomplete}/{total}
Waves: {wave_count}
Checkpoints: {has_checkpoints}
```

### 3. Update State

```bash
node ".agent/marketing-get-shit-done/bin/mgsd-tools.cjs" state begin-phase --phase {N} --name "{name}" --plans {plan_count}
```

### 4. Execute Wave by Wave

For each wave (1, 2, 3...):

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 MGSD ► EXECUTING WAVE {W}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**If parallelization enabled and wave has multiple plans:**
Spawn one executor subagent per plan in the wave.

**If parallelization disabled or wave has single plan:**
Execute sequentially.

Each executor receives:
- The PLAN.md file content
- CONTEXT.md
- Current MIR gate status
- Previous wave summaries

#### Checkpoint Handling

@-reference `.agent/marketing-get-shit-done/references/checkpoints.md`

When a plan contains a non-autonomous task (checkpoint):
1. Execute all tasks up to checkpoint
2. Present checkpoint box to user
3. Wait for user response
4. Resume execution with user input

### 5. Post-Plan Summary

After each plan completes, write SUMMARY.md using `templates/summary.md`:
- One-liner
- Key files modified/created
- Key decisions
- Campaign impact

```bash
node ".agent/marketing-get-shit-done/bin/mgsd-tools.cjs" commit "mktg(phase-{N}): complete {plan_id}" --no-verify
```

### 6. Phase Completion

After all waves complete:

```bash
node ".agent/marketing-get-shit-done/bin/mgsd-tools.cjs" phase complete {N}
```

Display:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 MGSD ► PHASE {N} COMPLETE ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Plans: {total}/{total} ✓
```

### 7. Next Up

```
▶ Next Up

**Verify Phase {N}** — Validate deliverables

`/mgsd-verify-work {N}`
```

<success_criteria>
- All plans in the phase have corresponding SUMMARY.md files
- All checkpoint interactions completed with user input
- Phase marked complete in ROADMAP.md
- STATE.md updated
</success_criteria>
