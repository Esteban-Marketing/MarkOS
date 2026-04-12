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
**Last Updated:** 2026-04-03
**Status:** Locked for v3.1.0. Ready for phase planning and roadmap generation.

---

## 8. Milestone v3.2.0 Requirements — Plugin-First Architecture & Digital Agency v1

**Milestone:** v3.2.0 — Post-Unification Execution & Adoption
**Goal:** Deliver plugin-first architecture with the Digital Agency plugin as the first packaged plugin, enabling multi-tenant plugin enablement, capability-based access control, and white-label plugin rendering.
**Status:** Active. Unlocked 2026-04-03.

---

### Foundation Requirements (Phase 51 — Multi-Tenant Foundation and Authorization)

**TEN-01:** Tenant isolation is fully enforced at database layer (RLS) with no cross-tenant data leakage under any execution path.
- Phase: 51
- Success: Zero cross-tenant queries succeed in any test scenario

**TEN-02:** Tenant context is propagated deterministically from API entry to all downstream handlers, jobs, and agent runtimes.
- Phase: 51
- Success: Every request has a verifiable tenant_id in context throughout its lifecycle

**TEN-03:** Tenant membership and permission changes are effective immediately without cache race conditions.
- Phase: 51
- Success: Role changes propagate within 100ms; stale sessions are invalidated

**IAM-01:** IAM v3.2 role matrix (owner, tenant-admin, manager, contributor, viewer) is enforced at every API and UI mutation endpoint.
- Phase: 51
- Success: Unauthorized role attempts return 403; all roles are tested at boundaries

**IAM-02:** IAM role enforcement is backward-compatible with v3.1 RBAC baseline; no regression on Phase 45–50 behaviors.
- Phase: 51
- Success: All Phase 45–50 test contracts still pass with IAM v3.2 active

---

### Plugin Architecture Requirements (Phase 52 — Plugin Runtime and Digital Agency Plugin v1)

**PLG-DA-01:** MarkOS plugin runtime supports plugin registration, capability contracts, and tenant-level enablement controls.
- Input: Plugin manifest (PluginContract) with id, version, routes, capabilities, and hooks
- Output: Plugin routes registered in Express; capability enforcement middleware active; tenant config persisted in Supabase
- Success: Plugin disabled → routes return 404; plugin enabled → routes return 200 for authorized tenants
- Phase: 52

**PLG-DA-02:** Digital Agency plugin ships as the first plugin package with scoped routes, team workflows, approvals, campaign scheduling, and role policy overlays.
- Input: PLG-DA-01 plugin runtime active; Phase 51 tenant context + IAM v3.2 in place
- Output: Four DA routes (dashboard, drafts, campaign assemble, campaign publish) live under `/plugins/digital-agency/`
- Success: Full DA workflow (draft → approve → campaign assemble → publish → telemetry) completes end-to-end for authorized tenant
- Phase: 52

---

## 9. Milestone v3.3.0 Requirements — Revenue CRM and Customer Intelligence Core

**Milestone:** v3.3.0 — Revenue CRM and Customer Intelligence Core
**Goal:** Make MarkOS the operational system of record for relationship state, pipeline progression, next-best action, outbound execution, and revenue reporting while using PostHog as the behavioral analytics source feeding CRM timelines and attribution.
**Status:** Active. Locked 2026-04-04 for roadmap initialization.

---

### Pillar 1: CRM Domain Model and Timeline Truth

**CRM-01:** Contact, company, deal, account, and customer records exist as first-class tenant-safe entities with dedupe, merge, and history-safe update rules.
- Phase: 58
- Success: Canonical entities, merge decisions, and immutable audit history exist for all CRM object mutations

**CRM-02:** Every CRM record exposes a unified timeline that combines pageviews, form events, campaign touches, stage changes, tasks, notes, agent actions, outbound delivery events, and attribution updates.
- Phase: 58
- Success: A single record query can reconstruct meaningful lifecycle history without joining across ad hoc operational tables

---

### Pillar 2: Behavioral Tracking and Identity Stitching

**TRK-01:** PostHog proxy tracking is mandatory for all first-party web surfaces that feed CRM activity timelines.
- Phase: 59
- Success: All supported first-party surfaces emit proxy-routed events that can be linked back to CRM activity records

**TRK-02:** Ads and affiliate traffic use a dedicated tracking subdomain and server-side enrichment path to preserve attribution through blockers and privacy filtering where technically feasible.
- Phase: 59
- Success: Campaign traffic arriving through supported tracked links retains source attribution at the CRM layer with explicit fallback semantics

**TRK-03:** Website interaction capture includes page-level and element-level telemetry sufficient to reconstruct meaningful visitor, contact, and account timelines.
- Phase: 59
- Success: Operators can inspect major page and key element interactions from CRM record detail views, not only aggregate funnels

**TRK-04:** Identity stitching links anonymous sessions to known contacts and accounts using approved identity resolution rules while preserving pre-conversion history.
- Phase: 59
- Success: A contact conversion event can attach prior anonymous activity to the correct CRM timeline with explicit confidence and merge lineage

---

### Pillar 3: Pipeline and Revenue Execution Workspace

**CRM-03:** Pipelines support custom objects and custom stages, with mandatory views for Kanban, table, record detail, timeline, calendar, and forecast or funnel.
- Phase: 60
- Success: Operators can manage lead, deal, account, and customer-success workflows using the required views without leaving the CRM workspace

**CRM-04:** The system computes next-best action per lead, deal, and account using recency, stage, SLA risk, intent score, and open task context, while keeping execution approval-aware.
- Phase: 61
- Success: Every actionable record can surface a rationale-backed recommendation with auditable inputs and optional human approval gates

**CRM-05:** Resend email, Twilio SMS, and Twilio WhatsApp are native execution channels in this milestone; social publishing remains deferred to v4.
- Phase: 62
- Success: Outbound events from the three supported channels can be initiated, logged, and traced directly from CRM records and sequences

**CRM-06:** Human agents and AI agents can create tasks, draft outreach, update stages, append notes, and generate summaries, with immutable audit records for every AI-originated action.
- Phase: 61, 62, 63
- Success: All operator and AI-originated CRM mutations retain actor identity, policy context, and before/after evidence

---

### Pillar 4: AI-Assisted Intelligence and Reporting

**ATT-01:** Multi-touch attribution is operationally available at the CRM layer for contact, deal, and campaign reporting, even though full MMM remains deferred.

---

## 10. GSD Alignment Addendum

These narrow requirements track the decimal GSD alignment work inserted after Phase 64 without expanding the underlying CRM milestone scope.

**GSD-ALIGN-04:** The repository intentionally supports two root project-instruction files: `CLAUDE.md` for the localized `.claude` runtime and `copilot-instructions.md` for the shared `.github` GSD and Copilot surface.
- Phase: 64.2
- Success: One managed policy defines both root outputs and keeps them distinct from hidden framework-only artifacts.

**GSD-ALIGN-05:** Shared `.github` and localized `.claude` instruction surfaces stay aligned to the dual-root policy while preserving their ownership boundary.
- Phase: 64.2
- Success: Shared workflows and agents point at root `copilot-instructions.md`, localized workflows and agents point at root `CLAUDE.md`, and `.claude/skills/**` remain localized.

**GSD-ALIGN-06:** The aligned dual-root GSD system is verified end-to-end and any stale manifests or generated artifacts lagging the 64.2 policy are refreshed deterministically.
- Phase: 64.3
- Success: Repo-local proof covers dual-root generator behavior, root-versus-hidden artifact distinction, and deterministic refresh of stale `.github` and `.claude` GSD manifests or generated root instruction artifacts.

**GSD-ALIGN-07:** The final MarkOS customization boundary is documented so future work can distinguish canonical shared framework ownership, localized runtime ownership, and client override ownership.
- Phase: 64.3
- Success: Durable codebase documentation makes the ownership split between `.github`, `.claude`, and `.markos-local` explicit without reopening the 64.2 dual-root policy.
- Phase: 64
- Success: Operators can inspect campaign influence and revenue contribution from CRM-native reporting surfaces tied to deal and contact history

**AI-CRM-01:** AI copilots can generate summaries, stage rationale, next-step recommendations, risk flags, and draft outreach directly from CRM context.
- Phase: 63
- Success: Copilot outputs are grounded in tenant-approved CRM context and can be reviewed before action

**AI-CRM-02:** Role-aware agent workflows can execute follow-up sequences, task creation, enrichment, and reporting with policy gates before externally visible actions.
- Phase: 63
- Success: High-impact or externally visible automations are fail-closed behind policy and approval controls

**REP-01:** Operators can view pipeline health, conversion, attribution, SLA risk, and agent productivity in one place without leaving the CRM.
- Phase: 60, 61, 64
- Success: CRM workspace provides a coherent operational cockpit for revenue, service, and AI-assist reporting

---

## 10. v3.3.0 Acceptance Criteria

| Criterion | Target | Measurement |
|-----------|--------|-------------|
| CRM Entity Coverage | 100% of canonical CRM objects live | Contacts, companies, deals, accounts, customers, activities, tasks, timelines present in schema and APIs |
| Timeline Completeness | >=95% of key customer actions visible in unified timelines | Sampled records with page, campaign, stage, note, task, and outbound evidence |
| Tracking Reliability | 100% of supported first-party surfaces use proxy tracking | Route inventory vs. proxy-enabled surfaces |
| Identity Stitch Success | >=90% of eligible conversions attach prior anonymous activity | Stitched conversions / eligible identified conversions |
| Pipeline View Coverage | Required views available for active pipelines | Kanban, table, detail, timeline, calendar, forecast or funnel implemented |
| Native Outbound Coverage | 3 of 3 locked channels operational | Resend, Twilio SMS, Twilio WhatsApp live with telemetry return path |
| AI Action Auditability | 100% of AI-originated CRM mutations are immutable and attributable | AI mutations with actor, policy, and evidence / total AI mutations |
| Revenue Reporting Coverage | Contact, deal, and campaign attribution visible in CRM | Reporting surfaces verify ATT-01 and REP-01 |

---

**WL-01:** Tenants can configure logo, color tokens, and brand metadata for customer-facing surfaces.
- Input: Phase 37 brand-pack system
- Output: Plugin UI surfaces render with tenant's configured brand overrides
- Success: Plugin dashboard respects tenant brand-pack token overrides; changes visible within one request cycle
- Phase: 52 (plugin surface extension; Phase 37 delivered base system)

**WL-02:** Tenant notifications and transactional templates render with tenant branding.
- Input: Tenant context with brand-pack metadata (Phase 51 + Phase 37)
- Output: Plugin notification handlers apply brand overrides to templated responses
- Success: Plugin-triggered notifications display tenant logo, colors, and label
- Phase: 52

**WL-03:** Tenant custom domain onboarding supports verification and safe fallback routing.
- Input: Phase 51 tenant context (domain routing resolved to tenant_id via reverse proxy)
- Output: Plugin routes accessible from both shared domain and tenant custom domain
- Success: Plugin routes are domain-agnostic; tenant_id resolved regardless of request origin domain
- Phase: 52

**WL-04:** White-label settings are versioned and rollback-capable.
- Input: Phase 37 brand-pack version history
- Output: Plugin telemetry captures branding snapshot with each execution; rollback restores prior brand-pack automatically
- Success: Plugin telemetry audit trail includes brand-pack version used per execution
- Phase: 52

---

### Agentic Orchestration Requirements (Phase 53 — Agentic MarkOS Orchestration and MIR/MSP Intelligence)

**AGT-01:** Agent runs are tenant-bound and consume tenant-approved context only.
- Input: Phase 51 tenant context + IAM v3.2 roles; Phase 52 plugin telemetry hooks
- Output: Run envelope with tenant_id, actor_id, correlation_id, model policy, prompt version, tool policy profile
- Success: Agent run creation fails when tenant scope or policy metadata is missing
- Phase: 53

**AGT-02:** Agent workflows support deterministic state transitions, retries, and timeout handling.
- Input: Run envelope (AGT-01)
- Output: State machine enforcing requested → accepted → context_loaded → executing → awaiting_approval → approved/rejected → completed/failed → archived
- Success: Illegal state transitions are blocked and logged; duplicate queue redelivery does not create duplicate plan mutations
- Phase: 53

**AGT-03:** Human approval gates exist before externally visible high-impact actions.
- Input: IAM-03 authorized reviewer roles; agent run state machine (AGT-02)
- Output: High-impact action pathways pause at `awaiting_approval`, emit pending event, and resume only on authorized approval or explicit rejection
- Success: Approval bypass negative tests fail; approval decision is immutable and audit-logged
- Phase: 53

**AGT-04:** Agent run artifacts include model, prompt version, tool events, latency, cost, and outcome.
- Input: Run envelope + provider adapter (AGT-01, AGT-02)
- Output: Per-run telemetry record with all 6 fields frozen at run close
- Success: No run reaches `completed` state without a complete telemetry record; cost field maps to BIL-02 metering schema
- Phase: 53

**MIR-01:** MIR Gate 1 entities initialize per project from onboarding and order context.
- Input: Onboarding seed data + tenant context
- Output: All required MIR Gate 1 entities present before MSP planning starts; missing entity validation enforced
- Success: MSP discipline activation cannot start until MIR Gate 1 is complete
- Phase: 53

**MIR-02:** MSP discipline activation derives from MIR and purchased service context.
- Input: MIR Gate 1 complete (MIR-01); tenant order/subscription metadata
- Output: Discipline activation rules encoded with rationale; activation evidence stored per discipline
- Success: Discipline activation is explainable and traceable; unexpected deactivation blocked
- Phase: 53

**MIR-03:** Critical client edits produce update reports and versioned regeneration records.
- Input: Existing MIR entity + edit event
- Output: Update report (what changed, why, impact on dependent MSP entities); append-only regeneration record with rationale
- Success: Edit without rationale is rejected; downstream re-generation is triggered on gate-1 entity changes
- Phase: 53

**MIR-04:** Historical plan versions remain append-only and queryable.
- Input: Plan lifecycle events (create, approve, reject, archive)
- Output: Immutable version chain per plan with full history queryable by tenant and date range
- Success: Version deletion is blocked; rollback reads correct historical snapshot
- Phase: 53

**IAM-03:** Approval actions for MarkOS plans require authorized reviewer roles and immutable decision logs.
- Input: IAM v3.2 role model (Phase 51); agent run approval gate (AGT-03)
- Output: Approval or rejection action available only to roles with `plan:approve` permission; decision written to audit log
- Success: Non-reviewer role approval attempt is denied and logged; decision log cannot be mutated after write
- Phase: 53

---

### Billing, Metering, and Enterprise Governance Requirements (Phase 54 — Billing, Metering, and Enterprise Governance)

**BIL-01:** Subscription entitlements and billing state are enforced per tenant without breaking tenant isolation or plugin/runtime compatibility.
- Input: Tenant subscription record, plan tier metadata, Phase 52 plugin enablement hooks, Phase 51 tenant context
- Output: Canonical entitlement snapshot covering seats, projects, agent runs, token budgets, storage, and premium feature flags
- Success: Billing state changes are reflected deterministically at request time; out-of-entitlement actions fail closed with operator-visible reason codes; monthly and annual billing terms resolve through the same entitlement and ledger vocabulary even if advanced proration or dispute flows are deferred
- Phase: 54

**BIL-02:** Metering events from plugin and agent runtimes are validated, deduplicated, and aggregated into billing-period usage records.
- Input: Phase 52 plugin telemetry, Phase 53 run-close/provider-attempt telemetry, tenant billing period metadata
- Output: Normalized usage ledger keyed by tenant, billing period, correlation lineage, and billable unit
- Success: Duplicate delivery does not inflate usage; reconciliation can map every billed unit back to immutable source telemetry
- Phase: 54

**BIL-03:** Operators can reconcile invoice-grade usage, invoice line items, and billing-provider failures with entitlement-safe degradation.
- Input: Usage ledger (BIL-02), subscription entitlements (BIL-01), billing provider sync state
- Output: Invoice line items, reconciliation status surfaces, hold/dunning state, and safe degradation rules when billing sync fails
- Success: Billing failures never silently over-provision restricted features; reconciliation mismatches are surfaced and auditable before invoice close; tenant and operator surfaces expose monthly and annual term context from the same reconciled ledger
- Phase: 54

**IAM-04:** Enterprise identity federation extends IAM v3.2 with external role mapping and governed provisioning boundaries.
- Input: IAM v3.2 canonical roles from Phase 51, enterprise IdP claims/groups, tenant governance policy
- Output: Deterministic SSO/SAML role mapping, provisioning/deprovisioning rules, and immutable audit events for identity-bound privilege changes
- Success: External identity claims cannot escalate privilege beyond tenant policy; role mapping is explainable and test-covered for negative cases
- Phase: 54

**GOV-01:** Compliance-ready governance artifacts exist for billing, identity, and privileged operations.
- Input: Audit logs from Phases 51–53, security/compliance baseline, vendor/subprocessor metadata for AI and billing providers
- Output: Evidence map for privileged actions, retention/export controls, and operator-facing governance reports for access reviews and billing reconciliation
- Success: Operators can produce audit evidence for privileged billing and identity actions without manual log stitching
- Phase: 54

---

### Coverage Verification

| Req ID | Phase | Domain | Status |
|--------|-------|--------|--------|
| TEN-01 | 51 | Multi-Tenancy | ✅ Delivered 2026-04-03 |
| TEN-02 | 51 | Multi-Tenancy | ✅ Delivered 2026-04-03 |
| TEN-03 | 51 | Multi-Tenancy | ✅ Delivered 2026-04-03 |
| IAM-01 | 51 | Authorization | ✅ Delivered 2026-04-03 |
| IAM-02 | 51 | Authorization | ✅ Delivered 2026-04-03 |
| PLG-DA-01 | 52 | Plugin Runtime | ✅ Delivered 2026-04-03 |
| PLG-DA-02 | 52 | Plugin Runtime | ✅ Delivered 2026-04-03 |
| WL-01 | 52 | White-Label | ✅ Delivered 2026-04-03 |
| WL-02 | 52 | White-Label | ✅ Delivered 2026-04-03 |
| WL-03 | 52 | White-Label | ✅ Delivered 2026-04-03 |
| WL-04 | 52 | White-Label | ✅ Delivered 2026-04-03 |
| AGT-01 | 53 | Agent Runtime | ✅ Delivered 2026-04-03 |
| AGT-02 | 53 | Agent Runtime | ✅ Delivered 2026-04-03 |
| AGT-03 | 53 | Agent Runtime | ✅ Delivered 2026-04-03 |
| AGT-04 | 53 | Agent Runtime | ✅ Delivered 2026-04-03 |
| MIR-01 | 53 | MIR/MSP Lifecycle | ✅ Delivered 2026-04-03 |
| MIR-02 | 53 | MIR/MSP Lifecycle | ✅ Delivered 2026-04-03 |
| MIR-03 | 53 | MIR/MSP Lifecycle | ✅ Delivered 2026-04-03 |
| MIR-04 | 53 | MIR/MSP Lifecycle | ✅ Delivered 2026-04-03 |
| IAM-03 | 53 | Authorization | ✅ Delivered 2026-04-03 |
| BIL-01 | 54 | Billing | ✅ Delivered 2026-04-03 |
| BIL-02 | 54 | Billing | ✅ Delivered 2026-04-03 |
| BIL-03 | 54 | Billing | ✅ Delivered 2026-04-03 |
| IAM-04 | 54 | Authorization | ✅ Delivered 2026-04-03 |
| GOV-01 | 54 | Governance | ✅ Delivered 2026-04-03 |

---

## 9. Milestone v3.3.0 Requirements — Revenue CRM and Customer Intelligence Core

**Milestone:** v3.3.0 — Revenue CRM and Customer Intelligence Core
**Goal:** Make MarkOS the operational system of record for relationship state, pipeline progression, next-best action, outbound execution, and revenue reporting while using PostHog as the behavioral analytics source feeding CRM timelines and attribution.
**Status:** Active. Locked 2026-04-04 for roadmap initialization.

---

### Pillar 1: CRM Domain Model and Timeline Truth

**CRM-01:** Contact, company, deal, account, and customer records exist as first-class tenant-safe entities with dedupe, merge, and history-safe update rules.
- Phase: 58
- Success: Canonical entities, merge decisions, and immutable audit history exist for all CRM object mutations

**CRM-02:** Every CRM record exposes a unified timeline that combines pageviews, form events, campaign touches, stage changes, tasks, notes, agent actions, outbound delivery events, and attribution updates.
- Phase: 58
- Success: A single record query can reconstruct meaningful lifecycle history without joining across ad hoc operational tables

---

### Pillar 2: Behavioral Tracking and Identity Stitching

**TRK-01:** PostHog proxy tracking is mandatory for all first-party web surfaces that feed CRM activity timelines.
- Phase: 59
- Success: All supported first-party surfaces emit proxy-routed events that can be linked back to CRM activity records

**TRK-02:** Ads and affiliate traffic use a dedicated tracking subdomain and server-side enrichment path to preserve attribution through blockers and privacy filtering where technically feasible.
- Phase: 59
- Success: Campaign traffic arriving through supported tracked links retains source attribution at the CRM layer with explicit fallback semantics

**TRK-03:** Website interaction capture includes page-level and element-level telemetry sufficient to reconstruct meaningful visitor, contact, and account timelines.
- Phase: 59
- Success: Operators can inspect major page and key element interactions from CRM record detail views, not only aggregate funnels

**TRK-04:** Identity stitching links anonymous sessions to known contacts and accounts using approved identity resolution rules while preserving pre-conversion history.
- Phase: 59
- Success: A contact conversion event can attach prior anonymous activity to the correct CRM timeline with explicit confidence and merge lineage

---

### Pillar 3: Pipeline and Revenue Execution Workspace

**CRM-03:** Pipelines support custom objects and custom stages, with mandatory views for Kanban, table, record detail, timeline, calendar, and forecast or funnel.
- Phase: 60
- Success: Operators can manage lead, deal, account, and customer-success workflows using the required views without leaving the CRM workspace

**CRM-04:** The system computes next-best action per lead, deal, and account using recency, stage, SLA risk, intent score, and open task context, while keeping execution approval-aware.
- Phase: 61
- Success: Every actionable record can surface a rationale-backed recommendation with auditable inputs and optional human approval gates

**CRM-05:** Resend email, Twilio SMS, and Twilio WhatsApp are native execution channels in this milestone; social publishing remains deferred to v4.
- Phase: 62
- Success: Outbound events from the three supported channels can be initiated, logged, and traced directly from CRM records and sequences

**CRM-06:** Human agents and AI agents can create tasks, draft outreach, update stages, append notes, and generate summaries, with immutable audit records for every AI-originated action.
- Phase: 61, 62, 63
- Success: All operator and AI-originated CRM mutations retain actor identity, policy context, and before/after evidence

---

### Pillar 4: AI-Assisted Intelligence and Reporting

**ATT-01:** Multi-touch attribution is operationally available at the CRM layer for contact, deal, and campaign reporting, even though full MMM remains deferred.
- Phase: 64
- Success: Operators can inspect campaign influence and revenue contribution from CRM-native reporting surfaces tied to deal and contact history

**AI-CRM-01:** AI copilots can generate summaries, stage rationale, next-step recommendations, risk flags, and draft outreach directly from CRM context.
- Phase: 63
- Success: Copilot outputs are grounded in tenant-approved CRM context and can be reviewed before action

**AI-CRM-02:** Role-aware agent workflows can execute follow-up sequences, task creation, enrichment, and reporting with policy gates before externally visible actions.
- Phase: 63
- Success: High-impact or externally visible automations are fail-closed behind policy and approval controls

**REP-01:** Operators can view pipeline health, conversion, attribution, SLA risk, and agent productivity in one place without leaving the CRM.
- Phase: 60, 61, 64
- Success: CRM workspace provides a coherent operational cockpit for revenue, service, and AI-assist reporting

---

## 10. v3.3.0 Acceptance Criteria

| Criterion | Target | Measurement |
|-----------|--------|-------------|
| CRM Entity Coverage | 100% of canonical CRM objects live | Contacts, companies, deals, accounts, customers, activities, tasks, timelines present in schema and APIs |
| Timeline Completeness | >=95% of key customer actions visible in unified timelines | Sampled records with page, campaign, stage, note, task, and outbound evidence |
| Tracking Reliability | 100% of supported first-party surfaces use proxy tracking | Route inventory vs. proxy-enabled surfaces |
| Identity Stitch Success | >=90% of eligible conversions attach prior anonymous activity | Stitched conversions / eligible identified conversions |
| Pipeline View Coverage | Required views available for active pipelines | Kanban, table, detail, timeline, calendar, forecast or funnel implemented |
| Native Outbound Coverage | 3 of 3 locked channels operational | Resend, Twilio SMS, Twilio WhatsApp live with telemetry return path |
| AI Action Auditability | 100% of AI-originated CRM mutations are immutable and attributable | AI mutations with actor, policy, and evidence / total AI mutations |
| Revenue Reporting Coverage | Contact, deal, and campaign attribution visible in CRM | Reporting surfaces verify ATT-01 and REP-01 |

---

## 11. Tightened Phase Frame for v3.3.0

### Phase 58: CRM Canonical Schema and Identity Graph
**Goal:** Define tenant-safe CRM primitives, activity ledger foundations, custom fields, merge rules, and core APIs.
**Deliverables:** canonical CRM schema, tenant-safe APIs, merge or dedupe contracts, unified activity model, Phase 58 verification artifacts

### Phase 59: Behavioral Tracking and Identity Stitching
**Goal:** Wire proxy-based PostHog telemetry, ads and affiliate tracking subdomain flows, identity stitching, and CRM activity ingestion.
**Deliverables:** proxy tracking architecture, event taxonomy, element interaction contracts, stitching rules, tracking verification evidence

### Phase 60: Pipeline Engine and Multi-View Workspace
**Goal:** Deliver flexible pipelines with required views and stage automation hooks.
**Deliverables:** pipeline schema, custom stages, Kanban/table/detail/timeline/calendar/forecast or funnel views, phase verification artifacts

### Phase 61: Sales and Success Execution Workspace
**Goal:** Deliver lead, deal, account, and customer success workflow surfaces with next-best-action support.
**Deliverables:** execution hub, task queues, inbox-like activity center, recommendation engine, phase verification artifacts

### Phase 62: Native Outbound Execution
**Goal:** Add email, SMS, and WhatsApp execution with consent-safe telemetry return paths.
**Deliverables:** channel adapters, templates or sequences, delivery logging, consent controls, outbound verification artifacts

### Phase 63: AI Copilot and Agentic CRM Operations
**Goal:** Provide CRM copilots and approval-aware agent workflows grounded in CRM context.
**Deliverables:** summaries, draft generation, enrichment flows, policy-gated automations, AI audit verification artifacts

### Phase 64: Attribution, Reporting, and Verification Closure
**Goal:** Close the milestone with CRM-native attribution, reporting, live checks, and acceptance evidence.
**Deliverables:** attribution models, reporting cockpit, live verification logs, milestone closure package

---

## 12. Milestone v3.3.1 Requirements — Obsidian Mind Vault-First Pivot

**Milestone:** v3.3.1 — Obsidian Mind Vault-First Pivot
**Goal:** Replace the MIR/MSP-first MarkOS operating model with a vault-first knowledge system inspired by Obsidian Mind, making the local Obsidian vault the canonical source of context, workflows, memory, evidence, and operator support.
**Status:** Planned future milestone after Phase 66. Added to the live roadmap on 2026-04-11.

---

### Pillar 1: Vault-Native Knowledge Model

**VAULT-01:** MarkOS defines a canonical vault taxonomy for marketing strategy, execution, people, evidence, and operational memory that replaces MIR/MSP as the primary knowledge structure.
- Phase: 67
- Success: Fresh installs no longer depend on MIR/MSP-first scaffolding to become usable

**VAULT-02:** MIR and MSP stop being first-class canonical structures in the product architecture, public docs, and default bootstrap path.
- Phase: 67, 72
- Success: MIR/MSP are migration aliases or legacy compatibility surfaces only

**VAULT-03:** The new vault model supports Base-style views, dashboard-friendly metadata, and note-linking semantics needed for operational navigation.
- Phase: 67, 71
- Success: Operational views can be generated without relying on legacy MIR/MSP trees

### Pillar 2: Vault-First Bootstrap, Install, and Update

**BOOT-01:** `npx markos` bootstraps a usable vault-first MarkOS installation rather than cloning MIR/MSP-first protocol scaffolding as the primary path.
- Phase: 68
- Success: A new install lands in the canonical vault-ready state

**BOOT-02:** Obsidian becomes an explicit required dependency for the primary MarkOS operating model, with clear readiness messaging and failure handling.
- Phase: 68
- Success: Install flow clearly reports `ready`, `degraded`, or `blocked` against the new dependency contract

**BOOT-03:** QMD support remains optional and integrates as an enhancement, not a hard dependency.
- Phase: 68
- Success: MarkOS remains usable without QMD while advertising the richer path when present

**BOOT-04:** `npx markos update` preserves the vault-first contract and handles upgrades without reintroducing MIR/MSP as canonical surfaces.
- Phase: 68, 72
- Success: Updates preserve installed vault assets, migration state, and canonical docs

### Pillar 3: Vault-Native Onboarding and Legacy Migration

**MIG-01:** Existing `.markos-local/MIR` and `.markos-local/MSP` installs can be imported into the new vault with a one-way migration path.
- Phase: 67, 69
- Success: Legacy users can move into the new vault without requiring dual-write or long-lived sync

**MIG-02:** The onboarding UI, if retained, writes directly into the vault-native structure instead of publishing to `.markos-local/` MIR/MSP trees.
- Phase: 69
- Success: Guided onboarding populates the canonical vault destination

**MIG-03:** Migration and onboarding outcomes are explicit, operator-readable, and validated.
- Phase: 69
- Success: Operators can see what imported, what failed, and what still needs manual follow-through

### Pillar 4: Command, Hook, and Agent Surface Alignment

**FLOW-01:** Session lifecycle hooks follow an Obsidian Mind-native operating pattern for startup context, routing hints, markdown validation, compaction safety, and wrap-up behavior.
- Phase: 70
- Success: Session behavior is vault-first and durable across supported agent surfaces

**FLOW-02:** MarkOS prefers an Obsidian Mind-native command family and agent pattern, with marketing-specific overlays added where the upstream model does not cover marketing execution needs.
- Phase: 70
- Success: The primary workflow model is no longer MIR/MSP-first or legacy MarkOS-first

**FLOW-03:** Agent boot guidance and canonical docs point to the vault-first operating model rather than MIR/MSP-era assumptions.
- Phase: 70, 72
- Success: Agents start with the new knowledge model as the default mental model

### Pillar 5: Dashboards, Evidence, and Marketing Memory Graph

**GRAPH-01:** MarkOS provides a Home or dashboard experience and Base-style operational views aligned to the new vault model.
- Phase: 71
- Success: Operators can navigate active work, people, evidence, and priorities through the vault-native model

**GRAPH-02:** Marketing execution evidence, wins, reviews, and related performance history are represented inside the vault using graph-friendly note relationships.
- Phase: 71
- Success: Campaign and operator evidence accumulates without relying on disconnected external artifacts

**GRAPH-03:** Marketing-specific operational reporting works inside the vault-first model without reintroducing MIR/MSP as hidden canonical stores.
- Phase: 71
- Success: The vault itself is the durable operational memory substrate

### Pillar 6: Legacy Demotion and End-to-End Validation

**CUT-01:** MIR/MSP-era docs, scaffolds, and workflows are clearly marked legacy, migration-only, or removed from the canonical path.
- Phase: 72
- Success: New users are not routed into the old model accidentally

**CUT-02:** End-to-end validation covers fresh install, dependency readiness, onboarding-to-vault flow, legacy import, command lifecycle, and dashboard or evidence behavior.
- Phase: 72
- Success: The vault-first model is proven as the real primary operating path

---

## 13. Milestone v3.4.0 Requirements — Complete Branding Engine

**Milestone:** v3.4.0 — Complete Branding Engine
**Goal:** Deliver an end-to-end, tenant-safe branding engine that turns raw concept and pain-point inputs into deterministic strategy, identity, token, component-contract, and Next.js starter outputs on the canonical Tailwind v4 + shadcn/ui + Next.js stack.
**Status:** Active. Locked 2026-04-11 for roadmap initialization.

---

### Pillar 1: Brand Inputs and Strategy Foundation

**BRAND-INP-01:** Operators can capture structured brand concept inputs including audience pains, needs, expectations, and desired outcomes.
- Phase: 73
- Success: Input schema persists complete and validated concept records with explicit evidence fields per tenant

**BRAND-INP-02:** The engine normalizes raw brand input into a deterministic evidence graph usable by downstream strategy and identity stages.
- Phase: 73
- Success: Identical inputs produce stable normalized nodes and links across repeated runs

**BRAND-STRAT-01:** The engine generates a strategy artifact with positioning, value promise, differentiators, and messaging pillars mapped to source pain/need signals.
- Phase: 74
- Success: Every strategic claim includes source lineage back to input evidence nodes

**BRAND-STRAT-02:** Brand personality, tone boundaries, and channel messaging rules are explicit and role-consumable.
- Phase: 74
- Success: Strategist, content, and founder views expose consistent rules without contradictory channel guidance

### Pillar 2: Identity and Design-System Compilation

**BRAND-ID-01:** The engine produces deterministic visual identity artifacts including semantic color roles, typography hierarchy, and visual language constraints.
- Phase: 75
- Success: Repeated generation from the same strategy artifact yields stable identity outputs except explicitly marked stochastic fields

**BRAND-ID-02:** Identity outputs enforce accessibility-aware defaults (contrast/readability) before publish eligibility.
- Phase: 75
- Success: Accessibility checks pass for required semantic role pairs or block publish with explicit diagnostics

**BRAND-DS-01:** Strategy and identity outputs compile into a canonical token contract targeting Tailwind v4 and shadcn/ui usage patterns.
- Phase: 76
- Success: Generated token bundle can be consumed by branded app surfaces without manual token remapping

**BRAND-DS-02:** A component contract manifest defines required shadcn/ui components, variants, and interaction states tied to token semantics.
- Phase: 76
- Success: Manifest covers core product primitives and required states with deterministic mapping metadata

### Pillar 3: Implementation Starter, Handoffs, and Governance

**BRAND-NEXT-01:** The engine emits a Next.js starter descriptor with theme variables, component bindings, and scaffold-ready integration metadata.
- Phase: 77
- Success: Frontend engineers can apply starter outputs without reinterpreting brand rules

**BRAND-ROLE-01:** The system produces role-specific handoff packs for strategist, designer, founder/operator, frontend engineer, and content/marketing stakeholders.
- Phase: 77
- Success: Each role can execute its immediate next action from artifacts without additional clarification loops

**BRAND-GOV-01:** Branding artifacts are versioned as a single lineage bundle with publish, rollback, and drift-detection evidence.
- Phase: 78
- Success: Operators can promote or roll back brand versions safely with full traceability across strategy, identity, tokens, and component contracts

**BRAND-GOV-02:** Determinism, tenant isolation, and contract integrity checks are mandatory verification gates for milestone closure.
- Phase: 78
- Success: Verification suite proves stable regeneration, no cross-tenant leakage, and no contract breakages in canonical branding outputs

---

## 13.1 Out of Scope (v3.4.0)

| Feature | Reason |
|---------|--------|
| Fully autonomous brand generation with no human approval | Violates governance and quality-control requirements for this milestone |
| Automatic production deployment pipeline | Delivery automation is deferred; this milestone focuses on actionable artifact generation |
| Paid media execution automation | Belongs to campaign execution tracks, not branding engine core |
| CRM/outbound feature expansion unrelated to branding | Explicitly constrained to avoid scope bloat from v3.3 lanes |
| Full app replatform | Must remain additive to preserve existing architecture and delivery velocity |

---

## 13.2 Traceability Scaffold (to be filled by roadmapper)

| Requirement | Phase | Status |
|-------------|-------|--------|
| BRAND-INP-01 | Phase 73 | Complete |
| BRAND-INP-02 | Phase 73 | Complete |
| BRAND-STRAT-01 | Phase 74 | Complete |
| BRAND-STRAT-02 | Phase 83 | Complete |
| BRAND-ID-01 | Phase 75 | Complete |
| BRAND-ID-02 | Phase 82 | Complete |
| BRAND-DS-01 | Phase 76 | Complete |
| BRAND-DS-02 | Phase 76 | Complete |
| BRAND-NEXT-01 | Phase 77 | Complete |
| BRAND-ROLE-01 | Phase 77 | Complete |
| BRAND-GOV-01 | Phase 81 | Complete |
| BRAND-GOV-02 | Phase 82 | Complete |
