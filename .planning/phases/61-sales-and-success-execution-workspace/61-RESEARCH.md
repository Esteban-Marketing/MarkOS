# Phase 61: Sales and Success Execution Workspace - Research

**Researched:** 2026-04-04
**Domain:** Sales and success execution hub, next-best-action guidance, prioritized queues, explainable risk surfaces, and safe recommendation-driven workflow actions
**Confidence:** HIGH (recommendations are grounded in the shipped Phase 46 operator task workspace, the Phase 58 canonical CRM schema and activity ledger, the Phase 51 IAM and tenant model, the locked decisions in `61-CONTEXT.md`, and the current placeholder state of CRM-facing app routes)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

### 1. Phase 61 must serve the full first-pass operator surface

Planning must cover SDR/lead qualification users, deal owners/AEs, account managers, customer-success and renewal managers, managers/team leads, and tenant operators/admins.

Implementation guidance:
- Do not optimize the execution workspace only for sales reps.
- Keep personal and team-review workflows explicit.
- Preserve tenant-safe role awareness across all queue and recommendation surfaces.

### 2. Phase 61 owns workflow surfaces across sales and success motions

The execution layer must span lead, deal, account, and customer-success workflows.

Implementation guidance:
- Do not narrow the phase to deal-stage nudges only.
- Support post-sale motions such as onboarding follow-through, adoption monitoring, renewal, expansion prompts, and at-risk intervention.
- Keep one coherent execution model rather than one queue system for sales and another for success.

### 3. Next-best-action must be concrete in the first pass

Phase 61 must include recommendation cards, risk flags, and prioritized task queues.

Implementation guidance:
- Recommendations must be explainable and tied to visible source signals.
- Risk surfaces must stay actionable rather than decorative.
- Queue ranking must reflect urgency and workflow context, not generic sorting only.

### 4. Operators must be able to act from the execution workspace

One-click task creation and safe record mutations are in scope in the first pass.

Implementation guidance:
- Allow recommendation-driven task creation.
- Allow safe mutations such as stage, owner, priority, or status changes where they stay inside the canonical CRM boundary.
- Do not bypass the Phase 58 activity ledger or Phase 51 permission model.

### 5. Draft help is allowed only as suggestion, not execution

Generated outbound drafts may appear only as draft suggestions in Phase 61.

Implementation guidance:
- No send initiation, no sequences, and no channel-delivery workflows belong in this phase.
- Draft suggestions should be visible as operator aids, not covert Phase 62 execution pathways.
- Keep clear distinction between suggestion artifacts and executable outbound actions.

### 6. The inbox-like activity center must be a real triage surface

The activity center must include due/overdue tasks, new inbound replies or touches, stage stalls/inactivity, renewal or success-risk alerts, approval-needed items, and ownership conflicts or missing-data issues.

Implementation guidance:
- Do not reduce the inbox to a passive activity feed.
- Personal and manager/team queues are both required in the first pass.
- Avoid cross-tenant or global operator control-tower scope.

### 7. Scope guardrails remain strict

This phase must not expand into:
- native email, SMS, or WhatsApp execution owned by Phase 62
- autonomous copilots or agent workflows owned by Phase 63
- reporting-cockpit and attribution closure owned by Phase 64
- opaque recommendation systems without rationale
- a disconnected execution shell that bypasses the Phase 60 workspace model

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CRM-04 | The system computes next-best action per lead, deal, and account using recency, stage, SLA risk, intent score, and open task context, while keeping execution approval-aware. | Recommends an explainable recommendation layer tied to canonical CRM state, queue-prioritization rules, visible rationale, approval-aware actions, and explicit risk categories across sales and success workflows. |
| CRM-06 | Human agents and AI agents can create tasks, draft outreach, update stages, append notes, and generate summaries, with immutable audit records for every AI-originated action. | Recommends task creation, safe record mutations, and draft suggestions in Phase 61 while preserving immutable activity lineage and reserving autonomous or channel-executing behavior for later phases. |
| REP-01 | Operators can view pipeline health, conversion, attribution, SLA risk, and agent productivity in one place without leaving the CRM. | Recommends an execution hub with inbox, queue, risk, and recommendation surfaces that complement Phase 60 record views and set up later reporting closure without building a separate dashboard product. |

</phase_requirements>

## Project Constraints (from repo state and current implementation)

- `.planning/STATE.md`, `.planning/ROADMAP.md`, and the phase artifacts remain the authoritative planning sources.
- Phase 46 already shipped an operator task-workspace pattern with a three-region layout, append-only event log semantics, and a `TaskStoreProvider`; Phase 61 should reuse that execution model where practical instead of inventing a separate interaction grammar.
- Phase 51 already locked tenant propagation, fail-closed authorization, and IAM v3.2 role handling; every queue, recommendation, and one-click action in Phase 61 must honor those same boundaries.
- Phase 58 already shipped `crm_tasks`, `crm_notes`, the append-only CRM activity ledger, and tenant-safe CRM API helpers; Phase 61 should extend those seams instead of introducing a parallel execution datastore.
- The current CRM-facing routes in the app are still mostly placeholder schema dumps, which means Phase 61 depends on Phase 60 to provide the real workspace shell it will layer onto.
- Existing queue-like UI patterns already exist in the billing reconciliation admin surface; those patterns are reusable for inbox and manager/team queues.

## Summary

Phase 61 should be implemented as a **tenant-scoped execution layer on top of the canonical CRM and the Phase 60 workspace**, not as a free-standing inbox app or an early AI copilot. The repo already has the right foundations to make this clean: a working task-workspace interaction model from Phase 46, canonical CRM task and note tables from Phase 58, an append-only CRM activity ledger, and a fail-closed tenant and IAM model from Phase 51.

The strongest implementation path is:

1. Reuse the existing task execution and queue-layout patterns to build an inbox-like execution hub rather than inventing new interaction primitives.
2. Add an explainable recommendation and risk layer that reads canonical CRM state, open task context, timeline signals, and ownership state instead of depending on speculative AI-only logic.
3. Make one-click actions real, but keep them bounded to task creation and safe CRM mutations that append durable activity evidence.
4. Support personal plus manager/team queues from the start so the workspace serves both individual execution and supervised intervention.
5. Allow draft suggestions to appear as recommendation artifacts while keeping all real channel initiation deferred to Phase 62.

This phase is therefore an **execution-hub + recommendation-layer + prioritized-queue + safe-mutation** problem. It is not an outbound-delivery phase, not an autonomous-agent phase, and not a reporting-cockpit phase.

## Competitive Landscape

Phase 61 is not competing on whether MarkOS can show another task list. It is competing on whether MarkOS can make the CRM itself actionable for operators without splitting work across CRM, ticketing, inbox, and guidance tools.

### Product-pattern comparison

| Pattern | What it gets right | What MarkOS should take | What MarkOS should avoid |
|--------|---------------------|--------------------------|---------------------------|
| HubSpot-style sales workspace | Actionable queues, task prompts, simple next steps, blended record and activity views | Recommendation cards and work queues directly tied to CRM objects | Softly opinionated actions that become opaque or difficult to audit |
| Salesforce-style task and activity consoles | Broad role coverage, escalations, account coverage, approval workflows | Support for managers, sellers, and success teams in one tenant-safe system | Enterprise sprawl, over-administered objects, and over-weighted score complexity too early |
| Gainsight-style success cockpit | Health/risk posture, renewal focus, intervention workflows | Post-sale execution cues such as adoption, renewal, and at-risk interventions | Success logic that becomes detached from the canonical CRM record layer |
| Outreach/Salesloft-style execution surfaces | Task prioritization, sequence-adjacent next steps, seller workflow acceleration | Urgency-ranked queues and visible rationale for what to do next | Channel execution ownership leaking into this phase before Phase 62 |
| Front/Superhuman-style inboxes | Fast triage and focus on what needs response now | Inbox-like grouping of actionable items rather than timeline noise | Making the workspace message-centric instead of CRM-record-centric |

### Strategic conclusion

MarkOS should position Phase 61 as:

- **More CRM-native than standalone sales-engagement or inbox tools**
- **More cross-role than seller-only next-step layers**
- **More explainable than black-box recommendation engines**
- **More action-oriented than passive multi-view CRM workspaces alone**

The winning design is an **explainable execution hub with personal and team queues, recommendation-driven actions, and durable CRM lineage for every meaningful move**.

## Audience Intelligence

The immediate audience for Phase 61 is internal MarkOS operators and future revenue teams who need the CRM to actively tell them what requires attention once canonical records, timelines, and multi-view workspace surfaces already exist.

### Primary operator needs

1. Know what needs attention now without manually combing through every record.
2. Understand why an account, deal, lead, or customer is being flagged.
3. Take the next safe action from the workspace without opening separate systems.
4. Escalate or intervene across team queues when assigned work stalls.
5. Support both pre-sale and post-sale motions from one coherent operator surface.

### Secondary implementation audience

1. Phase 61 planners who need a decomposition into recommendation logic, queue composition, mutation endpoints, and validation work.
2. UI implementers who need to know which queue and evidence-rail patterns already exist in the repo.
3. Later phases that will build outbound execution, AI copilots, and reporting on top of the execution hub rather than beside it.

### Audience implications for research

- Guidance must optimize for **clarity and trust**, not dense scoring theater.
- Queue design must optimize for **triage and intervention**, not exhaustive feed rendering.
- Recommendation actions must optimize for **bounded execution**, not autonomous behavior.
- Success workflows must optimize for **renewal and health visibility**, not only pipeline acceleration.

## Channel Benchmarks

These are planning heuristics for an operator execution hub layered onto a CRM workspace. They are validation targets for Phase 61, not statements about current production behavior.

| Metric | Industry Avg | Target |
|--------|--------------|--------|
| Actionable queue precision for top-ranked items | 60-75% heuristic in first-pass rule-based systems | >=85% of top 10 surfaced items judged action-worthy in validation fixtures |
| Recommendation rationale visibility | Often partial or hidden in seller-assist tools | 100% of surfaced recommendations include visible rationale and source-signal summary |
| One-click action success for authorized users | >=95% under healthy API/runtime conditions | >=99% |
| Personal plus team queue coverage | Often personal-first with manager views deferred | First-pass support for both personal and manager/team queue modes |
| Inbox noise ratio | Many activity-center surfaces show too many low-signal items | <20% low-signal items in seeded validation fixtures |
| Draft suggestion leakage into execution | Common product-boundary drift in engagement tools | 0 actual sends or sequence starts from Phase 61 surfaces |
| Risk-flag freshness | <=15 min heuristic in CRM-assist systems | <=5 min where based on canonical CRM/task/activity state |
| Audit completeness for recommendation-driven actions | Frequently inconsistent outside enterprise systems | 100% for task creation, safe record mutations, approvals, and draft-suggestion generation artifacts |

### Benchmark interpretation

- Precision matters more than quantity because low-signal queues destroy operator trust quickly.
- Rationale completeness matters because Phase 61 explicitly requires explainable guidance before the formal AI phase.
- Action reliability matters because recommendation surfaces are useless if one-click actions feel unsafe or flaky.
- Boundary discipline matters because draft suggestions and outbound execution must stay clearly separated.

## Recommended Approach

### 1. Build the execution hub on top of the existing Phase 46 task-workspace pattern

The repo already has a credible execution grammar in `app/(markos)/operations/tasks`: a left-side list or graph, a central action surface, and a right-side evidence rail backed by a context store. Phase 61 should reuse that structure for action queues, recommendation cards, and intervention detail instead of inventing a second execution model.

Recommended outcome:

- use a similar three-region layout for inbox/queue, selected work item or record context, and evidence/rationale rail
- introduce a dedicated execution store provider for queue filters, selected recommendation, selected record, and role-aware queue mode
- keep state persistent across workspace navigation so the execution hub feels like part of the Phase 60 CRM workspace rather than a detached module

### 2. Add an explainable recommendation and risk layer as data, not presentation-only heuristics

The repo has canonical CRM tasks and activity history, but no recommendation storage or query seam. Phase 61 should create one explicitly so next-best-action remains explainable, reviewable, and testable.

Recommended outcome:

- add a tenant-scoped recommendation model that stores recommendation type, target record, rationale, source signals, confidence or urgency, suggested actions, and expiration state
- keep recommendation generation grounded in recency, stage, SLA risk, intent score, open tasks, ownership state, and post-sale health signals as required by CRM-04
- treat risk flags as first-class recommendation or queue signals rather than styling-only labels
- preserve visible rationale for every surfaced action so operators can understand why it appeared

### 3. Reuse canonical CRM task and note primitives instead of creating a second workflow system

`crm_tasks` and `crm_notes` already exist and are tenant-safe. Phase 61 should treat them as the durable work objects behind recommendation-driven action, not as temporary placeholders.

Recommended outcome:

- recommendation-to-task flows should create linked `crm_tasks` directly against the underlying record
- safe record actions should reuse existing CRM mutation seams and append activity to the ledger
- notes and task changes should remain visible in record timelines to keep the execution hub and record hub coherent

### 4. Support personal and manager/team queues with explicit boundaries

The user locked both personal and manager/team queue coverage in the first pass, but not cross-tenant control-tower behavior. That means the queue model has to support two scopes without drifting into global operations.

Recommended outcome:

- personal queue mode for assigned-to-me tasks, recommendations, and alerts
- manager/team queue mode for supervised records, unowned work, stalled work, and intervention candidates within the same tenant
- queue tabs based on actionable categories such as due/overdue, new inbound, stalled, at-risk, approvals, and ownership issues
- avoid cross-tenant aggregation or system-operator views in Phase 61

### 5. Keep draft suggestions visible but non-executable

The user wants draft help to appear early, but execution belongs to Phase 62. The cleanest answer is to store or render draft suggestions as recommendation artifacts only.

Recommended outcome:

- allow recommendations to include suggested outreach copy or reply framing
- keep these artifacts clearly labeled as suggestion-only
- do not attach send buttons, sequence enrollment, or delivery-state transitions to Phase 61 surfaces
- make the later Phase 62 path consume or promote these suggestions when outbound execution exists

### 6. Make one-click actions real but bounded and auditable

Phase 61 is allowed to create tasks and apply safe record mutations. The repo already has `requireCrmTenantContext()`, `assertCrmMutationAllowed()`, and `appendCrmActivity()` patterns, so planning should use them directly.

Recommended outcome:

- add governed action endpoints for assignment, status or priority changes, stage nudges where appropriate, and recommendation-to-task creation
- append CRM activity for every meaningful action so the execution hub cannot mutate records silently
- preserve permission-aware behavior in the UI so roles see only the actions they are allowed to take
- keep approval-aware action hooks where certain recommended actions require review instead of direct execution

## Platform Capabilities and Constraints

### Existing capabilities to build on

1. **Task execution workspace already exists.** `app/(markos)/operations/tasks/page.tsx` and `task-store.tsx` provide a proven execution-surface pattern with context-backed state.
2. **CRM tasks and notes already exist.** `crm_tasks` and `crm_notes` provide durable, linked workflow objects against canonical CRM records.
3. **Append-only activity ledger already exists.** The CRM timeline can already carry task, note, and mutation evidence.
4. **Safe CRM mutation wrapper already exists.** `lib/markos/crm/api.cjs` already centralizes tenant checks, role enforcement, and activity appends.
5. **Queue-like UI precedent already exists.** The billing reconciliation page already demonstrates queue tabs, center detail, and right-side evidence surfaces.
6. **Tenant-aware layout and access denial state already exist.** `app/(markos)/layout.tsx` and `lib/markos/auth/session.ts` provide the shell and fail-closed context semantics.

### Current constraints and gaps

1. **No recommendation model exists yet.** The repo has no explicit `crm_recommendations` or equivalent seam for explainable next-best-action data.
2. **No manager/team queue aggregation exists yet.** `assigned_actor_id` exists on tasks, but no team-queue logic or manager-review model exists.
3. **No inbox activity normalization exists yet.** The activity ledger is append-only and broad; Phase 61 needs a curated actionable subset.
4. **No draft-suggestion storage path exists yet.** Suggestions will need an explicit artifact model that stays distinct from outbound execution.
5. **No safe action hub endpoints exist yet for execution surfaces.** Existing CRM CRUD patterns need to be extended for recommendation-driven actions.
6. **Current CRM-facing routes are still thin.** Phase 61 depends on Phase 60 producing a real workspace shell rather than placeholder pages.

### Architectural implication

Phase 61 should be primarily an **identify-prioritize-explain-act-audit** phase:

- identify what needs attention from CRM state and activity evidence
- prioritize work into personal and team-review queues
- explain why each item is surfaced
- act through bounded tasks and safe mutations
- audit every action back into the canonical CRM record history

That is the smallest architecture that satisfies CRM-04 and the Phase 61 scope without sliding into Phase 62 or Phase 63.

## Tracking Requirements

Phase 61 introduces a new layer of operator decision support, so it needs explicit instrumentation both for product adoption and for audit-quality lineage.

### Required workspace events

1. `crm_execution_queue_opened`
   - Properties: `tenant_id`, `queue_scope`, `queue_tab`, `actor_role`, `view_source`
2. `crm_recommendation_viewed`
   - Properties: `tenant_id`, `recommendation_id`, `record_kind`, `record_id`, `recommendation_type`, `queue_scope`
3. `crm_recommendation_action_taken`
   - Properties: `tenant_id`, `recommendation_id`, `action_type`, `record_kind`, `record_id`, `actor_role`
4. `crm_recommendation_dismissed`
   - Properties: `tenant_id`, `recommendation_id`, `dismiss_reason`, `actor_role`
5. `crm_execution_task_created`
   - Properties: `tenant_id`, `task_id`, `recommendation_id`, `record_kind`, `record_id`, `assignee_scope`
6. `crm_execution_safe_mutation_applied`
   - Properties: `tenant_id`, `record_kind`, `record_id`, `mutation_type`, `source_surface`, `actor_role`
7. `crm_draft_suggestion_viewed`
   - Properties: `tenant_id`, `recommendation_id`, `record_kind`, `record_id`, `draft_type`

### Tracking guidance

- Product telemetry for queue usage and recommendation adoption must remain separate from the CRM activity ledger.
- Actions that mutate canonical record state must also append CRM activity in the ledger.
- Recommendation-rationale telemetry must not leak sensitive content; identifiers and summary classes are sufficient.
- Queue-open and recommendation-view events should remain high-signal and avoid noisy hover or transient interaction spam.

## Risks and Pitfalls

1. **Inbox inflation.** If the execution hub surfaces too many low-signal alerts, operators will ignore the whole layer.
2. **Black-box recommendations.** If rationale is thin or hidden, next-best-action will be distrusted and Phase 63 will inherit a weak foundation.
3. **Phase-boundary leakage into outbound.** If draft suggestions become pseudo-send flows, Phase 61 will absorb Phase 62 accidentally.
4. **Detached execution model.** If queues and recommendations are built outside the record-detail and timeline model, the CRM will fragment into competing surfaces.
5. **Manager/team queue ambiguity.** If team-queue ownership rules are vague, work can become duplicated or invisible.
6. **Silent one-click mutations.** If safe actions do not append CRM activity, the audit trail and operator trust degrade immediately.
7. **Role-permission mismatch.** If recommendation surfaces offer actions the current role cannot take, the UI will feel deceptive or broken.
8. **Success-motion undercoverage.** If Phase 61 over-optimizes for lead or deal progression, renewal and health workflows will remain second-class despite the locked scope.

## Validation Architecture

Phase 61 should be validated as an execution system layered onto the CRM, not as a set of disconnected queue widgets.

### 1. Data and contract validation

- migration tests for recommendation, risk, queue-preference, or other new execution tables
- contract tests for recommendation queries, queue filters, and safe action endpoints
- tenant isolation tests for personal and manager/team queue visibility

### 2. Recommendation and rationale validation

- seeded-fixture tests proving recency, stage, SLA risk, intent, open-task context, and ownership state can all surface recommendations deterministically
- tests proving every surfaced recommendation includes rationale, source-signal references, and bounded actions
- tests proving draft suggestions render as suggestions only and cannot send or launch sequences

### 3. Mutation and audit validation

- tests proving recommendation-to-task creation writes `crm_tasks` correctly and appends CRM activity
- tests proving safe record mutations from execution surfaces append CRM activity and respect IAM gates
- tests proving unauthorized roles cannot trigger actions hidden or disabled by UI and rejected by API

### 4. Queue and cross-view coherence validation

- tests proving personal and manager/team queues return the right records and tasks under one tenant
- integration tests proving an item opened from the execution hub resolves to the same record detail and timeline context from Phase 60
- tests proving dismissing, acting on, or completing a recommendation updates the queue state coherently

### 5. Story and UI-state validation

- story coverage for queue tabs, recommendation cards, risk states, empty states, manager review states, and disabled action states
- role-aware UI tests for readonly, reviewer, manager, and tenant-admin behaviors
- layout tests proving the execution surface preserves the existing MarkOS control-plane and evidence-rail interaction pattern

### Success criteria for planning handoff

Planning should not consider Phase 61 research actionable until the execution plan explicitly covers:

- an explainable recommendation and risk model
- personal plus manager/team queue architecture
- recommendation-to-task creation and safe mutation endpoints
- non-executable draft suggestion handling
- record/timeline coherence with the Phase 60 workspace
- validation that proves both action quality and permission safety

## RESEARCH COMPLETE
