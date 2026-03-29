---
token_id: MGSD-ITM-ACQ-01
document_class: ITM
domain: ACQ
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

# MGSD-ITM-ACQ-01 — Paid Social Campaign Setup (Meta / TikTok / LinkedIn)

<!-- TOKEN: MGSD-ITM-ACQ-01 | CLASS: ITM | DOMAIN: ACQ -->
<!-- PURPOSE: Linear issue template for structuring and specifying a full paid social campaign: campaign objective, audience targeting, creative brief per ad set, and budget allocation. Consumed by mgsd-linear-manager when creating [MGSD] Paid Social Setup tickets. Gate 1 + Gate 2 required. -->

**Linear Title format:** `[MGSD] Paid Social Setup: {platform} — {campaign_name} — {objective}`
**Category:** Acquisition
**Primary Triggers:** B05 (Pain Relief), B02 (Loss Aversion), B06 (Scarcity)
**Secondary:** B09 (Anchoring), B03 (Social Proof)
**Funnel Stage:** Awareness → Decision
**Gate:** Gate 1 + Gate 2

## See Also

| TOKEN_ID | File | Relationship |
|----------|------|--------------|
| MGSD-TPL-OPS-16 | templates/LINEAR-TASKS/_SCHEMA.md | Schema this template conforms to |
| MGSD-REF-NEU-01 | references/neuromarketing.md | §B02, §B03, §B05, §B06, §B09 |
| MGSD-REF-OPS-01 | references/mir-gates.md | Gate 1 + Gate 2 enforcement |
| MGSD-AGT-STR-03 | agents/mgsd-campaign-architect.md | Campaign structure: objective, ad sets, audience layering |
| MGSD-AGT-STR-04 | agents/mgsd-creative-brief.md | Per-ad-set creative brief |
| MGSD-AGT-TRK-02 | agents/mgsd-utm-architect.md | UTM taxonomy for all ad sets |
| MGSD-AGT-NEU-01 | agents/mgsd-neuro-auditor.md | Creative brief neuro audit |

---

<!-- MGSD Linear Issue Template v1.0 -->
<!-- token_id: MGSD-ITM-ACQ-01 | Acquisition — Paid Social -->

## Context Source

| Field | Value |
|-------|-------|
| Token IDs Required | MGSD-REF-NEU-01 §B02, §B03, §B05, §B06, §B09; MGSD-REF-OPS-01 |
| MIR Gate | Gate 1 AND Gate 2 GREEN |
| MSP Matrix | `MSP/Campaigns/01_PAID_ACQUISITION.md` — paid social discipline section |
| AGT Assigned | MGSD-AGT-STR-03 (campaign-architect) + MGSD-AGT-STR-04 (creative-brief) + MGSD-AGT-TRK-02 (utm-architect) |
| SKL Entry Point | MGSD-SKL-OPS-01 (mgsd-plan-phase) |

---

## Neuromarketing Trigger

```xml
<neuro_spec>
  <trigger>B05 — Pain Relief (cold audience hooks); B02 — Loss Aversion (retargeting and CTA); B06 — Scarcity (offer-level urgency); B09 — Anchoring (pricing ad sets); B03 — Social Proof (MOFU ad sets)</trigger>
  <brain_region>Amygdala→dorsal raphe (B05); Amygdala→orbitofrontal (B02); Amygdala→hypothalamus (B06); Prefrontal heuristic (B09); Mirror neurons (B03)</brain_region>
  <activation_method>
    Cold audience ad sets: B05 hook — pain named in first sentence of ad copy; product not named until sentence 3+.
    MOFU ad sets: B03 creative — peer testimonial format with before/after overlay or voiceover.
    BOFU/retargeting ad sets: B02 creative — escalating cost-of-inaction copy per day since last visit.
    CTA on all ad sets: loss-frame ("Keep your [X]") not gain-frame ("Get started").
    Pricing ad sets: B09 — anchor highest value option first; show per-unit cost before total.
    Urgency element: campaign-level scarcity tied to real event — cohort close, price increase, season.
  </activation_method>
  <archetype>[Resolve per ad set from AUDIENCES.md — cold targeting → Hero/Ruler; retargeting → Caregiver/Creator by segment mismatch]</archetype>
  <funnel_stage>awareness (cold) → consideration (MOFU) → decision (BOFU retargeting)</funnel_stage>
  <psy_kpi>TOFU CTR ≥ {{PAID_SOCIAL_TOFU_CTR}} | MOFU CPL ≤ {{PAID_SOCIAL_CPL_TARGET}} | BOFU CVR ≥ {{PAID_SOCIAL_BOFU_CVR}}</psy_kpi>
  <failure_mode>Cold ad set reveals product in first sentence — cortisol induction skipped; ICP scrolls past before pain is felt</failure_mode>
</neuro_spec>
```

---

## Input Requirements

| # | Required Input | Source Document | Status |
|---|---------------|-----------------|--------|
| 1 | Platform (Meta / TikTok / LinkedIn) and campaign objective (awareness / leads / conversions) | Human-provided | [ ] |
| 2 | Daily/monthly budget and campaign duration | `MIR/Operations/BUDGET-ALLOCATION.md` | [ ] |
| 3 | Audience targeting parameters per ad set (cold, lookalike, warm, retargeting) | `MIR/Market_Audiences/03_MARKET/AUDIENCES.md` | [ ] |
| 4 | Creative specification per platform (image/video ratios, copy character limits) | `MIR/Campaigns_Assets/05_CHANNELS/PAID-MEDIA.md` | [ ] |
| 5 | Tracking pixels, CAPI parameters, conversion event names | `MIR/Core_Strategy/06_TECH-STACK/TRACKING.md` | [ ] |
| 6 | Scarcity element for offer (human-verified, real constraint) | Human-provided | [ ] |
| 7 | ICP primary pain sentence and core fear | `MIR/Market_Audiences/03_MARKET/AUDIENCES.md` | [ ] |

---

## Task Steps

- [ ] **Step 1:** Run `mgsd-tools.cjs mir-audit` — confirm Gate 1 AND Gate 2 GREEN. Block if either RED.
  - Agent: MGSD-AGT-OPS-07
  - Output: Gate status
- [ ] **Step 2:** Generate campaign architecture using `MGSD-AGT-STR-03` — output: campaign objective, ad set map (TOFU / MOFU / BOFU), audience targeting per ad set, budget split per ad set, optimization event per ad set.
  - Agent: MGSD-AGT-STR-03
  - Output: `PAID-SOCIAL-ARCHITECTURE-{campaign_slug}.md`
- [ ] **Step 3:** Generate creative brief per ad set using `MGSD-AGT-STR-04` — each brief specifies: trigger, copy hook, visual direction, CTA text. TOFU → B05; MOFU → B03; BOFU → B02.
  - Agent: MGSD-AGT-STR-04
  - Output: `CREATIVE-BRIEFS-{campaign_slug}.md` (one section per ad set)
- [ ] **Step 4:** Generate UTM parameters for all ad sets using `MGSD-AGT-TRK-02`.
  - Agent: MGSD-AGT-TRK-02
  - Output: `UTM-SPEC-{campaign_slug}.md`
- [ ] **Step 5:** Run `MGSD-AGT-NEU-01` on all creative briefs — flag TOFU briefs revealing product in sentence 1, gain-framed CTAs, BOFU briefs without escalating cost-of-inaction.
  - Agent: MGSD-AGT-NEU-01
  - Output: Creative brief audit per ad set
- [ ] **Step 6:** Resolve all `REWRITE REQUIRED` flags. Rerun until `PASSED`.
  - Agent: MGSD-AGT-STR-04
  - Output: Revised creative briefs
- [ ] **Step 7:** Commit with message `mgsd(acquisition): paid-social {platform} {campaign_slug} setup complete`
  - Agent: MGSD-AGT-OPS-07
  - Output: Git commit

---

## Definition of Done / Validation

| Dimension | Criterion | Pass Condition |
|-----------|-----------|----------------|
| 1 — MIR Completeness | Gate 1 + Gate 2 GREEN | `mir-audit` both ready: true |
| 2 — Variable Resolution | No `{{VAR}}` tokens in architecture or UTM docs | `grep` returns empty |
| 3 — KPI Baseline | CTR, CPL, CVR targets per ad set logged | KPI-FRAMEWORK.md rows present |
| 4 — Tracking | Pixels, CAPI params, and conversion events confirmed | TRACKING.md non-empty; UTM-SPEC committed |
| 5 — Creative Compliance | TOFU briefs pain-first; BOFU CTAs loss-framed | Neuro audit PASSED per ad set |
| 6 — Budget Alignment | Budget per ad set ≤ BUDGET-ALLOCATION.md paid acquisition cap | Stated allocation ≤ discipline cap |
| 7 — Linear Sync | Issue marked Done; all artifacts committed | mgsd-linear-manager sync 0 drift |
| Neuro Audit | All ad set creative briefs PASSED | `MGSD-AGT-NEU-01` returns `PASSED` for all briefs |

---

## Metadata

| Field | Value |
|-------|-------|
| Template ID | MGSD-ITM-ACQ-01 |
| Task Category | Acquisition |
| Labels | `[mgsd]`, `[paid-social]`, `[acquisition]`, `[awareness]` |
| Priority | Urgent |
| Estimate | 4–6h |
| Parent Issue | Paid Social Campaign Epic |
