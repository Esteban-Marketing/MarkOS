# Phase 52: Plugin Runtime and Digital Agency Plugin v1 - Research

**Researched:** 2026-04-03
**Domain:** Plugin architecture, tenant-scoped plugin enablement, plugin telemetry integration
**Confidence:** HIGH (most patterns directly derived from Phase 51 tenant contracts and existing MarkOS handler architecture)

## Summary

Phase 52 ships the plugin runtime and launches Digital Agency as the first production plugin. This phase requires tightly integrating plugins into MarkOS's existing tenant context propagation and IAM framework from Phase 51. 

The recommendation is to adopt **in-process plugin loading** with deterministic capability contracts and fail-closed tenant boundaries. Plugins load at server boot, declare required capabilities, are tenant-enabled/disabled per explicit configuration, and are fully instrumented for billing/audit telemetry. The plugin lifecycle is simple for v1: `register → tenant_enable/disable → (no uninstall v1)`.

The **Digital Agency plugin** should be scoped as a lightweight wrapper that surfaces existing MarkOS orchestration capabilities (draft generation, approval routing, campaign publishing) under a plugin namespace, discoverable through plugin routes (`/plugins/digital-agency/*`), and rendered with tenant branding inherited from the white-label system established in Phase 37.

**Primary recommendation:** Implement plugin runtime as a registry loader in `lib/markos/plugins/` that mirrors Phase 51's tenant-context-first design: plugins declare contracts, runtime validates tenant membership + plugin enablement before handler invocation, telemetry captures plugin execution costs and audit events without cross-tenant leakage.

---

## User Constraints (from CONTEXT.md)

<user_constraints>

### Locked Decisions (Phase 51 Baseline)
- Tenant context propagates deterministically through JWT claims, headers (`x-tenant-id`), and query params
- Fail-closed: missing or ambiguous tenant context → auth error, no fallback
- Tenant scope resolution happens once at authenticated boundary via `requireHostedSupabaseAuth`
- IAM v3.2 enforces role-based action permissions (owner, tenant-admin, manager, contributor, reviewer, billing-admin, readonly)
- RLS policies protect all tenant-scoped tables; cross-tenant reads are denied at database layer

### Phase 52 Discretion Areas
- Exact plugin registry schema and discovery patterns
- Plugin versioning strategy (v1 defers multi-version support; single version per plugin allowed for now)
- Plugin install/uninstall UX for v1 (manual registry configuration accepted)
- Plugin capability granularity (broad actions like "access_draft_generation" vs fine-grained like "read_draft", "write_draft")
- Plugin route namespace structure (e.g., `/plugins/{plugin_id}/*` vs `/plugin/{name}/*`)

### Out of Scope (Deferred)
- Third-party plugin marketplace and distribution → Phase 54+
- Plugin versioning and auto-update mechanisms → Phase 54+
- Plugin dependency resolution and version conflicts → Phase 54+
- Cross-plugin communication and plugin-to-plugin contracts → Phase 54+
- Fine-grained plugin role overlays (plugins declaring custom roles) → Phase 53

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PLG-DA-01 | MarkOS plugin runtime supports plugin registration, capability contracts, and tenant-level enablement controls. | Registry loader + tenant scope check + capability declaration pattern detailed below. |
| PLG-DA-02 | Digital Agency plugin ships as the first plugin package with scoped routes, workflows, and role policy overlays. | Plugin route namespace, integration points with draft/campaign handlers, and RBAC overlay model defined. |
| WL-01 | Tenants can configure logo, color tokens, and brand metadata for customer-facing surfaces. | Phase 37 delivered brand-pack system with token overrides and merge contracts; plugins inherit via context. |
| WL-02 | Tenant notifications and transactional templates render with tenant branding. | Plugin notification handlers must use tenant context from Phase 51 to fetch brand-pack and apply overrides. |
| WL-03 | Tenant custom domain onboarding supports verification and safe fallback routing. | Domain routing deferred; plugins support multi-domain via tenant context (same plugin, different branding per tenant). |
| WL-04 | White-label settings are versioned and rollback-capable. | Brand-pack versioning pattern inherited from Phase 37; plugin telemetry captures branding choices for audit trail. |

</phase_requirements>

---

## Plugin Runtime Architecture

### In-Process Plugin Model (Recommended)

**Decision:** Plugins run in the same Node.js process as the MarkOS server, loaded at boot time via a deterministic registry.

**Why In-Process:**
- **Simplicity:** No inter-process communication overhead; plugins are CommonJS or ES modules
- **Context Sharing:** Plugins directly access tenant context, IAM matrix, telemetry helpers (no serialization/deserialization)
- **Fail-Closed Integration:** Plugin crashes can be isolated with try-catch + fallback handlers; tenant context is never leaked
- **Phase 51 Alignment:** Mirrors handler/middleware pattern already established in onboarding/backend/handlers.cjs

**Risk Mitigation:**
- Plugin crashes are wrapped in try-catch with graceful degradation (plugin unavailable, not system unavailable)
- Plugin route handlers cannot modify server global state (enforced via read-only context object)
- Plugin boot validation fails fast if plugin declares unsupported capabilities or syntax errors

**Alternative Considered (Out-of-Process):**
- **Worker Threads or Child Processes:** Provides hard isolation but adds complexity (message passing, context serialization, debugging).
- **When to Revisit:** If Phase 54 enables untrusted third-party plugins; for v1, all plugins are MarkOS-authored.

### Plugin Lifecycle (v1)

```
1. REGISTER: Plugin module exports contract at server boot
2. VALIDATE: Runtime checks plugin exports, capability declarations, tenant requirements
3. ENABLE/DISABLE: Tenant admin can toggle plugin via settings UI (stored in tenant config table)
4. ROUTE_MATCH: HTTP request matches plugin route → check tenant+plugin enabled → invoke handler
5. TELEMETRY: Plugin handler execution, latency, cost, actor, outcome logged as plugin.execution event
6. (No uninstall in v1: plugins remain registered; tenant can disable)
```

### Plugin Registration Contract (Phase 52-01 Deliverable)

**Location:** `lib/markos/plugins/registry.ts`

Each plugin exports a contract object:

```typescript
// Plugin contract interface
export interface PluginContract {
  id: string;                    // e.g., "digital-agency-v1"
  version: string;               // e.g., "1.0.0"
  name: string;                  // Display name
  description: string;
  requiredCapabilities: string[]; // e.g., ["read_drafts", "publish_campaigns"]
  requiredIamRoles: string[];     // Minimum roles to access plugin (e.g., ["manager", "owner"])
  routes: PluginRoute[];          // HTTP routes handler exports
  handlers?: Record<string, PluginHandler>; // Event handlers (approval, rejection, etc.)
  hooks?: PluginHooks;            // Lifecycle hooks
}

export interface PluginRoute {
  path: string;                  // e.g., "/agencies/{agency_id}/dashboard"
  method: "GET" | "POST" | "PUT" | "DELETE";
  handler: (req, res, tenantContext, iamContext) => Promise<void>;
  requiredCapability?: string;   // Plugin may declare finer capability per route
  requiredRole?: string;         // Route-level role minimum (falls back to plugin.requiredIamRoles)
}

export interface PluginHandler {
  (event: PluginEvent, tenantContext: TenantContext): Promise<void>;
}

export interface PluginHooks {
  onTenantEnabled?: (tenantId: string) => Promise<void>;
  onTenantDisabled?: (tenantId: string) => Promise<void>;
  onServerStart?: () => Promise<void>;
}

export interface PluginEvent {
  type: "approval:granted" | "approval:rejected" | "draft:published" | "campaign:scheduled";
  correlationId: string;
  actor: { userId: string; tenantId: string; role: string };
  resourceId: string;
  payload: Record<string, unknown>;
}

export interface TenantContext {
  tenantId: string;
  userId: string;
  role: string;
  requestId: string;
  // Read-only; plugins cannot mutate
}
```

### Plugin Capability Model

**Principle:** Plugins declare required capabilities; tenant enable/disable grants/revokes access.

Canonical capability set v1:

```typescript
const PLUGIN_CAPABILITIES = {
  "read_drafts": "Plugin can read draft documents",
  "read_campaigns": "Plugin can read campaign configurations",
  "write_campaigns": "Plugin can modify campaigns (requires manager+ role)",
  "publish_campaigns": "Plugin can publish campaigns (requires owner+ role)",
  "read_approvals": "Plugin can access approval history and lineage",
  "write_approvals": "Plugin can route approvals (requires manager+ role)",
  "read_telemetry": "Plugin can access execution metrics and costs",
  "trigger_workflows": "Plugin can invoke MarkOS orchestrator workflows",
} as const;
```

At tenant enable time, admin explicitly grants which capabilities are enabled. This is stored:

```sql
CREATE TABLE plugin_tenant_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plugin_id TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT false,
  granted_capabilities TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, plugin_id),
  -- RLS: all rows filtered by tenant_id
);
```

**Runtime Check:**

```typescript
async function checkPluginCapability(
  tenantContext: TenantContext,
  pluginId: string,
  requiredCapability: string
): Promise<boolean> {
  // 1. Is plugin enabled for this tenant?
  const config = await db.supabase
    .from('plugin_tenant_config')
    .select('granted_capabilities, enabled')
    .eq('tenant_id', tenantContext.tenantId)
    .eq('plugin_id', pluginId)
    .single();

  if (!config || !config.enabled) {
    return false; // Plugin not enabled for this tenant
  }

  // 2. Does tenant grant this capability to the plugin?
  if (!config.granted_capabilities.includes(requiredCapability)) {
    return false; // Capability not granted
  }

  // 3. Is actor's role sufficient for capability?
  // (Checked separately via IAM matrix; plugins cannot elevate privilege)
  return true;
}
```

---

## Digital Agency Plugin Specifics (v1 Scope)

### Mission

The **Digital Agency plugin** is the first production plugin showcasing MarkOS's plugin model. It wraps high-value orchestrator workflows and presents them as a scoped "agency" UX where multiple users/teams can coordinate campaign execution with approvals, delegation, and audit trails.

### Minimal Viable Scope (Phase 52)

The plugin exposes four core workflows:

1. **Draft Generation & Review**
   - Route: `GET /plugins/digital-agency/drafts?discipline={discipline}`
   - Wraps existing MarkOS draft generator
   - Shows draft status, approval state, and regeneration history
   - Requires `read_drafts` capability

2. **Campaign Assembly & Approval**
   - Route: `POST /plugins/digital-agency/campaigns/assemble`
   - Pools approved drafts into a campaign
   - Routes to manager/owner for approval before publishing
   - Requires `write_campaigns` capability

3. **Campaign Publishing**
   - Route: `POST /plugins/digital-agency/campaigns/{id}/publish`
   - Commits campaign to execution queue
   - Emits `campaign:published` event for telemetry
   - Requires `publish_campaigns` capability

4. **Agency Dashboard**
   - Route: `GET /plugins/digital-agency/dashboard`
   - Shows: active campaigns, pending approvals, published artifacts, team activity timeline
   - Uses existing telemetry events to populate KPI cards
   - Requires `read_drafts` + `read_campaigns` capabilities

### Non-Goals for v1

- Multi-team role segregation within plugin (all team members see all campaigns)
- Plugin-specific approval workflows (uses core MarkOS approval system)
- Campaign versioning or rollback (immutable campaign records only)
- Custom plugin notifications (uses tenant notifications configured in Phase 54)

### Packaging and Discovery

**Location:** `lib/markos/plugins/digital-agency/` (CommonJS export)

```
lib/markos/plugins/
├── registry.ts                 # Plugin loader and contract definitions
├── loader.ts                   # Runtime plugin boot + validation
├── capability-checker.ts       # Capability enforcement middleware
├── digital-agency/
│   ├── index.ts               # Plugin contract export
│   ├── routes/
│   │   ├── drafts.ts          # Draft retrieval and show handlers
│   │   ├── campaigns.ts       # Campaign assembly/publish handlers
│   │   └── dashboard.ts       # Dashboard aggregation
│   ├── handlers/
│   │   └── events.ts          # approval:granted, campaign:published handlers
│   ├── telemetry.ts           # Plugin-specific telemetry event builders
│   └── db-queries.ts          # Tenant-scoped campaign/draft queries
└── (future plugins here)
```

**Route Registration:**

At server boot, plugin loader registers Digital Agency routes into the main Express app with tenant context middleware pre-wired:

```typescript
// In server.cjs or api/status.js
const digitalAgencyPlugin = require('./lib/markos/plugins/digital-agency');
const router = express.Router();

for (const route of digitalAgencyPlugin.contract.routes) {
  router[route.method.toLowerCase()](
    route.path,
    // Middleware stack:
    requireHostedSupabaseAuth({ ... }), // Phase 51-02 gate
    tenantContextMiddleware(),            // Extract & validate tenant_id
    capabilityCheckMiddleware(route.requiredCapability),
    iamAuthMiddleware(route.requiredRole),
    // Handler:
    (req, res) => route.handler(req, res, req.tenantContext, req.iamContext)
  );
}

app.use('/plugins', router);
```

---

## Tenant-Plugin Relationship & Control Model

### Multi-Tenancy for Plugins

**Principle:** Each tenant has an independent plugin configuration. One tenant can enable Digital Agency while another disables it; plugin data (campaigns, drafts, approvals) is always filtered by tenant_id.

**Tenant Plugin Configuration:**

```typescript
interface TenantPluginSettings {
  tenantId: string;
  [pluginId: string]: {
    enabled: boolean;
    grantedCapabilities: string[];
    customConfig?: Record<string, unknown>; // Plugin-specific settings (e.g., approval routing rules)
  };
}
```

Stored in Supabase:

```sql
CREATE TABLE tenant_plugin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plugin_id TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT false,
  granted_capabilities TEXT[] NOT NULL DEFAULT '{}',
  custom_config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, plugin_id),
  -- RLS: SELECT/UPDATE filtered by tenant_id
);
```

### Plugin Enablement Control

**Who can enable/disable plugins:** Tenant owner or tenant-admin (from Phase 51 IAM v3.2).

**Settings UI:** Add plugin management screen to tenant settings (Phase 52):

```
Tenant Settings → Extensions → Digital Agency
  ☑ Enabled
  ☐ Granted: read_drafts, read_campaigns, write_campaigns, publish_campaigns
  [Save Changes]
```

**Disabling a plugin:**
- Plugin routes return 404 if plugin disabled
- Existing plugin data (campaigns, executions) remains in DB for audit; not visible in UI
- Re-enabling restores access to historical plugin data

### Plugin Data Isolation

**Schema Pattern:** Every plugin data table includes `tenant_id` as partition key:

```sql
CREATE TABLE plugin_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plugin_id TEXT NOT NULL, -- "digital-agency-v1"
  campaign_name TEXT NOT NULL,
  status TEXT NOT NULL, -- "draft", "approved", "published"
  created_by UUID NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  metadata JSONB,
  -- RLS: SELECT/INSERT/UPDATE/DELETE filtered by tenant_id
);

CREATE POLICY "tenant_isolation" ON plugin_campaigns 
  USING (tenant_id = auth.jwt() ->> 'active_tenant_id');
```

All plugin queries are scoped:

```typescript
// Digital Agency campaign list (SCOPED)
async function listTenantCampaigns(tenantId: string) {
  return db.supabase
    .from('plugin_campaigns')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('plugin_id', 'digital-agency-v1');
  // RLS enforces this filter; query fails at DB layer if JWT tenant ≠ tenantId
}
```

---

## White-Label & Brand Integration

### Brand Inheritance for Plugins

**Phase 37 Baseline:** `lib/markos/theme/brand-pack.ts` defines tenant-scoped brand tokens (logo, colors, fonts).

**Phase 52 Extension:** Plugins inherit tenant branding automatically. When rendering plugin UX (dashboard, forms, etc.), fetch tenant's brand-pack and apply theme overrides.

### Plugin Brand Context

When plugin handler runs, tenant context includes brand metadata:

```typescript
// In TenantContext (passed to plugin handler)
interface TenantContext {
  tenantId: string;
  userId: string;
  role: string;
  requestId: string;
  brand?: BrandPack; // NEW: Tenant's brand-pack
}

interface BrandPack {
  tenantId: string;
  label: string;
  overrides: Record<string, string>; // e.g., { "color.primary": "#0d9488" }
}
```

**Plugin UI Composition:**

Digital Agency dashboard fetches its own template components, but wraps them with tenant's brand context:

```typescript
// Digital Agency dashboard handler
async function getDashboard(req, res, tenantContext: TenantContext, iamContext) {
  const campaigns = await listTenantCampaigns(tenantContext.tenantId);

  // Fetch tenant's brand-pack
  const brandPack = await fetchTenantBrandPack(tenantContext.tenantId);

  // Render dashboard component with brand overrides
  const html = renderDashboardWithBranding({
    campaigns,
    brandPack, // Passed to template engine
    actor: { userId: tenantContext.userId, role: tenantContext.role },
  });

  res.json({
    status: 'success',
    html,
    brandContext: brandPack, // Also return for client-side rendering
  });
}
```

### Custom Domain Routing for Plugins

**Phase 52 Support:** If tenant has custom domain configured, plugin routes remain accessible at both:
- `https://app.markos.com/plugins/digital-agency/...?tenant_id={tenantId}`
- `https://{tenant-custom-domain}/plugins/digital-agency/...` (shared reverse proxy routes to MarkOS)

**Routing:** Reverse proxy/domain router resolves custom domain → tenant_id, then passes `tenant_id` via header or JWT claim (existing Phase 51 pattern), so plugin handlers are agnostic to domain.

### Versioned Branding & Rollback

Inherit from Phase 37: brand-pack changes are stored with timestamped versions.

Plugin telemetry captures branding snapshot with each execution:

```typescript
// Plugin telemetry event
{
  eventName: 'plugin.campaign.dashboard_viewed',
  pluginId: 'digital-agency-v1',
  tenantId: tenant_id,
  actor: { userId, role },
  timestamp: now(),
  brandContext: {
    brandPackId: '...', // Track which version was used
    appliedOverrides: brandPack.overrides,
    label: brandPack.label,
  },
  payload: { campaignCount, approvalsPending },
}
```

If tenant rolls back branding, new plugin requests automatically use the previous brand-pack (no plugin code changes needed).

---

## Billing & Telemetry Integration

### Plugin Execution Telemetry

Each plugin route invocation emits a telemetry event. Billings are calculated from these events in Phase 54.

**Plugin telemetry event schema:**

```typescript
interface PluginTelemetryEvent {
  eventName: string; // e.g., "plugin.campaign.dashboard_viewed", "plugin.draft.regenerated"
  pluginId: string;
  tenantId: string;
  actor: {
    userId: string;
    role: string;
  };
  correlationId: string;
  requestId: string;
  timestamp: string; // ISO 8601
  duration_ms: number;
  outcome: "success" | "error" | "degraded";
  costMetrics?: {
    llm_tokens_used?: number;
    vector_queries?: number;
    orchestrator_runs?: number;
  };
  payload: Record<string, unknown>;
}
```

**Emission Points:**

1. **Draft Generation** (within Digital Agency plugin):
   ```typescript
   await emitPluginTelemetry({
     eventName: 'plugin.draft.regenerated',
     pluginId: 'digital-agency-v1',
     tenantId: tenantContext.tenantId,
     actor: { userId: tenantContext.userId, role: tenantContext.role },
     costMetrics: {
       llm_tokens_used: draftResult.tokensUsed,
     },
     outcome: 'success',
   });
   ```

2. **Campaign Published:**
   ```typescript
   await emitPluginTelemetry({
     eventName: 'plugin.campaign.published',
     pluginId: 'digital-agency-v1',
     tenantId: tenantContext.tenantId,
     actor: { userId: tenantContext.userId, role: tenantContext.role },
     costMetrics: {
       vector_queries: campaignAssembly.vectorQueriesCount,
     },
     outcome: 'success',
   });
   ```

**Telemetry Storage:** Events stored in `markos_plugin_telemetry` table (tenant-scoped, RLS protected).

### Cost Attribution & Metering

**Phase 54 Responsibility:** Aggregate telemetry events into billable line items (e.g., "10 draft regenerations = 1 metered unit").

**Phase 52 Requirement:** Just ensure every meaningful plugin operation emits telemetry with cost hints.

### Audit Logging

**Security Events:** Plugin-triggered approvals, denials, and errors emit to audit log:

```typescript
// When plugin approval is rejected
await emitSecurityEvent({
  eventType: 'plugin_approval_decision',
  decision: 'rejected',
  actor: { userId: tenantContext.userId, role: tenantContext.role },
  resource: { pluginId: 'digital-agency-v1', campaignId },
  reason: 'Insufficient brand alignment',
  tenantId: tenantContext.tenantId,
  requestId: tenantContext.requestId,
});
```

---

## Code Examples & Integration Patterns

### Pattern 1: Plugin Route Handler Integration

**Source:** Modeled on handlers.cjs + Phase 51 tenant context pattern

```typescript
// lib/markos/plugins/digital-agency/routes/dashboard.ts

import { TenantContext, IamContext, PluginRoute } from '../../../plugins/registry';

export const dashboardRoute: PluginRoute = {
  path: '/plugins/digital-agency/dashboard',
  method: 'GET',
  requiredCapability: 'read_drafts',
  requiredRole: 'contributor', // Fallback to plugin's required roles (manager+ in v1)
  
  handler: async (req, res, tenantContext: TenantContext, iamContext: IamContext) => {
    try {
      // 1. Check capability (middleware pre-checks, but plugin can re-verify)
      if (!await checkPluginCapability(tenantContext.tenantId, 'digital-agency-v1', 'read_drafts')) {
        return res.status(403).json({
          error: 'PLUGIN_CAPABILITY_DENIED',
          message: 'Plugin not enabled for this tenant',
        });
      }

      // 2. Fetch tenant's campaigns (RLS-filtered by tenant_id)
      const campaigns = await listTenantCampaigns(tenantContext.tenantId);

      // 3. Fetch approvals requiring review by this actor
      const pendingApprovals = await listPendingApprovalsForActor(
        tenantContext.tenantId,
        tenantContext.userId
      );

      // 4. Fetch tenant's brand-pack for UI rendering
      const brandPack = await fetchTenantBrandPack(tenantContext.tenantId);

      // 5. Emit telemetry
      await emitPluginTelemetry({
        eventName: 'plugin.dashboard.viewed',
        pluginId: 'digital-agency-v1',
        tenantId: tenantContext.tenantId,
        actor: { userId: tenantContext.userId, role: tenantContext.role },
        correlationId: req.id,
        requestId: tenantContext.requestId,
        outcome: 'success',
        payload: {
          campaignCount: campaigns.length,
          pendingApprovalsCount: pendingApprovals.length,
        },
      });

      // 6. Return response
      res.json({
        status: 'success',
        data: {
          campaigns: campaigns.map(c => ({
            id: c.id,
            name: c.campaign_name,
            status: c.status,
            createdBy: c.created_by,
            createdAt: c.created_at,
          })),
          pendingApprovals: pendingApprovals.map(a => ({
            id: a.id,
            resourceName: a.resource_name,
            requestedBy: a.requested_by,
            createdAt: a.created_at,
          })),
          brandContext: brandPack ? {
            label: brandPack.label,
            overrides: brandPack.overrides,
          } : null,
        },
      });
    } catch (error) {
      console.error(`[Plugin:digital-agency] Dashboard error:`, error);
      
      // Emit error telemetry and return 500
      await emitPluginTelemetry({
        eventName: 'plugin.dashboard.viewed',
        pluginId: 'digital-agency-v1',
        tenantId: tenantContext.tenantId,
        actor: { userId: tenantContext.userId, role: tenantContext.role },
        outcome: 'error',
        payload: { error: error.message },
      });

      res.status(500).json({
        error: 'PLUGIN_HANDLER_ERROR',
        message: 'Dashboard request failed',
      });
    }
  },
};
```

### Pattern 2: Plugin Middleware Chain

**Source:** Extends Phase 51 hosted auth + tenant context pattern

```typescript
// lib/markos/plugins/capability-checker.ts

export function capabilityCheckMiddleware(requiredCapability?: string) {
  return async (req, res, next) => {
    if (!requiredCapability) {
      return next(); // No capability check needed for this route
    }

    const { tenantContext, tenantId } = req; // Set by tenantContextMiddleware
    if (!tenantContext || !tenantId) {
      return res.status(401).json({ error: 'TENANT_CONTEXT_REQUIRED' });
    }

    // Extract plugin ID from route (e.g., /plugins/{plugin_id}/...)
    const pluginId = extractPluginIdFromPath(req.path);

    // Check if plugin is enabled and has capability granted
    const hasCapability = await checkPluginCapability(
      tenantContext.tenantId,
      pluginId,
      requiredCapability
    );

    if (!hasCapability) {
      // Emit denial telemetry
      await emitSecurityEvent({
        eventType: 'plugin_capability_denied',
        actor: { userId: tenantContext.userId, role: tenantContext.role },
        resource: { pluginId, capability: requiredCapability },
        tenantId: tenantContext.tenantId,
        requestId: tenantContext.requestId,
      });

      return res.status(403).json({
        error: 'PLUGIN_CAPABILITY_DENIED',
        message: `Plugin ${pluginId} cannot perform capability: ${requiredCapability}`,
      });
    }

    next();
  };
}
```

### Pattern 3: Plugin Event Handler

**Source:** Mirrors telemetry event emission from Phase 51 audit logs

```typescript
// lib/markos/plugins/digital-agency/handlers/events.ts

import { PluginEvent, PluginHandler, TenantContext } from '../../../plugins/registry';

export const approvalGrantedHandler: PluginHandler = async (
  event: PluginEvent,
  tenantContext: TenantContext
) => {
  // This handler is called when an approval is granted in MarkOS core
  // Plugin can react (e.g., auto-publish campaign)

  console.log(`[Plugin:digital-agency] Approval granted for ${event.resourceId}`);

  // Emit plugin-side telemetry
  await emitPluginTelemetry({
    eventName: 'plugin.approval_reaction.triggered',
    pluginId: 'digital-agency-v1',
    tenantId: event.actor.tenantId,
    actor: event.actor,
    correlationId: event.correlationId,
    outcome: 'success',
    payload: {
      resourceId: event.resourceId,
      eventType: event.type,
    },
  });

  // DLG v1: Just log; don;t auto-publish (manual approval only)
};
```

### Pattern 4: Tenant Scope Isolation in Query

**Source:** Mirrors Phase 51 RLS + middleware pattern

```typescript
// lib/markos/plugins/digital-agency/db-queries.ts

export async function listTenantCampaigns(tenantId: string) {
  // Always scope by tenant_id at query level
  // RLS policy provides enforcement; this is defense-in-depth
  const { data, error } = await db.supabase
    .from('plugin_campaigns')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('plugin_id', 'digital-agency-v1')
    .order('created_at', { ascending: false });

  if (error) {
    console.error(`[Digital Agency] Campaign list error for tenant ${tenantId}:`, error);
    throwAuditedError({
      eventType: 'plugin_query_error',
      tenantId,
      query: 'list_campaigns',
      error: error.message,
    });
  }

  return data || [];
}

export async function createCampaign(
  tenantId: string,
  campaignName: string,
  createdBy: string,
  metadata: Record<string, unknown>
) {
  const { data, error } = await db.supabase
    .from('plugin_campaigns')
    .insert([
      {
        tenant_id: tenantId,
        plugin_id: 'digital-agency-v1',
        campaign_name: campaignName,
        status: 'draft',
        created_by: createdBy,
        metadata,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error(`[Digital Agency] Campaign create error for tenant ${tenantId}:`, error);
    throwAuditedError({
      eventType: 'plugin_mutation_error',
      tenantId,
      query: 'create_campaign',
      error: error.message,
    });
  }

  return data;
}
```

---

## Common Pitfalls & Mitigation

### Pitfall 1: Plugin Receives Multiple Tenant Contexts

**What goes wrong:** Plugin doesn't check tenant scope carefully; accidentally performs cross-tenant operation.  
**Why it happens:** Plugin developer assumes tenant_id is always correct; doesn't re-verify in queries.  
**How to avoid:** 
- Plugin handler must re-assertwrt tenant_id at start of every scoped DB query
- All queries must include `.eq('tenant_id', tenantId)` filter
- RLS policies provide db-layer enforcement; plugin code should also validate

**Warning signs:**
- Plugin query doesn't have tenant_id in WHERE clause
- Plugin uses request.query or cookies to set tenant (should only use tenantContext)

### Pitfall 2: Plugin Telemetry Leaks Secrets

**What goes wrong:** Plugin emits telemetry event with JWT token or API key in payload.  
**Why it happens:** Developer copies entire `req.headers` or `req.body` into telemetry payload; secrets accidentally included.  
**How to avoid:**
- Sanitize telemetry payloads via `sanitizePayload()` from Phase 51
- Only emit semantic data (campaign count, status, actor role) not raw request bodies
- Blocked keys: token, password, secret, key, authorization

**Warning signs:**
- Telemetry payload includes nested `headers`, `secrets`, or auth fields

### Pitfall 3: Plugin Routes Don't Respect IAM Roles

**What goes wrong:** Plugin allows "contributor" to publish campaign (requires owner-only).  
**Why it happens:** Plugin developer skips IAM check; only checks capability.  
**How to avoid:**
- Every route declares `requiredRole` (e.g., "manager", "owner")
- Capability check is orthogonal to role check; both must pass
- IAM middleware enforces role AFTER capability check in middleware chain

**Warning signs:**
- Plugin route has no `requiredRole`
- Plugin payload mutation (write/publish) doesn't verify operator role

### Pitfall 4: Plugin Crashes Bring Down Server

**What goes wrong:** Plugin has uncaught exception; crashes Node process; all MarkOS tenants go offline.  
**Why it happens:** Plugin handler not wrapped in try-catch; async error propagates to uncaught handler.  
**How to avoid:**
- Plugin handler MUST wrap all async/await in try-catch
- Errors should emit telemetry and return 500 JSON response, never throw
- Plugin loader validates syntax at boot; if plugin fails to load, server startup fails loudly

**Warning signs:**
- Plugin handler has no try-catch around async operations
- Plugin handler throws outside request context (e.g., in module initialization)

---

## Architecture Patterns

### Pattern: Deterministic Plugin Boot

```typescript
// server.cjs or onboarding/backend/server.cjs

async function loadPlugins() {
  const pluginRegistry = [];

  // Load built-in plugins
  try {
    const digitalAgency = require('./lib/markos/plugins/digital-agency');
    
    // Validate plugin contract
    if (!digitalAgency.contract || !digitalAgency.contract.id) {
      throw new Error('Invalid plugin contract: missing id');
    }

    console.log(`[Plugins] Registering: ${digitalAgency.contract.id} v${digitalAgency.contract.version}`);
    pluginRegistry.push(digitalAgency);
  } catch (error) {
    console.error('[Plugins] Failed to load digital-agency plugin:', error.message);
    // Fail fast: plugins are required for v3.2
    process.exit(1);
  }

  return pluginRegistry;
}

// At server start
const app = express();
const plugins = await loadPlugins();

// Register plugin routes
for (const plugin of plugins) {
  for (const route of plugin.contract.routes) {
    console.log(`[Plugins] Registering route: ${route.method} ${route.path}`);
    
    const handlerWithErrorBoundary = async (req, res) => {
      try {
        await route.handler(req, res, req.tenantContext, req.iamContext);
      } catch (error) {
        console.error(`[Plugin] Handler error for ${route.path}:`, error);
        res.status(500).json({ error: 'PLUGIN_ERROR', message: error.message });
      }
    };

    app[route.method.toLowerCase()](
      route.path,
      requireHostedSupabaseAuth({ ... }),
      tenantContextMiddleware(),
      capabilityCheckMiddleware(route.requiredCapability),
      iamAuthMiddleware(route.requiredRole),
      handlerWithErrorBoundary
    );
  }
}

app.listen(PORT);
```

### Pattern: Tenant Enable/Disable Workflow

```typescript
// Tenant Settings API: POST /api/tenant/{tenant_id}/plugins/{plugin_id}/toggle

async function togglePluginForTenant(req, res, tenantContext, iamContext) {
  const { plugin_id } = req.params;
  const { enabled, granted_capabilities } = req.body;

  // Only owner/tenant-admin can toggle plugins
  if (!['owner', 'tenant-admin'].includes(iamContext.role)) {
    return res.status(403).json({ error: 'INSUFFICIENT_ROLE' });
  }

  // Validate plugin exists
  const pluginRegistry = getLoadedPlugins();
  const plugin = pluginRegistry.find(p => p.contract.id === plugin_id);
  if (!plugin) {
    return res.status(404).json({ error: 'PLUGIN_NOT_FOUND' });
  }

  // Validate requested capabilities are subset of plugin's declared capabilities
  if (enabled && granted_capabilities) {
    const allowedCaps = plugin.contract.requiredCapabilities;
    const denied = granted_capabilities.filter(cap => !allowedCaps.includes(cap));
    if (denied.length > 0) {
      return res.status(400).json({
        error: 'INVALID_CAPABILITIES',
        denied,
      });
    }
  }

  // Update plugin_tenant_config
  const result = await db.supabase
    .from('plugin_tenant_config')
    .upsert({
      tenant_id: tenantContext.tenantId,
      plugin_id,
      enabled,
      granted_capabilities: enabled ? granted_capabilities : [],
      updated_at: new Date(),
    }, {
      onConflict: 'tenant_id,plugin_id',
    })
    .select()
    .single();

  // Emit audit event
  await emitSecurityEvent({
    eventType: 'plugin_toggled',
    decision: enabled ? 'enabled' : 'disabled',
    actor: { userId: tenantContext.userId, role: iamContext.role },
    resource: { pluginId: plugin_id, tenantId: tenantContext.tenantId },
    capabilities: granted_capabilities,
    tenantId: tenantContext.tenantId,
    requestId: tenantContext.requestId,
  });

  // If plugin has onTenantEnabled/onTenantDisabled hooks, invoke them
  if (enabled && plugin.contract.hooks?.onTenantEnabled) {
    try {
      await plugin.contract.hooks.onTenantEnabled(tenantContext.tenantId);
    } catch (error) {
      console.warn(`[Plugins] onTenantEnabled failed for ${plugin_id}:`, error.message);
      // Don't fail the request; just log
    }
  }

  res.json({
    status: 'success',
    plugin: result,
  });
}
```

---

## Don't Hand-Roll These

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Plugin capability checking | Custom capability matrix | Phase 52 registry + `checkPluginCapability()` | Avoids inconsistency with IAM; centralized enforcement. |
| Plugin telemetry emission | Ad-hoc logging | Canonical `emitPluginTelemetry()` helper | Standardizes cost metering shape, integrates with Phase 54 billing pipeline. |
| Tenant scoping in plugin queries | Manual WHERE tenant_id checks only | Supabase RLS + query-level .eq('tenant_id', ...) | RLS provides hard db-layer guarantee; query check is defense-in-depth. |
| Plugin route errors | Unhandled rejections / crashes | try-catch + telemetry + res.status(500) | Prevents plugin bugs from taking down entire server. |
| Plugin brand context resolution | Custom theme lookup per route | Phase 37 `fetchTenantBrandPack()` + context injection | Reuses existing theme system; consistent across plugins. |
| Cross-tenant data isolation in plugin data | Trust plugins to filter | Supabase RLS policies + query assert | Plugins can have bugs; RLS provides enforcement independent of plugin code. |

---

## Implementation Checklist for Phase 52 Planning

### Wave 1: Plugin Registry & Core Infrastructure
- [ ] 52-01: Define PluginContract TypeScript interface (registry.ts)
- [ ] 52-01: Implement plugin loader (loader.ts) with boot-time validation + error handling
- [ ] 52-01: Create plugin capability model constant (PLUGIN_CAPABILITIES)
- [ ] 52-01: Implement `checkPluginCapability()` with tenant + role verification
- [ ] 52-01: Create `plugin_tenant_config` Supabase table + RLS policy
- [ ] 52-02: Implement plugin middleware stack (tenantContext → capability check → IAM check)
- [ ] 52-02: Integrate plugin loader into server bootstrap (api/status.js or server.cjs)
- [ ] 52-02: Write tests for plugin contract validation (missing routes, bad version, etc.)

### Wave 2: Digital Agency Plugin
- [ ] 52-03: Create Digital Agency plugin export (index.ts with contract)
- [ ] 52-03: Implement `/plugins/digital-agency/dashboard` route (campaigns + approvals + branding)
- [ ] 52-03: Implement `/plugins/digital-agency/drafts` route (scoped draft listing)
- [ ] 52-04: Implement `/plugins/digital-agency/campaigns/assemble` route (draft pooling)
- [ ] 52-04: Implement `/plugins/digital-agency/campaigns/{id}/publish` route (commit to queue)
- [ ] 52-04: Create `plugin_campaigns` Supabase table + RLS for campaign data
- [ ] 52-04: Implement event handlers (approvalGrantedHandler, etc.)
- [ ] 52-04: Write integration tests (tenant isolation, capability checks, brand context)

### Wave 3: Telemetry & Audit
- [ ] 52-05: Implement `emitPluginTelemetry()` helper (standardized event shape)
- [ ] 52-05: Emit telemetry from all Digital Agency handlers (dashboard, draft, campaign.*)
- [ ] 52-05: Create `markos_plugin_telemetry` Supabase table + RLS
- [ ] 52-05: Emit security events for capability denials + approval decisions
- [ ] 52-05: Write tests for telemetry payload shape + sanitization

### Wave 4: Settings UI & Tenant Control
- [ ] 52-06: Add tenant plugin settings page to control-plane (Phase 37 follow-on)
- [ ] 52-06: Implement PATCH/GET endpoints for plugin enablement control
- [ ] 52-06: Call plugin.contract.hooks.onTenantEnabled/onTenantDisabled
- [ ] 52-06: Test enable/disable workflow with inline audit events
- [ ] 52-06: Document tenant admin UX for managing plugins

### Wave 5: White-Label & Brand Integration
- [ ] 52-07: Pass `brandPack` in TenantContext (pulled from Phase 37 system)
- [ ] 52-07: Update Digital Agency routes to fetch and pass brandPack to response
- [ ] 52-07: Verify brand-pack token overrides apply to plugin UI (manual/Storybook verification)
- [ ] 52-08: Test custom domain routing with plugin (domain → tenant_id propagation)
- [ ] 52-08: Capture branding snapshot in telemetry for audit trail

### Wave 6: Testing & Regression
- [ ] 52-09: Write Nyquist contract tests (plugin disable → 404, plugin enable → 200)
- [ ] 52-09: Write E2E test: cross-tenant campaign poll (verify isolation)
- [ ] 52-09: Write E2E test: plugin capability grant/revoke → access denied/allowed
- [ ] 52-09: Verify Phase 51 tenant tests still pass (no regression in auth/IAM)
- [ ] 52-09: Performance test: plugin-heavy workload (100 campaigns, 10 tenants)

### Rollout & Documentation
- [ ] 52-10: Update `.planning/CODEBASE.md` with plugin registry architecture section
- [ ] 52-10: Write plugin developer quick-start guide (`lib/markos/plugins/PLUGIN-QUICKSTART.md`)
- [ ] 52-10: Document plugin telemetry schema for Phase 54 billing integration
- [ ] 52-10: Update system docs with plugin capability model

---

## Confidence Assessment & Gaps

| Domain | Level | Reasoning |
|--------|-------|-----------|
| Plugin Runtime Model | **HIGH** | In-process recommended; aligns with Phase 51 patterns; minimal complexity. CommonJS/ES module loading is standard. |
| Plugin Interface Contract | **HIGH** | Derived from existing MarkOS handler + telemetry patterns; TypeScript contract interface straightforward. |
| Digital Agency MVP Scope | **HIGH** | Four workflows (draft, assemble, publish, dashboard) are subset of existing MarkOS capabilities; integration points clear. |
| Tenant-Plugin Isolation | **HIGH** | Phase 51 establishes tenant context + RLS; plugin pattern mirrors handler pattern; RLS tables provide enforcement. |
| White-Label Integration | **HIGH** | Phase 37 already delivers brand-pack system; plugins simply inherit via context. Theme token overrides proven pattern. |
| Telemetry & Billing | **MEDIUM** | Phase 54 owns aggregation/metering; Phase 52 just emits standardized events. Event schema defined; cost metrics hints clear. |
| Plugin Versioning (deferred) | **LOW** | v1 has no versioning; single version per plugin. Deferred to Phase 54+; would require more research on semver conflict resolution. |
| Third-Party Plugin Security | **LOW** | Out of scope for v1; all plugins are MarkOS-authored. Hard isolation (worker threads) deferred. |

### Open Questions

1. **Plugin Route Collision:** If multiple plugins declare the same route path, does the system fail at boot or use first-registered wins?
   - **Recommendation:** Fail at boot with clear error; no silent shadowing.

2. **Plugin Dependencies:** Can one plugin depend on another (e.g., "digital-agency requires read_drafts from core")?
   - **Recommendation:** v1: No inter-plugin dependencies. Each plugin is independent.

3. **Custom Domain Plugin Routes:** Do plugins appear at `/plugins/{plugin_id}/*` only or also under tenant custom domain root?
   - **Recommendation:** Both, via shared reverse proxy logic. Domain router adds `tenant_id` to context; plugin routes are domain-agnostic.

4. **Plugin Disable Cleanup:** When plugin is disabled, are execution records deleted or hidden?
   - **Recommendation:** Hidden (RLS filter). Data remains for audit trail.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single-tenant capabilities | Multi-tenant plugin enablement per tenant_id | Phase 51 → Phase 52 | Plugins are now controllable per tenant; different tenants can have different feature sets. |
| Tenant context optional | Tenant context always required + fail-closed | Phase 51 → Phase 52 | Plugin handlers cannot escape tenant scope; cross-tenant access fails deterministically. |
| Shared handler telemetry | Plugin-specific telemetry event stream | Phase 37 → Phase 52 | Phase 54 can meter plugins independently; cost attribution is precise. |

---

## Validation Architecture

**Framework:** node:test (existing Phase 48 baseline)
**Config file:** Not applicable (no central jest.config or vitest.config yet; tests use direct node:test)
**Quick run:** `npm test -- test/plugin-*.test.js`
**Full suite:** `npm test`

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PLG-DA-01 | Plugin can declare capabilities; tenant can grant/deny | unit | `npm test -- test/plugin-registry.test.js` | ❌ Wave 0 |
| PLG-DA-01 | Plugin disabled → routes return 404 | integration | `npm test -- test/plugin-control.test.js::tenant_disable_plugin` | ❌ Wave 0 |
| PLG-DA-02 | Digital Agency dashboard shows user's campaigns (tenant-scoped) | integration | `npm test -- test/digital-agency.test.js::dashboard_tenant_isolation` | ❌ Wave 0 |
| PLG-DA-02 | Campaign publish calls orchestrator + emits telemetry | integration | `npm test -- test/digital-agency.test.js::publish_workflow` | ❌ Wave 0 |
| WL-01/02 | Plugin dashboard renders with tenant's brand-pack overrides | integration | `npm test -- test/plugin-branding.test.js::dashboard_applies_brand` | ❌ Wave 0 |
| WL-04 | Brand-pack changes reflected in plugin telemetry audit | integration | `npm test -- test/plugin-telemetry.test.js::brand_audit_trail` | ❌ Wave 0 |

### Wave 0 Test Infrastructure Gaps

- [ ] `test/plugin-registry.test.js` — test contract validation, capability checks, loader validation
- [ ] `test/plugin-control.test.js` — test plugin enable/disable, tenant scope isolation
- [ ] `test/digital-agency.test.js` — test all DA routes, campaign workflows, telemetry emission
- [ ] `test/plugin-branding.test.js` — test brand-pack inheritance, token override application
- [ ] `test/plugin-telemetry.test.js` — test telemetry shape, sanitization, tenant audit trail
- [ ] `test/fixtures/digital-agency-campaigns.json` — seeded campaigns for E2E tests
- [ ] Phase 51 test fixtures must be extended: `test/fixtures/tenant-context.json` already exists; plugins inherit from it

---

## Environment Availability

### Dependencies

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Plugin module loading, server runtime | ✓ | >=20.16.0 | — |
| Express.js | Plugin route registration | ✓ | >=4.18.0 | — |
| Supabase JS Client | Plugin DB queries + RLS validation | ✓ | >=2.40.0 | — |
| TypeScript | Plugin contract types (registry.ts) | ✓ | >=5.0 | — |
| Phase 51 Tenant Schema | Plugin tenant scope filtering | ✓ | Delivered 2026-04-03 | — |
| Phase 37 Brand System | Plugin theme inheritance | ✓ | Delivered 2026-04-01 | — |

**No external dependencies missing.** All required infrastructure from prior phases is available.

---

## Sources

### Primary (HIGH confidence)

- **Phase 51 CONTEXT.md** - Tenant context propagation, IAM v3.2 roles, fail-closed semantics
- **Phase 51 Implementation** - runtime-context.cjs tenant resolution pattern, requireHostedSupabaseAuth gate
- **Phase 37 Brand System** - lib/markos/theme/brand-pack.ts (token override contract)
- **Existing Handler Pattern** - onboarding/backend/handlers.cjs module loading + IAM integration
- **Telemetry Baseline** - lib/markos/telemetry/events.ts (event schema + sanitization)

### Secondary (MEDIUM confidence)

- **MarkOS Orchestration** - Existing draft generation + approval workflows confirm integration surface
- **MarkOS Telemetry** - Phase 37 control-plane telemetry blueprint for event emission pattern
- **Supabase RLS** - Existing migrations (47, 42) demonstrate tenant-scoped table pattern

---

## Metadata

**Confidence Breakdown:**
- **Plugin Runtime:** HIGH — in-process is proven pattern; aligns with MarkOS existing architecture
- **Plugin Interface:** HIGH — derived from handlers.cjs + telemetry patterns; contract is TypeScript interface
- **Digital Agency Scope:** HIGH — wraps existing workflows; integration points are clear
- **Tenant-Plugin Model:** HIGH — mirrors Phase 51 tenant context approach; RLS provides enforcement
- **White-Label:** HIGH — Phase 37 brand-pack already exists; plugins just inherit
- **Billing/Telemetry:** MEDIUM — Phase 54 owns metering; Phase 52 just emits schema. Event shape is defined.
- **Plugin Versioning (deferred):** LOW — out of scope for v1; insufficient research for v1 design

**Research Date:** 2026-04-03  
**Valid Until:** 2026-04-17 (14 days; plugin architecture is stable; revisit if Phase 53/54 feedback invalidates assumptions)

