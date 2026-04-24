---
date: 2026-04-16
description: "Architectural and workflow decisions observed across the MarkOS codebase — each captures the choice, rationale, and where it lives."
tags:
  - brain
  - decisions
---

# Key Decisions

Architectural or workflow decisions worth recalling. Link to the full Decision Record when one exists.

## 2026-04-16 — SaaS direction locked (v4.0.0 → v5.0.0)

Full synthesis: [[2026-04-16-markos-saas-roadmap]]. Summary of locked answers:

| # | Decision | Value |
|---|---|---|
| 1 | Hosting | SaaS cloud first → OSS community edition later → BYOC Y2 |
| 2 | Onboarding | 30-min guided AI interview standard · 5-min `--preset` dev mode · white-glove enterprise |
| 3 | Monetization | Superseded by [[Pricing Engine Canon]]; pricing, packaging, usage inclusion, and BYOK treatment are engine-owned |
| 4 | Integration order | OpenAPI → SDKs → MCP → Webhooks → Zapier → Make → n8n |
| 5 | Connectors v1 (13) | Shopify · HubSpot · Stripe · Slack · Google Ads · Meta Ads · GA4 · Segment · Resend · Twilio · PostHog · Linear · Supabase |
| 6 | Languages v1 | EN · ES · PT · FR · DE · IT · NL → global by end Y1 |
| 7 | Compliance | SOC 2 Type I 6mo → Type II + ISO 27001 Y2 · HIPAA opt-in |
| 8 | White-label | Agency and OEM packaging are pending Pricing Engine-backed packaging recommendations |
| 9 | Autonomy | Tiered — earn autonomy per mutation family |
| 10 | Data residency | US-East → US + EU → APAC |
| 11 | Marketplace | Yes v1 · Claude Marketplace + vibe-coder/solopreneur ecosystem priority |
| 12 | Posture | API-first + great operator UI — both non-negotiable |
| 13 | License | No OSS yet |
| 14 | Agent marketplace | Y1 (accelerated) |
| 15 | Fine-tunes | Beta public opt-in · alpha CLI |
| Q-A | ICP | Seed-to-A B2B SaaS + modern DTC + solopreneurs — see [[Target ICP]] |
| Q-B | Brand stance | Developer-native · AI-first · quietly confident — see [[Brand Stance]] |
| Q-C | Connector posture | Nango embedded |

- **Why**: API-first + MCP-native + agent marketplace + quality-baseline investment defines the moat before competitors arrive.
- **Where**: `.planning/v4.0.0-ROADMAP.md` · `.planning/phases/200-206/`.

## 2026-04-16 — Quality-first day-0 investment

- **Decision**: invest heaviest in foundations (contracts, tests, observability, security, docs) during v4.0.0 before feature velocity compounds.
- **Why**: operator directive "quality since day 0." Technical debt compounds faster than revenue in early SaaS; fix the multiplier first.
- **Where**: `.planning/phases/200-saas-readiness-wave-0/QUALITY-BASELINE.md` — 15 non-negotiable gates inherited by every phase.

## 2026-04-22 - Incoming v2 blueprint accepted as planning input

Full synthesis: [[MarkOS v2 Blueprint Intake]]. Summary of the planning stance:

| # | Decision | Value |
|---|---|---|
| 1 | Product thesis | MarkOS v2 is an AI-native marketing operating system, not a content generator, scheduler, CRM, or reporting dashboard |
| 2 | North star | Marketing-attributed pipeline created per dollar of MarkOS platform spend |
| 3 | Build order | Ship one complete operating loop before expanding toward the 80-agent vision |
| 4 | Human safety | External-world actions remain approval-gated by default |
| 5 | Research safety | Factual claims require evidence, citations, source quality, and gap acknowledgement |
| 6 | Learning loop | Artifact performance logging and literacy freshness should become first-class product substrate |
| 7 | Conflict handling | Incoming docs create unresolved conflicts for ICP, pricing, contract IDs, token namespace, and connector strategy |

- **Why**: The incoming architecture pack contains detailed requirements that should guide future refactor planning, but it also conflicts with several locked v4.0.0 assumptions. Capturing it as planning input prevents accidental implementation drift.
- **Where**: `obsidian/work/incoming/` source pack; [[MarkOS v2 Blueprint Intake]] for the requirement matrix and conflict register.

## 2026-04-22 - v2 foundation harmonization locked

Full doctrine: [[Marketing Operating System Foundation]]. Functional spec: [[MarkOS v2 Operating Loop Spec]].

| # | Decision | Value |
|---|---|---|
| 1 | ICP | v2 supersedes Q-A for product/GTM: growth-stage B2B marketing leaders first, agencies second |
| 2 | Solopreneur/dev-native posture | Keep as distribution, ergonomics, and product craft; not the paid launch ICP |
| 3 | B2C/DTC posture | Deferred until the B2B foundation loop and attribution substrate work |
| 4 | Pricing posture | Fixed tier prices are superseded by [[Pricing Engine Canon]]; use `{{MARKOS_PRICING_ENGINE_PENDING}}` until the engine produces approved recommendations |
| 5 | Agent registry | Current registry remains implementation truth; v2 network is target taxonomy until a migration phase lands |
| 6 | Token namespace | Resolve `CNT` vs `CONT` in a dedicated migration plan before renaming agents |
| 7 | Contract IDs | Incoming learning contracts must be renumbered because current F-90 through F-100 are occupied |
| 8 | Connector posture | Prefer the existing Nango-embedded direction where it fits; direct adapters require explicit API-depth justification |
| 9 | Build order | First complete loop beats broad agent catalog expansion |
| 10 | Vault doctrine | Obsidian vault anchors now point to the v2 foundation and operating-loop spec |

- **Why**: The vault needs one coherent foundation before code refactors start; otherwise planning will keep splitting between the April 16 SaaS assumptions and the April 22 v2 blueprint.
- **Where**: [[Target ICP]], [[Brand Stance]], [[MarkOS Canon]], [[Agent Registry]], [[Message Crafting Pipeline]], [[MarkOS Protocol]], [[Marketing Operating System Foundation]].

## 2026-04-22 - v2 GSD readiness pack created

- **Decision**: before implementation, GSD should discuss and research from [[MarkOS v2 GSD Master Work Plan]] plus [[MarkOS v2 Requirements Traceability Matrix]].
- **Why**: the v2 blueprint is broad enough that implementation without traceability would likely overbuild agents, collide contract IDs, or skip the task/approval/cost substrate.
- **Where**: [[MarkOS v2 GSD Readiness Audit]], [[MarkOS v2 GSD Master Work Plan]], [[MarkOS v2 Requirements Traceability Matrix]].

## 2026-04-22 - Pricing Engine becomes pricing source of truth

- **Decision**: `15-PRICING-ENGINE.md` is added to the incoming v2 pack and distilled into [[Pricing Engine Canon]] and [[MarkOS v2 Pricing Engine Intake]].
- **Policy**: active vault doctrine must not hard-code MarkOS tier prices. Use `{{MARKOS_PRICING_ENGINE_PENDING}}` until the Pricing Engine creates margin-aware, market-aware, approved recommendations.
- **Why**: pricing is a continuous intelligence loop, not a static SaaS packaging assumption. MarkOS must model costs, competitors, buyer psychology, and price-test evidence before locking public pricing.
- **Where**: [[Pricing Engine Canon]], [[MarkOS v2 Pricing Engine Intake]], [[MarkOS v2 Requirements Traceability Matrix]], [[MarkOS v2 GSD Master Work Plan]].

## 2026-04-22 - SaaS Suite routed as the first tenant-type suite

- **Decision**: `16-SAAS-SUITE.md` is added to the incoming v2 pack and distilled into [[SaaS Suite Canon]] and [[MarkOS v2 SaaS Suite Intake]].
- **Policy**: SaaS Suite activates only for tenants where `business_type = saas` and remains downstream of Pricing Engine, AgentRun v2, approvals, evidence, connector recovery, and SOC2 controls.
- **GSD route**: Phases 214-217 are reserved for SaaS Suite Activation, Billing/Compliance, Health/Churn/Support/Product Usage, and Revenue/SAS/API/MCP/UI readiness.
- **Agent route**: `MARKOS-AGT-SAS-01` through `MARKOS-AGT-SAS-06` are planned target agents registered in `.agent/markos/MARKOS-INDEX.md`.
- **Why**: subscription companies need MarkOS to manage subscription, billing, churn, support, product usage, and revenue signals as governed work, not passive dashboards or unsafe automation.
- **Where**: [[SaaS Suite Canon]], [[MarkOS v2 SaaS Suite Intake]], [[MarkOS v2 Requirements Traceability Matrix]], `.planning/phases/214-saas-suite-activation-subscription-core/` through `.planning/phases/217-saas-suite-revenue-agents-api-ui/`.

## 2026-04-22 - SaaS Marketing OS strategy accepted as post-suite destination

- **Decision**: `17-SAAS-MARKETING-OS-STRATEGY.md` is added to the incoming v2 pack and distilled into [[SaaS Marketing OS Strategy Canon]] and [[MarkOS v2 SaaS Marketing OS Strategy Intake]].
- **Policy**: the build order does not change. The strategy is indexed as future GSD translation material after the core v2 operating loop, Pricing Engine, and SaaS Suite foundations.
- **Scope**: future SaaS growth work must cover B2B/B2C/PLG mode routing, PLG activation and PQL, ABM, expansion, viral/referral, in-app marketing, community, events, PR/analyst/G2, experiments, partnerships, developer marketing, and revenue-team alignment.
- **Agent route**: PLG, EXP, ABM, VRL, IAM, CMT, EVT, XP, PR, PRT, DEV, and REV tiers are target architecture only until GSD assigns contracts, costs, approval posture, tests, and UI/API/MCP surfaces.
- **Why**: the previous 00-16 pack made MarkOS strong on operating substrate, pricing, and SaaS billing/runtime; document 17 specifies the compounding SaaS growth mechanics needed to become the definitive SaaS Marketing OS.
- **Where**: [[SaaS Marketing OS Strategy Canon]], [[MarkOS v2 SaaS Marketing OS Strategy Intake]], [[MarkOS v2 Requirements Traceability Matrix]], [[Agent Registry]].

## Next.js App Router with `(markos)` route group

- **Decision**: all authenticated UI routes live under `app/(markos)/`, tenant-gated via `layout.tsx`.
- **Why**: one shared session + tenant resolution boundary; fails closed with `MarkOSAccessDeniedState`.
- **Where**: [[HTTP Layer]].

## Vault-first bootstrap (not cloud-first)

- **Decision**: onboarding writes MIR/MSP to `.markos-local/` vault first, then mirrors to Supabase.
- **Why**: operator owns their source of truth; no lock-in; offline-tolerant. `onboarding-config.json` → `"bootstrap model": "vault-first"`, legacy mode `migration-only`.
- **Where**: [[MarkOS Protocol]] · `onboarding/onboarding-config.json`.

## Fixed-weight CRM attribution

- **Decision**: no ML-based attribution. Fixed family weights `campaign_touch 0.5`, `web_activity 0.3`, `outbound_event 0.2`.
- **Why**: auditable, explainable, reproducible. Contract F-64-ATTRIBUTION-MODEL declares `fixed_weight_model`.
- **Where**: `lib/markos/crm/attribution.ts` · [[CRM Domain]].

## CRM copilot mutations require approval packages (F-63A)

- **Decision**: AI-proposed mutations never apply directly; they package into `crm_copilot_approval_packages` and require human sign-off before `crm_copilot_mutation_outcomes` records execution.
- **Why**: agent safety; bounded mutation families; operator oversight is the contract boundary.
- **Where**: `lib/markos/crm/copilot.ts` · `lib/markos/crm/agent-actions.ts` · migration 63.

## Draft suggestions are non-executable by design (F-61)

- **Decision**: `crm_execution_draft_suggestions` + `draft-suggestion-panel.tsx` hardcode `send_disabled` + `sequence_disabled`.
- **Why**: assistive drafts help operator cognition without enabling accidental dispatch.
- **Where**: `lib/markos/crm/execution.ts`.

## Outbound consent gate is mandatory

- **Decision**: `/api/crm/outbound/send` must pass `evaluateOutboundEligibility(consent)` before provider routing.
- **Why**: CAN-SPAM / GDPR / platform policy; consent evidence in `crm_contact_channel_consent`.
- **Where**: `lib/markos/outbound/consent.ts`.

## Immutable activity ledger as timeline truth

- **Decision**: `crm_activity_ledger` is append-only. All CRM timelines derive from it (F-58-TIMELINE reads only). Identity stitching + merge decisions preserve lineage in `crm_identity_links` + `crm_merge_lineage`.
- **Why**: timelines must reconstruct under audit; merges must be reversible via evidence.
- **Where**: migrations `58_crm_activity_and_identity.sql`, `100_crm_schema_identity_graph_hardening.sql`.

## Multi-provider LLM with deterministic fallback

- **Decision**: all LLM calls route through `callLLM` in `lib/markos/llm/adapter.ts`; fallback templates `cost_optimized` / `speed_optimized` / `reliability_optimized`.
- **Why**: supply-side resilience, BYOK, per-tenant cost control. Keys encrypted at rest in `markos_operator_api_keys`.
- **Where**: migration 47; `docs/LLM-BYOK-ARCHITECTURE.md`.

## IAM v3.2 is the RBAC contract

- **Decision**: `lib/markos/rbac/iam-v32.js#canPerformAction` is the single authorization oracle. Action keys like `execute_task`, `approve_task`, `send_outbound`, `manage_billing`, `publish_campaign`, `review_cross_tenant_copilot`.
- **Why**: uniform gate across all `api/*` handlers; audit-able.

## Token-indexed agent protocol (MARKOS-INDEX)

- **Decision**: agents + skills + templates referenced by TOKEN_ID (e.g. `MARKOS-AGT-STR-02`), not by file path.
- **Why**: refactor-safe, registry-first, stable interface across workflow evolution.
- **Where**: `.agent/markos/MARKOS-INDEX.md`.

## GSD as engineering methodology layer

- **Decision**: GSD lives under `.agent/get-shit-done/` and drives `.planning/`. MarkOS (marketing) lives under `.agent/markos/` and drives `.markos-local/`. Two independent systems sharing the skill namespace.
- **Why**: separation of concerns — engineering process vs marketing protocol. Documented in `.protocol-lore/QUICKSTART.md`.

## `.cjs` + `.ts` dual entry for runtime-bridged modules

- **Decision**: CRM store + billing enforcement expose both a `.cjs` file (used by `api/*` serverless handlers) and a `.ts` file (typed imports from Next app / components).
- **Why**: the serverless runtime `require()`s CommonJS; the Next app bundles TypeScript. Both must stay synchronized.
- **Risk**: drift between twin exports. See [[Gotchas]].

## Plugin runtime gates via entitlements

- **Decision**: plugin capability grants verified against `tenant_entitlement_snapshots` + `plugin_entitlements_by_plan` at call time.
- **Why**: monetization + safety; prevents plan-leakage between tenants.
- **Where**: migration 52, `lib/markos/billing/plugin-entitlements.cjs`.

## Governance evidence packs are first-class

- **Decision**: privileged actions (auth/authz, approvals, billing admin, tenant config) append to `markos_audit_log` and can be packaged into `governance_evidence_packs`; deletion workflows in `governance_deletion_workflows`.
- **Why**: compliance + access review + retention on demand.

## Storybook + axe + chromatic as UI gates

- **Decision**: UI regressions caught by `test:ui-a11y`, `test:ui-security`, and Chromatic visual-diff.
- **Where**: `.storybook/`, `scripts/storybook-runtime-*.cjs`.

## Related

- [[Patterns]] · [[Gotchas]] · [[Memories]] · [[MarkOS Codebase Atlas]]
