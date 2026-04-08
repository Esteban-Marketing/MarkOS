# Requirements: MarkOS v3

Defined: 2026-04-02
Priority profile: Enterprise readiness

## v3 requirements

### Multi-tenant foundation

- [ ] TEN-01: Every tenant-scoped record includes tenant_id and is protected by RLS policies.
- [ ] TEN-02: Tenant context is propagated through UI, API, background jobs, and agent runs.
- [ ] TEN-03: Cross-tenant access attempts are denied and logged as security events.
- [ ] TEN-04: Tenant-level quotas and rate limits are enforceable per plan tier.

### Identity and authorization

- [ ] IAM-01: Users can belong to one or more tenants with explicit role assignment.
- [ ] IAM-02: Roles enforce permission boundaries for owner, tenant-admin, manager, contributor, reviewer, billing-admin, and readonly.
- [ ] IAM-03: Approval actions for MarkOS plans require authorized reviewer roles and immutable decision logs.
- [ ] IAM-04: Enterprise tenants can enable SSO/SAML readiness path without breaking local auth tenants.

### White-label and tenant branding

- [ ] WL-01: Tenants can configure logo, color tokens, and brand metadata for customer-facing surfaces.
- [ ] WL-02: Tenant notifications and transactional templates render with tenant branding.
- [ ] WL-03: Tenant custom domain onboarding supports verification and safe fallback routing.
- [ ] WL-04: White-label settings are versioned and rollback-capable.

### Agentic MarkOS framework

- [ ] AGT-01: Agent runs are tenant-bound and consume tenant-approved context only.
- [ ] AGT-02: Agent workflows support deterministic state transitions, retries, and timeout handling.
- [ ] AGT-03: Human approval gates exist before externally visible high-impact actions.
- [ ] AGT-04: Agent run artifacts include model, prompt version, tool events, latency, cost, and outcome.

### MIR and MSP strategy system

- [ ] MIR-01: MIR Gate 1 entities initialize per project from onboarding and order context.
- [ ] MIR-02: MSP discipline activation derives from MIR and purchased service context.
- [ ] MIR-03: Critical client edits produce update reports and versioned regeneration records.
- [ ] MIR-04: Historical plan versions remain append-only and queryable.

### Billing and metering

- [ ] BIL-01: Subscriptions support monthly and annual plans with tenant entitlements.
- [ ] BIL-02: Usage metering tracks token usage, agent runs, storage, and overage units per tenant.
- [ ] BIL-03: Invoice generation and reconciliation map metering events to billable line items.
- [ ] BIL-04: Billing failures trigger dunning workflow and entitlement-safe degradation.

### Security, compliance, and operations

- [ ] SEC-01: Audit logs capture authentication, authorization, approvals, billing, and tenant configuration changes.
- [ ] SEC-02: Data retention and deletion policies support GDPR-aligned deletion requests.
- [ ] SEC-03: Encryption in transit and at rest is enforced for tenant data paths.
- [ ] OPS-01: Platform exposes SLO-backed monitoring for API, queue, agent, and billing subsystems.
- [ ] OPS-02: Incident response runbooks include tenant-aware triage and communication workflows.

## Planned next milestone (v3.3.0)

CRMX-01 is promoted from the deferred bucket into the next active milestone and decomposed into execution-grade requirements for Revenue CRM and Customer Intelligence Core.

- [ ] CRM-01: Contact, company, deal, account, and customer records exist as first-class tenant-safe entities with dedupe and merge rules.
- [ ] CRM-02: Every CRM record exposes a unified timeline combining pageviews, key interactions, campaign touches, stage changes, tasks, notes, agent actions, outbound delivery events, and attribution updates.
- [ ] CRM-03: Pipelines support custom objects and custom stages with Kanban, table, detail, timeline, calendar, and forecast or funnel views.
- [ ] CRM-04: The system computes next-best action per lead, deal, and account using recency, stage, SLA risk, intent score, and open tasks while remaining approval-aware.
- [ ] CRM-05: Resend email, Twilio SMS, and Twilio WhatsApp are native execution channels for this milestone.
- [ ] CRM-06: Human and AI agents can create tasks, draft outreach, update stages, append notes, and generate summaries with immutable audit trails for AI actions.
- [ ] TRK-01: PostHog proxy tracking is mandatory for all first-party web surfaces feeding CRM activity.
- [ ] TRK-02: Ads and affiliate traffic use a dedicated tracking subdomain and server-side enrichment path to preserve attribution where technically feasible.
- [ ] TRK-03: Website interaction capture includes page-level and element-level telemetry sufficient to reconstruct CRM timelines.
- [ ] TRK-04: Identity stitching links anonymous sessions to known contacts and accounts while preserving pre-conversion history.
- [ ] ATT-01: Multi-touch attribution is operationally available at the CRM layer for contact, deal, and campaign reporting.
- [ ] AI-CRM-01: AI copilots can generate summaries, rationale, recommendations, risk flags, and draft outreach from CRM context.
- [ ] AI-CRM-02: Role-aware agent workflows can execute follow-up sequences, task creation, enrichment, and reporting with policy gates before externally visible actions.
- [ ] REP-01: Operators can view pipeline health, conversion, attribution, SLA risk, and agent productivity without leaving the CRM workspace.

## Deferred requirements (v4+)

- AGTX-01: Fully autonomous campaign publishing modes with configurable risk policies.
- ATTX-01: Advanced attribution and MMM decisioning engine.
- INBX-01: Native social and inbox execution layer.

## Out of scope for v3

| Feature | Reason |
|---------|--------|
| Autonomous publishing without human approval path | Violates enterprise control and brand safety baseline |
| Full cross-channel inbox product | Expands platform scope beyond v3 delivery objective |
| Unlimited tenant-level customization beyond guarded white-label controls | High operational complexity and support risk |

## Traceability

Status vocabulary: `Satisfied` means the mapped live phase has closed the requirement in current repo evidence. `Partial` means implementation is present but live checks, explicit proof, or requirement-specific closure is still incomplete.

| Requirement | Project phase | Live phase | Status | Notes |
|------------|---------------|------------|--------|-------|
| TEN-01 | 07 | 51 | Satisfied | Live Phase 51 verification marks TEN-01 passed. |
| TEN-02 | 07 | 51 | Satisfied | Live Phase 51 verification marks TEN-02 passed. |
| TEN-03 | 07 | 51 | Satisfied | Live Phase 51 verification marks TEN-03 passed. |
| TEN-04 | 07 | 51/54/55 | Satisfied | Phase 55 closes tenant quotas with direct evidence in `55-01-SUMMARY.md` and `55-VALIDATION.md`, including the named submit project-cap seam and exact quota deny vocabulary. |
| IAM-01 | 07 | 51 | Satisfied | Live Phase 51 verification marks IAM-01 passed. |
| IAM-02 | 07 | 51 | Satisfied | Live Phase 51 verification marks IAM-02 passed. |
| IAM-03 | 07/09 | 53 | Satisfied | Live Phase 53 verification closes reviewer authorization and immutable decision logs. |
| IAM-04 | 10 | 54 | Partial | Enterprise SSO role mapping is implemented, but real IdP callback validation is still open. |
| WL-01 | 08 | 52 | Partial | Branding surfaces are implemented, but Phase 52 still has live verification pending. |
| WL-02 | 08 | 52 | Partial | Branded notifications and plugin UI are verified in automation, pending live Phase 52 checks. |
| WL-03 | 08 | 52 | Partial | Domain routing and fallback are automated-green, pending live Phase 52 checks. |
| WL-04 | 08 | 52 | Partial | Rollback auditability is implemented, pending live Phase 52 closeout. |
| AGT-01 | 09 | 53 | Satisfied | Live Phase 53 verification closes tenant-bound runs and tenant-approved context use. |
| AGT-02 | 09 | 53 | Satisfied | Live Phase 53 verification closes deterministic transitions, retries, and timeout-safe lifecycle behavior. |
| AGT-03 | 09 | 53 | Satisfied | Live Phase 53 verification closes human approval gating for high-impact actions. |
| AGT-04 | 09 | 53 | Satisfied | Live Phase 53 verification closes run artifacts, telemetry, latency, cost, and outcome capture. |
| MIR-01 | 09 | 53 | Satisfied | Live Phase 53 verification closes MIR Gate 1 initialization. |
| MIR-02 | 09 | 53 | Satisfied | Live Phase 53 verification closes MSP activation from MIR and service context. |
| MIR-03 | 09 | 53 | Satisfied | Live Phase 53 verification closes rationale-gated critical edits and regeneration records. |
| MIR-04 | 09 | 53 | Satisfied | Live Phase 53 verification closes append-only, queryable historical plan versions. |
| BIL-01 | 10 | 54 | Partial | Entitlement snapshots and plan-bound enforcement are implemented, but live billing-surface review is still open. |
| BIL-02 | 10 | 54 | Satisfied | Live Phase 54 verification closes tenant usage metering and normalized billing lineage. |
| BIL-03 | 10 | 54 | Satisfied | Live Phase 54 verification closes invoice reconciliation and ledger-derived line items. |
| BIL-04 | 10 | 54/55 | Satisfied | Phase 55 closes billing-failure recovery with direct evidence in `55-02-SUMMARY.md` and `55-VALIDATION.md`, including hold history, release evidence, and restored active snapshots. |
| SEC-01 | 10 | 54/56 | Satisfied | Phase 56 closes privileged-action audit coverage with direct evidence in `56-01-SUMMARY.md` and `56-VALIDATION.md`, including auth and authz, approval, billing administration, and tenant-configuration action families. |
| SEC-02 | 10 | 54/56 | Satisfied | Phase 56 closes GDPR-aligned deletion workflow proof with direct evidence in `56-02-SUMMARY.md` and `56-VALIDATION.md`, including request scope, export-before-delete checkpoint, action result, and evidence reference. |
| SEC-03 | 10 | 31/54/56 | Satisfied | Phase 56 closes encryption proof with direct evidence in `56-03-ENCRYPTION-EVIDENCE.md` and `56-VALIDATION.md`, naming in-transit and at-rest trust boundaries plus the operator-key encryption seam. |
| OPS-01 | 10 | 31/51/53/54/55/57 | Satisfied | Phase 57 closes unified subsystem observability with direct evidence in `57-01-OBSERVABILITY-INVENTORY.md`, `57-01-SUMMARY.md`, and `57-VALIDATION.md`. |
| OPS-02 | 10 | 31/54/55/57 | Satisfied | Phase 57 closes tenant-aware incident triage and communication workflow proof with direct evidence in `57-02-INCIDENT-WORKFLOW.md`, `57-03-SIMULATION.md`, `57-02-SUMMARY.md`, and `57-VALIDATION.md`. |
| CRM-01 | 11 | 58 | Planned | v3.3.0 milestone initialization promotes CRM to active roadmap scope starting with canonical schema and identity graph. |
| CRM-02 | 11 | 58 | Planned | Unified CRM timeline is planned as a first-class activity ledger rather than a reporting-only derivative. |
| CRM-03 | 11 | 60 | Planned | Flexible pipelines and required views are reserved for the multi-view CRM workspace phase. |
| CRM-04 | 11 | 61/63 | Planned | Next-best-action logic and approval-aware execution are planned for sales, success, and AI workflow phases. |
| CRM-05 | 11 | 62 | Planned | Native outbound coverage is limited to Resend, Twilio SMS, and Twilio WhatsApp in v3.3.0. |
| CRM-06 | 11 | 61/62/63 | Planned | Shared human and AI action model is planned with immutable audit evidence. |
| TRK-01 | 11 | 59 | Planned | Proxy-routed PostHog collection becomes mandatory for first-party CRM-feeding surfaces. |
| TRK-02 | 11 | 59 | Planned | Ads and affiliate tracking subdomain plus server-side enrichment are planned for attribution preservation. |
| TRK-03 | 11 | 59 | Planned | Page and element interaction capture is planned as CRM timeline evidence, not only analytics detail. |
| TRK-04 | 11 | 59 | Planned | Identity stitching will preserve pre-conversion history and attach it to CRM entities with lineage. |
| ATT-01 | 11 | 64 | Planned | CRM-native multi-touch attribution is planned for reporting closure, while MMM remains deferred. |
| AI-CRM-01 | 11 | 63 | Planned | CRM copilots are planned for grounded summaries, recommendations, and drafting. |
| AI-CRM-02 | 11 | 63 | Planned | Agent workflows will remain role-aware and approval-gated before external actions. |
| REP-01 | 11 | 60/61/64 | Planned | Revenue operators will get one CRM cockpit for pipeline, attribution, SLA risk, and agent productivity. |
