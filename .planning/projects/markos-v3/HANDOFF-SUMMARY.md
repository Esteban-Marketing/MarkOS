# MarkOS v3 Handoff Summary

## Purpose

This document is the concise briefing for the external coding LLM that will implement MarkOS v3.

MarkOS v3 target:
- B2B SaaS for digital marketing teams
- AI-first and agentic-ready
- Multi-tenant by default
- White-label enabled
- Enterprise readiness baseline

## Start here

1. Read UPLOAD-MANIFEST.md and follow file order exactly.
2. Treat PROJECT.md, REQUIREMENTS.md, ROADMAP.md, ARCHITECTURE.md, and ADRs as authoritative.
3. Use MASTER-IMPLEMENTATION-PROMPT.md for primary planning.
4. Use role prompts only after master prompt output is complete.
5. Execute work in phase order 07 -> 08 -> 09 -> 10.

## Non-negotiable implementation constraints

1. Tenant isolation must be enforceable and test-proven.
2. RLS must protect tenant-scoped tables.
3. High-impact AI actions must require approval gates.
4. Privileged actions must emit immutable audit records.
5. Metering must reconcile to invoices.
6. Prompt/model/provider lineage must be queryable.
7. Rollback paths are required for schema and workflow changes.

## Phase execution map

Phase 07:
- Multi-tenant schema, RLS, tenant context middleware, RBAC, denied-access security events.
- Key files: phases/07-multi-tenant-foundation/07-CONTEXT.md, 07-01-PLAN.md, 07-02-BACKLOG.md.

Phase 08:
- White-label config, runtime theming, branded templates, custom domains, rollback-safe branding versions.
- Key files: phases/08-white-label-and-tenant-experience/08-CONTEXT.md, 08-01-PLAN.md, 08-02-BACKLOG.md.

Phase 09:
- Agent lifecycle engine, provider routing/failover, MIR/MSP lineage, approval gates, run telemetry.
- Key files: phases/09-agentic-markos-orchestration/09-CONTEXT.md, 09-01-PLAN.md, 09-02-BACKLOG.md.

Phase 10:
- Subscriptions/entitlements, billing/metering reconciliation, compliance/privacy operations, SLO/incident runbooks.
- Key files: phases/10-billing-compliance-enterprise-ops/10-CONTEXT.md, 10-01-PLAN.md, 10-02-BACKLOG.md.

## Minimum acceptable outputs from external coding LLM

1. Requirement-by-requirement implementation mapping with tests and telemetry.
2. Concrete schema migration plan with RLS and rollback notes.
3. API contract matrix with auth roles, idempotency, audit event emissions.
4. Agent orchestration contracts with approval, retry, timeout, and failover behavior.
5. Billing and metering design with reconciliation controls.
6. Security/compliance validation plan with measurable release gates.

## Rejection criteria

Reject the external output if any of the following are missing:
- Tested tenant boundary enforcement.
- Approval gate coverage for high-impact actions.
- Audit event contracts for privileged operations.
- Metering-to-invoice reconciliation proof path.
- Explicit rollback strategy.

## Done criteria for this handoff package

This package is considered complete when:
1. All v3 requirements have phase and verification mapping.
2. All four phase folders include context, plan, and detailed backlog.
3. Prompt package includes master, mega, and role prompts.
4. Upload order and acceptance gates are explicit.