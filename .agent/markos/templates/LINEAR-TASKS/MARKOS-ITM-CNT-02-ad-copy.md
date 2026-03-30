---
token_id: MARKOS-ITM-CNT-02
document_class: ITM
domain: CNT
version: "1.0.0"
status: active
upstream:
  - MARKOS-TPL-OPS-16
  - MARKOS-REF-NEU-01
  - MARKOS-REF-OPS-01
changelog:
  - "1.0.0 — Initial release"
mir_gate_required: 2
---

# MARKOS-ITM-CNT-02 — Ad Copywriting (Paid Media)

<!-- TOKEN: MARKOS-ITM-CNT-02 | CLASS: ITM | DOMAIN: CNT -->
<!-- PURPOSE: Linear issue template for producing paid media ad copy variants. Consumed by markos-linear-manager when creating [MARKOS] Ad Copy tickets. Gate 1 + Gate 2 required. -->

**Linear Title format:** `[MARKOS] Ad Copy: {platform} — {campaign_name} — {variant_id}`
**Category:** Ad Copywriting
**Primary Triggers:** B02 (Loss Aversion), B05 (Pain Relief), B06 (Scarcity/Urgency)
**Secondary:** B09 (Anchoring)
**Funnel Stage:** Awareness (cold) / Decision (retargeting)
**Gate:** Gate 1 + Gate 2

## See Also

| TOKEN_ID | File | Relationship |
|----------|------|--------------|
| MARKOS-TPL-OPS-16 | templates/LINEAR-TASKS/_SCHEMA.md | Schema this template conforms to |
| MARKOS-REF-NEU-01 | references/neuromarketing.md | §B02, §B05, §B06, §B09 trigger definitions |
| MARKOS-REF-OPS-01 | references/mir-gates.md | Gate 1 + Gate 2 enforcement |
| MARKOS-AGT-CNT-02 | agents/markos-copy-drafter.md | Generates copy variants |
| MARKOS-AGT-TRK-02 | agents/markos-utm-architect.md | Generates UTM-SPEC.md |
| MARKOS-AGT-NEU-01 | agents/markos-neuro-auditor.md | Variant audit gate |

---

<!-- MARKOS Linear Issue Template v1.0 -->
<!-- token_id: MARKOS-ITM-CNT-02 | Ad Copywriting -->

## Context Source

| Field | Value |
|-------|-------|
| Token IDs Required | MARKOS-REF-NEU-01 §B02, §B05, §B06, §B09; MARKOS-REF-OPS-01 |
| MIR Gate | Gate 1 AND Gate 2 GREEN |
| MSP Matrix | `MSP/Campaigns/01_PAID_ACQUISITION.md` — relevant ad set section |
| AGT Assigned | MARKOS-AGT-CNT-02 (copy-drafter) + MARKOS-AGT-TRK-02 (UTM architect) |
| SKL Entry Point | MARKOS-SKL-OPS-02 (markos-execute-phase) |

---

## Neuromarketing Trigger

```xml
<neuro_spec>
  <trigger>B02 — Loss Aversion (primary); B05 — Pain Relief (hook); B06 — Scarcity (CTA); B09 — Anchoring (pricing)</trigger>
  <brain_region>Amygdala→orbitofrontal (B02); Amygdala→dorsal raphe (B05); Amygdala→hypothalamus (B06); Prefrontal heuristic (B09)</brain_region>
  <activation_method>
    Hook: Pain-first sentence names what the ICP is currently losing (not gaining).
    Body: Establish phantom ownership of the outcome before deadline pressure arrives.
    CTA: Loss-frame language ("Keep your [X]" not "Get started").
    Pricing block: highest-value tier shown first; per-unit framing before monthly total.
    Scarcity: cohort size or external date trigger only — never "Limited time!".
  </activation_method>
  <archetype>[Resolve from AUDIENCES.md — typically Hero or Ruler for paid acquisition]</archetype>
  <funnel_stage>awareness (cold) or decision (retargeting)</funnel_stage>
  <psy_kpi>CTR ≥ {{AD_CTR_TARGET}} | Loss-frame CTA lift vs. gain-frame CTA ≥ 15%</psy_kpi>
  <failure_mode>CTR below target — hook is gain-framed; phantom ownership not established before urgency fires</failure_mode>
</neuro_spec>
```

---

## Input Requirements

| # | Required Input | Source Document | Status |
|---|---------------|-----------------|--------|
| 1 | ICP primary pain, core fear sentence | `MIR/Market_Audiences/03_MARKET/AUDIENCES.md` | [ ] |
| 2 | Platform character limits and creative specs | `MIR/Campaigns_Assets/05_CHANNELS/PAID-MEDIA.md` | [ ] |
| 3 | Prohibited words, loss-frame approved phrasing | `MIR/Core_Strategy/02_BRAND/VOICE-TONE.md` | [ ] |
| 4 | Scarcity element: cohort cap, date, or price-increase trigger | Human-provided (must be verifiable) | [ ] |
| 5 | Tracking events and UTM taxonomy | `MIR/Core_Strategy/06_TECH-STACK/TRACKING.md` | [ ] |
| 6 | Anchor price and per-unit value framing | `MIR/Products/04_PRODUCTS/PRICING.md` | [ ] |

---

## Task Steps

- [ ] **Step 1:** Run `markos-tools.cjs mir-audit` — confirm Gate 1 AND Gate 2 GREEN. Block if either RED.
  - Agent: MARKOS-AGT-OPS-07
  - Output: Gate status signal
- [ ] **Step 2:** Generate copy variants using `MARKOS-AGT-CNT-02` — produce 3 variants: [pain-hook + loss CTA], [curiosity-gap headline + anchor pricing], [social proof hook + scarcity CTA]. Each variant sized to platform spec.
  - Agent: MARKOS-AGT-CNT-02
  - Output: `AD-COPY-VARIANTS.md` (3 variants × N platforms)
- [ ] **Step 3:** Generate UTM parameters for each variant using `MARKOS-AGT-TRK-02`.
  - Agent: MARKOS-AGT-TRK-02
  - Output: `UTM-SPEC.md`
- [ ] **Step 4:** Run `MARKOS-AGT-NEU-01` on all variants — must return `PASSED`. Rewrite any variant returning `REWRITE REQUIRED`.
  - Agent: MARKOS-AGT-NEU-01
  - Output: Audit report per variant
- [ ] **Step 5:** Commit artifacts with message `markos(paid-media): ad-copy {campaign_slug} {platform} variants committed`
  - Agent: MARKOS-AGT-OPS-07
  - Output: Git commit

---

## Definition of Done / Validation

| Dimension | Criterion | Pass Condition |
|-----------|-----------|----------------|
| 1 — MIR Completeness | Gate 1 + Gate 2 both GREEN | `mir-audit` both ready: true |
| 2 — Variable Resolution | No unresolved tokens in any variant | `grep -r '{{[A-Z_]*}}'` returns empty |
| 3 — KPI Baseline | CTR target logged in KPI-FRAMEWORK.md | KPI row filled |
| 4 — Tracking | UTM spec committed; pixel events defined | TRACKING.md non-empty; UTM-SPEC.md committed |
| 5 — Creative Compliance | No prohibited words; all CTAs loss-framed | VOICE-TONE diff clean |
| 6 — Budget Alignment | Ad spend within BUDGET-ALLOCATION.md discipline cap | Stated budget ≤ discipline cap |
| 7 — Linear Sync | Issue status updated to reflect execution state | markos-linear-manager sync 0 drift |
| Neuro Audit | All variants PASSED — no REWRITE REQUIRED | `MARKOS-AGT-NEU-01` returns `PASSED` for all variants |

---

## Metadata

| Field | Value |
|-------|-------|
| Template ID | MARKOS-ITM-CNT-02 |
| Task Category | Ad Copywriting |
| Labels | `[markos]`, `[paid-media]`, `[awareness]` or `[decision]` |
| Priority | High |
| Estimate | 3–4h |
| Parent Issue | Paid Acquisition Epic |
