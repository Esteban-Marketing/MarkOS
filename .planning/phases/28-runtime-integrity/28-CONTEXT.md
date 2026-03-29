# Phase 28 - Runtime Integrity (P0)
## CONTEXT.md - Locked Planning Context

**Phase:** 28
**Milestone:** v2.2
**Status:** Planned - ready for execution
**Created:** 2026-03-28
**Depends on:** Phase 27 completion baseline

---

## Phase Objective

Eliminate onboarding-blocking runtime failures and data-protection gaps before external rollout. This phase is the release gate for all v2.2 feature work.

---

## Scope (Locked)

1. Approve path reliability for MIR writes in local mode and explicit guard behavior in hosted mode.
2. Node runtime contract alignment to `>=20.16.0` with actionable install-time failures.
3. Automatic `.gitignore` protection for local private data (`.markos-local/`, install manifest, onboarding seed).

---

## Out of Scope

- Linear issue sync and ITM execution (Phase 29).
- Winners catalog write path and campaign result loop (Phase 29).
- Supabase/Upstash migration into MarkOSDB (Phase 30).

---

## Risks

- Hosted runtime behavior could regress if local-write guards are bypassed.
- Installer changes can affect first-run UX if version checks are unclear.
- `.gitignore` injection can duplicate entries if idempotence checks are weak.

---

## Done Definition

- No unhandled approve-path crashes under valid payloads.
- Node versions below 20.16.0 fail fast with clear guidance.
- Fresh install guarantees private local data is gitignored without duplicate entries.
- Targeted tests pass for all three P0 fixes.
