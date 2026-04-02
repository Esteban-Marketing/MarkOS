# Phase 43: Onboarding-to-Literacy Activation Pipeline - Research

**Researched:** 2026-04-01
**Domain:** Submit/status literacy readiness activation, probing, and telemetry contracts
**Confidence:** HIGH

## Summary

Phase 43 should be implemented as a non-blocking activation layer attached to the existing intake flow in `handleSubmit` and surfaced through `handleStatus`. The current runtime already has all core primitives needed to ship this phase safely: deterministic seed validation in submit, vector provider health checks, literacy query API (`getLiteracyContext`), telemetry capture, and a stable API wrapper (`api/status.js`).

The biggest architectural decision is where activation ownership lives. Milestone intent says activation should happen in submit after seed persistence; current code persists seed inside `orchestrator.orchestrate()` instead of in `handleSubmit`. The safest implementation for this repository is to keep submit as the orchestration owner but add a dedicated readiness probe step after successful orchestration returns, so submit responses gain a `literacy` contract without changing successful draft generation behavior.

**Primary recommendation:** Add a pure readiness helper module called by both `handleSubmit` and `handleStatus`, returning `ready | partial | unconfigured` plus available/missing discipline lists and using existing vector health + literacy query contracts for graceful degradation.

## Goal and Requirements Mapping

### Goal (source-mapped)
- Roadmap source: v3.0 milestone exists in `.planning/ROADMAP.md`, with Phase 43 in the literacy system sequence.
- Milestone source: `.planning/milestones/v3.0-LITERACY-SYSTEM-ROADMAP.md` defines Phase 43 objective: wire onboarding submission to literacy activation, report readiness and gaps, and expose literacy readiness in status.

### Requirements Map (roadmap + milestone technical requirements)

| ID | Requirement | Source | Research support |
|----|-------------|--------|------------------|
| LIT-13 | Post-submit literacy activation hook: rank disciplines from seed and detect missing coverage in submit response. | v3.0 milestone (Phase 43 objective + technical requirements) | Existing submit flow and vector literacy query API support this with no schema changes. |
| LIT-14 | Literacy readiness contract in submit/status: `ready | partial | unconfigured` + available disciplines + gaps. | v3.0 milestone (Phase 43 key components) | `handleSubmit` and `handleStatus` already centralize response shaping and can share one helper. |
| LIT-15 | Activation telemetry event: `literacy_activation_observed` including readiness and discipline coverage metadata. | v3.0 milestone (Phase 43 key components) | `telemetry.capture()` supports arbitrary event names and redaction-safe payload handling. |

Notes:
- `.planning/ROADMAP.md` has detailed mappings through Phase 42; Phase 43 detailed requirements are canonical in `.planning/milestones/v3.0-LITERACY-SYSTEM-ROADMAP.md`.
- No workspace-global `.planning/REQUIREMENTS.md` exists for v3.0 requirement IDs, so IDs above are phase-local planning IDs consistent with prior v3.0 phase research docs.

## Project Constraints (from CLAUDE.md)

- Read order for repo context: `.protocol-lore/QUICKSTART.md` -> `.protocol-lore/INDEX.md` -> `.planning/STATE.md` -> `.agent/markos/MARKOS-INDEX.md`.
- Treat `.planning/STATE.md` as canonical live mission state.
- Keep MarkOS/GSD boundaries intact; client overrides live only in `.markos-local/`.
- Primary CLI and operator entrypoint remains `npx markos`.
- Test commands are `npm test` or `node --test test/**/*.test.js`.
- Onboarding backend entrypoint remains `node onboarding/backend/server.cjs`.

## Standard Stack

### Core
| Library/Module | Version (verified) | Purpose | Why standard here |
|----------------|--------------------|---------|-------------------|
| Node.js | `v22.13.0` local (`>=20.16.0` required) | Runtime and tests | Existing project baseline |
| `onboarding/backend/handlers.cjs` | repo-local | Submit/status response contract owner | Existing API behavior anchor |
| `onboarding/backend/vector-store-client.cjs` | repo-local | Health checks and literacy retrieval probes | Existing literacy data plane |
| `onboarding/backend/agents/telemetry.cjs` | repo-local | Activation telemetry emission | Existing analytics adapter |

### Supporting
| Library/Module | Version | Purpose | When to use |
|----------------|---------|---------|-------------|
| `api/status.js` | repo-local | Hosted wrapper around `handleStatus` | Extend status literacy payload once in backend handler |
| `onboarding/backend/agents/discipline-router.cjs` | repo-local (from Phase 40) | Seed -> ranked disciplines | Required for deterministic activation coverage checks |
| `node:test` + `node:assert/strict` | built-in | Contract tests for submit/status/readiness states | No new framework needed |

### Alternatives Considered
| Instead of | Could use | Tradeoff |
|------------|-----------|----------|
| Inline readiness logic in both handlers | Shared readiness helper module | Shared helper reduces drift and duplicate bugs |
| Blocking submit on missing literacy docs | Non-blocking status contract (`partial`/`unconfigured`) | Blocking submit would regress onboarding availability |
| New endpoint for readiness | Extend existing submit/status payloads | Existing routes already consumed and tested |

## Architecture and Integration Points

### Recommended structure

```text
onboarding/backend/
├── handlers.cjs                                 # extend submit + status response shapes
├── vector-store-client.cjs                      # existing getLiteracyContext + healthCheck
└── literacy/
    └── activation-readiness.cjs                 # NEW: shared readiness evaluator

onboarding/backend/agents/
└── discipline-router.cjs                        # existing Phase 40 router dependency

api/
└── status.js                                    # no logic change; inherits handleStatus output
```

### Integration points to modify
- `handleSubmit` in `onboarding/backend/handlers.cjs`:
  - After successful orchestration response assembly, invoke readiness helper with the validated seed.
  - Add `literacy` block to response payload: `{ readiness, disciplines_available, gaps }`.
  - Emit `literacy_activation_observed` telemetry per submission.
- `handleStatus` in `onboarding/backend/handlers.cjs`:
  - Add `literacy` block including readiness and latest ingestion signal.
  - Reuse same helper used by submit for parity.
- `api/status.js`:
  - No contract changes beyond inherited payload from `handleStatus`.
- `vector-store-client.cjs`:
  - Reuse existing `healthCheck()` and `getLiteracyContext()`; no required API break.

### Recommended readiness algorithm
1. Check `vectorStore.healthCheck()`.
2. If providers are unconfigured or degraded for literacy access, return `unconfigured`.
3. Rank required disciplines with `rankDisciplines(seed)` and take activation target set (top 3 default, or configured policy if present).
4. For each discipline, probe `getLiteracyContext(discipline, 'health', {}, 1)`.
5. Build `disciplines_available` and `gaps`.
6. Return:
   - `ready`: all required disciplines available.
   - `partial`: at least one required discipline available, at least one gap remains.
   - `unconfigured`: no providers or no literacy availability.

## Constraints and Invariants

- Submit availability invariant: `POST /submit` must remain successful when literacy is missing; readiness is informational, not blocking.
- Contract invariant: submit/status literacy object must be shape-stable and always present once Phase 43 is implemented.
- Degradation invariant: if vector providers are unconfigured, return `unconfigured` without throwing.
- Routing invariant: required discipline set must be deterministic from the same seed input.
- Telemetry invariant: one activation event per submit call, with sanitized metadata only.
- Backward-compatibility invariant: existing `drafts`, `vector_store`, `errors`, and session URL fields remain unchanged.

## Don’t Hand-Roll

| Problem | Do not build | Use instead | Why |
|---------|--------------|-------------|-----|
| Provider readiness checks | Custom env-var-only checks | `vectorStore.healthCheck()` | Captures configured and live reachability state |
| Literacy availability detection | New storage probe protocol | `getLiteracyContext(..., topK=1)` | Already canonical literacy retrieval path |
| Event pipeline | New telemetry client | `telemetry.capture()` | Existing redaction + PostHog wiring |
| Status proxy logic | New API route | Existing `handleStatus` + `api/status.js` wrapper | Single source of truth for status payload |

## Risk Analysis and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Activation placed before true seed persistence boundary | False readiness or duplicated probes | Run readiness after orchestrator returns; do not duplicate persistence side effects in Phase 43. |
| Phase 40 router not available in runtime path | Submit fails or silently defaults incorrectly | Add explicit fallback discipline set (`Paid_Media`, `Content_SEO`, `Lifecycle_Email`) when router import fails. |
| Latency increase in submit from multi-discipline probes | Slower onboarding UX | Probe in parallel with bounded topK=1 and hard timeout/soft-fail behavior. |
| Status and submit drift in readiness logic | Conflicting operator signals | Centralize logic in one helper module consumed by both handlers. |
| Misleading readiness when providers are degraded | Operators trust invalid signal | Gate readiness on health status first; surface provider status inside literacy block. |
| Telemetry cardinality growth from raw pain points | Analytics noise + privacy risk | Emit only counts and normalized discipline names, never raw pain-point text. |

## Common Pitfalls

### Pitfall 1: Treating `partial` as submit failure
- What goes wrong: onboarding flow returns errors for missing literacy coverage.
- Why it happens: readiness interpreted as hard dependency.
- How to avoid: keep readiness advisory and return HTTP 200 for successful submit.
- Warning signs: spike in submit 4xx/5xx when literacy corpus is incomplete.

### Pitfall 2: Duplicating readiness logic in submit and status
- What goes wrong: inconsistent `ready/partial/unconfigured` states between endpoints.
- Why it happens: copy/paste logic divergence.
- How to avoid: extract one shared readiness evaluator module.
- Warning signs: same seed yields different readiness values across endpoints.

### Pitfall 3: Probing too many disciplines synchronously
- What goes wrong: submit latency regresses significantly.
- Why it happens: unbounded sequential literacy probes.
- How to avoid: bound probe set and run in `Promise.all` with low `topK`.
- Warning signs: submit endpoint p95 increases after rollout.

### Pitfall 4: Emitting raw seed content in telemetry
- What goes wrong: potential leakage of user-provided text.
- Why it happens: telemetry payload includes full pain points.
- How to avoid: send aggregate counts and normalized enums only.
- Warning signs: telemetry event payloads include long free-text fields.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node built-in `node:test` + `node:assert/strict` |
| Config file | none required |
| Quick run command | `node --test test/onboarding-server.test.js -x` |
| Full suite command | `npm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test type | Automated command | File exists? |
|--------|----------|-----------|-------------------|-------------|
| LIT-13 | Submit returns literacy activation block with gaps based on ranked disciplines | integration | `node --test test/onboarding-server.test.js -x` | ✅ (extend) |
| LIT-14 | Status exposes literacy readiness and discipline availability contract | integration | `node --test test/onboarding-server.test.js -x` | ✅ (extend) |
| LIT-15 | Submit emits `literacy_activation_observed` event with normalized fields | unit/integration | `node --test test/onboarding-server.test.js -x` | ✅ (extend) |

### Sampling Rate
- Per task commit: `node --test test/onboarding-server.test.js -x`
- Per wave merge: `node --test test/**/*.test.js`
- Phase gate: `npm test`

### Wave 0 Gaps
- [ ] Add submit contract test for `ready` state with mocked literacy hits across required disciplines.
- [ ] Add submit contract test for `partial` state with correct gaps array.
- [ ] Add submit contract test for `unconfigured` state when vector providers unavailable.
- [ ] Add status contract test asserting `literacy` block shape and readiness parity with helper.
- [ ] Add telemetry assertion test for `literacy_activation_observed` payload normalization.

## Planning-Ready Wave/Task Decomposition

### Wave 0: Contract and fixture scaffolding
- T43-00-01: Add failing tests for submit literacy block (`ready`, `partial`, `unconfigured`).
- T43-00-02: Add failing tests for status literacy block shape and readiness parity.
- T43-00-03: Add failing telemetry event assertion for activation observation.

### Wave 1: Shared readiness evaluator
- T43-01-01: Implement `onboarding/backend/literacy/activation-readiness.cjs` helper.
- T43-01-02: Wire health-gated discipline probing with parallel `topK=1` checks.
- T43-01-03: Implement deterministic fallback discipline set when router is unavailable.

### Wave 2: Submit integration
- T43-02-01: Extend `handleSubmit` response with `literacy` readiness block.
- T43-02-02: Emit `literacy_activation_observed` telemetry with normalized payload.
- T43-02-03: Preserve existing submit response contract fields and error semantics.

### Wave 3: Status integration
- T43-03-01: Extend `handleStatus` response with `literacy` readiness block.
- T43-03-02: Add `disciplines_available` and `last_ingestion_at` placeholders/derived values.
- T43-03-03: Confirm hosted wrapper (`api/status.js`) parity without route-level changes.

### Wave 4: Verification and docs
- T43-04-01: Run targeted and full tests; capture failure modes and response snapshots.
- T43-04-02: Add concise operator notes for interpreting readiness states.
- T43-04-03: Validate telemetry dashboards/event filters for new activation signal.

## Environment Availability

| Dependency | Required by | Available | Version/State | Fallback |
|------------|------------|-----------|---------------|----------|
| Node.js | backend runtime and tests | ✓ | 22.13.0 | — |
| npm | test execution | ✓ | 10.9.2 | — |
| Supabase + Upstash provider config | real literacy readiness probes | ✗ | `healthCheck().status = providers_unconfigured` | Return `unconfigured` non-fatally |
| PostHog key | telemetry delivery to external sink | ? | optional; not required for code path | Local no-op telemetry when unset |

Missing dependencies with no fallback:
- None for implementation and test execution.

Missing dependencies with fallback:
- Live vector providers are currently unconfigured; readiness logic must degrade to `unconfigured`.

## State of the Art

| Old approach | Current approach | When changed | Impact |
|--------------|------------------|--------------|--------|
| Submit returns drafts without explicit literacy readiness | Submit/status include explicit readiness contract with discipline gaps | Planned in Phase 43 | Operator can immediately see whether literacy grounding is ready |
| Literacy status only visible through admin health/query endpoints | Literacy readiness exposed in standard submit/status surfaces | Planned in Phase 43 | Reduces operator guesswork and accelerates onboarding handoff |

Deprecated/outdated:
- Inferring literacy readiness manually from provider health and ad hoc admin queries becomes legacy once Phase 43 lands.

## Open Questions

1. Should required discipline set for readiness be top-3 only or all ranked disciplines returned by router?
   - What we know: milestone language references ranked disciplines with availability checks; Phase 40 defaults to top-3 retrieval.
   - What is unclear: whether readiness should mirror retrieval budget or full router output.
   - Recommendation: start with top-3 for latency and behavioral alignment.

2. How should `last_ingestion_at` be sourced without adding new storage contracts?
   - What we know: milestone asks status to include `literacy.last_ingestion_at`.
   - What is unclear: canonical source among Supabase row timestamps vs vector metadata.
   - Recommendation: use Supabase `markos_literacy_chunks.updated_at` max timestamp when configured; otherwise `null`.

3. Should telemetry include project slug directly in payload?
   - What we know: current telemetry wrapper hashes/redacts project identity.
   - What is unclear: analytics requirement for raw slug visibility.
   - Recommendation: keep current hashed contract; do not emit raw slug.

## Sources

### Primary (HIGH confidence)
- `.planning/milestones/v3.0-LITERACY-SYSTEM-ROADMAP.md` - Phase 43 objective, components, and technical requirements
- `.planning/ROADMAP.md` - milestone sequencing context and dependency framing
- `onboarding/backend/handlers.cjs` - live submit/status contracts and integration points
- `onboarding/backend/agents/orchestrator.cjs` - current seed persistence and literacy retrieval behavior
- `onboarding/backend/vector-store-client.cjs` - health/readiness/literacy probe contracts
- `onboarding/backend/agents/telemetry.cjs` - event capture and payload sanitation behavior
- `api/status.js` - hosted status wrapper path
- `test/onboarding-server.test.js` - existing submit/status/orchestrator integration test surface

### Secondary (MEDIUM confidence)
- Local runtime probes (`node --version`, `npm --version`, vector health status) for environment availability assessment.

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Requirements mapping: HIGH - derived directly from milestone and roadmap docs.
- Architecture/integration points: HIGH - mapped against current handler/orchestrator/vector code.
- Risks/mitigations: MEDIUM-HIGH - grounded in live contracts and existing telemetry/SLO surfaces.

**Research date:** 2026-04-01
**Valid until:** 2026-05-01
