# MarkOS v3 Architecture

## Overview

MarkOS v3 architecture is built as a shared-platform, strict-isolation, multi-tenant SaaS with four control planes:

1. Tenant Control Plane
2. Work Execution Plane
3. Agent Orchestration Plane
4. Billing and Observability Plane

All planes are linked by tenant identity, policy enforcement, and immutable audit trails.

## System layers

### Experience layer
- Public and authenticated web experiences
- Tenant and workspace switcher
- White-label rendering pipeline
- Role-aware feature gates

### Application layer
- Tenant context middleware
- RBAC authorization services
- MarkOS plan lifecycle APIs
- Billing and entitlement services
- Notification orchestration

### Agent layer
- Agent runtime coordinator
- Tool invocation policy engine
- Prompt and model registry
- Human approval and escalation workflows

### Data layer
- Supabase PostgreSQL with tenant_id on tenant-scoped tables
- RLS enforcement and policy tests
- Append-only records for approvals and plan versions
- Metering and audit event stores

### Operations layer
- Logs, traces, metrics, and SLO dashboards
- Alerting and incident workflows
- Backup, restore, and disaster recovery
- Security posture and compliance evidence collection

## Core domain model

- Tenant: legal and billing boundary
- Workspace: operational boundary inside tenant
- Project: delivery boundary for plans and approvals
- MIR: source of truth for business identity and context
- MSP: source of truth for strategic growth plans
- MarkOS Plan: versioned execution artifact
- Agent Run: immutable execution record with policy and telemetry

## Control flows

### Tenant-safe request flow
1. Resolve actor identity.
2. Resolve active tenant context.
3. Authorize action via RBAC and policy.
4. Execute with tenant-scoped query constraints.
5. Emit audit and telemetry records.

### Agent run flow
1. Create run envelope with tenant, project, actor, and policy profile.
2. Load approved context only.
3. Execute workflow steps and tool calls with scoped permissions.
4. Route high-impact actions to human approval gate.
5. Persist run result, cost, and lineage metadata.

### Billing flow
1. Capture entitlement and plan details.
2. Track usage events (tokens, runs, storage).
3. Aggregate usage to billing periods.
4. Reconcile invoice line items.
5. Trigger dunning and entitlement-safe degradations when needed.

## Non-negotiable architecture rules

1. No tenant-scoped service may execute without explicit tenant context.
2. No write path is allowed without authorization and audit emission.
3. No high-impact AI outcome is activated without policy-compliant approval.
4. All schema changes must include backward-compatible migration and rollback notes.
5. All critical workflows must emit traceable telemetry.

## Deployment baseline

- Shared production cluster with strict tenant isolation for standard tiers.
- Optional dedicated deployment tier for enterprise compliance needs.
- Region-aware deployment strategy for data residency requirements.

## Acceptance bar

Architecture is accepted when:
- RLS and policy tests prove tenant isolation.
- Security and audit controls are active for critical flows.
- Agent and billing telemetry close the observability loop.
- Disaster recovery exercises pass documented recovery objectives.
