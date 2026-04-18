---
phase: 203
plan: 11
subsystem: webhook-subscription-engine-ga
tags: [gap-closure, surface-4, rotation-grace-banner, shell-wiring, tdd, wave-1]
dependency_graph:
  requires:
    - 203-06-SUMMARY  # RotationGraceBanner pure-display component
    - 203-09-SUMMARY  # baseline layout-shell.tsx + sidebar entries
    - 203-05-SUMMARY  # /api/tenant/webhooks/rotations/active endpoint
  provides:
    - "Surface 4 banner mounted globally in workspace shell"
    - "Shell-level fetch of /api/tenant/webhooks/rotations/active"
    - "Closes VERIFICATION.md gap #1 (truth #12)"
  affects:
    - app/(markos)/layout-shell.tsx
    - app/(markos)/_components/RotationBannerMount.tsx
tech_stack:
  added: []
  patterns:
    - "Client-component mount wrapper around pure-display banner component"
    - "One-shot useEffect fetch on mount (single fetch per full page load in Next.js App Router)"
    - "Silent !res.ok branch — ambient banner never blocks shell"
key_files:
  created:
    - app/(markos)/_components/RotationBannerMount.tsx  # ~46 LoC
    - test/webhooks/layout-shell-banner.test.js  # ~71 LoC, 7 grep-shape cases
  modified:
    - app/(markos)/layout-shell.tsx  # +4 LoC (1 import + 3 JSX)
key_decisions:
  - "Split type import from default import to satisfy grep-shape test regex (`import RotationGraceBanner from './RotationGraceBanner'` as standalone line)"
  - "Banner mount stays INSIDE <section className={styles.content}> above {children} — reads as a system notice above every route's content slot, per UI-SPEC §Surface 4 rows 157/357/380"
  - "No user-hideable toggle — active rotation is a live security-relevant state (UI-SPEC §Surface 4 security rule)"
metrics:
  duration_seconds: 160
  completed_date: "2026-04-18T14:59:42Z"
  tasks_completed: 1
  tests_added: 7
  files_created: 2
  files_modified: 1
  loc_delta: "~117 (46 mount + 71 test) + 4 layout-shell edits"
  commits: 2  # RED + GREEN
requirements: [WHK-01]
---

# Phase 203 Plan 11: Surface 4 Banner Shell-Wiring (Gap Closure) Summary

**One-liner:** Mounted RotationGraceBanner globally in the MarkOS workspace shell via a new RotationBannerMount client component that fetches /api/tenant/webhooks/rotations/active on mount — closes VERIFICATION.md gap #1 (truth #12 FAILED → VERIFIED).

## VERIFICATION.md Gap Closure

**Gap #1 (truth #12):** "Surface 4 rotation grace banner is visible to tenant-admins across (markos) routes when an active rotation is within its T-7/T-1/T-0 window" — status was **FAILED** at verification 2026-04-18T13:00:00Z because:

- `app/(markos)/layout-shell.tsx` did not import RotationGraceBanner.
- `/api/tenant/webhooks/rotations/active` had zero client callers at shell scope.
- Component was orphaned (0 importers in app/).

**Resolution:** This plan ships the ~20-line wiring fix that the 203-06 → 203-09 handoff missed. The 203-06 SUMMARY §Downstream Unlocks explicitly deferred shell-wiring to Plan 203-09; Plan 203-09 added sidebar nav entries (MCP + Webhooks) but did not perform the promised shell mount + context fetch. 203-11 is the surgical closure.

**Post-ship verification grep (VERIFICATION.md missing: bullets):**

- `grep -c "RotationGraceBanner\|RotationBannerMount" "app/(markos)/layout-shell.tsx"` → 1 (was 0).
- `grep -r "import.*RotationGraceBanner\|import.*RotationBannerMount" "app/(markos)"` → 3+ hits (banner + mount each have an importer; was 0).
- Banner component importers: 1 (`RotationBannerMount.tsx`) — was 0.

## Handoff Chain Resolved

```
203-06 (ships RotationGraceBanner.tsx)
     ↓ deferred shell-wiring to 203-09 per SUMMARY §Downstream Unlocks
203-09 (consolidated dashboard UI + sidebar)
     ↓ added /settings/webhooks NAV_ITEM — but MISSED banner mount + fetch
203-11 (THIS PLAN) — gap-closure
     ✓ created RotationBannerMount.tsx (fetch + state + banner render)
     ✓ imported + mounted in layout-shell.tsx above {children}
     ✓ grep-shape test enforces wiring contract
```

## Tasks Completed

| Task | Name                                                      | Commit    | Files Touched                                                                                  |
| ---- | --------------------------------------------------------- | --------- | ---------------------------------------------------------------------------------------------- |
| 1    | Wire RotationGraceBanner into workspace shell (RED/GREEN) | ec6ca5c, 812124d | test/webhooks/layout-shell-banner.test.js (new), app/(markos)/_components/RotationBannerMount.tsx (new), app/(markos)/layout-shell.tsx (+4 LoC) |

## LoC Delta

- **New:** `RotationBannerMount.tsx` — 46 LoC (matches plan estimate ~30 LoC target; slightly higher due to inline comment block preserving UI-SPEC rationale).
- **New:** `test/webhooks/layout-shell-banner.test.js` — 71 LoC (matches plan estimate ~60 LoC).
- **Modified:** `layout-shell.tsx` — +4 LoC (1 import, 3 JSX lines wrapping the mount + `{children}` in explicit opening/closing `<section>` tags). Matches plan estimate of "~2 LoC" at the minimum-change level; 4 LoC reflects the JSX indentation after splitting the single-line section onto three lines — semantically equivalent.

Total: **+121 LoC** (46 + 71 + 4), zero deletions in production code (layout-shell.tsx single-line `<section>{children}</section>` expanded; no other removals).

## Test Delta

**New suite:** `test/webhooks/layout-shell-banner.test.js` — 7 grep-shape cases:

1. All three shell-wiring files exist on disk (layout, mount, banner).
2. layout-shell imports + mounts `<RotationBannerMount />`.
3. RotationBannerMount declares `'use client'`.
4. RotationBannerMount fetches `/api/tenant/webhooks/rotations/active` literal.
5. RotationBannerMount imports RotationGraceBanner + renders `<RotationGraceBanner rotations={rotations} />`.
6. RotationBannerMount uses `useEffect` + `useState` from react.
7. RotationBannerMount has no `close`/`dismiss` tokens (UI-SPEC §Surface 4 security rule).

**Regression posture:** `node --test test/webhooks/*.test.js` → **359 pass + 2 skip, 0 fail** (up from 352 pass + 2 skip at VERIFICATION time; delta = +7 new cases, zero pre-existing regressions).

## Scope Preservation

Exactly 3 files touched. No edits outside the declared surface:

- ✓ `RotationGraceBanner.tsx` UNCHANGED (203-06 pure-display contract preserved; banner remains self-contained display component).
- ✓ No new `.module.css` — mount wrapper is zero-chrome (banner brings its own styles).
- ✓ No changes to `api/tenant/webhooks/rotations/active.js` (shipped in 203-05).
- ✓ No changes to NAV_ITEMS, sidebar markup, or `MarkOSAccessDeniedState`.
- ✓ No new subsystem, no migration, no contract edit, no openapi regen — pure shell wiring.

## Decisions Made

1. **Split default import from type import** — Test regex `import\s+RotationGraceBanner\s+from\s+['"]\.\/RotationGraceBanner['"]` requires the default import as a standalone statement (no named imports in the same `{}`). Resolution: two lines — `import RotationGraceBanner from './RotationGraceBanner';` followed by `import type { Rotation } from './RotationGraceBanner';`. TypeScript compiles both identically; the split is grep-only.

2. **Mount inside `<section className={styles.content}>`** — Plan's action block specified above `{children}` inside `.content`, anchored to UI-SPEC rows 47/157/357/380. The outer `<main className={styles.page}>` is the page container (not the per-page `<main>` that individual routes may render); placing the banner inside `.content` makes it render above every route's content slot, including routes that themselves render their own inner `<main>` (Surface 1, Surface 2).

3. **Silent 401/500 branch** — On `!res.ok`, `load()` returns early without setting state. Banner renders null on empty rotations array (203-06 contract), so pre-auth pages + transient 500s produce zero DOM impact. Threat-model mitigation T-203-11-01.

## Deviations from Plan

**None — plan executed exactly as written**, with one trivial grep-regex accommodation documented above (split import). All acceptance criteria (AC1-AC10) satisfied on first GREEN run:

| AC  | Check                                                                 | Result |
| --- | --------------------------------------------------------------------- | ------ |
| 1   | `grep -c import.*RotationBannerMount layout-shell.tsx`                | 1      |
| 2   | `grep -c <RotationBannerMount /> layout-shell.tsx`                    | 1      |
| 3   | `grep -c /api/tenant/webhooks/rotations/active RotationBannerMount.tsx` | 2 (≥1 required) |
| 4   | `grep -cE <RotationGraceBanner rotations=\{rotations\}`                | 1      |
| 5   | `head -n 3 RotationBannerMount.tsx` shows `'use client';`             | pass   |
| 6   | `grep -icE \\bdismiss\\b\|\\bclose\\b`                                  | 0      |
| 7   | test file exists                                                      | yes    |
| 8   | `node --test test/webhooks/layout-shell-banner.test.js`               | 7/7 pass, exit 0 |
| 9   | `node --test test/webhooks/*.test.js` ≥ 359 pass + 2 skip              | 359 pass + 2 skip, 0 fail |
| 10  | `git log --oneline -n 2` shows RED + GREEN in that order               | ec6ca5c test(203-11) RED, 812124d feat(203-11) GREEN |

## Threat Flags

None. Plan threat-register T-203-11-01..06 dispositions preserved:

- T-203-11-01 (info disclosure on silent 401/500): **mitigated** — `!res.ok` returns without touching DOM; no error text leaks.
- T-203-11-02 (DoS via repeat fetches): **accepted** — `useEffect(…, [])` fires once on mount; Next.js App Router does not remount the shell on client-side nav.
- T-203-11-03 (tampering via credentials): **mitigated** — `credentials: 'same-origin'` uses session cookies; no localStorage, no URL params.
- T-203-11-04 (repudiation): **accepted** — banner is read-only; no mutations in this plan.
- T-203-11-05 (spoofing): **accepted** — mount runs in shell's own client boundary; fetches its own data from tenant-authenticated endpoint.
- T-203-11-06 (EoP): **accepted** — pure display; settings link already authz-guarded by 203-09.

No new threat surface introduced.

## Known Stubs

None. `RotationBannerMount.tsx` performs a live fetch against a shipped endpoint; on empty response or error it renders the banner with `rotations={[]}`, and the banner self-renders `null` per its 203-06 contract — this is the designed ambient-zero-cost pattern, not a stub.

## Acceptance Criteria

- [x] `test/webhooks/layout-shell-banner.test.js` exists with 7 grep-shape cases and passes.
- [x] `app/(markos)/_components/RotationBannerMount.tsx` created (client component, `'use client'` + `useEffect` fetch + `useState` + renders `<RotationGraceBanner rotations={rotations} />`).
- [x] `app/(markos)/layout-shell.tsx` modified with exactly one new import + one JSX mount site (no other edits).
- [x] Full webhook test suite stays green (`node --test test/webhooks/*.test.js` → 359 pass + 2 skip, 0 fail).
- [x] Two commits on `203-11` scope (RED `ec6ca5c` + GREEN `812124d`).
- [x] VERIFICATION.md truth #12 now satisfiable on re-verify: banner component has 1 importer; endpoint has 1 client caller at shell scope.
- [x] No scope creep: zero edits outside the 3 declared files.

## Next Step

Re-run `/gsd-verify-phase 203` — truth #12 should flip from **FAILED** to **VERIFIED**, phase score moves from 11/12 → **12/12**.

## Self-Check: PASSED

- ✓ `app/(markos)/_components/RotationBannerMount.tsx` exists
- ✓ `app/(markos)/layout-shell.tsx` contains `RotationBannerMount` import + mount
- ✓ `test/webhooks/layout-shell-banner.test.js` exists
- ✓ Commit `ec6ca5c` present in `git log --oneline`
- ✓ Commit `812124d` present in `git log --oneline`
- ✓ `RotationGraceBanner.tsx` unchanged (diff = 0)
- ✓ All 7 new test cases pass; full regression 359/361 (2 pre-existing DB-integration skips).

---

_Shipped: 2026-04-18T14:59:42Z_
_Duration: 160 seconds_
_Executor: Claude (gsd-executor)_
