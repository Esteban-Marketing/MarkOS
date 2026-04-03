# Technical Spec: Tenant Isolation

## Objective

Guarantee strict tenant boundaries across data access, APIs, background processing, and agent execution.

## Required controls

1. tenant_id on every tenant-scoped entity.
2. RLS policies on every tenant-scoped table.
3. Tenant context middleware required before business logic execution.
4. Background job payloads must include tenant_id and validate it before work starts.
5. Agent run envelopes must include tenant_id and project_id scope.

## Data access contract

- All repository methods must accept tenant-aware context.
- No unscoped table access for tenant entities.
- System-level operators must use explicit service-role workflows with audit trails.

## RLS policy baseline

Example policy shape:
- select policy: allow rows where row.tenant_id equals session tenant_id claim.
- insert policy: require new row tenant_id equals session tenant_id claim.
- update policy: require existing and new tenant_id equals session tenant_id claim.
- delete policy: restricted to elevated roles with audit logging.

## Testing requirements

1. Positive tests for authorized same-tenant access.
2. Negative tests for cross-tenant read/write attempts.
3. Policy tests for insert/update tenant_id tampering.
4. End-to-end tests proving tenant boundary preservation in API and agent flows.

## Operational requirements

- Security alerts on repeated cross-tenant denials.
- Tenant context in trace spans and audit events.
- Quarterly isolation regression suite runs.
