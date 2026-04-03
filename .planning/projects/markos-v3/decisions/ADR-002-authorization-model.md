# ADR-002: Authorization and Approval Model

Status: Accepted
Date: 2026-04-02
Decision makers: Product and Engineering
Affects: Identity, permissions, approvals, audit logs

## Context

MarkOS v3 supports multi-role teams and agent-assisted workflows. Authorization must enforce least privilege, preserve separation of duties, and provide immutable evidence for decisions.

## Decision

Use layered authorization:
- Tenant-level RBAC for account administration and billing.
- Workspace/project ACLs for delivery operations.
- Approval policy engine for high-impact actions.

Roles:
- owner
- tenant-admin
- manager
- contributor
- reviewer
- billing-admin
- readonly

High-impact actions require reviewer or higher privileges with immutable audit entries.

## Rationale

1. RBAC is understandable for B2B teams and scalable for agencies.
2. Project-level ACLs support practical collaboration boundaries.
3. Approval policy layer enforces safety for AI-assisted outputs.

## Consequences

Positive:
- Clear permission boundaries and governance.
- Better enterprise due diligence outcomes.
- Strong forensic traceability.

Constraints:
- Permission checks must run server-side and be tested.
- Role elevation and policy overrides must be auditable.
- Approval records must be append-only and queryable.

## Alternatives considered

Alternative A: Pure role checks only, no policy engine.
- Rejected due to insufficient control over high-risk actions.

Alternative B: Fully custom per-user permission sets.
- Rejected due to configuration complexity and operational fragility.

## Success criteria

1. Permission matrix is implemented and test-covered.
2. Unauthorized approval attempts are denied and logged.
3. Every approval decision includes actor, rationale, timestamp, and related artifact references.
