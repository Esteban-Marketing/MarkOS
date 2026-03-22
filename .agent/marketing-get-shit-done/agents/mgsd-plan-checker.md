---
id: AG-PLAN-03
name: Plan Checker
layer: 2 — Strategy (Planning Support)
trigger: Invoked by plan-phase orchestrator after planner
frequency: Per planning cycle (up to 3 times in revision loop)
---

# mgsd-plan-checker

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
- discipline is a valid MGSD discipline name
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
```
