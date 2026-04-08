---
phase: "62"
name: "Native Outbound Execution"
created: "2026-04-04"
---

# Phase 62: Native Outbound Execution - Context

## Client Brief

MarkOS v3.3.0 cannot stop at CRM records, execution queues, and suggestion-only draft help. After Phases 58 through 61 establish canonical CRM data, identity and behavioral history, editable workspace views, and an execution hub, Phase 62 must turn outbound activity into a first-class CRM-native capability with real delivery paths for email, SMS, and WhatsApp.

This phase is not a thin adapter layer and not just delivery logging. It must let operators execute one-off outbound actions, use reusable templates, run basic sequences/step cadences, schedule sends, support bulk/campaign-style outbound, and operate a real two-way conversation workspace while keeping channel consent, eligibility, and telemetry return paths explicit and tenant-safe.

Phase 62 consumes the canonical CRM schema from Phase 58, the tracking and attribution groundwork from Phase 59, the multi-view workspace from Phase 60, and the operator execution hub from Phase 61. It should not reduce outbound to a detached messaging tool or push real send behavior into a later phase under the guise of draft-only assistance.

## Brand Constraints

- Voice: Reference `.markos-local/markos/MIR/VOICE-TONE.md` for operator-facing clarity, non-hype language, and explicit operational wording.
- Visual: Preserve the existing MarkOS control-plane shell and CRM workspace language established in Phase 37 and extended through Phases 60 and 61; no parallel messaging product shell.
- Prohibited: No opaque consent bypasses, no hidden send behavior outside channel policy gates, no delivery telemetry that fails to land back in CRM timelines, and no autonomous agent execution that belongs to Phase 63.

## Audience Segment

- Target ICP: Internal MarkOS operators plus future revenue teams executing lead follow-up, opportunity progression, account communication, renewal outreach, and customer-success messaging inside the CRM.
- Funnel stage: Decision and retention for the product itself; this is an operational outbound-execution phase rather than an acquisition-marketing phase.
- Audience size: Whole operator communication layer for v3.3.0; this phase defines how teams actually contact leads, customers, and accounts from MarkOS.

## Budget

- Phase budget: $0 external spend beyond platform/integration usage; internal engineering and planning only.
- Allocated from: Core platform roadmap capacity under v3.3.0.

## Decisions

_Decisions captured during /gsd:discuss-phase 62_

| # | Decision | Rationale | Impact |
|---|----------|-----------|--------|
| D-01 | Phase 62 must ship real first-class outbound execution for Resend email, Twilio SMS, and Twilio WhatsApp in the first pass | The milestone requires native outbound capability rather than CRM records that still depend on external tools | Planning must include real adapter, policy, and telemetry work for all three channels |
| D-02 | All three channels must exist in the first pass, but email should ship with the deepest surface while SMS and WhatsApp can be narrower | Email is the broadest initial operational need, but the other channels still need to be real, not placeholders | Planning can intentionally sequence richer capability depth for email without dropping SMS/WhatsApp from first-pass scope |
| D-03 | Phase 62 must include one-off sends from records, simple reusable templates, basic sequences/step cadences, scheduled sends, bulk/campaign-style outbound, and a two-way conversation workspace | The user explicitly wants outbound to be an execution system, not just a send button or logging hook | The phase must cover composition, orchestration, and inbound-response handling rather than single-message dispatch only |
| D-04 | Consent and channel eligibility should use a channel-specific policy mix in the first pass | Email, SMS, and WhatsApp do not share identical operational or compliance posture | Planning must model channel-specific gating instead of one generic allow/deny rule |
| D-05 | Standard one-off sends do not require approval in the first pass, but sequences, bulk-like actions, and high-risk or missing-data edge cases do | The workspace should stay usable for ordinary operator communication without removing governance from riskier actions | Approval-aware send paths and exception handling need to exist alongside faster low-risk one-off actions |
| D-06 | Delivery and engagement telemetry must return sent/queued, delivered, bounced/failed, opened/clicked where available, replies/inbound responses, unsubscribes/opt-outs, and template or sequence-step attribution into CRM timelines | CRM-native outbound is not complete if messaging evidence stays outside the CRM record history | Phase 62 must wire channel execution state back into the Phase 58 activity ledger in a durable and explainable way |
| D-07 | Phase 62 must support a full two-way conversation workspace in the first pass rather than timeline-only reply capture | Operators need to work active conversations inside MarkOS rather than viewing outbound history in one place and inbound replies in another | Planning must include conversation-thread surfaces, state transitions, and channel-aware inbound handling |
| D-08 | Lightweight assisted drafting may appear inside the Phase 62 send flow, but autonomous agent behavior remains out of scope until Phase 63 | Operators need some draft assistance while the product still preserves a hard boundary against autonomous workflows | Planning may include limited assistive drafting UX, but must not cross into autonomous copilot execution |
| D-09 | Outbound execution must remain tightly attached to CRM records, operator context, and tenant-safe permission gates rather than behaving like a separate messaging product | The milestone goal is CRM-native execution, not disconnected communication tooling | Templates, sequences, conversations, and telemetry all need record-aware integration points |
| D-10 | Bulk/campaign-style outbound is in scope, but it must remain consent-safe, approval-aware where needed, and traceable at the message and sequence-step level | Bulk execution is a real operational need, but it raises governance and telemetry risks quickly | Planning must include segmentation, approval, and delivery-trace semantics rather than one opaque bulk-send action |
| D-11 | Unsubscribes, opt-outs, and channel eligibility changes must be treated as first-class execution outcomes | Consent posture cannot be an afterthought once MarkOS sends real messages | Phase 62 must write back channel-safe eligibility state and ensure future sends respect it deterministically |
| D-12 | Phase 62 must stop short of the broader AI-copilot and autonomous-agent workflows owned by Phase 63 | The phase boundary must stay clean even with assisted drafting inside send flows | Planning should focus on native outbound mechanics, governance, and conversation handling rather than agentic orchestration |

## Discretion Areas

_Where the executor can use judgment without checkpointing:_

1. Exact channel adapter abstractions and provider-specific contract shape, as long as all three required channels remain tenant-safe and CRM-visible.
2. Exact depth split between email and the narrower SMS/WhatsApp first-pass surfaces, provided the latter remain real execution paths and not scaffolds.
3. Exact composition of one-off send, template, sequence, and conversation surfaces, provided they stay integrated into the CRM workspace.
4. Exact approval-routing logic for high-risk and bulk-like actions, provided standard one-off sends remain faster and riskier actions stay governed.
5. Exact scope of lightweight assisted drafting, provided it remains operator-in-the-loop and does not become autonomous execution.

## Deferred Ideas

_Ideas surfaced but not in scope for this phase:_

1. Autonomous copilot or agent-driven outbound orchestration owned by Phase 63.
2. Broader AI summaries, enrichment workflows, and approval-gated agent automations owned by Phase 63.
3. Final attribution cockpit, reporting closure, and milestone acceptance evidence owned by Phase 64.
4. Fully generalized cross-channel automation builder logic that exceeds the first-pass template/sequence execution need.
5. Channel execution that bypasses CRM record context, tenant guards, or consent-state writeback.

---

_Phase: 62-native-outbound-execution_
_Context gathered: 2026-04-04_
_Decisions locked: 12 (D-01 through D-12)_
