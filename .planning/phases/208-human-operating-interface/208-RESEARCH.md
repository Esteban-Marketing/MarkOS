# Phase 208 Research - Human Operating Interface

## Primary research question

What shell-first interface model lets MarkOS become one operator cockpit now, while leaving evidence, connector, loop, and learning systems to later phases instead of hard-coding their unfinished substrate into the UI?

## Questions to answer

| Area | Question | Output |
|---|---|---|
| Shell posture | How should the current `(markos)` shell shift from control plane to operator cockpit? | Route and shell contract |
| Ownership | Which requirements belong to Phase 208 directly, and which should remain upstream or future translation gates? | Ownership boundary |
| Morning Brief | What fields make the default landing screen actionable instead of passive? | Brief contract |
| Task Board | What persisted task fields are required for source, owner, blockers, approval state, and run lineage? | Task Board contract |
| Approval Inbox | What preview, pricing, compliance, rejection, and placeholder evidence states are needed now? | Approval contract |
| Recovery Center | How should failure and blocked-work UI be defined before the connector substrate exists? | Recovery contract |
| Weekly Narrative | What narrative structure can exist now without pretending loop and learning outputs are already real? | Narrative contract |
| Future boundaries | How should later phases plug into the cockpit without reshaping the shell? | Future integration boundary matrix |

## Files inspected

- `app/(markos)/layout-shell.tsx`
- `app/(markos)/page.tsx`
- `app/(markos)/operations/page.tsx`
- `app/(markos)/operations/tasks/page.tsx`
- `app/(markos)/operations/tasks/task-types.ts`
- `app/(markos)/operations/tasks/task-machine.ts`
- `app/(markos)/operations/tasks/evidence-panel.tsx`
- `app/(markos)/settings/mcp/page.tsx`
- `app/(markos)/settings/billing/page-shell.tsx`
- `app/(markos)/admin/governance/page.tsx`
- `lib/markos/crm/execution.ts`
- `lib/markos/crm/copilot.ts`
- `.planning/phases/205-pricing-engine-foundation-billing-readiness/205-RESEARCH.md`
- `.planning/phases/206-soc2-type1-foundation/206-RESEARCH.md`
- `.planning/phases/207-agentrun-v2-orchestration-substrate/207-RESEARCH.md`
- `.planning/V4.0.0-PHASE-TEST-REQUIREMENTS-MATRIX.md`
- `.planning/V4.0.0-CODEBASE-VAULT-DEEP-AUDIT.md`
- `.planning/phases/208-human-operating-interface/208-CONTEXT.md`
- `.planning/phases/208-human-operating-interface/208-REVIEWS.md`

## Ownership boundary

### Direct ownership

- `TASK-01..05`
- `QA-01..15`

### Upstream integrations, not primary ownership

- Phase 205 pricing posture and placeholder doctrine
- Phase 206 compliance and governance posture
- Phase 207 AgentRun lineage, pause/failure state, and task handoff substrate

### Future translation gates, not current dependencies

- Phase 209 evidence posture
- Phase 210 connector recovery substrate
- Phase 211 dispatch and measurement outcomes
- Phase 212 learning and performance-log outputs

## Current-code support

### 1. The shell and operations surfaces already exist

- `layout-shell.tsx`, `page.tsx`, and `operations/page.tsx` already give Phase 208 a real shell migration target.
- This means the phase should evolve the existing app rather than invent a separate cockpit product.

### 2. The task UI already has useful migration assets

- The current task surface already models evidence, retries, approvals, step state, current-step locking, and event history.
- The weakness is not surface shape; it is that the data is still fixture-driven and not yet a true operating queue.

### 3. Signal pages already hold reusable operator patterns

- MCP settings already exposes budget, sessions, revocation, and top-tool breakdowns.
- Billing settings already contains holds, invoice posture, and recovery language.
- Governance admin already acts like a control and evidence review surface.
- These are strong ingredients for the Morning Brief and Approval Inbox.

### 4. CRM execution already contains work-priority signals

- `lib/markos/crm/execution.ts` and `copilot.ts` already normalize due, overdue, approval-needed, inbound, stalled, risk, and ownership signals.
- Those patterns should be reused in task and brief contracts instead of being reinvented in UI-only language.

## Gaps

- No executable plan set exists yet; the current phase docs were still stubs before replanning.
- No validation contract exists for the phase.
- No stable route contract defines what belongs in the shell, what is mobile-critical, and what must stay a placeholder until later phases.
- No persisted Task Board contract exists for run/task/approval-backed work.
- No centralized Approval Inbox contract exists independent of later evidence and connector systems.
- No Recovery Center contract defines blocked-work visibility before the connector substrate arrives.
- No Weekly Narrative contract defines what is allowed now versus what must wait for later loop and learning phases.

## Recommendation

Phase 208 should be replanned as a six-wave executable phase with a Wave 0.5 shell-and-substrate gate at the front:

1. Hard-gate pricing, compliance, and AgentRun readiness from Phases 205-207.
2. Define shell and route contracts before any surface-specific contracts branch out.
3. Define Morning Brief, Task Board, and Approval Inbox contracts as real operator surfaces now.
4. Define Recovery Center and Weekly Narrative as shell contracts with explicit future translation boundaries.
5. Treat evidence, connectors, loop measurement, and learning as later integrations instead of hidden current dependencies.

## Domain 0 - Upstream readiness and architecture lock

Phase 208 should depend on Phases 205-207 in practice, so Plan 01 should create a Wave 0.5 gate that checks:

- pricing placeholder and approved-pricing posture exist from Phase 205
- compliance and approval-risk posture exist from Phase 206
- AgentRun lineage, failure, and task-routing substrate exist from Phase 207

The architecture lock should reject unsafe shortcuts such as:

- `second dashboard shell`
- `desktop-only approval`
- `future-phase data assumption`
- `hidden rejection reason`

## Domain 1 - Shell and mobile route strategy

Recommended `SurfaceRouteContract` fields:

- `surface_id`
- `route`
- `surface_family`
- `default_role`
- `navigation_label`
- `mobile_priority`
- `placeholder_policy`
- `source_dependencies`
- `created_at`
- `updated_at`

Recommended `surface_family` literals:

- `morning_brief`
- `task_board`
- `approval_inbox`
- `recovery_center`
- `weekly_narrative`

Recommended `mobile_priority` literals:

- `critical`
- `secondary`
- `desktop_only`

Approvals, Morning Brief, and quick-task routes should never be `desktop_only`.

## Domain 2 - Morning Brief contract

Recommended `MorningBriefItem` fields:

- `brief_item_id`
- `tenant_id`
- `section`
- `title`
- `reason`
- `urgency`
- `next_action_type`
- `source_type`
- `source_id`
- `owner_role`
- `owner_id`
- `status`
- `upstream_dependency`
- `placeholder_state`
- `created_at`
- `updated_at`

Recommended `section` literals:

- `urgent_approvals`
- `run_failures`
- `pricing_risks`
- `compliance_alerts`
- `top_opportunities`
- `recent_wins`
- `future_recovery_placeholder`
- `future_evidence_placeholder`

The brief should show operator-ready sections now while using placeholder states for future evidence and connector panels.

## Domain 3 - Persisted Task Board contract

Recommended `TaskBoardItem` fields:

- `task_id`
- `tenant_id`
- `source_type`
- `source_id`
- `priority`
- `owner_role`
- `owner_id`
- `status`
- `due_at`
- `approval_required`
- `evidence_status`
- `agent_run_id`
- `chain_id`
- `pricing_context_ref`
- `blocked_by`
- `created_at`
- `updated_at`

Recommended `priority` literals:

- `urgent`
- `high`
- `normal`
- `low`

Recommended `status` literals:

- `queued`
- `in_progress`
- `blocked`
- `awaiting_approval`
- `done`

This contract should unify work now without assuming EvidenceMap, connector installs, or learning outputs already exist.

## Domain 4 - Approval Inbox contract and blocker states

Recommended `ApprovalItem` fields:

- `approval_item_id`
- `tenant_id`
- `mutation_family`
- `preview_ref`
- `brand_score`
- `compliance_status`
- `pricing_status`
- `evidence_status`
- `cost_estimate_ref`
- `decision_options`
- `rejection_reason_required`
- `agent_run_id`
- `task_id`
- `created_at`
- `updated_at`

Recommended `mutation_family` literals:

- `content_publish`
- `social_reply`
- `social_post`
- `email_send`
- `crm_mutation`
- `billing_correction`
- `support_reply`
- `price_change`
- `connector_action_placeholder`

Recommended `evidence_status` literals:

- `not_required`
- `waiting_phase_209`
- `ready`
- `blocked`

Phase 208 should centralize the approval surface now, but evidence-specific safety should remain an explicit Phase 209 translation gate rather than an invisible UI assumption.

## Domain 5 - Recovery Center and impacted-work visibility

Recommended `RecoveryItem` fields:

- `recovery_item_id`
- `tenant_id`
- `failure_family`
- `status`
- `impact_scope`
- `blocked_run_ids`
- `blocked_task_ids`
- `owner_role`
- `next_action`
- `translation_gate`
- `created_at`
- `updated_at`

Recommended `failure_family` literals:

- `provider_failure`
- `billing_hold`
- `webhook_delivery`
- `run_blocker`
- `connector_placeholder`

Recommended `translation_gate` literals:

- `none`
- `phase_210`

That lets Phase 208 define the operator experience now while leaving connector-specific substrate to Phase 210.

## Domain 6 - Weekly Narrative and future integration boundaries

Recommended `WeeklyNarrative` fields:

- `narrative_id`
- `tenant_id`
- `time_window`
- `wins`
- `risks`
- `blocked_work`
- `operator_decisions`
- `next_actions`
- `placeholder_sections`
- `created_at`
- `updated_at`

Recommended `placeholder_sections` literals:

- `phase_209_evidence`
- `phase_210_connector`
- `phase_211_loop`
- `phase_212_learning`

The future integration boundary matrix should explicitly map:

- `evidence_posture` -> `phase_209`
- `connector_recovery` -> `phase_210`
- `dispatch_outcomes` -> `phase_211`
- `learning_suggestions` -> `phase_212`

Every row should use the status `future_translation_gate`, not imply current delivery.

## Validation architecture

The phase needs a `208-VALIDATION.md` that covers:

- Wave 0.5 upstream readiness and architecture lock
- shell route and mobile-priority policy
- Morning Brief section and empty-state contracts
- Task Board record and grouping contracts
- Approval Inbox item and blocker-state contracts
- Recovery Center failure and impacted-work contracts
- Weekly Narrative contract and future integration boundary matrix

## Risks

- If Phase 208 re-owns evidence, connector, loop, or learning systems, later phases can look optional even though the cockpit still depends on them.
- If shell and route contracts are vague, future phases can keep reshaping navigation and operator trust will erode.
- If mobile-critical surfaces are not explicit now, the interface can look complete while core operator actions still break in reactive contexts.
- If approval and recovery UI assumes finished future substrate, Phase 208 can ship a polished shell with structurally fake data dependencies.

## Phase implications

- Phase 209 should translate real evidence posture into the approval, brief, and narrative surfaces defined here.
- Phase 210 should translate connector failure and recovery substrate into the generic Recovery Center contract defined here.
- Phase 211 should translate dispatch and measurement outcomes into the Weekly Narrative structure defined here.
- Phase 212 should translate learning suggestions and performance logs into the later narrative and task follow-up structure defined here.

## Acceptance tests implied

- Shell route tests for single-cockpit posture and mobile-critical priorities
- Morning Brief tests for owner, urgency, reason, next-action, and placeholder sections
- Task Board tests for persisted record shape, grouping, and blocked/approval states
- Approval Inbox tests for rejection reason, pricing/compliance posture, and explicit evidence placeholders
- Recovery Center tests for blocked-work visibility and translation-gate handling
- Weekly Narrative tests for placeholder sections and future integration boundary rows
