---
phase: 54-billing-metering-and-enterprise-governance
plan: 03
subsystem: auth-and-identity
tags: [billing, iam, sso, auth, tenant-isolation, tdd]
requires:
  - phase: 54-billing-metering-and-enterprise-governance
    plan: 01
    provides: Wave 0 IAM-04 and tenant auth contract coverage
  - phase: 54-billing-metering-and-enterprise-governance
    plan: 02
    provides: billing foundation and tenant-safe MarkOS ledger prerequisites
provides:
  - Session-backed tenant context helpers for protected MarkOS routes
  - Tenant-bound Supabase SSO start and callback contract surface
  - Canonical external-claim to IAM v3.2 role mapping with immutable identity evidence helpers
affects: [54-04, 54-05, 54-06]
tech-stack:
  added:
    - "@supabase/ssr"
  patterns: [fail-closed tenant auth, canonical IAM-only role mapping, immutable identity mapping evidence]
key-files:
  created:
    - lib/markos/auth/session.ts
    - lib/markos/identity/sso-bindings.ts
    - lib/markos/identity/role-mapping.ts
    - api/auth/sso/start.js
    - api/auth/sso/callback.js
    - supabase/migrations/54_identity_federation.sql
  modified:
    - package.json
    - app/(markos)/layout.tsx
    - onboarding/backend/runtime-context.cjs
decisions:
  - Keep enterprise federation on the existing Supabase auth stack instead of introducing a second session or SAML runtime.
  - Resolve external identity claims only to canonical IAM v3.2 roles and fail closed on escalation or unmapped claims.
  - Emit identity mapping evidence through the same immutable telemetry-style pattern already used for deny telemetry.
metrics:
  completed: 2026-04-03
  tasks: 3
  files: 9
---

# Phase 54 Plan 03: Billing, Metering, and Enterprise Governance Summary

**Session-backed app auth hardening plus tenant-bound SSO and canonical identity role-mapping foundations for IAM-04**

## Performance

- **Completed:** 2026-04-03
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments

- Replaced scaffold auth placeholders in the protected MarkOS layout with session-backed tenant-context resolution hooks so later billing and governance routes can fail closed on missing tenant state.
- Added a tenant SSO binding surface, SSO start and callback handlers, and a matching identity federation migration for provider bindings, mapping rules, and immutable mapping events.
- Implemented canonical external-claim mapping helpers that only resolve to IAM v3.2 roles and added identity evidence helpers in runtime-context for granted and denied mapping decisions.

## Verification

- `node --test test/tenant-auth/ui-authorization-negative-path.test.js test/auth/sso-role-mapping.test.js test/auth/sso-negative-path.test.js` -> PASS

## Task Commits

- No commit created in this execution pass.

## Files Created/Modified

- `package.json` - added `@supabase/ssr` for Next.js/Supabase session-backed auth wiring.
- `app/(markos)/layout.tsx` - removed scaffold role and tenant placeholders and switched the layout to session-backed tenant context with fail-closed denial rendering.
- `lib/markos/auth/session.ts` - added `requireMarkosSession` and `getActiveTenantContext` helpers plus session/tenant error constants.
- `lib/markos/identity/sso-bindings.ts` - added tenant/provider binding normalization and lookup helpers.
- `lib/markos/identity/role-mapping.ts` - added deterministic external-claim mapping and decision-recording helpers with canonical IAM-only outputs.
- `api/auth/sso/start.js` - added tenant-bound SSO start handling with fail-closed binding lookup behavior.
- `api/auth/sso/callback.js` - added callback-time canonical role mapping and mapping-decision recording.
- `onboarding/backend/runtime-context.cjs` - added immutable identity mapping evidence builders and telemetry emission helpers.
- `supabase/migrations/54_identity_federation.sql` - added tenant SSO binding, identity mapping rule, and identity mapping event tables with RLS enabled.

## Decisions Made

- Kept the Phase 54 identity foundation on Supabase auth and `@supabase/ssr` instead of introducing a second app-session mechanism.
- Made the role-mapping layer canonical-IAM-only so enterprise federation cannot widen the permission model beyond `IAM_V32_ROLES`.
- Preserved fail-closed route behavior by denying protected route rendering when tenant context is missing rather than inferring tenant scope.

## Deviations from Plan

### Shared planning ledgers left untouched

- `.planning/STATE.md`, `.planning/ROADMAP.md`, and `.planning/REQUIREMENTS.md` already had unrelated dirty changes before this execution pass.
- To avoid mixing closeout metadata with unrelated work, those shared planning files were not updated here.

### Minimal runtime surface used to satisfy locked contract coverage

- The new auth and SSO helpers are intentionally thin contract surfaces shaped to the Phase 54 tests and plan requirements.
- Deeper provider integration and downstream use of identity mapping evidence remain for later Phase 54 plans to consume.

## Issues Encountered

- The initial 54-03 verification failed because the expected auth/session, SSO, and identity mapping files did not exist and the protected layout still relied on scaffold placeholders.
- `onboarding/backend/runtime-context.cjs` also lacked immutable identity-mapping evidence helpers required by the deny-path tests.
- After adding the missing surfaces, the full targeted 54-03 verification suite passed.

## User Setup Required

- Enterprise SSO still requires tenant-specific Supabase provider metadata and attribute mappings to be configured in the Supabase dashboard before live federation can be exercised outside tests.

## Next Phase Readiness

- Phase 54 now has a real tenant-context seam for protected app routes, which unblocks entitlement-safe billing and governance UI work.
- Canonical SSO binding and identity-mapping evidence are available for later billing, governance, and access-review flows.
- 54-04 can now enforce billing entitlements against real tenant context instead of scaffold state.

## Self-Check: PASSED

- Summary file created at `.planning/phases/54-billing-metering-and-enterprise-governance/54-03-SUMMARY.md`.
- The targeted 54-03 verification command passed after the final code changes.
