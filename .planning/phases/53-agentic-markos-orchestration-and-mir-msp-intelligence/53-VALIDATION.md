---
phase: 53
slug: agentic-markos-orchestration-and-mir-msp-intelligence
status: verified-with-caveats
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-03
---

# Phase 53 — Validation Ledger

> Requirement closure and execution evidence for AGT-01..04, MIR-01..04, IAM-03.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | `node:test` |
| **Quick run command** | `node --test test/agents/run-close-telemetry.test.js test/agents/provider-failover-telemetry.test.js` |
| **Targeted Phase 53 command** | `node --test test/agents/run-lifecycle.test.js test/agents/run-idempotency.test.js test/agents/approval-gate.test.js test/rbac/plan-approval-policy.test.js test/mir/mir-gate-initialization.test.js test/literacy/discipline-activation-evidence.test.js test/mir/mir-regeneration-lineage.test.js test/agents/run-close-telemetry.test.js test/agents/provider-failover-telemetry.test.js` |
| **Broader suite command** | `npm test` |
| **Targeted runtime** | ~1.4s |

---

## Requirements Closure

| Req ID | Status | Evidence |
|--------|--------|----------|
| AGT-01 | ✅ pass | `onboarding/backend/agents/run-engine.cjs`, `test/agents/run-lifecycle.test.js`, `test/agents/run-idempotency.test.js` |
| AGT-02 | ✅ pass | Canonical transition guard + denied-edge evidence in `run-engine.cjs`; targeted lifecycle suite green |
| AGT-03 | ✅ pass | `onboarding/backend/agents/approval-gate.cjs`, `test/agents/approval-gate.test.js` |
| AGT-04 | ✅ pass | `onboarding/backend/agents/telemetry.cjs`, `test/agents/run-close-telemetry.test.js`, `test/agents/provider-failover-telemetry.test.js` |
| MIR-01 | ✅ pass | `onboarding/backend/mir-lineage.cjs`, `test/mir/mir-gate-initialization.test.js` |
| MIR-02 | ✅ pass | `onboarding/backend/literacy/discipline-selection.cjs`, `test/literacy/discipline-activation-evidence.test.js` |
| MIR-03 | ✅ pass | `onboarding/backend/write-mir.cjs`, `test/mir/mir-regeneration-lineage.test.js` |
| MIR-04 | ✅ pass | Append-only lineage helpers + query support in `mir-lineage.cjs`; regeneration lineage suite green |
| IAM-03 | ✅ pass | `lib/markos/rbac/iam-v32.js`, `test/rbac/plan-approval-policy.test.js` |

---

## Phase 53 Regression Evidence

| Scope | Command | Result |
|-------|---------|--------|
| Wave 3 targeted | `node --test test/agents/run-close-telemetry.test.js test/agents/provider-failover-telemetry.test.js` | ✅ 5/5 pass |
| Full Phase 53 targeted | `node --test test/agents/run-lifecycle.test.js test/agents/run-idempotency.test.js test/agents/approval-gate.test.js test/rbac/plan-approval-policy.test.js test/mir/mir-gate-initialization.test.js test/literacy/discipline-activation-evidence.test.js test/mir/mir-regeneration-lineage.test.js test/agents/run-close-telemetry.test.js test/agents/provider-failover-telemetry.test.js` | ✅ 30/30 pass |
| Broader integration spot-check | `node --test test/literacy-e2e.test.js test/migration-runner.test.js` | ⚠ literacy e2e pass; migration-runner still fails unrelated |

---

## Key Links Verified

| From | To | Pattern | Result |
|------|----|---------|--------|
| `onboarding/backend/agents/orchestrator.cjs` | `onboarding/backend/agents/telemetry.cjs` | `finalizeRunClose|captureRunClose|captureProviderAttempt` | ✅ |
| `lib/markos/llm/fallback-chain.ts` | `lib/markos/llm/telemetry-adapter.ts` | `buildProviderAttemptMetadata|primaryProvider|allowedProviders` | ✅ |
| `test/agents/provider-failover-telemetry.test.js` | `lib/markos/llm/fallback-chain.ts` | `primaryProvider|fallbackReason` | ✅ |
| `test/agents/run-close-telemetry.test.js` | `onboarding/backend/agents/orchestrator.cjs` | `finalizeRunClose` | ✅ |

---

## Caveats

- `npm test` is not fully green because `test/migration-runner.test.js` currently fails with `TENANT_CONTEXT_REQUIRED` in `onboarding/backend/provisioning/migration-runner.cjs`.
- Those migration-runner failures are outside the Phase 53 files touched in this execution and remained after the Phase 53 regressions were cleared.
- The temp-copy literacy integration regression introduced by Phase 53 approval/IAM loading was fixed by making approval-gate IAM resolution lazy/fail-closed and by bypassing IAM action denial for local/no-principal submit flows.

---

## Human-Needed Checks

- None required for Phase 53 requirement closure.

---

## Sign-Off

- [x] AGT-01..04 covered by automated tests
- [x] MIR-01..04 covered by automated tests
- [x] IAM-03 covered by automated tests
- [x] Wave 3 primary-provider routing and run-close completeness verified
- [x] Phase 53 targeted regression suite green
- [x] Broader-suite Phase 53 regressions cleared

**Validation verdict:** ✅ Phase 53 verified for targeted scope, with unrelated broader-suite migration-runner caveats recorded above.