# Milestone v3.1.0 Requirements

**Milestone:** v3.1.0 — Operator Surface Unification  
**Goal:** Unify marketing, sales, and customer communications execution in one operational surface with auditable workflows and measurable activation outcomes.  
**Status:** v3.1.0 phase frame locked 2026-04-02. Ready for phase planning and roadmap generation.

---

## 1. Active Requirements (Locked for v3.1.0)

### Pillar 1: Integrated Operator Task UI

**OPS-01:** Operator can view a live task graph showing current execution state, queued actions, and completion path.
- Input: Approved MIR/MSP state from onboarding
- Output: Real-time task graph UI rendering ≥1 nested task level
- Success: Task state updates within 100ms of action execution
- Phase: 46 (UI MVP)

**OPS-02:** Operator can execute a task from the UI and observe step-by-step state transitions.
- Input: Task graph view
- Output: Step-by-step action runner with explicit "start", "in-progress", "complete" states
- Success: All state transitions are atomic and logged
- Phase: 46 (UI MVP)

**OPS-03:** Operator can approve or reject a queued task step before execution proceeds.
- Input: Step awaiting approval (marked with approval gate flag)
- Output: Approval checkpoint UI with inline reason collection
- Success: Approval gate blocks execution until human decision is recorded
- Phase: 46 (UI MVP)

**OPS-04:** Operator can retry a failed task step with optional input mutation.
- Input: Failed step state and error context
- Output: Retry UI with step input preview and edit capability
- Success: Retried step re-executes with new inputs; outcome is logged as retry attempt
- Phase: 46 (UI MVP)

**OPS-05:** Operator can view step evidence panel (inputs, outputs, logs, timestamps, actor ID).
- Input: Completed task step
- Output: Evidence panel displaying structured metadata for audit trail
- Success: ≥95% of executed steps contain evidence payloads; evidence is immutable
- Phase: 46 (UI MVP)

**OPS-06:** Operator sees inline guardrails before executing risky actions (migrations, rollbacks, bulk operations).
- Input: Action classified as risky by workflow engine
- Output: Modal/banner showing guardrail warning with abort/confirm choices
- Success: Guardrails are always displayed; confirmation is mandatory
- Phase: 49 (Hardening layer)

### Pillar 2: Complete API Coverage & Contracts

**API-01:** Every production MarkOS flow (onboarding submit/approve, execution, results, reporting) is explicitly mapped to API contract(s).
- Input: Flow inventory (from Phase 45)
- Output: Flow → Contract mapping table (.planning/FLOW-CONTRACTS.md)
- Success: 100% of active flows have ≥1 contract mapping
- Phase: 45 (Flow inventory)

**API-02:** Each mapped flow has a versioned OpenAPI contract stored in the codebase (contracts/ directory).
- Input: Flow mapping from API-01
- Output: {flow_name}-{version}.yaml files with request/response schema, status codes, error contracts
- Success: All contracts validate against OpenAPI 3.0 schema
- Phase: 47 (OpenAPI generation)

**API-03:** OpenAPI spec is auto-generated from contract files and committed to repo (api/openapi.yaml).
- Input: Contract files from Phase 47
- Output: Single authoritative OpenAPI spec reflecting all versioned endpoints
- Success: OpenAPI spec is valid and matches actual implementation in CI
- Phase: 47 (OpenAPI generation)

**API-04:** Contract test suite enforces request/response shape and lifecycle assertions for all versioned endpoints.
- Input: API contracts
- Output: test/api-contracts/ with ≥1 test per contract covering happy path, error paths, version compat
- Success: Contract tests are required CI check; CI fails on unapproved breaking changes
- Phase: 48 (Contract testing)

**CONTRACT-01:** API versioning policy is documented (SemVer + deprecation windows + compatibility guarantees).
- Input: FLOW-CONTRACTS.md from Phase 45
- Output: .planning/codebase/API-VERSIONING-POLICY.md with policy rules and migration examples
- Success: Policy is reviewed by project owner; all active endpoints comply
- Phase: 47 (OpenAPI generation)

**CONTRACT-02:** Backward compatibility is enforced: older clients can call newer API endpoints without breaking.
- Input: Versioning policy from CONTRACT-01
- Output: Compatibility tests in test/api-contracts/ validating v1 client against v2 API
- Success: v1 client requests do not fail on v2 endpoints
- Phase: 48 (Contract testing)

### Pillar 3: Hardening + Upgrade + Enablement

**RBAC-01:** Operations UI enforces role-based access; unauthorized actions are blocked at UI and API layer.
- Input: Role definitions from existing Phase 37 RBAC contracts
- Output: Middleware guards on routes + UI conditional rendering per role
- Success: 100% of protected routes test with unauthorized role; all fail with 403
- Phase: 49 (Hardening layer)

**RBAC-02:** Operator can see their assigned role and required permissions inline in the UI.
- Input: User session role
- Output: Role badge + permission checklist visible in settings page
- Success: Operator knows exactly what actions they can/cannot perform
- Phase: 49 (Hardening layer)

**HARD-01:** Database migration flow includes preflight checks to prevent unsafe state transitions.
- Input: Pending migration
- Output: Preflight check UI showing current state, target state, and rollback plan
- Success: Migration is blocked if preflight check fails; operator must resolve issue before retry
- Phase: 49 (Hardening layer)

**HARD-02:** Rollback path exists for all data-altering operations (migrations, approved draft writes, wins merge).
- Input: Completed operation with transaction ID
- Output: Rollback endpoint (POST /api/rollback/{tx_id}) with pre/post state validation
- Success: Rollback restores system to pre-operation state; idempotent on rerun
- Phase: 49 (Hardening layer)

**HARD-03:** Health diagnostics surface operator/admin view showing system health (DB, vector store, providers).
- Input: Periodic health checks (DB query, Upstash probe, provider API call)
- Output: Health dashboard at /admin/health with component status, last-check timestamp, TRY-AGAIN CTA
- Success: Health dashboard updates every 30s; alerts on component degradation
- Phase: 49 (Hardening layer)

**ONBOARD-01:** Operator onboarding path is documented (first-run flow, role assignment, training checklist).
- Input: Onboarding context (role, permissions, business model)
- Output: .planning/codebase/OPERATOR-ONBOARDING-RUNBOOK.md with step-by-step guide and recovery procedures
- Success: New operator can complete first task without engineering intervention
- Phase: 50 (Operator onboarding)

**ONBOARD-02:** First-run flow guides operator through role setup, perm acceptance, and first task execution.
- Input: Fresh operator session (no role assigned)
- Output: Interactive wizard at /onboarding/operator with role selection, perm review, task walkthrough
- Success: Operator completes wizard and has role + first task queued
- Phase: 50 (Operator onboarding)

---

## 2. Success Metrics & Activation KPI Baseline

### v3.1.0 Acceptance Criteria

| Criterion | Target | Measurement |
|-----------|--------|-------------|
| Flow Contract Coverage | 100% of active flows | Count flows in FLOW-CONTRACTS.md / Total active flows |
| OpenAPI Coverage | 100% of contract endpoints | Endpoints in openapi.yaml / Total contracts |
| Contract Test Gate | Required CI check | CI workflow enforces contract-tests pass |
| Breaking Change Blocking | Zero unapproved breaking changes | Contract test suite flags and blocks breaking changes |
| Task Evidence Completeness | ≥95% of executed steps | Steps with evidence / Total executed steps (from telemetry) |
| RBAC Enforcement | 100% of protected routes | Routes with role guards / Total protected routes |
| Operator Onboarding Completion Rate | ≥80% first-run success | Operators who complete onboarding wizard / Total new operators |

### Activation KPI Baseline (Measured at Milestone Start)

**Definition:** "Activation" = Operator completes first end-to-end task execution (submit → execute → review evidence → close).

Current state (v3.0 end):
- **Time-to-First-Task (T0):** Not currently measured; estimate ~15–30 min manual setup
- **Evidence Capture Rate (T0):** ~60% of steps have partial evidence (missing logs/timestamps)
- **Operator Self-Service Rate (T0):** ~30% (most need support for task approval, evidence review)
- **Flow Coverage (T0):** ~40% of flows are operationally reachable; remainder require code/CLI access

**v3.1.0 Target:**
- **Time-to-First-Task (T1):** ≤5 minutes (UI-driven, guided)
- **Evidence Capture Rate (T1):** ≥95% (all steps immutable, structured)
- **Operator Self-Service Rate (T1):** ≥85% (UI removes need for manual intervention)
- **Flow Coverage (T1):** 100% (all flows accessible from operator UI)

**Measurement Mechanism:**
- `time_to_first_task`: Timestamp from operator role assignment to first task completion; recorded in telemetry
- `evidence_capture_rate`: Steps with evidence / Total steps per session; tracked in onboarding backend
- `operator_self_service_rate`: Sessions with zero manual support requests / Total operator sessions; tracked in Linear + telemetry
- `flow_coverage`: Flows reachable from UI / Total active flows; reported in Phase 47/50

**KPI Locked:** 2026-04-02. Baseline measurement to occur at Phase 45 kickoff; progress tracked per phase.

---

## 3. Tightened Phase Frame (Locked for Roadmap)

### Phase 45: Operations Flow Inventory & Canonical Contract Map

**Goal:** Audit all production MarkOS flows, create canonical flow registry, and lock API contract mapping.

**Deliverables:**
- `.planning/FLOW-INVENTORY.md` — Complete list of all active flows (onboarding, execution, reporting, admin) with descriptions, actors, and success criteria
- `.planning/FLOW-CONTRACTS.md` — Mapping of each flow to versioned contracts (flow_name → [contract_v1, contract_v2, ...])
- `contracts/schema.json` — Canonical contract schema (request/response/errors structure)
- `.planning/FLOW-VERIFICATION.md` — Checklist confirming all flows are documented and mapped
- **Tests:** test/api-contracts/phase-45-flow-inventory.test.js (verify 100% flow coverage, no orphaned flows)
- **KPI Step:** Baseline measurement of T0 metrics (time-to-first-task, evidence rate, flow coverage)

**Success Criteria:**
- All active flows are documented and mapped
- Contract schema is reviewed and approved
- Flow inventory is cross-referenced with Phase 37 RBAC contracts
- Phase 45 tests pass; CI integrations begin

---

### Phase 46: Operator Task Graph UI (MVP)

**Goal:** Ship a functional task graph UI with step-by-step execution, approval checkpoints, and evidence panel.

**Deliverables:**
- `app/(markos)/operations/tasks/graphql.tsx` — Live task graph component (renders from approved MIR/MSP state)
- `app/(markos)/operations/tasks/step-runner.tsx` — Step-by-step execution UI with state machine
- `app/(markos)/operations/tasks/approval-gate.tsx` — Approval checkpoint modal
- `app/(markos)/operations/tasks/evidence-panel.tsx` — Immutable evidence viewer (inputs, outputs, logs, timestamps)
- `app/(markos)/operations/tasks/page.tsx` — Task operations hub integrating all above
- Integration: Task state mutations persist to MarkOSDB (audit trail via Event Store pattern)
- **Stories:** Storybook coverage for 5 task states (queued, approved, executing, completed, failed)
- **Tests:** test/ui-operations/ covering component interactions, state transitions, evidence capture
- **KPI Step:** Measure T1 time-to-first-task (via instrumentation) after phase 46 UI ships

**Success Criteria:**
- Task graph renders without error
- Step state transitions are atomic and logged
- Approval checkpoint blocks execution until human decision recorded
- Evidence panel displays for ≥95% of steps
- Storybook stories are live and accessible
- UI tests pass in CI

---

### Phase 47: OpenAPI Generation Pipeline & Versioning Policy

**Goal:** Auto-generate authoritative OpenAPI spec from contract files; lock versioning policy.

**Deliverables:**
- `bin/generate-openapi.cjs` — CLI tool to regenerate api/openapi.yaml from contracts/ directory
- `api/openapi.yaml` — Authoritative spec generated from contracts (human-readable, validates against OpenAPI 3.0)
- `.planning/codebase/API-VERSIONING-POLICY.md` — SemVer + deprecation window (e.g., 2 minor versions overlap) + migration examples
- `api/contracts/{flow_name}.v1.yaml`, `api/contracts/{flow_name}.v2.yaml`, … — Versioned per-flow contracts
- Integration into CI: `npm run generate-openapi` validates spec and fails if spec ≠ implementation
- Publish: POST to swagger.io or Postman API registry (optional)
- **Tests:** test/api-contracts/phase-47-openapi.test.js (spec validity, endpoint coverage, version schema consistency)
- **KPI Step:** Verify 100% flow coverage in OpenAPI

**Success Criteria:**
- OpenAPI spec is valid and covers all active endpoints
- Versioning policy is documented and reviewed
- CI enforces spec ↔ implementation parity
- All contract files follow schema from Phase 45

---

### Phase 48: Contract Testing Framework & CI Compatibility Gates

**Goal:** Ship contract test suite enforcing backward compatibility; prevent breaking changes.

**Deliverables:**
- `test/api-contracts/framework.js` — Test utilities for contract validation (schema checking, version compat, error handling)
- `test/api-contracts/{flow_name}.test.js` — ≥1 test per contract covering happy path, error paths, version compat assertion
- `.github/workflows/contract-tests.yml` — CI step running contract tests, blocking on failure, reporting breaking changes
- `test/fixtures/contracts/` — Sample request/response payloads per contract for mock testing
- **Tests:** test/api-contracts/ suite with ≥N tests per contract (N = 3 for simple, 5 for complex)
- **KPI Step:** Measure contract test pass rate; ensure CI blocks on breaking changes

**Success Criteria:**
- Contract test suite is required CI gate (no merge without passing)
- ≥1 test per contract covering happy + error paths
- Version compatibility test (v1 client against v2 API) passes
- CI reports breaking changes clearly (prevents silent regressions)

---

### Phase 49: Hardening Layer (RBAC Ops UI, Diagnostics, Migration Assistants, Rollback Safety)

**Goal:** Harden operations surface with role guards, health diagnostics, preflight checks, and rollback safety.

**Deliverables:**
- `app/(markos)/operations/rbac-enforcer.tsx` — Middleware + UI guards for role-based access
- `app/(markos)/operations/role-badge.tsx` — Operator role display + permission checklist
- `app/(markos)/operations/preflight-check.tsx` — Pre-migration validation UI (current state → target state → rollback plan)
- `app/(markos)/operations/health-dashboard.tsx` — System health monitor (DB, vector store, provider status, 30s refresh)
- `api/rollback/{tx_id}` — Rollback endpoint with pre/post state validation
- **Guardrails:** Inline warnings before risky actions (Phase 46 step execution)
- **Tests:** test/rbac-ops/ covering permission enforcement, preflight validation, rollback idempotency, health probe failure modes
- **KPI Step:** Measure RBAC test coverage (100% of protected routes)

**Success Criteria:**
- RBAC middleware blocks unauthorized actions at API layer (403 response)
- Preflight check prevents unsafe migrations
- Rollback successfully restores pre-operation state
- Health dashboard updates ≥1x per 30s
- All health/rollback tests pass

---

### Phase 50: Guided Operator Onboarding + End-to-End Activation Verification

**Goal:** Ship operator onboarding path and verify full activation KPI improvement.

**Deliverables:**
- `.planning/codebase/OPERATOR-ONBOARDING-RUNBOOK.md` — Step-by-step guide (role setup, perm review, first task, recovery)
- `app/(markos)/onboarding/operator/page.tsx` — First-run wizard (role selection → perm accept → task walkthrough)
- Integration: Fresh operator session triggers wizard; wizard completion assigns role
- **E2E Test:** test/e2e/operator-activation.test.js (full flow: operator login → onboarding wizard → first task execution → evidence review)
- **Telemetry:** Emit `operator_activation_complete` event with T1 metrics (time_to_first_task, evidence_rate, self_service_ratio)
- **KPI validation:** Report final T1 vs T0 baseline (target: T1 time ≤5 min, evidence ≥95%, self-service ≥85%, coverage 100%)

**Success Criteria:**
- Onboarding wizard completes without error
- New operator can execute first task without manual support
- E2E test passes in CI
- KPI telemetry shows ≥70% improvement vs T0 baseline
- Runbook is usable and complete

---

## 4. Out of Scope (Locked)

- Net-new channel strategy or campaign framework redesign (defer to v3.2)
- Major MIR/MSP schema redesign unrelated to execution surface
- Replacing Supabase or Upstash Vector providers (defer to v4.0)
- Full rebrand-only work with no operational impact
- Hosted multi-tenant isolation (defer to v3.2)

---

## 5. Key Risks & Controls

| Risk | Control | Owner |
|------|---------|-------|
| Scope explosion from API parity attempt | Phase 45 flow freeze; only mapped flows in v3.1.0 | Phase 45 lead |
| Contract ownership scattered across legacy handlers | Phase 45 audit + explicit mapping; Phase 47 validates coverage | Phase 47 lead |
| Hidden operational edge cases in rollback | Phase 49 dedicated rollback testing; real-world scenarios in fixtures | Phase 49 lead |
| Operator UI complexity overload | Phase 46 MVP scope lock; evidence/guardrails added in Phase 49 | Phase 46 lead |
| KPI baseline not captured | Phase 45 start: instrument telemetry before any UI changes | Phase 45 lead |

---

## 6. Traceability (Filled by Roadmapper)

| REQ-ID | Phase | Pillar | Description | Status |
|--------|-------|--------|-------------|--------|
| **OPS-01** | 46 | Task UI | Live task graph showing current state, queued actions, completion path | Mapped to Phase 46 SC1 |
| **OPS-02** | 46 | Task UI | Step-by-step state transitions (start → in-progress → complete) | Mapped to Phase 46 SC2 |
| **OPS-03** | 46 | Task UI | Approval checkpoint blocking execution until human decision recorded | Mapped to Phase 46 SC3 |
| **OPS-04** | 46 | Task UI | Retry failed step with optional input mutation and attempt logging | Mapped to Phase 46 SC4 |
| **OPS-05** | 46 | Task UI | Evidence panel (inputs, outputs, logs, timestamps, actor ID) | Mapped to Phase 46 SC5 |
| **OPS-06** | 49 | Hardening | Inline guardrails before risky actions (migrations, rollbacks, bulk ops) | Mapped to Phase 49 Inline Guardrails |
| **API-01** | 45 | API Coverage | Every production flow mapped to versioned contract(s) | Mapped to Phase 45 SC2 |
| **API-02** | 47 | API Coverage | Versioned OpenAPI contracts for all flows in codebase | Mapped to Phase 47 SC1–SC4 |
| **API-03** | 47 | API Coverage | Auto-generated OpenAPI spec committed to repo | Mapped to Phase 47 SC3–SC5 |
| **API-04** | 48 | API Coverage | Contract test suite enforces request/response shape and lifecycle | Mapped to Phase 48 SC1–SC4 |
| **CONTRACT-01** | 47 | API Contracts | API versioning policy (SemVer + deprecation + compat guarantees) | Mapped to Phase 47 SC3 |
| **CONTRACT-02** | 48 | API Contracts | Backward compatibility enforced (v1 clients work on v2 endpoints) | Mapped to Phase 48 SC3 |
| **RBAC-01** | 49 | Hardening | Role-based access control at UI and API; unauthorized blocked | Mapped to Phase 49 SC1 |
| **RBAC-02** | 49 | Hardening | Operator sees assigned role and permissions inline in UI | Mapped to Phase 49 SC2 |
| **HARD-01** | 49 | Hardening | Preflight checks prevent unsafe state transitions in migrations | Mapped to Phase 49 SC3 |
| **HARD-02** | 49 | Hardening | Rollback endpoint exists; restores pre-operation state; idempotent | Mapped to Phase 49 SC4 |
| **HARD-03** | 49 | Hardening | Health diagnostics surface operator/admin view (30s refresh) | Mapped to Phase 49 SC5 |
| **ONBOARD-01** | 50 | Enablement | Operator onboarding path documented and executable without support | Mapped to Phase 50 SC1–SC3 |
| **ONBOARD-02** | 50 | Enablement | First-run wizard guides operator through role setup, perms, first task | Mapped to Phase 50 SC1 |

**Coverage Verification:**
- **Total Requirements:** 19
- **Mapped to Phases:** 19 (100%)
- **Orphaned Requirements:** 0
- **Phase 45:** 1 requirement (API-01)
- **Phase 46:** 5 requirements (OPS-01–OPS-05)
- **Phase 47:** 3 requirements (API-02, API-03, CONTRACT-01)
- **Phase 48:** 2 requirements (API-04, CONTRACT-02)
- **Phase 49:** 6 requirements (OPS-06, RBAC-01, RBAC-02, HARD-01, HARD-02, HARD-03)
- **Phase 50:** 2 requirements (ONBOARD-01, ONBOARD-02)

**Roadmap Status:** ✅ Locked 2026-04-02 | See `.planning/v3.1.0-ROADMAP.md` for detailed phase breakdown

---

## 7. Metadata

**Requirements Version:** 1.0  
**Created:** 2026-04-02  
**Last Updated:** 2026-04-02  
**Status:** Locked for v3.1.0. Ready for phase planning and roadmap generation.
