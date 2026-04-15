# Phase 104: Native Outbound Execution - Context

**Gathered:** 2026-04-14  
**Status:** Ready for planning

## Phase Boundary

This phase brings governed native outbound into the verified CRM workspace: email, SMS, and WhatsApp sending with channel-specific consent and suppression checks, templates and sequences, delivery telemetry, and CRM timeline writeback. It should feel like one operational outbound desk inside the CRM shell rather than a detached campaign platform. It does not include autonomous AI sending, social or ads execution, or a heavyweight inbox-first contact center.

## Implementation Decisions

### Channel depth and launch emphasis
- **D-01:** The first release should be email-first in depth and polish, while still shipping real SMS and WhatsApp support from day one.
- **D-02:** Operators should be able to use both one-off sends and governed sequences in this phase, not just one mode.

### Governance and approval posture
- **D-03:** High-risk, re-engagement, and bulk outbound require approval by default, while low-risk standard sends can proceed within existing role limits.
- **D-04:** Consent, suppression, and eligibility must stay channel-specific and fail closed for every send path.
- **D-05:** Human operators remain in control of durable outbound actions; no autonomous external sending belongs in this phase.

### Workspace and evidence posture
- **D-06:** Outbound work should feel most natural from the CRM record context and outbound queue together, not a separate campaigns-style product.
- **D-07:** Delivery, block, reply, and approval evidence should write back to the CRM timeline first, with lightweight conversation evidence instead of a full inbox-first experience.
- **D-08:** The evidence rail should surface consent state, approval state, and recent outbound events clearly enough for fast operator review.

### the agent's Discretion
- Exact queue labels, template library depth, schedule controls, and composer density can follow repo-native outbound patterns so long as governance, evidence, and operator clarity stay first-class.

## Specific Ideas

- The outbound surface should feel like a governed extension of the CRM record and queue, not a separate tool.
- Email gets the deepest first-pass polish, with SMS and WhatsApp still genuinely usable.
- Sequences should stay scheduled and approval-aware rather than hidden background automation.
- Delivery and reply evidence should stay visible on the canonical CRM timeline.

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone and phase sources
- `.planning/ROADMAP.md` — Defines the Phase 104 boundary and the dependency on the verified execution workspace.
- `.planning/REQUIREMENTS.md` — OUT-01 and OUT-02 are the core completion targets for this phase.
- `.planning/phases/103-sales-and-success-execution-workspace/103-CONTEXT.md` — Locks the human-controlled, approval-aware action posture that outbound must build on.

### Native outbound code and tests
- `app/(markos)/crm/outbound/page.tsx` — Protected CRM-native outbound route entrypoint.
- `components/crm/outbound/outbound-workspace.tsx` — Queue, composer, and evidence-rail shell for outbound work.
- `components/crm/outbound/outbound-composer.tsx` — Channel, template, schedule, and approval-aware composer seam.
- `components/crm/outbound/outbound-consent-gate.tsx` — Consent and approval evidence UI seam.
- `api/crm/outbound/send.js` — Provider-backed one-off send seam with eligibility evaluation.
- `api/crm/outbound/templates.js` — Governed outbound template management seam.
- `api/crm/outbound/sequences.js` — Approval-aware sequence launch and scheduling seam.
- `api/crm/outbound/bulk-send.js` — Bulk-send preview and approval guardrail seam.
- `lib/markos/outbound/consent.ts` — Channel-specific eligibility, opt-out, and approval requirements.
- `lib/markos/outbound/scheduler.ts` — Sequence scheduling and due-work selection.
- `lib/markos/outbound/workspace.ts` — Outbound workspace snapshot and evidence aggregation.
- `lib/markos/outbound/providers/base-adapter.ts` — Channel capabilities and provider adapter contract for Resend and Twilio-backed channels.
- `test/crm-outbound/crm-outbound-workspace.test.js` — CRM-native queue, composer, and evidence-shell coverage.
- `test/crm-outbound/crm-consent-eligibility.test.js` — Consent and channel-specific eligibility coverage.
- `test/crm-outbound/crm-sequence-approval.test.js` — Approval-aware sequence launch coverage.
- `test/crm-outbound/crm-conversation-writeback.test.js` — CRM timeline writeback coverage.
- `test/crm-outbound/crm-bulk-send-guardrails.test.js` — Approval and bulk-send guardrail coverage.

## Existing Code Insights

### Reusable Assets
- `lib/markos/outbound/workspace.ts` already hydrates a tenant-scoped outbound queue, active work item, consent snapshot, and recent evidence.
- `lib/markos/outbound/consent.ts` already enforces channel-safe eligibility, opt-out semantics, WhatsApp window rules, and approval requirements.
- `lib/markos/outbound/scheduler.ts` already models governed sequence execution timing and due-work selection.
- `api/crm/outbound/send.js`, `templates.js`, `sequences.js`, and `bulk-send.js` already provide the core provider-backed and approval-aware mutation seams.
- `components/crm/outbound/outbound-workspace.tsx` already frames the queue, composer, sequence context, and evidence rail inside the CRM shell.

### Established Patterns
- Email routes through Resend while SMS and WhatsApp route through Twilio-backed adapters.
- Eligibility is evaluated before send and fails closed when consent or approval requirements are not satisfied.
- Scheduled sequence steps and send attempts are expected to emit CRM timeline and outbound evidence events rather than invisible background behavior.

### Integration Points
- Phase 104 extends the Phase 103 execution workspace by turning suggestion-only next steps into governed native send and schedule actions.
- Delivery, reply, and block telemetry should feed the same canonical CRM timeline that earlier phases established.
- Phase 105 reporting and copilots will rely on the outbound evidence and approval lineage created here.

## Deferred Ideas

- Autonomous AI sends and open-ended follow-through remain out of scope.
- A heavyweight inbox or full contact-center experience can wait for a later phase if still needed.
- Social publishing, ads execution, and broader external channel sprawl remain deferred.

---

*Phase: 104-native-outbound-execution*  
*Context gathered: 2026-04-14*