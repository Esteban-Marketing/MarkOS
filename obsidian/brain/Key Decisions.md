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
| 3 | Monetization | Platform fee + metered AI + BYOK discount |
| 4 | Integration order | OpenAPI → SDKs → MCP → Webhooks → Zapier → Make → n8n |
| 5 | Connectors v1 (13) | Shopify · HubSpot · Stripe · Slack · Google Ads · Meta Ads · GA4 · Segment · Resend · Twilio · PostHog · Linear · Supabase |
| 6 | Languages v1 | EN · ES · PT · FR · DE · IT · NL → global by end Y1 |
| 7 | Compliance | SOC 2 Type I 6mo → Type II + ISO 27001 Y2 · HIPAA opt-in |
| 8 | White-label | Agency tier upsell · Enterprise OEM on contract |
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
