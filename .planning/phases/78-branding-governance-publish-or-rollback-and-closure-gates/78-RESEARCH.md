# Phase 78: Branding Governance, Publish or Rollback, and Closure Gates - Research

**Researched:** 2026-04-12
**Domain:** Branding bundle governance, publish/rollback controls, drift evidence, and deterministic closure gates
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Branding artifacts are versioned as a single lineage bundle with immutable bundle IDs.
- **D-02:** Publish promotes only fully verified bundles via active-pointer switching.
- **D-03:** Rollback restores previously verified bundles with full traceability logs.
- **D-04:** Drift evidence must detect divergence between active pointer and recomputed expected lineage.
- **D-05:** Closure gates must include determinism, tenant isolation, and contract integrity checks.
- **D-06:** Governance operations are tenant-scoped and fail-closed on missing prerequisites.
- **D-07:** No standalone public API route; governance integrates additively into existing backend surfaces.
- **D-08:** Verification artifacts are machine-readable and auditable.
- **D-09:** Governance changes must not mutate historical bundle content.
- **D-10:** Diagnostics must be explicit for publish/rollback denials.

### Claude's Discretion
- Internal module separation for bundle registry, pointer management, and drift auditor.
- Exact names for governance diagnostics codes.

### Deferred Ideas (OUT OF SCOPE)
- Autonomous deployment orchestration outside branding governance.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BRAND-GOV-01 | Branding artifacts are versioned as a single lineage bundle with publish, rollback, and drift-detection evidence. | Bundle registry + active pointer + rollback ledger + drift audit model with deterministic lineage recompute. |
| BRAND-GOV-02 | Determinism, tenant isolation, and contract integrity checks are mandatory verification gates for milestone closure. | Fail-closed closure gate runner, deterministic replay tests, tenant-bound authorization/context checks, and schema/integrity gate assertions. |
</phase_requirements>

## Summary

Phase 78 should be implemented as a governance lane layered on top of the existing Phase 73-77 deterministic artifact chain already integrated in submit flow. Today, the backend already emits deterministic fingerprints and tenant-scoped persisted records for strategy, identity, design-system, and Next.js starter outputs. The missing capability is governance over these outputs as one versioned lineage bundle with safe promotion, rollback, and drift evidence.

The recommended implementation is a three-part additive module set: a bundle registry (immutable bundle snapshots), an active-pointer manager (publish and rollback via pointer switch only), and a drift auditor (active pointer versus recomputed expected bundle from canonical artifact fingerprints). This directly satisfies D-01 through D-04 and D-09 while preserving the current response contract and avoiding any standalone route per D-07.

Closure must be deterministic and fail-closed: publish/rollback operations should deny on missing verification evidence, tenant mismatch, unresolved diagnostics, or contract-integrity failures. Every deny decision should return explicit reason codes and machine-readable diagnostics so verification artifacts remain auditable (D-08, D-10).

**Primary recommendation:** Add a tenant-scoped immutable bundle registry with pointer-based publish/rollback and a deterministic closure-gate runner integrated into existing backend surfaces.

## Project Constraints (from CLAUDE.md)

- Respect startup context order: `.protocol-lore/QUICKSTART.md`, `.protocol-lore/INDEX.md`, `.planning/STATE.md`, `.agent/markos/MARKOS-INDEX.md`.
- Treat GSD and MarkOS as separate methodology layers; do not mix ownership boundaries.
- Keep client overrides in `.markos-local/` only.
- Primary install/update path is `npx markos`.
- Test commands are `npm test` or `node --test test/**/*.test.js`.
- Onboarding backend is launched via `node onboarding/backend/server.cjs` using port from `onboarding/onboarding-config.json`.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js | v22.13.0 local (`>=20.16.0` required by repo) | Runtime for governance modules and tests | Existing backend modules and test harness already use Node CJS and node:test. |
| next | 16.2.3 | Canonical starter target in lineage bundle | Starter descriptor already encodes Next.js app-router contract and dependencies. |
| tailwindcss | 4.2.2 | Canonical token target in lineage bundle | Token contract emits Tailwind v4 theme mappings. |
| shadcn | 4.2.0 | Canonical component contract target in lineage bundle | Component manifest required states/primitives are already deterministic and schema validated. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Node `crypto` hashing | Node core | Stable bundle and evidence fingerprints | Bundle ID, drift evidence hash, and closure evidence hash generation. |
| Existing deterministic helpers (`stableSort`, `buildFingerprint`) | in-repo | Canonical ordering + hash stability | Any governance payload that must be replay-safe and auditable. |
| Node test runner (`node:test`) | Node core | Closure gate and governance regression coverage | Fast phase-scoped tests and full suite verification. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Pointer-based publish/rollback | Mutable in-place artifact updates | Violates immutability and breaks traceability/history guarantees. |
| Single bundle snapshot | Per-artifact independent publishing | Allows cross-artifact drift and undermines contract integrity. |
| Additive integration into `handleSubmit` and existing backend surfaces | New standalone governance API | Violates D-07 and introduces unnecessary route-surface expansion. |

**Installation:**
No new dependency is required for Phase 78 baseline. Reuse existing backend/runtime stack.

**Version verification (registry checked):**
- `npm view next version` -> 16.2.3
- `npm view tailwindcss version` -> 4.2.2
- `npm view shadcn version` -> 4.2.0

## Architecture Patterns

### Recommended Project Structure

```text
onboarding/backend/brand-governance/
├── bundle-registry.cjs           # immutable tenant-scoped lineage bundle records
├── active-pointer.cjs            # publish/rollback via pointer switching only
├── drift-auditor.cjs             # expected vs active lineage recompute and drift evidence
├── closure-gates.cjs             # deterministic/tenant/integrity gate runner
├── governance-diagnostics.cjs    # canonical deny codes and diagnostic normalization
└── governance-artifact-writer.cjs# machine-readable evidence persistence envelope

test/phase-78/
├── bundle-governance.test.js
├── publish-rollback-controls.test.js
├── drift-evidence.test.js
├── closure-gates.test.js
└── tenant-isolation-governance.test.js
```

### Pattern 1: Immutable Lineage Bundle Envelope
**What:** Build one immutable bundle from already-persisted deterministic artifact IDs/fingerprints (strategy, identity, token contract, component manifest, starter descriptor, role packs).
**When to use:** Every bundle creation before publish eligibility.
**Example:**
```javascript
const bundle = createLineageBundle({
  tenant_id,
  strategy_artifact_id,
  identity_artifact_id,
  design_system_artifact_id,
  starter_artifact_id,
  publish_readiness,
  lineage_fingerprints,
});
// bundle_id = sha256(stableSort(bundle payload))
```

### Pattern 2: Publish/Rollback as Active Pointer Switch
**What:** Keep bundles immutable; only switch an active pointer after closure-gate pass.
**When to use:** Publish promotion and rollback operations.
**Example:**
```javascript
assertClosureGatesPass(tenant_id, candidate_bundle_id);
setActiveBundlePointer(tenant_id, candidate_bundle_id, {
  action: 'publish',
  actor_id,
  reason,
});
```

### Pattern 3: Deterministic Drift Evidence
**What:** Recompute expected bundle lineage from canonical artifact fingerprints and compare against active pointer target.
**When to use:** Publish preflight, rollback preflight, periodic governance checks, and phase verification.
**Example:**
```javascript
const expected = recomputeExpectedBundleFingerprint(canonicalArtifacts);
const active = getActiveBundlePointer(tenant_id);
const drift = evaluateDrift({ expected, active_bundle_fingerprint: active.bundle_fingerprint });
```

### Pattern 4: Fail-Closed Tenant-Scoped Governance Operations
**What:** Every governance operation must validate tenant context and deny cross-tenant actions.
**When to use:** Bundle create, publish, rollback, and drift evidence reads.
**Example:**
```javascript
if (request.tenant_id !== bundle.tenant_id) {
  return deny('BRAND_GOV_TENANT_MISMATCH', 'Bundle tenant does not match active request context');
}
```

### Anti-Patterns to Avoid
- **Mutable historical bundle data:** Never overwrite bundle payloads after creation.
- **Artifact-level partial publish:** Never promote only one lane (for example starter only) while others remain stale.
- **Human-readable-only evidence:** Governance decisions must include machine-readable diagnostics and hashes.
- **Silent denial paths:** Denials without stable reason codes break closure auditability.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Canonical payload hashing | Ad hoc object stringification | Existing stable-sort + fingerprint helper pattern used in brand modules | Prevents nondeterministic key-order hash drift. |
| Readiness/diagnostics merge | Bespoke per-module merge logic | Existing `mergeReadinessDiagnostics` semantics in handlers | Maintains consistent blocked-state behavior and reason-code surface. |
| Tenant identity derivation | New custom tenant parsing layer | Existing `buildExecutionContext` tenant and actor derivation | Keeps isolation behavior aligned with current backend authorization context. |
| Replay-safe persistence semantics | Timestamp-keyed writes | Existing upsert-by-tenant+fingerprint persistence pattern | Ensures idempotency and deterministic replay behavior. |

**Key insight:** Governance should compose existing deterministic and tenant-safe primitives rather than introducing new behavioral contracts.

## Common Pitfalls

### Pitfall 1: Bundle Fingerprint Derived from Incomplete Lineage
**What goes wrong:** Bundle IDs remain stable but omit a required artifact lane, creating false governance confidence.
**Why it happens:** Bundle payload assembled from optional fields without strict schema requirements.
**How to avoid:** Require all lane artifact IDs/fingerprints and fail closed on missing values.
**Warning signs:** Publish passes while one or more artifact write blocks are null.

### Pitfall 2: Rollback Without Verification Snapshot
**What goes wrong:** Rollback can point to a prior bundle that was never fully verified.
**Why it happens:** Rollback selection checks existence only, not verification status.
**How to avoid:** Require verification evidence hash and gate status for every rollback candidate.
**Warning signs:** Rollback operations succeed with absent closure evidence block.

### Pitfall 3: Drift Check Uses Current In-Memory Objects Instead of Canonical Persisted IDs
**What goes wrong:** Drift signals vary across runs even for the same logical state.
**Why it happens:** Comparing transient payload content rather than persisted canonical lineage references.
**How to avoid:** Drift model should compare deterministic persisted fingerprint references and bundle fingerprint envelope.
**Warning signs:** Drift toggles between pass/fail for unchanged active pointer.

### Pitfall 4: Tenant Isolation Leakage in Governance Reads
**What goes wrong:** One tenant can read another tenant’s bundle history or active pointer.
**Why it happens:** Governance lookups keyed only by bundle ID without tenant namespace checks.
**How to avoid:** Namespace all registry/pointer records by tenant and enforce request tenant match.
**Warning signs:** Governance endpoints/tests succeed without explicit tenant ID assertions.

## Code Examples

Verified in-repo patterns to reuse:

### Deterministic artifact fingerprinting pattern
```javascript
const artifactFingerprint = buildFingerprint({
  starter_descriptor: payload.starter_descriptor,
  starter_metadata,
  role_handoff_packs: payload.role_handoff_packs,
  role_handoff_metadata,
});
```

### Tenant-scoped replay-safe upsert key pattern
```javascript
const key = `${tenantId}:${artifactFingerprint}`;
const upsert = store.upsert(tenantId, artifactFingerprint, row);
```

### Publish-readiness blocking merge pattern
```javascript
publishReadiness = mergeReadinessDiagnostics(publishReadiness, designSystemDiagnostics);
publishReadiness = mergeReadinessDiagnostics(publishReadiness, nextjsHandoffDiagnostics);
```

### Additive submit response extension pattern
```javascript
json(res, 200, {
  ...existingPayload,
  nextjs_starter_descriptor,
  role_handoff_packs,
  nextjs_starter_artifact_write,
  publish_readiness,
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Lane-by-lane deterministic compilation without governance ownership | Full lineage-bundle governance target with publish/rollback/drift controls | Phase 78 scope | Prevents post-compilation divergence and enforces auditable release control. |
| Accessibility-only publish readiness from identity lane | Multi-lane closure gates (determinism + tenant isolation + contract integrity) | Phase 78 target | Stronger fail-closed release safety for entire branding chain. |
| Per-lane artifact persistence with no active version pointer | Immutable bundle registry + active pointer promotion/rollback | Phase 78 target | Enables safe version governance and traceable rollback semantics. |

**Deprecated/outdated for this phase:**
- Treating `publish_readiness` as identity-only signal is insufficient once governance bundles are introduced.
- Considering bundle history mutable is incompatible with D-09 and auditability guarantees.

## Open Questions

1. **Governance trigger surface in existing backend routes**
   - What we know: D-07 forbids standalone public API routes; submit flow already has additive outputs.
   - What's unclear: Whether publish/rollback is wired to existing approve flow, admin flow, or internal helper calls only.
   - Recommendation: Decide route integration seam before planning wave tasks to avoid routing churn.

2. **Persistence backend for governance registry**
   - What we know: Current phase artifact writers use in-memory stores with deterministic upsert semantics in tests.
   - What's unclear: Whether Phase 78 should remain in-memory for scope or add durable storage in this phase.
   - Recommendation: Keep storage adapter boundary explicit so persistence medium can evolve without contract changes.

3. **Closure evidence retention policy boundaries**
   - What we know: D-08 requires machine-readable auditable artifacts.
   - What's unclear: Required retention horizon and pruning policy for governance evidence snapshots.
   - Recommendation: Define retention metadata fields now; defer policy tuning to operations phase if needed.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| node | Governance modules and tests | ✓ | v22.13.0 | — |
| npm | Test and script invocation | ✓ | 10.9.2 | Use `node --test` directly if npm script wrapper unavailable |

**Missing dependencies with no fallback:**
- None.

**Missing dependencies with fallback:**
- None.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | node:test (Node core) |
| Config file | none (script-driven) |
| Quick run command | `node --test test/phase-78/*.test.js` |
| Full suite command | `npm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BRAND-GOV-01 | Immutable bundle versioning + publish/rollback pointer transitions + drift evidence output | unit + integration | `node --test test/phase-78/bundle-governance.test.js test/phase-78/publish-rollback-controls.test.js test/phase-78/drift-evidence.test.js -x` | ❌ Wave 0 |
| BRAND-GOV-02 | Deterministic replay + tenant isolation + contract integrity closure gates (fail-closed) | unit + integration | `node --test test/phase-78/closure-gates.test.js test/phase-78/tenant-isolation-governance.test.js -x` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `node --test test/phase-78/*.test.js`
- **Per wave merge:** `node --test test/phase-78/*.test.js test/phase-77/*.test.js`
- **Phase gate:** `npm test`

### Wave 0 Gaps
- [ ] `test/phase-78/bundle-governance.test.js` - covers BRAND-GOV-01 immutable bundle registry and ID determinism.
- [ ] `test/phase-78/publish-rollback-controls.test.js` - covers pointer switch publish/rollback and deny paths.
- [ ] `test/phase-78/drift-evidence.test.js` - covers active pointer versus recompute drift evidence.
- [ ] `test/phase-78/closure-gates.test.js` - covers determinism and contract-integrity fail-closed gates.
- [ ] `test/phase-78/tenant-isolation-governance.test.js` - covers tenant mismatch denial and cross-tenant read/write prevention.

## Sources

### Primary (HIGH confidence)
- `.planning/phases/78-branding-governance-publish-or-rollback-and-closure-gates/78-CONTEXT.md` - locked decisions and governance scope.
- `.planning/ROADMAP.md` - Phase 78 goal, dependencies, and acceptance intent.
- `.planning/REQUIREMENTS.md` - BRAND-GOV-01 and BRAND-GOV-02 contract definitions.
- `onboarding/backend/handlers.cjs` - additive integration surface, publish-readiness diagnostics merge, and tenant execution context.
- `onboarding/backend/brand-strategy/strategy-artifact-writer.cjs` - tenant-scoped deterministic strategy artifact persistence pattern.
- `onboarding/backend/brand-identity/identity-artifact-writer.cjs` - tenant-scoped deterministic identity artifact persistence pattern.
- `onboarding/backend/brand-design-system/design-system-artifact-writer.cjs` - deterministic design-system artifact envelope persistence.
- `onboarding/backend/brand-nextjs/starter-artifact-writer.cjs` - replay-safe starter/role-pack persistence contract.
- `onboarding/backend/brand-nextjs/handoff-diagnostics.cjs` - deterministic diagnostics and stable fingerprinting helpers.
- `onboarding/backend/brand-nextjs/starter-descriptor-compiler.cjs` - canonical lineage-bound starter descriptor generation.
- `onboarding/backend/brand-nextjs/role-handoff-pack-projector.cjs` - canonical descriptor to role-pack projection model.
- `.planning/phases/77-nextjs-starter-outputs-and-role-handoff-packs/77-VERIFICATION.md` - prior-phase verification proof and additive integration behavior.

### Secondary (MEDIUM confidence)
- `.planning/research/FEATURES.md` - milestone-level governance feature expectations and anti-features (advisory planning guidance).

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - versions verified in local environment and npm registry.
- Architecture: HIGH - recommendation is directly derived from existing deterministic artifact writers/handlers and locked phase decisions.
- Pitfalls: HIGH - inferred from concrete existing contracts and known failure modes in deterministic + tenant-safe flows.

**Research date:** 2026-04-12
**Valid until:** 2026-05-12
