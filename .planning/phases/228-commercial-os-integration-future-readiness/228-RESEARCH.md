# Phase 228 Research - Commercial OS Integration and Future-Readiness

## Primary research question

What final integration gates are required so the new commercial stack does not turn into a set of disconnected engines, hidden provider lock-in, or future obsolescence traps?

## Standard Stack

- Reuse the repo's strongest existing patterns for replaceable adapters, registry validation, and test doctrine.
- Keep parity expectations explicit across UI, API, MCP, contracts, and tests.
- Use the current planning/testing doctrine as a first-class implementation input, not an afterthought.

## Architecture Patterns

- Contract registry and parity checklist.
- Replaceable adapters for external providers.
- Export/migration/archival posture as part of done.
- Final readiness matrix before declaring the commercial stack execution-ready.

## Don't Hand-Roll

- Phase-specific provider shortcuts that bypass adapter contracts.
- UI-only or API-only implementations for commercial engines.
- Migration stories invented after the fact.

## Common Pitfalls

- Declaring "future-ready" without measurable gates.
- Letting each engine pick its own event, identity, approval, or pricing semantics.
- Treating test doctrine as optional once implementation starts moving quickly.

## Codebase Findings

### Files inspected

- `lib/markos/outbound/providers/base-adapter.ts`
- `lib/markos/plugins/registry.js`
- `lib/markos/plugins/loader.js`
- `.planning/V4.0.0-TESTING-ENVIRONMENT-PLAN.md`
- `.planning/V4.0.0-PHASE-TEST-REQUIREMENTS-MATRIX.md`

### Existing support

- The repo already has good replaceable-adapter patterns in outbound providers.
- The plugin runtime already demonstrates explicit contracts, validation, and fail-closed loading.
- The planning layer already has a strong cross-phase testing doctrine using `Vitest`, `Playwright`, and `Chromatic`.

### Missing capabilities

- No commercial-stack parity gate across UI, API, MCP, and contracts.
- No explicit migration/export/archival policy for future commercial engines.
- No final readiness matrix dedicated to provider replaceability, no-obsolescence posture, and cross-engine contract drift.

## Recommended Implementation Path

1. Define a commercial contract registry that every engine phase must register against.
2. Require every engine to declare UI/API/MCP posture explicitly, even when one surface is intentionally deferred.
3. Make adapter replaceability and export posture explicit acceptance criteria, not informal preferences.
4. Turn the current testing doctrine into a final cross-engine gate for the commercial stack.
5. Add a final audit artifact that blocks future expansion if the commercial engines are drifting into silos.

## Tests Implied

- Contract-parity tests across UI/API/MCP surfaces.
- Adapter replaceability and failure-mode tests.
- Migration/export/archival invariants.
- Cross-engine regression tests proving identity, consent, pricing, task, approval, and evidence rules stay shared.
- Readiness-matrix tests or validation scripts for final closeout.

## Research Decisions

- Phase 228 is necessary and should remain a real phase, not a checklist buried elsewhere.
- "Future-ready" must be enforced through parity, migration, adapter, and testing gates.
- No designed obsolescence should be treated as an implementation requirement, not a slogan.
