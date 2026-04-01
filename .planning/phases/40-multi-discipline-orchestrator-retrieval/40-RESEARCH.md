# Phase 40: Multi-Discipline Orchestrator Retrieval - Research

**Researched:** 2026-04-01
**Domain:** Multi-discipline literacy retrieval orchestration in the onboarding runtime
**Confidence:** MEDIUM

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-40-01:** Channels-primary + pain-points-booster routing.
  - `content.active_channels` strings are mapped deterministically to discipline names (e.g. "LinkedIn" → `Social`, "Email" → `Lifecycle_Email`, organic content signals → `Content_SEO`, paid ad signals → `Paid_Media`, conversion/landing signals → `Landing_Pages`).
  - `audience.pain_points` free-text strings are matched against Phase 39's taxonomy parent tags and add a score boost to the matching discipline.
  - `company.business_model` is NOT used for discipline ranking (only for the literacy retrieval filter).
  - Rationale: deterministic channel→discipline lookup is simpler to test and avoids taxonomy mismatches from free-text pain_point strings.

- **D-40-02:** Dual-query merge per discipline.
  - For each discipline, issue two `getLiteracyContext` calls: one WITH `business_model` filter (retrieves model-specific supplements) and one WITHOUT filter (retrieves universal `["all"]` docs).
  - Merge the two result sets for a discipline by `doc_id` dedup (keep higher-score copy), then sort by score and take top-K before the global budget trim.
  - No corpus denormalization required in Phase 39 content.
  - Rationale: cleanest retrieval logic; no change required to ingestion pipeline or corpus frontmatter.

- **D-40-03:** Fixed chunk cap, default 6, configurable.
  - After merging all discipline results and deduplicating by `doc_id`, take the top-6 chunks ranked by similarity score.
  - The cap can be overridden via `.planning/config.json` under `literacy.max_context_chunks` (default 6 if absent).
  - Rationale: simple contract, no tokenizer dependency, easily asserted in tests (`arr.length <= 6`).

- **D-40-04:** Always top 3 (fixed count).
  - `discipline-router.cjs` returns up to 5 disciplines ranked by score; orchestrator takes the first 3 and issues `Promise.all()` for dual-query fetches.
  - If fewer than 3 disciplines score above zero (e.g. thin seed), pain-point taxonomy fills remaining slots from defaults.
  - Hard floor: if no signals present, router returns `['Paid_Media', 'Content_SEO', 'Lifecycle_Email']` as defaults so the orchestrator always makes 3 fetch pairs.
  - Rationale: predictable, testable, consistent with milestone spec default.

### Claude's Discretion

None provided in `40-CONTEXT.md`.

### Deferred Ideas (OUT OF SCOPE)

None provided in `40-CONTEXT.md`.
</user_constraints>

## Project Constraints (from CLAUDE.md)

- Read order for repo context: `.protocol-lore/QUICKSTART.md` → `.protocol-lore/INDEX.md` → `.planning/STATE.md` → `.agent/markos/MARKOS-INDEX.md`.
- Treat `.planning/STATE.md` as canonical project state; do not treat `.protocol-lore/STATE.md` as live state.
- Respect the GSD vs MarkOS split; do not mix MarkOS client overrides into `.mgsd-local`.
- Client overrides live only under `.markos-local/`.
- Primary CLI is `npx markos`.
- Test commands are `npm test` or `node --test test/**/*.test.js`.
- Local onboarding UI entrypoint is `node onboarding/backend/server.cjs`.

## Summary

Phase 40 should be implemented as a focused extension of the existing onboarding runtime, not a rewrite. The only runtime modules that need core behavior changes are `onboarding/backend/agents/orchestrator.cjs` and `onboarding/backend/vector-store-client.cjs`; the new routing logic belongs in a new pure module at `onboarding/backend/agents/discipline-router.cjs`. The current orchestrator still performs a single `Paid_Media` lookup with only a `business_model` filter, and the current vector client still lacks both exported `buildLiteracyFilter()` and any `pain_point_tags` filter support.

The largest planning risk is that the current workspace does not actually contain the Phase 39 artifacts that Phase 40 assumes. There is no checked-in `.agent/markos/literacy/taxonomy.json`, no literacy corpus, and the live `vector-store-client.cjs` does not match the planned Phase 39 end state. The Phase 40 planner therefore needs to decide explicitly whether to block on Phase 39 completion or to include a small compatibility fallback so Phase 40 can land safely against the repo as it exists today.

A second mismatch exists inside `40-CONTEXT.md` itself: the locked decision D-40-04 says the router must hard-floor to three disciplines, while the Done Definition still says the empty-signal fallback is `['Paid_Media']`. Those are not equivalent behaviors. The research below treats D-40-04 as the controlling decision, but the planner should resolve that contradiction before execution.

**Primary recommendation:** Implement a pure `rankDisciplines(seed)` router, extend `buildLiteracyFilter()` to accept `pain_point_tags: string[]` with OR semantics, refactor the orchestrator to run top-3 dual-query fetches in parallel, and add a minimal taxonomy fallback because the expected Phase 39 JSON artifact is missing in the current workspace.

## Exact Files And Functions To Change

| File | Current role | Required Phase 40 change | Confidence |
|------|--------------|--------------------------|------------|
| `onboarding/backend/agents/orchestrator.cjs` | Single-discipline literacy fetch before draft generation | Replace the block at the current literacy fetch site with router → top-3 selection → `Promise.all()` dual-query retrieval → dedupe/merge → cap trim → telemetry | HIGH |
| `onboarding/backend/vector-store-client.cjs` | Namespace building, literacy filter building, literacy retrieval | Export `buildLiteracyFilter()`, add `pain_point_tags CONTAINS ANY` support, preserve enough metadata for safe dedupe fallback | HIGH |
| `onboarding/backend/agents/discipline-router.cjs` | Does not exist | New pure routing module driven by seed channels + pain-point taxonomy | HIGH |
| `onboarding/onboarding-seed.schema.json` | Seed contract | No schema change required; use `content.active_channels` and `audience.pain_points` exactly as defined | HIGH |
| `.agent/markos/literacy/taxonomy.json` | Expected Phase 39 artifact | Consume if present; if absent, Phase 40 needs a compatibility fallback or an explicit block | MEDIUM |
| `test/vector-store-client.test.js` | Existing vector retrieval/filter coverage | Extend for exported filter helper and `pain_point_tags` OR clause behavior | HIGH |
| `test/onboarding-server.test.js` or new `test/orchestrator-literacy.test.js` | Existing onboarding and orchestrator coverage | Add focused multi-discipline orchestration tests; a new dedicated test file is cleaner and smaller-risk | MEDIUM |
| new `test/discipline-router.test.js` | Does not exist | Add ranking/fallback/router determinism tests | HIGH |

## Current State Findings

### Finding 1: The orchestrator still does a hardcoded single-discipline fetch
- Current code calls `vectorStore.getLiteracyContext('Paid_Media', ...)` with only `business_model` in the filter.
- Current query text is built from `product.name + audience.segment_name`.
- Current telemetry event is `literacy_context_observed`, not the required `literacy_retrieval_observed`.
- Current behavior writes `drafts.standards_context` only when hits exist, which is the correct empty-content degradation path to preserve.
- Source: `onboarding/backend/agents/orchestrator.cjs`.
- Confidence: HIGH.

### Finding 2: Phase 39 retrieval/filter changes are not present in the live code
- `buildLiteracyFilter()` is not exported from `module.exports`.
- `buildLiteracyFilter()` supports only `business_model`, `funnel_stage`, and `content_type`.
- `getLiteracyContext()` returns `{ text, metadata, score }`; this is enough for `metadata.doc_id` dedupe if the corpus is ingested correctly, but it does not expose `entry.id` for a stronger fallback key.
- There is no checked-in `pain_point_tags` logic in the live vector client.
- Source: `onboarding/backend/vector-store-client.cjs`.
- Confidence: HIGH.

### Finding 3: The routing inputs are real, but one milestone phrase is stale
- The live seed schema uses `content.active_channels`, not `content.primary_channels`.
- The live seed schema uses `audience.pain_points` as a free-text array with up to 3 values.
- `company.business_model` is present and should remain retrieval-only, not routing input, per D-40-01.
- Source: `onboarding/onboarding-seed.schema.json`.
- Confidence: HIGH.

### Finding 4: The expected taxonomy artifact is absent from the workspace
- No `.agent/markos/literacy/` tree exists.
- No `taxonomy.json` exists in the repo.
- Phase 39 planning documents define the intended taxonomy shape and values, so the contract can still be reconstructed.
- Source: workspace search plus `.planning/phases/39-pain-points-first-content-corpus/39-01-PLAN.md` and `.planning/phases/39-pain-points-first-content-corpus/39-RESEARCH.md`.
- Confidence: HIGH.

### Finding 5: Existing test infrastructure is sufficient
- The repo already uses Node built-in `node:test` and `node:assert/strict`.
- `test/setup.js` already provides `withMockedModule()`, which is enough to isolate the router, vector client, telemetry, and orchestrator in unit/integration tests.
- Existing tests already mock `vector-store-client.cjs` and `telemetry.cjs`, so Phase 40 does not need new test infrastructure.
- Confidence: HIGH.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js | `>=20.16.0` in `package.json`; local env `v22.13.0` | Runtime and test execution | Already required by the repo and available locally |
| `node:test` | built-in | Unit/integration tests | Existing repo standard; no new dependency |
| `onboarding/backend/agents/orchestrator.cjs` | repo-local | Runtime orchestration entrypoint | Existing retrieval injection point |
| `onboarding/backend/vector-store-client.cjs` | repo-local | Literacy retrieval + filter building | Existing single source of truth for vector retrieval |
| `onboarding/backend/agents/discipline-router.cjs` | new repo-local module | Seed-to-discipline ranking | Pure, testable seam for Phase 40 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `onboarding/backend/agents/telemetry.cjs` | repo-local | Emit retrieval telemetry | After final merged/capped context is computed |
| `test/setup.js` | repo-local | Module mocking helper | Router, vector, telemetry, and orchestrator tests |
| `.planning/config.json` | repo-local JSON config | Source of `literacy.max_context_chunks` | Read once per orchestration with default fallback to `6` |
| `.agent/markos/literacy/taxonomy.json` | expected Phase 39 artifact | Parent-tag to discipline mapping | Use when present; fall back if absent |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| New retrieval service module | Inline helpers inside `orchestrator.cjs` | Inline helpers are minimal and consistent with current repo style; a separate service is cleaner but unnecessary for this phase |
| Tokenizer dependency | Approximate token estimate from final text length | Approximation is sufficient for telemetry and avoids adding dependencies |
| AI-based routing | Deterministic lookup tables and keyword matching | Deterministic routing is easier to test and aligns with D-40-01 |

**Installation:**
```bash
npm install
```

**Version verification:**
- `package.json` requires Node `>=20.16.0`.
- Local environment check: Node `v22.13.0`, npm `10.9.2`.

## Architecture Patterns

### Recommended Project Structure
```text
onboarding/
├── backend/
│   ├── agents/
│   │   ├── orchestrator.cjs        # extend literacy retrieval flow
│   │   ├── telemetry.cjs           # existing telemetry sink
│   │   └── discipline-router.cjs   # new pure ranking module
│   ├── vector-store-client.cjs     # extend filter builder and result metadata contract
│   └── handlers.cjs                # no required Phase 40 change; optional admin filter pass-through only
└── onboarding-seed.schema.json     # seed contract used by router

test/
├── vector-store-client.test.js     # extend filter coverage
├── discipline-router.test.js       # new
└── orchestrator-literacy.test.js   # new focused integration file
```

### Pattern 1: Pure Discipline Router
**What:** `rankDisciplines(seed)` computes an ordered unique list from deterministic channel mappings plus pain-point boosts.

**When to use:** Always, before any literacy retrieval call inside `orchestrator.cjs`.

**Recommended public contract:**
```js
function rankDisciplines(seed) => string[]
```

**Recommended internal contract:**
```js
function scoreDisciplines(seed, taxonomy, options) => [{ discipline, score, reasons }]
```

**Why this split:** Public API stays aligned with locked scope. Internal scoring remains inspectable in tests without changing orchestration call sites.

### Pattern 2: Dual Query Per Discipline
**What:** For each of the top 3 disciplines, issue two queries in parallel:
1. filtered query: `{ business_model, pain_point_tags }`
2. universal query: `{ pain_point_tags }`

**When to use:** Always, because `business_model CONTAINS 'B2B'` excludes universal docs tagged `['all']` in the current filter model.

**Recommended call shape:**
```js
const [filteredHits, universalHits] = await Promise.all([
  vectorStore.getLiteracyContext(discipline, query, {
    business_model: businessModel,
    pain_point_tags: matchedPainTags,
  }, perQueryTopK),
  vectorStore.getLiteracyContext(discipline, query, {
    pain_point_tags: matchedPainTags,
  }, perQueryTopK),
]);
```

### Pattern 3: Score Normalization Before Merge
**What:** Normalize each raw hit into a richer internal shape before dedupe:
```js
{
  discipline,
  text,
  metadata,
  score,
  pain_point_match_count,
  effective_score,
  source_query: 'filtered' | 'universal'
}
```

**When to use:** Immediately after each query result set returns.

**Recommended score rule:**
- `pain_point_match_count = intersection(hit.metadata.pain_point_tags, matchedPainTags).length`
- `effective_score = score + Math.min(0.30, pain_point_match_count * 0.10)`

This preserves the raw semantic score and only adds a bounded pain-point relevance booster for merge/sort decisions.

### Pattern 4: Global Budget Trim After Merge
**What:** Merge all top-3 discipline hits, dedupe, sort by `effective_score DESC`, then take `max_context_chunks`.

**When to use:** After all per-discipline merges complete.

**Recommended config helper:**
```js
function getMaxLiteracyChunks() {
  // read `.planning/config.json`; default to 6 when missing/invalid
}
```

### Anti-Patterns to Avoid
- **Using `company.business_model` for router ranking:** contradicts D-40-01 and will make routing harder to reason about.
- **Per-discipline final caps before global merge:** this can bury better hits from lower-ranked disciplines and violates D-40-03.
- **Tokenizer dependency for telemetry only:** unnecessary complexity for a cap that is already chunk-count based.
- **Hard-failing when taxonomy JSON is absent:** current repo state would break Phase 40 immediately even though the orchestrator can still degrade safely.

## Router Contract And Mapping Recommendation

### Public Contract
```js
// onboarding/backend/agents/discipline-router.cjs
function rankDisciplines(seed) => string[]
```

### Inputs
- `seed.content.active_channels`
- `seed.audience.pain_points`
- Do not use `seed.company.business_model` for ranking.

### Discipline Set
- `Paid_Media`
- `Content_SEO`
- `Lifecycle_Email`
- `Social`
- `Landing_Pages`

### Recommended Channel Mapping
| Normalized channel token | Discipline |
|--------------------------|------------|
| `email`, `newsletter`, `drip`, `crm` | `Lifecycle_Email` |
| `seo`, `organic search`, `blog`, `content`, `search` | `Content_SEO` |
| `google ads`, `meta ads`, `facebook ads`, `linkedin ads`, `tiktok ads`, `ppc`, `paid search`, `paid social` | `Paid_Media` |
| `linkedin`, `instagram`, `tiktok`, `facebook`, `x`, `twitter`, `youtube`, `social` | `Social` |
| `landing page`, `cro`, `conversion`, `form`, `website`, `webinar page` | `Landing_Pages` |

### Recommended Parent-Tag Keyword Mapping
Use deterministic keyword buckets that map free-text pain points to the Phase 39 parent tags defined in planning docs:

| Parent tag | Example keywords | Disciplines from taxonomy |
|------------|------------------|---------------------------|
| `high_acquisition_cost` | `cac`, `cpl`, `cpa`, `cpr`, `roas`, `expensive leads`, `ad costs` | `Paid_Media`, `Content_SEO` |
| `low_conversions` | `conversion`, `cvr`, `form completion`, `checkout`, `landing page` | `Paid_Media`, `Landing_Pages` |
| `poor_retention_churn` | `churn`, `retention`, `unsubscribes`, `repeat purchase` | `Lifecycle_Email` |
| `low_organic_visibility` | `seo`, `rankings`, `organic traffic`, `search visibility` | `Content_SEO` |
| `attribution_measurement` | `attribution`, `tracking`, `measurement`, `analytics`, `utm` | `Paid_Media`, `Social` |
| `audience_mismatch` | `wrong audience`, `bad fit`, `irrelevant traffic`, `unqualified` | all 5 |
| `pipeline_velocity` | `stalled leads`, `pipeline`, `follow-up`, `nurture`, `mid funnel` | `Lifecycle_Email`, `Landing_Pages` |
| `content_engagement` | `engagement`, `shares`, `comments`, `reach`, `awareness` | `Social`, `Content_SEO` |

### Recommended Scoring
- Channel hit: `+4`
- Parent pain-point hit: `+2` to each mapped discipline
- Exact sub-tag phrase hit, if implemented later: `+3` to the owning discipline
- Tie-break order: `Paid_Media`, `Content_SEO`, `Lifecycle_Email`, `Social`, `Landing_Pages`
- Fill order when fewer than 3 non-zero disciplines exist: `Paid_Media`, `Content_SEO`, `Lifecycle_Email`
- Return up to 5 unique disciplines, but guarantee the first 3 are populated

### Taxonomy Loading Strategy
Use this priority order:
1. Load `.agent/markos/literacy/taxonomy.json` if present.
2. If absent, use an inline fallback constant that mirrors the Phase 39 planned taxonomy above.
3. Warn once, but do not fail submission.

This keeps Phase 40 resilient against the current repo state while remaining aligned with the planned taxonomy contract.

## Dual-Query Merge And Dedupe Recommendation

### Safe Merge Rule
For each discipline:
1. Fetch `filteredHits` and `universalHits` in parallel.
2. Normalize hits to include `effective_score` and `pain_point_match_count`.
3. Dedupe using this key priority:
   - `metadata.doc_id`
   - else `metadata.chunk_id`
   - else `${discipline}:${sha1(text)}` or equivalent stable text hash
4. Keep the entry with the higher `effective_score`.
5. Sort remaining hits by `effective_score DESC`.
6. Keep up to `perDisciplineTopK` before global merge.

### Why `doc_id` First
D-40-02 explicitly locks `doc_id` dedupe. The live chunk storage model is chunk-level, but ingested literacy chunks already carry `doc_id` and `chunk_id` in metadata when Phase 39 is implemented correctly.

### Important Tradeoff
`doc_id` dedupe collapses multiple sections from the same document to one surviving chunk. That is compliant with D-40-02, but it reduces document depth. If the planner wants multi-section coverage from a strong document, the locked decision should be revised to `chunk_id` dedupe for the dual-query merge. Until that decision changes, `doc_id` should remain the primary key.

### Recommended `getLiteracyContext()` Result Contract Change
Current return shape is:
```js
{ text, metadata, score }
```

Recommended return shape is:
```js
{ id, text, metadata, score }
```

This is a small improvement that gives the orchestrator a stronger fallback dedupe key without changing existing consumers.

## Context Token Telemetry Recommendation

### Recommended approximation
Use the final merged and capped `standards_context` text and estimate tokens as:
```js
Math.ceil(Buffer.byteLength(finalContextText, 'utf8') / 4)
```

### Why this is the right level of accuracy
- The actual retrieval budget in Phase 40 is chunk-count based, not token-enforced.
- Telemetry only needs a stable approximation for trend analysis.
- No tokenizer dependency is required.
- Byte-length divided by 4 is deterministic, cheap, and close enough for English marketing prose.

### Recommended semantics
- `disciplines_queried`: array of the 3 queried disciplines
- `total_hits`: deduped merged hit count before final cap
- `pain_point_match_count`: deduped merged hit count with `pain_point_match_count > 0` before final cap
- `context_tokens`: approximate token count of the final post-cap text assigned to `drafts.standards_context`

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Fuzzy AI routing | LLM classifier for disciplines | Deterministic alias tables + taxonomy keyword mapping | Testable, predictable, aligned with D-40-01 |
| Full tokenizer | Model-specific token counter | `Buffer.byteLength(text, 'utf8') / 4` estimate | Enough for telemetry, zero new deps |
| New retrieval client | Separate literacy service abstraction | Existing `vector-store-client.cjs` | The repo already centralizes vector access there |
| New config subsystem | Dedicated config loader package | Small local helper reading `.planning/config.json` | Minimal change, existing repo pattern |

**Key insight:** Phase 40 is mostly glue code and scoring logic. The root cause is not missing infrastructure; it is missing orchestration and one missing filter capability in the existing vector client.

## Runtime State Inventory

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | Existing Upstash literacy namespaces and Supabase `markos_literacy_chunks` rows are the runtime data Phase 40 reads. No Phase 40 data migration is required if rows already contain `doc_id`, `chunk_id`, `business_model`, and `pain_point_tags`. | Code edit only. If `pain_point_tags` or taxonomy-backed corpus is absent, that is an upstream Phase 39 remediation, not a Phase 40 migration. |
| Live service config | None found in repo-backed runtime flow. Retrieval behavior is code-driven, not UI-configured. | None. |
| OS-registered state | None. This phase does not rename services or install tasks. | None. |
| Secrets/env vars | Existing vector provider env vars (`SUPABASE_*`, `UPSTASH_VECTOR_*`) are reused unchanged. No secret key rename required. | None. |
| Build artifacts | None specific to this phase. No package rename or generated artifact rename is involved. | None. |

## Common Pitfalls

### Pitfall 1: Excluding universal docs by using only `business_model`
**What goes wrong:** The query retrieves only model-specific supplements and misses universal docs tagged `['all']`.
**Why it happens:** `buildLiteracyFilter()` currently emits `business_model CONTAINS 'B2B'`, which cannot match `all`.
**How to avoid:** Always run the dual-query pattern from D-40-02.
**Warning signs:** Good universal docs disappear whenever `business_model` is set.

### Pitfall 2: Trusting the repo to already contain Phase 39 artifacts
**What goes wrong:** Router startup fails on missing taxonomy JSON or retrieval never finds pain-point tags.
**Why it happens:** The planning docs assume artifacts that are not present in the current workspace.
**How to avoid:** Either block on Phase 39 completion or add an inline fallback taxonomy constant and log a warning.
**Warning signs:** `MODULE_NOT_FOUND` for taxonomy JSON; zero matched pain-point tags even when filters are supplied.

### Pitfall 3: Confusing seed schema field names
**What goes wrong:** Router reads `primary_channels` and never sees any channel signals.
**Why it happens:** The milestone text is stale; the live schema uses `active_channels`.
**How to avoid:** Code against `content.active_channels` only.
**Warning signs:** Router always falls back despite seeds containing channels.

### Pitfall 4: Over-deduping chunk-level results
**What goes wrong:** One strong document contributes only one chunk, reducing context depth.
**Why it happens:** Locked `doc_id` dedupe is applied to chunk-level retrieval results.
**How to avoid:** Keep `doc_id` as the primary key to honor D-40-02, but flag the tradeoff and retain `chunk_id` as fallback when `doc_id` is missing.
**Warning signs:** Final context repeatedly contains only definitions and loses tactics/benchmarks from the same document.

### Pitfall 5: Emitting telemetry before cap trimming
**What goes wrong:** `context_tokens` no longer reflects the actual prompt payload.
**Why it happens:** Telemetry captures pre-cap or pre-join state.
**How to avoid:** Emit telemetry only after final merged/capped context is computed.
**Warning signs:** Token telemetry rises while `standards_context` length stays fixed.

## Code Examples

Verified patterns from repo sources and locked decisions:

### Router + Orchestrator Flow
```js
const rankedDisciplines = rankDisciplines(seed).slice(0, 3);
const literacyQuery = [
  seed?.product?.name,
  seed?.audience?.segment_name,
  ...(Array.isArray(seed?.audience?.pain_points) ? seed.audience.pain_points : []),
].filter(Boolean).join(' ') || 'summary';

const mergedPerDiscipline = await Promise.all(
  rankedDisciplines.map((discipline) => fetchMergedDisciplineContext({
    discipline,
    query: literacyQuery,
    businessModel,
    matchedPainTags,
    perQueryTopK: maxContextChunks,
  }))
);

const mergedHits = dedupeAndSortGlobal(mergedPerDiscipline.flat()).slice(0, maxContextChunks);
const standardsContext = mergedHits.map((entry) => entry.text).join('\n\n');
```
Source: current orchestrator fetch shape in `onboarding/backend/agents/orchestrator.cjs` plus locked decisions D-40-01..04.

### `pain_point_tags` ANY Filter Builder
```js
function buildLiteracyFilter(filters = {}) {
  const parts = ["status = 'canonical'"];

  if (filters.business_model) {
    parts.push(`business_model CONTAINS '${escapeFilterValue(filters.business_model)}'`);
  }

  if (Array.isArray(filters.pain_point_tags) && filters.pain_point_tags.length > 0) {
    const clauses = filters.pain_point_tags
      .filter(Boolean)
      .map((tag) => `pain_point_tags CONTAINS '${escapeFilterValue(tag)}'`);
    if (clauses.length > 0) {
      parts.push(`(${clauses.join(' OR ')})`);
    }
  }

  return parts.join(' AND ');
}
```
Source: existing `buildLiteracyFilter()` pattern in `onboarding/backend/vector-store-client.cjs`.

### Approximate Token Count For Telemetry
```js
function approximateContextTokens(text) {
  return Math.ceil(Buffer.byteLength(String(text || ''), 'utf8') / 4);
}
```
Source: Phase 40 locked chunk-cap strategy plus current no-tokenizer repo design.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single hardcoded `Paid_Media` retrieval | Ranked top-3 multi-discipline retrieval | Phase 40 | Better context relevance across channel mix and pain points |
| Single filtered query by `business_model` | Dual query with filtered + universal merge | Phase 40 | Restores universal docs tagged `['all']` |
| One-off literacy event `literacy_context_observed` | Structured `literacy_retrieval_observed` telemetry | Phase 40 | Better observability for retrieval quality and budget |
| No pain-point filter in runtime client | `pain_point_tags CONTAINS ANY` filter support | Phase 40 or late Phase 39 fix | Enables deterministic pain-point relevance |

**Deprecated/outdated:**
- Hardcoded `Paid_Media` literacy fetch in `orchestrator.cjs`.
- Routing language that refers to `content.primary_channels`; the live schema uses `content.active_channels`.

## Open Questions

1. **Which empty-signal fallback is canonical?**
   - What we know: D-40-04 says hard-floor to `['Paid_Media', 'Content_SEO', 'Lifecycle_Email']`.
   - What's unclear: Done Definition still says `['Paid_Media']`.
   - Recommendation: Planner should treat D-40-04 as authoritative unless the user explicitly reverts to single-discipline fallback.

2. **Should Phase 40 block on missing Phase 39 artifacts or embed a fallback taxonomy?**
   - What we know: No `.agent/markos/literacy/taxonomy.json` exists in the current workspace.
   - What's unclear: Whether the planner may include a fallback constant without violating the dependency on Phase 39.
   - Recommendation: Include a fallback constant and a warning; do not let missing taxonomy crash submission.

3. **Should dual-query dedupe keep one chunk per doc or one chunk per duplicate chunk?**
   - What we know: D-40-02 locks `doc_id` dedupe, but the runtime stores chunk-level hits.
   - What's unclear: Whether losing multiple chunks from one document is acceptable.
   - Recommendation: Keep `doc_id` primary to honor the lock, but flag this as a quality tradeoff for planner review.

4. **Does Phase 40 also need to expose `pain_point_tags` in the admin query endpoint?**
   - What we know: `handleLiteracyQuery()` currently accepts only `business_model`, `funnel_stage`, and `content_type`.
   - What's unclear: Whether Phase 40 manual verification should be possible through `/admin/literacy/query`.
   - Recommendation: Optional but useful. If added, keep it small and backward compatible.

5. **How should telemetry counts be defined relative to cap trimming?**
   - What we know: The event fields are specified, but not whether counts are pre-cap or post-cap.
   - What's unclear: `total_hits` and `pain_point_match_count` semantics.
   - Recommendation: Use pre-cap deduped counts and post-cap `context_tokens`.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Runtime and tests | ✓ | `v22.13.0` | — |
| npm | Full suite command | ✓ | `10.9.2` | `node --test test/**/*.test.js` |

**Missing dependencies with no fallback:**
- None for code and test execution.

**Missing dependencies with fallback:**
- None identified for this phase. Live vector providers are not required for the recommended unit/integration test set because the repo already uses module mocks.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js built-in `node:test` + `node:assert/strict` |
| Config file | none |
| Quick run command | `node --test test/vector-store-client.test.js test/discipline-router.test.js test/orchestrator-literacy.test.js` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| P40-01 | Router ranks disciplines from `active_channels` and pain points | unit | `node --test test/discipline-router.test.js` | ❌ Wave 0 |
| P40-02 | Router hard-floor fills to 3 disciplines deterministically | unit | `node --test test/discipline-router.test.js` | ❌ Wave 0 |
| P40-03 | `buildLiteracyFilter()` supports `pain_point_tags` OR clause and is exported | unit | `node --test test/vector-store-client.test.js` | ✅ extend existing |
| P40-04 | Orchestrator runs top-3 dual-query retrieval and merges deduped results | integration | `node --test test/orchestrator-literacy.test.js` | ❌ Wave 0 |
| P40-05 | Global chunk cap from `.planning/config.json` is enforced | integration | `node --test test/orchestrator-literacy.test.js` | ❌ Wave 0 |
| P40-06 | Empty retrieval preserves current empty `standards_context` behavior | integration | `node --test test/orchestrator-literacy.test.js` | ❌ Wave 0 |
| P40-07 | Telemetry emits `literacy_retrieval_observed` with expected fields | integration | `node --test test/orchestrator-literacy.test.js` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `node --test test/vector-store-client.test.js test/discipline-router.test.js test/orchestrator-literacy.test.js`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `test/discipline-router.test.js` — router ranking, default fill, and deterministic tie-breaks
- [ ] `test/orchestrator-literacy.test.js` — top-3 orchestration, dual-query dedupe, empty fallback, cap enforcement, telemetry payload
- [ ] Extend `test/vector-store-client.test.js` — `pain_point_tags` OR filter and exported `buildLiteracyFilter`

## Smallest Recommended Test Set

1. `test/discipline-router.test.js`
   - channel-first ranking puts mapped disciplines first
   - pain-point boost can outrank a weaker channel-only discipline
   - empty/weak signals still fill to the required top-3 default order

2. `test/vector-store-client.test.js`
   - `buildLiteracyFilter({ pain_point_tags: ['a', 'b'] })` produces a parenthesized OR clause
   - `buildLiteracyFilter` is exported from the module

3. `test/orchestrator-literacy.test.js`
   - multi-discipline integration with mocked router + vector results
   - dual-query dedup keeps the higher-score copy
   - empty-content path leaves `drafts.standards_context` unset
   - chunk cap obeys `.planning/config.json` override or default `6`
   - telemetry event payload includes `disciplines_queried`, `total_hits`, `pain_point_match_count`, `context_tokens`

## Sources

### Primary (HIGH confidence)
- `onboarding/backend/agents/orchestrator.cjs` - current single-discipline retrieval flow and existing telemetry event
- `onboarding/backend/vector-store-client.cjs` - current filter builder, retrieval shape, and exports
- `onboarding/onboarding-seed.schema.json` - authoritative seed field names and routing inputs
- `.planning/phases/40-multi-discipline-orchestrator-retrieval/40-CONTEXT.md` - locked Phase 40 decisions and scope
- `.planning/milestones/v3.0-LITERACY-SYSTEM-ROADMAP.md` - milestone-level technical requirements and known gaps
- `test/setup.js` - existing test mocking infrastructure
- `package.json` - test commands and Node engine requirement

### Secondary (MEDIUM confidence)
- `.planning/phases/39-pain-points-first-content-corpus/39-RESEARCH.md` - planned taxonomy shape and Phase 39 end-state assumptions
- `.planning/phases/39-pain-points-first-content-corpus/39-01-PLAN.md` - exact planned `taxonomy.json` structure and intended `pain_point_tags` contract
- `test/onboarding-server.test.js` - current mocking patterns for orchestrator and handlers

### Tertiary (LOW confidence)
- None. This research is repo-internal and did not depend on unverified web sources.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - The runtime, test stack, and touched modules are all present and directly verifiable in the repo.
- Architecture: MEDIUM - The implementation shape is clear, but the live repo is missing the expected Phase 39 taxonomy and filter artifacts.
- Pitfalls: HIGH - The main risks come directly from verified code/planning mismatches and locked decision conflicts.

**Research date:** 2026-04-01
**Valid until:** 2026-04-08
