---
token_id: MGSD-ITM-STR-02
document_class: ITM
domain: STR
version: "1.0.0"
status: active
upstream:
  - MGSD-TPL-OPS-16
  - MGSD-REF-NEU-01
  - MGSD-REF-OPS-01
changelog:
  - "1.0.0 — Initial release"
mir_gate_required: 2
---

# MGSD-ITM-STR-02 — Funnel Architecture & Channel Plan

<!-- TOKEN: MGSD-ITM-STR-02 | CLASS: ITM | DOMAIN: STR -->
<!-- PURPOSE: Linear issue template for designing the full-funnel campaign architecture and channel selection. Consumed by mgsd-linear-manager when creating [MGSD] Funnel Build tickets. Gate 1 + Gate 2 required. -->

**Linear Title format:** `[MGSD] Funnel Build: {campaign_name} — {funnel_type}`
**Category:** Funnel Build
**Primary Triggers:** B02 (Loss Aversion), B05 (Pain Relief), B06 (Scarcity), B09 (Anchoring)
**Funnel Stage:** All stages (architecture spans full funnel)
**Gate:** Gate 1 + Gate 2

## See Also

| TOKEN_ID | File | Relationship |
|----------|------|--------------|
| MGSD-TPL-OPS-16 | templates/LINEAR-TASKS/_SCHEMA.md | Schema this template conforms to |
| MGSD-REF-NEU-01 | references/neuromarketing.md | §B02, §B05, §B06, §B09; Funnel Stage table |
| MGSD-REF-OPS-01 | references/mir-gates.md | Gate 1 + Gate 2 enforcement |
| MGSD-AGT-STR-01 | agents/mgsd-strategist.md | Validates MIR → MSP dependencies |
| MGSD-AGT-STR-03 | agents/mgsd-campaign-architect.md | Generates FUNNEL-ARCHITECTURE.md |
| MGSD-AGT-NEU-01 | agents/mgsd-neuro-auditor.md | Architecture trigger audit |

---

<!-- MGSD Linear Issue Template v1.0 -->
<!-- token_id: MGSD-ITM-STR-02 | Funnel Build -->

## Context Source

| Field | Value |
|-------|-------|
| Token IDs Required | MGSD-REF-NEU-01 §B02, §B05, §B06, §B09; MGSD-REF-OPS-01 |
| MIR Gate | Gate 1 AND Gate 2 GREEN |
| MSP Matrix | `MSP/Campaigns/01_PAID_ACQUISITION.md` + `MSP/Inbound/` — depends on funnel type |
| AGT Assigned | MGSD-AGT-STR-01 (strategist) + MGSD-AGT-STR-03 (campaign-architect) |
| SKL Entry Point | MGSD-SKL-OPS-01 (mgsd-plan-phase) |

---

## Neuromarketing Trigger

```xml
<neuro_spec>
  <trigger>B05 — Pain Relief (ToF hook); B09 — Anchoring (MoF value framing); B02 — Loss Aversion (BoF CTA); B06 — Scarcity (conversion gate)</trigger>
  <brain_region>Amygdala→dorsal raphe (B05); Prefrontal heuristic (B09); Amygdala→orbitofrontal (B02); Amygdala→hypothalamus (B06)</brain_region>
  <activation_method>
    Funnel map assigns one primary trigger per stage (per neuromarketing.md Funnel Stage table).
    B05 at awareness: pain named before product introduced.
    B09 at mid-funnel: pricing page shows highest tier left; per-unit value stated before monthly price.
    B02 at retargeting: copy escalates cost-of-inaction by day (Day 1 → Day 3 → Day 7 cadence).
    B06 at conversion gate: scarcity tied to real constraint (cohort cap, funding round, seasonal input cost).
  </activation_method>
  <archetype>[Resolve from AUDIENCES.md — Ruler/Hero typical for acquisition funnels]</archetype>
  <funnel_stage>all</funnel_stage>
  <psy_kpi>Funnel CVR ≥ {{FUNNEL_CVR_TARGET}} | Stage drop-off identified and trigger-assigned</psy_kpi>
  <failure_mode>ICP enters decision stage without phantom ownership established — B02 fires with nothing to lose</failure_mode>
</neuro_spec>
```

---

## Input Requirements

| # | Required Input | Source Document | Status |
|---|---------------|-----------------|--------|
| 1 | All Gate 1 files at status: complete or verified | `MIR/Core_Strategy/` | [ ] |
| 2 | Channel selection and budget allocation | `MIR/Campaigns_Assets/05_CHANNELS/` + `MIR/Operations/BUDGET-ALLOCATION.md` | [ ] |
| 3 | Tracking infrastructure and conversion events | `MIR/Core_Strategy/06_TECH-STACK/TRACKING.md` | [ ] |
| 4 | KPI baselines (CAC, CPL, ROAS targets) | `MIR/Core_Strategy/09_ANALYTICS/KPI-FRAMEWORK.md` | [ ] |
| 5 | Scarcity element (human-verified, real constraint) | Human-provided | [ ] |

---

## Task Steps

- [ ] **Step 1:** Run `mgsd-tools.cjs mir-audit` — confirm Gate 1 AND Gate 2 GREEN. Block if either RED.
  - Agent: MGSD-AGT-OPS-07
  - Output: Gate status
- [ ] **Step 2:** Generate funnel architecture using `MGSD-AGT-STR-03` — map: channels per stage, asset types per stage, primary trigger per stage, handoff event between stages.
  - Agent: MGSD-AGT-STR-03
  - Output: `FUNNEL-ARCHITECTURE.md`
- [ ] **Step 3:** Populate MSP campaign matrix checkboxes from funnel architecture — one checkbox per asset type per channel.
  - Agent: MGSD-AGT-STR-01
  - Output: Updated MSP matrix section
- [ ] **Step 4:** Run `MGSD-AGT-NEU-01` on architecture — verify trigger-per-stage assignments match neuromarketing.md funnel table.
  - Agent: MGSD-AGT-NEU-01
  - Output: Architecture audit report
- [ ] **Step 5:** Commit with message `mgsd(strategy): funnel {campaign_slug} architecture committed`
  - Agent: MGSD-AGT-OPS-07
  - Output: Git commit

---

## Definition of Done / Validation

| Dimension | Criterion | Pass Condition |
|-----------|-----------|----------------|
| 1 — MIR Completeness | Gate 1 + Gate 2 GREEN | `mir-audit` both ready: true |
| 2 — Variable Resolution | No unresolved tokens in architecture doc | `grep -r '{{[A-Z_]*}}'` returns empty |
| 3 — KPI Baseline | CAC, CPL, ROAS targets logged | KPI-FRAMEWORK.md rows present and populated |
| 4 — Tracking | Conversion events mapped to funnel stages | TRACKING.md non-empty |
| 5 — Creative Compliance | N/A — architecture doc, no copy | N/A |
| 6 — Budget Alignment | Channel budget within discipline cap | Stated budget ≤ BUDGET-ALLOCATION.md cap |
| 7 — Linear Sync | Issue status updated; MSP matrix committed | mgsd-linear-manager sync 0 drift |
| Neuro Audit | Each funnel stage trigger matches neuromarketing.md table | `MGSD-AGT-NEU-01` returns `PASSED` |

---

## Metadata

| Field | Value |
|-------|-------|
| Template ID | MGSD-ITM-STR-02 |
| Task Category | Funnel Build |
| Labels | `[mgsd]`, `[strategy]`, `[funnel]` |
| Priority | Urgent (blocks all campaign execution) |
| Estimate | 3–5h |
| Parent Issue | Campaign Strategy Epic |
