# Phase 93: Multi-Source Deep Research Orchestration - Research

**Researched:** 2026-04-14  
**Domain:** Adaptive multi-source research routing, evidence ranking, and safe synthesis  
**Confidence:** HIGH for repo findings and vendor guidance, MEDIUM for exact threshold tuning

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Phase 93 v1 should use adaptive staged escalation rather than blasting every provider in parallel by default.
- **D-02:** The orchestrator should start from internal approved knowledge, then expand outward only when the request actually needs fresher or broader evidence.
- **D-03:** The slower OpenAI deep research or extended synthesis path should run only for complex or high-value tasks, not for every request.
- **D-04:** Routine requests should stay on the lighter-weight path whenever the evidence need is already satisfied.
- **D-05:** When approved internal truth and fresh external evidence conflict, the system should flag contradictions explicitly rather than hiding them.
- **D-06:** Contradiction handling should present internal truth, external challenge, and confidence or freshness signals side by side.
- **D-07:** The default orchestration result should be a structured context pack plus a short summary, optimized for downstream patch previews and cross-client use.

### Claude's Discretion
- Exact routing heuristics and evidence sufficiency thresholds
- Ranking formulas and provider weighting behavior inside the approved contract
- Cache, retry, and timeout policy details
- Whether complexity scoring is request-driven, research-type-driven, or hybrid

### Deferred Ideas (OUT OF SCOPE)
- Running deep research or broad fan-out for every request is deferred.
- Blocking all synthesis whenever conflicts appear is deferred in favor of explicit contradiction reporting.
- Any direct artifact mutation or approval bypass remains out of scope for this phase.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DRT-02 | Merge literacy, MIR, MSP, overrides, and optional external evidence into one ranked context pack | Phase 93 should introduce a staged evidence composer that outputs one ranked pack with route trace and evidence classes |
| DRT-03 | Every synthesized finding carries lineage, freshness, confidence, and implication | The context pack should preserve per-claim provenance, timestamps, authority class, and downstream implication |
| DRT-08 | Operators can inspect the active filter stack, evidence sources, and proposed artifact deltas | The orchestration result should expose active filters, providers used, conflict flags, and summary warnings |
| DRT-09 | Deep research runs are auditable and safe | Route trace, provider attempts, contradiction visibility, and no-write posture keep the system reviewable |
| DRT-11 | Support pluggable provider routing with fallback | The planner should implement stage-based provider adapters separate from generic model fallback |
| DRT-13 | External connectors preserve citations, freshness metadata, domain allow-lists, and audit records | Tavily, Firecrawl, and OpenAI paths should all normalize into one evidence schema |
| DRT-15 | Every research mode has a defined routing policy | Complexity scoring and research-type policy should decide whether escalation is internal-only, light external, or deep research |
| DRT-16 | Consistent command surfaces across MCP, API, CLI, and editor workflows | The response should stay portable: context pack + short summary + warnings + route trace |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- Treat `.planning/STATE.md` as the canonical live planning state.
- Keep this phase planning-oriented around the existing MarkOS runtime; do not invent a parallel platform.
- The work here is orchestration and evidence routing only, not artifact mutation or approval bypass.
- Nyquist validation is enabled, so the planner should include a clean test slice from Wave 0.
- Standard repo verification remains `node --test test/**/*.test.js` or `npm test`.

## Summary

MarkOS already has the main building blocks for Phase 93: internal approved retrieval with provenance, external Tavily enrichment hooks, robust model fallback telemetry, and a newly locked internal MCP-first posture from Phases 91 and 92. The missing capability is a **research router** that decides how much evidence to gather, from where, and when to stop.

The safest v1 is a **staged escalation pipeline**: start with approved internal evidence, measure sufficiency, then selectively expand to Tavily or Firecrawl only if the query truly needs fresher or more structured web data. Reserve OpenAI web search or deep research for unresolved, complex, or high-value tasks, and normalize everything into one ranked `context_pack` plus a short operator-facing summary.

**Primary recommendation:** Build Phase 93 as a selective evidence router with explicit conflict surfacing and graceful degraded outputs, not as a broad fan-out search engine.

## 1) Research Question

What should MarkOS orchestrate, in what order, and with what safety rules so that local retrieval, Tavily, Firecrawl, and OpenAI web/deep research combine into one auditable, ranked research pipeline without wasting cost, hiding contradictions, or bypassing approval boundaries?

## 2) Key Findings from Current Codebase

1. **Internal approved retrieval already exists and is provenance-aware.**  
   `getLiteracyContext()` in `onboarding/backend/vector-store-client.cjs` builds a normalized retrieval envelope with `provenance_required: true`, canonical-only filtering, and filter-aware ranking.

2. **The current orchestration code already models rank-and-dedupe behavior.**  
   `onboarding/backend/agents/orchestrator.cjs` queries filtered and broad hits, deduplicates them, and sorts by priority/effective score. Phase 93 should extend this pattern from internal retrieval to multi-source evidence.

3. **Tavily is already the repo’s natural fast external evidence layer.**  
   `onboarding/backend/scrapers/tavily-scraper.cjs` and `onboarding/backend/enrichers/competitor-enricher.cjs` already use Tavily for search/scrape enrichment and return degraded outcomes instead of hard failing.

4. **Generic LLM fallback already has telemetry, but it is not the research router.**  
   `lib/markos/llm/adapter.ts` and `fallback-chain.ts` capture provider attempts, fallback reasons, and final provider choice. This is useful for Phase 93 telemetry, but evidence routing must remain a separate policy layer.

5. **The current OpenAI path is still a generic completion wrapper.**  
   `lib/markos/llm/providers/openai.ts` currently uses chat completions, not the Responses API tool stack. Planning should assume a dedicated research adapter is needed for web search and deep research.

6. **Admin query endpoints are patterns, not the final cross-client surface.**  
   `handleLiteracyQuery()` in `onboarding/backend/handlers.cjs` is explicitly admin-secret gated, which reinforces that Phase 93 should orchestrate safe provider layers rather than expose unsafe internals directly.

## Standard Stack

### Core
| Layer | Recommendation | Why Standard for this repo |
|------|----------------|----------------------------|
| Internal evidence | Existing MarkOS retrieval and Phase 92 MCP search/fetch surface | Already authoritative, filter-aware, and tenant-safe |
| Fast web enrichment | Tavily search/extract via direct HTTP | Already present in repo and suited for fresh discovery |
| Structured crawl | Firecrawl scrape on selected URLs only | Strong for markdown, JSON extraction, branding, and site structure |
| Deep external synthesis | OpenAI Responses API with web search / deep research | Officially supports long-running cited research with web, file search, and MCP |
| Telemetry/fallback | Existing LLM adapter telemetry pattern | Reuse `fallbackReasons`, attempt traces, and degraded-result posture |

### Supporting
| Concern | Recommendation | When to Use |
|--------|----------------|-------------|
| Caching | Request/URL-level cache with freshness TTL | Repeat company/domain lookups and structured scrapes |
| Domain safety | Allow-list / deny-list in provider policies | Sensitive or client-specific research lanes |
| Complexity scoring | Lightweight request classifier before deep escalation | Decide whether internal-only, light external, or deep research path is justified |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Staged escalation | Broad provider fan-out | Faster coverage in rare cases, but violates locked cost/noise posture |
| Dedicated research router | Reusing generic LLM fallback as router | Simpler initially, but confuses provider reliability with evidence authority |
| Firecrawl on every domain | Tavily-only or targeted Firecrawl | Firecrawl gives richer structure but costs more and should stay selective |

## Architecture Patterns

### Recommended orchestration flow

```text
1. classify request + risk + complexity
2. retrieve internal approved evidence first
3. score evidence sufficiency
4. if needed, run targeted Tavily search
5. if needed, run Firecrawl on selected URLs/pages
6. only if still unresolved or high-value, run OpenAI web/deep research
7. merge, rank, dedupe, and flag contradictions
8. return context pack + short summary + route trace
```

### Pattern 1: Adaptive staged escalation
**What:** A gate-based pipeline that earns more expensive or slower providers only when earlier stages do not satisfy the evidence need.

**When to use:** Always as the default orchestration mode for v1.

**Why:** This matches the locked phase context and OpenAI’s own safety guidance to stage public-web research and private/internal access carefully.

### Pattern 2: Internal-first grounding
**What:** Approved MarkOS knowledge is retrieved before any external call and remains the baseline truth layer.

**When to use:** All requests, especially anything tied to MIR/MSP patch previews.

**Why:** Phase 91 and 92 already lock internal authority, and the repo’s current retrieval system is designed around canonical artifacts and provenance.

### Pattern 3: Selective structured extraction
**What:** Firecrawl should run only for named domains/pages that need richer structure, branding metadata, or targeted page extraction.

**When to use:** Company-intelligence, site-refresh, positioning, and branding-related research tasks.

**Why:** Official Firecrawl docs show structured JSON, branding extraction, cache controls, and per-page credit implications; this is valuable but too expensive for default fan-out.

### Routing stages to plan

| Stage | Purpose | Default exit condition | Escalates when |
|------|---------|------------------------|----------------|
| 0. classify | detect research type, sensitivity, and complexity | task labeled and scoped | request unclear or high ambiguity |
| 1. internal grounding | pull approved internal evidence | sufficient evidence found | freshness gap, low confidence, or missing coverage |
| 2. external quick search | Tavily search/discovery | supporting evidence gathered | company/site detail still unclear |
| 3. structured extraction | Firecrawl on chosen URLs | page-level facts captured | richer structure or branding needed |
| 4. deep synthesis | OpenAI web search or deep research | cited synthesis complete | task is complex/high-value and still unresolved |
| 5. pack assembly | rank evidence, flag conflicts, summarize | return context pack | never auto-write in this phase |

## Code Examples

### Recommended router skeleton

```ts
async function buildResearchPack(request) {
  const trace = [];
  const internal = await queryInternalEvidence(request);
  trace.push({ stage: 'internal', status: 'used', count: internal.length });

  if (isSufficient(internal, request)) {
    return assemblePack({ internal, external: [], trace, degraded: false });
  }

  const tavily = await maybeSearchTavily(request);
  trace.push({ stage: 'tavily', status: tavily.used ? 'used' : 'skipped' });

  const firecrawl = shouldUseFirecrawl(request, tavily)
    ? await scrapeSelectedPages(request, tavily)
    : [];
  trace.push({ stage: 'firecrawl', status: firecrawl.length ? 'used' : 'skipped' });

  const deep = shouldUseDeepResearch(request, internal, tavily, firecrawl)
    ? await runDeepResearchInBackground(request)
    : null;
  trace.push({ stage: 'openai_deep', status: deep ? 'used' : 'skipped' });

  return assemblePack({ internal, external: [tavily, firecrawl, deep], trace, degraded: false });
}
```

### Recommended output shape

```json
{
  "context_pack": {
    "summary": "Short synthesis for downstream planning or patch preview.",
    "claims": [],
    "conflicts": [],
    "warnings": [],
    "route_trace": []
  }
}
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Multi-hop public web search | A custom crawler/search engine | Tavily and OpenAI web search | Already handle search, citations, and fresh discovery |
| Structured site extraction | HTML parsing heuristics for every site | Firecrawl scrape/JSON/branding modes | Better support for dynamic pages and structured outputs |
| Internal grounding store | A new private knowledge store | Existing retrieval layer + Phase 92 MCP search/fetch | Provenance and tenancy already exist |
| Deep synthesis orchestration | One giant prompt with all tools always on | Stage-based routing with provider policy | Safer, cheaper, and aligned with vendor guidance |
| Conflict visibility | Hidden heuristic overrides | Explicit contradiction objects in the context pack | Prevents authority confusion and review blind spots |

**Key insight:** The hard problem here is not “finding more sources”; it is deciding when enough evidence exists and how to preserve authority, freshness, and contradictions without over-spending or over-fetching.

## 4) Conflict Handling and Evidence Ranking Implications

### Recommended evidence classes

| Rank tier | Evidence class | Default authority | Typical source |
|----------|----------------|-------------------|----------------|
| 1 | `approved_internal` | highest | internal vault, approved MIR/MSP, approved evidence packs |
| 2 | `internal_recent` | high | recently updated internal retrieval hits with provenance |
| 3 | `external_official` | medium-high challenger | vendor docs, company site, regulator pages |
| 4 | `external_secondary` | medium | credible third-party analysis or market commentary |
| 5 | `synthesized_inference` | derived only | model summary from cited evidence |

### Conflict rules to lock

1. **Never silently override approved internal truth.**  
   External evidence can challenge it, but not replace it automatically.

2. **Contradictions should be a first-class output.**  
   Each contradiction should include:
   - internal claim
   - external claim
   - freshness comparison
   - confidence/authority comparison
   - recommended operator action

3. **Synthesis must cite both sides.**  
   OpenAI’s current web/deep research guidance emphasizes visible inline citations and source lists; the MarkOS context pack should preserve source metadata even when the short summary is concise.

4. **Freshness should influence review priority, not authority on its own.**  
   A newer external claim should raise a `review_required` flag, not auto-win.

### Recommended contradiction payload

```json
{
  "kind": "contradiction",
  "topic": "positioning",
  "internal_claim": "Approved MIR says SMB-first",
  "external_claim": "Current site messaging emphasizes enterprise RevOps",
  "freshness": {
    "internal": "2026-03-28",
    "external": "2026-04-14"
  },
  "recommendation": "surface in patch preview; require review"
}
```

## 5) Latency, Cost, and Fallback Implications

### Stage economics

| Stage | Latency profile | Cost profile | Planning implication |
|------|-----------------|--------------|----------------------|
| Internal retrieval | lowest | lowest | default starting point on every request |
| Tavily basic/fast search | low to medium | low | use for most freshness checks and competitor discovery |
| Tavily advanced | medium | higher than basic | reserve for harder searches where snippet quality matters |
| Firecrawl targeted scrape | medium | per-page credit cost, extra for JSON/branding | only scrape selected URLs, not the whole web by default |
| OpenAI deep research | high, potentially minutes | highest | only for complex/high-value tasks and preferably in background mode |

### Important vendor-guided implications

- OpenAI’s current deep research docs explicitly recommend **background mode** for long-running research and support web search, file search, and remote MCP servers in the Responses API.
- OpenAI also recommends **phased workflows** when mixing public web access and sensitive internal data, which strongly supports the user’s locked staged-escalation preference.
- Tavily exposes `search_depth`, `include_raw_content`, domain inclusion/exclusion, and usage metadata, so the planner should treat it as the **fast search layer** rather than the final synthesis layer.
- Firecrawl supports structured scrape formats, cache controls, and batch modes, but each scrape consumes credits, so it should remain **targeted** and cache-aware.

### Fallback posture

The repo already prefers graceful degradation. Phase 93 should preserve that behavior:

- If internal retrieval succeeds but external providers are unavailable, return an internal-only context pack with warnings.
- If Tavily fails, skip to either internal-only or Firecrawl/OpenAI if policy allows.
- If Firecrawl fails, continue with search snippets only.
- If OpenAI deep synthesis is unavailable, return ranked evidence plus a lightweight summary instead of failing the full request.

## Common Pitfalls

### Pitfall 1: Broad fan-out by default
**What goes wrong:** Every provider is called on every request, producing noise, latency, and unnecessary cost.  
**How to avoid:** Make each stage earn the next one through evidence sufficiency checks.

### Pitfall 2: Authority inversion
**What goes wrong:** Fresh web evidence silently overwrites approved internal knowledge.  
**How to avoid:** Separate authority from freshness and always emit contradiction objects.

### Pitfall 3: Treating model fallback as evidence routing
**What goes wrong:** A generic provider retry chain is mistaken for a research orchestration policy.  
**How to avoid:** Keep route policy, evidence ranking, and LLM failover as distinct concerns.

### Pitfall 4: Unsafe internal+web blending
**What goes wrong:** Sensitive internal context is mixed with untrusted web content in one uncontrolled loop.  
**How to avoid:** Follow OpenAI’s staged safety guidance, use trusted MCP sources, and validate tool arguments.

### Pitfall 5: Overusing deep research
**What goes wrong:** Every request becomes a long-running task even when internal evidence already answers it.  
**How to avoid:** Require complexity/high-value thresholds before invoking the slow path.

## 6) Planning Implications / Tasks the Planner Should Create

### Wave 0: routing contract and safety
1. Define the research-router request and response contract, including `context_pack`, `short_summary`, `warnings`, and `route_trace`.
2. Define the evidence schema with authority, freshness, confidence, lineage, and contradiction fields.
3. Define complexity scoring and evidence-sufficiency gates for escalation decisions.

### Wave 1: provider adapters
4. Build an internal provider wrapper over Phase 92 search/fetch and current retrieval primitives.
5. Add a Tavily adapter that normalizes search results, request IDs, usage, and raw-content snippets.
6. Add a Firecrawl adapter for targeted page scrape and structured extraction only.
7. Add an OpenAI Responses research adapter for web search and optional deep research background jobs.

### Wave 2: merge/rank/summarize
8. Build a ranked evidence composer that deduplicates claims across sources and preserves citations.
9. Add explicit contradiction detection and a review-friendly conflict payload.
10. Emit the default structured context pack plus short summary output optimized for downstream patch previews.

### Wave 3: observability and resilience
11. Reuse fallback telemetry patterns to record provider attempts, skips, degradations, latency, and cost signals.
12. Add cache, timeout, and retry rules per provider so the router remains selective and predictable.
13. Add allow-list and safety controls for external domains and any sensitive research modes.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | local orchestration runtime | ✓ | 22.13.0 | — |
| npm | validation/test workflow | ✓ | 10.9.2 | — |
| OPENAI_API_KEY | OpenAI web/deep research path | ✗ | — | internal-only or Tavily-only path |
| TAVILY_API_KEY | fast external search layer | ✗ | — | internal-only path |
| FIRECRAWL_API_KEY | structured crawl layer | ✗ | — | skip scrape stage |

**Missing dependencies with no fallback:**
- None for planning. Implementation can still proceed with degraded internal-only validation.

**Missing dependencies with fallback:**
- OpenAI, Tavily, and Firecrawl credentials are not configured in the current environment, so the planner should include internal-only and provider-disabled test coverage.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node built-in test runner |
| Config file | none required |
| Quick run command | `node --test test/phase-93/*.test.js test/llm-adapter/fallback-chain.test.js test/phase-84/provider-trace-contract.test.js test/phase-86/retrieval-filter.test.js test/phase-88/tenant-isolation-matrix.test.js` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DRT-02 | staged pipeline returns one ranked context pack from mixed sources | unit/integration | `node --test test/phase-93/orchestration-pipeline.test.js` | ❌ Wave 0 |
| DRT-03 | every claim includes lineage, freshness, confidence, and implication | contract | `node --test test/phase-93/evidence-lineage-contract.test.js` | ❌ Wave 0 |
| DRT-08 | output exposes filters, sources, route trace, and warnings | contract | `node --test test/phase-93/context-pack-shape.test.js` | ❌ Wave 0 |
| DRT-09 | degraded provider states still return safe output | resilience | `node --test test/phase-93/degraded-fallback.test.js` | ❌ Wave 0 |
| DRT-11 | provider routing obeys internal-first staged escalation | policy | `node --test test/phase-93/routing-policy.test.js` | ❌ Wave 0 |
| DRT-13 | Tavily/Firecrawl/OpenAI results normalize citations and metadata | integration/contract | `node --test test/phase-93/provider-normalization.test.js` | ❌ Wave 0 |
| DRT-15 | complexity policy decides light vs deep path correctly | unit | `node --test test/phase-93/complexity-thresholds.test.js` | ❌ Wave 0 |
| DRT-16 | output remains portable across MCP/API/CLI/editor surfaces | contract | `node --test test/phase-93/cross-surface-envelope.test.js` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** run the relevant phase-93 contract tests
- **Per wave merge:** run phase-93 tests plus fallback-chain, retrieval-filter, and tenant-isolation suites
- **Phase gate:** full `npm test` green before verification

### Wave 0 Gaps
- [ ] `test/phase-93/orchestration-pipeline.test.js`
- [ ] `test/phase-93/evidence-lineage-contract.test.js`
- [ ] `test/phase-93/context-pack-shape.test.js`
- [ ] `test/phase-93/degraded-fallback.test.js`
- [ ] `test/phase-93/routing-policy.test.js`
- [ ] `test/phase-93/provider-normalization.test.js`
- [ ] `test/phase-93/complexity-thresholds.test.js`
- [ ] `test/phase-93/cross-surface-envelope.test.js`

## 7) Short Recommendation

Plan Phase 93 as a **safe, adaptive research router** with this default posture:

- internal evidence first
- selective external enrichment second
- deep research only when complexity or value justifies it
- explicit contradiction surfacing always
- structured context pack + short summary as the default output

This keeps the phase aligned with the locked decisions, current repo patterns, and the vendor guidance for safe multi-source research.

## Sources

### Primary (HIGH confidence)
- `.planning/phases/93-multi-source-deep-research-orchestration/93-CONTEXT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/STATE.md`
- `.planning/research/v3.6.0-deep-research-tailoring-brief.md`
- `.planning/research/v3.6.0-research-task-framework.md`
- `.planning/phases/91-filter-taxonomy-and-provider-contract/91-CONTEXT.md`
- `.planning/phases/91-filter-taxonomy-and-provider-contract/91-RESEARCH.md`
- `.planning/phases/92-markos-company-knowledge-mcp-surface/92-CONTEXT.md`
- `.planning/phases/92-markos-company-knowledge-mcp-surface/92-RESEARCH.md`
- `lib/markos/llm/adapter.ts`
- `lib/markos/llm/fallback-chain.ts`
- `lib/markos/llm/providers/openai.ts`
- `onboarding/backend/scrapers/tavily-scraper.cjs`
- `onboarding/backend/enrichers/competitor-enricher.cjs`
- `onboarding/backend/handlers.cjs`
- `onboarding/backend/vector-store-client.cjs`
- `onboarding/backend/agents/orchestrator.cjs`

### Vendor docs (HIGH confidence)
- OpenAI web search guide: https://developers.openai.com/api/docs/guides/tools-web-search
- OpenAI deep research guide: https://developers.openai.com/api/docs/guides/deep-research
- OpenAI background mode guide: https://developers.openai.com/api/docs/guides/background
- Tavily search docs: https://docs.tavily.com/documentation/api-reference/endpoint/search
- Firecrawl scrape docs: https://docs.firecrawl.dev/features/scrape

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — strongly supported by the existing repo plus official provider docs
- Architecture: HIGH — directly aligned with the locked staged-escalation decisions and safety guidance
- Threshold tuning: MEDIUM — exact heuristics for complexity, sufficiency, and ranking should be decided during planning

**Research date:** 2026-04-14  
**Valid until:** 2026-05-14
