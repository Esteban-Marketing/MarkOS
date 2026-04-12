# Phase 76: Token Compiler and shadcn Component Contract - Research

**Researched:** 2026-04-11
**Domain:** Deterministic design-token compilation and component-state contract generation
**Confidence:** HIGH

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Emit one canonical token bundle containing semantic color, typography, spacing, radius, shadow, and motion tokens mapped from strategy + identity artifacts.
- **D-02:** Token naming and ordering must be deterministic for fixed inputs and ruleset versions.
- **D-03:** Tailwind v4 compatibility is required via stable token export shape and CSS variable mappings.
- **D-04:** Produce a deterministic shadcn component contract manifest listing required components, variants, and interaction states.
- **D-05:** Component state requirements must be mapped from semantic intent (tone, emphasis, density, feedback states) with explicit rationale.
- **D-06:** Manifest must include required primitives for core app surfaces and critical state coverage.
- **D-07:** Contract generation must fail with explicit diagnostics when required token categories or component states are missing.
- **D-08:** Lineage metadata must link token and manifest entries back to source strategy/identity decisions.
- **D-09:** Integrate additively into existing backend surfaces; no standalone public token API in this phase.
- **D-10:** Preserve tenant-scoped deterministic behavior and avoid stochastic output in canonical contracts.

### Claude's Discretion
- Internal compiler module boundaries.
- Exact constants and helper naming.
- Supplemental metadata fields that do not alter canonical contract semantics.

### Deferred Ideas (OUT OF SCOPE)
- Next.js starter descriptor generation (Phase 77).
- Role-targeted handoff pack production (Phase 77).
- Publish/rollback governance workflows (Phase 78).

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BRAND-DS-01 | Strategy and identity outputs compile into a canonical token contract targeting Tailwind v4 and shadcn/ui usage patterns. | Canonical compiler module with stable sort + stable hash, token schema validator, Tailwind-v4 CSS variable map export, and deterministic fingerprint snapshot contract. |
| BRAND-DS-02 | A component contract manifest defines required shadcn/ui components, variants, and interaction states tied to token semantics. | Deterministic component-state manifest schema, semantic-intent mapping table, required primitive/state coverage gate, and explicit lineage + rationale fields. |

## Summary

Phase 76 should follow the exact deterministic pipeline style established in Phase 74 and Phase 75: compile from canonical upstream artifacts, normalize and stable-sort output, validate required sections, compute deterministic fingerprints, and persist tenant-scoped additively with replay-safe upserts. Existing implementation patterns in strategy and identity compilers already provide the baseline conventions and should be mirrored rather than redesigned.

The implementation should produce two coordinated artifacts in one pass: (1) a canonical token contract oriented to Tailwind v4 CSS variable consumption and (2) a deterministic shadcn component-state manifest mapped from semantic intent and accessibility-aware identity roles. Both artifacts should carry lineage pointers to upstream strategy evidence and identity decisions so downstream surfaces can audit why a token/component requirement exists.

Additive integration should happen inside the current submit flow in onboarding backend handlers, parallel to the existing strategy and identity outputs. Do not add standalone APIs in this phase. Return token and component-contract payloads in submit responses with explicit diagnostics and fail-closed readiness outcomes when required categories or state coverage are missing.

**Primary recommendation:** Implement a new `brand-design-system` compiler lane that mirrors Phase 75 patterns (compile -> validate -> persist -> report) and emits deterministic `token_contract` + `component_contract_manifest` artifacts with lineage and diagnostics as first-class fields.

## Project Constraints (from CLAUDE.md)

- Treat `.planning/STATE.md` as canonical state; do not use `.protocol-lore/STATE.md` as live state.
- Respect methodology boundary: GSD under `.agent/get-shit-done/`, MarkOS under `.agent/markos/`.
- Keep client overrides only in `.markos-local/`.
- Primary CLI install/update path is `npx markos`.
- Default test commands are `npm test` or `node --test test/**/*.test.js`.
- Local onboarding server command is `node onboarding/backend/server.cjs`.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js | v22.13.0 (local), `>=20.16.0` required by repo | Runtime for compiler and handler execution | Matches current backend runtime and all existing phase compilers/tests. |
| Built-in `crypto` | Node core | Stable SHA-256 deterministic fingerprints | Already used by strategy and identity compilers/writers for deterministic IDs. |
| Tailwind token target | tailwindcss `4.2.2` (published 2026-03-18) | Target output contract shape for CSS variables and semantic tokens | Phase requirement explicitly targets Tailwind v4 compatibility. |
| shadcn contract target | shadcn `4.2.0` (published 2026-04-07) | Target component/variant/state coverage contract | Requirement explicitly targets shadcn usage patterns. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Existing schema-validator style (in-repo CJS modules) | In-repo | Required-field and diagnostics validation for contracts | Use for token schema + component-manifest schema, matching Phase 74/75 validator style. |
| Node test runner (`node:test`) | Node core | Determinism, schema, integration, and publish-readiness tests | Use for phase-scoped tests under `test/phase-76/`. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| In-repo schema validators | External schema library | Adds dependency and migration overhead; not aligned with existing Phase 74/75 style. |
| Deterministic CJS compiler modules | New service endpoint or separate microservice | Violates additive-integration decision and expands operational surface prematurely. |

**Installation:**
```bash
# No mandatory new dependency required for Phase 76 implementation.
# Tailwind/shadcn versions are target compatibility references, not required runtime deps in this phase.
```

**Version verification:**
```bash
npm view tailwindcss version
npm view shadcn version
```
Verified latest at research time:
- tailwindcss: `4.2.2` (published 2026-03-18)
- shadcn: `4.2.0` (published 2026-04-07)

## Architecture Patterns

### Recommended Project Structure

```text
onboarding/backend/brand-design-system/
├── token-compiler.cjs                 # deterministic token contract compilation
├── token-contract-schema.cjs          # required token section validation
├── component-contract-compiler.cjs    # semantic intent -> shadcn state manifest mapping
├── component-contract-schema.cjs      # required primitive/variant/state validation
├── design-system-artifact-writer.cjs  # tenant-safe additive upsert store contract
└── diagnostics.cjs                    # normalized reason codes and fail-closed report helpers

test/phase-76/
├── token-determinism.test.js
├── token-schema.test.js
├── component-manifest-determinism.test.js
├── component-manifest-coverage.test.js
├── design-system-integration.test.js
└── publish-readiness-token-contract.test.js
```

### Pattern 1: Deterministic Compile + Stable Fingerprint
**What:** Compile artifact from upstream strategy/identity input, stable-sort object keys and arrays, then fingerprint with SHA-256.
**When to use:** Every canonical output (`token_contract`, `component_contract_manifest`) and metadata envelope.
**Example:**
```javascript
// Source: onboarding/backend/brand-identity/identity-compiler.cjs
function stableSort(value) { /* sorted recursive copy */ }
function stableStringify(value) { return JSON.stringify(stableSort(value)); }
function buildFingerprint(value) {
  return crypto.createHash('sha256').update(stableStringify(value), 'utf8').digest('hex');
}
```

### Pattern 2: Fail-Closed Schema Validation With Explicit Errors
**What:** Validate required sections and fail with deterministic error messages before write/integration.
**When to use:** Token contract categories and manifest primitive/variant/state coverage.
**Example:**
```javascript
// Source: onboarding/backend/brand-strategy/strategy-artifact-schema.cjs
if (!(section in artifact)) {
  errors.push(`Missing required section: ${section}`);
}
```

### Pattern 3: Additive Handler Integration
**What:** Add compile/evaluate/persist calls to existing submit flow without replacing existing outputs.
**When to use:** Integrating Phase 76 into current onboarding response contract.
**Example:**
```javascript
// Source: onboarding/backend/handlers.cjs (Phase 75 pattern)
compiledIdentityArtifact = compileIdentityArtifact(strategySynthesisResult);
accessibilityGateReport = evaluateAccessibilityGates(compiledIdentityArtifact);
identityArtifactWrite = persistIdentityArtifact(tenantId, compiledIdentityArtifact);
```

### Pattern 4: Lineage-Carrying Decisions
**What:** Embed decision lineage arrays tied to upstream node IDs/fingerprints.
**When to use:** Every non-trivial token category and every component-state mapping row.
**Example:**
```javascript
// Source: onboarding/backend/brand-identity/semantic-role-model.cjs
lineage_decision = {
  decision_id: 'semantic-role-projection',
  strategy_node_ids: sortedNodeIds
}
```

### Anti-Patterns to Avoid
- **Runtime randomness in canonical outputs:** no `Math.random`, non-deterministic UUIDs, or unstable iteration order in contracts.
- **Implicit fallback without diagnostics:** missing category/state must produce explicit reason codes, not silent defaults.
- **Non-additive endpoint changes:** do not move Phase 76 to new standalone API in this phase.
- **Unbounded manifest growth:** only required core primitives/variants/states for Phase 76 scope; defer starter-pack expansion to Phase 77.

## Deterministic Mapping Contract (Phase 76-specific)

Use a fixed semantic intent matrix to produce deterministic shadcn manifest rows. Recommended canonical dimensions:

- `tone`: neutral | positive | warning | destructive
- `emphasis`: subtle | default | strong
- `density`: compact | default | spacious
- `feedback_state`: default | hover | focus-visible | active | disabled | loading | success | error

Each component row should include:
- `component_name`
- `required_variants`
- `required_states`
- `token_bindings` (semantic token keys only)
- `mapping_rationale`
- `lineage` (`strategy_fingerprint`, `identity_fingerprint`, `decision_ids`)

## Lineage and Diagnostics Design

### Required lineage fields
- Artifact-level:
  - `ruleset_version`
  - `strategy_fingerprint`
  - `identity_fingerprint`
  - `deterministic_fingerprint`
- Entry-level (token/component rows):
  - `decision_id`
  - `source_node_ids` (or equivalent)
  - `source_kind` (`strategy_claim`, `identity_decision`, `accessibility_gate`)

### Required diagnostics fields
- `code` (stable machine-readable enum)
- `severity` (`error` or `warning`)
- `path` (schema path or mapping path)
- `message`
- `blocking` (boolean)
- `recommended_fix`

Recommended blocking codes:
- `TOKEN_CATEGORY_MISSING`
- `TOKEN_BINDING_INVALID`
- `COMPONENT_PRIMITIVE_MISSING`
- `COMPONENT_STATE_COVERAGE_MISSING`
- `LINEAGE_POINTER_MISSING`
- `DETERMINISM_FINGERPRINT_MISMATCH`

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Fingerprints | ad hoc stringify/hash with unstable key order | stable-sort + SHA-256 pattern from Phase 75 | Prevents false diffs and non-deterministic IDs. |
| Contract validation | free-form if/else checks scattered in handlers | dedicated schema modules with collected errors | Keeps diagnostics deterministic and testable. |
| State coverage mapping | manual component-by-component logic in multiple files | one canonical semantic-intent mapping table | Eliminates drift and contradictory mappings. |
| Persistence semantics | direct append writes | replay-safe upsert keyed by tenant + artifact fingerprint | Aligns with Phase 74/75 additive store behavior. |

**Key insight:** deterministic contracts fail most often at boundaries (ordering, missing keys, silent fallback), so reuse the existing compiler+schema+writer triad and keep mapping logic centralized.

## Common Pitfalls

### Pitfall 1: Unstable key ordering changes fingerprints
**What goes wrong:** Two logically equal contracts produce different fingerprints.
**Why it happens:** Native object insertion order differences or unsorted arrays.
**How to avoid:** Apply recursive stable sort before stringify in every fingerprint path.
**Warning signs:** Snapshot hash changes across repeated test runs with fixed fixture.

### Pitfall 2: Manifest completeness appears valid but lacks required states
**What goes wrong:** Component exists but required states (focus-visible/loading/error) are missing.
**Why it happens:** Validation checks only component names, not state matrix coverage.
**How to avoid:** Add schema checks per component for mandatory state set.
**Warning signs:** UI behavior gaps despite passing basic manifest existence checks.

### Pitfall 3: Diagnostics are not action-ready
**What goes wrong:** Failures report generic errors without field path or fix.
**Why it happens:** Errors thrown directly from compile functions without normalized diagnostic format.
**How to avoid:** Emit normalized diagnostic objects with `code`, `path`, and `recommended_fix`.
**Warning signs:** Repeated operator confusion when publish readiness is blocked.

### Pitfall 4: Non-additive response changes break existing consumers
**What goes wrong:** Existing submit consumers fail due structural response changes.
**Why it happens:** Replacing fields instead of adding optional Phase 76 blocks.
**How to avoid:** Preserve existing fields and add new `token_contract`, `component_contract_manifest`, and `design_system_write` envelopes.
**Warning signs:** Regression in Phase 74/75 integration tests.

## Code Examples

Verified patterns from this repo:

### Deterministic fingerprint + ruleset metadata
```javascript
// Source: onboarding/backend/brand-identity/identity-compiler.cjs
const deterministicFingerprint = buildFingerprint({ ruleset_version: rulesetVersion, artifact });
return {
  artifact: stableSort(artifact),
  metadata: {
    ruleset_version: rulesetVersion,
    strategy_fingerprint: strategyFingerprint,
    deterministic_fingerprint: deterministicFingerprint,
  },
};
```

### Replay-safe additive writer
```javascript
// Source: onboarding/backend/brand-identity/identity-artifact-writer.cjs
const artifactId = `${tenantId}:identity:${artifactFingerprint}`;
const upsert = _store.upsert(tenantId, artifactFingerprint, { ...record });
return {
  created: upsert.created,
  committed: upsert.created,
  artifact_id: artifactId,
  artifact_fingerprint: artifactFingerprint,
  upsert_count: upsert.record.upsert_count,
};
```

### Handler additive integration shape
```javascript
// Source: onboarding/backend/handlers.cjs (apply same pattern for phase 76)
compiledIdentityArtifact = compileIdentityArtifact(strategySynthesisResult);
accessibilityGateReport = evaluateAccessibilityGates(compiledIdentityArtifact);
identityArtifactWrite = persistIdentityArtifact(tenantId, compiledIdentityArtifact);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Static token map in frontend (`tokens.ts`) with limited override validation | Strategy/identity deterministic compilers with lineage and fingerprints in backend pipeline | Phases 74-75 (2026-04) | Phase 76 can compile canonical token + component contracts from richer deterministic upstream context. |
| Ad hoc brand overrides | Ruleset-versioned compiler artifacts with tenant-scoped upserts | Phases 74-75 | Enables deterministic evolution and reliable replay safety. |

**Deprecated/outdated:**
- Static-only token surface as canonical source for branded artifacts; keep as consumer/default surface, not compiler source of truth for Phase 76 outputs.

## Open Questions

1. **Canonical component set for Phase 76 minimum scope**
   - What we know: Requirement demands core product primitives with deterministic state coverage.
   - What's unclear: Exact first-wave component list boundary (for example: button, input, select, textarea, card, badge, alert, dialog).
   - Recommendation: Lock a finite required set in `76-CONTEXT` addendum before planning execution tasks.

2. **Publish-readiness coupling between accessibility gates and component-state manifest**
   - What we know: Phase 75 already blocks publish readiness on accessibility failures.
   - What's unclear: Whether Phase 76 state-coverage failures should reuse same `publish_readiness` block or add nested `design_system_readiness`.
   - Recommendation: Keep `publish_readiness` as umbrella with additional DS reason codes for additive compatibility.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | compiler modules, tests | Yes | v22.13.0 | None |
| npm | package metadata checks, test scripts | Yes | 10.9.2 | None |

**Missing dependencies with no fallback:**
- None identified for Phase 76 code/config implementation.

**Missing dependencies with fallback:**
- None.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Node built-in test runner (`node:test`) |
| Config file | none - convention-based under `test/**/*.test.js` |
| Quick run command | `node --test test/phase-76/*.test.js` |
| Full suite command | `npm test` |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BRAND-DS-01 | Deterministic canonical token contract compile for fixed strategy+identity input | unit | `node --test test/phase-76/token-determinism.test.js -x` | No - Wave 0 |
| BRAND-DS-01 | Token schema requires color/type/space/radius/shadow/motion + Tailwind-v4 export mapping | unit | `node --test test/phase-76/token-schema.test.js -x` | No - Wave 0 |
| BRAND-DS-02 | Deterministic shadcn manifest mapping from semantic intent dimensions | unit | `node --test test/phase-76/component-manifest-determinism.test.js -x` | No - Wave 0 |
| BRAND-DS-02 | Required component primitive/variant/state coverage gate with diagnostics | unit | `node --test test/phase-76/component-manifest-coverage.test.js -x` | No - Wave 0 |
| BRAND-DS-01, BRAND-DS-02 | Additive submit integration returns DS artifacts with lineage and diagnostics | integration | `node --test test/phase-76/design-system-integration.test.js -x` | No - Wave 0 |

### Sampling Rate
- **Per task commit:** `node --test test/phase-76/*.test.js`
- **Per wave merge:** `node --test test/phase-74/*.test.js test/phase-75/*.test.js test/phase-76/*.test.js`
- **Phase gate:** `npm test`

### Wave 0 Gaps
- [ ] `test/phase-76/token-determinism.test.js` - deterministic fingerprint and stable ordering.
- [ ] `test/phase-76/token-schema.test.js` - required token category and Tailwind mapping validation.
- [ ] `test/phase-76/component-manifest-determinism.test.js` - deterministic mapping for fixed semantic intent input.
- [ ] `test/phase-76/component-manifest-coverage.test.js` - required primitive/variant/state coverage checks.
- [ ] `test/phase-76/design-system-integration.test.js` - additive submit response and write contract.

## Sources

### Primary (HIGH confidence)
- Repository code: `onboarding/backend/brand-strategy/strategy-synthesizer.cjs` and `strategy-artifact-writer.cjs` (determinism + writer pattern)
- Repository code: `onboarding/backend/brand-identity/identity-compiler.cjs`, `semantic-role-model.cjs`, `identity-artifact-writer.cjs`, `accessibility-gates.cjs` (lineage + diagnostics + gate pattern)
- Repository code: `onboarding/backend/handlers.cjs` (additive submit integration seam)
- Repository tests: `test/phase-74/*.test.js`, `test/phase-75/*.test.js` (existing Nyquist validation conventions)
- Planning artifacts: `76-CONTEXT.md`, `ROADMAP.md`, `REQUIREMENTS.md`, `74-VERIFICATION.md`, `75-VERIFICATION.md`

### Secondary (MEDIUM confidence)
- npm registry metadata for target compatibility packages:
  - tailwindcss latest version `4.2.2`
  - shadcn latest version `4.2.0`

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - backed by current repository runtime and npm metadata checks.
- Architecture: HIGH - directly derived from adjacent implemented compilers and integration patterns.
- Pitfalls: HIGH - based on concrete failure modes prevented by existing deterministic/schema/additive patterns.

**Research date:** 2026-04-11
**Valid until:** 2026-05-11
