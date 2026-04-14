# CRM / Customer Intelligence Risk Brief for MarkOS

**Domain:** Agentic marketing platform with CRM, outbound, attribution, and AI workflow surfaces  
**Researched:** 2026-04-14  
**Confidence:** High for platform-specific risks; Medium for cross-jurisdiction compliance details

## Executive Summary

Adding CRM and customer intelligence to an agentic marketing platform does not usually fail because the schema is missing. It fails when the system makes the wrong customer-level decision with high confidence and then operationalizes it across messaging, automation, and reporting.

For MarkOS, the highest-risk zones are already visible in the milestone structure: tenant-scoped data boundaries, identity stitching, consent-aware outbound execution, approval-gated agent workflows, and attribution/reporting integrity. The most dangerous combined failure is: **bad identity merge + autonomous send + drifted attribution**, because it creates legal, reputational, and analytics damage at the same time.

## Key Risks, Prevention, and Owning Phases

| Risk Area | Severity | Typical Failure Modes | Prevention Strategy | Phase Ownership |
|-----------|----------|-----------------------|---------------------|-----------------|
| **Tenant isolation failure** | Critical | Cross-tenant reads in CRM tables, shared rollups leaking foreign records, vector or cache scope bleed, service-role bypass used in the wrong surface | Enforce RLS and fail-closed auth on every CRM table; require tenant context on all reads and writes; keep central rollups explicit and denied by default; test negative cross-tenant paths | **Phase 58** owns schema and RLS boundaries; **Phase 64** owns reporting-scope containment |
| **Identity merge errors** | Critical | False-positive person merges, anonymous history attached to the wrong contact, duplicate account graphs, irreversible lineage corruption, wrong lead score or next-best action | Default ambiguous matches to review-only; require high-signal evidence for acceptance; keep merge decisions and lineage immutable and reversible; expose operator review before permanent stitch | **Phase 58** owns identity graph model; **Phase 59** owns stitching rules; **Phase 63** owns agent use of merged identities |
| **Outbound compliance breaches** | Critical | Sending without valid consent, channel rules mixed together, promotional content mislabeled as transactional, opt-out not honored quickly, vendor sends assumed to shift liability | Maintain per-channel consent ledger and suppression lists; hard-block sends without tenant context or consent proof; distinguish transactional vs promotional flows; keep audit evidence for who sent what and why | **Phase 62** owns send controls and delivery telemetry; **Phase 63** owns approval-gated agent behaviors |
| **Workflow complexity explosion** | High | Duplicate tasks, recursive agent loops, too many branching automations, hidden side effects, conflicting next actions between sales, success, and AI copilots | Use bounded mutation schemas, idempotency keys, replay-safe jobs, human approval on high-impact actions, and operator-visible playbooks with stop or retry controls | **Phase 61** owns operator workflow UX; **Phase 63** owns agent orchestration safety |
| **Reporting drift** | High | UTM drift, event naming drift, attribution weights diverging from ledger truth, dashboards mixing tenant and central scope, stale merges rewriting historical funnel math | Version event and attribution contracts; store lineage for merges and touches; add readiness and completeness checks; reconcile dashboards back to the immutable activity ledger; flag degraded attribution explicitly | **Phase 59** owns tracking contracts; **Phase 64** owns attribution, verification, and cockpit reconciliation |

## Practical Guardrails

1. **Fail closed, not open** for missing tenant or consent context.
2. **Treat identity merges as governance events**, not convenience writes.
3. **Separate “can draft” from “can send.”** Agentic suggestions are much safer than autonomous execution.
4. **Keep one canonical activity ledger** and derive reports from it rather than hand-built dashboard logic.
5. **Require evidence rails** on every customer-facing recommendation, send, and attribution claim.

## Recommended Ownership Rule

If this risk can cause **wrong customer data**, it belongs first to **Phase 58 or 59**.  
If it can cause **wrong customer contact**, it belongs first to **Phase 62 or 63**.  
If it can cause **wrong executive decision-making**, it belongs first to **Phase 64**.

## Source Basis

### MarkOS internal evidence
- Existing CRM roadmap structure already separates schema, stitching, outbound, agentic ops, and reporting into Phases 58-64.
- Current tests enforce tenant-scoped CRM tables, review-only identity candidates, outbound fail-closed behavior, and reporting scope isolation.

### Official external guidance
- Supabase RLS guidance: exposed data tables should use row-level security and fail safely when unauthenticated.
- Twilio Segment Unify guidance: identity resolution needs merge protection and server-side protected profile access.
- FTC CAN-SPAM guidance: commercial messages require accurate sender info, opt-out mechanisms, and prompt honor of unsubscribes.
- ICO PECR guidance: unsolicited email or SMS marketing often needs clear consent records and easy withdrawal, with the instigating brand still responsible.
