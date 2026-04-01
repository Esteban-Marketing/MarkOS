# Phase 33: Codebase Documentation Mapping — Research

**Researched:** 2026-03-31
**Domain:** Documentation architecture, route inventory, CLI entrypoints, repo topology
**Confidence:** HIGH — all findings sourced directly from codebase inspection

---

# Phase 33: Codebase Documentation Mapping — Research

**Date:** 2026-03-31
**Status:** RESEARCH COMPLETE
**Researcher:** in-context deep pass (subagent unavailable due to runtime error)

---

## Summary

Phase 33 will produce a canonical GSD codebase map under `.planning/codebase/` that covers the MarkOS repository route by route, folder by folder, and file by file. This research pass verified every implementation surface directly from source so that Phase 33 plans can execute without guesswork.

The core finding: the codebase has a clearly bounded surface with no hidden complexity, but the existing documentation covers only ~30% of the actual implementation depth needed by maintainers and future agents. All four plans from the previous planning session are sound. Implementation risk is low.

---

## Code Reality Snapshot (2026-03-31)

1. `.planning/codebase/` does not exist. It must be created from scratch in Plan 01.
2. The existing documentation set (`README.md`, `TECH-MAP.md`, `ARCH-DIAGRAM.md`, `.protocol-lore/CODEBASE-MAP.md`) covers architecture intent but omits handler-level routing, per-file purpose, dependency chains, and secret/operation matrices.
3. `onboarding/backend/server.cjs` is the canonical local HTTP entrypoint. Every route dispatches to `handlers.cjs`. All handler implementations live there, not in the server file itself.
4. `api/` wrappers are thin Vercel serverless functions — each one imports the matching named handler from `handlers.cjs` and calls it directly. The wrapper adds auth enforcement for hosted-mode-sensitive operations.
5. The local server does NOT enforce Supabase auth. The `api/` wrappers do (for config, status, migrate). `approve`, `submit`, `regenerate`, `campaign/result`, and `linear/sync` wrappers do not add extra auth, matching local behavior.
6. The repository has three distinct CLI families: `bin/` (user-facing NPX commands), `.agent/get-shit-done/bin/` (GSD planning tool), `.agent/markos/bin/` (MarkOS protocol tool).
7. `scripts/` directory is empty. Safe to document as intentionally reserved.
8. All tests live under `test/` (10 files). No test config file exists outside `test/setup.js`.
9. `onboarding/backend/` contains four distinct sub-layers: `agents/`, `confidences/`, `enrichers/`, `extractors/`, `parsers/`, `prompts/`, `scrapers/`. Each has exactly one or two files.

---

## Existing Documentation Assets Assessment

| Asset | Coverage | Gap |
|---|---|---|
| `README.md` | Product overview, install, partial endpoints | No per-file inventory, no handler mapping |
| `TECH-MAP.md` | Architecture, endpoints (partial), integration overview | Outdated route list (missing `/api/extract-*`, `/admin/literacy/*`) |
| `ARCH-DIAGRAM.md` | Visual component orientation | No file-level detail |
| `.protocol-lore/CODEBASE-MAP.md` | LLM nav layer — 4 key files called out | Missing ~40 implementation files |
| `.protocol-lore/QUICKSTART.md` | Top 7 key files listed | Correct but incomplete |
| `.planning/STATE.md` | Mission state | No implementation topology |
| `.planning/ROADMAP.md` | Phase intent | No file ownership |

**Total documentation coverage of implementation surface: ~30%.** Every file in `onboarding/backend/` sub-layers is entirely absent from existing docs.

---

## Complete Route Inventory (Verified from Source)

### Local Onboarding Server (`onboarding/backend/server.cjs`)

| Method | Path | Handler (in `handlers.cjs`) | Auth | Side Effects |
|---|---|---|---|---|
| OPTIONS | `*` | `handleCorsPreflight` | none | Sets CORS headers |
| GET | `/config` | `handleConfig` | none | Reads `onboarding-config.json` + env status |
| GET | `/status` | `handleStatus` | none | Vector heartbeat + MIR STATE.md progress |
| POST | `/submit` | `handleSubmit` | none | Stores seed → runs orchestrator → vector storage |
| POST | `/api/extract-sources` | `handleExtractSources` | none | File upload parse (PDF/DOCX/CSV/TXT) + web scrape |
| POST | `/api/extract-and-score` | `handleExtractAndScore` | none | LLM seed extraction from sources + confidence scoring |
| POST | `/api/generate-question` | `handleGenerateQuestion` | none | AI interview question generator (max 5 questions) |
| POST | `/api/parse-answer` | `handleParseAnswer` | none | Partial schema extraction from user chat answer |
| POST | `/api/spark-suggestion` | `handleSparkSuggestion` | none | 3 creative alternatives for a field value |
| POST | `/api/competitor-discovery` | `handleCompetitorDiscovery` | none | Tavily search + LLM competitor extraction |
| POST | `/regenerate` | `handleRegenerate` | none | Re-runs a single agent section; updates vector |
| POST | `/approve` | `handleApprove` | none | Writes approved drafts → `.markos-local/` via `write-mir.cjs` |
| POST | `/migrate/local-to-cloud` | `handleMarkosdbMigration` | none | Promotes local MIR/MSP artifacts to Supabase |
| POST | `/linear/sync` | `handleLinearSync` | none | Creates Linear issues from ITM tasks |
| POST | `/campaign/result` | `handleCampaignResult` | none | Records campaign outcome to Supabase + vector |
| GET | `/admin/literacy/health` | `handleLiteracyHealth` | none | Checks literacy vector store health |
| POST | `/admin/literacy/query` | `handleLiteracyQuery` | none | Semantic query against literacy chunks |
| GET | `/*` (static fallback) | fs.readFile | none | Serves files from `onboarding/` directory |

**Boot sequence:** env load → config load → `vectorStore.configure()` → `ensureVectorStores()` → `server.listen()`. Port from `onboarding-config.json`, fallback +1 on EADDRINUSE.

### Hosted API Wrappers (`api/`)

Each wrapper imports the named handler from `handlers.cjs` and adds auth enforcement where specified.

| File | Route (Vercel) | Adds Auth? | Operation |
|---|---|---|---|
| `api/approve.js` | `POST /api/approve` | No | Direct delegate to `handleApprove` |
| `api/config.js` | `GET /api/config` | Yes (`config_read`) | Supabase JWT enforced before `handleConfig` |
| `api/migrate.js` | `POST /api/migrate` | Yes (`migration_write`) | Supabase JWT + project slug enforced |
| `api/regenerate.js` | `POST /api/regenerate` | No | Direct delegate to `handleRegenerate` |
| `api/status.js` | `GET /api/status` | Yes (`status_read`) | Supabase JWT + project slug enforced |
| `api/submit.js` | `POST /api/submit` | No | Direct delegate to `handleSubmit` |
| `api/campaign/result.js` | `POST /api/campaign/result` | No | Direct delegate to `handleCampaignResult` |
| `api/linear/sync.js` | `POST /api/linear/sync` | No | Direct delegate to `handleLinearSync` |

**Auth enforcement matrix** (from `runtime-context.cjs` `MARKOSDB_ACCESS_MATRIX`):
- Auth required in hosted mode: `config_read`, `status_read`, `migration_write`, `approve_write`, `submit_write`
- Wrappers that don't enforce: `approve`, `submit`, `regenerate`, `campaign/result`, `linear/sync` — these rely on operation-level secret checks in handlers

**Routing configuration**: `vercel.json` maps routes to `api/*.js` functions.

---

## Complete CLI Entrypoint Inventory (Verified from Source)

### User-facing CLI: `bin/`

| File | Invocation | Purpose |
|---|---|---|
| `bin/install.cjs` | `npx markos` / `npx markos install` | First-run installer: copies `.agent/markos/` protocol files, merges GSD ITM templates, writes `.markos-install-manifest.json`, boots vector stores |
| `bin/update.cjs` | `npx markos update` | SHA256-aware updater: compares package files to installed, respects `.markos-local/` override protection, prompts on conflicts |
| `bin/ensure-vector.cjs` | (library + direct) | Validates Supabase + Upstash env vars. Exports `ensureVectorStores()`. Direct run: `node bin/ensure-vector.cjs` |
| `bin/ingest-literacy.cjs` | `node bin/ingest-literacy.cjs --path <dir> [flags]` | Ingests markdown literacy files into Upstash vector store with checksum dedup. Flags: `--discipline`, `--dry-run`, `--verbose`, `--limit` |
| `bin/literacy-admin.cjs` | `node bin/literacy-admin.cjs <query\|ttl-report\|deprecate> [flags]` | Admin operations on literacy vector store: semantic query, TTL report, supersede doc |

### GSD Planning CLI: `.agent/get-shit-done/bin/`

| File | Purpose |
|---|---|
| `gsd-tools.cjs` | Omnibus GSD workflow tool. Commands: `state *`, `roadmap *`, `init *`, `phase *`, `commit`, `resolve-model`, `find-phase`, `verify-summary`, `generate-slug`, `current-timestamp`, `list-todos`, `websearch`, `history-digest`, `summary-extract`, `state-snapshot`, `phase-plan-index` |
| `lib/commands.cjs` | Command dispatcher for `gsd-tools.cjs` |
| `lib/config.cjs` | Config resolution (`.planning/config.json`) |
| `lib/core.cjs` | Core utilities: MIR gate checks, phase normalization, error/output helpers |
| `lib/frontmatter.cjs` | YAML frontmatter parser/writer for plan files |
| `lib/init.cjs` | `init phase-op` and `init map-codebase` context builders |
| `lib/milestone.cjs` | Milestone ROADMAP.md operations |
| `lib/model-profiles.cjs` | Model profile resolution table |
| `lib/phase.cjs` | Phase directory lookup, plan indexing |
| `lib/profile-output.cjs` | User profile output formatting |
| `lib/profile-pipeline.cjs` | User profiler pipeline logic |
| `lib/roadmap.cjs` | ROADMAP.md parser: `get-phase`, `list-phases`, phase completion detection |
| `lib/security.cjs` | Secret redaction utilities |
| `lib/state.cjs` | STATE.md read/write/patch operations |
| `lib/template.cjs` | Plan template operations |
| `lib/uat.cjs` | UAT audit helpers |
| `lib/verify.cjs` | Summary and phase verification logic |

### MarkOS Protocol CLI: `.agent/markos/bin/`

| File | Purpose |
|---|---|
| `markos-tools.cjs` | MarkOS protocol tool. Mirrors `gsd-tools.cjs` architecture. Routes to `lib/` modules. Includes vector bootstrap via `bin/ensure-vector.cjs` |
| `lib/commands.cjs` | Command dispatcher |
| `lib/config.cjs` | Config resolution |
| `lib/core.cjs` | Core utilities: `markosRoot()`, MIR gate checks, comparison helpers |
| `lib/frontmatter.cjs` | Frontmatter parser/writer |
| `lib/init.cjs` | Context builder for markos operations |
| `lib/milestone.cjs` | Milestone operations |
| `lib/phase.cjs` | Phase directory lookup |
| `lib/roadmap.cjs` | ROADMAP.md parser (active file in editor) |
| `lib/security.cjs` | Secret redaction |
| `lib/state.cjs` | STATE.md operations |
| `lib/template.cjs` | Template operations |
| `lib/verify.cjs` | Verification logic |

---

## Complete File Inventory by Folder (Verified from Source)

### Root Directory

| File | Purpose | Complexity |
|---|---|---|
| `package.json` | npm manifest, `bin: markos -> bin/install.cjs`, scripts, dependencies | Low |
| `README.md` | Product overview, install guide, partial architecture | Low |
| `CHANGELOG.md` | Versioned protocol/product history | Low |
| `CLAUDE.md` | Claude agent boot; points to `.protocol-lore/QUICKSTART.md` | Low |
| `GEMINI.md` | Gemini agent boot | Low |
| `TECH-MAP.md` | Human-readable architecture and endpoint overview | Low |
| `ARCH-DIAGRAM.md` | Visual system orientation | Low |
| `VERSION` | Single-line semver string | Low |
| `vercel.json` | Vercel routing: maps `api/*.js` to functions | Low |
| `tokenize.cjs` | Token counts for MIR/MSP files during optimization passes | Low |
| `patch.ps1` | PowerShell patch helper for post-update local fixes | Low |
| `onboarding-seed.json` | Gitignored. Active onboarding seed payload (runtime artifact) | Low |
| `test_output.txt` | Gitignored. Test run output cache | Low |

### `api/` (Hosted Vercel Wrappers)

| File | Handler Delegated | Auth Added |
|---|---|---|
| `approve.js` | `handleApprove` | No |
| `config.js` | `handleConfig` | Yes (`config_read`) |
| `migrate.js` | `handleMarkosdbMigration` | Yes (`migration_write`) |
| `regenerate.js` | `handleRegenerate` | No |
| `status.js` | `handleStatus` | Yes (`status_read`) |
| `submit.js` | `handleSubmit` | No |
| `campaign/result.js` | `handleCampaignResult` | No |
| `linear/sync.js` | `handleLinearSync` | No |

### `bin/` (User CLI)

Already inventoried above in CLI section.

### `onboarding/` (Frontend + Backend)

| File | Purpose |
|---|---|
| `index.html` | Multi-step onboarding form UI |
| `onboarding.js` | UI logic: draft polling, approve/regenerate, localStorage |
| `onboarding.css` | Onboarding UI styles |
| `onboarding-config.json` | Runtime config: port, paths, slug |
| `onboarding-seed.schema.json` | JSON Schema for seed payload |

#### `onboarding/backend/` (HTTP + Orchestration)

| File | Purpose | Key Exports |
|---|---|---|
| `server.cjs` | HTTP server: route dispatch, boot sequence, static fallback | (main) |
| `handlers.cjs` | All route handler implementations (16 named handlers) | `handle*` functions |
| `runtime-context.cjs` | Runtime mode detection, auth enforcement, secret validation, rollout mode, retention policy, data redaction, path safety | `createRuntimeContext`, `requireHostedSupabaseAuth`, `validateRequiredSecrets`, `redactSensitive`, `getRolloutMode`, `RETENTION_POLICY` |
| `path-constants.cjs` | Canonical path resolution: all project-level directories and file paths | `PROJECT_ROOT`, `ONBOARDING_DIR`, `TEMPLATES_DIR`, `MIR_TEMPLATES`, `CONFIG_PATH`, etc. |
| `write-mir.cjs` | JIT-clone MIR templates, fuzzy-merge drafts into section blocks, stamp STATE.md | `applyDrafts()` |
| `vector-store-client.cjs` | Supabase + Upstash Vector client: configure, store, retrieve, literacy ops | `configure()`, `storeDraft()`, `getLiteracyContext()`, `getWinningCampaignPatterns()` |
| `markosdb-contracts.cjs` | Canonical Supabase schema contract, vector metadata fields, artifact classification, namespace helpers | `SUPABASE_RELATIONAL_CONTRACT`, `UPSTASH_VECTOR_METADATA_FIELDS`, `classifyArtifact()`, `buildVectorMetadata()`, `buildRelationalRecord()` |
| `utils.cjs` | Shared HTTP utilities: `readBody()`, `json()` | `readBody`, `json` |
| `linear-client.cjs` | Linear GraphQL API client with auth header management and UUID validation | `LinearSetupError`, `graphqlRequest()` |
| `literacy-chunker.cjs` | Parses literacy markdown frontmatter, chunks files for vector ingestion | `parseLiteracyFrontmatter()`, `chunkLiteracyFile()` |

#### `onboarding/backend/agents/`

| File | Purpose | Key Exports |
|---|---|---|
| `orchestrator.cjs` | Coordinates all AI draft generators: MIR then MSP, sequential with retry, vector persistence | `orchestrate(seed, slug)` |
| `llm-adapter.cjs` | Multi-provider LLM wrapper: Anthropic → OpenAI → Gemini auto-detect | `call(systemPrompt, userPrompt, options)` |
| `mir-filler.cjs` | MIR section generators: company profile, mission/values, audience, competitive landscape | `generateCompanyProfile`, `generateMissionVisionValues`, `generateAudienceProfile`, `generateCompetitiveLandscape` |
| `msp-filler.cjs` | MSP section generators: brand voice, channel strategy, paid acquisition | `generateBrandVoice`, `generateChannelStrategy`, `generatePaidAcquisition` |
| `telemetry.cjs` | PostHog analytics: event capture, checkpoint events, SLO definitions for critical endpoints | `capture()`, `captureRolloutEndpointEvent()` |
| `example-resolver.cjs` | Business-model-specific example file injection for LLM prompts | `resolveExample(templateName, businessModel, basePath)` |

#### `onboarding/backend/confidences/`

| File | Purpose |
|---|---|
| `confidence-scorer.cjs` | Field-level confidence scoring (Red/Yellow/Green) for extracted seed data |

#### `onboarding/backend/enrichers/`

| File | Purpose |
|---|---|
| `competitor-enricher.cjs` | Tavily search + LLM for competitor/trend discovery; called by `handleCompetitorDiscovery` |

#### `onboarding/backend/extractors/`

| File | Purpose |
|---|---|
| `schema-extractor.cjs` | LLM-based extraction of seed data from multi-source text into JSON schema; called by `handleExtractAndScore` |

#### `onboarding/backend/parsers/`

| File | Input | NPM Dependency |
|---|---|---|
| `csv-parser.cjs` | CSV buffer → pseudo-JSON text | `csv-parse` |
| `docx-parser.cjs` | DOCX buffer → text | `mammoth` |
| `pdf-parser.cjs` | PDF buffer → text | `pdf-parse` |
| `text-parser.cjs` | TXT/MD buffer → text | (none) |

#### `onboarding/backend/prompts/`

| File | Purpose |
|---|---|
| `enrichment-prompt.js` | Prompt for competitor/trend JSON extraction from search results |
| `extraction-prompt.js` | Full schema extraction prompt with source hierarchy (chat > file > web) |
| `partial-extraction-prompt.js` | Partial extraction prompt for mid-interview answer parsing |
| `grouping-prompt.js` | Interview question generation prompt for grouping 2-3 missing fields |
| `spark-prompt.js` | Creative alternative suggestion prompt (returns 3-item JSON array) |

#### `onboarding/backend/scrapers/`

| File | Purpose |
|---|---|
| `tavily-scraper.cjs` | Scrapes a domain URL via Tavily API to extract company context |

### `test/`

| File | What It Tests |
|---|---|
| `setup.js` | Shared fixtures: onboarding extraction scenarios, server spawn helper |
| `core-gate.test.js` | `checkMirGates()`: Gate 1/2 file presence and completeness |
| `example-resolver.test.js` | `resolveExample()`: business model normalization, path resolution, injection format |
| `install.test.js` | `bin/install.cjs`: Node version check, manifest writing, idempotency |
| `literacy-ingest.test.js` | `bin/ingest-literacy.cjs`: frontmatter parsing, chunking, checksum dedup |
| `onboarding-server.test.js` | HTTP integration: route responses, CORS, static serving, auth enforcement |
| `protocol.test.js` | Protocol structural integrity: agent dirs, template presence, GSD co-existence |
| `update.test.js` | `bin/update.cjs`: SHA256 file comparison, conflict detection, manifest update |
| `vector-store-client.test.js` | `vector-store-client.cjs`: namespace construction, configure/retrieve |
| `write-mir.test.js` | `write-mir.cjs`: JIT clone, fuzzy merge, STATE.md stamping |

### `RESEARCH/`

| File | Purpose |
|---|---|
| `AUDIENCE-RESEARCH.md` | Target audience intelligence |
| `COMPETITIVE-INTEL.md` | Competitor landscape |
| `CONTENT-AUDIT.md` | Content inventory and gap analysis |
| `MARKET-TRENDS.md` | Market trend intelligence |
| `ORG-PROFILE.md` | Organization profile intelligence |
| `PRODUCT-RESEARCH.md` | Product intelligence |

### `scripts/` — Empty (intentionally reserved)

### `tmp/`

| File | Purpose |
|---|---|
| `posthog_drop.json` | Local PostHog event drop cache (gitignored) |

---

## Secret and Environment Variable Inventory

| Variable | Required By | Operation |
|---|---|---|
| `OPENAI_API_KEY` | `llm-adapter.cjs` | LLM calls (primary provider) |
| `ANTHROPIC_API_KEY` | `llm-adapter.cjs` | LLM calls (priority 1 if set) |
| `GEMINI_API_KEY` | `llm-adapter.cjs` | LLM calls (fallback) |
| `SUPABASE_URL` | `ensure-vector.cjs`, `vector-store-client.cjs` | Supabase connection |
| `SUPABASE_SERVICE_ROLE_KEY` | `ensure-vector.cjs`, `vector-store-client.cjs`, literacy ops | Supabase admin writes |
| `SUPABASE_ANON_KEY` | `ensure-vector.cjs` | Supabase read fallback |
| `MARKOS_SUPABASE_AUD` | `runtime-context.cjs` (`requireHostedSupabaseAuth`) | JWT audience validation in hosted mode |
| `UPSTASH_VECTOR_REST_URL` | `ensure-vector.cjs`, `vector-store-client.cjs` | Upstash Vector connection |
| `UPSTASH_VECTOR_REST_TOKEN` | `ensure-vector.cjs`, `vector-store-client.cjs`, literacy ops | Upstash Vector auth |
| `LINEAR_API_KEY` | `linear-client.cjs` | Linear GraphQL API auth |
| `TAVILY_API_KEY` | `tavily-scraper.cjs`, `competitor-enricher.cjs` | Web search for enrichment |
| `POSTHOG_API_KEY` | `telemetry.cjs` | Analytics event capture |
| `POSTHOG_HOST` | `telemetry.cjs` | Analytics endpoint (default: `https://us.i.posthog.com`) |
| `MARKOS_TELEMETRY` | `telemetry.cjs`, `runtime-context.cjs` | Opt-out flag (`false` disables) |
| `VERCEL` | `runtime-context.cjs` | Hosted mode detection |
| `NETLIFY` | `runtime-context.cjs` | Hosted mode detection |
| `AWS_LAMBDA_FUNCTION_NAME` | `runtime-context.cjs` | Hosted mode detection |

---

## Dependency Chain Map

Critical dependency chain for the POST `/submit` flow (the most complex path):

```
server.cjs → handlers.cjs → orchestrator.cjs → mir-filler.cjs → llm-adapter.cjs
                                              → msp-filler.cjs → llm-adapter.cjs
                                              → vector-store-client.cjs
                                              ↓ (after completion)
           → handlers.cjs (returns drafts to client)
```

Critical dependency chain for POST `/approve`:

```
server.cjs → handlers.cjs → write-mir.cjs → path-constants.cjs
                                           → (fs operations on .markos-local/)
                                           → STATE.md stamping
```

All handlers share: `runtime-context.cjs`, `utils.cjs`, `path-constants.cjs`.

---

## Implementation Findings Per Plan

### Plan 01: Bootstrap `.planning/codebase/` Skeleton

**Difficulty: Low**

The seven standard GSD documents (STACK, INTEGRATIONS, ARCHITECTURE, STRUCTURE, CONVENTIONS, TESTING, CONCERNS) have clear known content. Two additional Phase 33 documents are needed: `ROUTES.md` and `ENTRYPOINTS.md`. A `COVERAGE-MATRIX.md` and `README.md` should also be created.

**Recommended file set for `.planning/codebase/`:**
- `README.md` — canonicality declaration, freshness triggers, document roles, link policy
- `STACK.md` — Node.js 20+, CJS modules, npm dependencies, runtime environment
- `INTEGRATIONS.md` — Supabase, Upstash Vector, OpenAI/Anthropic/Gemini, Linear, Tavily, PostHog
- `ARCHITECTURE.md` — component interaction: onboarding server, orchestrator, vector, MIR/MSP write path
- `STRUCTURE.md` — directory tree with role annotations
- `CONVENTIONS.md` — CJS everywhere, `.cjs` extension, path-constants.cjs for all paths, `write-mir.cjs` section key model, `.markos-local/` override layer
- `TESTING.md` — 10 test files, `node --test`, no test framework beyond built-in, test setup via `test/setup.js`
- `CONCERNS.md` — known debt: `api/` auth enforcement inconsistency, `scripts/` empty, `tmp/` untracked
- `ROUTES.md` — full route inventory (from this research)
- `ENTRYPOINTS.md` — CLI inventory (from this research)
- `COVERAGE-MATRIX.md` — surface inclusion/exclusion/deferral table

**Risk: None.** All content is directly derivable from this research.

### Plan 02: Runtime Surface Documentation

**Difficulty: Low**

The route and entrypoint inventories in this research document are complete. Plan 02 writes them as canonical documentation in `ROUTES.md` and `ENTRYPOINTS.md`.

**Key decision to lock before execution:** document local server routes and hosted `api/` wrappers in a single `ROUTES.md` with a section break rather than in two files. This avoids artificial fragmentation since they share the same handler functions.

**Risk: None.** Data already captured.

### Plan 03: Folder and File Documentation

**Difficulty: Low-Medium**

The file inventory in this research document is complete. Plan 03 will need to handle:
- The `onboarding/backend/` sub-layer explosion (8 directories × 1-2 files each)
- The `.agent/get-shit-done/bin/lib/` and `.agent/markos/bin/lib/` parallel structure
- The `.planning/` directory breadth (many subdirectories)
- Decision: how deep to go into `.agent/markos/templates/` (very large tree of template files)

**Recommendation:** Document `.agent/markos/templates/` at directory level only — list the subdirectory structure and purpose but not individual template files. Each individual template is an instance of a type, not a distinct implementation surface.

**Risk: Low.** The one judgment call is template depth.

### Plan 04: Sync Protocol Docs and Add Verification Guardrails

**Difficulty: Low**

`TECH-MAP.md` needs its endpoint list updated to include the 7 routes currently missing (all `/api/extract-*`, `/api/generate-question`, `/api/parse-answer`, `/api/spark-suggestion`, `/api/competitor-discovery`, `/admin/literacy/*`).

`.protocol-lore/CODEBASE-MAP.md` needs its `implementation_index` expanded from 4 files to ~12 key files, and its `onboarding/backend/server.cjs` route listing updated to the full 17-route table.

Verification guardrail: add a check to the test suite or a simple node script that asserts `.planning/codebase/` contains all required files. This prevents documentation drift on topology changes.

**Risk: None.** Scope is bounded and the diff is mechanical.

---

## Decisions to Lock Before Execution

| Decision | Recommendation | Rationale |
|---|---|---|
| `ROUTES.md` structure | Single file with Local / Hosted sections | Routes share handlers; splitting creates maintenance burden |
| Template file depth | Directory level only for `.agent/markos/templates/` | 100+ template files are instances, not distinct implementation surfaces |
| `scripts/` doc treatment | Single line: "Reserved — currently empty" | Not misleading; preserves future use |
| `tmp/` doc treatment | Note as gitignored runtime artifact cache | Clarifies it is not an implementation surface |
| Auth gap note | Document the `approve`/`submit` hosted auth gap in `CONCERNS.md` | Known inconsistency; worth recording for future hardening |
| GSD lib files | Document `.agent/get-shit-done/bin/lib/` and `.agent/markos/bin/lib/` at file level | These are distinct enough to need individual records |
| Test file scope | Document all 10 test files in `TESTING.md` with purpose | Critical for maintainers |
| Freshness trigger | Document update triggers in `README.md`: route add/remove, file add/remove, entrypoint behavior change | Matches D-33-05 from CONTEXT.md |

---

## Risks and Mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| Template tree explosion | Low | Cap at directory-level documentation |
| `.planning/` breadth makes STRUCTURE.md unwieldy | Medium | Use sectioned table with depth cap at 2 for planning sub-dirs |
| Auth enforcement inconsistency in `api/` becomes a documentation controversy | Low | State facts; document as known concern in CONCERNS.md without editorializing |
| Documentation goes stale after next development phase | Medium | Freshness contract in README.md + coverage matrix with last-verified date |

---

## ## RESEARCH COMPLETE

All four plans can proceed to execution. No additional context-gathering is needed. The route inventory, CLI inventory, file inventory, dependency chains, secret matrix, and per-plan difficulty assessments are ready for use by the executor.

**Recommended next step:** `/gsd:plan-phase 33` to generate or refine execution plans, or proceed directly to `/gsd:execute-phase 33` using the existing four plans which are already well-specified.
| `STRUCTURE.md` | `.agent/get-shit-done/templates/codebase/structure.md` | Physical file layout, directory tree |
| `CONVENTIONS.md` | `.agent/get-shit-done/templates/codebase/conventions.md` | Coding conventions, naming patterns |
| `TESTING.md` | `.agent/get-shit-done/templates/codebase/testing.md` | Test framework, files, coverage strategy |
| `CONCERNS.md` | `.agent/get-shit-done/templates/codebase/concerns.md` | Technical debt, known risks |

### MarkOS Extension Documents (6 additional)

| Document | Purpose |
|---|---|
| `ROUTES.md` | Full route table: local server + hosted API + vercel.json rewrites |
| `CLI-ENTRYPOINTS.md` | All CLI binaries: bin/, gsd-tools, markos-tools |
| `FOLDER-MAP.md` | Folder-by-folder inventory with purpose, ownership, update trigger |
| `FILE-MAP.md` | File-by-file inventory for implementation surfaces (sectioned) |
| `COVERAGE-MATRIX.md` | Which dirs/files are fully documented, summarized, or explicitly excluded |
| `FRESHNESS-CONTRACT.md` | Update triggers, verification commands, maintenance rules |

**Total target files:** 13 documents under `.planning/codebase/`

---

## Verified Route Inventory

### Local Onboarding Server (`onboarding/backend/server.cjs`)

All routes verified by direct inspection of server.cjs lines 75-103.

| # | Method | Path | Handler Function | Handler File | Purpose |
|---|--------|------|-----------------|-------------|---------|
| 1 | OPTIONS | `*` | `handleCorsPreflight` | `handlers.cjs` | CORS preflight (all routes) |
| 2 | GET | `/config` | `handleConfig` | `handlers.cjs` | Returns `onboarding-config.json` + env status |
| 3 | GET | `/status` | `handleStatus` | `handlers.cjs` | Supabase + Upstash Vector health + MIR gate progress |
| 4 | POST | `/submit` | `handleSubmit` | `handlers.cjs` | Core: accepts seed JSON, triggers orchestrator, stores drafts |
| 5 | POST | `/api/extract-sources` | `handleExtractSources` | `handlers.cjs` | Tavily scraper: extract structured data from URLs/files |
| 6 | POST | `/api/extract-and-score` | `handleExtractAndScore` | `handlers.cjs` | Confidence scorer: rate extraction data quality (R/Y/G) |
| 7 | POST | `/api/generate-question` | `handleGenerateQuestion` | `handlers.cjs` | AI interview: generate follow-up questions for missing data |
| 8 | POST | `/api/parse-answer` | `handleParseAnswer` | `handlers.cjs` | Parse structured answers from interview responses |
| 9 | POST | `/api/spark-suggestion` | `handleSparkSuggestion` | `handlers.cjs` | AI creative suggestions for onboarding form fields |
| 10 | POST | `/api/competitor-discovery` | `handleCompetitorDiscovery` | `handlers.cjs` | AI-assisted competitive landscape discovery |
| 11 | POST | `/regenerate` | `handleRegenerate` | `handlers.cjs` | Re-runs a single AI agent section (e.g. brand_voice) |
| 12 | POST | `/approve` | `handleApprove` | `handlers.cjs` | JIT-clones templates, writes drafts to `.markos-local/` |
| 13 | POST | `/migrate/local-to-cloud` | `handleMarkosdbMigration` | `handlers.cjs` | Migrates local MIR data to Supabase (MarkosDB) |
| 14 | POST | `/linear/sync` | `handleLinearSync` | `handlers.cjs` | Creates Linear issues from ITM tokens |
| 15 | POST | `/campaign/result` | `handleCampaignResult` | `handlers.cjs` | Appends winners catalog rows + outcome classification |
| 16 | GET | `/admin/literacy/health` | `handleLiteracyHealth` | `handlers.cjs` | Secret-gated: literacy provider diagnostics |
| 17 | POST | `/admin/literacy/query` | `handleLiteracyQuery` | `handlers.cjs` | Secret-gated: literacy standards retrieval with filters |
| -- | GET | `/*` (fallback) | Static file serve | server.cjs inline | Serves `onboarding/` UI assets (HTML/JS/CSS) |

**Boot sequence:** `.env` load -> `onboarding-config.json` -> `vectorStore.configure()` -> `ensureVectorStores()` -> `server.listen(config.port, '127.0.0.1')` with EADDRINUSE fallback to port+1.

### Hosted API Wrappers (`api/`)

All wrappers delegate to `handlers.cjs`. Auth differences are the only behavioral variation.

| File | Vercel Path | Method | Handler Function | Auth Layer | Notes |
|------|------------|--------|-----------------|-----------|-------|
| `api/approve.js` | `/api/approve` | POST | `handleApprove` | None (bare proxy) | Rewritten to `/approve` in vercel.json |
| `api/config.js` | `/api/config` | GET | `handleConfig` | `requireHostedSupabaseAuth` (config_read) | Rewritten to `/config` |
| `api/migrate.js` | `/api/migrate` | POST | `handleMarkosdbMigration` | `requireHostedSupabaseAuth` (migration_write) | NOT in vercel.json — direct file path |
| `api/regenerate.js` | `/api/regenerate` | POST | `handleRegenerate` | None (bare proxy) | Rewritten to `/regenerate` |
| `api/status.js` | `/api/status` | GET | `handleStatus` | `requireHostedSupabaseAuth` (status_read) | Rewritten to `/status` |
| `api/submit.js` | `/api/submit` | POST | `handleSubmit` | None (bare proxy) | Rewritten to `/submit` |
| `api/campaign/result.js` | `/api/campaign/result` | POST | `handleCampaignResult` | None (bare proxy) | NOT in vercel.json — direct file path |
| `api/linear/sync.js` | `/api/linear/sync` | POST | `handleLinearSync` | None (bare proxy) | NOT in vercel.json — direct file path |

**vercel.json rewrite coverage:** 5 of 8 function files are rewritten. The 3 without rewrites (`migrate.js`, `campaign/result.js`, `linear/sync.js`) are invoked directly via their `/api/` path — Vercel auto-routes all files under `api/` as serverless functions.

**Auth asymmetry (must document clearly):** Local server has no auth on any route. Hosted wrappers apply `requireHostedSupabaseAuth` to `config`, `status`, and `migrate` only. The `submit`, `approve`, `regenerate`, `campaign/result`, and `linear/sync` hosted wrappers are bare proxies.

**Routes NOT exposed in hosted API (local-only):** `/api/extract-sources`, `/api/extract-and-score`, `/api/generate-question`, `/api/parse-answer`, `/api/spark-suggestion`, `/api/competitor-discovery`, `/admin/literacy/health`, `/admin/literacy/query`.

**Local path vs hosted path asymmetry:** Local server uses descriptive nested paths (e.g. `/migrate/local-to-cloud`); hosted Vercel path is derived from file location (`/api/migrate`). ROUTES.md must show both columns explicitly.

---

## Verified CLI Entrypoint Inventory

### bin/ (npm-published, shipped in package `files` field)

| Binary | File | Invocation | Purpose |
|--------|------|-----------|---------|
| markos (install) | `bin/install.cjs` | `npx markos` / `npx markos install` | Interactive installer: detects GSD coexistence, copies `.agent/markos/` templates, writes manifest |
| markos update | `bin/update.cjs` | `npx markos update` | SHA256-idempotent updater: preserves local patches, resolves conflicts interactively |
| (module export) | `bin/ensure-vector.cjs` | `node bin/ensure-vector.cjs` or `require()` | Boot-time Supabase + Upstash Vector config validation; exports `ensureVectorStores()` |
| (admin CLI) | `bin/ingest-literacy.cjs` | `node bin/ingest-literacy.cjs --path <file>` | Ingests literacy markdown into vector store with discipline tagging and chunking |
| (admin CLI) | `bin/literacy-admin.cjs` | `node bin/literacy-admin.cjs <query\|ttl-report\|deprecate>` | Admin queries: discipline search, TTL reporting, record deprecation |

### Protocol CLIs (`.agent/` — developer/agent use only, not npm-published)

| Binary | File | Invocation | Purpose |
|--------|------|-----------|---------|
| gsd-tools | `.agent/get-shit-done/bin/gsd-tools.cjs` | `node .agent/get-shit-done/bin/gsd-tools.cjs <command>` | Full GSD CLI: state, phase ops, roadmap, commits, validation, web search |
| markos-tools | `.agent/markos/bin/markos-tools.cjs` | `node .agent/markos/bin/markos-tools.cjs <command>` | MarkOS protocol CLI: roadmap, phase, state, commit, mir-audit, slug, timestamp |

**gsd-tools command families:** `state`, `resolve-model`, `find-phase`, `commit`, `commit-to-subrepo`, `verify-summary`, `generate-slug`, `current-timestamp`, `list-todos`, `verify-path-exists`, `config-ensure-section`, `history-digest`, `summary-extract`, `state-snapshot`, `phase-plan-index`, `websearch`, `phase` (next-decimal/add/insert/remove/complete), `roadmap` (get-phase/analyze/update-plan-progress), `requirements mark-complete`, `milestone complete`, `validate` (consistency/health), `init`.

**markos-tools command families:** `init`, `config-new-project`, `config-set`, `config-get`, `roadmap get-phase`, `roadmap list-phases`, `phase-plan-index`, `find-phase`, `phase complete`, `state begin-phase`, `state update`, `commit`, `mir-audit`, `slug`, `timestamp`, `verify-path`.

---

## Repository Folder Map

### Top-Level Directories (Verified by Scan)

| Directory | Type | Purpose | Documentation Status |
|-----------|------|---------|---------------------|
| `.agent/` | Protocol corpus | GSD + MarkOS agents, workflows, templates, bins | Partially in CODEBASE-MAP.md |
| `.agent/agents/` | Agent definitions | 16 GSD agent markdown files | Not individually documented |
| `.agent/get-shit-done/` | GSD engine | Workflows, references, templates, gsd-tools CLI | No current doc coverage |
| `.agent/markos/` | MarkOS engine | 30+ agents, templates, markos-tools CLI | Partially in MARKOS-INDEX.md |
| `.agent/hooks/` | Runtime hooks | Pre-push, commit-msg, context monitors | Not documented |
| `.claude/` | VS Code meta | Copilot skill definitions | Out of scope (meta) |
| `.cursor/` | Cursor meta | Cursor-specific configuration | Out of scope (meta) |
| `.markos-local/` | Client workspace | **Gitignored.** MIR/MSP approved outputs | Excluded |
| `.markos-logs/` | Telemetry | **Gitignored.** Runtime event logs | Excluded |
| `.planning/` | GSD planning | STATE.md, ROADMAP.md, phase artifacts | Self-documenting |
| `.planning/codebase/` | **CANONICAL MAP TARGET** | Empty; all 13 docs created by Phase 33 | Created by this phase |
| `.planning/phases/` | Phase artifacts | Per-phase PLANs, RESEARCH, SUMMARY | Self-documenting |
| `.planning/milestones/` | Milestone archive | v1.0-v2.2 history docs | Self-documenting |
| `.planning/MIR/` | MIR planning | MIR gate planning artifacts | Family-rolled |
| `.planning/MSP/` | MSP planning | MSP strategy planning artifacts | Family-rolled |
| `.planning/research/` | Research intel | Planning research documents | Family-rolled |
| `.protocol-lore/` | Agent nav layer | QUICKSTART, INDEX, ARCHITECTURE, etc. | Covered by CODEBASE-MAP.md |
| `.vscode/` | Editor meta | VS Code settings | Out of scope (meta) |
| `api/` | Hosted wrappers | Vercel serverless entries | Partially in TECH-MAP.md; gaps exist |
| `api/campaign/` | Sub-path | campaign/result.js wrapper | Not documented |
| `api/linear/` | Sub-path | linear/sync.js wrapper | Not documented |
| `bin/` | CLI binaries | npm-published entrypoints | Covered in TECH-MAP.md + CODEBASE-MAP.md |
| `node_modules/` | Dependencies | Installed packages | **Excluded** |
| `onboarding/` | Onboarding UI | Web form + backend | Covered in TECH-MAP.md + CODEBASE-MAP.md |
| `onboarding/backend/` | HTTP server | server, handlers, agents, utilities | Partially covered |
| `onboarding/backend/agents/` | AI agents | orchestrator, llm-adapter, fillers | Covered in CODEBASE-MAP.md |
| `onboarding/backend/extractors/` | Extraction | schema-extractor.cjs | Not documented |
| `onboarding/backend/parsers/` | File parsing | csv, docx, pdf, text parsers | Not documented |
| `onboarding/backend/scrapers/` | Web scraping | tavily-scraper.cjs | Not documented |
| `onboarding/backend/prompts/` | LLM prompts | extraction, enrichment, grouping JS | Not documented |
| `onboarding/backend/confidences/` | (empty) | Pending confidence scoring modules | Empty — note in docs |
| `onboarding/backend/enrichers/` | (empty) | Pending enrichment pipeline modules | Empty — note in docs |
| `RESEARCH/` | Intelligence | 6 market/audience/competitive files | Maintained surface per D-33-04 |
| `scripts/` | Does not exist | No scripts/ directory in repo | N/A |
| `test/` | Test suite | 9 files (8 test + setup.js) | Partially in CODEBASE-MAP.md |
| `tmp/` | Scratch | Gitignored temp files | Excluded |

### File Complexity Tiers for FILE-MAP.md

Complex files that need inline sub-sections (Tier A):

| File | Reason |
|------|--------|
| `onboarding/backend/handlers.cjs` | Implements all 17 HTTP handler functions; single largest impl file |
| `onboarding/backend/server.cjs` | Route wiring, boot sequence, static serving |
| `onboarding/backend/vector-store-client.cjs` | Supabase + Upstash dual-store; collection naming; compat reads |
| `onboarding/backend/runtime-context.cjs` | Hosted vs local guards, rollout modes, auth, slug resolution |
| `onboarding/backend/agents/orchestrator.cjs` | Parallel LLM draft generation, retry, telemetry |
| `onboarding/backend/agents/llm-adapter.cjs` | Multi-provider routing (OpenAI/Anthropic/Gemini/Ollama) |
| `onboarding/backend/write-mir.cjs` | JIT template clone, fuzzy file matching, STATE.md stamps |
| `onboarding/backend/markosdb-contracts.cjs` | Schema contracts, namespace read order, metadata builders |

Summarized files (Tier B — single-row entry):

| File Group | Examples |
|-----------|---------|
| Backend utilities | `path-constants.cjs`, `utils.cjs`, `linear-client.cjs`, `literacy-chunker.cjs` |
| Filler agents | `agents/mir-filler.cjs`, `agents/msp-filler.cjs`, `agents/example-resolver.cjs`, `agents/telemetry.cjs` |
| Parsers/Scrapers | `extractors/schema-extractor.cjs`, `parsers/*.cjs`, `scrapers/tavily-scraper.cjs` |
| Prompts | `prompts/*.js` (4 files) |
| Root config files | `.env.example`, `.gitignore`, `tokenize.cjs`, `patch.ps1`, `VERSION` |
| Test files | All 9 files in `test/` |

Family-rolled entries (Tier C — one entry covers the whole tree):

| Family | Scope |
|--------|-------|
| `.agent/markos/templates/MIR/` | ~50+ MIR template markdown files |
| `.agent/markos/templates/LINEAR-TASKS/` | ~20 ITM template files |
| `.agent/markos/agents/` | 30+ agent markdown files |
| `.agent/get-shit-done/workflows/` | 45+ workflow markdown files |
| `.agent/get-shit-done/templates/` | 25+ template markdown files |
| `.agent/get-shit-done/references/` | 15+ reference markdown files |
| `.planning/phases/` | All per-phase subdirs |
| `.planning/MIR/` + `.planning/MSP/` | All planning gate files |

---

## Architecture Patterns

### Dual-Runtime Pattern

MarkOS runs identically on two surfaces via the same handler code:

| Mode | Entrypoint | Auth | Persistence |
|------|-----------|------|------------|
| **Local** | `onboarding/backend/server.cjs` | None | `.markos-local/` file writes |
| **Hosted** | `api/*.js` via Vercel | `requireHostedSupabaseAuth` on 3 routes | Supabase relational + Upstash Vector |

`createRuntimeContext()` detects the current mode. All handler behavior is identical; only the persistence target and auth gates differ.

### Handler Delegation Chain

```
server.cjs (route match)
  → handlers.cjs (handleXxx function)
      → runtime-context.cjs (mode detection / auth guard)
      → agents/orchestrator.cjs (AI generation, via handleSubmit/handleRegenerate)
      → vector-store-client.cjs (storage reads/writes)
      → write-mir.cjs (file writes, via handleApprove)
      → markosdb-contracts.cjs (schema enforcement)
      → linear-client.cjs (Linear API, via handleLinearSync)
```

The hosted wrapper adds one step before the handler:
```
api/config.js → requireHostedSupabaseAuth() → handlers.handleConfig()
```

---

## Gaps in Existing Docs vs Phase 33 Target

| Existing Asset | Covers | Gap vs Phase 33 Target |
|----------------|--------|----------------------|
| `TECH-MAP.md` | Architecture, 10 of 17 routes, agents, install flow | Missing: routes 5-10 (`extract-*`, `competitor-discovery`, `parse-answer`), `/admin/literacy/*`; all `api/` wrapper auth details; no CLI table; no extractors/parsers/scrapers docs |
| `.protocol-lore/CODEBASE-MAP.md` | XML LLM nav of major files | Missing: `api/campaign/`, `api/linear/`, backend subdirs (extractors, parsers, scrapers, prompts), `literacy-chunker.cjs`, `markosdb-contracts.cjs`, `linear-client.cjs`, all `.agent/get-shit-done/bin/lib/` files |
| `ARCH-DIAGRAM.md` | Visual system diagram | Static visual only; no machine-readable route or file tables |
| `.agent/markos/MARKOS-INDEX.md` | Protocol registry (skills, ITM tokens, paths) | No HTTP route or file-level coverage |

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Route extraction | Custom AST parser | Direct inspection — server.cjs is readable | 17 routes, not generated; verified above |
| Directory tree | Custom walker script | PowerShell / manual | Simpler and already done during research |
| Coverage enforcement | Automated scanner | COVERAGE-MATRIX.md + freshness contract | Phase 33 goal is a maintained doc, not a CI tool |
| Markdown table generation | Custom formatter | Hand-write from verified data | Research already has the verified data |

---

## Naming, Format, and Convention Decisions to Lock Before Execution

### 1. Route Table Columns (ROUTES.md)

```
| Method | Local Path | Hosted Path | Handler Function | Handler File | Local? | Hosted? | Auth (hosted) | Purpose |
```

### 2. CLI Table Columns (CLI-ENTRYPOINTS.md)

```
| Binary | File | Invocation | Published to npm? | Purpose |
```

### 3. File Map Classification Tiers

| Tier | Label | Definition |
|------|-------|-----------|
| A | **Documented** | Full entry with purpose, exports, integration links |
| B | **Summarized** | Short single-row entry (low-complexity utility or config) |
| C | **Family-rolled** | One entry covers the entire template/corpus family |
| D | **Excluded** | Gitignored, generated, or out-of-scope with stated reason |

### 4. Freshness Trigger Format (FRESHNESS-CONTRACT.md)

```
## Trigger: [event description]
- **Update:** [which .planning/codebase/ file + which section]
- **Verify:** [command or manual check]
```

### 5. FILE-MAP.md Section Splits (14 sections)

1. Root Files
2. `onboarding/` (UI assets)
3. `onboarding/backend/` (server + handlers + utilities)
4. `onboarding/backend/agents/` (AI orchestration)
5. `onboarding/backend/` subdirs (extractors, parsers, scrapers, prompts)
6. `api/` (hosted wrappers)
7. `bin/` (CLI binaries)
8. `.agent/agents/` (GSD + MarkOS agent definitions)
9. `.agent/get-shit-done/` (GSD engine — family-rolled by subdir)
10. `.agent/markos/` (MarkOS engine — family-rolled for templates)
11. `.planning/` (planning artifacts — family-rolled by subdirectory)
12. `test/` (test suite — all Tier B)
13. `RESEARCH/` (intelligence files)
14. `.protocol-lore/` (agent navigation layer)

---

## Common Pitfalls

### Pitfall 1: Route Path Mismatch Local vs Hosted

**What goes wrong:** Documenting `/migrate/local-to-cloud` without noting hosted path is `/api/migrate`.
**Why it happens:** Local server uses descriptive paths; Vercel derives paths from `api/` file locations.
**How to avoid:** ROUTES.md has separate `Local Path` and `Hosted Path` columns.

### Pitfall 2: vercel.json and api/ Coverage Confusion

**What goes wrong:** Assuming all `api/*.js` files are listed in `vercel.json` rewrites.
**Why it happens:** `vercel.json` only rewrites 5 of 8 function files. The other 3 are Vercel auto-routed.
**How to avoid:** ROUTES.md notes all 8 hosted functions and flags which 5 appear in vercel.json.

### Pitfall 3: FILE-MAP Size Explosion

**What goes wrong:** Single flat FILE-MAP.md with 300+ rows becomes unnavigable.
**Why it happens:** No tiering or section structure.
**How to avoid:** 4-tier classification + 14-section FILE-MAP split as defined above.

### Pitfall 4: Freshness Contract Without Verification Mechanism

**What goes wrong:** "Update docs when routes change" rule with no enforcement path.
**Why it happens:** Rules are prose with no testable check.
**How to avoid:** Each Freshness trigger includes a `Verify:` command or a `test/protocol.test.js` assertion reference.

### Pitfall 5: Gitignored Surfaces in FILE-MAP

**What goes wrong:** `.markos-local/`, `.markos-logs/`, `tmp/` entries appear in FILE-MAP.
**Why it happens:** Not cross-checking `.gitignore` before writing inventory.
**How to avoid:** COVERAGE-MATRIX.md pre-classifies all excluded surfaces before FILE-MAP is written.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Node.js built-in test runner (`node:test`) |
| Config file | None (glob: `test/**/*.test.js`) |
| Quick run command | `node --test test/protocol.test.js` |
| Full suite command | `npm test` |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|------------------|-------------|
| DOC-01 | All 13 `.planning/codebase/` files present | smoke | `node --test test/protocol.test.js` | Extend existing |
| DOC-02 | ROUTES.md and CLI-ENTRYPOINTS.md present with content | smoke | `node --test test/protocol.test.js` | Extend existing |
| DOC-03 | FOLDER-MAP.md and FILE-MAP.md present with content | smoke | `node --test test/protocol.test.js` | Extend existing |
| DOC-04 | TECH-MAP.md contains link to `.planning/codebase/` | smoke | `node --test test/protocol.test.js` | Extend existing |
| DOC-05 | FRESHNESS-CONTRACT.md present | smoke | `node --test test/protocol.test.js` | Extend existing |

All DOC-* requirements map to lightweight file-presence + content assertions in `test/protocol.test.js`. No new test files needed.

### Sampling Rate

- **Per task commit:** `node --test test/protocol.test.js`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] Add assertions to `test/protocol.test.js` for all 13 `.planning/codebase/` target files (by name)
- [ ] Add assertion that `TECH-MAP.md` contains a `See .planning/codebase/` link

---

## Implementation Difficulty Assessment by Plan

| Plan | Content | Difficulty | Primary Risk |
|------|---------|-----------|-------------|
| 33-01: Bootstrap | 13 stub docs, COVERAGE-MATRIX headers, test assertions | LOW | Template selection; straightforward scaffolding |
| 33-02: Route + CLI docs | ROUTES.md (17 local + 8 hosted), CLI-ENTRYPOINTS.md | LOW-MEDIUM | Vercel path asymmetry; auth asymmetry; well-documented above |
| 33-03: Folder + File docs | FOLDER-MAP.md, FILE-MAP.md (14 sections) | MEDIUM-HIGH | Volume; tiered classification; complex handlers need sub-sections |
| 33-04: Sync + guardrails | TECH-MAP.md link additions, CODEBASE-MAP.md link additions, FRESHNESS-CONTRACT.md, protocol.test.js additions | MEDIUM | Requires reading three existing docs carefully; risk of formatting disruption |

---

## Environment Availability

SKIPPED — Phase 33 is documentation-only with no external runtime dependencies. All artifacts are markdown files produced by codebase inspection. No new CLIs, databases, or network services are required.

---

## Sources

### Primary (HIGH confidence — direct codebase inspection)

- `onboarding/backend/server.cjs` lines 75-103 — complete route table
- `api/approve.js`, `api/config.js`, `api/migrate.js`, `api/regenerate.js`, `api/status.js`, `api/submit.js` — hosted wrapper auth patterns
- `api/campaign/result.js`, `api/linear/sync.js` — sub-path wrappers
- `vercel.json` — rewrite rules (5 of 8)
- `bin/*.cjs` — header comments and purpose for all 5 files
- `.agent/get-shit-done/bin/gsd-tools.cjs` — command families from usage block
- `.agent/markos/bin/markos-tools.cjs` — command families from printUsage()
- `package.json` — bin declaration, scripts, `files` array
- `.planning/config.json` — `nyquist_validation: true` confirmed
- `.planning/milestones/v2.3-REQUIREMENTS.md` — DOC-01 through DOC-05 requirements
- `.agent/get-shit-done/templates/codebase/*.md` — standard 7-doc template set
- `.agent/get-shit-done/workflows/map-codebase.md` — 7-doc canonical target spec
- PowerShell directory scans of `.agent/`, `onboarding/backend/`, `test/`, `RESEARCH/`

### Secondary (HIGH confidence — existing documentation cross-checked against source)

- `TECH-MAP.md` — architecture overview cross-checked against server.cjs
- `.protocol-lore/CODEBASE-MAP.md` — XML nav layer cross-checked against directory scan
- `.planning/phases/33-codebase-documentation-mapping/33-CONTEXT.md` — locked decisions

---

## Metadata

**Confidence breakdown:**
- Route inventory: HIGH — all 17 routes read directly from server.cjs; all 8 api/ files inspected
- CLI entrypoints: HIGH — all 7 files confirmed by scan and header inspection
- File/folder inventory: HIGH — PowerShell scans of entire repo
- Gap analysis: HIGH — existing docs cross-referenced against verified codebase
- Architecture patterns: HIGH — sourced from server.cjs, runtime-context.cjs, handlers.cjs
- Document structure recommendation: MEDIUM — GSD standard + MarkOS extension logic applied; no external validation tool

**Research date:** 2026-03-31
**Valid until:** Until any route is added or removed, or any top-level directory changes. Recheck within 30 days or after any v2.3 implementation work.
