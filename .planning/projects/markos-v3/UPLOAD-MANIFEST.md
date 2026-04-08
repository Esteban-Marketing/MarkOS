# Upload Manifest: MarkOS v3 LLM Handoff

## Required upload order

Upload in this exact order to reduce context ambiguity.

1. `README.md`
2. `PROJECT.md`
3. `REQUIREMENTS.md`
4. `CLOSURE-MATRIX.md`
5. `ROADMAP.md`
6. `ARCHITECTURE.md`
7. `../milestones/v3.1.0-GAP-REMEDIATION-PLAN.md`
8. `../milestones/v3.1.0-LIVE-CHECKLIST.md`
9. `../milestones/v3.1.0-LIVE-CHECK-LOG-TEMPLATE.md`
10. `decisions/ADR-001-tenant-isolation.md`
11. `decisions/ADR-002-authorization-model.md`
12. `decisions/ADR-003-saas-deployment.md`
13. `decisions/ADR-004-llm-provider-abstraction.md`
14. `technical-specs/TENANT-ISOLATION.md`
15. `technical-specs/AUTHORIZATION-MODEL.md`
16. `technical-specs/MARKOS-AGENT-FRAMEWORK.md`
17. `technical-specs/MIR-MSP-SCHEMA.md`
18. `technical-specs/BILLING-METERING.md`
19. `technical-specs/OBSERVABILITY-RUNBOOK.md`
20. `technical-specs/SECURITY-COMPLIANCE.md`
21. `prompts/PROMPT-PACKAGE-USAGE.md`
22. `prompts/MASTER-IMPLEMENTATION-PROMPT.md`
23. Remaining role prompts in `prompts/`
24. Phase starter docs in `phases/`
25. Checklists in `checklists/`

## Remediation addendum

If the consumer is working from the live repo state rather than the original clean-room v3 package, include the remediation artifacts above immediately after the core docs. They define the remaining partial requirement set and the approved follow-up execution path.

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
