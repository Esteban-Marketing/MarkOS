# Phase 07 Detailed Backlog

## Scope

Implements requirements: TEN-01, TEN-02, TEN-03, TEN-04, IAM-01, IAM-02.

## Workstream A: Tenant data model and migration

### A1. Tenant core tables
- Create tables: tenants, tenant_memberships, workspaces.
- Add constraints and indexes for membership uniqueness and lookup speed.
- Dependency: none.
- Exit criteria: schema migration applies cleanly in staging.

### A2. Tenant scoping retrofit
- Add tenant_id to tenant-scoped existing tables.
- Backfill tenant_id for current records using deterministic mapping rules.
- Dependency: A1.
- Exit criteria: no null tenant_id values in tenant-scoped records.

### A3. RLS baseline policies
- Add select/insert/update/delete RLS policies for tenant-scoped tables.
- Add policy naming standard and migration comments.
- Dependency: A2.
- Exit criteria: cross-tenant reads and writes fail in policy tests.

## Workstream B: Identity and role model

### B1. Membership and role contracts
- Implement role enum: owner, tenant-admin, manager, contributor, reviewer, billing-admin, readonly.
- Add tenant_memberships role assignments and validation constraints.
- Dependency: A1.
- Exit criteria: role assignments are persisted and queryable.

### B2. Authorization service
- Build server-side authorization checker for tenant and project actions.
- Include least-privilege default deny behavior.
- Dependency: B1.
- Exit criteria: policy unit tests pass for all role-action combinations.

### B3. Project ACL layering
- Add workspace/project ACL support where role scope is narrower than tenant.
- Dependency: B2.
- Exit criteria: contributor access does not exceed assigned project ACL.

## Workstream C: Runtime enforcement

### C1. Tenant context middleware
- Add middleware to resolve tenant context on every authenticated request.
- Validate tenant access before handler execution.
- Dependency: A2, B2.
- Exit criteria: protected APIs reject missing/invalid tenant context.

### C2. Background and worker scoping
- Add tenant context requirements to async jobs and queue handlers.
- Dependency: C1.
- Exit criteria: worker tests show tenant context validation before execution.

### C3. Agent run scope guard
- Ensure agent run envelopes require tenant_id and project_id.
- Dependency: C2.
- Exit criteria: agent-run creation fails without tenant scope fields.

## Workstream D: Security and auditability

### D1. Denied access security events
- Emit security events for cross-tenant and role-denied attempts.
- Include actor_id, tenant_id, action, resource, timestamp, correlation_id.
- Dependency: C1, B2.
- Exit criteria: denied actions generate audit and security records.

### D2. Privileged action audit trail
- Ensure privileged actions emit immutable audit events.
- Dependency: D1.
- Exit criteria: audit queries show complete actor and decision history.

## Workstream E: Quotas and limits

### E1. Tenant entitlement model
- Define plan tier limits for projects, users, storage, and agent runs.
- Dependency: A1.
- Exit criteria: entitlement model persisted and retrievable by tenant.

### E2. Runtime quota enforcement
- Add enforcement checks for limit exceed events.
- Dependency: E1, C1.
- Exit criteria: over-limit operations are denied with explicit error codes.

## Workstream F: Validation and release gating

### F1. Test suite completion
- Unit tests: role checks, tenant context resolver, quota guards.
- Integration tests: RLS, API authorization, audit emission.
- Security negative tests: cross-tenant data access attempts.
- E2E tests: tenant switch + role-based access behavior.
- Dependency: all workstreams.
- Exit criteria: all mandatory tests pass.

### F2. Rollback and runbook
- Add rollback steps for migration and policy updates.
- Add troubleshooting runbook for tenant access incidents.
- Dependency: F1.
- Exit criteria: rollback can be executed in staging with no data corruption.

## Definition of done for Phase 07

1. Tenant-scoped entities are fully tenant_id controlled with RLS.
2. Authorization matrix is enforced server-side.
3. Cross-tenant access denial is test-proven.
4. Denied and privileged actions are fully auditable.
5. Quota controls are enforceable and observable.
6. Rollback and incident runbooks are documented.
