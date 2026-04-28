# Phase 213.2 — Deferred Items (Out-of-Scope Discoveries)

## 213.2-03 Discoveries

### test/tenant-auth/ui-authorization-negative-path.test.js — PRE-EXISTING failure

**File asserted on:** `app/(markos)/layout.tsx` (NOT invite/[token])
**Failure:** Test expects `app/(markos)/layout.tsx` content to match `/Access Denied/` regex; actual content does not contain that literal text.
**Verified pre-existing:** Confirmed via `git stash && node --test test/tenant-auth/ui-authorization-negative-path.test.js` — fails on baseline before any 213.2-03 change.
**Scope:** UNRELATED to invite surface. Phase 213.2-03 changes only `app/(markos)/invite/[token]/*` files.
**Disposition:** Out of scope per executor Rule 5 (scope boundary). Defer to a future plan that touches `app/(markos)/layout.tsx`.

Other in-scope tests all pass:
- `test/tenancy/invites.test.js` — 10/10 pass (invite wiring contract preserved)
- `test/auth/*.test.js` — 61/61 pass
- `test/ui-a11y/213-1-chrome-a11y.test.js` — 22/22 pass

## 213.2-05 Discoveries

### test/onboarding-server.test.js — PRE-EXISTING `MODULE_NOT_FOUND` failure

**File asserted on:** `lib/markos/packs/pack-loader.cjs` resolved through a temp-fixture path `C:\Users\USERPC~1\AppData\Local\Temp\markos-test-*\lib\markos\packs\pack-loader.cjs`.
**Failure:** Test fixture stages a tmp directory tree but the require chain (handlers.cjs → skeleton-generator.cjs → example-resolver.cjs → template-family-map.cjs → pack-loader.cjs) errors with `MODULE_NOT_FOUND` at `pack-loader.cjs:18`.
**Verified pre-existing:** Confirmed via `git stash && node --test test/onboarding-server.test.js` — fails on baseline before any 213.2-05 change with identical stack trace.
**Scope:** UNRELATED to auth surfaces. Phase 213.2-05 changes only `styles/components.css` (4-line edit) and creates `test/ui-a11y/213-2-auth-a11y.test.js`. Neither touches `lib/markos/packs/`, `onboarding/backend/`, or any test-fixture pathway.
**Disposition:** Out of scope per executor Rule 5 (scope boundary). Defer to a future plan that touches the onboarding-server pack-loader chain.

### test/tenant-auth/ui-authorization-negative-path.test.js — PRE-EXISTING failure (carry-forward from 213.2-03)

Re-confirmed at 213.2-05 close — still fails on `app/(markos)/layout.tsx` Access-Denied regex. Phase 213.2-05 changes do not touch `app/(markos)/layout.tsx`. Same disposition as 213.2-03 entry above.
