# Phase 208 Research - Human Operating Interface

## Primary research question

How should MarkOS organize human work so every agent output, approval, failure, connector issue, cost risk, and opportunity becomes visible and actionable?

## Questions to answer

| Area | Question | Output |
|---|---|---|
| IA | Which existing nav/layout patterns can become the operating shell? | Navigation proposal |
| Morning Brief | What sections are needed for the first useful daily screen? | Brief schema and UI map |
| Task Board | Which fields are required for priority, owner, source agent, status, due date, evidence, and campaign/revenue context? | Task contract |
| Approval Inbox | What preview/evidence/edit/reject/approve UX is required for content, pricing, CRM, support, billing, and connector actions? | Approval UX spec |
| Mobile | Which flows must be reactive on mobile? | Mobile scope |
| Connector recovery | How do failures show impacted agents, blocked work, and recovery steps? | Recovery surface |
| Weekly Narrative | Which metrics and evidence sources drive the weekly story? | Narrative data contract |
| Future SaaS growth | Which doc 17 surfaces should remain placeholders until post-217 translation? | Gating map |

## Sources to inspect

- Current app shell, dashboard, task, approval, billing, webhook, and CRM UI files.
- Phase 207 AgentRun/task contracts once researched.
- Incoming Human Interface and Onboarding documents.
- SaaS Suite and SaaS Marketing OS Strategy canon for future gated surfaces.
- Accessibility and responsive tests already present in the repo.

## Required research output

- Current UI support.
- Gaps.
- IA recommendation.
- Data contract needs.
- Acceptance tests and UAT criteria.

## Codebase Research Addendum - 2026-04-23

### Files inspected

- `app/(markos)/operations/page.tsx`
- `app/(markos)/operations/tasks/page.tsx`
- `app/(markos)/operations/tasks/task-types.ts`
- `app/(markos)/operations/tasks/task-machine.ts`
- `app/(markos)/operations/tasks/evidence-panel.tsx`
- `app/(markos)/settings/mcp/page.tsx`
- `app/(markos)/settings/billing/page-shell.tsx`
- `app/(markos)/admin/governance/page.tsx`
- `lib/markos/crm/execution.ts`
- `lib/markos/crm/copilot.ts`

### Existing support

- Operations has an authorization-gated entrypoint and a task execution surface.
- Task UI already models step state, approvals, retries, evidence, current step locking, and event history.
- CRM execution already normalizes due/overdue, approval needed, inbound, stalled, success risk, ownership, and priority signals.
- MCP settings already has cost budget, sessions, revocation, and top-tool breakdown.
- Billing settings already has invoice, hold, recovery evidence, and impacted-workflow language.
- Governance admin exists as a natural host for control/evidence review surfaces.

### Gaps

- Current task store is fixture-backed React state, not a persisted operating system work queue.
- No Morning Brief synthesizes daily priority, risk, revenue, connector, pricing, approval, and run state.
- No unified Task Board accepts tasks from AgentRun, connectors, approvals, pricing, billing, CRM, support, and learning.
- No dedicated Approval Inbox with preview, edit, evidence, reject, approve, and mutation audit.
- No connector recovery surface shows broken connector, impacted agents, blocked work, and exact recovery steps.
- No Weekly Narrative turns execution, outcomes, risks, and learning into operator-readable progress.
- Mobile behavior is not designed around reactive approvals and recovery.

### Recommended IA

Use the existing `(markos)` app shell, but treat Operations as the system cockpit:

1. Morning Brief: one daily screen with highest-priority decisions, blocked runs, approvals, cost/pricing warnings, connector recovery, and revenue movement.
2. Task Board: persisted tasks grouped by priority, owner, source agent, domain, due date, revenue context, and evidence status.
3. Approval Inbox: all human approvals across content, pricing, CRM, billing, support, connector, and public claims.
4. Recovery Center: connector, webhook, billing, and provider failures with impacted workflows.
5. Weekly Narrative: generated summary with evidence links, completed work, missed commitments, and next priorities.

### Data contract needs

Each operating item should carry `tenant_id`, `source_type`, `source_id`, `priority`, `owner_role`, `owner_id`, `status`, `due_at`, `approval_required`, `evidence_refs`, `agent_run_id`, `chain_id`, `connector_install_id`, `pricing_recommendation_id`, `crm_record_ref`, `revenue_impact`, and `blocked_by`.

### Tests implied

- Reducer and persistence tests for task creation from runs, approvals, connector failures, and billing events.
- Accessibility tests for approval inbox and keyboard-only task operation.
- Mobile viewport tests for approve/reject/recover flows.
- Contract tests proving unsupported claims, price changes, and external sends cannot be approved without evidence.

## Discuss/Research Refresh - 2026-04-23

### Additional files inspected

- `app/(markos)/layout-shell.tsx`
- `app/(markos)/operations/page.tsx`
- `.planning/V4.0.0-CODEBASE-VAULT-DEEP-AUDIT.md`

### Additional codebase findings

- The current shell still advertises a generic "UI Control Plane" posture, so Phase 208 must include shell-language and navigation migration, not just new panels.
- `app/(markos)/operations/page.tsx` is still a role-gated gateway to an older task surface and therefore is a natural migration anchor for the future cockpit.
- Existing billing, MCP, governance, and webhook pages already contain reusable evidence/risk/recovery patterns that can enrich the Morning Brief and Weekly Narrative.

### Refreshed research decisions

- Phase 208 should evolve the existing `(markos)` shell instead of introducing a second dashboard shell.
- The Morning Brief should become the default operator landing experience, with operations/task/recovery views as deeper work surfaces.
- Approval centralization is mandatory because approval-like work already exists in multiple domains.
- No new top-level phase is required; the work still belongs in the existing 208 scope.

### Additional tests implied

- Shell/navigation tests proving the new operating posture replaces the generic control-plane framing.
- Central approval-inbox tests proving cross-domain approval items can coexist in one queue.
- Narrative tests proving billing, connector, run, and revenue evidence can be synthesized without leaving the operator shell.
