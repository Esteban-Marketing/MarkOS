# Phase 33 Concern Assessment (2026-03-31)

Assessor: Protocol Maintainer
Scope: Baseline assessment after canonical codebase map execution

## Summary

- Overall concern posture: Elevated
- Concerns assessed: 4
- Open high-priority concerns (score >= 40): 3

## Scored Table

| Concern | I | L | D | Priority | Evidence Reviewed | Status |
|---|---|---|---|---|---|---|
| Route drift | 4 | 4 | 3 | 48 | `onboarding/backend/server.cjs`, `onboarding/backend/handlers.cjs`, `.planning/codebase/ROUTES.md` | Closed |
| Wrapper drift | 4 | 3 | 4 | 48 | `api/*.js`, `onboarding/backend/handlers.cjs`, `.planning/codebase/ROUTES.md`, `.planning/codebase/INTEGRATIONS.md` | Closed |
| Entry point drift | 3 | 3 | 3 | 27 | `bin/*.cjs`, `.agent/get-shit-done/bin/gsd-tools.cjs`, `.agent/markos/bin/markos-tools.cjs`, `.planning/codebase/ENTRYPOINTS.md` | Closed |
| Topology drift | 3 | 4 | 4 | 48 | `onboarding/backend/**`, `.planning/codebase/FOLDERS.md`, `.planning/codebase/FILES.md` | Deferred/Accepted |

## Detailed Assessment

### 1. Route drift

- Current score: I=4, L=4, D=3, Priority=48
- Evidence reviewed:
  - `onboarding/backend/server.cjs`
  - `onboarding/backend/handlers.cjs`
  - `.planning/codebase/ROUTES.md`
- Gaps found:
  - No automated route parity assertion currently validates route table coverage against server route registration.
- Remediation tasks:
  - Add protocol test to verify route table includes core local route surfaces and hosted wrappers.
- Owner: Protocol Maintainer
- Due date: 2026-04-05
- Re-test result: Pass (`node --test test/protocol.test.js`, test 4.10)
- **Status Update**: CLOSED — Protocol test 4.10 passing; route inventory in `.planning/codebase/ROUTES.md` is authoritative and verified.

### 2. Wrapper drift

- Current score: I=4, L=3, D=4, Priority=48
- Evidence reviewed:
  - `api/*.js`
  - `onboarding/backend/handlers.cjs`
  - `.planning/codebase/ROUTES.md`
  - `.planning/codebase/INTEGRATIONS.md`
- Gaps found:
  - No automated check enforces wrapper-to-handler mapping and documented auth variance notes.
- Remediation tasks:
  - Add protocol test asserting wrappers are represented in route documentation and auth variance language remains explicit.
- Owner: Protocol Maintainer
- Due date: 2026-04-05
- **Status Update**: CLOSED — Protocol test 4.10 passing; wrapper-to-handler mapping verified in `.planning/codebase/INTEGRATIONS.md`.
- Re-test result: Pass (`node --test test/protocol.test.js`, test 4.10)

### 3. Entry point drift

- Current score: I=3, L=3, D=3, Priority=27
- Evidence reviewed:
  - `bin/*.cjs`
  - `.agent/get-shit-done/bin/gsd-tools.cjs`
  - `.agent/markos/bin/markos-tools.cjs`
  - `.planning/codebase/ENTRYPOINTS.md`
- Gaps found:
  - No guardrail ensures documented entrypoints remain in sync with user/protocol CLI surfaces.
- Remediation tasks:
  - Add protocol test for command surface coverage in `ENTRYPOINTS.md`.
- Owner: Protocol Maintainer
- **Status Update**: CLOSED — Protocol test 4.11 passing; entrypoint inventory in `.planning/codebase/ENTRYPOINTS.md` is authoritative and verified.
- Due date: 2026-04-05
- Re-test result: Pass (`node --test test/protocol.test.js`, test 4.11)

### 4. Topology drift

- Current score: I=3, L=4, D=4, Priority=48
- Evidence reviewed:
  - `onboarding/backend/**`
  - `.planning/codebase/FOLDERS.md`
  - `.planning/codebase/FILES.md`
- Gaps found:
  - No automated folder/file topology parity check currently exists.
- Remediation tasks:
  - Keep weekly light audits and monthly full reconciliation cadence; defer hard file-by-file parity automation until doc taxonomy stabilizes.
- Owner: Protocol Maintai
- **Status Update**: DEFERRED/ACCEPTED — Full automation deferred to post-v2.3 maintenance phase. Weekly lightweight audits + monthly reconciliation cadence documented and activated in protocol. Risk accepted per decision log.ner
- Due date: Recurring
- Re-test result: Not run

## Decision Log (2026-03-31):
  - Route drift: CLOSED — Protocol test 4.10 passing
  - Wrapper drift: CLOSED — Protocol test 4.10 passing
  - Entry point drift: CLOSED — Protocol test 4.11 passing
  - Topology drift: DEFERRED/ACCEPTED — Weekly lightweight + monthly full cadence documented
- Concern status changes:
  - None. All four concerns remain Open pending parity check automation.
- Deferred actions:
  - Full topology parity automation deferred to post-v2.3 first maintenance pass.
