# Phase 210 Research - Connector Wow Loop and Recovery

## Primary research question

Which connector substrate and first-live-data path best satisfy the vault requirement for quick setup, a 30-minute wow moment, and visible recovery?

## Questions to answer

| Area | Question | Output |
|---|---|---|
| Current code | What connector/session/OAuth patterns already exist? | Reuse map |
| ConnectorInstall | What fields are needed for auth, scopes, encrypted credentials, status, sync cadence, retention, and recovery? | Contract proposal |
| Adapter posture | Where should Nango be embedded and where should direct adapters be used? | Nango/direct matrix |
| First wow | Should GA4/GSC, CRM, social, product analytics, or email be the first wow path? | MVP connector recommendation |
| Onboarding | How should max-3 connector recommendation choose by tenant profile? | Recommendation logic |
| Recovery | How do failures pause dependent agents and create recovery tasks? | Recovery policy |
| Backfill | Which data sources need backfill and retry behavior first? | Sync policy |
| Future SaaS growth | Which connectors are prerequisites for PLG, ABM, community, events, PR/reviews, partnerships, and developer marketing? | Future connector map |

## Sources to inspect

- Existing integration, OAuth, MCP session, webhook, tenant settings, and onboarding code.
- Official docs for candidate first connectors.
- Nango docs if used.
- Incoming Social Deep Integration, Intelligence Layer, Onboarding, SaaS Suite, and SaaS Marketing OS Strategy docs.
- SOC2 and privacy planning docs for connector risk.

## Required research output

- Current-code support.
- Connector contract.
- First connector decision.
- Recovery and backfill policy.
- Security/privacy controls.
- Acceptance tests and UAT criteria.

## Codebase Research Addendum - 2026-04-23

### Files inspected

- `app/(markos)/oauth/consent/page.tsx`
- `app/(markos)/settings/mcp/page.tsx`
- `lib/markos/mcp/sessions.cjs`
- `lib/markos/webhooks/engine.ts`
- `lib/markos/webhooks/engine.cjs`
- `lib/markos/outbound/providers/base-adapter.ts`
- `lib/markos/outbound/scheduler.ts`
- `.planning/codebase/INTEGRATIONS.md`

### Existing support

- OAuth consent UI already handles PKCE request validation, tenant selection, scope display, CSRF, approve, and deny.
- MCP sessions are tenant-bound, revocable, TTL-based, and audited.
- Webhook engine supports durable subscriptions, event filters, active/inactive state, signing secrets, and tenant scoping.
- Outbound provider abstraction exists for email, SMS, and WhatsApp capabilities.
- Integration docs name Supabase, Upstash, Tavily, Linear, PostHog, LLM providers, and planned Nango posture.

### Gaps

- No `ConnectorInstall` model exists for customer-owned integrations such as GA4, GSC, CRM, social, product analytics, support, billing, or accounting.
- No connector status state machine exists for connected, degraded, expired, revoked, rate-limited, permission-missing, sync-failed, or recovery-needed.
- No encrypted credential store contract exists for connector tokens outside existing MCP/API-key surfaces.
- No max-3 onboarding connector recommendation logic exists.
- No first-live-data wow audit exists.
- No dependent-agent pause policy connects connector failure to AgentRun and Task Board.
- No connector backfill, cursor, retry, DLQ, retention, or privacy classification model exists.

### ConnectorInstall contract direction

Minimum fields: `connector_install_id`, `tenant_id`, `provider`, `provider_account_id`, `status`, `status_reason`, `scopes`, `credential_ref`, `auth_type`, `installed_by`, `installed_at`, `last_sync_at`, `next_sync_at`, `sync_cursor_ref`, `retention_policy`, `data_classification`, `dependent_agent_ids`, `last_error`, `recovery_task_id`, and `evidence_refs`.

### First wow recommendation

Default first wow path should be read-only and low-risk:

- For website-led SaaS/DTC tenants: GA4 plus Google Search Console, producing a 30-minute acquisition and content-opportunity audit.
- For CRM-led B2B tenants without analytics access: HubSpot/CRM import plus pipeline freshness and stalled-opportunity audit.
- For social-led tenants: one social account read-only profile/content audit, with publishing disabled until evidence and approval gates are ready.

Implementation must verify official connector docs during execution, especially OAuth scopes, quotas, webhook/event models, and data retention limits.

### Recovery policy

- Connector failure pauses dependent agents that would make stale or incomplete decisions.
- A recovery task is created with impacted agents, blocked workflows, exact missing scope/token/error, and safe retry action.
- Read-only dashboards remain visible even when connector sync is degraded.
- Backfill jobs must be idempotent, cursor-based, and evidence-linked.

### Tests implied

- ConnectorInstall RLS and encrypted credential reference tests.
- OAuth scope mismatch and revoked-token recovery tests.
- Agent pause tests when a required connector is degraded.
- First wow test proving the operator sees useful insight or a precise recovery task within the target window.
