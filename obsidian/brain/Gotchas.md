---
date: 2026-04-16
description: "Pitfalls and edge cases across the MarkOS codebase — dual-entry drift, tenant-context gotchas, consent bypasses, migration ordering, CRM lineage traps."
tags:
  - brain
  - gotchas
---

# Gotchas

Things that have bitten before and will bite again. Each item: **symptom → root → fix**.

## `.cjs` / `.ts` twin drift

- **Symptom**: API handler uses an export that exists in `lib/markos/crm/api.ts` but not in `lib/markos/crm/api.cjs` (or vice versa). Build passes; runtime crashes.
- **Root**: `api/*` handlers `require()` the `.cjs` twin; Next.js imports the `.ts`. Twins must export the same surface.
- **Fix**: when adding exports, update both files. Run `npm test` — tenant-auth/CRM tests exercise both paths.
- **Affected**: `lib/markos/crm/{api,contracts,timeline}.*`, `lib/markos/billing/{enforcement,provider-sync,reconciliation,plugin-entitlements}.cjs`.

## Missing `tenant_id` on new CRM tables

- **Symptom**: query leaks rows across tenants under JWT-impersonated access.
- **Root**: forgetting `tenant_id uuid not null` + RLS policy on a new migration.
- **Fix**: every new tenant-scoped table must `enable row level security` and gate by `auth.jwt() ->> 'active_tenant_id'`. Run `test/rls-verifier.test.js`.

## Unprotected onboarding ingress

- **Symptom**: `api/submit.js`, `api/approve.js`, `api/regenerate.js`, `api/campaign/result.js`, `api/linear/sync.js` have `auth_local: none` and no JWT check.
- **Root**: intentional — operator pre-auth intake funnel. These delegate to `onboarding/backend/handlers.cjs`.
- **Fix**: do not copy this pattern to any other route. Any new endpoint must use `requireHostedSupabaseAuth`.

## CRM timelines read only from activity ledger

- **Symptom**: manually inserting rows into derived tables (e.g. `crm_outbound_sends`) does not show up on timelines.
- **Root**: F-58-TIMELINE only reads `crm_activity_ledger`. Other tables feed the ledger, never the timeline directly.
- **Fix**: always `appendCrmActivity(...)` alongside domain inserts. Outbound + execution code already does this.

## Copilot mutations without approval package

- **Symptom**: AI attempts to write CRM state; call fails or audit log flags violation.
- **Root**: F-63A contract — every agent mutation must package first into `crm_copilot_approval_packages`, then wait for human approval before `crm_copilot_mutation_outcomes` writes.
- **Fix**: route all agent mutations through `lib/markos/crm/agent-actions.ts`. Never write CRM tables directly from AI code paths.

## Outbound send without consent check

- **Symptom**: `POST /api/crm/outbound/send` succeeds, but later audit flags missing consent row in `crm_contact_channel_consent`.
- **Root**: skipping `evaluateOutboundEligibility(consent)` upstream of provider adapter.
- **Fix**: consent gate is mandatory. The send handler calls it, but any new outbound pathway (e.g. new channel adapter) must also gate.

## Identity links auto-merge risk

- **Symptom**: two identities get merged without review, timeline reshuffles unexpectedly.
- **Root**: skipping the `accepted`/`review`/`rejected` state machine introduced in migration 100.
- **Fix**: never bypass `scoreIdentityCandidate` + review-state gating. High-confidence links still require explicit `accepted` state before timeline stitches.

## Draft suggestions send

- **Symptom**: UI ships a draft suggestion straight to a channel.
- **Root**: ignoring `send_disabled` / `sequence_disabled` flags from F-61.
- **Fix**: `draft-suggestion-panel.tsx` is the only authorized renderer. New draft consumers must read + honor the flags.

## Migration ordering

- **Symptom**: `npm test` migration-runner fails on a fresh DB.
- **Root**: numeric prefixes define order; forgetting to increment when inserting between existing phases breaks dependency chains (`51_*` adds `tenant_id` to tables created in `37_*`; any pre-51 migration must create without `tenant_id`).
- **Fix**: use increment + semantic phase naming. Migration 96 (literacy metadata) and 100 (identity hardening) are high-numbered because they're retroactive.

## Entitlement cache staleness

- **Symptom**: tenant on an upgraded plan still blocked by entitlement enforcement.
- **Root**: `tenant_entitlement_snapshots` is a denormalized projection; stripe webhook must refresh it via `syncBillingProvider`.
- **Fix**: invalidate / refresh the snapshot after plan change; do not read plan data from subscription tables alone.

## IAM v3.2 action keys

- **Symptom**: access-denied for an action that seems obviously allowed.
- **Root**: `canPerformAction` is action-key-scoped, not role-scoped. Adding a new feature without registering the action key in `lib/markos/rbac/iam-v32.js` produces a default-deny.
- **Fix**: register new action keys in IAM policy table; add IAM unit test.

## LLM fallback silent drops

- **Symptom**: call returns `FALLBACK_EXHAUSTED` but operator blames "no AI".
- **Root**: fallback chain tried all providers; all failed (rate-limited, auth-error, timeout).
- **Fix**: surface provider error chain via `markos_llm_call_events`; show operator the attempts. Do not retry infinitely — the adapter already handles bounded retry.

## Vault-first drift from cloud

- **Symptom**: Supabase row differs from `.markos-local/MIR/*.md`.
- **Root**: operator edited vault file without running sync; or cloud write happened without vault reflect.
- **Fix**: `bin/sync-vault.cjs` is bidirectional. Run after any out-of-band edit. Vault is authoritative (see [[Key Decisions]]).

## MARKOS-INDEX drift

- **Symptom**: workflow references a TOKEN_ID that no longer exists.
- **Root**: agent file renamed/moved without updating `.agent/markos/MARKOS-INDEX.md`.
- **Fix**: any agent/template rename must update the registry in the same commit.

## `.markos-local/` is client boundary

- **Symptom**: contributor checks in personal MIR/MSP files.
- **Root**: `.markos-local/` is in `.gitignore` for a reason — it's the **only** allowed local override path.
- **Fix**: never `git add -f` into `.markos-local/`. Never create siblings like `.mgsd-local` (explicitly forbidden by repo CLAUDE.md).

## Related

- [[Patterns]] · [[Key Decisions]] · [[Memories]] · [[MarkOS Codebase Atlas]]
