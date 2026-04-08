# MarkOS — Marketing Operating System

[![npm](https://img.shields.io/npm/v/markos)](https://www.npmjs.com/package/markos)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> Marketing, structured.

You've tried prompting your way to a marketing strategy. It doesn't work without structure.

**MarkOS is the missing operating system** — protocol-grade marketing infrastructure for AI-ready teams, installed in one command.

```bash
npx markos
```

---

## What Is a Marketing OS?

Most AI marketing tools give you outputs. MarkOS gives you a system.

| Without MarkOS | With MarkOS |
|---|---|
| Prompt → hope for consistency | Protocol → always on-brand |
| Scattered docs and Notion pages | Structured MIR intelligence layer |
| Different agents, no shared context | Supabase + Upstash vector memory + override resolution |
| Re-explain your brand every session | One-command deploy, persistent context |

**MarkOS is not a writing tool.** It's the structured infrastructure that makes AI marketing agents effective.

---

## Install

Node.js `>=20.16.0` is required. If your runtime is older, upgrade Node first and then rerun the installer.

Primary install path:

```bash
npx markos
```

Useful overrides:

```bash
# Skip auto-launching onboarding after install
npx markos --no-onboarding

# Accept defaults non-interactively
npx markos --yes --project-name "Acme Client"

# Run secure database provisioning setup (Supabase + Upstash)
npx markos db:setup
```

In ~60 seconds you get:
- `.agent/markos/` — versioned protocol engine (templates, agents, `MARKOS-INDEX.md`)
- `onboarding/` — web onboarding app (copied on first install when missing)
- `.markos-install-manifest.json` — idempotent install marker for `npx markos update`
- Optional: launch the onboarding form to drive drafts into `.markos-local/` after approval

Installer completion states:
- `ready` — local onboarding handoff is available with full baseline dependencies.
- `degraded` — install succeeded, but one or more optional runtime dependencies (for example AI keys or vector providers) still need configuration.
- `blocked` — install finished copying files, but automatic onboarding handoff cannot proceed until a required local runtime issue is fixed.

This repository also ships **`.protocol-lore/`** (agent boot and navigation); it is not part of the published npm `files` list, but it is authoritative when working from source.

```bash
# Update when new protocol versions ship:
npx markos update

# `npx markos install` remains a compatibility alias for the primary install flow.

# Guided DB provisioning with migration + security audit gates:
npx markos db:setup

# Run the onboarding form to fill your brand intelligence:
node onboarding/backend/server.cjs
# Then open http://localhost:4242
```

`db:setup` prerequisites: valid Supabase service-role credentials and Upstash Vector REST credentials. The command validates both providers, applies pending migrations safely, verifies RLS + namespace isolation, and prints a structured health snapshot.

---

## Three Layers

```text
MIR  (Marketing Intelligence Repository)
  └─ Brand voice, audience profiles, competitive landscape, product facts
     Ground truth. Never generated without approval. You own this.

MSP  (Marketing Strategy Plan)
  └─ Channel strategy, campaign blueprints, KPI frameworks
     Derived from MIR. Executable by AI agents.

ITM  (Issue Task Templates)
  └─ Pre-baked Linear.app tickets for every common marketing job
     Drop into your project management system. Run.
```

---

## Agents

These are representative protocol agent IDs. Names use the `markos-*` prefix; compatibility-only aliases may exist in older artifacts.

| Agent | What It Does |
|-------|-------------|
| `markos-strategist` | Creates discipline plans from MIR data |
| `markos-copy-drafter` | Generates on-brand copy for any channel |
| `markos-campaign-architect` | Builds campaign structures from MSP blueprints |
| `markos-data-scientist` | Interprets KPI data and recommends pivots |

---

## What MarkOS Is Not

- Not a content generator you use ad-hoc
- Not a replacement for marketing judgment or strategy
- Not a tool that works without your brand context (that's what onboarding is for)
- Not managed — you own and version-control everything

---

## Architecture

```text
bin/install.cjs           ← first-run installer
bin/update.cjs            ← SHA256 idempotent updater (preserves patched files)
bin/ensure-vector.cjs     ← vector provider bootstrap (Supabase + Upstash)

onboarding/
  index.html              ← 5-step onboarding form (privacy notice included)
  onboarding.js           ← UI logic (polling, approve, regenerate)
  backend/
    server.cjs            ← HTTP server (GET / /config /status; POST /submit /approve)
    write-mir.cjs         ← JIT-clone templates → fuzzy-merge → stamp STATE.md
    vector-store-client.cjs     ← Supabase + Upstash vector adapter (canonical writes + compatibility reads)
    agents/
      orchestrator.cjs    ← parallel draft generation + vector persistence
      llm-adapter.cjs     ← unified OpenAI/Anthropic/Gemini call wrapper
      mir-filler.cjs      ← Company/Audience/Competitive MIR generators
      msp-filler.cjs      ← Brand Voice/Channel Strategy MSP generators

.agent/                   ← Protocol engine (version-controlled)
.markos-local/              ← Client override layer (gitignored)
.markos-project.json        ← Persistent project slug
.protocol-lore/           ← Agent navigation knowledge base (mandatory first-read)
```

## Canonical Codebase Documentation

Canonical route, folder, and file inventories now live in `.planning/codebase/`.

- Start here: `.planning/codebase/README.md`
- Runtime routes: `.planning/codebase/ROUTES.md`
- Executable entrypoints: `.planning/codebase/ENTRYPOINTS.md`
- Folder and file ownership: `.planning/codebase/FOLDERS.md`, `.planning/codebase/FILES.md`

`README.md`, `TECH-MAP.md`, and `.protocol-lore/CODEBASE-MAP.md` are summary views and should delegate topology truth to the canonical map.

---

## Agent Quick-Boot

If you are an AI agent, read these files in order before doing anything else:

1. `.protocol-lore/QUICKSTART.md` — boot entry point, search map, key commands
2. `.protocol-lore/INDEX.md` — condensed lore map (then `CODEBASE-MAP.md` for deep navigation)
3. `.planning/STATE.md` — **canonical** GSD milestone, phase, and next actions
4. `.agent/markos/MARKOS-INDEX.md` — full token registry for the MarkOS protocol corpus

---

## Environment Variables

Copy `.env.example` to `.env` and fill in at least one LLM key:

```bash
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=AI...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
UPSTASH_VECTOR_REST_URL=https://your-upstash-index.upstash.io
UPSTASH_VECTOR_REST_TOKEN=your-upstash-token
```

---

## Running Tests

```bash
npm test
# equivalent: node --test test/**/*.test.js
```

Tests use Node's built-in test runner. Zero external test framework dependencies.

---

## Hobby Deployment Gate

Vercel Hobby deployments are limited to 12 Serverless Functions. This repository includes a build-time gate so you can ship a reduced route set without deleting routes from source.

Default behavior:
- `npm run vercel-build` builds the full app locally.
- Set `MARKOS_DEPLOY_PROFILE=hobby` to keep only the hosted onboarding API surface.

Useful environment variables:

```bash
MARKOS_DEPLOY_PROFILE=hobby
MARKOS_SERVERLESS_BUDGET=12
MARKOS_ALLOWED_SERVERLESS_ROUTES=api/config.js,api/status.js,api/submit.js,api/regenerate.js,api/approve.js
```

The commented allowlist lives in `vercel.function-gate.config.cjs`.

---

## LLM BYOK (Phase 47)

MarkOS now includes a unified multi-provider LLM adapter layer with BYOK support for Anthropic, OpenAI, and Gemini.

Quick commands:

```bash
# Configure providers, encrypted keys, and preferences
npx markos llm:config

# Show provider usage and monthly budget status
npx markos llm:status --month 2026-04

# Show configured provider status
npx markos llm:providers
```

Architecture and operator setup guides:
- `docs/LLM-BYOK-ARCHITECTURE.md`
- `docs/OPERATOR-LLM-SETUP.md`

---

## Marketing Literacy Base (Phase 32)

MarkOS now supports a standards literacy layer for reusable marketing tactics and benchmarks.

- Vector namespace pattern: `markos-standards-{discipline}` (global standards scope)
- Relational table: `markos_literacy_chunks` (canonical/superseded lifecycle)
- Retrieval contract: canonical-first filters with optional `business_model`, `funnel_stage`, and `content_type`

### Admin CLIs

```bash
# Ingest markdown standards corpus
node bin/ingest-literacy.cjs --path literacy --dry-run
node bin/ingest-literacy.cjs --path literacy --verbose

# Query and lifecycle management
node bin/literacy-admin.cjs query --discipline Paid_Media --query "b2b hook" --business_model B2B --topK 5
node bin/literacy-admin.cjs deprecate --doc_id META-PAID-SOCIAL-META-B2B-SaaS-v1.2
```

### Admin HTTP Endpoints

- `GET /admin/literacy/health`
- `POST /admin/literacy/query`

Both endpoints require header `x-markos-admin-secret` matching `MARKOS_ADMIN_SECRET`.

---

## GSD Co-existence

MarkOS detects and installs alongside existing GSD without touching any GSD files. Both protocols share `.agent/` and run in parallel, but MarkOS now uses `.agent/markos/` as the canonical protocol path.

---

## Customization

Place client overrides in `.markos-local/` — this is the canonical override path for MarkOS v3+.

  - **MIR overrides**: `.markos-local/MIR/` (JIT-cloned on first POST /approve)
  - **Onboarding config**: `onboarding/onboarding-config.json` (port, auto_open_browser, vector_endpoint)
  - **Project state**: `.markos-project.json` (written once, never regenerated)

See `.agent/markos/MARKOS-INDEX.md` for full documentation on the current protocol layout.

---

## Compatibility Surfaces


MarkOS is the canonical product name. The following legacy identifiers remain intentionally supported for compatibility only (not user-facing):

- `.agent/markos/` and `MARKOS-INDEX.md` filenames (filesystem compatibility)
- `.markos-local/`, `.markos-project.json`, and `.markos-install-manifest.json`
- `markos-*` vector namespace prefixes and historical agent id spellings where still referenced
- Environment and telemetry keys documented in `onboarding/backend/runtime-context.cjs` and Phase 23 compatibility artifacts

Public instructions, install commands, onboarding copy, and primary documentation should use MarkOS-first language.

---

## Runtime Modes

Phase 24 hardened onboarding runtime behavior around explicit local versus hosted constraints:

- Local server mode (`node onboarding/backend/server.cjs`): full onboarding flow, including local filesystem persistence and approve/write operations.
- Hosted/API-wrapper mode (`api/*.js`): shared config/status/submit/regenerate behavior via the same handlers, but local approve/write persistence is intentionally guarded.
- Hosted approve behavior: returns `501 LOCAL_PERSISTENCE_UNAVAILABLE` when local filesystem persistence is unavailable.

If you need hosted approve/write durability, add a dedicated persistence backend and treat local disk writes as unsupported in hosted runtimes.

---

## Rollout Hardening Policy (Phase 31)

The rollout hardening contract for v2.2 is operationally gated and test-backed.

### Endpoint Reliability SLOs

| Endpoint | Tier | Availability SLO (30d) | p95 latency target | Error budget policy |
|----------|------|-------------------------|--------------------|---------------------|
| POST /submit | critical | >= 99.5% | <= 1500ms excluding upstream LLM latency | Freeze non-critical rollout changes if budget exceeds 25% mid-window |
| POST /approve | critical | >= 99.9% | <= 900ms for local write path | Block release promotion if local persistence regressions occur |
| POST /linear/sync | standard | >= 99.0% | <= 1200ms excluding Linear API latency | Treat setup/auth failures as operational incidents with immediate fallback |
| POST /campaign/result | standard | >= 99.5% | <= 800ms | Any winners-catalog write regression blocks rollout progression |

Runtime telemetry emits `rollout_endpoint_observed` for these endpoints with stable payload keys:
- `endpoint`, `endpoint_tier`, `slo_target_availability`, `slo_target_p95_ms`
- `outcome_state`, `status_code`, `duration_ms`, `runtime_mode`, `project_slug_hash`

### Security and Retention Boundaries

- Hosted wrappers for config/status/migration require scoped Supabase bearer auth and fail fast when `MARKOS_SUPABASE_AUD` is unset.
- Hosted approve/write behavior intentionally refuses local persistence (`LOCAL_PERSISTENCE_UNAVAILABLE`) to avoid ambiguous disk writes.
- Local compatibility artifacts under `.markos-local/` remain excluded from git commits.
- Migration operations remain replay-safe and deterministic under dry-run/idempotent checks.
- Secret, token, and auth-like payload keys are redacted as `[REDACTED]` before telemetry and error-path logging.
- Retention policy is fixed and code-backed: `server_logs_days=14`, `rollout_reports_days=30`, `migration_checkpoint_days=90`.

### Migration Rollout Promotion Contract

`MARKOS_ROLLOUT_MODE` is the single source of truth and supports only:
- `dry-run`
- `dual-write`
- `cloud-primary`

Promotion path is strict: `dry-run -> dual-write -> cloud-primary`.

Write-mode promotions require an approved checkpoint record in `.planning/phases/31-rollout-hardening/31-MIGRATION-CHECKPOINTS.json` with owner sign-off, verification reference, and rollback metadata.

### Compatibility Deprecation Gates

Legacy MARKOS compatibility surfaces are retired by operator decision, not by an automatic gate unlock.

Recommended evidence inputs include:
1. Phase verification suites remain green for onboarding and protocol guardrails.
2. MarkOSDB migration dry-run determinism and replay-idempotent behavior are stable.
3. Hosted project-scoped auth boundaries are enforced in production wrappers.
4. Downstream client projects confirm cloud-canonical storage readiness.

There is no hard minimum evidence count before retirement. Operators record each retirement decision in `.planning/phases/31-rollout-hardening/31-COMPATIBILITY-DECISIONS.json` (including optional `evidence_refs`).

---

## Memory Namespace Contract (Phase 26)

- Project isolation root: `project_slug` from `.markos-project.json`.
- Canonical write target: `{prefix}-{project_slug}-{section|drafts|meta}` (default prefix: `markos`).
- Compatibility reads: probe canonical prefix first, then `markos`, then `markos` (legacy).
- Migration safety boundary: runtime flows only perform compatibility reads; destructive namespace migration stays explicit and manual.

Health semantics exposed by `/status` and `vector-store-client.cjs`:`r`n`r`n- `providers_ready`: Supabase + Upstash checks passed.`r`n- `providers_degraded`: one or more providers are configured but not reachable.`r`n- `providers_unconfigured`: required provider environment variables are missing.`r`n`r`nThese states indicate whether memory-backed features are fully available or degraded, and whether action is needed on credentials or connectivity.

---

## Residual Onboarding Warning Behavior

The onboarding pipeline now uses explicit outcome states (`success`, `warning`, `degraded`, `failure`) for regenerate and approve operations.

- `warning`: operation succeeded with merge fallback inserts and/or persistence warnings.
- `degraded`: output exists but came from fallback content because a provider was unavailable.
- `failure`: output was not persisted and requires operator action.

Intentional residual behavior that remains for now:
- Header-fallback append in `write-mir.cjs` when a target heading does not exist in the template.
- Static fallback draft text from `llm-adapter.cjs` when AI providers are unavailable.
- Local persistence guard for hosted mode (`LOCAL_PERSISTENCE_UNAVAILABLE`).

These states are expected during partial infrastructure outages and should not be treated as silent success.

---

## Onboarding-to-Execution Handoff Contract (Phase 27)

Onboarding approval and execution readiness are intentionally separate:

- Onboarding completion: `POST /approve` writes approved drafts to `.markos-local/MIR/`.
- Execution readiness: all required approved sections and winners anchors are present.

Required approved sections:
- `company_profile`
- `mission_values`
- `audience`
- `competitive`
- `brand_voice`
- `channel_strategy`

Required winners anchors:
- `.markos-local/MSP/Paid_Media/WINNERS/_CATALOG.md`
- `.markos-local/MSP/Lifecycle_Email/WINNERS/_CATALOG.md`
- `.markos-local/MSP/Content_SEO/WINNERS/_CATALOG.md`
- `.markos-local/MSP/Social/WINNERS/_CATALOG.md`
- `.markos-local/MSP/Landing_Pages/WINNERS/_CATALOG.md`

If any prerequisite is missing, execution readiness remains blocked and downstream execution should pause.

### Execution Telemetry (Actionable Checkpoints)

Telemetry is intentionally narrow and checkpoint-based:

- `approval_completed`
- `execution_readiness_ready`
- `execution_readiness_blocked`
- `execution_failure`
- `execution_loop_completed`
- `execution_loop_abandoned`

These events are designed for operational decisions (ready vs blocked, completed vs abandoned) and failure diagnosis, not broad usage volume tracking.

---

## License

MIT

