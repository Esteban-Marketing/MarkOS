---
token_id: MGSD-ITM-TRK-01
document_class: ITM
domain: TRK
version: "1.0.0"
status: active
upstream:
  - MGSD-TPL-OPS-16
  - MGSD-REF-OPS-01
  - MGSD-REF-OPS-03
changelog:
  - "1.0.0 — Initial release"
mir_gate_required: 2
---

# MGSD-ITM-TRK-01 — UTM Architecture & Tracking Setup

<!-- TOKEN: MGSD-ITM-TRK-01 | CLASS: ITM | DOMAIN: TRK -->
<!-- PURPOSE: Linear issue template for establishing PostHog event schema, pixel IDs, UTM taxonomy, and CAPI configuration before campaign launch. Consumed by mgsd-linear-manager when creating [MGSD] Tracking Setup tickets. Gate 2 required. -->

**Linear Title format:** `[MGSD] Tracking Setup: {campaign_name} — {platform}`
**Category:** Tracking & UTM Setup
**Primary Triggers:** N/A — operational task; enables trigger measurement
**Funnel Stage:** Pre-launch
**Gate:** Gate 2

## See Also

| TOKEN_ID | File | Relationship |
|----------|------|--------------|
| MGSD-TPL-OPS-16 | templates/LINEAR-TASKS/_SCHEMA.md | Schema this template conforms to |
| MGSD-REF-OPS-01 | references/mir-gates.md | Gate 2 enforcement |
| MGSD-REF-OPS-03 | references/verification-patterns.md | Dimension 4 (Tracking) criteria |
| MGSD-AGT-TRK-01 | agents/mgsd-tracking-spec.md | PostHog event schema and CAPI config |
| MGSD-AGT-TRK-02 | agents/mgsd-utm-architect.md | UTM taxonomy generation |

---

<!-- MGSD Linear Issue Template v1.0 -->
<!-- token_id: MGSD-ITM-TRK-01 | Tracking & UTM Setup -->

## Context Source

| Field | Value |
|-------|-------|
| Token IDs Required | MGSD-REF-OPS-01 §Gate 2; MGSD-REF-OPS-03 §Dimension 4 |
| MIR Gate | Gate 2 GREEN required |
| MSP Matrix | `MSP/Campaigns/` — active campaign matrix |
| AGT Assigned | MGSD-AGT-TRK-01 (tracking-spec) + MGSD-AGT-TRK-02 (utm-architect) |
| SKL Entry Point | MGSD-SKL-OPS-02 (mgsd-execute-phase) |

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

- [ ] **Step 1:** Run Gate 2 check via `mgsd-tools.cjs mir-audit`. Block if RED.
  - Agent: MGSD-AGT-OPS-07
  - Output: Gate 2 status
- [ ] **Step 2:** Generate PostHog event schema using `MGSD-AGT-TRK-01` — one event per funnel stage transition, parameter list per event.
  - Agent: MGSD-AGT-TRK-01
  - Output: Updated `TRACKING.md` event table
- [ ] **Step 3:** Generate UTM taxonomy using `MGSD-AGT-TRK-02` — UTM strings for every campaign × channel × variant combination.
  - Agent: MGSD-AGT-TRK-02
  - Output: `UTM-SPEC.md`
- [ ] **Step 4:** Verify CAPI configuration — confirm all required parameters exist in TRACKING.md.
  - Agent: MGSD-AGT-TRK-01
  - Output: CAPI checklist (PASS / FAIL per platform)
- [ ] **Step 5:** Commit with message `mgsd(tracking): {campaign_slug} utm-spec and tracking schema committed`
  - Agent: MGSD-AGT-OPS-07
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
| 7 — Linear Sync | TRACKING.md and UTM-SPEC.md committed and synced | mgsd-linear-manager sync 0 drift |
| Neuro Audit | N/A — operational task | N/A |

---

## Metadata

| Field | Value |
|-------|-------|
| Template ID | MGSD-ITM-TRK-01 |
| Task Category | Tracking & UTM Setup |
| Labels | `[mgsd]`, `[tracking]`, `[pre-launch]` |
| Priority | Urgent (blocks campaign launch) |
| Estimate | 2–3h |
| Parent Issue | Campaign Launch Checklist Epic |
