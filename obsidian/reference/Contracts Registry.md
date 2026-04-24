---
date: 2026-04-16
description: "All 39 MarkOS F-NN OpenAPI contracts grouped by domain — onboarding, execution, reporting, integration, admin, enrichment, CRM families (F-58..F-64)."
tags:
  - reference
  - contracts
  - openapi
  - schema
---

# Contracts Registry

> Every `contracts/F-NN-*.yaml` is an OpenAPI 3.0.3 document with `x-markos-meta` block (actor, auth_local, auth_hosted, handler, local_path, hosted_path, slo_tier, method). Registry manifest: `contracts/flow-registry.json` (generated 2026-04-02). Child of [[MarkOS Codebase Atlas]].

## By domain

### Onboarding (F-01)

| Code | Name | Method | Local | Hosted | Handler | Purpose |
|---|---|---|---|---|---|---|
| F-01 | client-intake-submit | POST | `/submit` | `/api/submit` | `handleSubmit` | primary intake; validates seed JSON, auto-creates Linear tickets, kicks off AI draft |

### Execution (F-02, F-03)

| Code | Name | Method | Path | Purpose |
|---|---|---|---|---|
| F-02 | draft-approve | POST | `/approve` | approves AI-generated sections; triggers downstream campaign prep |
| F-03 | section-regenerate | POST | `/regenerate` | re-generates single section on operator request |

### Reporting (F-04, F-05, F-09)

| Code | Name | Method | Path | Purpose |
|---|---|---|---|---|
| F-04 | system-config-read | GET | `/api/config` | runtime config; Supabase JWT `config_read` |
| F-05 | system-status-health | GET | `/api/status` | health/readiness; JWT `status_read` |
| F-09 | literacy-coverage-report | GET | `/api/literacy/coverage` | token counts, source coverage %, gap analysis |

### Integration (F-06, F-07)

| Code | Name | Method | Path | Purpose |
|---|---|---|---|---|
| F-06 | linear-task-sync | POST | `/api/linear/sync` | creates/updates Linear issues from MarkOS intake |
| F-07 | campaign-result-record | POST | `/api/campaign/result` | campaign execution result sink |

### Migration (F-08)

| Code | Name | Method | Path | Purpose |
|---|---|---|---|---|
| F-08 | markosdb-migrate | POST | `/api/migrate` | MarkOSDB → Supabase; JWT `migration_write` |

### Admin (F-10, F-11)

| Code | Name | Method | Path | Purpose |
|---|---|---|---|---|
| F-10 | literacy-admin-health | GET | local only | vector store status, chunker state, ingest queue depth |
| F-11 | literacy-admin-query | GET | local only | direct vector-store query for debugging |

### Enrichment (F-12..F-17) — AI interview + source extraction

| Code | Name | Purpose |
|---|---|---|
| F-12 | ai-interview-generate-q | next onboarding interview question |
| F-13 | ai-interview-parse-answer | parse + score operator answer into MIR signals |
| F-14 | source-extraction | normalize scraped content → structured sources for vector ingest |
| F-15 | extract-and-score | combined extract + score (relevance / authority / recency) before MIR merge |
| F-16 | spark-suggestion | short-form campaign starters / angle / hook candidates |
| F-17 | competitor-discovery | profile competitors for competitive-landscape MIR population |

### CRM Core (F-58)

| Code | Name | Flow type | Purpose |
|---|---|---|---|
| F-58-CRUD | crm-entity-crud | entity-crud | canonical CRUD for contact · company · deal · account · customer · task · note |
| F-58-MERGE | crm-merge-dedupe | merge-review | reviewable merge with immutable lineage evidence |
| F-58-TIMELINE | crm-timeline-query | timeline-read | unified timeline assembled from MarkOS activity ledger |

### CRM Tracking / Identity (F-59)

| Code | Name | Flow type | Purpose |
|---|---|---|---|
| F-59-TRACKING-INGEST | tracking-activity-ingest | activity-write | first-party ingest of tracked activity, normalized families |
| F-59-IDENTITY-STITCHING | identity-stitching | identity-link | assertion — attaches anonymous history to CRM records; accepted/review/rejected |
| F-59-TRACKED-REDIRECT | tracked-entry-redirect | redirect | preserves campaign/affiliate attribution as CRM evidence |

### CRM Pipeline Workspace (F-60)

| Code | Name | Flow type | Purpose |
|---|---|---|---|
| F-60-PIPELINE-CONFIG | pipeline-config | configuration-write | tenant-owned pipeline/stage configuration |
| F-60-OBJECT-WORKSPACE-METADATA | object-workspace-metadata | configuration-write | canonical + custom object participation across 6 views |
| F-60-WORKSPACE-ROLLUPS | workspace-rollups | workspace-read | calendar + funnel payload contracts |

### CRM Execution (F-61)

| Code | Name | Flow type | Purpose |
|---|---|---|---|
| F-61-EXECUTION-RECOMMENDATIONS | execution-recommendations | queue-read | recommendations with lifecycle |
| F-61-EXECUTION-QUEUES | execution-queues | queue-read | tab-grouped queue |
| F-61-DRAFT-SUGGESTIONS | draft-suggestions | assistive-read | non-executable draft suggestions |

### CRM Outbound (F-62)

| Code | Name | Flow type | Purpose |
|---|---|---|---|
| F-62-OUTBOUND-TEMPLATES | outbound-templates | template-config | template library |
| F-62-OUTBOUND-SEQUENCES | outbound-sequences | sequence-config | multi-step sequences |
| F-62-OUTBOUND-CONSENT | outbound-consent | consent-gate | mandatory pre-send check |
| F-62-OUTBOUND-SEND | outbound-send | execution-write | single + bulk send; provider routing |
| F-62-OUTBOUND-CONVERSATIONS | outbound-conversations | conversation-read | thread state + evidence |

### CRM Copilot (F-63)

| Code | Name | Flow type | Purpose |
|---|---|---|---|
| F-63 | copilot-grounding | grounded_summary | typed bundle for summaries / rationale / recommendations / conversation guidance |
| F-63A | agent-mutations | approval_packaging | bounded mutation families + approval package |
| F-63-PLAYBOOK-RUNS | playbook-runs | replay-safe execution | playbook step execution |

### CRM Reporting (F-64)

| Code | Name | Flow type | Purpose |
|---|---|---|---|
| F-64-ATTRIBUTION-MODEL | crm-attribution-model | reporting-read | deterministic `fixed_weight_model` over canonical activity evidence |
| F-64-REPORTING-DATA | crm-reporting-data | reporting-read | readiness · freshness · pipeline_health · sla_risk · productivity · executive_summary |

## Shared x-markos-meta fields

```yaml
x-markos-meta:
  actor: Operator | Tenant CRM operator | Admin | ...
  auth_local: none | runtime_local
  auth_hosted: none | supabase bearer
  handler: handle* (string, matches onboarding/backend/handlers.cjs or api/* export)
  local_path: /...
  hosted_path: /api/...
  slo_tier: critical | standard
  method: GET | POST | PATCH | DELETE
```

## Registry generation

`contracts/flow-registry.json` is generated from `onboarding/backend/server.cjs` + `handlers.cjs`. Updated via the tooling in `bin/extract-flows.cjs` and validated by `bin/validate-flow-contracts.cjs`.

## v2 Contract Gap Overlay

The v2 blueprint proposes new AgentRun, learning, artifact performance, and literacy-promotion contracts, but the incoming F-90 through F-96 range is already occupied by current MCP/webhook work. Future v2 implementation must allocate fresh F-NN IDs before code changes.

Candidate v2 contract families to reserve:

| Candidate family | Purpose | Source |
|---|---|---|
| AgentRun v2 | run state, priority, DAG edges, cost, retry, DLQ | [[MarkOS v2 Operating Loop Spec]] |
| Task Board | unified task surface for agent outputs, failures, approvals, recovery | [[MarkOS v2 GSD Master Work Plan]] |
| Approval Inbox | preview, evidence, voice/compliance, cost, approve/edit/reject | [[MarkOS v2 Operating Loop Spec]] |
| Connector Recovery | failure, dependent-agent pause, recovery instructions, backfill | [[Marketing Operating System Foundation]] |
| Evidence Map | claim-to-source linkage, SQS, confidence, TTL, gaps | [[MarkOS v2 Requirements Traceability Matrix]] |
| Artifact Performance Log | expected envelope, actual outcome, attribution evidence | [[MarkOS v2 Operating Loop Spec]] |
| Tenant Overlay | tenant-specific learning and override confidence | [[Marketing Operating System Foundation]] |
| Literacy Update Candidate | admin-reviewed central literacy promotion | [[Marketing Literacy]] |
| Social Signal | normalized social listen/classify/route/approve event | [[MarkOS v2 Operating Loop Spec]] |
| Pricing Intelligence | pricing knowledge, cost model, recommendations, price tests, watch list, alerts | [[Pricing Engine Canon]] |
| SaaS Suite | activation, plans, subscriptions, invoices, billing compliance, health, support, revenue, SAS agents | [[SaaS Suite Canon]] |
| SaaS Marketing OS Strategy | growth profile, activation, PQL, ABM packages, referrals, in-app campaigns, communities, events, experiments, affiliates, revenue alignment, growth agents | [[SaaS Marketing OS Strategy Canon]] |

Rule: do not implement a v2 schema/API using the incoming F-90 through F-96 IDs. Allocate a fresh range in the next GSD discuss/plan phase and update this registry first.

Pricing Engine contract candidates should cover `/v1/pricing/intelligence`, `/v1/pricing/matrix`, `/v1/pricing/cost-model`, `/v1/pricing/recommendations`, `/v1/pricing/tests`, `/v1/pricing/watch-list`, and pricing alert acknowledgement.

SaaS Suite contract candidates should cover `/v1/saas/subscriptions`, `/v1/saas/plans`, `/v1/saas/invoices`, `/v1/saas/billing`, `/v1/saas/revenue`, `/v1/saas/churn`, `/v1/saas/support`, `/v1/saas/compliance`, and processor/accounting webhook routing through the existing webhook engine.

SaaS Marketing OS strategy contract candidates should be read-first and post-suite: `/v1/saas/growth-profile`, `/v1/saas/activation`, `/v1/saas/pql`, `/v1/saas/abm`, `/v1/saas/referrals`, `/v1/saas/in-app-campaigns`, `/v1/saas/community`, `/v1/saas/events`, `/v1/saas/experiments`, `/v1/saas/partnerships`, `/v1/saas/revenue-alignment`. Mutation endpoints require approval contracts first.

## Schema

`contracts/schema.json` — JSON Schema for the `x-markos-meta` block, used by contract validators.

## Related

- [[Pricing Engine Canon]]
- [[SaaS Suite Canon]]
- [[SaaS Marketing OS Strategy Canon]]

- [[MarkOS Codebase Atlas]] · [[HTTP Layer]] · [[CRM Domain]] · [[Core Lib]] · [[Database Schema]]
