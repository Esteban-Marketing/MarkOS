# Phase 44: End-to-End Literacy Integration Verification - Research

**Researched:** 2026-04-01
**Domain:** End-to-end literacy lifecycle verification, coverage telemetry, and regression gating
**Confidence:** MEDIUM

## Summary

Phase 44 should be planned as a terminal verification and observability phase that proves literacy grounding works across the full operational path: ingest corpus -> onboarding submit -> orchestrator retrieval -> draft output inspection -> operator coverage reporting. The milestone defines this as a cross-cutting integration phase rather than a single-module feature, so the planning emphasis should be deterministic fixtures, contract-stable telemetry, and CI failure conditions that detect zero-hit regressions early.

Current runtime code shows major dependency gaps relative to the v3.0 milestone expectations: orchestrator still performs single-discipline literacy fetch (`Paid_Media`), no public literacy coverage endpoint exists, and no dedicated literacy E2E test suite or fixture corpus is present. Because of this, Phase 44 should include a Wave 0 readiness hardening pass that either (a) verifies Phases 40-43 delivered contracts are present, or (b) introduces compatibility shims so E2E verification can run against current surfaces without creating false confidence.

**Primary recommendation:** Implement Phase 44 as a strict verification harness with explicit preflight checks for prerequisite contracts, then add a dedicated literacy E2E test path plus a coverage endpoint and CI regression gate that fails on zero retrieval hits when fixtures are loaded.

## Goal and Requirements Mapping

### Goal (source-mapped)
- Roadmap source: `.planning/ROADMAP.md` establishes v3.0 literacy milestone sequence through Phase 43 and references v3.0 as planned sequence context.
- Milestone source: `.planning/milestones/v3.0-LITERACY-SYSTEM-ROADMAP.md` defines Phase 44 objective: validate full literacy lifecycle and confirm pain-points-first retrieval improves output relevance.

### Requirements Map (roadmap + milestone technical requirements)

| ID | Requirement | Source | Research support |
|----|-------------|--------|------------------|
| LIT-16 | E2E literacy lifecycle test validates ingest -> submit -> orchestrate -> pain-point-relevant `standards_context`. | v3.0 milestone Phase 44 objective + technical requirements | Existing onboarding/orchestrator test patterns can host this as a dedicated `test/literacy-e2e.test.js` suite with fixtures. |
| LIT-17 | Coverage dashboard API returns per-discipline counts and freshness metadata. | v3.0 milestone Phase 44 key component: `GET /api/literacy/coverage` | Existing `api/` wrappers and backend handlers pattern support adding a new endpoint with shared runtime auth semantics. |
| LIT-18 | CI regression guard fails when literacy retrieval returns zero hits with a populated test corpus. | v3.0 milestone Phase 44 key component: regression guard | Current test command (`npm test`) can incorporate a dedicated gate test and fail-fast assertion in CI. |
| LIT-19 | Operator runbook documents install -> db setup -> ingest -> coverage verify -> onboarding verify workflow. | v3.0 milestone Phase 44 key component: operations runbook | Existing `.planning/codebase/` docs model supports adding literacy operations runbook and linkage from tech map docs. |

Notes:
- No workspace-global `.planning/REQUIREMENTS.md` exists for v3.0 IDs; IDs above are phase-local continuity IDs inferred from prior Phase 43 mapping style.
- `.planning/ROADMAP.md` does not currently include explicit Phase 44 requirement IDs; milestone doc is the canonical detailed source.

## Architecture and Integration Points

### Recommended structure

```text
test/
├── literacy-e2e.test.js                 # NEW: full lifecycle verification
└── fixtures/
    └── literacy/                        # NEW: deterministic corpus fixture set

api/
└── literacy/
    └── coverage.js                      # NEW: hosted/API-wrapper route

onboarding/backend/
├── handlers.cjs                         # extend with coverage handler
├── server.cjs                           # route /api/literacy/coverage
└── vector-store-client.cjs              # add/report discipline coverage query helpers

.planning/codebase/
└── LITERACY-OPERATIONS.md               # NEW: operator runbook
```

### Integration points to modify
- `onboarding/backend/handlers.cjs`
  - Add `handleLiteracyCoverage` for discipline-level counts and metadata shaping.
  - Keep response payload stable and redaction-safe for hosted mode.
- `onboarding/backend/server.cjs`
  - Register `GET /api/literacy/coverage` to backend handler.
- `api/` hosted wrappers
  - Add coverage wrapper path aligned with existing auth/operation guard conventions used by `api/status.js`.
- `onboarding/backend/vector-store-client.cjs`
  - Add narrow helper(s) that aggregate discipline `doc_count`, `chunk_count`, `last_updated`, and `business_models` from configured providers.
  - Preserve provider-unconfigured behavior (degrade to empty diagnostics, not process crash).
- `test/` surfaces
  - Add dedicated lifecycle test file and fixture corpus directory.
  - Add regression gate test validating non-zero retrieval on populated fixtures.

### Current-state deltas that must be accounted for
- `onboarding/backend/agents/orchestrator.cjs` still uses single-discipline retrieval (`Paid_Media`) and event `literacy_context_observed`.
- No `api/literacy/coverage.js` route exists.
- No `test/literacy-e2e.test.js` exists.
- No `test/fixtures/literacy/` fixture corpus exists.
- No `.planning/codebase/LITERACY-OPERATIONS.md` runbook exists.

## Constraints and Invariants

- Verification must not silently pass on empty literacy context when fixtures are present.
- E2E tests must remain deterministic and not depend on live external providers by default.
- Phase 44 must preserve backward-compatible runtime behavior when providers are unconfigured.
- Coverage endpoint must be read-only and compatible with hosted auth boundaries.
- Existing submit/status contracts must remain unchanged unless explicitly versioned.
- Telemetry payloads must avoid raw user text leakage (counts/enums only).
- Terminal verification should reflect true dependency state; if prerequisite phase contracts are missing, tests should fail with explicit diagnostics.

## Risk Analysis and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Prerequisite drift (Phases 40-43 not fully implemented) invalidates Phase 44 assertions | False positives or fragile tests | Add Wave 0 preflight contract checks and explicit skip/fail classification with actionable messages. |
| Fixture corpus diverges from production schema/frontmatter | Verification confidence is misleading | Reuse the same chunker/ingest parser and schema validation path used by runtime ingestion. |
| Coverage endpoint over-queries providers and slows status operations | Operator UX regression | Keep coverage endpoint separate from `/status` and apply bounded aggregation strategy. |
| Regression gate too strict for unconfigured local environments | Developer friction and flaky CI | Gate only when test corpus fixture is loaded; provide explicit unconfigured-path expectation. |
| Hosted auth mismatch for new coverage route | Security regression | Follow existing runtime-context auth pattern used by `api/status.js`. |
| Telemetry cardinality blow-up from per-chunk events | Noisy analytics and cost growth | Emit one compact verification signal per run with summary metrics only. |

## Validation Architecture and Test Strategy

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node built-in `node:test` + `node:assert/strict` |
| Config file | none required |
| Quick run command | `node --test test/literacy-e2e.test.js -x` |
| Full suite command | `npm test` |

### Requirement -> Test Map
| Req ID | Behavior | Test type | Automated command | File exists? |
|--------|----------|-----------|-------------------|-------------|
| LIT-16 | End-to-end lifecycle yields discipline/pain-point-relevant `standards_context` | integration/e2e | `node --test test/literacy-e2e.test.js -x` | No - Wave 0 |
| LIT-17 | Coverage endpoint returns discipline aggregation contract shape | integration | `node --test test/literacy-e2e.test.js -x` | No - Wave 0 |
| LIT-18 | Regression gate fails when corpus exists but retrieval returns zero hits | integration/ci-gate | `node --test test/literacy-e2e.test.js -x` | No - Wave 0 |
| LIT-19 | Runbook steps align to executable command flow and diagnostics | doc + smoke | `npm test` + manual checklist | No - Wave 0 |

### Sampling Rate
- Per task commit: `node --test test/literacy-e2e.test.js -x`
- Per wave merge: `node --test test/**/*.test.js`
- Phase gate: `npm test`

### Wave 0 Gaps
- [ ] Create `test/literacy-e2e.test.js` with lifecycle skeleton cases.
- [ ] Create `test/fixtures/literacy/` corpus with at least 3 discipline fixture docs.
- [ ] Add route coverage tests for `GET /api/literacy/coverage` contract.
- [ ] Add regression assertion for non-zero retrieval on populated corpus.
- [ ] Add runbook presence and command reference checks in docs verification path.

## Planning-Ready Wave and Task Decomposition

### Wave 0: Preflight contracts and fixture scaffolding
- T44-00-01: Add preflight helper that validates prerequisite contracts (router/retrieval/readiness surfaces) before E2E assertions run.
- T44-00-02: Scaffold `test/literacy-e2e.test.js` with failing lifecycle, coverage, and regression-gate tests.
- T44-00-03: Add deterministic literacy fixture corpus under `test/fixtures/literacy/`.

### Wave 1: Coverage endpoint and aggregation plumbing
- T44-01-01: Implement backend `handleLiteracyCoverage` in `onboarding/backend/handlers.cjs`.
- T44-01-02: Add `GET /api/literacy/coverage` route wiring in `onboarding/backend/server.cjs` and hosted wrapper in `api/`.
- T44-01-03: Implement vector-store aggregation helper for discipline counts/freshness/business model set.

### Wave 2: End-to-end lifecycle verification
- T44-02-01: Implement fixture ingest setup and teardown in literacy E2E tests.
- T44-02-02: Assert submit/orchestrate outputs include pain-point-relevant `standards_context` evidence.
- T44-02-03: Assert coverage endpoint reflects ingested fixture corpus per discipline.

### Wave 3: Regression gate and CI integration
- T44-03-01: Add explicit zero-hit regression test branch (populated corpus -> zero hits must fail).
- T44-03-02: Wire literacy E2E suite into CI command path used by repository.
- T44-03-03: Add clear CI failure diagnostics for retrieval regressions.

### Wave 4: Operations docs and phase hardening
- T44-04-01: Create `.planning/codebase/LITERACY-OPERATIONS.md` with full operator workflow.
- T44-04-02: Link literacy operations runbook from roadmap/tech map docs where appropriate.
- T44-04-03: Run full suite and capture residual manual verification checklist for live-provider environments.

## Environment Availability

| Dependency | Required by | Available | Version/State | Fallback |
|------------|------------|-----------|---------------|----------|
| Node.js | runtime + tests | Yes | 22.13.0 | - |
| npm | full-suite execution | Yes | 10.9.2 | - |
| Supabase credentials/provider | live ingestion + live coverage data | Unknown in this session | not probed with secrets | Use mocked provider path for automated tests |
| Upstash Vector credentials/provider | live retrieval + coverage aggregation | Unknown in this session | not probed with secrets | Use mocked provider path for automated tests |
| CI workflow for backend tests | regression gating | Partial | only `.github/workflows/ui-quality.yml` detected | Add/extend backend test workflow in this phase |

Missing dependencies with no fallback:
- None for local implementation and unit/integration test execution.

Missing dependencies with fallback:
- Live provider credentials can be absent; Phase 44 tests should default to fixture/mocked validation paths.

## Project Constraints (from CLAUDE.md)

- Context read order for operations: `.protocol-lore/QUICKSTART.md` -> `.protocol-lore/INDEX.md` -> `.planning/STATE.md` -> `.agent/markos/MARKOS-INDEX.md`.
- Treat `.planning/STATE.md` as canonical state tracker.
- Keep MarkOS/GSD boundary conventions and `.markos-local/` override rules intact.
- Keep `npx markos` as canonical operator CLI entrypoint.
- Keep test commands aligned to `npm test` and `node --test test/**/*.test.js`.
- Maintain onboarding backend entrypoint behavior: `node onboarding/backend/server.cjs`.

## Blockers and Open Questions

1. Phase dependency blocker: terminal verification assumes Phase 40-43 runtime contracts, but current orchestrator/route surfaces still show pre-Phase-40 behavior. Decide whether to hard-block Phase 44 until dependencies land or include temporary compatibility harnesses.
2. Requirement ID governance: milestone defines Phase 44 requirements textually without explicit IDs in `.planning/ROADMAP.md`. Confirm whether to formalize `LIT-16` to `LIT-19` in a canonical requirements file before planning.
3. Coverage endpoint ownership: confirm whether discipline coverage should live at `api/literacy/coverage.js` or be nested into existing `api/status.js` response under a guarded optional block.
4. CI strategy: repository currently exposes UI-focused workflow only. Confirm whether backend literacy verification should extend existing workflow or introduce a dedicated backend verification workflow.

## Sources

### Primary (HIGH confidence)
- `.planning/milestones/v3.0-LITERACY-SYSTEM-ROADMAP.md` - Phase 44 objective, components, and technical requirements.
- `.planning/ROADMAP.md` - milestone sequencing context and active planning surface.
- `onboarding/backend/agents/orchestrator.cjs` - current literacy retrieval behavior and `standards_context` wiring.
- `onboarding/backend/handlers.cjs` - current backend route/handler contracts and literacy admin endpoints.
- `onboarding/backend/server.cjs` - route registration baseline.
- `api/status.js` - hosted wrapper/auth pattern baseline.
- `package.json` - canonical test commands and runtime engine constraints.

### Secondary (MEDIUM confidence)
- Local environment probe (`node --version`, `npm --version`) executed in workspace shell.

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Requirements mapping: MEDIUM-HIGH (milestone explicit, but no canonical v3.0 requirements file in workspace root).
- Architecture and integration points: HIGH (mapped to current runtime code and route surfaces).
- Validation strategy: MEDIUM (depends on unresolved prerequisite-phase contract completion).

**Research date:** 2026-04-01
**Valid until:** 2026-04-15
