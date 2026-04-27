# Phase 208 Context - Human Operating Interface

**Status:** Replanned 2026-04-27 into executable GSD docs after review findings on stub plans, ownership drift, missing validation, and unstable future-phase dependencies.

## Why this phase exists

MarkOS already has a shell, task surfaces, billing settings, MCP settings, governance pages, and workflow fragments. What it does not yet have is one human operating system for daily decisions. Phase 208 is where those scattered surfaces become one operator cockpit: Morning Brief, Task Board, Approval Inbox, Recovery Center, and Weekly Narrative.

This phase is not the evidence phase, not the connector phase, not the loop phase, and not the learning phase. It is the human interface layer that those later substrates will plug into.

## Canonical inputs

- `obsidian/work/incoming/10-HUMAN-INTERFACE-LAYER.md`
- `obsidian/reference/MarkOS v2 Operating Loop Spec.md`
- `.planning/REQUIREMENTS.md`
- `.planning/V4.0.0-PHASE-TEST-REQUIREMENTS-MATRIX.md`
- `.planning/V4.0.0-CODEBASE-VAULT-DEEP-AUDIT.md`
- `.planning/phases/205-pricing-engine-foundation-billing-readiness/205-RESEARCH.md`
- `.planning/phases/206-soc2-type1-foundation/206-RESEARCH.md`
- `.planning/phases/207-agentrun-v2-orchestration-substrate/207-RESEARCH.md`

## Ownership boundary

### Direct ownership

- `TASK-01..05`
- `QA-01..15`

### Integrates with, but does not re-own

- `PRC-01..09`, `BILL-02` from Phase 205 for pricing warnings, pricing placeholders, and approval posture
- `COMP-01` from Phase 206 for compliance-aware approvals and operator-visible governance risk
- `RUN-01..08` from Phase 207 for AgentRun lineage, task creation, failures, pause state, and operator work routing

### Future translation gates, not current dependencies

- Phase 209 will connect real `EvidenceMap` and evidence posture into approval, brief, and narrative surfaces
- Phase 210 will connect real connector recovery and `ConnectorInstall` state into the Recovery Center
- Phase 211 will connect real dispatch and measurement outcomes into the Weekly Narrative
- Phase 212 will connect real learning suggestions and performance logs into later narrative and work surfaces

## Existing implementation substrate to inspect

- `app/(markos)/layout-shell.tsx`
- `app/(markos)/page.tsx`
- `app/(markos)/operations/page.tsx`
- `app/(markos)/operations/tasks/*`
- `app/(markos)/settings/mcp/page.tsx`
- `app/(markos)/settings/billing/page-shell.tsx`
- `app/(markos)/admin/governance/page.tsx`
- `lib/markos/crm/execution.ts`
- `lib/markos/crm/copilot.ts`

## Required phase shape

1. Add a Wave 0.5 upstream preflight, architecture lock, and validation baseline before UI contracts branch out.
2. Define one shell and route contract instead of letting a second dashboard appear by accident.
3. Make Morning Brief the default operator landing experience with explicit owner, urgency, reason, and next action.
4. Replace fixture task assumptions with a persisted Task Board contract backed by run and approval lineage.
5. Centralize approvals with pricing and compliance posture now, while reserving evidence-specific blocking for Phase 209 translation.
6. Create a generic Recovery Center contract that can later consume connector, provider, billing, and webhook failures without Phase 208 re-owning those substrates.
7. Define Weekly Narrative and future integration boundaries so later phases plug into a stable cockpit instead of reshaping the shell after the fact.

## Non-negotiables

- No second dashboard shell or parallel control plane product.
- No hidden approvals trapped inside isolated feature pages.
- No desktop-only posture for approvals, brief, and quick tasks.
- No hard-coded assumptions that `EvidenceMap`, `ConnectorInstall`, dispatch outcomes, or learning suggestions already exist inside Phase 208.
- No operator-facing narrative that invents proof or loop outcomes before later phases provide them.

## Done means

Phase 208 has an executable shell-first plan set that produces named cockpit contracts and boundary docs:

- `.planning/operator-cockpit/208-upstream-readiness.md`
- `.planning/operator-cockpit/shell-route-contract.md`
- `.planning/operator-cockpit/morning-brief-contract.md`
- `.planning/operator-cockpit/task-board-contract.md`
- `.planning/operator-cockpit/approval-inbox-contract.md`
- `.planning/operator-cockpit/recovery-center-contract.md`
- `.planning/operator-cockpit/weekly-narrative-contract.md`
- `.planning/operator-cockpit/future-integration-boundaries.md`

At that point, GSD can execute Phase 208 as a real operator-cockpit foundation without incorrectly claiming evidence, connector, loop, or learning ownership.
