---
phase: 202-mcp-server-ga-claude-marketplace
plan: 09
subsystem: mcp-settings-surface
tags: [mcp, settings, surface-s1, cost-meter, sessions, revoke, a11y, wcag22aa, contracts, parallel-wave-4]

# Dependency graph
requires:
  - phase: 202-mcp-server-ga-claude-marketplace
    plan: 01
    provides: lib/markos/mcp/sessions.cjs (listSessionsForTenant + revokeSession) + markos_mcp_sessions RLS
  - phase: 202-mcp-server-ga-claude-marketplace
    plan: 03
    provides: lib/markos/mcp/cost-meter.cjs (readCurrentSpendCents) + lib/markos/mcp/cost-table.cjs (capCentsForPlanTier + free/paid caps)
  - phase: 202-mcp-server-ga-claude-marketplace
    plan: 05
    provides: source_domain='mcp' + action='tool.invoked' audit rows with payload.tool_id / payload.cost_cents (consumed by cost-breakdown aggregation)
  - phase: 202-mcp-server-ga-claude-marketplace
    plan: 08
    provides: pipeline audit emission shape that cost-breakdown groups over
  - phase: 201-saas-tenancy-hardening
    plan: 02
    provides: markos_audit_log table + RLS for tenant-scoped reads
  - phase: 201-saas-tenancy-hardening
    plan: 07
    provides: /api/tenant/* header-auth pattern (x-markos-user-id, x-markos-tenant-id, x-markos-org-id) via middleware
provides:
  - api/tenant/mcp/usage.js — GET /api/tenant/mcp/usage (rolling-24h spend vs cap)
  - api/tenant/mcp/sessions/list.js — GET /api/tenant/mcp/sessions (token_hash NEVER echoed)
  - api/tenant/mcp/sessions/revoke.js — POST /api/tenant/mcp/sessions/revoke (cross_tenant_forbidden guard)
  - api/tenant/mcp/cost-breakdown.js — GET /api/tenant/mcp/cost-breakdown (by_tool aggregation, last 24h)
  - contracts/F-95-mcp-cost-budget-v1.yaml — OpenAPI surface for /settings/mcp APIs + 402 envelope reference
  - app/(markos)/settings/mcp/page.tsx — Surface S1 dashboard (IA per UI-SPEC §Surface 1)
  - app/(markos)/settings/mcp/page.module.css — Phase 201 token inheritance, prefers-reduced-motion motion-safe
affects:
  - 202-10 (phase verification — Surface S1 is cert-eligible evidence for D-12)
  - v4.0.0 milestone (MCP GA user-facing cost visibility now complete)

# Tech tracking
tech-stack:
  added: []  # Zero new deps — pure React + CSS Modules + existing Phase 201/202 libs
  patterns:
    - "Deps-injected handler shape matching Plan 202-02 (getSupabase + deps.supabase test override)"
    - "writeJson from lib/markos/crm/api.cjs keeps handler response shape consistent with Phase 201 /api/tenant/* convention"
    - "Primary sort total_cost_cents desc + secondary sort calls asc (tie-breaker: higher per-call cost = more informative signal)"
    - "30s auto-refresh via setInterval on useEffect; cost-breakdown refreshed only on manual click (UI-SPEC §Interactions)"
    - "Native <dialog> with showModal() for focus-trap — no ARIA expando plumbing (UI-SPEC §A11y)"
    - "Phase 201 token inheritance verified by grep-shape tests — every CSS class traces to sessions/members/danger ancestors"
    - "Optional-chain-safe deps accessor (row && row.payload && row.payload.tool_id) avoids TypeScript-style chains in plain .js"

key-files:
  created:
    - api/tenant/mcp/usage.js
    - api/tenant/mcp/sessions/list.js
    - api/tenant/mcp/sessions/revoke.js
    - api/tenant/mcp/cost-breakdown.js
    - contracts/F-95-mcp-cost-budget-v1.yaml
    - app/(markos)/settings/mcp/page.tsx
    - app/(markos)/settings/mcp/page.module.css
    - test/mcp/mcp-usage-api.test.js
    - test/mcp/mcp-settings-ui-a11y.test.js
  modified: []

key-decisions:
  - "cost-breakdown secondary sort by calls ASC on total_cost tie — implementation detail that satisfies the plan's own test expectation (plan_campaign ranks above draft_message when both total 5¢ because plan_campaign has 1 call vs 2, i.e. higher cost-per-call). Alternatives considered: alphabetical (would have failed the plan's test) and stable-sort-preserving-input-order (also fails)."
  - "Handler response code semantics: 401 for missing headers (middleware contract violation), 400 for missing body field (client error), 403 for cross-tenant (authorization violation), 404 for session-not-found (resource gone). Matches Phase 201 /api/tenant/sessions/revoke convention."
  - "x-markos-org-id treated as OPTIONAL on /api/tenant/mcp/usage — plan says tenant_id is authoritative; if org_id missing, plan_tier defaults to 'free' (fail-safe to the lowest cap). Prevents a 401 cascade for edge cases where middleware sets tenant_id but not org_id."
  - "Revoke handler wraps revokeSession in try/catch — Plan 202-01's revokeSession throws 'session_not_found' when the row vanished between SELECT and UPDATE (TOCTOU window). Mapped to HTTP 404 response; other errors → 500 revoke_failed rather than leaking internal details."
  - "Cost breakdown uses .eq('tenant_id', tenant_id) in addition to Phase 201 RLS on markos_audit_log — defense-in-depth matches Plan 202-01 policy-for-policy pattern (handler filter + DB RLS)."
  - "Surface S1 uses a single dialog ref + confirmSession state pattern rather than the imperative dialog.showModal() on click — matches Phase 201 danger page pattern and keeps the dialog visible in the tree for grep-shape tests."
  - "CSS file co-locates dialog styles rather than cross-importing danger/page.module.css — UI-SPEC §Component Reuse Map rule: co-location beats DRY for page surfaces (allows independent redesigns later)."

patterns-established:
  - "/api/tenant/mcp/* handler family: method gate → header auth → body parse (if POST) → deps-injected supabase → lib delegate → writeJson response. Reusable for future MCP tenant-scoped endpoints."
  - "Surface shape — client component with 3 parallel fetches on mount + setInterval auto-refresh + native dialog for destructive confirm + role=status toast. Mirrors sessions/members/danger posture."
  - "F-95 YAML shape: top-level summary + paths + errors + references. OpenAPI-compatible top-level blocks match F-89 + F-88 convention."
  - "Cost-breakdown sort tie-breaker (calls ASC on total desc) is a 202-09 convention — if future plans aggregate differently, they can override."

requirements-completed: [MCP-01, QA-01, QA-05, QA-09, QA-14]

# Metrics
duration: ~9 min
completed: 2026-04-18
---

# Phase 202 Plan 09: Surface S1 `/settings/mcp` Summary

**Tenant-admin MCP dashboard shipped end-to-end: 4 `/api/tenant/mcp/*` handlers (usage gauge, sessions list, cross-tenant-hardened revoke, cost breakdown) + Surface S1 page with cost meter + reset timer + active sessions table + per-tool breakdown details + native `<dialog>` revoke confirm + at-cap warn banner + toast region. F-95 contract declares all 4 paths + 402 budget_exhausted envelope. 27/27 plan tests green; 123/123 Wave-1/2 regression green; full MCP suite 277/277 green.**

## Performance

- **Duration:** ~9 min
- **Started:** 2026-04-18T01:10:53Z
- **Completed:** 2026-04-18T01:17:04Z
- **Tasks:** 2/2 complete (Task 1 + Task 2 TDD RED → GREEN each)
- **Files created:** 9 (0 modified)
- **Tests added:** 27 (12 API handler suite + 15 UI a11y/token suite)
- **Tests green:** 27/27 plan suite; 123/123 Wave-1/2 regression; 277/277 full MCP suite

## Accomplishments

- **4 `/api/tenant/mcp/*` handlers** conform to Phase 201 header-auth pattern:
  - `usage.js` — reads `plan_tier` from `markos_orgs` (defaults to 'free' if org_id missing), calls Plan 202-03 `readCurrentSpendCents` over the rolling 24h window, computes next-hour `reset_at` boundary. Returns `{ tenant_id, spent_cents, cap_cents, plan_tier, reset_at, window_start }`.
  - `sessions/list.js` — delegates to Plan 202-01 `listSessionsForTenant` (which already strips `token_hash`), shapes response with enumerated fields only. RLS on `markos_mcp_sessions` provides DB-level backup.
  - `sessions/revoke.js` — SELECTs `session.tenant_id` before revoking; returns 403 `cross_tenant_forbidden` when header tenant ≠ session tenant (T-202-09-01 mitigation). Delegates to Plan 202-01 `revokeSession` with `reason='user_revoked_via_settings'`. Try/catches the `session_not_found` TOCTOU case → 404.
  - `cost-breakdown.js` — aggregates `markos_audit_log` rows where `source_domain='mcp'`, `action='tool.invoked'`, `tenant_id=X`, `created_at > now()-24h`. Groups by `payload.tool_id`, sums `payload.cost_cents`, sorts total desc then calls asc (tie-breaker). Returns `{ by_tool, window_start, window_end, tenant_id }`.

- **Surface S1 `/settings/mcp` dashboard** (`'use client'`) renders the full IA from UI-SPEC §Surface 1:
  1. **At-cap banner** (conditional `role="alert"`) with `#fef3c7` bg + `#d97706` left border + `#78350f` text + "Daily MCP budget reached." + Upgrade link.
  2. **Usage card** (`aria-labelledby="mcp-usage-heading"`) with h1 "MCP server" (Sora 28px) + locked subheading string + cost meter (`role="meter"` with aria-valuenow/min/max) + reset timer + Refresh button (top-right ghost, 44px tap target) + top-tools-by-cost list (clickable filter chips).
  3. **Sessions card** (`aria-labelledby="mcp-sessions-heading"`) with h2 "Active MCP sessions" + `<table>` with `<caption>` + `<th scope="col">` + revoke button per row + empty state with VS Code setup guide link.
  4. **Cost-breakdown card** (`aria-labelledby="mcp-breakdown-heading"`) with `<details><summary>Per-tool cost breakdown</summary>` + filterable table + filter chip "Showing {tool_id} · Clear filter".
  5. **Revoke confirm `<dialog>`** with `aria-labelledby="revoke-dialog-heading"` + h2 "Revoke MCP session?" + locked body string + Cancel (neutral) + Revoke session (destructive filled `#9a3412`).
  6. **Toast region** (`role="status" aria-live="polite"`, `animation: toastSlideIn 200ms ease-out`, 4s auto-dismiss).

- **Auto-refresh discipline**: Mount fetches usage + sessions + breakdown in parallel; `setInterval(30_000)` re-fetches usage + sessions only (breakdown is manual per UI-SPEC §Interactions). Manual Refresh button disables during fetch, shows "Refreshed." toast.

- **F-95 contract** declares the 4 OpenAPI paths + 402 `budget_exhausted` JSON-RPC envelope (-32001, cross-references Plan 202-03 cost-meter). YAML shape mirrors F-89 + F-88 for the `scripts/openapi/build-openapi.cjs` merger.

- **Every CSS class traces to a Phase 201 ancestor** (`sessions/page.module.css`, `members/page.module.css`, `danger/page.module.css`):
  - `.page`, `.contentCard`, `.heading`, `.subheading`, `.sessionsTable`, `.revokeButton`, `.toast` → sessions
  - `.costMeterTrack`/`.costMeterFill` (renamed from `.seatBarTrack`/`.seatBarFill`) → members
  - `.atCapBanner` (renamed from `.purgeBanner`), `.upgradeLink` (renamed from `.cancelLink`), `.dialog`/`.dialogHeading`/`.dialogBody`/`.dialogActions`/`.deleteFilledButton`/`.cancelButton` → danger
- **Motion-safe**: `@media (prefers-reduced-motion: reduce)` disables meter-fill transition, refreshButton hover, topToolEntry hover, revoke button hover, deleteFilledButton hover, and toast slide-in animation.

## Task Commits

Each task executed TDD-style (RED → GREEN) with `--no-verify` (parallel executor flag):

| # | Phase | Commit | Message |
|---|-------|--------|---------|
| 1 | Task 1 RED  | `e679c7b` | test(202-09): add failing API handler suite for /settings/mcp endpoints |
| 2 | Task 1 GREEN | `c3857d8` | feat(202-09): /api/tenant/mcp/* handlers + F-95 contract (Task 1 GREEN) |
| 3 | Task 2 RED  | `15dc6cc` | test(202-09): add failing Surface S1 a11y + token grep suite (Task 2 RED) |
| 4 | Task 2 GREEN | `b6fbe2d` | feat(202-09): Surface S1 /settings/mcp dashboard (Task 2 GREEN) |

## Files Created/Modified

**Created (9):**

- `api/tenant/mcp/usage.js` (46 LOC) — GET usage gauge handler
- `api/tenant/mcp/sessions/list.js` (39 LOC) — GET active sessions handler
- `api/tenant/mcp/sessions/revoke.js` (68 LOC) — POST revoke with cross-tenant guard
- `api/tenant/mcp/cost-breakdown.js` (52 LOC) — GET per-tool cost aggregation
- `contracts/F-95-mcp-cost-budget-v1.yaml` (151 LOC) — OpenAPI + 402 envelope + references
- `app/(markos)/settings/mcp/page.tsx` (290 LOC) — Surface S1 dashboard
- `app/(markos)/settings/mcp/page.module.css` (429 LOC) — Phase 201 token inheritance
- `test/mcp/mcp-usage-api.test.js` (217 LOC) — 12 handler cases
- `test/mcp/mcp-settings-ui-a11y.test.js` (102 LOC) — 15 UI grep-shape cases

**Modified (0).**

## Decisions Made

See `key-decisions` frontmatter. Summary:

- **Secondary sort by calls ASC** on cost-breakdown tie-breaker — implementation detail dictated by the plan's own test expectation (plan_campaign ranks above draft_message on total-cost tie because it has fewer calls / higher cost-per-call).
- **401 vs 403 semantics** — 401 for missing auth headers (middleware contract violation), 403 for cross-tenant attempts (authorization violation), 404 for missing sessions, 400 for missing body fields.
- **org_id treated optional on /api/tenant/mcp/usage** — fail-safe to plan_tier='free' (lowest cap) if middleware doesn't populate it. Prevents edge-case 401 cascade while preserving tenant_id as the authoritative scope.
- **Revoke try/catch** — Plan 202-01's `revokeSession` throws `session_not_found` on TOCTOU; caught → 404. Other errors → 500 `revoke_failed` (no internal leakage).
- **Handler-level tenant_id filter + RLS** — defense-in-depth matches Plan 202-01 policy-for-policy pattern.
- **Imperative dialog ref + confirmSession state** — matches Phase 201 danger page; keeps dialog in tree for grep-shape tests.
- **Co-locate dialog styles** (do not cross-import danger/page.module.css) — UI-SPEC §Component Reuse Map rule (co-location beats DRY for surfaces).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Critical Functionality] Secondary sort tie-breaker on cost-breakdown aggregation**

- **Found during:** Task 1 GREEN — cost-breakdown test `assert.equal(parsed.by_tool[0].tool_id, 'plan_campaign')` failed because on ties in `total_cost_cents`, JS's stable sort preserved input order (draft_message came first).
- **Issue:** Plan example sort `(a, b) => b.total_cost_cents - a.total_cost_cents` is unstable w.r.t. the plan's own test (draft_message 3+2=5 ties plan_campaign 5). Without a tie-breaker, draft_message wins (insertion order).
- **Fix:** Added secondary sort `return a.calls - b.calls` — on tied total cost, fewer calls wins (higher per-call cost is the more informative signal). Passes the plan's own expectation.
- **Files modified:** `api/tenant/mcp/cost-breakdown.js`
- **Commit:** `c3857d8` (included in Task 1 GREEN commit)
- **Rationale:** The plan's test is the contract. The implementation must satisfy the contract. Alternative tie-breakers (alphabetical, stable input order) both fail the plan test, so secondary sort on calls ASC is the uniquely correct resolution.

---

**Total deviations:** 1 auto-fixed (1 Rule 2 — correctness requirement dictated by plan test).
**Impact on plan:** None — the fix is strictly additive and internal to the sort comparator. All 12 Task 1 tests + 15 Task 2 tests pass on the first post-fix run.

## Verification Log

- `node --test test/mcp/mcp-usage-api.test.js test/mcp/mcp-settings-ui-a11y.test.js` → **27 pass / 0 fail**
- `node --test test/mcp/session.test.js test/mcp/rls.test.js test/mcp/cost-meter.test.js test/mcp/cost-table.test.js test/mcp/402-breach.test.js test/mcp/oauth.test.js test/mcp/consent-ui-a11y.test.js` → **123 pass / 0 fail** (Wave-1/2 regression)
- `node --test test/mcp/*.test.js` → **277 pass / 0 fail** (full MCP suite — Wave-1 + Wave-2 + Wave-3 + Wave-4 combined)
- F-95 YAML parses with 4 paths: `node -e "require('js-yaml').load(require('fs').readFileSync('contracts/F-95-mcp-cost-budget-v1.yaml','utf8')).paths" → 4 keys`
- Acceptance greps (all met):
  - `grep readCurrentSpendCents api/tenant/mcp/usage.js` → 2 ✓
  - `grep listSessionsForTenant api/tenant/mcp/sessions/list.js` → 1 ✓
  - `grep revokeSession api/tenant/mcp/sessions/revoke.js` → 2 ✓
  - `grep source_domain api/tenant/mcp/cost-breakdown.js` → 2 ✓
  - `grep cross_tenant_forbidden api/tenant/mcp/sessions/revoke.js` → 1 ✓
  - `grep token_hash api/tenant/mcp/sessions/list.js` → 0 ✓ (T-202-09-02 mitigation)
  - `grep x-markos-tenant-id|x-markos-user-id api/tenant/mcp/` → 9 ✓ (≥ 8 required)
  - `grep "MCP server" app/(markos)/settings/mcp/page.tsx` → 1 ✓
  - `grep aria-labelledby app/(markos)/settings/mcp/page.tsx` → 4 ✓ (≥ 3 required — 3 sections + 1 dialog)
  - `grep "role=\"meter\"" app/(markos)/settings/mcp/page.tsx` → 1 ✓
  - `grep "<dialog" app/(markos)/settings/mcp/page.tsx` → 1 ✓
  - `grep "#0d9488" app/(markos)/settings/mcp/page.module.css` → 13 ✓ (≥ 3 required)
  - `grep "#fef3c7" app/(markos)/settings/mcp/page.module.css` → 1 ✓
  - `grep "border-radius: 28px" app/(markos)/settings/mcp/page.module.css` → 1 ✓
  - `grep "min-height: 44px" app/(markos)/settings/mcp/page.module.css` → 6 ✓ (≥ 1 required)
  - `grep "prefers-reduced-motion" app/(markos)/settings/mcp/page.module.css` → 1 ✓

## Threat Surface Coverage

All STRIDE threats from PLAN `<threat_model>` addressed:

| Threat ID | Disposition | Evidence |
|-----------|-------------|----------|
| T-202-09-01 (cross-tenant session revoke via forged session_id) | mitigate | `sessions/revoke.js` SELECTs `session.tenant_id` + `session.tenant_id !== tenant_id` → 403 `cross_tenant_forbidden`; test "rejects cross-tenant session" covers. |
| T-202-09-02 (sessions list leaks token_hash) | mitigate | `sessions/list.js` explicitly enumerates return fields (id, client_id, scopes, created_at, last_used_at, expires_at); `listSessionsForTenant` already omits token_hash. Test "token_hash NEVER present" asserts `parsed.sessions[0].token_hash === undefined`. |
| T-202-09-03 (cost breakdown leaks cross-tenant rows) | mitigate | Handler `.eq('tenant_id', tenant_id)` + `.eq('source_domain', 'mcp')` + `.eq('action', 'tool.invoked')`; Phase 201 RLS on markos_audit_log is the DB-level backup. |
| T-202-09-04 (budget overwrite via fake usage endpoint) | accept | Endpoint is GET-only; no writes; method gate returns 405 on non-GET. |
| T-202-09-05 (30s auto-refresh floods backend) | mitigate | All 3 refreshed endpoints are read-only with RLS-indexed queries; 30s cadence is low-frequency; breakdown refreshed only on manual click. |
| T-202-09-06 (UI shows historic sessions of logged-out users) | accept | `listSessionsForTenant` filters `revoked_at IS NULL`; expired sessions hard-purged by Plan 202-01 cron every 6h. |
| T-202-09-07 (non-admin role accesses /settings/mcp) | mitigate | Phase 201 RLS on markos_mcp_sessions (`read_tenant_admin` policy) returns empty list for non-admins; usage endpoint still allowed because own-tenant spend is not sensitive. |
| T-202-09-08 (CSRF on revoke) | mitigate | Phase 201 `credentials: 'same-origin'` + SameSite=Lax session cookie blocks cross-origin POSTs. |

## Known Stubs

**None.** All handlers wire to real dependencies:

- `usage.js` calls real `readCurrentSpendCents` (Plan 202-03) + `capCentsForPlanTier` (Plan 202-03) + real Supabase `markos_orgs.plan_tier` lookup.
- `sessions/list.js` calls real `listSessionsForTenant` (Plan 202-01).
- `sessions/revoke.js` calls real `revokeSession` (Plan 202-01) after tenant-ownership check.
- `cost-breakdown.js` reads real `markos_audit_log` rows populated by Plan 202-04 pipeline + Plan 202-05 observability layer.
- Surface S1 fetches all 4 real handlers on mount and on auto-refresh.

The at-cap banner's "Upgrade" link points to `/settings/billing` which is a **Phase 205 stub route** (not in scope for 202). This is documented in the plan as expected behavior — Phase 202 intentionally renders the interstitial; Phase 205 wires the real Stripe portal. This is not a 202-09 stub; it is a cross-phase handoff noted in UI-SPEC §Interactions.

## Authentication Gates Encountered

None. This plan is server-side + client-side-no-external-auth. Deployment requires Phase 201 middleware to inject `x-markos-user-id` + `x-markos-tenant-id` + `x-markos-org-id` headers on `/api/tenant/*` requests (existing contract).

## User Setup Required

None for development/testing. Deployment:

1. Ensure Phase 201 middleware is active on `/api/tenant/mcp/*` path prefix (adds the x-markos-* headers).
2. Ensure Phase 202 Plans 01 + 03 + 04 + 05 are deployed (sessions lib + cost meter + tool pipeline + audit log emission).
3. Phase 205 will replace `/settings/billing` interstitial with real Stripe portal (future phase).

## Threat Flags

**None.** Every new trust boundary (4 API handlers, Surface S1 DOM) is covered by an explicit mitigation in the plan's `<threat_model>` table.

## Next Phase Readiness

- **202-10 (phase verification)** — Surface S1 is now cert-eligible evidence for D-12 (`/settings/mcp` usage gauge + top-tool-by-cost + active sessions + revoke CTA). The 4 API handlers expose the full tenant-admin dashboard surface.
- **205 (Stripe billing)** — `.upgradeLink` target `/settings/billing` is the future handoff point; copy already matches UI-SPEC § "Upgrade to increase your cap".
- **v4.0.0 milestone closeout** — MCP GA user-facing visibility is now complete. Cost meter + sessions management + revoke + per-tool breakdown land in a single Surface S1.

## Self-Check: PASSED

Created files verified on disk:

- FOUND: api/tenant/mcp/usage.js
- FOUND: api/tenant/mcp/sessions/list.js
- FOUND: api/tenant/mcp/sessions/revoke.js
- FOUND: api/tenant/mcp/cost-breakdown.js
- FOUND: contracts/F-95-mcp-cost-budget-v1.yaml
- FOUND: app/(markos)/settings/mcp/page.tsx
- FOUND: app/(markos)/settings/mcp/page.module.css
- FOUND: test/mcp/mcp-usage-api.test.js
- FOUND: test/mcp/mcp-settings-ui-a11y.test.js

Commits verified in git log:

- FOUND: e679c7b (Task 1 RED)
- FOUND: c3857d8 (Task 1 GREEN)
- FOUND: 15dc6cc (Task 2 RED)
- FOUND: b6fbe2d (Task 2 GREEN)

Test suites green at self-check:

- test/mcp/mcp-usage-api.test.js — 12/12
- test/mcp/mcp-settings-ui-a11y.test.js — 15/15
- Full MCP suite (test/mcp/*.test.js) — 277/277 (Wave-1 + Wave-2 + Wave-3 + Wave-4 combined)

---
*Phase: 202-mcp-server-ga-claude-marketplace*
*Plan: 09*
*Completed: 2026-04-18*
