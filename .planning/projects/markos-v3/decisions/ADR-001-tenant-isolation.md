# ADR-001: Tenant Isolation Strategy

Status: Accepted
Date: 2026-04-02
Decision makers: Product and Engineering
Affects: Data architecture, API contracts, security posture

## Context

MarkOS v3 must support multiple independent customers on a shared platform while preventing cross-tenant leakage. The platform also needs a path for enterprise tenants requiring stronger isolation and compliance guarantees.

## Decision

Primary model:
- Shared PostgreSQL schema with strict tenant_id boundaries.
- RLS enforced on all tenant-scoped tables.
- Tenant context required for all application and agent operations.

Enterprise model:
- Optional dedicated deployment tier for approved enterprise tenants.
- Same logical data model and API contract preserved across shared and dedicated tiers.

## Rationale

1. Shared model with strict RLS gives fast delivery and efficient operations.
2. Dedicated tier gives enterprise onboarding flexibility without rewriting core product logic.
3. Unified data model reduces product complexity and test surface.

## Consequences

Positive:
- Fast path to multi-tenant SaaS scale.
- Strong tenant boundary guarantees when policies are tested.
- Clear monetization path for enterprise isolation tier.

Constraints:
- Every new table and query path must explicitly include tenant_id handling.
- Security test suites must include cross-tenant negative tests.
- Background jobs and agent workers must enforce tenant context at runtime.

## Alternatives considered

Alternative A: Separate database per tenant for all tiers.
- Rejected due to high operational overhead and migration complexity for SMB tiers.

Alternative B: Shared schema without RLS, enforced only in app code.
- Rejected due to unacceptable leakage risk and weak defense in depth.

## Success criteria

1. Cross-tenant reads and writes fail in policy and integration tests.
2. Tenant context is visible in logs and traces for all tenant operations.
3. Enterprise dedicated deployment can be provisioned without app-level contract changes.
