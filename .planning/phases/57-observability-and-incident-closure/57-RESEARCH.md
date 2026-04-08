# Phase 57: Observability and Incident Closure - Research

**Researched:** 2026-04-04  
**Domain:** Unified subsystem observability, tenant-aware incident workflow, and operational evidence closure  
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

### 1. OPS-01 must close through one unified subsystem observability inventory

Phase 57 should package the existing telemetry seams into one requirement-facing inventory rather than inventing a new observability platform.

Implementation guidance for research and planning:
- Keep `onboarding/backend/agents/telemetry.cjs` and `lib/markos/telemetry/events.ts` as the canonical telemetry vocabulary seams.
- Treat API, queue-adjacent execution, agent runtime, and billing recovery as the four required subsystem families.
- Use one named artifact to explain how those families fit together so OPS-01 can cite a direct evidence chain.

### 2. Queue proof must remain honest about the current repo surface

The repo does not currently expose a standalone durable queue subsystem with backlog dashboards or worker fleet metrics.

Planning guidance:
- Treat queue evidence as the current background and queued execution paths already present in MarkOS.
- Use tenant-bound migration execution, orchestrator idempotent redelivery, and execution checkpoint telemetry as the queue-adjacent proof seam.
- If Phase 57 adds telemetry, it should extend the existing contract instead of introducing a parallel queue abstraction.

### 3. OPS-02 must be anchored to a tenant-aware incident that already exists in MarkOS

The strongest current incident path is billing degradation and recovery.

Planning guidance:
- Use billing reconciliation or provider-sync failure as the primary representative incident.
- The incident workflow must include impacted tenant identification, workflow impact, mitigation or rollback, communication, and recovery verification.
- Agent and API telemetry should support classification, but the incident narrative should stay grounded in current billing and execution architecture.

### 4. Simulation evidence may be documented and deterministic

Phase 57 does not require a live pager, real outage, or hosted status-page integration.

Planning guidance:
- A tabletop or deterministic simulation is sufficient if it uses named repo evidence.
- The simulation must prove operators can identify tenant impact, preserve evidence access, communicate status, and confirm restoration.

### 5. Scope guardrails

This phase must not expand into:
- a new observability platform
- external paging or status-page integrations
- new queue infrastructure
- distributed tracing rollout across every subsystem
- generic operations documentation unrelated to OPS-01 and OPS-02
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| OPS-01 | Platform exposes SLO-backed monitoring for API, queue, agent, and billing subsystems. | Recommends one direct observability artifact that unifies Phase 31 rollout SLO telemetry, Phase 51 queue-adjacent execution proof, Phase 53 agent runtime telemetry, and Phase 54/55 billing lifecycle evidence. |
| OPS-02 | Incident response runbooks include tenant-aware triage and communication workflows. | Recommends a billing-degradation tabletop incident that explicitly records tenant impact, mitigation or rollback, communications ownership, and recovery verification. |

</phase_requirements>

## Project Constraints (from CLAUDE.md)

- Treat `.planning/STATE.md` as the canonical live planning state.
- Keep planning concerns under `.planning/` and avoid mixing protocol artifacts into execution files.
- Use the existing Node test runner entrypoints for validation.
- Prefer extending existing telemetry, runtime-context, billing, and test seams instead of creating parallel systems.

## Summary

Phase 57 is an evidence-closure phase, not an infrastructure phase. The repo already contains the raw ingredients for OPS-01 and OPS-02: Phase 31 exported API SLO telemetry, Phase 51 tenant-safe background execution and queued-delivery proof, Phase 53 provider-attempt and run-close telemetry, Phase 54 governance and billing surfaces, and Phase 55 append-only billing hold and release lifecycle evidence. The current gap is that those signals are scattered across prior phases and are not yet packaged into a single operations control family.

The strongest OPS-01 closure move is to build one subsystem observability inventory that names the exact telemetry or evidence seam for each subsystem family. API monitoring is already explicit through `ROLLOUT_ENDPOINT_SLOS` and `captureRolloutEndpointEvent()`. Agent monitoring is already explicit through `captureProviderAttempt()` and `captureRunClose()`. Queue coverage should be stated honestly as the current background and queued execution paths: tenant-safe migration execution, orchestrator duplicate-delivery idempotency, and execution checkpoint telemetry. Billing monitoring is already available through the operator and tenant billing evidence APIs, which expose failed sync attempts, hold history, release events, and restored snapshots.

The strongest OPS-02 closure move is to anchor the incident workflow on billing degradation and recovery. That path already contains tenant scope, severity context, mitigation and rollback choices, and communication-relevant state transitions. It can be simulated deterministically from MarkOS-owned evidence without inventing live paging or external incident tooling. The runbook should therefore become specific: detection source, impacted tenants, impacted workflows, mitigation owner, communication cadence, recovery criteria, and corrective-action follow-up.

**Primary recommendation:** close OPS-01 with a single evidence artifact that inventories API, queue-adjacent, agent, and billing monitoring seams, and close OPS-02 with a tenant-aware billing degradation tabletop that cites those seams plus the existing hold and release evidence chain.

## What Is Already Implemented vs. What Is Missing

| Area | Already implemented | Missing for Phase 57 closure |
|------|---------------------|------------------------------|
| API observability | `onboarding/backend/agents/telemetry.cjs` exports `ROLLOUT_ENDPOINT_SLOS` and `captureRolloutEndpointEvent()` for the four rollout endpoints; handler wiring and tests exist. | No direct artifact ties the API SLO registry to the broader OPS-01 subsystem story. |
| Queue-adjacent execution proof | `migration-runner.cjs` enforces tenant principal requirements; `test/tenant-auth/tenant-background-job-propagation.test.js` proves background execution and queued delivery safeguards; orchestrator idempotency tests prove duplicate-delivery protection. | No requirement-facing document names these as the queue subsystem proof, and no single artifact explains the monitoring or alert story for them. |
| Agent runtime observability | `captureExecutionCheckpoint()`, `captureProviderAttempt()`, and `captureRunClose()` are implemented; orchestrator and tests preserve provider attempts, run close requirements, and execution checkpoints. | Agent telemetry is still cited through Phase 53 verification rather than a direct Phase 57 ops artifact. |
| Billing operational evidence | `deriveProviderSyncOutcome()` and `buildBillingLifecycleEvidence()` power `api/billing/holds.js`, `api/billing/tenant-summary.js`, and `api/billing/operator-reconciliation.js`; Phase 55 tests prove hold-open and hold-release behavior. | Billing evidence is not yet framed as an operational monitoring family with incident response implications. |
| Incident runbook | `OBSERVABILITY-RUNBOOK.md` already states severity, impacted tenants, mitigation, communication, and evidence expectations. | The runbook is generic; it does not yet name the concrete detection sources, tenant-facing workflow, or tabletop evidence needed to close OPS-02. |
| Incident simulation | Deterministic failed-sync -> hold -> release evidence exists in billing tests and APIs. | No dedicated simulation artifact or tabletop record exists for planners and closure ledgers to cite. |

## Standard Stack

### Core

| Library / Module | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `onboarding/backend/agents/telemetry.cjs` | in-repo | Canonical operational telemetry registry and emitters | This is the live runtime seam for API, agent, and execution checkpoint telemetry. |
| `lib/markos/telemetry/events.ts` | in-repo | Canonical event vocabulary and payload sanitization | This file is the telemetry contract source of truth for names and redaction expectations. |
| `onboarding/backend/runtime-context.cjs` | in-repo | Tenant-aware runtime policy, deny telemetry, and redaction helpers | This is the bridge from request or execution context into observable tenant-safe operations. |
| `onboarding/backend/agents/orchestrator.cjs` | in-repo | Agent runtime orchestration and telemetry finalization | This is the clearest OPS-01 agent subsystem seam and a secondary incident-classification seam. |
| `lib/markos/billing/provider-sync.cjs` + `reconciliation.cjs` | in-repo | Billing degradation and recovery derivation plus evidence stitching | These files power the strongest tenant-aware incident scenario for OPS-02. |
| `api/billing/holds.js`, `api/billing/tenant-summary.js`, `api/billing/operator-reconciliation.js` | in-repo | Tenant and operator recovery evidence surfaces | These are the operator-visible incident and recovery evidence seams. |

### Supporting

| Module | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `onboarding/backend/provisioning/migration-runner.cjs` | in-repo | Background execution with tenant principal enforcement | Use as the queue-adjacent subsystem proof seam. |
| `test/tenant-auth/tenant-background-job-propagation.test.js` | in-repo | Contract coverage for tenant-safe background execution | Use to support queue-adjacent observability and incident reasoning. |
| `test/agents/run-idempotency.test.js` | in-repo | Duplicate queue redelivery and idempotency proof | Use to demonstrate safe queued execution behavior. |
| `test/agents/provider-policy-runtime.test.js` | in-repo | Agent provider-attempt telemetry contract evidence | Use as the primary targeted OPS-01 runtime proof slice. |
| `test/billing/provider-sync-failure.test.js` | in-repo | Billing hold and release lifecycle proof | Use as the primary targeted OPS-02 simulation input. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| One unified observability artifact | Keep citing prior phase docs separately | Faster, but reviewers still have to reconstruct OPS-01 by hand and the requirement stays partial. |
| Honest queue-adjacent proof | Invent a new queue or backlog subsystem for closure | More infrastructure, but it would misrepresent the current repo state and over-expand Phase 57. |
| Billing degradation tabletop as primary incident | Generic outage prose without a concrete system path | Easier to write, but it would not be anchored in live MarkOS-owned evidence. |

**Installation:** no new external dependencies are recommended for this phase.

## Architecture Patterns

### Recommended Project Structure for This Phase

```text
.planning/phases/57-observability-and-incident-closure/
  57-RESEARCH.md                 # planning-grade evidence map and recommendations
  57-01-PLAN.md                  # unified observability inventory implementation
  57-02-PLAN.md                  # tenant-aware incident workflow implementation
  57-03-PLAN.md                  # simulation evidence and closure promotion
  57-VALIDATION.md               # targeted OPS-01 and OPS-02 proof commands
.planning/projects/markos-v3/technical-specs/
  OBSERVABILITY-RUNBOOK.md       # tenant-aware runbook and subsystem inventory or links to them
onboarding/backend/agents/
  telemetry.cjs                  # operational telemetry registry and emitters
  orchestrator.cjs               # provider-attempt/run-close telemetry + execution checkpoints
onboarding/backend/provisioning/
  migration-runner.cjs           # background execution proof seam
api/billing/
  holds.js                       # hold/release lifecycle surface
  tenant-summary.js              # tenant-facing degraded/restored evidence
  operator-reconciliation.js     # operator-facing incident and recovery evidence
test/
  agents/provider-policy-runtime.test.js
  billing/provider-sync-failure.test.js
  tenant-auth/tenant-background-job-propagation.test.js
```

### Pattern 1: Subsystem inventory instead of subsystem rewrite
**What:** one evidence artifact inventories which live seam proves each subsystem family.
**When to use:** OPS-01 closure, validation mapping, closure-matrix promotion.
**Example:**

```md
API -> ROLLOUT_ENDPOINT_SLOS + captureRolloutEndpointEvent
Queue-adjacent -> migration-runner tenant guard + duplicate-delivery idempotency + execution checkpoints
Agent -> captureProviderAttempt + captureRunClose
Billing -> deriveProviderSyncOutcome + buildBillingLifecycleEvidence + operator reconciliation surfaces
```

### Pattern 2: Incident workflow tied to tenant-visible state transitions
**What:** the runbook starts from a concrete detection signal and follows the tenant-facing impact through mitigation and recovery.
**When to use:** OPS-02 workflow definition and tabletop evidence.
**Example:**

```md
failed sync detected -> tenant enters hold/degraded state -> impacted workflows identified -> mitigation owner assigned -> tenant/operator status updates -> successful sync -> hold released -> restored snapshot verified
```

### Pattern 3: Deterministic simulation over live-ops theater
**What:** simulate an incident using repo-owned evidence and contract tests instead of waiting for a production outage.
**When to use:** closure evidence for OPS-02.
**Example:**

```js
const failedOutcome = deriveProviderSyncOutcome({ sync_status: 'failed', ... });
const restoredOutcome = deriveProviderSyncOutcome({ sync_status: 'succeeded', active_hold: failedOutcome.hold_interval, ... });
const evidence = buildBillingLifecycleEvidence({ sync_outcome: restoredOutcome });
```

### Anti-Patterns to Avoid
- **Dashboard theater:** adding abstract monitoring prose without naming the exact runtime or API seams that emit evidence.
- **Fake queue claims:** describing worker backlog metrics or queue services that do not exist in the repo.
- **Generic outage runbooks:** incident documentation that never names tenant scope, billing hold state, or actual recovery evidence.
- **Phase expansion:** turning Phase 57 into a new monitoring product, tracing overhaul, or external incident tooling rollout.

## Codebase Seam Map

### Wave 1: OPS-01 unified observability inventory

| File | Change | Why this file |
|------|--------|---------------|
| `onboarding/backend/agents/telemetry.cjs` | Extend or document the operational telemetry registry so subsystem coverage is explicit. | This is the canonical telemetry emitter layer for rollout, execution checkpoints, provider attempts, and run close evidence. |
| `lib/markos/telemetry/events.ts` | Align event vocabulary with any new requirement-facing observability labels or events. | This file should remain the stable event contract and sanitization source. |
| `.planning/projects/markos-v3/technical-specs/OBSERVABILITY-RUNBOOK.md` | Add or link one subsystem observability inventory that names API, queue-adjacent, agent, and billing seams. | OPS-01 needs one direct evidence story instead of scattered references. |
| `test/agents/provider-policy-runtime.test.js` | Preserve runtime proof that agent telemetry captures provider-policy execution details. | Primary agent subsystem proof slice. |
| `test/tenant-auth/tenant-background-job-propagation.test.js` | Preserve queue-adjacent proof around tenant-safe background execution. | Primary queue-adjacent subsystem proof slice. |
| `test/onboarding-server.test.js` or equivalent existing coverage | Preserve rollout endpoint telemetry and execution checkpoint emission. | API and execution checkpoint wiring already live here. |

### Wave 2: OPS-02 tenant-aware incident workflow

| File | Change | Why this file |
|------|--------|---------------|
| `.planning/projects/markos-v3/technical-specs/OBSERVABILITY-RUNBOOK.md` | Replace generic incident steps with a tenant-aware workflow anchored to named signals and surfaces. | OPS-02 must cite a concrete runbook, not generic ops prose. |
| `api/billing/holds.js` | Use as the canonical hold and release lifecycle evidence seam in the incident workflow. | It directly exposes failure, release, and snapshot transitions. |
| `api/billing/tenant-summary.js` | Use as the tenant-facing degraded and restored evidence seam. | The incident path must show what tenants can see during recovery. |
| `api/billing/operator-reconciliation.js` | Use as the operator-facing incident and recovery evidence seam. | The incident path must show what operators can inspect and communicate from. |
| `test/billing/provider-sync-failure.test.js` | Preserve failure-to-release lifecycle proof as the simulation backbone. | Primary deterministic OPS-02 proof slice. |

### Wave 3: Simulation evidence and closure artifacts

| File | Change | Why this file |
|------|--------|---------------|
| `.planning/phases/57-observability-and-incident-closure/57-VALIDATION.md` | Replace the stub with targeted OPS-01 and OPS-02 commands plus documentation checks. | Phase-specific proof should live in the phase ledger. |
| `.planning/phases/57-observability-and-incident-closure/57-SUMMARY.md` | Replace the stub with actual observability and incident closure outcomes. | Direct closure summary for planning ledgers. |
| `.planning/phases/57-observability-and-incident-closure/57-03-SIMULATION.md` or equivalent named artifact | Record the tabletop or deterministic simulation with timestamps, tenant impact, mitigation, communications, and recovery verification. | OPS-02 needs a direct evidence artifact, not just a revised runbook. |
| `.planning/projects/markos-v3/CLOSURE-MATRIX.md` | Promote OPS-01 and OPS-02 to direct evidence references. | Closure ledger parity. |
| `.planning/projects/markos-v3/REQUIREMENTS.md` | Refresh traceability notes from partial to satisfied or name any exact remaining blocker. | Requirement ledger parity. |
| `.planning/phases/54-billing-metering-and-enterprise-governance/54-VERIFICATION.md` | Add cross-reference only if needed; keep Phase 54 historically accurate. | Phase 57 should own ops closure without rewriting older verification history. |

## OPS-01 Recommendation

### Recommended first explicit contract

Use a **subsystem family inventory**, not a raw event list.

1. **API subsystem**
   - Source of truth: `ROLLOUT_ENDPOINT_SLOS` and `captureRolloutEndpointEvent()`.
   - This closes the SLO-backed monitoring claim for `/submit`, `/approve`, `/linear/sync`, and `/campaign/result`.

2. **Queue-adjacent execution subsystem**
   - Source of truth: `migration-runner.cjs`, tenant background job propagation tests, orchestrator duplicate-delivery idempotency, and execution checkpoint telemetry.
   - This closes the queue requirement honestly using the current execution model.

3. **Agent subsystem**
   - Source of truth: `captureProviderAttempt()`, `captureRunClose()`, and provider-policy runtime coverage.
   - This closes runtime success and provider fallback evidence.

4. **Billing subsystem**
   - Source of truth: `deriveProviderSyncOutcome()`, `buildBillingLifecycleEvidence()`, `holds.js`, `tenant-summary.js`, and `operator-reconciliation.js`.
   - This closes billing reconciliation, degradation, and restoration monitoring.

### Recommendation on event vocabulary

Do not replace existing event names. Phase 57 should preserve current names and add only the minimum direct evidence needed to explain subsystem coverage.

Recommended first-class evidence vocabulary to cite:
- `rollout_endpoint_observed`
- execution checkpoint events (`execution_readiness_blocked`, `execution_failure`, `approval_completed`, `execution_loop_completed`)
- `markos_agent_run_provider_attempt`
- `markos_agent_run_close_completed`
- `markos_tenant_access_denied`
- billing lifecycle evidence objects derived from sync attempts, hold history, and restored snapshots

## OPS-02 Incident Workflow Recommendation

### Recommended primary incident scenario

Use **billing provider-sync failure causing tenant hold or degraded access** as the primary Phase 57 incident simulation.

Why this is the strongest choice:
- it already has tenant scope
- it already has deterministic failure and recovery evidence
- it already has tenant-facing and operator-facing surfaces
- it already intersects protected execution and premium capability impact

### Recommended workflow shape

| Step | Required detail |
|------|-----------------|
| Detection | Name the signal source: failed sync outcome, billing reconciliation surface, or related telemetry/event evidence. |
| Classification | Record severity, affected subsystem families, and whether the issue is isolated to one tenant or broader. |
| Impact analysis | Name impacted tenant IDs and workflows such as submit, regenerate, premium plugin actions, or billing administration. |
| Mitigation or rollback | State whether the response is operator review, payment recovery, temporary hold preservation, or explicit rollback path. |
| Communication | Record owner, audience, channel, and update cadence for tenant and operator communications. |
| Recovery verification | Require a successful sync, release event, restored snapshot, and confirmation that protected actions are restored. |
| Follow-up | Record corrective actions, evidence references, and ownership. |

### Restoration trigger recommendation

**Immediate recovery on first successful sync remains the right primary incident model.**

Rationale:
- It matches the current billing lifecycle implementation.
- It produces a deterministic simulation path.
- It avoids inventing stabilizing logic not currently present in the repo.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| OPS-01 closure | New monitoring dashboard or vendor integration | One artifact that inventories existing telemetry and evidence seams | The gap is packaging and traceability, not missing monitoring plumbing. |
| Queue subsystem proof | Synthetic backlog metrics or fake worker counts | Background execution safeguards, idempotent redelivery proof, and execution checkpoints | Preserves honesty about the current runtime architecture. |
| OPS-02 incident evidence | Generic outage narrative | Billing hold/release lifecycle plus tenant/operator evidence surfaces | Produces a deterministic, tenant-aware incident path with real repo evidence. |

**Key insight:** Phase 57 should close the final operations requirements by making existing evidence legible as one control family, not by building new operations infrastructure.

## Common Pitfalls

### Pitfall 1: Treating subsystem coverage as a telemetry list instead of an evidence chain
**What goes wrong:** planning names a lot of events, but still does not explain how API, queue, agent, and billing monitoring fit together.
**Why it happens:** engineers optimize for emitters rather than requirement traceability.
**How to avoid:** structure OPS-01 around subsystem families, each with source seam, validation proof, and operator interpretation.
**Warning signs:** the artifact lists event names only and never names the runtime path or API surface that emits or consumes them.

### Pitfall 2: Over-claiming queue observability
**What goes wrong:** the docs claim backlog or worker-fleet monitoring that the repo does not actually implement.
**Why it happens:** the requirement wording mentions queue depth, and it is tempting to generalize beyond current architecture.
**How to avoid:** state explicitly that MarkOS currently uses queue-adjacent background execution and idempotent redelivery rather than a richer queue platform.
**Warning signs:** references to queue dashboards, worker saturation, or backlog thresholds with no code seam.

### Pitfall 3: Writing a generic incident runbook with no tenant-safe evidence path
**What goes wrong:** OPS-02 remains partial because the runbook reads well but cannot be tied to live system evidence.
**Why it happens:** runbook prose is written before choosing a representative incident scenario.
**How to avoid:** anchor the workflow on billing degradation and recovery, then cite exact tenant and operator evidence surfaces.
**Warning signs:** the document says “identify impacted tenants” but never names where that information comes from.

### Pitfall 4: Depending on live paging or external comms tooling for closure
**What goes wrong:** Phase 57 becomes blocked on systems that are outside the repo and outside the current milestone.
**Why it happens:** incident-response work often drifts toward real-world tooling rollouts.
**How to avoid:** close with deterministic simulation evidence and in-repo runbook artifacts.
**Warning signs:** planning requires PagerDuty, Statuspage, or hosted alerting setup before marking OPS-02 complete.

## Code Examples

### Recommended OPS-01 inventory shape

```md
## Unified Observability Inventory

| Subsystem | Detection seam | Required evidence | Validation proof |
|-----------|----------------|-------------------|------------------|
| API | captureRolloutEndpointEvent | rollout_endpoint_observed + ROLLOUT_ENDPOINT_SLOS | test/onboarding-server.test.js |
| Queue-adjacent | migration-runner + execution checkpoints | tenant principal enforcement + duplicate-delivery safety | test/tenant-auth/tenant-background-job-propagation.test.js, test/agents/run-idempotency.test.js |
| Agent | captureProviderAttempt + captureRunClose | provider attempts, terminal outcome, latency, cost | test/agents/provider-policy-runtime.test.js, test/agents/run-close-telemetry.test.js |
| Billing | deriveProviderSyncOutcome + billing APIs | failed sync, hold history, release event, restored snapshot | test/billing/provider-sync-failure.test.js |
```

### Recommended OPS-02 simulation chain

```js
const failedOutcome = deriveProviderSyncOutcome({
  tenant_id: 'tenant-alpha-001',
  provider: 'stripe',
  sync_status: 'failed',
  failure_code: 'PAYMENT_METHOD_DECLINED',
  sync_attempt_id: 'sync-attempt-failed-001',
});

const restoredOutcome = deriveProviderSyncOutcome({
  tenant_id: 'tenant-alpha-001',
  provider: 'stripe',
  sync_status: 'succeeded',
  sync_attempt_id: 'sync-attempt-restored-001',
  previous_sync_attempts: [failedOutcome.sync_attempt],
  hold_history: failedOutcome.hold_history,
  active_hold: failedOutcome.hold_interval,
});

const lifecycle = buildBillingLifecycleEvidence({ sync_outcome: restoredOutcome });
```

## State of the Art

| Old Approach | Current Recommended Approach | Impact |
|--------------|------------------------------|--------|
| Partial requirement closure through prior-phase references | One explicit Phase 57 artifact linking all subsystem evidence families | Makes OPS-01 directly defensible. |
| Generic incident workflow prose | Tenant-aware billing degradation tabletop with named evidence seams | Makes OPS-02 directly defensible. |
| Queue language borrowed from generic runbook templates | Honest queue-adjacent execution proof rooted in background jobs and idempotent redelivery | Keeps the closure technically correct. |

**Deprecated or outdated for this phase:**
- treating the current gap as missing telemetry infrastructure
- describing queue backlog monitoring that does not exist
- using generic runbook prose without deterministic simulation evidence

## Open Questions

1. **Should Phase 57 add new telemetry events or only new evidence packaging?**
   - What we know: existing telemetry already covers API, agent, execution checkpoint, and tenant-access denial behavior.
   - What is unclear: whether billing or queue-adjacent proof needs one additional event or whether packaging is sufficient.
   - Recommendation: planning should start with packaging-first; add new events only if a direct requirement truth still cannot be stated cleanly.

2. **Where should the unified subsystem inventory live?**
   - What we know: `OBSERVABILITY-RUNBOOK.md` already exists and is the natural ops reference point.
   - What is unclear: whether making the runbook larger will reduce clarity for the simulation artifact.
   - Recommendation: keep the runbook as the canonical home, but allow a linked Phase 57 artifact if the inventory becomes too implementation-heavy.

3. **Does Phase 57 need a secondary non-billing incident scenario?**
   - What we know: billing degradation and recovery is the strongest tenant-aware deterministic incident in the repo today.
   - What is unclear: whether reviewers will want supporting evidence from agent failure or approval deadlock paths.
   - Recommendation: use billing as the primary scenario and add a lighter supporting note only if planning shows OPS-02 still feels under-specified.

## Environment Availability

Step 2.6: SKIPPED (no external dependencies or web research were needed beyond the existing repo, planning artifacts, and test suite).

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Node.js built-in test runner |
| Config file | none |
| Quick run command | `node --test test/agents/provider-policy-runtime.test.js test/tenant-auth/tenant-background-job-propagation.test.js test/agents/run-idempotency.test.js test/billing/provider-sync-failure.test.js` |
| Full suite command | `node --test test/agents/provider-policy-runtime.test.js test/agents/run-close-telemetry.test.js test/tenant-auth/tenant-background-job-propagation.test.js test/onboarding-server.test.js test/billing/provider-sync-failure.test.js test/ui-billing/billing-pages-contract.test.js` |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| OPS-01 | API telemetry remains SLO-backed and emitted on rollout paths | integration / contract | `node --test test/onboarding-server.test.js` | ✅ |
| OPS-01 | Queue-adjacent execution preserves tenant-safe background execution and duplicate-delivery safety | contract | `node --test test/tenant-auth/tenant-background-job-propagation.test.js test/agents/run-idempotency.test.js` | ✅ |
| OPS-01 | Agent runtime captures provider attempts and run-close evidence | integration / contract | `node --test test/agents/provider-policy-runtime.test.js test/agents/run-close-telemetry.test.js` | ✅ |
| OPS-01 | Billing subsystem exposes failed sync, hold history, release event, and restored snapshot evidence | unit / contract | `node --test test/billing/provider-sync-failure.test.js test/ui-billing/billing-pages-contract.test.js` | ✅ |
| OPS-02 | Incident workflow names impacted tenants, workflows, mitigation, communications, and recovery criteria | documentation / artifact | `Select-String` or planning validation against the runbook and simulation artifact | ❌ Wave 2 addition needed |
| OPS-02 | At least one deterministic incident simulation is recorded with direct evidence references | documentation / artifact | targeted documentation validation after simulation artifact creation | ❌ Wave 3 addition needed |

### Sampling Rate

- **Per task commit:** `node --test test/agents/provider-policy-runtime.test.js test/tenant-auth/tenant-background-job-propagation.test.js test/billing/provider-sync-failure.test.js`
- **Per wave merge:** `node --test test/agents/provider-policy-runtime.test.js test/agents/run-close-telemetry.test.js test/tenant-auth/tenant-background-job-propagation.test.js test/onboarding-server.test.js test/billing/provider-sync-failure.test.js test/ui-billing/billing-pages-contract.test.js`
- **Phase gate:** all targeted tests green plus direct documentation checks for the runbook, simulation artifact, and closure ledgers

### Wave 0 Gaps

- [ ] Add a direct Phase 57 observability artifact or runbook section that names each subsystem family and its proof seam.
- [ ] Add a tenant-aware incident workflow section that names communication owner, audience, cadence, and recovery criteria explicitly.
- [ ] Add one named simulation artifact that records the billing degradation tabletop and cites the exact evidence sources used.

## Sources

### Primary (HIGH confidence)
- `.planning/phases/57-observability-and-incident-closure/57-CONTEXT.md` - locked discuss-phase decisions and closure expectations
- `.planning/projects/markos-v3/REQUIREMENTS.md` - OPS-01 and OPS-02 wording and current status
- `.planning/projects/markos-v3/CLOSURE-MATRIX.md` - current partial-closure rationale
- `.planning/projects/markos-v3/technical-specs/OBSERVABILITY-RUNBOOK.md` - current runbook baseline and remaining generic gaps
- `.planning/phases/31-rollout-hardening/31-01-PLAN.md` and `31-01-SUMMARY.md` - API SLO telemetry baseline
- `.planning/phases/53-agentic-markos-orchestration-and-mir-msp-intelligence/53-VERIFICATION.md` - agent runtime telemetry and durable deny evidence baseline
- `.planning/phases/54-billing-metering-and-enterprise-governance/54-VERIFICATION.md` - billing and governance evidence surface baseline
- `onboarding/backend/agents/telemetry.cjs` - live telemetry registry and emitters
- `lib/markos/telemetry/events.ts` - canonical telemetry event vocabulary and payload sanitization
- `onboarding/backend/runtime-context.cjs` - runtime redaction, entitlement, and tenant-deny telemetry helpers
- `onboarding/backend/provisioning/migration-runner.cjs` - tenant-safe background execution seam
- `onboarding/backend/agents/orchestrator.cjs` - agent runtime telemetry and idempotent redelivery seam
- `lib/markos/billing/provider-sync.cjs` and `lib/markos/billing/reconciliation.cjs` - billing lifecycle derivation and evidence stitching
- `api/billing/holds.js`, `api/billing/tenant-summary.js`, `api/billing/operator-reconciliation.js` - tenant and operator incident evidence surfaces
- `test/tenant-auth/tenant-background-job-propagation.test.js`, `test/agents/run-idempotency.test.js`, `test/agents/provider-policy-runtime.test.js`, `test/agents/run-close-telemetry.test.js`, `test/billing/provider-sync-failure.test.js`, `test/ui-billing/billing-pages-contract.test.js`, `test/onboarding-server.test.js` - proof surface and current gap map

### Secondary (MEDIUM confidence)
- `.planning/phases/57-observability-and-incident-closure/57-01-PLAN.md`, `57-02-PLAN.md`, `57-03-PLAN.md` - current planning scaffold and wave decomposition
- `.planning/phases/57-observability-and-incident-closure/57-VALIDATION.md` - current stub validation expectations

### Tertiary (LOW confidence)
- None. No external-web claims were needed for this phase.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all recommendations are based on existing in-repo telemetry, runtime, billing, and planning seams.
- Architecture: HIGH - subsystem coverage and the strongest incident scenario are directly visible in code and tests.
- Pitfalls: HIGH - each pitfall comes from current requirement wording or concrete closure gaps visible in docs and code.
- Validation architecture: HIGH - targeted test commands and missing documentation gates are directly derivable from the current repo.

**Research date:** 2026-04-04  
**Valid until:** 2026-04-11
