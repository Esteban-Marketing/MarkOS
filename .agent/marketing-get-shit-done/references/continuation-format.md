---
token_id: MGSD-REF-OPS-06
document_class: REF
domain: OPS
version: "1.0.0"
status: active
upstream:
  - MGSD-IDX-000    # MGSD-INDEX.md — master registry
  - MGSD-REF-OPS-07 # checkpoints.md — checkpoint type definitions
downstream:
  - MGSD-AGT-EXE-01  # mgsd-executor.md — spawns continuation agents
  - MGSD-SKL-RES-01  # mgsd-resume-work/SKILL.md — uses format to restore state
mir_gate_required: false
---

# Continuation Format — MGSD Checkpoint Resume Protocol

<!-- TOKEN: MGSD-REF-OPS-06 | CLASS: REF | DOMAIN: OPS -->
<!-- PURPOSE: Defines the structured context block passed to continuation agents when resuming after a checkpoint. All executor agents that emit checkpoints must produce output matching this format. -->

When a checkpoint pauses execution (creative-approval, budget-decision, platform-setup), the continuation agent receives this structured context to resume.

## See Also

| TOKEN_ID | File | Relationship |
|----------|------|--------------|
| MGSD-IDX-000 | MGSD-INDEX.md | Entry point — indexes this document |
| MGSD-REF-OPS-07 | checkpoints.md | Checkpoint type definitions used in this format |
| MGSD-AGT-EXE-01 | agents/mgsd-executor.md | Agent that emits continuation blocks |
| MGSD-REF-CNT-01 | ui-brand.md | Checkpoint box visual format referenced here |

## Format

```markdown
<continuation>
## Context
- **Phase:** {phase_number} — {phase_name}
- **Plan:** {plan_id} ({plan_file})
- **Started:** {start_timestamp}
- **Checkpoint type:** {creative-approval | budget-decision | platform-setup | mir-gate | campaign-launch}

## Completed Work
| # | Task | Status |
|---|------|--------|
{completed_tasks_table}

## Resume Point
**Task {N}:** {task_name}
**Blocked by:** {checkpoint_type}

## User Response
"{user_response_text}"

## Files Modified
{list of files this plan has touched so far}

## Instructions
{checkpoint-type-specific instructions}
</continuation>
```

## Checkpoint-Specific Instructions

### creative-approval
```
Review the user's creative feedback.
If "approved": proceed with current creative.
If feedback: revise the creative based on specific feedback before continuing.
Verify revised creative still matches VOICE-TONE.md.
```

### budget-decision
```
Apply the selected budget allocation.
Update BUDGET-ALLOCATION.md with new figures.
Recalculate pacing for affected campaigns.
If custom allocation provided, validate it fits within total budget.
```

### platform-setup
```
User confirmed platform is configured.
Run verification checks:
- Pixel/event firing validation
- UTM parameter test
- Automation workflow test
If any check fails, surface specific failure before continuing.
```

### mir-gate
```
Re-run mir-audit to check gate status.
If gates now GREEN: proceed with execution.
If still RED: list remaining gaps and re-prompt user.
```

### campaign-launch
```
User confirmed launch.
Execute launch sequence:
1. Verify tracking one final time
2. Update campaign status to ACTIVE
3. Sync to Linear with launch date
4. Create optimization log entry
5. Set 48-hour first review reminder
```
