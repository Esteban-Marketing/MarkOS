# Phase 86: Agentic Retrieval Modes (Reason, Apply, Iterate) - Research

**Researched:** 2026-04-12
**Domain:** Vault read-path contracts, retrieval mode factories, audience/discipline filter logic, deterministic handoff payloads
**Confidence:** HIGH — all recommendations grounded entirely in existing codebase contracts, no external dependencies required

<user_constraints>
## User Constraints (from CONTEXT.md)

### All Decisions: agent's Discretion

The user delegated all 15 implementation decisions (D-01 through D-15) to the planner across four areas:

- **Area 1 — Mode Contract Shape:** D-01 (Reason fields), D-02 (Apply pre-fill), D-03 (Iterate verification), D-04 (single factory vs separate)
- **Area 2 — Filter Architecture:** D-05 (AND/OR), D-06 (no-filter behavior), D-07 (tag matching), D-08 (enforcement layer)
- **Area 3 — Handoff Payload:** D-09 (field set), D-10 (evidence links), D-11 (unified vs mode-specific), D-12 (determinism)
- **Area 4 — Persistence Scope:** D-13 (Supabase migration), D-14 (new file vs extend), D-15 (HTTP routes now vs deferred)

### Critical Codebase Annotations to Honor
- `audit-store.cjs`: "Persistent storage (Supabase) deferred to Phase 86+" — must address (decision: keep in-memory, add stub interface)
- `visibility-scope.cjs`: "Phase 86/87 retrieval role-views are explicitly deferred" — must implement the retrieval view layer in Phase 86

### Deferred
- HTTP routes in `server.cjs` (D-15: deferred to Phase 87)
- Supabase persistence migration (D-13: keep in-memory + stub)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ROLEV-01 | Three retrieval modes: Reason (raw artifact for LLM), Apply (actionable template), Iterate (with outcome verification hook) | Single `createVaultRetriever` factory returning three mode methods; unified base shape + mode-specific extension fields |
| ROLEV-02 | Discipline-scoped + audience-scoped filters; results include artifact_id, provenance, audience context | Pure `applyFilter(entries, {discipline?, audience_tags?[]})` with AND semantics; tenant guard via `projectAuditLineage` |
| ROLEV-03 | Deterministic execution handoff payloads with reasoning context and evidence links | `buildHandoffPack({mode, artifact, audienceContext, claims})` with `retrieve:{tenantId}:{docId}:{mode}:{contentHash}` idempotency key |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- CommonJS `.cjs` modules only — no TypeScript classes, no ES modules
- Factory function pattern: `createX({deps}) → { methodA, methodB }`
- Injected dependencies for testability (no Supabase imports at module top-level)
- Test runner: `node --test` (Node built-in); suite command `npm test`
- Server: `node onboarding/backend/server.cjs`

## Summary

Phase 86 implements the read side of a CQRS split — the write path (ingest-apply → audit-store) was built in Phase 85. This phase introduces three new pure-function modules that layer cleanly on existing Phase 84/85 contracts:

1. **`retrieval-filter.cjs`** — pure AND-filter logic over audit-store entries by discipline and/or audience tags
2. **`handoff-pack.cjs`** — deterministic packer: builds mode-aware handoff payloads with provenance, reasoning context, evidence links, and a stable idempotency key
3. **`vault-retriever.cjs`** — factory (mirrors `createIngestApply`) that wires filter + packer + visibility scope into three retrieval mode methods: `retrieveReason`, `retrieveApply`, `retrieveIterate`

Additionally, `visibility-scope.cjs` requires a focused extension: add `checkRetrievalScope(claims, resourceContext)` with `ALLOWED_RETRIEVAL_ROLES = Set(['operator', 'admin', 'agent'])` to activate the retrieval role-view layer that was explicitly deferred from Phase 85.

No new npm dependencies are required. No HTTP surface is introduced. `audit-store.cjs` stays in-memory with a Supabase-stub comment block to enable Phase 87 to flip the persistence switch without touching vault-retriever.

## Standard Stack

### Core (all already in repo — zero new dependencies)
| Module | Source | Purpose |
|--------|--------|---------|
| `audit-store.cjs` | Phase 85 | Source of truth for ingested artifacts — retriever reads via `getAll({tenantId})` |
| `audience-schema.cjs` | Phase 84 | `validateAudienceMetadata()` — validates filter query params at module boundary |
| `provenance-contract.cjs` | Phase 84 | `normalizeProvenance()` — produces provenance block in every retrieval result |
| `visibility-scope.cjs` | Phase 85 | `projectAuditLineage(claims, records)` — tenant isolation before filter application |
| `idempotency-key.cjs` | Phase 84 | `buildIdempotencyKey(event)` — base pattern, extended for retrieval key prefix |

**Installation:** No `npm install` needed. Zero new dependencies.

## Architecture Patterns

### Recommended Project Structure
```text
onboarding/backend/vault/
  retrieval-filter.cjs       # NEW: pure AND-filter over audit entries
  handoff-pack.cjs           # NEW: deterministic handoff payload builder
  vault-retriever.cjs        # NEW: createVaultRetriever factory — three modes
  visibility-scope.cjs       # MODIFIED: +checkRetrievalScope +ALLOWED_RETRIEVAL_ROLES

test/phase-86/
  retrieval-filter.test.js   # unit: AND filter, tag matching, no-filter passthrough
  handoff-pack.test.js       # unit: idempotency key determinism, evidence links, mode shape
  vault-retriever.test.js    # integration: all three mode methods end-to-end
```

### Pattern 1: CQRS Read Factory (mirrors createIngestApply)

```javascript
// vault-retriever.cjs
function createVaultRetriever(options = {}) {
  const getArtifacts = asFunction(options.getArtifacts, 'E_RETRIEVER_ARTIFACTS_REQUIRED', ...);
  // validates claims + applies filter + packs handoff

  async function retrieveReason({ tenantId, claims, filter }) {
    const raw = await getArtifacts({ tenantId });
    const scoped = projectAuditLineage(claims, raw);          // tenant isolation
    const filtered = applyFilter(scoped, filter);              // discipline+audience
    return filtered.map(artifact => buildHandoffPack({ mode: 'reason', artifact, claims }));
  }

  return { retrieveReason, retrieveApply, retrieveIterate };
}
```

**Why:** Injected `getArtifacts` makes unit testing trivial — no real `audit-store` needed in tests.

### Pattern 2: AND-Filter Semantics

```javascript
// retrieval-filter.cjs
function applyFilter(entries, filter = {}) {
  const { discipline, audience_tags } = filter;
  let results = entries;

  if (discipline) {
    const norm = discipline.trim().toLowerCase();
    results = results.filter(e => String(e.discipline || '').toLowerCase() === norm);
  }

  if (audience_tags && audience_tags.length > 0) {
    results = results.filter(entry => {
      const entryTags = Array.isArray(entry.audience) ? entry.audience : [];
      return audience_tags.every(tag => entryTags.includes(tag));  // AND: all tags must match
    });
  }

  return results;
}
```

**AND semantics rationale:** Marketing vault retrieval is high-precision — agents requesting `ICP:STARTUP` AND `PAIN:HIGH_CAC` want exactly that audience intersection, not a broad "any match" pool. Fuzzy/OR semantics increases noise; agents can always broaden the query.

**No-filter behavior:** Return all tenant-scoped entries. This is safe because `projectAuditLineage` already enforces tenant isolation before filter application. An empty filter is a valid "get all" query.

**Tag matching:** Exact string match (case-sensitive on the value, e.g., `ICP:SMB` ≠ `ICP:smb`). The `audience-schema.cjs` normalizer already uppercases prefix segments during ingestion, so stored tags are canonical. No prefix-only matching needed.

### Pattern 3: Deterministic Handoff Pack

```javascript
// handoff-pack.cjs
function buildHandoffPack({ mode, artifact, audienceContext = {}, claims = {} }) {
  const idempotencyKey = `retrieve:${artifact.tenant_id}:${artifact.doc_id}:${mode}:${artifact.content_hash || ''}`;
  const provenance = normalizeProvenance(artifact.provenance || {}, { sourceSystem: 'vault-retriever', sourceKind: mode });

  const base = {
    mode,
    artifact_id: artifact.doc_id,
    discipline: artifact.discipline || null,
    audience_context: audienceContext,
    provenance,
    idempotency_key: idempotencyKey,
    retrieved_at: artifact.observed_at || artifact.appended_at,  // pinned to artifact timestamp, NOT Date.now()
    reasoning_context: {
      filter_applied: audienceContext.filter_applied || null,
      retrieval_mode: mode,
      schema_hint: SCHEMA_HINTS[mode],
    },
    evidence_links: [{
      artifact_id: artifact.doc_id,
      audit_idempotency_key: artifact.idempotency_key || null,
      provenance_summary: {
        system: provenance.source.system,
        kind: provenance.source.kind,
        timestamp: provenance.timestamp,
      },
    }],
  };

  // Mode-specific extensions
  if (mode === 'reason') {
    base.raw_content = artifact.content || null;
  }
  if (mode === 'apply') {
    base.template_context = buildTemplateContext(artifact, audienceContext);
  }
  if (mode === 'iterate') {
    base.verification_hook = buildVerificationHook(artifact);
  }

  return base;
}
```

**Determinism strategy:** `retrieved_at` is pinned to `artifact.observed_at` (the ingestion timestamp), NOT `Date.now()`. This ensures the same artifact produces the same pack on repeated calls. The idempotency key includes `content_hash` so artifact version changes produce new keys.

**`retrieve:` prefix:** Namespace separation from write-path keys (`${tenantId}:${docId}:${contentHash}`). Prevents key collisions across ingestion and retrieval paths.

### Pattern 4: Retrieval Scope Extension to visibility-scope.cjs

```javascript
// ADDED to visibility-scope.cjs
const ALLOWED_RETRIEVAL_ROLES = new Set(['operator', 'admin', 'agent']);

function checkRetrievalScope(claims, resourceContext) {
  const claimTenantId = String((claims && claims.tenantId) || '').trim();
  const claimRole = String((claims && claims.role) || '').trim();

  if (!claimTenantId || !claimRole) {
    return { allowed: false, code: 'E_RETRIEVAL_SCOPE_CLAIMS_MISSING', reason: '...' };
  }

  if (!ALLOWED_RETRIEVAL_ROLES.has(claimRole)) {
    return { allowed: false, code: 'E_RETRIEVAL_SCOPE_ROLE_DENIED', reason: `Role '${claimRole}' cannot access vault retrieval.` };
  }

  const resourceTenantId = String((resourceContext && resourceContext.tenantId) || '').trim();
  if (!resourceTenantId || claimTenantId !== resourceTenantId) {
    return { allowed: false, code: 'E_RETRIEVAL_SCOPE_TENANT_MISMATCH', reason: '...' };
  }

  return { allowed: true, code: null, reason: null };
}

module.exports = {
  // existing exports unchanged:
  checkVisibilityScope,
  projectAuditLineage,
  // new:
  checkRetrievalScope,
  ALLOWED_RETRIEVAL_ROLES,
};
```

**Note:** `ALLOWED_VISIBILITY_ROLES` (existing, ingestion-adjacent) stays untouched. `ALLOWED_RETRIEVAL_ROLES` is additive.

### Pattern 5: Supabase Stub Interface (audit-store.cjs annotation)

No code change to audit-store.cjs logic. Add a stub comment block documenting the persistence flip interface for Phase 87:

```javascript
// Phase 87 Supabase flip: replace module-level `entries = []` with:
//   const supabaseStore = require('./supabase-audit-adapter.cjs');
//   and route append/getAll through supabaseStore.
// Interface: supabaseStore.append(entry) / supabaseStore.getAll({tenantId})
// Current in-memory store is the reference implementation.
```

### Anti-Patterns to Avoid

- **`Date.now()` in `retrieved_at`** — breaks determinism; pin to artifact's stored timestamp
- **Fuzzy/prefix-only tag matching** — agents get noisy results; AND + exact match is correct for marketing vault precision
- **HTTP routes in Phase 86** — premature surface exposure; module-only keeps scope tight and Phase 87's route layer gets clean injection points
- **Extending audit-store.cjs with retrieval logic** — violates CQRS split; write-path and read-path must stay separate
- **Checking visibility in the filter** — visibility must happen BEFORE filter, not inside it; tenant pollution in filter pool is a data leak risk

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tenant isolation in retrieval | Custom tenant filter in vault-retriever | `projectAuditLineage(claims, records)` from visibility-scope.cjs | Already tested and proven tenant-safe in Phase 85 |
| Audience tag validation in query | Re-validate tags in retrieval-filter | `validateAudienceMetadata({discipline, audience})` from audience-schema.cjs | Consistent validation semantics with ingestion path |
| Provenance normalization in handoff | Custom provenance builder | `normalizeProvenance(raw, defaults)` from provenance-contract.cjs | Canonical provenance shape; deviating breaks ROLEV-02 result contracts |
| Retrieval idempotency key | Timestamp-based key | `retrieve:${tenantId}:${docId}:${mode}:${contentHash}` — fixed string concat | Timestamps are non-deterministic; content-addressed key is stable across calls |

## Common Pitfalls

### Pitfall 1: Retrieved_at varies between calls → breaks ROLEV-03 determinism
**What goes wrong:** Using `Date.now()` or `new Date().toISOString()` in `retrieved_at` means the same artifact retrieved twice produces different handoff packs.
**How to avoid:** Pin `retrieved_at` to `artifact.observed_at` or `artifact.appended_at` (the stored ingestion timestamp).
**Warning signs:** Two `retrieveReason` calls with the same inputs produce different `idempotency_key` values.

### Pitfall 2: Filter applied before tenant isolation → cross-tenant data leak
**What goes wrong:** If `applyFilter` runs on all entries before `projectAuditLineage`, a discipline filter could return entries from other tenants.
**How to avoid:** Always `projectAuditLineage(claims, allEntries)` first, then `applyFilter(scopedEntries, filter)`.
**Warning signs:** Test asserting tenant isolation fails when filter is present.

### Pitfall 3: AND filter with empty audience_tags array = excludes all results
**What goes wrong:** `audience_tags: []` treated as "must match all of zero tags" could either pass all or fail depending on implementation.
**How to avoid:** Skip audience filter application entirely if `audience_tags` is empty or absent. Zero tags = no audience filter constraint.
**Warning signs:** `applyFilter(entries, { audience_tags: [] })` returns empty array instead of all entries.

### Pitfall 4: Mode-specific fields in base when mode doesn't apply
**What goes wrong:** Always including `raw_content`, `template_context`, and `verification_hook` in every mode produces bloated payloads and confuses LLM consumers.
**How to avoid:** Mode-specific fields ONLY when mode matches — `raw_content` in Reason only, `template_context` in Apply only, `verification_hook` in Iterate only.
**Warning signs:** Reason mode result contains `verification_hook: null`.

### Pitfall 5: Mutation of audit-store entries via retrieval
**What goes wrong:** If vault-retriever accidentally mutates retrieved objects (e.g., adding `retrieved_at` field directly to entry object), audit-store state is poisoned.
**How to avoid:** Never mutate passed objects; build new handoff pack objects: `const base = { mode, artifact_id: artifact.doc_id, ... }` — artifact is read-only input.
**Warning signs:** Audit-store entry has unexpected `mode` or `idempotency_key` fields after retrieval call.

## Code Examples

### vault-retriever.cjs factory skeleton
```javascript
'use strict';
const { projectAuditLineage } = require('./visibility-scope.cjs');
const { applyFilter } = require('./retrieval-filter.cjs');
const { buildHandoffPack } = require('./handoff-pack.cjs');

function createVaultRetriever(options = {}) {
  const getArtifacts = asFunction(options.getArtifacts, 'E_RETRIEVER_ARTIFACTS_REQUIRED', ...);

  async function retrieve({ tenantId, claims, filter = {}, mode }) {
    const all = await getArtifacts({ tenantId });
    const scoped = projectAuditLineage(claims, all);            // tenant isolation FIRST
    const filtered = applyFilter(scoped, filter);               // THEN filter
    const audienceContext = { ...(filter || {}), filter_applied: !!filter.discipline || !!(filter.audience_tags && filter.audience_tags.length) };
    return filtered.map(artifact => buildHandoffPack({ mode, artifact, audienceContext, claims }));
  }

  return {
    retrieveReason: (args) => retrieve({ ...args, mode: 'reason' }),
    retrieveApply:  (args) => retrieve({ ...args, mode: 'apply' }),
    retrieveIterate: (args) => retrieve({ ...args, mode: 'iterate' }),
  };
}

module.exports = { createVaultRetriever };
```

### Test fixture pattern (mirrors Phase 85 test structure)
```javascript
// test/phase-86/vault-retriever.test.js
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createVaultRetriever } = require('../../onboarding/backend/vault/vault-retriever.cjs');

function makeArtifact(overrides = {}) {
  return {
    tenant_id: 'tenant-alpha',
    doc_id: 'paid-media/doc-01',
    discipline: 'Paid_Media',
    audience: ['ICP:SMB'],
    pain_point_tags: ['high_cac'],
    content: 'raw article content',
    observed_at: '2026-04-12T10:00:00.000Z',
    idempotency_key: 'tenant-alpha:paid-media/doc-01:abc123',
    content_hash: 'abc123',
    ...overrides,
  };
}

test('86-01 retrieveReason returns mode:reason with raw_content', async () => {
  const retriever = createVaultRetriever({
    getArtifacts: async () => [makeArtifact()],
  });
  const results = await retriever.retrieveReason({
    tenantId: 'tenant-alpha',
    claims: { tenantId: 'tenant-alpha', role: 'agent' },
  });
  assert.equal(results.length, 1);
  assert.equal(results[0].mode, 'reason');
  assert.ok(results[0].raw_content);
  assert.ok(!('template_context' in results[0]));
  assert.ok(!('verification_hook' in results[0]));
});
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node built-in test runner (`node --test`) |
| Config file | none (script-driven via `package.json`) |
| Quick run command | `node --test "test/phase-86/*.test.js"` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ROLEV-01 | Reason mode returns raw_content + provenance (no template/verification fields) | unit | `node --test test/phase-86/vault-retriever.test.js` | NO (Wave 0) |
| ROLEV-01 | Apply mode returns template_context pre-filled from audience metadata | unit | `node --test test/phase-86/vault-retriever.test.js` | NO (Wave 0) |
| ROLEV-01 | Iterate mode returns verification_hook with deterministic shape | unit | `node --test test/phase-86/vault-retriever.test.js` | NO (Wave 0) |
| ROLEV-02 | Discipline-only filter returns only matching discipline entries | unit | `node --test test/phase-86/retrieval-filter.test.js` | NO (Wave 0) |
| ROLEV-02 | Audience-tags AND filter returns only entries matching ALL tags | unit | `node --test test/phase-86/retrieval-filter.test.js` | NO (Wave 0) |
| ROLEV-02 | No-filter returns all tenant-scoped entries (passthrough) | unit | `node --test test/phase-86/retrieval-filter.test.js` | NO (Wave 0) |
| ROLEV-02 | Cross-tenant entries never returned (tenant isolation) | integration | `node --test test/phase-86/vault-retriever.test.js` | NO (Wave 0) |
| ROLEV-03 | Idempotency key is stable across repeated calls with same inputs | unit | `node --test test/phase-86/handoff-pack.test.js` | NO (Wave 0) |
| ROLEV-03 | Evidence links reference artifact_id + audit_idempotency_key | unit | `node --test test/phase-86/handoff-pack.test.js` | NO (Wave 0) |
| ROLEV-03 | retrieved_at is pinned to artifact timestamp (not wall clock) | unit | `node --test test/phase-86/handoff-pack.test.js` | NO (Wave 0) |

### Sampling Rate
- **Per task commit:** `node --test "test/phase-86/*.test.js"`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `test/phase-86/retrieval-filter.test.js` — pure AND filter logic, tag matching, empty tag passthrough
- [ ] `test/phase-86/handoff-pack.test.js` — idempotency key determinism, mode field isolation, evidence links
- [ ] `test/phase-86/vault-retriever.test.js` — all three mode methods, tenant isolation, filter integration

## Scope Decision Summary (agent's discretion resolved)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| D-01 Reason fields | `{mode, artifact_id, raw_content, discipline, audience_context, provenance, reasoning_context, evidence_links, idempotency_key, retrieved_at}` | Minimal field set needed for LLM to understand context + source |
| D-02 Apply mode | Partial pre-fill: `template_context: {discipline, audience, pain_point_tags, business_model}` from artifact metadata | Enough for agents to instantiate templates without extra reasoning |
| D-03 Iterate verification | `verification_hook: {expected_outcome_pattern, evidence_artifact_id, comparison_fields[]}` descriptive object; agents implement the comparison | Avoids active code execution in retrieval layer — agents own the loop |
| D-04 Contract shape | Single `createVaultRetriever` factory with three methods | Mirrors `createIngestApply` exactly; cleanest injection pattern |
| D-05 Filter semantics | AND (both discipline AND audience_tags when both provided) | Marketing vault is precision-retrieval; noise is costly |
| D-06 No-filter behavior | Return all tenant-scoped entries | Safe (tenant-isolated); zero-filter = "get all" is a valid pattern |
| D-07 Tag matching | Exact string match on full tag (`ICP:SMB`) | Ingestion normalizer produces canonical tags; prefix-only match is hazardous |
| D-08 Enforcement layer | Module-layer in `vault-retriever.cjs` | Keeps API surface clean; enforcement is injected via `checkRetrievalScope`|
| D-09 Field set | Standard: all base fields + mode-specific extension | Minimal adds test burden; full-trace adds noise; standard is the sweet spot |
| D-10 Evidence links | Array of `{artifact_id, audit_idempotency_key, provenance_summary}` | Full provenance inline is redundant (already in `provenance` field) |
| D-11 Shape | Unified base + mode extensions (not separate schemas) | One type to reason about; mode extensions are few and obvious |
| D-12 Determinism | Pin `retrieved_at` to artifact's stored timestamp; idempotency key = `retrieve:{tenantId}:{docId}:{mode}:{contentHash}` | Eliminates wall-clock variance; content-addressed versioning |
| D-13 Supabase migration | Keep in-memory; add stub interface comment for Phase 87 flip | Phase 86 is the retrieval contract phase; persistence is an orthogonal concern |
| D-14 New file | New `vault-retriever.cjs` (CQRS read path) | CQRS principle: no mixing write and read paths in `audit-store.cjs` |
| D-15 HTTP routes | Module-only; no HTTP in Phase 86 | Scope discipline; Phase 87 will wire HTTP with clean injection points |

## Sources

### Primary (HIGH confidence — direct codebase archaeology)
- `onboarding/backend/vault/ingest-apply.cjs` — factory pattern to mirror exactly
- `onboarding/backend/vault/audit-store.cjs` — read source with Phase 86+ annotation
- `onboarding/backend/vault/visibility-scope.cjs` — tenant isolation contract to extend
- `onboarding/backend/vault/audience-schema.cjs` — tag validation contract reuse
- `onboarding/backend/vault/provenance-contract.cjs` — provenance normalization contract
- `onboarding/backend/vault/idempotency-key.cjs` — key pattern to extend with `retrieve:` prefix
- `onboarding/backend/vault/audit-log.cjs` — factory pattern reference (injected `append` sink)
- `test/phase-85/audience-visibility.test.js` — test structure reference for Phase 86 tests

### Secondary (MEDIUM confidence)
- Phase 85 RESEARCH.md — established patterns for Validation Architecture section
- REQUIREMENTS.md §ROLEV-01..03 — exact requirement wording for test-to-requirement traceability

### Tertiary
- None — all research grounded in local codebase

## Metadata

**Confidence breakdown:**
- Architecture (new file layout): HIGH — direct extension of established Phase 84/85 patterns
- Implementation details (key format, filter semantics, mode fields): HIGH — derived from explicit requirement text and existing contracts
- Test coverage (assertions, file structure): HIGH — mirrors Phase 85 test patterns directly

**Research date:** 2026-04-12
**Valid until:** 2026-06-12
