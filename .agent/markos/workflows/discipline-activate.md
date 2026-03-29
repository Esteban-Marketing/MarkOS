---
description: Activate or deactivate an MSP discipline with documented rationale
---

# /markos-discipline-activate

<purpose>
Change a discipline's activation status (ACTIVE / INACTIVE / FUTURE) in the MSP and config.json with documented rationale.
</purpose>

## Arguments

- `{discipline}` — Discipline number or name (required)
- `{status}` — ACTIVE, INACTIVE, or FUTURE (required)

## Process

1. Validate discipline exists (01-13)
2. Prompt for rationale
3. Update `.planning/config.json` → `discipline_activation`
4. Update MSP `README.md` discipline table
5. If ACTIVE: create discipline plan from `_DISCIPLINE-PLAN-TEMPLATE.md`
6. Commit

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 MARKOS ► DISCIPLINE ACTIVATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SEO (06): INACTIVE → ACTIVE
Rationale: "Organic traffic potential identified in market research"

✓ Config updated
✓ MSP discipline table updated
✓ PLAN.md created at Inbound/06_SEO/PLAN.md
```
