---
phase: 36
phase_name: Beta Program Operations
reviewer: GitHub Copilot (inline self-review — no external AI CLIs available)
model: Claude Sonnet 4.6
reviewed_at: 2026-04-01T23:59:59Z
plans_reviewed:
  - 36-PLAN.md
artifacts_reviewed:
  - 36-RUNBOOK.md
  - 36-METRICS.md
  - 36-CADENCE.md
  - 36-01-SUMMARY.md
review_mode: inline-single-reviewer
cli_audit: gemini=missing, claude=missing, codex=missing
---

# Cross-AI Plan Review — Phase 36: Beta Program Operations

> **Review Mode:** Inline single-reviewer (GitHub Copilot / Claude Sonnet 4.6).
> External AI CLIs (gemini, claude, codex) are not installed on this machine.
> Cross-AI independence guarantee is not met. Severity of concerns below accounts for
> the reduced independence — only findings with HIGH confidence under adversarial
> self-scrutiny are rated HIGH.

---

## Summary

Phase 36 delivers a complete operational framework skeleton for beta program management:
a lifecycle state table, three-meeting weekly cadence, and a measurable KPI scorecard.
The artifacts are internally consistent and well-structured. However, the phase has a
meaningful execution gap: no lifecycle register medium is defined, the funnel math does
not close to 10 active pilots by April 30 at current weekly targets, and the Linear
ticket system established in Phase 29 is not wired into the lifecycle state model.
The system is a sound process design but stops short of being runnable on Day 1 without
additional setup that is not described anywhere in the phase.

---

## Strengths

- **Lifecycle state table is comprehensive.** Six states with entry trigger, owner, SLA, required artifacts, and exit criteria is the right level of specificity for an operations runbook. Each state is independently actionable.
- **Escalation path is tiered and concrete.** 48h → Ops Lead, 72h → Founder, two misses → At Risk. No ambiguity about when to escalate.
- **KPI targets are time-bound and measurable.** All six KPIs have owner, data source, weekly target, and month-end target. The reporting contract (value + delta + root cause + corrective action) is exactly right for a weekly cadence.
- **Three-meeting cadence separates concerns correctly.** Monday = pipeline state, Wednesday = blockers, Friday = KPIs + PLG. No meeting is trying to do everything.
- **PLG evidence packet schema is specific.** Five slots (Wins, Frictions, Metrics delta, Anonymized case snippet, Next-week commitments) are concrete enough to write from without a rubric.
- **Phase boundary is clean.** Phase 36 reuses Phase 34 intake automation and Phase 29 Linear tickets without reimplementing either. The key-links in 36-PLAN.md frontmatter correctly references the correct entry trigger (`POST /submit`).
- **INTAKE-SOP.md link is valid.** The plan references `.planning/codebase/INTAKE-SOP.md` and the file exists with complete flow documentation.

---

## Concerns

### HIGH — No lifecycle register medium is defined

**Concern:** `36-METRICS.md` lists "Lifecycle register" as the data source for Kickoffs
Scheduled, Active Pilots, and Weekly Participation Rate. `36-RUNBOOK.md` references the
"Weekly Artifacts Checklist" which includes "Updated lifecycle state per active client."
Neither document defines where the lifecycle register lives (Linear board, Markdown file,
spreadsheet, Notion). Without a defined home, the Intake Ops Lead on Monday morning has no
register to update, and the Friday KPI closeout has no reliable source of truth to pull from.

**Impact:** The entire metrics system depends on this missing artifact. If different team
members use different tracking tools, the scorecard data will be inconsistent.

**Suggested fix:** Add a `36-LIFECYCLE-REGISTER.md` stub (or a clear pointer to a Linear
board or template) to give the operations cadence a concrete start file.

---

### HIGH — BETA-01 funnel math does not close to 10 pilots by April 30

**Concern:** The Active Pilots KPI target is "+2 net per week" with a month-end goal of 10.
Four weeks × +2 = 8 — already two pilots short, assuming perfect execution from Day 1
(no ramp week). Running the funnel: 3 intakes/week × 4 weeks = 12 accepted. At 85%
kickoff conversion = 10.2 kickoffs. At 80% activation = 8.2. At 75% active = 6.15.
**The documented funnel produces ~6 active pilots, not 10, by April 30.**

Additionally, the baseline for all KPIs is 0 and this is Week 1 — there is no
pipeline already in motion. Reaching 3 intakes in Week 1 starting from zero requires
active outreach or an existing waitlist, neither of which is described in this phase.

**Impact:** BETA-01 is the v2.4 milestone outcome. If the math doesn't close, the milestone
will be missed without any documented early-warning mechanism.

**Suggested fix:** Either (a) revise the weekly intake target upward (e.g., ≥5/week to
create headroom), or (b) add a milestone risk note explicitly acknowledging that 10 pilots
requires above-target conversion rates, and set a Week 2 checkpoint at which to flag the
miss trajectory.

---

### MEDIUM — Linear tickets from Phase 29 are not wired into lifecycle state tracking

**Concern:** Phase 29 wired `POST /submit` to create two Linear tickets:
`MARKOS-ITM-OPS-03` (Intake Received) and `MARKOS-ITM-INT-01` (Data Quality Check).
These tickets already exist in Linear when a client submits. The RUNBOOK lifecycle Stage 1
(Intake Accepted) triggers a parallel process, but does not reference these tickets, does
not specify which Linear board/project to use for lifecycle state progression, and does not
describe how the "lifecycle register" (referenced in METRICS) maps to or is updated from
Linear states.

**Impact:** Team members using Linear may maintain lifecycle state in Linear ticket status;
others may use a separate tracker. Both will diverge within two weeks.

**Suggested fix:** Add a sub-section to 36-RUNBOOK.md specifying: "Linear as lifecycle
register — intake ticket `MARKOS-ITM-OPS-03` progresses through status [Intake Accepted
→ Kickoff Scheduled → Active Pilot → Graduated] as the canonical lifecycle state."

---

### MEDIUM — Owner role model assumes multi-person team but project may be 1-2 people

**Concern:** The RUNBOOK defines four distinct owner roles: Intake Ops Lead, Pilot Manager,
Channel Lead, and Founder/PLG Owner. PROJECT.md references "Esteban personal brand" as PLG
owner, implying this is an early-stage company likely running with 1-3 people. If Esteban
holds 3 of these 4 roles simultaneously, the escalation chain in the runbook ("Pilot Manager
→ Intake Ops Lead" and "Intake Ops Lead → Founder") becomes circular or meaningless.

**Impact:** Escalation paths that point to the same person don't provide the resolution
mechanism they're intended to. Monday/Friday meetings become a solo review with no
accountability check.

**Suggested fix:** Add a role assignment table to RUNBOOK.md that maps current team
members to roles (even if one person holds multiple). Where one person holds both sides of
an escalation, substitute the rule with a third-party escalation trigger (e.g., calendar
block, external advisor notification).

---

### MEDIUM — At-Risk recovery plan has no template

**Concern:** The "At Risk" lifecycle state requires a "Recovery Plan" as a required artifact,
but no template or structure for a recovery plan is defined anywhere in Phase 36. The Ops
Lead generating their first recovery plan has no starting point.

**Impact:** Recovery plans produced ad hoc will vary in quality and completeness. Missing
a structured intervention increases the probability that At-Risk pilots stay stuck.

**Suggested fix:** Add a "Recovery Plan Template" section to 36-RUNBOOK.md with fields:
client name, risk type, missed commitments, proposed corrective actions, owner, due date,
success criterion.

---

### MEDIUM — Kickoff meeting has no agenda template

**Concern:** The RUNBOOK states kickoff requires a "kickoff agenda" and "first-week plan"
as artifacts, and exit criteria include "kickoff held with signed first-week plan." No agenda
template or first-week plan template is provided. A Pilot Manager running their first full
kickoff will improvise, and the outputs will not be consistent across pilots.

**Impact:** Inconsistent kickoff quality is a leading indicator of variable pilot performance
and is one of the primary conversion drivers (Kickoff Scheduled → Activation).

**Suggested fix:** Add a "Kickoff Agenda Template" section to RUNBOOK.md (15 minutes max to
draft; it only needs: intro, first objective, first campaign focus, 3 actions before next
check-in, owner/due dates for each).

---

### LOW — PLG-01 content standard is not specified

**Concern:** `36-CADENCE.md` Friday output includes "Published/queued LinkedIn update" and
the PLG packet schema is defined in RUNBOOK.md. However, no minimum content quality standard,
publication frequency (weekly? bi-weekly?), or LinkedIn publishing tool/channel is defined.
The packet schema is a content prompt, not a production standard.

**Impact:** PLG-01 ("build-in-public LinkedIn content sequence launched") will remain
subjective without a minimum bar. The phase summary claims PLG is "operationalized" but
a LinkedIn post cadence that runs for one week and stalls is not operationalized.

**Suggested fix:** Add a "PLG Content Standard" sub-section to CADENCE.md or RUNBOOK.md:
minimum one post per week, in the PLG evidence packet format, tagged to a specific LinkedIn
handle, posted or queued by Friday EOD. Add a failure condition: if no post ships in a given
week, it counts as a cadence miss and is logged in Wednesday's blocker clinic.

---

### LOW — Weekly scorecard update has no format template

**Concern:** METRICS.md specifies the weekly reporting contract ("KPI value, delta, root
cause for misses, corrective action with owner/date") but provides no fill-in-the-blanks
table format. Each Friday, the person updating the scorecard must interpret the contract
and produce their own format.

**Impact:** Low. The contract is clear enough to follow. But adding a weekly snapshot table
directly in METRICS.md (or a linked `36-WEEKLY-LOG.md`) would reduce Friday friction and
make the historical trace trivially readable.

**Suggested fix (optional):** Add a "Weekly Snapshot Table" at the bottom of METRICS.md
with one pre-filled header row and an example blank week row.

---

## Risk Assessment

**Overall: MEDIUM**

Phase 36 succeeds at defining the operational framework for beta program management.
The lifecycle model, cadence, and KPI structure are solid and are the right artifacts to
have at this point in v2.4 execution. The risk is not in the quality of the process design
— it's in the execution gap between "process documented" and "process runnable."

The two HIGH findings (missing lifecycle register and BETA-01 funnel math that doesn't
close) are actionable before Phase 37 begins. The three MEDIUM findings can be addressed
within the first week of operations as running protocol. The two LOW findings can defer
to Phase 37 or 38 execution.

**Not a blocking risk for Phase 37.** Campaign activation can begin while the MEDIUM/LOW
gaps are backfilled. Both HIGH gaps should be resolved before the first Monday Pipeline
Review fires.

---

## Suggested Pre-Phase-37 Actions

| Priority | Action | Owner | Target |
|---|---|---|---|
| HIGH | Define lifecycle register location (Linear board or `36-LIFECYCLE-REGISTER.md`) | Ops Lead | Before first Monday Pipeline Review |
| HIGH | Revise `36-METRICS.md` weekly intake target or add BETA-01 risk memo | Founder | Before first Friday KPI Closeout |
| MEDIUM | Add role↔person assignment table to `36-RUNBOOK.md` | Founder | Week 1 |
| MEDIUM | Add recovery plan template to `36-RUNBOOK.md` | Ops Lead | Week 1 |
| MEDIUM | Add kickoff agenda template to `36-RUNBOOK.md` | Pilot Manager | Before first kickoff |
| LOW | Add PLG content standard (1 post/week, Friday EOD) to `36-CADENCE.md` | Founder | Week 1 |

---

*Review produced inline by GitHub Copilot (model: Claude Sonnet 4.6). External CLI review
can be run once gemini, claude, or codex CLIs are installed.*

