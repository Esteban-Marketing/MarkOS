# Plan 52-02 Summary — Wave 2: Digital Agency Plugin v1

**Phase:** 52 — Plugin Runtime and Digital Agency Plugin v1  
**Plan:** 52-02 (Wave 2)  
**Requirements:** PLG-DA-02  
**Status:** COMPLETE ✅  
**Depends on:** 52-01 (Wave 1)

---

## Goal Achieved

Implemented the first production plugin package (Digital Agency) on top of the Phase 52 runtime foundation. Plugin declares a valid contract, exposes 4 scoped routes with per-route capability gating, supports draft/approve/assemble/publish lifecycle, stores campaign and approval state in tenant-scoped Supabase tables, and wires into the existing handler chain.

---

## Tasks

### Task 52-02-01 — Plugin Manifest, Routes, Authorization (GREEN) ✅
**Commit:** `ca7d819`

Created:
- `lib/markos/plugins/digital-agency/index.js` — `digitalAgencyPlugin` contract: id=`digital-agency-v1`, 4 routes under `/plugins/digital-agency/*`, required capabilities and IAM roles declared, all metadata frozen
- `lib/markos/plugins/digital-agency/plugin-guard.js` — `pluginGuard(req, res, cap)` gate: reads `req.tenantContext.pluginEnabled` + `grantedCapabilities`; returns 404/PLUGIN_DISABLED or 403/CAPABILITY_NOT_GRANTED fail-closed
- `lib/markos/plugins/digital-agency/routes/dashboard.js` — `GET /plugins/digital-agency/dashboard` → requires `read_campaigns`
- `lib/markos/plugins/digital-agency/routes/drafts.js` — `GET /plugins/digital-agency/drafts` → requires `read_drafts`
- `lib/markos/plugins/digital-agency/routes/campaigns.js` — `POST /campaigns/assemble` (write_campaigns) and `POST /campaigns/:id/publish` (publish_campaigns)
- `onboarding/backend/handlers.cjs` — added `_loadDAPlugin()` lazy-loader and `handlePluginRoute()` dispatcher; exports `handlePluginRoute`

**Route authorization contract:**
- Plugin disabled → `404 PLUGIN_DISABLED` before handler execution, no state mutation
- Capability absent → `403 CAPABILITY_NOT_GRANTED` before handler execution
- All checks happen in `pluginGuard` before any route logic runs

### Task 52-02-02 — Campaign Workflow Persistence + Approval Events (GREEN) ✅
**Commit:** `ca7d819`

Created:
- `supabase/migrations/52_digital_agency_core.sql`:
  - `digital_agency_campaigns` — state machine: `draft → pending_approval → approved → published`; tenant_id FK; state check constraint; manager+ INSERT/UPDATE RLS
  - `digital_agency_campaign_approvals` — immutable append-only: SELECT + INSERT only (no UPDATE/DELETE); `decision` check constraint (granted/rejected/revoked)
  - `digital_agency_campaign_schedules` — publish window scheduling; soft-cancel via `cancelled_at`; manager+ gated
  - Full deny-by-default RLS on all three tables using `markos_tenant_memberships` join pattern from Phase 51

- `lib/markos/plugins/digital-agency/handlers/events.js` — `handleApprovalGranted(event)` and `handleCampaignPublished(event)`: immutable frozen audit records; throw on wrong type; return `{recorded, tenant_id, event_type, correlation_id, recorded_at}`

**Workflow lifecycle tests verified:**
- `handleAssembleCampaign` → campaign with `state: 'pending_approval'`, `draft_ids` set, `tenant_id` propagated
- `handlePublishCampaign` → campaign with `state: 'published'`; denied attempt returns `403` without mutation
- Event handlers return immutable records with correct `tenant_id` and `correlation_id`

---

## Artifacts

| Artifact | Status |
|---|---|
| `lib/markos/plugins/digital-agency/index.js` | ✅ New |
| `lib/markos/plugins/digital-agency/plugin-guard.js` | ✅ New |
| `lib/markos/plugins/digital-agency/routes/dashboard.js` | ✅ New |
| `lib/markos/plugins/digital-agency/routes/drafts.js` | ✅ New |
| `lib/markos/plugins/digital-agency/routes/campaigns.js` | ✅ New |
| `lib/markos/plugins/digital-agency/handlers/events.js` | ✅ New |
| `supabase/migrations/52_digital_agency_core.sql` | ✅ New |
| `onboarding/backend/handlers.cjs` | ✅ Modified |
| `test/digital-agency.test.js` | ✅ New (14 tests) |

---

## Test Results

- `test/digital-agency.test.js`: **14/14 PASS**
- Combined (Plans 01 + 02): **43/43 PASS**

---

## Design Decisions Applied

- **D-03:** Digital Agency as first-party plugin with scoped route namespace
- **D-07:** All plugin route handlers read-only context; cannot mutate server global state
- **Phase 51 RLS:** All campaign tables use `markos_tenant_memberships`-join deny-by-default
- **Fail-closed:** Plugin guard checks complete before any handler logic runs; denied publish produces no state change in response body

---

## Next: Plan 52-03 (Wave 3) — Plugin Settings API/UI + Brand Inheritance
