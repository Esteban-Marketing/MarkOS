---
phase: 32-marketing-literacy-base
plan: 01
subsystem: literacy-storage-contracts
tech-stack:
  - Supabase (PostgreSQL, RLS)
  - Upstash Vector
  - Node.js
key-files:
  - .planning/phases/32-marketing-literacy-base/32-LITERACY-SUPABASE.sql
  - onboarding/backend/vector-store-client.cjs
  - test/vector-store-client.test.js
requirements:
  - MLB-01
  - MLB-02
---

# Phase 32 Plan 01: Literacy Storage Contracts Summary

## One-liner

Canonical storage contract for marketing literacy chunks implemented in Supabase and Upstash Vector, with standards namespace and admin-only write semantics.

## What Was Built
- **Supabase schema**: `markos_literacy_chunks` table contract captured in `32-LITERACY-SUPABASE.sql` with lifecycle and metadata fields.
- **Namespace logic**: `buildStandardsNamespaceName` for tenant-agnostic standards storage.
- **Retrieval**: `getLiteracyContext` with canonical-first filter composition and optional business_model/funnel_stage/content_type filters.
- **Upsert and lifecycle**: `upsertLiteracyChunk` dual-writes to Supabase + Upstash, and `supersedeLiteracyDoc` transitions prior doc records to superseded.
- **Security contract**: runtime secret matrix now includes `literacy_ingest_write` and `literacy_admin_write`.

## Deviations from Plan
None — all plan requirements and must-haves implemented as specified.

## Test Results
All tests passed:
- node --test test/vector-store-client.test.js
  - 6 tests, 0 failures

## Self-Check: PASSED
- All files created/modified exist
- All commits made
- Tests pass

## Known Stubs
None — all implemented functions are fully wired and tested.
