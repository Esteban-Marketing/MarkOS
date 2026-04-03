# Phase 08 Detailed Backlog

## Scope

Implements requirements: WL-01, WL-02, WL-03, WL-04.

## Workstream A: Branding data model and governance

### A1. Tenant branding schema
- Create tables: tenant_brand_profiles, tenant_brand_assets, tenant_brand_versions.
- Add constraints for active version uniqueness per tenant.
- Dependency: Phase 07 tenant model complete.
- Exit criteria: migrations apply cleanly; one active brand profile per tenant is enforced.

### A2. Brand token contract
- Define canonical token set: logo_url, primary, secondary, accent, text, surface, success, warning, error.
- Add server-side validation for color formats, contrast baseline, and required keys.
- Dependency: A1.
- Exit criteria: invalid token payloads are rejected with typed error responses.

### A3. Versioning and rollback contract
- Implement append-only version records for every branding change.
- Add rollback operation that re-points active version without destructive writes.
- Dependency: A1, A2.
- Exit criteria: previous brand version can be restored in one operation with audit evidence.

## Workstream B: White-label admin UX

### B1. Branding configuration screens
- Build tenant admin screens for logo upload, color tokens, typography options, and preview.
- Add role guard: owner and tenant-admin only.
- Dependency: A2.
- Exit criteria: authorized users can create and publish branding updates.

### B2. Safe preview pipeline
- Add isolated preview mode that does not affect active tenant delivery.
- Add validation summary panel with pass/fail checks before publish.
- Dependency: B1.
- Exit criteria: preview and publish flows are distinct and test-covered.

### B3. Asset validation and storage safety
- Validate upload file type, dimensions, and max size.
- Enforce tenant-scoped storage paths and cache keys.
- Dependency: B1.
- Exit criteria: cross-tenant asset access attempts fail and are logged.

## Workstream C: Runtime theming and fallback behavior

### C1. Tenant theme resolver middleware
- Resolve active tenant brand profile at request/render boundaries.
- Cache by tenant and version id with invalidation on publish/rollback.
- Dependency: A3.
- Exit criteria: theme resolution latency and cache hit metrics are visible.

### C2. UI token application
- Apply brand tokens to tenant-facing layout, key pages, and component primitives.
- Keep accessible fallback palette for broken or missing token sets.
- Dependency: C1.
- Exit criteria: tenant UI renders branded output with no cross-tenant bleed.

### C3. Failure-safe degradation
- On resolver/token failure, fall back to default safe theme and show internal warning event.
- Ensure end-user flow remains usable during fallback.
- Dependency: C1.
- Exit criteria: forced failure test confirms graceful degradation without 5xx cascade.

## Workstream D: Branded notifications and template delivery

### D1. Template model extension
- Add tenant-aware template variants for transactional and lifecycle notifications.
- Support locale-aware rendering while preserving existing i18n behavior.
- Dependency: A1.
- Exit criteria: template selection resolves by tenant + locale deterministically.

### D2. Notification rendering integration
- Inject brand payload into notification rendering pipeline.
- Ensure mandatory legal footer and unsubscribe controls remain intact.
- Dependency: D1.
- Exit criteria: outbound notifications render brand assets and tokens per tenant.

### D3. Notification fallback policy
- If brand template missing, fall back to default template with tenant name injection.
- Emit alert-level event for template gap.
- Dependency: D2.
- Exit criteria: missing templates do not block notification delivery.

## Workstream E: Custom domain onboarding and routing

### E1. Domain registration flow
- Add tenant domain registration API with ownership validation lifecycle.
- Store domain status: requested, validating, active, failed.
- Dependency: A1.
- Exit criteria: tenant can register and monitor custom domain status.

### E2. Verification and certificate workflow
- Implement DNS verification checks and certificate provisioning orchestration.
- Add retry/backoff and timeout rules.
- Dependency: E1.
- Exit criteria: domain can reach active state with certificate attached.

### E3. Routing fallback and recovery
- Route to platform default domain when custom domain unhealthy.
- Add health checks and automatic recovery transition when domain becomes healthy.
- Dependency: E2.
- Exit criteria: outage simulation proves zero hard downtime due to domain misconfiguration.

## Workstream F: Security, audit, and release gating

### F1. Security and compliance checks
- Add tests for cross-tenant theme/template/domain leakage attempts.
- Verify only authorized roles can change branding/domain config.
- Dependency: B1, D1, E1.
- Exit criteria: all white-label security negative tests pass.

### F2. Audit event coverage
- Emit immutable audit events for create, publish, rollback, domain changes, and template updates.
- Include actor_id, tenant_id, action, target, version_id, correlation_id.
- Dependency: A3, B1, E1.
- Exit criteria: audit queries reconstruct complete branding and domain history.

### F3. Validation and rollout checklist
- Visual regression suite across at least 3 tenant brand profiles.
- Domain onboarding integration tests for requested->active and failed->recovered paths.
- Rollback drill for branding and template versions.
- Dependency: all workstreams.
- Exit criteria: Phase 08 acceptance gate evidence is complete.

## Definition of done for Phase 08

1. Tenant branding config is isolated, validated, and versioned.
2. White-label UI and notifications are tenant-correct and rollback-safe.
3. Custom domains support verification, active routing, and safe fallback.
4. Security and audit evidence cover all privileged white-label operations.
5. Release gate includes visual, integration, and failure-path verification.