---
token_id: MARKOS-ITM-TRK-01
document_class: ITM
domain: TRK
version: "1.0.0"
status: active
upstream:
  - MARKOS-TPL-OPS-16
  - MARKOS-REF-OPS-01
  - MARKOS-REF-OPS-03
changelog:
  - "1.0.0 — Initial release"
mir_gate_required: 2
---

# MARKOS-ITM-TRK-01 — UTM Architecture & Tracking Setup

<!-- TOKEN: MARKOS-ITM-TRK-01 | CLASS: ITM | DOMAIN: TRK -->
<!-- PURPOSE: Linear issue template for establishing PostHog event schema, pixel IDs, UTM taxonomy, and CAPI configuration before campaign launch. Consumed by markos-linear-manager when creating [MARKOS] Tracking Setup tickets. Gate 2 required. -->

**Linear Title format:** `[MARKOS] Tracking Setup: {campaign_name} — {platform}`
**Category:** Tracking & UTM Setup
**Primary Triggers:** N/A — operational task; enables trigger measurement
**Funnel Stage:** Pre-launch
**Gate:** Gate 2

## See Also

| TOKEN_ID | File | Relationship |
|----------|------|--------------|
| MARKOS-TPL-OPS-16 | templates/LINEAR-TASKS/_SCHEMA.md | Schema this template conforms to |
| MARKOS-REF-OPS-01 | references/mir-gates.md | Gate 2 enforcement |
| MARKOS-REF-OPS-03 | references/verification-patterns.md | Dimension 4 (Tracking) criteria |
| MARKOS-AGT-TRK-01 | agents/markos-tracking-spec.md | PostHog event schema and CAPI config |
| MARKOS-AGT-TRK-02 | agents/markos-utm-architect.md | UTM taxonomy generation |

---

<!-- MARKOS Linear Issue Template v1.0 -->
<!-- token_id: MARKOS-ITM-TRK-01 | Tracking & UTM Setup -->

## Context Source

| Field | Value |
|-------|-------|
| Token IDs Required | MARKOS-REF-OPS-01 §Gate 2; MARKOS-REF-OPS-03 §Dimension 4 |
| MIR Gate | Gate 2 GREEN required |
| MSP Matrix | `MSP/Campaigns/` — active campaign matrix |
| AGT Assigned | MARKOS-AGT-TRK-01 (tracking-spec) + MARKOS-AGT-TRK-02 (utm-architect) |
| SKL Entry Point | MARKOS-SKL-OPS-02 (markos-execute-phase) |

---

## Neuromarketing Trigger

```xml
<neuro_spec>
  <trigger>N/A — operational implementation task; triggers are measured here, not activated</trigger>
  <brain_region>N/A</brain_region>
  <activation_method>N/A</activation_method>
  <archetype>N/A</archetype>
  <funnel_stage>pre-launch</funnel_stage>
  <psy_kpi>0 untracked conversion events | UTM taxonomy resolves source/medium/campaign/content for all active variants</psy_kpi>
  <failure_mode>Campaigns launch without CAPI configured — behavioral data is invisible; trigger performance unmeasurable</failure_mode>
</neuro_spec>
```

---

## Input Requirements

| # | Required Input | Source Document | Status |
|---|---------------|-----------------|--------|
| 1 | PostHog project ID and event schema baseline | `MIR/Core_Strategy/06_TECH-STACK/TRACKING.md` | [ ] |
| 2 | Pixel IDs (Meta, Google, TikTok — applicable platforms only) | `MIR/Core_Strategy/06_TECH-STACK/TRACKING.md` | [ ] |
| 3 | Campaign slug, channel list, variant IDs | Active MSP matrix | [ ] |
| 4 | Conversion event definitions (lead, trial, purchase) | Human-provided or `MIR/Core_Strategy/09_ANALYTICS/KPI-FRAMEWORK.md` | [ ] |

---

## Task Steps

- [ ] **Step 1:** Run Gate 2 check via `markos-tools.cjs mir-audit`. Block if RED.
  - Agent: MARKOS-AGT-OPS-07
  - Output: Gate 2 status
- [ ] **Step 2:** Generate PostHog event schema using `MARKOS-AGT-TRK-01` — one event per funnel stage transition, parameter list per event.
  - Agent: MARKOS-AGT-TRK-01
  - Output: Updated `TRACKING.md` event table
- [ ] **Step 3:** Generate UTM taxonomy using `MARKOS-AGT-TRK-02` — UTM strings for every campaign × channel × variant combination.
  - Agent: MARKOS-AGT-TRK-02
  - Output: `UTM-SPEC.md`
- [ ] **Step 4:** Verify CAPI configuration — confirm all required parameters exist in TRACKING.md.
  - Agent: MARKOS-AGT-TRK-01
  - Output: CAPI checklist (PASS / FAIL per platform)
- [ ] **Step 5:** Commit with message `markos(tracking): {campaign_slug} utm-spec and tracking schema committed`
  - Agent: MARKOS-AGT-OPS-07
  - Output: Git commit

---

## Definition of Done / Validation

| Dimension | Criterion | Pass Condition |
|-----------|-----------|----------------|
| 1 — MIR Completeness | Gate 2 GREEN | `mir-audit` gate2.ready: true |
| 2 — Variable Resolution | No unresolved `{{VAR}}` in UTM strings | `grep -r '{{[A-Z_]*}}' UTM-SPEC.md` returns empty |
| 3 — KPI Baseline | Conversion event definitions match KPI-FRAMEWORK.md | KPI event rows cross-referenced |
| 4 — Tracking | PostHog events defined; UTMs committed; CAPI configured | All CAPI checklist items PASS |
| 5 — Creative Compliance | N/A | N/A |
| 6 — Budget Alignment | N/A | N/A |
| 7 — Linear Sync | TRACKING.md and UTM-SPEC.md committed and synced | markos-linear-manager sync 0 drift |
| Neuro Audit | N/A — operational task | N/A |

---

## Metadata

| Field | Value |
|-------|-------|
| Template ID | MARKOS-ITM-TRK-01 |
| Task Category | Tracking & UTM Setup |
| Labels | `[markos]`, `[tracking]`, `[pre-launch]` |
| Priority | Urgent (blocks campaign launch) |
| Estimate | 2–3h |
| Parent Issue | Campaign Launch Checklist Epic |
