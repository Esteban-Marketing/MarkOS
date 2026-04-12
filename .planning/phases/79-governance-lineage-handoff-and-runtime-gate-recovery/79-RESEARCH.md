# Phase 79: Governance Lineage Handoff and Runtime Gate Recovery - Research

**Researched:** 2026-04-12
**Domain:** Node.js onboarding submit pipeline governance handoff and closure-gate recovery
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
### Lineage Fingerprint Source Contract
- **D-01:** `lineage_fingerprints` must be sourced from canonical artifact writer metadata produced in the existing submit flow.
- **D-02:** Governance handoff must not recompute fingerprints in handlers when canonical metadata already exists.
- **D-03:** Fingerprint lane mapping is fixed to `strategy`, `identity`, `design_system`, and `starter` and must align 1:1 with governance lane validators.

### Missing Lane Failure Policy
- **D-04:** Missing or invalid fingerprint lanes fail the governance lane only; `/submit` remains successful and returns machine-readable governance denial evidence.
- **D-05:** Governance failure payloads must include explicit denial reason codes (no generic fallback for lane-validation failures).
- **D-06:** Silent governance bypass is not allowed for lane-missing conditions.

### Gate Recovery Completion Criteria
- **D-07:** Phase 79 is complete only when submit handoff includes valid `lineage_fingerprints` and governance bundle creation no longer denies for missing lanes.
- **D-08:** Phase 79 completion requires test proof and runtime proof: updated automated suite pass plus submit-path runtime evidence.
- **D-09:** Completion evidence must demonstrate closure-gate execution resumes after successful bundle creation in the submit path.

### Scope Boundary vs Phase 81
- **D-10:** Publish/rollback operational route exposure remains deferred to Phase 81; Phase 79 does not add new runtime publish/rollback endpoints.

### Claude's Discretion
- Exact helper extraction pattern for reading metadata fingerprints from existing artifact write results.
- Internal test partition between Phase 78 governance regression coverage and Phase 79 handoff-specific assertions.
- Logging verbosity for governance handoff diagnostics (must remain redaction-safe).

### Deferred Ideas (OUT OF SCOPE)
- Exposing publish/rollback operational runtime routes remains Phase 81 scope.
- Broad publish-readiness boundary refactor across earlier branding phases remains Phase 80 scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BRAND-GOV-01 | Branding artifacts are versioned as a single lineage bundle with publish, rollback, and drift-detection evidence. | Metadata-first lineage handoff pattern ensures `createBundle()` accepts full required payload and unblocks evidence/gates path. |
| BRAND-GOV-02 | Determinism, tenant isolation, and contract integrity checks are mandatory verification gates for milestone closure. | Existing `runClosureGates()` + tenant-scoped registry/pointer pattern preserved; Phase 79 focuses on restoring data contract input so gates execute end-to-end. |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- Read order for protocol context starts with `.protocol-lore/QUICKSTART.md`, then `.protocol-lore/INDEX.md`, then `.planning/STATE.md`, then `.agent/markos/MARKOS-INDEX.md`.
- Keep GSD vs MarkOS boundary explicit:
  - GSD workflow mechanics under `.agent/get-shit-done/` and `.planning/`.
  - MarkOS marketing protocol under `.agent/markos/` and `.agent/skills/markos-*`.
- Client overrides belong only under `.markos-local/`.
- Primary CLI path is `npx markos`.
- Test commands are `npm test` or `node --test test/**/*.test.js`.

## Summary

Phase 79 is a contract-repair phase, not a feature-add phase. The critical runtime seam is in `onboarding/backend/handlers.cjs` where `createBundle(tenantId, canonicalArtifacts)` currently passes only artifact IDs. The bundle registry contract requires five fields including `lineage_fingerprints`; missing fingerprints trigger `BRAND_GOV_MISSING_LANE` denial and prevent closure gates from executing on submit.

The established architecture already exists and should be reused: immutable bundle registry (`bundle-registry.cjs`), deterministic gate runner (`closure-gates.cjs`), append-only evidence envelope (`governance-artifact-writer.cjs`), and fail-soft submit behavior in handler error boundaries. The fix is specifically to source canonical fingerprint metadata from already-produced artifact write outputs and map to the exact four lane keys (`strategy`, `identity`, `design_system`, `starter`) before calling `createBundle()`.

SOTA for this stack remains built-in Node runtime primitives: `node:test` for deterministic, process-isolated regression coverage and `node:crypto` SHA-256 hashing for evidence and bundle IDs. This is better than introducing external harnesses or hashing libraries for this phase.

**Primary recommendation:** Add a small metadata extraction helper in `handlers.cjs` that builds the exact `lineage_fingerprints` object from canonical artifact metadata, pass it to `createBundle()`, and add dedicated Phase 79 submit-path tests proving governance denial semantics and gate recovery.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js runtime | >=20.16.0 (repo contract), 22.13.0 (current env) | Execute onboarding backend and tests | Existing project contract in `package.json` and all governance modules are CommonJS Node-native |
| node:crypto (built-in) | bundled with Node 22.13.0 | Deterministic SHA-256 for bundle IDs and governance evidence hashes | Already used across governance modules; no extra dependency surface |
| node:test (built-in) | bundled with Node 22.13.0 | Contract and regression testing for governance and submit paths | Existing phase tests are already authored in node:test style |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| node:assert/strict (built-in) | bundled with Node 22.13.0 | Deterministic assertions for reason-code and gate behavior | For exact contract checks in phase regression tests |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| node:test + node:assert | Jest/Vitest | Adds setup overhead and duplicate harness patterns in a repo already standardized on node:test |
| node:crypto hashing | External hashing package | Unnecessary dependency risk for a solved platform concern |

**Installation:**
```bash
# No new package installation required for Phase 79.
```

**Version verification:**
- Node: `node --version` -> `v22.13.0`
- npm: `npm --version` -> `10.9.2`
- NPM package verification (`npm view`) is N/A here because Phase 79 should not introduce new third-party packages.

## Architecture Patterns

### Recommended Project Structure
```
onboarding/backend/
├── handlers.cjs                            # submit orchestration and governance handoff join point
├── brand-governance/
│   ├── bundle-registry.cjs                 # immutable bundle creation + required lineage contract
│   ├── closure-gates.cjs                   # determinism + tenant isolation + contract integrity gates
│   ├── governance-diagnostics.cjs          # canonical DENY_CODES and lane requirements
│   ├── governance-artifact-writer.cjs      # machine-readable evidence envelope writer
│   ├── active-pointer.cjs                  # publish/rollback pointer model (kept out of scope for runtime routes)
│   └── drift-auditor.cjs                   # active-vs-expected lineage drift evidence
└── test/                                   # phase-scoped regression suites
```

### Pattern 1: Metadata-First Lineage Handoff
**What:** Build governance handoff payload from canonical artifact metadata already produced in submit flow; do not recompute fingerprints in handlers.
**When to use:** Any submit-path governance integration where upstream compilers/writers already emit deterministic fingerprints.
**Example:**
```javascript
// Source: onboarding/backend/handlers.cjs + onboarding/backend/brand-governance/bundle-registry.cjs
const canonicalArtifacts = {
  strategy_artifact_id: strategyPersistenceResult?.artifact_id || null,
  identity_artifact_id: identityArtifactWrite?.artifact_id || null,
  design_system_artifact_id: designSystemArtifactWrite?.artifact_id || null,
  starter_artifact_id: starterArtifactWrite?.artifact_id || null,
  lineage_fingerprints: {
    strategy: strategyPersistenceResult?.artifact_fingerprint || null,
    identity: identityArtifactWrite?.artifact_fingerprint || null,
    design_system: designSystemArtifactWrite?.token_contract_fingerprint || null,
    starter: starterArtifactWrite?.starter_fingerprint || null,
  },
};

const bundleResult = createBundle(tenantId, canonicalArtifacts);
```

### Pattern 2: Fail-Soft Submit, Fail-Closed Governance
**What:** Submit endpoint remains successful while governance lane returns machine-readable denial evidence when contract lanes are missing or invalid.
**When to use:** Additive governance validation where core onboarding write path must remain available.
**Example:**
```javascript
// Source: onboarding/backend/handlers.cjs + onboarding/backend/brand-governance/governance-diagnostics.cjs
if (bundleResult.denied) {
  brandingGovernanceResult = {
    error: 'bundle_creation_denied',
    reason_code: bundleResult.reason_code,
    machine_readable: true,
  };
}
// HTTP 200 submit envelope still returns.
```

### Pattern 3: Gate Triplet as Single Truth
**What:** Always execute determinism, tenant isolation, and contract integrity together through `runClosureGates()`.
**When to use:** Any publish/rollback readiness or submit-path evidence generation requiring closure proof.
**Example:**
```javascript
// Source: onboarding/backend/brand-governance/closure-gates.cjs
const gateResults = runClosureGates(tenantId, bundle, {});
// passed = determinism && tenant_isolation && contract_integrity
```

### Anti-Patterns to Avoid
- **Handler-side fingerprint recomputation:** Causes drift from canonical artifact writers and violates D-02.
- **Lane aliasing or renamed keys:** Any deviation from `strategy|identity|design_system|starter` breaks contract integrity.
- **Fail-open governance fallback:** Converting lane errors to generic success or empty diagnostics violates D-05/D-06.
- **Phase-mixing diagnostics in this phase:** Publish-readiness boundary isolation is Phase 80, not Phase 79.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Bundle validation and denial taxonomy | New ad-hoc deny code scheme | `DENY_CODES` + `normalizeDiagnostic()` in `governance-diagnostics.cjs` | Keeps machine-readable denial provenance stable across tests and runtime |
| Gate orchestration logic | New custom gate executor | Existing `runClosureGates()` | Already encodes deterministic triplet and no-short-circuit semantics |
| Evidence hash envelopes | New serializer/hash shape | `writeGovernanceEvidence()` | Existing deterministic envelope contract already used by verification evidence hash |
| Tenant pointer semantics | New active-pointer state machine | `active-pointer.cjs` | Existing implementation enforces tenant scoping and append-only traceability |
| Test harness/mocking framework | New external testing stack | `node:test` + existing `test/setup.js` helper patterns | Repo convention is established; adding framework risk is unjustified |

**Key insight:** Phase 79 is a data contract handoff fix; custom replacements of governance primitives increase risk and do not solve the blocker.

## Common Pitfalls

### Pitfall 1: Missing `lineage_fingerprints` in submit handoff
**What goes wrong:** `createBundle()` denies with `BRAND_GOV_MISSING_LANE`; governance evidence never reaches gate execution path.
**Why it happens:** Handler builds `canonicalArtifacts` with IDs only.
**How to avoid:** Add explicit fingerprint extraction + lane map helper before `createBundle()`.
**Warning signs:** Runtime response includes `branding_governance.error = bundle_creation_denied` with missing-lane reason code.

### Pitfall 2: Lane-key mismatch (`designSystem` vs `design_system`)
**What goes wrong:** Contract-integrity gate fails even with valid fingerprint values.
**Why it happens:** Inconsistent naming between metadata source and governance contract.
**How to avoid:** Normalize to exact fixed keys in one helper and reuse everywhere.
**Warning signs:** `runClosureGates().gates.contract_integrity.reason_code = BRAND_GOV_MISSING_LANE` despite non-empty metadata.

### Pitfall 3: Cross-phase diagnostic bleed into publish readiness
**What goes wrong:** Phase 75 publish-blocking assertions pick up Phase 76/77 reason codes (e.g., `TOKEN_INPUT_INVALID`, `LINEAGE_POINTER_MISSING`).
**Why it happens:** `mergeReadinessDiagnostics()` appends all blocking diagnostics into one readiness envelope.
**How to avoid:** In Phase 79 keep behavior unchanged except governance handoff; isolate readiness boundaries in Phase 80.
**Warning signs:** `test/phase-75/publish-blocking.test.js` fails with unexpected extra reason codes.

### Pitfall 4: Fail-open exception handling in governance integration
**What goes wrong:** Exceptions hide whether governance was denied vs unavailable.
**Why it happens:** Generic catch path returns `governance_unavailable`.
**How to avoid:** Keep explicit deny codes for contract failures and reserve unavailable only for true execution faults.
**Warning signs:** Frequent `governance_unavailable` without corresponding logs for known lane errors.

## Code Examples

Verified patterns from official and in-repo sources:

### Submit Handoff with Canonical Fingerprints (target Phase 79 shape)
```javascript
// Source: onboarding/backend/handlers.cjs (integration join) and bundle-registry contract
function buildLineageFingerprints({ strategyWrite, identityWrite, designWrite, starterWrite }) {
  return {
    strategy: strategyWrite?.artifact_fingerprint || null,
    identity: identityWrite?.artifact_fingerprint || null,
    design_system: designWrite?.token_contract_fingerprint || null,
    starter: starterWrite?.starter_fingerprint || null,
  };
}
```

### Deterministic SHA-256 Contract for Evidence and IDs
```javascript
// Source: onboarding/backend/brand-governance/governance-artifact-writer.cjs
const evidence_hash = crypto
  .createHash('sha256')
  .update(JSON.stringify(stableSortObject(evidencePayload)))
  .digest('hex');
```

### node:test Contract Assertion Style
```javascript
// Source: test/phase-75/publish-blocking.test.js
assert.equal(payload.publish_readiness.status, 'blocked');
assert.deepEqual(payload.publish_readiness.reason_codes, ['ACCESSIBILITY_CONTRAST_BELOW_THRESHOLD']);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Third-party test frameworks as default for JS repos | Built-in `node:test` is stable and feature-rich for this project | Node test runner stabilized and expanded through Node 20-25 docs | Keeps dependencies low and aligns with current repo test architecture |
| Ad-hoc or library hashing wrappers | Built-in `node:crypto` SHA-256 plus stable JSON ordering | Long-standing Node pattern; current docs still canonical | Deterministic IDs/evidence without extra dependency risk |
| Fail-open control-path assumptions | Fail-secure design principle for security controls | OWASP guidance current through 2026 site content | Governance exceptions should align with deny semantics, not accidental allow |

**Deprecated/outdated:**
- Assuming governance can silently bypass lane validation is outdated relative to locked D-06 fail-closed policy.
- Assuming Phase 75 readiness should absorb all downstream diagnostics is outdated; roadmap explicitly splits boundary isolation into Phase 80.

## Open Questions

1. **Which exact metadata fields are canonical for each fingerprint lane in persisted write results?**
   - What we know: strategy/identity/design/starter writer outputs expose artifact metadata used downstream.
   - What's unclear: final field names per lane in each write result object and fallback behavior when one writer is null.
   - Recommendation: lock one extraction helper with explicit field mapping and add unit tests asserting lane-by-lane extraction.

2. **Should governance-denied submit responses include gate-level diagnostics or only top-level reason_code at this phase?**
   - What we know: locked decisions require machine-readable denial reason codes.
   - What's unclear: whether to expose full `gates` details in submit response in Phase 79.
   - Recommendation: keep minimal reason-code envelope now; treat richer diagnostics payload as optional follow-up if tests require it.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| node | Backend runtime + tests | ✓ | v22.13.0 | - |
| npm | Standard test workflow invocation | ✓ | 10.9.2 | Direct `node --test` commands |

**Missing dependencies with no fallback:**
- None.

**Missing dependencies with fallback:**
- None.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | node:test (built-in, repo-standard on Node 22.13.0) |
| Config file | none - CLI-driven `node --test` |
| Quick run command | `node --test test/phase-75/publish-blocking.test.js test/phase-78/*.test.js` |
| Full suite command | `npm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BRAND-GOV-01 | Submit-path governance bundle creation succeeds with full lineage payload | integration | `node --test test/phase-79/submit-lineage-handoff.test.js -x` | ❌ Wave 0 |
| BRAND-GOV-02 | Closure gates execute after successful bundle creation and produce machine-readable evidence | integration | `node --test test/phase-79/runtime-gate-recovery.test.js -x` | ❌ Wave 0 |
| BRAND-GOV-02 | Existing governance gate semantics remain deterministic and tenant-safe | regression | `node --test test/phase-78/*.test.js` | ✅ |

### Sampling Rate
- **Per task commit:** `node --test test/phase-75/publish-blocking.test.js test/phase-78/*.test.js`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green plus submit runtime evidence capture

### Wave 0 Gaps
- [ ] `test/phase-79/submit-lineage-handoff.test.js` - proves canonical fingerprint handoff reaches `createBundle()`
- [ ] `test/phase-79/runtime-gate-recovery.test.js` - proves closure-gate/evidence path runs after bundle creation
- [ ] Runtime evidence artifact/script for submit-path proof required by D-08 and D-09

## Sources

### Primary (HIGH confidence)
- Repository code contracts:
  - `onboarding/backend/handlers.cjs`
  - `onboarding/backend/brand-governance/bundle-registry.cjs`
  - `onboarding/backend/brand-governance/closure-gates.cjs`
  - `onboarding/backend/brand-governance/governance-diagnostics.cjs`
  - `onboarding/backend/brand-governance/governance-artifact-writer.cjs`
  - `onboarding/backend/brand-governance/active-pointer.cjs`
  - `onboarding/backend/brand-governance/drift-auditor.cjs`
- Repository tests:
  - `test/phase-75/publish-blocking.test.js`
  - `test/phase-78/*.test.js`
- Planning artifacts:
  - `.planning/phases/79-governance-lineage-handoff-and-runtime-gate-recovery/79-CONTEXT.md`
  - `.planning/ROADMAP.md`
  - `.planning/REQUIREMENTS.md`
  - `.planning/v3.4.0-MILESTONE-AUDIT.md`

### Secondary (MEDIUM confidence)
- Node.js official docs (`node:test`): https://nodejs.org/api/test.html
- Node.js official docs (`node:crypto`): https://nodejs.org/api/crypto.html

### Tertiary (LOW confidence)
- OWASP fail-secure principle page (used as design principle support, not as implementation API source): https://owasp.org/www-community/Fail_securely

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - directly verified from `package.json`, environment checks, and existing repo usage.
- Architecture: HIGH - derived from concrete module contracts and handler integration points.
- Pitfalls: HIGH - grounded in milestone audit evidence and failing regression signal already documented.

**Research date:** 2026-04-12
**Valid until:** 2026-05-12
