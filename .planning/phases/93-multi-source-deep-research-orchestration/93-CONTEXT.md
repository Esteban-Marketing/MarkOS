# Phase 93: Multi-Source Deep Research Orchestration - Context

**Gathered:** 2026-04-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Merge local retrieval, Tavily search and extraction, OpenAI web search or deep research, and Firecrawl structured crawl results into one ranked research pipeline. This phase defines how multi-source evidence is orchestrated and combined; it does not directly write artifacts or bypass approval workflows.

</domain>

<decisions>
## Implementation Decisions

### Orchestration behavior
- **D-01:** Phase 93 v1 should use adaptive staged escalation rather than blasting every provider in parallel by default.
- **D-02:** The orchestrator should start from internal approved knowledge, then expand outward only when the request actually needs fresher or broader evidence.

### Deep research trigger policy
- **D-03:** The slower OpenAI deep research or extended synthesis path should run only for complex or high-value tasks, not for every request.
- **D-04:** Routine requests should stay on the lighter-weight path whenever the evidence need is already satisfied.

### Conflict handling
- **D-05:** When approved internal truth and fresh external evidence conflict, the system should flag contradictions explicitly rather than hiding them.
- **D-06:** Contradiction handling should present internal truth, external challenge, and confidence or freshness signals side by side.

### Default output shape
- **D-07:** The default orchestration result should be a structured context pack plus a short summary, optimized for downstream patch previews and cross-client use.

### the agent's Discretion
- Exact routing heuristics and evidence sufficiency thresholds
- Ranking formulas and provider weighting behavior inside the approved contract
- Cache, retry, and timeout policy details
- Whether complexity scoring is request-driven, research-type-driven, or hybrid

</decisions>

<specifics>
## Specific Ideas

- The orchestrator should feel smart and selective, not noisy or wasteful.
- High-cost deep synthesis should be earned by the task, not triggered by default.
- Contradictions should be visible and useful for operators reviewing evidence-backed changes.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone and upstream contract
- `.planning/REQUIREMENTS.md` — DRT-02, DRT-03, DRT-08, DRT-09, DRT-11, DRT-13, DRT-15, and DRT-16 define the orchestration scope.
- `.planning/research/v3.6.0-deep-research-tailoring-brief.md` — milestone framing and v3.6 phase sequence.
- `.planning/research/v3.6.0-research-task-framework.md` — provider routing model and recommended research-task execution strategy.
- `.planning/phases/91-filter-taxonomy-and-provider-contract/91-CONTEXT.md` — upstream routing order and universal JSON contract decisions.
- `.planning/phases/92-markos-company-knowledge-mcp-surface/92-CONTEXT.md` — the internal read-only knowledge layer Phase 93 should orchestrate around.

### Existing provider and retrieval surfaces
- `lib/markos/llm/adapter.ts` — provider fallback and telemetry pattern for model calls.
- `onboarding/backend/scrapers/tavily-scraper.cjs` — existing external search and scrape entry point.
- `onboarding/backend/enrichers/competitor-enricher.cjs` — current external enrichment path and graceful degradation pattern.
- `onboarding/backend/handlers.cjs` — current read/query and enrichment flows that can anchor orchestration behavior.
- `onboarding/backend/vector-store-client.cjs` — internal retrieval primitives and existing filter-aware query behavior.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- MarkOS already has internal retrieval, provider adapters, and Tavily-based enrichment hooks that can be orchestrated rather than replaced.
- The LLM adapter already models provider fallback and telemetry, giving Phase 93 a pattern for execution tracing.
- The Phase 92 knowledge surface work establishes a clean internal-first grounding layer for orchestration.

### Established Patterns
- Internal approved evidence remains authoritative, with external sources used for enrichment and freshness.
- Graceful degradation is preferred when optional providers are unavailable.
- Cross-client output should stay portable and structured rather than tuned to one interface.

### Integration Points
- Phase 93 should sit on top of the Phase 91 contract and the Phase 92 internal knowledge layer.
- The orchestration result must feed later delta-preview and evaluation phases without redefining the response contract.
- Contradiction reporting and route trace data should flow forward into review and governance surfaces.

</code_context>

<deferred>
## Deferred Ideas

- Running deep research or broad fan-out for every request is deferred.
- Blocking all synthesis whenever conflicts appear is deferred in favor of explicit contradiction reporting.
- Any direct artifact mutation or approval bypass remains out of scope for this phase.

</deferred>

---

*Phase: 93-multi-source-deep-research-orchestration*
*Context gathered: 2026-04-14*
