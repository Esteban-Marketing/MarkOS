# Phase 85: Ingestion Pipeline and Bidirectional Obsidian Sync - Research

**Researched:** 2026-04-12
**Domain:** Obsidian-backed content ingestion, filesystem sync, idempotent indexing, and PageIndex re-index orchestration
**Confidence:** MEDIUM-HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

### D-01: Vault Structure - Hybrid Organization
**Decision:** Organize artifacts hierarchically by discipline (Paid_Media, Content_SEO, Lifecycle_Email, Social, Landing_Pages) with cross-cutting semantic tags/indices for discovery by audience, pain-point, concept type, or execution stage.

### D-02: PageIndex Replaces Vector Store Entirely
**Decision:** Migrate from Supabase+Upstash vector retrieval to PageIndex as the primary agentic retrieval layer. Drop legacy vector store infrastructure; this is not a bridge migration.

### D-03: Marketing Audiences Dual Organization
**Decision:** Structure artifacts by primary concept (strategy, insights, content templates, execution tactics) with secondary indices by marketing audience persona (ICP, segment, decision-maker role, pain-point).

### D-04: Agentic-Ready - Three Execution Modes
**Decision:** Agents can:
1. **Retrieve + Reason** - Pull concepts, apply LLM reasoning to customize
2. **Retrieve + Apply** - Direct template execution without extra reasoning
3. **Retrieve + Iterate** - Multi-step loops, verify outcomes, refine tactics based on vault evidence

### D-05: Obsidian Integration - Best Practice, Not Overkill
**Decision:** Operators edit and organize vault artifacts through Obsidian Mind with minimal friction. Use file-watcher or sync API for bidirectional updates without manual commit steps.

### D-06: Full Migration - Legacy Cleanup
**Decision:** No legacy Supabase+Upstash retrieval paths remain. Ingest-literacy, vector-store-client, and related Phase 32 runtime are refactored or removed. This is not a parallel migration.

### D-07: Execution Handoff - Hardened Verification Without Heavy Gates
**Decision:** Agents retrieve and execute vault content with on-demand access. High-risk executions (outbound send, CRM mutation, publish decision) use hardened verification (agent logs reasoning, outcome compared to vault evidence) but not human approval gates (those are scoped to strategy role decisions, not execution).

### D-08: Preservation - v3.4.0 Non-Regression
**Decision:** v3.4.0 branding determinism, governance, and UAT guarantees remain non-negotiable baselines. Vault scope is additive; no breaking changes to brand/governance surfaces.

### Claude's Discretion
- From CONTEXT.md gray-area mapping, D-05 sync implementation is explicitly marked "TBD in research".

### Deferred Ideas (OUT OF SCOPE)
- None explicitly listed in CONTEXT.md.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| LITV-01 | Operators can edit and organize vault artifacts through Obsidian Mind interface with automatic bidirectional sync to backend (no manual publish steps). | Chokidar-based watcher model, bounded vault roots, event normalization, and non-destructive sync contract. |
| LITV-02 | Obsidian edits trigger backend indexing, audit trail recording, and PageIndex re-indexing without operator intervention. | Event-to-job pipeline with provenance envelope and async re-index queue with retries/backpressure. |
| LITV-03 | Repeated ingestion/edits are idempotent; conflict resolution is last-write-wins with full audit recovery path. | Deterministic artifact keys, upsert-on-conflict semantics, monotonic write timestamps, immutable audit log entries. |
| LITV-04 | Ingestion accepts audience-tagged artifacts and enforces metadata validation before indexing. | Strict frontmatter schema gate and audience-tag validation before persistence/index calls. |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- Read order is mandated: `.protocol-lore/QUICKSTART.md`, `.protocol-lore/INDEX.md`, `.planning/STATE.md`, `.agent/markos/MARKOS-INDEX.md`.
- Use GSD and MarkOS boundaries correctly (engineering workflow vs marketing protocol).
- Primary CLI install/update path is `npx markos`.
- Test command baseline is `npm test` (equivalent to `node --test test/**/*.test.js`).
- Local onboarding runtime is `node onboarding/backend/server.cjs`.

## Summary

Phase 85 should implement a filesystem-driven ingestion loop that treats Obsidian markdown files as the source of truth, converts each stable file event into a deterministic ingest operation, and emits a lineage-complete audit trail before any PageIndex re-index attempt. Existing repository contracts already provide strong primitives: vault path safety and provenance normalization (`vault-writer.cjs` and `provenance-contract.cjs`), strict retrieval contract enforcement (`retrieval-envelope.cjs`), and baseline idempotent ingestion (`ingest-literacy.cjs` supersede+upsert behavior).

The highest-leverage approach is to introduce a dedicated sync orchestrator that: (1) debounces/normalizes watch events, (2) computes canonical document identity (`doc_id` + tenant + path lineage), (3) validates metadata including audience tags before storage/index writes, (4) writes a durable audit event, then (5) schedules PageIndex re-index via a bounded retry queue. This architecture directly satisfies LITV-01..04 and reduces risk from editor atomic writes, duplicate events, and transient index/API failures.

**Primary recommendation:** Implement a chokidar-based event ingest queue with deterministic idempotency keys, strict metadata/audience schema gating, and audit-first then index semantics.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| chokidar | 5.0.0 | Cross-platform file watching with normalized add/change/unlink events | Handles editor atomic writes and platform edge cases better than raw `fs.watch` |
| @supabase/supabase-js | 2.58.0 (repo pinned) | Metadata/audit persistence and upsert conflict control | Already production-standard in repo; supports conflict-aware upsert flow |
| node:fs/promises + node:path | Node >=20.16.0 | Canonical path resolution and safe file IO | Native runtime primitives already used across backend modules |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| p-queue | 9.1.2 | Bounded concurrency and backpressure for re-index jobs | Use for retrying PageIndex re-index without stampeding |
| front-matter | 4.0.2 | Stable frontmatter extraction from markdown | Keep parse behavior aligned with existing ingestion contracts |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| chokidar | raw `fs.watch` | `fs.watch` has platform caveats, filename nullability, and inconsistent semantics across environments |
| p-queue | custom in-memory queue | Hand-rolled retries/visibility and bounded concurrency are easy to get wrong |
| front-matter | custom regex parser | Regex parsers break on edge cases and drift from existing parser behavior |

**Installation:**
```bash
npm install chokidar p-queue front-matter
```

**Version verification (npm registry):**
- `chokidar` -> 5.0.0 (verified via `npm view chokidar version`)
- `p-queue` -> 9.1.2 (verified via `npm view p-queue version`)
- `front-matter` -> 4.0.2 (verified via `npm view front-matter version`)

## Architecture Patterns

### Recommended Project Structure
```text
onboarding/backend/vault/
  sync-orchestrator.cjs      # watch lifecycle + event normalization
  ingest-router.cjs          # maps file event -> ingest operation
  audience-schema.cjs        # strict audience tag validation
  audit-log.cjs              # append-only lineage events
onboarding/backend/pageindex/
  reindex-queue.cjs          # bounded retries/backpressure for re-index
bin/
  sync-vault.cjs             # local/dev command to run watcher
```

### Pattern 1: Audit-First Event Pipeline
**What:** Persist lineage/audit event before PageIndex mutation.
**When to use:** Every add/change/unlink ingest event.
**Example:**
```javascript
// Source: existing provenance+vault patterns in onboarding/backend/vault
const normalized = normalizeProvenance(provenance);
validateProvenance(normalized);
await auditLog.append({ eventType, docId, normalized, observedAt });
await reindexQueue.enqueue({ docId, reason: eventType, observedAt });
```

### Pattern 2: Deterministic Idempotency Key
**What:** Stable key per logical artifact revision (`tenant + doc_id + content_hash`).
**When to use:** Upsert and re-index dedupe.
**Example:**
```javascript
const idempotencyKey = `${tenantId}:${docId}:${contentHash}`;
if (await seenCache.has(idempotencyKey)) return;
await seenCache.put(idempotencyKey);
await ingestOneDocument(doc);
```

### Pattern 3: Last-Write-Wins with Recovery
**What:** Resolve conflicts by monotonic observed timestamp while preserving full previous version lineage.
**When to use:** Concurrent Obsidian and backend edits.
**Example:**
```javascript
if (incoming.updatedAt >= stored.updatedAt) {
  await saveLatest(incoming);
  await auditLog.append({ type: 'supersede', supersedes: stored.versionId });
}
```

### Anti-Patterns to Avoid
- **Direct `fs.watch` as sole signal source:** inconsistent events and missing filenames across platforms can break ingest determinism.
- **Index-before-audit:** loses recovery evidence when index call fails halfway.
- **Schema-light frontmatter acceptance:** pollutes retrieval/index with malformed audience metadata.
- **Unbounded parallel re-index:** causes retries to amplify load and hide root-cause failures.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cross-platform file event normalization | Custom watcher wrappers around `fs.watch` | `chokidar` | Handles atomic/chunked writes and normalizes platform differences |
| Retry/backpressure scheduler | Ad-hoc Promise arrays + setTimeout loops | `p-queue` with bounded concurrency | Better queue control and failure containment |
| Frontmatter parser/validator by regex | DIY markdown metadata parsing | `front-matter` + explicit schema validator | Reduces parsing edge-case bugs and drift |
| Upsert conflict merge logic in app-only code | Manual pre-check then insert/update branches | Supabase upsert + on-conflict semantics | Avoids race-prone check-then-write flow |

**Key insight:** For this phase, correctness failures are mostly from race conditions and malformed metadata, not from missing core APIs. Standard libraries reduce those risks dramatically.

## Common Pitfalls

### Pitfall 1: Duplicate ingest from editor atomic writes
**What goes wrong:** One user save triggers multiple add/change events and duplicate indexing.
**Why it happens:** Editors write temp files then rename.
**How to avoid:** Enable watcher stability controls and dedupe with idempotency key.
**Warning signs:** Burst of identical `doc_id` updates within seconds.

### Pitfall 2: Audience metadata drift
**What goes wrong:** Invalid or partially tagged artifacts enter index.
**Why it happens:** Validation occurs after storage/index call.
**How to avoid:** Enforce required audience schema before any write.
**Warning signs:** Retrieval responses missing expected audience filters.

### Pitfall 3: Lost lineage on partial failure
**What goes wrong:** Content updates but no traceable audit event for who/what/when.
**Why it happens:** Audit log emitted after mutation call.
**How to avoid:** Audit-first sequence with immutable append.
**Warning signs:** Re-index failures without matching artifact change evidence.

### Pitfall 4: Retry storm on PageIndex outages
**What goes wrong:** Re-index queue overloads downstream and increases latency.
**Why it happens:** Unbounded retries without jitter/backoff.
**How to avoid:** Bounded queue, capped attempts, exponential backoff, dead-letter capture.
**Warning signs:** Growing pending queue with repeated same-key failures.

## Code Examples

Verified patterns from official docs and current codebase:

### Watch and process stable file events
```javascript
// Source: chokidar README + Node fs caveats
const chokidar = require('chokidar');

const watcher = chokidar.watch(vaultRoot, {
  ignoreInitial: true,
  awaitWriteFinish: { stabilityThreshold: 500, pollInterval: 100 },
  atomic: true
});

watcher
  .on('add', (path) => enqueueEvent('add', path))
  .on('change', (path) => enqueueEvent('change', path))
  .on('unlink', (path) => enqueueEvent('unlink', path));
```

### Metadata gate before indexing
```javascript
// Source: existing ingest-literacy required metadata checks
function assertMetadata(meta) {
  const required = ['doc_id', 'discipline', 'business_model', 'pain_point_tags', 'audience'];
  for (const key of required) {
    if (!meta[key]) throw new Error(`missing required field: ${key}`);
  }
}
```

### Audit-first then re-index
```javascript
// Source: provenance-contract + pageindex client contract patterns
const provenance = normalizeProvenance(rawProvenance);
validateProvenance(provenance);

await auditLog.append({ docId, action: 'reindex_requested', provenance, ts: Date.now() });
await pageIndexQueue.enqueue({ docId, provenance });
```

### Supabase idempotent upsert pattern
```javascript
// Source: Supabase JS docs upsert semantics
await supabase
  .from('literacy_assets')
  .upsert(row, { onConflict: 'tenant_id,doc_id,content_hash' });
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node built-in test runner (`node --test`) |
| Config file | none (script-driven via `package.json`) |
| Quick run command | `node --test test/literacy-ingest.test.js` |
| Full suite command | `npm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LITV-01 | Bidirectional Obsidian sync flow | integration | `node --test test/phase-85/obsidian-sync.test.js` | NO (Wave 0) |
| LITV-02 | Auto index + audit on edit | integration | `node --test test/phase-85/reindex-audit-pipeline.test.js` | NO (Wave 0) |
| LITV-03 | Idempotent ingest + LWW conflict recovery | unit/integration | `node --test test/phase-85/idempotency-lww.test.js` | NO (Wave 0) |
| LITV-04 | Audience metadata validation gate | unit | `node --test test/phase-85/audience-validation.test.js` | NO (Wave 0) |

### Sampling Rate
- **Per task commit:** `node --test test/phase-85/*.test.js`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `test/phase-85/obsidian-sync.test.js` - event normalization and bidirectional sync coverage
- [ ] `test/phase-85/reindex-audit-pipeline.test.js` - audit-first and re-index trigger ordering
- [ ] `test/phase-85/idempotency-lww.test.js` - dedupe keys and conflict precedence
- [ ] `test/phase-85/audience-validation.test.js` - schema gate and rejection cases

## Sources

### Primary (HIGH confidence)
- Repository contracts: `onboarding/backend/vault/vault-writer.cjs`, `onboarding/backend/vault/provenance-contract.cjs`, `onboarding/backend/pageindex/pageindex-client.cjs`, `onboarding/backend/pageindex/retrieval-envelope.cjs`, `bin/ingest-literacy.cjs`
- Node.js docs: https://nodejs.org/api/fs.html#fswatchfilename-options-listener (caveats, availability, filename reliability)
- Chokidar README: https://github.com/paulmillr/chokidar#readme (atomic writes, awaitWriteFinish, normalized events)
- Supabase JS upsert docs: https://supabase.com/docs/reference/javascript/upsert (upsert conflict behavior)

### Secondary (MEDIUM confidence)
- Existing MarkOS Phase 84 research and tests for provenance/retrieval isolation patterns (`test/phase-84/*.test.js`, `84-RESEARCH.md`)

### Tertiary (LOW confidence)
- None used for core recommendations.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - verified package versions and direct fit to known ingestion failure modes
- Architecture: MEDIUM-HIGH - strongly grounded in current repo contracts; final queue/error policy details still implementation-defined
- Pitfalls: HIGH - directly supported by Node/chokidar caveats and existing ingestion semantics

**Research date:** 2026-04-12
**Valid until:** 2026-05-12
