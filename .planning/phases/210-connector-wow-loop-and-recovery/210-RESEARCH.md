# Phase 210 Research - Connector Wow Loop and Recovery

## Primary research question

Which connector substrate and first-live-data path best satisfy the vault requirement for quick setup, a 30-minute wow moment, visible recovery, and trustworthy downstream usage?

## Questions to answer

| Area | Question | Output |
|---|---|---|
| Current code | What connector, session, OAuth, webhook, and provider patterns already exist? | Reuse map |
| Ownership | Which requirements belong to Phase 210 directly, and which must stay upstream? | Ownership boundary |
| ConnectorInstall | What fields are needed for auth, scopes, encrypted credentials, status, cadence, retention, and recovery? | Contract proposal |
| Adapter posture | Where should Nango be embedded and where should direct adapters be used? | Adapter matrix |
| First wow | Which first-live-data path best satisfies low-risk quick value? | MVP wow recommendation |
| Onboarding | How should max-3 connector recommendation choose by tenant profile and goal? | Recommendation policy |
| Recovery | How do failures pause dependent agents and create precise recovery tasks? | Recovery policy |
| Backfill | Which sync, retry, DLQ, freshness, and evidence behaviors are required first? | Sync policy |
| Future scope | Which later phases consume connector outputs without expanding Phase 210 today? | Future connector map |

## Files inspected

- `app/(markos)/oauth/consent/page.tsx`
- `app/(markos)/settings/mcp/page.tsx`
- `lib/markos/mcp/sessions.cjs`
- `lib/markos/webhooks/engine.ts`
- `lib/markos/webhooks/engine.cjs`
- `lib/markos/outbound/providers/base-adapter.ts`
- `.planning/codebase/INTEGRATIONS.md`
- `.planning/phases/206-soc2-type1-foundation/206-RESEARCH.md`
- `.planning/phases/208-human-operating-interface/208-RESEARCH.md`
- `.planning/phases/209-evidence-research-and-claim-safety/209-RESEARCH.md`
- `.planning/V4.0.0-PHASE-TEST-REQUIREMENTS-MATRIX.md`
- `.planning/V4.0.0-VAULT-CODEBASE-COMPLIANCE-AUDIT.md`
- `.planning/phases/210-connector-wow-loop-and-recovery/210-CONTEXT.md`
- `.planning/phases/210-connector-wow-loop-and-recovery/210-REVIEWS.md`

## Ownership boundary

### Direct ownership

- `CONN-01..06`
- `QA-01..15`

### Upstream integrations, not primary ownership

- Phase 206 compliance and connector/privacy posture
- Phase 207 run state, retry, pause, and DLQ posture
- Phase 208 task, approval, and connector-recovery visibility
- Phase 209 evidence and source-quality posture

## Current-code support

### 1. OAuth and consent posture already exist

- The OAuth consent surface already handles PKCE validation, tenant selection, scope display, CSRF, approve, and deny.
- This is strong substrate for connector authorization flows that must remain tenant-scoped and explicit.

### 2. Tenant-bound session posture already exists

- `lib/markos/mcp/sessions.cjs` already gives tenant-bound opaque tokens, revoke flow, rolling TTL, and audit emission.
- That provides a strong pattern for secret handling, revocation posture, and tenant scoping.

### 3. Durable webhook subscription behavior already exists

- `lib/markos/webhooks/engine.ts` and `.cjs` already manage tenant-scoped subscriptions, event validation, active state, generated secrets, and per-subscription rate override storage.
- This is valuable substrate for connector-side event ingestion and operational discipline.

### 4. Provider capability abstraction already exists

- `lib/markos/outbound/providers/base-adapter.ts` already models channel capabilities, send behavior, and normalized provider events.
- This suggests connector adapters should also use a capability-and-normalization posture instead of provider-specific sprawl.

### 5. Operator visibility surfaces already exist

- `app/(markos)/settings/mcp/page.tsx` already exposes active sessions, revoke actions, refresh flows, and cost visibility.
- That gives a UI pattern for connector status and recovery surfaces, even if Phase 208 is still the system-of-record work surface.

### 6. Integration inventory already exists

- `.planning/codebase/INTEGRATIONS.md` already inventories PostHog, Resend, Twilio, Linear, Supabase, and the broader external service boundary.
- This is good substrate for adapter-decision evidence and later compatibility planning.

## Gaps

- No `ConnectorInstall` object exists for customer-owned integrations such as GA4, GSC, CRM, social, product analytics, support, billing, or accounting.
- No connector status state machine exists for connected, degraded, expired, revoked, rate-limited, permission-missing, sync-failed, or recovery-needed.
- No connector credential reference contract exists outside current MCP/API-key surfaces.
- No max-3 onboarding recommendation logic exists.
- No first-live-data wow audit contract exists.
- No pause policy links connector degradation to dependent runs and visible recovery work.
- No cursor, backfill, retry, DLQ, freshness, or recovery-evidence model exists for connectors.
- No validation contract exists for the phase even though the test matrix already defines the business truths.

## Recommendation

Phase 210 should be replanned as a six-wave executable phase with a Wave 0.5 preflight at the front:

1. Hard-gate compliance, run, task, and evidence readiness.
2. Create ConnectorInstall and connector state vocabulary before choosing providers.
3. Build an official-doc-backed adapter decision matrix for first-wave providers.
4. Limit onboarding to three connectors with a concrete wow promise.
5. Make the first wow path read-only and low-risk.
6. Treat failure and recovery as first-class outcomes with impacted-run and task linkage.
7. End with a sync/recovery evidence model and a future connector compatibility map for downstream phases.

## Domain 0 - Upstream readiness and architecture lock

Phase 210 depends on Phases 206-209 in practice, so Plan 01 should create a Wave 0.5 gate that checks:

- connector privacy and retention posture exists from Phase 206
- run pause, retry, and blocked-work substrate exists from Phase 207
- connector recovery tasks and visibility substrate exists from Phase 208
- evidence posture exists for connector-backed outputs from Phase 209

The architecture lock should reject unsafe shortcuts such as:

- `plain text access token`
- `silent connector degradation`
- `recommend four connectors`
- `write-capable first wow`

## Domain 1 - ConnectorInstall contract foundation

Recommended `ConnectorInstall` fields:

- `connector_install_id`
- `tenant_id`
- `provider`
- `provider_account_id`
- `status`
- `status_reason`
- `scopes`
- `credential_ref`
- `auth_type`
- `installed_by`
- `installed_at`
- `last_sync_at`
- `next_sync_at`
- `sync_cursor_ref`
- `retention_policy`
- `data_classification`
- `dependent_agent_ids`
- `last_error`
- `recovery_task_id`
- `evidence_refs`
- `created_at`
- `updated_at`

Recommended `status` literals:

- `connected`
- `degraded`
- `expired`
- `revoked`
- `rate_limited`
- `permission_missing`
- `sync_failed`
- `recovery_needed`

Recommended `auth_type` literals:

- `oauth`
- `api_key`
- `service_account`
- `webhook_secret`

## Domain 2 - Adapter decision matrix

Recommended `ConnectorAdapterDecision` fields:

- `decision_record_id`
- `provider`
- `primary_use_case`
- `preferred_adapter`
- `auth_model`
- `official_doc_refs`
- `scope_requirements`
- `rate_limit_notes`
- `webhook_support`
- `retention_notes`
- `data_class`
- `evidence_status`
- `exceptions`
- `reviewed_at`

Recommended `preferred_adapter` literals:

- `nango`
- `direct`
- `defer`

Recommended `evidence_status` literals:

- `verified`
- `pending_verification`

First-wave providers that should have explicit rows:

- `ga4`
- `gsc`
- `hubspot`
- `linkedin`
- `meta`
- `posthog`

## Domain 3 - Max-3 onboarding recommendation logic

Recommended `ConnectorRecommendationBundle` fields:

- `bundle_id`
- `tenant_id`
- `business_type`
- `go_to_market_motion`
- `primary_goal`
- `recommended_connectors`
- `wow_promise`
- `setup_minutes_estimate`
- `fallback_connector`
- `failure_task_template`
- `created_at`
- `updated_at`

Rules:

- `recommended_connectors` must never exceed 3
- every connector recommendation needs a concrete wow promise
- failed setup must create recovery work instead of disappearing into onboarding

## Domain 4 - First wow audit

The safest first wow path is read-only:

- website-led SaaS or DTC: `ga4` plus `gsc`
- CRM-led B2B: `hubspot` or equivalent CRM freshness and stalled-opportunity audit
- social-led tenants: read-only profile or content audit with no publishing enabled

Recommended `ConnectorWowAudit` fields:

- `wow_audit_id`
- `tenant_id`
- `connector_install_id`
- `audit_type`
- `audit_status`
- `insight_count`
- `recovery_task_id`
- `evidence_refs`
- `time_to_connect_minutes`
- `time_to_wow_minutes`
- `created_at`
- `updated_at`

Recommended `audit_type` literals:

- `ga4_gsc_acquisition`
- `crm_pipeline_freshness`
- `social_profile_audit`

Recommended `audit_status` literals:

- `ready`
- `no_data`
- `stale_data`
- `recovery_needed`

## Domain 5 - Dependent-agent pause and recovery tasks

Recommended `ConnectorDependencyPause` fields:

- `pause_id`
- `connector_install_id`
- `agent_id`
- `run_id`
- `pause_reason`
- `resumable`
- `created_at`

Recommended `ConnectorRecoveryTask` fields:

- `recovery_task_id`
- `connector_install_id`
- `provider`
- `failure_kind`
- `missing_scope`
- `impacted_agent_ids`
- `blocked_run_ids`
- `safe_retry_action`
- `owner_role`
- `status`
- `created_at`
- `updated_at`

Recommended `failure_kind` literals:

- `revoked_token`
- `missing_scope`
- `rate_limited`
- `stale_sync`

Recommended `status` literals:

- `open`
- `in_progress`
- `resolved`
- `dismissed`

## Domain 6 - Backfill, retry, recovery evidence, and future compatibility

Recommended `ConnectorSyncAttempt` fields:

- `sync_attempt_id`
- `connector_install_id`
- `sync_mode`
- `cursor_ref`
- `started_at`
- `finished_at`
- `status`
- `retry_count`
- `dlq_ref`
- `freshness_status`
- `evidence_refs`
- `recovery_task_id`

Recommended `sync_mode` literals:

- `incremental`
- `backfill`
- `retry`

Recommended `status` literals:

- `queued`
- `running`
- `partial`
- `failed`
- `complete`
- `dlq`

Recommended `freshness_status` literals:

- `fresh`
- `stale`
- `unknown`

The future compatibility map should explicitly name downstream consumers such as:

- `content_loop`
- `tenant0`
- `saas_activation`
- `saas_health`
- `plg_growth`
- `abm_growth`
- `community_growth`
- `developer_marketing`

Every row should be marked `future_consumer`, not treated as active execution scope.

## Validation architecture

The phase needs a `210-VALIDATION.md` that covers:

- Wave 0.5 upstream readiness and architecture lock
- ConnectorInstall contract and status transitions
- adapter decision matrix and official-doc traceability
- onboarding recommendation cap and wow-promise logic
- first wow audit and fallback behavior
- pause/recovery task linkage
- sync/backfill/recovery evidence and future connector compatibility map

## Risks

- If Phase 210 re-owns run, task, evidence, or compliance substrate, later phases can hide upstream incompleteness behind "connector readiness."
- If the first wow path is write-capable or underspecified, the phase proves risk instead of value.
- If connector failure does not block downstream work explicitly, later loop and SaaS phases inherit stale-data risk.
- If backfill and retry are vague, operators cannot distinguish healthy data from partial or stale data.

## Phase implications

- Phase 211 should consume explicit connector readiness and wow outputs instead of reinventing connector state.
- Phase 213 should validate Tenant 0 connector inventory and recovery behavior as part of readiness.
- Phases 214-220 should consume the compatibility map instead of reopening base connector doctrine.

## Acceptance tests implied

- ConnectorInstall RLS, status-transition, and credential-reference tests
- Adapter matrix tests for provider rows, official-doc traceability, and adapter decision vocabulary
- Onboarding recommendation tests proving no bundle exceeds three connectors
- Wow audit tests for success, no-data, stale-data, and recovery-needed outcomes
- Pause tests proving degraded connectors block unsafe downstream work and create precise recovery tasks
- Backfill tests proving cursor-based idempotency, partial failure visibility, retry, DLQ, and recovery evidence
