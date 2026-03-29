# Phase 29 - Operational Enablement (P1)
## CONTEXT.md - Locked Planning Context

**Phase:** 29
**Milestone:** v2.2
**Status:** Planned - ready for execution
**Created:** 2026-03-28
**Depends on:** Phase 28 completion

---

## Phase Objective

Enable agency-operational workflows by wiring Linear issue sync, closing the campaign learning loop, and guaranteeing a bounded onboarding interview experience.

---

## Scope (Locked)

1. Build minimal Linear API client and `/linear/sync` endpoint integrated with ITM templates.
2. Build `/campaign/result` write path for Winners Catalog and outcome tagging.
3. Cap interview loop at 5 questions with progress indicator and auto-proceed behavior.

---

## Out of Scope

- Supabase/Upstash canonical migration and Next.js auth boundary (Phase 30).
- Rollout SLOs, migration rollback controls, and deprecation policy (Phase 31).

---

## Done Definition

- Linear sync creates issues from valid ITM tokens with clear error behavior when secrets are missing.
- Campaign results append to discipline catalogs and persist retrieval metadata.
- Interview flow never exceeds 5 questions and transitions automatically to draft generation.
