---
phase: 52
slug: plugin-runtime-and-digital-agency-plugin-v1
status: draft
nyquist_compliant: true
wave_0_complete: true
status: verified
created: 2026-04-03
---

# Phase 52 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node:test (existing Phase 48 baseline) |
| **Config file** | Not applicable (no central config; tests use direct node:test) |
| **Quick run command** | `npm test -- test/plugin-*.test.js` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- test/plugin-*.test.js`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 52-01-01 | 01 | 1 | PLG-DA-01 | unit | `node --test test/plugin-registry.test.js test/plugin-control.test.js` | ❌ W0 | ⬜ pending |
| 52-01-01 | 01 | 1 | PLG-DA-01 | unit | `node --test test/plugin-registry.test.js test/plugin-control.test.js` | ✅ | ✅ green |
| 52-01-02 | 01 | 1 | PLG-DA-01 | unit | `node --test test/plugin-registry.test.js` | ✅ | ✅ green |
| 52-01-03 | 01 | 1 | PLG-DA-01 | integration | `node --test test/plugin-control.test.js` | ✅ | ✅ green |
| 52-02-01 | 02 | 2 | PLG-DA-02 | integration | `node --test test/digital-agency.test.js --test-name-pattern="route\|authorization\|plugin disabled"` | ✅ | ✅ green |
| 52-02-02 | 02 | 2 | PLG-DA-02 | integration | `node --test test/digital-agency.test.js --test-name-pattern="workflow\|publish\|approval\|schedule"` | ✅ | ✅ green |
| 52-03-01 | 03 | 3 | WL-01 | integration | `node --test test/plugin-branding.test.js --test-name-pattern="dashboard_applies_brand"` | ✅ | ✅ green |
| 52-03-02 | 03 | 3 | WL-02/WL-03 | integration | `node --test test/plugin-branding.test.js --test-name-pattern="notification\|domain"` | ✅ | ✅ green |
| 52-04-01 | 04 | 4 | WL-04/PLG-DA-01 | integration | `node --test test/plugin-telemetry.test.js --test-name-pattern="operation\|denied\|sanitize\|brand"` | ✅ | ✅ green |
| 52-04-02 | 04 | 4 | WL-04/PLG-DA-02 | e2e | `node --test test/plugin-telemetry.test.js test/digital-agency.test.js test/plugin-registry.test.js test/plugin-control.test.js test/plugin-branding.test.js` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Wave 0 = must exist before Plan 01 Task 01 can run. Plans 02–04 introduce their own stubs at the start of each wave.*

**Plan 01 Wave 0 (pre-execution prerequisites):**
- [ ] `test/plugin-registry.test.js` — failing stubs for PLG-DA-01: contract validation, capability checks, loader validation (created by Task 52-01-01)
- [ ] `test/plugin-control.test.js` — failing stubs for PLG-DA-01: plugin enable/disable, tenant scope isolation (created by Task 52-01-01)
- [ ] Phase 51 test fixtures extended: `test/fixtures/tenant-context.json` already exists; plugins inherit from it

**Plan 02 Wave 2 prerequisites (created by Task 52-02-01, TDD-first):**
- [ ] `test/digital-agency.test.js` — failing stubs for PLG-DA-02: DA routes, authorization checks, plugin disabled gate
- [ ] `test/fixtures/digital-agency-campaigns.json` — seeded campaigns for workflow E2E tests

**Plan 03 Wave 3 prerequisites (created by first task in Plan 03):**
- [ ] `test/plugin-branding.test.js` — stubs for WL-01/WL-02/WL-03: brand-pack inheritance, notification branding, domain routing

**Plan 04 Wave 4 prerequisites (created by Task 52-04-01, TDD-first):**
- [ ] `test/plugin-telemetry.test.js` — stubs for WL-04/PLG-DA: telemetry shape, sanitization, brand-version audit trail

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Plugin dashboard renders with tenant brand token overrides (visual check) | WL-01 | Brand rendering requires visual inspection; automated test verifies data shape only | 1. Enable Digital Agency for test tenant. 2. Set brand token overrides (primary color, logo URL). 3. HTTP GET /plugins/digital-agency/dashboard. 4. Verify brandContext.overrides in response. 5. Visually confirm UI applies overrides if rendered |
| Plugin settings UI accessible from tenant settings page | PLG-DA-01 | Settings page is server-rendered; Storybook coverage deferred to Phase 54 | 1. Log in as tenant owner. 2. Navigate to Tenant Settings → Extensions. 3. Confirm Digital Agency toggle visible and functional |
| Plugin routes inaccessible after plugin disabled (live environment) | PLG-DA-01 | End-to-end multi-step flow requiring live Supabase state change | 1. Disable Digital Agency for test tenant via PATCH /api/tenant/{id}/plugins/digital-agency-v1. 2. Immediately request GET /plugins/digital-agency/dashboard. 3. Verify 404 response |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** ✅ Nyquist-compliant — 73/73 tests pass across all Phase 52 plans (2026-04-03)

---

## Re-Verification Addendum

**Re-verified:** 2026-04-04  
**Result:** No regression found. The automated validation posture for Phase 52 remains intact, the live-closeout boundary is unchanged, and the only remaining human work is still the plugin settings UI check and the disabled-plugin live route gate check.
