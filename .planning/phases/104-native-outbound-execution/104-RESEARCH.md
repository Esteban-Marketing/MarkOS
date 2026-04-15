# Phase 104: Native Outbound Execution - Research

**Researched:** 2026-04-15  
**Domain:** governed CRM-native outbound across email, SMS, and WhatsApp with consent-safe execution and timeline writeback  
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** The first release is email-first in depth and polish, while still shipping real SMS and WhatsApp support.
- **D-02:** Operators can use both one-off sends and governed sequences in this phase.
- **D-03:** High-risk, re-engagement, and bulk outbound require approval by default.
- **D-04:** Consent, suppression, and eligibility remain channel-specific and fail closed.
- **D-05:** Human operators stay in control; no autonomous external sending belongs here.
- **D-06:** Outbound work should feel natural from the CRM record context and outbound queue together.
- **D-07:** Delivery, block, reply, and approval evidence should write back to the CRM timeline first.
- **D-08:** The evidence rail should foreground consent, approval, and recent outbound events.

### Deferred Ideas (OUT OF SCOPE)
- Autonomous AI sends or hidden background outbound loops
- Heavyweight inbox-first contact-center productization
- Social, ads, or broader channel sprawl
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| OUT-01 | Native email, SMS, and WhatsApp execution is consent-safe with suppression, opt-out, and channel-policy enforcement. | Reuse the existing provider adapter contract, channel-specific consent eligibility, and approval-aware send or sequence seams. |
| OUT-02 | Delivery, reply, and conversation telemetry writes back into CRM timelines and reporting views. | Reuse the current outbound evidence model and CRM timeline writeback path rather than introducing a detached messaging ledger. |
</phase_requirements>

## Project Constraints

- Keep the current Node.js, Next.js, and contract-first CRM stack; do not replatform.
- Preserve tenant-safe and approval-aware boundaries from prior phases.
- Keep outbound execution grounded in the CRM workspace and timeline, not a separate system of record.
- Do not ship autonomous AI sending in this phase.

## Summary

Phase 104 should be planned as a completion and hardening phase for an outbound execution foundation that already exists in the repository. The repo already contains provider-backed send logic, template and sequence APIs, bulk-send guardrails, channel-specific consent evaluation, sequence scheduling, webhook normalization, CRM timeline writeback, and an outbound workspace shell. The main planning task is therefore to formalize and lock the product posture: email-first depth with real SMS and WhatsApp support, one-off sends plus governed sequences, approval-aware higher-risk work, and CRM-timeline-first evidence.

**Primary recommendation:** treat the current outbound stack as the canonical foundation and harden operator flow, approval semantics, and evidence continuity rather than building a new messaging platform.

## Current Verification Evidence

A fresh outbound baseline run is already green:

- `node --test test/crm-outbound/*.test.js`
- **Result:** 13 passing, 0 failing

That confirms the repo already has a real outbound substrate to build on for Phase 104.

## Existing Reusable Code

| Asset | What already exists | Planning implication |
|------|----------------------|----------------------|
| `lib/markos/outbound/consent.ts` | channel-safe eligibility, opt-out handling, WhatsApp window checks, and approval requirements | keep this as the outbound governance truth layer |
| `lib/markos/outbound/providers/base-adapter.ts` | unified channel capability contract across Resend and Twilio-backed channels | preserve one provider abstraction instead of branching by channel in the UI |
| `lib/markos/outbound/scheduler.ts` | sequence timing and due-work selection | keep sequence behavior scheduled and explicit |
| `lib/markos/outbound/workspace.ts` | outbound queue, templates, sequences, evidence, and consent snapshot hydration | reuse this as the operator workspace truth |
| `api/crm/outbound/send.js` | one-off send path with eligibility and provider-backed delivery | extend or harden this seam rather than replacing it |
| `api/crm/outbound/templates.js` | governed template CRUD seam | use for reusable message content and template enforcement |
| `api/crm/outbound/sequences.js` | approval-aware sequence launch and queued scheduling | use for governed follow-up orchestration |
| `api/crm/outbound/bulk-send.js` | fail-closed bulk preview and approval guardrails | preserve conservative bulk-send posture |
| `components/crm/outbound/outbound-workspace.tsx` | queue, composer, sequence context, and evidence-rail shell | keep the CRM-native workspace posture |
| `components/crm/outbound/outbound-consent-gate.tsx` | consent and approval evidence surface | keep governance visible to operators |
| `test/crm-outbound/*.test.js` | send, consent, sequence, telemetry, workspace, and writeback coverage | use as the TDD rail for the phase |

## Verified Gaps to Address

1. **The code foundation is already real, but the phase still needs an execution-ready planning bundle.**
2. **Email-first emphasis should stay explicit in planning and polish decisions without degrading the real SMS and WhatsApp paths.**
3. **CRM-timeline-first evidence must remain the primary truth, not a detached inbox experience.**
4. **Approval boundaries must remain highly visible and consistent across one-off, sequence, and bulk paths.**

## Architecture Patterns

### Pattern 1: One CRM-native outbound desk
Operators should work from one outbound queue and composer experience connected to the CRM record and timeline, not a separate campaigns product.

### Pattern 2: Channel-specific governance, shared operator grammar
Email, SMS, and WhatsApp each have distinct consent and capability rules, but the operator-facing workflow should still feel coherent.

### Pattern 3: Approval-aware execution over hidden automation
Sequences and higher-risk sends should be scheduled, reviewable, and audit-backed rather than silently self-executing.

### Pattern 4: Timeline-first telemetry
Delivery, reply, opt-out, and block events should continue to enrich the canonical CRM activity ledger.

## Likely Task Waves

### Wave 0: Regression-first outbound guardrails
- keep red-path coverage for channel-safe consent failures, approval-required sends, bulk-send gates, sequence scheduling, and timeline writeback

### Wave 1: Workspace and send-flow hardening
- preserve the queue-plus-record outbound posture with email-first operator polish
- keep one-off sends and sequences available from the same governed surface

### Wave 2: Consent, approval, and telemetry continuity
- ensure delivery, block, reply, and opt-out events stay coherent across providers and channels
- keep evidence readable in the CRM shell and timeline

## Recommended Implementation Order

1. Add or strengthen the regressions that lock the chosen governance and operator posture.
2. Tighten the shared outbound workspace and composer flow before touching provider-specific behavior.
3. Verify consent and approval continuity across direct sends, sequences, and bulk paths.
4. Re-run the full outbound suite before phase closeout.

## Don’t Hand-Roll

| Problem | Don’t Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| per-channel UI silos | separate products for email, SMS, and WhatsApp | one shared outbound workspace with channel-specific rules underneath | keeps operator behavior consistent |
| permissive send logic | ad hoc UI-level send checks | `consent.ts` eligibility and approval evaluation | preserves fail-closed governance |
| hidden sequence automation | background-only automation with weak visibility | scheduled queue items and evidence events | preserves auditability |
| detached conversation storage | separate message truth outside CRM timeline | CRM timeline writeback and outbound evidence rail | keeps one canonical record story |

## Risks

| Risk | Level | Mitigation |
|------|-------|------------|
| Consent or suppression drift by channel | Critical | keep channel-safe eligibility centralized in `consent.ts` |
| Scope leak into autonomous AI sending | High | maintain explicit approval and human-control boundaries |
| Workspace fragmentation | High | keep queue, composer, and evidence in the same CRM-native shell |
| Telemetry becoming provider-specific and inconsistent | High | preserve normalized event handling and CRM timeline writeback |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js built-in test runner |
| Quick run command | `node --test test/crm-outbound/crm-consent-eligibility.test.js test/crm-outbound/crm-sequence-approval.test.js` |
| Full phase slice command | `node --test test/crm-outbound/*.test.js` |
| Current fresh evidence | 13 pass / 0 fail |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| OUT-01 | consent-safe and approval-aware outbound send behavior across channels | unit / integration | outbound full phase slice | ✅ |
| OUT-02 | delivery, reply, and telemetry writeback remain CRM-visible and normalized | unit / integration | outbound full phase slice | ✅ |

## Sources

### Primary (HIGH confidence)
- current repo artifacts under `api/crm/outbound/`, `components/crm/outbound/`, `lib/markos/outbound/`, and `test/crm-outbound/`
- Phase 104 product decisions captured in `104-CONTEXT.md`

## Metadata

**Confidence breakdown:**
- Architecture: HIGH — grounded in the live outbound send and workspace seams
- Validation: HIGH — the outbound regression slice is fully green
- Risks: HIGH — directly supported by approval, consent, and writeback patterns already present

**Research date:** 2026-04-15  
**Valid until:** 2026-05-15
