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

## Deferred requirements (v4+)

- AGTX-01: Fully autonomous campaign publishing modes with configurable risk policies.
- CRMX-01: Full CRM layer for AI and human operator relationship management.
- ATTX-01: Advanced attribution and MMM decisioning engine.
- INBX-01: Native social and inbox execution layer.

## Out of scope for v3

| Feature | Reason |
|---------|--------|
| Autonomous publishing without human approval path | Violates enterprise control and brand safety baseline |
| Full cross-channel inbox product | Expands platform scope beyond v3 delivery objective |
| Unlimited tenant-level customization beyond guarded white-label controls | High operational complexity and support risk |

## Traceability

| Requirement | Phase | Status |
|------------|-------|--------|
| TEN-01 | 07 | Planned |
| TEN-02 | 07 | Planned |
| TEN-03 | 07 | Planned |
| TEN-04 | 07 | Planned |
| IAM-01 | 07 | Planned |
| IAM-02 | 07 | Planned |
| IAM-03 | 07/09 | Planned |
| IAM-04 | 10 | Planned |
| WL-01 | 08 | Planned |
| WL-02 | 08 | Planned |
| WL-03 | 08 | Planned |
| WL-04 | 08 | Planned |
| AGT-01 | 09 | Planned |
| AGT-02 | 09 | Planned |
| AGT-03 | 09 | Planned |
| AGT-04 | 09 | Planned |
| MIR-01 | 09 | Planned |
| MIR-02 | 09 | Planned |
| MIR-03 | 09 | Planned |
| MIR-04 | 09 | Planned |
| BIL-01 | 10 | Planned |
| BIL-02 | 10 | Planned |
| BIL-03 | 10 | Planned |
| BIL-04 | 10 | Planned |
| SEC-01 | 10 | Planned |
| SEC-02 | 10 | Planned |
| SEC-03 | 10 | Planned |
| OPS-01 | 10 | Planned |
| OPS-02 | 10 | Planned |
