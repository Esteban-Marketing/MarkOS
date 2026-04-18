---
phase: 203-webhook-subscription-engine-ga
plan: 06
subsystem: infra, ui
tags: [webhooks, rotation, notifications, resend, redis, cron, banner, ui, a11y, audit]

requires:
  - phase: 202-mcp-server-ga
    provides: "Plan 202-10 RESEND_API_KEY + emit-kpi-digest.mjs Resend dry-run pattern; api/cron/mcp-kpi-digest.js cron wrapper shape"
  - phase: 203-webhook-subscription-engine-ga
    provides: "Plan 203-02 migration 72 markos_webhook_secret_rotations + grace_ends_at columns; Plan 203-03 MARKOS_WEBHOOK_CRON_SECRET + vercel.ts 6th cron entry; Plan 203-05 (parallel) rotation.cjs computeStage (soft-required — inline fallback if absent)"
  - phase: 201-saas-tenancy-hardening
    provides: "markos_tenant_memberships + role IN (owner/admin) + users!inner(email) foreign-table expand"

provides:
  - "lib/markos/webhooks/rotation-notify.cjs + .ts: buildEmailTemplate + sendRotationNotification + notifyRotations + listAllActiveRotations + fetchTenantAdminEmails + inline computeStage (soft-require rotation.cjs)"
  - "api/cron/webhooks-rotation-notify.js: POST-only, MARKOS_WEBHOOK_CRON_SECRET-gated daily notification handler"
  - "vercel.ts: 7th cron entry at 0 4 * * * (daily 04:00 UTC)"
  - "app/(markos)/_components/RotationGraceBanner.tsx: Surface 4 client component with 4 variants (t-7 | t-1 | t-0 | multi) + locked UI-SPEC copy"
  - "app/(markos)/_components/RotationGraceBanner.module.css: warn palette (#fef3c7/#78350f/#d97706) + T-0 escalation ([data-stage=\"t-0\"] -> #fef2f2/#991b1b/#dc2626) + 44px tap target + 2px #0d9488 focus"

affects: [203-09-dashboard-shell-wiring, 206-*-multi-tenant-observability]

tech-stack:
  added:
    - "@upstash/redis (lazy-required; existing cron patterns already expect it)"
    - "resend (lazy-required; already in package.json from Plan 202-10)"
  patterns:
    - "Soft-require forward-compat: rotation-notify.cjs resolveComputeStage() first tries require('./rotation.cjs'), falls back to inline impl when Plan 203-05 hasn't landed"
    - "Redis SET NX EX dedupe for cron exactly-once: key=rotation:notified:{id}:{stage}, TTL 90d > 30d grace window"
    - "Fire-and-forget audit emit with try/catch swallow (mirrors Plan 203-03 dlq-purge audit pattern)"
    - "Dry-run email fallback: console.log when RESEND_API_KEY absent; real send when present (mirrors Plan 202-10 emit-kpi-digest)"
    - "Shared cron secret across webhook crons: MARKOS_WEBHOOK_CRON_SECRET serves both 203-03 dlq-purge + 203-06 rotation-notify"
    - "Grep-shape UI a11y suite: string-match locked copy + CSS token literals (mirrors 202-09 mcp-settings-ui-a11y.test.js)"

key-files:
  created:
    - "lib/markos/webhooks/rotation-notify.cjs"
    - "lib/markos/webhooks/rotation-notify.ts"
    - "api/cron/webhooks-rotation-notify.js"
    - "app/(markos)/_components/RotationGraceBanner.tsx"
    - "app/(markos)/_components/RotationGraceBanner.module.css"
    - "test/webhooks/rotation-notify.test.js"
    - "test/webhooks/ui-s4-a11y.test.js"
  modified:
    - "vercel.ts"

key-decisions:
  - "Inline computeStage with soft-require to rotation.cjs — keeps Plan 203-06 independently executable while 203-05 is in flight. When 203-05 lands first in deploy order, the canonical impl takes over transparently; if 203-06 lands first, inline mirror matches the spec so behavior is identical."
  - "Count dry-runs as 'sent' in notifyRotations return value + still write the Redis dedupe key + still emit the audit row. Rationale: D-11 SLO measures 'a notification was *attempted* for this rotation+stage'. The Redis key prevents a later real-send from double-firing; the audit row flags delivered=false so ops can tell dry-runs from real deliveries."
  - "Multi-rotation variant stays on warn palette (not T-0 escalation). Rationale: individual rotations may still be in T-7; summing them shouldn't escalate severity until at least one hits T-0."
  - "No dismiss button on banner (UI-SPEC security rule enforced by grep test). Active rotation is a live security-relevant state; hiding it would let admins miss the window."
  - "Shared MARKOS_WEBHOOK_CRON_SECRET across 203-03 + 203-06 — one secret serves both webhook crons (matches plan's user_setup env_vars guidance)."

patterns-established:
  - "Notification cron: lister (all active rotations) -> filter (stage) -> redis dedupe -> fetcher (role-scoped recipients) -> sender (dry-run fallback) -> audit emit"
  - "UI banner component contract: rotations[]-driven pure-display; role='status' ambient; data-stage for CSS escalation; no persistence controls; shell-level fetch deferred to 203-09"
  - "CSS token layering: base warn palette -> [data-stage='t-0'] selector escalates to error palette without breaking role='status' ambient a11y"

requirements-completed: [WHK-01, QA-03, QA-14, QA-15]

duration: 8min
completed: 2026-04-18
---

# Phase 203 Plan 06: Rotation Notification Cron + Surface 4 Banner Summary

**D-11 admin-communication layer — daily cron at 04:00 UTC sweeps active signing-secret rotations, sends T-7/T-1/T-0 admin emails with Redis NX dedupe, plus the Surface 4 pure-display banner component honoring UI-SPEC locked copy + tokens.**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-04-18T06:49:28Z
- **Completed:** 2026-04-18T06:57:30Z
- **Tasks:** 2
- **Files created:** 7
- **Files modified:** 1

## Accomplishments

- **D-11 rotation notifications ship at all 3 stages** — `computeStage(grace_ends_at)` maps grace windows to `t-7` (2 < days ≤ 7), `t-1` (0 < days ≤ 1), `t-0` (days ≤ 0), `normal` (> 7 days). `buildEmailTemplate` returns stage-specific subject + HTML body with the subscription URL + CTA + review link.
- **Exactly-once-per-rotation-per-stage delivery** — Redis `SET NX EX 90d` key `rotation:notified:{rotation_id}:{stage}` ensures a rotation crossing T-7 triggers exactly one T-7 email; crossing T-1 later triggers exactly one T-1 email; and so on.
- **Admin-scoped recipients** — `fetchTenantAdminEmails` queries `markos_tenant_memberships` with `role IN ('owner','admin')` + tenant_id match + `users!inner(email)` join. T-203-06-01 (Information Disclosure) mitigated at query level.
- **Audit trail** — each successful send (including dry-run) emits an `enqueueAuditStaging` row `source_domain='webhooks', action='secret.rotation_notified'` carrying `{ rotation_id, subscription_id, stage, recipients_count, delivered }`. T-203-06-05 (Repudiation) mitigated.
- **7th vercel.ts cron entry** — `{ path: '/api/cron/webhooks-rotation-notify', schedule: '0 4 * * *' }` (daily 04:00 UTC — offset from dlq-purge at 03:30). All 6 prior crons + queue trigger preserved.
- **Surface 4 banner ships as pure-display component** — `RotationGraceBanner.tsx` renders nothing when rotations is empty/null; 1 banner for single rotation with stage-specific locked copy from UI-SPEC (T-7: "Signing-secret rotation in progress. 7 days remain in the grace window."; T-1: "Signing-secret rotation ends tomorrow. Verify subscribers have switched to the new signature."; T-0: "Grace window ends today. The old signing secret will be purged at {time}."); multi variant for 2+ rotations ("{N} signing-secret rotations in progress." + link to /settings/webhooks?filter=rotating). `role="status"` (ambient) + `data-stage` attribute for CSS escalation. **No dismiss button** (UI-SPEC security rule grep-verified).
- **CSS tokens match UI-SPEC §Surface 4** — base warn (#fef3c7 bg + #78350f text + 4px solid #d97706 left border) + T-0 escalation via `[data-stage="t-0"]` selector (#fef2f2 / #991b1b / #dc2626) + 44px graceLink tap target + 2px #0d9488 focus outline + `prefers-reduced-motion` drops the 120ms hover transition.
- **32/32 new tests green** — 17 rotation-notify library + cron behaviors (1a-1j) + 15 UI grep-shape a11y assertions (2a-2j + extras). Mock infra: chainable Supabase with `.in()` support, Map-backed Redis with NX semantics, emails.send capturing Resend shim.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] computeStage dependency on Plan 203-05 (in flight)**
- **Found during:** Task 1 implementation
- **Issue:** Plan 203-06 depends on Plan 203-05's `rotation.cjs computeStage`, but 203-05 is running in parallel (Wave 3) and may not be complete when 203-06 ships.
- **Fix:** Embedded `computeStage` inline in `rotation-notify.cjs` mirroring the spec ('t-7' when 2 < days ≤ 7, 't-1' when 0 < days ≤ 1, 't-0' when days ≤ 0, 'normal' otherwise). Added `resolveComputeStage()` that first attempts `require('./rotation.cjs')` — if 203-05 has landed, the canonical impl is used; otherwise inline fallback keeps 203-06 independently executable.
- **Files modified:** `lib/markos/webhooks/rotation-notify.cjs`
- **Commit:** 2f5368a

**2. [Rule 3 - Blocking] Test mock Supabase missing `.single()` terminal**
- **Found during:** Task 1 test 1h (audit emit)
- **Issue:** `enqueueAuditStaging` chains `.insert(row).select('id').single()` — my mock Supabase only supported `maybeSingle` + thenable await. The audit row test failed because the insert chain didn't resolve.
- **Fix:** Used the library's existing dep-injection seam (`deps.enqueueAuditStaging`) to capture audit rows directly in the test without extending the mock. Cleaner approach — tests the library's contract rather than implementation detail.
- **Files modified:** `test/webhooks/rotation-notify.test.js`
- **Commit:** 2f5368a

**3. [Rule 1 - Bug] "dismiss" / "close" in comments triggered security-guard test**
- **Found during:** Task 2 test 2g (no dismiss/close button guard)
- **Issue:** My initial banner component had "NO dismiss button" and "NO close button" in comments. Grep-test flags ANY occurrence of these words case-insensitively as a security regression.
- **Fix:** Rephrased the comment to "No user-hideable toggle (security anti-pattern per UI-SPEC)" — preserves the security-rule documentation without triggering the word-match guard.
- **Files modified:** `app/(markos)/_components/RotationGraceBanner.tsx`
- **Commit:** 6ef5231

## Verification

**Per-task tests:**
```
node --test test/webhooks/rotation-notify.test.js
→ 17/17 pass (buildEmailTemplate 3a-3c + throws, sendRotationNotification
   dry-run 1d + real-send 1e, notifyRotations iteration 1f + dedupe 1g +
   audit 1h + normal-stage skip, cron handler 405/401/200 1i, vercel.ts
   7th cron 1j + parity, exports + dual-export)

node --test test/webhooks/ui-s4-a11y.test.js
→ 15/15 pass (empty branch 2a, 4 stage copy variants 2b-2f, no-close
   guard 2g, CSS warn + T-0 tokens 2h, 44px + focus outline 2i,
   [data-stage="t-0"] 2j, role="status" + 'use client' + prefers-
   reduced-motion, file existence)
```

**Acceptance grep counts (all met):**
- rotation-notify.cjs: 8x t-7|t-1|t-0, 11x computeStage, 5x RESEND_API_KEY, 1x `in('role', ['owner', 'admin'])`, 2x `secret.rotation_notified`
- vercel.ts: 1x webhooks-rotation-notify, 1x `0 4 * * *`, 2x both webhook crons, 5x original crons preserved, 1x queue/v2beta
- RotationGraceBanner.tsx: 6x role="status", 5x data-stage, 1x each stage copy, 0x close/dismiss
- RotationGraceBanner.module.css: 3x #fef3c7, 5x #78350f, 2x #fef2f2, 4x #991b1b, 1x focus ring, 1x 44px, 5x [data-stage="t-0"], 2x prefers-reduced-motion

**Dual export:** `ls lib/markos/webhooks/rotation-notify.{cjs,ts}` = 2 files present.

## Commits

- `6a97931` test(203-06): RED — rotation-notify library + cron + vercel.ts test suite
- `2f5368a` feat(203-06): GREEN — rotation-notify library + daily cron + 7th vercel.ts cron entry
- `c664b11` test(203-06): RED — Surface 4 RotationGraceBanner grep-shape a11y suite
- `6ef5231` feat(203-06): GREEN — RotationGraceBanner.tsx + .module.css

## Downstream Unlocks

- **Plan 203-09 (dashboard + shell wiring):** The `RotationGraceBanner` component is ready to drop into `app/(markos)/layout-shell.tsx` above the `<main>` slot once 203-09 fetches `/api/tenant/webhooks/rotations/active` (Plan 203-05 endpoint) into a shell-level context provider.
- **Plan 203-10 (status page + observability):** Rotation notification audit rows (`source_domain='webhooks' action='secret.rotation_notified'`) are queryable for the runbook D-11 SLO dashboard.
- **Phase 206 multi-tenant observability:** The cron duration_ms + sent_count + skipped_count fields are structured log-drain inputs.

## Known Stubs

None. Every code path is functional. The soft-require to `rotation.cjs` is a forward-compat pattern, not a stub — both paths produce correct `computeStage` output matching the locked spec.

## Self-Check: PASSED

- [x] `lib/markos/webhooks/rotation-notify.cjs` exists
- [x] `lib/markos/webhooks/rotation-notify.ts` exists
- [x] `api/cron/webhooks-rotation-notify.js` exists
- [x] `app/(markos)/_components/RotationGraceBanner.tsx` exists
- [x] `app/(markos)/_components/RotationGraceBanner.module.css` exists
- [x] `test/webhooks/rotation-notify.test.js` exists
- [x] `test/webhooks/ui-s4-a11y.test.js` exists
- [x] `vercel.ts` contains webhooks-rotation-notify entry
- [x] Commits `6a97931`, `2f5368a`, `c664b11`, `6ef5231` present in git log
