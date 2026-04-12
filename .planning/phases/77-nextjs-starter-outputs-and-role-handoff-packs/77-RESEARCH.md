# Phase 77: Next.js Starter Outputs and Role Handoff Packs - Research

**Researched:** 2026-04-12
**Domain:** Deterministic Next.js starter descriptor and role-handoff pack generation from canonical branding lineage
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Emit a canonical starter descriptor artifact including app shell metadata, theme variable mappings, component bindings, and integration instructions.
- **D-02:** Starter descriptor output must be deterministic for fixed lineage inputs and ruleset version.
- **D-03:** Descriptor targets Next.js app-router conventions and references canonical Tailwind v4 token and shadcn contract outputs from Phase 76.
- **D-04:** Component bindings must map semantic intents to required primitives/states without manual reinterpretation.
- **D-05:** Generate role-targeted handoff packs from one canonical descriptor source (no independent rewrites).
- **D-06:** Packs must include immediate next actions, constraints, and acceptance checks per role.
- **D-07:** Role packs must preserve lineage pointers to underlying strategy/identity/token artifacts.
- **D-08:** Integrate additively with existing backend submit/response surfaces; no standalone public API route.
- **D-09:** Persist tenant-scoped starter and handoff artifacts with deterministic identifiers.
- **D-10:** Keep outputs contract-driven and implementation-ready; avoid vague prose-only guidance.

### Claude's Discretion
- Internal module decomposition for starter descriptor compiler and role pack projector.
- Exact format of role pack markdown/json payload structure.
- Diagnostic message wording where semantics are unchanged.

### Deferred Ideas (OUT OF SCOPE)
- Bundle publish/rollback controls (Phase 78).
- Governance drift detection and active-pointer promotion logic (Phase 78).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BRAND-NEXT-01 | The engine emits a Next.js starter descriptor with theme variables, component bindings, and scaffold-ready integration metadata. | Deterministic descriptor compiler with App Router scaffold map, token/component lineage embedding, and fail-closed schema diagnostics. |
| BRAND-ROLE-01 | The system produces role-specific handoff packs for strategist, designer, founder/operator, frontend engineer, and content/marketing stakeholders. | Canonical-source role pack projector that derives per-role next actions, guardrails, and acceptance checks from descriptor sections without independent rewrites. |
</phase_requirements>

## Summary

Phase 77 should be implemented as a deterministic extension of the existing submit-time branding compiler chain already present in `onboarding/backend/handlers.cjs`: compile strategy and identity, compile design-system contracts, then compile one canonical Next.js starter descriptor and project role handoff packs from that descriptor. The same patterns used in Phases 74-76 should be reused: stable-sort canonical artifacts, hash deterministic fingerprints, fail closed on missing required sections, persist tenant-scoped records with replay-safe upsert semantics, and expose outputs additively in submit response payloads.

The descriptor must be the single source of truth for handoffs. Role packs should not perform independent interpretation against strategy or identity artifacts. Instead, each role pack should be generated from deterministic descriptor sections (plus lineage pointers already embedded in those sections), with role-specific views for immediate actions, immutable constraints, and acceptance checks. This preserves D-05 and D-07 while preventing cross-role drift.

Additive integration is mandatory. The phase should not add a public standalone route. It should wire into current backend submit flow where Phase 76 artifacts are already generated and persisted, then append `nextjs_starter_descriptor`, `role_handoff_packs`, diagnostics, and persistence metadata blocks to existing response contracts.

**Primary recommendation:** Implement a `brand-nextjs` compiler lane (`compile -> validate -> project role packs -> persist -> respond`) that mirrors the deterministic architecture and tenant-safe persistence model from Phases 74-76.

## Project Constraints (from CLAUDE.md)

- Treat `.planning/STATE.md` as canonical state; do not use `.protocol-lore/STATE.md` as live state.
- Respect methodology split: GSD under `.agent/get-shit-done/`, MarkOS under `.agent/markos/`.
- Keep client overrides only in `.markos-local/`.
- Primary install/update path is `npx markos`.
- Default test commands are `npm test` or `node --test test/**/*.test.js`.
- Local onboarding server command is `node onboarding/backend/server.cjs`.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js | v22.13.0 (local), repo requires `>=20.16.0` | Runtime for deterministic backend compilers and handlers | Existing Phase 73-76 compilers and tests are Node CJS modules. |
| Next.js | 16.2.3 | Target descriptor contract for App Router starter outputs | Official App Router file conventions and project structure define starter scaffold metadata. |
| tailwindcss | 4.2.2 | Theme variable target mapping for starter descriptor | Phase 76 token contract already targets Tailwind v4 mappings consumed downstream. |
| shadcn | 4.2.0 | Component primitive and state contract target | Phase 76 manifest provides required primitives/states for deterministic component binding export. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Node `crypto` + stable-sort helpers | Node core + in-repo utilities | Deterministic fingerprinting and canonical ordering | Every descriptor and pack artifact ID must be stable for fixed lineage input. |
| Node test runner (`node:test`) | Node core | Nyquist requirement-to-test gates for phase suite | Use for `test/phase-77/*.test.js` deterministic and integration coverage. |
| Existing handler integration seam | in-repo | Additive submit integration | Reuse current Phase 73-76 submit pipeline extension point. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Canonical descriptor -> role projector | Independent role generators per role | Violates D-05 and creates drift risk between role outputs. |
| Additive submit integration | New public endpoint for starter generation | Violates D-08 and expands API surface prematurely. |
| Replay-safe tenant upsert keyed by deterministic fingerprint | Timestamp/UUID keyed write | Breaks D-02 and D-09 determinism and idempotent replay semantics. |

**Installation:**
```bash
# No mandatory new runtime dependency required for Phase 77 implementation.
# Phase 77 consumes existing strategy/identity/design-system outputs and emits new artifacts.
```

**Version verification:**
```bash
npm view next version
npm view tailwindcss version
npm view shadcn version
```
Verified at research time:
- next: `16.2.3`
- tailwindcss: `4.2.2`
- shadcn: `4.2.0`

## Architecture Patterns

### Recommended Project Structure

```text
onboarding/backend/brand-nextjs/
├── starter-descriptor-schema.cjs         # fail-closed descriptor schema validator
├── starter-descriptor-compiler.cjs       # deterministic App Router starter descriptor compiler
├── role-handoff-pack-schema.cjs          # fail-closed pack schema validator
├── role-handoff-pack-projector.cjs       # canonical descriptor -> per-role pack projections
├── handoff-diagnostics.cjs               # shared deterministic diagnostics helpers/codes
└── starter-artifact-writer.cjs           # tenant-safe replay-safe persistence

test/phase-77/
├── starter-descriptor-determinism.test.js
├── starter-descriptor-schema.test.js
├── role-pack-projection-determinism.test.js
├── role-pack-schema.test.js
├── starter-handoff-integration.test.js
└── starter-handoff-diagnostics.test.js
```

### Pattern 1: Canonical Descriptor First, Then Role Projection
**What:** Build one canonical Next.js starter descriptor and generate role packs from this descriptor only.
**When to use:** Every role handoff payload in Phase 77.
**Example:**
```javascript
const descriptor = compileNextjsStarterDescriptor({
  strategy_result,
  identity_result,
  token_contract,
  component_contract_manifest,
  ruleset_version,
});

const rolePacks = projectRoleHandoffPacks(descriptor, {
  roles: ['strategist', 'designer', 'founder_operator', 'frontend_engineer', 'content_marketing'],
});
```

### Pattern 2: Deterministic Artifact Envelope
**What:** Stable-sort artifact payload, compute deterministic fingerprint, and include lineage metadata.
**When to use:** Descriptor payload, role pack payloads, and persisted record metadata.
**Example:**
```javascript
const canonical = stableSort(descriptor);
const descriptorFingerprint = buildFingerprint({
  ruleset_version,
  descriptor: canonical,
});
```

### Pattern 3: Additive Submit Integration in Existing Flow
**What:** Extend submit flow after Phase 76 compilers with Phase 77 compile/project/persist lane.
**When to use:** `handleSubmit` response and readiness diagnostics merger.
**Example:**
```javascript
starterDescriptorCompilation = compileNextjsStarterDescriptor({
  strategy_result: strategySynthesisResult,
  identity_result: compiledIdentityArtifact,
  token_contract: tokenContractCompilation.token_contract,
  component_contract_manifest: componentContractCompilation.component_contract_manifest,
});

roleHandoffPacks = projectRoleHandoffPacks(starterDescriptorCompilation.descriptor);
starterArtifactsWrite = persistStarterArtifacts(tenantId, {
  nextjs_starter_descriptor: starterDescriptorCompilation.descriptor,
  role_handoff_packs: roleHandoffPacks,
});
```

### Pattern 4: Deterministic Diagnostics + Publish Readiness Merge
**What:** Emit structured diagnostics (`code`, `path`, `blocking`, `message`, `recommended_fix`) and merge into readiness block.
**When to use:** Missing descriptor sections, unresolved component mappings, or missing role pack acceptance checks.
**Example:**
```javascript
publishReadiness = mergeReadinessDiagnostics(publishReadiness, starterDiagnostics);
```

### Anti-Patterns to Avoid

- **Independent role synthesis:** Generating role packs from separate prompt-like logic instead of canonical descriptor projection.
- **Non-deterministic route scaffold ordering:** Emitting route hints from unsorted object iteration leading to unstable fingerprints.
- **Missing lineage pointers in role tasks:** Role packs that include actions but cannot trace to source strategy/identity/design-system decisions.
- **Standalone phase endpoint expansion:** Adding separate public API route for phase output in Phase 77.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Deterministic IDs | UUID/timestamp IDs for starter artifacts | Stable-sort + SHA-256 fingerprint envelope | Required for D-02 and tenant replay safety. |
| Role instructions | Free-form per-role narrative generation | Schema-backed role pack projection from canonical descriptor | Prevents role drift and preserves deterministic contracts. |
| Integration metadata mapping | Ad hoc textual docs only | Structured route/theme/component integration maps in descriptor | Satisfies BRAND-NEXT-01 scaffold-readiness requirement. |
| Persistence semantics | Append-only blobs without dedupe | Tenant + fingerprint replay-safe upsert store | Matches Phase 74-76 persistence guarantees. |

**Key insight:** Phase 77 complexity is not UI generation; it is preventing cross-role semantic drift while preserving deterministic lineage across starter and handoff outputs.

## Common Pitfalls

### Pitfall 1: Descriptor sections become prose-only
**What goes wrong:** Frontend engineers still need interpretation loops.
**Why it happens:** Descriptor omits explicit file-level integration metadata and component binding maps.
**How to avoid:** Require structured scaffold sections (`app_router_layout`, `route_hints`, `theme_injection_points`, `component_bindings`, `acceptance_checks`) in schema.
**Warning signs:** Engineers ask where to apply tokens or which states are mandatory.

### Pitfall 2: Role packs diverge from descriptor truth
**What goes wrong:** Strategist/designer/engineering packs disagree on constraints.
**Why it happens:** Independent pack generation paths with direct artifact reads.
**How to avoid:** Role projector accepts only canonical descriptor input and role key.
**Warning signs:** Same rule appears with different wording/constraints across packs.

### Pitfall 3: Lineage is lost in role-level actions
**What goes wrong:** A role action cannot be traced to source decision.
**Why it happens:** Projector strips lineage pointers during transformation.
**How to avoid:** Keep `lineage` per action/check item with source decision IDs and fingerprints.
**Warning signs:** Acceptance checks cannot explain provenance during verification.

### Pitfall 4: Additive integration regression
**What goes wrong:** Existing submit consumers break after phase wiring.
**Why it happens:** Field replacement instead of additive response extension.
**How to avoid:** Preserve existing fields and append Phase 77 blocks only.
**Warning signs:** Phase 73-76 integration tests start failing.

## Code Examples

Verified patterns from current codebase to mirror in Phase 77 implementation:

### Additive compile/persist integration in submit pipeline
```javascript
// Source: onboarding/backend/handlers.cjs
tokenContractCompilation = compileTokenContract(strategySynthesisResult, compiledIdentityArtifact);
componentContractCompilation = compileComponentContractManifest({
  token_contract: tokenContractCompilation.token_contract,
  strategy_result: strategySynthesisResult,
  identity_result: compiledIdentityArtifact,
  semantic_intent: resolveDesignSystemSemanticIntent(seed),
});

if (tokenContractCompilation.token_contract && componentContractCompilation.component_contract_manifest) {
  designSystemArtifactWrite = persistDesignSystemArtifacts(brandExecutionContext.tenant_id, {
    token_contract: tokenContractCompilation.token_contract,
    token_contract_metadata: tokenContractCompilation.metadata,
    component_contract_manifest: componentContractCompilation.component_contract_manifest,
    component_contract_metadata: componentContractCompilation.metadata,
  });
}
```

### Replay-safe deterministic tenant persistence
```javascript
// Source: onboarding/backend/brand-design-system/design-system-artifact-writer.cjs
const artifactFingerprint = buildFingerprint(canonicalPayload);
const artifactId = `${tenantId}:design-system:${artifactFingerprint}`;
const upsert = _store.upsert(tenantId, artifactFingerprint, record);
```

### Readiness diagnostics merge pattern
```javascript
// Source: onboarding/backend/handlers.cjs
publishReadiness = mergeReadinessDiagnostics(publishReadiness, designSystemDiagnostics);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Static UI scaffolds and human-written handoff notes | Deterministic compiler outputs with lineage-carrying contracts in backend pipeline | Phases 73-76 (2026-04) | Phase 77 can produce machine-consumable starter + role packs from canonical artifacts instead of manual interpretation loops. |
| Component-library black-box consumption | Open-code component contracts (shadcn model) + deterministic mapping metadata | Current shadcn guidance and Phase 76 implementation | Stronger AI/operator editability and explicit component-state contract enforcement. |

**Deprecated/outdated:**
- Phase-local free-form handoff documents without deterministic contract structure or lineage pointers.

## Open Questions

1. **Minimum Next.js starter route scaffold scope for Phase 77**
   - What we know: BRAND-NEXT-01 requires scaffold-ready integration metadata and App Router alignment.
   - What's unclear: Whether first pass includes only shell routes (root layout/page/theme globals) or also canonical feature route groups.
   - Recommendation: Lock a finite required scaffold list in Phase 77 PLAN Wave 0 tests.

2. **Role-pack output format priority (JSON-first vs JSON+Markdown dual output)**
   - What we know: Context allows discretion on payload format while keeping semantics fixed.
   - What's unclear: Whether downstream consumers need markdown immediately or can consume JSON-only in Phase 77.
   - Recommendation: Make canonical source JSON; generate markdown projection deterministically as optional convenience output from same JSON source.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | compiler modules, tests, handlers integration | Yes | v22.13.0 | None |
| npm | version checks, scripts | Yes | 10.9.2 | None |
| Next.js package metadata | starter target version verification | Yes | 16.2.3 | If registry unavailable, keep locked target from roadmap/requirements and verify later |

**Missing dependencies with no fallback:**
- None identified for Phase 77 code/config implementation.

**Missing dependencies with fallback:**
- None.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Node built-in test runner (`node:test`) |
| Config file | none - convention-based under `test/**/*.test.js` |
| Quick run command | `node --test test/phase-77/*.test.js` |
| Full suite command | `npm test` |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BRAND-NEXT-01 | Deterministic starter descriptor for fixed lineage inputs and ruleset version | unit | `node --test test/phase-77/starter-descriptor-determinism.test.js -x` | No - Wave 0 |
| BRAND-NEXT-01 | Descriptor schema requires app shell metadata, theme mappings, component bindings, integration metadata | unit | `node --test test/phase-77/starter-descriptor-schema.test.js -x` | No - Wave 0 |
| BRAND-ROLE-01 | Role handoff packs are generated from canonical descriptor with no independent rewrite drift | unit | `node --test test/phase-77/role-pack-projection-determinism.test.js -x` | No - Wave 0 |
| BRAND-ROLE-01 | Role packs include next actions, immutable constraints, acceptance checks, and lineage pointers | unit | `node --test test/phase-77/role-pack-schema.test.js -x` | No - Wave 0 |
| BRAND-NEXT-01, BRAND-ROLE-01 | Additive submit integration exposes starter + role packs and persistence metadata without regressing existing fields | integration | `node --test test/phase-77/starter-handoff-integration.test.js -x` | No - Wave 0 |
| BRAND-NEXT-01, BRAND-ROLE-01 | Missing descriptor sections or pack obligations fail closed with explicit diagnostics and blocked readiness | integration | `node --test test/phase-77/starter-handoff-diagnostics.test.js -x` | No - Wave 0 |

### Sampling Rate

- **Per task commit:** `node --test test/phase-77/*.test.js`
- **Per wave merge:** `node --test test/phase-74/*.test.js test/phase-75/*.test.js test/phase-76/*.test.js test/phase-77/*.test.js`
- **Phase gate:** `npm test`

### Wave 0 Gaps

- [ ] `test/phase-77/starter-descriptor-determinism.test.js` - stable descriptor output and fingerprint replay checks.
- [ ] `test/phase-77/starter-descriptor-schema.test.js` - required Next.js scaffold and mapping field validation.
- [ ] `test/phase-77/role-pack-projection-determinism.test.js` - one-source deterministic role projection checks.
- [ ] `test/phase-77/role-pack-schema.test.js` - per-role required sections and lineage checks.
- [ ] `test/phase-77/starter-handoff-integration.test.js` - additive submit response and persistence contract coverage.
- [ ] `test/phase-77/starter-handoff-diagnostics.test.js` - fail-closed diagnostics and readiness merge behavior.

## Sources

### Primary (HIGH confidence)
- Repository code: `onboarding/backend/handlers.cjs` (Phase 73-76 additive compile/persist integration and readiness merge patterns)
- Repository code: `onboarding/backend/brand-design-system/token-compiler.cjs`
- Repository code: `onboarding/backend/brand-design-system/component-contract-compiler.cjs`
- Repository code: `onboarding/backend/brand-design-system/design-system-artifact-writer.cjs`
- Repository code: `onboarding/backend/brand-identity/identity-artifact-writer.cjs`
- Planning artifacts: `.planning/phases/77-nextjs-starter-outputs-and-role-handoff-packs/77-CONTEXT.md`, `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md`, `.planning/phases/76-token-compiler-and-shadcn-component-contract/76-RESEARCH.md`, `.planning/phases/76-token-compiler-and-shadcn-component-contract/76-VERIFICATION.md`
- Official docs: https://nextjs.org/docs/app
- Official docs: https://nextjs.org/docs/app/getting-started/project-structure
- Official docs: https://tailwindcss.com/docs/installation/framework-guides/nextjs
- Official docs: https://ui.shadcn.com/docs

### Secondary (MEDIUM confidence)
- npm registry version checks (`npm view`) for `next`, `tailwindcss`, `shadcn`

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - verified package versions plus official framework docs.
- Architecture: HIGH - directly derived from existing deterministic compiler and additive handler patterns in repo.
- Pitfalls: HIGH - grounded in observed failure classes already handled in Phase 73-76 diagnostics and readiness flow.

**Research date:** 2026-04-12
**Valid until:** 2026-05-12
