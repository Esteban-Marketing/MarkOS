# Phase 40 — Multi-Discipline Orchestrator Retrieval
## CONTEXT.md — Locked Planning Context

**Phase:** 40
**Milestone:** v3.0 — MarkOS Literacy System
**Status:** Discussed — ready for planning
**Created:** 2026-04-01
**Depends on:** Phase 39 (pain-point taxonomy + corpus must exist to validate retrieval)

---

## Phase Objective

Replace the hardcoded single-discipline literacy fetch (`getLiteracyContext('Paid_Media', ...)`) in `orchestrator.cjs` with a dynamic multi-discipline retrieval pipeline. The pipeline:
1. Selects disciplines from seed data via `discipline-router.cjs`
2. Fetches literacy context in parallel across the top-3 ranked disciplines
3. Merges results under a fixed chunk cap
4. Emits structured telemetry

---

## Scope (Locked)

1. Build `onboarding/backend/agents/discipline-router.cjs` — `rankDisciplines(seed) → string[]` returning an ordered list of up to 5 discipline names.
2. Extend `buildLiteracyFilter()` in `vector-store-client.cjs` to support `pain_point_tags CONTAINS ANY` filter condition (export the function).
3. Refactor `orchestrator.cjs` lines 130–146: replace the single-discipline fetch with discipline-router → parallel dual-query fetch → merge by doc_id dedup → budget trim → assign to `literacyContextHits`.
4. Backward compatibility: when no literacy content exists, behavior degrades identically to current (empty `standards_context`).
5. Add telemetry event `literacy_retrieval_observed` with fields: `{ disciplines_queried, total_hits, pain_point_match_count, context_tokens }`.
6. Unit tests: discipline-router (seed→discipline ranking), orchestrator integration with mocked multi-discipline hits, context budget enforcement, dual-query dedup.

---

## Done Definition

- `discipline-router.cjs` exports `rankDisciplines(seed)` returning a string array of discipline names sorted by relevance score (channels primary + pain-points booster).
- `orchestrator.cjs` issues `Promise.all()` across top-3 disciplines, each with dual-query merge (filtered + unfiltered per D-40-02).
- Merged context is capped at 6 chunks by score before being assigned to `drafts.standards_context`.
- When `active_channels` is empty AND `pain_points` is empty, the router falls back to `['Paid_Media']` (preserves current behavior).
- Telemetry event `literacy_retrieval_observed` fires with correct field values.
- All existing tests pass; at least 4 new tests added for this phase.

---

## Discussed Decisions (2026-04-01)

### Routing Inputs

- **D-40-01:** Channels-primary + pain-points-booster routing.
  - `content.active_channels` strings are mapped deterministically to discipline names (e.g. "LinkedIn" → `Social`, "Email" → `Lifecycle_Email`, organic content signals → `Content_SEO`, paid ad signals → `Paid_Media`, conversion/landing signals → `Landing_Pages`).
  - `audience.pain_points` free-text strings are matched against Phase 39's taxonomy parent tags and add a score boost to the matching discipline.
  - `company.business_model` is NOT used for discipline ranking (only for the literacy retrieval filter).
  - Rationale: deterministic channel→discipline lookup is simpler to test and avoids taxonomy mismatches from free-text pain_point strings.

### Universal Document Fan-Out

- **D-40-02:** Dual-query merge per discipline.
  - For each discipline, issue two `getLiteracyContext` calls: one WITH `business_model` filter (retrieves model-specific supplements) and one WITHOUT filter (retrieves universal `["all"]` docs).
  - Merge the two result sets for a discipline by `doc_id` dedup (keep higher-score copy), then sort by score and take top-K before the global budget trim.
  - No corpus denormalization required in Phase 39 content.
  - Rationale: cleanest retrieval logic; no change required to ingestion pipeline or corpus frontmatter.

### Context Budget

- **D-40-03:** Fixed chunk cap, default 6, configurable.
  - After merging all discipline results and deduplicating by `doc_id`, take the top-6 chunks ranked by similarity score.
  - The cap can be overridden via `.planning/config.json` under `literacy.max_context_chunks` (default 6 if absent).
  - Rationale: simple contract, no tokenizer dependency, easily asserted in tests (`arr.length <= 6`).

### Parallel Discipline Count

- **D-40-04:** Always top 3 (fixed count).
  - `discipline-router.cjs` returns up to 5 disciplines ranked by score; orchestrator takes the first 3 and issues `Promise.all()` for dual-query fetches.
  - If fewer than 3 disciplines score above zero (e.g. thin seed), pain-point taxonomy fills remaining slots from defaults.
  - Hard floor: if no signals present, router returns `['Paid_Media', 'Content_SEO', 'Lifecycle_Email']` as defaults so the orchestrator always makes 3 fetch pairs.
  - Rationale: predictable, testable, consistent with milestone spec default.

---

## Canonical Refs

- `onboarding/backend/agents/orchestrator.cjs` lines 130–146 — the literacy fetch block being replaced
- `onboarding/backend/vector-store-client.cjs` — `getLiteracyContext()`, `upsertLiteracyChunk()`, `buildLiteracyFilter()` (must export after Phase 39)
- `onboarding/backend/agents/discipline-router.cjs` — new module; does not exist yet
- `.agent/markos/literacy/taxonomy.json` — Phase 39 artifact; maps parent tags to disciplines; consumed by discipline-router for pain-point boosting
- `onboarding/onboarding-seed.schema.json` — seed schema; `content.active_channels` and `audience.pain_points` are the routing inputs
- `.planning/phases/39-pain-points-first-content-corpus/39-CONTEXT.md` — upstream decisions, especially D-39-01 (two-tier taxonomy) and D-39-03 (hybrid business_model annotation with ["all"] universal docs)
- `.planning/milestones/v3.0-LITERACY-SYSTEM-ROADMAP.md` — Phase 40 full spec with technical requirements
