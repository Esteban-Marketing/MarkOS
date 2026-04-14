# Phase 96: Neuro-Aware Literacy Schema and Taxonomy Expansion - Research

Researched: 2026-04-14
Confidence: HIGH
Domain: MarkOS literacy metadata, retrieval contracts, neuromarketing taxonomy, and preview-safe governance

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

### Schema posture
- D-01: Phase 96 must be additive to the shipped v3.6.0 deep-research baseline, not a replacement of the current literacy and governance system.
- D-02: The new literacy schema must support both company-level tailoring and ICP-level tailoring as separate but composable signals.
- D-03: Every literacy artifact should be able to encode pains, desired outcomes, objections, trust blockers, buying-stage context, and naturality expectations.

### Neuromarketing posture
- D-04: The existing MarkOS neuromarketing reference remains the authoritative trigger vocabulary; Phase 96 should integrate with it rather than invent a second neuro taxonomy.
- D-05: Neuro-aware fields must stay brand-safe, evidence-aware, and non-manipulative.

### Retrieval and contract posture
- D-06: The schema must remain deterministic and portable so later phases can use it across MCP, API, CLI, editor, and internal automation surfaces.
- D-07: Backward-compatible metadata and filters are required so v3.6.0 retrieval and preview-safe governance do not regress.

### Scope guardrails
- D-08: Phase 96 focuses on schema, taxonomy, and metadata conventions, not full corpus expansion or final agent training behavior.
- D-09: Universal business-model template coverage belongs primarily to Phase 97, and agent/skill alignment belongs primarily to Phase 99.
- D-10: The default schema layout should use a hybrid layered model: governed structured blocks for core literacy meaning plus portable tags for filtering, retrieval, and reuse.
- D-11: Granularity should center on company baseline metadata with ICP-segment and funnel-stage overlays, avoiding premature micro-segment explosion in this phase.

### Claude's Discretion
- Exact field names, nesting, and storage format for the new literacy metadata within the locked hybrid layered model
- Mapping conventions from ICP signals to neuromarketing trigger hints
- Validation strategy for required vs optional metadata fields
- Whether overlay inheritance is implemented via merge rules, references, or another deterministic portable contract

### Deferred Ideas (OUT OF SCOPE)
- Full universal template expansion across all business models is deferred to Phase 97.
- Full ICP reasoning and trigger-fit decision logic is deferred to Phase 98.
- Agent prompt and skill rewiring is deferred to Phase 99.
- Final evaluation and governance closure is deferred to Phase 99.1.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| NLI-01 | Literacy artifacts encode ICP pain points, desired outcomes, objections, trust blockers, and emotional state shifts in a reusable structured format. | Current repo already persists reusable marketing metadata in markos_literacy_chunks; Phase 96 should extend that schema with additive ICP and neuro-aware fields. |
| NLI-02 | Retrieval and composition use both company context and ICP context so the same company can yield meaningfully different outputs for different audiences. | Current filters and context packs already normalize company and audience as separate inputs; Phase 96 should formalize company baseline plus ICP overlay metadata for deterministic retrieval. |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- Keep work inside the existing MarkOS and GSD split; do not propose a platform rewrite.
- Use the current Node/CommonJS backend and onboarding surface as the implementation base.
- Preserve the existing test posture: npm test or node --test test/**/*.test.js.
- Preserve the onboarding backend entrypoint and current cross-surface portability guarantees.

## Summary

Phase 96 should be planned as a schema-and-taxonomy expansion on top of the shipped v3.6.0 deep-research baseline, not as a new retrieval system. The repo already has deterministic deep-research filters, preview-only response envelopes, approved-only internal knowledge retrieval, and a stable literacy metadata store with business model, funnel stage, content type, and pain-point tagging.

The planner should therefore use the existing contracts as the base layer and add a second, richer metadata layer for company tailoring, ICP tailoring, emotional-state mapping, objection handling, trust cues, and neuromarketing hints. The safest repo-aligned path is to keep current required keys intact, add new optional structured blocks plus filterable tag arrays, and continue to route everything through read-safe, provenance-aware surfaces.

Primary recommendation: implement Phase 96 as an additive hybrid schema using existing required retrieval keys plus optional neuro-aware overlay metadata, with the MarkOS B01-B10 catalog as the only neuro vocabulary.

## Phase objective recap

Define the reusable schema and taxonomy foundation that lets MarkOS store and retrieve literacy artifacts with stronger company awareness, stronger ICP awareness, and safe neuromarketing alignment. This phase is only the foundation layer for later template, reasoning, and agent-behavior upgrades.

## Concrete findings from the current codebase

| Verified surface | What the repo already does | Planning implication |
|---|---|---|
| onboarding/backend/research/filter-taxonomy-v1.cjs | Enforces four required core filters: industry, company, audience, offer_product. Unknown optional taxonomy data already has a home under filters.extensions. | Do not replace the core filter contract in Phase 96. Extend it additively. |
| onboarding/backend/research/research-mode-taxonomy.cjs | All v3.6 research modes are preview-only and write-disabled. | New schema work must stay read-safe and compatible with preview mode. |
| onboarding/backend/research/deep-research-envelope.cjs | Portable contract version is markos.deep_research.v1; targets are literacy, mir, and msp; human approval is required. | Keep contract version stable or make any expansion optional and backward-compatible. |
| onboarding/backend/research/context-pack-contract.cjs and research-orchestration-contract.cjs | Context packs already standardize summary, findings or claims, evidence, contradictions, active_filters, route_trace, and provider attempts. | New literacy metadata should be representable inside existing context pack patterns. |
| onboarding/backend/research/company-knowledge-service.cjs | Knowledge search and fetch are approved-only, tenant-scoped, and read-only. | New schema must preserve authority, provenance, and approval semantics. |
| onboarding/backend/vector-store-client.cjs | Literacy retrieval already filters by business_model, funnel_stage, content_type, and pain_point_tags, and upserts metadata to both relational and vector stores. | Phase 96 should extend this metadata path rather than introducing a separate storage lane. |
| bin/ingest-literacy.cjs | Current ingestion requires doc_id, discipline, business_model, and pain_point_tags. | New neuro-aware fields should be optional in this phase so the current corpus remains ingestable. |
| onboarding/backend/vault/audience-schema.cjs | Audience metadata already validates discipline, audience tags, business model, and pain_point_tags. | This is the natural place to extend segment-aware validation conventions. |
| supabase/migrations/39_pain_point_tags.sql | Prior schema expansion used non-destructive ADD COLUMN IF NOT EXISTS semantics. | Plan Phase 96 migrations the same way. |
| .agent/markos/references/neuromarketing.md | Canonical neuro vocabulary already exists: B01-B10 triggers, archetype map, and funnel-stage mappings. | Reuse these IDs and mappings. Do not invent a second trigger taxonomy. |
| onboarding/backend/research/evaluation-contract.cjs and phase-95 tests | Governance already scores personalization and keeps review bundles read-safe and approval-gated. | Phase 96 must preserve the existing quality and governance posture. |

Fresh verification evidence from this research turn: 15 focused regression tests passed across Phase 91, Phase 93, Phase 95, and vector store retrieval baselines.

## Reusable assets and established patterns

### 1. Deterministic contract normalization
The repo consistently normalizes tokens, string arrays, and allowed keys before any retrieval or review flow. Phase 96 should follow the same pattern for every new field.

### 2. Hybrid metadata shape already exists
The current literacy store already combines scalar metadata, filterable tag arrays, and richer text content. That matches the locked hybrid posture for this phase.

### 3. Approved internal evidence is authoritative
Company knowledge and preview research remain read-only and approved-first. Schema changes must keep that authority model intact.

### 4. Additive migrations are the repo norm
The current literacy system evolved by adding optional columns and compatibility reads, not destructive rewrites.

### 5. Personalization is already a scored product behavior
Phase 95 explicitly treats personalization as a material evaluation dimension, so Phase 96 should feed better personalization signals into that existing framework rather than creating a separate scoring system.

## Risks and constraints

- Strict envelope validation exists now. Adding unsupported top-level keys to retrieval or deep-research envelopes will currently fail contract validation.
- The current retrieval envelope only allows pain_point_tags, business_model, funnel_stage, content_type, and tenant_scope. Any new filterable keys must be added deliberately and safely.
- Current ingestion treats pain_point_tags as required. If Phase 96 makes many new fields required too early, the existing literacy corpus will break or require premature backfill.
- Vector and relational metadata are both written in the same upsert flow. Schema work must update both paths together to keep retrieval parity.
- Neuromarketing must remain evidence-aware and brand-safe. The reference file already warns against manipulative anti-patterns such as fake scarcity or unsupported authority claims.
- This phase must not absorb Phase 97 template expansion, Phase 98 reasoning logic, or Phase 99 agent rewiring.

## Recommended implementation shape for this phase only

### Core rule
Keep the existing v3.6.0 contract keys as the stable base layer and add a richer literacy metadata layer on top.

### Recommended schema posture
Use two coordinated layers:

1. Portable filterable tags for retrieval and reuse
- pain_point_tags remains as-is
- add optional desired_outcome_tags
- add optional objection_tags
- add optional trust_driver_tags
- add optional trust_blocker_tags
- add optional emotional_state_tags
- add optional neuro_trigger_tags using only B01 through B10
- add optional archetype_tags aligned to the existing neuro reference
- add optional naturality_tags
- add optional icp_segment_tags

2. Governed structured blocks for meaning
- company_tailoring_profile: baseline company or offer context, proof posture, naturality expectations, and trust context
- icp_tailoring_profile: pains, desired outcomes, objections, motivations, trust blockers, and emotional-state shift targets
- stage_tailoring_profile: funnel-stage nuance and message emphasis rules
- neuro_profile: trigger hints, archetype hints, rationale, and ethical guardrails

### Recommended storage design
- Keep existing fields and queries unchanged.
- Add new filterable tags as optional text-array columns where retrieval needs direct filtering.
- Add one or more JSONB-style structured blocks for richer overlay data that later phases can consume without exploding top-level columns.
- Continue storing the same metadata in both the relational record and vector metadata payload.

### Recommended merge model
Use deterministic overlay inheritance:
- company baseline metadata
- plus ICP segment overlay
- plus funnel-stage overlay
- resulting in one merged read-safe tailoring view

This matches the locked requirement for separate but composable company-level and ICP-level signals.

### Recommended filter posture
Do not change the required deep-research core filters in this phase. Put new taxonomy signals under extensions or optional metadata first. Promote only the fields that are clearly worth direct retrieval filtering.

### Recommended neuro posture
Use the existing B01-B10 catalog, funnel mappings, and archetype map directly. Phase 96 should define how literacy artifacts reference those triggers, not redefine what the triggers are.

## Proposed task breakdown for planning

### Workstream 1: Schema and taxonomy contract
- Define the canonical neuro-aware literacy field set and allowed vocabularies.
- Lock deterministic normalization rules for tags, arrays, and overlay blocks.
- Document which fields are required now versus optional for future phases.

### Workstream 2: Storage and migration expansion
- Add non-destructive schema support to markos_literacy_chunks for the new optional tags and structured overlay block or blocks.
- Extend vector-store-client upsert and retrieval metadata pass-through so new fields round-trip safely.

### Workstream 3: Ingestion and validation alignment
- Extend ingest-literacy and audience-schema validation so the new metadata can be parsed and normalized.
- Keep legacy documents valid with no mandatory backfill beyond the current required fields.

### Workstream 4: Retrieval and context-pack compatibility
- Ensure new metadata can flow into retrieval responses, context packs, and approved knowledge results without breaking preview-safe envelopes.
- Preserve provenance, approval gates, and read-only semantics.

### Workstream 5: Fixtures, docs, and planner handoff
- Add example fixture metadata for at least one company baseline plus two ICP overlays.
- Document the taxonomy and merge behavior so Phase 97, 98, and 99 can reuse it directly.

## Verification ideas and non-regression checks

### Existing baselines that must stay green
- Phase 91 filter taxonomy and deep research envelope tests
- Phase 93 context pack portability test
- Phase 95 evaluation contract and personalization-score tests
- vector-store-client namespace, filter, health, and upsert tests

### New Phase 96 checks the planner should require
- Legacy literacy documents without the new fields still ingest and retrieve successfully.
- New taxonomy fields normalize deterministically and reject malformed values.
- Neuro trigger tags only accept the governed B01-B10 vocabulary or degrade safely.
- Company baseline plus ICP overlay merge into one stable, deterministic payload.
- Approved-only retrieval still returns provenance and remains read-safe.
- Preview envelopes and evaluation bundles remain write-disabled and approval-gated.

### Recommended quick verification command
Run the focused non-regression suite used during this research turn and add any new Phase 96 tests to it.

## Explicit additive and backward-compatible note

This phase should be planned and implemented as additive and backward-compatible.

That means:
- keep existing required filters, envelopes, and preview-safety behavior intact
- keep the current literacy corpus valid without mandatory rewrites
- keep approved-only company knowledge and provenance behavior intact
- extend metadata rather than replacing the current retrieval foundation
- treat Phase 96 as the schema substrate for later phases, not as a rewrite of deep research, generation, or governance

## Planner-ready conclusion

The repo is already structurally ready for this phase. The safest and most useful Phase 96 plan is to extend the current literacy metadata model with deterministic company-level, ICP-level, emotional, objection, trust, naturality, and neuro-aware signals while preserving the v3.6.0 deep-research and governance contracts. If the planner keeps the changes additive and contract-first, Phase 96 will unlock Phase 97, 98, and 99 cleanly without regressions.