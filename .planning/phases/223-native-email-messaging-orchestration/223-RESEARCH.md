# Phase 223 Research - Native Email and Messaging Orchestration

## Primary research question

How can MarkOS turn its current CRM outbound and provider-adapter code into a first-party owned-channel engine for email, WhatsApp, SMS, and later push, without creating shadow consent or approval paths?

## Standard Stack

- Reuse `lib/markos/outbound/*` as the delivery and normalization seam.
- Reuse CRM outbound APIs and activity logging as the first writeback layer.
- Keep provider integration adapter-based, not hard-wired to Resend/Twilio.

## Architecture Patterns

- Provider adapters behind a stable channel contract.
- Eligibility/consent evaluation before send or sequence scheduling.
- Provider-webhook normalization into conversation and ledger state.
- Sequence execution plans as scheduled work items, not one-off loops.

## Don't Hand-Roll

- Separate send logic for email vs SMS vs WhatsApp when the adapter seam already exists.
- Another consent store outside the current outbound-consent model plus future CDP consent layer.
- Raw provider-webhook handling duplicated per route without normalization.

## Common Pitfalls

- Letting CRM outbound become the only channel surface and blocking future lifecycle marketing.
- Treating provider status as the full conversation state.
- Shipping messaging without shared suppression, quiet-hours, and approval rules.
- Encoding deliverability behavior into UI instead of contracts.

## Codebase Findings

### Files inspected

- `api/crm/outbound/send.js`
- `api/crm/outbound/sequences.js`
- `lib/markos/outbound/consent.ts`
- `lib/markos/outbound/scheduler.ts`
- `lib/markos/outbound/events.ts`
- `lib/markos/outbound/conversations.ts`
- `lib/markos/outbound/providers/base-adapter.ts`
- `lib/markos/outbound/providers/resend-adapter.ts`
- `lib/markos/outbound/providers/twilio-adapter.ts`
- `api/webhooks/twilio-events.js`

### Existing support

- Adapter-based delivery already exists for email, SMS, and WhatsApp.
- Eligibility checks already enforce contact-point presence, consent state, WhatsApp window rules, and approval requirements.
- Sequence scheduling already creates queued outbound work.
- Provider events already normalize into conversation state and can apply opt-out behavior.
- CRM activity logging already records outbound events.

### Missing capabilities

- No push channel support.
- No first-class `EmailProgram` or `MessagingProgram` object model.
- No tenant-managed template library, frequency caps, quiet-hours policy, or deliverability workspace.
- No native lifecycle/broadcast/triggered campaign model outside CRM outbound sequences.
- No generalized analytics/learning hooks beyond CRM activity and conversation status.

## Recommended Implementation Path

1. Promote the current outbound layer into a shared Owned Channel Engine with channel-agnostic program contracts.
2. Keep provider adapters and webhook normalization, but move consent truth toward the shared CDP/consent model from Phase 221.
3. Split customer-thread messaging from campaign/lifecycle orchestration in the data model.
4. Add push only after the shared program, eligibility, and event models are stable.
5. Make CRM, analytics, launches, and learning downstream consumers of one shared channel event stream.

## Tests Implied

- Adapter contract tests per provider and channel.
- Eligibility/suppression/approval tests.
- Sequence scheduling and replay/idempotency tests.
- Conversation-state tests for inbound reply, failed delivery, and opt-out.
- Browser tests for create/review/approve/send/recover flows.

## Research Decisions

- The current outbound layer is the right foundation for Phase 223.
- Email and messaging should share one governance model but remain distinct program types.
- Push should be deferred until the shared orchestration and consent substrate is real.
