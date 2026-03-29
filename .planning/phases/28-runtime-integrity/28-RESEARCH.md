# Phase 28 Research Notes

## Code Reality Snapshot (2026-03-28)

1. Approve flow is handled in `onboarding/backend/handlers.cjs` with path behavior centralized in `onboarding/backend/runtime-context.cjs`.
2. `package.json` engine floor and installer guards are currently not aligned to transitive dependency requirements for Node 20.16+.
3. Install flow appends AI documentation hints but does not yet enforce private local-data gitignore entries for consumer projects.

## Design Constraints

- Keep compatibility paths (`.markos-local`) during v2.2.
- Preserve local vs hosted runtime contracts established in Phase 24.
- Prefer targeted tests over broad grep-driven assertions.

## Test Strategy

- Add direct install guard tests for version rejection and pass-through.
- Add idempotence tests for `.gitignore` injection.
- Add approve path tests validating successful MIR write behavior and no runtime crashes.
