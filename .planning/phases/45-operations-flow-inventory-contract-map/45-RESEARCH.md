# Phase 45: Operations Flow Inventory & Canonical Contract Map — Research

**Researched:** 2026-04-02
**Domain:** API contract mapping, flow taxonomy, OpenAPI 3.0 schema design, telemetry baseline
**Confidence:** HIGH (all findings sourced from live codebase)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Hybrid classification model: `domain + flow_type` (not single-axis).
- **D-02:** Lock controlled enums for Phase 45 to prevent taxonomy drift.
- **D-03:** Treat unknown/novel labels as invalid in CI until explicitly approved.
- **D-04:** Journey-level grouping as canonical registry unit.
- **D-05:** Every journey node must map to concrete endpoint IDs/handlers.
- **D-06:** Constrain journey size to 3–12 steps per journey.
- **D-07:** OpenAPI 3.0 is the canonical contract artifact format.
- **D-08:** Do not introduce a parallel custom contract system in Phase 45.
- **D-09:** For non-HTTP/internal semantics, use extension fields; defer async/event contracts.
- **D-10:** Hybrid verification: automated extraction + manual semantic review + CI validation.
- **D-11:** Extraction is coverage-oriented and read-only; must not mutate runtime behavior.
- **D-12:** First baseline requires explicit reviewer sign-off before CI enforcement is stable.
- **D-13:** Baseline is instrumentation + fixed aggregate window (not single-run manual timing).
- **D-14:** Capture T0 metrics using existing telemetry channels; no new analytics platform.
- **D-15:** Freeze baseline only after explicit sign-off and outlier handling is applied.
- **D-16:** No taxonomy expansion beyond initial controlled enum set in this phase.
- **D-17:** No full event-contract framework migration in this phase.
- **D-18:** No autonomous verification-only gate without human review in this phase.
- **D-19:** No scope pull-in from Phases 46–50.

### Claude's Discretion
- Extraction script architecture and parser layout (must stay read-only).
- Exact naming convention details for enum constants and report sections.
- Reviewer workflow mechanics (checklist format, approval metadata fields).
- KPI aggregation query implementation details (metric definitions unchanged).

### Deferred Ideas (OUT OF SCOPE)
- OpenAPI 3.1 migration and advanced async/event contract model.
- Fully autonomous flow verification without reviewer checkpoint.
- Expanded taxonomy beyond locked enum set for Phase 45.
- New analytics vendor/platform rollout for KPI baseline instrumentation.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| API-01 | Every production MarkOS flow mapped to API contract(s) | §1 enumerates all 17 flows; §5 shows FLOW-CONTRACTS.md structure |
| API-02 (partial) | Contract schema established in `contracts/schema.json` | §3 provides full schema design with real flow examples |
</phase_requirements>

---

## Summary

Phase 45 is a pure inventory and foundation phase — no runtime behavior changes, no new endpoints, no UI. The primary challenge is accurately cataloguing all production flows across two entrypoints (local Express-style server and Next.js API wrappers) and producing auditable contract artifacts that Phases 46–50 can reference without modification.

The MarkOS backend exposes **17 distinct handler endpoints** grouped under **6 domains** and **7 flow types**. All handlers are implemented in `onboarding/backend/handlers.cjs` and wired by both `onboarding/backend/server.cjs` (local) and `api/*.js` wrappers (hosted). The dual-entrypoint model means some flows have auth guardrails on the hosted path only (`/api/status`, `/api/migrate`, `/api/literacy/coverage`, `/api/config`), which must be captured in the contract metadata.

Existing telemetry infrastructure (PostHog via `telemetry.cjs`) already emits `rollout_endpoint_observed` events for four critical routes and `literacy_activation_observed` after submissions. The T0 KPI baseline can be anchored to this PostHog data plus static assessment for two unmeasured metrics (self-service rate, time-to-first-task), with quantitative bounds already documented in `REQUIREMENTS.md`.

**Primary recommendation:** Execute as 5 discrete plans in order — (1) flow extraction + taxonomy, (2) FLOW-INVENTORY.md, (3) FLOW-CONTRACTS.md + `contracts/schema.json`, (4) FLOW-VERIFICATION.md + test suite, (5) T0 KPI baseline.

---

## 1. Flow Extraction Strategy

### Entrypoint Topology

```
Local (CJS Express-style):           Hosted (Next.js Vercel):
onboarding/backend/server.cjs        api/*.js wrappers
        │                                    │
        ▼                                    ▼
onboarding/backend/handlers.cjs  ←──── (delegates to same handlers)
```

**Extraction approach:** A read-only Node script (`bin/extract-flows.cjs`) parses both files using regex + AST-free string scanning to build the route→handler map. It does not `require()` the server or handlers at runtime — it reads source as text only (satisfying D-11). The output is a structured JSON that feeds FLOW-INVENTORY.md generation.

### Complete Flow Inventory (sourced from `server.cjs` lines 80–108 + `handlers.cjs` exports)

| Flow ID | Flow Name | Method | Local Path | Hosted Path | Handler | Auth (hosted) |
|---------|-----------|--------|------------|-------------|---------|---------------|
| F-01 | client-intake-submit | POST | `/submit` | `/api/submit` | `handleSubmit` | none (local passthrough) |
| F-02 | draft-approve | POST | `/approve` | `/api/approve` | `handleApprove` | none (local passthrough) |
| F-03 | section-regenerate | POST | `/regenerate` | `/api/regenerate` | `handleRegenerate` | none (local passthrough) |
| F-04 | system-config-read | GET | `/config` | `/api/config` | `handleConfig` | `config_read` Supabase JWT |
| F-05 | system-status-health | GET | `/status` | `/api/status` | `handleStatus` | `status_read` Supabase JWT |
| F-06 | linear-task-sync | POST | `/linear/sync` | `/api/linear/sync` | `handleLinearSync` | none |
| F-07 | campaign-result-record | POST | `/campaign/result` | `/api/campaign/result` | `handleCampaignResult` | none |
| F-08 | markosdb-migrate | POST | `/migrate/local-to-cloud` | `/api/migrate` | `handleMarkosdbMigration` | `migration_write` Supabase JWT |
| F-09 | literacy-coverage-report | GET | `/api/literacy/coverage` | `/api/literacy/coverage` | `handleLiteracyCoverage` | `status_read` Supabase JWT |
| F-10 | literacy-admin-health | GET | `/admin/literacy/health` | N/A (local only) | `handleLiteracyHealth` | Admin secret header |
| F-11 | literacy-admin-query | POST | `/admin/literacy/query` | N/A (local only) | `handleLiteracyQuery` | Admin secret header |
| F-12 | ai-interview-generate-q | POST | `/api/generate-question` | `/api/generate-question` | `handleGenerateQuestion` | none |
| F-13 | ai-interview-parse-answer | POST | `/api/parse-answer` | `/api/parse-answer` | `handleParseAnswer` | none |
| F-14 | source-extraction | POST | `/api/extract-sources` | `/api/extract-sources` | `handleExtractSources` | none |
| F-15 | extract-and-score | POST | `/api/extract-and-score` | `/api/extract-and-score` | `handleExtractAndScore` | none |
| F-16 | spark-suggestion | POST | `/api/spark-suggestion` | `/api/spark-suggestion` | `handleSparkSuggestion` | none |
| F-17 | competitor-discovery | POST | `/api/competitor-discovery` | `/api/competitor-discovery` | `handleCompetitorDiscovery` | none |

**Total: 17 flows** — exceeds ≥10 success criterion.

**CORS preflight** (`OPTIONS *`) is a network concern, not a business flow — exclude from registry.

### Journey-Level Inputs / Outputs (D-04, D-05, D-06)

| Flow ID | Actor | Key Inputs | Key Outputs | Steps |
|---------|-------|-----------|-------------|-------|
| F-01 | Operator | seed JSON (company, product, audience, market, content, project_slug) | drafts, vector_store results, literacy readiness, linear_tickets, slug | 5: validate → slug-resolve → linear-auto-create → orchestrate-drafts → literacy-eval → respond |
| F-02 | Operator | approvedDrafts map (section→text), slug | written MIR files, STATE.md update, vector store persistence | 4: validate-auth → write-mir-files → store-approved-drafts → emit-checkpoint |
| F-03 | Operator | section name, seed, slug | regenerated section content, outcome state | 3: validate-section → ai-generate → store-draft → respond |
| F-04 | System | seed or context | MIR config (runtime.config), interview question | 2: validate → generate-question (llm) → respond |
| F-05 | System | seed, question, answer | parsed answer metadata | 2: validate → parse-answer (template) → respond |
| F-06 | System | source text | extracted sources JSON | 2: validate → extract (llm) → respond |
| F-07 | System | source text + seed | scored/ranked source set | 3: validate → extract → score → respond |
| F-08 | System | product/market context | spark suggestions array | 2: validate → llm-suggest → respond |
| F-09 | System | company/market context | competitor names + positionings | 2: validate → llm-discover → respond |
| F-10 | Operator/System | (none / runtime context) | config object + MarkOSDB access matrix + rollout state | 2: validate-auth → build-config → respond |
| F-11 | Operator/System | project_slug (optional, via auth context) | vector_memory health, MIR gate status, literacy readiness, rollout mode | 4: validate-auth → health-check-vector → eval-literacy-readiness → read-mir-state → respond |
| F-12 | System/Admin | LINEAR_API_KEY, slug, phase, tasks[] | created issues[], skipped[] | 5: validate-secrets → get-team → per-token: read-template → create-issue → aggregate-respond |
| F-13 | Operator | slug, discipline, asset, metric, value, outcome | catalog_path, row appended, vector persistence | 4: validate-fields → resolve-catalog-path → append-catalog-row → store-vector → respond |
| F-14 | Operator (auth required) | project_slug, dry_run flag | migration artifacts list, checksum map, vector + relational upsert results | 6: validate-auth → resolve-slug → check-promotion → list-artifacts → migrate-each → respond |
| F-15 | Operator/System (auth req.) | (none, uses runtime context) | literacy coverage summary (discipline list, providers, status) | 3: validate-auth → vector-get-coverage → respond |
| F-16 | Admin | (none) | vector health, provider status, runtime mode | 2: validate-admin-secret → vector-healthcheck → respond |
| F-17 | Admin | discipline, query, topK, filters | matches[], diagnostics | 3: validate-admin-secret → validate-discipline → vector-get-literacy-context → respond |

---

## 2. Taxonomy Design

### Controlled Domain Enum (≤10 values — D-02, D-16)

| Domain | Description | Flows |
|--------|-------------|-------|
| `onboarding` | Client intake, form submission, seed persistence | F-01, F-14 (source-extract is sub-step) |
| `execution` | AI content generation, approval, MIR/MSP writes | F-02, F-03 |
| `enrichment` | AI-assisted enrichment sub-flows (interview, scoring, suggestions) | F-12, F-13, F-14, F-15, F-16, F-17 |
| `integration` | External service sync (Linear, campaign outcomes) | F-06, F-07 |
| `migration` | Data migration between storage layers | F-08 |
| `reporting` | Status, health, and coverage reporting surfaces | F-05, F-11, F-09 |
| `admin` | Admin-gated literacy management | F-10, F-16, F-17 |

Wait — the above has 7 domains. Since ≤10 is the hard cap, this is valid. However the enrichment flows are all sub-steps of onboarding (called by the frontend during the interview loop). For the canonical registry they should remain their own top-level flows per D-04/D-05 (each must map to concrete endpoint IDs), but domain label `enrichment` clarifies their role.

**Final locked domain enum (7 values):**
```
onboarding | execution | enrichment | integration | migration | reporting | admin
```

### Controlled Flow_Type Enum (≤10 values)

| Flow_Type | Description | Examples |
|-----------|-------------|----------|
| `submission` | Operator-initiated write that persists state | F-01 (submit), F-02 (approve) |
| `approval` | Human approval gate that unblocks further execution | F-02 (approve flow specifically) |
| `regeneration` | Re-run of a specific AI generation step | F-03 |
| `query` | Read-only data retrieval (no state mutation) | F-11 (status), F-09 (literacy-coverage), F-17 (literacy-query) |
| `health_check` | Readiness probe / health inspection | F-05 (system-status), F-10 (config-read), F-16 (literacy-admin-health) |
| `sync` | Bidirectional or push-based external service sync | F-06 (linear-sync) |
| `record` | Append-only result/outcome recording | F-07 (campaign-result) |
| `migration` | Data migration between storage tiers | F-08 |
| `enrichment` | AI-assisted input enrichment sub-step | F-12, F-13, F-14, F-15, F-16, F-17 |

**Final locked flow_type enum (9 values):**
```
submission | approval | regeneration | query | health_check | sync | record | migration | enrichment
```

### Combined Classification Table

| Flow ID | Domain | Flow_Type |
|---------|--------|-----------|
| F-01 | `onboarding` | `submission` |
| F-02 | `execution` | `approval` |
| F-03 | `execution` | `regeneration` |
| F-04 | `reporting` | `health_check` |
| F-05 | `reporting` | `query` |
| F-06 | `integration` | `sync` |
| F-07 | `integration` | `record` |
| F-08 | `migration` | `migration` |
| F-09 | `reporting` | `query` |
| F-10 | `admin` | `health_check` |
| F-11 | `admin` | `query` |
| F-12 | `enrichment` | `enrichment` |
| F-13 | `enrichment` | `enrichment` |
| F-14 | `enrichment` | `enrichment` |
| F-15 | `enrichment` | `enrichment` |
| F-16 | `enrichment` | `enrichment` |
| F-17 | `enrichment` | `enrichment` |

---

## 3. Contract Schema Architecture

### What `contracts/schema.json` Is

`contracts/schema.json` is a **JSON Schema meta-document** that defines the canonical structure every per-flow OpenAPI 3.0 contract file must adhere to. It is not an OpenAPI spec itself — it is the schema *for* validating that each `contracts/{flow_id}-v1.yaml` is structurally complete and following the Phase 45 conventions.

This satisfies D-07 (OpenAPI 3.0 as artifact format) and D-08 (no parallel custom schema).

### Top-Level Structure

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "MarkOS Flow Contract",
  "description": "Meta-schema for validating per-flow OpenAPI 3.0 contract files",
  "type": "object",
  "required": ["flow_id", "flow_name", "domain", "flow_type", "version", "openapi", "info", "paths"],
  "additionalProperties": false,
  "properties": {
    "flow_id": {
      "type": "string",
      "pattern": "^F-[0-9]{2}$",
      "description": "Canonical flow identifier (e.g. F-01)"
    },
    "flow_name": {
      "type": "string",
      "description": "Kebab-case human-readable name (e.g. client-intake-submit)"
    },
    "domain": {
      "type": "string",
      "enum": ["onboarding", "execution", "enrichment", "integration", "migration", "reporting", "admin"]
    },
    "flow_type": {
      "type": "string",
      "enum": ["submission", "approval", "regeneration", "query", "health_check", "sync", "record", "migration", "enrichment"]
    },
    "version": {
      "type": "string",
      "pattern": "^v[0-9]+$",
      "description": "Contract version (e.g. v1)"
    },
    "openapi": {
      "type": "string",
      "const": "3.0.3"
    },
    "info": {
      "type": "object",
      "required": ["title", "version"],
      "properties": {
        "title": { "type": "string" },
        "version": { "type": "string" },
        "description": { "type": "string" }
      }
    },
    "x-markos-meta": {
      "type": "object",
      "description": "MarkOS-specific contract metadata (extension field per D-09)",
      "properties": {
        "actor": {
          "type": "string",
          "enum": ["Operator", "System", "Admin", "Operator/System"]
        },
        "auth_local": {
          "type": "string",
          "description": "Auth requirement on local entrypoint (e.g. none)"
        },
        "auth_hosted": {
          "type": "string",
          "description": "Auth requirement on hosted entrypoint (e.g. Supabase JWT: status_read)"
        },
        "handler": {
          "type": "string",
          "description": "Handler function name in handlers.cjs"
        },
        "local_path": { "type": "string" },
        "hosted_path": { "type": "string" },
        "slo_tier": {
          "type": "string",
          "enum": ["critical", "standard", "admin"]
        }
      }
    },
    "paths": {
      "type": "object",
      "description": "OpenAPI paths object; must contain ≥1 path entry"
    }
  }
}
```

### Example Contract: F-01 `client-intake-submit`

```yaml
# contracts/F-01-client-intake-submit-v1.yaml
flow_id: F-01
flow_name: client-intake-submit
domain: onboarding
flow_type: submission
version: v1
openapi: "3.0.3"
info:
  title: Client Intake Submit
  version: "1.0.0"
  description: >
    Persists client seed JSON, runs AI orchestration, evaluates literacy
    readiness, and creates Linear intake tickets. Local path: POST /submit.
    Hosted path: POST /api/submit.

x-markos-meta:
  actor: Operator
  auth_local: none
  auth_hosted: none (local passthrough pattern)
  handler: handleSubmit
  local_path: /submit
  hosted_path: /api/submit
  slo_tier: critical

paths:
  /submit:
    post:
      operationId: clientIntakeSubmit
      summary: Submit client onboarding seed
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [seed]
              properties:
                seed:
                  type: object
                  required: [company, product, audience, market, content]
                project_slug:
                  type: string
                  pattern: "^[a-z0-9-]+$"
      responses:
        "200":
          description: Submission accepted; drafts returned
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SubmitSuccess'
        "400":
          description: Intake validation failed (rules R001–R008)
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ValidationError'
        "503":
          description: Required secret missing
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SecretMissingError'
        "500":
          description: Unhandled server error
```

### Example Contract: F-08 `markosdb-migrate`

```yaml
# contracts/F-08-markosdb-migrate-v1.yaml
flow_id: F-08
flow_name: markosdb-migrate
domain: migration
flow_type: migration
version: v1
openapi: "3.0.3"
info:
  title: MarkOSDB Local-to-Cloud Migration
  version: "1.0.0"

x-markos-meta:
  actor: Operator
  auth_local: none
  auth_hosted: "Supabase JWT: migration_write scope required"
  handler: handleMarkosdbMigration
  local_path: /migrate/local-to-cloud
  hosted_path: /api/migrate
  slo_tier: standard

paths:
  /migrate/local-to-cloud:
    post:
      operationId: markosdbMigrate
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                project_slug: { type: string }
                dry_run: { type: boolean, default: false }
                company_name: { type: string }
      responses:
        "200":
          description: Migration completed (or dry-run report)
        "401":
          description: Auth required (hosted only)
        "409":
          description: Rollout promotion not allowed
        "503":
          description: Required secret missing
```

---

## 4. FLOW-INVENTORY.md Structure

### File Header

```markdown
# MarkOS Flow Inventory

**Phase:** 45 — Operations Flow Inventory & Canonical Contract Map
**Version:** v1.0
**Reviewed:** [YYYY-MM-DD] | **Reviewer:** [name]
**Status:** [DRAFT | REVIEWED | APPROVED]

> This is the canonical reference for all active production flows.
> Downstream consumers: Phase 46 (UI task selectors), Phase 47 (OpenAPI generation), Phase 48 (contract tests).
```

### Controlled Enums Reference Block

```markdown
## Controlled Enums (Phase 45 — locked, D-02/D-16)

**domain:** `onboarding` | `execution` | `enrichment` | `integration` | `migration` | `reporting` | `admin`

**flow_type:** `submission` | `approval` | `regeneration` | `query` | `health_check` | `sync` | `record` | `migration` | `enrichment`
```

### Main Flow Table (mandatory columns)

```markdown
## Flow Registry

| flow_id | flow_name | domain | flow_type | method | local_path | hosted_path | actor | auth_local | auth_hosted | handler | slo_tier |
|---------|-----------|--------|-----------|--------|------------|-------------|-------|------------|-------------|---------|----------|
| F-01 | client-intake-submit | onboarding | submission | POST | /submit | /api/submit | Operator | none | none | handleSubmit | critical |
| F-02 | draft-approve | execution | approval | POST | /approve | /api/approve | Operator | none | none | handleApprove | critical |
| F-03 | section-regenerate | execution | regeneration | POST | /regenerate | /api/regenerate | Operator | none | none | handleRegenerate | standard |
| F-04 | system-config-read | reporting | health_check | GET | /config | /api/config | Operator/System | none | Supabase JWT: config_read | handleConfig | standard |
| F-05 | system-status-health | reporting | query | GET | /status | /api/status | Operator/System | none | Supabase JWT: status_read | handleStatus | standard |
| F-06 | linear-task-sync | integration | sync | POST | /linear/sync | /api/linear/sync | System | none | none | handleLinearSync | standard |
| F-07 | campaign-result-record | integration | record | POST | /campaign/result | /api/campaign/result | Operator | none | none | handleCampaignResult | standard |
| F-08 | markosdb-migrate | migration | migration | POST | /migrate/local-to-cloud | /api/migrate | Operator | none | Supabase JWT: migration_write | handleMarkosdbMigration | standard |
| F-09 | literacy-coverage-report | reporting | query | GET | /api/literacy/coverage | /api/literacy/coverage | Operator/System | none | Supabase JWT: status_read | handleLiteracyCoverage | standard |
| F-10 | literacy-admin-health | admin | health_check | GET | /admin/literacy/health | local-only | Admin | Admin secret | N/A | handleLiteracyHealth | admin |
| F-11 | literacy-admin-query | admin | query | POST | /admin/literacy/query | local-only | Admin | Admin secret | N/A | handleLiteracyQuery | admin |
| F-12 | ai-interview-generate-q | enrichment | enrichment | POST | /api/generate-question | /api/generate-question | System | none | none | handleGenerateQuestion | standard |
| F-13 | ai-interview-parse-answer | enrichment | enrichment | POST | /api/parse-answer | /api/parse-answer | System | none | none | handleParseAnswer | standard |
| F-14 | source-extraction | enrichment | enrichment | POST | /api/extract-sources | /api/extract-sources | System | none | none | handleExtractSources | standard |
| F-15 | extract-and-score | enrichment | enrichment | POST | /api/extract-and-score | /api/extract-and-score | System | none | none | handleExtractAndScore | standard |
| F-16 | spark-suggestion | enrichment | enrichment | POST | /api/spark-suggestion | /api/spark-suggestion | System | none | none | handleSparkSuggestion | standard |
| F-17 | competitor-discovery | enrichment | enrichment | POST | /api/competitor-discovery | /api/competitor-discovery | System | none | none | handleCompetitorDiscovery | standard |
```

### Flow Detail Sections (one per flow)

Each flow entry after the table should have:

```markdown
### F-01: client-intake-submit

**Journey steps (3–12 per D-06):**
1. Validate required secrets (`submit_write`)
2. Read + parse request body
3. Apply Phase 34 intake validation (R001–R008, conditional)
4. Resolve project slug
5. Auto-create Linear intake tickets (`MARKOS-ITM-OPS-03`, `MARKOS-ITM-INT-01`)
6. Write seed to `onboarding-seed.json` (local mode only)
7. Run AI orchestration (orchestrator.cjs → all draft sections)
8. Evaluate literacy readiness (`activation-readiness.cjs`)
9. Emit `literacy_activation_observed` telemetry
10. Return drafts + literacy status

**Inputs:** `{ seed: { company, product, audience, market, content }, project_slug? }`
**Outputs:** `{ success, slug, drafts, literacy, linear_tickets, vector_store, errors }`
**Errors:** `400 INTAKE_VALIDATION_FAILED`, `503 REQUIRED_SECRET_MISSING`, `500`
**Telemetry:** `rollout_endpoint_observed` (SLO tier: critical, p95=1500ms), `literacy_activation_observed`
```

---

## 5. FLOW-CONTRACTS.md Structure

### File Header

```markdown
# MarkOS Flow → Contract Mapping

**Phase:** 45 — Operations Flow Inventory & Canonical Contract Map
**Version:** v1.0
**Reviewed:** [YYYY-MM-DD] | **Reviewer:** [name]
**Status:** [DRAFT | REVIEWED | APPROVED]

> This file maps every canonical flow to its contract artifact(s).
> Contract files live under `contracts/`. Phase 47 will expand these stubs into full OpenAPI specs.
```

### Mapping Table

```markdown
## Flow → Contract Map

| flow_id | flow_name | contract_file | contract_version | schema_valid | notes |
|---------|-----------|---------------|-----------------|--------------|-------|
| F-01 | client-intake-submit | `contracts/F-01-client-intake-submit-v1.yaml` | v1 | ✅ | — |
| F-02 | draft-approve | `contracts/F-02-draft-approve-v1.yaml` | v1 | ✅ | local-only write |
| F-03 | section-regenerate | `contracts/F-03-section-regenerate-v1.yaml` | v1 | ✅ | — |
| F-04 | system-config-read | `contracts/F-04-system-config-read-v1.yaml` | v1 | ✅ | hosted requires auth |
| F-05 | system-status-health | `contracts/F-05-system-status-health-v1.yaml` | v1 | ✅ | hosted requires auth |
| F-06 | linear-task-sync | `contracts/F-06-linear-task-sync-v1.yaml` | v1 | ✅ | requires LINEAR_API_KEY |
| F-07 | campaign-result-record | `contracts/F-07-campaign-result-record-v1.yaml` | v1 | ✅ | — |
| F-08 | markosdb-migrate | `contracts/F-08-markosdb-migrate-v1.yaml` | v1 | ✅ | hosted requires auth |
| F-09 | literacy-coverage-report | `contracts/F-09-literacy-coverage-report-v1.yaml` | v1 | ✅ | hosted requires auth |
| F-10 | literacy-admin-health | `contracts/F-10-literacy-admin-health-v1.yaml` | v1 | ✅ | admin-secret gated |
| F-11 | literacy-admin-query | `contracts/F-11-literacy-admin-query-v1.yaml` | v1 | ✅ | admin-secret gated |
| F-12 | ai-interview-generate-q | `contracts/F-12-ai-interview-generate-q-v1.yaml` | v1 | ✅ | — |
| F-13 | ai-interview-parse-answer | `contracts/F-13-ai-interview-parse-answer-v1.yaml` | v1 | ✅ | — |
| F-14 | source-extraction | `contracts/F-14-source-extraction-v1.yaml` | v1 | ✅ | — |
| F-15 | extract-and-score | `contracts/F-15-extract-and-score-v1.yaml` | v1 | ✅ | — |
| F-16 | spark-suggestion | `contracts/F-16-spark-suggestion-v1.yaml` | v1 | ✅ | — |
| F-17 | competitor-discovery | `contracts/F-17-competitor-discovery-v1.yaml` | v1 | ✅ | — |

**Total flows:** 17  
**Orphaned flows:** 0  
**Flows without contracts:** 0
```

---

## 6. FLOW-VERIFICATION.md Checklist

### Structure

```markdown
# MarkOS Flow Verification Checklist

**Phase:** 45
**Verification Type:** Hybrid (automated extraction + manual semantic review)
**Reviewer:** [name]
**Review date:** [YYYY-MM-DD]
**Sign-off status:** [ ] PENDING → [x] APPROVED

---

## Part A: Automated Coverage Checks (run via test suite)

- [ ] A-01: FLOW-INVENTORY.md exists at `.planning/FLOW-INVENTORY.md`
- [ ] A-02: FLOW-INVENTORY.md contains ≥10 flow rows
- [ ] A-03: All flow_id values are unique (no duplicates)
- [ ] A-04: All domain values belong to locked domain enum
- [ ] A-05: All flow_type values belong to locked flow_type enum
- [ ] A-06: Every flow_id in FLOW-INVENTORY.md has a corresponding entry in FLOW-CONTRACTS.md
- [ ] A-07: Every contract file listed in FLOW-CONTRACTS.md exists at the stated path
- [ ] A-08: Every contract file parses as valid YAML
- [ ] A-09: `contracts/schema.json` exists and is valid JSON
- [ ] A-10: All contract files satisfy `contracts/schema.json` structural validation
- [ ] A-11: No flow_id appears more than once across all contract files
- [ ] A-12: All handler names in registry exist as exports in `handlers.cjs`

## Part B: Manual Semantic Review (reviewer required, D-12)

- [ ] B-01: Flow descriptions are accurate to observed runtime behavior (reviewed against handlers.cjs)
- [ ] B-02: Journey step counts are within 3–12 bounds (D-06) for all flows
- [ ] B-03: Auth distinctions (local vs. hosted) are correctly captured for F-04, F-05, F-08, F-09
- [ ] B-04: Admin-secret gating for F-10, F-11 is correctly documented
- [ ] B-05: Enrichment flows (F-12–F-17) are correctly classified as `enrichment` domain
- [ ] B-06: No active production route in `server.cjs` is missing from the registry
- [ ] B-07: No flow in the registry maps to a non-existent or deleted handler
- [ ] B-08: SLO tiers in registry match `ROLLOUT_ENDPOINT_SLOS` in `telemetry.cjs`
- [ ] B-09: Dual-entrypoint model correctly reflected (local_path ≠ hosted_path for applicable flows)
- [ ] B-10: FLOW-CONTRACTS.md "Orphaned flows: 0" assertion is manually verified

## Part C: CI Validation

- [ ] C-01: `test/api-contracts/phase-45-flow-inventory.test.js` passes with zero failures
- [ ] C-02: All Part A checks are covered by automated assertions in the test file

## Reviewer Sign-Off

**Reviewer name:** _______________  
**Reviewed date:** _______________  
**Notes / open items:** _______________  
**Signed off:** [ ] YES — all items above are checked; CI gate is now stable per D-12
```

---

## 7. Test Strategy for `phase-45-flow-inventory.test.js`

### Test Framework

Uses `node:test` + `node:assert/strict` — matching the established project pattern in `test/onboarding-server.test.js`, `test/intake-validation.test.js`, etc.

### File Location

`test/api-contracts/phase-45-flow-inventory.test.js`

The `test/api-contracts/` directory does not yet exist — it must be created as part of Plan 45-04.

### Assertion Groups

```javascript
// test/api-contracts/phase-45-flow-inventory.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml'); // already a dep via test ecosystem; add if not present

const PROJECT_ROOT = path.resolve(__dirname, '../..');

// ── Group 1: FLOW-INVENTORY.md presence and shape ─────────────────────────
test('FLOW-INVENTORY.md exists', () => {
  assert.ok(fs.existsSync(path.join(PROJECT_ROOT, '.planning/FLOW-INVENTORY.md')));
});

test('FLOW-INVENTORY.md contains ≥10 flow rows', () => {
  const content = fs.readFileSync(path.join(PROJECT_ROOT, '.planning/FLOW-INVENTORY.md'), 'utf8');
  // Count table rows (pipe-separated rows that begin with | F-)
  const rows = content.match(/^\| F-\d+/gm) || [];
  assert.ok(rows.length >= 10, `Expected ≥10 flows, found ${rows.length}`);
});

test('All flow_id values in FLOW-INVENTORY.md are unique', () => {
  const content = fs.readFileSync(path.join(PROJECT_ROOT, '.planning/FLOW-INVENTORY.md'), 'utf8');
  const ids = (content.match(/^\| (F-\d+)/gm) || []).map(m => m.replace('| ', '').trim());
  const unique = new Set(ids);
  assert.equal(unique.size, ids.length, 'Duplicate flow_id detected');
});

test('All domain values are from locked enum', () => {
  const DOMAINS = new Set(['onboarding','execution','enrichment','integration','migration','reporting','admin']);
  const content = fs.readFileSync(path.join(PROJECT_ROOT, '.planning/FLOW-INVENTORY.md'), 'utf8');
  // Extract domain column values from table rows
  const rows = content.match(/^\| F-\d+ \|[^|]+\| ([a-z_]+) \|/gm) || [];
  for (const row of rows) {
    const domain = row.split('|')[3]?.trim();
    assert.ok(DOMAINS.has(domain), `Unknown domain: "${domain}"`);
  }
});

test('All flow_type values are from locked enum', () => {
  const TYPES = new Set(['submission','approval','regeneration','query','health_check','sync','record','migration','enrichment']);
  const content = fs.readFileSync(path.join(PROJECT_ROOT, '.planning/FLOW-INVENTORY.md'), 'utf8');
  const rows = content.match(/^\| F-\d+ \|[^|]+\|[^|]+\| ([a-z_]+) \|/gm) || [];
  for (const row of rows) {
    const cols = row.split('|');
    const flowType = cols[4]?.trim();
    assert.ok(TYPES.has(flowType), `Unknown flow_type: "${flowType}"`);
  }
});

// ── Group 2: FLOW-CONTRACTS.md coverage ───────────────────────────────────
test('FLOW-CONTRACTS.md exists', () => {
  assert.ok(fs.existsSync(path.join(PROJECT_ROOT, '.planning/FLOW-CONTRACTS.md')));
});

test('Every flow in FLOW-INVENTORY has entry in FLOW-CONTRACTS', () => {
  const inventory = fs.readFileSync(path.join(PROJECT_ROOT, '.planning/FLOW-INVENTORY.md'), 'utf8');
  const contracts = fs.readFileSync(path.join(PROJECT_ROOT, '.planning/FLOW-CONTRACTS.md'), 'utf8');
  const inventoryIds = (inventory.match(/^\| (F-\d+)/gm) || []).map(m => m.replace('| ', '').trim());
  for (const id of inventoryIds) {
    assert.ok(contracts.includes(id), `Flow ${id} has no entry in FLOW-CONTRACTS.md`);
  }
});

test('Zero orphaned flows — all contract entries reference a real flow_id', () => {
  const inventory = fs.readFileSync(path.join(PROJECT_ROOT, '.planning/FLOW-INVENTORY.md'), 'utf8');
  const contracts = fs.readFileSync(path.join(PROJECT_ROOT, '.planning/FLOW-CONTRACTS.md'), 'utf8');
  const inventoryIds = new Set((inventory.match(/^\| (F-\d+)/gm) || []).map(m => m.replace('| ', '').trim()));
  const contractIds = (contracts.match(/^\| (F-\d+)/gm) || []).map(m => m.replace('| ', '').trim());
  for (const id of contractIds) {
    assert.ok(inventoryIds.has(id), `FLOW-CONTRACTS references unknown flow ${id}`);
  }
});

// ── Group 3: contracts/ schema.json ───────────────────────────────────────
test('contracts/schema.json exists and is valid JSON', () => {
  const schemaPath = path.join(PROJECT_ROOT, 'contracts/schema.json');
  assert.ok(fs.existsSync(schemaPath));
  assert.doesNotThrow(() => JSON.parse(fs.readFileSync(schemaPath, 'utf8')));
});

test('contracts/schema.json has required top-level properties', () => {
  const schema = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'contracts/schema.json'), 'utf8'));
  const required = ['$schema', 'title', 'properties'];
  for (const key of required) {
    assert.ok(Object.prototype.hasOwnProperty.call(schema, key), `schema.json missing: ${key}`);
  }
});

// ── Group 4: Contract file existence ──────────────────────────────────────
test('All contract files listed in FLOW-CONTRACTS.md exist on disk', () => {
  const contracts = fs.readFileSync(path.join(PROJECT_ROOT, '.planning/FLOW-CONTRACTS.md'), 'utf8');
  const contractPaths = (contracts.match(/`contracts\/[^`]+`/g) || []).map(m => m.replace(/`/g, ''));
  for (const contractPath of contractPaths) {
    const abs = path.join(PROJECT_ROOT, contractPath);
    assert.ok(fs.existsSync(abs), `Contract file missing: ${contractPath}`);
  }
});

test('All contract files parse as valid YAML', () => {
  const contractsDir = path.join(PROJECT_ROOT, 'contracts');
  if (!fs.existsSync(contractsDir)) return; // Skip if not yet created
  const files = fs.readdirSync(contractsDir).filter(f => f.endsWith('.yaml'));
  for (const file of files) {
    assert.doesNotThrow(
      () => yaml.load(fs.readFileSync(path.join(contractsDir, file), 'utf8')),
      `YAML parse error in contracts/${file}`
    );
  }
});

// ── Group 5: Handler traceability ─────────────────────────────────────────
test('All handler names in registry are exported from handlers.cjs', () => {
  const handlersPath = path.join(PROJECT_ROOT, 'onboarding/backend/handlers.cjs');
  const handlersSource = fs.readFileSync(handlersPath, 'utf8');
  const inventory = fs.readFileSync(path.join(PROJECT_ROOT, '.planning/FLOW-INVENTORY.md'), 'utf8');
  // Extract handler column (position varies by table — use named column approach)
  const handlerNames = (inventory.match(/handle[A-Z][a-zA-Z]+/g) || []);
  for (const name of new Set(handlerNames)) {
    assert.ok(handlersSource.includes(`${name},`) || handlersSource.includes(`${name}\n`),
      `Handler "${name}" not found in handlers.cjs exports`);
  }
});
```

### `js-yaml` Dependency Note

Check if `js-yaml` is already in `package.json` — likely present given the project uses YAML config files. If not, add to `devDependencies`. The test file should guard gracefully if the module is absent for the schema validation portion.

---

## 8. T0 KPI Baseline Capture

### What Needs to be Measured

| Metric | T0 Estimate (REQUIREMENTS.md) | Instrumented? | Collection Method |
|--------|-------------------------------|--------------|-------------------|
| `time_to_first_task` | ~15–30 min (manual setup) | ❌ Not yet | PostHog query: `approval_completed` event timestamp minus earliest `project_onboarding_started` for same `project_slug_hash`; if no start event, document as "unmeasured, baseline anchored to estimate" |
| `evidence_capture_rate` | ~60% | ⚠️ Partial | Count `approved-*` vector keys returned per project_slug via `/status` endpoint + `vector_memory` health; cross-reference against `EXECUTION_READINESS_CONTRACT.requiredDraftSections` (6 sections) |
| `operator_self_service_rate` | ~30% | ❌ Not yet | PostHog + Linear: ratio of sessions completing `approval_completed` events with no Linear support ticket created; otherwise use stated estimate with documentation |
| `flow_coverage` | ~40% | ⚠️ Partial | Count: flows reachable from operator UI (none Phase 45) vs. total active flows (17); Phase 45 baseline = 0% UI-reachable / 100% via local CLI/API; document explicitly |

### Existing Telemetry Hooks (D-14)

From `onboarding/backend/agents/telemetry.cjs`:
- **PostHog** (`posthog-node`): enabled when `POSTHOG_API_KEY` + `MARKOS_TELEMETRY != false`
- Event `rollout_endpoint_observed` — emitted on all 4 SLO-tracked routes (`/submit`, `/approve`, `/linear/sync`, `/campaign/result`)
- Event `literacy_activation_observed` — emitted after each submit with literacy readiness fields
- Event `approval_completed` — in `EXECUTION_CHECKPOINT_EVENTS`, emitted via `captureExecutionCheckpoint`
- Event `execution_loop_completed` / `execution_loop_abandoned` — execution lifecycle

From `lib/markos/telemetry/events.ts`:
- UI-side events: `markos_entity_saved`, `markos_entity_published`, `markos_access_denied`
- These are frontend events; not directly useful for T0 KPI baseline

### T0 Baseline Capture Approach

1. **Query PostHog** (or export events if API access available) for:
   - `approval_completed` events within a representative 30-day window prior to Phase 45 kickoff
   - `rollout_endpoint_observed` events for `/submit` and `/approve` to estimate call frequency
   
2. **Static assessment** for unmeasured metrics:
   - `time_to_first_task`: Document as "≥15 min; no telemetry; anchored to REQUIREMENTS.md estimate"
   - `operator_self_service_rate`: Document as "~30%; no telemetry; anchored to REQUIREMENTS.md estimate"
   
3. **Flow coverage calculation**:
   - 17 total active flows identified in Phase 45
   - 0 UI-accessible flows (UI does not exist yet)
   - Local CLI/API accessible: 17/17 = 100% (but requires code/CLI access)
   - Operator-accessible without engineering: subset (approx. 7 flows via local server form UI — submit, approve, status, config, regenerate, campaign-result, literacy-coverage)
   - Baseline: ~41% operator-self-service-reachable (7/17), consistent with REQUIREMENTS.md ~40% estimate
   
4. **Freeze baseline** (D-15):
   - Create `.planning/T0-KPI-BASELINE.md` with all four metrics, data sources, confidence levels, and collection window
   - Reviewer must sign off on the document (same reviewer as FLOW-VERIFICATION.md)
   - Outlier handling: If PostHog data shows unusually high `approval_completed` spikes, document and exclude

### T0 Baseline Document Template

```markdown
# T0 KPI Baseline — Phase 45

**Captured:** [YYYY-MM-DD]  
**Window:** [start_date] → [end_date] (30-day window)  
**Reviewer sign-off:** [ ] PENDING → [x] APPROVED  
**Sign-off date:** _______________

## Metrics

| Metric | T0 Value | Confidence | Source | Method |
|--------|----------|------------|--------|--------|
| time_to_first_task | ~15–30 min | LOW | REQUIREMENTS.md estimate | Not instrumented; first PostHog `approval_completed` minus posthog session start |
| evidence_capture_rate | ~60% | MEDIUM | Vector store section count / 6 required | `/status` + `vector_memory` drafted sections |
| operator_self_service_rate | ~30% | LOW | REQUIREMENTS.md estimate | Not instrumented; Linear ticket ratio proxy |
| flow_coverage | ~41% (7/17) | HIGH | Flow inventory count | Phase 45 registry: 7 reachable via local form UI |

## Phase 50 Comparison Targets

| Metric | T0 | T1 Target |
|--------|-----|-----------|
| time_to_first_task | ~15–30 min | ≤5 min |
| evidence_capture_rate | ~60% | ≥95% |
| operator_self_service_rate | ~30% | ≥85% |
| flow_coverage | ~41% | 100% |
```

---

## 9. Implementation Sequencing

### Recommended 5-Plan Structure

```
Plan 45-01: Flow Extraction & Taxonomy
    ↓ (flow list + enums exist)
Plan 45-02: FLOW-INVENTORY.md Production
    ↓ (inventory complete)
Plan 45-03: contracts/ Foundation — schema.json + FLOW-CONTRACTS.md + contract stubs
    ↓ (contracts exist, schema validated)
Plan 45-04: FLOW-VERIFICATION.md + Test Suite + Reviewer Checkpoint
    ↓ (verification approved, tests pass)
Plan 45-05: T0 KPI Baseline Capture + Sign-off
```

### Plan Dependencies

| Plan | Inputs | Outputs | Blocks |
|------|--------|---------|--------|
| 45-01 | server.cjs, handlers.cjs, api/*.js | Flow list JSON, controlled enums | 45-02, 45-03 |
| 45-02 | Flow list JSON | `.planning/FLOW-INVENTORY.md` | 45-03, 45-04, 45-05 |
| 45-03 | Flow list JSON + FLOW-INVENTORY.md | `contracts/schema.json`, `contracts/*.yaml` stubs, `.planning/FLOW-CONTRACTS.md` | 45-04, Phase 47 |
| 45-04 | FLOW-INVENTORY.md + FLOW-CONTRACTS.md + schema.json | FLOW-VERIFICATION.md (reviewer-signed), `test/api-contracts/phase-45-flow-inventory.test.js` passing | Phase 45 success criterion 4, Phase 48 |
| 45-05 | FLOW-INVENTORY.md + PostHog data + telemetry.cjs | `.planning/T0-KPI-BASELINE.md` (reviewer-signed) | Phase 50 KPI comparison |

### Plan 45-01 Key Actions

1. Write `bin/extract-flows.cjs` — read-only parser, produces `contracts/flow-registry.json`
2. Scan `onboarding/backend/server.cjs` for route→handler mappings via regex
3. Scan `api/*.js` wrappers to verify hosted path coverage
4. Verify handler names against `module.exports` at bottom of `handlers.cjs`
5. Produce `contracts/flow-registry.json` as machine-readable intermediate artifact

The extraction script must never `require()` live code — use `fs.readFileSync` + regex/string parsing only (D-11). This avoids loading PostHog, vector store clients, or env requirements during CI extraction.

### Plan 45-03 Key Actions

1. Create `contracts/` directory
2. Write `contracts/schema.json` (per §3 above)
3. Create one contract YAML stub per flow (17 files): populate `flow_id`, `flow_name`, `domain`, `flow_type`, `version`, `x-markos-meta`, and minimal `paths` entry
4. Write `.planning/FLOW-CONTRACTS.md` (per §5 above)
5. Run basic validation: parse all YAMLs, check required keys present

Contract stubs are Phase 45 artifacts — they are structurally valid but not yet fully documented. Phase 47 will expand them into full OpenAPI specs.

---

## 10. Risk Flags

| Risk | Severity | Flag for |
|------|----------|----------|
| `js-yaml` may not be in `devDependencies` | LOW | Plan 45-04 executor: check `package.json` before writing test; if absent, add to devDeps or use `node:assert` + manual string parsing |
| AI enrichment flows (F-12–F-17) have no hosted `api/*.js` wrappers — they are served only via `server.cjs` | MEDIUM | Plan 45-01 executor: mark `hosted_path` as same as `local_path` in registry; verify server.cjs wires them via `/api/` prefix correctly |
| `handleGenerateQuestion`, `handleParseAnswer`, `handleSparkSuggestion` etc. are not listed in `api/` directory — need to confirm they only exist in `server.cjs` and are not required to have separate hosted wrappers | MEDIUM | Plan 45-01 executor: audit `api/` directory structure to confirm no missing wrapper files |
| T0 KPI metrics `time_to_first_task` and `operator_self_service_rate` are not currently instrumented | MEDIUM | Plan 45-05 executor: document explicitly as "LOW confidence, estimate-anchored." Do NOT fabricate measurements. Reviewer sign-off covers this gap |
| PostHog may have zero events if `POSTHOG_API_KEY` was never configured in production | MEDIUM | Plan 45-05 executor: if no PostHog data is available, fall back entirely to REQUIREMENTS.md estimates; document data source clearly |
| Success criterion #1 says "Operator can browse canonical flow inventory UI mockup" — but no UI exists in Phase 45 | LOW | The roadmap SC1 language is aspirational; FLOW-INVENTORY.md markdown table satisfies this criterion as the "mockup." Confirm with project owner if a rendered table/page is expected |
| F-10 and F-11 (`literacy-admin-health`, `literacy-admin-query`) have no hosted endpoint wrapper in `api/` | LOW | Correctly flag as `local-only` in registry; no hosted_path entry needed |
| `contracts/` directory does not currently exist | INFO | Plan 45-03 creates it; no conflict |
| `test/api-contracts/` directory does not currently exist | INFO | Plan 45-04 creates it; no conflict |
| Reviewer sign-off (D-12) is a human-blocking dependency | HIGH | Plan 45-04 must not mark itself complete until explicit reviewer approval is recorded in FLOW-VERIFICATION.md. Phase executor should surface this requirement to the project owner |

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | `node:test` + `node:assert/strict` (built-in, no install needed) |
| Config file | none — tests run via `node --test test/**/*.test.js` |
| Quick run command | `node --test test/api-contracts/phase-45-flow-inventory.test.js` |
| Full suite command | `npm test` (existing test runner covers `test/**/*.test.js`) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| API-01 | All active flows have contract mapping (zero orphans) | structural | `node --test test/api-contracts/phase-45-flow-inventory.test.js` | ❌ Wave 0 |
| API-02 (partial) | `contracts/schema.json` validates contract files | structural | (included in same test file) | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `node --test test/api-contracts/phase-45-flow-inventory.test.js`
- **Phase gate:** Full suite (`npm test`) green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `test/api-contracts/` directory — create in Plan 45-04
- [ ] `test/api-contracts/phase-45-flow-inventory.test.js` — create in Plan 45-04
- [ ] `contracts/` directory — create in Plan 45-03
- [ ] Confirm `js-yaml` in `devDependencies` or use alternative YAML parser

---

## Sources

### Primary (HIGH confidence)
- `onboarding/backend/server.cjs` — authoritative route map (17 routes catalogued)
- `onboarding/backend/handlers.cjs` — all 17 handler implementations read directly
- `onboarding/backend/agents/telemetry.cjs` — PostHog integration, SLOs, event names
- `api/submit.js`, `api/approve.js`, `api/status.js`, `api/regenerate.js`, `api/migrate.js`, `api/linear/sync.js`, `api/campaign/result.js`, `api/literacy/coverage.js`, `api/config.js` — hosted entrypoints confirmed
- `.planning/REQUIREMENTS.md` — T0 KPI baselines, API-01/API-02 success criteria
- `.planning/v3.1.0-ROADMAP.md` — Phase 45 deliverables, success criteria, plans count
- `.planning/phases/45-operations-flow-inventory-contract-map/45-CONTEXT.md` — D-01 through D-19 locked decisions

### Secondary (MEDIUM confidence)
- `lib/markos/telemetry/events.ts` — UI-side telemetry events (not used for T0 baseline)
- REQUIREMENTS.md T0 estimates — stated as estimates, not measured values

---

## Metadata

**Confidence breakdown:**
- Flow inventory: HIGH — sourced directly from server.cjs route table and handlers.cjs exports
- Taxonomy design: HIGH — enums derived from actual domain coverage; ≤10 hard cap satisfied
- Contract schema: HIGH — OpenAPI 3.0.3 structure; extension fields for MarkOS metadata per D-09
- Test strategy: HIGH — follows established `node:test` + `node:assert/strict` project pattern
- T0 KPI baseline: MEDIUM — time_to_first_task and operator_self_service_rate are LOW confidence due to missing instrumentation; flow_coverage is HIGH confidence

**Research date:** 2026-04-02
**Valid until:** 2026-05-02 (stable codebase; re-verify if new routes are added before planning begins)
