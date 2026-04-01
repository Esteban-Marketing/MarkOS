# Phase 36 Runbook: Beta Program Operations

## Purpose

Standardize how accepted intake submissions become active pilot clients with clear ownership, SLAs, and escalation.

## Lifecycle States

| State | Entry Trigger | Owner | SLA | Required Artifacts | Exit Criteria |
|---|---|---|---|---|---|
| Intake Accepted | `POST /submit` returns valid with slug/session metadata | Intake Ops Lead | Same business day | Intake payload, slug, validation output, Linear ticket links | Owner assigned and kickoff window confirmed |
| Kickoff Scheduled | Owner assignment complete | Pilot Manager | 48 hours | Kickoff agenda, stakeholder list, first objectives | Kickoff held with signed first-week plan |
| Activation In Progress | Kickoff completed | Pilot Manager + Channel Lead | 5 business days | Channel priority, first campaign brief, blockers list | First campaign launched or first artifact shipped |
| Active Pilot | First campaign artifact shipped | Pilot Manager | Weekly | Weekly KPI snapshot, blocker log, action register | Pilot remains active or is flagged at risk |
| At Risk | Two consecutive missed actions or KPI drop below threshold | Intake Ops Lead | 48 hours to intervention | Risk memo, recovery plan, escalation owner | Recovery plan accepted and actions resumed |
| Graduation / Exit | Pilot outcomes reviewed | Intake Ops Lead + Founder | End of pilot window | Outcome report, retention recommendation, next step | Pilot graduated, extended, or closed |

## Lifecycle Register

The canonical lifecycle register is [`36-LIFECYCLE-REGISTER.md`](36-LIFECYCLE-REGISTER.md) in this directory.
Update it every Monday during Pipeline Review and after each state transition.

Linear tickets created by Phase 29 (`MARKOS-ITM-OPS-03`) serve as the per-client audit trail.
The register is the aggregate view across all active pilots.

## Linear Ticket → Lifecycle State Mapping

Each accepted intake generates a Linear ticket (`MARKOS-ITM-OPS-03`). Progress that ticket through
the following statuses as the pilot advances through the lifecycle:

| Lifecycle State | Linear Ticket Status |
|---|---|
| Intake Accepted | In Progress |
| Kickoff Scheduled | In Progress |
| Activation In Progress | In Review |
| Active Pilot | In Review (non-terminal active maintenance state) |
| At Risk | Blocked |
| Graduation / Exit | Done (graduated) or Canceled (exit) |

Any state transition in the lifecycle register must be reflected in the corresponding Linear ticket
within one business day.

## Ownership Model

- Intake Ops Lead: triage, assign owner, enforce kickoff SLA.
- Pilot Manager: run client lifecycle, track actions, lead weekly follow-up.
- Channel Lead: deliver campaign work and unblock technical/content dependencies.
- Founder/PLG Owner: publish weekly build-in-public output and remove executive blockers.

## Role Assignment

Complete this table before the first Monday Pipeline Review.
If one person holds multiple roles, fill in the circular-escalation workaround row.

| Role | Assigned To | Notes |
|---|---|---|
| Intake Ops Lead | Esteban Ortiz / Superadmin | Week 1 owner assigned |
| Pilot Manager | Esteban Ortiz / Superadmin | Week 1 owner assigned |
| Channel Lead | Esteban Ortiz / Superadmin | Week 1 owner assigned |
| Founder / PLG Owner | Esteban Ortiz / Superadmin | PLG evidence packet and executive blocker removal |

**Single-person escalation workaround:** If Intake Ops Lead and Pilot Manager resolve to the same
person, the internal escalation step (48h → Intake Ops Lead) is replaced by a 72-hour calendar block.
If the issue is unresolved after two calendar days, it surfaces automatically as a visible miss
in Friday's KPI Closeout for Esteban to review as Founder.

## Intake-To-Activation Workflow

1. Intake accepted via Phase 34 pipeline.
2. Intake Ops Lead assigns Pilot Manager and due date.
3. Kickoff scheduled within 48 hours.
4. First campaign objective locked during kickoff.
5. Pilot enters active weekly operations cycle.
6. At-risk conditions trigger intervention path.

## Escalation Path

1. Operational blocker (>48h): Pilot Manager -> Intake Ops Lead.
2. Cross-team blocker (>72h): Intake Ops Lead -> Founder.
3. Client risk (missed commitments x2): immediate At Risk status + recovery plan.

## Weekly Artifacts Checklist

- Updated lifecycle state per active client.
- Action register with owner and due date.
- Blocker register with escalation owner.
- KPI snapshot from `36-METRICS.md`.
- PLG evidence packet for weekly publication.

## Kickoff Agenda Template

Use for all pilot kickoff calls. Target 45 minutes.

1. **Intro (5 min):** Who each person is, what success looks like for this pilot.
2. **First campaign objective (10 min):** Choose one channel and one goal metric for Week 1.
3. **First artifact (5 min):** What will be shipped before next check-in?
4. **Three actions before next check-in (10 min):**
   - Action 1: [task] — Owner: [name] — Due: [date]
   - Action 2: [task] — Owner: [name] — Due: [date]
   - Action 3: [task] — Owner: [name] — Due: [date]
5. **Blockers and dependencies (10 min):** What could stop Week 1? Who unblocks it?
6. **Next check-in (5 min):** Date, time, and format (async or call).

Exit criterion: all three actions have owners and due dates. First artifact named.

## Recovery Plan Template

Complete within 48 hours of an At-Risk trigger.

| Field | Value |
|---|---|
| Client Slug | |
| At-Risk Trigger | Two consecutive misses / KPI drop / other |
| Missed Commitments | List each overdue action with original due date |
| Root Cause | |
| Proposed Corrective Actions | 1. / 2. / 3. |
| Action Owner | |
| Due Date | |
| Success Criterion | What must be true in 7 days for the pilot to exit At-Risk? |
| Escalation Owner | |
| Reviewed By | |
| Review Date | |

## PLG Evidence Packet Schema

- Wins: 1-3 concrete progress outcomes from pilot work.
- Frictions: top blockers and remediation actions.
- Metrics delta: weekly movement for active pilots and time-to-first-campaign.
- Anonymized case snippet: one short before/after narrative.
- Next-week commitments: dated and owner-assigned.
