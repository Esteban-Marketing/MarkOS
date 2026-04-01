# Phase 33: Codebase Documentation Mapping — Research

**Researched:** 2026-03-31
**Domain:** Documentation architecture, route inventory, CLI entrypoints, repo topology
**Confidence:** HIGH — all findings sourced directly from codebase inspection

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-33-01:** Use `.planning/codebase/` as the canonical GSD documentation surface because the existing GSD mapper workflow already targets that location.
- **D-33-02:** Keep `TECH-MAP.md` and `.protocol-lore/CODEBASE-MAP.md` as summary/navigation layers that deep-link back to `.planning/codebase/` rather than restating full inventories.
- **D-33-03:** Treat onboarding HTTP routes, `api/` wrappers, and CLI binaries as first-class runtime surfaces that require explicit route/entry documentation.
- **D-33-04:** Treat `.agent/`, `.planning/`, `RESEARCH/`, and `test/` as maintained documentation surfaces, not incidental support folders.
- **D-33-05:** Require documentation updates when any route is added or removed, any maintained directory gains or loses files, or any entrypoint behavior changes.
- **D-33-06:** Prefer one canonical inventory with linked summary docs over parallel duplicated maps.

### Claude''s Discretion

- Extend the standard GSD seven-document map with MarkOS-specific documents for routes, folders, files, and coverage when execution starts.
- Use appendices or sectioned tables if a single inventory document becomes too large for practical navigation.

### Deferred Ideas (OUT OF SCOPE)

_(None specified in CONTEXT.md)_
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DOC-01 | Canonical `.planning/codebase/` documentation exists for stack, integrations, architecture, structure, conventions, testing, and concerns. | GSD 7-doc templates confirmed at `.agent/get-shit-done/templates/codebase/`. Dir exists but is empty. |
| DOC-02 | Runtime surfaces documented route by route across onboarding HTTP endpoints, `api/` wrappers, and CLI entrypoints. | Full route table below: 17 local routes + 1 static, 8 hosted wrappers, 7 CLI binaries. |
| DOC-03 | Repository documented folder by folder, file by file for all maintained surfaces. | Folder inventory below. Complex dirs: `onboarding/backend/` (9 subdirs), `.agent/markos/` (deep template tree). |
| DOC-04 | `README.md`, `TECH-MAP.md`, and `.protocol-lore/CODEBASE-MAP.md` synchronized to canonical map through links and summary layers. | All three exist and are partially accurate; require link-back additions only. |
| DOC-05 | Documentation freshness and verification rules exist for route additions, file moves, and topology changes. | No freshness contract exists today. Must be created from scratch. |
</phase_requirements>

---

## Summary

Phase 33 creates the `.planning/codebase/` canonical documentation layer for the MarkOS repository. The GSD codebase-mapper workflow defines a standard 7-document set (STACK, INTEGRATIONS, ARCHITECTURE, STRUCTURE, CONVENTIONS, TESTING, CONCERNS), and this phase extends that set with 6 MarkOS-specific documents covering routes, CLI entrypoints, folder topology, file inventory, coverage rules, and freshness contracts.

The `.planning/codebase/` directory already exists but is completely empty — no bootstrap work needed beyond creating the 13 target files. All content can be derived purely from code inspection: three key implementation files (`server.cjs`, `handlers.cjs`, all `api/*.js` wrappers) contain the complete route surface, and a directory scan yields the file inventory.

The primary execution risk is scope: the repo has ~300+ tracked files, and a per-file inventory that is not carefully sectioned will become unreadable. The mitigation is a tiered coverage model — full inline documentation for complex implementation files, summary-level entries for template families and protocol corpus files, and explicit exclusions for gitignored surfaces.

**Primary recommendation:** Adopt a 13-document `.planning/codebase/` structure. Populate the 7 GSD standard docs first (Plan 33-01), add runtime surface docs next (Plan 33-02), then folder/file granular docs (Plan 33-03), and finish with sync + freshness guardrails (Plan 33-04).

---

## Standard Stack (GSD Codebase Map)

### GSD Standard Seven Documents

| Document | Template Source | Purpose |
|---|---|---|
| `STACK.md` | `.agent/get-shit-done/templates/codebase/stack.md` | Languages, runtime, dependencies, configuration |
| `INTEGRATIONS.md` | `.agent/get-shit-done/templates/codebase/integrations.md` | External APIs, databases, auth, webhooks |
| `ARCHITECTURE.md` | `.agent/get-shit-done/templates/codebase/architecture.md` | Conceptual layers, component interaction |
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
