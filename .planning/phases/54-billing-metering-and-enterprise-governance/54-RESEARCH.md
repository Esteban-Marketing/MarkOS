# Phase 54: Billing, Metering, and Enterprise Governance - Research

**Researched:** 2026-04-03
**Domain:** Tenant billing, usage metering, enterprise SSO/SAML, and governance evidence on the MarkOS v3.2 multi-tenant runtime
**Confidence:** MEDIUM-HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

### Billing Model and Metering Contract
- **D-01:** Use a hybrid billing model: base subscription plus metered overages for tokens, agent runs, and premium feature units.
- **D-02:** Preserve raw telemetry lineage and aggregate it into billable units rather than billing directly from raw event streams.
- **D-03:** Every billed unit must reconcile back to immutable Phase 52/53 telemetry so finance and operators can explain charges without manual stitching.

### Entitlement and Billing Failure Behavior
- **D-04:** Enforce entitlement-safe degradation when a tenant exceeds allowance or billing state is unhealthy.
- **D-05:** Restricted write, execute, and premium operations fail closed with explicit operator-facing reason codes; core read access and evidence visibility should remain available.
- **D-06:** Billing failures may not silently over-provision restricted capabilities; holds, degradation, and recovery state must be auditable.

### Billing Surfaces and User Experience Scope
- **D-07:** Phase 54 includes a balanced internal plus tenant-facing billing surface.
- **D-08:** Operators need reconciliation, hold/dunning, and invoice-evidence workflows; tenants also need a meaningful usage and billing view in the same phase.
- **D-09:** Tenant-facing billing views should reflect the same reconciled ledger used by operators, not a separate approximate reporting path.

### Enterprise Identity and Governance Scope
- **D-10:** Prioritize SSO/SAML federation, external-role to canonical-role mapping, and audit evidence for identity-bound privilege changes.
- **D-11:** External identity claims map onto existing IAM v3.2 canonical roles rather than introducing a second permission model.
- **D-12:** Full provisioning lifecycle automation beyond deterministic mapping and governed access changes is deferred unless required by locked scope later.

### Governance Evidence and Compliance Readiness
- **D-13:** Governance outputs must cover privileged billing actions, privileged identity changes, retention/export evidence, and vendor/subprocessor traceability for AI and billing providers.
- **D-14:** Compliance-ready evidence should be generated from existing immutable logs and ledgers, not from ad hoc operator notes.

### Claude's Discretion
- The planner/researcher may choose exact billing-provider integration boundaries, storage schema, and job cadence as long as reconciliation lineage and entitlement-safe behavior remain intact.
- The planner/researcher may choose whether usage aggregation is near-real-time or batched so long as invoice evidence, tenant views, and operator reconciliation stay consistent.

### Deferred Ideas (OUT OF SCOPE)
- Full SCIM or broader provisioning/deprovisioning automation beyond the initial federation and mapping boundary.
- Compliance workflows that require a separate privacy-lifecycle product surface rather than evidence/reporting from existing controls.
- Pricing-packaging optimization beyond the hybrid billing contract locked here.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BIL-01 | Subscription entitlements and billing state are enforced per tenant without breaking tenant isolation or plugin/runtime compatibility. | Existing tenant JWT enforcement, plugin entitlement tables, and IAM roles can support a request-time entitlement snapshot gate at hosted auth, plugin guard, and agent action boundaries. |
| BIL-02 | Metering events from plugin and agent runtimes are validated, deduplicated, and aggregated into billing-period usage records. | Phase 52/53 already emit correlated tenant-scoped telemetry with correlation IDs; research recommends a normalized usage-event table plus immutable billing ledger derived from those events. |
| BIL-03 | Operators can reconcile invoice-grade usage, invoice line items, and billing-provider failures with entitlement-safe degradation. | Research recommends MarkOS Postgres as source of truth, Stripe as invoice/payment sync boundary, explicit hold states, and evidence-first operator workflows. |
| IAM-04 | Enterprise identity federation extends IAM v3.2 with external role mapping and governed provisioning boundaries. | Existing Supabase JWT-based auth can absorb multi-tenant SAML provider IDs and mapped claims; research recommends Supabase Enterprise SSO first, with canonical role mapping persisted in MarkOS tables and audit events. |
| GOV-01 | Compliance-ready governance artifacts exist for billing, identity, and privileged operations. | Existing audit-log and immutable event patterns can be extended into exportable evidence packs, vendor inventory records, and retention/export controls without inventing a parallel evidence system. |
</phase_requirements>

## Summary

Phase 54 should be planned as an extension of the Phase 51-53 tenancy, policy, and telemetry foundation, not as a greenfield billing system. The repository already has the right raw ingredients: tenant-bound auth and RLS, canonical IAM roles including `billing-admin`, immutable denial and approval events, plugin enablement tables with plan entitlement placeholders, agent run events with correlation lineage, and an audit-log baseline. What is missing is the actual billing control plane: persisted normalized usage ingestion, subscription and billing-state records, invoice-grade ledger tables, billing-provider sync state, operator and tenant billing surfaces, and enterprise SSO/session wiring in the app runtime.

The cleanest architecture for this repo is: keep MarkOS Postgres/Supabase as the system of record for entitlements, normalized usage, reconciliation state, and governance evidence; use Stripe only as the external billing and invoice execution boundary; use Supabase Enterprise SSO/SAML instead of introducing a second auth stack; and enforce entitlements at the existing request-time gates that already fail closed. That preserves the locked requirement that every billed unit reconcile back to immutable Phase 52/53 telemetry and avoids splitting identity or billing truth across multiple ad hoc stores.

The planning risk is not raw implementation difficulty. The real risk is sequencing. Billing will fail if the phase tries to do pricing, metering, entitlement enforcement, Stripe sync, operator UI, tenant UI, SAML role mapping, and governance exports in one undifferentiated pass. The plan should separate ledger correctness first, enforcement second, surfaces third, and enterprise federation/governance fourth, with clear Wave 0 tests before any UI work.

**Primary recommendation:** Use Supabase/Postgres as the authoritative entitlement and billing ledger, derive invoice-grade usage from immutable Phase 52/53 telemetry, sync invoice/payment state to Stripe, and implement SAML federation through Supabase Enterprise SSO with MarkOS-owned canonical role mapping and audit evidence.

## Project Constraints (from CLAUDE.md)

- Read `.protocol-lore/QUICKSTART.md`, `.protocol-lore/INDEX.md`, `.planning/STATE.md`, and `.agent/markos/MARKOS-INDEX.md` first in new sessions.
- Treat `.planning/STATE.md` as canonical live state.
- Keep GSD concerns under `.planning/` and `.agent/get-shit-done/`; keep MarkOS protocol concerns under `.agent/markos/` and `.agent/skills/markos-*`.
- Client overrides belong only under `.markos-local/`.
- Primary CLI and install path is `npx markos`.
- Primary test commands are `npm test` or `node --test test/**/*.test.js`.
- The local onboarding UI runs with `node onboarding/backend/server.cjs`.

## Current-State Inventory

### Tenant and IAM foundation already available

| Surface | What exists now | Why Phase 54 can build on it |
|---------|-----------------|-------------------------------|
| `onboarding/backend/runtime-context.cjs` | Hosted auth boundary resolves JWT, validates tenant_id, rejects ambiguous tenant context, exposes deny telemetry helpers, and carries provider/tool policy metadata. | Billing and enterprise SSO should attach to this same verified JWT + tenant context path rather than invent a parallel session model. |
| `lib/markos/tenant/contracts.js` | Canonical tenant membership, principal, and legacy-to-IAM mapping contracts. | External SSO claims can map into existing v3.2 roles instead of creating a second permission model. |
| `lib/markos/rbac/iam-v32.js` | Canonical roles include `billing-admin`; `manage_billing` is already action-scoped and fail-closed. | Phase 54 can add new billing and governance actions without widening legacy UI roles. |
| `supabase/migrations/51_multi_tenant_foundation.sql` | `markos_tenant_memberships` exists with RLS and tenant-scoped audit-log augmentation. | Subscription, SSO mapping, and governance records can follow the same tenant/RLS shape. |

### Metering source telemetry already available

| Surface | What exists now | Why it matters |
|---------|-----------------|----------------|
| `lib/markos/plugins/telemetry.js` | Plugin events are immutable objects with tenant_id, actor_id, plugin_id, correlation_id, operation_name, timestamp, and payload sanitization. | This is the Phase 52 raw source for billable plugin usage and feature evidence. |
| `test/plugin-telemetry.test.js` | Tests assert immutable plugin events, sanitization, brand-pack version capture, and draft-to-publish lineage via correlation_id. | Phase 54 can rely on the event shape and lineage semantics instead of redefining them. |
| `onboarding/backend/agents/telemetry.cjs` | Canonical provider-attempt and run-close emitters require tenant_id, tool events, cost, latency, prompt version, and outcome. | This is the Phase 53 raw source for token, run, and provider-attempt billing units. |
| `onboarding/backend/agents/orchestrator.cjs` | Finalizer assembles provider attempts and run-close records from actual agent results and correlation-aware run envelopes. | The usage ledger can derive agent billable units without scraping logs or approximating UI analytics. |
| `supabase/migrations/53_agent_run_lifecycle.sql` | `markos_agent_runs`, `markos_agent_run_events`, and `markos_agent_side_effects` already exist as tenant-scoped append-only foundations. | The billing pipeline can anchor lineage to persisted run envelopes/events instead of transient memory-only runtime objects. |

### Plugin entitlement hooks already available

| Surface | What exists now | Why it matters |
|---------|-----------------|----------------|
| `supabase/migrations/52_plugin_runtime_foundation.sql` | `plugin_tenant_config`, `plugin_tenant_capability_grants`, and `plugin_entitlements_by_plan` already exist. | Phase 54 does not need to invent plugin entitlement storage; it needs to make it authoritative at request time. |
| `onboarding/backend/runtime-context.cjs` | In-memory helpers already check plugin enabled state and granted capabilities, but they explicitly note production hydration is deferred. | This is the exact enforcement seam for BIL-01 plan gating and degradation. |
| `api/tenant-plugin-settings.js` | There is already an owner/tenant-admin settings endpoint, but persistence is still in-memory/test-oriented. | Phase 54 can extend this into durable entitlement and billing-state management rather than replacing it. |

### UI surfaces that can host Phase 54 features

| Surface | Current status | Phase 54 implication |
|---------|----------------|----------------------|
| `app/(markos)/settings/plugins/page.tsx` and `actions.ts` | Existing tenant settings page manages plugin enablement and capability grants. | Tenant billing and entitlements can live beside plugin settings in the same settings architecture. |
| `app/(markos)/operations/page.tsx` and `app/(markos)/operations/tasks/*` | Operator-facing shell already models evidence-first workflows, but role/session values are placeholders. | Operator billing reconciliation and governance review UIs can reuse the evidence-first pattern, but auth scaffolding must harden first. |
| `app/(markos)/layout.tsx` | Navigation and tenant identity are scaffolded with hard-coded role and null tenant placeholders. | Any tenant/operator billing UI will remain mock-only until session-backed auth is wired. |

### Audit and governance building blocks already available

| Surface | What exists now | Why it matters |
|---------|-----------------|----------------|
| `lib/markos/telemetry/events.ts` | Canonical telemetry event names and payload sanitization contract. | Governance exports should reuse these envelopes and not introduce unsanitized side channels. |
| `onboarding/backend/runtime-context.cjs` | `buildDenyEvent` and `emitDenyTelemetry` produce immutable deny records with correlation IDs. | Identity and billing privilege denials can follow the same evidence model. |
| `supabase/migrations/37_markos_ui_control_plane.sql` and `51_multi_tenant_foundation.sql` | `markos_audit_log` exists and was later augmented with `tenant_id`. | Privileged billing and identity changes can append to an existing audit surface rather than invent a second log. |

## Gaps and Missing Primitives

### Root gaps

| Gap | Evidence in repo | Planning consequence |
|-----|------------------|----------------------|
| No persisted billing source tables | There are no subscription, invoice, billing-period, usage-event, usage-ledger, or reconciliation tables anywhere in `supabase/migrations/`. | Wave 1 must create the billing schema before any UI or provider integration work. |
| No durable usage ingestion path | Plugin telemetry returns frozen objects; agent telemetry emits analytics events, but there is no persisted normalized metering sink. | BIL-02 requires a new normalization + dedupe pipeline, not just more UI. |
| Entitlement enforcement is partial and mostly placeholder | `plugin_entitlements_by_plan` exists, but request-time enforcement is explicitly deferred to Phase 54; `api/tenant-plugin-settings.js` is still in-memory. | BIL-01 is fundamentally a runtime enforcement phase, not just billing math. |
| App auth/session is still scaffold-level | `app/(markos)/layout.tsx` hard-codes the role; `app/(markos)/operations/page.tsx` hard-codes a placeholder auth context. | Tenant/operator billing and SSO UX cannot be treated as simple page additions; auth/session plumbing is prerequisite work. |
| No SSO/SAML implementation exists in repo | A repo-wide search finds SSO/SAML only in planning docs, not in runtime code or package dependencies. | IAM-04 requires a net-new auth integration track. |
| No governance export, retention-control, or vendor inventory artifacts | Governance appears only in specs and audit primitives, not in export/reporting code. | GOV-01 needs explicit evidence-generation and report surfaces, not implicit reuse. |

### Missing primitives Phase 54 should add

- `billing_customers` / tenant-to-provider identity mapping
- `billing_subscriptions` / plan state, term, trial, billing cadence, dunning/hold status
- `billing_entitlement_snapshots` / computed request-time allowance state by tenant and billing period
- `billing_usage_events` / normalized deduplicated billable events linked to raw telemetry source IDs
- `billing_usage_ledger` / immutable aggregated billed units by tenant, period, and unit type
- `billing_invoice_line_items` / MarkOS-side evidence model for what was billed and why
- `billing_provider_sync_log` / Stripe sync attempts, failures, retries, external object IDs
- `billing_holds` / explicit degradation state and reason codes
- `sso_providers` or `tenant_sso_bindings` / tenant to Supabase `sso_provider_id` binding and metadata
- `identity_role_mapping_rules` and `identity_role_mapping_events` / deterministic external claim -> canonical role mapping and audit evidence
- `governance_reports`, `governance_exports`, or equivalent materialized/report tables for billing, identity, retention/export, and vendor inventory evidence

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Supabase Auth Enterprise SSO | Managed service | Multi-tenant SAML federation, provider metadata, attribute mappings, and JWT claims | The repo already relies on Supabase JWTs and tenant-aware RLS. Using Supabase SSO avoids a second auth/session system and directly exposes `sso_provider_id` and mapped claims in JWTs. |
| `@supabase/supabase-js` | `2.101.1` current on npm; repo currently uses `^2.58.0` | Existing auth, data, and hosted-runtime client base | Already in the repo; the SSO and session work should stay on the same client family. |
| PostgreSQL on Supabase | Current project database | Source-of-truth storage for subscriptions, usage events, usage ledger, entitlement snapshots, and governance evidence | Phase 51-53 already standardized on tenant-scoped Postgres + RLS + append-only evidence tables. |
| `stripe` | `22.0.0` | External subscription, invoice, payment, dunning, and customer portal boundary | Stripe Billing natively supports subscription, per-seat, and usage-based models, invoices, retries, and customer portal flows. It should execute billing, not own MarkOS metering truth. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@supabase/ssr` | `0.10.0` | Next.js session/callback helpers for SSO redirects and server-rendered auth state | Use when hardening the app routes so billing and governance pages stop using placeholder auth state. |
| `posthog-node` | repo currently `^5.21.2` | Operational analytics/event emission | Keep for product analytics only. Do not treat PostHog as the invoice-grade billing ledger. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Supabase Enterprise SSO | `@node-saml/passport-saml` `5.1.0` | More SP-level control, but it introduces a second auth/session boundary, requires its own callback/cache handling, and duplicates the hosted JWT enforcement model already central to MarkOS. |
| MarkOS Postgres as billing source of truth | Provider-native meters only | Easier provider sync, but weaker lineage and harder reconciliation against the locked requirement that every billed unit map back to immutable Phase 52/53 telemetry. |
| Stripe Billing | Custom invoice generation | Reinvents invoicing, retries, payment collection, customer portal, and dunning with high compliance and edge-case risk. |

**Installation:**

```bash
npm install stripe @supabase/ssr
```

**Version verification:**

- `stripe` -> `22.0.0` (`npm view stripe version time.modified`, modified `2026-04-03`)
- `@supabase/supabase-js` -> `2.101.1` (`npm view @supabase/supabase-js version time.modified`, modified `2026-04-03`)
- `@supabase/ssr` -> `0.10.0` (`npm view @supabase/ssr version time.modified`, modified `2026-03-30`)
- `@node-saml/passport-saml` -> `5.1.0` (`npm view @node-saml/passport-saml version time.modified`, modified `2025-07-24`)

## Architecture Patterns

### Recommended Project Structure

```text
lib/markos/
├── billing/                 # normalization, pricing, entitlement snapshots, provider sync
├── governance/              # report builders, retention/export evidence, vendor inventory
├── identity/                # SSO provider bindings, claim mapping, canonical role resolution
└── telemetry/               # raw event contracts and billing normalization helpers

api/
├── billing/                 # tenant/operator billing endpoints
├── governance/              # audit export and access review endpoints
└── auth/                    # SSO callback/initiation glue only if app-level callback is needed

supabase/migrations/
└── 54_*.sql                 # billing, SSO binding, and governance evidence schema

app/(markos)/
├── settings/billing/        # tenant billing + entitlements + invoices
├── admin/billing/           # operator reconciliation, holds, dunning, invoice evidence
└── admin/governance/        # SSO mappings, access review, retention/export, vendor inventory
```

### Pattern 1: Immutable Telemetry -> Normalized Usage Event -> Billing Ledger

**What:** Treat Phase 52/53 telemetry as immutable raw source data. Create a separate normalized metering event table keyed by deterministic dedupe keys, then aggregate into immutable billing ledger rows per billing period.

**When to use:** For all billable units: agent runs, input/output/cached tokens, premium feature operations, plugin executions, and storage snapshots.

**Why:** Raw telemetry is noisy and runtime-oriented; invoice evidence needs validated units, dedupe guarantees, and stable pricing snapshots.

**Example:**

```typescript
// Source: onboarding/backend/agents/telemetry.cjs + lib/markos/plugins/telemetry.js
type BillingUsageEvent = {
  tenant_id: string;
  billing_period_start: string;
  billing_period_end: string;
  unit_type: 'agent_run' | 'token_input' | 'token_output' | 'plugin_operation' | 'storage_gb_day';
  quantity: number;
  source_type: 'agent_run_close' | 'agent_provider_attempt' | 'plugin_operation';
  source_event_key: string; // deterministic dedupe key
  correlation_id: string;
  source_payload_ref: string; // run_id/event_id/raw event primary key
  priced_at: string;
};
```

### Pattern 2: Request-Time Entitlement Snapshot Enforcement

**What:** Build a computed entitlement snapshot for the active tenant and billing period, then check it at the same fail-closed boundaries that already protect tenant and plugin runtime access.

**When to use:** Plugin enablement, premium feature access, agent execution, and write/execute operations that become restricted under hold or overage conditions.

**Where to enforce:**

- `onboarding/backend/runtime-context.cjs`
- `api/tenant-plugin-settings.js`
- plugin route guards under `lib/markos/plugins/digital-agency/`
- action authorization in `onboarding/backend/handlers.cjs`

**Anti-pattern:** Checking billing state only in the UI. That will violate BIL-01 and BIL-03 immediately.

### Pattern 3: MarkOS Ledger First, Stripe Second

**What:** MarkOS computes entitlements, normalized usage, reconciliation status, and invoice evidence. Stripe receives the line items, subscription state, and collection workflow.

**When to use:** Always. Provider sync should be a projection of the MarkOS ledger, not the source of billable truth.

**Why:** The locked requirement is reconciliation back to Phase 52/53 telemetry. Stripe cannot satisfy that alone.

### Pattern 4: SSO Provider Binding -> Claim Extraction -> Canonical Role Mapping

**What:** Bind each enterprise tenant to a Supabase `sso_provider_id`, map incoming SAML attributes/groups into a MarkOS mapping rule set, then produce canonical IAM roles and an immutable mapping event.

**When to use:** Enterprise SSO sign-in, role re-evaluation on each login, and negative-path role mapping denials.

**Why:** Existing auth is JWT-centric. Supabase SSO exposes provider and mapped claims in JWTs, which can feed the existing tenant authorization model without introducing a second permission system.

**Example:**

```typescript
// Source: Supabase SAML docs + lib/markos/rbac/iam-v32.js
type IdentityRoleMappingEvent = {
  tenant_id: string;
  actor_id: string;
  sso_provider_id: string;
  source_claims: Record<string, unknown>;
  matched_rule_id: string | null;
  canonical_role: 'owner' | 'tenant-admin' | 'manager' | 'contributor' | 'reviewer' | 'billing-admin' | 'readonly' | null;
  decision: 'granted' | 'denied';
  denial_reason: string | null;
  correlation_id: string;
  mapped_at: string;
};
```

### Pattern 5: Shared Ledger, Split Views

**What:** Serve both tenant and operator billing screens from the same ledger and evidence tables, with different filters and actions.

**Tenant view:** Usage totals, current plan, credits/allowance, invoices, payment state, holds, and plain-language charge explanations.

**Operator view:** Reconciliation mismatches, ledger lineage, provider sync failures, dunning/hold controls, line-item evidence, access-review and export workflows.

## Recommended Architecture by Concern

### Billing ledger and aggregation

1. Persist raw source references, not just aggregate counters.
2. Normalize telemetry into `billing_usage_events` with deterministic dedupe keys.
3. Aggregate normalized usage into immutable `billing_usage_ledger` rows per period and unit type.
4. Materialize `billing_invoice_line_items` from the ledger using priced entitlements active at the time of invoice close.
5. Keep Stripe object IDs on sync tables, not on raw usage rows.

### Entitlement enforcement

1. Compute a request-time entitlement snapshot by tenant and billing period.
2. Apply it at hosted auth, plugin guard, and agent action boundaries.
3. Fail closed for restricted write/execute/premium actions.
4. Keep read access to billing evidence and core visibility during holds or provider-sync failures.
5. Emit explicit reason codes for all denials and degradation states.

### Invoice evidence

1. Every line item should include back-references to usage ledger rows.
2. Every usage ledger row should include back-references to raw Phase 52/53 telemetry or persisted run/plugin event IDs.
3. Operator UI should expose that lineage without requiring manual log stitching.
4. Tenant UI should expose the same ledger in a translated billing vocabulary, not internal event names.

### Tenant and operator UI surfaces

1. Tenant surface: `settings/billing` for plan, usage, invoices, holds, and charge explanations.
2. Operator surface: `admin/billing` for reconciliation, invoice evidence, sync failures, dunning, and manual hold review.
3. Governance surface: `admin/governance` for SSO mappings, privileged action evidence, retention/export status, and vendor inventory.
4. Do not build separate approximate reporting endpoints for tenant vs operator billing views.

### SSO/SAML role mapping

1. Prefer Supabase Enterprise SSO and `signInWithSSO` over a bespoke Passport SAML stack.
2. Bind tenants to Supabase `sso_provider_id` values.
3. Use Supabase attribute mappings to surface groups/roles/department identifiers into JWT claims.
4. Resolve those claims into MarkOS canonical roles using MarkOS-owned mapping rules.
5. Persist both success and denial mapping events with source claims, matched rule, canonical role, and correlation ID.
6. Never key identity or tenant membership by email alone; Supabase docs explicitly note no automatic linking and email non-uniqueness for SSO identities.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Invoice collection and dunning | Custom invoice PDFs, payment collection, retry logic, portal, and subscription lifecycle | Stripe Billing | The feature set is large, regulated, and already solved. MarkOS should own evidence and reconciliation, not card collection. |
| SAML protocol handling | Custom XML/SAML parser, signature validation, ACS endpoints, and certificate rollover logic | Supabase Enterprise SSO first | The repo already standardizes on Supabase JWT auth. A second auth system would create avoidable session and policy drift. |
| Billable-usage truth from analytics | Billing directly off PostHog or ad hoc runtime logs | MarkOS normalized usage events + billing ledger | Analytics streams are not invoice-grade and will not satisfy lineage or dedupe requirements. |
| Cross-tenant entitlement checks in UI only | Frontend-only plan gating | Server-side checks in runtime-context, handlers, and plugin guards | Fail-open billing enforcement is explicitly out of scope and unsafe. |
| Identity role resolution by email heuristics | `email -> tenant` or `email domain -> role` shortcuts | SSO provider binding + claim mapping + canonical role rules | Supabase SSO docs note email may not be unique and identities are not auto-linked. |

**Key insight:** The dangerous temptation in this phase is to treat billing as a reporting feature. It is not. Billing is a runtime enforcement and evidence problem with invoice consequences.

## Common Pitfalls

### Pitfall 1: Billing directly from raw telemetry

**What goes wrong:** Duplicate deliveries, retries, or schema changes inflate usage and make invoices non-explainable.

**Why it happens:** Raw telemetry is optimized for observability, not billing finality.

**How to avoid:** Introduce a normalized usage-event table with deterministic dedupe keys and stable billable unit definitions.

**Warning signs:** Totals only reconcile to event counts, not to priced units or invoice lines.

### Pitfall 2: Fail-open entitlement handling during provider outages

**What goes wrong:** Restricted features continue operating while billing state is stale or broken, violating locked fail-closed requirements.

**Why it happens:** Teams often treat billing sync as asynchronous reporting rather than a control input.

**How to avoid:** Separate `billing_provider_sync_state` from `entitlement_snapshot`, and derive explicit hold/degradation states that existing guards can enforce.

**Warning signs:** UI says a tenant is on hold but plugin routes or agent runs still execute.

### Pitfall 3: Mixing SSO identities with existing users by email

**What goes wrong:** Wrong tenant binding, accidental privilege drift, and un-auditable identity merges.

**Why it happens:** Email feels stable, but Supabase SSO explicitly does not auto-link identities and does not guarantee email uniqueness.

**How to avoid:** Bind on Supabase user UUID + `sso_provider_id`; keep explicit mapping rules and membership reconciliation.

**Warning signs:** Role mapping logic references only `email` or `domain` with no provider binding.

### Pitfall 4: Letting legacy UI roles drive enterprise auth decisions

**What goes wrong:** You end up with one role model in SAML mapping and a different one in runtime policy.

**Why it happens:** The app shell still uses legacy route roles and placeholder state.

**How to avoid:** Normalize external claims into IAM v3.2 canonical roles only, then let UI and backend consume the same canonical model.

**Warning signs:** New SSO code maps directly to `owner/operator/strategist/viewer` instead of canonical IAM roles.

### Pitfall 5: Building billing surfaces before auth/session hardening

**What goes wrong:** The team ships mock billing pages that cannot enforce tenant boundaries or role-specific controls in production.

**Why it happens:** Current app pages are scaffold-first and auth-light.

**How to avoid:** Plan at least one early task that hardens session-backed auth on the relevant app surfaces before committing to billing/governance UI depth.

**Warning signs:** New pages still use hard-coded roles or tenant IDs.

## Code Examples

Verified patterns from the current repo and official docs:

### Tenant-bound agent telemetry already contains billing lineage fields

```javascript
// Source: onboarding/backend/agents/telemetry.cjs
function captureProviderAttempt(properties = {}) {
  const event = {
    run_id: properties.run_id || null,
    tenant_id: properties.tenant_id || null,
    attempt_number: Math.max(1, Math.trunc(normalizeNumeric(properties.attempt_number, 1))),
    provider: String(properties.provider || 'unknown'),
    model: String(properties.model || 'unknown'),
    latency_ms: Math.max(0, normalizeNumeric(properties.latency_ms, 0)),
    cost_usd: Math.max(0, normalizeNumeric(properties.cost_usd, 0)),
    token_usage: redactSensitive(properties.token_usage || {}),
  };
}
```

### Hosted auth already fails closed on missing or ambiguous tenant context

```javascript
// Source: onboarding/backend/runtime-context.cjs
if (!canonicalTenantId) {
  return {
    ok: false,
    status: 401,
    error: 'TENANT_CONTEXT_MISSING',
  };
}

if (conflictingTenant) {
  return {
    ok: false,
    status: 403,
    error: 'TENANT_CONTEXT_AMBIGUOUS',
  };
}
```

### Existing plugin plan-entitlement tables already anticipate Phase 54 enforcement

```sql
-- Source: supabase/migrations/52_plugin_runtime_foundation.sql
create table if not exists plugin_entitlements_by_plan (
  plan_tier text not null check (plan_tier in ('free', 'starter', 'pro', 'enterprise')),
  plugin_id text not null references markos_plugins(id) on delete cascade,
  allowed_capabilities text[] not null default '{}',
  feature_flags jsonb not null default '{}'
);
```

### Supabase SAML gives a better fit than a second auth stack

```typescript
// Source: official Supabase SSO docs
await supabase.auth.signInWithSSO({
  domain: 'company.com',
  options: {
    redirectTo: 'https://app.company.com/callback',
  },
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom SP-managed SAML stacks per app | Managed multi-tenant SAML via Supabase Enterprise SSO with JWT claims and provider IDs | Current Supabase SSO docs as of 2026 | Better fit for this repo because runtime auth and RLS already depend on Supabase JWTs. |
| Reporting-style usage rollups | Invoice-grade usage ledger derived from immutable source events | Current billing practice for usage-based SaaS; also required by locked scope | Stronger reconciliation, dedupe, and explainability. |
| UI-only plan gating | Server-side entitlement checks at request/action boundaries | Modern SaaS billing controls; already aligned with Phase 51 fail-closed posture | Prevents silent over-provisioning and audit gaps. |

**Deprecated/outdated:**

- Using `passport-saml` `3.2.4` directly from legacy docs is outdated for new work. The maintained package line is `@node-saml/passport-saml` `5.1.0`.
- Relying on raw analytics or approximate dashboard totals as billing truth is not acceptable for this phase.

## Key Risks and Sequencing Constraints

1. Auth hardening is a prerequisite for meaningful tenant/operator billing UI. Current app routes still use placeholder role and tenant state.
2. Usage normalization must precede Stripe sync. Otherwise the team will push unvalidated or duplicate units into invoices.
3. Entitlement enforcement must be designed before expanding plugin or billing surfaces, because holds and fail-closed behavior need shared reason-code semantics.
4. SSO claim mapping must land on canonical IAM roles only. Any shortcut to legacy UI roles will create policy drift.
5. Governance exports depend on billing and identity event schemas being stable. They should be planned late in the phase but modeled early.

## Suggested Plan Decomposition Candidates

1. Billing schema and normalization pipeline
   Outcome: subscription tables, billing periods, normalized usage events, dedupe keys, immutable usage ledger.
2. Entitlement snapshot and fail-closed enforcement
   Outcome: request-time plan checks at plugin, agent, and privileged billing boundaries with explicit reason codes.
3. Stripe sync and invoice evidence
   Outcome: provider sync tables, invoice line item generation, reconciliation mismatch handling, hold/dunning states.
4. Tenant billing surface
   Outcome: plan, usage, invoices, holds, and charge explanations from the shared ledger.
5. Operator billing and governance surface
   Outcome: reconciliation dashboard, evidence drill-down, manual hold review, access review, retention/export, vendor inventory.
6. Enterprise SSO/SAML and role mapping
   Outcome: tenant SSO bindings, claim mapping rules, session callback handling, canonical role mapping audit events, negative-path tests.

## Open Questions

1. **What exact billable unit taxonomy is finance locking?**
   - What we know: hybrid subscription plus metered tokens, runs, and premium features is locked.
   - What's unclear: whether tool executions, storage, seats, and project counts are billed as hard entitlements, overages, or reporting-only in v3.2.
   - Recommendation: lock a canonical unit catalog before implementation starts; otherwise BIL-02 and BIL-03 will drift.

2. **Should MarkOS push raw usage to Stripe meters or only invoice-ready aggregates?**
   - What we know: Stripe supports usage-based billing and metered products.
   - What's unclear: whether MarkOS wants Stripe to own per-event accumulation or only receive finalized line items.
   - Recommendation: keep MarkOS as the system of record and push finalized or bounded-period usage summaries, not raw internal telemetry.

3. **How much app auth hardening is acceptable inside Phase 54 scope?**
   - What we know: current app routes are scaffold-level and cannot support enterprise billing/governance UX safely as-is.
   - What's unclear: whether Phase 54 can include the minimum required auth/session hardening for billing pages, or whether that must be split into an enabling sub-plan.
   - Recommendation: make this an explicit Wave 0 decision in planning.

4. **What is the pricing and policy around annual plans, mid-cycle upgrades, credits, and disputes?**
   - What we know: the billing spec mentions monthly or annual cycles and hybrid pricing.
   - What's unclear: proration, prepaid credits, grace periods, and invoice dispute handling.
   - Recommendation: plan data models to support these states even if only monthly basics ship in the first execution wave.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | MarkOS runtime, Next.js, API handlers | Yes | `v22.13.0` | None |
| npm | Package install and test execution | Yes | `10.9.2` | None |
| Supabase CLI | Enterprise SSO/SAML provider management and operational inspection | Yes | `2.75.0` | Dashboard/manual setup, but CLI remains the better automation path |
| Stripe SDK | Billing provider integration | No (not installed yet) | - | Add dependency during Phase 54 |
| `@supabase/ssr` | Next.js callback/session hardening for SSO UI flows | No (not installed yet) | - | Use existing API-only hosted auth temporarily, but app-route UX will remain weak |

**Missing dependencies with no fallback:**

- None for planning/research.

**Missing dependencies with fallback:**

- `stripe` and `@supabase/ssr` are not installed yet; this blocks implementation depth, not planning.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Node built-in `node:test` |
| Config file | none - command-driven |
| Quick run command | `node --test test/agents/run-close-telemetry.test.js test/plugin-telemetry.test.js test/tenant-auth/iam-role-matrix.test.js` |
| Full suite command | `npm test` |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BIL-01 | Request-time entitlement snapshots block restricted actions and preserve allowed read visibility | unit + integration | `node --test test/billing/entitlement-enforcement.test.js test/billing/plugin-entitlement-runtime.test.js` | No - Wave 0 |
| BIL-02 | Raw plugin/agent telemetry is validated, deduped, and aggregated without inflating usage | unit + integration | `node --test test/billing/usage-normalization.test.js test/billing/usage-ledger-aggregation.test.js` | No - Wave 0 |
| BIL-03 | Invoice line items, sync failures, and hold states reconcile to ledger and fail closed | integration | `node --test test/billing/invoice-reconciliation.test.js test/billing/provider-sync-failure.test.js` | No - Wave 0 |
| IAM-04 | SSO claims map deterministically to canonical roles; escalation attempts fail and are audited | unit + integration | `node --test test/auth/sso-role-mapping.test.js test/auth/sso-negative-path.test.js` | No - Wave 0 |
| GOV-01 | Governance reports/export bundles can produce billing and identity evidence without manual stitching | integration + snapshot | `node --test test/governance/evidence-pack.test.js test/governance/vendor-inventory.test.js` | No - Wave 0 |

### Sampling Rate

- **Per task commit:** targeted `node --test` command for the affected requirement family
- **Per wave merge:** phase-specific suite covering billing, auth, and governance tracks
- **Phase gate:** `npm test` plus targeted Phase 54 suite green before `/gsd:verify-work`

### Wave 0 Gaps

- `test/billing/entitlement-enforcement.test.js` - covers BIL-01
- `test/billing/usage-normalization.test.js` - covers BIL-02
- `test/billing/usage-ledger-aggregation.test.js` - covers BIL-02
- `test/billing/invoice-reconciliation.test.js` - covers BIL-03
- `test/billing/provider-sync-failure.test.js` - covers BIL-03
- `test/auth/sso-role-mapping.test.js` - covers IAM-04
- `test/auth/sso-negative-path.test.js` - covers IAM-04
- `test/governance/evidence-pack.test.js` - covers GOV-01
- `test/governance/vendor-inventory.test.js` - covers GOV-01

## Sources

### Primary (HIGH confidence)

- Repository code and migrations inspected directly:
  - `onboarding/backend/runtime-context.cjs`
  - `onboarding/backend/agents/telemetry.cjs`
  - `onboarding/backend/agents/orchestrator.cjs`
  - `lib/markos/plugins/telemetry.js`
  - `lib/markos/rbac/iam-v32.js`
  - `supabase/migrations/51_multi_tenant_foundation.sql`
  - `supabase/migrations/52_plugin_runtime_foundation.sql`
  - `supabase/migrations/53_agent_run_lifecycle.sql`
  - `api/tenant-plugin-settings.js`
  - `app/(markos)/layout.tsx`
  - `app/(markos)/operations/page.tsx`
  - `app/(markos)/settings/plugins/page.tsx`
- Official Supabase SAML docs: `https://supabase.com/docs/guides/auth/enterprise-sso/auth-sso-saml`
- Official Stripe Billing docs: `https://docs.stripe.com/billing`
- Official Stripe usage-based billing docs: `https://docs.stripe.com/billing/subscriptions/usage-based`

### Secondary (MEDIUM confidence)

- npm registry package metadata:
  - `https://www.npmjs.com/package/@node-saml/passport-saml`
- Passport SAML package docs:
  - `https://www.passportjs.org/packages/passport-saml/`

### Tertiary (LOW confidence)

- None. Negative claims in this document are based on direct repository search plus official docs, not community-only sources.

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - Stripe Billing and Supabase SSO recommendations are verified against official docs and align with the repo's existing Supabase-centered auth/runtime model.
- Architecture: MEDIUM-HIGH - Strongly grounded in current repo surfaces, but exact pricing/unit taxonomy and UI/auth hardening boundaries still need planning decisions.
- Pitfalls: HIGH - Derived from direct repo gaps plus official Supabase SSO behavior and existing Phase 51-53 fail-closed constraints.

**Research date:** 2026-04-03
**Valid until:** 2026-05-03
