# Phase 92: MarkOS Company-Knowledge MCP Surface - Context

**Gathered:** 2026-04-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Expose literacy, MIR, MSP, and approved evidence through a read-only MCP-compatible search/fetch layer for deep research clients. This phase defines the safe internal knowledge surface and its access behavior; it does not implement multi-source orchestration, external research routing, or artifact write paths.

</domain>

<decisions>
## Implementation Decisions

### Knowledge scope
- **D-01:** Phase 92 v1 should expose approved core knowledge only: Literacy, approved MIR/MSP content, and approved evidence packs.
- **D-02:** Draft or unapproved materials must remain out of the default v1 MCP surface.

### Access posture
- **D-03:** The MCP surface must be strict tenant-scoped and read-only by default.
- **D-04:** Cross-tenant leakage or broad global discovery is explicitly not allowed in v1.

### MCP interaction model
- **D-05:** The initial surface should stay minimal and safe, centered on search plus fetch semantics rather than a large tool menu.
- **D-06:** The contract should remain usable across Copilot, Claude Code, Cursor, CLI, and future API clients without client-specific branching.

### Result granularity
- **D-07:** Search results should be snippet-first with citations and metadata, while full content is only returned when the client explicitly fetches a target artifact or section.

### the agent's Discretion
- Exact MCP transport and registration strategy
- URI conventions for fetch targets and artifact sections
- Internal ranking, relevance scoring, and token-budget heuristics for search results
- Whether a lightweight browse/catalog convenience surface should be represented as resources or deferred entirely

</decisions>

<specifics>
## Specific Ideas

- The surface should feel like a clean internal knowledge API for deep research clients, not a cluttered admin console.
- Safe, token-efficient retrieval matters: snippet previews first, then explicit fetch for full detail.
- Approved knowledge should be clearly separated from anything still under review.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone and upstream contract
- `.planning/REQUIREMENTS.md` — DRT-03, DRT-09, DRT-12, and DRT-14 define the Phase 92 scope.
- `.planning/research/v3.6.0-deep-research-tailoring-brief.md` — milestone framing and the v3.6 phase sequence.
- `.planning/research/v3.6.0-research-task-framework.md` — the planned read-only MCP surface and client usage model.
- `.planning/phases/91-filter-taxonomy-and-provider-contract/91-CONTEXT.md` — the upstream Phase 91 contract decisions this surface must honor.
- `.planning/phases/91-filter-taxonomy-and-provider-contract/91-RESEARCH.md` — the request/response envelope and routing posture that Phase 92 plugs into.

### Existing retrieval and auth surfaces
- `onboarding/backend/server.cjs` — current local route map including literacy admin endpoints.
- `onboarding/backend/handlers.cjs` — existing health/query handlers that already expose safe read patterns.
- `onboarding/backend/vector-store-client.cjs` — literacy context and coverage retrieval primitives.
- `api/literacy/coverage.js` — hosted auth boundary for read access.
- `.planning/FLOW-INVENTORY.md` — canonical journey and auth details for literacy coverage and admin query surfaces.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `handleLiteracyCoverage` already provides a read-oriented coverage summary with auth-aware behavior.
- `handleLiteracyQuery` already exposes a search-style retrieval flow with diagnostics and filtered matches.
- `vector-store-client.cjs` already contains the underlying `getLiteracyContext` and `getLiteracyCoverageSummary` primitives the MCP layer can adapt.

### Established Patterns
- MarkOS already distinguishes read-safe reporting/query paths from write-sensitive operations.
- Hosted read surfaces use scoped auth boundaries, while local admin flows use explicit secret checks.
- The v3.6 architecture prefers internal evidence first and keeps approved content authoritative.

### Integration Points
- Phase 92 should wrap or adapt the existing internal retrieval surface into an MCP-compatible search/fetch contract.
- The surface must plug cleanly into the universal JSON deep-research contract defined in Phase 91.
- Later phases should be able to consume this MCP layer without redefining artifact identity or evidence metadata.

</code_context>

<deferred>
## Deferred Ideas

- Exposing draft or unapproved artifacts through the same MCP surface is deferred.
- A richer browse/catalog interface or many specialized per-artifact tools is deferred unless planning shows a clear need.
- Any write, patch, or approval action remains out of scope for this phase.

</deferred>

---

*Phase: 92-markos-company-knowledge-mcp-surface*
*Context gathered: 2026-04-14*
