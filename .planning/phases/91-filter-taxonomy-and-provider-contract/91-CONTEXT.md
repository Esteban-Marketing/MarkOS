# Phase 91: Filter Taxonomy and Provider Contract - Context

**Gathered:** 2026-04-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Define the canonical deep-research request contract for MarkOS by locking the v1 filter taxonomy, provider routing order, allowed evidence posture, and output envelope. This phase clarifies how research requests are shaped and handed off; it does not yet implement full multi-source orchestration or automatic artifact mutation.

</domain>

<decisions>
## Implementation Decisions

### Canonical filter taxonomy
- **D-01:** Phase 91 v1 must require the core profile filters: industry, company, audience, and offer/product.
- **D-02:** The contract must remain extensible so later phases can add strategy, geography, compliance, and other contextual layers without breaking the v1 schema.

### Provider contract and fallback order
- **D-03:** Default provider sequence is internal MarkOS vault/MCP first, then Tavily/Firecrawl for fresh external evidence, then OpenAI for synthesis.
- **D-04:** Internal approved knowledge remains authoritative; external sources enrich and update context but should not silently override approved internal truth.

### Tailoring and approval posture
- **D-05:** v1 should produce patch previews for Literacy, MIR, and MSP updates rather than directly mutating artifacts.
- **D-06:** Human approval is required before any write path is enabled.

### Canonical command surface
- **D-07:** The primary v1 contract should be a universal JSON request/response schema that works across Copilot, Claude Code, Cursor, CLI, and future API clients.

### the agent's Discretion
- Exact JSON field names and nesting for the request envelope
- Scoring or weighting heuristics used internally to rank evidence
- Telemetry and observability fields added to support later evaluation

</decisions>

<specifics>
## Specific Ideas

- One normalized request object should travel across all supported client surfaces.
- Research responses should be evidence-backed and ready to drive operator-visible patch previews.
- The output envelope should be able to carry citations, freshness metadata, confidence, and proposed artifact deltas.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone and requirement scope
- `.planning/REQUIREMENTS.md` — DRT-01 through DRT-16 define the deep research milestone scope.
- `.planning/research/v3.6.0-deep-research-tailoring-brief.md` — milestone goal, provider strategy, and initial phase sequence.
- `.planning/research/v3.6.0-research-task-framework.md` — research taxonomy, provider routing model, and cross-client command surface guidance.

### Existing runtime surfaces
- `onboarding/backend/handlers.cjs` — current literacy query and enrichment endpoints that already expose early filter behavior.
- `lib/markos/llm/adapter.ts` — provider fallback adapter and telemetry handoff pattern.
- `onboarding/backend/scrapers/tavily-scraper.cjs` — Tavily-backed domain scrape path for company intelligence.
- `onboarding/backend/enrichers/competitor-enricher.cjs` — external competitor and market enrichment flow.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `handleLiteracyQuery` already supports filter inputs such as `business_model`, `funnel_stage`, and `content_type`; the new taxonomy should extend this pattern rather than replace it.
- `lib/markos/llm/adapter.ts` already centralizes provider dispatch and fallback behavior across Anthropic, OpenAI, and Gemini.
- Tavily integrations already exist for domain scrape and competitor discovery, providing a natural external evidence layer.

### Established Patterns
- MarkOS prefers graceful fallback behavior over hard failure when optional providers are unavailable.
- Retrieval and governance work in earlier milestones already emphasize auditable evidence, deterministic contracts, and operator approval.

### Integration Points
- Phase 91 should produce a filter and provider contract that plugs into literacy retrieval, artifact generation, and future MCP client surfaces.
- The contract must be compatible with later Phase 92-95 work without forcing client-specific schemas.

</code_context>

<deferred>
## Deferred Ideas

- Auto-applying low-risk artifact changes without explicit approval is deferred to a later phase.
- Mandatory non-core filter families such as compliance or geography are deferred until the broader research contract expansion work.

</deferred>

---

*Phase: 91-filter-taxonomy-and-provider-contract*
*Context gathered: 2026-04-14*
