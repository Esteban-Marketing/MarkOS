---
date: 2026-04-16
description: "React component map — components/crm + components/markos. View components, copilot panels, execution queue, reporting cockpit, Zustand-like stores."
tags:
  - reference
  - ui
  - react
  - components
---

# UI Components

> React layer. 29+ components. Child of [[MarkOS Codebase Atlas]]. Deep CRM wiring in [[CRM Domain]].

## Hierarchy

```
components/
├── crm/                           outbound-focused sub-domain (4)
│   ├── outbound-workspace.tsx     tri-pane (queue | composer | evidence)
│   ├── outbound-composer.tsx      template selector + schedule
│   ├── outbound-consent-gate.tsx  amber gate
│   └── conversation-viewer.tsx    thread collection
└── markos/
    └── crm/                       workspace + copilot + execution + reporting (25)
        ├── workspace-shell.tsx    view switcher — patches /api/crm/records, /api/crm/calendar
        ├── kanban-view.tsx
        ├── table-view.tsx
        ├── record-detail.tsx      embeds TimelinePanel
        ├── timeline-panel.tsx
        ├── calendar-view.tsx
        ├── funnel-view.tsx
        ├── copilot-record-panel.tsx
        ├── copilot-recommendation-card.tsx
        ├── copilot-conversation-panel.tsx
        ├── copilot-approval-package.tsx
        ├── copilot-oversight-panel.tsx
        ├── copilot-playbook-review.tsx
        ├── execution-queue.tsx
        ├── execution-detail.tsx   DraftSuggestionPanel + runAction → /api/crm/execution/actions
        ├── execution-evidence-panel.tsx
        ├── draft-suggestion-panel.tsx
        ├── reporting-dashboard.tsx
        ├── reporting-nav.tsx
        ├── reporting-evidence-rail.tsx
        ├── reporting-readiness-panel.tsx
        ├── reporting-executive-summary.tsx
        ├── reporting-central-rollup.tsx
        └── reporting-verification-checklist.tsx
```

## State model

Three page-scoped stores, not a global state tree:

| Store | File | Key state |
|---|---|---|
| Copilot | `app/(markos)/crm/copilot/copilot-store.tsx` | `selectedRecord`, `summary`, `recommendations`, `selectedConversation`, `bundle`, `evidenceEntries`, `approvalPackages` |
| Execution | `app/(markos)/crm/execution/execution-store.tsx` | `scope` (personal/team), `tabs` with counts, `visibleRecommendations`, `selectedRecommendation`, `detail`, `syncActionResult` |
| Reporting | `app/(markos)/crm/reporting/reporting-store.tsx` | `cockpit`, `readiness`, `selectedAttributionRecordId`, `currentView`, `roleLayer`, `timeRange`, `evidenceEntries`, `centralRollup`, `executiveSummary` |

Components subscribe via `useCopilotStore` / `useExecutionStore` / `useReportingStore` hooks. No global context provider at app level.

## Props-driven views

Workspace views are pure presentational — state flows from `lib/markos/crm/workspace` builders (`buildKanbanColumns`, `buildTableRows`, `buildCalendarEntries`, `buildFunnelRows`, `buildRecordDetailModel`) into props. Mutations surfaced via `applyWorkspaceMutation` reducer.

## Storybook

Config under `.storybook/` (react-vite). Test runner with a11y (axe-core) and security checks. No inline stories in the CRM components reviewed — Storybook suite lives next to components via `.stories.tsx` convention elsewhere.

## Conventions

- **No internal fetching inside views** — only `workspace-shell.tsx` hits the network. Views are read-only over props.
- **Consent gates are amber** — deliberate visual signal for mandatory governance checkpoints.
- **Draft suggestions are non-executable** — components hardcode `send_disabled` / `sequence_disabled` flags.
- **Approval packages are first-class** — copilot mutations never bypass `copilot-approval-package.tsx`.

## v2 UI Gap Overlay

The current UI map is CRM/reporting heavy. v2 needs operating-system surfaces that sit above CRM and make agentic marketing decisions visible.

Target surfaces:

| Surface | Current reuse | Gap |
|---|---|---|
| Morning Brief | reporting executive summary, operations page | daily decision feed with urgent approvals, anomalies, connector failures, budget risk, top opportunities |
| Task Board | CRM tasks, execution queue | cross-domain tasks from AgentRun outputs, approvals, social escalations, connector recovery, learning candidates |
| Approval Inbox | copilot approval package, outbound consent gate | rendered artifact preview, evidence map, voice score, compliance state, cost, approve/edit/reject |
| Connector Recovery | webhook settings/status patterns | broken connector state, dependent agents, recovery instructions, backfill visibility |
| Weekly Narrative | CRM reporting executive summary | pipeline-linked performance story, next actions, learning candidates |
| Social Inbox | outbound conversations | inbound social signal list, classification, response draft, escalation and CRM match |
| Pricing Engine Dashboard | billing/settings and reporting patterns | pricing health, competitor changes, margin health, recommendations, alerts |
| Cost Model Wizard | onboarding wizard patterns | under-10-minute cost model setup by business type |
| Pricing Recommendation Cards | approval package patterns | options, projected impact, risk, assumptions, frameworks, accept/modify/defer/reject |
| SaaS Suite Overview | reporting, billing/settings, CRM/customer views | activation-gated SaaS overview with subscription, billing, churn, support, product usage, and revenue decisions |
| SaaS Billing and DIAN Wizard | billing/settings patterns, webhook status banners | Stripe/US, Mercado Pago/Colombia, QuickBooks, Siigo/Alegra, DIAN setup and rejected-invoice tasks |
| SaaS Health/Support/Product Usage | CRM tasks, reporting evidence rail, connector recovery | health score, churn alerts, support triage, product usage signals, intervention tasks |
| SaaS Growth Profile | onboarding/profile/settings patterns | choose B2B/B2C/B2B2C/PLG mode, active modules, sales/CS/developer posture, approval posture |
| PLG Activation and PQL | reporting, task board, product usage surfaces | activation funnel, milestone gaps, PQL queue, upgrade triggers, recommended actions |
| ABM and Expansion | CRM account/detail views, execution queue | ABM tier, buying committee, account package, expansion opportunity, advocacy/customer marketing tasks |
| In-App Campaigns | approval inbox, content preview, outbound suppression patterns | trigger/format/frequency preview, email/CS suppression, goal, approval, results |
| Community, Events, PR, Partnerships | CRM tasks, reporting, outbound, activity ledger | growth program status, task queues, approvals, pipeline attribution, review/coverage/partner evidence |
| Growth Experiments | pricing tests, reporting, artifact performance | ICE backlog, hypothesis, variants, guardrails, runtime, decision, learning |

Design constraints from [[MarkOS v2 GSD Master Work Plan]]:

- Decision-first, not metric-first.
- No passive dashboards unless they produce a task or approval.
- Mobile is reactive only.
- Every approval must expose why it is safe or unsafe.
- Every warning needs owner, priority, and next action.
- Pricing pages and pricing-sensitive UI must use [[Pricing Engine Canon]] or `{{MARKOS_PRICING_ENGINE_PENDING}}`.
- SaaS Suite UI must be hidden for non-SaaS or inactive tenants and must route legal billing, support replies, save offers, discounts, and lifecycle mutations through approval/compliance gates.
- SaaS growth UI must be hidden unless the SaaS growth mode/module is active, and every surface must create a decision, task, approval, experiment, or learning.

## Related

- [[SaaS Suite Canon]]
- [[MarkOS Codebase Atlas]] · [[CRM Domain]] · [[Core Lib]] · [[HTTP Layer]]
