# Phase 84: Vault Foundation (Obsidian Mind + PageIndex Contracts) - Research

**Researched:** 2026-04-12
**Domain:** Vault contract foundation (deterministic taxonomy + PageIndex retrieval adapter + isolation proof matrix)
**Confidence:** MEDIUM-HIGH

## User Constraints

### Locked Decisions
- **D-01:** Lock a discipline-first physical vault root with semantic index manifests (audience, funnel, concept) as first-class artifacts.
- **D-02:** Canonical paths must remain deterministic and stable so Obsidian and backend services resolve the same destination without runtime heuristics.
- **D-03:** Use one typed query envelope for retrieval (`mode`, `discipline`, `audience`, `filters`, `provenance_required`) instead of mode-specific endpoints.
- **D-04:** The adapter contract must expose provenance metadata in all responses to preserve downstream evidence and governance requirements.
- **D-05:** Execute immediate hard cutover in Phase 84 (no long-lived dual-run path). Legacy Upstash retrieval paths are removed as part of phase completion.
- **D-06:** Migration evidence must show deterministic contract parity for required retrieval scenarios before legacy removal is declared complete.
- **D-07:** Phase 84 verification must include a tenant-isolation proof matrix that validates both Supabase RLS boundaries and PageIndex scoped-query boundaries.
- **D-08:** Isolation verification requires unit + integration checks (not only smoke tests) before phase closure.

### Claude's Discretion
- Final field naming inside the single query envelope (while preserving the locked envelope shape).
- Internal adapter module layout and helper splitting.
- Test fixture organization for the isolation proof matrix.

### Deferred Ideas (OUT OF SCOPE)
- Full operator-facing Obsidian UX ergonomics are deferred to Phase 87 role-view work.
- Extended ingestion workflow detail beyond contract-level cutover is deferred to Phase 85 execution planning.

## Standard Stack

Recommendation (HIGH): use the official PageIndex SDK contract layer plus strict runtime envelope validation, and keep Supabase as metadata/governance plane only (RLS + provenance + tenant mapping).

Use:
- `@pageindex/sdk@0.8.0` (npm verified 2026-03-24)
- `@supabase/supabase-js@2.103.0` (npm verified 2026-04-09)
- `zod@4.3.6` (npm verified 2026-01-25)
- `lru-cache@11.3.3` (npm verified 2026-04-08)

Avoid:
- Keeping `@upstash/vector` retrieval live beyond Phase 84 cutover.
- Using community PageIndex-like packages with ambiguous ownership for core contracts.
- Splitting retrieval by mode-specific endpoints in Phase 84.

Prescriptive stack posture:
1. Keep CommonJS `.cjs` module style for adapter parity with existing backend runtime.
2. Introduce a new `pageindex-client.cjs` adapter and convert consumers behind one contract boundary.
3. Treat PageIndex as retrieval runtime, Supabase as authority for tenant-scoped metadata and provenance indexing.
4. Keep `@upstash/vector` only as transient compile/runtime dependency until all call sites are removed in this phase.

## Architecture Patterns

Recommendation (HIGH): enforce one canonical envelope from API edge to provider call, and one deterministic vault path mapping from source section to note destination.

Pattern A: Deterministic vault taxonomy + canonical pathing
- Use discipline-first physical root and stable canonical destinations.
- Reuse deterministic path and note-id principles already present in `onboarding/backend/vault/destination-map.cjs` and `onboarding/backend/vault/note-id.cjs`.
- Keep semantic cross-cutting indices as artifacts (manifests), not duplicate physical trees.

Pattern B: Single retrieval query envelope
- Required envelope shape (locked):
```json
{
  "mode": "reason|apply|iterate",
  "discipline": "string|null",
  "audience": "string|null",
  "filters": {
    "pain_point_tags": ["string"],
    "business_model": ["string"],
    "funnel_stage": ["string"],
    "content_type": ["string"],
    "tenant_scope": "string"
  },
  "provenance_required": true
}
```
- Enforce this at runtime with `zod`; reject unknown keys.
- Never bypass envelope validation in adapter tests or integration entrypoints.

Pattern C: PageIndex scoping strategy for multi-tenant retrieval
- Because official metadata search is closed beta, use a two-step retrieval contract in Phase 84:
1. Query candidate `doc_id` set from Supabase (tenant + discipline + audience + filters under RLS).
2. Call PageIndex chat/retrieval scoped with the returned `doc_id` list only.
- This is the hard requirement to satisfy GOVV-01 now, without waiting for PageIndex metadata feature general availability.

Pattern D: Hard cutover execution
- Remove Upstash retrieval call paths from `onboarding/backend/vector-store-client.cjs` consumers in this phase.
- Replace `bin/ensure-vector.cjs` readiness assumptions with PageIndex readiness checks (`api_key`, basic connectivity, doc status probe).
- Keep a cutover proof bundle with scenario parity checks before removing old code.

## Don't Hand-Roll

Recommendation (MEDIUM-HIGH): use provider and platform primitives where available; hand-rolled substitutes increase migration risk and verification burden.

Do not hand-roll:
1. Vector-like similarity layers on top of PageIndex. Use PageIndex tree/chat retrieval primitives.
2. Custom auth engine for tenant access. Use Supabase RLS + membership tables and scoped prefiltering.
3. Link resolution heuristics for Obsidian. Use deterministic canonical path contracts and valid filename/link conventions.
4. Ad hoc JSON validation. Use strict schema validation (`zod`) for request and response contracts.
5. Homegrown cache invalidation without keys. Use deterministic cache keys from envelope fields + tenant id + mode.

## Common Pitfalls

Pitfall 1 (HIGH): Hidden dual-run behavior after “hard cutover”
- What goes wrong: legacy Upstash code path still executes for some route/CLI tests.
- Avoid: fail tests if `getUpstashIndex()` is referenced from retrieval paths after cutover.

Pitfall 2 (HIGH): Tenant leakage through provider-scoping assumptions
- What goes wrong: assuming PageIndex alone enforces tenant boundaries.
- Avoid: always prefilter `doc_id` from Supabase RLS-governed metadata before any PageIndex call.

Pitfall 3 (MEDIUM): Non-deterministic Obsidian paths break backlinks and sync confidence
- What goes wrong: runtime heuristics choose alternate path/title over time.
- Avoid: frozen section registry + canonical destination map + stable note ID slug rules.

Pitfall 4 (MEDIUM): Provenance fields become optional in retrieval response
- What goes wrong: execution logs lose artifact lineage and governance evidence.
- Avoid: response schema requiring artifact id, source, timestamps, actor/system, and transformation lineage for every result.

Pitfall 5 (MEDIUM): Assuming PageIndex metadata filtering is GA
- What goes wrong: implementation plans depend on unavailable closed-beta features.
- Avoid: use SQL metadata prefilter and doc_id-scoped retrieval in Phase 84.

## Code Examples

Example 1: Envelope contract (use, do not fork by mode)
```js
const { z } = require('zod');

const RetrievalEnvelope = z.object({
  mode: z.enum(['reason', 'apply', 'iterate']),
  discipline: z.string().min(1).nullable(),
  audience: z.string().min(1).nullable(),
  filters: z.object({
    pain_point_tags: z.array(z.string()).default([]),
    business_model: z.array(z.string()).default([]),
    funnel_stage: z.array(z.string()).default([]),
    content_type: z.array(z.string()).default([]),
    tenant_scope: z.string().min(1),
  }),
  provenance_required: z.literal(true),
}).strict();
```

Example 2: Two-step tenant-safe retrieval (Supabase RLS -> PageIndex doc scope)
```js
async function retrieveScoped(client, supabase, envelope) {
  const input = RetrievalEnvelope.parse(envelope);

  const { data: docs, error } = await supabase
    .from('vault_artifact_index')
    .select('pageindex_doc_id')
    .eq('tenant_id', input.filters.tenant_scope)
    .in('discipline', input.discipline ? [input.discipline] : ['Strategy', 'Execution'])
    .limit(50);

  if (error) throw error;

  const docIds = (docs || []).map((d) => d.pageindex_doc_id).filter(Boolean);
  if (docIds.length === 0) return [];

  const response = await client.api.chatCompletions({
    doc_id: docIds,
    messages: [{ role: 'user', content: buildModePrompt(input) }],
    enable_citations: true,
    stream: false,
  });

  return normalizeWithProvenance(response, input);
}
```

Example 3: Deterministic canonical note destination check
```js
function assertCanonicalDestination(pathA, pathB) {
  if (pathA !== pathB) {
    throw new Error('NON_DETERMINISTIC_CANONICAL_PATH');
  }
}
```

## Validation Architecture

Recommendation (HIGH): Phase 84 must fail-closed on contract drift, tenant leakage, and incomplete cutover evidence.

Test Framework
- Node built-in test runner (`node --test`)
- Existing baseline: `test/**/*.test.js`

Required Phase 84 test lanes
1. Contract unit tests
- `test/phase-84/retrieval-envelope.test.js`
- Validates single envelope parsing, unknown-key rejection, required provenance flag.

2. Adapter integration tests
- `test/phase-84/pageindex-adapter.test.js`
- Verifies doc_id scoping, response normalization, citation/provenance extraction.

3. Tenant isolation proof matrix
- `test/phase-84/isolation-matrix.test.js`
- Cases:
  - tenant A can retrieve tenant A docs
  - tenant A cannot retrieve tenant B docs
  - mixed doc list filtered/denied
  - missing tenant scope denied
- Must include unit + integration assertions (D-08).

4. Hard cutover regression checks
- `test/phase-84/cutover-no-upstash.test.js`
- Verifies legacy retrieval path symbols and env keys are not required for retrieval success.

5. Deterministic vault pathing tests
- `test/phase-84/canonical-pathing.test.js`
- Repeated mapping of same source yields same canonical destination and note_id.

Execution commands
- Quick run (per commit):
  - `node --test test/phase-84/*.test.js -x`
- Full suite gate (phase merge):
  - `npm test`

Proof artifacts required for hard cutover completion
1. Contract parity matrix for required retrieval scenarios (reason/apply/iterate).
2. Tenant isolation matrix (RLS + PageIndex scoped query evidence).
3. Legacy removal diff evidence (no retrieval path dependence on Upstash).
4. Readiness check evidence replacing vector readiness with PageIndex readiness.

## Phase-84-Safe Contract Shape (PageIndex metadata search closed beta)

Recommendation (HIGH): lock Phase 84 to a strict two-step retrieval contract and treat direct metadata filtering in PageIndex as unavailable until GA evidence is produced.

Contract constraints
1. Supabase is the authoritative metadata filter plane under RLS. It returns an allow-list of `doc_id` values for the tenant and filter envelope.
2. PageIndex call sites may only receive `doc_id` values produced by Step 1; no direct user-provided `doc_id` passthrough.
3. If Step 1 returns zero `doc_id` values, the adapter returns empty results with provenance and does not issue a broad PageIndex retrieval.
4. Envelope-to-filter mapping must be deterministic: same envelope + tenant must produce the same SQL predicate structure.
5. Closed-beta metadata search must be represented as a feature flag defaulting to off; Phase 84 behavior must be correct with the flag disabled.

Acceptance evidence
1. Contract tests prove no adapter branch performs PageIndex metadata query expansion when closed-beta flag is false.
2. Integration trace shows exact `doc_id` set passed to PageIndex equals Supabase allow-list output.
3. Negative test proves unknown envelope keys are rejected before SQL or provider invocation.

## Tenant Isolation Invariants and Negative Tests

Isolation invariants (HIGH)
1. Tenant binding invariant: every retrieval request must carry a non-empty tenant scope, and tenant scope is used in Supabase prefilter under RLS.
2. Doc ownership invariant: every `doc_id` sent to PageIndex must be pre-authorized for the tenant in current request context.
3. No fallback invariant: if scoped prefilter fails or returns empty, adapter must fail closed (error/empty) rather than broaden query.
4. Provenance invariant: every returned chunk/citation includes source identifiers sufficient to audit tenant-bounded origin.

Negative test design (unit + integration, D-08)
1. Missing tenant scope: reject envelope and assert no Supabase/PageIndex calls occur.
2. Cross-tenant injection attempt: request from tenant A including tenant B `doc_id` candidate must be filtered out before provider call.
3. Mixed allow-list contamination: Supabase result intentionally includes one foreign `doc_id`; adapter must drop it and log invariant violation.
4. Empty allow-list behavior: ensure adapter returns empty deterministic payload, not unscoped semantic search.
5. Replay across tenants: same query envelope replayed under tenant B must never return citations tied to tenant A.
6. Provenance omission: provider response missing required provenance fields must fail normalization contract.

## Open Unknowns and Decision Gates

1. PageIndex scoped retrieval limits
- Unknown: maximum safe `doc_id` list size and latency envelope for Phase 84 traffic profile.
- Decision gate: run load probe with realistic allow-list cardinalities and set a hard cap + chunking policy before implementation lock.

2. Closed-beta metadata timeline
- Unknown: whether metadata filtering GA lands during Phase 84 execution window.
- Decision gate: proceed assuming unavailable; only switch if official GA docs are published and parity tests pass without relaxing isolation invariants.

3. Provenance normalization minimum schema
- Unknown: final minimal required field set for governance consumers when provider responses vary.
- Decision gate: freeze required provenance keys in adapter schema and reject partial payloads before phase sign-off.

4. Supabase prefilter query performance at scale
- Unknown: index sufficiency for tenant + discipline + audience + tags composite filters.
- Decision gate: execute EXPLAIN on canonical filter queries and add/adjust indexes before cutover acceptance.

5. Health/readiness contract naming
- Unknown: final provider status shape after Upstash removal (`upstash_vector` key removed vs retained as deprecated false marker).
- Decision gate: lock one shape and update runbooks/tests to prevent hidden compatibility coupling.

## Cutover Acceptance Checklist

Hard-cutover gates (must all pass)
1. Static dependency gate: repository search finds no runtime retrieval path importing `@upstash/vector` or invoking `getUpstashIndex` in active retrieval modules.
2. Runtime independence gate: retrieval integration suite passes with `UPSTASH_VECTOR_REST_URL` and `UPSTASH_VECTOR_REST_TOKEN` unset.
3. Health contract gate: readiness output no longer reports Upstash as required for retrieval-ready status.
4. Provider invocation gate: integration traces confirm only PageIndex adapter is called for reason/apply/iterate retrieval flows.
5. Contract parity gate: required retrieval scenarios produce equivalent semantic outcomes under new envelope semantics and deterministic provenance outputs.
6. Isolation gate: full tenant-isolation matrix (unit + integration) passes, including all negative tests listed above.
7. Failure semantics gate: when prefilter fails, system fails closed and emits diagnosable error code (no hidden fallback to legacy provider).
8. Artifact gate: cutover evidence bundle stored in phase artifacts includes static scan output, test results, and trace excerpts.

Minimal rollback strategy (compatible with D-05 immediate cutover)
1. Rollback is commit-based, not runtime dual-run: maintain a single emergency revert commit that restores last known-good retrieval path.
2. Keep a frozen pre-cutover tag and migration evidence bundle so rollback is deterministic and auditable.
3. Define rollback trigger thresholds (for example: sustained retrieval error rate or tenant isolation invariant breach) before go-live.
4. Rollback execution must be one command + redeploy; no partial provider switching in production runtime.
5. Post-rollback requirement: open incident and produce forward-fix plan before reattempting cutover.
## Sources

Primary (HIGH)
1. `.planning/phases/84-vault-foundation-obsidian-mind-pageindex-contracts/84-CONTEXT.md` (locked decisions D-01..D-08)
2. `.planning/ROADMAP.md` (Phase 84 scope and requirement mapping)
3. `onboarding/backend/vault/destination-map.cjs` and `onboarding/backend/vault/vault-writer.cjs` (deterministic canonical mapping baseline)
4. `onboarding/backend/vector-store-client.cjs`, `bin/ingest-literacy.cjs`, `bin/ensure-vector.cjs` (legacy retrieval and cutover targets)
5. `supabase/migrations/51_multi_tenant_foundation.sql` (existing tenant and RLS enforcement patterns)

Secondary (MEDIUM-HIGH)
1. https://docs.pageindex.ai/endpoints (Chat API beta, legacy retrieval positioning, API key and doc_id scoping)
2. https://docs.pageindex.ai/js-sdk/chat (doc_id scoping, citations, stream metadata)
3. https://docs.pageindex.ai/js-sdk/documents (document processing and tree status contracts)
4. https://docs.pageindex.ai/tutorials/doc-search/metadata (metadata prefilter + doc_id retrieval pipeline; metadata support closed beta)
5. https://supabase.com/docs/guides/database/postgres/row-level-security (RLS policy and performance guidance)
6. https://obsidian.md/help/links and https://obsidian.md/help/file-formats and https://obsidian.md/help/data-storage (link/path interoperability and vault-on-disk constraints)

Tertiary (LOW)
1. https://www.npmjs.com/search?q=pageindex (package discovery only; used to avoid non-official package ambiguity)

Confidence notes
- Standard Stack: MEDIUM-HIGH (official docs + npm version checks, but Phase 84-specific internal adapter shape is project-defined).
- Architecture Patterns: HIGH for deterministic pathing and RLS posture; MEDIUM for PageIndex metadata filtering details due closed-beta status.
- Migration/Cutover risks: HIGH confidence on risk categories from current codebase and lock decisions.

