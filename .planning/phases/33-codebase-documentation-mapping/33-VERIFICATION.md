# Phase 33 Verification

## Manual Drift Checks

1. Route parity check
- Compare `onboarding/backend/server.cjs` routes with `.planning/codebase/ROUTES.md`.
- Compare `api/` wrappers with hosted section in `.planning/codebase/ROUTES.md`.

1. Entrypoint parity check
- Compare `bin/`, `.agent/get-shit-done/bin/`, `.agent/markos/bin/` with `.planning/codebase/ENTRYPOINTS.md`.

1. Folder and file parity check
- Compare top-level tree to `.planning/codebase/COVERAGE-MATRIX.md`, `FOLDERS.md`, and `FILES.md`.

1. Canonical-link parity check
- Confirm `README.md`, `TECH-MAP.md`, and `.protocol-lore/CODEBASE-MAP.md` reference `.planning/codebase/README.md` as canonical.

## Automated Checks

- Run: `node --test test/protocol.test.js`
- Expected: documentation integrity assertions pass.

## Update Triggers

Run this verification after:

- New route additions/removals.
- New wrapper or CLI entrypoint additions.
- Folder restructuring or major file ownership shifts.
- Changes to summary docs describing topology.

## Exit Decision

Phase 33 requirements are complete and verified. Phase can transition.

Outcome: passed.
