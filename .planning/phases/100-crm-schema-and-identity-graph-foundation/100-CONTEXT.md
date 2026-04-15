# Phase 100: CRM Schema and Identity Graph Foundation - Context

**Gathered:** 2026-04-14  
**Status:** Ready for planning

## Phase Boundary

This phase establishes the canonical tenant-scoped CRM model and identity graph foundation for MarkOS. It covers first-class records, custom metadata, merge lineage, and the shared activity ledger boundary that later tracking, workspace, outbound, and AI phases will build on. It does not yet deliver the full operator workspace, outbound sending, or copilot automation.

## Implementation Decisions

### Canonical record model
- **D-01:** CRM remains the operational system of record for contacts, companies, accounts, customers, deals, tasks, notes, and activities; telemetry and campaigns enrich this model but do not replace it.
- **D-02:** Reuse and extend the existing contract-first CRM shape already present in the repo instead of introducing a parallel data model or a separate graph database.
- **D-03:** Every material CRM record must carry tenant scope, stable identifiers, audit timestamps, and explicit status fields so later phases can compute lifecycle state safely.

### Identity graph and merge governance
- **D-04:** Identity stitching must be confidence-aware and fail closed when evidence is ambiguous; Phase 100 should provide the lineage and review primitives, not permissive auto-merge behavior.
- **D-05:** Merge actions are governance events with immutable evidence and reversible lineage, following the established review-first merge pattern already used in the repo.
- **D-06:** Anonymous-to-known linking belongs at the boundary of the identity graph, but high-volume behavioral stitching logic is deferred to Phase 101.

### Custom fields and metadata
- **D-07:** Custom fields stay explicit, object-scoped, and validated through shared CRM contracts rather than loose JSON sprawl.
- **D-08:** Workspace metadata and pipeline configuration primitives may be preserved where already available, but Phase 100 should focus on the foundational schema and validation surfaces rather than full pipeline UX.

### Security and audit guarantees
- **D-09:** All reads and writes must stay tenant-scoped and fail closed when auth context is missing or mismatched.
- **D-10:** Audit history, source references, actor metadata, and timestamps are mandatory for merges and material CRM mutations because later reporting and AI recommendations depend on this provenance.

### The agent's discretion
- Final table or module layout, naming normalization, and migration packaging can follow the repo’s existing CRM conventions.
- Exact helper boundaries may be adjusted during planning so long as tenant isolation, auditability, and merge governance remain locked.

## Specific Ideas

- Keep the schema thin and extensible rather than building a heavy CDP or warehouse-first subsystem.
- Treat merge review like a protected operator workflow, not a silent dedupe convenience feature.
- Preserve one canonical activity/evidence rail so later reporting can reconcile to real record history.

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone and requirement source
- `.planning/ROADMAP.md` — Defines the Phase 100 boundary and its dependency role for Phases 101-105.
- `.planning/REQUIREMENTS.md` — CRM-01 and CRM-02 are the primary completion targets for this phase.
- `.planning/PROJECT.md` — Captures the milestone-wide architectural constraints and non-replatform rule.

### CRM integration and risk guidance
- `.planning/research/v3.8.0-revenue-crm-customer-intelligence-integration.md` — Recommended build order and source-of-truth model for the revived CRM lane.
- `.planning/research/crm-customer-intelligence-risk-brief-2026-04-14.md` — Identity, tenant-isolation, and reporting-risk guardrails that Phase 100 must enforce.

### Existing contracts and tests
- `contracts/F-58-crm-entity-crud-v1.yaml` — Canonical CRUD contract for tenant-safe CRM records.
- `lib/markos/crm/contracts.cjs` — Existing record-kind, custom-field, and pipeline/object validation primitives.
- `lib/markos/crm/entities.cjs` — Established normalization and tenant-safe CRUD helper pattern.
- `lib/markos/crm/merge.cjs` — Existing review-first merge and lineage handling.
- `test/crm-schema/crm-core-entities.test.js` — Regression coverage for core entity tables, tenant scope, and RLS expectations.

## Existing Code Insights

### Reusable Assets
- `lib/markos/crm/contracts.cjs`: already defines valid CRM record kinds and validation helpers that should anchor the phase implementation.
- `lib/markos/crm/entities.cjs`: provides normalization, immutable entity shaping, and tenant-safe CRUD behavior worth preserving.
- `lib/markos/crm/merge.cjs`: already models merge decisions as explicit governance artifacts instead of ad hoc writes.
- `lib/markos/crm/api.cjs`: shows the current role model, fail-closed tenant checks, and collection boundaries for downstream routes.

### Established Patterns
- The repo favors contract-first, tenant-aware modules with explicit validator functions and negative-path enforcement.
- Higher-risk mutations are separated by role and review level, which should remain true for identity and merge surfaces.
- Shared reporting and AI layers assume auditable source data, so Phase 100 must prioritize lineage correctness over convenience.

### Integration Points
- Phase 101 will plug tracking and anonymous activity stitching into the identity graph and activity ledger established here.
- Phases 102-105 will reuse these same records for workspace views, execution queues, outbound writes, and copilot evidence packaging.

## Deferred Ideas

- High-volume behavioral event normalization and anonymous-session stitching logic — Phase 101.
- Kanban, calendar, forecast, and record-detail operator views — Phase 102.
- Sales/success playbooks, next-best-action ranking, and queue logic — Phase 103.
- Native outbound sending and conversation telemetry — Phase 104.
- AI-generated CRM summaries, recommendations, and reporting closeout — Phase 105.

---

*Phase: 100-crm-schema-and-identity-graph-foundation*  
*Context gathered: 2026-04-14*
