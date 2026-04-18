---
phase: 202-mcp-server-ga-claude-marketplace
plan: 01
subsystem: database
tags: [mcp, supabase, postgres, rls, oauth, sessions, cost-metering, cron, node:crypto, audit]

# Dependency graph
requires:
  - phase: 201-saas-tenancy-hardening
    provides: markos_tenants + markos_orgs + markos_tenant_memberships schema, markos_audit_log_staging + enqueueAuditStaging helper, vercel.ts cron registry pattern, tenant/invites.cjs dual-export convention
  - phase: 200-saas-readiness-wave-0
    provides: MCP server skeleton (lib/markos/mcp/server.cjs), markos_mcp_sessions design intent in F-71 contract
provides:
  - markos_mcp_sessions table (opaque 32-byte token hash, 24h rolling TTL, tenant-bound, FK cascade)
  - markos_mcp_cost_window table + atomic check_and_charge_mcp_budget() plpgsql fn
  - lib/markos/mcp/sessions.cjs — full D-06 session lifecycle (hashToken, createSession, lookupSession with timingSafeEqual, touchSession, revokeSession, listSessionsFor*)
  - api/mcp/session/cleanup.js — shared-secret-gated cron for 7-day retention hard-purge
  - vercel.ts — 4th cron entry (0 */6 * * *) for MCP session cleanup
  - source_domain='mcp' now in AUDIT_SOURCE_DOMAINS whitelist
affects: [202-02 (OAuth 2.1 + PKCE consent flow), 202-03 (cost-meter + rate-limit), 202-04 (tool pipeline + per-call audit), 202-05 (tenant-scoped tool dispatch), 202-06 (/settings/mcp UI)]

# Tech tracking
tech-stack:
  added: []  # Zero new deps — all implementation leans on existing node:crypto + @supabase/supabase-js + @supabase/ssr
  patterns:
    - "Opaque 32-byte token → sha256 hash at rest → partial index on token_hash where revoked_at is null"
    - "24h rolling TTL via touchSession (last_used_at + expires_at = now()+24h on every successful tool call)"
    - "Atomic per-tenant cost accumulation via plpgsql security-definer fn with ON CONFLICT upsert (row-lock-safe)"
    - "Rule 3 extension: AUDIT_SOURCE_DOMAINS grows from 11 → 12 entries ('mcp' joins; locked-list regression test updated in lockstep)"
    - "Dual-export library convention (.cjs source + .ts re-export stub) matches Phase 201 tenant/invites"

key-files:
  created:
    - supabase/migrations/88_markos_mcp_sessions.sql
    - supabase/migrations/rollback/88_markos_mcp_sessions.down.sql
    - supabase/migrations/89_markos_mcp_cost_window.sql
    - supabase/migrations/rollback/89_markos_mcp_cost_window.down.sql
    - lib/markos/mcp/sessions.cjs
    - lib/markos/mcp/sessions.ts
    - api/mcp/session/cleanup.js
    - test/mcp/session.test.js
    - test/mcp/rls.test.js
    - test/mcp/migration-idempotency.test.js
  modified:
    - vercel.ts (append 4th cron entry; preserve existing 3)
    - lib/markos/audit/writer.cjs ('mcp' added to AUDIT_SOURCE_DOMAINS)
    - lib/markos/audit/writer.ts (same addition in typed tuple)
    - test/audit/hash-chain.test.js (locked-list regression updated to 12 entries)

key-decisions:
  - "Rule 3 auto-fix: added 'mcp' to AUDIT_SOURCE_DOMAINS. 202-CONTEXT.md D-12 assumes the enum is open but writer.cjs enforces a frozen whitelist; without this fix createSession/revokeSession would throw on every audit emission."
  - "Defense-in-depth timingSafeEqual on top of token_hash lookup — the partial index already narrows the row, but constant-time hex-byte compare defeats residual side-channels between probe phases (Pitfall 5 of 202-RESEARCH)."
  - "7-day retention cutoff applies to both expires_at and revoked_at — gives audit replay a consistent window regardless of how the session ended."
  - "Cleanup endpoint accepts BOTH x-markos-cron-secret header AND Bearer token for cron-runner flexibility; both verified against the same MARKOS_MCP_CRON_SECRET env."
  - "Mock client in session.test.js models the Supabase fluent API with a chain-of-filters accumulator so one mock serves insert/select/update with .eq+.is predicates (avoids spawning a real DB for Wave-1 unit tests)."

patterns-established:
  - "Session lifecycle audit emissions are best-effort (try/catch around enqueueAuditStaging) so a staging-table outage never blocks token issuance. Drain-cron fills the gap."
  - "Hard-purge cron = delete where cutoff-passed with .or() composite filter, returns .select('id') so row count becomes purge count."
  - "plpgsql atomic-check-and-charge pattern: select coalesce(sum), short-circuit on cap breach, otherwise INSERT … ON CONFLICT DO UPDATE SET spent_cents = spent_cents + charge."

requirements-completed: [MCP-01, QA-03, QA-13]

# Metrics
duration: ~38min
completed: 2026-04-18
---

# Phase 202 Plan 01: MCP Session Persistence + Cost Window Substrate Summary

**`markos_mcp_sessions` + `markos_mcp_cost_window` shipped: opaque 32-byte token hashed at rest with 24h rolling TTL (sha256 + timingSafeEqual lookup), atomic `check_and_charge_mcp_budget` plpgsql fn, tenant-bound at consent with FK-cascade on offboard, plus 4th cron entry hard-purging 7-day-stale rows.**

## Performance

- **Duration:** ~38 min
- **Started:** 2026-04-17T23:51:00Z (approx — STATE.md showed phase 202 just opened)
- **Completed:** 2026-04-18T00:29:33Z
- **Tasks:** 3/3 complete
- **Files modified:** 13 (10 created + 3 modified)
- **Tests added:** 30 node:test cases (session lifecycle 16 + RLS 6 + cleanup 5 + migration idempotency 4; `-1 overlap with Task 3 append` gives 30 distinct)
- **Tests green:** 30/30 in 202-01 suite; 25/25 in phase-201 regression (tenancy + audit); overall 55/55 verified

## Accomplishments

- **Migrations 88 + 89 shipped** with idempotent forward + rollback scripts (all `create … if not exists` / `drop … if exists`). Migration 88 enforces FK cascade on `tenant_id` + `org_id` so offboard-purge silently takes sessions with it (Pitfall 9 defense). Migration 89's `check_and_charge_mcp_budget` is `security definer` plpgsql with atomic INSERT…ON CONFLICT DO UPDATE — single transaction, single row lock, safe under parallel tool-call stampede (Pitfall 4 / T-202-01-08).
- **`lib/markos/mcp/sessions.cjs` implements the full D-06 contract**: `hashToken` (sha256 hex), `createSession` (32-byte opaque random + hash at rest + offboarding-tenant rejection + audit emit), `lookupSession` (partial-index token_hash match + `timingSafeEqual` constant-time compare + expiry gate + token_hash/revoked_at stripped from return), `touchSession` (24h rolling extend), `revokeSession` (audit emit on transition), `listSessionsFor{Tenant,User}` (projection explicitly omits `token_hash`).
- **`api/mcp/session/cleanup.js` cron endpoint** honoring both `x-markos-cron-secret` header and `Authorization: Bearer` forms, 7-day retention cutoff, composite `.or('expires_at.lt.cutoff,revoked_at.lt.cutoff')` filter, returns `{ success, purged }`.
- **`vercel.ts` now registers 4 crons**: Phase 201's audit drain (`*/1 * * * *`), lifecycle purge (`0 3 * * *`), signup cleanup (`0 */1 * * *`) are all preserved; MCP cleanup lands at `0 */6 * * *` (every 6h).
- **`source_domain='mcp'` wired into the audit fabric** — writer.cjs whitelist extended to 12 entries, typed tuple in writer.ts mirrored, locked-list regression test updated in lockstep. This was a Rule 3 blocking fix: 202-CONTEXT.md D-12 explicitly documents MCP uses the existing audit path, but Phase 201 froze the enum; without this extension every `createSession` + `revokeSession` would have thrown on audit emission.

## Task Commits

Each task committed atomically:

1. **Task 1: Migrations 88 + 89 + check_and_charge_mcp_budget fn + migration idempotency suite** — `b7ab22e` (feat)
2. **Rule 3 fix: `mcp` into AUDIT_SOURCE_DOMAINS whitelist** — `9e478c8` (fix)
3. **Task 2: sessions.cjs + dual-export + session.test.js + rls.test.js** — `118f559` (feat)
4. **Task 3: Cron cleanup endpoint + vercel.ts registration + 5 appended cleanup tests** — `77e8d10` (feat)

## Files Created/Modified

Created (10):
- `supabase/migrations/88_markos_mcp_sessions.sql` — table + 4 indexes + 4 RLS policies + FK cascades
- `supabase/migrations/rollback/88_markos_mcp_sessions.down.sql` — reverse-order idempotent drops
- `supabase/migrations/89_markos_mcp_cost_window.sql` — hourly-bucket table + idx + RLS + atomic check-and-charge fn
- `supabase/migrations/rollback/89_markos_mcp_cost_window.down.sql` — fn dropped before table
- `lib/markos/mcp/sessions.cjs` — session lifecycle source of truth (188 LOC)
- `lib/markos/mcp/sessions.ts` — typed re-export stub
- `api/mcp/session/cleanup.js` — cron-gated 7d-retention purge endpoint
- `test/mcp/migration-idempotency.test.js` — 4 grep-shape assertions
- `test/mcp/session.test.js` — 16 lifecycle cases + 5 cleanup-endpoint cases (21 total after Task 3 append)
- `test/mcp/rls.test.js` — 6 migration 88 policy-shape assertions

Modified (3):
- `vercel.ts` — +1 cron entry; preserves Phase 201 schedule block
- `lib/markos/audit/writer.cjs` — AUDIT_SOURCE_DOMAINS grows from 11 → 12 (`mcp`)
- `lib/markos/audit/writer.ts` — matching entry in the typed readonly tuple
- `test/audit/hash-chain.test.js` — locked-list regression updated from 11 to 12 entries

## Decisions Made

- **Rule 3 fix for AUDIT_SOURCE_DOMAINS** — see key-decisions. Chose to widen the frozen enum rather than bypass `enqueueAuditStaging`, because Phase 201 Plan 02's threat model (T-201-02-06) explicitly documents the allowlist as the mitigation for malicious-source-domain injection. Keeping the allowlist pattern and adding `mcp` preserves that mitigation while unblocking D-12.
- **Best-effort audit emission** — `createSession` and `revokeSession` wrap `enqueueAuditStaging` in try/catch that swallows errors. Rationale: at-least-once delivery with drain-cron fill is better than blocking token issuance on a staging-table outage. Mirrors Phase 201 invites pattern.
- **`timingSafeEqual` on top of index lookup** — defense-in-depth. Partial index already narrows to a single row before comparison, but constant-time hex-byte compare eliminates residual side-channels (202-RESEARCH Pitfall 5 / T-202-01-02).
- **`create policy if not exists`** — Postgres 15+ syntax, consistent with Phase 201 migration 87. Preserves idempotency (QA-13) without DROP-then-CREATE.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Extended `AUDIT_SOURCE_DOMAINS` whitelist with 'mcp'**
- **Found during:** Task 2 (sessions.cjs lifecycle implementation)
- **Issue:** Plan requires `enqueueAuditStaging(..., source_domain: 'mcp', ...)` in `createSession` + `revokeSession`. 202-CONTEXT.md D-12 states "`source_domain='mcp'` is a new value that the audit drain + `api/tenant/audit/list.js` (F-88) already support because the enum is open". However, `lib/markos/audit/writer.cjs` enforces a **frozen 11-entry whitelist** and throws `invalid source_domain "mcp"` on emission. Without this fix, every session lifecycle transition would have thrown at runtime.
- **Fix:** Added `'mcp'` as a 12th entry to `AUDIT_SOURCE_DOMAINS` in both `writer.cjs` and the typed tuple in `writer.ts`. Updated the Phase 201 locked-list regression test (`test/audit/hash-chain.test.js`) from 11 to 12 entries and renamed its label accordingly. `Object.isFrozen` check preserved.
- **Files modified:** `lib/markos/audit/writer.cjs`, `lib/markos/audit/writer.ts`, `test/audit/hash-chain.test.js`
- **Verification:** Phase 201 audit suite regression: 7/7 green. Phase 202-01 full suite: 30/30 green.
- **Committed in:** `9e478c8`

---

**Total deviations:** 1 auto-fixed (1 Rule 3 blocking)
**Impact on plan:** Essential for correctness — MCP session lifecycle cannot emit audits without the enum extension. No scope creep; the threat-model mitigation pattern (allowlist validation to defeat source_domain injection) is preserved.

## Issues Encountered

- **`supabase/.temp/cli-latest` was pre-modified** in working tree (pre-existing dirty file from prior operations). Left untouched — outside this plan's scope.
- **TypeScript dual-export stub style** — chose named `export const` binding to `require('./sessions.cjs')` fields with typed casts, rather than the bare `module.exports = require('./sessions.cjs');` in the PLAN example. Rationale: matches the Phase 201 `lib/markos/tenant/invites.ts` convention (which uses named exports), and the `grep "require('./sessions.cjs')" lib/markos/mcp/sessions.ts` acceptance criterion still matches (1 match).

## User Setup Required

None — this plan is server-side schema + library + cron. Environment variable `MARKOS_MCP_CRON_SECRET` MUST be set in Vercel before the `/api/mcp/session/cleanup` cron runs successfully; documented for the Phase 202 operator checklist but not a blocking prerequisite (cron will log 401 and skip until configured, which is the desired fail-closed behaviour).

## Threat Flags

None. Every new trust boundary (cron endpoint, session lookup, cost-window RPC) has an entry in the plan's `<threat_model>` with an explicit mitigation.

## Next Phase Readiness

- **202-02 (OAuth 2.1 + PKCE):** `createSession` is ready to be called from the `POST /oauth/token` handler. The consent-page UI passes `{ user_id, tenant_id, org_id, client_id, scopes, plan_tier }` and receives `{ opaque_token, expires_at }` for the token response.
- **202-03 (cost-meter + rate-limit):** `check_and_charge_mcp_budget(tenant_id, charge_cents, cap_cents)` is live and atomic. Parallel-committed in commit `51af0c3` by a separate executor — that plan's `lib/markos/mcp/cost-meter.cjs` wraps this RPC.
- **202-04 (tool pipeline + per-call audit):** `source_domain='mcp'` is now valid for `action='tool.invoked'`, `action='tool.error'`, `action='tool.output_schema_violation'`.
- **202-05 (tenant-scoped tool dispatch):** `lookupSession` returns `tenant_id` on every call; dispatcher can `session.tenant_id === request.tenant_id` gate with no further plumbing.
- **202-06 (/settings/mcp UI):** `listSessionsForTenant` + `listSessionsForUser` provide the "active sessions" rows, and `revokeSession` is the backend for the revoke CTA. No token_hash ever reaches the UI layer.

## Self-Check: PASSED

Created files verified on disk:
- `FOUND: supabase/migrations/88_markos_mcp_sessions.sql`
- `FOUND: supabase/migrations/rollback/88_markos_mcp_sessions.down.sql`
- `FOUND: supabase/migrations/89_markos_mcp_cost_window.sql`
- `FOUND: supabase/migrations/rollback/89_markos_mcp_cost_window.down.sql`
- `FOUND: lib/markos/mcp/sessions.cjs`
- `FOUND: lib/markos/mcp/sessions.ts`
- `FOUND: api/mcp/session/cleanup.js`
- `FOUND: test/mcp/session.test.js`
- `FOUND: test/mcp/rls.test.js`
- `FOUND: test/mcp/migration-idempotency.test.js`

Commits verified in git log:
- `FOUND: b7ab22e` (Task 1 migrations)
- `FOUND: 9e478c8` (Rule 3 AUDIT_SOURCE_DOMAINS)
- `FOUND: 118f559` (Task 2 sessions.cjs + suites)
- `FOUND: 77e8d10` (Task 3 cleanup cron + vercel.ts)

Test suites green at time of self-check:
- `test/mcp/migration-idempotency.test.js` — 4/4
- `test/mcp/session.test.js` — 21/21
- `test/mcp/rls.test.js` — 6/6
- `test/audit/hash-chain.test.js` — 7/7 (regression)
- `test/tenancy/invites.test.js` + `test/tenancy/lifecycle.test.js` — 18/18 (regression)

---
*Phase: 202-mcp-server-ga-claude-marketplace*
*Plan: 01*
*Completed: 2026-04-18*
