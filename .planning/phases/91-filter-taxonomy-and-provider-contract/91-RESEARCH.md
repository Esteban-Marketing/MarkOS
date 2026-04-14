# Phase 91: Filter Taxonomy and Provider Contract - Research

**Researched:** 2026-04-13  
**Domain:** Deep research request contract, evidence posture, and provider routing  
**Confidence:** HIGH for codebase findings, MEDIUM for future contract fit

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Phase 91 v1 must require the core profile filters: industry, company, audience, and offer/product.
- **D-02:** The contract must remain extensible so later phases can add strategy, geography, compliance, and other contextual layers without breaking the v1 schema.
- **D-03:** Default provider sequence is internal MarkOS vault/MCP first, then Tavily/Firecrawl for fresh external evidence, then OpenAI for synthesis.
- **D-04:** Internal approved knowledge remains authoritative; external sources enrich and update context but should not silently override approved internal truth.
- **D-05:** v1 should produce patch previews for Literacy, MIR, and MSP updates rather than directly mutating artifacts.
- **D-06:** Human approval is required before any write path is enabled.
- **D-07:** The primary v1 contract should be a universal JSON request/response schema that works across Copilot, Claude Code, Cursor, CLI, and future API clients.

### Claude's Discretion
- Exact JSON field names and nesting for the request envelope
- Scoring or weighting heuristics used internally to rank evidence
- Telemetry and observability fields added to support later evaluation

### Deferred Ideas (OUT OF SCOPE)
- Auto-applying low-risk artifact changes without explicit approval is deferred to a later phase.
- Mandatory non-core filter families such as compliance or geography are deferred until the broader research contract expansion work.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DRT-01 | Single query model supports filter composition | Lock a universal envelope with required v1 core filters and extensible filter groups |
| DRT-03 | Findings carry lineage, freshness, confidence, implication | Response envelope includes evidence array, freshness, confidence, and implications |
| DRT-08 | Operators can inspect filter stack, evidence, proposed deltas | Response includes active filters, route trace, and patch preview |
| DRT-11 | Pluggable provider routing with fallback | Define stage-based routing order separate from raw LLM fallback |
| DRT-12 | Read-only MCP-compatible company knowledge surface | Contract assumes internal vault/MCP search/fetch as first-class sources |
| DRT-13 | External connectors preserve citations and freshness | Tavily/Firecrawl outputs remain evidence records, not freeform text |
| DRT-15 | Research modes have defined routing and update permissions | Phase 91 locks the envelope and allowed write posture for later mode-specific phases |
| DRT-16 | Consistent command surfaces across MCP, API, CLI, editors | Plain JSON request/response contract becomes the canonical surface |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- Treat `.planning/STATE.md` as the canonical live planning state.
- Use existing MarkOS runtime and planning patterns; do not invent a parallel workflow.
- Keep this phase planning-only. No orchestration build-out and no automatic artifact mutation.
- Tests and verification remain expected in later implementation phases because Nyquist validation is enabled.

## 1) Research Question

What is the smallest stable MarkOS deep-research contract that:
1. requires the v1 core filters of industry, company, audience, and offer/product,
2. routes evidence through internal vault/MCP first, then external search/scrape, then OpenAI synthesis,
3. preserves citations, freshness, and confidence,
4. returns patch previews only, with human approval required before any write path?

## 2) Key Findings from Current Codebase

1. **MarkOS already uses strict, normalized request envelopes.**  
   `onboarding/backend/pageindex/retrieval-envelope.cjs` enforces allowed keys, normalized arrays, tenant scope, and `provenance_required: true`. This is the strongest existing contract pattern to extend.

2. **Filter-aware retrieval already exists, but it is narrower than Phase 91 needs.**  
   `handleLiteracyQuery` and the vector retrieval layer already support `business_model`, `funnel_stage`, and `content_type`. Phase 91 should extend this style with the locked v1 filters rather than replace it.

3. **Provider fallback exists today, but for LLM execution, not for evidence routing.**  
   `lib/markos/llm/adapter.ts` and `fallback-chain.ts` centralize provider dispatch and telemetry. That pattern is reusable, but Phase 91 needs a separate research-routing contract so evidence order is not confused with generic model fallback.

4. **Tavily is already the natural external evidence layer.**  
   `tavily-scraper.cjs` and `competitor-enricher.cjs` show current search/scrape enrichment behavior, including graceful degradation when keys are missing or calls fail.

5. **The current milestone docs already lock the intended 2026 posture.**  
   The deep-research brief and task framework consistently prescribe: internal evidence first, read-only MCP access, selective Tavily/Firecrawl use, and OpenAI Responses/deep research only for cited synthesis.

## 3) Recommended Contract Shape for Request/Response Envelope

### v1 Request Envelope

Use one universal JSON object with only portable types so it can travel across Copilot, Claude Code, Cursor, CLI, and future APIs without client-specific translation logic.

```json
{
  "contract_version": "markos.deep_research.v1",
  "mode": "preview",
  "research_type": "company_intelligence",
  "query": "How should MarkOS tailor messaging for Acme's RevOps audience?",
  "filters": {
    "industry": ["b2b_saas"],
    "company": {
      "name": "Acme",
      "domain": "acme.com"
    },
    "audience": ["revops_leader"],
    "offer_product": ["pipeline_analytics_platform"],
    "extensions": {}
  },
  "targets": ["literacy", "mir", "msp"],
  "provider_policy": {
    "route": ["markos_vault", "markos_mcp", "tavily", "firecrawl", "openai_synthesis"],
    "internal_authority": true,
    "allow_external": true,
    "allow_write": false,
    "human_approval_required": true,
    "citations_required": true
  },
  "telemetry": {
    "client_surface": "copilot",
    "request_id": "uuid"
  }
}
```

### v1 Response Envelope

```json
{
  "contract_version": "markos.deep_research.v1",
  "status": "ok",
  "research_id": "uuid",
  "active_filters": { "...": "normalized copy of request filters" },
  "route_trace": [
    { "stage": "internal", "provider": "markos_vault", "status": "used" },
    { "stage": "external", "provider": "tavily", "status": "used" },
    { "stage": "synthesis", "provider": "openai_synthesis", "status": "used" }
  ],
  "context_pack": {
    "summary": "Short synthesized research summary",
    "findings": [
      {
        "claim": "...",
        "confidence": "high",
        "freshness": "2026-04-13",
        "implication": "What this means for MIR/MSP/Literacy",
        "evidence": [
          {
            "source_type": "internal|external",
            "authority": "approved_internal|external_candidate|synthesized",
            "citation": "artifact path or URL"
          }
        ]
      }
    ]
  },
  "patch_preview": [
    {
      "artifact": "MIR",
      "section": "AUDIENCES",
      "change_type": "refresh",
      "rationale": "...",
      "supporting_evidence": ["..."]
    }
  ],
  "approval": {
    "write_mode": "preview_only",
    "human_approval_required": true
  },
  "warnings": []
}
```

### Evidence Posture to Lock in v1

- **approved_internal** — authoritative truth from MarkOS vault, MIR, MSP, or approved evidence packs
- **external_candidate** — fresh evidence that may suggest updates but cannot silently override approved internal truth
- **synthesized** — OpenAI-generated synthesis derived from cited evidence only; no uncited claims should be trusted as standalone truth

## 4) Provider / Fallback Implications

### Recommended routing stages

1. **Internal grounding first**  
   Search approved MarkOS artifacts and MCP-exposed knowledge before any external calls.

2. **External enrichment second**  
   Use Tavily for fast search and discovery; use Firecrawl only when structured site extraction or deeper crawl context is required.

3. **OpenAI synthesis last**  
   Use OpenAI Responses/deep-research-style synthesis only after evidence has been gathered. This stage should summarize and rank evidence, not act as the first source of truth.

### Important planning implication

Do **not** reuse the generic LLM fallback chain as the deep-research routing contract. They solve different problems:
- `adapter.ts` fallback = model reliability and provider failover
- Phase 91 routing = evidence authority, freshness, and safe orchestration order

### Fallback behavior to preserve

- If external providers are unavailable, return an internal-only context pack with warnings.
- If Firecrawl is unavailable, continue with Tavily evidence where possible.
- If OpenAI synthesis is unavailable, return gathered evidence plus a degraded summary instead of failing the full run.

## 5) Risks and Constraints

1. **Scope creep risk** — this phase is only about contract shape, taxonomy, routing order, and preview envelope. Full orchestration belongs to later phases.
2. **Backward compatibility risk** — the new schema must extend current retrieval patterns without breaking existing literacy query behavior.
3. **Authority confusion risk** — if internal truth and external findings are not explicitly labeled, later phases may let fresh web evidence override approved artifacts.
4. **Client fragmentation risk** — if each client surface gets its own payload format, the milestone loses the “universal JSON contract” requirement.
5. **Write-safety risk** — preview-only posture must be enforced in the contract itself, not just in UI wording.
6. **Provider availability risk** — Tavily and future Firecrawl/OpenAI paths may be disabled or missing keys; degraded responses must still be valid JSON.

## 6) Planning Implications / Tasks the Planner Should Create

### Contract-definition tasks
- Define a canonical TypeScript/JSON schema for `markos.deep_research.v1` request and response envelopes.
- Create a normalization layer that maps v1 core filters into current retrieval filter semantics without breaking existing consumers.
- Lock a route-trace schema so every run records which provider stages were attempted, skipped, or degraded.

### Governance tasks
- Define evidence-authority labels and merge rules: approved internal truth vs external candidate evidence vs synthesized summary.
- Define the patch-preview payload for Literacy, MIR, and MSP section-level deltas with explicit human approval gating.

### Validation tasks
- Add contract tests for valid and invalid request envelopes.
- Add routing-policy tests proving internal-first behavior and degraded fallback behavior.
- Add guardrail tests proving `allow_write: false` and `human_approval_required: true` are enforced in v1.

### Explicit non-tasks for Phase 91
- Do not implement the MCP server yet.
- Do not build the full multi-source orchestrator yet.
- Do not enable auto-write or approval-bypass behavior.

## Validation Architecture

Because Nyquist validation is enabled, the planner should include a Wave 0 test slice for:
- schema validation of the request envelope,
- schema validation of the response envelope,
- provider-order policy assertions,
- preview-only enforcement.

This phase does not need network integration tests yet; contract and policy tests are the correct boundary.

## 7) Short Recommendation

Adopt a **single preview-only JSON contract** for Phase 91 that:
- requires the four locked core filters,
- separates **evidence routing** from generic **LLM fallback**,
- labels evidence by authority level,
- returns a cited `context_pack` plus `patch_preview`,
- blocks writes until a later human-approved phase.

This is the minimum stable contract that supports later Phase 92-95 work without premature orchestration.

## Sources

### Primary
- `.planning/phases/91-filter-taxonomy-and-provider-contract/91-CONTEXT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/STATE.md`
- `.planning/research/v3.6.0-deep-research-tailoring-brief.md`
- `.planning/research/v3.6.0-research-task-framework.md`
- `onboarding/backend/handlers.cjs`
- `onboarding/backend/pageindex/retrieval-envelope.cjs`
- `onboarding/backend/scrapers/tavily-scraper.cjs`
- `onboarding/backend/enrichers/competitor-enricher.cjs`
- `lib/markos/llm/adapter.ts`
- `lib/markos/llm/fallback-chain.ts`

## Metadata

**Confidence breakdown:**
- Contract shape: HIGH — grounded in existing retrieval envelope, milestone brief, and locked phase context
- Provider routing: HIGH — directly supported by current code and v3.6.0 planning documents
- Future implementation details: MEDIUM — exact field naming and scoring heuristics remain discretionary

**Environment availability:** SKIPPED — planning-only phase; no external runtime dependency is required to complete research.
