# Phase 28 Requirements - Runtime Integrity

## Requirement Set

- [x] **P0-01**: `POST /approve` must resolve MIR output path safely and never throw runtime reference errors during valid approval writes.
- [x] **P0-02**: Installer and package metadata must enforce Node.js `>=20.16.0` with explicit user-facing guidance.
- [x] **P0-03**: Install flow must auto-inject `.gitignore` protections for private local MarkOS artifacts with idempotent behavior.

## Acceptance Matrix

| Requirement | Primary Files | Test Coverage Target |
|------------|---------------|----------------------|
| P0-01 | `onboarding/backend/handlers.cjs`, `onboarding/backend/runtime-context.cjs` | `test/write-mir.test.js`, `test/onboarding-server.test.js` |
| P0-02 | `package.json`, `bin/install.cjs`, `README.md` | `test/install.test.js` |
| P0-03 | `bin/install.cjs` | `test/install.test.js` |

## Validation Rule

Phase 28 is complete only when all P0 requirements are checked and verification evidence is captured in `28-VERIFICATION.md`.
