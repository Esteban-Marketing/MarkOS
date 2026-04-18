---
phase: 203
plan: 09
subsystem: webhooks
tags: [wave-5, dashboard, tenant-admin, surface-1, surface-2, F-96, ui, a11y]
dependency-graph:
  requires:
    - 203-02 (markos_webhook_fleet_metrics_v1 view + migration 72)
    - 203-03 (countDLQ for DLQ hero number + retention window)
    - 203-04 (replay endpoints — used by S2 DLQ panel)
    - 203-05 (rotate/rollback endpoints + listActiveRotations — used by S2 Settings)
    - 203-07 (PLAN_TIER_RPS + resolvePerSubRps — rate_limit decoration)
    - 203-08 (getBreakerState — breaker_state decoration via safe-require pattern)
  provides:
    - "api/tenant/webhooks/fleet-metrics.js — Surface 1 hero data source"
    - "api/tenant/webhooks/subscriptions/list.js — Surface 1 subscriptions table"
    - "api/tenant/webhooks/subscriptions/[sub_id]/index.js — Surface 2 GET detail"
    - "api/tenant/webhooks/subscriptions/[sub_id]/update.js — Surface 2 Settings save"
    - "api/tenant/webhooks/subscriptions/[sub_id]/delete.js — Surface 2 Danger-zone delete"
    - "lib/markos/webhooks/metrics.cjs + .ts — aggregateFleetMetrics + perSubMetrics"
    - "app/(markos)/settings/webhooks/page.tsx + .module.css — Surface 1"
    - "app/(markos)/settings/webhooks/[sub_id]/page.tsx + .module.css — Surface 2"
    - "contracts/F-96-webhook-dashboard-v1.yaml — 5 new dashboard paths"
  affects: [203-verify, 203-10-observability]
tech-stack:
  added: []
  patterns:
    - "Safe-require pattern for parallel Wave-5 sibling deps (getBreakerState Plan 203-08) — graceful degrade to neutral default when module not yet present"
    - "Surface 2 3-tab driven by ?tab= query string with ArrowLeft/Right + Home/End keyboard nav (ARIA Authoring Practices tabs)"
    - "View-first fleet metrics source (RESEARCH §Open Questions #3 — upgrade to materialized table only if p95 > 150ms)"
    - "Weighted latency average across view rows — multiply each bucket's mean by its delivered count so the 24h average is a true mean not mean-of-means"
    - "Soft-delete + in-flight cancel — UPDATE deliveries SET status='cancelled' + dlq_reason='subscription_deleted' WHERE status IN ('pending','retrying') before the active=false flip"
    - "Every mutator SELECTs before UPDATE + verifies tenant_id — 403 cross_tenant_forbidden is the authoritative boundary, not HTTP-layer filters"
key-files:
  created:
    - "lib/markos/webhooks/metrics.cjs"
    - "lib/markos/webhooks/metrics.ts"
    - "api/tenant/webhooks/fleet-metrics.js"
    - "api/tenant/webhooks/subscriptions/list.js"
    - "api/tenant/webhooks/subscriptions/[sub_id]/index.js"
    - "api/tenant/webhooks/subscriptions/[sub_id]/update.js"
    - "api/tenant/webhooks/subscriptions/[sub_id]/delete.js"
    - "contracts/F-96-webhook-dashboard-v1.yaml"
    - "app/(markos)/settings/webhooks/page.tsx"
    - "app/(markos)/settings/webhooks/page.module.css"
    - "app/(markos)/settings/webhooks/[sub_id]/page.tsx"
    - "app/(markos)/settings/webhooks/[sub_id]/page.module.css"
    - "test/webhooks/settings-api.test.js"
    - "test/webhooks/api-tenant.test.js"
    - "test/webhooks/ui-s1-a11y.test.js"
    - "test/webhooks/ui-s2-a11y.test.js"
    - "test/webhooks/settings-ui-a11y.test.js"
  modified:
    - "app/(markos)/layout-shell.tsx (sidebar: +MCP +Webhooks entries)"
    - "contracts/openapi.json (regenerated — 64 flows / 97 paths)"
    - "contracts/openapi.yaml"
decisions:
  - "Safe-require for getBreakerState (Plan 203-08 sibling, parallel Wave 5). Both /subscriptions list and /subscriptions/[sub_id] detail wrap `require('./breaker.cjs')` in try/catch + neutral default so wave ordering / deployment partial states never crash the dashboard. When 203-08 lands the module, decoration fires normally."
  - "Fleet-metrics view + countDLQ are separate sources (RESEARCH §Open Questions #3 + D-08 retention). The view tracks 48h delivery volume by (tenant,hour); DLQ count is a 7-day retention window. Hero banner composes them: view covers total_24h/success_rate/avg_latency_ms; countDLQ covers dlq_count."
  - "Weighted latency average — each view row carries avg_latency_ms per bucket. Summing row means directly would double-count short buckets; instead multiply each row's mean by its `delivered` count, then divide by total delivered. Zero-delivered buckets contribute nothing."
  - "update.js performs column-only SELECT (`id, tenant_id, url, events, rps_override, active`) for the cross-tenant guard — `secret` + `secret_v2` never leave the DB through this endpoint (T-203-09-02 belt-and-suspenders on top of the handler's explicit response shaping)."
  - "delete.js cancels deliveries *before* soft-deleting the subscription. Reverse order would briefly allow a dispatcher to enqueue work against an inactive subscription; delivery.cjs already rejects inactive subs but defense-in-depth dictates the cancel-first ordering."
  - "Sidebar nav: layout-shell.tsx NAV_ITEMS extended with 2 new entries (MCP + Webhooks). UI-SPEC §Surface 4 says 'add Webhooks adjacent to MCP'; the existing shell had no MCP entry, so this plan adds both. Alphabetical placement under Settings tab — matches the ordering convention set in UI-SPEC §Sidebar entry."
  - "3 203-new CSS conventions (1040px max-width / 16px nested radius / dark mono code block) each documented inline in the `.module.css` header comments AND grep-verifiable via the 3 ui test suites. No 4th new convention introduced (per UI-SPEC §Design-Token Alignment Table rule: any additional deviation is a design extension + must be flagged)."
metrics:
  duration_minutes: 17
  tasks_completed: 2
  tests_added: 57
  tests_green_in_plan: 57
  tests_green_full_webhook_suite: 352
  tests_skipped: 2
  completed_date: "2026-04-18"
requirements: [WHK-01, QA-01, QA-02, QA-03, QA-14]
---

# Phase 203 Plan 09: Webhook Tenant Dashboard (Surfaces 1 + 2) Summary

**5 new tenant APIs + 2 surface pages + F-96 contract + 57 tests — Wave 5 delivers the operational dashboard every locked decision D-01 through D-16 needed visible. Mirrors Plan 202-09 `/settings/mcp` for shape + copy rules + a11y contract; the 203 difference is the data domain (webhooks) and the additional complexity of S2's 3-tab detail page with inline expand + batch-select DLQ + rotate/rollback/delete.**

## What Shipped

### Task 1 — 5 tenant API handlers + metrics library + F-96 + 19 tests

**Metrics library — `lib/markos/webhooks/metrics.cjs` + `.ts`:**

- `aggregateFleetMetrics(client, tenant_id, now?)` reads `markos_webhook_fleet_metrics_v1` view (48h rollup), filters to last 24h + sums total/delivered + weighted-mean latency; separately fetches DLQ count via `countDLQ` (Plan 203-03); returns `{ tenant_id, total_24h, success_rate, avg_latency_ms, dlq_count, window_start, window_end }`. success_rate defaults to 100.0% on zero-deliveries (no rows = healthy); avg_latency_ms is 0 when no delivered rows.
- `perSubMetrics(client, tenant_id, subscription_id, now?)` per-subscription 24h rollup directly over `markos_webhook_deliveries` — latency from delivered rows only, last_delivery_at = max(updated_at, created_at).

**5 new tenant API handlers:**

1. `GET /api/tenant/webhooks/fleet-metrics` (`api/tenant/webhooks/fleet-metrics.js`) — S1 hero data. Header gate → aggregateFleetMetrics → JSON.
2. `GET /api/tenant/webhooks/subscriptions` (`api/tenant/webhooks/subscriptions/list.js`) — S1 subscriptions table. Tenant-scoped SELECT + decoration per row: rate_limit (via resolvePerSubRps + PLAN_TIER_RPS from Plan 203-07), breaker_state (via safe-require pattern paired with Plan 203-08), last_delivery_at + success_rate (via perSubMetrics), status_chip derived from breaker state (Healthy/Half-open/Tripped). Secret columns never echoed (T-203-09-02).
3. `GET /api/tenant/webhooks/subscriptions/{sub_id}` (`[sub_id]/index.js`) — S2 detail. Cross-tenant guard (SELECT→403), last-100 deliveries (desc), dlq_count via countDLQ, rate_limit, breaker_state, rotation (listActiveRotations filter to this sub + computeStage), metrics aggregate.
4. `POST /api/tenant/webhooks/subscriptions/{sub_id}/update` (`[sub_id]/update.js`) — S2 Settings save. Cross-tenant guard + SSRF re-check on URL change (T-203-09-03) + rps_override ceiling check (T-203-09-04) + audit emit (T-203-09-06 — source_domain='webhooks', action='subscription.updated'). Error envelopes: private_ip / https_required / invalid_scheme / invalid_url / invalid_events / invalid_rps_override / rps_override_exceeds_plan (echoes ceiling).
5. `POST /api/tenant/webhooks/subscriptions/{sub_id}/delete` (`[sub_id]/delete.js`) — S2 Danger-zone. Cross-tenant guard; cancels in-flight deliveries (UPDATE deliveries SET status='cancelled' + dlq_reason='subscription_deleted' WHERE status IN ('pending','retrying')); soft-deletes subscription (active=false); audit emit (action='subscription.deleted').

**F-96 contract** — `contracts/F-96-webhook-dashboard-v1.yaml`:
- 5 paths with full request/response schemas + parameters + status-code envelopes.
- 4 declared error codes: cross_tenant_forbidden (403), subscription_not_found (404), private_ip (400), rps_override_exceeds_plan (400 + ceiling echoed).
- `components/schemas`: RateLimitState + BreakerState (re-declared here for self-containment; canonical lives in F-100).
- References: D-01 through D-16, F-72, F-73, F-97, F-98, F-100.

**OpenAPI regenerated** — `contracts/openapi.{json,yaml}`: 64 F-NN flows / 97 paths (up from 62/91 at Plan 203-07 close; +F-96 5 paths, +F-99 1 path via sibling Plan 203-10).

**Task 1 tests (19 green):**
- `test/webhooks/settings-api.test.js` — 7 cases: 1a (401) + 1a (405) + 1b (happy fleet-metrics shape) + 1c (tenant-scope filter captured) + 1d (list decoration) + 1d (401) + F-96 shape.
- `test/webhooks/api-tenant.test.js` — 12 cases: 1e (detail happy path) + 1e (401) + 1e (404) + 1f (cross-tenant 403) + 1g (update happy) + 1h (rps_override > ceiling 400 + echoes ceiling) + 1i (private-IP URL 400) + 1j (delete cross-tenant 403) + 1k (delete happy path cancels + deactivates) + 1k (401) + 1k (404) + 1l (F-96 YAML shape).

### Task 2 — Surfaces 1 + 2 pages + CSS modules + 38 a11y tests

**Surface 1 `app/(markos)/settings/webhooks/page.tsx` + `.module.css`:**

- `'use client'` client component; `useState` for metrics + subscriptions + loading + create dialog + test-fire busy + toast.
- `useEffect` on mount: parallel fetch `/fleet-metrics` + `/subscriptions`. 30s `setInterval` re-fetch (mirrors 202-09 cadence).
- Hero fleet card (`<section aria-labelledby="webhooks-hero-heading">`): 4 `.heroCard` children rendering total_24h / `{success_rate}%` / `{avg_latency}ms` / dlq_count. `data-variant="success"` on success-rate numeral ≥ 99.9%; `data-variant="dlq-alert"` on DLQ > 0 (destructive color).
- Subscriptions card (`<section aria-labelledby="webhooks-subs-heading">`): `<table>` with `<caption>` "Active webhook subscriptions", 6 cols (URL · Events · Status · Last delivery · Success rate · Actions). URL cell is `<a>` → `/settings/webhooks/{sub_id}`; event chip cluster with overflow ("+N more"); status chip with 3 data-variants ("Healthy"/"Half-open"/"Tripped"); success-rate mini-bar `role="meter"` with aria-valuenow = pct*10; Test fire button with "Firing…" busy state + toast.
- Create dialog: native `<dialog>` with form (Endpoint URL + Events + RPS override); HTTPS + Private-IP client hints; field error rendered via `role="alert"` on submit failure.
- Toast region: fixed bottom-right, `role="status" aria-live="polite"`.
- CSS tokens: `#0d9488` (accent) ≥ 3 uses, `#0f766e` (dark teal), `#fef3c7` (warn), `#fef2f2` (error), `border-radius: 28px` (top card), `border-radius: 12px` (buttons), `outline: 2px solid #0d9488` (focus ring), `min-height: 44px` (tap target, 3+ uses), `@media (prefers-reduced-motion: reduce)` (motion kill switch), `max-width: 1040px` (203-new convention #1 — 6-col table needs width).

**Surface 2 `app/(markos)/settings/webhooks/[sub_id]/page.tsx` + `.module.css`:**

- Breadcrumb card: `<nav>` with "Webhooks" link + current URL mono truncated; h1 = subscription URL (mono); chip row with breaker chip + `{N} rps · {Plan}` chip.
- Tab bar `<nav role="tablist" aria-label="Subscription detail sections">` with 3 `<button role="tab" aria-selected aria-controls>`; keyboard `ArrowLeft`/`ArrowRight`/`Home`/`End` switch tabs; `?tab=` query param drives deep-link state.
- **Deliveries panel** (default): filter row (Status select + time range chips) + `<table>` with expand chevron column. Row click toggles `aria-expanded` on a `<button>` in the trailing `<td>` (not the row itself — a11y preserving); expanded row renders under a single `<tr>` with `<td colSpan={6}>` containing `<pre><code>` Request + Response + Error blocks, plus `.singleReplayButton` + `.copyCurlLink`.
- **DLQ panel**: intro "7-day replay window…", sticky `.batchActionBar` with Select all checkbox (aria-checked=mixed on partial selection) + `Replay ({N})` primary filled button (disabled when 0 selected); table with per-row replay + delete.
- **Settings panel**: form with Endpoint (URL + events) + Rate limit (plan default display + override input) + Signing secret `.secretPanel` (mono masked preview `x-markos-signature-v1=••••••••abc12345`; Rotate button OR `.graceStatusPanel` during rotation with dual-sig preview + Rollback); Danger zone `.dangerCard` + Delete subscription; Save changes button (disabled until dirty).
- 5 native `<dialog>`s: rotate, rollback, delete, row replay, batch replay. Each `aria-labelledby` on the h2; body copy verbatim per UI-SPEC.
- CSS tokens — 3 203-new conventions all present + grep-verified:
  - `max-width: 1040px` (#1)
  - `border-radius: 16px` on `.secretPanel` + `.dangerCard` (#2)
  - `.codeBlock { background: #0f172a; color: #e2e8f0; … }` (#3 dark mono)

**Sidebar entry** — `app/(markos)/layout-shell.tsx` NAV_ITEMS extended with `{ href: "/settings/mcp", label: "MCP" }` + `{ href: "/settings/webhooks", label: "Webhooks" }` adjacent entries. The existing Settings nav in workspace shell had no MCP entry; this plan adds both because UI-SPEC §Surface 4 requires "Webhooks adjacent to MCP".

**Task 2 tests (38 green):**
- `test/webhooks/ui-s1-a11y.test.js` — 14 cases (S1 copy + a11y markers + CSS tokens).
- `test/webhooks/ui-s2-a11y.test.js` — 14 cases (S2 copy + tablist semantics + ≥ 4 `<dialog>`s + `<pre>`/`<code>` blocks + CSS tokens + 3 203-new conventions).
- `test/webhooks/settings-ui-a11y.test.js` — 10 cases (sidebar carries Webhooks + MCP entries + both modules have matching token set + 3 203-new conventions present in S2).

## Tests

| Suite                                      | File                                       | Tests | Status |
| ------------------------------------------ | ------------------------------------------ | ----- | ------ |
| Settings APIs (fleet + list)               | `test/webhooks/settings-api.test.js`       | 7     | green  |
| Tenant APIs (detail + update + delete + F-96) | `test/webhooks/api-tenant.test.js`         | 12    | green  |
| Surface 1 a11y + grep                      | `test/webhooks/ui-s1-a11y.test.js`         | 14    | green  |
| Surface 2 a11y + grep                      | `test/webhooks/ui-s2-a11y.test.js`         | 14    | green  |
| Sidebar + token consolidation              | `test/webhooks/settings-ui-a11y.test.js`   | 10    | green  |
| **Plan-level total**                       |                                            | **57**| **green** |
| Full webhook regression                    | `test/webhooks/*.test.js`                  | 352 + 2 skip | green  |

## Performance

- **Started:** 2026-04-18T07:34:49Z
- **Completed:** 2026-04-18T12:51:47Z (agent wall-clock within session ~17 min)
- **Duration:** ~17 min
- **Tasks:** 2
- **Files created:** 17
- **Files modified:** 3 (layout-shell.tsx + openapi.json + openapi.yaml)

| Metric                       | Before | After | Delta                   |
| ---------------------------- | ------ | ----- | ----------------------- |
| F-NN flows                   | 62     | 64    | +2 (F-96 + F-99 sibling)|
| openapi paths                | 91     | 97    | +6 (5 F-96 + 1 F-99)    |
| webhook tests (pass+skip)    | 227+2  | 352+2 | +125 (net; siblings too)|
| Tenant admin surfaces shipped| 0/2    | 2/2   | +2 (S1+S2)              |
| Dashboard API endpoints      | 4      | 9     | +5 (fleet-metrics + list + detail + update + delete) |

## Task Commits

1. **Task 1** — 5 tenant dashboard APIs + metrics library + F-96 contract + 19 tests. Sibling Wave-5 agent (203-10) collected these files into its own commit during parallel execution (`df60b46`). Files are in the tree; substance is intact.
2. **Task 2** — Surfaces 1 + 2 pages + CSS modules + sidebar + 38 a11y tests — **`00289d9`**.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocking] Safe-require for getBreakerState (Plan 203-08 parallel sibling)**

- **Found during:** Task 1 Implementation (writing subscriptions/list.js + subscriptions/[sub_id]/index.js).
- **Issue:** Plan 203-09 depends on `getBreakerState` from `lib/markos/webhooks/breaker.cjs` (Plan 203-08). When this plan started, 203-08 had not yet landed; a direct `require('./breaker.cjs')` would have crashed the endpoint on module-load for anyone running tests or local dev before the parallel wave completed.
- **Fix:** Safe-require pattern with try/catch + neutral default `{ state: 'closed', trips: 0, probe_at: null, opened_at: null }`. When 203-08 lands, decoration fires normally; before it, the dashboard renders all subscriptions as "Healthy" (closed) — which is the correct fallback disposition (no breaker signal available ≠ broken).
- **Files modified:** `api/tenant/webhooks/subscriptions/list.js`, `api/tenant/webhooks/subscriptions/[sub_id]/index.js`.
- **Verification:** Plan 203-08 committed `432e319` (breaker.cjs) + `7dba7af` (dispatch-gates integration) *after* this plan's handlers. Both modules now resolve `getBreakerState` via the normal require path; the safe-require remains as defense-in-depth for partial rollouts.

**2. [Rule 2 — Missing Critical] Sidebar MCP entry added alongside Webhooks**

- **Found during:** Task 2 Implementation.
- **Issue:** UI-SPEC §Sidebar entry instructs to add "Webhooks" adjacent to the existing "MCP" link. Inspection of `app/(markos)/layout-shell.tsx` showed no MCP nav entry — Phase 202 Plan 09 shipped `/settings/mcp` but never added it to the workspace shell nav. Shipping only "Webhooks" would violate the adjacency rule AND leave MCP dashboards undiscoverable.
- **Fix:** Extended NAV_ITEMS with BOTH `/settings/mcp` ("MCP") + `/settings/webhooks` ("Webhooks"). This also corrects a Phase 202 gap discovered via Rule 2 (missing critical nav entry for a shipped surface) — scoped to the single file and <5 lines.
- **Files modified:** `app/(markos)/layout-shell.tsx`.

**3. [Rule 1 — Bug] Detail-test 3-call Supabase mock mis-shaped**

- **Found during:** Task 1 first test run (19/20 pass — detail happy path failed with `expected: 5, actual: 0` on dlq_count).
- **Issue:** The detail handler makes 3 reads against `markos_webhook_deliveries` — list (with `.limit()`), countDLQ (with `head:true`), perSubMetrics (plain). Initial mock used a simple `called++` counter that returned `count: 5` on the second call, but the actual call order is list → metrics → countDLQ, not list → countDLQ → metrics.
- **Fix:** Rewrote the mock's deliveries-table handler to differentiate by chain shape (did `.limit()` fire? is `opts.head === true`? neither → metrics list). Handler code unchanged; only the test double was wrong.
- **Files modified:** `test/webhooks/api-tenant.test.js`.
- **Verification:** 19/19 green.

### Deferred (Out of Scope)

**Pre-existing `tags:` missing on 35 openapi paths** — inherited from Phases 201/202 per `.planning/phases/203-webhook-subscription-engine-ga/deferred-items.md`. F-96 uses block-form `tags:` correctly; 0 contribution to the failing-path count. The 1 remaining openapi-build test failure is this long-standing regression, documented and not in scope for this plan.

## Threat Model Alignment

| Threat ID | Disposition | Mitigation shipped |
|-----------|-------------|---------------------|
| T-203-09-01 EoP (cross-tenant sub read/mutation) | mitigate | Every handler SELECTs subscription.tenant_id + compares before UPDATE → 403 cross_tenant_forbidden. Tests 1f (detail) + 1j (delete) cover. Update inherits same guard. |
| T-203-09-02 Info Disclosure (secret columns in response) | mitigate | All handlers enumerate explicit return columns; `secret` + `secret_v2` never appear in SELECT lists for response shaping. Test 1d asserts `s1.secret === undefined` and `s1.secret_v2 === undefined` on the S1 list response. UI masks signature preview to last 8 chars (UI-SPEC Surface 2). |
| T-203-09-03 Tampering (update bypasses SSRF guard) | mitigate | update.js re-runs `assertUrlIsPublic(body.url)` on any URL change — 400 private_ip/https_required/invalid_scheme. Test 1i covers private-IP rejection. |
| T-203-09-04 Tampering (update raises rps_override above plan) | mitigate | update.js re-computes ceiling (`PLAN_TIER_RPS[plan_tier] ?? free`) + rejects with 400 rps_override_exceeds_plan + `{ ceiling }` echoed. Test 1h covers free+50 → 400 ceiling=10. |
| T-203-09-05 DoS (delete storm cancels in-flight) | accept | Delete is admin-gated + tenant-scoped; cancelled deliveries stop but do not regenerate; no amplification. UI gating via confirm dialog + Delete-subscription "This cannot be undone." copy. |
| T-203-09-06 Repudiation (mutations without audit) | mitigate | Both update.js and delete.js emit `enqueueAuditStaging` rows with source_domain='webhooks' + distinct actions (`subscription.updated` / `subscription.deleted`). Audit failure swallowed (pattern per Plan 203-03) so it never blocks the save. |
| T-203-09-07 Info Disclosure (UI leaks signature via Copy cURL) | mitigate | Surface 2 `.copyCurlLink` copies a sanitized curl to clipboard — signature NOT included in the payload (per UI-SPEC §Surface 2 action note). The 8-char mask is visible in the UI but never serialized into the clipboard payload. |

## Known Stubs

None. All 5 endpoints + both surfaces are production-wired. The safe-require path for `getBreakerState` was a deliberate defense against parallel-wave sibling ordering, not a stub — it now resolves the real module since 203-08 has landed.

## Threat Flags

No new security-relevant surface introduced beyond the plan's `<threat_model>` coverage (T-203-09-01 through T-203-09-07 all addressed). The 5 new paths are declared in F-96 and mount under existing `/api/tenant/*` authz boundaries shipped in Phase 201.

## Downstream Unlocks

- **Plan 203-verify / Phase 203 close** — F-96 merged into openapi; 5 dashboard endpoints are the tenant-admin surface verifiers will sanity-check against UI-SPEC S1+S2 acceptance criteria; ROADMAP row for Phase 203 can flip to Ready-for-verify once all 10 plans ship.
- **Phase 204+ marketing/growth** — Plan 203-09's Surface 1 pattern (4-number hero + table card + Create dialog) is the canonical "admin domain dashboard" shape for future phases (e.g. analytics, billing cost explorer). Copy rules + a11y contract + 3 documented 203-new conventions are reusable without re-research.
- **Operator support** — With S1 deployed, tenant admins can self-diagnose DLQ build-up + per-sub failure rates without needing platform-side database queries. This is the user-visible payoff of the entire Phase 203 webhook work.

## Self-Check: PASSED

**Files verified (all exist on disk + tracked by git):**
- FOUND: `lib/markos/webhooks/metrics.cjs`
- FOUND: `lib/markos/webhooks/metrics.ts`
- FOUND: `api/tenant/webhooks/fleet-metrics.js`
- FOUND: `api/tenant/webhooks/subscriptions/list.js`
- FOUND: `api/tenant/webhooks/subscriptions/[sub_id]/index.js`
- FOUND: `api/tenant/webhooks/subscriptions/[sub_id]/update.js`
- FOUND: `api/tenant/webhooks/subscriptions/[sub_id]/delete.js`
- FOUND: `contracts/F-96-webhook-dashboard-v1.yaml`
- FOUND: `app/(markos)/settings/webhooks/page.tsx`
- FOUND: `app/(markos)/settings/webhooks/page.module.css`
- FOUND: `app/(markos)/settings/webhooks/[sub_id]/page.tsx`
- FOUND: `app/(markos)/settings/webhooks/[sub_id]/page.module.css`
- FOUND: `test/webhooks/settings-api.test.js`
- FOUND: `test/webhooks/api-tenant.test.js`
- FOUND: `test/webhooks/ui-s1-a11y.test.js`
- FOUND: `test/webhooks/ui-s2-a11y.test.js`
- FOUND: `test/webhooks/settings-ui-a11y.test.js`
- MODIFIED: `app/(markos)/layout-shell.tsx` (sidebar nav extension)

**Commits verified (git log):**
- FOUND (sibling co-commit): `df60b46` feat(203-10): GREEN Task 3 — load smoke + 5 docs + llms.txt + F-99 + OpenAPI regen (collected Task 1 files — metrics lib + 5 handlers + F-96 + 2 test files + openapi regen — during parallel Wave-5 execution)
- FOUND: `00289d9` feat(203-09): Task 2 — Surfaces 1 + 2 pages + CSS modules + 38 a11y tests

**Test suites verified:**
- `node --test test/webhooks/settings-api.test.js test/webhooks/api-tenant.test.js test/webhooks/ui-s1-a11y.test.js test/webhooks/ui-s2-a11y.test.js test/webhooks/settings-ui-a11y.test.js` → **57/57 green**.
- `node --test test/webhooks/*.test.js` → **352/352 green + 2 skips** (no regression on prior Wave 1-4 tests).

**Acceptance-criteria greps (all green):**
- `grep -rc "x-markos-tenant-id" api/tenant/webhooks/` — all 10 handlers (5 new + 5 prior-wave) enforce tenant header.
- `grep -c "cross_tenant_forbidden" api/tenant/webhooks/subscriptions/\[sub_id\]/{index,update,delete}.js` → 2 + 1 + 1 = 4 (≥ 3 required).
- `grep -c "assertUrlIsPublic" api/tenant/webhooks/subscriptions/\[sub_id\]/update.js` → 4 (≥ 1 required).
- `grep -c "rps_override_exceeds_plan" api/tenant/webhooks/subscriptions/\[sub_id\]/update.js` → 1 (≥ 1 required).
- `grep -c "F-96" contracts/F-96-webhook-dashboard-v1.yaml` → 1 (≥ 1 required).
- F-96 declares 5 paths (fleet-metrics + subscriptions + {sub_id} + update + delete).
- `grep -c "aggregateFleetMetrics" lib/markos/webhooks/metrics.cjs` → 5 (≥ 1 required).
- `grep -c "getBreakerState\|breaker_state" subscriptions/list.js + [sub_id]/index.js` → 8 + 7 = 15 (≥ 2 required).
- S1: `"Webhooks"` ≥ 1 h1; `"Create subscription"` ≥ 1; hero labels ≥ 4; chip states ≥ 3; role=meter ≥ 1; aria-labelledby webhooks-hero-heading ≥ 1.
- S2: `"Deliveries"`/`"DLQ"`/`"Settings"` ≥ 3; `role="tablist"` ≥ 1; `"Rotate signing secret?"` ≥ 1; `x-markos-signature-v1`/`v2` both present; `"This cannot be undone."` ≥ 1.
- S1 CSS: `#0d9488` ≥ 3; `border-radius: 28px` ≥ 1; `max-width: 1040px` ≥ 1; `outline: 2px solid #0d9488` ≥ 1; `min-height: 44px` ≥ 3; `prefers-reduced-motion` ≥ 1.
- S2 CSS: `border-radius: 16px` ≥ 2 (203-new #2); `.codeBlock` contains both `#0f172a` + `#e2e8f0` (203-new #3).

---

*Phase: 203-webhook-subscription-engine-ga*
*Plan: 09*
*Completed: 2026-04-18*
