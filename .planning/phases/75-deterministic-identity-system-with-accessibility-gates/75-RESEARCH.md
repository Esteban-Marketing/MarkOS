# Phase 75: Deterministic Identity System with Accessibility Gates - Research

**Researched:** 2026-04-11
**Domain:** Deterministic identity compilation, semantic role modeling, and publish-blocking accessibility diagnostics
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
### Identity Artifact Contract
- **D-01:** Emit one canonical identity artifact per tenant/version containing semantic color roles, typography scale, spacing intent, and visual constraints.
- **D-02:** Identity artifact fields must be deterministic for fixed strategy input and ruleset version.

### Deterministic Compilation Rules
- **D-03:** Use stable ordering and canonical serialization before fingerprinting identity artifacts.
- **D-04:** Preserve strategy-to-identity lineage links for each generated identity decision.

### Accessibility Gates
- **D-05:** Enforce contrast/readability checks for required semantic role pairs.
- **D-06:** Publish readiness must be blocked when required checks fail, returning explicit diagnostics.
- **D-07:** Accessibility checks must be reproducible and testable in automated phase tests.

### Scope and Integration
- **D-08:** Integrate additively with existing onboarding/branding backend surfaces; do not add new standalone public APIs.
- **D-09:** Reuse tenant-scoped persistence patterns from prior phases for identity artifacts.
- **D-10:** Keep non-deterministic creative variance out of canonical identity outputs for this phase.

### Claude's Discretion
- Internal module boundaries for identity compiler and accessibility checker.
- Exact naming of internal helper functions and diagnostics constants.
- Human-readable formatting for diagnostics payloads.

### Deferred Ideas (OUT OF SCOPE)
- Full token compiler output (Phase 76).
- Component contract manifests (Phase 76).
- Publish/rollback governance controls (Phase 78).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BRAND-ID-01 | The engine produces deterministic visual identity artifacts including semantic color roles, typography hierarchy, and visual language constraints. | Deterministic identity compiler contract with canonical ordering, semantic role taxonomy, typography profile schema, and stable fingerprinting based on strategy lineage. |
| BRAND-ID-02 | Identity outputs enforce accessibility-aware defaults (contrast/readability) before publish eligibility. | WCAG-aligned gate matrix for semantic role pairs and typography readability checks with blocking diagnostics integrated into existing backend responses. |
</phase_requirements>

## Summary

Phase 75 should be implemented as an additive compiler stage immediately after Phase 74 strategy synthesis in the existing onboarding submit flow, not as a net-new service or public API. The current `onboarding/backend/handlers.cjs` pipeline already normalizes brand input, writes tenant-scoped graph artifacts, synthesizes strategy, compiles messaging rules, and returns deterministic metadata. The correct insertion point is after strategy artifact generation and before response emission: `strategy artifact -> identity compile -> accessibility gate report -> response payload`.

Identity output should be one canonical artifact keyed by tenant + ruleset + strategy fingerprint. This artifact should model semantic roles (not raw palette values) and include deterministic typography hierarchy metadata. Determinism must be guaranteed via canonical sorting and serialization before hashing. Every derived role/value must carry source lineage to Phase 74 strategy and evidence identifiers.

Accessibility must be modeled as a blocking gate report in Phase 75 itself: required role pairs and readability constraints are evaluated with deterministic thresholds; failures produce structured diagnostics and set publish readiness to blocked. This aligns with BRAND-ID-02 and Phase 75 decision D-06, while remaining additive to the existing backend by extending current response payload contracts.

**Primary recommendation:** Add a deterministic identity compiler + accessibility checker under `onboarding/backend/brand-identity/` and wire it into `POST /submit` in `onboarding/backend/handlers.cjs` using the same tenant-scoped, fail-visible, additive pattern used in Phases 73-74.

## Project Constraints (from CLAUDE.md)

- Required boot order for codebase context: `.protocol-lore/QUICKSTART.md` -> `.protocol-lore/INDEX.md` -> `.planning/STATE.md` -> `.agent/markos/MARKOS-INDEX.md`.
- Respect methodology split: GSD under `.agent/get-shit-done/`, MarkOS protocol under `.agent/markos/`, client overrides only under `.markos-local/`.
- Keep implementation aligned with existing CLI/runtime contract (`npx markos`, onboarding backend entrypoint `node onboarding/backend/server.cjs`).
- Use existing repository test commands and keep work additive (`npm test`, `node --test test/**/*.test.js`).
- Do not introduce standalone APIs for this phase; integrate into existing onboarding/backend surfaces.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js runtime | v22.13.0 observed (`>=20.16.0` required) | Deterministic backend compilation execution | Existing backend runtime and test stack already depend on it. |
| Existing Phase 74 strategy compiler modules | repo-local | Upstream deterministic strategy and lineage source | Phase 75 must compile from canonical strategy artifact, not re-interpret raw seed input. |
| Existing theme contract (`lib/markos/theme/tokens.ts`, `lib/markos/theme/brand-pack.ts`) | repo-local | Downstream semantic token alignment target | Phase 75 identity roles should map cleanly into current semantic token naming conventions. |
| Node `crypto` SHA-256 | builtin | Canonical identity fingerprinting | Already used in deterministic artifacts and avoids new dependency risk. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `wcag-contrast` | 3.0.0 (published 2019-11-05) | Deterministic WCAG contrast ratio calculation | Use for required role-pair contrast checks and machine-readable diagnostics. |
| `zod` | 4.3.6 (published 2026-01-22) | Strict identity artifact and diagnostics schema validation | Use to validate compiler output envelope and block malformed gate reports. |
| Storybook a11y addon + `axe-core` lane | `@storybook/addon-a11y` 8.6.18, `axe-core` 4.10.0 | Existing a11y quality lane for downstream UI verification | Reuse for integration verification after identity artifacts are consumed in UI stories. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `wcag-contrast` deterministic checks | Hand-rolled luminance/contrast math | Increases correctness and maintenance risk for a core gate that must be reproducible. |
| Canonical semantic role model | Direct raw color token emission | Breaks phase boundary (token compiler is Phase 76) and reduces explainability. |
| Additive integration in `handlers.cjs` | New standalone branding endpoint | Violates D-08 and adds avoidable surface area/governance overhead. |

**Installation:**
```bash
npm install wcag-contrast zod
```

**Version verification (registry):**
```bash
npm view wcag-contrast version   # 3.0.0
npm view culori version          # 4.0.2 (future token phase support)
npm view zod version             # 4.3.6
```

## Architecture Patterns

### Recommended Project Structure
```
onboarding/
└── backend/
    ├── brand-strategy/
    │   └── ...existing Phase 74 modules
    ├── brand-identity/
    │   ├── identity-compiler.cjs         # strategy -> identity artifact
    │   ├── semantic-role-model.cjs       # canonical color + type role mapping
    │   ├── accessibility-gates.cjs       # required checks + blocking diagnostics
    │   ├── identity-artifact-schema.cjs  # output and diagnostics validation
    │   └── identity-artifact-writer.cjs  # tenant-safe persistence pattern reuse
    └── handlers.cjs                      # additive submit response integration

lib/
└── markos/
    └── theme/
        ├── tokens.ts                     # existing semantic token baseline
        └── brand-pack.ts                 # existing merge/validation bridge
```

### Pattern 1: Deterministic Identity Compilation
**What:** Compile one canonical identity artifact from Phase 74 strategy + messaging output with stable ordering and canonical serialization.
**When to use:** Every Phase 75 identity generation run.
**Example:**
```javascript
function buildDeterministicIdentityFingerprint(identityArtifact) {
  const canonical = JSON.stringify(identityArtifact, Object.keys(identityArtifact).sort());
  return crypto.createHash('sha256').update(canonical, 'utf8').digest('hex');
}
```

### Pattern 2: Semantic Role Modeling (Not Raw Tokens)
**What:** Model identity using semantic roles for color and typography, then map to downstream token contracts later.
**When to use:** Core Phase 75 artifact generation.
**Example:**
```javascript
const semanticColorRoles = {
  'brand.primary': '#0d9488',
  'surface.default': '#ffffff',
  'text.primary': '#0f172a',
  'text.inverse': '#ffffff',
};

const typographyRoles = {
  'type.display': { family: 'Sora', step: 'xl', weight: 700, line_height: 1.2 },
  'type.body': { family: 'Space Grotesk', step: 'md', weight: 400, line_height: 1.5 },
};
```

### Pattern 3: Blocking Accessibility Gate Envelope
**What:** Emit deterministic gate diagnostics with `pass|fail` per required check and aggregate publish readiness status.
**When to use:** Every identity artifact compilation run.
**Example:**
```javascript
const gateReport = {
  status: hasFailures ? 'blocked' : 'pass',
  checks: [
    { id: 'contrast.text.primary_on_surface.default', required_ratio: 4.5, observed_ratio: 7.2, status: 'pass' },
    { id: 'contrast.brand.primary_on_surface.default', required_ratio: 3.0, observed_ratio: 2.6, status: 'fail' },
  ],
  diagnostics: hasFailures ? ['BRAND-ID-02: required contrast pair failed'] : [],
};
```

### Pattern 4: Additive Backend Integration
**What:** Extend existing `POST /submit` payload with identity artifact and gate report fields without changing endpoint surface.
**When to use:** Integration in `onboarding/backend/handlers.cjs`.
**Example:**
```javascript
json(res, 200, {
  success: true,
  strategy_artifact: strategySynthesisResult?.artifact || null,
  identity_artifact: identityCompileResult?.artifact || null,
  identity_accessibility_report: identityCompileResult?.accessibility_report || null,
  publish_readiness: identityCompileResult?.accessibility_report?.status || 'unknown',
});
```

### Anti-Patterns to Avoid
- **Raw color literal contracts as primary output:** skip semantic roles and jump to token-level output (Phase 76 scope leakage).
- **Non-canonical serialization before hashing:** introduces deterministic drift from property-order variance.
- **Warn-only accessibility checks:** violates D-06 and BRAND-ID-02 because failures must block publish readiness.
- **New API route for identity:** violates D-08 additive-integration requirement.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Contrast ratio math | Custom ad-hoc luminance implementation | `wcag-contrast` | Gate correctness is critical and must be reproducible. |
| Artifact shape enforcement | Manual `if`-heavy validation trees | `zod` schema contracts | Strong deterministic validation with readable diagnostics and less schema drift. |
| Tenant write isolation | New custom persistence pattern | Existing tenant-scoped upsert patterns from Phase 73/74 | Prevents cross-tenant leakage regressions. |
| UI accessibility runner | New browser testing lane | Existing Storybook + `axe-core` lanes | Existing CI lane already covers a11y checks and should be extended, not replaced. |

**Key insight:** Phase 75 value is deterministic identity semantics + blocking diagnostics. Avoid token/compiler overreach and focus on canonical contracts that Phase 76 can safely consume.

## Common Pitfalls

### Pitfall 1: Semantic Role Drift from Existing Theme Contract
**What goes wrong:** New role names do not map to current `lib/markos/theme/tokens.ts` and become isolated.
**Why it happens:** Designing Phase 75 schema without checking current token vocabulary.
**How to avoid:** Maintain explicit alias mapping table between identity semantic roles and existing token keys.
**Warning signs:** Identity artifact emits roles with no downstream token correspondence.

### Pitfall 2: False Determinism from Unstable Ordering
**What goes wrong:** Same strategy input yields different fingerprints or artifact order.
**Why it happens:** Arrays/objects are not sorted canonically before serialization.
**How to avoid:** Stable sort every deterministic collection and canonicalize before hash.
**Warning signs:** Snapshot diffs show order-only changes across replay runs.

### Pitfall 3: Accessibility Checks Do Not Block Readiness
**What goes wrong:** Failures are emitted as warnings but publish readiness still passes.
**Why it happens:** Gate report exists but not wired to readiness decision.
**How to avoid:** Derive readiness strictly from required-check statuses and fail-closed when checks are missing.
**Warning signs:** Diagnostics include failed checks while `publish_readiness=pass`.

### Pitfall 4: Scope Creep into Token/Component Manifests
**What goes wrong:** Phase 75 starts emitting Tailwind/shadcn artifacts.
**Why it happens:** Attempting to solve Phase 76 early.
**How to avoid:** Keep Phase 75 artifact semantic and deterministic; defer token/component compilation.
**Warning signs:** Output payload includes Tailwind variables or component manifests.

## Code Examples

Verified patterns from current repository and official docs:

### Existing additive submit seam (Phase 74)
```javascript
// Source: onboarding/backend/handlers.cjs
strategySynthesisResult = synthesizeStrategyArtifact(
  brandExecutionContext.tenant_id,
  brandNormalizationResult
);
compiledMessagingRules = compileMessagingRules(
  strategySynthesisResult.artifact,
  seed.messaging_rules,
  { ruleset_version: strategySynthesisResult.metadata.ruleset_version }
);
roleViews = projectRoleViews(strategySynthesisResult, compiledMessagingRules);
```

### Existing semantic token baseline
```typescript
// Source: lib/markos/theme/tokens.ts
{ name: "color.text.primary", value: "#0f172a", description: "Primary text" }
{ name: "color.action.primary", value: "#0d9488", description: "Primary action background" }
{ name: "font.body", value: "'Space Grotesk', sans-serif", description: "Body font" }
```

### WCAG threshold basis for checks
```text
// Source: WCAG 2.2 Understanding docs
Text contrast minimum: 4.5:1 (SC 1.4.3 AA)
Large text contrast: 3:1 (SC 1.4.3 AA)
Non-text UI/state contrast: 3:1 (SC 1.4.11 AA)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual theme overrides with key/hex validation only | Deterministic semantic identity artifact with gate diagnostics | Targeted in Phase 75 | Enables reproducible publish readiness and lineage. |
| UI-only accessibility checks after styling | Compiler-time accessibility gate report + downstream UI lane | Current WCAG/Storybook practice | Catches failures before publish and before UI rollout. |
| Free-form style metadata | Structured semantic role contracts for color/type/constraints | Branding milestone v3.4.0 | Provides stable cross-role handoff and deterministic outputs. |

**Deprecated/outdated:**
- Treating accessibility as advisory-only for identity artifacts.
- Generating raw visual tokens without semantic-role lineage in Phase 75.

## Open Questions

1. **What exact required semantic role pairs are mandatory in the first gate matrix?**
   - What we know: D-05 requires required semantic role pairs and deterministic checks.
   - What's unclear: Final mandatory pair list (for example text-on-surface, primary-action-on-surface, inverse-text-on-brand).
   - Recommendation: Lock a minimum required pair matrix in `75-PLAN.md` Wave 0 before implementation.

2. **Should typography readability checks include numeric heuristics in Phase 75 or only metadata validation?**
   - What we know: BRAND-ID-02 includes readability.
   - What's unclear: Whether readability is enforced via strict numeric constraints now or phased with UI rendering checks.
   - Recommendation: Enforce baseline numeric constraints now (line-height range + minimum body size metadata) and extend visual checks in Phase 76.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Compiler modules + tests | Yes | v22.13.0 | None |
| npm | Dependency install + test scripts | Yes | 10.9.2 | None |
| git | Workflow traceability | Yes | 2.53.0.windows.2 | None |

**Missing dependencies with no fallback:**
- None.

**Missing dependencies with fallback:**
- None.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node built-in test runner (`node:test`) |
| Config file | none (scripted in `package.json`) |
| Quick run command | `node --test test/phase-75/*.test.js -x` |
| Full suite command | `npm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BRAND-ID-01 | Same strategy artifact input yields identical identity artifact fingerprint and field ordering | unit | `node --test test/phase-75/identity-determinism.test.js -x` | No - Wave 0 |
| BRAND-ID-01 | Semantic role model emits required color/typography/constraints structure with lineage references | unit/schema | `node --test test/phase-75/semantic-role-model.test.js -x` | No - Wave 0 |
| BRAND-ID-02 | Required contrast checks block readiness and emit deterministic diagnostics on failure | unit/integration | `node --test test/phase-75/accessibility-gates.test.js -x` | No - Wave 0 |
| BRAND-ID-02 | Submit handler integration remains additive and surfaces gate report fields without endpoint contract break | integration | `node --test test/phase-75/handlers-identity-integration.test.js -x` | No - Wave 0 |
| BRAND-ID-02 | Downstream UI a11y lane remains wired for regression checks | regression | `npm run test:ui-a11y` | Yes |

### Sampling Rate
- **Per task commit:** `node --test test/phase-75/*.test.js -x`
- **Per wave merge:** `node --test test/phase-75/*.test.js test/phase-74/*.test.js`
- **Phase gate:** `npm test` and `npm run test:ui-a11y`

### Wave 0 Gaps
- [ ] `test/phase-75/identity-determinism.test.js` - canonical serialization, stable ordering, deterministic fingerprint replay
- [ ] `test/phase-75/semantic-role-model.test.js` - required role coverage and lineage references
- [ ] `test/phase-75/accessibility-gates.test.js` - WCAG threshold checks and blocking diagnostics
- [ ] `test/phase-75/handlers-identity-integration.test.js` - additive submit contract with identity/gate fields
- [ ] `test/phase-75/fixtures/*.json` - fixed strategy fixtures for pass/fail accessibility matrices

## Sources

### Primary (HIGH confidence)
- Repository source: `onboarding/backend/handlers.cjs`, `onboarding/backend/brand-strategy/*.cjs`, `onboarding/backend/brand-inputs/evidence-graph-writer.cjs`, `lib/markos/theme/tokens.ts`, `lib/markos/theme/brand-pack.ts`, `test/ui-a11y/accessibility.test.js`.
- WCAG official docs: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html (updated 2026-03-09), https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html (updated 2026-02-23).

### Secondary (MEDIUM confidence)
- Storybook accessibility testing docs: https://storybook.js.org/docs/writing-tests/accessibility-testing (addon configuration and CI behavior).
- Existing project-wide branding research docs in `.planning/research/STACK.md`, `.planning/research/PITFALLS.md`, `.planning/research/ARCHITECTURE.md` (used as internal precedent, not final authority).

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - grounded in current repo dependencies, runtime checks, and verified npm registry versions.
- Architecture: HIGH - directly derived from existing Phase 73/74 integration seams and additive constraints.
- Pitfalls: MEDIUM-HIGH - validated by current code/test patterns and WCAG guidance; final role-pair matrix still needs plan-level lock.

**Research date:** 2026-04-11
**Valid until:** 2026-05-11
