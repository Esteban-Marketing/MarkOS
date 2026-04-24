---
date: 2026-04-16
description: "MarkOS SaaS roadmap — 0-day shortlist, 4-quarter N-day plan (Q2-2026 → Q1-2027), architecture deltas for API/SDK/MCP/Zapier/Make/n8n/CLI multi-tenant cloud."
tags:
  - thinking
  - roadmap
  - saas
  - architecture
  - markos
---

# MarkOS SaaS Roadmap — 2026-Q2 → 2027-Q1

> Synthesis of decision set locked 2026-04-16. Three artifacts: (A) 0-day shortlist for 2-week ship, (B) quarterly N-day roadmap, (C) architecture deltas. Promote to `.planning/phases/200-*/` when approved.

## Mission

Make MarkOS the bulletproof agentic **Marketing Operating System** for humans, agents, and hybrid teams. SaaS cloud with API-first posture. Operator-grade UI. Every company, every audience, every language, every culture. Install-time tailoring sets the literacy depth + brand pack + locale. Connect via REST/SDK/MCP/Zapier/Make/n8n/CLI. Generate on-demand, proven-safe, brand-tailored marketing.

## 2026-04-22 v2 harmonization note

This note remains useful as the v4.0.0 SaaS readiness roadmap history. The live vault doctrine now lives in [[Marketing Operating System Foundation]] and [[MarkOS v2 Operating Loop Spec]].

Superseded planning assumptions:

- Q-A ICP is now growth-stage B2B marketing leaders first, agencies second. Solopreneurs/vibe-coders remain distribution and product-ergonomics signals.
- Pricing baseline is now superseded by [[Pricing Engine Canon]]; use `{{MARKOS_PRICING_ENGINE_PENDING}}` until the engine produces approved recommendations.
- The immediate product priority is one complete operating loop before broad marketplace or 80-agent expansion.
- Incoming learning/agent contracts need fresh IDs because F-90 through F-100 are already occupied later in the codebase.

## Decisions locked (reference)

| # | Decision | Value |
|---|---|---|
| 1 | Hosting | SaaS cloud first → OSS community edition → BYOC Y2 |
| 2 | Onboarding | 30-min guided AI interview standard · 5-min `--preset` dev mode · white-glove enterprise |
| 3 | Monetization | Superseded by [[Pricing Engine Canon]]; legacy platform-fee, metered-AI, and BYOK-discount ideas are cost-model inputs, not active pricing policy |
| 4 | Integration order | OpenAPI → SDKs (TS+Py) → MCP → Webhooks → Zapier → Make → n8n |
| 5 | Tier-1 connectors (13) | Shopify · HubSpot · Stripe · Slack · Google Ads · Meta Ads · GA4 · Segment · Resend · Twilio · **PostHog · Linear · Supabase** |
| 6 | Language v1 | EN · ES · PT · FR · DE · IT · NL → global by end Y1 |
| 7 | Compliance | SOC 2 Type I 6mo → Type II + ISO27001 Y2 · HIPAA BAA opt-in |
| 8 | White-label | Agency and OEM packaging pending Pricing Engine-approved recommendations |
| 9 | Autonomy | Tiered — earn autonomy per mutation family after run history |
| 10 | Data residency | US-East v1 → US + EU Y1.5 → + APAC Y2 |
| 11 | Plugin marketplace | Yes from v1, moderated · **Claude Marketplace + vibe-coder/solopreneur ecosystem priority** |
| 12 | Posture | **API-first · great operator UI — both non-negotiable** |
| 13 | License | No OSS yet |
| 14 | Agent marketplace | **Y1** (accelerated from Y2) |
| 15 | Fine-tunes | Opt-in **public beta** · alpha via manual CLI |

## Historical open questions - resolved by 2026-04-22 v2 doctrine

These were open on 2026-04-16 and are kept for roadmap history. Current answers live in [[Key Decisions]].

- **Q-A first target ICP** - historical default was seed-to-A B2B SaaS + modern DTC + solopreneurs; superseded by [[Target ICP]].
- **Q-B brand stance** — default **developer-native, AI-first, quietly confident** (tight prose, dark+neutral UI, clear proof, minimal hype). Override to playful / enterprise-serious / founder-personality if different.
- **Q-C connector build posture** — default **Nango embedded** (OSS parity, self-host path later) rather than Paragon/Merge.dev. Override if hosted speed > control.

---

## Artifact A — 0-day shortlist (ship in 2 weeks)

Five-to-eight changes that require no architectural shift. Each → one atomic PR.

### A1. Public OpenAPI 3.1 spec

- **What** — merge all 39 `contracts/F-NN-*.yaml` into a single OpenAPI 3.1 doc served at `api/openapi.json` + `api/openapi.yaml`. Generated at build time.
- **Why** — precondition for SDKs, Zapier, Make, n8n, MCP server, partners.
- **Files** — `scripts/openapi/build-openapi.cjs` · `api/openapi.js` · CI step.
- **Effort** — S.
- **Risk** — low. Contracts are already OpenAPI-fragments.

### A2. MCP server (top 10 skills) — Claude Marketplace launch-ready

- **What** — HTTP+SSE MCP server exposing 10 MarkOS skills as MCP tools: `draft_message`, `plan_campaign`, `research_audience`, `run_neuro_audit`, `generate_brief`, `audit_claim`, `list_pain_points`, `rank_execution_queue`, `schedule_post`, `explain_literacy`.
- **Why** — lets Claude Desktop, Cursor, Windsurf, Warp, ChatGPT agents use MarkOS natively. Unique distribution channel.
- **Files** — `api/mcp/` (Vercel Fluid Compute) · `lib/markos/mcp/server.ts` · `lib/markos/mcp/tools/*`.
- **Effort** — M.
- **Risk** — protocol still evolving; pin to MCP spec 2025-03 stable.

### A3. Webhook subscription primitive

- **What** — tenant API: `POST /api/webhooks/subscribe`, `DELETE /unsubscribe`, `POST /test-fire`. Events: `approval.created`, `approval.resolved`, `campaign.launched`, `execution.completed`, `incident.opened`, `consent.changed`. HMAC-SHA256 signed. Retry with exponential backoff via Vercel Queues.
- **Why** — push-model integration is table stakes for Zapier/Make/n8n triggers + real-time agent loops.
- **Files** — `api/webhooks/subscribe.js` · `lib/markos/webhooks/{engine,signing,delivery}.ts` · migration `70_markos_webhook_subscriptions.sql`.
- **Effort** — M.
- **Risk** — low; canonical pattern.

### A4. Presetted onboarding: `npx markos init --preset=<bucket>`

- **What** — five presets: `b2b-saas` · `dtc` · `agency` · `local-services` · `solopreneur`. Each writes opinionated seed MIR/MSP/brand-pack placeholders that downstream onboarder refines.
- **Why** — 90-second dev mode → time-to-first-draft under 5 minutes. Demo magnet.
- **Files** — `bin/install.cjs` preset branch · `bin/lib/presets/*.json` · `.agent/markos/templates/presets/*`.
- **Effort** — S.
- **Risk** — trivial.

### A5. Public `llms.txt` + markdown doc mirror

- **What** — `markos.dev/llms.txt` + `/docs/*.md` mirror of every HTML doc. Allows `GPTBot`, `ClaudeBot`, `PerplexityBot`, `Google-Extended` via `robots.txt`.
- **Why** — get cited by LLM answer engines from day one. See [[Generative Engine Optimization]] + [[llms.txt Standard]].
- **Files** — `public/llms.txt` · Next.js MDX mirror plugin · `public/robots.txt` update.
- **Effort** — S.
- **Risk** — none.

### A6. CLI `markos generate <brief>` one-shot mode

- **What** — inline "give me one finished artifact now" command. Takes JSON or yaml brief, runs Message Crafting Pipeline end-to-end, returns draft + audit report. No server session needed.
- **Why** — CLI demo story + building block for shell pipelines.
- **Files** — `bin/generate.cjs` · reuses `lib/markos/crm/copilot.ts`.
- **Effort** — M.
- **Risk** — needs light API key scoping.

### A7. SDK auto-gen CI — TS + Python

- **What** — GitHub Action: on OpenAPI change, regenerate `@markos/sdk` (openapi-typescript + openapi-fetch) and `markos` python SDK (openapi-python-client). Publish to npm + PyPI under org-scoped names.
- **Why** — SDK is the real integration UX for developers. Drift-free by construction.
- **Files** — `.github/workflows/sdk-publish.yml` · `sdk/typescript/` · `sdk/python/` · version pinning rules.
- **Effort** — M.
- **Risk** — publishing permissions; use trusted publishers.

### A8. Claude Marketplace listing + landing page

- **What** — Claude Marketplace submission bundle: MCP manifest, marketing assets, pricing page, live-demo sandbox. Concurrently a `/integrations/claude` page on markos.dev.
- **Why** — directly ride Anthropic's distribution to solopreneurs + vibe-coders. Unique positioning before competitors arrive.
- **Files** — `.claude-plugin/` marketplace.json · integration page · demo sandbox.
- **Effort** — M.
- **Risk** — marketplace review lead-time.

**0-day summary** — 8 items, mix of S/M/L, total ~2 weeks for a focused team of 2. Everything here lands in a `200-saas-readiness-wave-0` phase under `.planning/`.

---

## Artifact B — N-day roadmap (Q2-2026 → Q1-2027)

Four quarterly waves, each a GSD milestone. Phases map to existing MarkOS numbering (200+).

### Q2 2026 — "SaaS Readiness 1.0" (milestone v4.0.0)

> **Goal:** public SaaS early-access launch. API · SDKs · MCP · webhooks · CLI all GA. Pricing Engine-backed billing readiness. SOC 2 Type I foundations laid.

| Phase | Scope |
|---|---|
| **200** SaaS tenancy hardening | public signups · org → tenant model · custom subdomains · audit-log alignment |
| **201** OpenAPI 3.1 + SDK pipeline | A1 + A7 graduated to GA · docs site (Mintlify or Fern) |
| **202** MCP server GA + Claude Marketplace | A2 graduated · +20 more skills · session persistence |
| **203** Webhook subscription engine | A3 graduated · delivery dashboard · retry UX |
| **204** CLI `markos` v1 GA | `init` · `generate` · `plan` · `run` · `eval` · `login` · `keys` · `whoami` · `env` |
| **205** Pricing Engine foundation + billing readiness | cost model · usage ledger · BYOK cost signal · invoice UI · Pricing Engine handoff |
| **206** SOC 2 Type I foundation | auditor pick · policies authored · evidence automation · pen test #1 |

### Q3 2026 — "SaaS Suite 1.0 + Integrations Bridge" (milestone v4.1.0)

> **Goal:** activate the SaaS Suite for `business_type = saas` tenants, then continue the connector/app/marketplace track on top of the same governed substrate.

| Phase | Scope |
|---|---|
| **214** SaaS Suite Activation and Subscription Core | `business_type=saas` activation · SaaS profile · plans · subscriptions · lifecycle tasks |
| **215** SaaS Billing, Payments, and Multi-Country Compliance | Stripe/US · Mercado Pago/Colombia · QuickBooks · Siigo/Alegra · DIAN |
| **216** SaaS Health, Churn, Support, and Product Usage Intelligence | health score · churn alerts · support triage · product usage signals |
| **217** SaaS Revenue Intelligence, SAS Agents, API/MCP/UI Readiness | MRR/ARR/NRR/GRR · SAS-01..06 · `/v1/saas/*` · `markos-saas` |
| **218** Connector framework and SaaS connector bridge | Nango embedded · OAuth flows · event ingest normalizer · connector SDK · support/product/accounting connector strategy |
| **219** Zapier + Make + n8n apps | auto-generated from OpenAPI · published on each registry · triggers + actions parity |
| **220** Agent Marketplace alpha + locale/fine-tune/autonomy backlog split | community agents submit · manual moderation · install UX · later split for locale packs, fine-tunes, autonomy grants |

### Q4 2026 — "Operator UX + White-label + Type II" (milestone v4.2.0)

> **Goal:** operator-grade UI polish · Agency white-label tier · EU data residency · SOC 2 Type II kickoff.

| Phase | Scope |
|---|---|
| **221** Operator UI polish | dashboards v2 · Brand Studio · Campaign Composer · Approval Queue · Evidence Rail |
| **222** Agency white-label tier | custom subdomain · reseller billing · brand override · agency-level analytics |
| **223** EU data residency | Frankfurt region · per-tenant residency choice · AI provider region-lock |
| **224** SOC 2 Type II audit kickoff | observation window opens · runbook automation · DLP controls |
| **225** Agent Marketplace GA | revenue share pending Pricing Engine recommendation · licence tiers · rating + reviews |
| **226** Usage-based pricing v2 | Active-CPU parity · per-mutation-family pricing · transparent telemetry |
| **227** Connectors wave 2 | LinkedIn Ads · TikTok Ads · WhatsApp Business · Mixpanel · Postmark · SendGrid · Twilio Messaging Services · Stripe Tax · Notion · Airtable |

### Q1 2027 — "Enterprise + Global" (milestone v4.3.0 / 5.0.0)

> **Goal:** BYOC · HIPAA opt-in · APAC residency · 15 additional languages · ISO 27001 certification.

| Phase | Scope |
|---|---|
| **230** BYOC (deploy-to-customer-VPC) | Helm chart · Terraform module · customer-managed keys (CMK) |
| **231** HIPAA BAA opt-in | PHI data-handling profile · audit · BAA contract ops |
| **232** APAC data residency | Tokyo + Singapore regions · latency targeting |
| **233** Global tier-1 languages | JA · KO · ZH-CN · ZH-TW · AR · HI · TR · PL + RTL handling |
| **234** ISO 27001 certification | audit close · ISMS artifacts · continual improvement loop |
| **235** Claude Computer Use integration | operator-level automation for LinkedIn/Meta/Google ad accounts via CU agent |
| **236** Platform-level evals store | [[LLM Observability for Marketing]] productized · per-tenant evals dashboard · SLA |

---

## Artifact C — Architecture deltas

### New DB tables (forward-only migrations 70–90)

| Migration | Tables | Purpose |
|---|---|---|
| `70_markos_api_keys.sql` | `markos_api_keys` · `markos_api_key_usage_events` | tenant-scoped API keys, hashed at rest, rate-limited |
| `71_markos_mcp_sessions.sql` | `markos_mcp_sessions` · `markos_mcp_tool_invocations` | MCP session + per-tool invocation ledger |
| `72_markos_webhook_subscriptions.sql` | `markos_webhook_subscriptions` · `markos_webhook_deliveries` | subscriptions + delivery ledger with retry state |
| `73_markos_connector_installs.sql` | `markos_connector_installs` · `markos_connector_events` | tenant × connector × oauth state + event ingest |
| `74_markos_plugin_manifests.sql` | `markos_plugin_manifests` · `markos_plugin_versions` · `markos_plugin_purchases` | marketplace registry + purchase history |
| `75_markos_locale_packs.sql` | `markos_locale_packs` · `markos_locale_overrides` | region + language + cultural adaptation rules |
| `76_markos_autonomy_grants.sql` | `markos_autonomy_grants` · `markos_autonomy_transitions` | per-tenant autonomy level per mutation family + history |
| `77_markos_evals_runs.sql` | `markos_evals_runs` · `markos_evals_judgements` | LLM eval runs + individual judgements |
| `78_markos_tenant_regions.sql` | `markos_tenant_regions` | data-residency preference + active region |
| `79_markos_agency_tenants.sql` | `markos_agency_tenants` · `markos_agency_brand_overrides` | white-label reseller model |
| `80_markos_finetune_corpus.sql` | `markos_finetune_corpus` · `markos_finetune_consent` | opt-in consented corpus with redaction state |
| `81_markos_public_signup.sql` | `markos_public_signups` · domain verification, email verification | public SaaS signup flow |

All tenant-scoped tables enable RLS (see [[Database Schema]]).

### New OpenAPI contracts (F-70 → F-90)

| Contract | Purpose |
|---|---|
| `F-70 api-key-management-v1` | create / list / revoke / scope API keys |
| `F-71 mcp-session-v1` | MCP session init + tool invoke + close |
| `F-72 webhook-subscription-v1` | subscribe / unsubscribe / list / test-fire |
| `F-73 webhook-delivery-v1` | delivery callbacks with HMAC |
| `F-74 connector-install-v1` | install / uninstall / oauth-callback per connector |
| `F-75 connector-event-v1` | connector event ingest + replay |
| `F-76 plugin-manifest-v1` | marketplace manifest CRUD |
| `F-77 plugin-purchase-v1` | purchase / refund / license verification |
| `F-78 locale-pack-v1` | locale pack CRUD + activation per tenant |
| `F-79 autonomy-grant-v1` | grant / revoke / list autonomy per mutation family |
| `F-80 eval-run-v1` | submit / list / drill-into eval runs |
| `F-81 agency-tenant-v1` | agency tenant onboarding + brand override |
| `F-82 finetune-corpus-v1` | corpus opt-in / redaction / export / delete |
| `F-83 signup-v1` | public signup + email verification + domain claim |
| `F-84 residency-v1` | tenant region choice + migration workflow |
| `F-85 cli-generate-v1` | one-shot generation endpoint (CLI path) |

### New `api/*` routes

```
api/
├── mcp/                         MCP server (HTTP+SSE) — Fluid Compute
│   ├── session.js               init + list + close
│   └── tools/<tool>.js          per-tool dispatch (or generic dispatch)
├── webhooks/
│   ├── subscribe.js             F-72
│   ├── unsubscribe.js
│   ├── list.js
│   └── test-fire.js
├── connectors/
│   ├── install.js               F-74
│   ├── uninstall.js
│   ├── oauth-callback.js
│   ├── events.js                F-75 ingest
│   └── replay.js
├── plugins/
│   ├── manifest.js              F-76 registry
│   ├── browse.js
│   ├── install.js
│   ├── purchase.js              F-77
│   └── review.js
├── keys/
│   ├── create.js                F-70
│   ├── list.js
│   ├── revoke.js
│   └── usage.js
├── evals/
│   ├── submit.js                F-80
│   ├── list.js
│   └── judgements.js
├── agency/
│   ├── onboard.js               F-81
│   └── brand-override.js
├── finetune/
│   ├── opt-in.js                F-82
│   ├── corpus.js
│   └── export.js
├── signup.js                    F-83 public signup
├── verify-email.js
├── openapi.js                   serves merged OpenAPI 3.1
├── llms-txt.js                  dynamic llms.txt per locale
└── generate.js                  F-85 one-shot CLI generation
```

### New `lib/markos/` modules

```
lib/markos/
├── api-keys/        gen · hash · scope · rate-limit (SHA-256 + prefix)
├── mcp/             server · tools/* · session store · manifest
├── webhooks/        engine · signing (HMAC) · retry queue (Vercel Queues)
├── connectors/      framework · nango-adapter · connector-sdk types · event-normalizer
├── marketplace/     manifest-loader · purchase-flow · revenue-share · review-store
├── locale/          pack-loader · adaptation-engine · rtl-handler
├── autonomy/        grants · evaluator · family-rules · transitions
├── evals/           runner · judges · dashboards · sample-strategy
├── agency/          white-label · brand-override · reseller-billing
├── finetune/        corpus-builder · redaction · consent-ledger
├── residency/       region-router · provider-region-map · migration-planner
└── signup/          verification · onboarding-orchestrator · preset-loader
```

### New MarkOS agents (token IDs)

| TOKEN_ID | Agent | Role |
|---|---|---|
| `MARKOS-AGT-CONN-01` | **Connector Router** | routes requests to right connector; normalizes events |
| `MARKOS-AGT-LOCALE-01` | **Locale Adapter** | adapts copy per locale + culture pack |
| `MARKOS-AGT-AUTONOMY-01` | **Autonomy Evaluator** | decides auto-approve vs gate per tenant × family |
| `MARKOS-AGT-MCP-01` | **MCP Bridge** | translates MCP tool calls to MarkOS skills |
| `MARKOS-AGT-CONN-02` | **Webhook Dispatcher** | signs + delivers + retries webhook events |
| `MARKOS-AGT-EVAL-01` | **Eval Orchestrator** | schedules + runs evals; fills [[LLM Observability for Marketing]] |
| `MARKOS-AGT-MKT-01` | **Marketplace Curator** | reviews submitted plugins + agents before publish |
| `MARKOS-AGT-FT-01` | **Fine-tune Pipeline Agent** | consented corpus collection + redaction + training batch prep |
| `MARKOS-AGT-RES-01` | **Residency Router** | routes AI + data calls to region-locked providers |

Registered in `.agent/markos/MARKOS-INDEX.md` + mapped in [[Agent Registry]].

### Vercel-specific platform choices

Stack is on Vercel (per `vercel.ts` + session context). Align with platform strengths:

| Feature | Used for |
|---|---|
| **Fluid Compute** | default runtime for all `api/**` — MCP sessions + agent runs benefit from instance reuse + graceful shutdown |
| **Vercel AI Gateway** | default LLM routing · provider fallback · per-tenant BYOK markup calc · observability |
| **Vercel Queues** | webhook delivery · eval runs · fine-tune corpus prep · connector event ingest |
| **Vercel Sandbox** | safe execution of user-submitted locale rules + marketplace agents |
| **Vercel BotID** | API + signup surface protection |
| **Rolling Releases** | gradual feature rollout of autonomy grants, UX v2 |
| **Routing Middleware** | tenant-subdomain routing · residency routing · agency brand override |
| **Blob** | generated media assets (private by default) |
| **Cron Jobs** | periodic evals · corpus prep · billing snapshots · audit-log rotation |
| **Sign in with Vercel** | partner + admin login flow |
| **Vercel Agent (beta)** | CI + PR review on MarkOS code changes |

### Settings + env keys

```
MARKOS_PUBLIC_BASE_URL=https://app.markos.dev
MARKOS_MCP_ENABLE=true
MARKOS_MCP_SESSION_TTL=1800
MARKOS_WEBHOOK_SIGNING_SECRET_ROTATION=30d
MARKOS_NANGO_SECRET_KEY=...
MARKOS_STRIPE_CUSTOMER_PORTAL_URL=...
MARKOS_ZAPIER_APP_ID=...
MARKOS_AI_GATEWAY_KEY=...
MARKOS_DATA_REGION=us-east-1
MARKOS_FINETUNE_OPT_IN=false
MARKOS_AUTONOMY_DEFAULT_LEVEL=gated
```

### Agent skill wiring

Each new skill gets a MarkOS skill manifest at `.agent/skills/markos-<skill>.md`:

- `markos-connect` — install a connector
- `markos-generate` — one-shot generation (CLI/MCP entrypoint)
- `markos-subscribe-webhook` — subscribe to events
- `markos-install-plugin` — purchase + install marketplace plugin
- `markos-grant-autonomy` — upgrade autonomy for a family
- `markos-set-locale` — set tenant locale pack
- `markos-run-eval` — schedule eval suite
- `markos-publish-plugin` — marketplace submission flow

### Historical billing implementation assumptions

These 2026-04-16 billing assumptions are now inputs to [[Pricing Engine Canon]], not active pricing policy. Any public price, package boundary, included usage amount, discount, or revenue share requires an approved PricingRecommendation.

- **Platform fee** — historical candidate model; the Pricing Engine decides whether seat-equivalent pricing is useful for a specific segment.
- **Metered AI** — `lib/markos/billing/usage-ledger.ts` should still capture per-call tokens, model, region, and cost so the Pricing Engine can model margin.
- **BYOK treatment** — operator keys decrypt per call (`lib/markos/llm/encryption.ts`); BYOK is a cost and supply-side signal, not an automatic discount policy unless the Pricing Engine recommends it.
- **Marketplace revenue share** — candidate economics; validate through marketplace cost, creator incentive, and competitive benchmarks before publishing.
- **Connector usage** — high-value connector events can become cost-model inputs or usage metrics; packaging is Pricing Engine-owned.
- **Eval runs** — usage and compute cost should be recorded; included allowances remain `{{MARKOS_PRICING_ENGINE_PENDING}}`.

### Rate-limiting + abuse

- API keys: token bucket per key (RPM per scope).
- Signup: BotID + email verification + SMS-optional + cooldown.
- MCP sessions: per-tenant concurrency cap; long-running sessions sandboxed.
- Webhook deliveries: per-subscription RPS cap; backoff on 5xx.

### Observability

- OpenTelemetry (OTLP) export from all `api/**` to Sentry + Vercel Observability.
- `markos_llm_call_events` populated for every gateway call.
- `markos_agent_runs` / `markos_agent_run_events` / `markos_agent_side_effects` as today — extended with MCP + connector origin.
- Per-tenant eval dashboard.
- Status page (`status.markos.dev`) driven by uptime probes.

---

## Milestone summary

| Milestone | Quarter | Theme | Est. phases |
|---|---|---|---|
| **v4.0.0** | Q2 2026 | SaaS Readiness 1.0 + v2 foundation | 200-213 |
| **v4.1.0** | Q3 2026 | SaaS Suite 1.0 + Integrations Bridge | 214-220 |
| **v4.2.0** | Q4 2026 | Operator UX · White-label · Type II | 221-227 |
| **v4.3.0 / 5.0.0** | Q1 2027 | Enterprise · Global · BYOC | 230–236 |

~26 phases over 12 months. Cadence matches existing MarkOS GSD rhythm (4–6 phases per milestone).

## Go-to-market sequencing

| Month | Milestone | External |
|---|---|---|
| 2026-05 | v4.0.0-alpha (200–204) | private alpha · waitlist · 20 design partners |
| 2026-06 | v4.0.0-beta (205–206) | public beta · Claude Marketplace soft launch |
| 2026-07 | v4.0.0 GA | SaaS launch · PH · Hacker News · dev Twitter |
| 2026-09 | v4.1.0 | SaaS Suite alpha · subscription/billing/churn/support/revenue intelligence · integration bridge |
| 2026-12 | v4.2.0 | operator UX polish · agency tier · EU launch |
| 2027-03 | v4.3.0 | enterprise tier · APAC launch · BYOC GA |

## Risks + mitigations

| Risk | Mitigation |
|---|---|
| MCP protocol churn | pin to stable version; adapter layer insulates internal skills |
| Connector platform policy changes (Meta/Google) | Nango abstraction · graceful fallback · tenant-notified via incident hooks |
| EU AI Act drift | per-release compliance review; disclosure + provenance built in (C2PA, IPTC) |
| Agent marketplace quality floor | mandatory moderation queue · automated eval suite per submission · creator verification |
| Cost runaway on metered AI | hard tenant budgets · [[LLM Observability for Marketing]] · per-tenant kill-switch |
| Data residency misroutes | per-tenant residency-contract test suite · routing middleware enforces |
| Fine-tune opt-in misconsent | consent ledger append-only · export + delete API · legal review |
| Competitor SaaS (Jasper, Copy.ai, Typeface, Adobe GenStudio) | moat via operator-grade Canon + agent-marketplace + multi-tenant governance depth |

## How this plan executes in GSD

Each phase above gets a standard GSD phase folder `.planning/phases/200-*/` containing `DISCUSS.md`, `PLAN.md`, `REQUIREMENTS.md`, `VERIFICATION.md`, and atomic plan commits. Numbering continues the current MarkOS sequence (last shipped: 110).

Standard commands:

- `/gsd-new-milestone v4.0.0` — initialize next milestone
- `/gsd-discuss-phase 200` · `/gsd-plan-phase 200` · `/gsd-execute-phase 200` · `/gsd-verify-work 200`
- `/gsd-autonomous` — once phases are decomposed, run hands-off

## Next action (what to green-light)

Historical note: this green-light request has been superseded by the v2 foundation pass. Use [[Work Notes]] and [[North Star]] for the current next GSD decision.

**Request from you:** answer Q-A, Q-B, Q-C (above) + green-light the 0-day shortlist (A1–A8). On green-light, I will:

1. Promote this note to `.planning/phases/200-saas-readiness-wave-0/PLAN.md`.
2. Scaffold `.planning/v4.0.0-ROADMAP.md` with phases 200–206.
3. Update `ROADMAP.md` at repo root.
4. Open GitHub issues per 0-day item linked to contracts/phase IDs.

## Related

- [[MarkOS Canon]] · [[Agent Registry]] · [[MarkOS Codebase Atlas]] · [[Infrastructure]] · [[MarkOS Protocol]]
- [[Contracts Registry]] · [[Database Schema]] · [[Core Lib]] · [[HTTP Layer]]
- [[AI & Agentic Marketing — 2026 Frontier]] · [[LLM Observability for Marketing]] · [[Agentic Commerce]]
- [[Privacy, Consent & Compliance]] · [[EU AI Act for Marketers]] · [[Warehouse-Native CDP]]
