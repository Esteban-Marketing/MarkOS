# Phase 92: MarkOS Company-Knowledge MCP Surface - Research

**Researched:** 2026-04-13  
**Domain:** Read-only internal knowledge retrieval through an MCP-compatible surface  
**Confidence:** HIGH for repo findings, MEDIUM for final transport dependency choice

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Phase 92 v1 should expose approved core knowledge only: Literacy, approved MIR/MSP content, and approved evidence packs.
- **D-02:** Draft or unapproved materials must remain out of the default v1 MCP surface.
- **D-03:** The MCP surface must be strict tenant-scoped and read-only by default.
- **D-04:** Cross-tenant leakage or broad global discovery is explicitly not allowed in v1.
- **D-05:** The initial surface should stay minimal and safe, centered on search plus fetch semantics rather than a large tool menu.
- **D-06:** The contract should remain usable across Copilot, Claude Code, Cursor, CLI, and future API clients without client-specific branching.
- **D-07:** Search results should be snippet-first with citations and metadata, while full content is only returned when the client explicitly fetches a target artifact or section.

### Claude's Discretion
- Exact MCP transport and registration strategy
- URI conventions for fetch targets and artifact sections
- Internal ranking, relevance scoring, and token-budget heuristics for search results
- Whether a lightweight browse/catalog convenience surface should be represented as resources or deferred entirely

### Deferred Ideas (OUT OF SCOPE)
- Exposing draft or unapproved artifacts through the same MCP surface is deferred.
- A richer browse/catalog interface or many specialized per-artifact tools is deferred unless planning shows a clear need.
- Any write, patch, or approval action remains out of scope for this phase.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DRT-03 | Every synthesized finding carries source lineage, freshness, confidence, and implication | Search/fetch payloads should include citation, freshness, authority, and artifact metadata |
| DRT-09 | Deep research runs are auditable and safe | The surface should be read-only, tenant-scoped, and denial/audit aware |
| DRT-12 | MarkOS exposes a read-only MCP-compatible company-knowledge surface with search and fetch semantics | A minimal two-operation MCP contract fits the requirement boundary exactly |
| DRT-14 | The research engine supports a canonical taxonomy of research modes | The search contract should accept typed filters/scopes without implementing orchestration in this phase |
| DRT-16 | Consistent command surfaces across MCP tools, API, CLI, and editor clients | A small portable JSON schema and stable tool names preserve cross-client compatibility |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- Treat `.planning/STATE.md` as the canonical live planning state.
- Stay inside the existing MarkOS runtime and planning patterns; do not invent a second platform if it is avoidable.
- Validation should use the repo’s normal Node test workflow: `npm test` or `node --test test/**/*.test.js`.
- The local onboarding backend already exists at `node onboarding/backend/server.cjs` and is the natural read-surface integration point.
- This task is planning/research only; no orchestration build-out or write-path expansion belongs here.

## Summary

MarkOS already has most of the hard pieces Phase 92 needs: read-oriented retrieval primitives, tenant-bound scope guards, provenance-aware retrieval envelopes, and evidence-pack identity models. The missing piece is not a new knowledge system; it is a thin MCP-compatible adapter over the approved internal knowledge already in the repo.

The safest v1 is a small read-only surface with one snippet-first search operation and one explicit fetch operation. It should return approved internal evidence only, preserve citations and freshness metadata, and require tenant-matched claims on every request. Multi-source routing, browse-heavy catalogs, and any write behavior should remain out of scope.

**Primary recommendation:** plan Phase 92 as a thin adapter over the existing retrieval and tenancy primitives, with exactly two public operations and optional read-only resource URIs for richer MCP clients.

## 1) Research Question

What is the smallest MCP-compatible MarkOS knowledge surface that can expose approved literacy, MIR, MSP, and evidence packs to deep-research clients while remaining tenant-scoped, read-only, provenance-rich, and token-efficient?

## 2) Key Findings from Current Codebase

1. **Read-safe retrieval already exists.**  
   `getLiteracyContext()` and `getLiteracyCoverageSummary()` in `vector-store-client.cjs` already support search-style retrieval, filters, and metadata.

2. **Hosted read auth is already an established pattern.**  
   `api/literacy/coverage.js` wraps the coverage route in hosted auth with `status_read`, showing that MarkOS already distinguishes safe read surfaces from broader admin operations.

3. **The current admin query endpoint is not the right external surface.**  
   `handleLiteracyQuery` is gated by `MARKOS_ADMIN_SECRET` and is shaped as a local admin tool. Phase 92 should wrap the lower-level retrieval primitives instead of exposing that route directly.

4. **Tenant isolation is already fail-closed and test-backed.**  
   `pageindex-scope.cjs` and `vault-retriever.cjs` reject tenant mismatch before returning data. Fresh workspace verification passed **16/16** relevant tests across retrieval-envelope, vault-retriever, and tenant-isolation coverage.

5. **Artifact and evidence identities are already modeled.**  
   `markosdb-contracts.cjs` classifies `mir_document`, `msp_document`, and related artifacts, while governance contracts already use stable `evidence_pack_id` and `tenant_id` fields.

6. **No MCP server implementation exists yet in the repo.**  
   Planning should assume a thin new transport adapter is needed, not that a ready-made MCP server already exists.

## Standard Stack

### Core
| Item | Recommendation | Why it fits |
|------|----------------|-------------|
| Runtime | Existing Node 22 MarkOS backend | Already hosts the retrieval and auth surfaces this phase must adapt |
| Retrieval core | `vector-store-client.cjs`, `vault-retriever.cjs`, `retrieval-envelope.cjs` | Reuses proven filter normalization, provenance requirements, and read behavior |
| Tenancy guard | `pageindex-scope.cjs` and visibility-scope helpers | Already fail closed on tenant mismatch |

### MCP transport guidance
| Item | Status | Planning guidance |
|------|--------|-------------------|
| MCP spec | Current official tools/resources guidance verified | Use minimal `tools` plus optional `resources` capability |
| Official TypeScript SDK | `npm view` currently returns `2.0.0-alpha.2` for the Node packages, while the official README still says v1.x is production-recommended | Keep the transport adapter thin and avoid coupling core logic to alpha-only APIs |

## Architecture Patterns

### Recommended shape
1. **Internal knowledge service layer**
   - `searchApprovedKnowledge(query, filters, claims)`
   - `fetchApprovedArtifact(uri, claims)`

2. **Thin MCP adapter layer**
   - registers the minimal tool/resource contract
   - validates inputs
   - converts results into MCP `structuredContent`, text blocks, and resource links

3. **Approved-only policy layer**
   - canonical/approved artifacts only
   - no draft exposure
   - no mutation endpoints or approval actions

### Approved v1 knowledge set
- Literacy corpus with canonical status only
- approved MIR content
- approved MSP content
- approved evidence packs only

### Explicitly out of scope
- multi-source orchestration
- external search routing
- artifact writes or approvals
- draft or unapproved content exposure
- large browse/catalog surfaces

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tenant enforcement | New ad hoc auth/scope logic | Existing tenant-bound scope helpers | Safety-critical behavior already exists and is tested |
| Artifact identity | Raw file-path exposure or new unrelated IDs | Existing artifact IDs plus a small MCP URI wrapper | Avoids leakage and preserves audit lineage |
| Search routing | Early multi-provider merge/orchestrator | Internal approved-only retrieval | Keeps Phase 92 inside its boundary |
| Protocol semantics | A pseudo-MCP format | Official MCP tools/resources patterns | Maintains client compatibility |

## 3) Recommended MCP Surface Contract for Search/Fetch

### Capabilities
Use the smallest compliant surface for v1:

```json
{
  "capabilities": {
    "tools": { "listChanged": false },
    "resources": {}
  }
}
```

No prompts, no subscriptions, and no dynamic tool menu in v1.

### Public operations
| Surface | Name | Purpose | Result style |
|---------|------|---------|--------------|
| Tool | `search_markos_knowledge` | Search approved internal knowledge | snippet-first, citation-rich, no full bodies |
| Tool | `fetch_markos_artifact` | Fetch an explicitly chosen artifact or section | full section/body with metadata |
| Resource | `markos://...` URIs via `resources/read` | Optional richer fetch path for compatible clients | same data as fetch, read-only |

### Search tool contract
Recommended input shape:

```json
{
  "query": "How should MarkOS tailor messaging for RevOps leaders?",
  "scopes": ["literacy", "mir", "msp", "evidence"],
  "filters": {
    "discipline": "strategy",
    "audience": ["revops_leader"],
    "business_model": ["b2b_saas"],
    "artifact_kinds": ["literacy", "mir", "msp", "evidence"]
  },
  "top_k": 5
}
```

Recommended output rules:
- return short snippets first, not full documents
- every result should include:
  - `artifact_uri`
  - `artifact_kind`
  - `title`
  - `snippet`
  - `source_ref` or citation
  - `authority` = `approved_internal`
  - `updated_at` / freshness
  - optional confidence/score
- also return MCP `resource_link` items so clients can explicitly fetch the chosen artifact

### Fetch tool contract
Recommended input shape:

```json
{
  "uri": "markos://tenant/{tenant_id}/mir/{artifact_id}#section=AUDIENCES",
  "section": "AUDIENCES"
}
```

Recommended output rules:
- returns the requested approved artifact or section only
- includes provenance metadata and artifact kind
- uses `structuredContent` plus a text block for compatibility
- never mutates state

### URI design
Use a custom scheme rather than raw local file paths:

```text
markos://tenant/{tenant_id}/{kind}/{artifact_id}[#section={section_key}]
```

This keeps the surface portable and avoids leaking real `.markos-local` storage layout.

## 4) Auth and Tenancy Implications

1. **Tenant must come from claims, not trust client-supplied tenant IDs.**  
   If the request carries a tenant hint or URI tenant segment, it must match the authenticated claims or be denied.

2. **Do not expose the admin-secret literacy endpoint as the MCP surface.**  
   It is a local admin tool, not a safe tenant-facing client interface.

3. **Everything should be approved-only by default.**  
   Search and fetch should resolve only canonical or approved content; drafts remain out of scope.

4. **Every call should be auditable.**  
   Log request ID, tenant ID, client surface, tool name, resource URI(s), and denial outcomes.

5. **Cross-tenant discovery must fail closed.**  
   No global catalog, no broad enumeration, and no path leakage in responses or errors.

## 5) Risks and Constraints

### Main risks
- **Admin-route reuse risk:** the fastest-looking integration path would accidentally bypass the intended tenant-auth model.
- **Token bloat risk:** returning full documents in search results violates the snippet-first requirement and expands leakage risk.
- **Authority confusion risk:** approved internal evidence must remain visibly distinct from future external or synthesized findings.
- **SDK instability risk:** current Node MCP package tags are alpha, so transport code should stay replaceable.
- **Scope creep risk:** browse UX, multi-source routing, and write actions belong to later phases.

### Hard constraints
- read-only only
- strict tenant scope only
- approved core only
- minimal search + fetch only
- full detail only after explicit fetch

## 6) Planning Implications / Tasks the Planner Should Create

### Wave 0 — contract and safety
1. Define the approved-knowledge inventory and inclusion rules for literacy, MIR, MSP, and evidence packs.
2. Define the MCP tool schemas, result metadata contract, and `markos://` URI format.
3. Define the explicit deny rules for cross-tenant access, unapproved content, and any write attempt.

### Wave 1 — internal adapter
4. Build a shared internal read service that wraps the existing retrieval modules and normalizes snippet-first results.
5. Add a fetch resolver that maps artifact URIs to approved content sections without exposing raw storage paths.

### Wave 2 — transport and validation
6. Add the thin MCP adapter that registers the two public operations.
7. Add contract tests, tenant-isolation negative tests, and no-write guardrail tests.
8. Add concise developer/operator docs describing the supported scope and explicit non-goals.

## Validation Architecture

### Existing verified test foundation
Fresh workspace verification completed successfully:
- Node: `v22.13.0`
- npm: `10.9.2`
- Relevant safety tests: **16 passing, 0 failing**

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node built-in test runner |
| Config file | none required; uses repo scripts |
| Quick run command | `node --test test/phase-84/retrieval-envelope.test.js test/phase-86/vault-retriever.test.js test/phase-88/tenant-isolation-matrix.test.js` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DRT-12 | MCP search returns snippet-first results and fetch returns full detail | unit/contract | `node --test test/phase-92/mcp-search-fetch-contract.test.js` | ❌ Wave 0 |
| DRT-03 | results include citation, freshness, authority, and artifact metadata | unit | `node --test test/phase-92/mcp-result-metadata.test.js` | ❌ Wave 0 |
| DRT-09 | cross-tenant access is denied before data is returned | negative/security | `node --test test/phase-92/mcp-tenant-scope.test.js` | ❌ Wave 0 |
| DRT-16 | tool/resource schema remains stable and client-portable | contract | `node --test test/phase-92/mcp-uri-and-schema.test.js` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** relevant phase-92 contract tests
- **Per wave merge:** retrieval and tenant-isolation suite
- **Phase gate:** full `npm test` green before verification

### Wave 0 Gaps
- [ ] `test/phase-92/mcp-search-fetch-contract.test.js`
- [ ] `test/phase-92/mcp-result-metadata.test.js`
- [ ] `test/phase-92/mcp-tenant-scope.test.js`
- [ ] `test/phase-92/mcp-uri-and-schema.test.js`

## 7) Short Recommendation

Plan Phase 92 as a **thin, safe, read-only adapter**, not a new research engine. Reuse the existing MarkOS retrieval and tenant-scope primitives, expose exactly two public operations, make search snippet-first, and force explicit fetch for full content. Keep the transport layer replaceable and defer any browse, orchestration, or write behavior.

## Sources

### Primary (HIGH confidence)
- `.planning/phases/92-markos-company-knowledge-mcp-surface/92-CONTEXT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/STATE.md`
- `.planning/research/v3.6.0-deep-research-tailoring-brief.md`
- `.planning/research/v3.6.0-research-task-framework.md`
- `.planning/phases/91-filter-taxonomy-and-provider-contract/91-CONTEXT.md`
- `.planning/phases/91-filter-taxonomy-and-provider-contract/91-RESEARCH.md`
- `onboarding/backend/server.cjs`
- `onboarding/backend/handlers.cjs`
- `onboarding/backend/vector-store-client.cjs`
- `onboarding/backend/pageindex/retrieval-envelope.cjs`
- `onboarding/backend/vault/pageindex-scope.cjs`
- `onboarding/backend/vault/vault-retriever.cjs`
- `api/literacy/coverage.js`
- `lib/markos/governance/contracts.ts`
- `lib/markos/governance/evidence-pack.cjs`

### Current MCP docs (HIGH confidence)
- https://modelcontextprotocol.io/specification/latest/server/tools
- https://modelcontextprotocol.io/specification/latest/server/resources
- https://modelcontextprotocol.io/docs/develop/build-server
- https://github.com/modelcontextprotocol/typescript-sdk

## Metadata

**Confidence breakdown:**
- Read-only surface shape: HIGH
- Auth and tenancy posture: HIGH
- Exact SDK/package choice: MEDIUM
