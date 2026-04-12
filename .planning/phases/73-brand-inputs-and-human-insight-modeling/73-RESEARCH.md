# Phase 73: Brand Inputs and Human Insight Modeling - Research

**Researched:** 2026-04-11
**Domain:** Deterministic brand-input capture, normalization, and tenant-safe evidence graph construction
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
### Input Scope Shape
- **D-01:** Phase 73 will support one primary brand profile plus multiple audience segments (2-5) in the first implementation slice.

### Pain/Need/Expectation Data Model
- **D-02:** The model is strict and typed, with bounded arrays and required rationale fields for key pain/need/expectation captures.
- **D-03:** Inputs should produce explicit structured fields rather than free-form-only blocks so normalization and graph generation remain deterministic.

### Normalization Policy
- **D-04:** Use hybrid normalization: preserve raw text while also creating canonical normalized nodes and alias mappings.

### Intake Surface Strategy
- **D-05:** Extend existing onboarding/interview schema and handlers for Phase 73, rather than introducing a separate brand-input API surface in this phase.

### Determinism and Re-run Rules
- **D-06:** Use stable composite identity keys plus content fingerprints per normalized node so identical submissions generate identical graph outputs and idempotent updates.

### PII and Retention Boundaries
- **D-07:** Apply minimal-text retention with secret redaction and metadata-first evidence trails.
- **D-08:** Preserve required analyst-grade context, but avoid broad raw-text retention that increases privacy risk without deterministic benefit.

### Claude's Discretion
- Field-level naming conventions for normalized-node internals where they do not alter contract semantics.
- Exact confidence scoring formula, as long as it is deterministic and traceable.
- Implementation detail of validation messaging and UI copy.

### Deferred Ideas (OUT OF SCOPE)
- A dedicated standalone brand-input API surface (deferred; current decision is to extend onboarding handlers first).
- Unlimited audience segment support from day one (deferred; current bound is 2-5 segments).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BRAND-INP-01 | Operators can capture structured brand concept inputs including audience pains, needs, expectations, and desired outcomes. | Strict JSON Schema contract extension, compiled validation, bounded arrays, and required rationale fields in onboarding handlers. |
| BRAND-INP-02 | The engine normalizes raw brand input into a deterministic evidence graph usable by downstream strategy and identity stages. | Canonical normalization pipeline with stable identity keys, RFC 8785-style canonicalization before SHA-256 fingerprinting, and tenant-scoped idempotent upsert semantics. |
</phase_requirements>

## Summary

Phase 73 should be implemented as a deterministic extension of existing onboarding flows, not as a new API surface. The current codebase already has the right extension seams: typed onboarding schema (`onboarding/onboarding-seed.schema.json`), intake handlers (`onboarding/backend/handlers.cjs`), retention/redaction controls (`onboarding/backend/runtime-context.cjs`), and persistence adapters (`onboarding/backend/vector-store-client.cjs`).

The critical unknown-that-breaks-later risk is not UI capture; it is normalization determinism. If normalization relies on ad-hoc object ordering, LLM free-form extraction, or non-canonical hashes, downstream strategy and identity phases will receive unstable evidence nodes. The fix is a strict validation + canonicalization + fingerprint pipeline that is deterministic by construction.

Tenant safety should remain fail-closed by inheriting existing execution context (`tenant_id`, `actor_id`, request correlation) and by making tenant-scoped keys mandatory in every normalized node and edge record.

**Primary recommendation:** Implement a three-stage deterministic intake pipeline: `validate -> normalize/canonicalize -> fingerprint/upsert`, fully inside existing onboarding handlers.

## Project Constraints (from CLAUDE.md)

- Mandatory context order: read `.protocol-lore/QUICKSTART.md`, then `.protocol-lore/INDEX.md`, then `.planning/STATE.md`, then `.agent/markos/MARKOS-INDEX.md`.
- Keep GSD concerns under `.agent/get-shit-done/` and MarkOS protocol concerns under `.agent/markos/`; keep client overrides only under `.markos-local/`.
- Primary CLI install/update surface remains `npx markos`.
- Canonical test commands remain `npm test` or `node --test test/**/*.test.js`.
- Local onboarding UI runtime remains `node onboarding/backend/server.cjs`.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| JSON Schema (draft-07 for this phase contract) | draft-07 in repo | Source-of-truth input contract for strict typed capture | Existing onboarding schema is draft-07 and already used by current intake stack. |
| ajv | 8.18.0 (npm modified 2026-02-20) | Compiled schema validator with deterministic error surfaces | Officially supports draft-04/06/07/2019-09/2020-12 and compiles schemas to fast JS validators. |
| json-canonicalize | 2.0.0 (npm modified 2025-06-29) | Canonical JSON serialization before hashing | Aligns with RFC 8785-style canonicalization goals and removes object-order nondeterminism. |
| Node `crypto` SHA-256 | Node v22.13.0 runtime | Content fingerprint for idempotent normalization | Already used in codebase checksum patterns and no extra dependency needed. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@supabase/supabase-js` | 2.58.0 (installed) | Tenant-safe relational persistence for normalized evidence | Use for canonical node/edge relational records and lineage metadata. |
| `@upstash/vector` | 1.2.3 (installed) | Vector-side evidence indexing for retrieval use cases | Use after deterministic node formation; never as the source of normalization truth. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `ajv` | `zod` | Zod is ergonomic, but this phase already depends on JSON Schema contracts and OpenAPI-aligned flows, so Ajv is lower-friction and more contract-native. |
| `json-canonicalize` | `fast-json-stable-stringify` | Stable-stringify handles key ordering but is not RFC 8785-oriented; canonicalize gives stricter cross-runtime canonical semantics for fingerprints. |

**Installation:**
```bash
npm install ajv json-canonicalize
```

**Version verification:**
```bash
npm view ajv version
npm view ajv time.modified
npm view json-canonicalize version
npm view json-canonicalize time.modified
```

Verified in this environment:
- `ajv` = `8.18.0` (modified `2026-02-20T18:09:33.746Z`)
- `json-canonicalize` = `2.0.0` (modified `2025-06-29T06:03:06.043Z`)

## Architecture Patterns

### Recommended Project Structure
```
onboarding/
├── onboarding-seed.schema.json            # Extend with strict brand input sections
└── backend/
    ├── handlers.cjs                       # Extend existing submit/interview handlers
    ├── runtime-context.cjs                # Reuse tenant/retention/redaction boundaries
    ├── extractors/                        # Keep extraction optional, never normalization truth
    └── brand-inputs/
        ├── normalize-brand-input.cjs      # Deterministic normalization orchestration
        ├── canonicalize-brand-node.cjs    # Canonical JSON + fingerprint helpers
        └── evidence-graph-writer.cjs      # Tenant-scoped idempotent upsert adapter
```

### Pattern 1: Compile-Once Schema Validation
**What:** Compile JSON schema once at process boot and reuse validator function.
**When to use:** Every submit and parse-answer path that writes structured concept data.
**Example:**
```javascript
// Source: https://ajv.js.org/guide/getting-started.html
const Ajv = require('ajv');
const ajv = new Ajv({ allErrors: true, strict: true });
const validateBrandInput = ajv.compile(brandInputSchema);

function assertValid(payload) {
  const ok = validateBrandInput(payload);
  if (!ok) {
    const err = new Error('INVALID_BRAND_INPUT');
    err.details = validateBrandInput.errors;
    throw err;
  }
}
```

### Pattern 2: Canonicalize Then Fingerprint
**What:** Canonicalize normalized nodes/edges before hashing.
**When to use:** Node identity, edge identity, idempotent upsert checks, replay-diff assertions.
**Example:**
```javascript
// Source: https://www.rfc-editor.org/rfc/rfc8785 and https://www.npmjs.com/package/json-canonicalize
const { canonicalize } = require('json-canonicalize');
const crypto = require('crypto');

function fingerprint(record) {
  const canonical = canonicalize(record);
  return crypto.createHash('sha256').update(canonical, 'utf8').digest('hex');
}
```

### Pattern 3: Tenant-Scoped Composite IDs
**What:** Every normalized node key includes `tenant_id` + semantic type + canonical payload hash.
**When to use:** Node and edge key generation.
**Example:**
```javascript
function buildNodeId({ tenantId, nodeType, canonicalPayloadHash }) {
  return `${tenantId}:${nodeType}:${canonicalPayloadHash}`;
}
```

### Anti-Patterns to Avoid
- **LLM output as normalization truth:** LLM extraction is useful for assistive parsing, but deterministic graph generation must run from validated typed fields.
- **Raw `JSON.stringify` for hashing:** Property insertion order differences can create hash drift across equivalent payloads.
- **Tenant-agnostic node IDs:** Omitting tenant scope risks cross-tenant collisions and leakage.
- **Unbounded text blobs as first-class graph nodes:** Violates retention and determinism constraints.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON schema validation engine | Custom recursive validators | `ajv` compiled validators | Custom validators miss edge cases and produce inconsistent errors over time. |
| JSON canonicalization | Homegrown key-sorting serializer | `json-canonicalize` (RFC 8785 aligned behavior) | Canonicalization edge cases (numbers, arrays, unicode) are error-prone. |
| Hashing primitives | Custom hash function logic | Node `crypto.createHash('sha256')` | Built-in crypto is maintained, deterministic, and widely audited. |
| Redaction policy parser | New ad-hoc redact function | Existing `redactSensitive` + retention policy from `runtime-context.cjs` | Existing runtime policy is already aligned with hosted/local boundaries. |

**Key insight:** Determinism failures usually come from tiny serialization inconsistencies, not from major business logic bugs. Use battle-tested canonicalization/validation libraries.

## Common Pitfalls

### Pitfall 1: Stable Input, Unstable Graph
**What goes wrong:** Same semantic input generates different node hashes on re-run.
**Why it happens:** Hashing non-canonical JSON strings or including nondeterministic metadata (timestamps) in hash material.
**How to avoid:** Canonicalize payload and hash only deterministic fields; keep runtime timestamps outside identity payload.
**Warning signs:** Re-run tests fail with only hash or node-id drift.

### Pitfall 2: Structured Contract Drift in Interview Loop
**What goes wrong:** Interview parse-answer enriches shape that diverges from schema constraints.
**Why it happens:** LLM extraction writes partial free-form fields without strict contract enforcement.
**How to avoid:** Revalidate every post-interview update against the same compiled schema before normalization.
**Warning signs:** Frequent downstream null checks or fallback branches for missing rationale fields.

### Pitfall 3: Tenant Isolation Regressions in Evidence Writes
**What goes wrong:** Evidence nodes from one tenant appear in another tenant read path.
**Why it happens:** Missing tenant key in node IDs or persistence filter conditions.
**How to avoid:** Require `tenant_id` in all node/edge records and key constructors; fail writes if absent.
**Warning signs:** Identical node IDs across tenant fixtures.

### Pitfall 4: Over-Retention of Raw Text
**What goes wrong:** Privacy risk grows and deterministic audits become harder.
**Why it happens:** Raw interview transcripts stored as first-class evidence instead of metadata-linked references.
**How to avoid:** Store minimal contextual snippets + redacted metadata; keep canonical normalized fields as the durable truth.
**Warning signs:** Evidence records contain full unredacted free-text payloads by default.

## Code Examples

Verified patterns from official sources and codebase seams:

### Compiled Validator Initialization
```javascript
// Source: https://ajv.js.org/guide/getting-started.html
const Ajv = require('ajv');
const ajv = new Ajv({ allErrors: true, strict: true });
const validate = ajv.compile(schema);
```

### Canonical Fingerprint Function
```javascript
// Source: https://www.rfc-editor.org/rfc/rfc8785
const { canonicalize } = require('json-canonicalize');
const crypto = require('crypto');

function toDeterministicHash(data) {
  const canonical = canonicalize(data);
  return crypto.createHash('sha256').update(canonical, 'utf8').digest('hex');
}
```

### Existing Checksum Pattern in Current Codebase
```javascript
// Source: onboarding/backend/handlers.cjs
function createChecksum(content) {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Free-form capture + post-hoc interpretation | Strict typed capture with deterministic normalization and lineage | Ongoing (branding milestone kickoff 2026-04) | Makes downstream strategy/identity regeneration reproducible. |
| Hashing raw serialized objects | Canonicalize first, then hash | RFC 8785 ecosystem maturation (2020 onward) | Prevents equivalent-object hash drift and idempotency breaks. |
| Schema-by-convention in code comments | Explicit JSON Schema/OpenAPI contracts | Existing MarkOS contract baseline (Phases 45-48 and onboarding schema) | Enables consistent validation gates and auditable change control. |

**Deprecated/outdated:**
- Treating LLM extraction output as canonical persistence truth for critical graph identity fields.

## Open Questions

1. **Should normalized graph edges live in current tables/collections or a dedicated `brand_evidence_*` namespace?**
   - What we know: Existing Supabase + Upstash adapters already support tenant-scoped records.
   - What's unclear: Whether planner prefers extending existing markosdb artifact tables versus introducing explicit brand-evidence tables.
   - Recommendation: Choose explicit brand-evidence logical namespace in this phase while reusing current adapters.

2. **What exact alias policy should merge semantically equivalent pains/needs?**
   - What we know: D-04 requires alias mapping and raw preservation.
   - What's unclear: Merge threshold policy for near-duplicates across segments.
   - Recommendation: Start deterministic exact + normalized-string match in Phase 73; defer fuzzy aliasing to a later phase.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Handler/runtime implementation | Yes | v22.13.0 | None |
| npm | Dependency install and test execution | Yes | 10.9.2 | None |
| git | Audit and workflow tooling | Yes | 2.53.0.windows.2 | None |

**Missing dependencies with no fallback:**
- None.

**Missing dependencies with fallback:**
- None.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node built-in test runner (`node:test`) |
| Config file | none (script-driven via `package.json`) |
| Quick run command | `node --test test/plugin-branding.test.js` |
| Full suite command | `npm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BRAND-INP-01 | Strict typed capture and validation for brand concept inputs | unit/contract | `node --test test/branding-inputs/brand-input-schema.test.js -x` | No - Wave 0 |
| BRAND-INP-02 | Deterministic normalization and stable graph identity across replay | unit/integration | `node --test test/branding-inputs/brand-normalization-determinism.test.js -x` | No - Wave 0 |

### Sampling Rate
- **Per task commit:** `node --test test/branding-inputs/*.test.js`
- **Per wave merge:** `node --test test/branding-inputs/*.test.js test/plugin-branding.test.js`
- **Phase gate:** `npm test`

### Wave 0 Gaps
- [ ] `test/branding-inputs/brand-input-schema.test.js` - covers BRAND-INP-01
- [ ] `test/branding-inputs/brand-normalization-determinism.test.js` - covers BRAND-INP-02
- [ ] `onboarding/backend/brand-inputs/normalize-brand-input.cjs` test seam and fixtures

## Sources

### Primary (HIGH confidence)
- Repository contracts and code:
  - `onboarding/onboarding-seed.schema.json`
  - `onboarding/backend/handlers.cjs`
  - `onboarding/backend/runtime-context.cjs`
  - `onboarding/backend/vector-store-client.cjs`
  - `contracts/F-12-ai-interview-generate-q-v1.yaml`
  - `contracts/F-13-ai-interview-parse-answer-v1.yaml`
  - `.planning/phases/73-brand-inputs-and-human-insight-modeling/73-CONTEXT.md`
  - `.planning/REQUIREMENTS.md`
  - `.planning/ROADMAP.md`
- Ajv official docs: https://ajv.js.org/
- Ajv getting started: https://ajv.js.org/guide/getting-started.html
- JSON Schema spec links: https://json-schema.org/specification-links
- RFC 8785 JSON Canonicalization Scheme: https://www.rfc-editor.org/rfc/rfc8785

### Secondary (MEDIUM confidence)
- npm package metadata for version recency:
  - https://www.npmjs.com/package/json-canonicalize
  - npm registry queries via `npm view`

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - versions verified via npm registry, schema/canonicalization sources confirmed.
- Architecture: HIGH - grounded in current code seams and locked phase decisions.
- Pitfalls: MEDIUM-HIGH - based on known determinism and multi-tenant failure modes plus current handler behavior.

**Research date:** 2026-04-11
**Valid until:** 2026-05-11
