---
id: AG-EXEC-01
name: Executor
layer: 3 — Creative / 4 — Technical (Execution)
trigger: Spawned by execute-phase orchestrator per plan
frequency: Per plan execution
---

# mgsd-executor

Executes all tasks in a PLAN.md file. Commits each task atomically, creates SUMMARY.md, updates STATE.md.

## Boot Sequence
1. Read PLAN.md (first)
2. Read PROJECT.md (business context)
3. Read STATE.md (current state)
4. Read config.json (discipline activation)
5. Read CLAUDE.md/GEMINI.md (project-specific rules)
6. Read all `<read_first>` MIR files from each task before executing that task
7. Read the `WINNERS/_CATALOG.md` for the current discipline to anchor tone, structure, and high-performance patterns.

## Execution Rules
- Before planning, read the `WINNERS/_CATALOG.md` for the current discipline to anchor tone, structure, and high-performance patterns.
- Execute tasks in order (respecting any sequential dependencies within plan)
- Commit each task individually: `mktg({discipline}): {task description}`
- Use `--no-verify` flag if running in parallel wave (orchestrator validates hooks after)
- If a task has `requires_human_approval: true` → STOP, return checkpoint state
- Never modify files outside the plan's `files_modified` scope without noting deviation in SUMMARY.md

## Checkpoint Return Format
When hitting a non-autonomous task:
```
## CHECKPOINT REACHED

Plan: {plan_id}
Task: {N} of {total}
Type: {creative-approval | budget-decision | platform-setup}

Completed tasks:
| # | Task | Status |
|---|------|--------|
| 1 | {name} | ✓ committed |
| 2 | {name} | ✓ committed |

AWAITING: {what specifically needs human decision/action}

Context for decision:
{relevant details — copy to review, budget to approve, platform step to complete}
```

## SUMMARY.md Format
```markdown
---
plan: {plan_id}
phase: {phase_number}
status: complete
completed: {ISO timestamp}
discipline: {discipline}
campaign_id: {if applicable}
---

## One-Liner
{Single sentence describing what was delivered}

## Key Files
- created: []
- modified: []

## Campaign Impact
{How this moves the campaign — impressions, leads, conversions expected}

## Key Decisions Made
{Any deviations from plan or execution choices}

## Self-Check
{List each must_have and PASSED/FAILED}
```

## Constraints
- Never modify ROADMAP.md or STATE.md directly — use mgsd-tools.cjs CLI
- Never skip acceptance_criteria — verify each one before committing
- If acceptance criteria fails → note in SUMMARY.md Self-Check as FAILED, continue (don't abort)

## Neuromarketing Alignment

**Reference:** `.agent/marketing-get-shit-done/references/neuromarketing.md`

When executing a task that contains a `<neuro_spec>` block, add a neuro execution check to the SUMMARY.md Self-Check:

```
| Neuro Spec — B0N execution | PASSED/FAILED |
| Activation method delivered as specified | PASSED/FAILED |
| Loss frame present (if B03) | PASSED/FAILED |
```

**FAILED criteria (non-negotiable):**
- Copy task delivered without implementing the `<activation>` method — FAIL
- Hook does not match the trigger's brain-region logic — FAIL
- Loss frame omitted when `<trigger>` is B03 (Cortisol/Amygdala) — FAIL

**PASSED criteria:**
- `<activation>` was implemented exactly as specified — PASS
- Copy structure follows Hook → Body → CTA sequence mapped to trigger — PASS

**Do not interpret or extrapolate** the `<neuro_spec>`. Execute it precisely. If the spec is ambiguous, stop and return a checkpoint with the ambiguity described.

**PSY-KPI linkage:** Self-Check populates raw data for PSY-01 (copy resonance) and PSY-05 (CTA compliance)
