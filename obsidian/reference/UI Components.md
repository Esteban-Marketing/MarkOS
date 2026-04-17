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

## Related

- [[MarkOS Codebase Atlas]] · [[CRM Domain]] · [[Core Lib]] · [[HTTP Layer]]
