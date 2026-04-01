---
token_id: MARKOS-ITM-OPS-03
document_class: ITM
domain: OPS
version: 1.0.0
status: active
created: 2026-03-31
---

# MARKOS-ITM-OPS-03 — Client Intake Received

**Linear Title format:** `[MARKOS] Intake: {client_name} — {company_stage}`

**Description:**
Client intake received and validated. Project `{client_name}` ready for onboarding.

---

## Intake Checklist

- [ ] Seed JSON validated (R001–R008 checks passed)
- [ ] Project slug: {project_slug}
- [ ] MIR seed populated in vector store
- [ ] MIR drafts generated:
  - [ ] Company Profile
  - [ ] Mission & Values
  - [ ] Audience Profile
  - [ ] Competitive Landscape
  - [ ] Brand Voice
  - [ ] Channel Strategy
- [ ] Client onboarding session ready
- [ ] Next phase ticket created: MARKOS-ITM-INT-01

---

## Related Artifacts

| Type | Resource | Owner |
|------|----------|-------|
| Seed | `onboarding-seed.json` (namespace: {project_slug}) | Client submitted |
| Drafts | Vector memory: {project_slug}/drafts | Orchestrator |
| Runbook | `.planning/phases/34-client-intake-sop-automation/34-RUNBOOK.md` | Team Lead |
| Next Step | MARKOS-ITM-INT-01 (Data Quality Check) | Intake Team |

---

## Handoff to Next Phase

If checklist complete: Assign to Audience Research lead for MARKOS-ITM-STR-01 (Audience Intent Mapping).

If errors: See troubleshooting section in 34-RUNBOOK.md.
