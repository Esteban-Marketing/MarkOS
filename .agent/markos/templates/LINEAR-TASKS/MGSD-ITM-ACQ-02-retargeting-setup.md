---
token_id: MARKOS-ITM-ACQ-02
document_class: ITM
domain: ACQ
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

# MARKOS-ITM-ACQ-02 — Retargeting Campaign Setup

<!-- TOKEN: MARKOS-ITM-ACQ-02 | CLASS: ITM | DOMAIN: ACQ -->
<!-- PURPOSE: Linear issue template for designing pixel-based and list-based retargeting campaigns with escalating loss-aversion sequences. Consumed by markos-linear-manager when creating [MARKOS] Retargeting Setup tickets. Gate 2 required (pixel data prerequisite). -->

**Linear Title format:** `[MARKOS] Retargeting: {platform} — {audience_segment} — {campaign_name}`
**Category:** Acquisition
**Primary Triggers:** B02 (Loss Aversion), B06 (Scarcity), B09 (Anchoring)
**Secondary:** B03 (Social Proof — mid-funnel retouch)
**Funnel Stage:** Decision → Conversion
**Gate:** Gate 2 (pixel data required)

## See Also

| TOKEN_ID | File | Relationship |
|----------|------|--------------|
| MARKOS-TPL-OPS-16 | templates/LINEAR-TASKS/_SCHEMA.md | Schema this template conforms to |
| MARKOS-REF-NEU-01 | references/neuromarketing.md | §B02, §B03, §B06, §B09 |
| MARKOS-REF-OPS-01 | references/mir-gates.md | Gate 2 enforcement (pixel events must exist) |
| MARKOS-AGT-STR-03 | agents/markos-campaign-architect.md | Retargeting audience segmentation and window map |
| MARKOS-AGT-CNT-02 | agents/markos-copy-drafter.md | Escalating sequence copy per day-window |
| MARKOS-AGT-TRK-02 | agents/markos-utm-architect.md | UTM per retargeting window |
| MARKOS-AGT-NEU-01 | agents/markos-neuro-auditor.md | Loss-escalation sequence audit |

---

<!-- MARKOS Linear Issue Template v1.0 -->
<!-- token_id: MARKOS-ITM-ACQ-02 | Acquisition — Retargeting -->

## Context Source

| Field | Value |
|-------|-------|
| Token IDs Required | MARKOS-REF-NEU-01 §B02, §B03, §B06, §B09; MARKOS-REF-OPS-01 |
| MIR Gate | Gate 2 GREEN (pixel events must fire, audiences must be seeded) |
| MSP Matrix | `MSP/Campaigns/01_PAID_ACQUISITION.md` — retargeting section |
| AGT Assigned | MARKOS-AGT-STR-03 (campaign-architect) + MARKOS-AGT-CNT-02 (copy-drafter) + MARKOS-AGT-TRK-02 |
| SKL Entry Point | MARKOS-SKL-OPS-02 (markos-execute-phase) |

---

## Neuromarketing Trigger

```xml
<neuro_spec>
  <trigger>B02 — Loss Aversion (primary — escalating per day-window); B06 — Scarcity (final window only — hard deadline); B09 — Anchoring (pricing creative); B03 — Social Proof (Day 1 retarget — peer testimonial)</trigger>
  <brain_region>Amygdala→orbitofrontal (B02); Amygdala→hypothalamus (B06); Prefrontal heuristic (B09); Mirror neurons (B03)</brain_region>
  <activation_method>
    Day 1–3 window: B03 — peer testimonial creative to reinforce identity and product relevance before escalating pressure.
    Day 4–7 window: B02 — phantom ownership language ("You were looking at [X]. Here is what you're missing without it."). Cost-of-inaction framing, not product pitch.
    Day 8–14 window: B02 escalation — loss magnitude increases ("Every day without [X] costs [ICP] [specific unit of loss]").
    Day 15 / final window: B06 + B09 — "Last chance" with real constraint + high-anchor original price crossed out / reduced.
    No creative repeats within same day-window — refreshed every 3 days minimum.
    CTA on all windows: loss-frame exclusively.
  </activation_method>
  <archetype>[Resolve from AUDIENCES.md — same segment that triggered the pixel event; must match the initial cold audience archetype]</archetype>
  <funnel_stage>decision → conversion</funnel_stage>
  <psy_kpi>Retargeting CVR ≥ {{RETARGETING_CVR_TARGET}} | ROAS ≥ {{RETARGETING_ROAS_TARGET}} | Frequency cap ≤ 3 impressions/day per window</psy_kpi>
  <failure_mode>Day 1 retarget launches with B02 pressure before B03 identity reinforcement — prospect feels surveilled, not recognized; unsubscribe/hide rate spikes</failure_mode>
</neuro_spec>
```

---

## Input Requirements

| # | Required Input | Source Document | Status |
|---|---------------|-----------------|--------|
| 1 | Pixel events confirmed firing (page-view, add-to-cart, lead, trial) | `MIR/Core_Strategy/06_TECH-STACK/TRACKING.md` | [ ] |
| 2 | Audience size per retargeting window (pixel-based or CRM-based) | Platform analytics — Human-provided | [ ] |
| 3 | ICP primary pain and phantom ownership moment | `MIR/Market_Audiences/03_MARKET/AUDIENCES.md` | [ ] |
| 4 | 1 peer testimonial for Day 1 window (role, before metric, after metric, friction sentence) | Human-provided | [ ] |
| 5 | Real scarcity element for final window (verified constraint) | Human-provided | [ ] |
| 6 | Budget per retargeting window and total duration | `MIR/Operations/BUDGET-ALLOCATION.md` | [ ] |

---

## Task Steps

- [ ] **Step 1:** Run Gate 2 audit via `markos-tools.cjs mir-audit` — confirm pixel events firing and TRACKING.md non-empty. Block if RED.
  - Agent: MARKOS-AGT-OPS-07
  - Output: Gate 2 status
- [ ] **Step 2:** Generate retargeting audience map using `MARKOS-AGT-STR-03` — output: window boundaries (Day 1–3 / Day 4–7 / Day 8–14 / Day 15+), audience size per window, exclusion rules between windows, frequency cap.
  - Agent: MARKOS-AGT-STR-03
  - Output: `RETARGETING-ARCHITECTURE-{campaign_slug}.md`
- [ ] **Step 3:** Draft copy per window using `MARKOS-AGT-CNT-02` — follow trigger sequence: Day 1–3 (B03 proof) → Day 4–7 (B02 phantom ownership) → Day 8–14 (B02 escalation) → Day 15 (B06 + B09 anchor-and-scarcity). 2–3 copy variants per window.
  - Agent: MARKOS-AGT-CNT-02
  - Output: `RETARGETING-COPY-{campaign_slug}.md`
- [ ] **Step 4:** Generate UTM parameters per window using `MARKOS-AGT-TRK-02` (window ID embedded in UTM content parameter).
  - Agent: MARKOS-AGT-TRK-02
  - Output: `UTM-SPEC-RETARGETING-{campaign_slug}.md`
- [ ] **Step 5:** Run `MARKOS-AGT-NEU-01` — flag: B02 pressure in Day 1 window, gain-framed CTAs in any window, unverified scarcity element in Day 15 window.
  - Agent: MARKOS-AGT-NEU-01
  - Output: Per-window audit report
- [ ] **Step 6:** Resolve all `REWRITE REQUIRED` flags. Rerun until all windows `PASSED`.
  - Agent: MARKOS-AGT-CNT-02
  - Output: Revised copy
- [ ] **Step 7:** Commit with message `markos(acquisition): retargeting {platform} {campaign_slug} setup complete`
  - Agent: MARKOS-AGT-OPS-07
  - Output: Git commit

---

## Definition of Done / Validation

| Dimension | Criterion | Pass Condition |
|-----------|-----------|----------------|
| 1 — MIR Completeness | Gate 2 GREEN; pixel events confirmed | `mir-audit` gate2.ready: true |
| 2 — Variable Resolution | No `{{VAR}}` in copy or UTM docs | `grep` returns empty |
| 3 — KPI Baseline | CVR and ROAS per window logged | KPI-FRAMEWORK.md rows present |
| 4 — Tracking | All window pixels and UTMs confirmed | UTM-SPEC committed; window IDs distinct |
| 5 — Creative Compliance | Day 1 is B03; all CTAs loss-framed; Day 15 scarcity is verified | Neuro audit PASSED per window |
| 6 — Budget Alignment | Budget per window ≤ paid acquisition cap | Allocation ≤ BUDGET-ALLOCATION.md cap |
| 7 — Linear Sync | Issue marked Done; all docs committed | markos-linear-manager sync 0 drift |
| Neuro Audit | Trigger sequence respected across windows; no B02 in Day 1 | `MARKOS-AGT-NEU-01` returns `PASSED` |

---

## Metadata

| Field | Value |
|-------|-------|
| Template ID | MARKOS-ITM-ACQ-02 |
| Task Category | Acquisition |
| Labels | `[markos]`, `[retargeting]`, `[acquisition]`, `[decision]` |
| Priority | High |
| Estimate | 3–4h |
| Parent Issue | Paid Acquisition Epic |
