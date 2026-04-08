# Phase 62: Native Outbound Execution - Research

**Researched:** 2026-04-04
**Domain:** CRM-native outbound execution across email, SMS, and WhatsApp with consent-safe send control, delivery telemetry return paths, templates/sequences, and two-way conversation handling
**Confidence:** HIGH (recommendations are grounded in the Phase 58 CRM activity and task foundations, the Phase 51 IAM and tenant model, the Phase 46 execution-workspace pattern, the locked decisions in `62-CONTEXT.md`, and the current absence of real outbound provider or consent infrastructure in the repo)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

### 1. Phase 62 must ship real first-class outbound execution

The first pass must include real outbound execution for Resend email, Twilio SMS, and Twilio WhatsApp.

Implementation guidance:
- Do not reduce this phase to adapter scaffolding or send logging only.
- Keep all three channels tenant-safe and CRM-visible.
- Preserve a clear path from operator action to delivery telemetry and CRM timeline writeback.

### 2. All three channels are in scope, but depth can be uneven

All three channels must exist in the first pass, with email shipping at the deepest surface while SMS and WhatsApp remain narrower but real.

Implementation guidance:
- Email can own the richest template/sequence/thread capabilities first.
- SMS and WhatsApp cannot be placeholders.
- Keep the depth split explicit in planning rather than allowing implicit downgrade.

### 3. Phase 62 is a real execution system, not a send button phase

The first pass must include one-off sends, reusable templates, basic sequences/step cadences, scheduled sends, bulk/campaign-style outbound, and a full two-way conversation workspace.

Implementation guidance:
- Do not scope this as record-level one-off messaging only.
- Treat replies and inbound responses as first-class operator workflow.
- Keep sequence, scheduling, and bulk behavior auditable and CRM-tied.

### 4. Consent and channel eligibility must use a channel-specific policy mix

The first pass must respect the fact that email, SMS, and WhatsApp do not share identical eligibility and compliance posture.

Implementation guidance:
- Avoid one generic consent flag for all outbound channels.
- Store and enforce per-channel eligibility state.
- Fail closed when consent or eligibility is ambiguous on riskier channels.

### 5. Approval gates must distinguish low-risk and high-risk execution

Standard one-off sends do not require approval, but sequences, bulk-like actions, and high-risk/missing-data edge cases do.

Implementation guidance:
- Keep one-off sends fast for eligible records.
- Route higher-risk execution into approval-aware flows.
- Preserve immutable audit evidence for approval outcomes.

### 6. Telemetry return paths are mandatory

The first pass must write back sent/queued, delivered, bounced/failed, opened/clicked where available, replies/inbound responses, unsubscribes/opt-outs, and template/sequence-step attribution into CRM timelines.

Implementation guidance:
- Do not leave provider delivery state outside the CRM.
- Normalize outbound activity into the MarkOS-owned activity ledger.
- Preserve provider references and sequence-step lineage for later analysis.

### 7. AI assistance stays bounded in this phase

Lightweight assisted drafting may appear inside send flows, but autonomous AI behavior remains out of scope until Phase 63.

Implementation guidance:
- Keep operators in control of message execution.
- Treat assisted drafting as optional aid, not autonomous orchestration.
- Avoid agentic send behavior, background autonomous retries, or independent AI outreach planning.

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CRM-05 | Operators can execute outbound communication from the CRM with channel-safe controls, delivery visibility, and CRM-native history. | Recommends provider adapters, consent and eligibility storage, outbound send records, conversation threads, sequence/scheduling support, and durable timeline writeback for each channel event. |
| CRM-06 | Human agents and AI agents can create tasks, draft outreach, update stages, append notes, and generate summaries, with immutable audit records for every AI-originated action. | Recommends lightweight assisted drafting inside send flows, immutable audit and approval patterns for higher-risk execution, and task/note/timeline integration around outbound actions without crossing into autonomous AI behavior. |

</phase_requirements>

## Project Constraints (from repo state and current implementation)

- `.planning/STATE.md`, `.planning/ROADMAP.md`, and the phase artifacts remain the authoritative planning sources.
- Phase 58 already established `crm_activity_ledger` with `outbound_event` as a valid activity family, which means the timeline target exists even though outbound execution does not.
- Phase 58 and `lib/markos/crm/api.cjs` already provide tenant-scoped mutation guards and append-only activity helpers that Phase 62 should reuse instead of inventing a parallel audit model.
- Phase 51 already established fail-closed IAM and tenant context propagation; outbound execution must inherit those exact controls.
- Phase 46 already established a three-region execution workspace pattern that can be repurposed for compose/send/thread/evidence surfaces.
- The current repo does not include Resend, Twilio SMS, or Twilio WhatsApp packages in `package.json`, and it does not contain a real consent, template, sequence, or conversation schema yet.
- Brand-context helpers already exist for outbound notification payload shaping, which gives Phase 62 a narrow but real branding seam for white-label messaging.

## Summary

Phase 62 should be implemented as a **CRM-native outbound execution layer that writes every meaningful message action back into canonical CRM history**, not as a detached messaging subsystem and not as a thin provider adapter. The repo already has the important substrate to support this: a tenant-safe CRM mutation model, an append-only activity ledger with `outbound_event`, a role-aware permission bridge, a proven execution-workspace UI pattern, and brand-context helpers that can flow tenant styling into outbound payloads.

The strongest implementation path is:

1. Add a dedicated outbound schema for sends, templates, sequences, conversations, consent, and channel eligibility.
2. Introduce provider adapters for Resend and Twilio-backed SMS/WhatsApp with a shared MarkOS contract.
3. Route all send, delivery, reply, opt-out, and sequence-step events into the CRM activity ledger as normalized `outbound_event` history.
4. Reuse the existing task/execution workspace pattern to build compose, queue, thread, and evidence surfaces inside the CRM.
5. Keep AI assistance bounded to lightweight drafting help while preserving approval-aware controls on riskier execution modes.

This phase is therefore an **adapter + consent + outbound-schema + thread/workspace + telemetry-writeback** problem. It is not just a provider integration phase, not an attribution-reporting phase, and not the autonomous AI phase.

## Competitive Landscape

Phase 62 is not competing on whether MarkOS can send an email. It is competing on whether outbound execution can live natively inside the CRM with durable history, governance, and cross-channel legibility.

### Product-pattern comparison

| Pattern | What it gets right | What MarkOS should take | What MarkOS should avoid |
|--------|---------------------|--------------------------|---------------------------|
| HubSpot-style CRM outbound | One-off sends, templates, sequences, replies, and delivery state tied to CRM records | Channel execution directly from records with history landing in the same CRM context | Loose provider abstraction that makes cross-channel governance hard to reason about |
| Salesloft/Outreach-style seller execution | Sequence-driven work, cadence orchestration, task coupling, reply awareness | Basic sequences and operator execution flow tied to tasking and queue surfaces | Sales-only posture that neglects account, renewal, and success communication needs |
| Intercom/Front conversation workspaces | Two-way thread handling and response workflows | Conversation visibility and inbound/outbound continuity in one operator surface | A channel inbox that floats away from canonical CRM records |
| Customer.io/Braze style orchestration | Rich channel automation, eligibility and audience logic, delivery-state precision | Clear separation between channel eligibility, scheduling, and execution outcome | Full automation-builder sprawl or marketing-automation complexity too early |
| Twilio/Resend provider-native tooling | Deep channel specifics and reliable provider delivery semantics | Respect provider-specific capabilities, event models, and failure modes | Letting provider payload shape become the CRM’s truth model |

### Strategic conclusion

MarkOS should position Phase 62 as:

- **More CRM-native than sales-engagement overlays**
- **More cross-channel and auditable than one-off send tools**
- **More governed than provider-native dashboards alone**
- **More operator-centric than automation-builder platforms**

The winning design is a **record-aware outbound system with provider adapters, explicit consent gates, conversation threads, and normalized CRM writeback for every meaningful state change**.

## Audience Intelligence

The immediate audience for Phase 62 is internal MarkOS operators and future revenue teams who need to execute actual communication from the CRM once the record, tracking, workspace, and execution-hub foundations are already in place.

### Primary operator needs

1. Send the right message from the right record without switching tools.
2. Trust that consent and eligibility are enforced correctly per channel.
3. See delivery, failure, reply, and opt-out outcomes directly on CRM timelines.
4. Manage ongoing conversations without leaving the CRM workspace.
5. Run practical templates and simple cadences without waiting for a later automation-builder phase.

### Secondary implementation audience

1. Phase 62 planners who need decomposition into provider adapters, persistence, conversation handling, approval gates, and validation work.
2. UI implementers who need to know which existing workspace/evidence patterns can be reused for compose and thread surfaces.
3. Later phases that will depend on outbound history as part of AI recommendations and attribution closure.

### Audience implications for research

- Execution design must optimize for **operator clarity and send safety**, not messaging breadth alone.
- Channel policy must optimize for **trustworthy eligibility enforcement**, not permissive default behavior.
- Conversation UX must optimize for **record-centric continuity**, not generic shared inbox metaphors alone.
- Telemetry design must optimize for **CRM readability and lineage**, not raw provider webhook completeness by itself.

## Channel Benchmarks

These are planning heuristics for a first-pass CRM-native outbound layer. They are validation targets for Phase 62, not claims about current production behavior.

| Metric | Industry Avg | Target |
|--------|--------------|--------|
| Eligible one-off send success under healthy runtime conditions | >=95% | >=99% |
| Delivery-state writeback completeness to CRM history | Often partial across stitched toolchains | 100% for sent/queued, delivered, failed/bounced, replies, opt-outs, and sequence-step attribution |
| Consent/eligibility false-allow rate | Should approach 0 for safe CRM systems | 0 known false-allows in validation fixtures |
| Sequence approval compliance for high-risk actions | Often inconsistent in lightweight tools | 100% of bulk/sequence/high-risk sends routed through correct approval gate |
| Email event richness | Highest among supported channels | Full send/delivered/bounced/opened/clicked/reply/opt-out coverage where provider supports it |
| SMS/WhatsApp first-pass execution depth | Often narrower than email in early releases | Real one-off, template, scheduling, reply, and CRM writeback support even if deeper sequence capability is lighter than email |
| Two-way thread freshness | <=5 min heuristic for operational messaging | <=1 min from inbound webhook receipt to CRM-visible thread/timeline state |
| Outbound activity audit completeness | Frequently fragmented across systems | 100% of operator and approved system actions linked to record, actor, provider ref, and channel |

### Benchmark interpretation

- Send success matters, but governance accuracy matters more because a wrongly allowed send is more damaging than a delayed one.
- Writeback completeness matters because the value of CRM-native outbound collapses if delivery or reply history is split across tools.
- Email can own the deepest first-pass capability, but SMS/WhatsApp must still be real channels with actual operator utility.

## Recommended Approach

### 1. Add a dedicated outbound data model before building UI depth

The current repo has no outbound persistence model beyond the `outbound_event` timeline family. Phase 62 should first introduce explicit tables for outbound sends, templates, sequences, conversations, and channel eligibility.

Recommended outcome:

- add tenant-scoped tables for outbound sends, templates, sequence definitions, sequence steps, conversation threads, inbound messages, consent/eligibility state, and opt-out events
- keep every table aligned to CRM record references so outbound never loses the record context
- follow the same RLS and append-only audit posture already established in the CRM core

### 2. Introduce a shared outbound adapter contract with provider-specific implementations

The repo does not currently ship Resend or Twilio SDK integrations. That absence should be treated as a design opportunity rather than patched around ad hoc.

Recommended outcome:

- define a small outbound adapter interface covering send, schedule, template send, inbound normalization, delivery-event normalization, and channel capability metadata
- implement Resend for email and Twilio-backed adapters for SMS and WhatsApp behind the same MarkOS contract
- keep provider-specific payload translation inside adapters, not spread across UI or route handlers

### 3. Make consent and eligibility a first-class channel-aware gate

Phase 62 cannot rely on one boolean consent flag because the user explicitly locked channel-specific policy behavior.

Recommended outcome:

- store eligibility and opt-out state per contact, per channel, with source and timestamp lineage
- enforce stricter fail-closed handling on ambiguous SMS/WhatsApp eligibility while allowing email-specific policy to stay distinct
- treat unsubscribes and opt-outs as state-changing events that immediately affect future send eligibility

### 4. Route all outbound execution outcomes back into CRM history

The current CRM timeline already supports `outbound_event`, which is the right truth boundary for Phase 62.

Recommended outcome:

- normalize send requests, provider accepts, deliveries, failures, opens/clicks where available, replies, opt-outs, and sequence-step transitions into outbound activity records
- preserve provider message/thread references inside payload metadata so later reporting and debugging can trace source events
- keep provider webhooks as evidence inputs that feed CRM truth, not as the final truth model themselves

### 5. Reuse the existing execution-workspace pattern for compose and conversation surfaces

`app/(markos)/operations/tasks/page.tsx` already gives the repo a three-region execution grammar with an evidence rail. Phase 62 should reuse that pattern for outbound work.

Recommended outcome:

- use left-side queue or thread list, center compose/thread pane, and right-side consent/evidence/delivery rail
- build a dedicated outbound store provider rather than scattering send state across route-local hooks
- tie compose and conversation views back into CRM record detail so sending and thread review are part of one workspace

### 6. Keep approval-aware flows explicit for riskier execution

The repo already has approval-aware patterns from earlier phases, and the user explicitly locked approvals for bulk, sequence, and high-risk edge cases.

Recommended outcome:

- low-risk one-off sends proceed directly when eligibility is clear
- sequence launches, bulk sends, and missing-data or ambiguous-consent cases route through approval-aware states
- approval decisions remain immutable and CRM-visible for audit purposes

### 7. Allow lightweight assisted drafting without drifting into Phase 63

Phase 62 can include assistive drafting inside send flows, but it must stay operator-in-the-loop.

Recommended outcome:

- support operator-invoked draft suggestions inside compose surfaces
- keep human review and send initiation explicit
- do not introduce autonomous agent sending, campaign planning, or self-running conversation loops in this phase

## Platform Capabilities and Constraints

### Existing capabilities to build on

1. **CRM activity ledger already reserves outbound history.** `crm_activity_ledger` already includes `outbound_event` as an allowed activity family.
2. **Tenant-safe CRM mutation helpers already exist.** `lib/markos/crm/api.cjs` already centralizes tenant validation, role gating, and activity appends.
3. **Execution-workspace UI precedent already exists.** The Phase 46 tasks surface gives the repo a reusable execution-shell pattern.
4. **Brand-context helpers already exist.** `lib/markos/plugins/brand-context.js` can merge tenant brand context into outbound notification payloads.
5. **Payload sanitization already exists.** `lib/markos/telemetry/events.ts` demonstrates the repo’s telemetry redaction posture, which Phase 62 can mirror for outbound operational telemetry.
6. **IAM bridge already exists.** `lib/markos/rbac/policies.ts` provides the current action-policy pattern that Phase 62 can extend with outbound actions.

### Current constraints and gaps

1. **No outbound provider SDKs are installed.** `package.json` does not currently include Resend or Twilio dependencies.
2. **No consent or eligibility schema exists yet.** There is no per-channel consent state in the CRM data model.
3. **No template, sequence, or conversation schema exists yet.** The repo has no outbound persistence layer beyond generic activity logging.
4. **No inbound webhook normalization exists yet for replies or provider events.** Delivery and conversation return paths must be added from scratch.
5. **No outbound action policy exists yet in IAM.** Current action policies cover tasks, publishing, billing, and users, but not sends, sequences, or approval-aware outbound.
6. **Current CRM-facing routes are still evolving.** Phase 62 depends on the Phase 60/61 workspace model to provide the primary operator shell it will live inside.

### Architectural implication

Phase 62 should be primarily a **compose-send-receive-writeback-govern** phase:

- compose outbound content from CRM record context
- send through provider adapters with channel-specific policy gates
- receive provider outcomes and inbound messages through normalized handlers
- write back everything meaningful into CRM history and conversation state
- govern riskier execution with explicit approvals and permission-safe actions

That is the smallest architecture that satisfies the locked scope without spilling into Phase 63 automation or Phase 64 reporting.

## Tracking Requirements

Phase 62 adds an operator execution layer that must produce both product telemetry and CRM-facing outbound evidence.

### Required outbound operational events

1. `crm_outbound_compose_opened`
   - Properties: `tenant_id`, `record_kind`, `record_id`, `channel`, `surface`
2. `crm_outbound_send_requested`
   - Properties: `tenant_id`, `record_kind`, `record_id`, `channel`, `send_mode`, `template_id`, `sequence_id`, `actor_role`
3. `crm_outbound_send_blocked`
   - Properties: `tenant_id`, `record_kind`, `record_id`, `channel`, `block_reason`, `approval_required`
4. `crm_outbound_send_approved`
   - Properties: `tenant_id`, `channel`, `approval_type`, `record_count`, `actor_role`
5. `crm_outbound_provider_event_received`
   - Properties: `tenant_id`, `channel`, `provider`, `event_type`, `provider_message_ref`
6. `crm_outbound_reply_received`
   - Properties: `tenant_id`, `channel`, `record_kind`, `record_id`, `conversation_ref`
7. `crm_outbound_opt_out_recorded`
   - Properties: `tenant_id`, `channel`, `record_kind`, `record_id`, `source`

### Tracking guidance

- Product telemetry for compose/send UX should remain separate from CRM history.
- CRM writeback events should normalize into `outbound_event` activity rows with provider refs and channel metadata.
- Sensitive message bodies or contact details should be redacted or excluded from product telemetry while remaining appropriately stored in CRM/outbound persistence where required.
- Approval and blocking telemetry should make it easy to validate that channel policy and governance are working as intended.

## Risks and Pitfalls

1. **Provider-first schema drift.** If provider payloads become the persistence model, cross-channel consistency and later reporting will become brittle.
2. **Consent oversimplification.** One generic opt-in model across email, SMS, and WhatsApp will cause either compliance risk or operator confusion.
3. **History fragmentation.** If replies or delivery events land outside CRM timelines, outbound will feel bolted on instead of native.
4. **Thread/workspace split.** If conversations live in a separate mental model from records, users will still context-switch during active communication work.
5. **Approval ambiguity.** If higher-risk sends do not have a deterministic approval path, governance will be inconsistent and hard to verify.
6. **Email-only bias.** If SMS and WhatsApp are reduced to mock channels, the first-pass scope will be technically incomplete despite UI presence.
7. **Phase 63 leakage.** If assisted drafting drifts into autonomous send planning or agentic execution, the outbound phase will overreach and become harder to verify.
8. **Bulk-send opacity.** If bulk/campaign-style outbound is executed as one black-box action, later delivery analysis and consent auditing will be too weak.

## Validation Architecture

Phase 62 should be validated as a governed cross-channel execution system, not as isolated send helpers.

### 1. Schema and contract validation

- migration tests for outbound sends, templates, sequences, conversations, inbound message records, and consent/eligibility tables
- contract tests for provider adapter interfaces and normalized outbound event payloads
- tenant isolation tests for outbound data visibility and mutation safety

### 2. Consent and approval validation

- tests proving per-channel eligibility blocks and allows the correct sends
- tests proving one-off eligible sends bypass approval while sequences/bulk/high-risk cases require it
- tests proving opt-outs immediately affect future eligibility state

### 3. Delivery and reply writeback validation

- tests proving provider send responses append `outbound_event` rows correctly
- tests proving webhook-like delivery/failure/reply events normalize into CRM conversation and timeline state
- tests proving provider refs, template refs, and sequence-step attribution remain queryable

### 4. UI and workflow validation

- compose/send tests for one-off, scheduled, template-based, and sequence-based execution paths
- thread/conversation tests for inbound reply visibility and operator response flows
- approval-state tests for blocked, pending-approval, approved, rejected, and failure paths
- role-aware UI tests proving users only see permitted outbound actions

### 5. Cross-phase coherence validation

- tests proving outbound actions appear correctly in Phase 60 record detail timelines
- tests proving Phase 61 execution surfaces can reference outbound outcomes and reply states coherently
- tests proving later reporting/AI phases would have the necessary outbound lineage without redefining event semantics

### Success criteria for planning handoff

Planning should not consider Phase 62 research actionable until the execution plan explicitly covers:

- channel adapter architecture for Resend and Twilio-backed SMS/WhatsApp
- outbound persistence and consent/eligibility schema
- delivery/reply/opt-out CRM writeback design
- two-way conversation workspace design
- approval-aware higher-risk execution flows
- validation proving both governance safety and cross-channel execution reality

## RESEARCH COMPLETE
