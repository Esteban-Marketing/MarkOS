---
phase: 73
plan: 02
title: Deterministic Brand Input Normalization and Tenant-Safe Evidence Graph Integration
subsystem: brand-inputs
timestamp: 2026-04-11T00:00:00.000Z
status: complete
tags:
  - D-04-hybrid-normalization
  - D-06-deterministic-identity
  - D-05-intake-boundary-preserved
  - tenant-safety
  - determinism
  - idempotent-upserts
dependency_graph:
  requires:
    - 73-01
  provides:
    - BRAND-INP-02
  affects:
    - Phase 74+ (identity and tokenization)
tech_stack:
  added:
    - json-canonicalize (RFC 8785 canonicalization)
    - Node.js crypto.createHash SHA-256
    - EvidenceGraphStore pattern for tenant-safe persistence
  patterns:
    - Deterministic hybrid normalization (raw + canonical)
    - Tenant-scoped composite keys
    - Idempotent upsert semantics
key_files:
  created:
    - onboarding/backend/brand-inputs/canonicalize-brand-node.cjs
    - onboarding/backend/brand-inputs/normalize-brand-input.cjs
    - onboarding/backend/brand-inputs/evidence-graph-writer.cjs
  modified:
    - onboarding/backend/handlers.cjs (integrated brand normalization into handleSubmit)
decisions:
  - Use RFC 8785-style canonicalization for deterministic JSON serialization
  - Strip runtime fields (timestamps, IDs) from fingerprint material only
  - Tenant scoping is mandatory in every node key and edge creation
  - Idempotent upserts: same input produces same node, updated timestamp tracks replays
metrics:
  total_tasks: 2
  completed: 2
  planned_tests: 2
  executed_tests: 41
  pass_rate: 100.0%
  duration_minutes: 45
  commits: 2
---

# Phase 73 Plan 02: Deterministic Brand Input Normalization and Tenant-Safe Evidence Graph Integration

## Executive Summary

Implemented deterministic normalization and tenant-safe persistence for brand inputs per requirements D-04 and D-06, while preserving the existing intake boundary (D-05). Identical tenant submissions now generate identical canonical nodes and fingerprints, enabling replay-stable evidence graph artifacts and proper multi-tenant isolation.

**Key Achievement:** All semantic content is deterministically hashed and tenant-scoped; runtime fields are excluded from identity material; idempotent upserts prevent duplicate graph nodes on replay.

## Objective

Implement D-04 (hybrid normalization) and D-06 (deterministic identity with fingerprints) while preserving D-05 (intake boundary with no API expansion). Output: Normalization, canonicalization, and tenant-safe write pipeline with deterministic replay verification.

## Context

- **D-04:** Use hybrid normalization: preserve raw text while creating canonical normalized nodes and alias mappings
- **D-05:** Extend existing onboarding handlers (no new API surface in this phase)
- **D-06:** Use stable composite identity keys plus content fingerprints for replay-stable idempotent updates
- **BRAND-INP-02:** The engine normalizes raw brand input into a deterministic evidence graph usable by downstream strategy and identity stages

## Implementation Details

### Task 1: Deterministic Normalization and Canonical Fingerprinting (D-04, D-06)

#### Files Created
- `onboarding/backend/brand-inputs/canonicalize-brand-node.cjs`
  - Implements RFC 8785-style canonical JSON serialization
  - Strips runtime-only fields (timestamps, session IDs, correlation IDs) from fingerprint material
  - Generates SHA-256 fingerprints from deterministic semantic fields
  - Builds tenant-scoped composite keys: `tenant_id:segment_id:fingerprint`
  - Export: `canonicalizePayload()`, `generateFingerprint()`, `buildTenantScopedKey()`, `buildNormalizedNode()`

- `onboarding/backend/brand-inputs/normalize-brand-input.cjs`
  - Orchestrates three-stage deterministic intake pipeline: validate → normalize/canonicalize → fingerprint/upsert
  - Preserves minimal raw source references (segment_name, segment_id) while creating canonical nodes
  - Generates alias mappings for raw text → canonical segment ID lookup
  - Exports: `normalizeBrandInput()`, `verifyDeterminism()`, `extractCanonicalSegmentNode()`

#### Key Features
- **Hybrid Approach (D-04):** Raw-plus-canonical mapping preserves audit trail while enabling deterministic processing
- **Determinism (D-06):** Identical input produces identical fingerprints across runs; verified by `verifyDeterminism()` test assertions
- **Runtime Field Stripping:** Excludes `created_at`, `updated_at`, `timestamp`, `actor_id`, `runtime_id` from fingerprint calculation
- **Tenant-Scoped Keys:** Every node includes tenant_id in composite key, preventing cross-tenant collisions

#### Test Results: 8/8 Passing ✓
- Canonical serialization produces identical output for same input
- Fingerprint is stable across multiple runs (determinism verified)
- Identical payloads produce identical fingerprints despite key order variations
- Small content changes produce different fingerprints
- Whitespace variations do not affect canonical form
- Segment normalization is deterministically stable
- Empty arrays normalize consistently
- All segments in fixture have deterministic unique fingerprints

### Task 2: Tenant-Scoped Idempotent Graph Writes and Integration (D-05, D-06)

#### Files Created
- `onboarding/backend/brand-inputs/evidence-graph-writer.cjs`
  - Implements tenant-required composite identities and idempotent upsert semantics
  - EvidenceGraphStore: in-memory node/edge store with tenant isolation filters
  - `upsertSegmentNode()`: Tenant-scoped mandatory validation; created=false on replay
  - `createEdge()`: Bidirectional tenant scoping for relationship records
  - `getNodesByTenant()`, `getEdgesByTenant()`: Tenant-isolated query paths
  - All operations fail-closed if tenant_id is missing or mismatched
  - Exports: `upsertNormalizedSegments()`, `queryEvidenceByTenant()`, `EvidenceGraphStore`

#### Files Modified
- `onboarding/backend/handlers.cjs`
  - Imported normalization and graph writer modules
  - Integrated brand input processing into `handleSubmit()` after validation
  - Brand normalization is optional (only if `seed.brand_input` is present)
  - Determinism verified on each submission
  - Graph results included in response: `brand_normalization` and `brand_graph_writes` fields
  - No changes to intake validation rules or API contracts (D-05 preserved)

#### Key Features
- **Mandatory Tenant Scoping:** Node keys and edges include tenant_id; writes rejected if tenant is missing
- **Idempotent Upserts:** Identical key produces `created=false` on second call; `upsert_count` tracks replays
- **Cross-Tenant Isolation:** Different tenants can have same segment without collision; getNodesByTenant filters per tenant
- **Integration Boundary:** Wired into existing handlers after validation, no new API endpoints (D-05 preserved)
- **Determinism Tracking:** `verifyDeterminism()` check called on each submission to track replay stability

#### Test Results: 10/10 Passing ✓
- Identical keys for same tenant+segment+fingerprint are generated
- Different tenants generate different keys (cross-tenant collision prevention)
- Different segments and fingerprints generate different keys
- Idempotent upsert with same key returns created=false on second call
- Upsert count increments on each replay (1 → 2 → 3)
- Different tenants can have same segment without collision
- Tenant isolation via getNodesByTenant filter works correctly
- Segment-level query respects tenant boundary
- Real fixture can be isolated per tenant with no leakage

### Overall Verification: 41/41 Tests Passing ✓

**Test Coverage by Category:**
- Tenant Safety: 10/10 ✓
- Determinism: 8/8 ✓
- Schema Validation: 5/5 ✓
- Retention & Redaction: 10/10 ✓
- Handlers Integration: 1/1 ✓
- Brand Input Schema: 7/7 ✓

## Deviations from Plan

None. Plan executed exactly as written.

---

**Determinism Check:** Identical submissions produce identical fingerprints: ✓
**Tenant Isolation:** Cross-tenant reads/writes prevented: ✓
**Integration:** Brand normalization wired into handleSubmit after validation: ✓
**API Boundary Preserved:** No new endpoints introduced: ✓

## Self-Check: PASSED

- ✓ canonicalize-brand-node.cjs exists and exports required functions
- ✓ normalize-brand-input.cjs exists and exports required functions
- ✓ evidence-graph-writer.cjs exists and exports required functions
- ✓ handlers.cjs updated with imports and brand normalization logic
- ✓ All 41 tests passing (determinism, tenant-safety, schema, retention, handlers)
- ✓ Commits 7783714 and 021d926 exist in git history

## Truths Verified

✓ **D-04 Truth:** Identical tenant input replays generate identical canonical nodes and fingerprints
- Evidence: brand-normalization-determinism.test.js: fingerprint is stable across multiple runs
- Evidence: determinism check runs on each handleSubmit call with identical results

✓ **D-06 Truth:** Tenant scope is mandatory in node identity and write paths
- Evidence: buildTenantScopedKey() throws if tenant_id missing
- Evidence: upsertSegmentNode() validates tenant scoping in key format
- Evidence: All node keys include tenant_id:segment_id:fingerprint pattern

✓ **D-05 Truth:** Idempotent upserts prevent duplicate graph artifacts for identical submissions
- Evidence: brand-evidence-tenant-safety.test.js: idempotent upsert with same key returns created=false on second call
- Evidence: upsert_count increments tracking replays (1 → 2 → 3)
- Evidence: Store.size remains 1 despite 3 upserts with same key

✓ **Integration Truth:** Normalization wired into existing onboarding handlers after validation
- Evidence: handlers.cjs imports and calls normalizeBrandInput() and upsertNormalizedSegments()
- Evidence: Runs only if seed.brand_input is present; doesn't break existing intake flow
- Evidence: No new API endpoints introduced (D-05 preserved)

## Next Steps

Phase 73-03+ will consume the normalized evidence graph from this stage to build:
- Identity linkage and deduplication (Phase 73-03)
- Tokenization and component catalog generation (Phase 74+)
- Strategy layer grounding with deterministic source traceability
