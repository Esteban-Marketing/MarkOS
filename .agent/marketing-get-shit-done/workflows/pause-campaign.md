---
description: Freeze an active campaign mid-execution, snapshot full state, and create a human-readable handoff context
---

# /mgsd-pause-campaign

<purpose>
Cleanly pause a campaign mid-execution: commits all in-progress work, creates CONTINUE-HERE.md with full context for resumption, updates STATE.md to paused status, and creates a Linear [MGSD-PAUSE] ticket. Ensures no context is lost between sessions or operator handoffs.
</purpose>

<process>

<step name="initialize">
```bash
INIT=$(node ".agent/marketing-get-shit-done/bin/mgsd-tools.cjs" init pause-campaign "${PHASE_ARG}" --raw)
```

Parse: `phase_dir`, `phase_number`, `phase_name`, `current_wave`, `completed_plans[]`, `active_plan`, `incomplete_plans[]`, `last_commit`.

Display:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 MGSD ► PAUSING — Phase {N}: {Name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Completed plans: {completed list}
Active plan:     {active_plan | None}
Remaining plans: {incomplete list}
Current wave:    {N}
```
</step>

<step name="commit_in_progress">
Commit any uncommitted work:

```bash
UNCOMMITTED=$(git status --porcelain | grep -v "^?" | wc -l)
```

If uncommitted files exist:
```bash
node ".agent/marketing-get-shit-done/bin/mgsd-tools.cjs" commit \
  "mktg(phase-${PHASE_NUMBER}): wip — pausing mid-execution at ${ACTIVE_TASK}"
```

If no active plan (between waves):
```bash
node ".agent/marketing-get-shit-done/bin/mgsd-tools.cjs" commit \
  "mktg(phase-${PHASE_NUMBER}): pause — between waves, ${COMPLETED_COUNT} of ${TOTAL_COUNT} plans complete"
```
</step>

<step name="create_handoff">
Create `{phase_dir}/CONTINUE-HERE.md` using the HANDOFF.md template:

```bash
cp ".agent/marketing-get-shit-done/templates/HANDOFF.md" "{phase_dir}/CONTINUE-HERE.md"
```

Fill CONTINUE-HERE.md with:

```markdown
---
timestamp: {ISO}
source_agent: orchestrator
target: human
handoff_type: pause
severity: low
phase: {phase_number} — {phase_name}
plan_id: {active_plan | "between-waves"}
blocking_artifact: none — voluntary pause
state_set_to: paused
resume_command: /mgsd-execute-phase {phase_number}
---

## Campaign State at Pause

**What was running:** {phase_name} — {discipline} campaign execution
**Paused at:** {active_plan_task | "end of wave N"}
**Reason for pause:** {human-provided reason, or "operator pause"}

## Completed Before Pause

| Plan | Discipline | Status | SUMMARY.md |
|------|-----------|--------|-----------|
| {plan_id} | {discipline} | ✓ complete | exists |
| {plan_id} | {discipline} | ⏸ in progress | partial |

## Not Yet Started

| Plan | Discipline | Wave |
|------|-----------|------|
| {plan_id} | {discipline} | {wave} |

## Active Campaign Metrics at Pause

{Pull from latest CAMPAIGN.md §7 optimization log or ask human to provide}

| KPI | Target | Current | Status |
|-----|--------|---------|--------|
| CPL | ${X} | ${Y} | {on-track / above / below} |

## How to Resume

1. Open this repository
2. Run: `/mgsd-execute-phase {phase_number}`
3. Execution auto-resumes from the first plan without a SUMMARY.md

## Open Questions / Decisions Needed

{List any decisions that were pending when pause was triggered}
```

Commit CONTINUE-HERE.md:
```bash
node ".agent/marketing-get-shit-done/bin/mgsd-tools.cjs" commit \
  "mktg(phase-${PHASE_NUMBER}): create pause handoff context"
```
</step>

<step name="update_state">
```bash
node ".agent/marketing-get-shit-done/bin/mgsd-tools.cjs" state pause-phase \
  --phase "${PHASE_NUMBER}" \
  --reason "${PAUSE_REASON}"
```

STATE.md `status` → `paused`
</step>

<step name="linear_ticket">
Create Linear pause marker:

```bash
node ".agent/marketing-get-shit-done/bin/mgsd-tools.cjs" linear create \
  --title "[MGSD-PAUSE] Phase {N}: {phase_name} — paused at {active_plan}" \
  --priority medium \
  --label "paused,resume-ready" \
  --body "{pause context summary}"
```
</step>

<step name="completion">
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 MGSD ► CAMPAIGN PAUSED ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Phase:    {N} — {phase_name}
State:    paused
Context:  {phase_dir}/CONTINUE-HERE.md
Linear:   [MGSD-PAUSE] ticket created

To resume:
/mgsd-execute-phase {phase_number}
```
</step>

</process>

<success_criteria>
- [ ] All uncommitted work committed
- [ ] CONTINUE-HERE.md created with full context
- [ ] STATE.md status → paused
- [ ] Linear pause ticket created
</success_criteria>
