# Phase 51 Research: Multi-Tenant Foundation and Authorization

Date: 2026-04-03
Phase scope: TEN-01, TEN-02, TEN-03, IAM-01, IAM-02
Confidence baseline: HIGH for repo-grounded findings, MEDIUM where recommendations depend on new auth-hook behavior not yet implemented.

## Standard Stack

Prescriptive target stack for this phase, aligned to current repository architecture:

| Layer | Use | Existing in repo | Recommendation | Confidence |
|---|---|---|---|---|
| Runtime/API | Node + Vercel API wrappers + Next.js app | Yes (`api/*.js`, `onboarding/backend/*.cjs`, `next`) | Keep current runtime split; enforce tenant context in wrappers and runtime context module, not ad hoc in handlers. | HIGH |
| Auth token parsing | Supabase JWT claims | Yes (`requireHostedSupabaseAuth` in `runtime-context.cjs`) | Replace project-scope normalization with tenant membership resolution using signed JWT claims from `app_metadata`, fail closed when absent/ambiguous. | HIGH |
| Data isolation | PostgreSQL RLS via Supabase | Yes (`supabase/migrations/37_*.sql`, `47_*.sql`) | Standardize all tenant-scoped data on `tenant_id` and deny-by-default RLS with explicit `USING` and `WITH CHECK`. | HIGH |
| AuthZ model | Route/action policy matrix + DB-side permission checks | Partial (`lib/markos/rbac/policies.ts`) | Move from flat route-role checks to tenant-scoped IAM role resolution + action-level permission mapping for API and DB paths. | HIGH |
| Security telemetry | Sanitized structured events | Yes (`lib/markos/telemetry/events.ts`) | Add immutable cross-tenant denial events with actor, subject tenant, target tenant, reason code, request id; keep sanitizer mandatory. | HIGH |
| DB client | `@supabase/supabase-js` | Yes (currently `^2.58.0`) | Keep `@supabase/supabase-js`; pin/upgrade during phase execution to tested version and regenerate lockfile in same PR. | MEDIUM |
| Input contract validation | Type-safe payload validation | Not standardized for auth boundary | Add `zod` schemas for tenant headers/query/body and membership claims normalization at all entry points. | MEDIUM |

Version verification snapshot from npm registry (2026-04-03):
- `@supabase/supabase-js`: 2.101.1 (published 2026-03-31)
- `next`: 16.2.2 (published 2026-04-01)
- `react`: 19.2.4 (published 2026-01-26)
- `@supabase/ssr`: 0.10.0 (published 2026-03-30)

Repository delta note:
- Current `package.json` pins older versions (`@supabase/supabase-js` `^2.58.0`, `next` `^15.2.0`, `react` `^19.0.0`). Phase 51 can proceed without immediate framework upgrades, but auth and RLS work should target the current API semantics in docs.

## Architecture Patterns

### Pattern 1: Canonical Tenant Principal at Trust Boundary

Prescriptive rule:
- Resolve tenant principal once in hosted boundary wrappers (today: `requireHostedSupabaseAuth` in `onboarding/backend/runtime-context.cjs`), then attach immutable context object to request and pass through all handler calls.

Why this fits current repo:
- Existing wrappers already attach `req.markosAuth` in `api/config.js`, `api/status.js`, `api/migrate.js`, and `api/literacy/coverage.js`.
- Current principal is project-scope (`scopes` from `project_slug` claims). Replace with tenant-scope contract.

Required principal contract:
- `principal.actor_id`
- `principal.memberships[]` with `tenant_id` and IAM role
- `principal.active_tenant_id`
- `principal.auth_source` (`supabase_user` or `supabase_service_role`)
- `principal.request_id`

Fail-closed criteria:
- Missing token in hosted mode => 401
- Token without tenant claim/membership => 403
- Requested tenant not in membership => 403 + denial event
- Ambiguous active tenant (multi-membership with no explicit tenant) => 400/403 deterministic error (pick one and lock in tests)

Confidence: HIGH

### Pattern 2: Tenant-First Schema with Compatibility Bridge

Prescriptive rule:
- Introduce `tenant_id` on all tenant-scoped tables and make it the canonical partition key.
- Keep temporary compatibility reads from `workspace_id` and `project_slug` only during migration window.

Why this fits current repo:
- Existing relational schema is `workspace_id`-scoped (`37_markos_ui_control_plane.sql`, `47_operator_llm_management.sql`).
- Existing runtime and vector paths still rely on `project_slug` for scope.

Migration pattern:
1. Add `tenant_id` nullable + backfill from existing `workspace_id`/slug mapping.
2. Create tenant membership and role mapping tables.
3. Add dual-read compatibility layer in runtime context.
4. Add dual-write enforcement (`tenant_id` required on inserts).
5. Flip RLS policies to `tenant_id` claims/membership.
6. Remove legacy scope fallback after verification gate.

Confidence: HIGH

### Pattern 3: Layered Authorization (RBAC -> IAM Action Policies -> RLS)

Prescriptive rule:
- Keep three layers, all required:
1) Boundary check: token + tenant membership
2) Application action check: route/action permission map for IAM v3.2 roles
3) Data check: RLS `USING` and `WITH CHECK` on tenant_id

Why this fits current repo:
- `lib/markos/rbac/policies.ts` already has route allowlists; extend this to role-per-action matrix for `owner`, `tenant-admin`, `manager`, `contributor`, `reviewer`, `billing-admin`, `readonly`.
- Existing RLS already enabled; must be migrated from workspace-based checks to tenant-based checks.

Critical enforcement detail:
- Never rely on UI role checks alone; handlers and DB policies must enforce independently.

Confidence: HIGH

### Pattern 4: Denial-First Security Telemetry

Prescriptive rule:
- Every denied cross-tenant attempt must emit one immutable security event before returning response.

Why this fits current repo:
- `lib/markos/telemetry/events.ts` and `lib/markos/llm/telemetry-adapter.ts` already sanitize sensitive payload keys.

Required event schema additions:
- event name: `markos_tenant_access_denied`
- `actor_id`, `actor_role`, `active_tenant_id`, `target_tenant_id`, `resource_type`, `resource_id`, `action`, `decision_reason`, `request_id`, `timestamp`
- redacted payload only

Confidence: HIGH

### Pattern 5: Deterministic Context Propagation Across Agent Runs

Prescriptive rule:
- Extend orchestrator and downstream agent calls to require a runtime context object containing tenant principal, not just slug.

Why this fits current repo:
- `onboarding/backend/agents/orchestrator.cjs` currently takes `orchestrate(seed, slug)`.
- This shape is insufficient for tenant IAM and audit lineage.

Required signature transition:
- from: `orchestrate(seed, slug)`
- to: `orchestrate(seed, executionContext)` where `executionContext` includes `tenant_id`, actor, role, request_id, and correlation metadata.

Confidence: MEDIUM (implementation requires coordinated refactor across agent callsites)

## Don't Hand-Roll

| Problem | Do not build | Use instead | Why | Confidence |
|---|---|---|---|---|
| Row filtering authorization | Custom JS query post-filtering | PostgreSQL RLS policies (`USING` + `WITH CHECK`) | JS filtering leaks data and is bypass-prone; RLS is enforced at data engine layer. | HIGH |
| JWT trust model | Homegrown token format / unsigned claims | Supabase-issued JWT + validated required claims (`aud`, `sub`, `role`, metadata) | Existing auth path already Supabase-native; custom token systems increase security risk. | HIGH |
| Role evaluation in each route | Copy-pasted if/else role checks | Central action-permission map + helper API | Current route matrix exists; centralization prevents drift and privilege regressions. | HIGH |
| Denial logging strings | Ad hoc console logs | Structured telemetry events through existing sanitizer | Required for TEN-03 immutable audit evidence and no secret leakage. | HIGH |
| Migration side effects | Manual SQL edits without migration ledger | Numbered SQL migrations + migration ledger (`markos_migrations`) | Existing migration pattern in repo is deterministic and testable. | HIGH |

## Common Pitfalls

1. Tenant context fallback to global/default scope.
- Current analog: fallback behavior in local runtime mode and project slug defaults.
- Risk: accidental cross-tenant execution when explicit tenant is missing.
- Prevention: fail closed if `active_tenant_id` is absent on protected operations.
- Confidence: HIGH.

2. RLS policies that filter SELECT but allow unsafe INSERT/UPDATE.
- Cause: missing explicit `WITH CHECK` clauses.
- Prevention: define both `USING` and `WITH CHECK` for tenant-scoped writes; verify with negative tests.
- Confidence: HIGH (official Postgres/Supabase guidance).

3. Trusting `user_metadata` for authorization.
- Cause: claim source confusion.
- Prevention: only trust immutable/admin-managed claims (`app_metadata`) for authZ decisions.
- Confidence: HIGH.

4. Service role bypass leaking into user request paths.
- Cause: mixed use of service-role credentials and user-level calls.
- Prevention: isolate service-role operations to explicit admin pipelines; never infer user tenant from service role token.
- Confidence: HIGH.

5. Role migration with silent privilege widening.
- Current analog: old roles (`owner`, `operator`, `strategist`, `viewer`, `agent`) differ from IAM v3.2 role set.
- Prevention: create explicit old->new mapping table, include deny-by-default for unmapped roles, and run route/action parity tests.
- Confidence: HIGH.

6. Incomplete denial auditing.
- Cause: returning 403 before event emit or logging unsanitized payloads.
- Prevention: enforce deny-event helper that emits before response and auto-sanitizes payload.
- Confidence: HIGH.

7. RLS race conditions when policy subqueries depend on mutable membership tables.
- Prevention: prefer direct tenant_id checks and stable helper functions; lock membership update workflow and verify under concurrent tests.
- Confidence: MEDIUM.

## Code Examples

Example 1: hosted boundary tenant principal resolution (repository-adapted pseudocode)

```javascript
// Runtime boundary extension of requireHostedSupabaseAuth
function requireHostedTenantAuth({ req, runtimeContext, operation }) {
  const auth = requireHostedSupabaseAuth({ req, runtimeContext, operation });
  if (!auth.ok) return auth;

  const requestedTenantId = readHeader(req, 'x-markos-tenant-id') || getTenantFromQuery(req);
  const memberships = normalizeTenantMemberships(auth.token_payload); // app_metadata only

  if (!requestedTenantId) {
    return deny('TENANT_CONTEXT_REQUIRED', 403);
  }

  const membership = memberships.find((m) => m.tenant_id === requestedTenantId);
  if (!membership && auth.principal.type !== 'supabase_service_role') {
    return deny('TENANT_SCOPE_DENIED', 403);
  }

  return {
    ok: true,
    principal: {
      actor_id: auth.principal.id,
      auth_source: auth.principal.type,
      memberships,
      active_tenant_id: requestedTenantId,
      active_role: membership ? membership.role : 'service_role',
      request_id: readHeader(req, 'x-request-id') || crypto.randomUUID(),
    },
  };
}
```

Example 2: tenant-safe RLS policy shape (Postgres/Supabase pattern)

```sql
alter table markos_operator_llm_preferences enable row level security;

create policy markos_operator_llm_preferences_tenant_select
on markos_operator_llm_preferences
for select
to authenticated
using (
  tenant_id = (auth.jwt() ->> 'tenant_id')
);

create policy markos_operator_llm_preferences_tenant_update
on markos_operator_llm_preferences
for update
to authenticated
using (
  tenant_id = (auth.jwt() ->> 'tenant_id')
)
with check (
  tenant_id = (auth.jwt() ->> 'tenant_id')
);
```

Example 3: cross-tenant denial event helper

```typescript
import { buildEvent } from "lib/markos/telemetry/events";

export function emitTenantDeny(emit: (event: unknown) => void, payload: {
  actorId: string;
  actorRole: string;
  activeTenantId: string | null;
  targetTenantId: string | null;
  action: string;
  resourceType: string;
  resourceId: string;
  reason: string;
  requestId: string;
}) {
  emit(buildEvent({
    name: "markos_access_denied",
    workspaceId: payload.activeTenantId || "unknown-tenant",
    role: payload.actorRole,
    requestId: payload.requestId,
    payload: {
      actor_id: payload.actorId,
      active_tenant_id: payload.activeTenantId,
      target_tenant_id: payload.targetTenantId,
      action: payload.action,
      resource_type: payload.resourceType,
      resource_id: payload.resourceId,
      decision_reason: payload.reason,
      denial_class: "cross_tenant",
    },
  }));
}
```

Source anchors used for examples:
- Existing runtime boundary contract in `onboarding/backend/runtime-context.cjs`
- Existing event sanitization in `lib/markos/telemetry/events.ts`
- Existing RLS baseline in `supabase/migrations/37_markos_ui_control_plane.sql` and `supabase/migrations/47_operator_llm_management.sql`
- Official RLS semantics and claim guidance from PostgreSQL and Supabase docs.

## Phase 51 Implementation Recommendations

Prescriptive plan intended for direct consumption by gsd-plan-phase:

1. Introduce canonical tenant identity model in DB.
- Add tables: `markos_tenants`, `markos_tenant_memberships`, `markos_role_bindings` (or equivalent naming).
- Add `tenant_id` to all tenant-scoped tables currently keyed by `workspace_id`.
- Backfill `tenant_id` from workspace mapping and keep compatibility reads for transition window only.

2. Replace project-scope auth normalization with tenant membership normalization.
- Extend `requireHostedSupabaseAuth` to resolve tenant memberships and active tenant.
- Deprecate direct `project_slug` scope enforcement for protected routes.
- Enforce explicit tenant selection from header/query/body on all write and sensitive read endpoints.

3. Implement IAM v3.2 role set with explicit compatibility mapping.
- Define canonical roles: owner, tenant-admin, manager, contributor, reviewer, billing-admin, readonly.
- Add compatibility mapping from legacy roles in `lib/markos/rbac/policies.ts` and deny unmapped roles.
- Move to action-scoped checks instead of only route-level checks.

4. Migrate RLS from `workspace_id` to `tenant_id` and enforce write constraints.
- For each tenant table, create explicit select/insert/update/delete policies with role scoping.
- Add `WITH CHECK` on insert/update.
- Add indexes on `tenant_id` and join keys used in policies.

5. Make tenant context propagation deterministic in handlers and orchestrator.
- Define an `ExecutionContext` object and require it for handler internals and orchestrator entrypoints.
- Remove bare `(seed, slug)` calls in protected paths.
- Ensure request id and tenant id propagate into all telemetry and DB writes.

6. Implement TEN-03 denial auditing as first-class behavior.
- Add centralized deny helper that emits structured telemetry before returning 403.
- Ensure payload passes through sanitizer and includes immutable identifiers.
- Add negative-path tests for all high-risk flows in FLOW-INVENTORY (at minimum config/status/migrate/literacy coverage and onboarding write operations).

7. Add role migration safety gate.
- Build a role mapping test matrix from legacy to v3.2 IAM roles.
- Require explicit review for each route/action pair where effective permissions change.
- Block rollout if any route has broadened access without approved migration rationale.

8. Sequence rollout in fail-closed waves.
- Wave A: schema + compatibility columns + read bridges.
- Wave B: auth boundary + principal propagation.
- Wave C: IAM action checks.
- Wave D: RLS enforcement flip and legacy scope retirement.
- Wave E: denial auditing and regression hardening.

## Verification Strategy

Validation mode is enabled in `.planning/config.json` (`workflow.nyquist_validation: true`), so this phase should include explicit test architecture.

Requirement-to-verification map:

| Requirement | Verification focus | Required tests |
|---|---|---|
| TEN-01 | All tenant-scoped rows are partitioned and RLS-enforced by tenant_id | SQL migration tests for tenant_id presence; RLS negative tests for cross-tenant select/update/insert/delete |
| TEN-02 | Tenant context required through UI/API/agent run path | API tests for missing tenant context -> fail closed; propagation tests asserting tenant_id/request_id continuity into handlers/orchestrator |
| TEN-03 | Cross-tenant denial is blocked and logged | API negative tests asserting 403 plus immutable denial event captured with sanitized payload |
| IAM-01 | Deterministic membership + active role resolution | Unit tests for claim parsing/membership resolver; conflict/ambiguity tests |
| IAM-02 | Role boundary enforcement for v3.2 role set | Policy matrix tests (route/action x role); migration parity tests against legacy roles |

Prescriptive test commands (existing framework):
- Quick loop: `node --test test/**/*.test.js`
- Phase-focused suites to add:
  - `test/tenant-auth/runtime-context.tenant-auth.test.js`
  - `test/tenant-auth/rls-tenant-isolation.test.js`
  - `test/tenant-auth/iam-role-matrix.test.js`
  - `test/tenant-auth/tenant-denial-audit.test.js`

Acceptance gates:
1. No cross-tenant read/write leakage in required tests.
2. All protected endpoints fail closed when tenant context is missing.
3. Denial events emitted with request id and sanitized payload.
4. Legacy role compatibility mapping complete and reviewed.
5. RLS policy diff reviewed for every tenant table touched.

## Open Questions

1. Canonical identity naming transition.
- Question: Should `workspace_id` remain as a long-term alias or be fully retired after tenant migration?
- Impact: schema churn and API compatibility duration.
- Confidence: MEDIUM.

2. Membership claim source of truth.
- Question: Will memberships be embedded in JWT (`app_metadata`) via Auth Hook, or fetched server-side from DB each request?
- Recommendation: Use JWT for boundary fast-path, DB check for high-risk actions or stale-token mitigation.
- Confidence: MEDIUM.

3. Service role behavior.
- Question: Which operations are allowed to execute with service-role bypass in hosted mode, and what additional audit requirements apply?
- Impact: security boundary clarity for operational/admin flows.
- Confidence: MEDIUM.

4. Orchestrator refactor blast radius.
- Question: Which non-HTTP invocation paths call `orchestrate(seed, slug)` and must be migrated to execution context?
- Impact: hidden propagation gaps.
- Confidence: MEDIUM.

5. Legacy data migration strategy for vector namespaces.
- Question: How should `project_slug`-scoped vector records map to tenant identity for mixed historical datasets?
- Impact: data continuity for retrieval and telemetry lineage.
- Confidence: LOW.

Primary external sources used:
- PostgreSQL Row Security Policies: https://www.postgresql.org/docs/current/ddl-rowsecurity.html
- Supabase Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase JWT claims reference: https://supabase.com/docs/guides/auth/jwt-fields
- Supabase Custom Claims and RBAC: https://supabase.com/docs/guides/api/custom-claims-and-role-based-access-control-rbac
