---
phase: 201-saas-tenancy-hardening
plan: "02"
subsystem: audit-log
tags: [audit-log, hash-chain, cdc-staging, rls-append-only, wave-1]
dependency_graph:
  requires: []
  provides:
    - supabase/migrations/82_markos_audit_log_hash_chain.sql
    - lib/markos/audit/canonical.cjs
    - lib/markos/audit/writer.cjs
    - lib/markos/audit/chain-checker.cjs
    - api/audit/drain.js
  affects: [201-03, 201-04, 201-05, 201-06, 201-07, 201-08]
tech_stack:
  added: []
  patterns: [append-only-rls, pg-advisory-lock, at-least-once-staging, dual-export-ts-cjs]
key_files:
  created:
    - supabase/migrations/82_markos_audit_log_hash_chain.sql
    - supabase/migrations/rollback/82_markos_audit_log_hash_chain.down.sql
    - lib/markos/audit/canonical.ts
    - lib/markos/audit/canonical.cjs
    - lib/markos/audit/writer.ts
    - lib/markos/audit/writer.cjs
    - lib/markos/audit/chain-checker.ts
    - lib/markos/audit/chain-checker.cjs
    - api/audit/drain.js
    - test/audit/canonical.test.js
    - test/audit/hash-chain.test.js
    - test/audit/chain-checker.test.js
  modified: []
decisions:
  - "Single-writer SQL function: JS never hashes. append_markos_audit_row acquires pg_advisory_xact_lock per tenant + reads last row_hash + computes the new hash + INSERTs inside the same txn. Eliminates the concurrent-fork race (Pitfall 4)."
  - "Append-only RLS: RESTRICTIVE policies block UPDATE and DELETE for all non-service-role callers. Combined with the hash-chain verifier this makes any tampering detectable even if the restrictive policy were bypassed."
  - "Canonical JSON layout is binary-identical between Node (canonical.cjs) and Postgres (inline builder in append_markos_audit_row). Locked by a test that asserts the 6-key ordered string."
  - "Staging table with claimed_at for at-least-once intake (Pitfall 3). drain.js cron replays unclaimed rows via append_markos_audit_row. Failed appends leave claimed_at NULL so the next run retries."
  - "Migration 82 preserves migration-37 columns (workspace_id, actor, entity_type, entity_id, details) and keeps them populated from the SQL function. Phase 206 will deprecate them after full cutover."
metrics:
  tasks_completed: 2
  tasks_total: 2
  files_created: 12
  tests_passing: 23
---

# Phase 201 Plan 02: Audit Log + Hash Chain Summary

Shipped the unified `markos_audit_log` surface (D-16) with per-tenant hash chain
(D-17). Append-only RLS + single serialised SQL writer with advisory lock eliminates
the concurrent-fork race. Staging buffer + cron drain gives at-least-once intake
so no audit event is lost during subscriber downtime.

## Tasks

| # | Task | Status | Tests |
|---|------|--------|-------|
| 1 | Migration 82 + rollback + canonical.{cjs,ts} lib + canonical tests | ✓ | 10/10 pass |
| 2 | writer + chain-checker + drain handler + 2 tests | ✓ | 13/13 pass |

## Verification

- `node --test test/audit/canonical.test.js` → 10/10 pass
- `node --test test/audit/hash-chain.test.js` → 7/7 pass
- `node --test test/audit/chain-checker.test.js` → 6/6 pass
- Total: 23/23 tests green
- Canonical layout verified to match SQL output (6-key ordered string assertion)
- Chain-checker detects row-hash mismatch + prev-hash break; empty chain handled cleanly

## Commits

- `feat(201-02): migration 82 + canonical JSON lib (Task 1)`
- `feat(201-02): writer + chain-checker + drain handler (Task 2, 13 tests pass)`

## REQ Coverage

`QA-01` single source of truth (one `markos_audit_log` table + one writer) ·
`QA-02` typed contracts + deterministic API (AUDIT_SOURCE_DOMAINS locked, inputs validated) ·
`QA-04` tenant isolation (per-tenant advisory lock + RLS) ·
`QA-05` deterministic tests (canonical parity, chain break detection) ·
`QA-11` structured audit (hash chain + provenance) ·
`QA-13` rollback migration shipped ·
`QA-15` docs-as-code (comments in SQL + JS name exact D-16/D-17 decisions).

## Unblocks

Every downstream Plan emits audit rows through `writeAuditRow` / `enqueueAuditStaging`:
- Plan 03 signup: `source_domain='auth'`, actions `signup.pending`, `signup.verified`
- Plan 04 passkey: `source_domain='auth'`, actions `passkey.registered`, `passkey.used`
- Plan 05 middleware + sessions: `source_domain='auth'`, actions `session.revoked`
- Plan 06 BYOD: `source_domain='tenancy'`, actions `domain.added`, `domain.verified`, `domain.removed`
- Plan 07 invites + lifecycle + GDPR: `source_domain='orgs'`/`'tenancy'`, actions per D-08 + D-14 + D-15
- Plan 08 wires all emitters + ships the cron schedule for `api/audit/drain.js`

## Self-Check: PASSED (23/23 tests, 2 atomic commits, 12 files shipped, pgcrypto ensured)
