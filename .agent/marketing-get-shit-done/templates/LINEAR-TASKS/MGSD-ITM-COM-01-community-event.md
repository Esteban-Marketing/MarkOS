<!-- MGSD Linear Issue Template v1.0 -->
<!-- token_id: MGSD-ITM-COM-01 | Community & Events -->

## Context Source

| Field              | Value                                                          |
|--------------------|----------------------------------------------------------------|
| Token IDs Required | MGSD-REF-NEU-01, MGSD-REF-OPS-01, MGSD-AGT-CNT-01            |
| MIR Gate           | Gate 1 — status must be GREEN before execution                 |
| MSP Matrix         | MSP/Community_Events/01_COMMUNITY_EVENTS.md §3–§5              |
| AGT Assigned       | MGSD-AGT-CNT-01 (content-creator), MGSD-AGT-OPS-04 (calendar-builder) |
| SKL Entry Point    | MGSD-SKL-OPS-02 (execute-phase)                                |

---

## Neuromarketing Trigger

<neuro_spec>
  <trigger>B07 — Oxytocin — Limbic / Social bonding</trigger>
  <brain_region>Limbic system — social identity and belonging circuits</brain_region>
  <activation_method>Position the event as a gathering of people "like them" — same title, same challenge, same ambition. The CTA is joining a community, not attending a meeting.</activation_method>
  <archetype>Caregiver — brings people together, creates safety and belonging for ICP-1 peers</archetype>
  <funnel_stage>awareness / consideration</funnel_stage>
  <psy_kpi>PSY-03 — community belonging signal (registration rate, show-up rate)</psy_kpi>
  <failure_mode>Low show-up rate or registration without conversion — event felt like a sales pitch, not peer gathering</failure_mode>
</neuro_spec>

---

## Input Requirements

| # | Required Input | Source Document | Status |
|---|---------------|-----------------|--------|
| 1 | ICP-1 definition and pain points | `Market_Audiences/03_MARKET/AUDIENCES.md` | [ ] |
| 2 | VOICE-TONE.md — tone for event context | `Core_Strategy/02_BRAND/VOICE-TONE.md` | [ ] |
| 3 | Event topic approved by human | Human-provided | [ ] |
| 4 | Registration page CTA and destination URL | Human-provided | [ ] |
| 5 | Community platform configured | `Core_Strategy/06_TECH-STACK/AUTOMATION.md` | [ ] |
| 6 | Webinar/event platform credentials | Human-provided | [ ] |

---

## Task Steps

- [ ] **Step 1:** Run Gate 1 check via `mgsd-tools.cjs mir-audit`. Block if gate1.ready: false.
  - Agent: MGSD-AGT-OPS-01
  - Output: gate status confirmed

- [ ] **Step 2:** Load ICP-1 pain points from `AUDIENCES.md`. Confirm event topic addresses primary pain.
  - Agent: MGSD-AGT-AUD-02
  - Output: event topic validated against ICP profile

- [ ] **Step 3:** Write event registration page copy using `MGSD-ITM-CNT-05` pattern. Hook must use B07 oxytocin framing — "join your peers, not a webinar."
  - Agent: MGSD-AGT-CNT-02 (copy-drafter)
  - Output: `registration-page-copy.md` in phase directory
  - **⏸ HUMAN CHECKPOINT: Review registration copy before publishing**

- [ ] **Step 4:** Build 4-part promotional sequence: Announcement (3 weeks) → Reminder (1 week) → Last chance (48h) → Day-of.
  - Agent: MGSD-AGT-CNT-04 (email-sequence)
  - Output: `event-promo-sequence.md`
  - **⏸ HUMAN CHECKPOINT: Review all 4 emails before scheduling**

- [ ] **Step 5:** Draft event script/talking points. Structure: Welcome (5 min) → Problem framing (10 min) → Solution/insight (20 min) → Q&A (15 min) → Soft CTA (5 min).
  - Agent: MGSD-AGT-CNT-02
  - Output: `event-script.md`
  - **⏸ HUMAN CHECKPOINT: Review and approve script before event**

- [ ] **Step 6:** Build social promotion calendar (3 posts/week × 3 weeks) via `mgsd-social-drafter`.
  - Agent: MGSD-AGT-CNT-03
  - Output: `event-social-calendar.md`

- [ ] **Step 7:** Configure post-event nurture: 3-email sequence (replay → takeaway → CTA). Write using `mgsd-email-sequence`.
  - Agent: MGSD-AGT-CNT-04
  - Output: `post-event-nurture.md`
  - **⏸ HUMAN CHECKPOINT: Approve post-event sequence**

- [ ] **Step 8:** Set up tracking: `event_registration`, `event_attended`, `event_replay_viewed` events in TRACKING.md.
  - Agent: MGSD-AGT-TRK-01
  - Output: tracking spec committed to TRACKING.md

- [ ] **Step 9:** Commit all artifacts: `mktg(community): [event-slug] — event assets complete`
  - Agent: MGSD-AGT-EXE-01
  - Output: committed artifacts, SUMMARY.md created

---

## Definition of Done / Validation

| Dimension | Criterion | Pass Condition |
|-----------|-----------|----------------|
| 1 — MIR Completeness | Gate 1 files complete | `mir-audit` returns `gate1.ready: true` |
| 2 — Variable Resolution | Zero `{{VARIABLE}}` tokens unresolved | `grep -r '{{[A-Z_]*}}'` returns empty |
| 3 — KPI Baseline | Attendee target documented | `ATTENDEE_TARGET` filled in MSP matrix |
| 4 — Tracking | 3 event tracking events defined | TRACKING.md has `event_registration`, `event_attended`, `event_replay_viewed` |
| 5 — Creative Compliance | Copy matches VOICE-TONE constraints | No prohibited words; tone-for-context matched |
| 6 — Budget Alignment | Event spend within budget cap | Stated budget ≤ `EVENT_AD_BUDGET` in MSP matrix |
| 7 — Linear Sync | Issue status reflects execution | `mgsd-linear-manager` sync returns 0 drift |
| Neuro Audit | B07 oxytocin framing present in registration copy | `MGSD-AGT-NEU-01` returns `PASSED` |

---

## Metadata

| Field | Value |
|-------|-------|
| Template ID | MGSD-ITM-COM-01 |
| Task Category | Community & Events |
| Labels | `mgsd`, `community`, `event`, `awareness` |
| Priority | High |
| Estimate | 8–12 story points |
| Parent Issue | Campaign Epic ID |
| Linear Title Format | `[MGSD] Community Event: {event_name} — {date}` |
