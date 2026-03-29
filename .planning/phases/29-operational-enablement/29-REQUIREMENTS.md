# Phase 29 Requirements - Operational Enablement

## Requirement Set

- [x] **P1-01**: `POST /linear/sync` must create Linear issues from ITM tokens with deterministic assignee mapping and clear setup errors.
- [x] **P1-02**: `POST /campaign/result` must append Winners Catalog entries and persist campaign outcome metadata for reuse.
- [x] **P1-03**: Interview flow must be hard-capped at 5 questions with visible progress and automatic draft-generation transition.

## Acceptance Matrix

| Requirement | Primary Files | Test Coverage Target |
|------------|---------------|----------------------|
| P1-01 | `onboarding/backend/linear-client.cjs`, `onboarding/backend/handlers.cjs`, `onboarding/backend/server.cjs`, `.env.example` | `test/onboarding-server.test.js` |
| P1-02 | `onboarding/backend/handlers.cjs`, `onboarding/backend/vector-store-client.cjs`, `onboarding/backend/agents/msp-filler.cjs`, `TECH-MAP.md` | `test/onboarding-server.test.js` |
| P1-03 | `onboarding/backend/handlers.cjs`, `onboarding/onboarding.js`, `onboarding/index.html` | `test/onboarding-server.test.js` |

## Validation Rule

Phase 29 is complete only when all P1 requirements are checked and verification evidence is captured in `29-VERIFICATION.md`.

