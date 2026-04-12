---
phase: 78-branding-governance-publish-or-rollback-and-closure-gates
plan: "01"
subsystem: brand-governance
tags: [governance, closure-gates, schema-validation, diagnostics, wave-0]
dependency_graph:
  requires: []
  provides:
    - onboarding/backend/brand-governance/governance-diagnostics.cjs
    - onboarding/backend/brand-governance/closure-gates.cjs
    - test/phase-78/governance-schema.test.js
    - test/phase-78/closure-gates.test.js
  affects: []
tech_stack:
  added:
    - onboarding/backend/brand-governance/ (new module directory)
  patterns:
    - fail-closed schema validation with canonical DENY_CODES
    - sha256 determinism gate via stableSort + JSON.stringify
    - machine-readable diagnostic normalization per D-08/D-10
key_files:
  created:
    - onboarding/backend/brand-governance/governance-diagnostics.cjs
    - onboarding/backend/brand-governance/closure-gates.cjs
    - test/phase-78/governance-schema.test.js
    - test/phase-78/closure-gates.test.js
    - test/phase-78/fixtures/governance-bundle-pass.json
    - test/phase-78/fixtures/governance-bundle-fail.json
    - test/phase-78/fixtures/closure-gate-pass.json
    - test/phase-78/fixtures/closure-gate-fail.json
  modified: []
decisions:
  - governance-diagnostics exports validateGovernanceBundle alongside DENY_CODES/normalizeDiagnostic so governance-schema tests can assert field-level denials without a separate validator module
  - closure-gates closure never short-circuits — all three gates always run to produce complete audit evidence
  - computeBundleId exported from closure-gates for use in TDD fixture verification assertions
metrics:
  duration_seconds: 140
  completed_date: "2026-04-12"
  tasks_completed: 2
  tasks_total: 2
  files_created: 8
  tests_passing: 25
  tests_total: 25
requirements:
  - BRAND-GOV-01
  - BRAND-GOV-02
---

# Phase 78 Plan 01: Governance Schema Tests, Diagnostics, and Closure Gates Summary

Wave 0 governance schema and closure-gate contracts for Phase 78: fail-closed bundle schema
validation, canonical DENY_CODES diagnostics, and a non-short-circuit sha256 determinism +
tenant isolation + contract integrity gate runner.

## Tasks Completed

| # | Name | Commit | Files |
|---|------|--------|-------|
| 1 | Governance bundle schema tests, fixtures, and governance-diagnostics module | dc9dfb6 | governance-diagnostics.cjs, governance-schema.test.js, governance-bundle-pass.json, governance-bundle-fail.json |
| 2 | Closure-gate schema tests, fixtures, and closure-gates runner module | 4cd2f88 | closure-gates.cjs, closure-gates.test.js, closure-gate-pass.json, closure-gate-fail.json |

## Verification Results

| Command | Result |
|---------|--------|
| `node --test test/phase-78/governance-schema.test.js` | 15/15 PASS |
| `node --test test/phase-78/closure-gates.test.js` | 10/10 PASS |
| `node --test test/phase-78/governance-schema.test.js test/phase-78/closure-gates.test.js` | 25/25 PASS |

## Artifacts Delivered

- **governance-diagnostics.cjs** — `DENY_CODES` constants (`BRAND_GOV_MISSING_LANE`, `BRAND_GOV_TENANT_MISMATCH`, `BRAND_GOV_BUNDLE_NOT_VERIFIED`, `BRAND_GOV_CLOSURE_GATE_FAIL`), `normalizeDiagnostic(code, detail)` returning `{ code, detail, machine_readable: true }`, and `validateGovernanceBundle(bundle)` for schema completeness enforcement.
- **closure-gates.cjs** — `runClosureGates(tenant_id, bundle, context)` evaluating determinism gate (sha256 of stableSort), tenant isolation gate (tenant match), and contract integrity gate (all lineage_fingerprints lanes non-null); never short-circuits; all reason codes sourced from `DENY_CODES`.
- **4 JSON test fixtures** — deterministic pass/fail scenarios for both schema and closure-gate test suites.

## Decisions Made

1. `governance-diagnostics.cjs` exports `validateGovernanceBundle` in addition to the plan's minimum `DENY_CODES`/`normalizeDiagnostic` contract so governance-schema tests assert field-level denials directly against the module — no separate validator file required.
2. `closure-gates.cjs` never short-circuits after the first gate failure; all three gates always run so the returned `gates` object contains complete denial evidence for every audit call.
3. `computeBundleId` is exported from `closure-gates.cjs` so tests can assert that fixture `bundle_id` values are the correct sha256 digests without duplicating the hash algorithm.

## Deviations from Plan

None — plan executed exactly as written. `validateGovernanceBundle` addition is additive and satisfies the plan's "diagnostic normalization helpers used by all governance modules" mandate.

## Known Stubs

None — all module exports are fully implemented and the test suites assert real behavior against real fixtures.

## Self-Check: PASSED

| Check | Result |
|-------|--------|
| governance-diagnostics.cjs | FOUND |
| closure-gates.cjs | FOUND |
| governance-schema.test.js | FOUND |
| closure-gates.test.js | FOUND |
| All 6 fixtures | FOUND |
| Commit dc9dfb6 | FOUND |
| Commit 4cd2f88 | FOUND |
