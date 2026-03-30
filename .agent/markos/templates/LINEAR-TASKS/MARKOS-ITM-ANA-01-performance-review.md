---
token_id: MARKOS-ITM-ANA-01
document_class: ITM
domain: ANA
version: "1.0.0"
status: active
upstream:
  - MARKOS-TPL-OPS-16
  - MARKOS-REF-NEU-01
  - MARKOS-REF-OPS-03
changelog:
  - "1.0.0 — Initial release"
mir_gate_required: 2
---

# MARKOS-ITM-ANA-01 — Campaign Performance Review

<!-- TOKEN: MARKOS-ITM-ANA-01 | CLASS: ITM | DOMAIN: ANA -->
<!-- PURPOSE: Linear issue template for post-launch campaign analysis with trigger-failure diagnosis. Consumed by markos-linear-manager when creating [MARKOS] Performance Review tickets. Gate 2 required. -->

**Linear Title format:** `[MARKOS] Performance Review: {campaign_name} — {period}`
**Category:** Campaign Analytics
**Primary Triggers:** N/A — diagnostic task (cross-references active neuro triggers)
**Funnel Stage:** Post-launch (Retention optimization)
**Gate:** Gate 2

## See Also

| TOKEN_ID | File | Relationship |
|----------|------|--------------|
| MARKOS-TPL-OPS-16 | templates/LINEAR-TASKS/_SCHEMA.md | Schema this template conforms to |
| MARKOS-REF-NEU-01 | references/neuromarketing.md | Failure Mode catalog used in trigger diagnosis |
| MARKOS-REF-OPS-03 | references/verification-patterns.md | All 7 dimensions evaluated in this task |
| MARKOS-AGT-ANA-01 | agents/markos-funnel-analyst.md | Funnel stage conversion analysis |
| MARKOS-AGT-ANA-02 | agents/markos-performance-monitor.md | KPI variance computation |
| MARKOS-AGT-ANA-04 | agents/markos-report-compiler.md | Performance report generation |

---

<!-- MARKOS Linear Issue Template v1.0 -->
<!-- token_id: MARKOS-ITM-ANA-01 | Campaign Analytics -->

## Context Source

| Field | Value |
|-------|-------|
| Token IDs Required | MARKOS-REF-OPS-03 §all dimensions; MARKOS-REF-NEU-01 (trigger failure diagnosis) |
| MIR Gate | Gate 2 GREEN |
| MSP Matrix | Active campaign matrix — reads `[x]` completion status |
| AGT Assigned | MARKOS-AGT-ANA-01 + MARKOS-AGT-ANA-02 + MARKOS-AGT-ANA-04 |
| SKL Entry Point | MARKOS-SKL-CAM-02 (markos-performance-review) |

---

## Neuromarketing Trigger

```xml
<neuro_spec>
  <trigger>Diagnostic — cross-reference live KPIs against PSY-KPIs from active NEURO-BRIEF.md to identify underperforming triggers</trigger>
  <brain_region>Maps failure signals to brain regions from MARKOS-REF-NEU-01 failure mode catalog</brain_region>
  <activation_method>
    Compare CTR vs. predicted CTR for B07-headlined ads — gap indicates curiosity gap not landing.
    Compare loss-frame CTA CVR vs. gain-frame CTA CVR — if lift &lt; 15%, B02 not activating.
    Compare sequence open rate trend — if drops after Email 3, B01 cadence too predictable.
  </activation_method>
  <archetype>N/A — diagnostic</archetype>
  <funnel_stage>retention (optimization)</funnel_stage>
  <psy_kpi>PSY-KPI delta vs. baseline for all active triggers | Min 1 optimization action per underperforming trigger</psy_kpi>
  <failure_mode>Report produced without trigger-failure diagnosis — optimization is generic, not mechanistic</failure_mode>
</neuro_spec>
```

---

## Input Requirements

| # | Required Input | Source Document | Status |
|---|---------------|-----------------|--------|
| 1 | KPI targets (CAC, CPL, CTR, CVR, ROAS) | `MIR/Core_Strategy/09_ANALYTICS/KPI-FRAMEWORK.md` | [ ] |
| 2 | Live performance data (CTR, CVR, CAC, ROAS) | Analytics platform export — Human-provided | [ ] |
| 3 | Active NEURO-BRIEF.md for this campaign | `.planning/phases/[N]/NEURO-BRIEF.md` | [ ] |
| 4 | Active UTM-SPEC.md for attribution | `.planning/phases/[N]/UTM-SPEC.md` | [ ] |

---

## Task Steps

- [ ] **Step 1:** Load KPI baselines from KPI-FRAMEWORK.md and live data — compute variance per metric.
  - Agent: MARKOS-AGT-ANA-02
  - Output: KPI variance table (target vs. actual, % delta)
- [ ] **Step 2:** Map underperforming KPIs to trigger failure modes using MARKOS-REF-NEU-01 Failure Mode catalog.
  - Agent: MARKOS-AGT-ANA-01
  - Output: Trigger failure diagnosis (which triggers not activating and mechanism reason)
- [ ] **Step 3:** Generate performance report using `MARKOS-AGT-ANA-04` — include: KPI table, trigger diagnosis, ranked optimization actions (each action cites a specific trigger and an implementable change).
  - Agent: MARKOS-AGT-ANA-04
  - Output: `PERFORMANCE-REPORT-{period}.md`
- [ ] **Step 4:** Update MSP matrix — mark completed tasks `[x]`, flag underperforming tasks for revision.
  - Agent: MARKOS-AGT-OPS-07
  - Output: Updated MSP matrix
- [ ] **Step 5:** Commit with message `markos(analytics): {campaign_slug} performance-report {period} committed`
  - Agent: MARKOS-AGT-OPS-07
  - Output: Git commit

---

## Definition of Done / Validation

| Dimension | Criterion | Pass Condition |
|-----------|-----------|----------------|
| 1 — MIR Completeness | Gate 2 GREEN | `mir-audit` gate2.ready: true |
| 2 — Variable Resolution | No unresolved tokens in report | `grep -r '{{[A-Z_]*}}'` returns empty |
| 3 — KPI Baseline | All KPIs have baseline and current value | KPI variance table is complete with 0 empty cells |
| 4 — Tracking | UTM attribution resolves for all measured variants | UTM-SPEC.md cross-referenced; no unmapped sessions |
| 5 — Creative Compliance | N/A | N/A |
| 6 — Budget Alignment | N/A | N/A |
| 7 — Linear Sync | MSP matrix updated; Linear status reflects state | markos-linear-manager sync 0 drift |
| Neuro Audit | Every underperforming KPI has a trigger-failure diagnosis | No "underperforming KPI" row without a diagnosis entry |

---

## Metadata

| Field | Value |
|-------|-------|
| Template ID | MARKOS-ITM-ANA-01 |
| Task Category | Campaign Analytics |
| Labels | `[markos]`, `[analytics]`, `[retention]` |
| Priority | Medium |
| Estimate | 2–3h |
| Parent Issue | Active Campaign Epic |
