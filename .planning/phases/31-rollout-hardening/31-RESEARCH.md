# Phase 31: rollout-hardening - Research

**Researched:** 2026-03-28
**Domain:** rollout safety, reliability policy, migration controls, and compatibility governance for onboarding/runtime APIs
**Confidence:** MEDIUM-HIGH

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-31-01:** Use a tiered SLO model by endpoint criticality rather than a single uniform objective.
- **D-31-02:** Keep `/submit` and `/approve` as highest-criticality rollout gates; apply relatively looser objectives to `/linear/sync` and `/campaign/result` while preserving alert visibility.
- **D-31-03:** Use strict phased promotion: `dry-run -> dual-write -> cloud-primary`.
- **D-31-04:** Every mode transition requires explicit owner sign-off and a rollback-ready checkpoint.
- **D-31-05:** Enforce strict production policy now across rollout environments: fail-fast secret validation, mandatory log redaction, and fixed retention bounds.
- **D-31-06:** Use manual operator discretion for compatibility retirement decisions.
- **D-31-07:** No hard minimum evidence gate is required prior to retiring a legacy MARKOS surface.

### Claude's Discretion
- Translate the tiered SLO policy into concrete threshold numbers per endpoint during planning/execution.
- Define owner assignment and handoff mechanics for each migration mode transition.

### Deferred Ideas (OUT OF SCOPE)
- None captured in this discussion.

## Project Constraints (from CLAUDE.md)

- Before starting any task, read `.protocol-lore/QUICKSTART.md`.
- Before starting any task, read `.protocol-lore/INDEX.md`.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| RLH-01 | Reliability and observability SLOs for `/submit`, `/approve`, `/linear/sync`, `/campaign/result` | Existing SLO contracts in README/TECH-MAP and telemetry/test integration points in handlers + onboarding server tests |
| RLH-02 | Migration readiness controls for dry-run, dual-write, cloud-primary, rollback-safe operation | Existing deterministic dry-run/idempotent migration path in `handleMarkosdbMigration`; research identifies missing explicit mode/state transition mechanics |
| RLH-03 | Security/compliance guardrails for secret validation, redaction, retention boundaries | Existing hosted auth wrappers and local write guardrails; research identifies remaining enforcement gaps (centralized secret validation and systematic redaction) |
| RLH-04 | Explicit and operationally gated compatibility deprecation policy | Existing documented gates in README/TECH-MAP + protocol tests; research proposes a machine-readable operator decision artifact consistent with manual discretion |

## Summary

Phase 31 already has strong rollout-hardening building blocks in place: endpoint contracts are documented, migration operations are deterministic and replay-safe, hosted auth wrappers enforce project scope boundaries, and compatibility retirement gates are written into docs and protocol tests. Runtime behavior is also consistently implemented through shared handlers (`onboarding/backend/handlers.cjs`) and shared runtime policy (`onboarding/backend/runtime-context.cjs`), with broad integration coverage in `test/onboarding-server.test.js` and policy drift checks in `test/protocol.test.js`.

The main implementation gap for planning is not foundational architecture; it is policy-to-runtime completeness. Specifically, the code enforces dry-run and idempotent migration semantics, but does not yet expose an explicit, auditable mode state machine for `dual-write` and `cloud-primary` transitions with owner sign-off checkpoints. Security policy is partly enforced (hosted auth and local persistence guards), but strict fail-fast secret validation/redaction/retention still relies heavily on documentation and convention rather than centralized runtime primitives.

**Primary recommendation:** Implement a small rollout-policy layer in runtime context (modes, sign-off metadata, redaction and secret checks) and wire each RLH requirement to existing handler/test contracts rather than introducing new subsystems.

## Implementation Baseline

Current, code-backed baseline for Phase 31:

- Shared route handlers exist for all rollout-critical endpoints in `onboarding/backend/handlers.cjs`:
  - `handleSubmit`
  - `handleApprove`
  - `handleLinearSync`
  - `handleCampaignResult`
  - `handleMarkosdbMigration`
- Hosted policy boundary exists in API wrappers (`api/config.js`, `api/status.js`, `api/migrate.js`) via `requireHostedSupabaseAuth` from `onboarding/backend/runtime-context.cjs`.
- Telemetry backbone exists in `onboarding/backend/agents/telemetry.cjs` with constrained execution checkpoint events.
- SLO and migration contracts are already documented in `README.md` and `TECH-MAP.md`.
- Integration tests already assert core rollout behavior in `test/onboarding-server.test.js`:
  - hosted auth and write guards
  - regenerate/approve outcome states
  - migration dry-run determinism and replay idempotency
  - hosted migration scope enforcement
- Protocol-level governance checks exist in `test/protocol.test.js` (identity, compatibility docs, residual behavior documentation, execution anchors).

Environment availability snapshot (this workspace):

- `node`: available (`v22.13.0`)
- `npm`: available (`10.9.2`)
- `pnpm`: available (`10.28.2`)
- `docker`: missing
- Supabase/Upstash/PostHog env vars: currently unset locally (`SUPABASE_*`, `UPSTASH_VECTOR_*`, `POSTHOG_API_KEY`, `MARKOS_SUPABASE_AUD`)

Implication: test suites pass in local mocked/degraded mode, but cloud-backed rollout checks require explicit env provisioning.

## Requirement-by-Requirement Research (RLH-01..04)

### RLH-01 - Reliability and observability SLOs

What exists:

- Endpoint SLO table is documented in `README.md` and `TECH-MAP.md` with tiered thresholds:
  - `POST /submit`: 99.5%, p95 <= 1500ms (excluding upstream LLM)
  - `POST /approve`: 99.9%, p95 <= 900ms
  - `POST /linear/sync`: 99.0%, p95 <= 1200ms (excluding Linear latency)
  - `POST /campaign/result`: 99.5%, p95 <= 800ms
- Execution checkpoint telemetry exists and is intentionally scoped.
- Outcome semantics (`success`, `warning`, `degraded`, `failure`) are test-covered and usable as SLO numerator/denominator dimensions.

What to implement to harden:

- Add endpoint-level capture helper in handlers (e.g., capture start/end + outcome + duration for each of the four endpoints).
- Emit stable properties: `endpoint`, `outcome_state`, `status_code`, `duration_ms`, `runtime_mode`, `project_slug` (hashed/anonymized as needed).
- Keep execution-loop checkpoint events, but add endpoint contract events so SLO measurement is direct, not inferred.

Confidence: HIGH (baseline and insertion points are clear and already test-backed).

### RLH-02 - Migration readiness and rollback safety controls

What exists:

- `handleMarkosdbMigration` supports deterministic `dry_run=true` projection and replay-safe idempotent upsert for `dry_run=false` using deterministic `artifact_id` and checksums.
- Hosted migration wrapper (`api/migrate.js`) enforces scoped Supabase auth.
- Tests verify deterministic dry-run output and replay idempotency, plus hosted scope denial/allow rules.

Gap against locked Phase 31 decision:

- Explicit `dry-run -> dual-write -> cloud-primary` mode transitions with owner sign-off checkpoints are not encoded as a runtime state machine.

What to implement to harden:

- Add rollout mode policy in runtime context, example enum:
  - `dry-run`
  - `dual-write`
  - `cloud-primary`
- Source mode from explicit config/env key (single source of truth) and expose in `/config` and `/status`.
- Add transition metadata contract (owner, timestamp, checkpoint id, rollback plan id) in a machine-readable artifact under `.planning/phases/31-rollout-hardening/`.
- Enforce transition guards in migration-related handlers:
  - reject cloud-primary promotion if dry-run evidence missing
  - reject transition without owner/sign-off metadata
- Keep rollback non-destructive by design (no delete/mutate of source local artifacts during promotion).

Confidence: MEDIUM-HIGH (implementation path is straightforward; exact source-of-truth artifact location is still an operational choice).

### RLH-03 - Security and compliance guardrails

What exists:

- Hosted auth policy is centralized through `requireHostedSupabaseAuth` with audience and project scope checks.
- Hosted local-persistence writes are explicitly blocked with `LOCAL_PERSISTENCE_UNAVAILABLE`.
- Compatibility local artifacts are documented as retained and excluded from git history.

Gaps against strict policy decision:

- No centralized fail-fast secret validation matrix at process boot per runtime mode/operation.
- No explicit shared redaction utility enforcing sensitive field masking before logs/telemetry.
- Retention boundaries are documented but not fully codified into a runtime-enforced policy object/check.

What to implement to harden:

- Add `validateRequiredSecrets(runtimeMode, operation)` in runtime context and call during server boot + privileged handler entry.
- Add `redactSensitive(data)` helper and apply to all error/log payloads and telemetry properties.
- Define fixed retention policy constants (for compatibility artifacts and any transient logs/reports) and enforce via lightweight checks + docs parity tests.

Confidence: MEDIUM (guardrail architecture exists, but enforcement breadth depends on how much legacy logging is normalized).

### RLH-04 - Compatibility deprecation policy and gates

What exists:

- Compatibility deprecation gates are documented in README and TECH-MAP.
- Protocol tests already verify deprecation/compatibility documentation remains present and coherent.
- Rollout context explicitly chooses manual operator discretion and no hard minimum evidence gate.

What to implement to harden while honoring that policy:

- Keep manual decision authority, but require structured operator decision record for each retirement action:
  - surface being retired
  - owner
  - decision timestamp
  - rationale
  - rollback path
- Store decision record in a machine-readable file and validate schema/required fields in protocol tests.
- Continue preserving compatibility surfaces until decision record indicates retirement and related wrappers/tests remain green.

Confidence: HIGH (compatible with current contracts and minimal implementation risk).

## Gaps/Risks and Mitigations

| Gap/Risk | Why it matters | Mitigation |
|----------|----------------|------------|
| Endpoint SLOs are documented but endpoint-level telemetry tags are incomplete | SLO math can drift from actual runtime behavior | Add stable endpoint event emission in handlers with outcome and timing fields |
| Migration mode transitions are policy-only | `dual-write` and `cloud-primary` can become ambiguous operationally | Introduce explicit rollout mode enum + transition metadata + enforcement checks |
| Secret validation not uniformly fail-fast | Misconfigured cloud operations can run partially and fail late | Add mode/operation-aware secret validation at boot and handler boundaries |
| Redaction policy not centrally enforced | Accidental secret leakage in logs/telemetry | Add shared redaction helper and route all logging/telemetry through it |
| Retention boundaries mostly documentation-driven | Compliance drift risk over time | Codify retention constants and test for policy drift in protocol suite |
| Manual deprecation decisions can become opaque | Hard to audit why a compatibility surface was removed | Require machine-readable operator decision record with rollback notes |

## Test Strategy and Evidence Targets

### Current executable baseline

- `node --test test/onboarding-server.test.js` (currently pass: 15/15)
- `node --test test/protocol.test.js` (currently pass: 8/8)

### Requirement -> evidence map

| Requirement | Behavior to prove | Primary tests | Additional evidence target |
|-------------|-------------------|---------------|----------------------------|
| RLH-01 | SLO-observable outcomes for `/submit`, `/approve`, `/linear/sync`, `/campaign/result` | Extend `test/onboarding-server.test.js` around endpoint outcomes/telemetry payload shape | SLO contract tables in README + TECH-MAP remain aligned |
| RLH-02 | deterministic dry-run, replay-safe idempotency, mode transition safety | Existing migration tests in `test/onboarding-server.test.js` plus new mode transition tests | Transition sign-off artifacts and rollback checkpoint reports |
| RLH-03 | hosted auth enforcement, secret validation, redaction, retention bounds | existing auth/write guard tests + new validation/redaction tests | Security/retention contract section in README/TECH-MAP |
| RLH-04 | compatibility retirement criteria are explicit and operationally gated | `test/protocol.test.js` policy checks + new decision-record schema checks | Updated roadmap/state compatibility status entries |

### Evidence artifacts to require before phase gate

- Endpoint telemetry event schema examples for each rollout endpoint.
- At least one dry-run report and one replay-idempotent migration report for the same project slug.
- Hosted auth denial and allow-path evidence for migration wrapper.
- Compatibility deprecation decision template/example record (even if no retirement action occurs yet).

## Recommended Plan Sequencing

1. Lock baseline contracts and telemetry schema (RLH-01 first).
2. Add migration mode state machine + sign-off checkpoints (RLH-02).
3. Add strict security/compliance enforcement primitives (RLH-03) on top of stabilized migration paths.
4. Finalize compatibility deprecation operations contract and decision records (RLH-04).
5. Run full verification suites and refresh Phase 31 verification artifacts.

Why this order:

- Observability first prevents blind rollout decisions.
- Migration mode controls must precede stricter deprecation movement.
- Security hardening should be applied after transition mechanics are explicit, so policy checks are unambiguous.

## Open Questions

1. Where should transition sign-off records be canonical: runtime config, planning docs, or both?
2. Should fail-fast secret validation be strict in all local development paths, or strict only for hosted/migration-write operations?
3. Is retention enforcement expected as runtime deletion logic now, or as documented policy with drift tests in this phase?

## Sources

### Primary (HIGH confidence)
- Local code and tests:
  - `onboarding/backend/handlers.cjs`
  - `onboarding/backend/runtime-context.cjs`
  - `onboarding/backend/agents/telemetry.cjs`
  - `api/config.js`, `api/status.js`, `api/migrate.js`
  - `test/onboarding-server.test.js`
  - `test/protocol.test.js`
- Local rollout contracts:
  - `.planning/phases/31-rollout-hardening/31-CONTEXT.md`
  - `.planning/phases/31-rollout-hardening/31-REQUIREMENTS.md`
  - `.planning/phases/31-rollout-hardening/31-VERIFICATION.md`
  - `README.md`
  - `TECH-MAP.md`

### Secondary (MEDIUM confidence)
- `.planning/phases/31-rollout-hardening/31-01-PLAN.md`
- `.planning/phases/31-rollout-hardening/31-02-PLAN.md`
- `.planning/phases/31-rollout-hardening/31-03-PLAN.md`
- `.planning/phases/31-rollout-hardening/31-04-PLAN.md`

## Metadata

**Confidence breakdown:**
- Implementation baseline: HIGH (directly verified in code/tests)
- Requirement mapping: MEDIUM-HIGH (clear for RLH-01/02/04, partially policy-driven for RLH-03)
- Risk and mitigation guidance: MEDIUM (requires execution choices on enforcement scope)

**Research date:** 2026-03-28
**Valid until:** 2026-04-27

## RESEARCH COMPLETE
