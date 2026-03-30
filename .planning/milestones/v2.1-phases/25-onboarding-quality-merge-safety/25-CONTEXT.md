# Phase 25 Context — Onboarding Quality & Merge Safety

## Objective

Improve onboarding reliability by validating extraction and confidence behavior with representative fixtures, hardening approved-draft merge safety, tightening regenerate and approve failure reporting, and reducing warning noise that currently hides real problems.

Phase 25 depends on Phase 24 intentionally. Runtime parity has to be defined first; once local and hosted behavior follow one contract, this phase can focus on whether the onboarding pipeline is actually producing safe, understandable, and testable outcomes for operators.

## Phase Scope

### In Scope
- Add fixture-based coverage for source extraction, schema scoring, and mixed-input onboarding flows.
- Strengthen `write-mir.cjs` merge validation around header drift, fallback insertion, and template variance.
- Improve regenerate and approve behavior so partial failures are easier to understand and debug.
- Reduce or explicitly document noisy fallback and warning paths in orchestration and onboarding tests.

### Out of Scope
- Runtime architecture or entrypoint-parity work already scoped to Phase 24.
- Broad namespace, migration, or multi-tenant persistence work reserved for Phase 26.
- Downstream execution-loop and telemetry expansion work reserved for Phase 27.
- Product-wide identity migration beyond the compatibility surfaces already defined in Phase 23.

## Locked Decisions

1. **Fixture-first quality:** onboarding quality claims should be backed by representative inputs, not only happy-path smoke tests.
2. **Silent merge risk is unacceptable:** fallback insertion and fuzzy header matching must be observable and regression-tested.
3. **User-visible failures must be explainable:** regenerate and approve flows should surface structured failure information rather than generic success envelopes.
4. **Warnings are product signals:** repeated Vector Store, fallback, and skipped-auditor warnings must be reduced or explicitly documented.
5. **Quality work follows runtime hardening:** this phase assumes Phase 24 has already clarified supported runtime behavior and constraints.

## Requirements Mapped

- **ONQ-01**: Source extraction quality and confidence routing are validated with realistic fixtures across URL, file, and mixed-source inputs.
- **ONQ-02**: Approval, regeneration, and merge behavior are safer under partial failure and easier for operators to reason about.
- **ONQ-03**: Warning-heavy or fallback-heavy onboarding paths are either reduced through code changes or documented as intentional behavior.

## Key Files and Surfaces

| Surface | Why It Matters | Likely Outputs |
|---------|----------------|----------------|
| `onboarding/backend/handlers.cjs` | Submit, regenerate, approve, extract, and score flows are orchestrated here | Clearer response contracts, safer partial-failure behavior |
| `onboarding/backend/agents/orchestrator.cjs` | Retry, fallback, Vector Store, and neuro-auditor warning paths surface here | Reduced warning noise, documented intentional degradations |
| `onboarding/backend/confidences/confidence-scorer.cjs` | Interview routing depends on how fields are scored | Fixture-backed scoring expectations and edge-case coverage |
| `onboarding/backend/write-mir.cjs` | Fuzzy merge logic can silently corrupt client-owned files | Stronger fixture tests for header drift, append fallback, and STATE updates |
| `test/onboarding-server.test.js` | Current onboarding coverage is narrow and mostly happy-path | Broader fixture and failure-path coverage |
| `test/write-mir.test.js` | Existing merge tests are shallow relative to current risk | Expanded variant-heavy merge regression suite |
| `onboarding/onboarding.js` and related UI status surfaces | Operators experience regenerate/approve failures through this layer | Better user-facing statuses if response contracts change |

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| More tests still miss real extraction variance | High | Use representative fixtures for URL, file, and mixed-source cases instead of synthetic-only payloads |
| Merge safety work overfits one template version | High | Add multiple template-shape fixtures, including header drift and missing-header cases |
| Better error reporting changes client expectations unintentionally | Medium | Keep response shapes explicit and document any new error fields or non-success states |
| Warning cleanup turns into infrastructure migration work | Medium | Reduce noise where local code owns it; document the rest and defer broader infra changes to later phases |

## Deliverables

1. `25-CONTEXT.md` — this document.
2. `25-01-PLAN.md` — add extraction and scoring fixtures for representative onboarding inputs.
3. `25-02-PLAN.md` — add approval and merge safety tests for template variance and fallback paths.
4. `25-03-PLAN.md` — tighten regenerate and approve error reporting plus user-facing statuses.
5. `25-04-PLAN.md` — burn down warning noise and document intentional fallback behavior.

## Exit Criteria

Phase 25 is complete when onboarding quality is validated by representative fixtures, merge behavior is protected against realistic template drift, regenerate and approve failures are understandable without source inspection, and known warning-heavy fallback paths are either reduced or explicitly documented.

