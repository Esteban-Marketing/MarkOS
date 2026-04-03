# Plan 52-01 Summary — Wave 1: Plugin Runtime Foundation

**Phase:** 52 — Plugin Runtime and Digital Agency Plugin v1  
**Plan:** 52-01 (Wave 1)  
**Requirements:** PLG-DA-01  
**Status:** COMPLETE ✅  

---

## Goal Achieved

Established the foundational plugin runtime: contract schema, deterministic registry, boot-time loader with error isolation, tenant-scoped enablement/capability-grant helpers, and Supabase migrations with deny-by-default RLS.

---

## Tasks

### Task 52-01-01 — TDD RED Scaffolds ✅
**Commit:** `d82f191`

Created failing test stubs:
- `test/plugin-registry.test.js` — 17 tests covering contract validation, registry determinism, loader error boundaries, marketplace exclusion gate
- `test/plugin-control.test.js` — 12 tests covering tenant isolation, PLUGIN_DISABLED=404, CAPABILITY_NOT_GRANTED=403, append-only grant idempotency, cross-tenant non-leakage

Both files committed RED (MODULE_NOT_FOUND — implementation pending).

### Task 52-01-02 — Plugin Contracts / Registry / Loader (GREEN) ✅
**Commit:** `ad4a457`

Created:
- `lib/markos/plugins/contracts.js` — `PLUGIN_CONTRACT_VERSION='1.0.0'`, `PLUGIN_CAPABILITIES` (8 capabilities, frozen), `validatePluginContract()` with 8 typed error codes
- `lib/markos/plugins/registry.js` — Map-backed registry: insertion-order preserved, idempotent duplicate handling, all entries frozen
- `lib/markos/plugins/loader.js` — `loadPlugins(manifests)` → `{registry, failures[]}` with per-plugin error boundaries; marketplace API intentionally absent (D-01)
- `bin/cli-runtime.cjs` — added `bootPluginRuntime(manifests=[])` + export

Result: `plugin-registry.test.js` 17/17 PASS.

### Task 52-01-03 — Migration + Runtime Context Extension (GREEN) ✅
**Commit:** `ce9545e`

Created:
- `supabase/migrations/52_plugin_runtime_foundation.sql`:
  - `markos_plugins` — canonical first-party plugin registry
  - `plugin_tenant_config` — per-tenant enablement + capability array; UNIQUE(tenant_id, plugin_id); UPDATED/DELETE admin-only RLS
  - `plugin_tenant_capability_grants` — immutable append-only audit trail; SELECT+INSERT only RLS (no UPDATE/DELETE policies)
  - `plugin_entitlements_by_plan` — plan-tier → plugin capability mapping; service_role write-only
  - Seeded: `digital-agency-v1` manifest + 4 plan-tier entitlements
  - Full deny-by-default RLS aligned with Phase 51 `markos_tenant_memberships` join pattern

Added to `onboarding/backend/runtime-context.cjs`:
- `isTenantPluginEnabled(store, tenantId, pluginId)` → boolean (false for unknown tenant)
- `getGrantedCapabilities(store, tenantId, pluginId)` → string[] ([] for unknown tenant)
- `assertPluginCapability(store, tenantId, pluginId, capability)` → throws `PLUGIN_DISABLED/404` or `CAPABILITY_NOT_GRANTED/403`
- `recordCapabilityGrant(store, tenantId, pluginId, capability)` → updated store; throws `TENANT_NOT_FOUND` for missing entry; idempotent

Result: `plugin-control.test.js` 12/12 PASS.  
Full combined: **29/29 PASS**.

---

## Artifacts

| Artifact | Status |
|---|---|
| `lib/markos/plugins/contracts.js` | ✅ New |
| `lib/markos/plugins/registry.js` | ✅ New |
| `lib/markos/plugins/loader.js` | ✅ New |
| `bin/cli-runtime.cjs` | ✅ Modified |
| `onboarding/backend/runtime-context.cjs` | ✅ Modified |
| `supabase/migrations/52_plugin_runtime_foundation.sql` | ✅ New |
| `test/plugin-registry.test.js` | ✅ New (17 tests) |
| `test/plugin-control.test.js` | ✅ New (12 tests) |

---

## Design Decisions Applied

- **D-01:** CommonJS in-process plugin loading (no marketplace, no dynamic import)
- **D-02:** Capability layer enforced via `assertPluginCapability` before handler logic
- **D-04:** Unit tests use in-memory Map store (no Supabase required for unit isolation)
- **Phase 51 RLS pattern:** All tables use `markos_tenant_memberships` join on `auth.jwt()->>'sub'` for deny-by-default tenant isolation

---

## Next: Plan 52-02 (Wave 2) — Digital Agency Plugin Routes + Campaign Persistence
