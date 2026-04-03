# Phase 52: Plugin Runtime and Digital Agency Plugin v1 - Context

**Gathered:** 2026-04-03  
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 52 delivers the core plugin infrastructure for MarkOS v3.2 by implementing:
1. A plugin registry and in-process loader for deterministic plugin execution
2. Capability-based access control layered on top of v3.2 IAM roles
3. A full-featured Digital Agency plugin (agency team workflows, approvals, campaign scheduling)
4. Per-tenant plugin enablement with plan-tier gating (Phase 54 enforces tiers)
5. Plugin telemetry events ready for Phase 54 metering and billing

This phase owns PLG-DA-01, PLG-DA-02, and extensions to WL-01, WL-02, WL-03, WL-04 for plugin UI rendering.

This phase does not own marketplace distribution, third-party plugin onboarding, or live metering/billing enforcement (Phase 54).

</domain>

<decisions>
## Implementation Decisions

### Plugin Execution Model (D-01)
**Decision:** In-process CommonJS module loading at server boot with error boundaries per plugin.

**Rationale:** 
- Simplest model; direct access to Phase 51 tenant context and Phase 37 brand-pack
- Aligns with existing Phase 37 handler patterns
- Error boundaries isolate plugin failures and prevent cascade crashes
- Adequate for Phase 52 scope (single first-party plugin + MarkOS control)

**Constraints:**
- Plugins cannot block server startup; must fail gracefully
- Plugin dependencies must be pinned for deterministic loads
- Plugin memory and performance are shared; monitoring required

**Implementation notes:**
- Plugin registry: `lib/markos/plugins/registry.js` (register, list, resolve plugins)
- Plugin loader: `lib/markos/plugins/loader.js` (parse manifest, validate contracts, bound error handlers)
- Bootstrap: `bin/cli-runtime.cjs` loads plugins at server boot

---

### Plugin Capability Model (D-02)
**Decision:** Capabilities layer + IAM role fallback for maximum flexibility.

**Rationale:**
- Plugins declare fine-grained capabilities (e.g., `plugin.campaign.read`, `plugin.campaign.publish`)
- If tenant role has permission, capability check succeeds
- If not, tenant settings can explicitly grant capability overrides
- Avoids rigid IAM buckets while preserving Phase 51 role boundaries

**Capability Schema:**
- Plugin declares: `requiredCapabilities: ['plugin.campaign.read', 'plugin.campaign.write']`
- Tenant grants: via capability override settings UI
- Check order: explicitly granted capabilities first, then mapped IAM role permissions

**Constraints:**
- Capability names must be deterministic and queryable (for audit)
- Capability grants are immutable; stored in `plugin_tenant_capability_grants` table

---

### Digital Agency Plugin Scope (D-03)
**Decision:** Full-featured agency orchestration with team workflows, approvals, and campaign scheduling.

**Rationale:**
- Not just a wrapper; includes agency-specific logic for multi-campaign management
- Provides approval workflows for agency team collaboration
- Enables campaign scheduling and batch operations
- Differentiator from Phase 51 base MarkOS capabilities

**In Scope:**
- Campaign composition workflows (multi-discipline assembly)
- Team-level approvals and rejection workflows
- Batch campaign publishing and scheduling
- Agency dashboard (usage trends, campaign status, team activity)
- Campaign performance dashboards and reporting

**Out of Scope:**
- Live social posting (integration deferred to Phase 53+)
- Custom report builder (phase 54+)
- Third-party integration marketplace

---

### Tenant-Plugin Relationship (D-04)
**Decision:** Per-tenant plugin enablement gated by subscription plan tier.

**Rationale:**
- Each tenant can independently enable/disable plugins
- Free plan gets minimal plugins (read-only Digital Agency dashboard)
- Premium plans unlock full Digital Agency capabilities
- Phase 54 owns enforcement; Phase 52 implements data structures and grant logic

**Tenant Controls:**
- `plugin_tenant_config` table: tracks enabled plugins, capability grants
- Owner/tenant-admin API: enable/disable plugins, override capabilities
- Settings UI: plugin management screen per tenant

**Plan Gating:**
- Phase 52 creates tables (`plugin_entitlements_by_plan`) mapping plugins to plan tiers
- Phase 54 owns checking entitlements at request time; Phase 52 provides hooks

---

### Plugin Branding Model (D-05)
**Decision:** Auto-inherit tenant branding; plugins receive Phase 37 brand-pack via context.

**Rationale:**
- Plugins automatically render with tenant colors, logo, fonts
- Zero config per plugin; branding happens transparently
- Plugin responses include `brandContext` for client-side rendering
- Consistent tenant experience across all surfaces

**Implementation:**
- ExecutionContext includes `brandPack` from Phase 51 tenant principal
- Plugin routes return JSON + brandContext; frontend applies theme tokens
- White-label domain (Phase 37) routing works transparently for plugin URLs

**Constraints:**
- Plugins cannot override or escape tenant branding (no custom plugin branding)

---

### Plugin Telemetry Ownership (D-06)
**Decision:** Phase 52 emits standardized telemetry events; Phase 54 owns metering/billing.

**Rationale:**
- Phase 52 captures: `plugin.operation` events with actor, tenant, operation type, resource counts, costs
- Events persist to immutable telemetry store (Phase 51 foundation)
- Phase 54 aggregates telemetry into usage, cost, and invoice line items

**Telemetry Events:**
- `plugin.campaign.read`
- `plugin.campaign.created`
- `plugin.campaign.published`
- `plugin.dashboard.viewed`
- `plugin.approval.granted` / `plugin.approval.denied`
- Event payload includes: tenant_id, actor_id, plugin_id, resource_id, llm_tokens (if applicable), correlation_id

**Constraints:**
- Events are immutable (append-only)
- Payload sanitization required (no secrets, no credentials)
- All telemetry events use centralized Phase 51 telemetry service

---

### Plugin Data Model (D-07)
**Decision:** Hybrid schema: core plugin data (campaigns, drafts) in MarkOS with tenant_id; plugin working-state in plugin-owned schema.

**Rationale:**
- Campaigns and approvals are first-class MarkOS concepts; live in main schema with RLS
- Plugin working-state (e.g., in-draft campaign snapshots, scheduling metadata) in plugin namespace
- Simplifies RLS enforcement; plugin schema can be simpler

**Data Layers:**
1. **MarkOS Core:** `campaigns`, `campaign_approvals`, `campaign_schedules` — tenant_id partition, RLS enforced
2. **Plugin Working:** `plugin_campaigns_stage`, `plugin_campaign_drafts_temp` — plugin namespace, optional tenant partition

**Constraints:**
- All tenant-scoped queries in MarkOS schema require tenant_id filter + RLS
- Plugin schema follows plugin_id/tenant_id namespacing convention

---

### the agent's Discretion

- Table naming conventions (campaigns vs digital_agency_campaigns, etc.)
- Plugin manifest format (JSON schema for plugin.json)
- Error boundary implementation details (catch/rethrow strategy)
- Capability naming taxonomy (flat `plugin.x.y` vs hierarchical)
- API endpoint routing (routes under `/plugins/digital-agency/` vs `/digital-agency/`)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 51 & v3.2 Foundation
- `.planning/phases/51-multi-tenant-foundation-and-authorization/51-CONTEXT.md` — Tenant identity, context propagation, fail-closed semantics
- `.planning/phases/51-multi-tenant-foundation-and-authorization/51-RESEARCH.md` — Multi-tenant patterns and Phase 51 delivered artifacts
- `lib/markos/tenant/contracts.ts` — TenantPrincipal, TenantMembership, ExecutionContext shape
- `lib/markos/rbac/iam-v32.ts` — v3.2 role definitions and action permission matrix

### Phase 37 White-Label Foundation
- `.planning/phases/37-*/37-CONTEXT.md` (Phase 37 white-label context)
- `lib/markos/branding/` — Brand-pack schema, tenant theme resolver
- `app/(markos)/layout.tsx` — How tenant context flows to UI; branding inheritance pattern

### Requirements & Roadmap
- `.planning/REQUIREMENTS.md` — PLG-DA-01, PLG-DA-02, WL-01–WL-04 definitions
- `.planning/ROADMAP.md` — Phase 52–54 sequencing; Phase 54 metering placeholder
- `.planning/phases/52-plugin-runtime-and-digital-agency-plugin-v1/52-RESEARCH.md` — Architecture research and code examples

### Telemetry & Audit
- `lib/markos/telemetry/events.ts` — Event schema and payload sanitization
- `.planning/phases/51-multi-tenant-foundation-and-authorization/51-*` — Audit requirements, immutable event patterns

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/markos/tenant/contracts.ts` — ExecutionContext shape can be extended with `pluginContext` or used as-is
- `onboarding/backend/handlers.cjs` — Handler middleware pattern shows tenant context enforcement; plugin handlers follow same pattern
- `lib/markos/rbac/policies.ts` — Role permission checks can be extended with capability overrides
- `lib/markos/telemetry/events.ts` — `buildEvent()` and `sanitizePayload()` used by all Phase 52 telemetry

### Established Patterns
- **Error boundary pattern:** Phase 47 LLM provider fallback shows error recovery; apply same concept per plugin
- **Middleware chain:** Phase 51 wrapper auth → Phase 52 plugin capability check → downstream handler
- **Immutable events:** Phase 51 deny events demonstrate append-only event model; Phase 52 plugin telemetry follows same pattern
- **RLS for data isolation:** Phase 51 tenant tables use `USING (tenant_id = auth.jwt() ->> 'tenant_id')`; plugin data tables apply same pattern

### Integration Points
- API wrappers: `api/` directory; plugin routes added alongside existing routes or as sub-router
- Schema migrations: `supabase/migrations/`; Phase 52 owns new tables (`campaigns`, `plugin_tenant_config`, etc.)
- CLI entry points: `bin/cli-runtime.cjs` and `bin/markos`, where plugin loader integrates
- Test utilities: Phase 51 test helpers (`mock-tenant-principal`, `mock-iam-context`) available for plugin tests

</code_context>

<specifics>
## Specific Ideas

- **Plugin Discovery at Boot:** Plugin registry reads from `.agent/markos/plugins/` directory; each plugin exports `plugin.js` + `plugin.json` manifest
- **Telemetry Correlation:** Every plugin operation includes Phase 51 `request_id` and `correlation_id` so Phase 54 can trace execution lineage
- **Approval State Machine:** Digital Agency plugin approvals follow Phase 51 immutable audit pattern (append-only approval records, no overwrites)
- **Campaign Scheduling:** Digital Agency plugin includes schedule metadata (publish time, frequency, target distribution window); no actual publishing happens in Phase 52

</specifics>

<deferred>
## Deferred Ideas

- **Marketplace & Third-Party Plugins:** Deferred to Phase 53+; Phase 52 builds foundation only
- **Plugin Versioning Strategies:** Deferred to Phase 53+; Phase 52 loads single version per plugin
- **Live Social Publishing:** Deferred to Phase 53+; campaigns remain in draft/scheduled state
- **Custom Reporting Builder:** Deferred to Phase 54+
- **SSO/Team Invites for Agency:** Deferred to Phase 54+ (IAM-04 deferred work)

</deferred>

---

*Phase: 52-plugin-runtime-and-digital-agency-plugin-v1*  
*Context gathered: 2026-04-03*  
*Decisions locked: 7 (D-01 through D-07)*
