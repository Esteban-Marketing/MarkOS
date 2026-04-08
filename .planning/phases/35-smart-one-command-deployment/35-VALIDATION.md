---
phase: 35
slug: smart-one-command-deployment
status: verified
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-01
---

# Phase 35 — Validation Ledger

> Historical backfill of the installer, updater, and onboarding-readiness validation contract for the one-command deployment phase.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node built-in `node:test` |
| **Quick run command** | `node --test test/install.test.js` |
| **Targeted Phase 35 command** | `node --test test/install.test.js test/update.test.js test/onboarding-server.test.js test/protocol.test.js` |
| **Broader suite command** | `npm test` |
| **Targeted runtime** | ~30 seconds |

---

## Requirements Closure

| Requirement Family | Status | Evidence |
|--------------------|--------|----------|
| Smart installer defaults and handoff | ✅ pass | `test/install.test.js` |
| Update parity and manifest preservation | ✅ pass | `test/update.test.js` |
| Onboarding boot/status contract | ✅ pass | `test/onboarding-server.test.js` |
| Docs/runtime parity for primary command | ✅ pass | `test/protocol.test.js` and README updates captured in `35-01-SUMMARY.md` |

---

## Regression Evidence

| Scope | Command | Result |
|-------|---------|--------|
| Installer targeted | `node --test test/install.test.js` | ✅ pass |
| Updater targeted | `node --test test/update.test.js` | ✅ pass |
| Protocol parity targeted | `node --test test/protocol.test.js` | ✅ pass |
| Full phase gate | `npm test` | ✅ 99/99 pass |

---

## Manual-Only Checks

| Behavior | Why Manual | Instructions |
|----------|------------|--------------|
| Interactive local happy path with browser handoff | Requires an interactive shell and optional browser launch | Run `npx markos` in an interactive shell, accept defaults, and confirm the final summary distinguishes `ready`, `degraded`, or `blocked`. |

---

## Sign-Off

- [x] Installer and updater suites preserved idempotent behavior
- [x] Onboarding readiness and boot/status contract captured in targeted tests
- [x] Documentation parity was checked at phase close
- [x] Full suite was green at milestone close

**Validation verdict:** ✅ Phase 35 verified.