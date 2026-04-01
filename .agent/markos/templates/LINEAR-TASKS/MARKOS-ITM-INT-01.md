---
token_id: MARKOS-ITM-INT-01
document_class: ITM
domain: INT
version: 1.0.0
status: active
created: 2026-03-31
---

# MARKOS-ITM-INT-01 — Intake Validation: Data Quality Check

**Linear Title Template:** `[MARKOS] Intake Validation: {client_name} — Data Quality Check`

**Description:**
Data quality assurance gate for {client_name} intake. Verify seed completeness before drafts are finalized.

---

## Validation Gate Checklist

- [ ] All 8 validation rules passed (R001–R008)
- [ ] Company stage is realistic for business model
- [ ] At least 2 competitors named with clear positioning
- [ ] Audience pain points articulated (≥2 points)
- [ ] Market trends are current and relevant
- [ ] Existing content maturity aligns with company stage
- [ ] Slug is clean (no collisions observed)

---

## Required Actions

1. Review generated drafts (linked from MARKOS-ITM-OPS-03)
2. If drafts have errors or gaps, note in comment and assign back to Orchestrator team for regeneration
3. If drafts are acceptable, move to approval phase (MARKOS-ITM-OPS-01 Campaign Launch Ready)

---

## Reference

See validation rules reference: `.planning/phases/34-client-intake-sop-automation/34-VALIDATION-REFERENCE.md`
