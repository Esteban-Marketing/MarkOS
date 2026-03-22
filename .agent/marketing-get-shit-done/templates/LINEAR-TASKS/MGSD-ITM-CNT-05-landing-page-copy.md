---
token_id: MGSD-ITM-CNT-05
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

# MGSD-ITM-CNT-05 — Landing Page Copy

<!-- TOKEN: MGSD-ITM-CNT-05 | CLASS: ITM | DOMAIN: CNT -->
<!-- PURPOSE: Linear issue template for writing conversion-focused landing page copy. Consumed by mgsd-linear-manager when creating [MGSD] Landing Page Copy tickets. Gate 1 required. -->

**Linear Title format:** `[MGSD] Landing Page Copy: {offer_name} — {funnel_stage}`
**Category:** Content Creation
**Primary Triggers:** B05 (Pain Relief), B02 (Loss Aversion), B09 (Anchoring), B03 (Social Proof)
**Secondary:** B04 (Authority Signal), B06 (Scarcity)
**Funnel Stage:** Consideration → Decision
**Gate:** Gate 1

## See Also

| TOKEN_ID | File | Relationship |
|----------|------|--------------|
| MGSD-TPL-OPS-16 | templates/LINEAR-TASKS/_SCHEMA.md | Schema this template conforms to |
| MGSD-REF-NEU-01 | references/neuromarketing.md | §B02, §B03, §B04, §B05, §B06, §B09 |
| MGSD-REF-OPS-01 | references/mir-gates.md | Gate 1 enforcement |
| MGSD-AGT-CNT-02 | agents/mgsd-copy-drafter.md | Writes full long-form page copy |
| MGSD-AGT-STR-05 | agents/mgsd-cro-hypothesis.md | Generates CRO hypotheses per section |
| MGSD-AGT-NEU-01 | agents/mgsd-neuro-auditor.md | Section-by-section neuro audit |

---

<!-- MGSD Linear Issue Template v1.0 -->
<!-- token_id: MGSD-ITM-CNT-05 | Content Creation — Landing Page -->

## Context Source

| Field | Value |
|-------|-------|
| Token IDs Required | MGSD-REF-NEU-01 §B02, §B03, §B04, §B05, §B06, §B09; MGSD-REF-OPS-01 |
| MIR Gate | Gate 1 GREEN |
| MSP Matrix | `MSP/Campaigns/` or `MSP/Inbound/` — relevant discipline section |
| AGT Assigned | MGSD-AGT-CNT-02 (copy-drafter) + MGSD-AGT-STR-05 (cro-hypothesis) |
| SKL Entry Point | MGSD-SKL-OPS-01 (mgsd-plan-phase) |

---

## Neuromarketing Trigger

```xml
<neuro_spec>
  <trigger>B05 — Pain Relief (hero section); B02 — Loss Aversion (CTA zone); B09 — Anchoring (pricing section); B03 — Social Proof (testimonials); B04 — Authority (trust band); B06 — Scarcity (urgency element)</trigger>
  <brain_region>Amygdala→dorsal raphe (B05); Amygdala→orbitofrontal (B02); Prefrontal heuristic (B09); Mirror neurons (B03); Prefrontal uncertainty (B04); Amygdala→hypothalamus (B06)</brain_region>
  <activation_method>
    Hero section: pain-first headline — ICP reads first 2 sentences and feels the problem before solution is named.
    Features section: each feature presented as outcome of pain relief, not capability description.
    Testimonials: 3 peer-matched proofs with before/after metric and friction sentence (B03).
    Pricing section: highest tier left/top; per-unit value framing before monthly total (B09).
    CTA button copy: loss-frame ("Keep your access" / "Don't lose your spot") not gain-frame ("Sign up").
    Trust band: 3 specific authority signals with source + number (B04) — no generic "trusted by thousands".
    Urgency element: real constraint only (cohort cap, founding member pricing, date) — no countdown timers without external anchor.
  </activation_method>
  <archetype>[Resolve from AUDIENCES.md by offer type — acquisition page → Hero/Ruler; onboarding page → Caregiver/Creator]</archetype>
  <funnel_stage>consideration → decision</funnel_stage>
  <psy_kpi>Page CVR ≥ {{LANDING_PAGE_CVR_TARGET}} | Time-on-page ≥ 2 min | CTA click rate ≥ {{CTA_CLICK_TARGET}}</psy_kpi>
  <failure_mode>Hero headline is solution-first — pain not felt before product named; cortisol induction skipped</failure_mode>
</neuro_spec>
```

---

## Input Requirements

| # | Required Input | Source Document | Status |
|---|---------------|-----------------|--------|
| 1 | ICP primary pain sentence (visceral, one sentence) | `MIR/Market_Audiences/03_MARKET/AUDIENCES.md` | [ ] |
| 2 | Offer mechanism (what makes it work — not features) | `MIR/Products/04_PRODUCTS/CATALOG.md` | [ ] |
| 3 | Pricing tiers and per-unit value framing | `MIR/Products/04_PRODUCTS/PRICING.md` | [ ] |
| 4 | 3 peer testimonials (name, role, before metric, after metric, friction sentence each) | Human-provided | [ ] |
| 5 | Prohibited words and tone rules | `MIR/Core_Strategy/02_BRAND/VOICE-TONE.md` | [ ] |
| 6 | Scarcity element (human-verified, real constraint) | Human-provided | [ ] |
| 7 | 3 authority signals with source, year, and number | Human-provided or research agent output | [ ] |

---

## Task Steps

- [ ] **Step 1:** Run Gate 1 check via `mgsd-tools.cjs mir-audit`. Block if RED.
  - Agent: MGSD-AGT-OPS-07
  - Output: Gate status
- [ ] **Step 2:** Generate CRO hypothesis for each page section using `MGSD-AGT-STR-05` — output: which trigger and copy structure to test per section (hero, features, social proof, pricing, CTA, FAQ).
  - Agent: MGSD-AGT-STR-05
  - Output: `LP-CRO-HYPOTHESIS.md`
- [ ] **Step 3:** Draft full page copy using `MGSD-AGT-CNT-02` — follow section order and trigger assignments from CRO hypothesis; pain-first hero; loss-frame all CTAs; embodied cognition language in features section.
  - Agent: MGSD-AGT-CNT-02
  - Output: `LP-COPY-DRAFT.md` (hero → sub-hero → pain → mechanism → features → social proof → pricing → CTA → FAQ → footer)
- [ ] **Step 4:** Run `MGSD-AGT-NEU-01` section-by-section — flag: solution-first hero, gain-framed CTAs, abstract feature descriptions, testimonials without before/after metrics.
  - Agent: MGSD-AGT-NEU-01
  - Output: Section audit report
- [ ] **Step 5:** Resolve all `REWRITE REQUIRED` flags. Rerun audit until `PASSED`.
  - Agent: MGSD-AGT-CNT-02
  - Output: Revised `LP-COPY-DRAFT.md`
- [ ] **Step 6:** Commit with message `mgsd(content): landing-page {offer_slug} {funnel_stage} copy complete`
  - Agent: MGSD-AGT-OPS-07
  - Output: Git commit

---

## Definition of Done / Validation

| Dimension | Criterion | Pass Condition |
|-----------|-----------|----------------|
| 1 — MIR Completeness | All 7 input items present and non-empty | `mir-audit` gate1.ready: true |
| 2 — Variable Resolution | No `[FILL]` or `{{VAR}}` tokens in copy | `grep` returns empty |
| 3 — KPI Baseline | CVR target logged in KPI-FRAMEWORK.md | KPI row present |
| 4 — Tracking | N/A (tracked separately via MGSD-ITM-TRK-01) | N/A |
| 5 — Creative Compliance | No prohibited words; hero section pain-first; all CTAs loss-framed | VOICE-TONE diff clean |
| 6 — Budget Alignment | N/A — copy production only | N/A |
| 7 — Linear Sync | Issue marked Done; LP-COPY-DRAFT.md committed | mgsd-linear-manager sync 0 drift |
| Neuro Audit | All 6 sections PASSED — no REWRITE REQUIRED | `MGSD-AGT-NEU-01` returns `PASSED` |

---

## Metadata

| Field | Value |
|-------|-------|
| Template ID | MGSD-ITM-CNT-05 |
| Task Category | Content Creation |
| Labels | `[mgsd]`, `[content]`, `[landing-page]`, `[decision]` |
| Priority | High |
| Estimate | 4–6h |
| Parent Issue | Campaign or Product Launch Epic |
