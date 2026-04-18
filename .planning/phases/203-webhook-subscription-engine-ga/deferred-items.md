# Phase 203 — Deferred Items

Tracking out-of-scope discoveries surfaced during execution but NOT fixed
(per scope-boundary rule: only auto-fix issues DIRECTLY caused by the current
plan's changes). These items were pre-existing in the repo at the start of the
phase and are inherited / carried from earlier phases.

## 1. openapi-build `all path operations carry at least one tag` — 35 pre-existing paths missing tags

**Source:** `test/openapi/openapi-build.test.js::all path operations carry at least one tag`
**Status:** FAILING before Phase 203 (inherited from Phase 202 per `.planning/STATE.md` note:
"Pre-existing per-operation `tags:` missing on 35 openapi paths logged to
`deferred-items.md` (scope boundary; plan-10 regen actually improved the
failure count from 2 to 1).").

**Current set (35 operations across 35 paths):**
- `/.well-known/oauth-authorization-server` GET
- `/.well-known/oauth-protected-resource` GET
- `/api/auth/passkey/authenticate-options` POST
- `/api/auth/passkey/authenticate-verify` POST
- `/api/auth/passkey/register-options` POST
- `/api/auth/passkey/register-verify` POST
- `/api/mcp/session` GET, POST
- `/api/settings/custom-domain/*` add / remove / status
- `/api/settings/tenant-branding` GET, POST
- `/api/tenant/invites/*` accept / create / withdraw
- `/api/tenant/lifecycle/*` cancel-offboard / offboard / purge-cron
- `/api/tenant/mcp/*` cost-breakdown / sessions / sessions/revoke / usage
- `/api/tenant/members/*` list / remove
- `/api/tenant/sessions/*` list / revoke
- `/api/tenant/switcher/*` create-tenant / list
- `/api/webhooks/vercel-domain` POST
- `/oauth/authorize`, `/oauth/authorize/approve`, `/oauth/register`, `/oauth/revoke`, `/oauth/token`

**Why deferred:** Contributing contracts (F-71, F-88, F-89, F-95, F-56, F-47, F-62, F-82, F-67, F-68)
declare per-operation tags as inline-array strings `tags: [a, b]` that the repo's
hand-rolled minimal YAML parser in `scripts/openapi/build-openapi.cjs` does not
tokenize as arrays (it keeps them as literal strings). Fixing at contract level
would require a single Edit per file across 10+ unrelated flows (rewrite every
`tags: [a, b]` → block-form `tags:\n  - a\n  - b`). That work is out-of-scope
for Plan 203-04 (webhook replay).

**Phase 203 contribution:** F-98 explicitly uses block-form `tags:` so its two
new paths (`/api/tenant/webhooks/subscriptions/{sub_id}/deliveries/{delivery_id}/replay`
and `/api/tenant/webhooks/subscriptions/{sub_id}/dlq/replay`) are NOT in the
missing list. Delta: 37 → 35.

**Resolution path:** Batch-fix during a future openapi-infra plan (e.g. 203-10 or
204-xx) that either (a) rewrites every inline `tags: [...]` to block form across
all contracts OR (b) upgrades `parseContractYaml` to tokenize inline-array values.
