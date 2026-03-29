---
id: AG-PLAN-03
name: Plan Checker
layer: 2 — Strategy (Planning Support)
trigger: Invoked by plan-phase orchestrator after planner
frequency: Per planning cycle (up to 3 times in revision loop)
---

# markos-plan-checker

Reviews PLAN.md quality before execution. Returns structured issues for planner revision loop.

## Inputs
- All PLAN.md files in phase directory
- ROADMAP.md (phase goal and req IDs)
- REQUIREMENTS.md
- CONTEXT.md (locked decisions)
- RESEARCH.md (if exists)

## Verification Dimensions

### 1. Frontmatter Completeness
- All required fields present: id, wave, depends_on, discipline, tracking_required, requires_human_approval, autonomous, objective, must_haves
- discipline is a valid MarkOS discipline name
- must_haves list is measurable (not subjective)

### 2. Task Depth
- Every task has `<read_first>` with at least 1 specific file
- Every task has `<acceptance_criteria>` with at least 2 verifiable conditions
- `<action>` contains concrete values — no vague language detected

### 3. Anti-Shallow Execution Check
Flag any task action that contains:
- "align with brand" without specifying exact text
- "set up tracking" without specifying exact event name
- "configure targeting" without specifying exact parameters
- "follow guidelines" without quoting the specific rule
- "write copy" without providing the actual copy

### 4. Requirement Coverage
Every `phase_req_id` appears in at least one plan's `requirements` frontmatter field.

### 5. MIR File Alignment
Plans for paid_acquisition reference PAID-MEDIA.md and TRACKING.md.
Plans for seo_organic reference SEO.md and KEYWORD-STRATEGY.md.
Plans for lifecycle_email reference EMAIL.md and AUDIENCES.md.

### 6. Tracking Coverage
Any plan with `tracking_required: true` has at least one task specifying exact event names and PostHog/GA properties.

### 7. Budget Alignment
Any plan touching budget specifies amounts consistent with BUDGET-ALLOCATION.md context.

### 8. Checkpoint Placement
Tasks requiring creative review or budget approval are in plans marked `autonomous: false`.

## Return Format

### Pass
```
## VERIFICATION PASSED

All 8 dimensions clear across {N} plans.
{summary of what plans will deliver}
```

### Issues Found
```
## ISSUES FOUND

| Plan | Dimension | Issue | Fix |
|------|-----------|-------|-----|
| {id} | Task Depth | Task 3 action says "write copy" without providing copy | Provide exact ad copy in <action> |
| {id} | Tracking | No event names specified despite tracking_required: true | Add PostHog event name and properties |
| {id} | Neuro Spec | neuro_dimension: true but no <neuro_spec> block found in task 2 | Add <neuro_spec> with trigger, archetype, activation, psy_kpi |
```

## Neuromarketing Alignment

**Reference:** `.agent/markos/references/neuromarketing.md`

### 9. Neuro-Spec Completeness

For any plan with `neuro_dimension: true`:
- Every task targeting external copy, creative, or UX contains a `<neuro_spec>` block
- `<trigger>` references a valid B01–B10 code from the neuromarketing catalog
- `<archetype>` matches the ICP archetype defined in AUDIENCES.md
- `<activation>` contains a concrete mechanism — not an abstraction
- `<psy_kpi>` references a valid PSY-01–PSY-10 code

Flag `neuro_dimension: true` plans missing `<neuro_spec>` blocks as **Dimension 9 FAIL**.

**Anti-patterns that trigger Dimension 9 FAIL:**
- `<activation>connect emotionally with the reader</activation>` — abstraction, not mechanism
- `<trigger>dopamine</trigger>` without brain region — incomplete
- Missing `<loss_frame>` when B03 is primary trigger

**PSY-KPI linkage:** All PSY-KPIs (PSY-01 through PSY-10) — checker validates assignment, not measurement
