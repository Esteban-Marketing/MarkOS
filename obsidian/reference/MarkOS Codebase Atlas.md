---
date: 2026-04-16
description: "Root PageIndex-style MOC of the MarkOS codebase — one atlas node per domain, each pointing to its dedicated reference note."
tags:
  - reference
  - moc
  - atlas
  - pageindex
---

# MarkOS Codebase Atlas

> **Root node.** PageIndex-schema MOC for the entire MarkOS repository. Every branch here is a reference note; every leaf is a concrete file path in the repo.

## What is MarkOS?

**MarkOS = Marketing Operating System.** Protocol-grade marketing infrastructure for AI-ready teams. Next.js 15 + React 19 app, multi-tenant Supabase backend, Upstash Vector literacy corpus, multi-provider LLM adapter (Claude / OpenAI / Gemini), plugin runtime, revenue-grade native CRM, and a token-indexed agentic protocol that layers over the GSD engineering methodology.

- **npm name**: `markos` (v3.3.0) — install via `npx markos`
- **Milestone state**: v3.9.0 "Vertical Plugin Literacy Libraries" **complete** — see [[MarkOS Repo]] and `../.planning/STATE.md`
- **Agent boot**: see [[MarkOS Repo]] and `../CLAUDE.md`

## Atlas Tree (PageIndex schema)

```
MarkOS (root)
├── HTTP Layer              → [[HTTP Layer]]         — app/ + api/
├── CRM Domain              → [[CRM Domain]]         — lib/markos/crm + components/markos/crm + F-58..64 + migrations 58..64 + 100
├── Core Lib                → [[Core Lib]]           — llm, billing, governance, identity, rbac, auth, outbound, telemetry, contracts, theme, packs
├── UI Components           → [[UI Components]]       — components/crm + components/markos
├── Contracts Registry      → [[Contracts Registry]]  — 39 F-NN OpenAPI contracts + flow-registry.json
├── Database Schema         → [[Database Schema]]     — supabase/migrations/*.sql
├── MarkOS Protocol         → [[MarkOS Protocol]]     — .agent/markos, .agent/get-shit-done, onboarding/, bin/
├── Infrastructure          → [[Infrastructure]]      — .planning, .protocol-lore, test/, scripts/, docs/, RESEARCH/, CI/config
└── Bridge                  → [[MarkOS Repo]]         — vault ↔ repo pointers
```

## Capability Matrix (high level)

| Capability | Primary entry | Domain note |
|---|---|---|
| Onboarding / intake | `api/submit.js`, `onboarding/backend/server.cjs` | [[MarkOS Protocol]] |
| Draft generation / approval | `api/approve.js`, `api/regenerate.js`, `lib/markos/llm/*` | [[HTTP Layer]] · [[Core Lib]] |
| Identity / SSO / RBAC | `lib/markos/auth/session.ts`, `lib/markos/identity/*`, `lib/markos/rbac/iam-v32.js` | [[Core Lib]] |
| Tenant isolation + RLS | `supabase/migrations/51_multi_tenant_foundation.sql` + tenant_id RLS everywhere | [[Database Schema]] |
| Literacy (vector corpus) | `api/literacy/*`, pack-loader, `markos_literacy_chunks` | [[Contracts Registry]] · [[Database Schema]] |
| Billing / entitlements / Stripe | `api/billing/*`, `lib/markos/billing/*` | [[Core Lib]] · [[Database Schema]] |
| Governance / evidence / vendor inventory | `api/governance/*`, `lib/markos/governance/*` | [[Core Lib]] · [[Database Schema]] |
| CRM entities + timeline + identity graph | `lib/markos/crm/*`, `api/crm/*` | [[CRM Domain]] |
| CRM execution queue + drafts + recommendations | `lib/markos/crm/execution.ts`, `api/crm/execution/*` | [[CRM Domain]] |
| CRM outbound (email/SMS + consent) | `lib/markos/outbound/*`, `api/crm/outbound/*`, `api/webhooks/*` | [[CRM Domain]] · [[Core Lib]] |
| CRM copilot (AI grounded recs + approvals) | `lib/markos/crm/copilot.ts`, `api/crm/copilot/*` | [[CRM Domain]] |
| CRM reporting + attribution + verification | `lib/markos/crm/reporting.ts`, `lib/markos/crm/attribution.ts`, `api/crm/reporting/*` | [[CRM Domain]] |
| Tracking / identity stitching | `api/tracking/*`, `crm_identity_links`, `crm_activity_ledger` | [[CRM Domain]] |
| Plugin runtime + tenant settings | `api/tenant-plugin-settings.js`, `plugin_tenant_*` tables | [[Core Lib]] · [[Database Schema]] |
| Integrations (Linear, Resend, Twilio, Stripe) | `api/linear/*`, `api/webhooks/*`, `lib/markos/outbound/providers/*`, `lib/markos/billing/stripe-sync.ts` | [[HTTP Layer]] · [[Core Lib]] |
| Agentic marketing protocol | `.agent/markos/`, `.agent/skills/markos-*` | [[MarkOS Protocol]] |
| GSD methodology (planning + phases) | `.agent/get-shit-done/`, `.planning/` | [[Infrastructure]] · [[MarkOS Protocol]] |

## v2 Operating-System Overlay

The atlas describes the current implementation. v2 planning should read it through these additional target capabilities:

| v2 capability | Current anchor | Gap note |
|---|---|---|
| AI-native Marketing OS foundation | [[Marketing Operating System Foundation]] | Product doctrine and launch order |
| First complete operating loop | [[MarkOS v2 Operating Loop Spec]] | Functional contract from onboarding to learning |
| Requirements traceability | [[MarkOS v2 Requirements Traceability Matrix]] | Source-to-workstream mapping |
| GSD refactor plan | [[MarkOS v2 GSD Master Work Plan]] | Discuss/research/phase strategy |
| AgentRun/task/approval substrate | [[MarkOS Protocol]], [[Database Schema]], [[UI Components]] | Current code has pieces; v2 needs unifying layer |
| Evidence and learning substrate | [[Core Lib]], [[Marketing Literacy]] | Research context, artifact performance, overlays |
| Contract allocation | [[Contracts Registry]] | Fresh F-NN range required before implementation |
| Pricing Engine | [[Pricing Engine Canon]], [[MarkOS v2 Pricing Engine Intake]] | New pricing intelligence loop, PRC agents, cost model, API/MCP/UI |
| SaaS Suite | [[SaaS Suite Canon]], [[MarkOS v2 SaaS Suite Intake]] | Tenant-type suite for subscriptions, billing/compliance, churn/support/product usage, revenue intelligence, SAS agents, API/MCP/UI |
| SaaS Marketing OS Strategy | [[SaaS Marketing OS Strategy Canon]], [[MarkOS v2 SaaS Marketing OS Strategy Intake]] | Future post-suite SaaS growth profile, PLG/PQL/in-app, ABM/expansion, viral/referral/community, events/PR/partnerships/developer marketing/revenue alignment, experiments, growth agents |

## How the system fits together

1. **Operator** calls `npx markos` → `bin/install.cjs` scaffolds `.agent/markos/` + `.agent/get-shit-done/`, writes `.markos-install-manifest.json`.
2. **Onboarding** (`onboarding/backend/server.cjs`, port 4242) consumes `onboarding-seed.json`, persists MIR/MSP drafts under `.markos-local/` via `orchestrator.cjs` + `mir-filler.cjs` + `msp-filler.cjs`, indexes into Upstash Vector, reflects into Supabase.
3. **Next.js app** (`app/(markos)/*`) enforces tenant context in layout, then routes to CRM / Copilot / Execution / Outbound / Reporting / Settings / Admin / Operations pages.
4. **API handlers** (`api/**`) all share the pattern: `createRuntimeContext()` → `requireHostedSupabaseAuth()` → domain lib call → `writeJson()`. Unprotected onboarding ingress (`submit`, `approve`, `regenerate`, `campaign/result`, `linear/sync`) delegates to `onboarding/backend/handlers.cjs`.
5. **LLM calls** always route through `lib/markos/llm/adapter.ts` with fallback chain (cost / speed / reliability); encryption of operator keys; telemetry into `markos_llm_call_events`.
6. **Billing** gates via `tenant_entitlement_snapshots` + `tenant_billing_holds`; Stripe sync writes `billing_provider_sync_attempts` + `billing_invoice_projections`.
7. **Governance** packs evidence into `governance_evidence_packs` + `governance_deletion_workflows`; vendor inventory tracked in `governance_vendor_inventory`.
8. **GSD methodology** keeps phases atomic (`.planning/phases/NNN-*/`), drives the ROADMAP + STATE machine, verified via `/gsd-verify-work`.

## Agent boot order (when working in this repo)

1. `../CLAUDE.md`
2. `../.protocol-lore/QUICKSTART.md` + `INDEX.md`
3. `../.planning/STATE.md` (live mission)
4. `../.agent/markos/MARKOS-INDEX.md`
5. This atlas — for codebase comprehension

## Related

- [[Home]] · [[MarkOS Repo]] · [[Skills]] · [[North Star]]
- [[VAULT-INDEX|PageIndex Vault Index]]
- [[SaaS Suite Canon]]
- [[SaaS Marketing OS Strategy Canon]]
