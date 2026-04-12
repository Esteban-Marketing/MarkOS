# Phase 87: Dual Role Views (Operator + Agent) - Context

**Gathered:** 2026-04-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Separate operator vault management surfaces from agent retrieval/execution views while preserving unified artifact lineage and auditable access logs. This phase defines and implements role-view separation over the same canonical artifact lineage, without changing the milestone content model or adding unrelated new capabilities.

</domain>

<decisions>
## Implementation Decisions

### Data Ownership and Source of Truth
- **D-01:** Supabase is the system of record for app/runtime data required for operation (tenant data, roles, audit logs, execution telemetry, retrieval events, policy/RLS boundaries).
- **D-02:** Obsidian Vault is the canonical store for generated and organized content/documents (artifact files, human-readable knowledge structure, discipline-first organization).
- **D-03:** The integration model is metadata-linking, not content duplication: Supabase stores references and operational metadata to Obsidian artifacts (artifact_id, canonical_path, checksum, tenant_id, provenance pointers), while document bodies remain in Obsidian.

### Operator Role View (Management Surface)
- **D-04:** Operator surfaces are Obsidian-driven for content management and curation workflows, with backend sync/index/audit running automatically; no manual publish gate is introduced.
- **D-05:** Operator actions that mutate operational state (publish flags, role assignments, workflow state, governance markers) must be persisted in Supabase and linked to corresponding Obsidian artifact references for traceability.

### Agent Role View (Retrieval and Execution Surface)
- **D-06:** Agent view uses PageIndex retrieval + Phase 86 retriever contracts (reason/apply/iterate) as read/execution entrypoints; agents do not write canonical document bodies directly.
- **D-07:** Agent execution outputs and retrieval traces are logged in Supabase with deterministic linkage to Obsidian artifacts (artifact_id + provenance + mode + run_id), preserving unified lineage across both role views.

### Unified Lineage and Auditability
- **D-08:** Lineage is unified by a shared artifact identity contract: every operator mutation and agent retrieval/execution event must reference the same artifact_id and tenant scope, enabling end-to-end audit from Obsidian document to agent outcome.
- **D-09:** Audit logging occurs at both control points: operator-side lifecycle changes and agent-side retrieval/execution events. Retrieval-only logs are insufficient for ROLEV-04 and governance follow-through.

### Supabase Migration Scope for Phase 87
- **D-10:** Phase 87 performs the audit-store migration from in-memory to Supabase for role-view and lineage paths needed by ROLEV-04. This is an implementation requirement for operational correctness, not deferred to Phase 88.
- **D-11:** Phase 88 remains focused on governance hardening, milestone closure evidence, and non-regression verification; it does not own the initial role-view data persistence foundation.

### the agent's Discretion
- Exact table/schema names and module split for the Supabase-backed audit/retrieval store.
- UI shape details for operator-facing affordances, as long as Obsidian-first content management and Supabase operational persistence are preserved.
- Internal service boundaries between sync, retriever orchestration, and audit writers.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone Scope and Requirements
- .planning/ROADMAP.md — Phase 87 scope, dependency chain, and ROLEV-04 mapping.
- .planning/REQUIREMENTS.md — ROLEV-04 and governance constraints for role-view separation and auditability.
- .planning/PROJECT.md — v3.5.0 vault-first strategy and non-regression constraints.
- .planning/STATE.md — current sequencing context after Phase 86 completion.

### Prior Locked Context
- .planning/phases/84-vault-foundation-obsidian-mind-pageindex-contracts/84-CONTEXT.md — foundational vault, PageIndex, and tenant-isolation decisions.
- .planning/phases/85-ultimate-literacy-vault-foundation/85-CONTEXT.md — milestone-level locked decisions for Obsidian/PageIndex/Supabase roles.
- .planning/phases/86-agentic-retrieval-modes-reason-apply-iterate/86-03-SUMMARY.md — validated retrieval contracts and integration test evidence.

### Runtime Implementation Baselines
- onboarding/backend/vault/vault-retriever.cjs — role-view agent retrieval entrypoints (reason/apply/iterate).
- onboarding/backend/vault/retrieval-filter.cjs — discipline and audience_tags AND-filter semantics.
- onboarding/backend/vault/handoff-pack.cjs — deterministic mode-aware handoff payloads.
- onboarding/backend/vault/visibility-scope.cjs — role/tenant gating for retrieval scope.
- onboarding/backend/vault/audit-store.cjs — in-memory store with explicit Phase 87 Supabase migration stub.
- onboarding/backend/vault/sync-service.cjs — ingestion-adjacent operator-side sync contract and metadata validation.

### Codebase Architecture Guidance
- .planning/codebase/ARCHITECTURE.md — operator/backend/hosted flow and integration boundaries.
- .planning/codebase/STACK.md — Supabase persistence baseline and runtime stack.
- .planning/codebase/STRUCTURE.md — placement rules for backend modules and route ownership.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- onboarding/backend/vault/vault-retriever.cjs: Existing role-safe retrieval pipeline (scope -> tenant projection -> filter -> pack) should remain the agent read path.
- onboarding/backend/vault/visibility-scope.cjs: Existing role gating can be extended for explicit operator vs agent view boundaries.
- onboarding/backend/vault/sync-service.cjs: Existing Obsidian-side sync normalization and metadata validation can anchor operator ingestion/curation flows.
- onboarding/backend/vault/audit-store.cjs: Stable append/getAll API allows backend swap from memory to Supabase without breaking callers.

### Established Patterns
- CommonJS backend modules with injected dependencies for testability.
- Deterministic contracts (idempotency keys, provenance normalization, explicit mode surfaces).
- Fail-closed authorization checks before data access.
- Tenant isolation as explicit runtime boundary, expected to align with Supabase RLS.

### Integration Points
- Replace audit-store internals with Supabase-backed implementation while preserving current public API shape.
- Ensure sync-service/operator mutations emit lineage events consumed by the same artifact identity contract used by vault-retriever handoff packs.
- Keep Obsidian artifact bodies external to Supabase while persisting operational metadata and execution logs in Supabase tables scoped by tenant.

</code_context>

<specifics>
## Specific Ideas

- User constraint is explicit: keep app data in Supabase for correct runtime behavior, and keep generated/organized content and documents in Obsidian Vault.
- Best-fit architecture is hybrid-by-responsibility: Supabase for operational state and auditability; Obsidian for knowledge content and document lifecycle.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 87-dual-role-views-operator-agent*
*Context gathered: 2026-04-12*
