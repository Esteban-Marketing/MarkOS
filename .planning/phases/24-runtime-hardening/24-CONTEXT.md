# Phase 24 Context — Runtime Hardening

## Objective

Harden the shared onboarding runtime so the local Node server and the hosted API-wrapper entrypoints execute the same business rules, apply the same configuration precedence, and fail in predictable ways when persistence or filesystem assumptions are unavailable.

This phase follows Phase 23 deliberately. Phase 23 defines which identifiers and state surfaces are canonical versus compatibility-only; Phase 24 turns that contract into runtime behavior that is explicit, testable, and safe across local and hosted execution.

## Phase Scope

### In Scope
- Audit local-only and hosted-only branches across the onboarding runtime.
- Centralize environment detection, config loading, slug resolution, and path/persistence decisions.
- Add coverage proving shared handlers behave consistently when invoked through `server.cjs` and through `api/*.js` wrappers.
- Document deployment constraints for approval flows, write behavior, and persistence expectations.

### Out of Scope
- Broad onboarding quality improvements unrelated to runtime parity.
- Chroma namespace migration or destructive local-state renames.
- Full execution-loop hardening outside the onboarding/runtime boundary.
- UI or copy refresh except where needed to accurately document runtime behavior.

## Locked Decisions

1. **Shared runtime first:** `onboarding/backend/handlers.cjs` remains the main business-logic surface; entrypoints should stay thin.
2. **Explicit environment behavior:** hosted versus local execution must be derived from centralized rules, not scattered `process.env.VERCEL` branches.
3. **Predictable persistence:** write-capable flows must either work from a clearly defined local contract or fail behind documented hosted constraints.
4. **Compatibility-aware hardening:** Phase 23's identity and compatibility contract is an input to this phase, not something to reinterpret here.
5. **Tests over intuition:** runtime parity claims should be backed by fixture or handler coverage wherever feasible.

## Requirements Mapped

- **RTH-01**: Shared handler behavior is consistent across local server and hosted API wrapper entrypoints.
- **RTH-02**: Configuration, slug resolution, and filesystem/persistence behavior follow one explicit precedence model.
- **RTH-03**: Environment-sensitive operations and deployment constraints are isolated, documented, and covered by tests or explicit limitations.

## Key Files and Surfaces

| Surface | Why It Matters | Likely Outputs |
|---------|----------------|----------------|
| `onboarding/backend/handlers.cjs` | Shared runtime currently mixes business logic with environment-specific branches | Centralized runtime helpers, narrower conditional branches, documented behavior |
| `onboarding/backend/server.cjs` | Local server entrypoint defines one side of the parity contract | Thin entrypoint, aligned request/config handling |
| `api/*.js` | Hosted wrappers define the other side of the parity contract | Verified wrapper consistency, clearer limitations |
| `onboarding/backend/path-constants.cjs` | Canonical filesystem roots and config path source | Reused by runtime helpers, reduced ad hoc path logic |
| `onboarding/backend/write-mir.cjs` | Approval flow persistence target and write semantics | Explicit contract for when writes are local-only versus hosted-compatible |
| `onboarding/backend/chroma-client.cjs` | Shared persistence and namespace behavior | Documented expectations for local and hosted execution |
| `test/onboarding-server.test.js`, related runtime tests | Fast proof that both runtime modes behave consistently | Additional tests for parity and guarded failure modes |

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Small runtime branches hide different behavior between local and hosted modes | High | Audit handlers and wrappers before refactoring, then encode results into tests |
| Config precedence changes break existing local workflows | High | Document current behavior first, then centralize without changing canonical precedence accidentally |
| Hosted approve flows appear supported but rely on unstable filesystem assumptions | High | Add explicit constraints and reject unsupported paths predictably |
| Runtime hardening expands into onboarding quality work | Medium | Keep this phase focused on parity, guards, and runtime contracts only |

## Deliverables

1. `24-CONTEXT.md` — this document.
2. `24-01-PLAN.md` — audit local-only and hosted-only runtime branches.
3. `24-02-PLAN.md` — centralize config precedence and environment detection.
4. `24-03-PLAN.md` — add parity coverage for local-server and API-wrapper execution.
5. `24-04-PLAN.md` — document deployment and persistence constraints for approve/write flows.

## Exit Criteria

Phase 24 is complete when the onboarding runtime has one documented environment model, shared handlers behave consistently across local and hosted entrypoints, write-sensitive flows either operate from a clear contract or fail explicitly, and the most important assumptions are proven by tests rather than scattered comments.
