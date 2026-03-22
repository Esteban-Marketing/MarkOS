# Checkpoints — Marketing Workflow Checkpoints

Checkpoint types for MGSD workflows. Orchestrator presents these when human input is required.

## Checkpoint Types

### creative-approval
**When:** Creative brief, ad copy, or content draft is ready for review.
**Presenter:** Campaign Architect (AG-S01), Copy Drafter (AG-C02), Content Brief (AG-C03)
**User action:** "approved" | describe issues for revision
**Auto-mode behavior:** Auto-approve with `⚡ Auto-approved creative`

### budget-decision
**When:** Budget allocation, reallocation, or overpacing response needed.
**Presenter:** Budget Pacing Monitor (AG-S03), Campaign Architect (AG-S01)
**User action:** Select option | provide custom allocation
**Auto-mode behavior:** Select first (recommended) option

### platform-setup
**When:** External platform action required (Meta Business Manager, Google Ads, PostHog).
**Presenter:** Tracking Specifier (AG-T01), Automation Architect (AG-T02)
**User action:** "done" when platform is configured
**Auto-mode behavior:** Cannot auto-approve — always stops for human action

### mir-gate
**When:** MIR gate check fails and enforcement is enabled.
**Presenter:** Any agent that checks gates before execution
**User action:** Fill required MIR files, then "done"
**Auto-mode behavior:** Cannot auto-approve — gates require real data

### campaign-launch
**When:** Campaign is ready for platform activation.
**Presenter:** Execute phase orchestrator
**User action:** "launch" to confirm | "hold" to delay
**Auto-mode behavior:** Auto-approve with `⚡ Auto-launched`

## Checkpoint Flow

```
1. Agent reaches checkpoint task → returns structured state
2. Orchestrator displays checkpoint box (see ui-brand.md)
3. User responds
4. Orchestrator spawns continuation agent with user response
5. Continuation agent verifies previous commits, continues from checkpoint
```

## Continuation Prompt Template

```markdown
<continuation>
**Phase:** {phase_number}
**Plan:** {plan_id}
**Completed Tasks:** {completed_tasks_table}
**Resume from:** Task {resume_task_number}: {resume_task_name}
**User response:** {user_response}

<instructions>
{Based on checkpoint type:}
- creative-approval: Apply feedback or proceed with approved creative
- budget-decision: Apply selected budget allocation
- platform-setup: Verify platform configuration, continue execution
- mir-gate: Re-check gate status, proceed if GREEN
- campaign-launch: Activate campaign tracking, update LINEAR
</instructions>
</continuation>
```
