---
token_id: MGSD-ITM-CNT-03
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

# MGSD-ITM-CNT-03 — Email Sequence (Nurture/Conversion)

<!-- TOKEN: MGSD-ITM-CNT-03 | CLASS: ITM | DOMAIN: CNT -->
<!-- PURPOSE: Linear issue template for producing a multi-email nurture or conversion sequence. Consumed by mgsd-linear-manager when creating [MGSD] Email Sequence tickets. Gate 1 required. -->

**Linear Title format:** `[MGSD] Email Sequence: {sequence_name} — {trigger_event} — {N}-email`
**Category:** Email Sequence
**Primary Triggers:** B01 (Variable Reward), B02 (Loss Aversion), B03 (Social Proof), B07 (Curiosity Gap)
**Funnel Stage:** Consideration → Decision → Onboarding
**Gate:** Gate 1

## See Also

| TOKEN_ID | File | Relationship |
|----------|------|--------------|
| MGSD-TPL-OPS-16 | templates/LINEAR-TASKS/_SCHEMA.md | Schema this template conforms to |
| MGSD-REF-NEU-01 | references/neuromarketing.md | §B01, §B02, §B03, §B07 definitions |
| MGSD-REF-OPS-01 | references/mir-gates.md | Gate 1 enforcement |
| MGSD-AGT-CNT-04 | agents/mgsd-email-sequence.md | Generates full email sequence |
| MGSD-AGT-NEU-01 | agents/mgsd-neuro-auditor.md | Sequence-level audit |

---

<!-- MGSD Linear Issue Template v1.0 -->
<!-- token_id: MGSD-ITM-CNT-03 | Email Sequence -->

## Context Source

| Field | Value |
|-------|-------|
| Token IDs Required | MGSD-REF-NEU-01 §B01, §B02, §B03, §B07; MGSD-REF-OPS-01 |
| MIR Gate | Gate 1 GREEN; AUTOMATION.md populated for send logic |
| MSP Matrix | `MSP/Inbound/` or `MSP/Campaigns/` — nurture discipline section |
| AGT Assigned | MGSD-AGT-CNT-04 (email-sequence) |
| SKL Entry Point | MGSD-SKL-OPS-02 (mgsd-execute-phase) |

---

## Neuromarketing Trigger

```xml
<neuro_spec>
  <trigger>B01 — Variable Reward (cadence); B02 — Loss Aversion (decision emails); B03 — Social Proof (consideration emails); B07 — Curiosity Gap (subject lines)</trigger>
  <brain_region>Nucleus accumbens (B01); Amygdala→orbitofrontal (B02); Mirror neuron network (B03); Prefrontal anterior (B07)</brain_region>
  <activation_method>
    Cadence is irregular — value magnitude varies unpredictably email-to-email (B01).
    Subject lines open information gaps specific to ICP's existing knowledge (B07).
    Emails 3–5 introduce a peer testimonial: named person, same ICP role, specific before/after metric, friction sentence (B03).
    Final 2 emails shift to loss framing — phantom ownership established in Email 1 is now at risk (B02).
    No fixed "Tuesday 9am" schedule — vary send time across sends.
  </activation_method>
  <archetype>[Resolve from AUDIENCES.md — sequence archetype may differ from ad archetype]</archetype>
  <funnel_stage>consideration → decision</funnel_stage>
  <psy_kpi>Open rate ≥ {{EMAIL_OPEN_TARGET}} | CVR from sequence ≥ {{EMAIL_CVR_TARGET}}</psy_kpi>
  <failure_mode>Open rate drops after Email 3 — reward pattern became predictable; value magnitude not varying</failure_mode>
</neuro_spec>
```

---

## Input Requirements

| # | Required Input | Source Document | Status |
|---|---------------|-----------------|--------|
| 1 | Trigger event (signup, trial-start, cart-abandon) and sequence length | Human-provided or MSP matrix | [ ] |
| 2 | ICP primary pain, archetype, core fear | `MIR/Market_Audiences/03_MARKET/AUDIENCES.md` | [ ] |
| 3 | Tone rules and prohibited words | `MIR/Core_Strategy/02_BRAND/VOICE-TONE.md` | [ ] |
| 4 | 1 peer testimonial (name, company, before metric, after metric, friction sentence) | Human-provided | [ ] |
| 5 | Automation platform and send-time rules | `MIR/Core_Strategy/06_TECH-STACK/AUTOMATION.md` | [ ] |
| 6 | Phantom ownership moment | Human-provided | [ ] |

---

## Task Steps

- [ ] **Step 1:** Run Gate 1 check via `mgsd-tools.cjs mir-audit`. Block if RED.
  - Agent: MGSD-AGT-OPS-07
  - Output: Gate status
- [ ] **Step 2:** Generate full sequence using `MGSD-AGT-CNT-04` — each email gets: subject line (B07 gap), preview text, body (VOICE-TONE compliant), single CTA. Alternate value magnitude to enforce B01 cadence.
  - Agent: MGSD-AGT-CNT-04
  - Output: `EMAIL-SEQUENCE-DRAFT.md` (one section per email)
- [ ] **Step 3:** Run `MGSD-AGT-NEU-01` on sequence as a unit — flag any email breaking B01 cadence rules or using gain-framed CTAs in decision emails.
  - Agent: MGSD-AGT-NEU-01
  - Output: Audit report with per-email flags
- [ ] **Step 4:** Resolve all `REWRITE REQUIRED` flags — rerun audit until `PASSED`.
  - Agent: MGSD-AGT-CNT-04
  - Output: Revised `EMAIL-SEQUENCE-DRAFT.md`
- [ ] **Step 5:** Commit with message `mgsd(email): sequence {sequence_slug} {N}-email draft complete`
  - Agent: MGSD-AGT-OPS-07
  - Output: Git commit

---

## Definition of Done / Validation

| Dimension | Criterion | Pass Condition |
|-----------|-----------|----------------|
| 1 — MIR Completeness | Gate 1 GREEN; AUTOMATION.md populated | `mir-audit` gate1.ready: true |
| 2 — Variable Resolution | No `[FILL]` or `{{VAR}}` tokens | `grep` returns empty |
| 3 — KPI Baseline | Open rate and CVR targets logged | KPI-FRAMEWORK.md rows filled |
| 4 — Tracking | N/A — no pixel tracking on email | N/A |
| 5 — Creative Compliance | No prohibited words; decision emails loss-framed | VOICE-TONE diff clean |
| 6 — Budget Alignment | N/A — email production, no ad spend | N/A |
| 7 — Linear Sync | Issue status reflects execution state | mgsd-linear-manager sync 0 drift |
| Neuro Audit | Sequence-level PASSED; no single email breaking cadence rules | `MGSD-AGT-NEU-01` returns `PASSED` |

---

## Metadata

| Field | Value |
|-------|-------|
| Template ID | MGSD-ITM-CNT-03 |
| Task Category | Email Sequence |
| Labels | `[mgsd]`, `[email]`, `[consideration]` |
| Priority | High |
| Estimate | 4–8h depending on sequence length |
| Parent Issue | Nurture or Conversion campaign Epic |
