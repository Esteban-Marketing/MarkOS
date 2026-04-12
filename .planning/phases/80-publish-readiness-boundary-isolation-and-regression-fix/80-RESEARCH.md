# Phase 80: Publish Readiness Boundary Isolation and Regression Fix - Research

**Researched:** 2026-04-12
**Domain:** Branding submit-payload boundary isolation, diagnostics ownership, and regression-safe readiness contracts
**Confidence:** HIGH

## Project Constraints (from CLAUDE.md)

- Treat `.planning/STATE.md` as the canonical live state source.
- Keep Phase 80 additive and minimal. Do not pull publish/rollback operational surface work from Phase 81 into this phase.
- Preserve the established split: GSD workflow artifacts under `.planning/`, branding runtime behavior under `onboarding/backend/**`, and client overrides only under `.markos-local/`.
- Use the existing Node/CommonJS backend and `node:test` validation style already used by Phases 75 through 79.
- Prefer targeted regression tests over broad route expansion or contract churn.

## Summary

The correct boundary model in this codebase is narrower than the current `handleSubmit` implementation. `publish_readiness` is the Phase 75 accessibility gate result. It answers one question only: whether the identity artifact is publishable from the accessibility perspective promised by `BRAND-ID-02`. `branding_governance` is the Phase 78 and 79 governance envelope. It owns lineage bundle creation, closure-gate results, evidence hashes, and machine-readable governance denials such as `BRAND_GOV_MISSING_LANE`. Phase 76 and 77 diagnostics belong to their own payload lanes: `design_system_diagnostics` and `nextjs_handoff_diagnostics`.

The current regression is caused by `mergeReadinessDiagnostics` in `onboarding/backend/handlers.cjs`. After `publish_readiness` is correctly derived from `accessibilityGateReport`, the handler mutates it again by merging `designSystemDiagnostics` and `nextjsHandoffDiagnostics`. That is the direct cause of the failing Phase 75 regression: `COMPONENT_INPUT_INVALID`, `LINEAGE_DECISIONS_MISSING`, `LINEAGE_POINTER_MISSING`, and `TOKEN_INPUT_INVALID` are design-system compiler codes, not accessibility readiness codes.

**Primary recommendation:** In Phase 80, stop merging Phase 76 and 77 diagnostics into `publish_readiness`. Keep `publish_readiness` accessibility-only, keep `branding_governance` governance-only, preserve the existing `design_system_diagnostics` and `nextjs_handoff_diagnostics` arrays, and update tests so downstream compiler failures are asserted on their own lanes instead of through `publish_readiness`.

This answers the research questions concretely:

1. The correct boundary model is `publish_readiness` = accessibility-only, `branding_governance` = governance-only, with Phase 76 and 77 diagnostics remaining on their own dedicated payload lanes.
2. `publish_readiness` should only carry `ACCESSIBILITY_*` reason codes plus the existing `IDENTITY_PIPELINE_ERROR` fail-closed fallback for Phase 75 pipeline failure. Design-system, Next.js handoff, role-pack, and governance denials should not appear there.
3. The minimal implementation approach is to narrow the handler boundary, not redesign governance. Remove the two downstream `mergeReadinessDiagnostics(...)` calls, keep all existing diagnostics arrays, and do not alter publish/rollback route or bundle work.
4. Phase 80 should update the Phase 75, 76, and 77 tests to reflect lane-local assertions and add one dedicated boundary regression test that exercises real downstream diagnostics without letting them bleed into `publish_readiness`.
5. The main pitfalls are reintroducing a cross-lane aggregate, widening tests instead of fixing the seam, and accidentally dragging Phase 81 operational work into this boundary-only fix.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js CommonJS runtime | Existing repo runtime | Submit handler and branding pipeline execution | All branding phases 73 through 79 are implemented in this runtime already. |
| `node:test` | Built-in | Focused regression coverage | Existing branding phases use targeted `node --test` suites; no new framework is needed. |
| `onboarding/backend/handlers.cjs` | Existing repo module | Canonical submit payload assembly seam | The regression lives here, so the fix must stay here. |
| `onboarding/backend/brand-identity/accessibility-gates.cjs` | Existing repo module | Accessibility-only publish-readiness source | This is the only module emitting the `ACCESSIBILITY_*` gate result. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `onboarding/backend/brand-design-system/token-compiler.cjs` | Existing repo module | Phase 76 token diagnostics | Use for lane-local design-system diagnostics and artifact persistence gating. |
| `onboarding/backend/brand-design-system/component-contract-compiler.cjs` | Existing repo module | Phase 76 component diagnostics | Use for lane-local design-system diagnostics and artifact persistence gating. |
| `onboarding/backend/brand-nextjs/starter-descriptor-compiler.cjs` | Existing repo module | Phase 77 starter diagnostics | Use for lane-local Next.js handoff diagnostics. |
| `onboarding/backend/brand-governance/bundle-registry.cjs` | Existing repo module | Phase 78 and 79 lineage bundle ownership | Keep unchanged in Phase 80. |
| `onboarding/backend/brand-governance/closure-gates.cjs` | Existing repo module | Governance gate evaluation | Keep unchanged in Phase 80. |
| `onboarding/backend/brand-governance/governance-artifact-writer.cjs` | Existing repo module | Governance evidence envelope | Keep unchanged in Phase 80. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Narrowing the existing submit seam | Widen Phase 75 test expectations | Hides the bug and permanently breaks the Phase 75 contract. |
| Keeping lane-local diagnostics arrays | Creating one global readiness aggregator | Recreates cross-phase bleed and makes ownership ambiguous again. |
| Leaving governance untouched | Retrofitting publish/rollback bundle schema in Phase 80 | Pulls Phase 81 work into Phase 80 and expands scope unnecessarily. |

**Installation:** No new dependencies. Use the existing runtime and test stack.

## Architecture Patterns

### Recommended Project Structure

The implementation should remain inside the existing submit-path composition structure:

```text
onboarding/backend/
├── handlers.cjs                         # Submit payload assembly and phase boundary seam
├── brand-identity/
│   └── accessibility-gates.cjs          # Source of publish_readiness diagnostics
├── brand-design-system/
│   ├── token-compiler.cjs               # Phase 76 diagnostics only
│   └── component-contract-compiler.cjs  # Phase 76 diagnostics only
├── brand-nextjs/
│   └── starter-descriptor-compiler.cjs  # Phase 77 diagnostics only
└── brand-governance/
    ├── bundle-registry.cjs              # Phase 78 and 79 governance ownership
    ├── closure-gates.cjs                # Governance gates only
    └── governance-artifact-writer.cjs   # Governance evidence only
```

### Pattern 1: Lane-Scoped Diagnostic Ownership

**What:** Each branding phase owns its own diagnostics lane and machine-readable codes.

**When to use:** Always, for any submit payload field that reports readiness or denial state.

**Prescriptive rule:**

- `publish_readiness` owns only accessibility readiness derived from `accessibility_gate_report`.
- `design_system_diagnostics` owns Phase 76 compiler and schema failures.
- `nextjs_handoff_diagnostics` owns Phase 77 starter and role-pack failures.
- `branding_governance` owns Phase 78 and 79 governance denials and closure-gate evidence.

**Example:**

```javascript
const blockedAccessibilityDiagnostics = (accessibilityGateReport.diagnostics || []).filter(
  (entry) => entry && entry.blocking
);

publishReadiness = {
  status: accessibilityGateReport.gate_status === 'blocked' ? 'blocked' : 'ready',
  blocked: accessibilityGateReport.gate_status === 'blocked',
  reason_codes: [...new Set(blockedAccessibilityDiagnostics.map((entry) => entry.reason_code))].sort(),
  diagnostics: blockedAccessibilityDiagnostics,
};

// Phase 80 recommendation: do not merge designSystemDiagnostics or nextjsHandoffDiagnostics here.
```

### Pattern 2: Submit Handler as Fan-Out, Not Global Aggregator

**What:** `handlers.cjs` should assemble lane-local outputs without collapsing them into one cross-phase status object.

**When to use:** In the Phase 80 boundary fix.

**Prescriptive rule:** Build lane outputs independently, then return them independently. Do not infer ownership from the fact that all of them are emitted by the same route.

**Example:**

```javascript
const publishReadiness = buildAccessibilityPublishReadiness(accessibilityGateReport);
const designSystemDiagnostics = collectDesignSystemDiagnostics(...);
const nextjsHandoffDiagnostics = collectNextjsHandoffDiagnostics(...);
const brandingGovernance = buildBrandingGovernanceEnvelope(...);

json(res, 200, {
  ...payload,
  accessibility_gate_report: accessibilityGateReport,
  publish_readiness: publishReadiness,
  design_system_diagnostics: designSystemDiagnostics,
  nextjs_handoff_diagnostics: nextjsHandoffDiagnostics,
  branding_governance: brandingGovernance,
});
```

### Pattern 3: Minimal-Scope Boundary Fix

**What:** Phase 80 should change the boundary seam only, not the downstream compiler modules or governance modules.

**When to use:** During planning and task slicing.

**Prescriptive rule:**

- Remove or bypass the two downstream `mergeReadinessDiagnostics(...)` calls in `handlers.cjs`.
- Keep the downstream arrays and null-write behavior exactly as they already work.
- Do not change `createBundle`, `runClosureGates`, `writeGovernanceEvidence`, publish routes, rollback routes, or active-pointer behavior.

### Anti-Patterns to Avoid

- **Global readiness blob:** One object containing accessibility, design-system, handoff, and governance reasons together.
- **Test-only fix:** Updating the Phase 75 expectation to accept extra codes without changing handler behavior.
- **Governance takeover:** Moving Phase 76 and 77 compiler diagnostics into `branding_governance` just because they are blocking elsewhere.
- **Phase 81 leakage:** Adding publish or rollback route work, governance route exposure, or bundle-schema redesign in Phase 80.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Boundary isolation | A new cross-phase readiness framework | The existing payload lanes with corrected ownership | The lanes already exist; only the merge is wrong. |
| Phase 76 and 77 summaries | A second merged publish gate | Existing `design_system_diagnostics` and `nextjs_handoff_diagnostics` arrays | These are already machine-readable and deterministic. |
| Governance remediation | New bundle or closure-gate semantics | Existing Phase 78 and 79 governance helpers unchanged | Phase 80 is not the governance feature phase. |
| Regression proof | Large end-to-end harness rewrite | Targeted `node:test` regression files around the submit seam | The failure is localized and already reproducible. |

**Key insight:** The root cause is not missing validation. The root cause is incorrect ownership of already-emitted diagnostics. Fix the ownership seam, not the compiler logic.

## Common Pitfalls

### Pitfall 1: Treating `publish_readiness` as the final truth for every later branding phase

**What goes wrong:** Phase 76 and 77 failures are pushed back into `publish_readiness`, reintroducing the same bleed.

**Why it happens:** The submit route emits all branding outputs, so it is easy to mistake route co-location for contract ownership.

**How to avoid:** Keep `publish_readiness` bound to `accessibility_gate_report` only. Assert Phase 76 and 77 behavior directly on their own arrays and write-null semantics.

**Warning signs:** `publish_readiness.reason_codes` includes `TOKEN_*`, `COMPONENT_*`, `STARTER_*`, `ROLE_*`, or `BRAND_GOV_*` codes.

### Pitfall 2: Misreading the governance schema requirement for `publish_readiness`

**What goes wrong:** Engineers conclude that because the governance schema requires a `publish_readiness` field, governance owns all readiness semantics.

**Why it happens:** `test/phase-78/governance-schema.test.js` requires the field to exist, and the fixture uses a simple boolean.

**How to avoid:** Preserve the field conceptually as a prerequisite signal, but do not widen its diagnostic contents in Phase 80. Narrow payload, same field.

**Warning signs:** Phase 80 plan starts touching `governance-diagnostics.cjs`, bundle fixtures, publish routes, or rollback handlers.

### Pitfall 3: Preserving old Phase 76 and 77 test intent instead of the actual boundary contract

**What goes wrong:** Phase 80 keeps the incorrect blocked `publish_readiness` behavior only to keep earlier tests green.

**Why it happens:** Phase 76 and 77 tests currently assert downstream codes inside `publish_readiness`.

**How to avoid:** Update those tests intentionally. Downstream failures should still be deterministic and blocking for artifact emission, but not through the Phase 75 readiness lane.

**Warning signs:** Planner proposes no test changes outside Phase 75.

### Pitfall 4: Fixing only reason codes but not diagnostics arrays

**What goes wrong:** `reason_codes` are filtered, but `publish_readiness.diagnostics` still contains downstream entries.

**Why it happens:** The merge helper mutates both arrays.

**How to avoid:** Phase 80 must isolate both `reason_codes` and `diagnostics`. The full `publish_readiness` object is accessibility-scoped.

**Warning signs:** `publish_readiness.reason_codes` looks clean but `publish_readiness.diagnostics` still includes `TOKEN_INPUT_INVALID` or `STARTER_SECTION_MISSING` entries.

## Code Examples

Verified boundary seams from repository evidence:

### Current Problematic Merge in Submit Assembly

**Source:** `onboarding/backend/handlers.cjs`

```javascript
publishReadiness = {
  status: accessibilityGateReport.gate_status === 'blocked' ? 'blocked' : 'ready',
  blocked: accessibilityGateReport.gate_status === 'blocked',
  reason_codes: reasonCodes,
  diagnostics,
};
publishReadiness = mergeReadinessDiagnostics(publishReadiness, designSystemDiagnostics);
publishReadiness = mergeReadinessDiagnostics(publishReadiness, nextjsHandoffDiagnostics);
```

**Phase 80 directive:** Keep the initial accessibility-derived object. Remove the two merge calls.

### Governance Assembly Already Lives on a Separate Lane

**Source:** `onboarding/backend/handlers.cjs`, `onboarding/backend/brand-governance/bundle-registry.cjs`, `onboarding/backend/brand-governance/closure-gates.cjs`

```javascript
const canonicalArtifacts = buildCanonicalArtifactsFromWrites({
  strategyPersistenceResult,
  identityArtifactWrite,
  designSystemArtifactWrite,
  starterArtifactWrite,
});

const bundleResult = createBundle(tenantId, canonicalArtifacts);
const gateResults = runClosureGates(tenantId, bundle, {});
const evidenceEnvelope = writeGovernanceEvidence(tenantId, bundle.bundle_id, gateResults, driftSummary);
```

**Phase 80 directive:** Leave this flow unchanged. The regression is upstream, in readiness assembly.

### Accessibility Is the Canonical Source of Publish Readiness

**Source:** `onboarding/backend/brand-identity/accessibility-gates.cjs`

```javascript
return {
  gate_status: hasBlockingFailure ? 'blocked' : 'pass',
  checks,
  diagnostics,
};
```

**Phase 80 directive:** Derive `publish_readiness` only from this report and the existing `IDENTITY_PIPELINE_ERROR` fallback path.

### Required Regression Assertion Shape

**Recommended test shape for Phase 80:**

```javascript
assert.deepEqual(payload.publish_readiness.reason_codes, ['ACCESSIBILITY_CONTRAST_BELOW_THRESHOLD']);
assert.equal(payload.publish_readiness.reason_codes.includes('TOKEN_INPUT_INVALID'), false);
assert.equal(payload.publish_readiness.reason_codes.includes('COMPONENT_INPUT_INVALID'), false);
assert.ok(payload.design_system_diagnostics.some((entry) => entry.code === 'TOKEN_INPUT_INVALID'));
assert.ok(payload.design_system_diagnostics.some((entry) => entry.code === 'COMPONENT_INPUT_INVALID'));
```

## Open Questions

1. **Do any non-test consumers currently depend on downstream compiler codes inside `publish_readiness`?**
   - What we know: Repository evidence shows the dependency in Phase 76 and 77 tests, not in separate runtime consumers.
   - What's unclear: Whether a manual review surface reads `publish_readiness` as a global blocker outside tests.
   - Recommendation: Before execution, grep for `publish_readiness.reason_codes` consumers. If no runtime consumer exists beyond tests, narrow confidently.

2. **Should Phase 80 add lane-local readiness summaries for Phase 76 and 77, or keep only diagnostics arrays?**
   - What we know: The arrays already exist, are deterministic, and are sufficient to prove failure ownership.
   - What's unclear: Whether the planner wants an explicit `design_system_readiness` or `nextjs_handoff_readiness` boolean for operator ergonomics.
   - Recommendation: Do not add new summary fields unless a real consumer is found. The minimal implementation is to correct ownership, not extend the contract.

3. **Should the governance bundle schema's `publish_readiness` field be revisited in Phase 80?**
   - What we know: The schema test only proves presence, not diagnostic breadth, and Phase 81 owns operational publish/rollback surfaces.
   - What's unclear: Whether future governance bundle payloads should embed a boolean, status object, or snapshot.
   - Recommendation: Leave the governance schema untouched in Phase 80. Document the narrowed submit-lane boundary and defer any bundle-shape revisit to Phase 81 or later governance work.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | `node:test` (built-in) |
| Config file | none |
| Quick run command | `node --test test/phase-75/publish-blocking.test.js test/phase-79/publish-readiness-boundary.test.js` |
| Full suite command | `node --test test/phase-75/*.test.js test/phase-76/*.test.js test/phase-77/*.test.js test/phase-78/*.test.js test/phase-79/*.test.js` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BRAND-ID-02 | `publish_readiness` remains accessibility-only and blocks on failed required accessibility checks | integration | `node --test test/phase-75/publish-blocking.test.js` | Yes |
| BRAND-ID-02 | Design-system diagnostics remain deterministic but do not bleed into `publish_readiness` | integration | `node --test test/phase-76/contract-diagnostics.test.js` | Yes |
| BRAND-ID-02 | Starter and role-pack diagnostics remain deterministic but do not bleed into `publish_readiness` | integration | `node --test test/phase-77/role-pack-integration.test.js` | Yes |
| BRAND-ID-02 | Governance denials remain in `branding_governance` and do not bleed into `publish_readiness` | integration | `node --test test/phase-79/publish-readiness-boundary.test.js` | Yes |
| BRAND-ID-02 | Full cross-lane regression with real downstream diagnostic codes stays boundary-safe | integration | `node --test test/phase-80/publish-readiness-boundary-regression.test.js` | No - Wave 0 |

### Sampling Rate

- **Per task commit:** `node --test test/phase-75/publish-blocking.test.js test/phase-76/contract-diagnostics.test.js test/phase-77/role-pack-integration.test.js test/phase-79/publish-readiness-boundary.test.js`
- **Per wave merge:** `node --test test/phase-75/*.test.js test/phase-76/*.test.js test/phase-77/*.test.js test/phase-78/*.test.js test/phase-79/*.test.js`
- **Phase gate:** All targeted branding boundary suites green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `test/phase-80/publish-readiness-boundary-regression.test.js` - exercises a real failing Phase 75 accessibility case plus real Phase 76 and 77 diagnostics in one submit payload and proves lane separation.
- [ ] Update `test/phase-76/contract-diagnostics.test.js` - stop asserting `TOKEN_*` and `COMPONENT_*` codes through `publish_readiness`; assert them on `design_system_diagnostics` instead.
- [ ] Update `test/phase-77/role-pack-integration.test.js` - stop asserting `STARTER_*` and `ROLE_*` codes through `publish_readiness`; assert them on `nextjs_handoff_diagnostics` instead.
- [ ] Strengthen `test/phase-75/publish-blocking.test.js` - keep the exact accessibility-only expectation and add negative assertions for design-system and governance codes.

## Sources

### Primary (HIGH confidence)

- Repository evidence from `onboarding/backend/handlers.cjs`
  - `publish_readiness` is initially derived from `accessibility_gate_report`, then widened by `mergeReadinessDiagnostics(...)` with Phase 76 and 77 diagnostics.
  - `branding_governance` is assembled later through `createBundle`, `runClosureGates`, and `writeGovernanceEvidence`.
- Repository evidence from `onboarding/backend/brand-identity/accessibility-gates.cjs`
  - Accessibility gates emit only accessibility threshold diagnostics and determine the canonical gate status.
- Repository evidence from `onboarding/backend/brand-design-system/diagnostics.cjs`
  - `TOKEN_*`, `COMPONENT_*`, and `LINEAGE_*` codes are design-system compiler diagnostics.
- Repository evidence from `onboarding/backend/brand-nextjs/handoff-diagnostics.cjs`
  - `STARTER_*` and `ROLE_*` codes are Next.js handoff diagnostics.
- Repository evidence from `onboarding/backend/brand-governance/governance-diagnostics.cjs`
  - Governance owns `BRAND_GOV_*` denials and only requires the presence of `publish_readiness` in the governance bundle schema.
- Repository evidence from `test/phase-75/publish-blocking.test.js`
  - The locked Phase 75 regression expects only `ACCESSIBILITY_CONTRAST_BELOW_THRESHOLD`.
- Repository evidence from `test/phase-79/publish-readiness-boundary.test.js`
  - Governance denials are already proven to belong in `branding_governance`, not `publish_readiness`.
- Planning evidence from `.planning/ROADMAP.md`
  - Phase 80 is explicitly scoped to boundary isolation and Phase 81 is explicitly scoped to governance publish/rollback operational surface.
- Planning evidence from `.planning/v3.4.0-MILESTONE-AUDIT.md`
  - The blocker is recorded as cross-phase diagnostic bleed into Phase 75 publish readiness.
- Live verification run on 2026-04-12
  - `node --test test/phase-75/publish-blocking.test.js test/phase-79/publish-readiness-boundary.test.js`
  - Result: Phase 75 fails with extra Phase 76 codes in `publish_readiness`; Phase 79 boundary test passes.

### Secondary (MEDIUM confidence)

- `.planning/phases/75-deterministic-identity-system-with-accessibility-gates/75-03-PLAN.md`
  - Confirms the original contract: publish readiness blocks on required accessibility checks.
- `.planning/phases/76-token-compiler-and-shadcn-component-contract/76-03-SUMMARY.md`
  - Confirms Phase 76 intentionally tied diagnostics to publish readiness at execution time, which is the boundary that Phase 80 must now correct.
- `.planning/phases/77-nextjs-starter-outputs-and-role-handoff-packs/77-RESEARCH.md`
  - Documents the earlier merge pattern that now needs isolation.
- `.planning/phases/79-governance-lineage-handoff-and-runtime-gate-recovery/79-VALIDATION.md`
  - Confirms the known carry-forward to Phase 80 and preserves the Phase 81 route boundary.

### Tertiary (LOW confidence)

- None. This research is grounded in direct repository evidence and live local verification rather than external ecosystem claims.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Phase 80 should use only the existing repo runtime and built-in test stack.
- Architecture: HIGH - The root cause and the correct ownership seam are directly visible in `handlers.cjs`, the diagnostics modules, and the tests.
- Pitfalls: HIGH - The main failure modes are already documented in the milestone audit and reproduced by the current failing test.

**Research date:** 2026-04-12
**Valid until:** 2026-05-12
