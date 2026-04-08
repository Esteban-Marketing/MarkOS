---
phase: "63"
name: "AI Copilot and Agentic CRM Operations"
created: "2026-04-04"
---

# Phase 63: AI Copilot and Agentic CRM Operations - Context

## Client Brief

MarkOS v3.3.0 cannot stop at explainable queues, suggestion-only draft help, and real outbound execution. After Phases 58 through 62 establish canonical CRM records, behavioral history, editable pipeline views, operator execution workspaces, and native outbound channels, Phase 63 must add real CRM copilots and approval-aware agent workflows that operate against those foundations rather than beside them.

This phase is not just a summarization layer and not a freeform autonomous AI sandbox. It must provide role-aware copilots for record and conversation summaries, draft generation, data enrichment, recommendation follow-through, and multi-step playbooks while preserving tenant safety, immutable AI-originated audit trails, approval gating for execution, and clear boundaries before the Phase 64 reporting closeout.

Phase 63 consumes the canonical CRM schema from Phase 58, the behavioral and identity signals from Phase 59, the multi-view workspace from Phase 60, the execution hub from Phase 61, the outbound surfaces and conversation state from Phase 62, and the tenant-bound agent run lifecycle plus approval gate foundation delivered in Phase 53. It should not replace those foundations with a detached copilot console, opaque autonomous behavior, or ungated outbound actions.

## Brand Constraints

- Voice: Reference `.markos-local/markos/MIR/VOICE-TONE.md` for operator-facing clarity, directness, and non-hype language.
- Visual: Preserve the existing MarkOS control-plane shell and CRM workspace language established in Phase 37 and extended through Phases 60 through 62; no separate chat-only product shell.
- Prohibited: No ungated autonomous outbound, no black-box agent behavior that cannot expose rationale and evidence, and no reporting-cockpit sprawl that belongs to Phase 64.

## Audience Segment

- Target ICP: Internal MarkOS operators plus future revenue teams spanning individual revenue operators, managers or team leads, tenant admins, and controlled central operators.
- Funnel stage: Decision and retention for the product itself; this is an operational AI-copilot phase rather than an acquisition-marketing phase.
- Audience size: Whole operator intelligence layer for v3.3.0, including tenant-scoped users and controlled cross-tenant oversight roles with approvals.

## Budget

- Phase budget: $0 external spend beyond existing model/provider usage and platform integrations; internal engineering and planning only.
- Allocated from: Core platform roadmap capacity under v3.3.0.

## Decisions

_Decisions captured during /gsd:discuss-phase 63_

| # | Decision | Rationale | Impact |
|---|----------|-----------|--------|
| D-01 | Phase 63 must serve individual revenue operators, managers or team leads, tenant admins, and controlled central operators in the first pass | The copilot layer needs to support both frontline execution and governance or oversight roles from the start | Planning cannot optimize only for a single seller seat or tenant-only reviewer persona |
| D-02 | Phase 63 must ship real first-pass AI surfaces for record summaries, conversation summaries, draft reply or outreach generation, data enrichment, recommendation follow-through, and multi-step playbooks | The roadmap and user selections require practical copilot value across understanding, writing, enrichment, and execution orchestration | Planning must cover both read-assist and action-assist behavior rather than a narrow summary sidebar |
| D-03 | Multi-step playbooks are in scope in the first pass, but they must run through the existing Phase 53 tenant-bound agent lifecycle and approval model | MarkOS already has a deterministic run engine and approval state machine; Phase 63 should consume it rather than inventing a second agent runtime | Planning should anchor copilot workflows to run envelopes, transition history, approval checkpoints, and run telemetry from the existing substrate |
| D-04 | Agent autonomy in Phase 63 is approval-gated only; no low-risk autonomous execution path is allowed in the first pass | The user wants real agent workflows, but still wants strong governance and no ungated autonomous behavior | Planning should assume human approval before execution-capable runs apply mutations or operational side effects |
| D-05 | Approved Phase 63 agent runs may create or assign tasks, write summaries or notes to CRM, write enrichment fields, and apply safe stage or owner mutations in the first pass | These are the concrete CRM actions the user wants copilots to assist and execute once approved | Planning must include explicit bounded mutation sets and audit lineage for AI-originated writes |
| D-06 | Phase 63 must not launch ungated autonomous outbound actions even though it can prepare drafts, recommendations, or approval packages around outbound work | Phase 62 owns real outbound execution and the user explicitly excluded ungated autonomous outbound here | Planning should allow draft generation and action packaging while preserving approval and channel policy boundaries before any outbound side effects |
| D-07 | Recommendation execution workflows should convert AI guidance into accountable work or safe CRM state changes rather than remaining suggestion-only | By this phase, the product should advance from recommendation visibility into governed action assist | Planning should include one-click or one-approval pathways from copilot recommendations into tasks, notes, enrichment, or safe mutations |
| D-08 | Data enrichment in the first pass should cover missing fields, company or contact context, account intelligence, and health-signal completion grounded in CRM state | Enrichment needs to be operationally useful, not generic web-research output detached from records | Planning should model enrichment as record-aware, auditable, and approval-aware when it writes back persistent fields |
| D-09 | Conversation and record summaries must be first-class copilot outputs, grounded in CRM and outbound history rather than isolated LLM summaries | Operators need fast situational awareness once records, timelines, and conversations are already live in the CRM | Planning should use canonical CRM, timeline, and conversation seams as the grounding substrate for all summary surfaces |
| D-10 | Central operators are allowed a controlled cross-tenant oversight surface with approvals in the first pass | The user explicitly included central operators and selected cross-tenant oversight with approvals rather than tenant-only visibility | Planning must keep cross-tenant oversight tightly governed, explicit, and auditable instead of silently widening mutation reach |
| D-11 | AI-originated actions, summaries, enrichments, and playbook steps must remain role-aware, explainable, and auditable end to end | Copilot trust collapses if agents behave as black boxes or hide what they changed and why | Every copilot output should preserve rationale, source context, approval status, actor lineage, and run linkage |
| D-12 | Phase 63 stops short of the full reporting cockpit and milestone acceptance evidence owned by Phase 64 | The phase boundary must stay clean against attribution, dashboards, live verification, and final milestone closure work | Planning should focus on copilots and governed agent workflows, not reporting or acceptance proof sprawl |

## Discretion Areas

_Where the executor can use judgment without checkpointing:_

1. Exact composition of summary, draft, and enrichment surfaces, provided they stay grounded in canonical CRM and conversation context rather than generic chat flows.
2. Exact split between inline copilot affordances and broader playbook-run surfaces, provided both remain inside the MarkOS CRM shell.
3. Exact heuristics for when a proposed AI action becomes approval-worthy versus read-only draft output, provided Phase 53 approval semantics remain the enforcement mechanism.
4. Exact shape of controlled cross-tenant oversight for central operators, provided oversight remains explicit, permission-safe, and audit-complete.
5. Exact playbook sequencing logic, provided multi-step runs remain deterministic, explainable, and stop cleanly at approvals before side effects.

## Deferred Ideas

_Ideas surfaced but not in scope for this phase:_

1. Full reporting cockpit, attribution analysis, live verification, and milestone acceptance evidence owned by Phase 64.
2. Ungated autonomous outbound sending, sequence enrollment, or conversation execution.
3. Fully open-ended autonomous agents that can mutate CRM state without bounded action policies or approval checkpoints.
4. A detached copilot console that bypasses CRM record, timeline, queue, or conversation context.
5. Black-box AI behavior that cannot expose rationale, source context, run lineage, or approval history.

---

_Phase: 63-ai-copilot-and-agentic-crm-operations_
_Context gathered: 2026-04-04_
_Decisions locked: 12 (D-01 through D-12)_
