---
token_id: MGSD-ITM-CNT-01
document_class: ITM
domain: CNT
version: "1.0.0"
status: active
upstream:
  - MGSD-TPL-OPS-16
  - MGSD-REF-NEU-01
  - MGSD-REF-OPS-01
changelog:
  - "1.0.0 — Initial release"
mir_gate_required: 1
---

# MGSD-ITM-CNT-01 — Lead Magnet Design

<!-- TOKEN: MGSD-ITM-CNT-01 | CLASS: ITM | DOMAIN: CNT -->
<!-- PURPOSE: Linear issue template for producing a branded lead magnet asset. Consumed by mgsd-linear-manager when creating [MGSD] Lead Magnet tickets. Gate 1 required before execution. -->

**Linear Title format:** `[MGSD] Lead Magnet: {magnet_title} — {audience_segment}`
**Category:** Content Creation
**Primary Triggers:** B04 (Authority Signal), B05 (Pain Relief), B07 (Curiosity Gap)
**Funnel Stage:** Awareness → Consideration
**Gate:** Gate 1

## See Also

| TOKEN_ID | File | Relationship |
|----------|------|--------------|
| MGSD-TPL-OPS-16 | templates/LINEAR-TASKS/_SCHEMA.md | Schema this template conforms to |
| MGSD-REF-NEU-01 | references/neuromarketing.md | §B04, §B05, §B07 trigger definitions |
| MGSD-REF-OPS-01 | references/mir-gates.md | Gate 1 enforcement |
| MGSD-AGT-STR-04 | agents/mgsd-creative-brief.md | Generates NEURO-BRIEF.md |
| MGSD-AGT-CNT-05 | agents/mgsd-content-brief.md | Generates CONTENT-BRIEF.md |
| MGSD-AGT-CNT-01 | agents/mgsd-content-creator.md | Executes asset copy |
| MGSD-AGT-NEU-01 | agents/mgsd-neuro-auditor.md | Neuro audit gate |

---

<!-- MGSD Linear Issue Template v1.0 -->
<!-- token_id: MGSD-ITM-CNT-01 | Content Creation -->

## Context Source

| Field | Value |
|-------|-------|
| Token IDs Required | MGSD-REF-NEU-01 §B04, §B05, §B07; MGSD-REF-OPS-01 |
| MIR Gate | Gate 1 GREEN |
| MSP Matrix | `MSP/Inbound/` — relevant discipline section |
| AGT Assigned | MGSD-AGT-STR-04 → MGSD-AGT-CNT-05 → MGSD-AGT-CNT-01 |
| SKL Entry Point | MGSD-SKL-OPS-01 (mgsd-plan-phase) |

---

## Neuromarketing Trigger

```xml
<neuro_spec>
  <trigger>B07 — Curiosity Gap (primary); B05 — Pain Relief (structure); B04 — Authority Signal (credibility gate)</trigger>
  <brain_region>Prefrontal cortex anterior (B07); Amygdala→dorsal raphe (B05); Prefrontal uncertainty processing (B04)</brain_region>
  <activation_method>
    Headline opens an information gap the ICP cannot resolve without the asset
    ("The 3-step sequence [ICP role] uses to [desired outcome] — without [common painful method]").
    First section names the pain with visceral specificity before any data or framework is presented.
    Data citations use specific source + year + sample size — no "industry experts" phrasing.
  </activation_method>
  <archetype>[Resolve from ICP in AUDIENCES.md — Hero/Creator/Sage by audience segment]</archetype>
  <funnel_stage>awareness</funnel_stage>
  <psy_kpi>Asset download CVR ≥ {{LEAD_MAGNET_CVR_TARGET}} | Time-on-page ≥ 3 min</psy_kpi>
  <failure_mode>ICP abandons after title page — solution revealed before pain was felt</failure_mode>
</neuro_spec>
```

---

## Input Requirements

| # | Required Input | Source Document | Status |
|---|---------------|-----------------|--------|
| 1 | ICP role, company size, primary pain | `MIR/Market_Audiences/03_MARKET/AUDIENCES.md` | [ ] |
| 2 | Product mechanism (mechanism, not features) | `MIR/Products/04_PRODUCTS/CATALOG.md` | [ ] |
| 3 | Prohibited words and tone rules | `MIR/Core_Strategy/02_BRAND/VOICE-TONE.md` | [ ] |
| 4 | 3 approved headline frameworks from asset bank | `MIR/Core_Strategy/02_BRAND/MESSAGING-FRAMEWORK.md` | [ ] |
| 5 | 1 verifiable data point or citation for B04 activation | Human-provided or research agent output | [ ] |

---

## Task Steps

- [ ] **Step 1:** Run `mgsd-tools.cjs mir-audit` — confirm Gate 1 GREEN. Block if RED.
  - Agent: MGSD-AGT-OPS-07
  - Output: Gate status signal
- [ ] **Step 2:** Generate creative brief using `MGSD-AGT-STR-04` — populate `NEURO-BRIEF.md` with B07 headline options (min 3), B05 pain statement, B04 authority element.
  - Agent: MGSD-AGT-STR-04
  - Output: `NEURO-BRIEF.md` committed to `.planning/phases/[N]/`
- [ ] **Step 3:** Generate content brief using `MGSD-AGT-CNT-05` — define asset format (PDF, interactive, video), section outline, word count range, CTA placement.
  - Agent: MGSD-AGT-CNT-05
  - Output: `CONTENT-BRIEF.md`
- [ ] **Step 4:** Draft asset copy using `MGSD-AGT-CNT-01` — apply VOICE-TONE constraints; structure: Pain (B05) → Amplify → Mechanism → Solution.
  - Agent: MGSD-AGT-CNT-01
  - Output: `LEAD-MAGNET-DRAFT.md`
- [ ] **Step 5:** Run `MGSD-AGT-NEU-01` audit on draft — must return `PASSED` before proceeding.
  - Agent: MGSD-AGT-NEU-01
  - Output: Neuro audit report
- [ ] **Step 6:** Commit artifact to `.planning/phases/[N]/` with message `mgsd(content): lead-magnet {magnet_slug} draft complete`
  - Agent: MGSD-AGT-OPS-07
  - Output: Git commit

---

## Definition of Done / Validation

| Dimension | Criterion | Pass Condition |
|-----------|-----------|----------------|
| 1 — MIR Completeness | All 5 input items present and non-empty | `mir-audit` gate1.ready: true |
| 2 — Variable Resolution | No `[FILL]` or `{{VAR}}` tokens in output | `grep -r '\[FILL\]\|{{[A-Z_]*}}'` returns empty |
| 3 — KPI Baseline | N/A — awareness stage, no conversion KPI yet | N/A |
| 4 — Tracking | N/A — no ad spend on this asset | N/A |
| 5 — Creative Compliance | No prohibited words; pain-first structure confirmed | VOICE-TONE diff clean |
| 6 — Budget Alignment | N/A — content production only | N/A |
| 7 — Linear Sync | Issue status updated to `In Progress` then `Done` | mgsd-linear-manager sync 0 drift |
| Neuro Audit | B07 headline gap unresolvable from headline alone | `MGSD-AGT-NEU-01` returns `PASSED` |

---

## Metadata

| Field | Value |
|-------|-------|
| Template ID | MGSD-ITM-CNT-01 |
| Task Category | Content Creation |
| Labels | `[mgsd]`, `[content]`, `[awareness]` |
| Priority | High |
| Estimate | 4–6h |
| Parent Issue | Lead generation Epic |
