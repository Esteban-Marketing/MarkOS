# Phase 74: Strategy Artifact and Messaging Rules Engine - Research

**Researched:** 2026-04-11
**Domain:** Deterministic strategy synthesis and role-safe messaging rule compilation from normalized brand evidence
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
### Strategy Artifact Shape
- **D-01:** Produce a versioned strategy artifact document with required sections: positioning statement, value promise, differentiators, messaging pillars, disallowed claims, and confidence notes.
- **D-02:** Every strategic claim must include source lineage (`evidence_node_ids`) referencing Phase 73 canonical evidence nodes.

### Deterministic Synthesis Rules
- **D-03:** Strategy generation must be deterministic for fixed tenant input and rule-set version; no stochastic output in core artifact fields.
- **D-04:** Contradictory source evidence must be surfaced as explicit conflict annotations instead of silently resolved.

### Messaging Rules Engine
- **D-05:** Define personality and tone as explicit bounded enums and rule blocks, not free-form text-only prose.
- **D-06:** Channel messaging rules (site, email, social, sales-call) must inherit from one canonical voice profile and enforce contradiction checks.

### Role Views and Consumption
- **D-07:** Emit role-specific views (strategist, founder, content) from the same canonical artifact with no independent rewrites.
- **D-08:** Rule outputs must include actionable do/don't guidance and examples, while preserving canonical lineage links.

### Scope and Integration Guardrails
- **D-09:** Integrate with existing onboarding/branding backend surfaces; do not add a standalone public API in this phase.
- **D-10:** Keep outputs additive and tenant-scoped, reusing existing context, persistence, and redaction boundaries from Phase 73.

### the agent's Discretion
- Claim ranking heuristics for ordering strategy sections, provided they remain deterministic and explainable.
- Internal module boundaries for rule compilation and role-view projection.
- Exact formatting of human-readable artifact markdown/json outputs.

### Deferred Ideas (OUT OF SCOPE)
- Autonomous publish to production channels (deferred to governance and publish phases).
- Creative generation variants that intentionally introduce stochastic alternatives.
- Full channel execution automation outside strategy artifact scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BRAND-STRAT-01 | The engine generates a strategy artifact with positioning, value promise, differentiators, and messaging pillars mapped to source pain/need signals. | Deterministic synthesis pipeline from Phase 73 normalized nodes, claim-to-evidence lineage map, conflict annotation model, and canonical artifact schema. |
| BRAND-STRAT-02 | Brand personality, tone boundaries, and channel messaging rules are explicit and role-consumable. | Canonical voice profile + bounded enums, inherited channel rules with contradiction checks, and deterministic role-view projection from one artifact source. |
</phase_requirements>

## Summary

Phase 74 should be implemented as a deterministic compiler stage on top of Phase 73 outputs, not as a new generation endpoint. The existing backend already has the right additive seams: Phase 73 normalization (`onboarding/backend/brand-inputs/normalize-brand-input.cjs`), tenant-safe idempotent evidence writes (`onboarding/backend/brand-inputs/evidence-graph-writer.cjs`), and onboarding integration (`onboarding/backend/handlers.cjs`).

The key architectural move is to define one canonical strategy artifact document that contains both strategy claims and messaging-rule primitives with lineage and conflict metadata. Then role-specific views (strategist/founder/content) are projections derived from that same artifact, never rewritten independently. This satisfies determinism, contradiction visibility, and non-divergent role guidance requirements.

Contradiction handling should be fail-visible, not fail-silent. If signals disagree (for example, premium positioning vs budget-focused expectation), the artifact should include a conflict object with impacted claims/channels and confidence adjustment, while still emitting a deterministic output.

**Primary recommendation:** Build a deterministic four-step compiler: `evidence read -> claim synthesis -> contradiction annotation -> role/channel projection`, with all outputs tied to `evidence_node_ids` and `ruleset_version`.

## Project Constraints (from CLAUDE.md)

- Boot/context order for work: `.protocol-lore/QUICKSTART.md` -> `.protocol-lore/INDEX.md` -> `.planning/STATE.md` -> `.agent/markos/MARKOS-INDEX.md`.
- Preserve methodology split: GSD in `.agent/get-shit-done/`, MarkOS protocol in `.agent/markos/`, client overrides only in `.markos-local/`.
- Keep install/update/runtime guidance aligned with `npx markos` and existing onboarding server entrypoint (`node onboarding/backend/server.cjs`).
- Use canonical test surfaces (`npm test` and `node --test test/**/*.test.js`) and keep work additive to existing architecture.
- Do not introduce a standalone API surface for this phase; extend current onboarding/branding backend surfaces.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js runtime | v22.13.0 (env), `>=20.16.0` required | Deterministic backend execution | Already required and used for all onboarding backend flows. |
| Existing Phase 73 canonicalization helpers (`canonicalize-brand-node.cjs`) | repo-local | Stable fingerprint and tenant-scoped identity construction | Reusing existing deterministic identity logic prevents drift between Phase 73 and 74 lineage chains. |
| Existing evidence graph writer (`evidence-graph-writer.cjs`) | repo-local | Tenant-safe idempotent evidence access and write pattern | Already enforces tenant-scoped keys and replay-safe upsert semantics. |
| Node `crypto` (SHA-256) | builtin | Stable artifact and claim fingerprints | Existing codebase already uses it for checksums and deterministic identities. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@supabase/supabase-js` | ^2.58.0 | Persist canonical strategy artifacts and lineage metadata | Use when Phase 74 stores canonical artifact snapshots in relational form. |
| `@upstash/vector` | ^1.2.3 | Optional indexed retrieval of strategy/messaging artifacts | Use only as retrieval acceleration; canonical truth remains deterministic artifact storage. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Deterministic rule compiler from evidence nodes | Free-form LLM generation per role | Faster to prototype, but violates D-03/D-07 and produces cross-role drift risk. |
| Canonical single artifact plus projections | Independent role-specific artifact generation | Increases contradiction risk and breaks single-lineage governance. |

**Installation:**
```bash
# No new dependencies required for Phase 74 baseline.
```

## Architecture Patterns

### Recommended Project Structure
```
onboarding/
└── backend/
    ├── brand-inputs/
    │   ├── normalize-brand-input.cjs
    │   ├── canonicalize-brand-node.cjs
    │   └── evidence-graph-writer.cjs
    ├── brand-strategy/
    │   ├── strategy-synthesizer.cjs       # deterministic claim synthesis from evidence
    │   ├── contradiction-detector.cjs     # explicit conflict annotations
    │   ├── messaging-rules-compiler.cjs   # bounded enums + channel inheritance
    │   ├── role-view-projector.cjs        # strategist/founder/content projections
    │   └── strategy-artifact-writer.cjs   # tenant-safe idempotent persistence
    └── handlers.cjs                       # additive route wiring and response surface
```

### Pattern 1: Deterministic Claim Synthesis
**What:** Produce strategy claims from ranked evidence clusters with fixed scoring and tie-break rules.
**When to use:** Building positioning/value promise/differentiators/messaging pillars.
**Example:**
```javascript
function synthesizeClaims(normalizedEvidence, rulesetVersion) {
  const sorted = [...normalizedEvidence].sort((a, b) => {
    if (b.signal_score !== a.signal_score) return b.signal_score - a.signal_score;
    return a.node_key.localeCompare(b.node_key);
  });

  return sorted.slice(0, 12).map((node, index) => ({
    claim_id: `claim-${String(index + 1).padStart(2, '0')}`,
    claim_text: node.payload.segment_name,
    evidence_node_ids: [node.node_key],
    ruleset_version: rulesetVersion,
  }));
}
```

### Pattern 2: Explicit Lineage and Conflict Model
**What:** Every claim and rule carries lineage fields and optional conflict metadata.
**When to use:** All artifact sections and channel rules.
**Example:**
```javascript
function annotateConflict(rule, conflictingEvidenceIds) {
  if (!conflictingEvidenceIds.length) return { ...rule, conflict: null };
  return {
    ...rule,
    conflict: {
      status: 'present',
      evidence_node_ids: conflictingEvidenceIds,
      resolution_policy: 'annotate_not_suppress',
    },
  };
}
```

### Pattern 3: Projection, Not Rewrite
**What:** Role views are deterministic filters/reshapes of canonical artifact sections.
**When to use:** Strategist, founder, content outputs.
**Example:**
```javascript
function projectRoleView(artifact, role) {
  const shared = {
    artifact_id: artifact.artifact_id,
    version: artifact.version,
    lineage_root: artifact.lineage_root,
  };

  if (role === 'founder') {
    return { ...shared, value_promise: artifact.value_promise, top_risks: artifact.conflicts };
  }
  if (role === 'content') {
    return { ...shared, pillars: artifact.messaging_pillars, channel_rules: artifact.channel_rules };
  }
  return { ...shared, full_strategy: artifact };
}
```

### Anti-Patterns to Avoid
- **Role-specific regeneration:** Never re-run claim generation independently per role view.
- **Silent contradiction resolution:** Never suppress contradictory evidence without conflict annotation.
- **Lineage-free prose fields:** Claims/rules without `evidence_node_ids` break traceability acceptance.
- **Timestamp-influenced ordering:** Any time-based sort in core fields breaks determinism.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Canonical evidence identity | New fingerprinting format for Phase 74 | Reuse `canonicalize-brand-node.cjs` helpers | Prevents lineage mismatch between evidence graph and strategy artifact. |
| Tenant-safe persistence policy | New ad-hoc tenant checks in each writer | Existing tenant-scoped key and upsert patterns from Phase 73 writer | Reuse proven fail-closed behavior and avoid regression risk. |
| Role rendering logic | Separate generation logic per consumer | Single projector layer from canonical artifact | Ensures cross-role consistency and contradiction parity. |
| Contradiction handling | Implicit heuristic suppression | Explicit conflict annotation objects with deterministic policy | Needed for acceptance intent and auditability. |

**Key insight:** In this phase, the most expensive bug is semantic drift between role outputs. A single canonical artifact plus deterministic projections is the safest architecture.

## Common Pitfalls

### Pitfall 1: Non-deterministic Claim Ordering
**What goes wrong:** Same evidence produces different claim order across runs.
**Why it happens:** Unstable sort criteria or unresolved tie-breaks.
**How to avoid:** Use fixed rank metrics and lexical tie-break (`node_key` or `claim_id`).
**Warning signs:** Snapshot tests fail only on array order.

### Pitfall 2: Orphaned Claims Without Lineage
**What goes wrong:** Strategy text cannot be traced back to evidence.
**Why it happens:** Manual post-processing steps strip lineage arrays.
**How to avoid:** Treat `evidence_node_ids` as required schema field for every claim/rule.
**Warning signs:** Artifact validator reports zero/empty lineage on populated claims.

### Pitfall 3: Contradictions Hidden by Consolidation
**What goes wrong:** Conflicting channel/tone guidance is collapsed into generic text.
**Why it happens:** Aggregation logic optimizes for brevity over explicit conflict state.
**How to avoid:** Add contradiction detector before projection and preserve conflict block in all role views.
**Warning signs:** Founder and content views differ in tone constraints without conflict records.

### Pitfall 4: Integration Breakage in Existing Submit Path
**What goes wrong:** New strategy phase blocks current onboarding flow on partial strategy errors.
**Why it happens:** Strategy compiler exceptions are treated as hard submit failures.
**How to avoid:** Keep Phase 74 integration additive and isolate strategy errors behind explicit diagnostics while preserving existing submit success paths.
**Warning signs:** `/submit` returns 500 for strategy-only edge cases.

## Code Examples

Verified patterns from repository sources:

### Current deterministic normalization call seam
```javascript
// Source: onboarding/backend/handlers.cjs
brandNormalizationResult = normalizeBrandInput(brandExecutionContext.tenant_id, seed.brand_input);
const determinismCheck = verifyDeterminism(brandExecutionContext.tenant_id, seed.brand_input);
brandGraphResult = await upsertNormalizedSegments(brandExecutionContext.tenant_id, brandNormalizationResult);
```

### Current tenant-scoped idempotent key pattern
```javascript
// Source: onboarding/backend/brand-inputs/canonicalize-brand-node.cjs
function buildTenantScopedKey(tenantId, segmentId, fingerprint) {
  return `${tenantId}:${segmentId}:${fingerprint}`;
}
```

### Recommended canonical artifact envelope
```javascript
const strategyArtifact = {
  artifact_id: `${tenantId}:strategy:${artifactFingerprint}`,
  version: '1.0',
  ruleset_version: '74.1',
  lineage_root: normalizedInput.content_fingerprint,
  positioning: { claim_text: '...', evidence_node_ids: ['tenant:seg-001:...'] },
  value_promise: { claim_text: '...', evidence_node_ids: ['tenant:seg-002:...'] },
  differentiators: [],
  messaging_pillars: [],
  disallowed_claims: [],
  channel_rules: [],
  conflicts: [],
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Prompt-only strategic narrative generation | Evidence-grounded deterministic synthesis with lineage arrays | Branding milestone v3.4.0 (Phase 73 -> 74) | Makes strategy auditable and replay-stable. |
| Independent output per role | Canonical artifact plus role projections | Current Phase 74 decision lock | Prevents role drift and contradiction divergence. |
| Implicit conflict smoothing | Explicit contradiction annotations with confidence notes | Current Phase 74 decision lock | Surfaces uncertainty and prevents silent policy errors. |

**Deprecated/outdated:**
- Free-form role-by-role strategy generation with no shared lineage contract.

## Open Questions

1. **How should contradiction severity be ranked for operator review?**
   - What we know: D-04 requires explicit conflict annotations.
   - What's unclear: Thresholds for warning-only vs blocking-state conflicts.
   - Recommendation: Start with deterministic severity enum (`low|medium|high`) based on affected channel count and evidence confidence spread.

2. **Where should canonical strategy artifact persistence live first?**
   - What we know: Existing onboarding backend already persists phase outputs and supports tenant context.
   - What's unclear: Whether to persist first in current markosdb artifact lane or a dedicated strategy namespace table.
   - Recommendation: Use additive `brand_strategy_artifacts` namespace/table shape while reusing current vector/relational adapters.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Strategy compiler and handler integration | Yes | v22.13.0 | None |
| npm | Test execution and package workflow | Yes | 10.9.2 | None |
| git | Workflow and audit operations | Yes | 2.53.0.windows.2 | None |

**Missing dependencies with no fallback:**
- None.

**Missing dependencies with fallback:**
- None.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node built-in test runner (`node:test`) |
| Config file | none (scripted via `package.json`) |
| Quick run command | `node --test test/phase-74/*.test.js` |
| Full suite command | `npm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BRAND-STRAT-01 | Deterministic strategy artifact synthesis with claim lineage from evidence nodes | unit/integration | `node --test test/phase-74/strategy-artifact-determinism.test.js -x` | No - Wave 0 |
| BRAND-STRAT-01 | Contradictory evidence is surfaced as explicit conflict annotations | unit | `node --test test/phase-74/strategy-contradiction-detection.test.js -x` | No - Wave 0 |
| BRAND-STRAT-02 | Canonical voice profile compiles bounded channel rules without contradictions | unit/integration | `node --test test/phase-74/messaging-rules-compiler.test.js -x` | No - Wave 0 |
| BRAND-STRAT-02 | Strategist/founder/content projections are consistent and lineage-preserving | unit | `node --test test/phase-74/role-view-projections.test.js -x` | No - Wave 0 |

### Sampling Rate
- **Per task commit:** `node --test test/phase-74/*.test.js`
- **Per wave merge:** `node --test test/phase-74/*.test.js test/phase-73/*.test.js`
- **Phase gate:** `npm test`

### Wave 0 Gaps
- [ ] `test/phase-74/strategy-artifact-determinism.test.js` - deterministic ordering, stable artifact fingerprint, required lineage fields
- [ ] `test/phase-74/strategy-contradiction-detection.test.js` - explicit conflict annotation behavior and severity mapping
- [ ] `test/phase-74/messaging-rules-compiler.test.js` - bounded enum validation and channel inheritance consistency
- [ ] `test/phase-74/role-view-projections.test.js` - projection parity and no independent rewrite leakage
- [ ] `test/phase-74/fixtures/*.json` - fixed evidence fixtures for replay and contradiction scenarios

## Sources

### Primary (HIGH confidence)
- `.planning/phases/74-strategy-artifact-and-messaging-rules-engine/74-CONTEXT.md` - locked phase decisions, scope, and guardrails
- `.planning/REQUIREMENTS.md` - BRAND-STRAT-01 and BRAND-STRAT-02 requirement contracts
- `.planning/ROADMAP.md` - phase goal, dependencies, and acceptance intent
- `.planning/STATE.md` - current milestone/phase state and execution context
- `.planning/phases/73-brand-inputs-and-human-insight-modeling/73-RESEARCH.md` - upstream deterministic and tenant-safety constraints
- `onboarding/backend/brand-inputs/normalize-brand-input.cjs` - deterministic normalization baseline
- `onboarding/backend/brand-inputs/canonicalize-brand-node.cjs` - canonicalization and tenant-scoped key utilities
- `onboarding/backend/brand-inputs/evidence-graph-writer.cjs` - tenant-safe idempotent graph write pattern
- `onboarding/backend/handlers.cjs` - additive integration seam in submit flow
- `test/phase-73/brand-normalization-determinism.test.js` - determinism verification approach
- `test/phase-73/brand-evidence-tenant-safety.test.js` - tenant isolation/idempotence verification approach

### Secondary (MEDIUM confidence)
- `package.json` - runtime/dependency versions and canonical test commands
- `.protocol-lore/QUICKSTART.md`, `.protocol-lore/INDEX.md`, `.agent/markos/MARKOS-INDEX.md` - project operating constraints and architecture map

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - recommendations reuse existing runtime and Phase 73 production seams
- Architecture: HIGH - directly derived from locked phase decisions and current backend structure
- Pitfalls: HIGH - grounded in existing deterministic/idempotent test patterns and integration behavior

**Research date:** 2026-04-11
**Valid until:** 2026-05-11
