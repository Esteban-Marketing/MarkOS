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

**Plan 203-10 contribution:** F-99 uses block-form `tags:` → no net-new paths
added to the missing list. Count stays at 35.

## 2. QA-06 Playwright E2E suite — phase-infra deferral (per 202-10 precedent)

**Status:** DEFERRED across the whole milestone.

**Origin:** QA-06 in `.planning/phases/200-saas-readiness-wave-0/QUALITY-BASELINE.md`
calls for Playwright E2E coverage across every surface added by a phase. Phase 202
Plan 202-10 explicitly deferred Playwright (see `.planning/STATE.md` note:
"QA-06 (Playwright) deferred per plan 202-10 `<phase_level_notes>` — documented
for `/gsd-verify-work` to treat as testing-infra-phase work"). Phase 203 inherits
that decision.

**What Phase 203 ships in lieu of Playwright:**
- Grep-based a11y assertions (`test/webhooks/ui-s3-a11y.test.js`,
  `test/webhooks/ui-s4-a11y.test.js`) cover locked-copy, ARIA markers, CSS
  tokens, and standalone-vs-shell layout invariants.
- Surface behavior covered by unit tests against the handler layer
  (`test/webhooks/public-status.test.js`, `test/webhooks/settings-api.test.js`,
  `test/webhooks/api-tenant.test.js`).

**Resolution path:** Cross-phase testing-infra plan (likely 204-xx or later) that
spins up a Playwright harness + fixtures for Phase 201/202/203 surfaces together.
Rationale: setting up a single-phase Playwright stack is high-cost / low-payoff
when the milestone already queues ~4 surfaces in 203 alone; batching is cheaper.

## 3. QA-08 LLM eval-as-test — webhook domain has no LLM surfaces

**Status:** NOT APPLICABLE to Phase 203 (gracefully deferred).

**Origin:** QA-08 in `QUALITY-BASELINE.md` requires deterministic eval fixtures
for every LLM-producing surface (Phase 202 shipped 3 such suites for
plan_campaign / draft_message / audit_claim). Phase 203 webhooks produce NO
LLM output — every handler is a pure I/O + HMAC + Redis breaker path. There is
no LLM surface to eval.

**Resolution:** No action required. Phase verifier should accept "not applicable"
for 203 with this note as evidence.
