<!-- MGSD Linear Issue Template v1.0 -->
<!-- token_id: MGSD-ITM-ANA-02 | A/B Test Configuration -->

## Context Source

| Field              | Value                                                          |
|--------------------|----------------------------------------------------------------|
| Token IDs Required | MGSD-REF-OPS-01, MGSD-REF-OPS-03, MGSD-AGT-STR-05            |
| MIR Gate           | Gate 2 — tracking must be active to measure test results       |
| MSP Matrix         | N/A — cross-discipline (attach to relevant campaign phase)     |
| AGT Assigned       | MGSD-AGT-STR-05 (cro-hypothesis), MGSD-AGT-ANA-01 (funnel-analyst) |
| SKL Entry Point    | MGSD-SKL-OPS-02 (execute-phase)                                |

---

## Neuromarketing Trigger

<neuro_spec>
  <trigger>B08 — Anchoring — Prefrontal cortex / Reference point bias; B09 — Scarcity — Amygdala / Loss aversion</trigger>
  <brain_region>Prefrontal cortex (B08 anchoring for variant comparison) + Amygdala (B09 if test involves urgency elements)</brain_region>
  <activation_method>A/B test is grounded in behavioral economics: test the specific biological mechanism that is hypothesized to drive the conversion difference between variants. Never test colors without testing the psychological mechanism behind why the color shift would matter to ICP-1.</activation_method>
  <archetype>Sage — test is designed to find truth, not to confirm assumptions</archetype>
  <funnel_stage>consideration / decision</funnel_stage>
  <psy_kpi>PSY-07 — variant conversion rate delta (must be statistically significant before calling winner)</psy_kpi>
  <failure_mode>No statistical significance after minimum runtime — test ran on too small a sample or tested the wrong variable; or test stopped early after false-positive signal</failure_mode>
</neuro_spec>

---

## Input Requirements

| # | Required Input | Source Document | Status |
|---|---------------|-----------------|--------|
| 1 | Hypothesis: what behavior we expect to change and why | MGSD-AGT-STR-05 output | [ ] |
| 2 | Control variant (current version) identified | Human-provided | [ ] |
| 3 | Tracked conversion event defined | `Core_Strategy/06_TECH-STACK/TRACKING.md` | [ ] |
| 4 | KPI baseline (current conversion rate) | `Core_Strategy/09_ANALYTICS/KPI-FRAMEWORK.md` | [ ] |
| 5 | Minimum detectable effect (MDE) agreed by human | Human-provided | [ ] |
| 6 | Test platform (PostHog / Optimizely / VWO / manual) | `Core_Strategy/06_TECH-STACK/AUTOMATION.md` | [ ] |

---

## Task Steps

- [ ] **Step 1:** Run Gate 2 check. Block if gate2.ready: false — test results are unmeasurable without tracking.
  - Agent: MGSD-AGT-OPS-01
  - Output: Gate 2 confirmed

- [ ] **Step 2:** Generate CRO hypothesis using `mgsd-cro-hypothesis`. Format: "We believe that changing [element] from [control] to [variant] will increase [metric] for [ICP segment] because [B0N trigger mechanism]."
  - Agent: MGSD-AGT-STR-05
  - Output: `cro-hypothesis-{slug}.md`
  - **⏸ HUMAN CHECKPOINT: Human approves hypothesis before any test is built**

- [ ] **Step 3:** Compute minimum sample size: `n = (z-score² × p(1-p)) / MDE²`. Compute minimum test runtime at current traffic volume. Document in test brief.
  - Agent: MGSD-AGT-ANA-01 (funnel-analyst)
  - Output: `test-brief.md` with sample size and runtime requirement
  - **⏸ HUMAN CHECKPOINT: Human confirms sample size and runtime are achievable**

- [ ] **Step 4:** Write variant copy/design spec. Control = current version. Variant = single-variable change (never change more than 1 element per test).
  - Agent: MGSD-AGT-CNT-02 (copy-drafter for copy tests) or MGSD-AGT-STR-04 (creative-brief for design tests)
  - Output: `variant-spec.md`
  - **⏸ HUMAN CHECKPOINT: Human reviews both variants before launching test**

- [ ] **Step 5:** Implement test in `{{TEST_PLATFORM}}`. Configure: 50/50 split (default), conversion goal = `{{CONVERSION_EVENT}}`, test name = `{{TEST_SLUG}}`.
  - Agent: N/A — Human implements in platform
  - **⏸ HUMAN CHECKPOINT: Human confirms test is live in platform**

- [ ] **Step 6:** Monitor test. Check at intervals: `{{CHECK_INTERVAL}}` days. Do NOT call winner until: (a) minimum runtime reached AND (b) statistical significance ≥ 95%.
  - Agent: MGSD-AGT-ANA-01 monitors conversion data
  - Output: interim check notes added to `test-brief.md`
  - **DO NOT stop test early — premature stopping rule enforced**

- [ ] **Step 7:** Read winner. Compute: conversion rate control vs. variant, lift %, confidence interval, p-value.
  - Agent: MGSD-AGT-ANA-01
  - Output: `test-results.md`
  - **⏸ HUMAN CHECKPOINT: Human reviews results and calls winner**

- [ ] **Step 8:** If winner found: implement winning variant permanently. Update MESSAGING-FRAMEWORK.md or VOICE-TONE.md with winning formula.
  - Agent: MGSD-AGT-OPS-02 (librarian updates MIR)
  - Output: MIR file updated, `SUMMARY.md` documents winner

- [ ] **Step 9:** Commit: `mktg(cro): {test-slug} — {winner: control|variant} — {lift}% lift`
  - Agent: MGSD-AGT-EXE-01
  - Output: SUMMARY.md

---

## Definition of Done / Validation

| Dimension | Criterion | Pass Condition |
|-----------|-----------|----------------|
| 1 — MIR Completeness | Gate 2 confirmed | `mir-audit` returns `gate2.ready: true` |
| 2 — Variable Resolution | Test brief fully populated | Zero [FILL] or `{{VARIABLE}}` in test-brief.md |
| 3 — KPI Baseline | Control conversion rate documented before test | Baseline CVR in test-brief.md |
| 4 — Tracking | Conversion event confirmed firing in test platform | Event visible in PostHog / test platform |
| 5 — Creative Compliance | Variant copy complies with VOICE-TONE | No prohibited words; tone matched |
| 6 — Budget Alignment | N/A — test is organic conversion optimization | Mark as N/A |
| 7 — Linear Sync | Issue status reflects execution | `mgsd-linear-manager` sync returns 0 drift |
| Neuro Audit | Hypothesis tied to specific B0N mechanism | `MGSD-AGT-NEU-01` returns `PASSED` |
| Statistical Validity | Winner called at ≥95% confidence | p-value ≤ 0.05; minimum runtime complete |

---

## Metadata

| Field | Value |
|-------|-------|
| Template ID | MGSD-ITM-ANA-02 |
| Task Category | Campaign Analytics — A/B Test |
| Labels | `mgsd`, `cro`, `ab-test`, `analytics`, `optimization` |
| Priority | Medium |
| Estimate | 4–8 story points (setup) + ongoing monitoring |
| Parent Issue | Campaign Epic ID |
| Linear Title Format | `[MGSD] A/B Test: {element_tested} — {page_or_channel} — {hypothesis_slug}` |
