---
phase: 63
phase_name: AI Copilot and Agentic CRM Operations
discipline: crm-ai
type: standard
created: 2026-04-04
---

# Phase 63: AI Copilot and Agentic CRM Operations — Validation Strategy

**Purpose:** Maps Phase 63 deliverables to direct verification methods so execution can prove grounded summaries, policy-gated AI actions, governed playbooks, controlled oversight, replay safety, and strict phase boundaries against ungated autonomy or reporting sprawl.

## Phase Goal

Deliver a CRM-native copilot and agentic-operations layer where operators can generate grounded record and conversation summaries, inspect rationale and risk, convert recommendations into approval-aware action packages, and run bounded multi-step playbooks through the existing MarkOS run lifecycle without losing tenant safety, replay safety, or immutable AI-originated audit lineage.

## Deliverables and Verification Methods

| Deliverable | Verification Method | Responsible | Dimension |
|-------------|-------------------|-------------|-----------|
| CRM grounding contract exists and is deterministic | Grounding-contract tests, API tests, and contract inspection | AI | Grounding |
| Summaries, rationale, recommendations, and draft guidance are grounded in CRM-owned context | Copilot workspace tests, summary tests, and manual record review | AI / Human | Explainability |
| Bounded AI mutation families remain approval-aware and fail closed | Mutation-policy tests, approval-package tests, and forbidden-path assertions | AI | Governance |
| Recommendation-to-action packaging is real and reviewable | Packaging tests and approval-package UI inspection | AI / Human | Actionability |
| Multi-step playbooks run on the existing Phase 53 lifecycle | Playbook-run tests, replay-safety tests, and API inspection | AI | Workflow Integrity |
| Cross-tenant oversight remains explicit and role-scoped | Oversight tests and hosted UI review | AI / Human | Tenant Safety |
| AI-originated writes retain canonical CRM and run-linked lineage | Audit-lineage tests and timeline assertions | AI | Auditability |
| Phase 63 stops short of ungated outbound autonomy and Phase 64 reporting closure | Boundary tests and manual workflow review | AI / Human | Boundary Discipline |

## MIR Gate Requirements

Gate 1 (Identity) — files that must be populated before this phase:
- `Core_Strategy/01_COMPANY/PROFILE.md`
- `Core_Strategy/02_BRAND/VOICE-TONE.md`
- `Core_Strategy/02_BRAND/MESSAGING-FRAMEWORK.md`
- `Core_Strategy/02_BUSINESS/LEAN-CANVAS.md`
- `Core_Strategy/02_BUSINESS/JTBD-MATRIX.md`

Gate 2 (Execution) — files that must be populated:
- `Core_Strategy/06_TECH-STACK/TRACKING.md`
- `Core_Strategy/06_TECH-STACK/AUTOMATION.md`
- `Campaigns_Assets/05_CHANNELS/PAID-MEDIA.md`
- `Core_Strategy/09_ANALYTICS/KPI-FRAMEWORK.md`

## KPI Measurement Plan

| KPI | Baseline | Target | Data Source | Review Date |
|-----|---------|--------|------------|-------------|
| Grounding completeness for summaries and rationale | Not yet implemented | 100% of surfaced outputs declare grounding source classes used | Grounding and summary tests | Phase 63 execution closeout |
| Approval compliance for execution-capable AI actions | Not yet implemented | 100% | Mutation-policy, approval-package, and playbook tests | Phase 63 execution closeout |
| Duplicate durable effects under retry | Not yet implemented | 0 | Replay-safety tests | Phase 63 execution closeout |
| Recommendation-to-package conversion path coverage | Not yet implemented | All actionable recommendation families are packageable | Packaging tests and route inspection | Phase 63 execution closeout |
| Cross-tenant silent mutation leakage | Not yet implemented | 0 | Oversight and tenant-isolation tests | Phase 63 execution closeout |
| AI audit completeness for durable writes | Not yet implemented | 100% | Audit-lineage and timeline assertions | Phase 63 execution closeout |

## Human Testing Items

Steps that require hosted UI access or visual review:
1. Open the CRM copilot workspace in a hosted tenant session and confirm summaries, rationale, and recommendation packages remain inside the MarkOS CRM shell.
2. Review one conversation-summary workflow and confirm the UI exposes the CRM and conversation evidence used rather than showing unsupported freeform prose.
3. Review one approval package for task creation or safe record mutation and confirm the proposed changes, approval state, and run linkage are visible before commit.
4. Open the playbook review surface as a central-operator-approved role and confirm cross-tenant context is explicit, narrow, and approval-scoped.

## Automated Checks

Verifiable via file read or CLI:
- `node --test test/crm-ai/crm-copilot-grounding.test.js test/crm-ai/crm-agent-mutation-policy.test.js test/tenant-auth/crm-copilot-tenant-isolation.test.js`
- `node --test test/crm-ai/crm-copilot-workspace.test.js test/crm-ai/crm-recommendation-packaging.test.js test/crm-ai/crm-conversation-summary.test.js`
- `node --test test/crm-ai/crm-playbook-run-lifecycle.test.js test/crm-ai/crm-playbook-replay-safety.test.js test/crm-ai/crm-cross-tenant-oversight.test.js test/crm-ai/crm-ai-audit-lineage.test.js`
- `get_errors` on `63-01-PLAN.md`, `63-02-PLAN.md`, `63-03-PLAN.md`, `63-VALIDATION.md`, and `63-PLAN-VERIFY.md`

## Exit Conditions

Phase 63 is only considered complete when:

1. Record and conversation summaries, rationale, risk, and draft guidance are grounded in canonical CRM-owned context.
2. Every execution-capable AI action is bounded, approval-aware, and fail-closed when policy or approval state is missing.
3. Recommendation follow-through can create reviewable action packages for tasks, notes, enrichments, and safe owner or stage changes.
4. Multi-step playbooks run through the existing shared lifecycle and do not duplicate durable side effects under retries.
5. Cross-tenant oversight remains explicit, tenant-attributed, and approval-scoped.
6. No ungated outbound send, sequence enrollment, detached AI console, or Phase 64 reporting-cockpit behavior exists in Phase 63.

---
Phase 63 Validation Strategy created 2026-04-04.
