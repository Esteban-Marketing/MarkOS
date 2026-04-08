# Phase 63: AI Copilot and Agentic CRM Operations - Research

**Researched:** 2026-04-04
**Domain:** CRM-grounded AI copilots, approval-aware agent workflows, bounded CRM mutations, and controlled cross-tenant oversight
**Confidence:** HIGH (recommendations are grounded in the locked decisions in `63-CONTEXT.md`, the existing Phase 53 run lifecycle and approval engine, the Phase 58 CRM activity and mutation seams, the Phase 46/61 execution-workspace patterns, and the current absence of CRM-native copilot, recommendation, and enrichment runtime surfaces in the repo)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

### 1. Phase 63 must ship real CRM copilots across multiple operator roles

The first pass must support individual revenue operators, managers or team leads, tenant admins, and controlled central operators.

Implementation guidance:
- Do not optimize the phase only for a single-seat seller copilot.
- Keep tenant-scoped execution primary while allowing explicit, governed oversight for central operators.
- Preserve role-aware visibility and action boundaries throughout every copilot surface.

### 2. Phase 63 must cover both understanding and action-assist surfaces

The first pass must include record summaries, conversation summaries, draft reply or outreach generation, enrichment flows, recommendation follow-through, and multi-step playbooks.

Implementation guidance:
- Do not reduce the phase to a summary sidebar or generic chat prompt box.
- Keep outputs grounded in CRM records, timelines, conversations, and operator work context.
- Treat read-assist and action-assist as separate but connected product behaviors.

### 3. Multi-step playbooks must reuse the existing Phase 53 run lifecycle

Agentic workflows must run through the existing tenant-bound run engine and approval model rather than a new runtime.

Implementation guidance:
- Use run envelopes, transition history, approval checkpoints, and run telemetry as the base execution substrate.
- Do not invent a second state machine for copilot actions.
- Keep deterministic transition and idempotency guarantees intact for CRM-side effects.

### 4. Agent autonomy is approval-gated only in the first pass

No low-risk autonomous execution path is allowed in Phase 63.

Implementation guidance:
- Human approval remains required before execution-capable runs apply mutations or operational side effects.
- Read-only outputs can stay immediate, but persistent writes and action execution must route through explicit approval logic.
- Fail closed when policy or approval state is ambiguous.

### 5. Approved agent runs are bounded to a specific first-pass mutation set

The first pass may create or assign tasks, write summaries or notes to CRM, write enrichment fields, and apply safe stage or owner mutations.

Implementation guidance:
- Keep the allowed mutation set explicit and narrow.
- Tie every AI-originated write to actor lineage, approval state, and run linkage.
- Avoid widening into unbounded record edits, deletes, or ungated outbound actions.

### 6. Phase 63 must not introduce ungated autonomous outbound

It may prepare drafts, recommendations, and approval packages around outbound work, but actual execution remains bounded by the Phase 62 outbound controls.

Implementation guidance:
- Keep draft generation and follow-up planning in scope.
- Preserve provider, consent, and approval boundaries before any outbound side effect.
- Do not let playbooks silently enroll sequences or send messages.

### 7. Central operators may have controlled cross-tenant oversight with approvals

Cross-tenant visibility is allowed, but it must remain explicit, narrow, and auditable.

Implementation guidance:
- Treat oversight as a separately governed surface rather than as a silent privilege widening.
- Require explicit approvals for cross-tenant execution-capable actions.
- Preserve tenant attribution and evidence on every oversight action.

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AI-CRM-01 | AI copilots can generate summaries, stage rationale, next-step recommendations, risk flags, and draft outreach directly from CRM context. | Recommends CRM-grounded summary and draft surfaces powered by canonical record, timeline, conversation, and task context, with rationale and evidence preserved before any action. |
| AI-CRM-02 | Role-aware agent workflows can execute follow-up sequences, task creation, enrichment, and reporting with policy gates before externally visible actions. | Recommends approval-aware playbooks on the existing Phase 53 run lifecycle, bounded mutation contracts, explicit role policies, and fail-closed approval gates before persistent or externally visible side effects. |
| CRM-04 | The system computes next-best action per lead, deal, and account using recency, stage, SLA risk, intent score, and open task context, while keeping execution approval-aware. | Recommends recommendation packaging that converts CRM signals into explainable next steps, then routes any execution-capable follow-through through approval-aware task, note, enrichment, or safe stage/owner actions. |
| CRM-06 | Human agents and AI agents can create tasks, draft outreach, update stages, append notes, and generate summaries, with immutable audit records for every AI-originated action. | Recommends AI-originated summary, note, draft, enrichment, and bounded mutation flows that always retain immutable run, approval, and activity lineage in CRM-owned audit surfaces. |

</phase_requirements>

## Project Constraints (from repo state and current implementation)

- `.planning/STATE.md`, `.planning/ROADMAP.md`, and the phase artifacts remain the authoritative planning sources.
- `onboarding/backend/agents/run-engine.cjs` already provides the canonical run-state vocabulary, explicit transition validation, in-memory event storage, and side-effect idempotency patterns that Phase 63 should promote rather than replace.
- `onboarding/backend/agents/orchestrator.cjs` already bootstraps run envelopes with tenant, actor, correlation, provider-policy, and tool-policy metadata, confirming that agentic CRM workflows have a real execution substrate.
- `onboarding/backend/agents/approval-gate.cjs` already enforces immutable approval decision behavior and `awaiting_approval` guards, which is the right base for copilot mutation approval.
- `lib/markos/crm/api.cjs` already centralizes tenant-scoped CRM reads and mutations plus append-only activity writes, which means Phase 63 should write through canonical CRM seams rather than inventing side channels.
- `lib/markos/crm/timeline.ts` already reserves `agent_event` and `outbound_event` activity families, so the timeline truth boundary can absorb copilot and playbook evidence once the write path exists.
- `app/(markos)/operations/tasks` already demonstrates a three-region operator execution shell plus approval modal, but it is still task-MVP-shaped rather than CRM-copilot-shaped.
- `lib/markos/telemetry/events.ts` already includes agent-run close and provider-attempt events, but it lacks CRM-copilot-specific event names for summary generation, recommendation exposure, enrichment writeback, approval package creation, or playbook execution.
- `lib/markos/rbac/policies.ts` includes task and campaign actions but does not yet define Phase 63 action families for summary writeback, enrichment, recommendation execution, safe stage mutation, safe owner mutation, or cross-tenant oversight approval.
- Search across `app/**` and `lib/markos/**` shows draft and approval precedents in the Digital Agency plugin and task workspace, but no existing CRM-native `recommendation`, `copilot`, or enrichment execution surfaces in product code yet.

## Summary

Phase 63 should be implemented as a **CRM-grounded copilot and approval-aware playbook layer that sits directly on top of the existing Phase 53 run lifecycle and the canonical CRM ledger**, not as a detached chat workspace and not as a new autonomous runtime. The repo already has the right foundations: deterministic run envelopes, approval-state enforcement, append-only CRM activity history, tenant-safe mutation guards, and a proven operator execution-shell pattern. What it does not yet have is the CRM-native copilot product layer that turns those primitives into summaries, rationale, recommendations, drafts, enrichment actions, and governed multi-step playbooks.

The strongest implementation path is:

1. Reuse the Phase 53 run envelope, transition, and approval engine as the sole execution substrate for AI-assisted CRM workflows.
2. Ground every summary, draft, rationale, and recommendation in canonical CRM entities, timelines, outbound history, and open-task context rather than generic prompt context.
3. Separate read-only copilot outputs from write-capable playbooks, with approval packages required before bounded CRM mutations.
4. Extend RBAC, telemetry, and CRM activity lineage so every AI-originated action is role-aware, explainable, and queryable.
5. Introduce CRM-native inline and workspace surfaces for summaries, drafts, enrichment, and recommendation follow-through rather than a standalone copilot console.

This phase is therefore a **grounding + policy + bounded mutation + operator-surface + audit-lineage** problem. It is not a reporting-cockpit phase, not an ungated autonomous-outbound phase, and not a new-agent-runtime phase.

## Competitive Landscape

Phase 63 is not competing on generic LLM access. It is competing on whether AI assistance can operate natively inside the CRM with operator trust, bounded execution, and durable evidence.

### Product-pattern comparison

| Pattern | What it gets right | What MarkOS should take | What MarkOS should avoid |
|--------|---------------------|--------------------------|---------------------------|
| HubSpot-style CRM assistants | Inline summaries, email drafting, record-aware suggestions | Copilot outputs directly inside record and pipeline workflows | Shallow AI overlays that suggest actions without durable execution lineage |
| Salesforce Einstein / Revenue AI patterns | Stage rationale, risk flags, workflow suggestions, role-targeted views | Role-aware rationale and risk guidance anchored to CRM state | Enterprise sprawl that obscures what the AI actually changed |
| Gong / conversation-intelligence surfaces | Fast conversation summaries, signal extraction, follow-up prompts | Conversation-grounded summaries and action extraction tied to account history | Conversation intelligence detached from canonical record mutation flows |
| Outreach / Salesloft tasking plus AI assist | Playbooks, task follow-through, queue-linked drafting | Recommendation-to-task conversion and approval-aware follow-through | Seller-only assumptions that ignore success, admin, and oversight users |
| Chat-first agent shells | Flexible interaction and broad action intent capture | Optional copilot composition patterns for complex requests | Detached agent consoles that bypass CRM context, approval rails, and record lineage |

### Strategic conclusion

MarkOS should position Phase 63 as:

- **More CRM-grounded than generic chat copilots**
- **More approval-safe than autonomous revenue-agent claims**
- **More explainable than recommendation-only overlays**
- **More operational than summary-only conversation tools**

The winning design is a **record-aware and conversation-aware copilot layer whose outputs can become governed tasks, notes, enrichments, and safe CRM mutations through the existing run and approval substrate**.

## Audience Intelligence

The immediate audience for Phase 63 is the operator layer that appears only after the CRM, execution, and outbound foundations are already in place.

### Primary operator needs

1. Understand a record or conversation instantly without manually reading the full history.
2. Trust that recommendations and drafts are grounded in the CRM’s real state, not generic language-model guesses.
3. Turn AI guidance into accountable work or safe CRM changes without leaving the existing workspace.
4. Review and approve execution-capable AI actions with enough evidence to know what will change.
5. Retain clear audit lineage when AI writes notes, summaries, enrichment values, or safe status changes.

### Secondary implementation audience

1. Phase 63 planners who need decomposition into grounding, policy, workflow, telemetry, and UI work.
2. UI implementers who need to know where existing task and execution-shell patterns can be reused versus where CRM-native surfaces must be introduced.
3. Later reporting work in Phase 64 that will depend on copilot and playbook evidence landing in durable CRM-owned telemetry and activity streams.

### Audience implications for research

- Copilot design must optimize for **fast situational awareness with source accountability**, not generic assistant verbosity.
- Playbook design must optimize for **bounded follow-through**, not maximum autonomy.
- Cross-role design must optimize for **clear visibility and explicit approval boundaries**, not hidden privilege escalation.
- Audit design must optimize for **operator trust and later analysis**, not only successful completion.

## Channel Benchmarks

These are planning heuristics for a first-pass CRM copilot and agentic-operations layer. They are validation targets for Phase 63, not claims about current production behavior.

| Metric | Industry Avg | Target |
|--------|--------------|--------|
| Record summary grounding completeness | Often partial or opaque in CRM AI add-ons | 100% of summaries cite CRM-available context classes used: entity, timeline, tasks, conversation, outbound history where present |
| Recommendation explainability coverage | Frequently inconsistent across assistants | 100% of surfaced recommendations include rationale and evidence payloads |
| Approval coverage for execution-capable AI actions | Often mixed once tools add automation | 100% of persistent AI-originated writes and externally visible follow-through paths route through the correct policy and approval gate |
| AI-originated mutation audit completeness | Commonly fragmented across logs and UI state | 100% of AI-originated writes linked to run_id, actor, approval status, record, and activity entry |
| Summary or draft operator review latency | Often 5-15s in CRM assistants | <=5s p95 under healthy runtime conditions for record and conversation summaries or draft generation |
| Recommendation-to-action conversion path | Often suggestion-only in early CRM AI releases | One approval or one explicit operator action from recommendation to task, note, enrichment, or safe mutation |
| Cross-tenant oversight safety | Frequently over-broad in admin tooling | 0 known silent cross-tenant mutations; all oversight actions require explicit tenant attribution and approval evidence |
| Playbook replay safety under retries | Frequently under-specified | 0 duplicate durable mutations in redelivery or retry validation fixtures |

### Benchmark interpretation

- Speed matters, but trust and approval correctness matter more because a wrong AI mutation is more damaging than a slower draft.
- Explainability matters because Phase 63 is the first point where AI outputs are expected to cross from insight into governed action.
- Replay safety matters because the Phase 53 runtime already established idempotent side-effect expectations that CRM workflows must preserve.

## Recommended Approach

### 1. Reuse the Phase 53 run lifecycle as the only agent execution substrate

Phase 63 should treat `run-engine.cjs`, orchestrator envelope metadata, and the approval gate as first-class dependencies, not implementation inspiration.

Recommended outcome:

- define copilot and playbook runs as typed Phase 53 runs with CRM-specific intent metadata
- keep transition validation, approval pause points, and side-effect idempotency in the shared run substrate
- ensure CRM workflows never bypass the existing `awaiting_approval` and immutable decision model

### 2. Introduce a CRM grounding contract before deep UI work

The repo already has CRM entity, activity, and timeline seams, but it does not yet have a standard grounding bundle for AI outputs.

Recommended outcome:

- define a record-aware context assembly contract that can pull entity state, timeline activity, open tasks, stage information, and outbound conversation history into one bounded grounding object
- treat summaries, draft generation, stage rationale, risk flags, and recommendations as typed outputs over that shared grounding contract
- keep grounding sources explicit so the UI can expose evidence rather than only final prose

### 3. Split read-only copilot outputs from write-capable playbooks

Not every AI surface should incur approval overhead, but every persistent side effect must.

Recommended outcome:

- record summaries, conversation summaries, draft proposals, and recommendation previews can render immediately as read-only outputs
- actions that write notes, summaries, enrichment fields, tasks, or safe mutations create approval packages before commit
- multi-step playbooks should stage intended actions first, then pause for approval before durable execution steps

### 4. Define a narrow Phase 63 CRM mutation contract

The user already locked the first-pass mutation set; planning should formalize it into code-level action families.

Recommended outcome:

- add explicit action families for task creation or assignment, summary or note writeback, enrichment writeback, safe stage mutation, safe owner mutation, and cross-tenant oversight review
- route all writes through `lib/markos/crm/api.cjs` or directly adjacent canonical CRM handlers so append-only activity evidence remains centralized
- block deletes, bulk arbitrary edits, and outbound execution from the Phase 63 mutation contract

### 5. Build recommendation follow-through as governed packaging, not raw automation

Phase 61 already established explainable execution intent; Phase 63 should turn that into accountable follow-through.

Recommended outcome:

- convert next-best-action, risk, and draft guidance into packaged actions with clear rationale, affected records, and proposed mutations
- allow operators to accept into task creation, note writeback, enrichment updates, or safe stage or owner changes
- keep recommendation execution legible as a human-reviewed bridge from insight to action

### 6. Add CRM-native copilot surfaces inside existing workspace grammar

The task workspace and Digital Agency draft flows prove the repo can support evidence-forward operator surfaces, but CRM-native product surfaces still need to be introduced.

Recommended outcome:

- add inline copilot panels on record and conversation surfaces for summaries, rationale, risks, and draft proposals
- add a broader playbook-review surface using the existing queue or center or evidence grammar when actions span multiple steps or records
- avoid introducing a detached chat shell that competes with the CRM workspace model

### 7. Extend telemetry and activity lineage for copilot-specific evidence

The current telemetry vocabulary covers runs and task events, but not CRM copilot behavior.

Recommended outcome:

- add event families for summary generation, draft proposal generation, recommendation surfaced, recommendation accepted, playbook requested, approval package created, enrichment proposed, enrichment committed, and cross-tenant oversight reviewed
- map AI-originated persistent outcomes into CRM `agent_event` or adjacent canonical activity rows so the timeline can tell the full operational story
- preserve run-close evidence and provider-attempt telemetry from Phase 53 for every completed or rejected copilot workflow

## Platform Capabilities and Constraints

### Existing capabilities to build on

1. **Deterministic agent run states already exist.** `run-engine.cjs` already defines the canonical lifecycle and transition guard that Phase 63 needs.
2. **Approval semantics already exist.** `approval-gate.cjs` already encodes immutable decision behavior and `awaiting_approval` enforcement.
3. **CRM mutation and activity seams already exist.** `lib/markos/crm/api.cjs` already centralizes tenant-safe access and append-only activity writes.
4. **Timeline truth already anticipates agent and outbound history.** `lib/markos/crm/timeline.ts` already recognizes `agent_event` and `outbound_event` families.
5. **Execution-shell UI precedent already exists.** `app/(markos)/operations/tasks` already establishes a reusable operator review and evidence pattern.
6. **Draft and approval precedent already exists in product code.** The Digital Agency plugin already proves read-draft and approval telemetry patterns exist, even if they are not yet CRM-native.

### Current capability gaps Phase 63 must close

1. **No CRM-native copilot or recommendation surfaces exist yet.** Repo search found no current product code implementing CRM `copilot` or `recommendation` features.
2. **No Phase 63 RBAC actions exist yet.** `lib/markos/rbac/policies.ts` does not yet define action names for the user-locked mutation set.
3. **No CRM-copilot telemetry vocabulary exists yet.** `lib/markos/telemetry/events.ts` stops at task, plugin, and agent-run events.
4. **No canonical grounding contract exists yet.** CRM entity, task, conversation, and outbound context are available separately, but not packaged as one reusable AI context bundle.
5. **No cross-tenant oversight model exists yet.** The user locked it as in scope, but the repo does not yet expose a controlled oversight UI or policy seam.
6. **No durable copilot output storage model is obvious yet.** Research should assume explicit persistence for summaries, rationale snapshots, proposed enrichments, and approval packages rather than transient UI state only.

### Constraint implications

- Planning should front-load policy, grounding, and lineage before polishing AI UI affordances.
- Execution should reuse existing runtime and CRM primitives wherever possible to reduce trust-boundary drift.
- Cross-tenant oversight must be treated as a governance feature, not a convenience add-on.

## Tracking Requirements

Phase 63 should add tracking that makes copilot trust, approval correctness, and operator adoption measurable before Phase 64 reporting expands it.

### Required event coverage

1. Summary requested, generated, read, and accepted for writeback.
2. Draft requested, generated, revised, and approved for downstream execution packaging.
3. Recommendation surfaced, dismissed, accepted, or converted into a bounded action package.
4. Enrichment proposed, approved, committed, or rejected.
5. Playbook requested, staged, paused for approval, approved or rejected, resumed, completed, or failed.
6. Cross-tenant oversight viewed, filtered, and approved when an execution-capable action crosses tenant boundaries.

### Required payload dimensions

- tenant_id
- actor_id
- actor_role
- run_id
- record_kind and record_id
- conversation or thread reference when applicable
- action family
- approval status
- grounding source classes used
- outcome and reason code

### Tracking goals

- Measure whether copilots are being used for understanding only or actually converting into governed action.
- Detect approval friction and excessive rejection patterns that indicate weak packaging or weak grounding.
- Support later reporting and quality analysis without reconstructing AI behavior from provider logs.

## Risks and Pitfalls

### 1. Detached chat-shell drift

If Phase 63 ships as a generic AI console instead of a CRM-native layer, it will bypass the record, timeline, and evidence grammar established in earlier phases.

Mitigation:
- keep copilot entry points attached to records, conversations, queues, and playbook review surfaces

### 2. Silent policy widening

If Phase 63 adds convenient generic mutation actions instead of explicit bounded ones, approval and IAM guarantees will erode quickly.

Mitigation:
- add explicit Phase 63 action families and fail closed for unknown mutation classes

### 3. Recommendation theater

If recommendations remain explanation text without a governed conversion path, the phase will fail to deliver the action-assist promise.

Mitigation:
- package every actionable recommendation into a concrete, reviewable follow-through path

### 4. Approval fatigue

If every AI output requires approval, the system will become unusable; if too little requires approval, trust will collapse.

Mitigation:
- keep read-only outputs immediate and reserve approval for persistent or externally visible effects only

### 5. Cross-tenant oversight leakage

If central-operator features are bolted on without explicit tenant attribution and approval evidence, Phase 63 will create a dangerous privilege boundary.

Mitigation:
- require explicit oversight scopes, tenant labeling, and approval lineage on every cross-tenant action

### 6. Duplicate side effects under retries

CRM writes from playbooks will be especially damaging if retry or replay paths duplicate tasks, notes, or safe mutations.

Mitigation:
- inherit run-engine side-effect idempotency and validate it with CRM-specific replay fixtures

## Validation Architecture

Phase 63 validation should prove that copilot outputs are grounded, policies are fail-closed, and bounded actions remain immutable and replay-safe.

### Test layers

1. **Grounding contract tests**
   - verify record, timeline, task, and conversation context assembly is deterministic and tenant-scoped
   - verify missing context degrades gracefully without inventing unsupported facts

2. **Policy and approval tests**
   - verify each Phase 63 action family maps to explicit IAM roles
   - verify execution-capable actions cannot commit without `awaiting_approval` -> `approved`
   - verify unauthorized approval attempts deny-log correctly

3. **Run and replay safety tests**
   - verify playbook retries do not duplicate tasks, notes, enrichment writes, or safe mutations
   - verify rejected playbooks do not leak side effects

4. **CRM lineage tests**
   - verify AI-originated actions write canonical activity entries with run, actor, and approval lineage
   - verify summaries, notes, enrichments, and safe mutations remain visible in timeline or adjacent audit views

5. **UI workflow tests**
   - verify record and conversation copilot panels expose rationale and evidence
   - verify recommendation acceptance produces the correct approval package or direct non-persistent action path
   - verify cross-tenant oversight surfaces show explicit tenant attribution and approval status

### Success conditions for planning

- AI-CRM-01 is only considered covered when summaries, rationale, risk flags, recommendations, and draft outputs are grounded in CRM-owned context and reviewable before action.
- AI-CRM-02 is only considered covered when execution-capable playbooks run through the existing policy and approval substrate with immutable evidence and no duplicate durable effects.
- CRM-04 is only considered covered when next-best-action signals can become governed follow-through instead of remaining informational only.
- CRM-06 is only considered covered when every AI-originated write retains durable run and approval lineage inside canonical CRM-owned audit surfaces.

## Recommended Planning Shape

The cleanest Phase 63 execution breakdown is:

1. **Wave 1:** grounding contract, copilot output models, RBAC expansion, telemetry expansion, and CRM activity lineage for AI-originated actions
2. **Wave 2:** record and conversation copilot surfaces plus recommendation packaging and approval-package creation
3. **Wave 3:** bounded multi-step playbooks, cross-tenant oversight controls, replay-safe mutation execution, and direct phase validation closure

That sequence preserves the right dependency order: truth boundary first, operator surfaces second, governed playbooks last.
