# Phase 53: Agentic MarkOS Orchestration and MIR/MSP Intelligence - Research

**Researched:** 2026-04-03
**Domain:** Deterministic tenant-bound agent runtime, approval gates, provider failover, MIR/MSP lineage
**Confidence:** HIGH

## Summary

Phase 53 should be implemented as a deterministic, fail-closed run lifecycle engine layered on top of existing onboarding runtime boundaries. The current codebase already has key primitives: tenant context resolution and ambiguity rejection in onboarding/backend/runtime-context.cjs, role-action authorization in lib/markos/rbac/iam-v32.js, provider fallback and telemetry metadata in lib/markos/llm/fallback-chain.ts and lib/markos/llm/telemetry-adapter.ts, and MIR/MSP write and readiness touchpoints in onboarding/backend/write-mir.cjs plus onboarding/backend/literacy/*. The implementation path is to formalize these into a first-class run envelope, explicit transition validator, append-only event log, and immutable approval decision model.

The highest-leverage design choice is to make AGT-02 state transitions and AGT-03 approval behavior persistently validated at the data model layer, not only in handler logic. This prevents duplicate side effects under redelivery, blocks illegal state transitions, and guarantees IAM-03 decision immutability. Existing /approve behavior in onboarding/backend/handlers.cjs already checks approve_task; Phase 53 should convert this from endpoint-local behavior to run-centric behavior where high-impact actions require a valid run in awaiting_approval with a reviewer-authorized actor and immutable decision write.

MIR/MSP intelligence requirements should be implemented as an append-only lineage system: initialization snapshots (MIR-01), explainable activation evidence per discipline (MIR-02), regeneration report + rationale records (MIR-03), and immutable queryable version chains (MIR-04). Cost/latency/tool/model telemetry must be complete before terminal run close (AGT-04), enabling Phase 54 billing reconciliation without retrofitting run evidence.

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Use the full canonical AGT-02 state machine for all agent runs: requested -> accepted -> context_loaded -> executing -> awaiting_approval -> approved/rejected -> completed/failed -> archived.
- **D-02:** Enforce strict transition validation; illegal transitions must be blocked and audit-logged.
- **D-03:** Require idempotency at both envelope and side-effect layers: duplicate delivery may not create duplicate plan mutations or duplicate externally visible actions.
- **D-04:** All externally visible high-impact mutations must pause at awaiting_approval and resume only via explicit authorized approved or rejected action.
- **D-05:** Approval/rejection actions are restricted to IAM-03 reviewer-authorized roles (plan:approve capability) and must be immutable once written.
- **D-06:** Non-authorized approval attempts are deny-logged as security events with actor, tenant, action, and correlation id.
- **D-07:** Provider selection is policy-routed (per-tenant/per-run profile), with a designated primary provider.
- **D-08:** Automatic fallback is bounded and reason-coded: fallback is allowed for timeout/rate/auth-class failures with capped retry/fallback attempts and explicit terminal failure when budget is exhausted.
- **D-09:** Every provider attempt and failover decision must be captured in run telemetry as structured tool/provider events.
- **D-10:** MIR Gate 1 completeness is a hard precondition for MSP activation (MIR-01 -> MIR-02); activation attempts before completeness are blocked.
- **D-11:** Discipline activation must derive from MIR + purchased-service context and persist explainable rationale/evidence per discipline.
- **D-12:** Regeneration/versioned update reports are mandatory for critical Gate 1 and discipline-affecting edits; each accepted edit writes an append-only regeneration record with rationale and dependency impact.
- **D-13:** Historical plan/version chains remain append-only and queryable by tenant/date range; deletion/mutation of prior versions is blocked.
- **D-14:** No run may enter terminal completed or failed state without a complete run-close telemetry record containing model, prompt version, tool events, latency, cost, and outcome (AGT-04).
- **D-15:** Telemetry granularity must include run-level summary plus step/provider attempt events so downstream BIL-02 metering can map cost deterministically.

### Claude's Discretion
- The planner/researcher may choose exact queue/storage schema and module boundaries as long as lifecycle, idempotency, and approval contracts remain intact.
- The planner/researcher may tune retry/fallback thresholds by policy profile if bounded behavior and full telemetry evidence are preserved.

### Deferred Ideas (OUT OF SCOPE - Phase 54)
- Billing policy optimization and invoice-grade cost reconciliation UX (Phase 54, BIL series).
- Enterprise compliance packaging and SSO/identity governance extensions beyond IAM-03 (Phase 54).

## Phase Requirements Coverage

| ID | Requirement | Concrete Research Support |
|----|-------------|---------------------------|
| AGT-01 | Tenant-bound run envelope with approved context only | Introduce markos_agent_runs envelope persisted at run creation; require tenant_id, actor_id, correlation_id, prompt_version, provider policy, tool policy; hydrate from requireHostedSupabaseAuth in onboarding/backend/runtime-context.cjs and reject missing/ambiguous tenant context fail-closed. |
| AGT-02 | Deterministic transitions, retries, timeout handling | Implement transition guard in onboarding/backend/agents/orchestrator.cjs (or new run-engine module) backed by allowed_transition matrix and append-only markos_agent_run_events; use idempotency keys and side-effect registry to prevent duplicate mutations. |
| AGT-03 | Human approval gate before high-impact actions | Convert /approve and other high-impact paths in onboarding/backend/handlers.cjs to run-state gates requiring awaiting_approval -> approved/rejected transition with immutable decision row. |
| AGT-04 | Complete run-close artifact | Extend onboarding/backend/agents/telemetry.cjs + lib/markos/telemetry/events.ts + lib/markos/llm/telemetry-adapter.ts to enforce terminal state guard: run cannot complete/fail without model, prompt_version, tool/provider events, latency, cost, outcome. |
| MIR-01 | MIR Gate 1 initialization | Add deterministic initialization record per tenant/project in write-mir flow; block MSP activation if required Gate 1 entities unresolved (enforced in activation-readiness + discipline-selection integration). |
| MIR-02 | Explainable discipline activation from MIR + purchased service | Extend onboarding/backend/literacy/discipline-selection.cjs output into persisted activation evidence (inputs, rationale, selected/unselected reasons, service entitlements). |
| MIR-03 | Regeneration reports + append-only records | Add regeneration report object and append-only markos_mir_regenerations chain for critical edits in onboarding/backend/write-mir.cjs and regenerate handlers. |
| MIR-04 | Append-only, queryable history | Model immutable version chain (parent_version_id, effective_at, actor_id, run_id) and block UPDATE/DELETE of historical rows via policy and app-layer denial. |
| IAM-03 | Authorized reviewer approval + immutable decision log | Reuse canPerformAction("approve_task") from lib/markos/rbac/iam-v32.js; persist approval decision in immutable table, deny and telemetry-log unauthorized attempts with correlation id from runtime-context buildDenyEvent/emitDenyTelemetry pattern. |

## Recommended Architecture for Deterministic Run Lifecycle Engine

### Core modules (codebase-specific)
- onboarding/backend/agents/orchestrator.cjs
  - Promote from draft coordinator to run lifecycle coordinator.
  - Add run envelope loader, transition validator, idempotency checks, and run-close finalizer.
- onboarding/backend/agents/llm-adapter.cjs
  - Keep as compatibility wrapper only; route Phase 53 provider policy and fallback control through lib/markos/llm/adapter.ts.
- lib/markos/llm/adapter.ts + lib/markos/llm/fallback-chain.ts
  - Authoritative provider routing/fallback semantics and reason codes.
- onboarding/backend/handlers.cjs
  - Convert approve/regenerate/high-impact routes to run-centric transition calls.
- onboarding/backend/runtime-context.cjs
  - Keep tenant/auth boundary authoritative; never derive tenant context from untrusted fields when JWT claim exists.

### Deterministic transition contract

Allowed transitions only:
- requested -> accepted
- accepted -> context_loaded
- context_loaded -> executing
- executing -> awaiting_approval
- awaiting_approval -> approved
- awaiting_approval -> rejected
- approved -> executing
- executing -> completed
- executing -> failed
- completed -> archived
- failed -> archived
- rejected -> archived

Illegal transitions:
- Any non-listed edge is denied, persisted as transition_denied event, and never mutates run state.

### Idempotency model (dual layer)

Envelope idempotency:
- Unique key: tenant_id + idempotency_key + operation_class.
- Duplicate run-create returns existing run_id and current state.

Side-effect idempotency:
- Unique key per externally visible action: run_id + step_key + effect_hash.
- First commit writes effect ledger; redelivery checks ledger and returns already_applied with no mutation.

## Approval Gate + IAM-03 Enforcement Model

### Authorization policy
- Keep role authorization centralized in lib/markos/rbac/iam-v32.js via approve_task action.
- In handlers, resolve role from req.markosAuth.iamRole and never trust body role.
- Decision endpoint requires run state awaiting_approval and actor authorized for approve_task.

### Immutable decision log contract
- Write once decision row with columns: decision_id, run_id, tenant_id, action(approved|rejected), actor_id, actor_role, rationale, correlation_id, created_at.
- DB policy: reject updates/deletes for existing decision rows.
- App guard: if decision exists for run_id, reject subsequent writes with DECISION_IMMUTABLE.

### Denial telemetry
- Reuse runtime-context deny event shape (actor_id, tenant_id, action, reason, correlation_id).
- Emit markos_tenant_access_denied and run-specific approval_denied event on unauthorized attempts.

## Provider Routing/Failover Policy Model with Bounded Retries

### Existing primitives to standardize
- lib/markos/llm/settings.ts already supports primaryProvider, allowFallback, fallbackTemplate.
- lib/markos/llm/fallback-chain.ts already enforces capped chain with maxAttempts (default 3), exponential backoff for RATE_LIMITED/TIMEOUT, and reason collection.
- lib/markos/llm/types.ts already defines reason code space including TIMEOUT, RATE_LIMITED, AUTH_ERROR, FALLBACK_EXHAUSTED.

### Phase 53 policy contract
- Source provider policy per run from run envelope fields:
  - primary_provider
  - allowed_providers[]
  - max_fallback_attempts
  - timeout_ms
  - retry_budget
- Fallback allowed only for failure class:
  - TIMEOUT
  - RATE_LIMITED
  - AUTH_ERROR
- Fail terminal with FALLBACK_EXHAUSTED when budget spent.
- Every attempt persists provider_attempt event with provider, model, latency_ms, token usage, cost_estimate, error_code.

## MIR/MSP Initialization, Activation, Regeneration, Append-Only Lineage Model

### MIR-01 initialization
- During submit/approve lifecycle, persist Gate 1 initialization snapshot for tenant/project:
  - required_entities
  - entity_status
  - source seed references
  - initialized_by_run_id
- Activation-readiness gate in onboarding/backend/literacy/activation-readiness.cjs must refuse readiness=ready when Gate 1 incomplete.

### MIR-02 discipline activation evidence
- Extend onboarding/backend/literacy/discipline-selection.cjs output persistence with evidence row per discipline:
  - discipline
  - selected(boolean)
  - rationale_text
  - mir_inputs_hash
  - purchased_service_inputs
  - generated_at
  - run_id
- Unexpected deactivation blocked unless explicit regeneration operation with rationale.

### MIR-03 regeneration records
- For critical Gate 1 or discipline-affecting edits, require:
  - update report (changed_fields, why, dependency impact)
  - append-only regeneration record (parent_version_id, rationale, triggered_disciplines).
- Reject edit-without-rationale for critical entities.

### MIR-04 version chain
- Immutable chain with parent_version_id and valid_from timestamps.
- Query APIs by tenant + date range return historical snapshots without mutation.
- Rollback operation is read-select + new append write, not destructive revert.

## Telemetry/Metering Contract (Run-Close Completeness)

### Required run-close fields (AGT-04)
- model
- prompt_version
- tool_events (including provider attempts/fallback reasons)
- latency_ms (total)
- cost_usd (or estimated_cost_usd when exact unavailable)
- outcome (completed|failed|rejected + reason code)

### Enforcement
- Terminal transition guard denies completed/failed when any required field missing.
- Emit run_close_incomplete event and keep run in executing or failed_validation state (non-terminal) until closed correctly.

### Integration surfaces
- onboarding/backend/agents/telemetry.cjs for backend capture transport.
- lib/markos/telemetry/events.ts for event envelope/sanitization.
- lib/markos/llm/telemetry-adapter.ts for provider-level cost/fallback metadata.

## Data Model Recommendations (Tables, Events, Indexing)

### Recommended relational tables
- markos_agent_runs
  - run_id PK, tenant_id, project_slug, actor_id, correlation_id, state, idempotency_key, prompt_version, provider_policy_json, tool_policy_json, created_at, updated_at, closed_at.
- markos_agent_run_events (append-only)
  - event_id PK, run_id FK, tenant_id, event_type, from_state, to_state, payload_json, created_at.
- markos_agent_side_effects
  - effect_id PK, run_id, tenant_id, step_key, effect_hash, effect_type, committed_at.
  - UNIQUE(tenant_id, run_id, step_key, effect_hash).
- markos_agent_approval_decisions (immutable)
  - decision_id PK, run_id UNIQUE, tenant_id, decision, actor_id, actor_role, rationale, correlation_id, created_at.
- markos_mir_versions (append-only)
  - version_id PK, tenant_id, entity_key, parent_version_id, content_hash, content_ref, rationale, run_id, created_at.
- markos_mir_regenerations (append-only)
  - regeneration_id PK, tenant_id, trigger_entity, impacted_disciplines_json, rationale, report_json, run_id, created_at.
- markos_discipline_activations
  - activation_id PK, tenant_id, discipline, selected, rationale, evidence_json, source_mir_version_id, run_id, created_at.

### Indexing
- markos_agent_runs: (tenant_id, created_at DESC), (tenant_id, state), (correlation_id).
- markos_agent_run_events: (run_id, created_at), (tenant_id, event_type, created_at).
- markos_mir_versions: (tenant_id, entity_key, created_at DESC).
- markos_mir_regenerations: (tenant_id, created_at DESC).
- markos_discipline_activations: (tenant_id, discipline, created_at DESC).

### Event naming recommendations
- agent_run_requested
- agent_run_transitioned
- agent_run_transition_denied
- agent_run_provider_attempt
- agent_run_awaiting_approval
- agent_run_approval_recorded
- agent_run_close_completed
- agent_run_close_incomplete
- mir_regeneration_recorded
- discipline_activation_evaluated

## Integration Points and Rollout Sequencing Recommendations

### Wave 1: Run envelope + transition guard
- Add run envelope persistence and transition validator.
- Wire submit/execute/regenerate flows to run-centric transitions.
- Keep existing behavior as compatibility fallback behind feature flag.

### Wave 2: Approval immutability + IAM-03 hardening
- Route /approve through run gate (awaiting_approval required).
- Enforce immutable decision row and unauthorized deny telemetry.

### Wave 3: Provider policy + failover evidence
- Use lib/markos/llm/adapter.ts policy inputs from run envelope.
- Persist provider_attempt events and fallback reason codes.

### Wave 4: MIR/MSP lineage contracts
- Add Gate 1 initialization snapshots, discipline activation evidence, regeneration lineage tables.
- Block destructive history mutations and expose query endpoints.

### Wave 5: Run-close completeness gate
- Add terminal-state guard requiring full AGT-04 telemetry set.
- Emit run close metrics for Phase 54 billing pipeline.

### Explicitly deferred to Phase 54
- Billing-grade reconciliation UX and invoicing workflows.
- Enterprise compliance and identity extensions beyond IAM-03.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Split orchestration paths between onboarding/backend/agents/orchestrator.cjs and lib/markos/llm/adapter.ts | Divergent runtime behavior | Make lib/markos/llm/adapter.ts authoritative for provider routing; keep llm-adapter.cjs as compatibility shim only. |
| Incomplete telemetry at terminal close | Breaks AGT-04 and future billing determinism | Enforce terminal guard on required run-close fields and fail-close on missing payload. |
| Approval bypass through direct mutation endpoints | Violates AGT-03/IAM-03 | Require run_id + awaiting_approval + approve_task auth for all high-impact actions; deny if any missing. |
| Duplicate side effects under retry/redelivery | Data corruption and non-determinism | Dual idempotency keys and side-effect ledger unique constraints. |
| Historical chain mutation | Violates MIR-04 | Append-only tables + DB policy blocking UPDATE/DELETE + app-level guardrails. |
| Legacy handler instability | Regression risk | Introduce feature flags and incremental wave rollout with regression gates per wave. |

## Test Strategy Recommendations Tied to Requirements

### Framework and commands
- Framework: Node built-in test runner (node --test)
- Quick command: npm test
- Targeted command pattern: node --test test/**/*.test.js

### Requirement-to-test mapping

| Req ID | Test Focus | Test Type | Recommended Test Files |
|--------|------------|-----------|------------------------|
| AGT-01 | Missing tenant/policy metadata rejects run creation | unit + integration | test/agents/run-envelope.test.js, test/onboarding/handlers-submit.test.js |
| AGT-02 | Transition matrix legality + duplicate redelivery no duplicate mutation | unit + integration | test/agents/run-state-machine.test.js, test/agents/idempotency-ledger.test.js |
| AGT-03 | High-impact actions pause/resume only via approval gate | integration | test/onboarding/approval-gate-flow.test.js |
| AGT-04 | Terminal close blocked without complete telemetry | unit + integration | test/agents/run-close-telemetry.test.js |
| MIR-01 | MSP activation blocked until Gate 1 complete | unit | test/literacy/activation-readiness-gate1.test.js |
| MIR-02 | Discipline activation rationale/evidence persistence | unit + integration | test/literacy/discipline-activation-evidence.test.js |
| MIR-03 | Critical edit requires rationale and emits regeneration report | integration | test/mir/regeneration-rationale.test.js |
| MIR-04 | Version history append-only and queryable by date range | integration | test/mir/version-lineage.test.js |
| IAM-03 | Non-reviewer approval denied + decision immutable | unit + integration | test/rbac/approve-task-policy.test.js, test/onboarding/approval-decision-immutability.test.js |

### Regression gates
- Per commit in Phase 53: run targeted suites for touched requirement IDs.
- Per wave merge: npm test plus requirement-targeted suites above.
- Phase gate: full suite green + explicit negative tests for bypass/immutability.

## Project Constraints (from CLAUDE.md)

- Mandatory context load order for MarkOS sessions:
  - .protocol-lore/QUICKSTART.md
  - .protocol-lore/INDEX.md
  - .planning/STATE.md
  - .agent/markos/MARKOS-INDEX.md
- Method split must be preserved:
  - GSD engineering workflow under .agent/get-shit-done and .planning
  - MarkOS protocol under .agent/markos and .agent/skills/markos-*
- Local client overrides live in .markos-local only; never in .mgsd-local.
- Primary CLI install/update entrypoint is npx markos.
- Test commands must remain aligned to package contract:
  - npm test
  - node --test test/**/*.test.js
- Local onboarding backend command remains node onboarding/backend/server.cjs (port from onboarding/onboarding-config.json).

## Sources

### Primary (HIGH confidence)
- .planning/phases/53-agentic-markos-orchestration-and-mir-msp-intelligence/53-CONTEXT.md
- .planning/REQUIREMENTS.md (Phase 53 AGT/MIR/IAM requirements)
- .planning/ROADMAP.md (Phase 53 scope mapping)
- onboarding/backend/runtime-context.cjs
- onboarding/backend/agents/orchestrator.cjs
- onboarding/backend/agents/llm-adapter.cjs
- onboarding/backend/agents/telemetry.cjs
- onboarding/backend/write-mir.cjs
- onboarding/backend/literacy/discipline-selection.cjs
- onboarding/backend/literacy/activation-readiness.cjs
- onboarding/backend/markosdb-contracts.cjs
- onboarding/backend/handlers.cjs
- lib/markos/llm/adapter.ts
- lib/markos/llm/fallback-chain.ts
- lib/markos/llm/settings.ts
- lib/markos/llm/telemetry-adapter.ts
- lib/markos/llm/types.ts
- lib/markos/rbac/iam-v32.js
- lib/markos/telemetry/events.ts
- lib/markos/rbac/policies.ts

### Secondary (MEDIUM confidence)
- None required; recommendations are codebase-derived and requirement-locked.

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Lifecycle and IAM enforcement: HIGH (existing runtime-context + iam-v32 + handlers evidence)
- Provider routing/failover: HIGH (existing llm adapter/fallback-chain/settings contracts)
- MIR/MSP lineage implementation shape: HIGH (existing write-mir + literacy activation contracts + locked requirement specifics)

**Research date:** 2026-04-03
**Valid until:** 2026-05-03
