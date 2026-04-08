# MarkOS v3 Closure Matrix

Last updated: 2026-04-04
Status vocabulary:
- `Satisfied`: the mapped live phase has closed the requirement in current repo evidence.
- `Partial`: implementation exists, but live checks, explicit proof, or requirement-specific closure is still incomplete.
- `Missing`: no credible live implementation or evidence chain has been identified.

## Summary

- Satisfied: 22
- Partial: 9
- Missing: 0

## Requirement-by-requirement matrix

| ID | Domain | Project phase | Live phase | Status | Evidence basis | Closure needed |
|----|--------|---------------|------------|--------|----------------|----------------|
| TEN-01 | Multi-tenant foundation | 07 | 51 | Satisfied | Phase 51 verification marks tenant-scoped records and RLS protection as passed. | None. |
| TEN-02 | Multi-tenant foundation | 07 | 51 | Satisfied | Phase 51 verification marks tenant context propagation as passed. | None. |
| TEN-03 | Multi-tenant foundation | 07 | 51 | Satisfied | Phase 51 verification marks denied cross-tenant access handling as passed. | None. |
| TEN-04 | Multi-tenant foundation | 07 | 51/54/55 | Satisfied | Phase 55 closes quota-state enforcement with direct proof in `55-01-SUMMARY.md` and `55-VALIDATION.md`, including the named submit project-cap seam and exact deny vocabulary. | None. |
| IAM-01 | Identity and authorization | 07 | 51 | Satisfied | Phase 51 verification marks multi-tenant user membership and role assignment baseline as passed. | None. |
| IAM-02 | Identity and authorization | 07 | 51 | Satisfied | Phase 51 verification marks canonical role boundary enforcement as passed. | None. |
| IAM-03 | Identity and authorization | 07/09 | 53 | Satisfied | Phase 53 verification closes reviewer authorization and immutable decision logging. | None. |
| IAM-04 | Identity and authorization | 10 | 54 | Partial | Phase 54 verification closes SSO role mapping, but real enterprise IdP callback validation remains open. | Complete live SSO callback check. |
| WL-01 | White-label and tenant branding | 08 | 52 | Partial | Phase 52 verification closes branded surface implementation, but the phase remains `human_needed`. | Complete live plugin settings UI verification. |
| WL-02 | White-label and tenant branding | 08 | 52 | Partial | Phase 52 verification closes branded notifications and templates in automation. | Complete live plugin settings UI verification. |
| WL-03 | White-label and tenant branding | 08 | 52 | Partial | Phase 52 verification closes shared and custom-domain routing behavior in automation. | Complete live disable-gate verification after plugin shutdown. |
| WL-04 | White-label and tenant branding | 08 | 52 | Partial | Phase 52 verification closes rollback-capable brand version snapshots. | Clear remaining live Phase 52 checks. |
| AGT-01 | Agentic MarkOS framework | 09 | 53 | Satisfied | Phase 53 verification closes tenant-bound runs and tenant-approved context usage. | None. |
| AGT-02 | Agentic MarkOS framework | 09 | 53 | Satisfied | Phase 53 verification closes deterministic transitions, retries, and timeout-safe lifecycle control. | None. |
| AGT-03 | Agentic MarkOS framework | 09 | 53 | Satisfied | Phase 53 verification closes approval gates before high-impact actions. | None. |
| AGT-04 | Agentic MarkOS framework | 09 | 53 | Satisfied | Phase 53 verification closes model, prompt, tool event, latency, cost, and outcome capture. | None. |
| MIR-01 | MIR and MSP strategy system | 09 | 53 | Satisfied | Phase 53 verification closes MIR Gate 1 initialization from onboarding and order context. | None. |
| MIR-02 | MIR and MSP strategy system | 09 | 53 | Satisfied | Phase 53 verification closes MSP activation from MIR plus purchased-service context. | None. |
| MIR-03 | MIR and MSP strategy system | 09 | 53 | Satisfied | Phase 53 verification closes critical edit rationale and regeneration record behavior. | None. |
| MIR-04 | MIR and MSP strategy system | 09 | 53 | Satisfied | Phase 53 verification closes append-only, queryable version history. | None. |
| BIL-01 | Billing and metering | 10 | 54 | Partial | Phase 54 closes entitlement snapshots and runtime enforcement, but live tenant/operator billing review remains open. | Complete live billing UX review. |
| BIL-02 | Billing and metering | 10 | 54 | Satisfied | Phase 54 verification closes tenant usage metering and normalized lineage. | None. |
| BIL-03 | Billing and metering | 10 | 54 | Satisfied | Phase 54 verification closes invoice line items and reconciliation from MarkOS-owned ledger data. | None. |
| BIL-04 | Billing and metering | 10 | 54/55 | Satisfied | Phase 55 closes the failed-sync -> hold -> release -> restored-active lifecycle with direct evidence in `55-02-SUMMARY.md` and `55-VALIDATION.md`. | None. |
| SEC-01 | Security, compliance, and operations | 10 | 54/56 | Satisfied | Phase 56 closes privileged-action audit coverage with direct evidence in `56-01-SUMMARY.md` and `56-VALIDATION.md`, including auth and authz, approval, billing administration, and tenant-configuration action families. | None. |
| SEC-02 | Security, compliance, and operations | 10 | 54/56 | Satisfied | Phase 56 closes GDPR-aligned deletion workflow proof with direct evidence in `56-02-SUMMARY.md` and `56-VALIDATION.md`, including request scope, export-before-delete checkpoint, action result, and evidence reference. | None. |
| SEC-03 | Security, compliance, and operations | 10 | 31/54/56 | Satisfied | Phase 56 closes encryption proof with direct evidence in `56-03-ENCRYPTION-EVIDENCE.md` and `56-VALIDATION.md`, naming in-transit and at-rest trust boundaries plus the operator-key encryption seam. | None. |
| OPS-01 | Security, compliance, and operations | 10 | 31/51/53/54/55/57 | Satisfied | Phase 57 closes subsystem observability with direct evidence in `57-01-OBSERVABILITY-INVENTORY.md`, `57-01-SUMMARY.md`, and `57-VALIDATION.md`, naming API, queue-adjacent, agent, and billing seams as one control family. | None. |
| OPS-02 | Security, compliance, and operations | 10 | 31/54/55/57 | Satisfied | Phase 57 closes tenant-aware incident workflow proof with direct evidence in `57-02-INCIDENT-WORKFLOW.md`, `57-03-SIMULATION.md`, `57-02-SUMMARY.md`, and `57-VALIDATION.md`. | None. |
| ATT-01 | Revenue reporting | 11 | 64 | Partial | Phase 64 now ships deterministic CRM attribution, a reporting cockpit, a verification route, and closeout artifacts with direct evidence in `64-02-SUMMARY.md`, `64-03-SUMMARY.md`, `test/crm-reporting/crm-attribution-model.test.js`, and `test/crm-reporting/crm-verification-workflow.test.js`. | Execute v3.3 live reporting verification and record attribution drill-down evidence. |
| REP-01 | Revenue reporting | 11 | 60/61/64 | Partial | Earlier CRM phases closed operational workspace and execution context, while Phase 64 now adds the unified reporting cockpit, readiness surfaces, governed rollups, and closeout packaging. | Execute v3.3 live reporting verification and record cockpit and readiness evidence. |

## Missing-status note

No requirement is currently classified as `Missing`. The unresolved work is concentrated in requirements that are implemented but not yet fully closed by live verification or requirement-specific evidence.

## Primary evidence sources

- `.planning/phases/51-multi-tenant-foundation-and-authorization/51-VERIFICATION.md`
- `.planning/phases/52-plugin-runtime-and-digital-agency-plugin-v1/52-VERIFICATION.md`
- `.planning/phases/53-agentic-markos-orchestration-and-mir-msp-intelligence/53-VERIFICATION.md`
- `.planning/phases/54-billing-metering-and-enterprise-governance/54-VERIFICATION.md`
- `.planning/phases/55-tenant-quota-and-billing-failure-closure/55-01-SUMMARY.md`
- `.planning/phases/55-tenant-quota-and-billing-failure-closure/55-02-SUMMARY.md`
- `.planning/phases/55-tenant-quota-and-billing-failure-closure/55-VALIDATION.md`
- `.planning/phases/56-security-and-privacy-evidence-closure/56-01-SUMMARY.md`
- `.planning/phases/56-security-and-privacy-evidence-closure/56-02-SUMMARY.md`
- `.planning/phases/56-security-and-privacy-evidence-closure/56-03-ENCRYPTION-EVIDENCE.md`
- `.planning/phases/56-security-and-privacy-evidence-closure/56-VALIDATION.md`
- `.planning/phases/57-observability-and-incident-closure/57-01-OBSERVABILITY-INVENTORY.md`
- `.planning/phases/57-observability-and-incident-closure/57-02-INCIDENT-WORKFLOW.md`
- `.planning/phases/57-observability-and-incident-closure/57-03-SIMULATION.md`
- `.planning/phases/57-observability-and-incident-closure/57-VALIDATION.md`
- `.planning/projects/markos-v3/REQUIREMENTS.md`
- `.planning/projects/markos-v3/ROADMAP.md`
