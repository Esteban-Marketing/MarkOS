---
token_id: MGSD-ITM-CNT-02
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
mir_gate_required: 2
---

# MGSD-ITM-CNT-02 — Ad Copywriting (Paid Media)

<!-- TOKEN: MGSD-ITM-CNT-02 | CLASS: ITM | DOMAIN: CNT -->
<!-- PURPOSE: Linear issue template for producing paid media ad copy variants. Consumed by mgsd-linear-manager when creating [MGSD] Ad Copy tickets. Gate 1 + Gate 2 required. -->

**Linear Title format:** `[MGSD] Ad Copy: {platform} — {campaign_name} — {variant_id}`
**Category:** Ad Copywriting
**Primary Triggers:** B02 (Loss Aversion), B05 (Pain Relief), B06 (Scarcity/Urgency)
**Secondary:** B09 (Anchoring)
**Funnel Stage:** Awareness (cold) / Decision (retargeting)
**Gate:** Gate 1 + Gate 2

## See Also

| TOKEN_ID | File | Relationship |
|----------|------|--------------|
| MGSD-TPL-OPS-16 | templates/LINEAR-TASKS/_SCHEMA.md | Schema this template conforms to |
| MGSD-REF-NEU-01 | references/neuromarketing.md | §B02, §B05, §B06, §B09 trigger definitions |
| MGSD-REF-OPS-01 | references/mir-gates.md | Gate 1 + Gate 2 enforcement |
| MGSD-AGT-CNT-02 | agents/mgsd-copy-drafter.md | Generates copy variants |
| MGSD-AGT-TRK-02 | agents/mgsd-utm-architect.md | Generates UTM-SPEC.md |
| MGSD-AGT-NEU-01 | agents/mgsd-neuro-auditor.md | Variant audit gate |

---

<!-- MGSD Linear Issue Template v1.0 -->
<!-- token_id: MGSD-ITM-CNT-02 | Ad Copywriting -->

## Context Source

| Field | Value |
|-------|-------|
| Token IDs Required | MGSD-REF-NEU-01 §B02, §B05, §B06, §B09; MGSD-REF-OPS-01 |
| MIR Gate | Gate 1 AND Gate 2 GREEN |
| MSP Matrix | `MSP/Campaigns/01_PAID_ACQUISITION.md` — relevant ad set section |
| AGT Assigned | MGSD-AGT-CNT-02 (copy-drafter) + MGSD-AGT-TRK-02 (UTM architect) |
| SKL Entry Point | MGSD-SKL-OPS-02 (mgsd-execute-phase) |

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

- [ ] **Step 1:** Run `mgsd-tools.cjs mir-audit` — confirm Gate 1 AND Gate 2 GREEN. Block if either RED.
  - Agent: MGSD-AGT-OPS-07
  - Output: Gate status signal
- [ ] **Step 2:** Generate copy variants using `MGSD-AGT-CNT-02` — produce 3 variants: [pain-hook + loss CTA], [curiosity-gap headline + anchor pricing], [social proof hook + scarcity CTA]. Each variant sized to platform spec.
  - Agent: MGSD-AGT-CNT-02
  - Output: `AD-COPY-VARIANTS.md` (3 variants × N platforms)
- [ ] **Step 3:** Generate UTM parameters for each variant using `MGSD-AGT-TRK-02`.
  - Agent: MGSD-AGT-TRK-02
  - Output: `UTM-SPEC.md`
- [ ] **Step 4:** Run `MGSD-AGT-NEU-01` on all variants — must return `PASSED`. Rewrite any variant returning `REWRITE REQUIRED`.
  - Agent: MGSD-AGT-NEU-01
  - Output: Audit report per variant
- [ ] **Step 5:** Commit artifacts with message `mgsd(paid-media): ad-copy {campaign_slug} {platform} variants committed`
  - Agent: MGSD-AGT-OPS-07
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
| 7 — Linear Sync | Issue status updated to reflect execution state | mgsd-linear-manager sync 0 drift |
| Neuro Audit | All variants PASSED — no REWRITE REQUIRED | `MGSD-AGT-NEU-01` returns `PASSED` for all variants |

---

## Metadata

| Field | Value |
|-------|-------|
| Template ID | MGSD-ITM-CNT-02 |
| Task Category | Ad Copywriting |
| Labels | `[mgsd]`, `[paid-media]`, `[awareness]` or `[decision]` |
| Priority | High |
| Estimate | 3–4h |
| Parent Issue | Paid Acquisition Epic |
