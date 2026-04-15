# Phase 100: CRM Schema and Identity Graph Foundation - Research

**Researched:** 2026-04-14  
**Domain:** Tenant-safe CRM schema, identity graph governance, and merge lineage  
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

### Canonical record model
- **D-01:** CRM remains the operational system of record for contacts, companies, accounts, customers, deals, tasks, notes, and activities; telemetry and campaigns enrich this model but do not replace it.
- **D-02:** Reuse and extend the existing contract-first CRM shape already present in the repo instead of introducing a parallel data model or a separate graph database.
- **D-03:** Every material CRM record must carry tenant scope, stable identifiers, audit timestamps, and explicit status fields so later phases can compute lifecycle state safely.

### Identity graph and merge governance
- **D-04:** Identity stitching must be confidence-aware and fail closed when evidence is ambiguous; Phase 100 should provide the lineage and review primitives, not permissive auto-merge behavior.
- **D-05:** Merge actions are governance events with immutable evidence and reversible lineage, following the established review-first merge pattern already used in the repo.
- **D-06:** Anonymous-to-known linking belongs at the boundary of the identity graph, but high-volume behavioral stitching logic is deferred to Phase 101.

### Custom fields and metadata
- **D-07:** Custom fields stay explicit, object-scoped, and validated through shared CRM contracts rather than loose JSON sprawl.
- **D-08:** Workspace metadata and pipeline configuration primitives may be preserved where already available, but Phase 100 should focus on the foundational schema and validation surfaces rather than full pipeline UX.

### Security and audit guarantees
- **D-09:** All reads and writes must stay tenant-scoped and fail closed when auth context is missing or mismatched.
- **D-10:** Audit history, source references, actor metadata, and timestamps are mandatory for merges and material CRM mutations because later reporting and AI recommendations depend on this provenance.

### Claude's Discretion
- Final table or module layout, naming normalization, and migration packaging can follow the repo’s existing CRM conventions.
- Exact helper boundaries may be adjusted during planning so long as tenant isolation, auditability, and merge governance remain locked.

### Deferred Ideas (OUT OF SCOPE)
- High-volume behavioral event normalization and anonymous-session stitching logic — Phase 101.
- Kanban, calendar, forecast, and record-detail operator views — Phase 102.
- Sales/success playbooks, next-best-action ranking, and queue logic — Phase 103.
- Native outbound sending and conversation telemetry — Phase 104.
- AI-generated CRM summaries, recommendations, and reporting closeout — Phase 105.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CRM-01 | Canonical contacts, companies, accounts, customers, deals, tasks, and activities exist as tenant-safe first-class records with audit history and custom fields. | Reuse the existing Phase 58 SQL tables, contract validators, entity helpers, and explicit custom-field tables; close parity gaps with additive migrations and tests. |
| CRM-02 | Identity resolution supports dedupe, merge review, reversible lineage, and confidence-aware stitch decisions. | Reuse the existing identity scoring, merge-decision, and lineage model; preserve review-first behavior and add tests around ambiguous-link handling and reversibility. |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- Prefer the existing MarkOS architecture and extend current seams instead of replatforming.
- Primary install/update path stays through `npx markos`; test verification stays through `npm test` or `node --test`.
- Local onboarding/runtime conventions already exist; Phase 100 should stay inside repo conventions and tenant-governed patterns.

## Summary

Phase 100 should **not** invent a new CRM subsystem. The repo already contains the foundation this phase needs: canonical CRM contracts, entity normalization helpers, merge-lineage helpers, tenant-aware API guards, historical Supabase migrations, and passing regression tests. The planner’s job is to reactivate and harden these seams into one clearly scoped, execution-ready foundation for CRM-01 and CRM-02.

The most important planning insight is that the repo already models the right primitives, but they are spread across historical Phase 58 artifacts and mixed TS/CJS module surfaces. The plan should focus on **consolidation, additive migration deltas, contract parity, and guardrail coverage** rather than net-new architecture.

**Primary recommendation:** Use the existing Supabase + contract-first CRM stack, ship additive Phase 100 hardening around schema parity and merge governance, and defer all operator workspace, tracking volume, outbound, and copilot behavior to later phases.

## Existing Reusable Code

| Asset | What already exists | Planning implication |
|------|----------------------|----------------------|
| `lib/markos/crm/contracts.cjs` | Canonical record kinds, custom-field validation, workspace/pipeline validators | Keep this as the validation anchor; do not create a parallel schema contract layer |
| `lib/markos/crm/entities.cjs` | Normalization, immutable shaping, tenant-safe create/update/list helpers | Reuse for Phase 100 CRUD behavior and parity tests |
| `lib/markos/crm/merge.cjs` | Review-first merge decisions and lineage writes; merged records are marked instead of deleted | This is already the right merge governance pattern for CRM-02 |
| `lib/markos/crm/api.cjs` | Fail-closed tenant context checks, role gates, activity append helper, shared store layout | Reuse the auth boundary rather than designing a new permission model |
| `lib/markos/crm/identity.ts` | Confidence scoring and identity-link creation | Use this as the basis for review/candidate handling, but keep high-volume stitching deferred |
| `supabase/migrations/58_crm_core_entities.sql` | Canonical tenant-scoped tables with RLS and membership-backed policies | Treat this as the schema baseline and add forward-only delta migrations |
| `supabase/migrations/58_crm_custom_fields.sql` | Explicit, object-scoped custom field definition/value tables | Confirms that custom fields should stay typed and governed |
| `supabase/migrations/58_crm_activity_and_identity.sql` | Activity ledger, identity links, merge decisions, merge lineage with RLS | Already provides the ledger and lineage boundary for this phase |
| `test/crm-schema/crm-core-entities.test.js` | Verifies core entities, RLS expectations, and fail-closed contract behavior | Keep this in Wave 0 and extend it for uncovered guardrails |

## Standard Stack

### Core
| Library / System | Version | Purpose | Why Standard for Phase 100 |
|---------|---------|---------|--------------|
| Supabase Postgres + SQL migrations | Existing repo baseline; CLI verified locally at 2.75.0 | Canonical CRM tables, RLS, policies, indexes, lineage tables | Already matches the repo’s tenant-isolation architecture and historical CRM implementation |
| `@supabase/supabase-js` | Repo-pinned `^2.58.0` | Application access layer for tenant-safe CRM surfaces | Already adopted in the repo; no new DB client is needed |
| Node.js built-in test runner | Verified locally at 22.13.0 | Regression and negative-path verification | Fast, already configured, and sufficient for phase-level coverage |
| Contract-first CRM modules in `lib/markos/crm/` | Existing repo code | Validation, normalization, merge governance | Reuse lowers risk and keeps plan execution focused |

### Supporting
| Component | Purpose | When to Use |
|-----------|---------|-------------|
| Explicit custom-field definition/value tables | Governed extensibility | Use for object-scoped CRM metadata instead of free-form JSON sprawl |
| CRM activity ledger | Shared audit/evidence rail | Keep as the foundation boundary only; detailed stitching is Phase 101 |
| Merge decisions + merge lineage | Immutable merge evidence | Use for all accepted or rejected identity merge actions |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Existing Postgres + lineage tables | Separate graph database | Adds complexity and violates the milestone’s non-replatform rule |
| Explicit custom field tables | Unbounded per-record JSON fields | Faster initially, but harder to validate, query, and govern |
| Review-first merge model | Silent auto-merge dedupe | Lower effort, but too risky for tenant-safe customer identity |

**Installation:** No new dependency is recommended for Phase 100. Reuse the repo’s current stack.

## Architecture Patterns

### Recommended Project Structure
```text
lib/markos/crm/
├── contracts.*      # canonical validators and allowed kinds
├── entities.*       # entity normalization and CRUD helpers
├── identity.*       # confidence scoring and identity-link primitives
├── merge.*          # merge decisions and lineage
└── api.*            # tenant and role boundaries

supabase/migrations/
├── 58_crm_core_entities.sql
├── 58_crm_custom_fields.sql
├── 58_crm_activity_and_identity.sql
└── 100_*            # additive hardening / compatibility deltas for this phase

test/
├── crm-schema/
├── crm-api/
└── tenant-auth/
```

### Pattern 1: Contract-first entity validation
**What:** Validate record kinds, custom fields, and required identifiers before persistence.
**When to use:** All entity creation, patching, and custom-field writes.
**Why it matters:** The repo already depends on a shared validation surface; duplicating validation elsewhere will create drift.

### Pattern 2: Tenant scope on every primitive
**What:** Every material CRM and identity record carries `tenant_id`, stable IDs, audit timestamps, and deny-by-default auth checks.
**When to use:** Schema design, API handlers, merges, and tests.
**Why it matters:** This is the core safety boundary for CRM-01 and CRM-02.

### Pattern 3: Review-first identity governance
**What:** Confidence scoring may suggest links, but ambiguous cases stay in review and accepted merges emit immutable lineage.
**When to use:** Identity links and dedupe workflows.
**Why it matters:** This prevents false-positive customer merges from becoming destructive.

### Pattern 4: Additive migrations, not historical rewrite
**What:** Treat the existing Phase 58 migrations as already-shipped historical artifacts and layer Phase 100 deltas on top.
**When to use:** Any schema hardening, enum alignment, indexes, or compatibility cleanup.
**Why it matters:** Editing old migrations is risky and makes deployed environments harder to reconcile.

### Anti-Patterns to Avoid
- **Separate graph DB now:** out of scope and unnecessary for the required lineage model.
- **Loose JSON for all metadata:** violates D-07 and weakens querying and validation.
- **Silent auto-merge:** conflicts with D-04/D-05 and the repo’s current review-first helpers.
- **Building Phase 101 in Phase 100:** detailed event stitching and timeline expansion should be deferred.

## Required Schema Primitives

### Canonical CRM entities
| Primitive | Current evidence in repo | Minimum implementation requirement |
|-----------|--------------------------|------------------------------------|
| Contacts | `crm_contacts` | Tenant-scoped people records with stable entity IDs and lifecycle fields |
| Companies | `crm_companies` | Canonical organization records keyed to tenant and domain/legal identity |
| Accounts | `crm_accounts` | Commercial ownership / health boundary for B2B relationships |
| Customers | `crm_customers` | Post-sale customer record keyed to account/contact lineage |
| Deals | `crm_deals` | Pipeline object with stage, amount, and close metadata |
| Tasks | `crm_tasks` | Actionable work item linked to another CRM record |
| Notes | `crm_notes` | Auditable contextual note linked to another CRM record |
| Activities | `crm_activity_ledger` | Shared immutable evidence rail; not a generic record kind in the current contract |

### Metadata and extensibility
| Primitive | Current evidence in repo | Guardrail |
|-----------|--------------------------|-----------|
| Custom field definitions | `crm_custom_field_definitions` | Object-scoped and typed |
| Custom field values | `crm_custom_field_values` | Unique per tenant, field, and entity |
| Stable canonical identifier | `entity_id` across core tables | Must stay consistent across helpers and contracts |
| Audit columns | `created_at`, `updated_at`, `created_by`, `updated_by` | Required for later provenance and reporting |

### Identity and lineage
| Primitive | Current evidence in repo | Guardrail |
|-----------|--------------------------|-----------|
| Identity links | `crm_identity_links` + `createIdentityLink` | Confidence-aware and reviewable |
| Merge decisions | `crm_merge_decisions` | Immutable evidence of accepted/rejected merge action |
| Merge lineage | `crm_merge_lineage` | Preserve source-to-canonical history |
| Merged marker on source rows | `merged_into` plus merged status in helpers | Never hard-delete source history during merge |

## Identity / Merge Guardrails

1. **Fail closed on ambiguity.** The current repo decisions and code pattern support review-first merges; keep that behavior.
2. **Do not auto-merge from low-confidence signals.** Current scoring in `identity.ts` only recommends acceptance at high confidence.
3. **Lineage must be immutable.** Accepted and rejected decisions should remain auditable and source references must be preserved.
4. **Merged records should be marked, not erased.** The current helper model updates status to `merged` and sets `merged_into`.
5. **Separate candidate links from accepted merges.** Identity linking and record merge are different actions and should stay different.

### Important parity gap found during research
There is a concrete implementation mismatch the planner should address early:

- The in-repo identity helper allows link status values of `candidate`, `accepted`, `review`, and `rejected`.
- The existing SQL migration for `crm_identity_links` currently checks only `candidate`, `accepted`, and `rejected`.

**Planning implication:** add an early parity task to reconcile the schema and code so the review queue state is first-class and tested.

## Migration Strategy

### Recommended approach
Use **forward-only, additive migration deltas** for Phase 100 rather than rewriting the historical Phase 58 SQL.

### Why
- The repo already contains the base CRM foundation schema.
- The current tests prove these artifacts exist and are still part of the contract surface.
- Additive migrations are safer for deployed or partially deployed environments.

### Migration priorities
1. **Parity cleanup:** align enum/check constraints and helper expectations, especially around identity review states.
2. **Audit completeness:** ensure all material tables have actor and timestamp fields needed by D-10.
3. **Constraint hardening:** preserve unique keys, foreign keys, and tenant-partition indexes.
4. **Compatibility surface:** if old and new module paths differ, add thin compatibility helpers rather than duplicate logic.

### Do not do in Phase 100
- Do not ship large data backfills for high-volume tracking history.
- Do not redesign the activity ledger into a reporting engine.
- Do not introduce workspace or outbound tables beyond the foundational boundary already in repo history.

## Testing Strategy

### Verified current baseline
Local verification on 2026-04-14:
- `node --test test/crm-schema/crm-core-entities.test.js` → **6/6 passing**
- `node --test test/crm-api/crm-merge-api.test.js test/tenant-auth/crm-tenant-isolation.test.js` → **7/7 passing**

### Recommended Phase 100 test additions
| Focus | Why it matters | Suggested test type |
|------|-----------------|---------------------|
| Identity review-state parity | Prevent schema/code drift on ambiguous matches | Unit + SQL contract test |
| Reversible merge lineage | Validate accepted and rejected evidence paths stay queryable | Merge API test |
| Tenant-negative mutation cases | Ensure auth mismatch still fails closed | Tenant isolation test |
| Custom-field validation edges | Prevent object-kind and field-type drift | Contract validation test |
| TS/CJS parity | Current repo contains both surfaces; avoid silent divergence | Smoke regression test |

## Likely Task Breakdown for the Planner

1. **Phase 100 Wave 0 - foundation audit and parity map**
   - Inventory existing CRM Phase 58 artifacts.
   - Identify code/schema mismatches and choose the authoritative execution surface.
   - Add failing tests for uncovered guardrails.

2. **Wave 1 - schema and contract hardening**
   - Add Phase 100 migration deltas.
   - Reconcile enum/constraint drift and audit columns.
   - Confirm custom-field and entity contracts remain canonical.

3. **Wave 2 - identity graph governance hardening**
   - Preserve review-first identity link flow.
   - Ensure merge decisions and lineage are immutable and reversible in practice.
   - Tighten negative-path auth and tenant-scope tests.

4. **Wave 3 - integration closeout for later phases**
   - Expose a stable, minimal foundation for Phase 101 and Phase 102 consumers.
   - Document boundaries so tracking/UI/outbound work does not leak into this phase.

## Recommended Implementation Order

1. **Lock the source of truth:** decide which existing CRM modules and migrations are canonical for execution.
2. **Write failing parity tests:** especially for identity review-state and merge lineage behavior.
3. **Add forward-only schema deltas:** harden the database without editing the old baseline unnecessarily.
4. **Align helper behavior with schema contracts:** make sure entity, identity, and merge modules all agree on allowed states and required fields.
5. **Re-run the focused CRM test slice:** phase-specific green gate before planning closure.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Identity graph foundation | Separate graph database or generic graph layer | Existing identity links + merge lineage tables | The repo already has the required primitives and governance model |
| Custom metadata | Free-form JSON everywhere | Custom field definition/value tables + validators | Keeps schema queryable and safe |
| Dedupe/merge convenience flow | Silent background auto-merge | Review-first merge decisions with evidence | Protects customer identity integrity |
| Cross-tenant authorization | Ad hoc route checks only | RLS + tenant-context guards + negative tests | Defense in depth is already the repo pattern |

**Key insight:** Phase 100 is a hardening and consolidation phase, not a greenfield build.

## Common Pitfalls

### Pitfall 1: Treating historical CRM artifacts as dead code
**What goes wrong:** The planner rebuilds schema or helpers from scratch.  
**Why it happens:** The foundation lives in older Phase 58 artifacts, so it is easy to miss.  
**How to avoid:** Start with reuse inventory and delta planning.

### Pitfall 2: Code/schema drift on allowed states
**What goes wrong:** Identity or merge helpers allow values the SQL layer blocks.  
**Why it happens:** Parallel TS/CJS and SQL surfaces evolve separately.  
**How to avoid:** Add parity tests and consolidate the canonical contract surface.

### Pitfall 3: Blurring Phase 100 with Phase 101+
**What goes wrong:** Tracking ingestion, workspace UI, or outbound complexity expands the phase beyond planable scope.  
**Why it happens:** The activity ledger and identity graph naturally touch later systems.  
**How to avoid:** Keep Phase 100 focused on primitives, lineage, and guardrails only.

### Pitfall 4: Destructive merge semantics
**What goes wrong:** Duplicate rows are deleted or overwritten without reversible evidence.  
**Why it happens:** Convenience dedupe gets prioritized over auditability.  
**How to avoid:** Preserve merged source rows, lineage, rationale, actor, and timestamps.

## Risks

| Risk | Level | Mitigation |
|------|-------|------------|
| SQL and helper parity drift | High | Make this an early Wave 0 and Wave 1 task with explicit tests |
| TS/CJS duplication causing future regressions | Medium | Pick one authoritative implementation path and keep the other as generated/shimmed if needed |
| Scope creep into tracking, workspace, or outbound features | High | Keep execution scoped to CRM-01 and CRM-02 only |
| Cross-tenant data exposure if new tables skip RLS | Critical | Require RLS and membership-backed policies on every Phase 100 table or view |

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Test runner and repo execution | ✓ | 22.13.0 | — |
| npm | Standard repo scripts | ✓ | 10.9.2 | `node --test` directly |
| Supabase CLI | Applying and inspecting SQL migrations locally | ✓ | 2.75.0 | Raw SQL review in repo if CLI use is deferred |

**Missing dependencies with no fallback:** None found for planning and local verification.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js built-in test runner |
| Config file | none — direct `node --test` usage from `package.json` |
| Quick run command | `node --test test/crm-schema/crm-core-entities.test.js` |
| Full phase slice command | `node --test test/crm-schema/*.test.js test/crm-api/crm-merge-api.test.js test/tenant-auth/crm-tenant-isolation.test.js` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CRM-01 | Canonical first-class records, tenant scope, custom fields | unit / schema contract | `node --test test/crm-schema/crm-core-entities.test.js` | ✅ |
| CRM-02 | Merge review, lineage, and tenant-safe identity handling | unit / API / tenant negative | `node --test test/crm-api/crm-merge-api.test.js test/tenant-auth/crm-tenant-isolation.test.js` | ✅ |

### Sampling Rate
- **Per task commit:** run the affected CRM test files plus tenant-negative coverage.
- **Per wave merge:** run the full phase slice command.
- **Phase gate:** CRM-01 and CRM-02 tests green before execution closeout.

### Wave 0 Gaps
- [ ] Add explicit identity review-state parity test for SQL and helper agreement
- [ ] Add TS/CJS parity smoke test if both surfaces remain active
- [ ] Add regression test for non-destructive merge reversal / lineage readback

## Open Questions

1. **Which CRM code surface should be treated as canonical during execution: TS, CJS, or generated parity?**
   - What we know: both surfaces exist and current tests touch multiple representations.
   - What's unclear: whether one is a compatibility shim or both are intended to remain hand-maintained.
   - Recommendation: decide this in Wave 0 and avoid dual-source drift.

2. **Should the identity review state be persisted directly in SQL?**
   - What we know: helper code already uses `review`, but SQL appears narrower.
   - What's unclear: whether review was intentionally omitted or simply not updated.
   - Recommendation: make `review` first-class if the operator review queue remains part of the governed merge flow.

## Sources

### Primary (HIGH confidence)
- Existing repo artifacts under `lib/markos/crm/`, `supabase/migrations/58_*`, and focused CRM tests
- Supabase RLS docs: https://supabase.com/docs/guides/database/postgres/row-level-security
- PostHog identity docs: https://posthog.com/docs/product-analytics/identify
- PostHog anonymous vs identified event guidance: https://posthog.com/docs/data/anonymous-vs-identified-events

### Secondary (MEDIUM confidence)
- `.planning/research/v3.8.0-revenue-crm-customer-intelligence-integration.md`
- `.planning/research/crm-customer-intelligence-risk-brief-2026-04-14.md`

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified from the repo, package metadata, and official docs
- Architecture: HIGH — consistent across repo code, migrations, and milestone research
- Pitfalls: HIGH — backed by concrete parity gaps and passing regression coverage

**Research date:** 2026-04-14  
**Valid until:** 2026-05-14
