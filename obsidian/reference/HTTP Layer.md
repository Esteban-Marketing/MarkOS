---
date: 2026-04-16
description: "HTTP layer map — Next.js App Router under app/(markos) + REST handlers under api/*. Auth pattern, route groups, upstream deps, tenant posture."
tags:
  - reference
  - http
  - nextjs
  - api
---

# HTTP Layer

> App Router pages + `api/*` REST handlers. Child node of [[MarkOS Codebase Atlas]].

## app/ — Next.js App Router

All authenticated UI lives under the **`(markos)` route group**. `layout.tsx` resolves the session via `lib/markos/auth/session#requireMarkosSession`, pins the active tenant (`getActiveTenantContext`), and fails closed with `MarkOSAccessDeniedState` on missing/ambiguous context.

```
app/(markos)/
├── layout.tsx                    enforces tenant context, server-rendered
├── layout-shell.tsx              composition wrapper
├── page.tsx                      dashboard home — entity contract scaffold
├── crm/
│   ├── page.tsx                  Kanban workspace — buildCrmWorkspaceSnapshot
│   ├── [objectKind]/page.tsx     object-scoped view
│   ├── [objectKind]/[recordId]/page.tsx   record detail
│   ├── copilot/page.tsx          3-panel copilot (picker / convo / approval)
│   ├── execution/page.tsx        execution readiness hub
│   ├── outbound/page.tsx         outbound queue + composer
│   ├── outbound/conversations/page.tsx  conversation viewer
│   ├── reporting/page.tsx        reporting cockpit
│   └── reporting/verification/page.tsx  verification checklist
├── operations/page.tsx           IAM v3.2 execute_task gate
├── settings/billing/page.tsx     billing portal (Server Actions in actions.ts)
├── settings/plugins/page.tsx     plugin enable/disable
├── admin/billing/page.tsx        admin reconciliation
└── admin/governance/page.tsx     admin governance evidence
```

Upstream deps common to most pages: `lib/markos/auth/session`, `lib/markos/contracts/schema`, `lib/markos/crm/api.cjs`.

## api/ — REST handlers

### Shared auth pattern

```js
const runtimeContext = createRuntimeContext();
const auth = await requireHostedSupabaseAuth(req, runtimeContext, operation, requiredProjectSlug);
// req.markosAuth = { ok, status, error, message, tenant_id, iamRole, principal, entitlement_snapshot }
if (!auth.ok) return writeJson(res, auth.status, { error: auth.error });
// ... domain logic
writeJson(res, 200, result);
```

### Onboarding ingress (CORS-enabled, no auth)

| Handler | Delegates to | Purpose |
|---|---|---|
| `api/submit.js` | `handleSubmit` | F-01 intake |
| `api/approve.js` | `handleApprove` | F-02 draft approval |
| `api/regenerate.js` | `handleRegenerate` | F-03 section regen |
| `api/campaign/result.js` | `handleCampaignResult` | F-07 campaign result sink |
| `api/linear/sync.js` | `handleLinearSync` | F-06 Linear issue sync |

### System / config (JWT-protected)

| Handler | Contract | Notes |
|---|---|---|
| `api/status.js` | F-05 | tenant-scoped via JWT `active_tenant_id` or `x-tenant-id` |
| `api/config.js` | F-04 | `config_read` JWT |
| `api/migrate.js` | F-08 | `migration_write` JWT — runs MarkOSDB→Supabase migration |
| `api/literacy/coverage.js` | F-09 | tenant-resolved literacy coverage report |

### Auth / SSO

- `api/auth/sso/start.js` — resolves tenant SSO binding via `lib/markos/identity/sso-bindings#resolveTenantSsoBinding`.
- `api/auth/sso/callback.js` — OAuth callback (delegated).

### CRM CRUD

`api/crm/contacts.js · deals.js · companies.js · activities.js · accounts.js`. Each: GET list, POST create. Guards: `requireCrmTenantContext`, `assertCrmMutationAllowed`. Audit append via `appendCrmActivity`. Store: `lib/markos/crm/api.cjs`.

Plus: `records.js`, `object-definitions.js`, `pipelines.js`, `calendar.js`, `funnel.js`, `notes.js`, `tasks.js`, `merge.js`. See [[CRM Domain]].

### CRM execution

- `api/crm/execution/recommendations.js` — `buildExecutionRecommendations` + `upsertRecommendationLifecycle`.
- `api/crm/execution/actions.js` — PATCH, runs action_key against record (stage, owner, priority, status, task/note creation).
- `api/crm/execution/queues.js`, `drafts.js` — queue + draft state.

### CRM copilot (F-63)

- `api/crm/copilot/context.js` — grounded bundle via `buildCopilotGroundingBundle`; cross-tenant role check.
- `api/crm/copilot/summaries.js`, `recommendations.js`, `approve-package.js`, `playbooks.js`.

### CRM outbound (F-62)

- `api/crm/outbound/send.js` — consent check via `evaluateOutboundEligibility`, provider routing (Resend email / Twilio SMS/WhatsApp), outbound + activity audit.
- `api/crm/outbound/bulk-send.js`, `sequences.js`, `templates.js`.

### CRM reporting (F-64)

- `api/crm/reporting/dashboard.js` — `buildReadinessReport` + `buildReportingCockpitData` + `buildExecutiveSummary`.
- `api/crm/reporting/readiness.js`, `attribution.js`, `verification.js`, `rollups.js`.

### Tracking (F-59)

- `api/tracking/ingest.js` — activity ingest, `normalizeTrackedActivity`, append to `crm_activity_ledger`.
- `api/tracking/identify.js` — identity stitching.
- `api/tracking/redirect.js` — tracked redirect preserving campaign/affiliate attribution.

### Webhooks

- `api/webhooks/resend-events.js` — `normalizeOutboundEventForLedger`.
- `api/webhooks/twilio-events.js` — Twilio inbound/outbound events.

### Billing / governance

- `api/billing/holds.js` — `deriveProviderSyncOutcome` + `buildBillingLifecycleEvidence` (manage_billing role).
- `api/billing/operator-reconciliation.js`, `tenant-summary.js`.
- `api/governance/vendor-inventory.js` — `buildVendorInventoryReport`.
- `api/governance/brand-publish.js` · `brand-status.js` · `brand-rollback.js` — via `onboarding/backend/brand-governance/active-pointer.cjs`.
- `api/governance/evidence.js` — evidence ledger.

### Plugin runtime

- `api/tenant-plugin-settings.js` — owner or tenant-admin; `assertEntitledAction`; writes `plugin_tenant_config` + `plugin_tenant_capability_grants`.

## Tenant posture summary

| Zone | Auth | Tenant | Roles |
|---|---|---|---|
| Onboarding ingress | none | none | - |
| System/config | JWT | yes | scope-specific claim |
| CRM | JWT | `requireCrmTenantContext` | entitlement-gated mutations |
| Billing/governance | JWT | yes | `manage_billing` or `manage_users` (IAM v3.2) |
| Plugins | JWT | yes | owner / tenant-admin |
| Tracking/webhooks | signed / shared secret | inferred | - |

## Related

- [[MarkOS Codebase Atlas]] · [[Core Lib]] · [[Contracts Registry]] · [[CRM Domain]] · [[Database Schema]] · [[UI Components]]
