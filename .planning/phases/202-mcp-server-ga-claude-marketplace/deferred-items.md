# Phase 202 — Deferred Items

Out-of-scope issues discovered during execution. Not blocking for Phase 202 close.

## From Plan 202-10 execution (2026-04-18)

### [Pre-existing] OpenAPI per-operation `tags:` missing across 35 paths

**Discovered during:** Task 3 GREEN (openapi-build.test.js regression)

**Nature:** The test `all path operations carry at least one tag` fails across 35 operation/path
combos spanning Phase 201 + Phase 202 contracts. Examples: `/oauth/authorize`, `/oauth/token`,
`/oauth/register`, `/api/mcp/session`, `/api/tenant/mcp/usage`, `/api/tenant/sessions/list`,
`/api/tenant/lifecycle/purge-cron`, etc.

**Root cause:** Individual F-contract `paths:<path>:<method>:tags` fields are not populated in
the YAML contracts. The test was added in a prior phase as a forward-looking assertion but the
contract-writing convention hasn't caught up. Stashing this plan's additions shows the test was
ALREADY failing before Plan 202-10 (11 pass / 2 fail prior; 15 pass / 1 fail post-regen).

**Why deferred (scope boundary):** This failure is not caused by this plan's file changes — I
merely regenerated the openapi.json artifact which exposed the pre-existing contract gap. Per
the GSD execution scope boundary: "Only auto-fix issues DIRECTLY caused by the current task's
changes. Pre-existing warnings, linting errors, or failures in unrelated files are out of scope."

**Suggested owner:** A future "contracts cleanup" plan that adds `tags: [oauth]` / `tags: [mcp]` /
`tags: [tenancy]` metadata to every F-NN YAML operation. Low risk — pure annotation change.

### [Pre-existing lint warnings] test/openapi/openapi-build.test.js

- Line 18: `Prefer 'node:fs' over 'fs'` (javascript:S7772)
- Line 19: `Prefer 'node:path' over 'path'` (javascript:S7772)
- Line 55: optional chain suggestion (javascript:S6582)

All three warnings are on code written by a prior phase and untouched by this plan.
