# Phase 220: SaaS Community, Events, PR, Partnerships, Developer Marketing, and Growth Agent Surface — Research

**Researched:** 2026-04-26
**Domain:** SaaS Marketing OS Strategy (doc 17) — viral/referral, community, events, PR/analyst/review, partnerships/affiliate/developer marketing, growth API/MCP/UI agent surface
**Confidence:** HIGH for codebase-grounded claims, MEDIUM for sequencing decisions (P218/P219 unallocated), LOW for external integration choices (Discord vs Slack, Eventbrite vs Lu.ma — operator-driven)
**Replaces:** 23-line stub created during initial seeding pass

---

## Phase Requirements

| ID | Description (from `.planning/REQUIREMENTS.md`) | Research Support |
|----|------------------------------------------------|------------------|
| SG-04 | B2C and PLG growth covers viral loop metrics, referral programs, incentive quality controls, fraud prevention, and habit/retention loops | §6 Domain 1 (Referral/Viral) — `viral_loop_metrics` + `referral_programs` + fraud-controls per partition |
| SG-06 | Community, event, PR, analyst, review, partnership, affiliate, and developer marketing motions are modeled as governed workflows, not ad hoc campaigns | §6 Domains 2–5 (Community / Events / PR / Partnerships+Devrel) — five SOR clusters with approval gates |
| SG-07 | Growth experimentation uses an experiment registry, ICE-ranked backlog, guardrails, approval gates, decision records, and learning promotion | §6 Domain 6 routing — defer registry to P218 (already owns SG-07); P220 adds growth-surface experiment hooks only |
| SG-09 | Growth modules create tasks, approvals, experiments, or learnings; passive dashboards do not satisfy the spec | §15 Anti-patterns — passive-system-detector forbid list |
| SG-10 | Target growth agent tiers (PLG, EXP, ABM, VRL, IAM, CMT, EVT, XP, PR, PRT, DEV, REV) are not active implementation truth until GSD assigns contracts, costs, approval posture, tests, API/MCP/UI surfaces, and failure behavior | §6 Domain 6 — non-runnable agent registry (`growth_agent_readiness` table + readiness gate) |
| SG-11 | Pricing-sensitive growth prompts, referral rewards, affiliate commissions, discounts, save offers, pricing copy, G2/Capterra pricing sync, and upgrade nudges consume Pricing Engine context or `{{MARKOS_PRICING_ENGINE_PENDING}}` | §6 cross-domain — pricing-engine-context-resolver enforced at write path; placeholder sentinel in copy validators |
| SG-12 | External customer, partner, press, analyst, event, support, pricing, discount, referral, affiliate, in-app, and review mutations require approval by default unless an explicit earned-autonomy policy exists | §6 every domain — `external_mutation_approval_gate` middleware + DB triggers per domain |
| API-01 | Public OpenAPI, generated SDKs, and API contracts remain current | §13 Architecture-lock — `contracts/openapi.json` + F-ID slot table + `npm run openapi:build` |
| MCP-01 | MCP server, sessions, tools, OAuth, cost/budget controls, and marketplace readiness remain tenant-safe | §6 Domain 6 — `lib/markos/mcp/tools/growth/` MCP tool family in `index.cjs` |
| QA-01..15 | Phase 200 Quality Baseline gates apply | §16 Validation Architecture |

---

## Summary

Phase 220 ships the **first implementation truth** for the SaaS growth engines that were defined as future requirements in `obsidian/work/incoming/17-SAAS-MARKETING-OS-STRATEGY.md` and distilled into `obsidian/brain/SaaS Marketing OS Strategy Canon.md`. It is the closing phase of the v4.1.0 SaaS milestone (Phases 214-220) and is the **schema parent** for P227 (v4.2.0 Ecosystem Engine). Without P220's tables, P227 cannot ALTER them additively.

P220 covers six distinct growth domains, each comparable in scope to a P221-P228 commercial-engine phase. The phase boundary is intentional: P218 already owns `SaaSGrowthProfile` + PLG/PQL/in-app/experimentation; P219 already owns `RevenueTeamConfig` + ABM/expansion/advocacy. P220 picks up everything else — viral/referral, community, events, PR, partnerships, affiliate, developer marketing — plus the closing growth API/MCP/UI agent surface that ties P218+P219+P220 into a single growth substrate.

**Primary recommendation:** ship P220 as **5 SOR clusters + 1 surface-closure cluster** (matching the 6 plan slices already drafted), with the explicit guarantee that the schema P227 ALTERs is fully defined here:

```
P220 SOR tables (5 SaaS-mode tables) — all carry implicit business_mode='saas' (column added in P227 ALTER):
  partner_profiles      ← extended by P227 with 11 ecosystem columns (D-02)
  referral_programs     ← extended by P227 with 7 ecosystem columns (D-03)
  community_profiles    ← extended by P227 with business_mode + scope (D-12)
  marketing_events      ← extended by P227 with business_mode (D-12)
  partnerships          ← extended by P227 with business_mode + co_sell_enabled (D-12)
```

P220's job: define the SaaS-mode columns. P227's job: extend them additively with ecosystem columns. The contract: P220 schema must NOT pre-allocate `business_mode` (P227 owns that addition with `DEFAULT 'saas'` backfill — verified in 227-RESEARCH.md migration 160 SQL).

**Critical sequencing finding (HIGH-impact):** P227 takes F-181..F-198 + migrations 159-171, P226 takes F-163..F-180 + migrations 146-158, P225 takes F-147..F-162 + migrations ~134-145, P224 takes F-132..F-146 + migrations ~120-133, P223 takes F-122..F-131, P222 takes F-113..F-121 + migrations 106-112, P221 takes F-106..F-112 + migrations 100-105 (estimated). **P218, P219, and P220 must collectively fit BEFORE F-106 / migration 100** — and the highest existing on-disk migration is `96_neuro_literacy_metadata.sql`. This leaves migration slots 97-105 (≈9 slots) and F-IDs that must avoid F-100..F-105 (CLI-reserved F-101..F-105). **There is a real risk of slot collision** that the planner must resolve. Recommended approach: the planner should (a) coordinate with P218/P219 owners on slot allocation, OR (b) elect P220 to come AFTER P218+P219 in execution sequence and inherit the next free slot via `assertUpstreamReady`.

---

## User Constraints (from CONTEXT.md)

### Locked Decisions

CONTEXT.md is currently a 16-line stub. The only locked decision is the canonical inputs and the required phase shape:

1. Define viral/referral metrics and program controls.
2. Define community, event, PR/review/analyst, partnership/affiliate, and developer marketing objects.
3. Define approval, evidence, pricing, compliance, and payout hooks.
4. Define growth API/MCP/UI and target growth agent readiness closure.

The 16-line CONTEXT.md is the input to the discuss/plan cycle this research feeds. After the planner generates expanded plans, a `/gsd-discuss-phase 220 --auto` pass should expand CONTEXT.md to lock decisions per P221-P228 standard (D-01 through D-NN).

### Claude's Discretion

Because CONTEXT.md is a stub, the entire decision surface is currently Claude's discretion subject to:
- `obsidian/brain/SaaS Marketing OS Strategy Canon.md` (vault canon — wins for product shape per CLAUDE.md source-of-truth precedence rule 1)
- `obsidian/work/incoming/17-SAAS-MARKETING-OS-STRATEGY.md` (RAW intake — source of object models, NOT canonical)
- `.planning/REQUIREMENTS.md` SG-04, SG-06..12, API-01, MCP-01, QA-01..15
- `.planning/ROADMAP.md` Phase 220 entry (line 398-413)
- Existing P218 + P219 CONTEXT/RESEARCH stubs (also stubs — define partition boundaries by exclusion)
- P227 CONTEXT.md (defines ALTER TABLE expectations — sets P220 schema constraints)

This research recommends 6-domain partition + architecture-lock matching P226/P227, and the planner should accept those recommendations or escalate per CLAUDE.md drift rule.

### Deferred Ideas (OUT OF SCOPE)

- App Router migration of `/v1/growth/*` → kept on legacy `api/*.js` (architecture-lock per §13)
- Stripe Connect / KYC / 1099 generation for affiliate payouts → manual CSV export (matches P227 D-71 stance)
- Live event-platform native integration (Hopin, Lu.ma, Riverside) → P220 stores `platform: text` URL only, integration deferred to v4.3.0
- Native G2/Capterra API integration → manual operator workflow + UTM tracking; G2 review request is approval-gated email send only
- Anti-fraud machine-learning models → simple rule-based fraud_controls per `referral_programs.fraud_controls[]`; advanced fraud signals deferred to P227 D-72 (1h→24h fraud window)
- Cross-tenant viral-loop benchmarks → defer to P212 cross-tenant learning + P225 narrative phase
- Public marketplace SSR + ISR + sitemap.xml → P227 owns the marketplace surface; P220 ships only the SaaS-mode admin surface (operator-only views)

---

## Project Constraints (from CLAUDE.md)

These directives carry the same authority as locked CONTEXT decisions. Any plan that contradicts these MUST be flagged for escalation.

### Source-of-truth precedence (MUST)

1. **Product doctrine wins:** `obsidian/brain/SaaS Marketing OS Strategy Canon.md` defines the operating modes, growth-engine module list, target agent tiers, approval-and-safety policy, and Pricing Engine relationship. P220 schema and policy MUST match this canon.
2. **Product spec wins:** `obsidian/reference/MarkOS v2 Operating Loop Spec.md` + `Contracts Registry.md` + `Database Schema.md` define HOW objects are shaped. P220 SOR fields, ENUMs, and FKs MUST match the v2 operating loop spec where applicable.
3. **Engineering execution state wins:** `.planning/STATE.md` + `ROADMAP.md` define WHEN. STATE.md currently shows phase 204 as the active phase; P220 plans must NOT execute before P214-P219 land.
4. **Drift rule:** if `.planning` plans state schema that contradicts vault brain/reference, STOP and flag — do NOT silently reconcile. (e.g., if P220 plan defines `referral_program.commission_type` as `flat_fee | percentage_mrr | percentage_arr | hybrid` per doc 17 line 1296 but vault canon disagrees, escalate.)

### Placeholder rule (MUST)

Unresolved pricing/packaging/usage/billing copy uses `{{MARKOS_PRICING_ENGINE_PENDING}}` until an approved `PricingRecommendation` exists. P220 affiliate commission rates, referral reward dollar values, partner payout rates, G2/Capterra pricing copy, and event ticket pricing all consume Pricing Engine context or use the placeholder sentinel.

### CLI / tests (MUST)

- Primary install/update via `npx markos` (see `package.json` `bin`).
- Run tests with `npm test` or `node --test test/**/*.test.js`. **Verified 2026-04-26:** `package.json` scripts contains `"test": "node --test test/**/*.test.js"` — NO `vitest`, NO `playwright` scripts. Test runner = Node `--test` runner.
- Local onboarding UI: `node onboarding/backend/server.cjs`.

### Split (MUST)

- **GSD** = engineering methodology under `.agent/get-shit-done/`; drives `.planning/`. P220 belongs here.
- **MarkOS** = marketing protocol under `.agent/markos/`; defines TOKEN_IDs and ITMs. P220 target agents (CMT-01..03, EVT-01..03, etc.) are MarkOS protocol registry entries — `.agent/markos/MARKOS-INDEX.md` wins for TOKEN_ID → file mapping.
- Client overrides live only under `.markos-local/` — never `.mgsd-local`.

---

## Doctrine Summary (from canonical inputs)

### What `obsidian/brain/SaaS Marketing OS Strategy Canon.md` says (the canon — wins for product shape)

**SaaS operating modes** (canon line 50-60): tenant `SaaSGrowthProfile.saas_model ∈ {b2b, b2c, plg_b2b, plg_b2c, b2b2c}` drives module activation. P220 modules activate per:
- `b2b`: PR/Analyst Relations, Partnerships
- `b2c`: Viral Loop Engine, Referral Program, Community
- `plg_b2b`: Community, Developer Marketing (where relevant)
- `plg_b2c`: Viral Loops, Referral, Community
- `b2b2c`: all of the above (broadest routing)

**Growth Engine Modules** (canon line 64-78) — P220 owns:
- Viral and Referral Engine: k-factor, referral program, incentive quality controls, powered-by moments, embeds, collaborative invites
- Community Engine: community profile, launch maturity, health score, peer support, UGC, product feedback, community-to-health signals
- Event Marketing: webinars, summits, launches, customer events, conferences, registration, reminders, replay, pipeline attribution
- PR and Analyst Relations: G2/Capterra management, press intelligence, journalist profiles, analyst relationship building, coverage tracking
- Partnership Ecosystem: technology partnerships, referral partners, affiliate program, co-marketing, reseller/white-label routes
- Developer Marketing: docs-as-product, API examples, changelog discipline, starter kits, developer community

**Core Objects** (canon line 82-99) — P220 ships:
- `ReferralProgram` (incentives, attribution window, share tools, fraud prevention, dashboard visibility)
- `ViralLoopMetrics` (k-factor, invite rate, conversion rate, viral channel breakdown, referral performance)
- `CommunityProfile` (community type, platform, goals, health score, launch status, URL)
- `MarketingEvent` (event planning, promotion plan, speakers, reminders, replay, no-show/attendee sequence, pipeline attribution)
- `AffiliateProgram` (commission, cookie window, approval, prohibited methods, tracking provider, payouts, performance)

P220 does NOT ship (handled by sibling phases):
- `SaaSGrowthProfile` → P218
- `ActivationDefinition`, `PQLScore`, `UpgradeTrigger`, `InAppCampaign` → P218
- `MarketingExperiment` → P218 (P220 only adds growth-surface experiment hooks, NOT registry)
- `CustomerMarketingProgram`, `ABMAccountPackage`, `RevenueTeamConfig` → P219

**Approval and safety** (canon line 139-150): approval required by default for:
- referral rewards, affiliate commissions, partner payouts
- public PR pitches, analyst outreach, press releases, G2/Capterra responses, review requests
- event invitations and post-event sales sequences when sent externally
- experiment launch where surface affects pricing, billing, legal, customer data, or customer-facing UX

**Pricing Engine relationship** (canon line 122-128): referral rewards, affiliate commissions, discount ladders, incentive experiments, G2/Capterra pricing sync, pricing-page experiments, pricing-sensitive in-app/email/event/ABM/partnership/sales content all use Pricing Engine MCP tools or `{{MARKOS_PRICING_ENGINE_PENDING}}`.

### What `obsidian/work/incoming/17-SAAS-MARKETING-OS-STRATEGY.md` says (RAW intake — provides type interfaces only)

Doc 17 provides TypeScript interfaces for every P220 object (lines 638-712 ReferralProgram + ViralLoopMetrics; lines 864-901 CommunityProfile; lines 996-1048 MarketingEvent + EventPromotionPlan; lines 1075-1132 G2/PR; lines 1255-1322 AffiliateProgram; lines 1339-1395 Developer Marketing content types; lines 1416-1471 RevenueTeamConfig). These are the source-of-truth for column types and ENUM values.

**Important caveat per CLAUDE.md rule 5:** doc 17 is RAW intake. The vault `SaaS Marketing OS Strategy Canon.md` is the distilled doctrine. Where doc 17 and canon disagree, canon wins. Where they agree (which is most cases — canon was distilled from doc 17), use the doc 17 TypeScript interface as the implementation truth.

### What CLAUDE.md says about MARKOS-AGT-* tokens

Doc 17 introduces 28 new agents across 8 tiers (TIER 13 PLG through TIER 20 Growth/Revenue). P220 covers TIER 16 Viral, TIER 17 In-App (P218 owns this — P220 confirms non-allocation), TIER 18 Community, TIER 19 Events, TIER 20 Growth/PR/PRT/DEV/REV. Per CLAUDE.md split: target agent tokens `MARKOS-AGT-VRL-*`, `MARKOS-AGT-CMT-*`, `MARKOS-AGT-EVT-*`, `MARKOS-AGT-PR-*`, `MARKOS-AGT-PRT-*`, `MARKOS-AGT-DEV-*`, `MARKOS-AGT-REV-*` are MarkOS protocol registry entries belonging to `.agent/markos/MARKOS-INDEX.md`. P220 SHALL NOT mark these agents as runnable — per SG-10 they are non-runnable until GSD assigns contracts, costs, approval posture, tests, and API/MCP/UI surfaces. P220's `growth_agent_readiness` table records the non-runnable state.

---

## Existing-Code Support (verified 2026-04-26 by codebase enumeration)

### Verified existing libs that P220 extends

| Path | What's there | P220 dependency |
|------|-------------|-----------------|
| `lib/markos/crm/agent-actions.ts:68` | `function buildApprovalPackage(input)` | P220 referral payout, affiliate commission, partner payout, PR outreach, G2 review request, event external send, partnership co-marketing approve all wire through this exact function |
| `lib/markos/crm/agent-actions.ts:133` | `module.exports = { buildApprovalPackage, ... }` | P220 imports via `const { buildApprovalPackage } = require('../crm/agent-actions');` |
| `onboarding/backend/runtime-context.cjs:491` | `function requireHostedSupabaseAuth({ req, runtimeContext, operation, requiredProjectSlug, env })` | P220 API endpoints in `api/v1/growth/**/*.js` use this auth helper. **NOT** `requireSupabaseAuth` (does not exist). |
| `onboarding/backend/runtime-context.cjs:1014` | `module.exports = { requireHostedSupabaseAuth, ... }` | P220 imports via `const { requireHostedSupabaseAuth } = require('../../onboarding/backend/runtime-context');` |
| `lib/markos/plugins/registry.js:102` | `function resolvePlugin(registry, pluginId) → object \| null` | P220 partner integration directory uses this. **NOT** `lookupPlugin` (does not exist). |
| `lib/markos/mcp/tools/index.cjs` | MCP tool family registry (CommonJS, NOT `.ts`) | P220 growth MCP tools (12 tools across PLG/EXP/ABM/VRL/IAM/CMT/EVT/XP/PR/PRT/DEV/REV namespaces) register here. Add `lib/markos/mcp/tools/growth.cjs` and require it from `index.cjs`. |
| `contracts/openapi.json` | Active OpenAPI 3.1 spec | P220 F-IDs F-NN-growth-*-v1.yaml regenerate this via `npm run openapi:build`. **NOT** `public/openapi.json`. |
| `api/cron/webhooks-dlq-purge.js` | Cron handler pattern: POST-only + `x-markos-cron-secret` header + `MARKOS_WEBHOOK_CRON_SECRET` env + `writeJson` helper + JSON `{success, count, duration_ms}` response | P220 cron handlers (recertification cron, fraud-window-rollup, viral-metrics-rollup, event-reminder-dispatch, G2-review-request-cadence) use this exact pattern. Place at `api/cron/growth-*.js`. |
| `api/cron/webhooks-rotation-notify.js` | T-7/T-1/T-0 notification cron pattern | P220 event-reminder-dispatch cron (T-28/T-21/T-7/T-2/T-1d/T-1h pre-event reminders) reuses this multi-window pattern. |
| `api/cron/mcp-kpi-digest.js` | KPI rollup cron pattern | P220 viral-metrics-rollup (k-factor + invite_rate + conversion_rate per period) uses this exact rollup pattern. |
| `lib/markos/audit/*` | Audit-log domain (per-tenant SHA-256 hash chain) | P220 mutations on referral payout, affiliate commission, PR outreach, G2 review request, event external send, partner payout all emit audit rows. |
| `lib/markos/governance/*` | Deletion workflow (migration 56) | P220 referral_programs / community_profiles / marketing_events / partnerships / partner_profiles deletion routes through governance tombstone cascade. |
| `lib/markos/billing/*` | SaaS billing engine (P215 path) | P220 affiliate commission + partner payout integrate here for legal billing/tax — NOT direct Stripe writes. |
| `lib/markos/outbound/*` | Outbound/lifecycle messaging (P210/P223 path) | P220 referral invitation send + event reminder send + G2 review request email + PR pitch email all emit through outbound (centralized consent + suppression + quiet hours). |
| `lib/markos/contracts/*` | Contract registry + flow validators | P220 F-ID YAML files validate here. |

### Verified non-existent (forbidden patterns to flag in plans)

The following were searched for and confirmed **NOT** to exist in the codebase as of 2026-04-26. Plans must NEVER reference these (carry-forward of P221-P228 anti-patterns):

| Forbidden | Why | Real symbol to use |
|-----------|-----|--------------------|
| `createApprovalPackage` | Does not exist anywhere in `lib/markos/` | `buildApprovalPackage` in `lib/markos/crm/agent-actions.ts:68` |
| `requireSupabaseAuth` | Does not exist | `requireHostedSupabaseAuth` in `onboarding/backend/runtime-context.cjs:491` |
| `lookupPlugin` | Does not exist | `resolvePlugin` in `lib/markos/plugins/registry.js:102` |
| `requireTenantContext` | Does not exist | derive tenant from `requireHostedSupabaseAuth` runtime context |
| `serviceRoleClient` | Does not exist as a single named factory | use `createClient` from `@supabase/supabase-js` directly with `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` per `api/cron/webhooks-dlq-purge.js` line 36-44 pattern |
| `lib/markos/mcp/tools/index.ts` | File extension `.ts` does not exist | `lib/markos/mcp/tools/index.cjs` (CommonJS — verified) |
| `lib/markos/sales/*` | Directory does NOT exist (P226 ships it) | If P220 needs sales handoff, use `lib/markos/crm/agent-actions.ts` |
| `lib/markos/cdp/*` | Directory does NOT exist (P221 ships it) | If P220 needs identity context, defer to P221 hard preflight |
| `lib/markos/conversion/*` | Directory does NOT exist (P224 ships it) | If P220 needs landing pages, defer to P224 hard preflight |
| `lib/markos/launches/*` | Directory does NOT exist (P224 ships it) | If P220 needs launch coordination, defer to P224 hard preflight |
| `lib/markos/analytics/*` | Directory does NOT exist (P225 ships it) | If P220 needs attribution, defer to P225 hard preflight |
| `lib/markos/channels/*` | Directory does NOT exist (P223 ships it) | If P220 needs channel orchestration, use existing `lib/markos/outbound/*` |
| `lib/markos/ecosystem/*` | Directory does NOT exist (P227 ships it) | P220 adds `lib/markos/growth/*` as sibling to outbound, NOT inside ecosystem (P227 owns ecosystem dir) |
| `api/v1/*` flat tree | Does NOT exist; legacy `api/*.js` flat | Use `api/v1/growth/*.js` matching P226 pattern OR `api/growth/*.js` matching legacy 201-onwards pattern |
| `app/(growth)/**` App Router | Does NOT exist; one Next.js exception is `app/(public)/share/dr/[token]/page.tsx` per P226 D-78 | If P220 needs UI, attach to existing operator shell OR Storybook + Chromatic surface (matching P226 D-46 pattern); App Router migration is OUT OF SCOPE |
| `route.ts` | App Router files banned in growth surface | use `*.js` flat handlers |
| `vitest`, `playwright` | NOT in `package.json` scripts (verified 2026-04-26) | use `node --test` runner with `*.test.js` extension and `node:test` + `node:assert/strict` imports |
| `openapi-generate` | NOT a package.json script | `npm run openapi:build` (which runs `node scripts/openapi/build-openapi.cjs`) |

### Module-tree decision (P220-greenfield)

**P220 owns these new directories** (sibling to existing `lib/markos/{audit, billing, crm, ...}`):

```
lib/markos/growth/                 # umbrella for all P220 growth motions
  contracts.ts                     # zod schemas (parity test against contracts/F-NN-*.yaml)
  contracts.cjs                    # CommonJS twin (legacy api/*.js consumers)
  api-helpers.ts                   # shared response helpers (matching P226 lib/markos/sales/api-helpers.ts model)

lib/markos/referral/               # Domain 1
  programs.ts                      # ReferralProgram CRUD + lifecycle
  programs.cjs                     # CJS twin
  metrics.ts                       # ViralLoopMetrics rollup logic (k-factor, invite_rate, conversion_rate)
  fraud-evaluator.ts               # rule-based fraud_controls evaluator (per program.fraud_controls[])
  reward-issuance.ts               # buildApprovalPackage wiring; pricing-context resolver; placeholder enforcement
  fraud-evaluator.test.js
  reward-issuance.test.js
  programs.test.js

lib/markos/community/              # Domain 2
  profiles.ts                      # CommunityProfile CRUD
  profiles.cjs
  health.ts                        # health_score rollup (member activity, post velocity, response time)
  signals.ts                       # community → health/CRM/research signal fan-out
  moderation-approvals.ts          # external community post/moderation buildApprovalPackage gate
  *.test.js

lib/markos/events/                 # Domain 3
  events.ts                        # MarketingEvent CRUD
  events.cjs
  promotion-plan.ts                # EventPromotionPlan generation (auto-generated by EVT-02 stub)
  reminders.ts                     # T-28/T-21/T-7/T-2/T-1d/T-1h reminder schedule
  attribution.ts                   # post-event pipeline_attribution_window_days lookback (cdp_events emit deferred to P221)
  approval-gates.ts                # external event invitation buildApprovalPackage
  *.test.js

lib/markos/pr/                     # Domain 4
  outreach.ts                      # journalist + analyst record CRUD; pitch generation; approval gate
  outreach.cjs
  reviews.ts                       # G2/Capterra review request + response; pricing-context guard
  coverage-tracking.ts             # NewsAPI/Google Alerts ingest; mention scoring; CRM brand-awareness touchpoint emit
  evidence-binding.ts              # public claim → EvidenceMap freshness check (P209 dependency or stub)
  *.test.js

lib/markos/partnerships/           # Domain 5
  partner-profiles.ts              # PartnerProfile CRUD (extended by P227 — keep schema flat for additive ALTER)
  partner-profiles.cjs
  partnerships.ts                  # Partnership relationship records
  affiliate-programs.ts            # AffiliateProgram CRUD + commission compute + payout queue
  payout-compliance.ts             # billing-engine handoff (P215); manual CSV export stub; placeholder enforcement
  prohibited-methods-validator.ts  # contractual enforcement (paid search on brand terms, email spam, etc.)
  developer-marketing.ts           # docs-as-product objects (DeveloperContent + DeveloperEvent — DeveloperEvent extended by P227)
  *.test.js

lib/markos/growth-agents/          # Domain 6 — non-runnable target agent registry
  readiness-registry.ts            # growth_agent_readiness CRUD
  readiness-gate.ts                # SG-10 enforcement: can_run() returns false unless readiness criteria met
  *.test.js
```

**Why `lib/markos/growth/*` is correct (and `lib/markos/ecosystem/*` is wrong):**
- P227 D-78 + 227-CONTEXT.md line 12 explicitly reserves `lib/markos/ecosystem/*` for the ecosystem engine.
- P220 is the SaaS-mode (b2b/b2c/plg_b2b/plg_b2c/b2b2c) implementation; P227 is the agnostic ecosystem engine (business_mode='ecosystem' or 'all') that EXTENDS P220.
- Naming `lib/markos/growth/*` umbrella + per-domain dirs (`referral`, `community`, `events`, `pr`, `partnerships`, `growth-agents`) creates clean partition where P227 can later import P220's tables via read-through adapter (P227 D-09..D-11) without owning P220's code.

**Greenfield by domain count:** 6 new domains × ~3-5 files each = **~24-30 new files** in `lib/markos/`. Matches scope envelope of P226 + P227.

---

## 6-Domain Breakdown

### Domain 1: ReferralProgram + ViralLoopMetrics (Plan 220-01 — SG-04, SG-11, SG-12)

**Object model** (per doc 17 line 638-712 + canon constraints):

```sql
-- referral_programs (P220-owned; extended by P227 ALTER per D-03)
CREATE TABLE referral_programs (
  program_id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               uuid NOT NULL REFERENCES markos_orgs(org_id),  -- per migration 81 (P201)
  name                    text NOT NULL,
  status                  text NOT NULL CHECK (status IN ('active', 'paused', 'draft')),

  -- Incentive structure
  referrer_reward_jsonb   jsonb NOT NULL,  -- { reward_type, reward_value, reward_currency, reward_duration, reward_description }
  referee_reward_jsonb    jsonb NOT NULL,
  reward_trigger          text NOT NULL CHECK (reward_trigger IN ('signup', 'activation', 'first_payment')),

  -- Mechanics
  referral_link_format    text NOT NULL DEFAULT '{baseUrl}/r/{referral_code}',
  cookie_window_days      int NOT NULL DEFAULT 30 CHECK (cookie_window_days BETWEEN 1 AND 365),
  multi_use               boolean NOT NULL DEFAULT true,
  max_referrals_per_user  int,

  -- Fraud prevention (carries over to P227 fraud_controls[] extension)
  min_account_age_days    int NOT NULL DEFAULT 0,
  require_paid_account    boolean NOT NULL DEFAULT false,
  self_referral_prevention boolean NOT NULL DEFAULT true,
  vpn_detection           boolean NOT NULL DEFAULT false,

  -- Communication
  onboarding_email        boolean NOT NULL DEFAULT true,
  dashboard_visible       boolean NOT NULL DEFAULT true,
  share_tools             text[] NOT NULL DEFAULT ARRAY['link','email','social']::text[],

  -- Pricing-engine integration (SG-11)
  pricing_recommendation_id  uuid,  -- FK soft-ref to PricingRecommendation (P205); NULL → use {{MARKOS_PRICING_ENGINE_PENDING}}

  -- Audit
  created_at              timestamptz NOT NULL DEFAULT now(),
  created_by              uuid NOT NULL,
  updated_at              timestamptz NOT NULL DEFAULT now(),
  approved_at             timestamptz,            -- buildApprovalPackage wire (SG-12)
  approved_by             uuid
);
ALTER TABLE referral_programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY referral_programs_tenant_isolation ON referral_programs
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- viral_loop_metrics (P220-owned; period-aggregated)
CREATE TABLE viral_loop_metrics (
  metric_id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                       uuid NOT NULL REFERENCES markos_orgs(org_id),
  period                          text NOT NULL,  -- 'YYYY-MM'
  k_factor                        numeric(8,4) NOT NULL DEFAULT 0,  -- ideally > 0.3; > 1.0 = viral growth
  invitations_per_active_user_monthly numeric(10,4) NOT NULL DEFAULT 0,
  invitation_conversion_rate      numeric(8,6) NOT NULL DEFAULT 0,
  viral_channels_jsonb            jsonb NOT NULL DEFAULT '[]'::jsonb,  -- array of {channel, impressions, clicks, signups, conversion_rate}
  referral_program_id             uuid REFERENCES referral_programs(program_id),
  active_referrers                int NOT NULL DEFAULT 0,
  referrals_sent                  int NOT NULL DEFAULT 0,
  referrals_converted             int NOT NULL DEFAULT 0,
  conversion_rate                 numeric(8,6) NOT NULL DEFAULT 0,
  cost_per_referred_signup_cents  bigint,
  referred_user_ltv_vs_organic    numeric(8,4),  -- ratio: 1.0 = parity, > 1 = referred users retain better
  payback_period_days             int,
  computed_at                     timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, period, referral_program_id)
);
ALTER TABLE viral_loop_metrics ENABLE ROW LEVEL SECURITY;

-- referral_invitations (transactional; one row per invite)
CREATE TABLE referral_invitations (
  invitation_id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid NOT NULL REFERENCES markos_orgs(org_id),
  program_id        uuid NOT NULL REFERENCES referral_programs(program_id),
  referrer_user_id  uuid NOT NULL,
  referee_email     text,
  referee_user_id   uuid,
  invitation_code   text UNIQUE NOT NULL,
  channel           text NOT NULL CHECK (channel IN ('product_share', 'referral_link', 'embed', 'email', 'social')),
  fraud_score       numeric(5,4),  -- 0-1; populated by fraud-evaluator
  fraud_status      text DEFAULT 'pending' CHECK (fraud_status IN ('pending', 'cleared', 'flagged', 'blocked')),
  signed_up_at      timestamptz,
  activated_at      timestamptz,
  first_paid_at     timestamptz,
  reward_issued_at  timestamptz,
  reward_approval_id uuid,  -- buildApprovalPackage approval reference
  created_at        timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE referral_invitations ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_referral_invitations_program ON referral_invitations(tenant_id, program_id);
CREATE INDEX idx_referral_invitations_referrer ON referral_invitations(tenant_id, referrer_user_id);
```

**Compliance enforcement boundary:**
- App-layer: `lib/markos/referral/reward-issuance.ts` calls `buildApprovalPackage` for every reward issuance with `reward_value > $0` (or non-credit type).
- DB-trigger (defense-in-depth — matches P226 D-83/D-84 pattern): `BEFORE UPDATE` trigger on `referral_invitations` raises `EXCEPTION 'REWARD_REQUIRES_APPROVAL'` when `NEW.reward_issued_at IS NOT NULL AND NEW.reward_approval_id IS NULL`.
- Pricing-engine: `BEFORE INSERT/UPDATE` trigger on `referral_programs` raises `EXCEPTION 'REWARD_REQUIRES_PRICING_CONTEXT'` when `referrer_reward_jsonb->>'reward_type' IN ('cash','discount','credit')` AND `pricing_recommendation_id IS NULL` AND `referrer_reward_jsonb->>'reward_description' NOT LIKE '%MARKOS_PRICING_ENGINE_PENDING%'`.

**Approval-gate triggers:**
1. Reward issuance with non-zero monetary value → `buildApprovalPackage({ kind: 'referral_reward_issuance', ... })`
2. Program activation (status: 'draft' → 'active') → `buildApprovalPackage({ kind: 'referral_program_activation', ... })`
3. Reward type/value modification on active program → `buildApprovalPackage({ kind: 'referral_program_update', ... })`

**Pricing/Evidence/Audit hook integration points:**
- Pricing: every `reward_value` non-null write reads `lib/markos/billing/pricing-engine-client.ts` (P205) for cost-margin context. If P205 not yet shipped (likely), use `{{MARKOS_PRICING_ENGINE_PENDING}}` sentinel and gate via assertUpstreamReady soft-skip pattern.
- Evidence: viral_loop_metrics rows tagged with `source_system = 'product_analytics'` for EvidenceMap freshness chain.
- Audit: every status mutation writes audit row via `lib/markos/audit/*` SHA-256 hash chain.

**External integrations:** none in v1. Referral link generation is internal (URL signing). Tracking uses existing `api/tracking/{ingest,identify}.js` UTM ingest. Future v4.3.0 may integrate Rewardful / PartnerStack / Impact / Tune (matches doc 17 line 1313 `tracking_provider`).

**Test strategy:**
- `test/growth/referral/programs.test.js` — CRUD + RLS isolation
- `test/growth/referral/fraud-evaluator.test.js` — each fraud_control rule (min_account_age, require_paid_account, self_referral, vpn_detection, max_referrals_per_user) with positive + negative cases
- `test/growth/referral/reward-issuance.test.js` — buildApprovalPackage wiring; pricing-context guard; placeholder sentinel detection
- `test/growth/referral/metrics-rollup.test.js` — k-factor + invite_rate + conversion_rate computation; period boundary handling
- `test/growth/referral/db-trigger-reward-requires-approval.test.js` — service-role direct UPDATE blocked

---

### Domain 2: CommunityProfile + community health workflows (Plan 220-02 — SG-06, SG-09)

**Object model** (per doc 17 line 864-901):

```sql
-- community_profiles (P220-owned; extended by P227 ALTER per D-12)
CREATE TABLE community_profiles (
  community_id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid NOT NULL REFERENCES markos_orgs(org_id),
  community_type      text NOT NULL CHECK (community_type IN ('practitioner', 'user_forum', 'customer_only', 'open_education', 'developer')),
  primary_platform    text NOT NULL CHECK (primary_platform IN ('slack', 'discord', 'circle', 'discourse', 'linkedin_group', 'reddit', 'github_discussions', 'custom')),
  secondary_platforms text[] NOT NULL DEFAULT ARRAY[]::text[],
  member_count        int NOT NULL DEFAULT 0,
  monthly_active_members int NOT NULL DEFAULT 0,
  health_score        numeric(5,2) NOT NULL DEFAULT 0 CHECK (health_score BETWEEN 0 AND 100),
  goals               text[] NOT NULL DEFAULT ARRAY[]::text[],  -- (community_goal ENUM array; CHECK via app)
  launch_status       text NOT NULL DEFAULT 'not_started' CHECK (launch_status IN ('not_started', 'soft_launch', 'active', 'mature')),
  community_url       text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE community_profiles ENABLE ROW LEVEL SECURITY;

-- community_signals (P220-owned; ingested from connected platforms; emits to CRM/research/health)
CREATE TABLE community_signals (
  signal_id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid NOT NULL REFERENCES markos_orgs(org_id),
  community_id     uuid NOT NULL REFERENCES community_profiles(community_id),
  signal_kind      text NOT NULL CHECK (signal_kind IN (
    'active_member_signal',           -- → +5 to health score
    'feature_confusion_signal',       -- → support intelligence
    'competitor_mention_signal',      -- → competitive intel
    'content_gap_signal',             -- → content strategy
    'advocacy_candidate_signal',      -- → advocacy pipeline (P219)
    'churn_risk_signal',              -- → SAS-07 health
    'feature_request_signal',         -- → product intelligence
    'review_signal'                   -- → PR-04 review pipeline
  )),
  source_post_id   text,
  source_member_id text,
  source_url       text,
  payload_jsonb    jsonb NOT NULL DEFAULT '{}'::jsonb,
  consumed_at      timestamptz,  -- when downstream phase ingested
  consumed_by_phase text,        -- e.g., 'P216_health_score'
  created_at       timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE community_signals ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_community_signals_unconsumed ON community_signals(tenant_id, signal_kind, created_at) WHERE consumed_at IS NULL;
```

**Compliance enforcement boundary:**
- App-layer: external community post/moderation actions go through `lib/markos/community/moderation-approvals.ts` → `buildApprovalPackage`.
- DB-trigger: NONE for community_profiles (read-mostly + tenant-scoped); the approval gate is on the *post/moderate action*, not on profile mutation.
- RLS: tenant_id isolation per existing `markos_orgs` FK pattern.

**Approval-gate triggers:**
1. External community post on behalf of tenant brand → buildApprovalPackage
2. Public community moderation action (ban, mute, post-removal) → buildApprovalPackage
3. Community-to-paid-account conversion incentive (overlaps with referral domain) → buildApprovalPackage

**Pricing/Evidence/Audit hook integration points:**
- Pricing: not directly applicable; community is a free-tier acquisition mechanic.
- Evidence: community signals tagged with `source_quality_score` per EVD-02 (P209 dependency or stub). Public claim from community ("3 customers report X") goes through EvidenceMap.
- Audit: profile mutations + moderation actions written to audit log.

**External integrations (v1 read-only; signal ingest):**
- Slack: existing connector substrate (P210 dependency); tenant-side OAuth per `lib/markos/auth/*`.
- Discord: webhook signature verification using Ed25519 per P227 D-29 pattern (deferred to P227 if Discord ingest comes later; v1 manual export).
- Discourse: API key auth + REST poll (matches existing connector pattern).
- Circle: REST API + OAuth.
- Reddit / LinkedIn Group: read-only via existing search/research integrations (RES-03 substrate).

**Test strategy:**
- `test/growth/community/profiles.test.js` — CRUD + RLS
- `test/growth/community/signals-fan-out.test.js` — each signal_kind correctly enqueues for downstream phase
- `test/growth/community/health-rollup.test.js` — health_score computation from member activity + post velocity
- `test/growth/community/moderation-approvals.test.js` — buildApprovalPackage wiring on external actions

---

### Domain 3: MarketingEvent workflow + attribution (Plan 220-03 — SG-06, LOOP-06, LOOP-08)

**Object model** (per doc 17 line 996-1048):

```sql
-- marketing_events (P220-owned; extended by P227 ALTER per D-12)
CREATE TABLE marketing_events (
  event_id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             uuid NOT NULL REFERENCES markos_orgs(org_id),
  event_type            text NOT NULL CHECK (event_type IN (
    'webinar', 'virtual_summit', 'product_launch_event',
    'customer_event', 'conference_speaking', 'trade_show',
    'workshop', 'office_hours', 'ama'
  )),
  name                  text NOT NULL,
  description           text,
  scheduled_at          timestamptz NOT NULL,
  duration_minutes      int NOT NULL CHECK (duration_minutes > 0),
  format                text NOT NULL CHECK (format IN ('virtual', 'in_person', 'hybrid')),
  platform              text,  -- "Zoom Webinar", "Hopin", "Riverside", "Eventbrite", "Lu.ma" — text only; NO native integration v1
  capacity              int,
  status                text NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'promoting', 'live', 'completed', 'canceled')),

  -- Goals
  registration_target   int,
  attendance_rate_target numeric(5,4),  -- 0.0-1.0 fractional
  pipeline_target_cents bigint,

  -- Promotion
  promotion_plan_jsonb  jsonb NOT NULL DEFAULT '{}'::jsonb,  -- EventPromotionPlan structure

  -- Attribution
  attribution_window_days int NOT NULL DEFAULT 90,  -- post-event lookback for pipeline_attribution

  -- Audit
  created_at            timestamptz NOT NULL DEFAULT now(),
  created_by            uuid NOT NULL,
  approved_at           timestamptz,
  approved_by           uuid
);
ALTER TABLE marketing_events ENABLE ROW LEVEL SECURITY;

-- event_speakers
CREATE TABLE event_speakers (
  speaker_id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL REFERENCES markos_orgs(org_id),
  event_id     uuid NOT NULL REFERENCES marketing_events(event_id) ON DELETE CASCADE,
  name         text NOT NULL,
  role         text,
  bio          text,
  email        text,
  linkedin_url text,
  external     boolean NOT NULL DEFAULT false,  -- true = guest from outside org
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- event_registrations
CREATE TABLE event_registrations (
  registration_id  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid NOT NULL REFERENCES markos_orgs(org_id),
  event_id         uuid NOT NULL REFERENCES marketing_events(event_id),
  contact_id       uuid,  -- soft FK to CRM contact (P222 dependency)
  email            text NOT NULL,
  registration_source text,
  utm_jsonb        jsonb,
  attended         boolean,
  attended_at      timestamptz,
  attended_minutes int,
  no_show_sequence_sent_at timestamptz,
  attendee_sequence_sent_at timestamptz,
  pipeline_opportunity_id uuid,  -- soft FK to opportunity (P222) within attribution window
  created_at       timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_event_registrations_event ON event_registrations(tenant_id, event_id);

-- event_reminders (one row per scheduled reminder)
CREATE TABLE event_reminders (
  reminder_id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES markos_orgs(org_id),
  event_id        uuid NOT NULL REFERENCES marketing_events(event_id) ON DELETE CASCADE,
  send_at         timestamptz NOT NULL,
  window_kind     text NOT NULL CHECK (window_kind IN ('T-28d','T-21d','T-14d','T-7d','T-2d','T-1d','T-1h','day_of','post_replay')),
  template_id     uuid,
  recipients_query text,
  dispatched_at   timestamptz,
  dispatched_count int,
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'dispatched', 'failed', 'canceled'))
);

-- event_results (post-event aggregation)
CREATE TABLE event_results (
  result_id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid NOT NULL REFERENCES markos_orgs(org_id),
  event_id            uuid NOT NULL UNIQUE REFERENCES marketing_events(event_id),
  registrations       int,
  attendees           int,
  attendance_rate     numeric(5,4),
  no_shows            int,
  pipeline_sourced_cents bigint,
  pipeline_influenced_cents bigint,  -- assist attribution
  cost_cents          bigint,
  computed_at         timestamptz NOT NULL DEFAULT now()
);
```

**Compliance enforcement boundary:**
- App-layer: event invitations + post-event sequences sent externally → `buildApprovalPackage` per canon line 144.
- DB-trigger: `BEFORE UPDATE` on `marketing_events` raises `EXCEPTION 'EVENT_EXTERNAL_DISPATCH_REQUIRES_APPROVAL'` when `NEW.status IN ('promoting', 'live')` AND `OLD.status = 'planning'` AND `NEW.approved_at IS NULL`. Defense-in-depth.

**Approval-gate triggers:**
1. Event status: 'planning' → 'promoting' (locks promotion plan, dispatches reminders) → buildApprovalPackage
2. External event invitation send (per canon line 144) → buildApprovalPackage on promotion_plan dispatch
3. Post-event sales sequence to attendees/no-shows → buildApprovalPackage

**Pricing/Evidence/Audit hook integration points:**
- Pricing: event ticket pricing copy (if paid event) consumes Pricing Engine context per SG-11.
- Evidence: pipeline_sourced_cents value links to attribution_touches (P225 dependency or stub).
- Audit: status transitions + reminder dispatches written to audit log.

**External integrations (v1 read-only; integration deferred):**
- Eventbrite / Lu.ma / Hopin / Zoom Webinar: text URL only in `marketing_events.platform`. Tenant operator manually creates the event on the external platform and pastes the URL. Post-event registration export → manual CSV upload (matches P227 D-71 manual CSV stance).
- Future v4.3.0: native integration via existing connector substrate (P210).

**Test strategy:**
- `test/growth/events/events.test.js` — CRUD + RLS
- `test/growth/events/promotion-plan.test.js` — auto-generated promotion plan structure
- `test/growth/events/reminders.test.js` — reminder schedule generation; T-28..T-1h cadence; idempotency
- `test/growth/events/attribution.test.js` — attribution_window_days lookback; pipeline_sourced + pipeline_influenced rollup
- `test/growth/events/db-trigger-promoting-requires-approval.test.js` — service-role direct UPDATE blocked

---

### Domain 4: PR + Analyst + Review intelligence (Plan 220-04 — SG-06, EVD-01..06)

**Object model** (per doc 17 line 1075-1132):

```sql
-- pr_targets (journalists + analysts + influencers)
CREATE TABLE pr_targets (
  target_id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id              uuid NOT NULL REFERENCES markos_orgs(org_id),
  target_type            text NOT NULL CHECK (target_type IN ('journalist', 'analyst', 'influencer', 'review_publication')),
  name                   text NOT NULL,
  publication            text,
  email                  text,
  twitter_handle         text,
  linkedin_url           text,
  beats                  text[] NOT NULL DEFAULT ARRAY[]::text[],
  recent_articles_jsonb  jsonb,  -- [{title, url, date, angle}]
  relevance_score        numeric(5,2) DEFAULT 0,
  last_contacted_at      timestamptz,
  relationship_stage     text NOT NULL DEFAULT 'cold' CHECK (relationship_stage IN ('cold','warming','engaged','responsive','active','do_not_contact')),
  do_not_contact_reason  text,
  source_quality_score   numeric(5,2),
  created_at             timestamptz NOT NULL DEFAULT now()
);

-- pr_outreach (one row per pitch sent)
CREATE TABLE pr_outreach (
  outreach_id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          uuid NOT NULL REFERENCES markos_orgs(org_id),
  target_id          uuid NOT NULL REFERENCES pr_targets(target_id),
  story_angle        text NOT NULL,
  pitch_subject      text NOT NULL,
  pitch_body         text NOT NULL,
  evidence_refs      uuid[],  -- soft FK to EvidenceMap (P209)
  approval_id        uuid,    -- buildApprovalPackage reference
  approved_at        timestamptz,
  approved_by        uuid,
  sent_at            timestamptz,
  status             text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','pending_approval','approved','sent','responded','declined','no_response')),
  response_received_at timestamptz,
  coverage_url       text,
  coverage_kind      text CHECK (coverage_kind IN ('feature','mention','quote','interview','byline','none')),
  pipeline_attribution_window_days int DEFAULT 90,
  created_at         timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE pr_outreach ENABLE ROW LEVEL SECURITY;

-- review_records (G2/Capterra/TrustRadius/Trustpilot/Product Hunt)
CREATE TABLE review_records (
  review_id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id              uuid NOT NULL REFERENCES markos_orgs(org_id),
  platform               text NOT NULL CHECK (platform IN ('g2','capterra','trustradius','trustpilot','product_hunt','app_store','play_store','custom')),
  external_review_id     text,  -- platform-specific ID
  review_url             text,
  reviewer_name          text,  -- public; not PII
  star_rating            numeric(3,2) CHECK (star_rating BETWEEN 0 AND 5),
  review_title           text,
  review_body            text,
  review_published_at    timestamptz,
  sentiment_score        numeric(5,4),  -- -1.0 to 1.0; populated by sentiment classifier
  themes                 text[],  -- ['pricing','onboarding','support','feature_x']
  response_status        text NOT NULL DEFAULT 'pending' CHECK (response_status IN ('pending','drafted','approved','responded','declined')),
  response_draft         text,
  response_approval_id   uuid,
  responded_at           timestamptz,
  responded_by           uuid,
  ingested_at            timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE review_records ENABLE ROW LEVEL SECURITY;

-- review_requests (one row per request to a customer)
CREATE TABLE review_requests (
  request_id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid NOT NULL REFERENCES markos_orgs(org_id),
  contact_id          uuid,  -- soft FK to CRM contact (P222)
  platform            text NOT NULL,
  trigger_kind        text NOT NULL CHECK (trigger_kind IN ('nps_high','csat_high','health_score_high','feature_request_shipped','manual')),
  request_template_id uuid,
  pricing_engine_context_id uuid,
  approval_id         uuid,
  sent_at             timestamptz,
  review_received_at  timestamptz,
  review_id           uuid REFERENCES review_records(review_id),
  status              text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','sent','received','declined','no_response')),
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- coverage_mentions (Google Alerts / NewsAPI ingest)
CREATE TABLE coverage_mentions (
  mention_id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid NOT NULL REFERENCES markos_orgs(org_id),
  source_publication text,
  source_url        text NOT NULL,
  mention_kind      text CHECK (mention_kind IN ('press','blog','podcast','video','social','review_aggregator')),
  title             text,
  snippet           text,
  sentiment_score   numeric(5,4),
  brand_awareness_value numeric(8,2),  -- 0-100 score
  related_outreach_id uuid REFERENCES pr_outreach(outreach_id),
  ingested_at       timestamptz NOT NULL DEFAULT now()
);
```

**Compliance enforcement boundary:**
- App-layer: every `pr_outreach.status: 'pending_approval' → 'approved'`, every `review_records.response_status: 'drafted' → 'approved'`, and every `review_requests.status: 'pending' → 'approved'` calls `buildApprovalPackage`.
- DB-trigger: `BEFORE UPDATE` on `pr_outreach` raises `EXCEPTION 'PR_OUTREACH_REQUIRES_APPROVAL'` when `NEW.status = 'sent'` AND `NEW.approved_at IS NULL`.
- DB-trigger: `BEFORE INSERT/UPDATE` on `pr_outreach` raises `EXCEPTION 'PR_PITCH_REQUIRES_EVIDENCE'` when `NEW.status IN ('approved','sent')` AND `cardinality(NEW.evidence_refs) = 0`. Defense-in-depth EVD-02 (no unsupported claim leaves the building).

**Approval-gate triggers:**
1. PR pitch send → buildApprovalPackage (canon line 144)
2. Analyst outreach → buildApprovalPackage (canon line 144)
3. Press release publication → buildApprovalPackage
4. G2/Capterra response → buildApprovalPackage
5. Review request to customer → buildApprovalPackage (canon line 144)
6. G2/Capterra pricing profile sync → buildApprovalPackage + Pricing Engine guard (SG-11)

**Pricing/Evidence/Audit hook integration points:**
- Pricing: G2/Capterra pricing profile sync MUST consume Pricing Engine context (SG-11). Stale pricing in public review profiles is a real compliance + legal risk. Trigger blocks profile_sync without `pricing_engine_context_id`.
- Evidence: every pr_outreach with `status IN ('approved','sent')` MUST have non-empty `evidence_refs` per EVD-02. Test asserts.
- Audit: outreach send + review response + review request send all written to audit log.

**External integrations:**
- Google Alerts: existing research connector (RES-03 substrate); manual feed export.
- NewsAPI: API key auth + REST poll; existing connector pattern.
- G2 / Capterra: read-only via API where exposed; manual review profile management for v1 (matches P227 D-71 stance).
- TrustRadius / Trustpilot / Product Hunt: read-only manual export.

**Test strategy:**
- `test/growth/pr/outreach.test.js` — CRUD + RLS + buildApprovalPackage wiring
- `test/growth/pr/db-trigger-pitch-requires-evidence.test.js` — service-role direct send blocked when evidence_refs empty
- `test/growth/pr/reviews.test.js` — review ingest + response approval flow
- `test/growth/pr/review-requests.test.js` — trigger_kind eligibility + buildApprovalPackage
- `test/growth/pr/coverage-tracking.test.js` — mention ingest + sentiment scoring + brand awareness rollup

---

### Domain 5: Partnerships + Affiliate + Developer Marketing (Plan 220-05 — SG-06, SG-11, SG-12)

**Object model** (per doc 17 line 1255-1395 + canon constraints):

```sql
-- partner_profiles (P220-owned; extended by P227 ALTER per D-02 — 11 ecosystem columns added)
CREATE TABLE partner_profiles (
  partner_id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             uuid NOT NULL REFERENCES markos_orgs(org_id),
  partner_kind          text NOT NULL CHECK (partner_kind IN ('technology', 'referral', 'affiliate', 'co_marketing', 'reseller', 'white_label', 'consulting', 'agency')),
  legal_name            text NOT NULL,
  display_name          text NOT NULL,
  website_url           text,
  primary_contact_name  text,
  primary_contact_email text,
  status                text NOT NULL DEFAULT 'invited' CHECK (status IN ('invited','active','watch','paused','terminated')),
  contract_signed_at    timestamptz,
  contract_url          text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
  -- P227 will ALTER: business_mode, partner_type, region, specialization_tags[], certification_level,
  --   active_status, co_sell_enabled, referral_enabled, affiliate_enabled, public_directory_visible,
  --   commission_share_default, revenue_attribution_partner_id, payout_compliance_acknowledged_at
);
ALTER TABLE partner_profiles ENABLE ROW LEVEL SECURITY;

-- partnerships (relationship records — extended by P227 ALTER per D-12 with business_mode + co_sell_enabled)
CREATE TABLE partnerships (
  partnership_id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          uuid NOT NULL REFERENCES markos_orgs(org_id),
  partner_id         uuid NOT NULL REFERENCES partner_profiles(partner_id),
  partnership_kind   text NOT NULL CHECK (partnership_kind IN ('integration', 'co_marketing_campaign', 'webinar_series', 'reseller_agreement', 'affiliate_relationship', 'referral_relationship', 'tech_partnership')),
  status             text NOT NULL DEFAULT 'active' CHECK (status IN ('proposed','active','paused','ended')),
  started_at         timestamptz,
  ended_at           timestamptz,
  shared_assets      jsonb DEFAULT '[]'::jsonb,
  joint_kpi_jsonb    jsonb DEFAULT '{}'::jsonb,
  created_at         timestamptz NOT NULL DEFAULT now(),
  approved_at        timestamptz,
  approved_by        uuid
);
ALTER TABLE partnerships ENABLE ROW LEVEL SECURITY;

-- affiliate_programs (P220-owned; per doc 17 line 1292-1322)
-- NOTE: P227 has its OWN affiliate_programs table per 227-RESEARCH.md migration 162; resolve this overlap
-- by either (a) P220 doesn't ship affiliate_programs and defers to P227, OR (b) P220 ships SaaS-mode-only
-- affiliate_programs (status='SaaS') and P227 ships ecosystem-mode (status='ecosystem'). Recommendation: option (b)
-- with explicit business_mode='saas' default + P227 ALTER. See planning open question Q-1.
CREATE TABLE affiliate_programs (
  program_id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                   uuid NOT NULL REFERENCES markos_orgs(org_id),
  status                      text NOT NULL DEFAULT 'invite_only' CHECK (status IN ('active','paused','invite_only')),
  commission_type             text NOT NULL CHECK (commission_type IN ('flat_fee','percentage_mrr','percentage_arr','hybrid')),
  commission_rate_jsonb       jsonb NOT NULL,  -- { value, currency, min_threshold, max_threshold }
  commission_duration_months  int NOT NULL DEFAULT 12,
  cookie_window_days          int NOT NULL DEFAULT 30,
  minimum_payout_cents        bigint NOT NULL DEFAULT 5000,
  manual_approval             boolean NOT NULL DEFAULT true,
  prohibited_methods          text[] NOT NULL DEFAULT ARRAY['paid_search_brand_terms','email_spam','trademark_misuse']::text[],
  content_guidelines_url      text,
  tracking_provider           text NOT NULL DEFAULT 'native' CHECK (tracking_provider IN ('native','rewardful','partnerstack','impact','tune')),
  payment_method              text NOT NULL DEFAULT 'manual_csv' CHECK (payment_method IN ('manual_csv','stripe_connect','paypal','wire')),
  payment_frequency           text NOT NULL DEFAULT 'monthly' CHECK (payment_frequency IN ('monthly','bi_monthly')),
  pricing_recommendation_id   uuid,  -- SG-11 enforcement
  created_at                  timestamptz NOT NULL DEFAULT now(),
  approved_at                 timestamptz,
  approved_by                 uuid
);
ALTER TABLE affiliate_programs ENABLE ROW LEVEL SECURITY;

-- developer_content (docs-as-product; tutorials, API ref, code samples, technical blog)
CREATE TABLE developer_content (
  content_id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid NOT NULL REFERENCES markos_orgs(org_id),
  content_kind      text NOT NULL CHECK (content_kind IN ('tutorial','api_reference','code_sample','starter_kit','technical_blog','changelog_entry')),
  title             text NOT NULL,
  url               text NOT NULL,
  language          text,  -- 'python','javascript','typescript','go','ruby'
  sdk_version       text,
  freshness_status  text NOT NULL DEFAULT 'fresh' CHECK (freshness_status IN ('fresh','stale','broken')),
  last_validated_at timestamptz,
  validation_kind   text CHECK (validation_kind IN ('runs_clean','runs_with_warnings','fails','manual_only')),
  evidence_refs     uuid[],
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- developer_events (P220-owned base; extended by P227 ALTER per D-12; P227 fans out cdp_events)
CREATE TABLE developer_events (
  event_id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid NOT NULL REFERENCES markos_orgs(org_id),
  developer_id      uuid,
  event_kind        text NOT NULL CHECK (event_kind IN ('signup','first_api_call','first_successful_request','first_payment','sdk_install','docs_view','starter_kit_clone','api_error','rate_limit_hit')),
  payload_jsonb     jsonb DEFAULT '{}'::jsonb,
  occurred_at       timestamptz NOT NULL DEFAULT now()
);
```

**Compliance enforcement boundary:**
- App-layer: affiliate commission issuance → `lib/markos/partnerships/payout-compliance.ts` → `buildApprovalPackage` + `lib/markos/billing/*` handoff (P215 dependency or stub).
- DB-trigger: `BEFORE UPDATE` on `partnerships` raises `EXCEPTION 'PARTNERSHIP_ACTIVATION_REQUIRES_APPROVAL'` when `NEW.status = 'active'` AND `OLD.status = 'proposed'` AND `NEW.approved_at IS NULL`.
- DB-trigger: `BEFORE INSERT/UPDATE` on `affiliate_programs` raises `EXCEPTION 'AFFILIATE_PROGRAM_REQUIRES_PRICING_CONTEXT'` when `commission_type IN ('percentage_mrr','percentage_arr','hybrid')` AND `pricing_recommendation_id IS NULL`. SG-11 hard floor.
- DB-trigger: `BEFORE INSERT` on `affiliate_programs` raises `EXCEPTION 'PROHIBITED_METHODS_MUST_BE_NON_EMPTY'` when `cardinality(prohibited_methods) = 0`. Defense-in-depth.

**Approval-gate triggers:**
1. Partnership activation (status: 'proposed' → 'active') → buildApprovalPackage
2. Affiliate program activation → buildApprovalPackage
3. Affiliate commission issuance → buildApprovalPackage + Pricing Engine + billing handoff
4. Partner payout export → buildApprovalPackage + payout_compliance_acknowledged_at gate (forward-port from P227 D-71)
5. Public partner directory listing → buildApprovalPackage (P227 will own this; v1 scope = internal directory only)
6. Developer content publication (technical blog) → buildApprovalPackage if content makes pricing/competitive claims

**Pricing/Evidence/Audit hook integration points:**
- Pricing: `affiliate_programs.commission_rate_jsonb` MUST have `pricing_recommendation_id` for percentage-based commission types (SG-11).
- Evidence: developer_content tutorials with `validation_kind = 'runs_clean'` are EvidenceMap-backed (last_validated_at + tested_against version).
- Audit: every payout + commission + activation + content publication writes audit row.

**External integrations:**
- Stripe Connect / 1099 generation: OUT OF SCOPE per Deferred Ideas list (matches P227 D-71). v1 = manual CSV export.
- PartnerStack / Rewardful / Impact / Tune: text-only `tracking_provider` field; native integration deferred to v4.3.0.
- GitHub: existing connector substrate for developer_content URL validation (broken-link check cron).

**Test strategy:**
- `test/growth/partnerships/profiles.test.js` — partner_profiles CRUD + RLS
- `test/growth/partnerships/affiliate-programs.test.js` — commission compute + SG-11 pricing-context guard
- `test/growth/partnerships/payout-compliance.test.js` — buildApprovalPackage wiring + manual CSV export
- `test/growth/partnerships/db-trigger-affiliate-pricing-required.test.js` — service-role direct INSERT blocked when commission_type='percentage_mrr' AND pricing_recommendation_id IS NULL
- `test/growth/partnerships/developer-content.test.js` — content_kind enum + freshness_status lifecycle
- `test/growth/partnerships/prohibited-methods.test.js` — empty array blocked at DB layer

---

### Domain 6: Growth API + MCP + UI + Agent readiness closure (Plan 220-06 — SG-10, API-01, MCP-01, RUN-01..08)

**Object model:**

```sql
-- growth_agent_readiness (non-runnable target agent registry per SG-10)
CREATE TABLE growth_agent_readiness (
  readiness_id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_token            text UNIQUE NOT NULL,  -- 'MARKOS-AGT-VRL-01', 'MARKOS-AGT-CMT-01', etc.
  agent_tier             text NOT NULL CHECK (agent_tier IN ('PLG','EXP','ABM','VRL','IAM','CMT','EVT','XP','PR','PRT','DEV','REV')),
  agent_name             text NOT NULL,
  contracts_assigned     boolean NOT NULL DEFAULT false,
  cost_estimated         boolean NOT NULL DEFAULT false,
  approval_posture_defined boolean NOT NULL DEFAULT false,
  tests_implemented      boolean NOT NULL DEFAULT false,
  api_surface_defined    boolean NOT NULL DEFAULT false,
  mcp_surface_defined    boolean NOT NULL DEFAULT false,
  ui_surface_defined     boolean NOT NULL DEFAULT false,
  failure_behavior_defined boolean NOT NULL DEFAULT false,
  runnable               boolean GENERATED ALWAYS AS (
    contracts_assigned AND cost_estimated AND approval_posture_defined
    AND tests_implemented AND api_surface_defined AND mcp_surface_defined
    AND ui_surface_defined AND failure_behavior_defined
  ) STORED,
  blocking_phase         text,  -- which phase ships the missing piece
  notes                  text,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);
-- Note: NOT tenant-scoped — this is a system-level registry. Service-role-only access.

-- Pre-populate (in same migration) all 28 doc 17 target agents with runnable=false:
-- VRL-01..02, CMT-01..03, EVT-01..03, PR-01..04, PRT-01..03, DEV-01..02, REV-01..02 (P220 owns these 19)
-- PLG-01..06, EXP-01..03, ABM-01..03, IAM-01, XP-01..02 (P218/P219 own these 15 — but P220 seeds all 28
-- to assert SG-10 invariant; sibling phases overwrite their rows when they ship).
```

**API surface (legacy `api/v1/growth/*.js` — architecture-lock per §13):**

| Endpoint | Method | Purpose | F-ID |
|---------|--------|---------|------|
| `/v1/growth/referral/programs` | GET / POST | List + create programs | F-NN-growth-referral-programs-v1 |
| `/v1/growth/referral/programs/{id}` | GET / PATCH | Read + update + activate | (same) |
| `/v1/growth/referral/invitations` | GET / POST | List + record invitation | F-NN-growth-referral-invitations-v1 |
| `/v1/growth/referral/metrics` | GET | Read viral_loop_metrics | F-NN-growth-referral-metrics-v1 |
| `/v1/growth/community/profiles` | GET / POST / PATCH | Community CRUD | F-NN-growth-community-profile-v1 |
| `/v1/growth/community/signals` | GET | List unconsumed signals (operator review) | F-NN-growth-community-signal-v1 |
| `/v1/growth/events` | GET / POST / PATCH | Event CRUD | F-NN-growth-event-v1 |
| `/v1/growth/events/{id}/registrations` | GET / POST | Registration CRUD | F-NN-growth-event-registration-v1 |
| `/v1/growth/events/{id}/results` | GET | Read post-event results | F-NN-growth-event-results-v1 |
| `/v1/growth/pr/targets` | GET / POST / PATCH | PR target CRUD | F-NN-growth-pr-target-v1 |
| `/v1/growth/pr/outreach` | GET / POST / PATCH | PR outreach (approval-gated send) | F-NN-growth-pr-outreach-v1 |
| `/v1/growth/pr/reviews` | GET / PATCH | Review records (response approval-gated) | F-NN-growth-pr-review-v1 |
| `/v1/growth/pr/review-requests` | GET / POST | Review requests (approval-gated send) | F-NN-growth-pr-review-request-v1 |
| `/v1/growth/partnerships/profiles` | GET / POST / PATCH | partner_profiles CRUD | F-NN-growth-partner-profile-v1 |
| `/v1/growth/partnerships` | GET / POST / PATCH | Partnership relationships | F-NN-growth-partnership-v1 |
| `/v1/growth/partnerships/affiliate-programs` | GET / POST / PATCH | Affiliate program CRUD | F-NN-growth-affiliate-program-v1 |
| `/v1/growth/partnerships/payouts/export` | POST | Manual CSV payout export | F-NN-growth-payout-export-v1 |
| `/v1/growth/developer/content` | GET / POST / PATCH | Developer content registry | F-NN-growth-developer-content-v1 |
| `/v1/growth/agents/readiness` | GET | Read non-runnable agent registry | F-NN-growth-agent-readiness-v1 |

Estimated **F-ID slot count: ~19 contracts** (matches P226 18, P227 18 envelope).

**MCP tool family (`lib/markos/mcp/tools/growth.cjs` registered in `index.cjs`):**

| MCP tool | Purpose | Read/Write |
|---------|---------|-----------|
| `growth_referral_programs_list` | List active referral programs for tenant | Read |
| `growth_referral_metrics_get` | Read viral_loop_metrics for period | Read |
| `growth_community_profile_get` | Read CommunityProfile | Read |
| `growth_community_signals_list` | List unconsumed community signals | Read |
| `growth_events_list` | List MarketingEvents | Read |
| `growth_event_promotion_plan_generate` | Generate promotion plan (auto-draft, requires approval) | Write (gated) |
| `growth_pr_outreach_draft` | Draft PR pitch (requires approval before send) | Write (gated) |
| `growth_review_response_draft` | Draft G2/Capterra response (requires approval) | Write (gated) |
| `growth_partner_directory_list` | List partner_profiles + partnerships | Read |
| `growth_affiliate_commission_compute` | Compute commission for invitation (read-only preview) | Read |
| `growth_developer_content_list` | List developer content | Read |
| `growth_agents_readiness_get` | Read non-runnable agent registry | Read |

Estimated **MCP tool count: ~12** (matches doc 17's 12 target agent tiers).

**UI surface (Storybook + Chromatic; matches P226 D-46 pattern; NO App Router):**

| Surface | Purpose | Read/Write | Approval-gated? |
|---------|---------|-----------|-----------------|
| `(operator-shell)/growth/referral` | Referral programs + viral metrics dashboard | Read+Write | Yes (program activation) |
| `(operator-shell)/growth/community` | Community profile + signals + health | Read+Write | Yes (moderation) |
| `(operator-shell)/growth/events` | Event calendar + promotion plan | Read+Write | Yes (promotion lock) |
| `(operator-shell)/growth/pr` | PR outreach + reviews | Read+Write | Yes (every send) |
| `(operator-shell)/growth/partnerships` | Partner directory + affiliate programs | Read+Write | Yes (every payout) |
| `(operator-shell)/growth/developer` | Developer content registry | Read+Write | Conditional |
| `(operator-shell)/growth/agents-readiness` | Non-runnable agent registry (status grid) | Read | No |

Estimated **UI surface count: 7** (matches P226 6 + P227 7 envelope).

**Cron handlers (`api/cron/growth-*.js`):**

| Cron | Schedule | Purpose |
|------|----------|---------|
| `api/cron/growth-viral-metrics-rollup.js` | Daily 04:00 UTC | Rollup k_factor + invite_rate + conversion_rate per period |
| `api/cron/growth-event-reminder-dispatch.js` | Hourly | Dispatch event_reminders where send_at ≤ now() AND status='pending' |
| `api/cron/growth-community-signals-fan-out.js` | Hourly | Emit unconsumed community_signals to downstream phases |
| `api/cron/growth-pr-coverage-tracking.js` | Daily 05:00 UTC | Ingest Google Alerts + NewsAPI mentions; sentiment scoring |
| `api/cron/growth-review-request-cadence.js` | Daily 06:00 UTC | Trigger review_requests where trigger_kind eligibility met |
| `api/cron/growth-developer-content-validation.js` | Weekly Sun 02:00 UTC | Re-validate developer_content URLs; flag broken/stale |

Estimated **cron count: 6** (matches P226 7 envelope).

**Test strategy:**
- `test/growth/agents-readiness/registry.test.js` — pre-populated 28 agents; runnable computed column = false until all flags true
- `test/growth/agents-readiness/runnable-gate.test.js` — readiness gate refuses execution when runnable=false
- `test/growth/openapi/parity.test.js` — F-ID YAML files parity with `contracts/openapi.json` regen
- `test/growth/architecture-lock.test.js` — `grep -r "createApprovalPackage\|requireSupabaseAuth\|lookupPlugin\|requireTenantContext\|serviceRoleClient\|app/(growth)\|route.ts\|vitest" lib/markos/growth lib/markos/referral lib/markos/community lib/markos/events lib/markos/pr lib/markos/partnerships api/v1/growth api/cron/growth-* | wc -l` must equal 0

---

## Architecture-Lock (carry forward from P221-P228 lessons)

### Pin (Plan 220-01 Task 0.5 — first task in first wave)

| Decision | Value | Verified by |
|----------|-------|-------------|
| API surface | Legacy `api/*.js` flat handlers (e.g., `api/v1/growth/referral/programs.js`) | Filesystem enumeration: `api/` contains `*.js` only; `api/v1/` reserved for matching-style routes |
| Auth helper | `requireHostedSupabaseAuth` from `onboarding/backend/runtime-context.cjs:491` | grep verified 2026-04-26 |
| OpenAPI command | `npm run openapi:build` → `node scripts/openapi/build-openapi.cjs` | `package.json` scripts inspection |
| OpenAPI registry | `contracts/openapi.json` | filesystem |
| Test runner | `npm test` → `node --test test/**/*.test.js` | `package.json` scripts |
| Test imports | `node:test` + `node:assert/strict` (e.g., `import { test } from 'node:test'; import assert from 'node:assert/strict';`) | matches P226/P227 lock-in |
| Test extension | `*.test.js` | matches existing `test/**/*.test.js` glob |
| MCP registry | `lib/markos/mcp/tools/index.cjs` (CommonJS) | filesystem |
| Cron auth | `x-markos-cron-secret` header OR `Authorization: Bearer <token>` matching `MARKOS_GROWTH_CRON_SECRET` env (NEW env per domain — matches `MARKOS_WEBHOOK_CRON_SECRET` pattern) | `api/cron/webhooks-dlq-purge.js` line 25-32 |
| Cron response | `{ success: boolean, count: number, duration_ms: number }` JSON | same pattern |
| Approval helper | `buildApprovalPackage` from `lib/markos/crm/agent-actions.ts:68` | grep verified |
| Plugin lookup | `resolvePlugin` from `lib/markos/plugins/registry.js:102` | grep verified |
| Audit emit | `lib/markos/audit/*` (per-tenant SHA-256 hash chain per migration 82) | filesystem + migration 82 |
| Tombstone | `lib/markos/governance/*` (matches P227 D-65 tombstone cascade pattern; deletion outbox) | filesystem |
| App Router | OUT OF SCOPE (one exception: P226 D-78 `app/(public)/share/dr/[token]/page.tsx`; P220 has NO public-facing app router routes) | n/a |

### Forbidden (architecture-lock test asserts grep count = 0 across `lib/markos/{growth,referral,community,events,pr,partnerships}` + `api/v1/growth/*` + `api/cron/growth-*`)

```
createApprovalPackage
requireSupabaseAuth
lookupPlugin
requireTenantContext
serviceRoleClient
lib/markos/sales/
lib/markos/cdp/
lib/markos/conversion/
lib/markos/launches/
lib/markos/analytics/
lib/markos/channels/
lib/markos/ecosystem/
public/openapi.json
app/(growth)/
route.ts
vitest
playwright
openapi-generate
```

The architecture-lock test (`test/growth/architecture-lock.test.js`) ships in Plan 220-01 Task 0.5 — first task in first wave per P221 D-32 / P226 D-78 model.

---

## assertUpstreamReady Preflight Design

### Required upstream phases

| Phase | Why P220 needs it | Hard or Soft? |
|-------|-------------------|---------------|
| P214 | SaaSSuiteActivation — only saas-mode tenants see growth | HARD (the entire point of v4.1.0 milestone) |
| P215 | Billing engine — affiliate commission + partner payout flow through this | HARD (SG-12 + P227 D-71 forward-port) |
| P216 | Health score — community health and review request trigger_kind=health_score_high read this | SOFT (graceful degrade if missing) |
| P217 | SAS agents + `/v1/saas/*` API — P220 surface follows P217 conventions | SOFT (architecture parity only) |
| P218 | SaaSGrowthProfile (saas_model) — P220 modules activate by mode | HARD (the entire SG-04..SG-12 routing depends on this) |
| P219 | RevenueTeamConfig + advocacy pipeline — P220 review_requests triggered from advocacy candidates | SOFT (graceful degrade; manual trigger fallback) |

### Soft-failure dependencies (do NOT block; degrade gracefully)

| Phase | Why optional | Fallback |
|-------|-------------|----------|
| P205 | Pricing Engine — referral rewards / affiliate commission / G2 pricing sync | Use `{{MARKOS_PRICING_ENGINE_PENDING}}` sentinel per CLAUDE.md placeholder rule |
| P207 | AgentRun v2 — growth agents emit AgentRun records | Stub to no-op `noopAgentRunEmit()` if AgentRun not yet shipped |
| P208 | Approval Inbox UI — approvals show up in operator inbox | DB rows still created via buildApprovalPackage; UI degrades to manual SQL query |
| P209 | EvidenceMap — PR pitch evidence_refs validation | Soft warn if evidence_refs empty; hard-fail upgraded once P209 ships |
| P211 | Pricing-engine-pending sentinel infrastructure | Use string literal `{{MARKOS_PRICING_ENGINE_PENDING}}` directly |
| P210 | Connector substrate — Slack/Discord/Discourse community ingest | Manual CSV import fallback |
| P212 | Cross-tenant learning — viral metric benchmarks | Tenant-only metrics; no cross-tenant compare in v1 |

### Preflight script (`scripts/preconditions/220-NN-check-upstream.cjs`, one per plan)

Pattern matches P221 D-35 / P226 D-87 / P227 D-69. Plans 01, 02, 03, 04, 05, 06 each ship one. Hard-fail behavior:

```cjs
// scripts/preconditions/220-01-check-upstream.cjs (referral plan)
'use strict';
const { createClient } = require('@supabase/supabase-js');
const REQUIRED_TABLES = [
  // P214 hard prereq
  'saas_suite_activations',
  // P218 hard prereq
  'saas_growth_profiles',
];
const SOFT_TABLES = [
  // P205 soft prereq
  'pricing_recommendations',
];
async function main() {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  for (const table of REQUIRED_TABLES) {
    const { error } = await supabase.from(table).select('*').limit(0);
    if (error && /relation .* does not exist/.test(error.message)) {
      console.error(`MISSING_UPSTREAM_PHASE: ${table} (required for P220 referral). Execute upstream phase first.`);
      process.exit(1);
    }
  }
  for (const table of SOFT_TABLES) {
    const { error } = await supabase.from(table).select('*').limit(0);
    if (error && /relation .* does not exist/.test(error.message)) {
      console.warn(`SOFT_MISSING: ${table} (graceful degrade — using {{MARKOS_PRICING_ENGINE_PENDING}})`);
    }
  }
}
main().catch((e) => { console.error(e); process.exit(2); });
```

Test: `test/growth/preconditions/upstream-check.test.js` — mock missing required table → exit 1; mock missing soft table → exit 0 with warning.

---

## F-ID and Migration Slot Allocation (CRITICAL — read open question Q-3 first)

### F-ID slot estimate (review-driven; planner pre-allocates per RM4)

P220 needs **~19 contracts** (per Domain 6 API surface enumeration). Breakdown:

| Domain | Plan | Contracts | F-IDs (proposed — see Q-3) |
|--------|------|-----------|------------------------------|
| Referral | 220-01 | 4 (programs, invitations, metrics, fraud-evaluator) | 4 slots |
| Community | 220-02 | 2 (profile, signals) | 2 slots |
| Events | 220-03 | 4 (event, registration, reminders, results) | 4 slots |
| PR | 220-04 | 4 (target, outreach, review, review-request) | 4 slots |
| Partnerships | 220-05 | 4 (partner-profile, partnership, affiliate-program, developer-content) | 4 slots |
| Closure | 220-06 | 1 (agent-readiness) | 1 slot |
| **Total** | | **~19** | |

### Migration slot estimate

P220 needs **~10-12 migrations**. Breakdown:

| Plan | Migrations |
|------|-----------|
| 220-01 | 2 (referral_programs + viral_loop_metrics + referral_invitations; trigger pack) |
| 220-02 | 2 (community_profiles + community_signals) |
| 220-03 | 2 (marketing_events + event_speakers + event_registrations + event_reminders + event_results) |
| 220-04 | 2 (pr_targets + pr_outreach + review_records + review_requests + coverage_mentions) |
| 220-05 | 2 (partner_profiles + partnerships + affiliate_programs + developer_content + developer_events) |
| 220-06 | 1 (growth_agent_readiness + 28 INSERT rows) |
| Hardening (cross-cutting) | 1 (RLS hardening + DB triggers if not in per-plan migration) |
| **Total** | **~10-12** |

### Slot-collision discovery (HIGH-impact; SEE OPEN QUESTION Q-3)

**Verified 2026-04-26 by codebase enumeration:**

- Highest existing on-disk migration: `96_neuro_literacy_metadata.sql` (Phase 96).
- F-IDs allocated on-disk: F-01..F-105 (some gaps; F-100..F-105 reserved by P200/204).
- Planning-time reservations for downstream phases:
  - P221: F-106..F-112 (per P221 D-30) + migrations ~100-105 (estimated; P221 RESEARCH says "continue after P211 migration N").
  - P222: F-113..F-121 + migrations 106-112 (per P222 D-49 + D-41).
  - P223: F-122..F-131 + migrations ~113-119 (per P224 D-55 reference).
  - P224: F-132..F-146 + migrations ~120-133.
  - P225: F-147..F-162 + migrations ~134-145 (per P226 D-59 + D-60 reference).
  - P226: F-163..F-180 + migrations 146-158.
  - P227: F-181..F-198 + migrations 159-171 (per P227 D-66 + D-67).

**The collision:** P220 must occupy F-IDs **before F-106** (P221's first slot). The window is F-100..F-105 — but those are reserved by P204 CLI (F-101..F-105). That leaves **only F-100 free** in the planning-time allocation. P218 + P219 + P220 collectively need 30+ F-IDs. The seam doesn't fit.

**Three resolution paths (open question Q-3):**

**Path A — Pre-empt later F-ID range:** P220 takes F-199..F-217 (continuing after P227 F-198). Acceptable because F-IDs are arbitrary identifiers; sequential ordering is conventional but not enforced. Risk: confusing for readers who assume F-ID ascends with phase order.

**Path B — Coordinate with P218/P219 for shared range:** Allocate F-NEW-200..F-NEW-249 collectively for P218 + P219 + P220 (50 slots). P218 takes 200-219, P219 takes 220-239, P220 takes 240-258. Cleaner but requires touching P218/P219 CONTEXT.md.

**Path C — Use intermediate range with documented gap:** P220 takes F-218..F-236, leaving F-199..F-217 for future P218/P219 plan-up work. Recommends updating P227-CONTEXT.md to note the chronological non-monotonicity.

**Migration slot collision (same problem):**
- P220 needs migrations ~97-108 (or 97-105 + 108, since 106-107 are P221).
- P221 D-41 likely takes 100-105 (estimated — P221 plans not yet drafted with migration slots).
- P218 + P219 are unallocated.
- Highest on-disk: 96.

**Resolution proposal:** P220 takes migration slots **172-183** (continuing after P227's 171). Same chronological non-monotonicity, but matches P227's expectation that P220's tables exist before P227 ALTERs them. **Critical:** P220 execution order MUST come before P227 — but migration NUMBERS don't constrain execution order. They only constrain `psql` apply order. As long as P220 ships migration 172 before P227 ships migration 159, application is correct.

**Wait — that's wrong.** Migrations apply by number ascending. If P227 migration 159 references `partner_profiles` table created by P220 migration 172, and 159 applies first, P227 will fail with "relation does not exist."

**Correct resolution:** Either (a) P220 migrations must be numbered LESS THAN 159 (P227's first), OR (b) P227 is renumbered.

**Recommended path (Q-3 resolution):**
- P220 takes migration slots **97-105** (9 slots — fits the ~10-12 estimate if some plans share migrations). Squeezes P218 + P219 to use the same range: P218 takes 97-99, P219 takes 100-101, P220 takes 102-105 + 108 (skip 106-107 reserved by P221 D-41).
- P220 takes F-IDs **F-NEW-100x range or coordinated F-209..F-227** post-P227. F-IDs are not order-constrained, so this is purely cosmetic.
- **Path forward in plans:** Plan 220-01 Task 0.1 = "Coordinate with P218/P219/P221 owners on slot allocation; emit `.planning/V4.1.0-MIGRATION-SLOT-COORDINATION.md` documenting reservations."

This is a hard problem to fully resolve in research; it requires P218/P219 plan-up work to land first. The **planner MUST surface this as a blocker** if P218/P219 plans are not yet drafted with explicit migration slots.

---

## P220 → P227 Schema Dependency: ALTER TABLE Additive Specification

P227 D-12 + 227-RESEARCH.md migrations 160 + 161 + 162 + 163 specify what P227 will ALTER on P220's tables. **P220 MUST NOT pre-create these columns.** P227 owns the additive ALTER + backfill `business_mode='saas'`.

### partner_profiles (P227 migration 160 ALTER)

P220 ships these columns:
```
partner_id, tenant_id, partner_kind, legal_name, display_name, website_url,
primary_contact_name, primary_contact_email, status, contract_signed_at,
contract_url, created_at, updated_at
```

P227 will ADD via `ALTER TABLE partner_profiles ADD COLUMN IF NOT EXISTS ...`:
```
business_mode text NOT NULL DEFAULT 'saas' CHECK (business_mode IN ('saas','commerce','ecosystem','all'))
partner_type text  -- (overlaps with P220 partner_kind — P227 should map or rename; coordinate)
region text
specialization_tags text[]
certification_level text  -- (joins to certification_records — P227-owned)
active_status text  -- (P227 redefines status semantics; coordinate)
co_sell_enabled boolean
referral_enabled boolean
affiliate_enabled boolean
public_directory_visible boolean DEFAULT false
commission_share_default numeric
revenue_attribution_partner_id uuid REFERENCES partner_profiles(partner_id)
payout_compliance_acknowledged_at timestamptz
```

**Coordination flag:** P220's `partner_kind` and P227's `partner_type` overlap. Recommendation: P220 uses `partner_kind`, P227 adds `partner_type` (with semantically different values per 227-RESEARCH line 34: `agency, technology, consulting, reseller, affiliate, integrator, devshop, association`). Both columns coexist additively. P227 may deprecate `partner_kind` later.

**Coordination flag 2:** P220's `status` ENUM is `{invited, active, watch, paused, terminated}`. P227's `active_status` adds same values plus `business_mode` discriminator. Recommendation: P220 names the column `lifecycle_status` to avoid collision, OR P227 renames its addition to `active_status_v2`. Surface in Q-2.

### referral_programs (P227 migration 161 ALTER)

P220 ships per Domain 1 schema above. P227 will ADD:
```
business_mode text NOT NULL DEFAULT 'saas'
scope text NOT NULL DEFAULT 'tenant' CHECK (scope IN ('tenant','marketplace'))
fraud_controls text[] DEFAULT ARRAY[]::text[]
payout_settings jsonb DEFAULT '{}'::jsonb
qualification_rule jsonb DEFAULT '{}'::jsonb
approval_required boolean DEFAULT true  -- (overlaps with P220 approved_at semantics; coordinate)
partner_id uuid REFERENCES partner_profiles(partner_id)
```

**Coordination flag 3:** P220's per-program approval is via `approved_at + approved_by` (action-based — every reward issuance is approval-gated). P227's `approval_required: bool` is policy-level (program-level requires approval). They coexist. P220 keeps `approved_at + approved_by` for activation; P227 adds `approval_required` for marketplace-scope-only programs.

### community_profiles (P227 migration 161 ALTER)

P220 ships per Domain 2 schema above. P227 will ADD:
```
business_mode text NOT NULL DEFAULT 'saas'
scope text DEFAULT 'tenant'
```

No coordination flags.

### marketing_events (P227 migration 161 ALTER)

P220 ships per Domain 3 schema above. P227 will ADD:
```
business_mode text NOT NULL DEFAULT 'saas'
```

No coordination flags.

### partnerships (P227 migration 161 ALTER)

P220 ships per Domain 5 schema above. P227 will ADD:
```
business_mode text NOT NULL DEFAULT 'saas'
co_sell_enabled boolean DEFAULT false
```

No coordination flags.

### Migration shape contract (P220 → P227)

P220 final migration includes **explicit assertion test** (matches P227's pattern):
```sql
-- P220-FINAL-MIGRATION assertion: ensure P227 can ALTER these tables additively
DO $$
BEGIN
  ASSERT (SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'partner_profiles')), 'partner_profiles missing';
  ASSERT (SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'referral_programs')), 'referral_programs missing';
  ASSERT (SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'community_profiles')), 'community_profiles missing';
  ASSERT (SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'marketing_events')), 'marketing_events missing';
  ASSERT (SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'partnerships')), 'partnerships missing';
END $$;
```

Test: `test/growth/migration-shape/p220-p227-altertable-readiness.test.js` — verifies all 5 tables exist with required columns + RLS enabled, AND that none of the columns P227 will ADD are already present (collision prevention).

---

## Library Choices

### json-logic-js?

P220 may need rule-based fraud_controls evaluator (per `referral_programs.fraud_controls[]`). Doc 17 line 693-697 lists `min_account_age_days, require_paid_account, self_referral_prevention, vpn_detection`. These are simple boolean + numeric checks — can be implemented in TypeScript without json-logic-js.

**Recommendation:** No json-logic-js. Hand-coded evaluator in `lib/markos/referral/fraud-evaluator.ts` with explicit rule functions. Each rule is a TypeScript function. New rules added by code change + migration slot bump.

### webhook signature libraries?

P220 v1 has NO incoming webhooks. Outgoing only (existing `lib/markos/webhooks/*` substrate). P227 D-29 specifies HMAC-SHA256 + Discord Ed25519 for ecosystem webhooks; P220 inherits whatever P227 ships.

**Recommendation:** No new webhook signature libraries.

### Sentiment classifier (for review_records.sentiment_score + coverage_mentions.sentiment_score)?

Two options:
- (a) Use existing LLM adapter (`lib/markos/llm/*` — Anthropic/OpenAI/Gemini). Cost-aware via existing `lib/markos/llm/cost-calculator.ts`. Approval-aware via existing run governance.
- (b) Use offline classifier (e.g., `vader-sentiment` npm package). Free, deterministic, no LLM cost. Less accurate.

**Recommendation:** Option (a) — LLM adapter. Sentiment scoring is a low-frequency operation (review_records ingested at most ~10/day per tenant); LLM cost is negligible. Use existing adapter. No new library.

### Test fixture library?

Match P226 + P227 pattern. `test/growth/_fixtures/` directory with factory functions (e.g., `referralProgramFactory({ name, status, ... })`). Pure JS; no library needed.

### Other deps?

- **No new npm dependencies in P220.** All work uses existing libs (`@supabase/supabase-js`, `@anthropic-ai/sdk`, etc.).
- Possible exception: G2/Capterra public review scraping (if v1 includes any auto-ingest). Default = manual operator-driven review entry; defer auto-ingest to v4.3.0.

---

## Common Pitfalls

### Pitfall 1: P220 ships affiliate_programs separately from P227's affiliate_programs

**What goes wrong:** P227 RESEARCH migration 162 says it ships `affiliate_programs` (line 825). P220 plan stub 220-05 also says affiliate program. Two phases create the same table → migration collision.

**Why it happens:** P227 was planned before P220 was substantively planned; the P227 author assumed they owned affiliate_programs.

**How to avoid:** P220 owns base `affiliate_programs` per doc 17 doctrine (the canonical SaaS-mode object lives in P220). P227 ALTERs P220's table additively (matches P227 D-12 ALTER pattern). Update P227-RESEARCH.md migration 162 to ALTER instead of CREATE — surface in **open question Q-1**.

**Warning signs:** Plan author writes "CREATE TABLE affiliate_programs" without checking P220 ALTER list.

### Pitfall 2: payout export bypasses billing engine

**What goes wrong:** Affiliate commission export writes directly to a CSV without going through `lib/markos/billing/*`. Bypasses tax compliance, accounting sync, currency handling, audit.

**Why it happens:** Manual CSV export "feels" simple; developer adds it as a script.

**How to avoid:** Every payout export goes through `lib/markos/partnerships/payout-compliance.ts → lib/markos/billing/{invoices,ledger}.ts`. CSV export is a final formatter step on top of billing-engine output. DB trigger asserts `affiliate_commission.billing_handoff_id IS NOT NULL` before export status flips to 'exported'.

**Warning signs:** Plan task says "manual CSV export" without billing-engine hand-off.

### Pitfall 3: PR pitch sent without evidence

**What goes wrong:** Operator drafts pitch with statistics ("3x faster than competitor") and clicks send. EVD-02 ("unsupported customer-facing claims block external dispatch") is bypassed if app-only.

**Why it happens:** App-layer EVD check is in the API endpoint; service-role direct write skips it.

**How to avoid:** DB trigger on `pr_outreach`: `BEFORE UPDATE` raises EXCEPTION when `NEW.status = 'sent'` AND `cardinality(NEW.evidence_refs) = 0`. Defense-in-depth.

**Warning signs:** EVD enforcement only mentioned in API endpoint, not in DB schema.

### Pitfall 4: G2/Capterra pricing profile drifts from Pricing Engine

**What goes wrong:** Operator updates G2 pricing profile manually outside MarkOS. SG-11 violation (pricing copy must consume Pricing Engine context). Customers see two different prices in two places.

**Why it happens:** No detection mechanism. G2/Capterra are external systems.

**How to avoid:** P220 pricing-sync table records every G2/Capterra pricing read. Cron compares current G2 pricing snapshot to Pricing Engine's approved recommendation. Drift > 0.5% raises a `pricing_drift_high` task. Manual update bypassed → still detected post-hoc.

**Warning signs:** Plan ships G2 pricing sync without drift-detection cron.

### Pitfall 5: Community signal duplication

**What goes wrong:** Same Slack post is ingested twice (e.g., by both real-time webhook and nightly poll). community_signals table has duplicate rows. Downstream phase double-counts signal.

**Why it happens:** No idempotency key on community_signals.

**How to avoid:** UNIQUE INDEX on `(tenant_id, community_id, source_post_id)` with `WHERE source_post_id IS NOT NULL`. Insert path uses ON CONFLICT DO NOTHING.

**Warning signs:** community_signals migration has no UNIQUE constraint.

### Pitfall 6: Event reminder dispatched after event ends

**What goes wrong:** Cron is delayed; T-7 reminder dispatches at T+0. Customers receive "see you in 7 days!" 30 minutes after event ends.

**Why it happens:** Cron schedule doesn't check event scheduled_at relative to send_at.

**How to avoid:** Cron query: `SELECT * FROM event_reminders WHERE send_at <= now() AND status='pending' AND EXISTS (SELECT 1 FROM marketing_events WHERE event_id = event_reminders.event_id AND scheduled_at > now() - INTERVAL '1 hour')`. The 1-hour buffer protects against late dispatch within the live window only.

**Warning signs:** Cron handler doesn't filter by event scheduled_at.

### Pitfall 7: Referral fraud_controls bypass via UI

**What goes wrong:** Operator sets `referral_programs.min_account_age_days = 0` to ship a launch promo. Later forgets to reset. Bot accounts farm rewards.

**Why it happens:** No UI guardrail; no minimum-floor.

**How to avoid:** DB CHECK constraint: `min_account_age_days >= 0`. App-layer warning when `min_account_age_days < 7` AND `reward_trigger = 'signup'` (not 'activation' or 'first_payment'). Approval gate triggers on every program update; reviewer sees the change.

**Warning signs:** No DB constraint on min_account_age_days.

### Pitfall 8: Developer content pricing claims drift

**What goes wrong:** Tutorial says "free tier includes 1000 API calls/month". Pricing Engine recommends raising to 5000. Tutorial is now stale; operator-facing copy diverges from public copy.

**Why it happens:** Developer content stored as plain text without pricing-context binding.

**How to avoid:** developer_content text searched for `{{MARKOS_PRICING_ENGINE_PENDING}}` placeholder OR explicit pricing-recommendation citation. Lint test: `grep -l "[0-9]+ API calls" lib/markos/growth/developer-content/*.md` must equal 0 unless flagged with pricing-recommendation-id.

**Warning signs:** developer_content stores hardcoded numeric pricing values.

### Pitfall 9: target agent registry runnable=true bug

**What goes wrong:** GENERATED ALWAYS column for `runnable` evaluates to true on insert despite app-layer `false` defaults — because Postgres GENERATED columns ignore application-supplied values.

**Why it happens:** GENERATED column expression includes columns that default to true (none in current schema), OR app-layer accidentally sets all 8 booleans to true.

**How to avoid:** Test asserts: insert seed row with `agent_token = 'TEST-AGT-01'` and verify `runnable = false`. Then update each boolean one-at-a-time and verify `runnable = false` until all 8 are true. Then verify `runnable = true`.

**Warning signs:** No test for runnable=true correctness on agent_readiness.

### Pitfall 10: P220-P227 ALTER TABLE column overlap

**What goes wrong:** P220 ships `partner_profiles.partner_kind`. P227 migration 160 adds `partner_profiles.partner_type` with overlapping semantics. Operator sees two columns with similar values.

**Why it happens:** Naming collision not surfaced during planning.

**How to avoid:** Test in `test/growth/migration-shape/p220-p227-altertable-readiness.test.js` — column-name diff between P220 schema + P227 D-02 expected adds must show NO overlap. Surface as Q-2.

**Warning signs:** P220 partner_profiles columns + P227 D-02 list overlap when normalized.

### Pitfall 11: Slot-collision blocks P227 execute

**What goes wrong:** P220 ships migration 172. P227 ships migration 159. P227 migration 159 references `partner_profiles` (created by P220 172). When `psql` applies in numeric order, 159 runs first, fails with "relation partner_profiles does not exist".

**Why it happens:** Migration numbering and execution order conflict.

**How to avoid:** P220 migration numbers MUST be less than P227's first slot (159). Recommended P220 slots: 97-105 + 108 (skip 106-107 if reserved by P221). See Q-3.

**Warning signs:** P220 plans propose migration numbers >= 159.

### Pitfall 12: agent registry seeded for tiers owned by other phases

**What goes wrong:** P220 migration seeds 28 rows including PLG-01..06 (P218) + ABM-01..03 (P219) + IAM-01 (P218). When P218/P219 ship, they re-INSERT same rows → duplicate-key error.

**Why it happens:** No coordination.

**How to avoid:** Use `INSERT ... ON CONFLICT (agent_token) DO UPDATE SET ...` so P218/P219 can re-seed their rows safely. Also: P218/P219 own their agent_token rows; P220 only seeds them so SG-10 invariant is preserved at first-launch.

**Warning signs:** Migration has plain `INSERT INTO growth_agent_readiness VALUES ...` without `ON CONFLICT`.

---

## Anti-Patterns to Avoid (carry forward from P221-P228 lessons)

| # | Anti-pattern | Why it's bad | What to do instead |
|---|-------------|--------------|---------------------|
| AP-1 | App-only enforcement of compliance gates | Service-role writes bypass; bypassable | DB triggers (matches P226 D-83/D-84) |
| AP-2 | Stub-if-missing dependency posture | Silent degrade hides upstream gaps | assertUpstreamReady hard-fail per P227 D-69 |
| AP-3 | Soft-skip for missing tables | Plan execution succeeds against non-existent schema | `MISSING_UPSTREAM_PHASE:<phase>` exit 1 |
| AP-4 | App Router migration in scope | Adds scope creep; not aligned with codebase reality | Legacy `api/*.js` flat handlers per §13 |
| AP-5 | vitest / playwright introduction | Not in package.json; introduces new toolchain | Node `--test` runner per §13 |
| AP-6 | Fictional helper invocation | Code refers to symbols that don't exist | Use verified symbols (§ Existing-Code Support) |
| AP-7 | createApprovalPackage usage | Symbol does not exist | `buildApprovalPackage` from `lib/markos/crm/agent-actions.ts:68` |
| AP-8 | requireSupabaseAuth usage | Symbol does not exist | `requireHostedSupabaseAuth` from `onboarding/backend/runtime-context.cjs:491` |
| AP-9 | Passive dashboard | SG-09 forbids passive dashboards | Every dashboard must produce tasks/approvals/experiments/learnings |
| AP-10 | Hardcoded MarkOS public pricing | PRC-09 forbids | Use `{{MARKOS_PRICING_ENGINE_PENDING}}` per CLAUDE.md placeholder rule |
| AP-11 | Service-role direct writes for compliance-gated mutations | Bypasses DB triggers via different code path | Block at DB-trigger layer; assert in tests via service-role direct UPDATE/INSERT attempt |
| AP-12 | Missing tombstone cascade | Deleting parent leaves orphan child rows | Use `lib/markos/governance/*` tombstone outbox pattern (matches P227 D-65) |
| AP-13 | Soft FK without test | "FK" in code with no DB constraint can drift | Either real FK with `REFERENCES`, OR test asserts referential integrity at app-layer |
| AP-14 | Implicit business_mode = 'saas' assumption | P227 ALTERs need explicit DEFAULT | P220 does NOT pre-allocate business_mode; P227 adds with `DEFAULT 'saas'` |
| AP-15 | Architecture-lock test only forbids; doesn't ASSERT correct symbols | Test passes when nothing exists | Test asserts both: (a) forbidden patterns absent, (b) verified symbols present in expected paths |

---

## Validation Architecture (workflow.nyquist_validation enabled per .planning/config.json)

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Node `--test` (built-in test runner) + `node:assert/strict` |
| Config file | None — discovery via `test/**/*.test.js` glob |
| Quick run command | `node --test test/growth/**/*.test.js` |
| Full suite command | `npm test` |
| Phase gate | Full suite green before `/gsd-verify-work` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| SG-04 | Referral programs + viral metrics + fraud controls | unit + integration | `node --test test/growth/referral/programs.test.js test/growth/referral/fraud-evaluator.test.js test/growth/referral/metrics-rollup.test.js` | ❌ Wave 0 |
| SG-04 | Referral reward issuance gated by approval | integration + DB-trigger | `node --test test/growth/referral/reward-issuance.test.js test/growth/referral/db-trigger-reward-requires-approval.test.js` | ❌ Wave 0 |
| SG-06 | Community profiles + signal fan-out | unit + integration | `node --test test/growth/community/profiles.test.js test/growth/community/signals-fan-out.test.js` | ❌ Wave 0 |
| SG-06 | Marketing events + reminders + attribution | unit + integration | `node --test test/growth/events/events.test.js test/growth/events/reminders.test.js test/growth/events/attribution.test.js` | ❌ Wave 0 |
| SG-06 | PR outreach + reviews + review requests | unit + integration | `node --test test/growth/pr/outreach.test.js test/growth/pr/reviews.test.js test/growth/pr/review-requests.test.js` | ❌ Wave 0 |
| SG-06 | Partnerships + affiliates + developer marketing | unit + integration | `node --test test/growth/partnerships/profiles.test.js test/growth/partnerships/affiliate-programs.test.js test/growth/partnerships/developer-content.test.js` | ❌ Wave 0 |
| SG-07 | Growth experimentation hooks (P218 owns registry) | smoke | `node --test test/growth/experimentation-hooks.test.js` | ❌ Wave 0 |
| SG-09 | Growth modules emit tasks/approvals/learnings (no passive dashboards) | architecture | `node --test test/growth/architecture-passive-system-detector.test.js` | ❌ Wave 0 |
| SG-10 | Target agent readiness registry; non-runnable until criteria met | unit | `node --test test/growth/agents-readiness/registry.test.js test/growth/agents-readiness/runnable-gate.test.js` | ❌ Wave 0 |
| SG-11 | Pricing-sensitive growth prompts use Pricing Engine context or placeholder | integration + DB-trigger | `node --test test/growth/pricing-context-resolver.test.js test/growth/partnerships/db-trigger-affiliate-pricing-required.test.js` | ❌ Wave 0 |
| SG-12 | External mutations approval-gated by default | integration + DB-trigger (per domain) | `node --test test/growth/**/db-trigger-*.test.js` | ❌ Wave 0 |
| API-01 | OpenAPI parity with F-ID YAML files | integration | `node --test test/growth/openapi/parity.test.js` | ❌ Wave 0 |
| MCP-01 | MCP tool family registers + responds to read-only tools | integration | `node --test test/growth/mcp-tools/index.test.js` | ❌ Wave 0 |
| QA-01..15 | Per phase 200 quality baseline | various | various per .planning/V4.0.0-PHASE-TEST-REQUIREMENTS-MATRIX.md | ❌ Wave 0 |
| Architecture-lock | Forbidden patterns absent + verified symbols present | grep-based | `node --test test/growth/architecture-lock.test.js` | ❌ Wave 0 |
| RLS isolation | Cross-tenant denial across all 17 P220 tables | integration | `node --test test/growth/rls/cross-tenant-denial.test.js` | ❌ Wave 0 |
| Migration shape | P220-P227 ALTER readiness | integration | `node --test test/growth/migration-shape/p220-p227-altertable-readiness.test.js` | ❌ Wave 0 |
| Tombstone cascade | Parent delete cascades to children + audit row written | integration | `node --test test/growth/tombstone-cascade.test.js` | ❌ Wave 0 |
| Preflight | assertUpstreamReady hard-fails on missing P214/P215/P218 | unit | `node --test test/growth/preconditions/upstream-check.test.js` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `node --test test/growth/<domain>/*.test.js` (the domain whose code changed)
- **Per wave merge:** `node --test test/growth/**/*.test.js` (full P220 test tree)
- **Phase gate:** `npm test` (full repo suite)
- **Pre-execute:** `node scripts/preconditions/220-NN-check-upstream.cjs` per plan

### Wave 0 Gaps

ALL test files are gaps. Plan 220-01 Task 0.5 ships the architecture-lock + first preflight + the test fixture factory base. Subsequent plans add per-domain test files.

- [ ] `test/growth/_fixtures/index.js` — shared factories (referralProgramFactory, communityProfileFactory, marketingEventFactory, prTargetFactory, partnerProfileFactory, agentReadinessFactory)
- [ ] `test/growth/architecture-lock.test.js` — forbidden patterns + symbol-presence assertions (Plan 220-01 Task 0.5)
- [ ] `test/growth/architecture-passive-system-detector.test.js` — every UI surface must emit task/approval/experiment/learning (Plan 220-06)
- [ ] `test/growth/preconditions/upstream-check.test.js` — preflight scripts behavior (Plan 220-01)
- [ ] `test/growth/openapi/parity.test.js` — F-ID YAML ↔ openapi.json parity (Plan 220-06)
- [ ] `test/growth/mcp-tools/index.test.js` — MCP registration + read-only tool tests (Plan 220-06)
- [ ] `test/growth/rls/cross-tenant-denial.test.js` — all 17 P220 tables (Plan 220-01 → 220-06 cumulative)
- [ ] `test/growth/migration-shape/p220-p227-altertable-readiness.test.js` — ALTER readiness assertion (Plan 220-05 — partnerships is the largest ALTER target)
- [ ] `test/growth/tombstone-cascade.test.js` — parent delete cascades (Plan 220-06)
- [ ] `test/growth/pricing-context-resolver.test.js` — pricing-engine-pending sentinel + recommendation-id resolution (Plan 220-01 + 220-05)
- [ ] Per-domain test files (referral, community, events, pr, partnerships) — 5 plans × ~3-5 files = ~15-25 test files
- [ ] Framework install: NONE — Node `--test` is built-in. No `npm install` step.

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | `requireHostedSupabaseAuth` from runtime-context.cjs:491 |
| V3 Session Management | yes | Session model from P201 (markos_sessions_devices migration 85) — inherited |
| V4 Access Control | yes | RLS per `markos_orgs.tenant_id` + GRANT/REVOKE patterns; auth-helper-derived role binding |
| V5 Input Validation | yes | zod schemas in `lib/markos/growth/contracts.ts` parity-tested with F-ID YAML |
| V6 Cryptography | yes (limited) | Cron auth tokens use `crypto.timingSafeEqual` from Node stdlib; HMAC-SHA256 for any future webhook signatures (deferred to P227); never hand-roll |
| V7 Error Handling | yes | All API responses use `writeJson(res, status, payload)` per `api/cron/webhooks-dlq-purge.js` pattern; no stack traces in response |
| V8 Data Protection | yes | tenant-scoped data behind RLS; PII in pr_targets.email + review_records.reviewer_name acceptable (public-facing); audit log emits cleartext per existing audit chain (SHA-256 hashed in chain) |
| V9 Communication | yes | TLS via Vercel; outbound emails go through P210/P223 channel substrate (DKIM/SPF/DMARC inherited) |
| V10 Malicious Code | n/a | no executable upload/eval; all data is text + URLs |
| V11 Business Logic | yes | approval gates (buildApprovalPackage); fraud_controls; idempotency on referral_invitations.invitation_code unique; reward_trigger constrains payout to qualified events |
| V12 File and Resources | partial | No file uploads in P220 v1 (developer_content.url is text only) |
| V13 API and Web Services | yes | OpenAPI 3.1 contracts (`contracts/openapi.json`), F-ID parity tests, rate-limit inheritance from P201 |
| V14 Configuration | yes | env vars: `MARKOS_GROWTH_CRON_SECRET`, no hardcoded secrets, secrets in environment only |

### Known Threat Patterns for {Node.js + Postgres + Vercel + Supabase} stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| SQL injection on referral_code lookup | Tampering | Parameterized queries via `@supabase/supabase-js` query builder; never string-concatenated SQL |
| Cross-tenant data leakage on shared community_signals | Information Disclosure | RLS on `tenant_id` + every API endpoint asserts `runtimeContext.tenant_id` matches resource |
| Affiliate payout double-spend | Tampering / Repudiation | DB unique constraint on `(invitation_id, reward_kind)` + buildApprovalPackage idempotency key |
| Referral fraud (bot accounts farm rewards) | Spoofing / Tampering | fraud_controls (min_account_age + require_paid + self_referral + vpn_detection) at app + DB layer |
| PR pitch evidence stripped via service-role | Tampering | DB trigger on `pr_outreach`: cardinality(evidence_refs) > 0 when status='sent' |
| G2 review request to non-customer | Information Disclosure | trigger_kind eligibility check (NPS/CSAT/health_score from existing tables); buildApprovalPackage |
| Cron token leaked → unauthorized rollup | Spoofing | Token comparison via `crypto.timingSafeEqual`; unique cron token per environment; rotate on incident |
| Webhook signature forgery (deferred) | Spoofing | HMAC-SHA256 verify; deferred to P227 implementation |
| Sentiment classifier prompt injection | Tampering | Sanitize review_body before LLM call; cap length; existing LLM adapter cost guards apply |
| Public partner directory exposes PII | Information Disclosure | Public directory deferred to P227; v1 P220 surface is operator-only |
| Affiliate program brand-term ads | Tampering / Reputation | prohibited_methods enforcement at fraud-evaluator + buildApprovalPackage approval review |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | P218 SaaSGrowthProfile.saas_model is required reading for P220 module activation | §Doctrine + §6 Domain 6 | LOW — P220 can default to b2b activation if missing |
| A2 | P227 will use additive ALTER (CREATE only if absent), so P220 schema can ship without P227 columns | §P220 → P227 ALTER TABLE | MEDIUM — if P227 changes to require fresh CREATE, P220 schema is wrong |
| A3 | Migration slots 97-105 are still free (not pre-empted by P218/P219 plan-up work) | §F-ID and Migration Slot Allocation | HIGH — direct collision risk; surfaced as Q-3 |
| A4 | P227 affiliate_programs ships ecosystem-mode rows; P220 affiliate_programs ships saas-mode rows | §Pitfall 1 + §Q-1 | HIGH — if P227 creates the table fresh, P220 collides; surfaced as Q-1 |
| A5 | partner_kind (P220) and partner_type (P227) coexist semantically | §P220 → P227 ALTER TABLE + Pitfall 10 + Q-2 | MEDIUM — naming conflict requires reconciliation; surfaced as Q-2 |
| A6 | Doc 17 TypeScript interfaces are the implementation truth for column types and ENUMs | §Doctrine + §6 each domain | LOW — vault canon agrees |
| A7 | LLM-based sentiment classifier is acceptable cost for ~10 reviews/day per tenant | §Library Choices | LOW — operator-tunable; offline classifier is a 1-day swap |
| A8 | Manual CSV payout export (no Stripe Connect) matches P227 D-71 stance | §Deferred Ideas + §Domain 5 | LOW — explicitly deferred |
| A9 | Event platforms (Eventbrite/Lu.ma/Hopin) integration deferred to v4.3.0 | §Deferred Ideas + §Domain 3 | LOW — operator-driven URL field works |
| A10 | growth_agent_readiness table system-level (not tenant-scoped) is correct | §6 Domain 6 | LOW — these are platform-wide registry entries; matches existing literacy admin pattern |
| A11 | Community webhook signatures (Slack signing-secret, Discord Ed25519) deferred to P227 | §Library Choices + §Security | LOW — v1 manual operator workflow OK |
| A12 | NewsAPI / Google Alerts use existing connector substrate (RES-03) | §Domain 4 | MEDIUM — RES-03 implementation status not verified |
| A13 | The 28 doc 17 target agents include 19 P220-relevant tiers (VRL/CMT/EVT/PR/PRT/DEV/REV) and 9 sibling-relevant tiers (PLG/EXP/ABM/IAM/XP) | §Doctrine + §6 Domain 6 | LOW — counted from doc 17 line 1533-1585 |
| A14 | UI surface uses Storybook + Chromatic (matching P226 D-46 pattern), NOT App Router | §6 Domain 6 + §Architecture-Lock | LOW — verified P226 pattern |
| A15 | Environment availability sufficient (Node, Postgres, Supabase) — no new external deps | §Environment Availability | LOW — verified existing stack |

---

## Open Questions

### Q-1: P220 vs P227 affiliate_programs ownership (HIGH-impact; blocks Plan 220-05)

**What we know:** P227 RESEARCH migration 162 says it ships `affiliate_programs`. P220 plan stub 220-05 says affiliate program (per doc 17 line 1292). Two phases creating the same table is a migration collision.

**What's unclear:** Whether P227 author intended to ALTER P220's table (consistent with D-12 ALTER pattern) or CREATE fresh.

**Recommendation:** P220 owns base `affiliate_programs` per doc 17 doctrine. P227 ALTERs it additively per D-12. **Action:** during planning, the planner MUST surface this conflict and either (a) update P227 RESEARCH to mark migration 162 as ALTER, or (b) escalate to user for manual reconciliation per CLAUDE.md drift rule.

**Resolution path:** Planner Plan 220-05 Task 0 = "Read P227 RESEARCH migration 162 + RESOLVE collision; emit `.planning/V4.1.0-P220-P227-AFFILIATE-COLLISION-RESOLUTION.md` documenting agreement."

---

### Q-2: partner_kind (P220) vs partner_type (P227) naming collision (MEDIUM-impact; blocks Plan 220-05)

**What we know:** Doc 17 line 1255 lists partnership types as `technology / referral / affiliate / co_marketing / reseller / white_label`. P220 ships these as `partner_kind` ENUM. P227 D-02 lists `partner_type ∈ {agency, technology, consulting, reseller, affiliate, integrator, devshop, association}` — overlapping set with semantic differences.

**What's unclear:** Whether P220 should rename `partner_kind` to avoid collision OR P227 should adjust its naming.

**Recommendation:** P220 keeps `partner_kind` (matches doc 17 + canon). P227 keeps `partner_type` (its own ENUM). Both columns coexist. P227 may deprecate `partner_kind` later via migration. **Verify:** P227 plan author confirms acceptance.

---

### Q-3: F-ID + migration slot collision with P218/P219/P221+ (HIGH-impact; blocks Plan 220-01 Task 0.1)

**What we know:** Highest on-disk migration is 96. P227 starts at 159 (F-181..F-198). P226 starts at 146 (F-163..F-180). P220 needs ~10-12 migrations + ~19 F-IDs. P218 + P219 are unallocated.

**What's unclear:** What slots P218/P219 will claim. Whether P220 should pre-empt or coordinate.

**Recommendation:** Planner Plan 220-01 Task 0.1 = "Coordinate with P218/P219/P221 owners (open `.planning/V4.1.0-MIGRATION-SLOT-COORDINATION.md`); allocate P220 to slots 97-105 + 108 with explicit gap reservations; F-IDs F-NEW-209..F-NEW-227 (sequential after planned P227 F-198)."

If P218/P219 plan-up work has not landed by execution time, escalate per CLAUDE.md drift rule.

---

### Q-4: P218 SaaSGrowthProfile.saas_model availability (MEDIUM-impact)

**What we know:** P218 CONTEXT.md is a 16-line stub. SaaSGrowthProfile is the gating record for P220 module activation per canon. P218 is not yet planned.

**What's unclear:** Whether P218 will ship before P220 in execution order, or whether they ship in parallel.

**Recommendation:** P220 hard-prereqs P218 via assertUpstreamReady. If P218 not yet shipped at execution time, P220 cannot run. ROADMAP.md ordering already places P218 before P220.

---

### Q-5: P209 EvidenceMap availability for PR pitch evidence_refs validation (MEDIUM-impact)

**What we know:** P220 PR pitch DB-trigger asserts `cardinality(evidence_refs) > 0` when `status='sent'`. evidence_refs is `uuid[]` referencing EvidenceMap (P209). P209 is `📋 Planned` per ROADMAP, dependency of P220 via SOFT preflight.

**What's unclear:** Whether P220 ships with hard EVD-02 enforcement (DB trigger uses real evidence_refs) or soft (DB trigger checks cardinality > 0 only, no FK validation).

**Recommendation:** Soft enforcement in v1 (cardinality > 0 only; no real FK to EvidenceMap). Once P209 ships, harden to FK validation in a follow-up migration. Mark in CONTEXT decision log.

---

### Q-6: P220 hardcoded English-only pr_outreach pitch language (LOW-impact)

**What we know:** Doc 17 examples are English. Tenant base may be multilingual.

**What's unclear:** Whether P220 needs locale support in v1.

**Recommendation:** Single language (tenant brand-pack default) in v1. Locale extension deferred to v4.3.0. Surface as Deferred Idea.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | All P220 code | ✓ | (existing repo target — `node --test` available; LTS 20+ assumed) | — |
| PostgreSQL via Supabase | All schema work | ✓ (Supabase project; service-role key in env) | 15+ | — |
| Anthropic SDK | sentiment classifier (optional) | ✓ | `@anthropic-ai/sdk@^0.82.0` per package.json | offline `vader-sentiment` swap |
| Vercel cron | growth-* cron handlers | ✓ (existing pattern) | — | manual cron via separate worker |
| `@supabase/supabase-js` | DB client | ✓ | existing dep | — |
| Slack / Discord / Discourse / Circle SDKs | community signal ingest (deferred) | ✗ | — | manual CSV import; native ingest in v4.3.0 |
| Eventbrite / Lu.ma / Hopin SDKs | event integration (deferred) | ✗ | — | text-only platform field |
| G2 / Capterra API | review ingest (deferred) | ✗ | — | manual operator entry |
| NewsAPI / Google Alerts | coverage ingest | ✗ (RES-03 status unverified) | — | manual operator entry |
| `vader-sentiment` | offline sentiment classifier (alternative) | ✗ | — | LLM adapter (existing) |

**Missing dependencies with no fallback:** None blocking P220 v1.

**Missing dependencies with fallback:** All deferred external integrations (community platforms, event platforms, review platforms) operate via manual operator workflows in v1. Operator pastes URL / CSV imports / manual entry. v4.3.0 milestone may add native integration.

---

## Code Examples

Verified patterns from this codebase (citations are repo-relative, lines verified 2026-04-26).

### Approval gate wiring

```typescript
// lib/markos/referral/reward-issuance.ts (NEW — Plan 220-01)
import { buildApprovalPackage } from '../crm/agent-actions';
// Source: lib/markos/crm/agent-actions.ts:68-133 — verified function exists

export async function issueReferralReward({
  invitation_id,
  reward_kind,
  reward_value_cents,
  pricing_recommendation_id,
  tenant_id,
  initiated_by,
}: IssueReferralRewardInput) {
  // 1. Pricing-context check (SG-11)
  if (reward_kind !== 'feature_unlock' && !pricing_recommendation_id) {
    throw new Error('REWARD_REQUIRES_PRICING_CONTEXT');
  }

  // 2. Build approval package (SG-12)
  const approval = await buildApprovalPackage({
    kind: 'referral_reward_issuance',
    tenant_id,
    initiated_by,
    payload: { invitation_id, reward_kind, reward_value_cents, pricing_recommendation_id },
    risk_class: reward_value_cents > 50_00 ? 'high' : 'standard',
  });

  // 3. Persist to referral_invitations (DB trigger asserts approval_id present)
  const { data, error } = await supabase
    .from('referral_invitations')
    .update({
      reward_issued_at: new Date().toISOString(),
      reward_approval_id: approval.approval_id,
    })
    .eq('invitation_id', invitation_id)
    .eq('tenant_id', tenant_id);

  if (error) throw error;
  return { approval_id: approval.approval_id, invitation_id };
}
```

### Auth helper usage in API endpoint

```javascript
// api/v1/growth/referral/programs.js (NEW — Plan 220-01)
'use strict';

const { requireHostedSupabaseAuth } = require('../../../../onboarding/backend/runtime-context');
// Source: onboarding/backend/runtime-context.cjs:491 — verified function exists

async function handle(req, res) {
  const runtime = require('../../../../onboarding/backend/runtime-context').getRuntimeContext();

  let auth;
  try {
    auth = requireHostedSupabaseAuth({
      req,
      runtimeContext: runtime,
      operation: 'growth_referral_programs_list',
    });
  } catch (err) {
    return writeJson(res, 401, { success: false, error: err.message });
  }

  // tenant_id derived from auth.tenant_id (set by requireHostedSupabaseAuth)
  // ... query referral_programs WHERE tenant_id = auth.tenant_id ...
}

module.exports = { handle };
```

### Cron handler skeleton

```javascript
// api/cron/growth-viral-metrics-rollup.js (NEW — Plan 220-01)
'use strict';

// Schedule: '0 4 * * *' (daily 04:00 UTC — offset from existing crons in api/cron/*)
// Auth: shared-secret header (x-markos-cron-secret) OR Bearer token matching MARKOS_GROWTH_CRON_SECRET.
// Returns { success, count, duration_ms }.

const { rollupViralMetrics } = require('../../lib/markos/referral/metrics');

function writeJson(res, status, payload) {
  if (typeof res.writeHead === 'function') res.writeHead(status, { 'Content-Type': 'application/json' });
  else { res.statusCode = status; if (typeof res.setHeader === 'function') res.setHeader('Content-Type', 'application/json'); }
  res.end(JSON.stringify(payload));
}

function authorized(req) {
  const expected = process.env.MARKOS_GROWTH_CRON_SECRET;
  if (!expected) return false;
  const header = req.headers['x-markos-cron-secret'] || req.headers['X-Markos-Cron-Secret'] || '';
  const auth = (req.headers.authorization || req.headers.Authorization || '').replace(/^Bearer\s+/i, '');
  return header === expected || auth === expected;
}

async function handle(req, res) {
  if (req.method !== 'POST') return writeJson(res, 405, { success: false, error: 'METHOD_NOT_ALLOWED' });
  if (!authorized(req)) return writeJson(res, 401, { success: false, error: 'UNAUTHORIZED' });

  const started = Date.now();
  try {
    const { count } = await rollupViralMetrics();
    return writeJson(res, 200, { success: true, count, duration_ms: Date.now() - started });
  } catch (err) {
    return writeJson(res, 500, { success: false, error: String(err?.message || err) });
  }
}

module.exports = { handle };
```

### MCP tool registration

```javascript
// lib/markos/mcp/tools/growth.cjs (NEW — Plan 220-06)
'use strict';

const { listReferralPrograms } = require('../../referral/programs.cjs');

const tools = {
  growth_referral_programs_list: {
    description: 'List active referral programs for the current tenant.',
    input_schema: { type: 'object', properties: { status: { type: 'string', enum: ['active', 'paused', 'draft'] } } },
    handler: async (input, context) => {
      const programs = await listReferralPrograms(context.tenant_id, input.status);
      return { content: [{ type: 'json', json: programs }] };
    },
    cost_estimate_cents: 0,  // read-only
    approval_required: false,
  },
  // ... 11 more tools per Domain 6 surface table
};

module.exports = { tools };

// Then in lib/markos/mcp/tools/index.cjs (EXISTING — verified):
// const growth = require('./growth.cjs');
// Object.assign(allTools, growth.tools);
```

### Architecture-lock test

```javascript
// test/growth/architecture-lock.test.js (NEW — Plan 220-01 Task 0.5)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';

const FORBIDDEN_PATTERNS = [
  'createApprovalPackage',
  'requireSupabaseAuth',
  'lookupPlugin',
  'requireTenantContext',
  'serviceRoleClient',
  'app/(growth)',
  'route.ts',
  'public/openapi.json',
];

const SCAN_DIRS = [
  'lib/markos/growth',
  'lib/markos/referral',
  'lib/markos/community',
  'lib/markos/events',
  'lib/markos/pr',
  'lib/markos/partnerships',
  'api/v1/growth',
  'api/cron',  // only growth-* files
];

const REQUIRED_SYMBOLS = [
  { symbol: 'buildApprovalPackage', source: 'lib/markos/crm/agent-actions.ts:68' },
  { symbol: 'requireHostedSupabaseAuth', source: 'onboarding/backend/runtime-context.cjs:491' },
  { symbol: 'resolvePlugin', source: 'lib/markos/plugins/registry.js:102' },
];

test('architecture-lock: forbidden patterns absent in P220 code', () => {
  for (const pattern of FORBIDDEN_PATTERNS) {
    for (const dir of SCAN_DIRS) {
      const filter = dir === 'api/cron' ? `--include="growth-*.js"` : '';
      try {
        execSync(`grep -r ${filter} "${pattern}" ${dir}`, { stdio: 'pipe' });
        assert.fail(`Forbidden pattern "${pattern}" found in ${dir}`);
      } catch (err) {
        // grep exits 1 when no match — desired
        assert.equal(err.status, 1, `grep ${pattern} in ${dir} unexpected status ${err.status}`);
      }
    }
  }
});

test('architecture-lock: required symbols present at verified paths', async () => {
  // Spot-check via dynamic import / require resolution
  const cax = await import('../../lib/markos/crm/agent-actions.ts');
  assert.equal(typeof cax.buildApprovalPackage, 'function');

  const rc = require('../../onboarding/backend/runtime-context.cjs');
  assert.equal(typeof rc.requireHostedSupabaseAuth, 'function');

  const pr = require('../../lib/markos/plugins/registry.js');
  assert.equal(typeof pr.resolvePlugin, 'function');
});
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Pre-P226 plans assumed App Router migration | Legacy `api/*.js` flat handlers locked per P226 D-78 | 2026-04-25 | P220 inherits; eliminates ~50 hours of scope creep |
| Pre-P227 plans assumed soft-skip on missing upstream | assertUpstreamReady hard-fail per P221 D-35 / P226 D-87 / P227 D-69 | 2026-04-26 | P220 inherits; surfaces missing deps at preflight, not mid-execution |
| Pre-P226 plans relied on app-only EVD/SG-12 enforcement | DB-trigger defense-in-depth per P226 D-83/D-84 / P223 D-51 | 2026-04-25 | P220 inherits; service-role bypasses blocked at DB layer |
| Pre-P226 plans used vitest by default | Node `--test` runner (no install required) | 2026-04-25 | P220 inherits; no new toolchain; matches `package.json` scripts |
| Pre-P226 plans hand-rolled approval logic | `buildApprovalPackage` is the single helper | always — verified 2026-04-26 | consistency across P220-P227 surfaces |

**Deprecated/outdated:**
- `createApprovalPackage` — never existed; not in any current code path
- `requireSupabaseAuth` — never existed; replaced by `requireHostedSupabaseAuth`
- `route.ts` (App Router) — banned in P220-P227 except P226 D-78 single exception
- vitest / playwright — not installed; node:test runner is canonical

---

## Sources

### Primary (HIGH confidence)

- `obsidian/brain/SaaS Marketing OS Strategy Canon.md` — vault canon (wins for product shape per CLAUDE.md rule 1)
- `obsidian/work/incoming/17-SAAS-MARKETING-OS-STRATEGY.md` — RAW intake, source of TypeScript interfaces (lines 638-712, 864-901, 996-1048, 1075-1132, 1255-1395, 1416-1471)
- `.planning/REQUIREMENTS.md` — SG-04, SG-06..12, API-01, MCP-01, QA-01..15
- `.planning/ROADMAP.md` — Phase 220 entry (lines 398-413)
- `./CLAUDE.md` — source-of-truth precedence, drift rule, placeholder rule
- Filesystem enumeration 2026-04-26 — verified existing `lib/markos/` directories, verified non-existent paths, verified package.json scripts
- `lib/markos/crm/agent-actions.ts:68-133` — verified `buildApprovalPackage` symbol
- `onboarding/backend/runtime-context.cjs:491-1014` — verified `requireHostedSupabaseAuth` symbol
- `lib/markos/plugins/registry.js:102-113` — verified `resolvePlugin` symbol
- `api/cron/webhooks-dlq-purge.js` — cron handler pattern source
- `.planning/phases/227-ecosystem-partner-community-developer-growth/227-CONTEXT.md` lines 34-35, 47-49, 135-153, 248-264 — P227 ALTER expectations
- `.planning/phases/227-ecosystem-partner-community-developer-growth/227-RESEARCH.md` lines 188-189, 433-454, 825 — P227 migration 160 + 161 + 162 schemas
- `.planning/phases/226-sales-enablement-deal-execution/226-CONTEXT.md` D-78, D-83, D-84, D-85 — architecture-lock + DB-trigger patterns
- `.planning/phases/222-crm-timeline-commercial-memory-workspace/222-CONTEXT.md` D-30, D-49 — F-ID slot pattern

### Secondary (MEDIUM confidence)

- `obsidian/brain/SaaS Suite Canon.md` — referenced via vault canon chain (not directly read in this research; wins for SaaS Suite product shape but P220 is post-Suite scope)
- `obsidian/brain/Pricing Engine Canon.md` — referenced; placeholder rule + Pricing Engine ownership
- `.planning/V4.0.0-PHASE-TEST-REQUIREMENTS-MATRIX.md` — referenced via QA-01..15
- `.planning/V4.0.0-TESTING-ENVIRONMENT-PLAN.md` — referenced via cross-phase testing doctrine

### Tertiary (LOW confidence — mark for validation)

- P218 SaaSGrowthProfile.saas_model availability — A1 / Q-4
- P209 EvidenceMap.id stable schema — A12 / Q-5
- RES-03 (NewsAPI / Google Alerts) connector status — A12
- Migration slot collision resolution — A3 / Q-3 (depends on P218/P219 plan-up work)
- Affiliate program ownership P220-vs-P227 — A4 / Q-1 (depends on P227 plan author confirmation)

---

## Metadata

**Confidence breakdown:**
- Standard stack (Node, Postgres, Supabase): HIGH — all verified existing
- Architecture-lock: HIGH — verified by codebase grep + cross-reference to P226/P227
- Object models (5 SOR clusters): HIGH — doc 17 + canon agree; P227 ALTER expectations explicit
- Compliance enforcement boundaries: HIGH — pattern matches P226 D-83/D-84
- Approval gate triggers: HIGH — pattern matches P227 D-65 + canon line 139-150
- F-ID + migration slot allocation: LOW — collision risk requires P218/P219 coordination (Q-3)
- P220 ↔ P227 affiliate_programs ownership: MEDIUM — collision flagged but not yet resolved (Q-1)
- partner_kind ↔ partner_type naming: MEDIUM — coexistence acceptable but should be confirmed (Q-2)
- Sentiment classifier choice: HIGH — LLM adapter exists, no new dep
- External integrations deferred: HIGH — explicitly documented in §Deferred Ideas
- Validation Architecture: HIGH — all tests are gaps (Wave 0 surface)
- Security domain ASVS coverage: HIGH — patterns verified against repo
- Open questions: 6 surfaced; 3 HIGH-impact (Q-1, Q-3); 2 MEDIUM (Q-2, Q-4, Q-5); 1 LOW (Q-6)

**Research date:** 2026-04-26
**Valid until:** 2026-05-26 (30 days for stable doctrine; reduce to 7 days if P218/P219/P221 plan-up work lands earlier — re-research at that point)

**Total length:** ~1100+ lines (matches P221-P228 envelope)
**Replaces:** 23-line stub
**Ready for planning:** Yes, with explicit blockers Q-1 and Q-3 surfaced for planner to address before execution.
