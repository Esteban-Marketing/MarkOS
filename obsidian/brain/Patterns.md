---
date: 2026-04-16
description: "Recurring architectural and implementation patterns observed across the MarkOS codebase — auth, tenancy, contracts, CRM, LLM, approval, tracking."
tags:
  - brain
  - patterns
---

# Patterns

Recurring patterns discovered across the codebase. Each pattern has a **where** (where it lives), **shape** (the idiom), and **why** (invariant it protects).

## API handler shape

- **Where**: every file under `api/**`.
- **Shape**:
  ```js
  const runtimeContext = createRuntimeContext();
  const auth = await requireHostedSupabaseAuth(req, runtimeContext, operation, requiredProjectSlug);
  if (!auth.ok) return writeJson(res, auth.status, { error: auth.error });
  const result = await someDomainLibCall(req, auth);
  writeJson(res, 200, result);
  ```
- **Why**: fail-closed tenant resolution + single consistent JSON envelope. Every handler attaches `req.markosAuth = { tenant_id, iamRole, principal, entitlement_snapshot }`.
- **See**: [[HTTP Layer]].

## Tenant isolation

- **Where**: `supabase/migrations/51_*.sql` and every subsequent `*.sql`.
- **Shape**: every tenant-scoped table has `tenant_id uuid` + `enable row level security` + policy gated by JWT `active_tenant_id` claim or `x-tenant-id` header.
- **Why**: hard isolation is non-negotiable; verified by `test/rls-verifier.test.js` and `test/namespace-auditor.test.js`.
- **See**: [[Database Schema]].

## Contracts-first endpoints

- **Where**: `contracts/F-*.yaml` generated from `onboarding/backend/server.cjs` + `handlers.cjs`; registry `contracts/flow-registry.json`.
- **Shape**: OpenAPI 3.0.3 + `x-markos-meta { actor, auth_local, auth_hosted, handler, local_path, hosted_path, slo_tier, method }`.
- **Why**: every route has a machine-readable contract addressable by F-NN code. Allows `bin/validate-flow-contracts.cjs` to prove handler-contract alignment.
- **See**: [[Contracts Registry]].

## Workspace builder → view components

- **Where**: `lib/markos/crm/workspace.ts` + `components/markos/crm/*`.
- **Shape**: lib builds immutable `columns / rows / entries / detailModel / funnelRows` → passed as props → view components are pure presentational. Only `workspace-shell.tsx` hits the network.
- **Why**: single source of truth for workspace state; views stay trivially testable.
- **See**: [[CRM Domain]] · [[UI Components]].

## Page-scoped Zustand-like stores

- **Where**: `app/(markos)/crm/*/copilot-store.tsx`, `execution-store.tsx`, `reporting-store.tsx`.
- **Shape**: one store per CRM sub-domain; components subscribe via `useCopilotStore` / `useExecutionStore` / `useReportingStore`. No root global store.
- **Why**: isolation of concerns, smaller re-render blast radius, easier unmounting on route change.
- **See**: [[UI Components]].

## Deterministic attribution model

- **Where**: `lib/markos/crm/attribution.ts`.
- **Shape**: fixed weights — `campaign_touch 0.5`, `web_activity 0.3`, `outbound_event 0.2`. Contract F-64-ATTRIBUTION-MODEL declares `fixed_weight_model`.
- **Why**: auditable, explainable, no ML drift. Evidence reconstructible from `crm_activity_ledger` + `crm_attribution_snapshots`.

## Approval packages for agent mutations

- **Where**: `lib/markos/crm/copilot.ts` (F-63A), `crm_copilot_approval_packages` table.
- **Shape**: AI-proposed mutations package into `target_record_kind + target_record_id + mutation_family + status`. Human approval required before `crm_copilot_mutation_outcomes` records execution.
- **Why**: AI never mutates CRM state without human sign-off; bounded mutation families prevent scope creep.

## Draft = non-executable by design

- **Where**: `lib/markos/crm/execution.ts` draft suggestions + `components/markos/crm/draft-suggestion-panel.tsx`.
- **Shape**: contract F-61-DRAFT-SUGGESTIONS explicitly marks `send_disabled` + `sequence_disabled` flags. UI shows amber warning.
- **Why**: assistive drafts help operators think but cannot accidentally dispatch.

## Outbound consent gate

- **Where**: `lib/markos/outbound/consent.ts#evaluateOutboundEligibility`; UI gate `components/crm/outbound-consent-gate.tsx` (amber).
- **Shape**: every `/api/crm/outbound/send` call gates through consent check before provider routing (Resend / Twilio).
- **Why**: CAN-SPAM / GDPR / platform ToS compliance; consent evidence persisted in `crm_contact_channel_consent`.

## Immutable ledgers

- **Where**:
  - `crm_activity_ledger` — append-only activity.
  - `markos_agent_approval_decisions` — approval ledger.
  - `markos_mir_gate1_initializations` — append-only gate lineage.
  - `billing_usage_events` + `billing_usage_ledger_rows` — billing truth.
- **Why**: evidence for timelines, governance, billing reconciliation. Never mutate, only append.

## Multi-provider LLM with fallback chain

- **Where**: `lib/markos/llm/adapter.ts` + `fallback-chain.ts`.
- **Shape**: call through single `callLLM`; provider chosen per request (explicit / default / fallback). Templates: `cost_optimized`, `speed_optimized`, `reliability_optimized`.
- **Why**: supply-side resilience, per-tenant BYOK, cost control. Encryption via `encryption.ts`; telemetry via `markos_llm_call_events`.
- **See**: [[Core Lib]] · `docs/LLM-BYOK-ARCHITECTURE.md`.

## Vault-first intake

- **Where**: `onboarding/backend/orchestrator.cjs` + `vault-writer.cjs`.
- **Shape**: onboarding writes MIR/MSP **first** to `.markos-local/` vault (filesystem + Obsidian), then reflects into Supabase. Legacy mode `migration-only`.
- **Why**: operator keeps source of truth in their vault; cloud is reflection. Preserves offline-first + zero-lock-in.

## Token-indexed agent registry

- **Where**: `.agent/markos/MARKOS-INDEX.md`.
- **Shape**: every agent / skill / template addressable by TOKEN_ID (e.g. `MARKOS-AGT-STR-02` = Planner). Workflows reference tokens, not file paths.
- **Why**: refactor-safe cross-references; registry is the stable interface.

## GSD phase atomicity

- **Where**: `.planning/phases/NNN-*/PLAN.md` + commits.
- **Shape**: one atomic commit per plan; phase commits tagged with plan IDs (e.g. `110-01`, `110-02`).
- **Why**: verifiable phase boundaries; `/gsd-verify-work` can re-run any phase by plan ID.
- **See**: [[Infrastructure]].

## `.cjs` + `.ts` dual-entry modules

- **Where**: `lib/markos/crm/{api,contracts,timeline}.cjs + .ts`; `lib/markos/billing/{enforcement,provider-sync,reconciliation,plugin-entitlements}.cjs`.
- **Shape**: CommonJS twin for runtime-loaded code (API handlers, onboarding backend); TypeScript for typed import graph in the Next app.
- **Why**: API handlers run via `require()` in serverless runtime; Next app bundles TypeScript. Both must agree.
- **Gotcha alert**: keep exports in sync. See [[Gotchas]].

## Related

- [[Home]] · [[MarkOS Codebase Atlas]] · [[Key Decisions]] · [[Gotchas]] · [[Memories]]
