---
phase: 87
slug: dual-role-views-operator-agent
status: in-review
nyquist_compliant: false
wave_0_complete: true
created: 2026-04-12
---

# Phase 87 - Validation Strategy

Per-phase validation contract for Phase 87 execution feedback sampling.

## Test Infrastructure

| Property | Value |
|----------|-------|
| Framework | Node built-in test runner (`node --test`) |
| Quick run command | `node --test "test/phase-87/*.test.js"` |
| Full suite command | `npm test` |
| Estimated runtime | 10-20 seconds |

## Sampling Rate

- After every task commit: `node --test "test/phase-87/*.test.js"`
- After every wave completion: `node --test "test/phase-86/*.test.js"` plus Phase 87 tests
- Before verify-work: full suite green with `npm test`

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Secure Behavior | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------------|-----------|-------------------|--------|
| 87-01-01 | 01 | 1 | ROLEV-04 | Supabase audit persistence keeps tenant/artifact lineage keys | unit | `node --test test/phase-87/supabase-audit-store.test.js` | pass |
| 87-01-02 | 01 | 1 | ROLEV-04 | Backward-compatible audit-store API preserved | integration | `node --test test/phase-87/supabase-audit-store.test.js` | pass |
| 87-02-01 | 02 | 1 | ROLEV-04 | Role-view scope checks fail closed on unauthorized role/tenant | unit | `node --test test/phase-87/role-views-scope.test.js` | pass |
| 87-02-02 | 02 | 1 | ROLEV-04 | Operator and agent permissions are separated | unit | `node --test test/phase-87/role-views-scope.test.js` | pass |
| 87-03-01 | 03 | 2 | ROLEV-04 | Unified lineage includes operator + agent event chains | integration | `node --test test/phase-87/unified-lineage.test.js` | pass |
| 87-03-02 | 03 | 2 | ROLEV-04 | Retrieval mode linkage preserved in lineage events | integration | `node --test test/phase-87/unified-lineage.test.js` | pass |
| 87-04-01 | 04 | 3 | ROLEV-04 | Route-level role-view isolation enforced | e2e | `node --test test/phase-87/role-views-e2e.test.js` | pass |
| 87-04-02 | 04 | 3 | ROLEV-04 | Cross-tenant leakage prevented across both views | e2e | `node --test test/phase-87/tenant-isolation-role-views.test.js` | pass |

## Wave 0 Requirements

- [x] `test/phase-87/supabase-audit-store.test.js`
- [x] `test/phase-87/role-views-scope.test.js`
- [x] `test/phase-87/unified-lineage.test.js`
- [x] `test/phase-87/role-views-e2e.test.js`
- [x] `test/phase-87/tenant-isolation-role-views.test.js`

## Regression Gates

- Phase 86 retrieval regression: `node --test "test/phase-86/*.test.js"`
- Full repository regression: `npm test`

## Validation Sign-Off

- [x] All tasks have automated verification
- [x] Role-view isolation checks include both role and tenant boundaries
- [x] Unified lineage checks cover operator + agent event sources
- [x] No 3 consecutive tasks without test run
- [ ] `nyquist_compliant: true` set at completion

Approval: pending (phase tests green; full `npm test` still has unrelated pre-existing failures outside Phase 87 scope)
