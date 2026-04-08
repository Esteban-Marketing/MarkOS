---
status: awaiting_human_verify
trigger: "Investigate issue: onboarding-server-broader-verification-failures"
created: 2026-04-04T00:00:00.000Z
updated: 2026-04-04T05:20:00.000Z
---

## Current Focus

hypothesis: The remaining onboarding failures have been fixed in code/tests, and the exact broader verification command now passes in this workspace.
test: Await user confirmation or rerun by request.
expecting: The user should observe the same green broader verification slice locally.
next_action: human verification of the broader command if needed

## Symptoms

expected: The full verification command `node --test test/onboarding-server.test.js test/tenant-auth/tenant-background-job-propagation.test.js test/agents/run-idempotency.test.js test/agents/provider-policy-runtime.test.js test/agents/run-close-telemetry.test.js test/billing/provider-sync-failure.test.js test/ui-billing/billing-pages-contract.test.js` should pass cleanly.
actual: The stable non-port-sensitive slice passes 33/33, but the full command fails within `test/onboarding-server.test.js`.
errors: Observed failures include `listen EADDRINUSE: address already in use 127.0.0.1:4242`, timeout starting server in test 3.3, hosted wrapper assertions returning `401 !== 200`, and multiple approve/rollout assertions returning `409 !== 200` or `409 !== 400` in tests 3.7, 3.9, 3.10, and 3.14. A prior harness gap for missing `../../lib/markos/billing/entitlements.cjs` in temp onboarding environments was already fixed by copying `lib/markos` in `test/setup.js`.
reproduction: From repo root on Windows, run `node --test test/onboarding-server.test.js` or the broader verification command above.
started: Failures were observed during Phase 57 execution and again during Phase 57 verification on 2026-04-04. The missing-module issue was fixed, but these remaining onboarding failures persist.

## Eliminated

## Evidence

- timestamp: 2026-04-04T00:05:00.000Z
  checked: .planning/debug/knowledge-base.md
  found: No debug knowledge base file exists yet for onboarding-server failures.
  implication: No prior known-pattern hypothesis is available; investigate from first principles.

- timestamp: 2026-04-04T00:06:00.000Z
  checked: test/onboarding-server.test.js
  found: Test 3.1 deliberately occupies 127.0.0.1:4242 and expects the spawned onboarding server to fall back to 4243, while test 3.3 expects a clean bind on 4242 with a 5s startup timeout.
  implication: At least part of the suite is intentionally sensitive to ambient port usage and can fail from external listeners unrelated to code regressions.

- timestamp: 2026-04-04T00:07:00.000Z
  checked: onboarding/backend/server.cjs
  found: The server binds to config.port on 127.0.0.1, logs readiness only from the listen callback, and falls back to config.port + 1 only when the initial listen emits EADDRINUSE.
  implication: A pre-existing process on 4242 is an environment blocker for test 3.3, and fallback behavior is limited to a single adjacent port.

- timestamp: 2026-04-04T00:08:00.000Z
  checked: test/setup.js
  found: The harness creates isolated temp directories and copies onboarding, api, and lib/markos into them, with onboarding-config.json forced to port 4242 and browser auto-open disabled.
  implication: Deterministic temp environments reduce repo-state noise, so repeated 401/409 mismatches are more likely code-path regressions or stale test assumptions than missing fixture files.

- timestamp: 2026-04-04T00:12:00.000Z
  checked: onboarding/backend/runtime-context.cjs and api/config.js/api/migrate.js
  found: Hosted auth now requires `active_tenant_id` or `tenant_id` in the JWT after project-scope validation; the failing test tokens only include `aud`, `sub`, and `project_slugs`.
  implication: The `401 !== 200` mismatches in hosted wrapper tests are stale-test failures against an intentional tenant-context contract, not a runtime regression.

- timestamp: 2026-04-04T00:13:00.000Z
  checked: onboarding/backend/handlers.cjs and onboarding/backend/agents/approval-gate.cjs
  found: `handleApprove` always enforces `assertAwaitingApproval(run_state)` and records a decision; legacy local calls from onboarding UI and tests do not send `run_state`, causing 409, and even with `run_state: awaiting_approval` local approval fails 403 because the authorization callback injects `local_runtime`, which is not allowed for `approve_task`.
  implication: The 409 failures expose a real local-approval compatibility regression introduced by universal approval-gate enforcement, masked by stale tests that do not send run metadata.

- timestamp: 2026-04-04T00:14:00.000Z
  checked: onboarding/onboarding.js
  found: The local UI still posts `/approve` with only `{ approvedDrafts, slug }` and no run metadata.
  implication: The approve regression affects real local onboarding behavior, not just the test suite.

- timestamp: 2026-04-04T00:15:00.000Z
  checked: targeted `node --test test/onboarding-server.test.js` reruns
  found: Port-sensitive failures reproduce consistently as `EADDRINUSE` on 127.0.0.1:4242 and startup timeout on 3.3, while the 401 and 409 mismatches reproduce deterministically in direct handler/wrapper tests.
  implication: Port issues are environmental blockers; the other failures are deterministic contract/code issues that can be fixed safely.

## Resolution

root_cause: Multiple causes. (1) `test/onboarding-server.test.js` hard-coded port 4242/4243, so ambient listeners on 127.0.0.1:4242 caused environment-only failures in tests 3.1 and 3.3. (2) Hosted wrapper tests used JWTs without `active_tenant_id`, which no longer satisfies the intentional tenant-aware hosted auth contract in `runtime-context.cjs`, so 401 results were stale-test failures rather than runtime regressions. (3) `handleApprove` unconditionally enforced approval-gate state and decision recording, which broke legacy local onboarding/UI flows that still call `/approve` without run metadata; explicit local gate calls also failed closed because the authorization callback injected `local_runtime` instead of preserving the local-runtime bypass.
fix: Updated `handleApprove` to preserve legacy local approval compatibility unless approval-gate metadata or hosted auth is present, while still enforcing approval-gate contracts for hosted or explicit gated runs; also preserved local authorization bypass for explicit local gate calls. Updated onboarding tests to allocate free localhost port pairs dynamically, provide tenant-aware JWT claims for hosted-wrapper coverage, and expand the stale telemetry mock to satisfy the current orchestrator telemetry contract.
verification: `node --test test/onboarding-server.test.js` passed 33/33. The broader command `node --test test/onboarding-server.test.js test/tenant-auth/tenant-background-job-propagation.test.js test/agents/run-idempotency.test.js test/agents/provider-policy-runtime.test.js test/agents/run-close-telemetry.test.js test/billing/provider-sync-failure.test.js test/ui-billing/billing-pages-contract.test.js` passed 66/66 in the current workspace.
files_changed: ["onboarding/backend/handlers.cjs", "test/onboarding-server.test.js"]
