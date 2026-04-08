---
phase: 62
phase_name: Native Outbound Execution
discipline: outbound
type: standard
created: 2026-04-04
---

# Phase 62: Native Outbound Execution — Validation Strategy

**Purpose:** Maps Phase 62 deliverables to direct verification methods so execution can prove real cross-channel sending, consent-safe control, approval-aware higher-risk execution, CRM-native writeback, and hard phase boundaries against autonomous outbound behavior.

## Phase Goal

Deliver a CRM-native outbound execution layer where operators can send real email, SMS, and WhatsApp messages from MarkOS using one-off sends, templates, simple sequences, scheduling, bulk-safe execution, and two-way conversation handling while preserving channel-specific consent, approval-aware risk gates, and CRM timeline truth.

## Deliverables and Verification Methods

| Deliverable | Verification Method | Responsible | Dimension |
|-------------|-------------------|-------------|-----------|
| Real provider-backed execution exists for email, SMS, and WhatsApp | Provider-adapter tests, API tests, and dependency inspection | AI | Channel Reality |
| Channel-specific consent and eligibility fail closed | Consent tests, tenant-isolation tests, and blocked-send assertions | AI | Governance |
| One-off sends write governed CRM history | Send API tests and timeline assertions | AI | Auditability |
| Templates, sequences, scheduling, and bulk execution stay approval-aware | Sequence and bulk guardrail tests plus contract inspection | AI | Execution Safety |
| Outbound workspace remains CRM-native and evidence-rich | Workspace tests and hosted route inspection | AI / Human | Workspace UX |
| Replies, deliveries, failures, and opt-outs write back into conversation and timeline truth | Webhook-normalization tests, conversation tests, and manual thread review | AI / Human | CRM Truth |
| Outbound telemetry is explicit and sanitized | Telemetry tests and source inspection | AI | Observability |
| Draft assistance stays bounded and non-autonomous | Draft-boundary tests and manual surface review | AI / Human | Boundary Discipline |

## MIR Gate Requirements

Gate 1 (Identity) — files that must be populated before this phase:
- `Core_Strategy/01_COMPANY/PROFILE.md`
- `Core_Strategy/02_BRAND/VOICE-TONE.md`
- `Core_Strategy/02_BRAND/MESSAGING-FRAMEWORK.md`
- `Core_Strategy/02_BUSINESS/LEAN-CANVAS.md`
- `Core_Strategy/02_BUSINESS/JTBD-MATRIX.md`

Gate 2 (Execution) — files that must be populated:
- `Core_Strategy/06_TECH-STACK/TRACKING.md`
- `Core_Strategy/06_TECH-STACK/AUTOMATION.md`
- `Campaigns_Assets/05_CHANNELS/PAID-MEDIA.md`
- `Core_Strategy/09_ANALYTICS/KPI-FRAMEWORK.md`

## KPI Measurement Plan

| KPI | Baseline | Target | Data Source | Review Date |
|-----|---------|--------|------------|-------------|
| Eligible one-off send success under healthy fixtures | Not yet implemented | >=99% | Provider-adapter and send API tests | Phase 62 execution closeout |
| False-allow consent rate | Not yet implemented | 0 | Consent and blocked-send tests | Phase 62 execution closeout |
| CRM writeback completeness for outbound outcomes | Not yet implemented | 100% | Timeline and conversation assertions | Phase 62 execution closeout |
| Sequence or bulk approval compliance | Not yet implemented | 100% | Sequence-governance and bulk guardrail tests | Phase 62 execution closeout |
| Conversation freshness from inbound event to CRM visibility | Not yet implemented | <=1 minute equivalent in deterministic fixtures | Webhook and conversation tests | Phase 62 execution closeout |
| Autonomous execution leakage from draft assistance | Not yet implemented | 0 actual autonomous sends | Draft-boundary tests | Phase 62 execution closeout |

## Human Testing Items

Steps that require hosted UI access or live-provider sandbox review:
1. Open the outbound workspace in a hosted tenant session and confirm the queue, compose or thread, and evidence surfaces remain inside the CRM shell rather than presenting a detached messaging product.
2. Run one eligible one-off email send and one eligible SMS or WhatsApp send in provider-safe sandbox conditions, then verify delivery or failure evidence appears on the target CRM record history.
3. Review a conversation thread with an inbound reply and confirm the thread, opt-out state if applicable, and follow-up context are visible from the CRM workspace.
4. Trigger assistive drafting from the compose surface and confirm the UI keeps the operator in control with no autonomous send or background execution path.

## Automated Checks

Verifiable via file read or CLI:
- `node --test test/crm-outbound/crm-outbound-foundation.test.js test/crm-outbound/crm-consent-eligibility.test.js test/tenant-auth/crm-outbound-tenant-isolation.test.js`
- `node --test test/crm-outbound/crm-outbound-workspace.test.js test/crm-outbound/crm-sequence-approval.test.js test/crm-outbound/crm-bulk-send-guardrails.test.js`
- `node --test test/crm-outbound/crm-conversation-writeback.test.js test/crm-outbound/crm-provider-webhook-normalization.test.js test/crm-outbound/crm-outbound-telemetry.test.js test/crm-outbound/crm-assisted-draft-boundary.test.js`
- `get_errors` on `62-01-PLAN.md`, `62-02-PLAN.md`, `62-03-PLAN.md`, and `62-VALIDATION.md`

## Exit Conditions

Phase 62 is only considered complete when:

1. Email, SMS, and WhatsApp are all real first-pass outbound channels with governed execution paths.
2. Channel-specific consent and eligibility gates fail closed and surface approval-aware exceptions clearly.
3. One-off sends, templates, basic sequences, scheduled sends, and bulk-safe execution are all CRM-native and audit-visible.
4. Delivery, failure, reply, and opt-out outcomes write back into canonical CRM history and conversation state.
5. The outbound workspace remains inside the MarkOS CRM shell with visible evidence rails.
6. Draft assistance remains operator-in-the-loop and no autonomous agentic outbound behavior exists in this phase.

---
Phase 62 Validation Strategy created 2026-04-04.
