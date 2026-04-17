---
date: 2026-04-16
description: "Non-CRM business logic under lib/markos — LLM adapter, billing, governance, identity, RBAC, auth, outbound, telemetry, contracts, theme, packs."
tags:
  - reference
  - lib
  - core
---

# Core Lib

> Non-CRM modules under `lib/markos/`. Child of [[MarkOS Codebase Atlas]]. For CRM see [[CRM Domain]].

## lib/markos/llm — multi-provider adapter

| File | Purpose |
|---|---|
| `types.ts` | provider + call types |
| `adapter.ts` | single entry — `getLLMAdapter`, `callLLM`, `estimateCost` |
| `provider-registry.ts` | `registerProvider`, `getProviderConfig`, `listAvailableProviders` |
| `providers/claude.ts`, `openai.ts`, `gemini.ts`, `shared.ts` | per-provider implementations |
| `cost-calculator.ts` | token → $ cost |
| `fallback-chain.ts` | templates: `cost_optimized` · `speed_optimized` · `reliability_optimized` |
| `encryption.ts` | `encryptSensitiveConfig`, `decryptApiKey` |
| `telemetry-adapter.ts` | hooks to `markos_llm_call_events` |
| `settings.ts` | `getLLMSettings`, `validateProviderConfig` |

**Providers**: anthropic · openai · gemini.
**Decision modes**: explicit · default · fallback.
**Error codes**: TIMEOUT · RATE_LIMITED · AUTH_ERROR · INVALID_CONFIG · FALLBACK_EXHAUSTED · NOT_IMPLEMENTED · UNKNOWN_ERROR.

**DB backing** (migration 47): `markos_operator_llm_preferences` · `markos_operator_api_keys` · `markos_llm_call_events`.

## lib/markos/billing — usage, entitlements, Stripe

| File | Purpose |
|---|---|
| `contracts.ts` | types |
| `usage-ledger.ts` | `recordUsageEvent`, `aggregateUsageLedger`, `normalizeUsageUnit` — units: `agent_run`, `token_input`, `token_output`, `plugin_operation`, `storage_gb_day` |
| `entitlements.ts` | `resolveEntitlementSnapshot`, `checkEntitlementStatus`, `enforceEntitlementLimit` |
| `enforcement.cjs` | runtime gate |
| `invoice-line-items.ts` | `calculateLineItemAmount` |
| `pricing-catalog.ts` | `buildPricingCatalog`, `resolvePricingKey` |
| `stripe-sync.ts` | `syncBillingProvider`, `reconcileInvoiceRun` |
| `plugin-entitlements.cjs` | `computePluginEntitlementCredit` |
| `provider-sync.cjs` | `deriveProviderSyncOutcome` |
| `reconciliation.cjs` | `buildBillingLifecycleEvidence` |
| `usage-normalizer.ts` | event normalization |

**Usage sources**: `agent_run_close` · `agent_provider_attempt` · `plugin_operation` · `storage_snapshot`.

**DB backing** (migrations 54–55): `billing_periods` · `billing_pricing_snapshots` · `billing_usage_events` · `billing_usage_ledger_rows` · `billing_usage_ledger_lineage` · `billing_provider_sync_attempts` · `billing_invoice_projections` · `tenant_billing_subscriptions` · `tenant_billing_holds` · `tenant_entitlement_snapshots` · `billing_hold_events`.

## lib/markos/governance — evidence, vendor, retention

| File | Purpose |
|---|---|
| `contracts.ts` | |
| `evidence-pack.ts` / `evidence-pack.cjs` | `buildGovernanceEvidencePack`, `recordPrivilegedAction`, `listGovernanceEvidence` |
| `vendor-inventory.ts` | `maintainVendorInventory`, `reconcileVendorAccess` |

**Evidence sources**: `markos_audit_log` · `billing_usage_ledger` · `identity_role_mapping_events` · `billing_provider_sync_log` · `agent_approval_decision_log` · `tenant_configuration_change_log`.

**Privileged families**: authentication_authorization · approvals · billing_administration · tenant_configuration.

Retention workflow: `initiateDeletionWorkflow`, `recordExportCompletion` (migration 56: `governance_deletion_workflows`).

## lib/markos/identity — SSO + role mapping

- `sso-bindings.ts` — `bindSsoProvider`, `validateSamlAssertion`, `validateOidcToken`, `resolveTenantSsoBinding`.
- `role-mapping.ts` — `resolveTenantRole`, `mapExternalClaims`, `recordRoleMappingDecision`.
- Canonical roles: owner · tenant-admin · manager · contributor · reviewer · billing-admin · readonly.
- Claim types: group · role · attribute.

**DB backing** (migration 54): `tenant_sso_bindings` · `identity_role_mapping_rules` · `identity_role_mapping_events`.

## lib/markos/rbac — IAM v3.2

- `policies.ts` / `iam-v32.js` — `checkActionPolicy`, `evaluateCanonicalRole`, `assertAuthorizedAction`, `canPerformAction`.
- Actions: `execute_task` · `approve_task` · `send_outbound` · `manage_billing` · `publish_campaign` · `manage_users` · `review_cross_tenant_copilot` · … .

## lib/markos/auth — session

- `session.ts` — `createSession`, `validateSession`, `revokeSession`, `requireMarkosSession`, `getActiveTenantContext`, `requireCrmTenantContext`, `requireHostedSupabaseAuth`.

## lib/markos/outbound — email + SMS + consent

| File | Purpose |
|---|---|
| `workspace.ts` | `buildOutboundWorkspaceSnapshot`, `rankOutboundQueue`, `selectDueOutboundWork` |
| `scheduler.ts` | queue selection |
| `events.ts` | `normalizeOutboundEventForLedger`, `buildConversationStateUpdate` — states: active, reply_pending, opted_out, delivery_failed |
| `conversations.ts` | thread state machine |
| `drafts.ts` | `buildOutboundDraft`, `validateDraftContent` |
| `consent.ts` | `checkChannelConsent`, `recordOptOut`, `buildConsentEvidence`, `evaluateOutboundEligibility` |
| `providers/resend-adapter.ts` | email adapter |
| `providers/twilio-adapter.ts` | SMS/WhatsApp adapter |
| `providers/base-adapter.ts` | shared interface |

**DB backing** (migration 62): see [[CRM Domain]].

## lib/markos/telemetry — events

- `events.ts` / `events.cjs` — `recordTelemetryEvent`, `flushTelemetryBuffer`, `configureTelemetrySampling`.
- Categories: `markos_*` · `plugin_*` · `approval_*` · `execution_*` · `onboarding_*`.

## lib/markos/contracts — schema

- `schema.ts` — entity + pipeline + custom-field + workspace-view JSON schemas. Consumed by UI + APIs for validation.
- `snapshot.ts` — snapshot shape.

## lib/markos/theme — brand tokens

- `tokens.ts` · `brand-pack.ts` — brand pack configuration, design tokens.

## lib/markos/packs — plugin runtime loader

- `pack-loader.cjs` — loads plugin packs, resolves industry/business-model overlays. Central to v3.9 "Vertical Plugin Literacy Libraries" milestone.

**DB backing** (migration 52): `markos_plugins` · `plugin_tenant_config` · `plugin_tenant_capability_grants` · `plugin_entitlements_by_plan`.

## Cross-lib call graph (simplified)

```
api/**
  → lib/markos/auth/session            (gate)
  → lib/markos/rbac/iam-v32            (authorize)
  → lib/markos/crm/* | billing/* | governance/* | outbound/*  (domain)
    → lib/markos/llm/adapter           (any AI call)
    → lib/markos/telemetry/events      (audit)
    → supabase/*                       (persist)
```

## Related

- [[MarkOS Codebase Atlas]] · [[HTTP Layer]] · [[CRM Domain]] · [[Database Schema]] · [[Contracts Registry]] · [[Patterns]]
