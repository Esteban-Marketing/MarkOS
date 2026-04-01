# Phase 39 - Pain-Points-First Content Corpus
## CONTEXT.md - Locked Planning Context

**Phase:** 39
**Milestone:** v3.0 — MarkOS Literacy System
**Status:** Discussed — ready for planning
**Created:** 2026-04-01
**Depends on:** Phase 32 literacy infrastructure (vector store client, ingestion CLI, chunker, Supabase table)

---

## Phase Objective

Author and ingest the foundational marketing literacy corpus organized by a pain-point taxonomy, covering all five MSP disciplines with business-model-aware metadata so the two-layer retrieval system has real content to serve.

---

## Scope (Locked)

1. Define a two-tier pain-point taxonomy: 6-8 coarse strategic categories (parents) + 2-3 discipline-specific sub-tags per discipline. Parent categories are used by Phase 40 for discipline routing; sub-tags are used for filter precision within a discipline.
2. Author a production-complete corpus: all 6 chunk types (definition, evidence, tactic, benchmark, counter-indicator, vocabulary) fully written with citable benchmarks for each document. Minimum coverage: ≥3 documents per MSP discipline × 5 disciplines = 15 documents minimum.
3. Extend the frontmatter schema with `pain_point_tags: string[]` and enforce it as a required field in `ingest-literacy.cjs` ingestion validation.
4. Apply hybrid business-model annotation: universal tactics tagged `["all"]`; model-specific supplements (tactics that only apply to a specific model subset) tagged explicitly with the applicable model values.
5. Place all literacy content under `.agent/markos/literacy/{discipline}/` — co-located with the existing MarkOS agent template assets.
6. Ingest the full corpus and verify round-trip retrieval works by pain-point filter.

---

## Done Definition

- Two-tier taxonomy defined as a machine-readable artifact consumed by Phase 40's discipline router.
- `.agent/markos/literacy/` exists with a subdirectory per MSP discipline: `Paid_Media`, `Content_SEO`, `Lifecycle_Email`, `Social`, `Landing_Pages`.
- Each discipline directory contains ≥3 fully authored `.md` files with complete frontmatter (including `pain_point_tags`) and all 6 chunk-type sections written to production quality.
- `ingest-literacy.cjs` rejects documents missing `pain_point_tags` with a clear validation error message.
- `parseLiteracyFrontmatter()` in `literacy-chunker.cjs` parses and returns `pain_point_tags` from frontmatter.
- All 15+ documents ingest without error (dry-run + live run pass).
- `getLiteracyContext()` round-trip test returns at least one hit per discipline when queried with a matching pain-point filter.
- At least one model-specific supplement document exists demonstrating the hybrid annotation strategy (e.g., a B2B-specific enterprise pipeline tactic for Paid Media).

---

## Discussed Decisions (2026-04-01)

### Pain-Point Taxonomy Grain

- **D-39-01:** Use a two-tier taxonomy: coarse strategic parent categories (6-8) + discipline-specific sub-tags (2-3 per discipline).
  - Parent categories drive discipline routing in Phase 40 (e.g., "high churn" → Lifecycle Email top-ranked).
  - Sub-tags sharpen filter precision within a discipline retrieval call.
  - Example: parent `low_conversions` with sub-tag `paid_media:high_cpr` or `landing_pages:low_cvr`.

### Document Depth Standard

- **D-39-02:** Author all documents to production-complete standard — all 6 chunk types fully written with citable benchmarks, real evidence, tactic variants, and counter-indicators validated per applicable business models.
  - No stub documents. No `[FILL]` markers in the shipped corpus.
  - Quality bar: a marketing practitioner could act on the document without needing external research.

### Business Model Annotation Strategy

- **D-39-03:** Use a hybrid annotation model:
  - Universal tactics applicable across all 7 business models are tagged `business_model: ["all"]`.
  - Model-specific supplements (e.g., ABM tactics for B2B, LTV-maximization tactics for DTC) are tagged explicitly with the applicable subset (e.g., `["B2B", "SaaS"]` or `["DTC", "B2C"]`).
  - This enables the Phase 40 filter to retrieve universal documents + model-relevant supplements without requiring 35 near-duplicate documents.

### Corpus Location in the Repo

- **D-39-04:** Literacy content lives under `.agent/markos/literacy/{discipline}/` — co-located with agent templates, example files, and other MarkOS agent assets.
  - Path mirrors the template structure pattern established in Phases 11 and 32.
  - `ingest-literacy.cjs --path .agent/markos/literacy/Paid_Media` is the canonical invocation pattern.

---

## Canonical Refs

- `.agent/markos/literacy/` — corpus root (to be created in this phase)
- `onboarding/backend/literacy-chunker.cjs` — frontmatter parser and heading-based chunker; `pain_point_tags` must be added here
- `bin/ingest-literacy.cjs` — ingestion pipeline; frontmatter validation to be extended here
- `onboarding/backend/vector-store-client.cjs` — `getLiteracyContext()`, `upsertLiteracyChunk()`, `buildLiteracyFilter()`
- `.planning/phases/32-marketing-literacy-base/32-RESEARCH.md` — canonical Phase 32 technical decisions (namespace pattern, chunking strategy, Supabase schema, RLS)
- `.planning/milestones/v3.0-LITERACY-SYSTEM-ROADMAP.md` — v3.0 milestone definition with gap analysis and phase descriptions

---

## the agent's Discretion

- Exact set of 6-8 parent pain-point categories and discipline sub-tag values — researcher/planner should derive from common B2B/SaaS/DTC marketing failure modes.
- Which 3 documents to author per discipline — start with the highest-frequency pain points per discipline (e.g., attribution issues for Paid Media, churn triggers for Lifecycle Email).
- Exact frontmatter field name casing and validation error message copy in `ingest-literacy.cjs`.
- Whether the taxonomy is stored as a JSON file, a markdown table, or an inline constant in the discipline-router module (Phase 40 determines final form; Phase 39 only needs to define the content).
