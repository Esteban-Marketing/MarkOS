# Upload Manifest: MarkOS v3 LLM Handoff

## Required upload order

Upload in this exact order to reduce context ambiguity.

1. `README.md`
2. `PROJECT.md`
3. `REQUIREMENTS.md`
4. `ROADMAP.md`
5. `ARCHITECTURE.md`
6. `decisions/ADR-001-tenant-isolation.md`
7. `decisions/ADR-002-authorization-model.md`
8. `decisions/ADR-003-saas-deployment.md`
9. `decisions/ADR-004-llm-provider-abstraction.md`
10. `technical-specs/TENANT-ISOLATION.md`
11. `technical-specs/AUTHORIZATION-MODEL.md`
12. `technical-specs/MARKOS-AGENT-FRAMEWORK.md`
13. `technical-specs/MIR-MSP-SCHEMA.md`
14. `technical-specs/BILLING-METERING.md`
15. `technical-specs/OBSERVABILITY-RUNBOOK.md`
16. `technical-specs/SECURITY-COMPLIANCE.md`
17. `prompts/PROMPT-PACKAGE-USAGE.md`
18. `prompts/MASTER-IMPLEMENTATION-PROMPT.md`
19. Remaining role prompts in `prompts/`
20. Phase starter docs in `phases/`
21. Checklists in `checklists/`

## Prompt invocation order

Fast path (single prompt):
1. Run `prompts/MARKOS-V3-MEGA-PROMPT.md` after uploading core and technical docs.

Orchestration path (multi prompt):
1. Run `prompts/MASTER-IMPLEMENTATION-PROMPT.md` first.
2. Run role prompts as focused passes:
   - Architect
   - Backend
   - Frontend
   - Agent orchestration
   - Security/compliance
   - QA/validation
3. Re-run master prompt for integration reconciliation.

## Minimum required outputs from external coding LLM

1. Architecture decision confirmation mapped to all ADRs.
2. Phase execution plan and task graph for phases 07-10.
3. Schema migration plan with tenant and audit controls.
4. API contract set and authorization matrix.
5. Agent workflow implementation contract and failure-handling strategy.
6. Billing and metering implementation contract.
7. Test strategy including unit, integration, E2E, and security tests.
8. Rollout and rollback strategy.

## Refusal conditions

Reject output if any of these are missing:
- Explicit tenant isolation proof strategy
- Human approval gates on high-impact actions
- Usage metering linked to billing
- Audit trail coverage for privileged actions
- Phase-to-requirement traceability
