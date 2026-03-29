<!-- MARKOS Linear Issue Template v1.0 -->
<!-- token_id: MARKOS-ITM-OPS-02 | Lifecycle Automation Setup -->

## Context Source

| Field              | Value                                                          |
|--------------------|----------------------------------------------------------------|
| Token IDs Required | MARKOS-REF-OPS-01, MARKOS-AGT-OPS-03, MARKOS-AGT-TRK-01            |
| MIR Gate           | Gate 2 — TRACKING.md and AUTOMATION.md must be GREEN          |
| MSP Matrix         | MSP/Campaigns/03_LIFECYCLE_EMAIL.md                            |
| AGT Assigned       | MARKOS-AGT-OPS-03 (automation-architect), MARKOS-AGT-CNT-04 (email-sequence) |
| SKL Entry Point    | MARKOS-SKL-OPS-02 (execute-phase)                                |

---

## Neuromarketing Trigger

<neuro_spec>
  <trigger>B01 — Dopamine — Nucleus accumbens / Anticipation reward loop; B02 — Serotonin — Prefrontal cortex / Safety and belonging</trigger>
  <brain_region>Nucleus accumbens (B01 dopamine anticipation) + Prefrontal cortex (B02 serotonin safety)</brain_region>
  <activation_method>Lifecycle emails deliver progressive value — each touchpoint rewards the reader with a new insight or capability unlock. The sequence creates an anticipation loop: reader learns to expect and open emails because each one delivered something useful before.</activation_method>
  <archetype>Sage — trusted guide delivering capability, not pitching product</archetype>
  <funnel_stage>onboarding / retention</funnel_stage>
  <psy_kpi>PSY-06 — email open rate trend (does rate increase as sequence progresses — sign of anticipation loop forming)</psy_kpi>
  <failure_mode>Open rate declining through sequence — email N+1 failed to deliver the value promised by email N; sequence reads as automated, not personal</failure_mode>
</neuro_spec>

---

## Input Requirements

| # | Required Input | Source Document | Status |
|---|---------------|-----------------|--------|
| 1 | Trigger event defined (what activates the automation) | `Core_Strategy/06_TECH-STACK/TRACKING.md` | [ ] |
| 2 | Automation platform credentials and workflow access | `Core_Strategy/06_TECH-STACK/AUTOMATION.md` | [ ] |
| 3 | VOICE-TONE.md — email tone and CTA constraints | `Core_Strategy/02_BRAND/VOICE-TONE.md` | [ ] |
| 4 | Funnel stage this sequence serves | Human-provided | [ ] |
| 5 | Sequence goal (what behavior it drives) | Human-provided | [ ] |
| 6 | Exit condition (what stops the sequence) | Human-provided | [ ] |

---

## Task Steps

- [ ] **Step 1:** Run Gate 2 check. Block if gate2.ready: false (tracking + automation must both be configured).
  - Agent: MARKOS-AGT-OPS-01
  - Output: Gate 2 status confirmed

- [ ] **Step 2:** Map automation architecture using `markos-automation-architect`. Define: Trigger → Delay ladder → Email N → Branch condition → Exit.
  - Agent: MARKOS-AGT-OPS-03
  - Output: `automation-flow-diagram.md` (text-based flow map)
  - **⏸ HUMAN CHECKPOINT: Review automation logic before building**

- [ ] **Step 3:** Write complete email sequence using `markos-email-sequence`. Minimum 5 emails. Each email: Subject / Preview / Body / CTA. B01 dopamine: each email must name the specific next value the reader gets for opening the next email.
  - Agent: MARKOS-AGT-CNT-04
  - Output: `lifecycle-sequence-{slug}.md`
  - **⏸ HUMAN CHECKPOINT: Review all emails before uploading to platform**

- [ ] **Step 4:** Configure in `{{AUTOMATION_PLATFORM}}` (n8n / HubSpot / ActiveCampaign): build workflow per automation-flow-diagram.md. Trigger: `{{TRIGGER_EVENT}}`. Delays: `{{DELAY_SCHEDULE}}`.
  - Agent: N/A — Human configures in platform
  - **⏸ HUMAN CHECKPOINT: Confirm workflow is built and in TEST mode**

- [ ] **Step 5:** Test automation: trigger the workflow manually with a test lead. Verify all emails send at correct delays. Check that exit condition fires on `{{EXIT_EVENT}}`.
  - Agent: MARKOS-AGT-TRK-01 (tracking-spec verifies events)
  - Output: Test results documented in SUMMARY.md
  - **⏸ HUMAN CHECKPOINT: Human confirms test emails received and correct**

- [ ] **Step 6:** Activate automation. Set to live. Confirm `{{TRIGGER_EVENT}}` fires correctly for real leads by checking PostHog event log.
  - Agent: N/A — Human switches to live
  - **⏸ HUMAN CHECKPOINT: Human confirms first real send occurred correctly**

- [ ] **Step 7:** Document automation in `AUTOMATION.md`: flow name, trigger event, email count, delay schedule, exit condition, go-live date.
  - Agent: MARKOS-AGT-OPS-03
  - Output: `AUTOMATION.md` updated

- [ ] **Step 8:** Commit: `mktg(lifecycle): {sequence-slug} — automation live`
  - Agent: MARKOS-AGT-EXE-01
  - Output: SUMMARY.md

---

## Definition of Done / Validation

| Dimension | Criterion | Pass Condition |
|-----------|-----------|----------------|
| 1 — MIR Completeness | Gate 2 files complete | `mir-audit` returns `gate2.ready: true` |
| 2 — Variable Resolution | Zero `{{VARIABLE}}` tokens in email copy | `grep -r '{{[A-Z_]*}}'` in sequence returns empty |
| 3 — KPI Baseline | Open rate and click rate targets documented | `KPI-FRAMEWORK.md` has open_rate_target and ctr_target for lifecycle |
| 4 — Tracking | Trigger event + exit event confirmed firing | PostHog shows both events in event log |
| 5 — Creative Compliance | All emails comply with VOICE-TONE | No prohibited words; tone-by-context: email matched |
| 6 — Budget Alignment | N/A — lifecycle email is organic | Mark as N/A |
| 7 — Linear Sync | Issue status reflects execution | `markos-linear-manager` sync returns 0 drift |
| Neuro Audit | B01 anticipation loop present in sequence | `MARKOS-AGT-NEU-01` returns `PASSED` |
| Live Confirmation | Human confirmed first real automation send | Human checkpoint Step 6 marked complete |

---

## Metadata

| Field | Value |
|-------|-------|
| Template ID | MARKOS-ITM-OPS-02 |
| Task Category | Campaign Ops — Lifecycle Automation |
| Labels | `markos`, `lifecycle`, `automation`, `email`, `retention` |
| Priority | High |
| Estimate | 8–12 story points |
| Parent Issue | Campaign Epic ID |
| Linear Title Format | `[MARKOS] Lifecycle Automation: {sequence_name} — {trigger_event}` |
