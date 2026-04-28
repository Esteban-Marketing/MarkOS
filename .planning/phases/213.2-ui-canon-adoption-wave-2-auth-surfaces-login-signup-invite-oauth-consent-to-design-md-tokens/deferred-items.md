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
