---
phase: 36
phase_name: Beta Program Operations
milestone: v2.4
milestone_name: Beta Client Onboarding
plan_created: "2026-04-01"
type: execute
wave: 1
depends_on:
  - 34-client-intake-sop-automation
  - 35-smart-one-command-deployment
files_modified:
  - .planning/phases/36-beta-program-operations/36-PLAN.md
  - .planning/phases/36-beta-program-operations/36-RUNBOOK.md
  - .planning/phases/36-beta-program-operations/36-METRICS.md
  - .planning/phases/36-beta-program-operations/36-CADENCE.md
  - .planning/STATE.md
  - .planning/ROADMAP.md
  - .planning/PROJECT.md
autonomous: true
requirements:
  - BETA-01
  - PLG-01
user_setup: []

must_haves:
  truths:
    - "Phase 34 intake automation is now treated as the entry gate for beta operations, not as the final milestone outcome."
    - "Every accepted intake is mapped to an explicit pilot lifecycle state with owner, next action, and due date."
    - "Weekly operating cadence exists with fixed agenda, KPI review, and blocker escalation path."
    - "A measurable path to 10 active pilot clients by 2026-04-30 is documented and tracked."
    - "Build-in-public cadence is operationalized with weekly output commitments tied to beta progress evidence."

  artifacts:
    - path: .planning/phases/36-beta-program-operations/36-RUNBOOK.md
      provides: "Operational playbook for intake-to-activation lifecycle"
      sections:
        - "Pilot stages (intake accepted -> kickoff -> activation -> weekly ops -> retention risk -> graduation)"
        - "Owner responsibilities and handoff rules"
        - "Escalation paths for blocked clients"
    - path: .planning/phases/36-beta-program-operations/36-METRICS.md
      provides: "Single source KPI sheet for beta operations"
      metrics:
        - "Intakes accepted"
        - "Kickoffs scheduled"
        - "Active pilots"
        - "Time-to-first-campaign"
        - "Weekly participation rate"
        - "At-risk pilot count"
    - path: .planning/phases/36-beta-program-operations/36-CADENCE.md
      provides: "Weekly rhythm and meeting contracts"
      contracts:
        - "Monday pipeline review"
        - "Wednesday client blocker clinic"
        - "Friday KPI + build-in-public closeout"

  key_links:
    - from: "onboarding/backend/handlers/submit.cjs"
      to: ".planning/phases/36-beta-program-operations/36-RUNBOOK.md"
      via: "accepted intake output drives pilot lifecycle entry"
      pattern: "accepted intake -> assign owner -> kickoff SLA timer starts"
    - from: ".planning/codebase/INTAKE-SOP.md"
      to: ".planning/phases/36-beta-program-operations/36-CADENCE.md"
      via: "SOP completion triggers weekly operations workflow"
      pattern: "intake complete -> include in Monday pipeline review"
---

# Phase 36: Beta Program Operations

## Objective

Execute the operational follow-through after Phase 34 so intake automation converts into active pilot accounts, consistent weekly execution, and visible progress toward 10 onboarded beta clients.

## Purpose

Phase 34 solved intake plumbing; this phase solves operational throughput. The work is explicitly operational: run the pipeline, reduce onboarding stall points, and maintain accountable cadence across pilot clients.

## Output

- A concrete operations runbook for beta pilot lifecycle management.
- A metrics contract and scorecard updated weekly.
- A fixed meeting cadence and escalation workflow.
- A tracked action path to BETA-01 and PLG-01 milestone outcomes.

## Duration

Target: 1 execution wave (7-10 days) to establish baseline operating rhythm, then ongoing weekly maintenance.

---

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/phases/34-client-intake-sop-automation/34-01-SUMMARY.md
@.planning/codebase/INTAKE-SOP.md
@onboarding/backend/handlers/submit.cjs

## Current Constraints

- Intake automation exists, but lifecycle ownership and weekly pilot rhythm are not yet standardized.
- BETA-01 outcome (10 active pilot clients) is not met.
- PLG-01 output cadence is not yet contractually tied to operations data.
- Team bandwidth is constrained; the process must minimize manual overhead.

## Planning Guardrails

- Do not expand installer/runtime scope in this phase.
- Reuse existing intake and Linear plumbing from Phases 29 and 34.
- Keep tracking lightweight and executable in weekly rhythm.
- Prioritize real pilot activation over documentation-only progress.

</context>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: Define pilot lifecycle states and ownership</name>
  <files>.planning/phases/36-beta-program-operations/36-RUNBOOK.md</files>
  <action>Define canonical lifecycle states for each beta client from accepted intake to active pilot and graduation. For each state, assign owner, SLA, required artifacts, and exit criteria.</action>
  <acceptance_criteria>
    - Every intake can be mapped to one lifecycle state.
    - Each state has a named owner role and SLA.
    - Blocked-state escalation path is explicit.
  </acceptance_criteria>
  <done>Ops team can run beta pipeline without ambiguous ownership handoffs.</done>
</task>

<task type="auto" tdd="false">
  <name>Task 2: Establish weekly operating cadence</name>
  <files>.planning/phases/36-beta-program-operations/36-CADENCE.md</files>
  <action>Create weekly meeting contracts with agenda templates and mandatory outputs. Include Monday pipeline review, Wednesday blocker clinic, and Friday KPI closeout + build-in-public sync.</action>
  <acceptance_criteria>
    - Three recurring operating moments are defined with owners and deliverables.
    - Each meeting has pre-read inputs and post-meeting outputs.
    - Escalation and decision logging are part of cadence.
  </acceptance_criteria>
  <done>Cadence is executable as a repeatable weekly system, not ad hoc coordination.</done>
</task>

<task type="auto" tdd="false">
  <name>Task 3: Implement KPI scorecard and targets</name>
  <files>.planning/phases/36-beta-program-operations/36-METRICS.md</files>
  <action>Define KPI table with baseline, weekly target, owner, and data source. Include conversion funnel from intake accepted to active pilot and risk indicators.</action>
  <acceptance_criteria>
    - KPI definitions are measurable and unambiguous.
    - Weekly target values and thresholds are documented.
    - At-risk client triggers are defined.
  </acceptance_criteria>
  <done>Team can objectively assess if v2.4 is on track for 10 active pilots.</done>
</task>

<task type="auto" tdd="false">
  <name>Task 4: Bind operations outputs to PLG evidence loop</name>
  <files>.planning/phases/36-beta-program-operations/36-RUNBOOK.md, .planning/phases/36-beta-program-operations/36-CADENCE.md</files>
  <action>Define how weekly beta operations produce build-in-public inputs (wins, blockers, metrics deltas, anonymized case snippets) and assign publication responsibility.</action>
  <acceptance_criteria>
    - Friday closeout includes a PLG content packet.
    - Content packet schema is fixed and repeatable.
    - Publication accountability is assigned.
  </acceptance_criteria>
  <done>PLG-01 becomes an operational byproduct of beta work rather than separate ad hoc effort.</done>
</task>

</tasks>

<verification>
Run a documentation integrity pass and confirm cross-links resolve:

- Ensure `36-RUNBOOK.md`, `36-METRICS.md`, and `36-CADENCE.md` exist and are referenced from ROADMAP and STATE context.
- Confirm no roadmap/state text still claims beta-ops is deferred.
</verification>

<success_criteria>
- Follow-on phase is explicit, concrete, and ready for execution.
- Ownership, cadence, and KPI tracking are defined for beta operations.
- v2.4 progression is tied to measurable pilot activation outcomes.
- PLG output is integrated into weekly operations rather than a separate track.
</success_criteria>

<output>
After completion, create `.planning/phases/36-beta-program-operations/36-01-SUMMARY.md`.
</output>

