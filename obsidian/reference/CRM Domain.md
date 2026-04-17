---
date: 2026-04-16
description: "End-to-end CRM domain — entities, workspace, identity graph, execution queue, outbound, copilot, reporting, attribution. Ties lib + components + contracts + migrations."
tags:
  - reference
  - crm
  - domain
---

# CRM Domain

> Revenue-grade native CRM. Most-modified area. Child of [[MarkOS Codebase Atlas]].

## Scope at a glance

| Layer | Location |
|---|---|
| Data model | `supabase/migrations/58_*.sql`, `60_*.sql`, `61_*.sql`, `62_*.sql`, `63_*.sql`, `64_*.sql`, `100_*.sql` |
| Contracts | `contracts/F-58-*.yaml`, `F-59-*.yaml`, `F-60-*.yaml`, `F-61-*.yaml`, `F-62-*.yaml`, `F-63-*.yaml`, `F-64-*.yaml` |
| Lib | `lib/markos/crm/*` |
| API | `api/crm/**` + `api/tracking/*` + `api/webhooks/*` |
| UI pages | `app/(markos)/crm/**` |
| UI components | `components/markos/crm/*` + `components/crm/*` |

## lib/markos/crm — core business logic

| File | Purpose | Key exports |
|---|---|---|
| `api.cjs` / `api.ts` | tenant-safe store | `getCrmStore`, `createCrmEntity`, `updateCrmEntity`, `listCrmEntities`, `appendCrmActivity` |
| `contracts.cjs` / `contracts.ts` | record-kind + view contracts | entity schemas, workspace-view shapes |
| `entities.ts` | canonical entity models | contact, company, deal, account, customer, task, note |
| `workspace.ts` + `workspace-data.ts` | workspace state machine | `createWorkspaceState`, `buildKanbanColumns`, `buildTableRows`, `buildRecordDetailModel`, `buildCalendarEntries`, `buildFunnelRows`, `applyWorkspaceMutation`, `serializeWorkspaceFilters`, `buildCrmWorkspaceSnapshot` |
| `identity.ts` | identity graph | `createIdentityLink`, `scoreIdentityCandidate` |
| `timeline.cjs` / `timeline.ts` | activity ledger stitcher | `buildCrmTimeline`, `normalizeActivityFamily` |
| `execution.ts` | queue + recommendations | `buildExecutionRecommendations`, `rankExecutionQueue`, `buildExecutionQueues`, `buildExecutionWorkspaceSnapshot`, `normalizeExecutionSignals`, `upsertRecommendationLifecycle`, `listDraftSuggestions` |
| `attribution.ts` | weighted attribution | `buildWeightedAttributionModel`, `computeRevenueContribution`, `buildAttributionEvidence` — family weights: `campaign_touch 0.5`, `web_activity 0.3`, `outbound_event 0.2` |
| `reporting.ts` | reporting payloads | `normalizeContacts`, `normalizeActivities`, `normalizeIdentityLinks`, `buildReportSnapshot`, `buildReadinessReport`, `buildReportingCockpitData`, `buildExecutiveSummary` |
| `copilot.ts` | AI grounding | `ensureCopilotStore`, `buildContextInventory`, `buildBundleScope`, `buildCopilotGroundingBundle` |
| `playbooks.ts` | replay-safe mutations | `buildPlaybookStep`, `assertReplaySafePlaybookAction`, `transitionRun` |
| `tracking.ts` | ingest normalizer | `normalizeTrackedActivity` |
| `merge.ts` | dedupe | `mergeCrmEntities`, `unmergeEntity` |
| `agent-actions.ts` | agent mutation envelope | bounded mutation family executor |

**Record kinds**: contact · company · deal · account · customer · task · note · (custom objects).

**Workspace views** (Phase 60): kanban · table · detail · timeline · calendar · funnel.

**Execution queue tabs** (Phase 61): due_overdue · approval_needed · inbound · stalled · success_risk · ownership_data · priority.

## Data model — tables that matter

```
58_crm_core_entities.sql
  crm_contacts · crm_companies · crm_accounts · crm_customers
  crm_deals · crm_tasks
58_crm_activity_and_identity.sql
  crm_activity_ledger · crm_identity_links · crm_merge_decisions · crm_merge_lineage
58_crm_custom_fields.sql
  crm_custom_field_definitions · crm_custom_field_values
60_crm_pipeline_workspace.sql
  crm_pipelines · crm_pipeline_stages · crm_workspace_object_definitions
61_crm_execution_workspace.sql
  crm_execution_recommendations · crm_execution_queue_preferences · crm_execution_draft_suggestions
62_crm_outbound_foundation.sql
  crm_outbound_sends · crm_contact_channel_consent · crm_outbound_conversations
62_crm_outbound_execution.sql
  crm_outbound_templates · crm_outbound_sequences · crm_outbound_queue · crm_outbound_bulk_sends
63_crm_copilot_foundation.sql
  crm_copilot_summaries · crm_copilot_approval_packages · crm_copilot_mutation_outcomes
64_crm_reporting_foundation.sql
  crm_reporting_snapshots · crm_attribution_snapshots
100_crm_schema_identity_graph_hardening.sql
  forward-only parity — identity review state + tenant-safe audit
```

All tables have `tenant_id` + RLS enabled. See [[Database Schema]].

## Contracts (F-58..F-64)

| Code | Name | Flow type |
|---|---|---|
| F-58-CRUD | crm-entity-crud | entity-crud |
| F-58-MERGE | crm-merge-dedupe | merge-review (immutable lineage) |
| F-58-TIMELINE | crm-timeline-query | timeline-read (unified from activity ledger) |
| F-59-IDENTITY-STITCHING | identity-stitching | identity-link (accepted/review/rejected) |
| F-59-TRACKED-REDIRECT | tracked-entry-redirect | redirect (campaign/affiliate) |
| F-59-TRACKING-INGEST | tracking-activity-ingest | activity-write |
| F-60-PIPELINE-CONFIG | pipeline-config | configuration-write (tenant-owned) |
| F-60-OBJECT-WORKSPACE-METADATA | object-workspace-metadata | configuration-write (6 views) |
| F-60-WORKSPACE-ROLLUPS | workspace-rollups | workspace-read (calendar + funnel) |
| F-61-EXECUTION-RECOMMENDATIONS | execution-recommendations | queue-read |
| F-61-EXECUTION-QUEUES | execution-queues | queue-read |
| F-61-DRAFT-SUGGESTIONS | draft-suggestions | assistive-read (non-executable) |
| F-62-OUTBOUND-TEMPLATES | outbound-templates | template-config |
| F-62-OUTBOUND-SEQUENCES | outbound-sequences | sequence-config |
| F-62-OUTBOUND-CONSENT | outbound-consent | consent-gate |
| F-62-OUTBOUND-SEND | outbound-send | execution-write |
| F-62-OUTBOUND-CONVERSATIONS | outbound-conversations | conversation-read |
| F-63 | copilot-grounding | grounded_summary (typed bundle) |
| F-63A | agent-mutations | approval_packaging (bounded families) |
| F-63-PLAYBOOK-RUNS | playbook-runs | replay-safe execution |
| F-64-ATTRIBUTION-MODEL | crm-attribution-model | reporting-read (fixed_weight_model) |
| F-64-REPORTING-DATA | crm-reporting-data | reporting-read (readiness, freshness, pipeline_health, sla_risk, productivity, executive_summary) |

See [[Contracts Registry]] for full shapes.

## UI — components/markos/crm (29 components)

- **Shell**: `workspace-shell.tsx` — view switcher over lib/markos/crm/workspace builders. Patches via `/api/crm/records` + `/api/crm/calendar`.
- **Views**: `kanban-view.tsx`, `table-view.tsx`, `record-detail.tsx`, `timeline-panel.tsx`, `calendar-view.tsx`, `funnel-view.tsx`.
- **Copilot (F-63)**: `copilot-record-panel.tsx`, `copilot-recommendation-card.tsx`, `copilot-conversation-panel.tsx`, `copilot-approval-package.tsx`, `copilot-oversight-panel.tsx`, `copilot-playbook-review.tsx`. State via `useCopilotStore` in `app/(markos)/crm/copilot/copilot-store.tsx`.
- **Execution (F-61)**: `execution-queue.tsx`, `execution-detail.tsx`, `execution-evidence-panel.tsx`, `draft-suggestion-panel.tsx`. State via `useExecutionStore`.
- **Reporting (F-64)**: `reporting-dashboard.tsx`, `reporting-nav.tsx`, `reporting-evidence-rail.tsx`, `reporting-readiness-panel.tsx`, `reporting-executive-summary.tsx`, `reporting-central-rollup.tsx`, `reporting-verification-checklist.tsx`. State via `useReportingStore`.

## UI — components/crm (outbound)

`outbound-workspace.tsx` · `outbound-composer.tsx` · `outbound-consent-gate.tsx` · `conversation-viewer.tsx`. Tri-pane layout, amber consent gates, suggestion-only drafting (non-executable without approval).

## Critical invariants

- **Tenant safety**: every CRM write goes through `requireCrmTenantContext` + `assertCrmMutationAllowed`.
- **Activity ledger is the source of truth** for timelines — `crm_activity_ledger` is append-only; timeline views stitch.
- **Identity links have review state** (`accepted`/`review`/`rejected`) — never auto-merge without evidence (migration 100 hardens this).
- **Merge is reviewable** — `crm_merge_decisions` + `crm_merge_lineage` preserve immutable lineage.
- **Outbound consent gate is mandatory** — `evaluateOutboundEligibility` must pass before `/api/crm/outbound/send` executes.
- **Draft suggestions are assistive-only** — `draft-suggestion-panel` + F-61 explicitly mark `send_disabled`, `sequence_disabled`.
- **Attribution is deterministic** — fixed weights, not learned. See [[Key Decisions]].
- **Copilot mutations require approval packages** — F-63A bounded families, human sign-off gate.

## Related

- [[MarkOS Codebase Atlas]] · [[HTTP Layer]] · [[Core Lib]] · [[UI Components]] · [[Contracts Registry]] · [[Database Schema]] · [[Patterns]] · [[Key Decisions]] · [[Gotchas]]
