# Phase 84: Vault Foundation (Obsidian Mind + PageIndex Contracts) - Context

**Gathered:** 2026-04-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Define the foundational contracts for the Ultimate Literacy Vault: deterministic vault taxonomy, canonical metadata/provenance model, PageIndex adapter envelope, migration cutover path from legacy Upstash retrieval, and tenant-isolation proof requirements. This phase establishes the contract layer only; broader ingestion UX and role views are handled in subsequent phases.

</domain>

<decisions>
## Implementation Decisions

### Vault Taxonomy Contract
- **D-01:** Lock a discipline-first physical vault root with semantic index manifests (audience, funnel, concept) as first-class artifacts.
- **D-02:** Canonical paths must remain deterministic and stable so Obsidian and backend services resolve the same destination without runtime heuristics.

### PageIndex Adapter Contract
- **D-03:** Use one typed query envelope for retrieval (`mode`, `discipline`, `audience`, `filters`, `provenance_required`) instead of mode-specific endpoints.
- **D-04:** The adapter contract must expose provenance metadata in all responses to preserve downstream evidence and governance requirements.

### Migration Cutover Strategy
- **D-05:** Execute immediate hard cutover in Phase 84 (no long-lived dual-run path). Legacy Upstash retrieval paths are removed as part of phase completion.
- **D-06:** Migration evidence must show deterministic contract parity for required retrieval scenarios before legacy removal is declared complete.

### Tenant Isolation Boundaries
- **D-07:** Phase 84 verification must include a tenant-isolation proof matrix that validates both Supabase RLS boundaries and PageIndex scoped-query boundaries.
- **D-08:** Isolation verification requires unit + integration checks (not only smoke tests) before phase closure.

### the agent's Discretion
- Final field naming inside the single query envelope (while preserving the locked envelope shape).
- Internal adapter module layout and helper splitting.
- Test fixture organization for the isolation proof matrix.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone and Phase Scope
- `.planning/ROADMAP.md` — Phase 84 scope, dependencies, and requirement mapping for v3.5.0.
- `.planning/REQUIREMENTS.md` — Locked VAULT-01..03 requirements and milestone-level constraints.
- `.planning/PROJECT.md` — v3.5.0 milestone intent and non-regression guardrails.
- `.planning/STATE.md` — Current milestone state and sequencing context.

### Prior Locked Decisions
- `.planning/phases/85-ultimate-literacy-vault-foundation/85-CONTEXT.md` — Locked v3.5.0 decisions D-01..D-08 that constrain Phase 84 implementation.

### Existing Runtime Baselines (to replace or adapt)
- `onboarding/backend/vector-store-client.cjs` — Current Supabase + Upstash retrieval implementation and filter patterns.
- `bin/ensure-vector.cjs` — Legacy provider-readiness assumptions to be replaced/aligned for PageIndex-era checks.
- `bin/ingest-literacy.cjs` — Existing ingestion and upsert orchestration boundaries that Phase 84 contracts must inform.
- `onboarding/backend/vault/vault-writer.cjs` — Deterministic canonical vault path and metadata writing baseline.

### Documentation Baselines
- `.planning/codebase/STACK.md` — Current storage stack baseline showing Supabase + Upstash posture.
- `.planning/codebase/LITERACY-OPERATIONS.md` — Existing literacy provisioning and operational assumptions.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `onboarding/backend/vault/vault-writer.cjs`: already enforces deterministic destination mapping and bounded vault root safety checks.
- `onboarding/backend/vector-store-client.cjs`: contains reusable filter-building and metadata conventions that can seed PageIndex envelope fields.
- `bin/ingest-literacy.cjs`: provides ingestion control flow (validation, chunking, dedupe) that can be re-targeted to PageIndex.

### Established Patterns
- Backend runtime modules are CommonJS (`.cjs`) and follow explicit helper exports.
- Deterministic naming and checksum-based lineage already exist in literacy artifact flows.
- Health checks and readiness reporting use structured provider status payloads.

### Integration Points
- Retrieval contract replacement centers on `onboarding/backend/vector-store-client.cjs` consumers.
- Vault taxonomy decisions must align with `onboarding/backend/vault/` destination mapping and writer contracts.
- Provisioning and operator runbooks in `.planning/codebase/LITERACY-OPERATIONS.md` will require follow-up updates after implementation.

</code_context>

<specifics>
## Specific Ideas

- Keep the vault physically discipline-first while semantic indexing handles cross-cutting audience and concept discovery.
- Keep the adapter surface single-envelope for easier long-term contract governance across retrieval modes.
- Cut legacy retrieval immediately in Phase 84 rather than carrying a long dual-runtime burden.

</specifics>

<deferred>
## Deferred Ideas

- Full operator-facing Obsidian UX ergonomics are deferred to Phase 87 role-view work.
- Extended ingestion workflow detail beyond contract-level cutover is deferred to Phase 85 execution planning.

</deferred>

---

*Phase: 84-vault-foundation-obsidian-mind-pageindex-contracts*
*Context gathered: 2026-04-12*