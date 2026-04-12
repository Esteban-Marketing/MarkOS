# Phase 86: Agentic Retrieval Modes (Reason, Apply, Iterate) - Context

**Gathered:** 2026-04-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement deterministic retrieval contracts for three agentic modes:
- **Reason** — returns a raw artifact + provenance metadata for LLM consumption
- **Apply** — returns an actionable template pre-filled with audience/discipline context
- **Iterate** — returns artifact + outcome verification hook for iterative refinement

All modes must support discipline-scoped + audience-scoped filtering (ROLEV-02).
All modes must produce deterministic execution handoff payloads with reasoning context and evidence links (ROLEV-03).

Phase boundary fix: this phase delivers the retrieval contract layer only — it does NOT implement the agentic orchestration loop (Phase 87+).

</domain>

<decisions>
## Implementation Decisions

### Agent's Discretion (All Areas)

The user delegated all design decisions to the planner across four discussion areas. The planner has full discretion on:

**Area 1 — Mode Contract Shape**
- D-01: Reason mode payload field set (e.g., article_id, raw_content, provenance, audience_context, mode:"reason")
- D-02: Apply mode pre-fill vs scaffold approach
- D-03: Iterate mode verification mechanism (inline diff contract vs reference to audit-store entry)
- D-04: Single module factory vs three separate endpoint handlers vs mixed

**Area 2 — Filter Architecture**
- D-05: AND/OR/hierarchy combination logic for discipline + audience filters
- D-06: No-filter edge case behavior (return all, return error, or return empty)
- D-07: Exact vs prefix/fuzzy audience tag matching semantics
- D-08: API-layer enforcement vs module-layer enforcement vs both

**Area 3 — Handoff Payload Format**
- D-09: Required field set (minimal/standard/full-trace)
- D-10: Evidence links format (artifact_id refs / audit_store IDs / full provenance inlining)
- D-11: Unified base shape vs mode-specific extensions
- D-12: Strict determinism strategy (idempotency key, artifact version pinning, timestamp behavior)

**Area 4 — Persistence Scope**
- D-13: Whether to migrate audit-store.cjs from in-memory to Supabase in this phase — agent decides (the existing "Phase 86+" annotation in audit-store.cjs is advisory, not mandatory)
- D-14: New `vault-retriever.cjs` (CQRS read path) vs extending audit-store.cjs — agent decides
- D-15: HTTP routes in server.cjs now vs module-only surface — agent decides

**Recommended stance (agent's judgment):** favor a new `vault-retriever.cjs` factory (mirrors `ingest-apply.cjs` pattern), keep audit-store in-memory for Phase 86 while adding Supabase stubs (flip in Phase 87), and implement module-only surface (no HTTP routes) to keep this phase scope-tight.

</decisions>

<specifics>
## Specific Ideas

No specific requirements from the user — full implementation discretion given to the planner.

Critical codebase annotations to honor:
- `audit-store.cjs` line comment: "Persistent storage (Supabase) deferred to Phase 86+" — Phase 86 must address this (even if the answer is "keep deferred with stubs")
- `visibility-scope.cjs` comment: "Phase 86/87 retrieval role-views are explicitly deferred" — Phase 86 must implement the retrieval view layer here

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` §ROLEV-01, §ROLEV-02, §ROLEV-03 — the three retrieval mode requirements this phase closes

### Existing vault contracts (build on top of these)
- `onboarding/backend/vault/audience-schema.cjs` — `validateAudienceMetadata()`: discipline, audience[], business_model, pain_point_tags[] — this is the filter input schema
- `onboarding/backend/vault/provenance-contract.cjs` — `normalizeProvenance()`, `validateProvenance()`: provenance shape for retrieval result metadata fields
- `onboarding/backend/vault/audit-store.cjs` — `append()`, `getAll({tenantId})`, `size()`, `clear()`: in-memory singleton with Phase 86+ Supabase deferral annotation
- `onboarding/backend/vault/visibility-scope.cjs` — `checkVisibilityScope()`, `projectAuditLineage()`, `ALLOWED_VISIBILITY_ROLES`: role/tenant scope guard — Phase 86 must activate the retrieval role-view layer
- `onboarding/backend/vault/ingest-apply.cjs` — `createIngestApply({getActiveRevision, upsertRevision})`: factory pattern to mirror for vault-retriever shape

### Naming conventions (from existing code)
- `onboarding/backend/handlers.cjs` — uses `projectRoleHandoffPacks` (from `brand-nextjs/role-handoff-pack-projector.cjs`) and `buildCanonicalArtifactsFromWrites` — Phase 86 retriever should follow this naming convention

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `createIngestApply` factory pattern in `ingest-apply.cjs` — the read-path factory (`createVaultRetriever`) should mirror this exact shape: injected deps, returned method set, idempotency-based result shape
- `validateAudienceMetadata()` in `audience-schema.cjs` — call this directly to validate incoming filter params before retrieval
- `checkVisibilityScope()` in `visibility-scope.cjs` — call before returning any retrieval result to enforce tenant/role boundary
- `normalizeProvenance()` in `provenance-contract.cjs` — call to produce the provenance block in each retrieval result

### Patterns to Follow
- CommonJS `.cjs` modules only — no TypeScript classes, no ES modules
- Factory functions (not classes): `createX({deps}) → { methodA, methodB }`
- Injected dependencies for testability (no direct Supabase imports at module top-level)
- `{outcome, idempotency_key, result}` return shape (mirrors ingest-apply)

### Phase 85 Handoff
- `audit-store.cjs` is the current source of truth for ingested artifact metadata
- The retrieval layer reads FROM audit-store; the write path (ingest-apply) writes TO it
- Phase 86 establishes the read side of this CQRS split

</code_context>
