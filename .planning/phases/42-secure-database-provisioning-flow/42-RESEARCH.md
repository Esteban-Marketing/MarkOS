# Phase 42: Secure Database Provisioning Flow - Research

**Researched:** 2026-04-01
**Domain:** Safe Supabase + Upstash provisioning, migration execution, and runtime readiness guarantees
**Confidence:** HIGH

## Summary

Phase 42 should be implemented as a provisioning command and library layer that extends current runtime contracts without introducing destructive behavior. The repository already has the key primitives required for this phase: provider health checks (`vector-store-client.healthCheck()`), Supabase/Upstash client wiring, migration SQL assets, `.env` loading in CLI/runtime, and admin/health endpoints. What is missing is a guided setup flow, migration tracking, explicit RLS verification, namespace isolation auditing, and a post-setup health snapshot artifact.

The safest execution pattern is: interactive credential capture -> credential validation probes -> idempotent migration execution with `markos_migrations` tracking -> RLS/policy verification -> namespace isolation checks -> structured report. The command must stop on first failing migration and never execute `DROP`/destructive paths. This matches milestone v3.0 technical requirements and existing codebase reliability patterns.

**Primary recommendation:** Implement `bin/db-setup.cjs` as the canonical entrypoint and keep migration/provisioning internals in `onboarding/backend/provisioning/` modules so tests can mock each stage independently.

## Goal and Requirements Mapping

### Goal (source-mapped)
- Roadmap source (`.planning/ROADMAP.md`): Phase 42 belongs to v3.0 literacy-system sequence (planned milestone), and depends on Phase 39 corpus + vector/runtime surfaces.
- Milestone source (`.planning/milestones/v3.0-LITERACY-SYSTEM-ROADMAP.md`): implement guided, safe DB connection + provisioning flow that validates credentials, provisions required schema and policies idempotently, verifies isolation, and emits health evidence.

### Requirements Map (roadmap + milestone technical requirements)

| ID | Requirement | Source | Research support |
|----|-------------|--------|------------------|
| LIT-09 | Guided setup command for Supabase + Upstash credentials (`npx markos db:setup`) | v3.0 milestone (Phase 42 objective + tech requirements) | CLI architecture and parser extension points are already present in `bin/install.cjs` + `bin/cli-runtime.cjs`. |
| LIT-10 | Idempotent migration runner with `markos_migrations` tracking and stop-on-failure behavior | v3.0 milestone (Phase 42 technical requirements) | Existing SQL migration directory and Supabase client wiring support ordered execution and state tracking. |
| LIT-11 | RLS verification and anon-access denial checks on literacy tables | v3.0 milestone (Phase 42 key components) | Existing RLS patterns in migrations and current health/config/status endpoints provide integration surface for evidence reporting. |
| LIT-12 | Namespace isolation audit and post-setup structured health snapshot | v3.0 milestone (Phase 42 key components) | `buildStandardsNamespaceName()` and `vectorStore.healthCheck()` already expose most required checks. |

Notes:
- `.planning/ROADMAP.md` currently enumerates detailed plans through Phase 41; Phase 42 details are canonical in `.planning/milestones/v3.0-LITERACY-SYSTEM-ROADMAP.md`.
- No separate `.planning/REQUIREMENTS.md` was found in workspace for v3.0 IDs, so IDs above are phase-local for planning traceability.

## Project Constraints (from CLAUDE.md)

- Read order for repo context: `.protocol-lore/QUICKSTART.md` -> `.protocol-lore/INDEX.md` -> `.planning/STATE.md` -> `.agent/markos/MARKOS-INDEX.md`.
- Treat `.planning/STATE.md` as canonical live mission state.
- Respect GSD vs MarkOS split; client overrides stay in `.markos-local/` only.
- Primary CLI is `npx markos`.
- Test commands are `npm test` or `node --test test/**/*.test.js`.
- Local onboarding UI entrypoint is `node onboarding/backend/server.cjs`.

## Standard Stack

### Core
| Library | Version (verified) | Purpose | Why standard here |
|---------|--------------------|---------|-------------------|
| Node.js | `v22.13.0` local (`>=20.16.0` required in `package.json`) | CLI runtime + tests | Existing project baseline and test stack |
| `@supabase/supabase-js` | `2.101.1` (npm latest check) | SQL execution + policy/table probes | Already used by `vector-store-client.cjs` |
| `@upstash/vector` | `1.2.3` (npm latest check) | namespace probes and health checks | Already used in vector runtime |
| `dotenv` | `17.4.0` (npm latest check) | `.env` loading for CLI/runtime | Already loaded in `bin/cli-runtime.cjs` |

### Supporting
| Library | Version | Purpose | When to use |
|---------|---------|---------|-------------|
| `node:readline` | built-in | interactive prompt wizard | credential collection in `db:setup` |
| `node:test` + `node:assert` | built-in | provisioning tests | command behavior, migration safety, and verification checks |

### Alternatives Considered
| Instead of | Could use | Tradeoff |
|------------|-----------|----------|
| handwritten SQL split/runner | Supabase CLI migration engine | CLI dependency and environment complexity; repo already uses Node-first runtime clients |
| writing credentials only to process env | external secret manager bootstrap | out of scope for this phase; `.env` contract already exists in project |
| one-shot install integration only | standalone `bin/db-setup.cjs` + optional install handoff | standalone command is easier to test and rerun safely |

## Architecture and Integration Points

### Recommended structure

```text
bin/
├── install.cjs                        # parse/route db:setup command
├── cli-runtime.cjs                    # reuse env loading + node guards
└── db-setup.cjs                       # NEW: guided setup command

onboarding/backend/provisioning/
├── migration-runner.cjs               # NEW: ordered SQL apply + markos_migrations tracking
├── rls-verifier.cjs                   # NEW: verify RLS enabled + anon denial checks
└── namespace-auditor.cjs              # NEW: standards namespace/isolation checks

onboarding/backend/
└── vector-store-client.cjs            # existing healthCheck + namespace helpers

supabase/migrations/
└── *.sql                              # existing source of truth migrations
```

### Existing integration seams to use
- `bin/install.cjs` + `bin/cli-runtime.cjs`: command parsing, env loading, node version gates, and install/readiness output conventions.
- `onboarding/backend/vector-store-client.cjs`:
  - `healthCheck()` already validates Supabase table query and Upstash `__health__` namespace probe.
  - `buildStandardsNamespaceName(discipline)` already enforces standards namespace naming.
- `onboarding/backend/runtime-context.cjs`: runtime secret matrix and config behavior can be reused for validation logic.
- `supabase/migrations/*.sql`: existing migration baseline; Phase 42 should add new migration(s), not rewrite history.

### Proposed execution flow
1. `npx markos db:setup` starts interactive wizard (or non-interactive flags if provided).
2. Validate credentials with live probes:
   - Supabase: lightweight query (`SELECT 1`) via RPC/sql path.
   - Upstash: `__health__` namespace query.
3. Persist credentials to `.env` only (never print values).
4. Run migration runner in lexical order with tracking table `markos_migrations`.
5. Verify RLS and policies on target tables.
6. Audit namespace isolation and standards namespace access assumptions.
7. Emit structured health snapshot JSON and concise terminal summary.

## Constraints and Invariants

- Non-destructive invariant: Phase 42 must never drop tables/policies or truncate data.
- Idempotency invariant: rerunning provisioning should be safe with no duplicate schema side effects.
- Secret safety invariant: credentials are written to `.env` only and always redacted in logs/errors.
- Ordering invariant: migrations apply in deterministic order from `supabase/migrations`.
- Fail-fast invariant: any migration failure stops execution and reports exact migration file.
- Isolation invariant: standards namespaces must remain `markos-standards-{discipline}` and client data must remain slug-scoped collections.
- Hosted/local compatibility invariant: do not break existing runtime mode checks in `runtime-context.cjs`.

## Don't Hand-Roll

| Problem | Don't build | Use instead | Why |
|---------|-------------|-------------|-----|
| DB/network health probing | custom HTTP probe layer | existing Supabase + Upstash clients in `vector-store-client.cjs` | already battle-tested in runtime and tests |
| namespace naming logic | ad hoc string formatting | `buildStandardsNamespaceName()` | avoids drift and invalid namespace bugs |
| env loading rules | custom parser | `dotenv` + existing `loadProjectEnv` pattern | project-standard behavior |
| test harness plumbing | bespoke stubs | `withMockedModule()` from `test/setup.js` | existing deterministic mocking pattern |

## Runtime State Inventory

| Category | Items found | Action required |
|----------|-------------|------------------|
| Stored data | Existing tables include `markos_literacy_chunks`, `markos_artifacts`, and others from prior phases; no `markos_migrations` tracker table exists yet in repo SQL history. | Add `markos_migrations` table migration and ensure runner writes applied records (data migration for metadata only). |
| Live service config | Supabase RLS/policies and Upstash namespaces live externally; repo does not contain current provider state. | Add verification probes and report external state after setup; operator action required for external misconfigurations. |
| OS-registered state | No repo evidence of Task Scheduler/pm2/systemd/launchd registrations tied to Phase 42. | None - verified via workspace scan. |
| Secrets/env vars | Required env keys: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `UPSTASH_VECTOR_REST_URL`, `UPSTASH_VECTOR_REST_TOKEN`; local shell currently has these unset. | Wizard must capture and persist securely to `.env`; no rename migration required. |
| Build artifacts | No provisioning-specific installed artifact requiring rename/reinstall found. | None. |

## Common Pitfalls and Mitigations

### Pitfall 1: partial migration apply with no checkpoint
- What goes wrong: setup succeeds for early SQL files then fails later, leaving unknown state.
- Why: no migration ledger table.
- Mitigation: create and require `markos_migrations`; record file checksum + applied_at transactionally.
- Warning signs: repeated failures on same file without clear applied-state report.

### Pitfall 2: RLS enabled but effectively permissive
- What goes wrong: table has RLS turned on but policy allows broader access than expected.
- Why: policy checks not validated post-provision.
- Mitigation: explicit verification query for table RLS flags and controlled anon-access tests.
- Warning signs: health shows green but policy probe reveals anon readable rows.

### Pitfall 3: namespace drift between provisioning and runtime
- What goes wrong: setup checks one namespace shape while runtime queries another.
- Why: duplicated namespace construction logic.
- Mitigation: route all checks through `buildStandardsNamespaceName()` and shared slug normalization.
- Warning signs: ingestion succeeds but retrieval returns empty across disciplines.

### Pitfall 4: secret leakage in logs
- What goes wrong: service role key or token appears in stdout/error traces.
- Why: naive error serialization.
- Mitigation: reuse redaction strategy from `runtime-context.cjs` and never echo entered secrets.
- Warning signs: setup failure logs contain long token-like strings.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node built-in `node:test` + `node:assert/strict` |
| Config file | none required (repo standard) |
| Quick run command | `node --test test/db-setup.test.js -x` |
| Full suite command | `npm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test type | Automated command | File exists? |
|--------|----------|-----------|-------------------|-------------|
| LIT-09 | interactive setup flow collects/validates credentials and writes `.env` safely | unit/integration | `node --test test/db-setup.test.js -x` | ❌ Wave 0 |
| LIT-10 | migration runner applies only pending files and records `markos_migrations` | unit | `node --test test/migration-runner.test.js -x` | ❌ Wave 0 |
| LIT-11 | RLS verification fails when policies are missing/incorrect | unit | `node --test test/rls-verifier.test.js -x` | ❌ Wave 0 |
| LIT-12 | namespace audit + health snapshot returns structured status | unit/integration | `node --test test/db-setup.test.js -x` | ❌ Wave 0 |

### Sampling Rate
- Per task commit: `node --test test/db-setup.test.js -x` (or task-specific file)
- Per wave merge: `node --test test/**/*.test.js`
- Phase gate: `npm test`

### Wave 0 Gaps
- [ ] `test/db-setup.test.js` - command flow, secret redaction, `.env` write behavior
- [ ] `test/migration-runner.test.js` - ordering, checkpointing, stop-on-failure, idempotent rerun
- [ ] `test/rls-verifier.test.js` - table/policy checks and anon denial assertions
- [ ] `test/namespace-auditor.test.js` - standards namespace and slug isolation checks

## Planning-Ready Wave/Task Decomposition

### Wave 0: Test and contract scaffolding
- T42-00-01: Add failing tests for CLI setup flow and redaction guarantees.
- T42-00-02: Add failing tests for migration runner idempotency and stop-on-failure.
- T42-00-03: Add failing tests for RLS and namespace isolation verification.

### Wave 1: Provisioning command and credential validation
- T42-01-01: Extend CLI command routing (`install.cjs`/`cli-runtime.cjs`) to support `db:setup`.
- T42-01-02: Implement `bin/db-setup.cjs` interactive wizard with secure prompt handling.
- T42-01-03: Implement provider connectivity checks (Supabase `SELECT 1`, Upstash `__health__` probe).
- T42-01-04: Persist `.env` safely and enforce `.gitignore` entries.

### Wave 2: Migration execution engine
- T42-02-01: Implement `migration-runner.cjs` to read and execute ordered SQL migration files.
- T42-02-02: Add `markos_migrations` tracking schema and checksum recording.
- T42-02-03: Implement idempotent skip logic + explicit failure reporting format.

### Wave 3: Security/isolation verification and reporting
- T42-03-01: Implement `rls-verifier.cjs` for table RLS enabled + anon denial checks.
- T42-03-02: Implement `namespace-auditor.cjs` for standards/client namespace invariants.
- T42-03-03: Generate structured health snapshot artifact and terminal summary output.

### Wave 4: Integration and documentation
- T42-04-01: Hook health snapshot into existing diagnostics surface where appropriate.
- T42-04-02: Add operator runbook updates for `npx markos db:setup` + rerun safety.
- T42-04-03: Run full test suite and capture verification notes.

## Environment Availability

| Dependency | Required by | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | CLI/runtime execution | ✓ | 22.13.0 | — |
| npm/npx | command execution and scripts | ✓ | 10.9.2 | — |
| Supabase CLI | optional operator tooling | ✓ | 2.75.0 | Not required (Node client path available) |
| PostgreSQL `psql` | optional manual validation | ✓ | 18.3 | Use Supabase client checks |
| Docker | optional local infra workflows | ✗ | — | Not required for this phase |
| Supabase credentials in env | live provider validation | ✗ | — | collect via setup wizard and write `.env` |
| Upstash credentials in env | live provider validation | ✗ | — | collect via setup wizard and write `.env` |

Missing dependencies with no fallback:
- None (wizard-driven credential capture can provision required env state).

Missing dependencies with fallback:
- Docker absent (no direct impact for Phase 42 implementation).
- Env secrets currently unset (resolved by setup wizard flow).

## State of the Art

| Old approach | Current approach | When changed | Impact |
|--------------|------------------|--------------|--------|
| Manual credential setup + ad hoc health checks | Guided setup with deterministic probes, tracked migrations, and explicit RLS/isolation verification | Planned in v3.0 Phase 42 | Reduces operator error and prevents silent insecure configurations |
| Runtime-only readiness checks | Provisioning-time + runtime verification chain | Planned in v3.0 | Faster setup diagnostics and safer onboarding activation |

Deprecated/outdated:
- Purely manual DB/vector provisioning without migration tracking should be treated as legacy once Phase 42 ships.

## Open Questions

1. Should `db:setup` be implemented as a direct subcommand of `markos` (`npx markos db:setup`) or as `node bin/db-setup.cjs` invoked by install routing only?
   - What we know: package `bin` maps `markos` -> `bin/install.cjs`, which currently handles only `install`/`update`.
   - What is unclear: expected CLI UX for operator docs and backward compatibility.
   - Recommendation: support both, with `install.cjs` as canonical router.

2. Which exact tables should RLS verification include beyond literacy tables?
   - What we know: milestone names literacy tables plus artifacts/index config tables.
   - What is unclear: whether Phase 42 should enforce checks across all MarkOS tables or only literacy system scope.
   - Recommendation: start with Phase 42 target tables and report additional table checks as informational.

3. Should health snapshots be persisted to disk (for audits) or returned only to stdout/API response?
   - What we know: current health checks return JSON payloads but no persisted artifact file.
   - What is unclear: required audit retention format.
   - Recommendation: persist a timestamped JSON report under `.markos-local/ops/` and print summary to stdout.

## Sources

### Primary (HIGH confidence)
- `.planning/milestones/v3.0-LITERACY-SYSTEM-ROADMAP.md` - Phase 42 objective, components, and technical requirements
- `.planning/ROADMAP.md` - milestone/phase mapping and dependency context
- `onboarding/backend/vector-store-client.cjs` - health check, namespace helpers, provider integration
- `onboarding/backend/runtime-context.cjs` - secret matrix, runtime mode contracts, redaction utilities
- `bin/install.cjs` and `bin/cli-runtime.cjs` - CLI command surface and env loading behavior
- `.planning/phases/32-marketing-literacy-base/32-LITERACY-SUPABASE.sql` - existing literacy schema + RLS baseline
- `supabase/migrations/37_markos_ui_control_plane.sql` - existing migration and policy style
- `test/vector-store-client.test.js` and `test/setup.js` - current testing pattern and mocks

### Secondary (MEDIUM confidence)
- Local environment dependency probes (Node/npm/npx/git/supabase-cli/psql availability and env-var presence)

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - validated against package/runtime files and npm registry checks.
- Architecture/integration: HIGH - mapped directly to existing command/runtime code.
- Pitfalls/mitigations: MEDIUM-HIGH - derived from current failure surfaces and required phase behaviors.

**Research date:** 2026-04-01
**Valid until:** 2026-05-01
