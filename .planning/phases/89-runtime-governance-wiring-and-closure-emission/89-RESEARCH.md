# Phase 89: Runtime Governance Wiring and Closure Emission - Research

**Researched:** 2026-04-13
**Domain:** Runtime governance integration (telemetry wiring, closure emission, evidence persistence)
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
### Closure Trigger Surface
- **D-01:** Closure bundle emission stays additive to existing governance runtime flow; no new public route is introduced.
- **D-02:** Trigger ownership is system-actor after verification gates pass, not user-triggered by default.
- **D-03:** Manual recovery may exist later, but the baseline path is automated runtime emission after successful verification.

### Persistence and Auditability
- **D-04:** Closure bundle persistence is dual-write: durable disk artifact plus Supabase governance persistence.
- **D-05:** Runtime responses should include deterministic closure bundle references (hash and locator), not only in-memory payloads.
- **D-06:** Closure records must remain queryable for milestone audit traceability and post-closeout forensics.

### Governance Telemetry Wiring
- **D-07:** Governance telemetry must be runtime-invoked from live role-view/retrieval and closure paths, not test-only helper surfaces.
- **D-08:** Telemetry payloads remain schema-normalized through the existing governance normalization contract.
- **D-09:** Missing/invalid telemetry required fields should fail governance wiring checks for closure readiness.

### Carry-Forward Constraints
- **D-10:** Preserve Phase 78 additive-governance integration pattern (no standalone public governance route for closure operations).
- **D-11:** Preserve Phase 88 strict non-regression posture; closure remains blocked when governance verification requirements are not met.

### Claude's Discretion
- Exact module split for runtime wiring (handler boundary vs delegated service modules) as long as D-01 through D-11 are preserved.
- Exact storage schema/table names for Supabase persistence.
- File naming and folder structure for closure bundle disk artifacts.

### Deferred Ideas (OUT OF SCOPE)
None - discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| GOVV-02 | Execution telemetry includes vault artifact ID, retrieval mode, outcome vs. archived evidence, and anomaly flags for agent actions. | Wire `captureGovernanceEvent` into live role-view runtime paths and closure flow using normalized telemetry schema; fail closed on missing required fields. |
| GOVV-03 | v3.4.0 branding determinism, governance publish/rollback, and UAT guarantees remain non-negotiable baselines (vault is retrieval layer, not generative). | Keep additive route pattern, invoke hardened verification in runtime, and gate closure emission on deterministic evidence + non-regression checks. |
| GOVV-05 | Milestone closeout requires proof of: PageIndex SLAs met, Obsidian sync stable, tenant isolation verified, v3.4 non-regression confirmed. | Emit `writeMilestoneClosureBundle` from runtime closeout path and persist deterministic references (hash + locator) in disk and Supabase records for audit retrieval. |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- Boot/read order for mission context is mandatory: `.protocol-lore/QUICKSTART.md`, `.protocol-lore/INDEX.md`, `.planning/STATE.md`, `.agent/markos/MARKOS-INDEX.md`.
- `.planning/STATE.md` is the canonical live mission state.
- Keep GSD and MarkOS boundaries explicit; do not move client overrides outside `.markos-local/`.
- Preferred CLI install/update path is `npx markos`.
- Test commands must remain compatible with `npm test` and `node --test test/**/*.test.js`.
- Local onboarding server command is `node onboarding/backend/server.cjs`.

## Summary

Phase 89 is an integration phase, not a primitives phase. The key governance primitives already exist in code: telemetry normalization and capture (`onboarding/backend/vault/telemetry-schema.cjs`, `onboarding/backend/agents/telemetry.cjs`), hardened high-risk verification (`onboarding/backend/vault/hardened-verification.cjs`), and deterministic closure bundle writing (`onboarding/backend/brand-governance/governance-artifact-writer.cjs`). The missing work is live runtime wiring from existing handler flows.

The highest-risk gap is that current runtime paths do not invoke governance telemetry and hardened verification in the places that drive user-facing role-view operations and milestone closeout. Search confirmed `captureGovernanceEvent` has no live call sites and `verifyHighRiskExecution` is used in tests but not in live handlers. This creates an auditability illusion: tests pass while runtime evidence is not emitted at the required surfaces.

The correct planning direction is additive integration into existing routes and handlers (`onboarding/backend/handlers.cjs`, `onboarding/backend/server.cjs`) with strict fail-closed checks. Closure emission should occur only after gates pass, then persist deterministic closure references via dual-write (disk artifact plus Supabase-backed record path) and return references in runtime responses.

**Primary recommendation:** Wire governance telemetry and closure emission into existing role-view and closeout handlers with mandatory schema validation and deterministic dual-write references, blocking closeout on any missing governance evidence.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js | 22.13.0 (local) | Runtime for backend handlers and file/DB integration | Existing production/runtime baseline for this repo |
| @supabase/supabase-js | 2.103.0 | Durable governance record persistence with query support | Existing audit-store abstraction already supports Supabase-backed append/getAll |
| posthog-node | 5.29.2 | Governance telemetry event capture transport | Existing telemetry entrypoint built around PostHog client semantics |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @supabase/ssr | 0.10.2 | Existing Supabase support package in repo ecosystem | Keep aligned with repo dependency set; not required for core Phase 89 wiring |
| node:fs / node:path | Built-in | Deterministic disk artifact emission | Required for closure bundle writes and durable local evidence artifacts |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Existing additive handler wiring | New dedicated closure API route | Violates D-01/D-10 additive constraint and increases attack surface |
| Existing telemetry normalization contract | Ad-hoc telemetry payloads in handlers | Breaks schema consistency and weakens closure-readiness checks |
| Existing audit store abstraction | New custom persistence layer | Duplicates capability, increases migration and operational risk |

**Installation:**
```bash
npm install @supabase/supabase-js posthog-node
```

**Version verification:**
- `@supabase/supabase-js` `2.103.0` published `2026-04-09`
- `posthog-node` `5.29.2` published `2026-04-09`
- `@supabase/ssr` `0.10.2` published `2026-04-09`

## Architecture Patterns

### Recommended Project Structure
```
onboarding/backend/
├── handlers.cjs                         # Runtime integration entrypoints (role-view, approve/closeout)
├── agents/telemetry.cjs                 # Telemetry transport + governance capture API
├── vault/telemetry-schema.cjs           # Required governance telemetry normalization/validation
├── vault/hardened-verification.cjs      # High-risk verification checks
├── brand-governance/
│   ├── governance-artifact-writer.cjs   # Deterministic closure bundle emission
│   └── closure-gates.cjs                # Non-regression and closure gate evaluation
└── vault/audit-store.cjs                # Queryable append/getAll abstraction (Supabase or in-memory)
```

### Pattern 1: Additive Runtime Wiring (No New Public Route)
**What:** Insert governance capture and closeout emission into existing handler flow.
**When to use:** Any Phase 89 implementation of GOVV-02/03/05.
**Example:**
```javascript
// Source: onboarding/backend/handlers.cjs + onboarding/backend/agents/telemetry.cjs
// After retrieval mode is known in role-view flow:
await captureGovernanceEvent({
  actorId,
  retrieval_mode,
  vault_artifact_id,
  outcome,
  evidence_ref,
  anomaly_flags,
});
```

### Pattern 2: Fail-Closed Governance Readiness
**What:** Treat missing required telemetry/evidence as blocking error before closeout.
**When to use:** Closure readiness and milestone closeout path.
**Example:**
```javascript
// Source: onboarding/backend/vault/telemetry-schema.cjs
const normalized = normalizeGovernanceTelemetryPayload(payload);
if (!normalized.ok) {
  throw new Error('GOVERNANCE_TELEMETRY_INVALID');
}
```

### Pattern 3: Deterministic Dual-Write Closure Evidence
**What:** Emit closure bundle to disk, then persist queryable record in Supabase-backed path.
**When to use:** Post-gate successful closeout.
**Example:**
```javascript
// Source: onboarding/backend/brand-governance/governance-artifact-writer.cjs
const bundle = writeMilestoneClosureBundle(input);
await auditStore.append({
  type: 'milestone_closure_bundle',
  bundle_hash: bundle.bundle_hash,
  bundle_path: bundle.relative_bundle_path,
  milestone: bundle.milestone,
});
```

### Anti-Patterns to Avoid
- **Test-only verification path:** Having `verifyHighRiskExecution` used only in tests and never in live handlers.
- **In-memory-only closure references:** Returning response data without durable locator/hash persistence.
- **Late schema checks:** Validating telemetry after closure emission instead of before readiness decision.
- **Route sprawl:** Adding a public closure route for convenience and bypassing additive governance boundaries.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Telemetry schema enforcement | Custom per-handler validators | `normalizeGovernanceTelemetryPayload` in existing schema contract | Prevents drift and ensures required GOVV fields are consistently enforced |
| Closure artifact hashing/layout | New ad-hoc bundle format | `writeMilestoneClosureBundle` | Existing deterministic format already enforces mandatory sections and hash |
| Governance evidence query layer | New bespoke DB adapter | `audit-store.cjs` abstraction with Supabase backend | Existing append/getAll surface supports queryability and fallback behavior |

**Key insight:** Phase 89 should compose existing governance primitives into live runtime paths, not introduce parallel frameworks.

## Common Pitfalls

### Pitfall 1: Wiring To Helper Surfaces Instead of Runtime Surfaces
**What goes wrong:** Governance calls are added to utilities or tests, but not to user-executed handlers.
**Why it happens:** Easier local testing and lower immediate coupling pressure.
**How to avoid:** Only count integration complete when calls appear in live role-view and closeout handlers.
**Warning signs:** `rg` shows function definitions/tests only, no handler call sites.

### Pitfall 2: Closure Succeeds Without Deterministic References
**What goes wrong:** Closeout returns success but lacks stable `bundle_hash` + locator references.
**Why it happens:** Treating closure as an in-memory response event, not an auditable artifact.
**How to avoid:** Make deterministic reference fields mandatory in successful closeout responses.
**Warning signs:** Audit review cannot resolve a closure response to disk and Supabase records.

### Pitfall 3: Silent Supabase Fallback to In-Memory Store
**What goes wrong:** Missing Supabase credentials cause runtime to fall back to in-memory persistence.
**Why it happens:** `createAuditStore` intentionally degrades gracefully when env/config are absent.
**How to avoid:** Add explicit runtime checks for Phase 89 closeout path when durable persistence is required.
**Warning signs:** No Supabase rows for emitted closure despite successful response.

## Code Examples

Verified patterns from code and official docs:

### Governance Telemetry Capture with Schema Normalization
```javascript
// Source: onboarding/backend/agents/telemetry.cjs + onboarding/backend/vault/telemetry-schema.cjs
async function emitGovernanceTelemetry(payload) {
  const normalized = normalizeGovernanceTelemetryPayload(payload);
  if (!normalized.ok) throw new Error('GOVERNANCE_TELEMETRY_INVALID');
  await captureGovernanceEvent(normalized.value);
}
```

### Supabase Insert/Upsert for Queryable Evidence
```javascript
// Source: https://supabase.com/docs/reference/javascript/insert
const { error } = await supabase
  .from('governance_evidence')
  .insert({ bundle_hash, bundle_path, milestone, actor_id });
if (error) throw error;
```

### PostHog Node Capture and Flush Discipline
```javascript
// Source: https://posthog.com/docs/libraries/node
client.capture({
  distinctId: actorId,
  event: 'governance closure emitted',
  properties: { bundle_hash, retrieval_mode, outcome },
});
await client.shutdown();
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Unit-test-only governance verification | Runtime-invoked verification + telemetry at live handler surfaces | Required by Phase 89 | Eliminates audit gap between test claims and runtime evidence |
| Closure success without durable references | Deterministic hash + locator returned and persisted | Required by D-04/D-05 | Enables reliable milestone forensic lookup |
| Optional closure telemetry | Mandatory schema-validated telemetry for readiness | Required by D-09 | Enforces fail-closed posture and non-regression governance |

**Deprecated/outdated:**
- Treating governance closeout as a report-only test artifact path is outdated for GOVV-05 completion.

## Open Questions

1. **What exact Supabase table/schema should hold closure records?**
   - What we know: `audit-store` supports custom table names and Supabase append/getAll pattern.
   - What's unclear: Canonical table name and index strategy for closure-bundle lookups.
   - Recommendation: Lock a single table in planning and add migration/index task in Wave 0.

2. **Should closeout hard-fail when Supabase credentials are absent?**
   - What we know: Current store can fallback to in-memory when env vars are missing.
   - What's unclear: Whether Phase 89 policy allows temporary in-memory in non-prod.
   - Recommendation: Define environment policy per stage; production closeout should fail closed.

3. **Where should hardened verification be invoked in closeout flow?**
   - What we know: `verifyHighRiskExecution` exists but is not currently called in live handlers.
   - What's unclear: Exact pre- or post-gate ordering relative to `runClosureGates`.
   - Recommendation: Invoke before final closure bundle emission, include anomaly flags in telemetry.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Backend handlers/tests | Yes | 22.13.0 | None needed |
| npm | Dependency and script execution | Yes | 10.9.2 | None needed |
| Python | Ancillary scripts only | Yes | 3.14.1 | Not required for Phase 89 |
| Supabase service config (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) | Durable queryable closure persistence | Unknown at research time | - | In-memory audit store exists but should not satisfy production GOVV-05 |
| PostHog token/host config | Governance telemetry transport | Unknown at research time | - | Telemetry can no-op/fail depending runtime config; must be policy-defined in plan |

**Missing dependencies with no fallback:**
- None at tool/runtime level.

**Missing dependencies with fallback:**
- Supabase/PostHog runtime credentials may be absent; code has technical fallback but governance policy may require fail-closed in production.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node test runner (`node:test`) |
| Config file | none - CLI pattern in package scripts |
| Quick run command | `node --test test/phase-88/governance-telemetry-schema.test.js` |
| Full suite command | `node --test test/**/*.test.js` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| GOVV-02 | Runtime role-view paths emit normalized governance telemetry | integration | `node --test test/phase-89/runtime-governance-telemetry-wiring.test.js` | No - Wave 0 |
| GOVV-03 | Runtime closeout preserves non-regression and hardened verification guarantees | integration | `node --test test/phase-89/runtime-governance-closeout-verification.test.js` | No - Wave 0 |
| GOVV-05 | Closeout emits deterministic bundle refs and queryable persistence records | integration | `node --test test/phase-89/runtime-closure-emission-persistence.test.js` | No - Wave 0 |

### Sampling Rate
- **Per task commit:** `node --test test/phase-89/*.test.js`
- **Per wave merge:** `node --test test/phase-88/*.test.js; node --test test/phase-89/*.test.js`
- **Phase gate:** `node --test test/**/*.test.js`

### Wave 0 Gaps
- [ ] `test/phase-89/runtime-governance-telemetry-wiring.test.js` - covers GOVV-02 handler-level call-site behavior
- [ ] `test/phase-89/runtime-governance-closeout-verification.test.js` - covers GOVV-03 fail-closed verification integration
- [ ] `test/phase-89/runtime-closure-emission-persistence.test.js` - covers GOVV-05 deterministic refs + dual-write behavior
- [ ] Fixture/util for Supabase audit-store mock with deterministic append/getAll assertions

## Sources

### Primary (HIGH confidence)
- Repository runtime code:
  - `onboarding/backend/handlers.cjs`
  - `onboarding/backend/server.cjs`
  - `onboarding/backend/agents/telemetry.cjs`
  - `onboarding/backend/vault/telemetry-schema.cjs`
  - `onboarding/backend/vault/hardened-verification.cjs`
  - `onboarding/backend/vault/audit-store.cjs`
  - `onboarding/backend/brand-governance/governance-artifact-writer.cjs`
  - `onboarding/backend/brand-governance/closure-gates.cjs`
- Official docs:
  - https://supabase.com/docs/reference/javascript/insert
  - https://supabase.com/docs/reference/javascript/upsert
  - https://posthog.com/docs/libraries/node
  - https://nodejs.org/api/fs.html#fswritefilesyncfile-data-options
- npm registry metadata (`npm view`) for current package versions and publish dates.

### Secondary (MEDIUM confidence)
- Existing phase test suites used as architecture baseline:
  - `test/phase-87/role-views-e2e.test.js`
  - `test/phase-88/governance-telemetry-schema.test.js`
  - `test/phase-88/milestone-closure-bundle.test.js`

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - verified against repo dependencies, runtime availability, and npm registry.
- Architecture: HIGH - based on direct runtime handler and module call-site inspection.
- Pitfalls: HIGH - derived from observed integration gaps and existing fallback behavior in live code.

**Research date:** 2026-04-13
**Valid until:** 2026-05-13

## RESEARCH COMPLETE

**Phase:** 89 - Runtime Governance Wiring and Closure Emission
**Confidence:** HIGH

### Key Findings
- Governance telemetry and hardened verification primitives exist but are not invoked from live handler paths.
- Closure bundle emission capability exists and is deterministic, but currently behaves as a test/proof primitive rather than a runtime-integrated closeout step.
- Additive integration into existing routes/handlers is mandatory; introducing a new public closure route conflicts with locked decisions.
- Dual-write persistence and deterministic references are the central implementation contract for GOVV-05 auditability.
- Supabase fallback behavior is operationally convenient but can violate strict governance intent unless explicitly policy-gated.

### File Created
`.planning/phases/89-runtime-governance-wiring-and-closure-emission/89-RESEARCH.md`

### Confidence Assessment
| Area | Level | Reason |
|------|-------|--------|
| Standard Stack | HIGH | Verified package versions/dates and local runtime toolchain |
| Architecture | HIGH | Derived from direct handler/module flow and call-site evidence |
| Pitfalls | HIGH | Observed concrete runtime gaps and fallback behavior |

### Open Questions
- Canonical Supabase closure table/index choice.
- Production policy for absent Supabase/PostHog credentials.
- Exact ordering between hardened verification and closure gate evaluation.

### Ready for Planning
Research complete. Planner can now create PLAN.md files.
