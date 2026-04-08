---
phase: "61"
name: "Sales and Success Execution Workspace"
created: "2026-04-04"
---

# Phase 61: Sales and Success Execution Workspace - Context

## Client Brief

MarkOS v3.3.0 cannot stop at a flexible CRM workspace with editable records and pipeline views. After Phase 60 establishes the underlying multi-view workspace, Phase 61 must turn that workspace into an operator execution layer for lead qualification, deal progression, account management, and customer-success workflows with visible next-best-action guidance.

This phase is not a generic dashboard and not the outbound delivery layer. It must give revenue operators a concrete execution hub where recommendations, risk cues, prioritized queues, and task orchestration are surfaced directly against canonical CRM records without bypassing the Phase 58 ledger or the Phase 60 workspace model.

Phase 61 consumes the canonical CRM schema from Phase 58, the behavior and identity history from Phase 59, and the editable multi-view workspace from Phase 60. It should not replace those foundations with a disconnected inbox, a shadow task app, or premature autonomous AI behavior.

## Brand Constraints

- Voice: Reference `.markos-local/markos/MIR/VOICE-TONE.md` for operator-facing clarity, directness, and non-hype language.
- Visual: Preserve the existing MarkOS control-plane shell, semantic token system, and workspace design language established in Phase 37 and extended in Phase 60; no parallel execution UI system.
- Prohibited: No outbound send initiation owned by Phase 62, no autonomous copilot or agent workflow behavior owned by Phase 63, no reporting-cockpit sprawl owned by Phase 64, and no recommendation system that cannot explain why an action is suggested.

## Audience Segment

- Target ICP: Internal MarkOS operators plus future revenue teams spanning SDR/lead qualification, AEs/deal owners, account managers, customer-success and renewal managers, managers or team leads, and tenant-level operators or admins.
- Funnel stage: Decision and retention for the product itself; this is an operational CRM execution phase rather than an acquisition-marketing phase.
- Audience size: Whole operator layer for v3.3.0; this phase defines how teams action work once CRM records, timelines, and views already exist.

## Budget

- Phase budget: $0 external spend; internal engineering and planning only.
- Allocated from: Core platform roadmap capacity under v3.3.0.

## Decisions

_Decisions captured during /gsd:discuss-phase 61_

| # | Decision | Rationale | Impact |
|---|----------|-----------|--------|
| D-01 | Phase 61 must serve SDR/lead qualification users, deal owners/AEs, account managers, customer-success and renewal managers, managers/team leads, and tenant operators/admins in the first pass | The execution layer needs to cover the full operator surface that works records after the workspace foundation exists | Planning cannot optimize only for a single seller persona or a single queue model |
| D-02 | Phase 61 owns workflow surfaces for lead, deal, account, and customer-success execution instead of focusing only on sales opportunities | The milestone goal is revenue CRM and customer intelligence, not a sales-only cockpit | Execution queues, recommendations, and task logic must span pre-sale and post-sale workflows |
| D-03 | Next-best-action in Phase 61 must include recommendation cards, risk flags, and prioritized task queues in the first pass | Operators need explicit action guidance and urgency ordering once the workspace becomes editable | Planning should include a recommendation layer and queue-ranking logic rather than only passive record views |
| D-04 | One-click task creation from recommendations is in scope for Phase 61 | Recommendations need a direct path into accountable work without waiting for later automation phases | The execution workspace should create or assign tasks directly against CRM records |
| D-05 | One-click safe record mutations are in scope when they remain within the canonical CRM workspace boundary | Operators need to advance workflow state from the execution surface without bouncing through separate CRUD screens | Planning should support safe state changes such as stage, owner, priority, or status mutations through governed paths |
| D-06 | Generated outbound drafts may appear only as draft suggestions in Phase 61 and must not trigger sends, sequences, or channel execution | The user wants draft help visible early, but Phase 62 still owns outbound execution and delivery telemetry | Recommendation surfaces may preview suggested copy or outreach ideas, but no send path or delivery workflow belongs in this phase |
| D-07 | The inbox-like activity center must include assigned tasks due or overdue, new inbound replies or touches, stage stalls or inactivity alerts, renewal or success-risk alerts, approval-needed items, and ownership-conflict or missing-data issues | The execution hub needs to collect real operator work signals rather than only showing a generic activity feed | Planning should treat the inbox as a triage and intervention surface, not a passive timeline clone |
| D-08 | The inbox-like activity center should support personal queues plus manager/team queues in the first pass | Individual contributors and managers both need to act on prioritized work, but the phase should avoid drifting into cross-tenant global operations | Queue architecture must handle assigned-to-me and team-review states while keeping tenant boundaries explicit |
| D-09 | Customer-success scope in the first pass must include onboarding/activation follow-through, adoption/health monitoring, renewal management, expansion prompts, and at-risk intervention workflows | Customer-success execution is part of the milestone and cannot be collapsed into generic tasking | Recommendation rules, queue categories, and record surfaces must support post-sale lifecycle states as first-class motions |
| D-10 | Phase 61 must layer on top of the Phase 60 record-detail and workspace model instead of creating a separate execution-only application shell | Operators need one coherent CRM surface where records, recommendations, tasks, and history remain connected | Planning should reuse workspace routes, detail hubs, and object context rather than fork them |
| D-11 | Recommendation and risk surfaces must remain explainable, role-aware, and auditable | Operators will not trust action guidance that behaves like a black box, especially before the formal AI copilot phase | Each next-best-action should preserve rationale, source signals, and permission-safe action options |
| D-12 | Phase 61 stops short of outbound initiation, autonomous agent execution, and reporting-cockpit expansion | The phase boundary must stay clean against Phase 62 outbound delivery, Phase 63 copilots, and Phase 64 reporting closure | Execution planning should focus on queues, guidance, task orchestration, and safe state transitions only |

## Discretion Areas

_Where the executor can use judgment without checkpointing:_

1. Exact recommendation-ranking and risk-prioritization heuristics, as long as they remain explainable, role-aware, and grounded in canonical CRM state.
2. Exact composition of the execution hub between queue surfaces, record-side panels, and detail-page integrations, provided the workspace remains coherent with Phase 60.
3. Exact mutation set allowed from recommendation surfaces, as long as they remain safe, auditable, and within the non-outbound boundary.
4. Exact manager/team queue presentation model, provided personal and team-review workflows remain explicit and tenant-safe.
5. Exact representation of draft suggestions, provided they stay suggestion-only and do not become covert outbound execution paths.

## Deferred Ideas

_Ideas surfaced but not in scope for this phase:_

1. Native email, SMS, and WhatsApp send initiation and delivery telemetry owned by Phase 62.
2. Autonomous copilots, generated summaries, and approval-gated agent workflows owned by Phase 63.
3. Full reporting cockpit, attribution analysis, and milestone closure dashboards owned by Phase 64.
4. Cross-tenant global operator queues or central admin control towers that exceed the tenant-scoped execution workspace.
5. Opaque black-box recommendation behavior without visible rationale or evidence.

---

_Phase: 61-sales-and-success-execution-workspace_
_Context gathered: 2026-04-04_
_Decisions locked: 12 (D-01 through D-12)_
