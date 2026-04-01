# Concerns

## Assessment Rubric

- `Impact (I)`: 1 (minor doc inconvenience) to 5 (high probability of operational mistakes).
- `Likelihood (L)`: 1 (unlikely between milestones) to 5 (likely every week).
- `Detectability (D)`: 1 (detected automatically) to 5 (hard to detect without manual audit).
- `Priority Score`: `I x L x D`.

## Current Scored Assessment (2026-03-31)

| Concern | I | L | D | Priority | Evidence Reviewed | Status |
|---|---|---|---|---|---|---|
| Route drift | 4 | 4 | 3 | 48 | `onboarding/backend/server.cjs`, `onboarding/backend/handlers.cjs`, `ROUTES.md` | Closed |
| Wrapper drift | 4 | 3 | 4 | 48 | `api/*.js`, `onboarding/backend/handlers.cjs`, `ROUTES.md` | Closed |
| Entry point drift | 3 | 3 | 3 | 27 | `bin/*.cjs`, `.agent/get-shit-done/bin/gsd-tools.cjs`, `.agent/markos/bin/markos-tools.cjs`, `ENTRYPOINTS.md` | Closed |
| Topology drift | 3 | 4 | 4 | 48 | `onboarding/backend/**`, `FOLDERS.md`, `FILES.md` | Deferred/Accepted |

## Known Documentation Risks

1. Route drift: onboarding routes can change without summary docs being updated.
2. Wrapper drift: hosted `api/` wrappers can diverge from local route documentation.
3. Entry point drift: CLI additions in `bin/` and `.agent/*/bin/` can be undocumented.
4. Topology drift: folder growth in `onboarding/backend/*` can outpace inventories.

## Operational Risk Notes

- Local and hosted auth boundaries are intentionally different for some operations.
- Some wrappers rely on handler-level secret checks rather than wrapper-level auth.
- Wrapper-level auth variance is expected, but every variance must be called out in `ROUTES.md` and `INTEGRATIONS.md`.

## Mitigations

- Keep `ROUTES.md`, `ENTRYPOINTS.md`, `FOLDERS.md`, and `FILES.md` current.
- Run protocol tests after documentation hierarchy edits.
- Use `33-VERIFICATION.md` checks during phase execution and future changes.

## Open Actions

1. Add route inventory parity check to protocol tests.
Owner: Protocol Maintainer.
Due: 2026-04-05.
Status: Completed (implemented in `test/protocol.test.js` test 4.10).

2. Add wrapper-to-handler mapping and auth-variance assertion checks.
Owner: Protocol Maintainer.
Due: 2026-04-05.
Status: Completed (implemented in `test/protocol.test.js` test 4.10).

3. Add entrypoint coverage checks for documented command surfaces.
Owner: Protocol Maintainer.
Due: 2026-04-05.
Status: Completed (implemented in `test/protocol.test.js` test 4.11).

4. Run weekly light audit and monthly full reconciliation; store dated results in phase 33 folder.
Owner: Protocol Maintainer.
Due: Recurring.
Status: Process action activated (cadence documented in concern assessment).

## Cadence

- Weekly: lightweight drift scan for routes, wrappers, and entrypoints.
- Monthly: full folder/file topology reconciliation.
- Milestone close: required full concern reassessment before transition.

## Refresh Triggers

- New file added under `api/`.
- New route path or method added in `onboarding/backend/server.cjs`.
- New user command added under `bin/`.
- New protocol command entrypoint added under `.agent/*/bin/`.
- New top-level folder or onboarding backend subfolder introduced.
- Any concern status changes from Open to Mitigated/Closed.
