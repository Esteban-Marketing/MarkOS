# Phase 223: Native Email and Messaging Orchestration - Discussion Log

> **Audit trail only.** Decisions are captured in `223-CONTEXT.md` — this log preserves the alternatives considered.

**Date:** 2026-04-24
**Phase:** 223-native-email-messaging-orchestration
**Mode:** discuss (--chain)
**Areas discussed:** Program model, Consent shim cutover, Push channel scope, Sender identity + deliverability, Send execution, Approval threshold, Audience double-gate, Inbound reply, Templates, Channel event writeback, API/MCP surface

---

## Area selection

**Selected (all 8):** Program model, Consent shim cutover, Push channel scope, Sender identity + deliverability, Send execution, Approval threshold, Audience double-gate, Inbound reply.

---

## Program model architecture

| Option | Description | Selected |
|--------|-------------|----------|
| Separate per-channel: email_campaigns + messaging_threads + lifecycle_journeys | Doc 19 EmailCampaign + doc 21 MessagingThread + new lifecycle_journeys; mirrors operator + provider semantics. | ✓ |
| Unified channel_programs with channel + program_class + thread_mode | Single table; nullable bloat. | |
| Hybrid declarative + per-channel runtime | Most expressive, more complexity. | |

**User's choice:** Separate per-channel (Recommended).

---

## Consent shim cutover

| Option | Description | Selected |
|--------|-------------|----------|
| Full cutover: ConsentState only; legacy outboundConsentRecords becomes derived view (3-month deprecation flag) | P221 D-12 mandate. ConsentState single writer. | ✓ |
| Gradual dual-read | Drift risk; defers hard work. | |
| Cutover + delete legacy | No rollback path. | |

**User's choice:** Full cutover (Recommended).

---

## Push channel v1 scope

| Option | Description | Selected |
|--------|-------------|----------|
| Include push + in_app via Knock adapter | ConsentState fields exist (P221 D-11); doc 21 first-class; unblocks P218 PLG. | ✓ |
| Defer push + in_app | Blocks P218; ConsentState fields go unused. | |
| in_app only (defer push) | Partial; doc 21 treats as one Engine. | |

**User's choice:** Include both via Knock (Recommended).

---

## Sender identity + deliverability

| Option | Description | Selected |
|--------|-------------|----------|
| First-class SenderIdentity + DeliverabilityPosture (24h rolling per sender per channel) | Doc 19 first-class; required for class_permissions gate; operator-visible. | ✓ |
| SenderIdentity only, posture computed on-read | No historical reputation trend; can't gate on reputation. | |
| Defer SenderIdentity, use Resend account-level only | Tenant reputation invisible; class_permissions ungated. | |

**User's choice:** First-class both (Recommended).

---

## Send execution architecture

| Option | Description | Selected |
|--------|-------------|----------|
| AgentRun (P207) + Vercel Queues fan-out + dispatch_attempt_id idempotency | Per-recipient at-least-once; run-level cancel/pause; matches P221 trait pattern. | ✓ |
| Vercel Queues only (no AgentRun) | No run-level cancel/pause. | |
| Cron-scheduled batch (current) | Doesn't scale past O(1k); function timeout risk. | |

**User's choice:** AgentRun + Queues (Recommended). Bridge stub if P207 not yet executed (D-15).

---

## Approval threshold model

| Option | Description | Selected |
|--------|-------------|----------|
| Layered: class + count (≥500) + content classifier (pricing/claim/competitor) + manual override | Fail-closed at first triggering layer; routes through P208 Approval Inbox. | ✓ |
| Class-based only | Lifecycle 5000-recipient send auto-approves. | |
| Threshold-only (count > N) | Pricing claim broadcast auto-approves at low count. | |

**User's choice:** Layered (Recommended). Plus re-engagement >90d ALWAYS requires (D-18).

---

## Audience double-gate dispatch

| Option | Description | Selected |
|--------|-------------|----------|
| Per-recipient at send: ConsentState + suppression + frequency cap + quiet hours + jurisdiction; bounce → suppression | P221 D-18 explicit; full gate. | ✓ |
| Snapshot-time only | Violates P221 D-18; consent change between snapshot and send = illegal. | |
| Partial gate (consent + suppression only) | Frequency caps + quiet hours unenforced. | |

**User's choice:** Full gate (Recommended).

---

## Inbound reply + thread continuity

| Option | Description | Selected |
|--------|-------------|----------|
| Reply → MessagingThread + Customer360 timeline + CRM task + escalate to thread.owner; same shape across all channels | Doc 21 thread-first; cross-channel continuity via thread.related_crm_id. | ✓ |
| Conversation row only (current) | Replies invisible in operator queue. | |
| Email replies separate; SMS/WhatsApp/push use thread | Asymmetric; cross-channel context lost. | |

**User's choice:** Unified thread model (Recommended).

---

## Templates + personalization

| Option | Description | Selected |
|--------|-------------|----------|
| Unified channel_templates with channel + variables_schema + content_blocks; Handlebars; locale variants per row | One table for all channels; channel-specific fields nullable; evidence + pricing bindings. | ✓ |
| Per-channel template tables | 5 tables; duplicate variables_schema. | |
| Defer template library | Doc 19 first-class violated. | |

**User's choice:** Unified (Recommended).

---

## Channel event → writeback

| Option | Description | Selected |
|--------|-------------|----------|
| Single fan-out: cdp_events + crm_activity + thread/campaign aggregate + dispatch_events | Doc 19 rule 7; deliverability rollup source; fail-closed. | ✓ |
| cdp_events + crm_activity only (no dispatch_events) | Deliverability rollup slow. | |
| Provider events stay in conversations only | P222 timeline misses email events. | |

**User's choice:** Single fan-out with all 4 sinks (Recommended).

---

## API + MCP surface

| Option | Description | Selected |
|--------|-------------|----------|
| Read-write v1 /v1/channels/* + 5 MCP tools (send_email_program, send_messaging, get_thread, get_deliverability_posture, list_pending_approvals) | P223 IS dispatch engine; approvals via P208 inbox. | ✓ |
| Read-only v1; sends library-only | Blocks P224 launches + P226 sales enablement. | |
| Minimal MCP (2 tools) | Insufficient for downstream. | |

**User's choice:** Read-write + 5 MCP tools (Recommended).

---

## Claude's Discretion

- Module boundary `lib/markos/channels/*`.
- Handlebars helper subset (security).
- Lifecycle journey trigger evaluation (event-driven vs scheduled poll).
- Frequency cap implementation (rolling window vs Redis sliding).
- Vercel Queues vs Supabase pg_boss fallback.
- TemplateEditor + DeliverabilityWorkspace component details.

## Deferred Ideas

- P224 conversion surfaces + launch orchestration.
- P225 attribution + journey + narrative.
- P226 sales enablement.
- P227 ecosystem.
- P228 integration closure.
- A/B testing → P225.
- AI-generated subject/body → P226.
- Real-time SSE/websocket in_app → P224.
- Inbound voice/IVR / iMessage / BYO-provider — out of v1.
- Multi-region send routing → P228.
- Send-time optimization ML → P225 + P207.
- Sender warmup automation — ops, not v1.
