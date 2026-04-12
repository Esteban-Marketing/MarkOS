# Phase 84 Validation Ledger

## Plan
- Phase: 84-vault-foundation-obsidian-mind-pageindex-contracts
- Plan: 84-03
- Date: 2026-04-12
- Status: PASS

## D-05 Hard Cutover Evidence
- Active retrieval path no longer depends on Upstash symbols in runtime retrieval functions:
  - `getContext` and `getLiteracyContext` retrieval in `onboarding/backend/vector-store-client.cjs` now execute Supabase/PageIndex retrieval contracts.
  - static gate script `scripts/phase-84/static-cutover-scan.cjs` scans active retrieval bodies and fails on `@upstash/vector` or `getUpstashIndex(`.
- Readiness contract shifted to Supabase/PageIndex:
  - `bin/ensure-vector.cjs` now reports Supabase/PageIndex active retrieval readiness.
  - Upstash is represented as legacy optional compatibility state.

## D-06 Parity Evidence (reason/apply/iterate)
- Added contract parity test: `test/phase-84/cutover-parity.test.js`.
- Result: deterministic response shape parity is enforced for all required retrieval modes (`reason`, `apply`, `iterate`) with identical top-level shape and provenance contract.

## Provider Trace Contract Evidence
- Added provider trace test: `test/phase-84/provider-trace-contract.test.js`.
- Result:
  - retrieval items carry `provenance.source.system = pageindex`;
  - actor trace includes tenant-scoped actor ID;
  - metadata includes tenant scope in returned items.

## D-07/D-08 Isolation Matrix Evidence
- Added matrix test: `test/phase-84/isolation-matrix.test.js`.
- Assertions covered:
  - tenant A retrieves only tenant A allow-listed IDs;
  - cross-tenant doc injection attempts are rejected with deterministic error code;
  - missing tenant or tenant-scope mismatch fails closed before provider retrieval;
  - mixed allow-list contamination emits invariant breach payload and fails closed.

## Commands and Results
- `node --test test/phase-84/cutover-no-upstash.test.js` -> PASS (3/3)
- `node scripts/phase-84/static-cutover-scan.cjs` -> PASS
- `node --test test/phase-84/isolation-matrix.test.js` -> PASS (4/4)
- `node --test test/phase-84/cutover-no-upstash.test.js test/phase-84/cutover-parity.test.js test/phase-84/isolation-matrix.test.js test/phase-84/pageindex-adapter.test.js test/phase-84/provider-trace-contract.test.js` -> PASS (12/12)
- `node --test test/phase-84/*.test.js -x` -> PASS (22/22)

## Cutover Gate Verdict
- Static cutover scan: PASS
- Parity tests: PASS
- Provider trace contract: PASS
- Isolation matrix: PASS
- Validation artifact completeness: PASS

Phase 84-03 closure criteria are satisfied with explicit hard cutover, parity, provider trace, and tenant isolation proof evidence.
