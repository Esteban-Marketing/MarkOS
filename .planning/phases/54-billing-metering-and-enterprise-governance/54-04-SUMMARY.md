---
phase: 54-billing-metering-and-enterprise-governance
plan: 04
subsystem: entitlement-enforcement
tags: [billing, entitlements, runtime-enforcement, plugin-runtime, fail-closed, tdd]
requires:
  - phase: 54-billing-metering-and-enterprise-governance
    plan: 02
    provides: billing ledger and pricing foundation
  - phase: 54-billing-metering-and-enterprise-governance
    plan: 03
    provides: session-backed tenant context and canonical IAM/SSO foundation
provides:
  - Shared entitlement snapshot and billing-policy evaluator for request-time enforcement
  - Plugin-runtime capability gating tied to MarkOS entitlement state instead of downstream provider state
  - Runtime and execution-boundary hooks for billing-policy denial before restricted actions proceed
affects: [54-05, 54-06]
tech-stack:
  added: []
  patterns: [shared entitlement snapshot, fail-closed billing policy, MarkOS-ledger-first enforcement]
key-files:
  created:
    - lib/markos/billing/entitlements.cjs
    - lib/markos/billing/entitlements.ts
    - lib/markos/billing/enforcement.cjs
    - lib/markos/billing/plugin-entitlements.cjs
    - supabase/migrations/54_entitlement_enforcement.sql
  modified:
    - lib/markos/billing/contracts.ts
    - test/helpers/billing-fixtures.cjs
    - onboarding/backend/runtime-context.cjs
    - api/tenant-plugin-settings.js
    - lib/markos/plugins/digital-agency/plugin-guard.js
    - onboarding/backend/handlers.cjs
    - onboarding/backend/agents/orchestrator.cjs
decisions:
  - Keep one entitlement-policy vocabulary centered on MarkOS snapshots and reason codes rather than route-specific billing checks.
  - Treat downstream provider state as informational only; entitlement truth remains MarkOS-owned even when provider sync is unhealthy.
  - Preserve read and evidence access while blocking restricted write, execute, and premium actions under hold or restricted states.
metrics:
  completed: 2026-04-03
  tasks: 2
  files: 12
---

# Phase 54 Plan 04: Billing, Metering, and Enterprise Governance Summary

**Shared entitlement snapshot enforcement across runtime, plugin, and execution boundaries for BIL-01**

## Performance

- **Completed:** 2026-04-03
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments

- Added a shared entitlement module that normalizes MarkOS billing snapshots, computes deterministic deny reasons, preserves read/evidence access, and blocks restricted actions or premium capabilities fail closed.
- Added the entitlement-enforcement migration for subscriptions, holds, and entitlement snapshots with coverage for seats, projects, agent runs, token budgets, storage, and premium feature flags.
- Wired the same billing-policy surface into runtime-context, plugin settings, Digital Agency plugin guard, backend execute-task entry points, and orchestrator bootstrap so billing enforcement does not drift by boundary.

## Verification

- `node --test test/billing/entitlement-enforcement.test.js test/billing/plugin-entitlement-runtime.test.js` -> PASS
- `node --test test/plugin-control.test.js test/agents/provider-policy-runtime.test.js` -> PASS

## Task Commits

- No commit created in this execution pass.

## Files Created/Modified

- `lib/markos/billing/entitlements.cjs` - shared runtime entitlement snapshot normalization, deny-reason generation, and request/capability evaluation.
- `lib/markos/billing/entitlements.ts` - typed entitlement contract surface for later TypeScript billing and UI work.
- `lib/markos/billing/enforcement.cjs` - compatibility entry point for entitlement action evaluation tests.
- `lib/markos/billing/plugin-entitlements.cjs` - compatibility entry point for plugin capability entitlement evaluation.
- `supabase/migrations/54_entitlement_enforcement.sql` - billing subscription, hold, and entitlement snapshot persistence with RLS enabled.
- `lib/markos/billing/contracts.ts` - expanded `EntitlementSnapshot` to cover the full plan-required allowance surface.
- `test/helpers/billing-fixtures.cjs` - aligned entitlement fixtures to seats, projects, token budgets, storage, and premium feature flags.
- `onboarding/backend/runtime-context.cjs` - added entitlement snapshot resolution and shared billing-policy checks for hosted/runtime boundaries.
- `api/tenant-plugin-settings.js` - added billing-policy enforcement before plugin settings writes proceed.
- `lib/markos/plugins/digital-agency/plugin-guard.js` - added premium capability blocking against the shared entitlement snapshot while keeping plugin enablement/capability checks intact.
- `onboarding/backend/handlers.cjs` - added billing-policy gating before execute-task submit and regenerate flows.
- `onboarding/backend/agents/orchestrator.cjs` - added execution-context entitlement snapshot normalization and execute-task fail-closed enforcement.

## Decisions Made

- Used one shared billing-policy evaluator for both action and plugin-capability checks so entitlement semantics stay aligned across API, plugin, and orchestrator seams.
- Kept MarkOS as the source of entitlement truth even when a downstream provider state object is present.
- Preserved existing Phase 52 and 53 runtime paths by defaulting absent entitlement context to an active MarkOS snapshot rather than introducing breaking behavior.

## Deviations from Plan

### Shared planning ledgers left untouched

- `.planning/STATE.md`, `.planning/ROADMAP.md`, and `.planning/REQUIREMENTS.md` still contained unrelated dirty changes before this execution pass.
- To avoid mixing closeout metadata with unrelated work, those shared planning files were not updated here.

### Compatibility shims added alongside the typed surface

- The execution plan names `lib/markos/billing/entitlements.ts` as the canonical artifact, but the existing 54-04 tests import CommonJS modules.
- To satisfy both the plan and the current runtime/test surface, the implementation added a typed source file plus small CommonJS compatibility entry points.

## Issues Encountered

- The Wave 0 54-04 tests still targeted CommonJS module names that did not match the plan artifact path exactly.
- Existing runtime seams had no shared entitlement abstraction, so billing policy needed to be introduced without regressing Phase 52 plugin control or Phase 53 orchestrator provider-policy behavior.
- After wiring the shared evaluator through those seams, the targeted 54-04 and regression suites passed.

## User Setup Required

- None for local verification.
- Live enforcement will require real subscription, hold, and entitlement snapshot hydration into the request/runtime context when the persistence layer is connected beyond the current contract-focused implementation.

## Next Phase Readiness

- 54-05 can now build tenant and operator billing APIs and pages on top of a stable fail-closed entitlement surface instead of embedding route-local billing logic.
- The runtime now has explicit billing deny reasons and snapshot vocabulary available for holds, reconciliation review, and tenant billing UX states.

## Self-Check: PASSED

- Summary file created at `.planning/phases/54-billing-metering-and-enterprise-governance/54-04-SUMMARY.md`.
- Targeted 54-04 verification and follow-on regression commands passed after the final code changes.