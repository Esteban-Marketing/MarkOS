# Structure

## Top-Level Placement Rules

- `api/`: hosted wrapper entrypoints only.
- `bin/`: user-facing CLI entrypoints and operational utilities.
- `onboarding/`: UI and backend runtime for onboarding flows.
- `.agent/`: protocol and GSD engines.
- `.planning/`: project planning, phase artifacts, and canonical codebase map.
- `test/`: automated verification suites.
- `RESEARCH/`: domain and market research references.

## Where New Work Belongs

- New HTTP behavior: implement in `onboarding/backend/handlers.cjs` and wire in `server.cjs`.
- Hosted-only route wrappers: add file in `api/` and map in `vercel.json` if needed.
- New shared backend utility: place in `onboarding/backend/` with focused ownership.
- New protocol/planning documentation: place in `.planning/` or `.protocol-lore/` according to audience.
- New tests: place under `test/` with file names matching behavior under test.

## Refresh Triggers

Update this file when directory responsibilities change or a new maintained top-level directory is added.
