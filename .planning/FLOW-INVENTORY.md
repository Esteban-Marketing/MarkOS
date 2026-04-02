# FLOW-INVENTORY.md — MarkOS Operations Flow Inventory

**Phase:** 45 — Operations Flow Inventory & Canonical Contract Map  
**Generated:** 2026-04-02  
**Status:** Canonical baseline (requires reviewer sign-off before CI enforcement)  
**Source:** `bin/extract-flows.cjs` | `contracts/flow-registry.json`  
**Registry summary:** 17 active flows | 7 domains | 9 flow_types

---

## Locked Enum Reference

> These enums are locked for Phase 45. Unknown labels fail validation (D-03). No expansion permitted in this phase (D-16).

**Domains:** `onboarding` · `execution` · `enrichment` · `integration` · `migration` · `reporting` · `admin`

**Flow Types:** `submission` · `approval` · `regeneration` · `query` · `health_check` · `sync` · `record` · `migration` · `enrichment`

---

## Flow Registry Table

| flow_id | flow_name | domain | flow_type | method | local_path | hosted_path | actor | auth_local | auth_hosted | handler | slo_tier |
|---------|-----------|--------|-----------|--------|------------|-------------|-------|------------|-------------|---------|----------|
| F-01 | client-intake-submit | onboarding | submission | POST | /submit | /api/submit | Operator | none | none | handleSubmit | critical |
| F-02 | draft-approve | execution | approval | POST | /approve | /api/approve | Operator | none | none | handleApprove | standard |
| F-03 | section-regenerate | execution | regeneration | POST | /regenerate | /api/regenerate | Operator | none | none | handleRegenerate | standard |
| F-04 | system-config-read | reporting | query | GET | /config | /api/config | System | none | config_read JWT | handleConfig | standard |
| F-05 | system-status-health | reporting | health_check | GET | /status | /api/status | System | none | status_read JWT | handleStatus | standard |
| F-06 | linear-task-sync | integration | sync | POST | /linear/sync | /api/linear/sync | System | none | none | handleLinearSync | standard |
| F-07 | campaign-result-record | integration | record | POST | /campaign/result | /api/campaign/result | System | none | none | handleCampaignResult | standard |
| F-08 | markosdb-migrate | migration | migration | POST | /migrate/local-to-cloud | /api/migrate | Operator | none | migration_write JWT | handleMarkosdbMigration | standard |
| F-09 | literacy-coverage-report | reporting | query | GET | /api/literacy/coverage | /api/literacy/coverage | Operator | none | status_read JWT | handleLiteracyCoverage | standard |
| F-10 | literacy-admin-health | admin | health_check | GET | /admin/literacy/health | (local only) | Admin | Admin secret header | N/A | handleLiteracyHealth | standard |
| F-11 | literacy-admin-query | admin | query | POST | /admin/literacy/query | (local only) | Admin | Admin secret header | N/A | handleLiteracyQuery | standard |
| F-12 | ai-interview-generate-q | enrichment | query | POST | /api/generate-question | (local only) | System | none | N/A | handleGenerateQuestion | standard |
| F-13 | ai-interview-parse-answer | enrichment | query | POST | /api/parse-answer | (local only) | System | none | N/A | handleParseAnswer | standard |
| F-14 | source-extraction | enrichment | enrichment | POST | /api/extract-sources | (local only) | System | none | N/A | handleExtractSources | standard |
| F-15 | extract-and-score | enrichment | enrichment | POST | /api/extract-and-score | (local only) | System | none | N/A | handleExtractAndScore | standard |
| F-16 | spark-suggestion | enrichment | enrichment | POST | /api/spark-suggestion | (local only) | System | none | N/A | handleSparkSuggestion | standard |
| F-17 | competitor-discovery | enrichment | enrichment | POST | /api/competitor-discovery | (local only) | System | none | N/A | handleCompetitorDiscovery | standard |

**Total active flows: 17** | Hosted-with-auth: 4 (F-04, F-05, F-08, F-09) | Local-only: 8 (F-10..F-17) | Open hosted: 5 (F-01, F-02, F-03, F-06, F-07)

---

## Flow Detail Sections

### F-01 — client-intake-submit

| Property | Value |
|----------|-------|
| Method | POST |
| Local path | `/submit` |
| Hosted path | `/api/submit` |
| Handler | `handleSubmit` |
| Actor | Operator |
| Auth (hosted) | none (local passthrough) |
| SLO Tier | critical |
| Domain | onboarding |
| Flow type | submission |

**Journey (5 steps):**
1. Validate seed JSON (company, product, audience, market, content, project_slug)
2. Resolve/persist project_slug to `.markos-project.json`
3. Auto-create Linear tickets (`handleLinearSync` sub-path, if LINEAR_API_KEY present)
4. Orchestrate AI draft generation (via `agents/orchestrator.cjs`)
5. Evaluate literacy readiness → respond with draft snippets and outcome state

**Inputs:** seed JSON: company, product, audience, market, content, project_slug  
**Outputs:** drafts[], literacy_readiness flag, linear_tickets[], slug  
**Error codes:** 400 (invalid seed), 500 (AI orchestration failure)

**Traceability:**  
- Route: `server.cjs` line — `POST /submit → handlers.handleSubmit`  
- Handler: `handlers.cjs` → `handleSubmit`  
- Hosted wrapper: `api/submit.js`

---

### F-02 — draft-approve

| Property | Value |
|----------|-------|
| Method | POST |
| Local path | `/approve` |
| Hosted path | `/api/approve` |
| Handler | `handleApprove` |
| Actor | Operator |
| Auth (hosted) | none |
| SLO Tier | standard |
| Domain | execution |
| Flow type | approval |

**Journey (4 steps):**
1. Validate approvedDrafts map (section → text) and slug
2. Write MIR files via `write-mir.cjs`
3. Store approved drafts in vector store
4. Emit checkpoint state update

**Inputs:** approvedDrafts (section→text map), slug  
**Outputs:** written MIR files, STATE.md update, vector store persistence  
**Error codes:** 400 (missing slug/drafts), 500 (write failure)

**Traceability:**  
- Route: `server.cjs` — `POST /approve → handlers.handleApprove`  
- Handler: `handlers.cjs` → `handleApprove`  
- Hosted wrapper: `api/approve.js`

---

### F-03 — section-regenerate

| Property | Value |
|----------|-------|
| Method | POST |
| Local path | `/regenerate` |
| Hosted path | `/api/regenerate` |
| Handler | `handleRegenerate` |
| Actor | Operator |
| Auth (hosted) | none |
| SLO Tier | standard |
| Domain | execution |
| Flow type | regeneration |

**Journey (3 steps):**
1. Validate section name, seed, and slug
2. Re-run AI agent for specific section
3. Store regenerated draft → respond with outcome

**Inputs:** section (string), seed, slug  
**Outputs:** regenerated section content, outcome state  
**Error codes:** 400 (invalid section), 500 (AI failure)

**Traceability:**  
- Route: `server.cjs` — `POST /regenerate → handlers.handleRegenerate`  
- Handler: `handlers.cjs` → `handleRegenerate`  
- Hosted wrapper: `api/regenerate.js`

---

### F-04 — system-config-read

| Property | Value |
|----------|-------|
| Method | GET |
| Local path | `/config` |
| Hosted path | `/api/config` |
| Handler | `handleConfig` |
| Actor | System |
| Auth local | none |
| Auth hosted | `config_read` Supabase JWT |
| SLO Tier | standard |
| Domain | reporting |
| Flow type | query |

**Journey (2 steps):**
1. Validate auth (hosted: requireHostedSupabaseAuth `config_read`)
2. Build config object from `onboarding-config.json` + runtime context → respond

**Inputs:** none (GET, reads from config file + runtime)  
**Outputs:** config object (rollout_mode, feature flags, MarkOSDB access matrix)  
**Error codes:** 401 (missing/invalid JWT hosted), 500 (config read failure)

**Traceability:**  
- Route: `server.cjs` — `GET /config → handlers.handleConfig`  
- Handler: `handlers.cjs` → `handleConfig`  
- Hosted wrapper: `api/config.js` (includes `requireHostedSupabaseAuth` with `config_read`)

---

### F-05 — system-status-health

| Property | Value |
|----------|-------|
| Method | GET |
| Local path | `/status` |
| Hosted path | `/api/status` |
| Handler | `handleStatus` |
| Actor | System |
| Auth local | none |
| Auth hosted | `status_read` Supabase JWT |
| SLO Tier | standard |
| Domain | reporting |
| Flow type | health_check |

**Journey (4 steps):**
1. Validate auth (hosted: `status_read`)
2. Health-check vector store (via `vector-store-client.cjs`)
3. Evaluate literacy readiness state
4. Read MIR STATE.md progress → respond

**Inputs:** project_slug (optional, via auth context)  
**Outputs:** vector_memory health, MIR gate status, literacy readiness, rollout mode  
**Error codes:** 401 (hosted auth), 500 (vector health failure)

**Traceability:**  
- Route: `server.cjs` — `GET /status → handlers.handleStatus`  
- Handler: `handlers.cjs` → `handleStatus`  
- Hosted wrapper: `api/status.js` (includes `requireHostedSupabaseAuth` with `status_read`)

---

### F-06 — linear-task-sync

| Property | Value |
|----------|-------|
| Method | POST |
| Local path | `/linear/sync` |
| Hosted path | `/api/linear/sync` |
| Handler | `handleLinearSync` |
| Actor | System |
| Auth (hosted) | none |
| SLO Tier | standard |
| Domain | integration |
| Flow type | sync |

**Journey (5 steps):**
1. Validate LINEAR_API_KEY secret
2. Get Linear team ID
3. For each task in tasks[]: read template → create issue
4. Aggregate results (created[], skipped[])
5. Respond

**Inputs:** LINEAR_API_KEY (env), slug, phase, tasks[]  
**Outputs:** created issues[], skipped[]  
**Error codes:** 400 (missing key/tasks), 502 (Linear API timeout)

**Traceability:**  
- Route: `server.cjs` — `POST /linear/sync → handlers.handleLinearSync`  
- Handler: `handlers.cjs` → `handleLinearSync`  
- Hosted wrapper: `api/linear/sync.js`

---

### F-07 — campaign-result-record

| Property | Value |
|----------|-------|
| Method | POST |
| Local path | `/campaign/result` |
| Hosted path | `/api/campaign/result` |
| Handler | `handleCampaignResult` |
| Actor | System |
| Auth (hosted) | none |
| SLO Tier | standard |
| Domain | integration |
| Flow type | record |

**Journey (4 steps):**
1. Validate slug, discipline, asset, metric, value, outcome fields
2. Resolve catalog path
3. Append catalog row to winners catalog
4. Store vector persistence → respond

**Inputs:** slug, discipline, asset, metric, value, outcome  
**Outputs:** catalog_path, row appended, vector persistence  
**Error codes:** 400 (missing fields), 500 (catalog write failure)

**Traceability:**  
- Route: `server.cjs` — `POST /campaign/result → handlers.handleCampaignResult`  
- Handler: `handlers.cjs` → `handleCampaignResult`  
- Hosted wrapper: `api/campaign/result.js`

---

### F-08 — markosdb-migrate

| Property | Value |
|----------|-------|
| Method | POST |
| Local path | `/migrate/local-to-cloud` |
| Hosted path | `/api/migrate` |
| Handler | `handleMarkosdbMigration` |
| Actor | Operator |
| Auth local | none |
| Auth hosted | `migration_write` Supabase JWT |
| SLO Tier | standard |
| Domain | migration |
| Flow type | migration |

**Journey (6 steps):**
1. Validate auth (hosted: `migration_write`)
2. Resolve project slug
3. Check promotion eligibility (dry_run flag)
4. List migration artifacts
5. Migrate each artifact (vector + relational upsert)
6. Respond with checksum map and results

**Inputs:** project_slug, dry_run flag  
**Outputs:** migration artifacts list, checksum map, vector + relational upsert results  
**Error codes:** 401 (hosted auth), 400 (missing slug), 500 (migration failure)

**Traceability:**  
- Route: `server.cjs` — `POST /migrate/local-to-cloud → handlers.handleMarkosdbMigration`  
- Handler: `handlers.cjs` → `handleMarkosdbMigration`  
- Hosted wrapper: `api/migrate.js` (includes `requireHostedSupabaseAuth` with `migration_write`)

---

### F-09 — literacy-coverage-report

| Property | Value |
|----------|-------|
| Method | GET |
| Local path | `/api/literacy/coverage` |
| Hosted path | `/api/literacy/coverage` |
| Handler | `handleLiteracyCoverage` |
| Actor | Operator |
| Auth local | none |
| Auth hosted | `status_read` Supabase JWT |
| SLO Tier | standard |
| Domain | reporting |
| Flow type | query |

**Journey (3 steps):**
1. Validate auth (hosted: `status_read`)
2. Vector-get coverage state per discipline
3. Respond with coverage summary

**Inputs:** none (GET, uses runtime context)  
**Outputs:** literacy coverage summary (discipline list, providers, status)  
**Error codes:** 401 (hosted auth), 500 (vector failure)

**Traceability:**  
- Route: `server.cjs` — `GET /api/literacy/coverage → handlers.handleLiteracyCoverage`  
- Handler: `handlers.cjs` → `handleLiteracyCoverage`  
- Hosted wrapper: `api/literacy/coverage.js` (includes `requireHostedSupabaseAuth` with `status_read`)

---

### F-10 — literacy-admin-health

| Property | Value |
|----------|-------|
| Method | GET |
| Local path | `/admin/literacy/health` |
| Hosted path | (local only — no Vercel wrapper) |
| Handler | `handleLiteracyHealth` |
| Actor | Admin |
| Auth local | Admin secret header |
| Auth hosted | N/A |
| SLO Tier | standard |
| Domain | admin |
| Flow type | health_check |

**Journey (2 steps):**
1. Validate admin secret header
2. Vector health-check → respond with provider status and runtime mode

**Inputs:** none (admin secret in header)  
**Outputs:** vector health, provider status, runtime mode  
**Error codes:** 401 (missing/invalid admin secret), 500 (vector failure)

**Traceability:**  
- Route: `server.cjs` — `GET /admin/literacy/health → handlers.handleLiteracyHealth`  
- Handler: `handlers.cjs` → `handleLiteracyHealth`  
- No hosted wrapper (admin-local only)

---

### F-11 — literacy-admin-query

| Property | Value |
|----------|-------|
| Method | POST |
| Local path | `/admin/literacy/query` |
| Hosted path | (local only — no Vercel wrapper) |
| Handler | `handleLiteracyQuery` |
| Actor | Admin |
| Auth local | Admin secret header |
| Auth hosted | N/A |
| SLO Tier | standard |
| Domain | admin |
| Flow type | query |

**Journey (3 steps):**
1. Validate admin secret header + discipline
2. Validate discipline against locked enum
3. Vector-get literacy context → respond with matches and diagnostics

**Inputs:** discipline, query, topK, filters  
**Outputs:** matches[], diagnostics  
**Error codes:** 401 (missing/invalid admin secret), 400 (unknown discipline), 500 (vector failure)

**Traceability:**  
- Route: `server.cjs` — `POST /admin/literacy/query → handlers.handleLiteracyQuery`  
- Handler: `handlers.cjs` → `handleLiteracyQuery`  
- No hosted wrapper (admin-local only)

---

### F-12 — ai-interview-generate-q

| Property | Value |
|----------|-------|
| Method | POST |
| Local path | `/api/generate-question` |
| Hosted path | (local only — no Vercel wrapper) |
| Handler | `handleGenerateQuestion` |
| Actor | System |
| Auth | none |
| SLO Tier | standard |
| Domain | enrichment |
| Flow type | query |

**Journey (2 steps):**
1. Validate seed/context
2. LLM-generate interview question → respond

**Inputs:** seed or context  
**Outputs:** interview question (string)  
**Error codes:** 400 (missing context), 500 (LLM failure)

**Traceability:**  
- Route: `server.cjs` — `POST /api/generate-question → handlers.handleGenerateQuestion`  
- Handler: `handlers.cjs` → `handleGenerateQuestion`

---

### F-13 — ai-interview-parse-answer

| Property | Value |
|----------|-------|
| Method | POST |
| Local path | `/api/parse-answer` |
| Hosted path | (local only — no Vercel wrapper) |
| Handler | `handleParseAnswer` |
| Actor | System |
| Auth | none |
| SLO Tier | standard |
| Domain | enrichment |
| Flow type | query |

**Journey (2 steps):**
1. Validate seed, question, answer inputs
2. Parse/template-match answer → respond with parsed metadata

**Inputs:** seed, question, answer  
**Outputs:** parsed answer metadata  
**Error codes:** 400 (missing fields), 500 (parse failure)

**Traceability:**  
- Route: `server.cjs` — `POST /api/parse-answer → handlers.handleParseAnswer`  
- Handler: `handlers.cjs` → `handleParseAnswer`

---

### F-14 — source-extraction

| Property | Value |
|----------|-------|
| Method | POST |
| Local path | `/api/extract-sources` |
| Hosted path | (local only — no Vercel wrapper) |
| Handler | `handleExtractSources` |
| Actor | System |
| Auth | none |
| SLO Tier | standard |
| Domain | enrichment |
| Flow type | enrichment |

**Journey (2 steps):**
1. Validate source text input
2. LLM-extract source references → respond with sources JSON

**Inputs:** source text  
**Outputs:** extracted sources JSON  
**Error codes:** 400 (missing text), 500 (LLM failure)

**Traceability:**  
- Route: `server.cjs` — `POST /api/extract-sources → handlers.handleExtractSources`  
- Handler: `handlers.cjs` → `handleExtractSources`

---

### F-15 — extract-and-score

| Property | Value |
|----------|-------|
| Method | POST |
| Local path | `/api/extract-and-score` |
| Hosted path | (local only — no Vercel wrapper) |
| Handler | `handleExtractAndScore` |
| Actor | System |
| Auth | none |
| SLO Tier | standard |
| Domain | enrichment |
| Flow type | enrichment |

**Journey (3 steps):**
1. Validate source text and seed
2. LLM-extract sources
3. Score/rank source set → respond

**Inputs:** source text, seed  
**Outputs:** scored/ranked source set  
**Error codes:** 400 (missing inputs), 500 (LLM failure)

**Traceability:**  
- Route: `server.cjs` — `POST /api/extract-and-score → handlers.handleExtractAndScore`  
- Handler: `handlers.cjs` → `handleExtractAndScore`

---

### F-16 — spark-suggestion

| Property | Value |
|----------|-------|
| Method | POST |
| Local path | `/api/spark-suggestion` |
| Hosted path | (local only — no Vercel wrapper) |
| Handler | `handleSparkSuggestion` |
| Actor | System |
| Auth | none |
| SLO Tier | standard |
| Domain | enrichment |
| Flow type | enrichment |

**Journey (2 steps):**
1. Validate product/market context
2. LLM-suggest spark ideas → respond with suggestions[]

**Inputs:** product/market context  
**Outputs:** spark suggestions array  
**Error codes:** 400 (missing context), 500 (LLM failure)

**Traceability:**  
- Route: `server.cjs` — `POST /api/spark-suggestion → handlers.handleSparkSuggestion`  
- Handler: `handlers.cjs` → `handleSparkSuggestion`

---

### F-17 — competitor-discovery

| Property | Value |
|----------|-------|
| Method | POST |
| Local path | `/api/competitor-discovery` |
| Hosted path | (local only — no Vercel wrapper) |
| Handler | `handleCompetitorDiscovery` |
| Actor | System |
| Auth | none |
| SLO Tier | standard |
| Domain | enrichment |
| Flow type | enrichment |

**Journey (2 steps):**
1. Validate company/market context
2. LLM-discover competitor names and positionings → respond

**Inputs:** company/market context  
**Outputs:** competitor names[], positionings[]  
**Error codes:** 400 (missing context), 500 (LLM failure)

**Traceability:**  
- Route: `server.cjs` — `POST /api/competitor-discovery → handlers.handleCompetitorDiscovery`  
- Handler: `handlers.cjs` → `handleCompetitorDiscovery`

---

## Phase 37 RBAC and RLS Cross-Reference

> This section maps all hosted auth-bearing flows to the Phase 37 RBAC baseline in `.planning/phases/37-markos-ui-control-plane/37-01-SUMMARY.md`. Required before Phase 48 hardening work (per 45-02 acceptance criteria).

### Protected Hosted Flows

| id | hosted_path | operation label | Auth mechanism | Phase 37 baseline reference |
|----|-------------|-----------------|----------------|----------------------------|
| **F-04** | /api/config | `config_read` | Supabase JWT (requireHostedSupabaseAuth) | `lib/markos/rbac/policies.ts` (route-level RBAC helper) + `supabase/migrations/37_markos_ui_control_plane.sql` (RLS workspace-scoped policies) |
| **F-05** | /api/status | `status_read` | Supabase JWT (requireHostedSupabaseAuth) | `lib/markos/rbac/policies.ts` + `supabase/migrations/37_markos_ui_control_plane.sql` |
| **F-08** | /api/migrate | `migration_write` | Supabase JWT (requireHostedSupabaseAuth) | `lib/markos/rbac/policies.ts` + `supabase/migrations/37_markos_ui_control_plane.sql` |
| **F-09** | /api/literacy/coverage | `status_read` | Supabase JWT (requireHostedSupabaseAuth) | `lib/markos/rbac/policies.ts` + `supabase/migrations/37_markos_ui_control_plane.sql` |

### Phase 37 Baseline Artifacts

| Artifact | Role |
|----------|------|
| `lib/markos/rbac/policies.ts` | Route-level RBAC policy helper; defines `config_read`, `status_read`, `migration_write` permission labels and enforcement patterns used by `requireHostedSupabaseAuth` in `api/*.js` wrappers |
| `lib/markos/telemetry/events.ts` | Telemetry event contract; defines `rollout_endpoint_observed` events referenced in T0 baseline (Plan 45-05) |
| `supabase/migrations/37_markos_ui_control_plane.sql` | Supabase RLS baseline: workspace-scoped entity policies, revision policies, and audit log RLS applied to MarkOS tables. Governs data-layer enforcement for JWT-gated flows F-04, F-05, F-08, F-09 |

### Hardening Scope Note

Per D-19 (Phase 45 scope boundary), RBAC hardening and Supabase RLS policy updates are deferred to Phase 48. This cross-reference establishes the baseline for that work only. The flows listed above currently enforce auth at the **application layer** (`requireHostedSupabaseAuth`) with RLS at the **Supabase layer** as established in Phase 37.

### Local-Only Admin Flows

F-10 and F-11 use an admin secret header (`ADMIN_SECRET_HEADER`) enforced at the handler level. These flows have no hosted Vercel wrapper and are out of scope for Supabase RBAC enforcement. No change planned in Phase 45.

---

## Registry Summary

| Metric | Value |
|--------|-------|
| Total active flows | **17** |
| Flows with hosted Vercel wrappers | 9 (F-01..F-09) |
| Flows with hosted auth gate | 4 (F-04, F-05, F-08, F-09) |
| Local-only flows (no Vercel wrapper) | 8 (F-10..F-17) |
| Admin-gated (local secret) | 2 (F-10, F-11) |
| SLO critical | 1 (F-01) |
| SLO standard | 16 |

---

*Generated by Phase 45 execution | Source: `bin/extract-flows.cjs` + `contracts/flow-registry.json` + `.planning/FLOW-TAXONOMY.json`*
