# Phase 30 - MarkOSDB Migration (P1.5/P2)
## CONTEXT.md - Locked Planning Context

**Phase:** 30
**Milestone:** v2.2
**Status:** Planned - ready for execution
**Created:** 2026-03-28
**Depends on:** Phase 29 completion

---

## Phase Objective

Implement concrete migration from local compatibility artifacts (`.markos-local`) into cloud-canonical MarkOSDB architecture using Next.js, Supabase, and Upstash, while preserving backward-compatible reads.

---

## Scope (Locked)

1. Define canonical MarkOSDB contracts (schema, metadata, namespace conventions).
2. Build idempotent local-to-cloud ingestion pipeline.
3. Expose authenticated runtime access paths for Next.js with Supabase auth/RLS and vector retrieval support.

---

## Constraints

- `.markos-local` remains compatibility surface during v2.2.
- Migration must support dual-write or staged rollout flags.
- No destructive namespace migration during runtime request handling.

---

## Done Definition

- Supabase and Upstash contracts are explicit and testable.
- Ingestion pipeline is rerunnable without duplicate corruption.
- Next.js auth boundary enforces protected access while preserving local fallback operations.
