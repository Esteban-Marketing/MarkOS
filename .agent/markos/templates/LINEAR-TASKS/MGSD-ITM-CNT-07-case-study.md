---
token_id: MGSD-ITM-CNT-07
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

# MGSD-ITM-CNT-07 — Case Study / Customer Story

<!-- TOKEN: MGSD-ITM-CNT-07 | CLASS: ITM | DOMAIN: CNT -->
<!-- PURPOSE: Linear issue template for producing a peer-matched customer case study as a social proof asset. Consumed by mgsd-linear-manager when creating [MGSD] Case Study tickets. Gate 1 required. -->

**Linear Title format:** `[MGSD] Case Study: {customer_name} — {outcome_metric}`
**Category:** Content Creation
**Primary Triggers:** B03 (Social Proof Cascade), B05 (Pain Relief), B07 (Curiosity Gap)
**Secondary:** B04 (Authority Signal)
**Funnel Stage:** Consideration
**Gate:** Gate 1

## See Also

| TOKEN_ID | File | Relationship |
|----------|------|--------------|
| MGSD-TPL-OPS-16 | templates/LINEAR-TASKS/_SCHEMA.md | Schema this template conforms to |
| MGSD-REF-NEU-01 | references/neuromarketing.md | §B03, §B04, §B05, §B07 |
| MGSD-REF-OPS-01 | references/mir-gates.md | Gate 1 enforcement |
| MGSD-AGT-CNT-02 | agents/mgsd-copy-drafter.md | Writes case study narrative |
| MGSD-AGT-NEU-01 | agents/mgsd-neuro-auditor.md | B03 peer-match audit |

---

<!-- MGSD Linear Issue Template v1.0 -->
<!-- token_id: MGSD-ITM-CNT-07 | Content Creation — Case Study -->

## Context Source

| Field | Value |
|-------|-------|
| Token IDs Required | MGSD-REF-NEU-01 §B03, §B04, §B05, §B07; MGSD-REF-OPS-01 |
| MIR Gate | Gate 1 GREEN |
| MSP Matrix | `MSP/Inbound/` or `MSP/Campaigns/` — social proof asset section |
| AGT Assigned | MGSD-AGT-CNT-02 (copy-drafter) |
| SKL Entry Point | MGSD-SKL-OPS-02 (mgsd-execute-phase) |

---

## Neuromarketing Trigger

```xml
<neuro_spec>
  <trigger>B03 — Social Proof Cascade (primary); B05 — Pain Relief (narrative structure); B07 — Curiosity Gap (headline); B04 — Authority Signal (metrics and specifics)</trigger>
  <brain_region>Mirror neuron network + anterior cingulate (B03); Amygdala→dorsal raphe (B05); Prefrontal anterior (B07); Prefrontal uncertainty (B04)</brain_region>
  <activation_method>
    Subject matches ICP exactly: same role, same company size, same industry vertical (B03 peer-match requirement).
    Headline creates a curious gap framed around the outcome metric: "How [Company] cut [PAIN] by [X%] in [N] weeks" (B07).
    Opening paragraph names the pain the customer was experiencing — written from their perspective, not brand perspective (B05).
    Story includes friction sentence verbatim from customer: "I was skeptical because..." (B03 activation requirement).
    Specific metrics cited at each transition: before metric → after metric — no approximations (B04).
    Story structure: Pain → Failure of old approach → Discovery → Decision → Implementation → Result.
  </activation_method>
  <archetype>[Match to ICP archetype in AUDIENCES.md — case study subject must embody the same archetype as the target reader]</archetype>
  <funnel_stage>consideration</funnel_stage>
  <psy_kpi>Case study page CVR to next step ≥ {{CASE_STUDY_CVR_TARGET}} | Read completion rate ≥ 60%</psy_kpi>
  <failure_mode>Subject is aspirational, not peer — social distance exceeds mirror neuron activation threshold; reader cannot see themselves in the story</failure_mode>
</neuro_spec>
```

---

## Input Requirements

| # | Required Input | Source Document | Status |
|---|---------------|-----------------|--------|
| 1 | Customer profile: company name, size, industry, ICP role | Human-provided (customer interview or survey) | [ ] |
| 2 | Verbatim pain description (customer's own words) | Human-provided (interview transcript) | [ ] |
| 3 | Verbatim friction sentence ("I was skeptical because…") | Human-provided (interview transcript) | [ ] |
| 4 | Before metric (specific number: cost, time, rate) | Human-provided (customer data) | [ ] |
| 5 | After metric (specific number: same unit as before metric) | Human-provided (customer data) | [ ] |
| 6 | Tone rules and prohibited words | `MIR/Core_Strategy/02_BRAND/VOICE-TONE.md` | [ ] |
| 7 | ICP role and archetype to match peer alignment | `MIR/Market_Audiences/03_MARKET/AUDIENCES.md` | [ ] |

---

## Task Steps

- [ ] **Step 1:** Run Gate 1 check via `mgsd-tools.cjs mir-audit`. Block if RED.
  - Agent: MGSD-AGT-OPS-07
  - Output: Gate status
- [ ] **Step 2:** Verify peer-match quality — confirm customer role, company size, and industry match ≥ 2 of 3 ICP identifiers in AUDIENCES.md. Flag mismatch and block if <2 match.
  - Agent: MGSD-AGT-OPS-07
  - Output: Peer-match verification result (PASS / BLOCK)
- [ ] **Step 3:** Draft case study using `MGSD-AGT-CNT-02` — follow structure: [Pain paragraph] → [Old approach failure] → [Discovery moment] → [Decision rationale] → [Implementation] → [Result with before/after metrics] → [CTA]. Written from customer perspective, not brand perspective.
  - Agent: MGSD-AGT-CNT-02
  - Output: `CASE-STUDY-{customer_slug}.md`
- [ ] **Step 4:** Run `MGSD-AGT-NEU-01` — flag: brand-perspective narration, missing friction sentence, aspirational metrics without baseline, solution-first opening.
  - Agent: MGSD-AGT-NEU-01
  - Output: B03 peer audit report
- [ ] **Step 5:** Resolve all `REWRITE REQUIRED` flags. Rerun until `PASSED`.
  - Agent: MGSD-AGT-CNT-02
  - Output: Revised `CASE-STUDY-{customer_slug}.md`
- [ ] **Step 6:** Commit with message `mgsd(content): case-study {customer_slug} draft complete`
  - Agent: MGSD-AGT-OPS-07
  - Output: Git commit

---

## Definition of Done / Validation

| Dimension | Criterion | Pass Condition |
|-----------|-----------|----------------|
| 1 — MIR Completeness | Gate 1 GREEN; AUDIENCES.md ICP profile present | `mir-audit` gate1.ready: true |
| 2 — Variable Resolution | No `[FILL]` or `{{VAR}}` tokens | `grep` returns empty |
| 3 — KPI Baseline | Page CVR target logged | KPI-FRAMEWORK.md row present |
| 4 — Tracking | N/A — content asset | N/A |
| 5 — Creative Compliance | Customer perspective narration; friction sentence present; metrics specific | VOICE-TONE diff clean + manual check |
| 6 — Budget Alignment | N/A | N/A |
| 7 — Linear Sync | Issue marked Done; draft committed | mgsd-linear-manager sync 0 drift |
| Neuro Audit | Peer-match ≥ 2/3 identifiers; friction sentence verbatim; before/after metrics present | `MGSD-AGT-NEU-01` B03 audit `PASSED` |

---

## Metadata

| Field | Value |
|-------|-------|
| Template ID | MGSD-ITM-CNT-07 |
| Task Category | Content Creation |
| Labels | `[mgsd]`, `[content]`, `[social-proof]`, `[consideration]` |
| Priority | High |
| Estimate | 2–3h (requires human interview inputs pre-filled) |
| Parent Issue | Social Proof / Consideration Epic |
