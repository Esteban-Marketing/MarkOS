---
phase: 226
phase_name: sales-enablement-deal-execution
reviewers: [codex]
reviewers_attempted: [codex, claude, gemini, opencode]
reviewers_skipped:
  - claude: current runtime — skipped per independence rule
  - gemini: not installed
  - opencode: not installed
reviewed_at: 2026-04-25
plans_reviewed:
  - 226-01-PLAN.md
  - 226-02-PLAN.md
  - 226-03-PLAN.md
  - 226-04-PLAN.md
  - 226-05-PLAN.md
  - 226-06-PLAN.md
  - 226-07-PLAN.md
codex_model: gpt-5.3-codex
codex_tokens_used: 297365
overall_risk: HIGH
high_concerns: 10
medium_concerns: 5
low_concerns: 0
---

# Cross-AI Plan Review — Phase 226

> **Single-reviewer caveat:** Only Codex (`gpt-5.3-codex`) was available. Claude is current runtime (skipped). Gemini/OpenCode not installed. No triangulation.

> **Verified codebase findings:** This review surfaced multiple CONCRETE codebase mismatches that the internal checker missed. `createApprovalPackage` does not exist in `lib/markos/crm/copilot.ts` — actual export is `buildApprovalPackage` at `lib/markos/crm/agent-actions.ts:68` (verified via grep). Same class of bug as Phase 227's `lookupPlugin`/`resolvePlugin` issue.

---

## Codex Review

# Codex Review — Phase 226

## Summary
This is a strong domain plan, but I would not approve execution yet. The main issue is not product thinking; it is implementation anchoring. Several "verified existing code" references in the Phase 226 docs do not exist in this repo, the planned route/auth/test stack does not match the current codebase, and a few critical governance guarantees are still app-layer narratives rather than hard enforcement. That is the same class of failure Phase 227 surfaced.

## Strengths
- The plan is disciplined about domain boundaries. It consistently treats Pricing Engine, evidence, approvals, CRM memory, and learning as upstream systems rather than re-owning them in sales.
- The governance intent is good: quote snapshotting, stale-proof fail-closed behavior, approval-aware publishing, audit trails, public-share hardening, and tombstone propagation are all explicitly considered.
- The wave split is rational at a business level. Schema first, then artifact engines, then deal execution/public share, then APIs/MCP/UI, then closeout is the right shape.
- The docs identify real failure modes up front: regeneration loops, proof freshness drift, token enumeration, BotID outage posture, tombstone preservation, and pricing drift are all called out.

## Concerns
- `HIGH` [226-CONTEXT.md, 226-RESEARCH.md, 226-04-PLAN.md, 226-06-PLAN.md] The repo anchors are not real for multiple critical dependencies. The docs repeatedly cite `lib/markos/crm/copilot.ts::createApprovalPackage`, but `lib/markos/crm/copilot.ts` exports `buildCopilotGroundingBundle`, `generateCopilotSummaryModel`, `packageRecommendationAction`, and `buildCopilotWorkspaceSnapshot` only. The actual approval packaging helper is `buildApprovalPackage` in `lib/markos/crm/agent-actions.ts`, and current approval endpoints use that via `api/crm/copilot/recommendations.js`. That is a concrete codebase mismatch, not a naming preference.
- `HIGH` [226-CONTEXT.md, 226-RESEARCH.md, 226-02/03/04/05/06-PLAN.md] The phase assumes a large upstream module surface that is absent from this repo. Searches found no `lib/markos/sales/*`, `lib/markos/cdp/*`, `lib/markos/crm360/*`, `lib/markos/analytics/*`, `lib/markos/conversion/*`, `lib/markos/launches/*`, or `lib/markos/pricing/*` tree matching the planned adapters. Functions repeatedly treated as existing patterns such as `getClaimFreshness`, `fillNarrativeClauses`, `emitCdpEvent`, `runContentClassifier`, `getHandoffRecord`, and `crm-projection` are not present. The plan presents greenfield work as if it were wiring to verified existing APIs.
- `HIGH` [226-06-PLAN.md] The API architecture does not match the current repo. Plan 06 assumes 49 handlers under `api/v1/sales/*` with App Router-style `route.ts` conventions and a `requireSupabaseAuth` helper. The actual codebase uses legacy `api/*.js` handlers and `requireHostedSupabaseAuth` from `onboarding/backend/runtime-context.cjs`. There is no existing `/v1/sales/*` family and no `requireSupabaseAuth` symbol in the repo. This is a substantial execution-risk mismatch, not just a folder choice.
- `HIGH` [226-VALIDATION.md, 226-RESEARCH.md, 226-07-PLAN.md, package.json] The validation stack is currently non-executable as written. The plans assume `vitest run`, Playwright specs, `npm run supabase-types`, and `npm run openapi-generate`. `package.json` only has `npm test`, `chromatic`, and `openapi:build`; there is no `vitest` script, no Playwright script, no `supabase-types`, and no `openapi-generate`. A checker can pass this on paper; the repo cannot run that plan today.
- `HIGH` [226-04-PLAN.md, 226-CONTEXT.md] Quote-as-Snapshot immutability is not enforced at the correct boundary. The plan says `sendQuote` is the "single ENFORCEMENT POINT" and relies on status guards plus app-layer mutation checks. That does not protect against service-role writes, ad hoc SQL, or any future code path that updates `quotes` directly after `status='sent'`. The DB-level requirement shown is only "non-empty snapshot JSONB", not "immutable once sent". If immutability matters, it needs a DB trigger/policy constraint, not just a convention in one service function.
- `HIGH` [226-05-PLAN.md, 226-06-PLAN.md] WinLoss "required-on-transition" is app-layer only. The plan explicitly says the gate is enforced at the API layer in 226-06. That means any alternative mutation path for opportunity stage changes can bypass the invariant. If `customer/lost/no_decision` transitions must require a `winloss_record`, enforcement belongs in the transition boundary itself, ideally transactionally with the stage change or via a DB trigger/check pattern around the transition table.
- `HIGH` [226-03-PLAN.md] DealBrief auto-draft on lifecycle transition is not failure-safe. The plan discusses debounce/idempotency, but it does not specify whether the P222 transition and DealBrief generation happen in the same transaction, through an outbox, or with a replayable job envelope. "Opportunity updated, hook didn't fire, no DealBrief exists" is still possible. Given that the referenced lifecycle substrate also does not exist in repo reality yet, this is a genuine sequencing hole.
- `HIGH` [226-CONTEXT.md, 226-05-PLAN.md, 226-RESEARCH.md] The public share model has unresolved security contradictions. One document says expired should be `410` "not 404 to avoid oracle leaks"; another says tampered should be `404` to avoid oracle leaks. That is internally inconsistent and changes the enumeration surface. Separately, key rotation, revocation, auditability of token access, and exact token scope are underspecified. I do not see a crisp answer to "can a token be revoked immediately", "is it bound to one `deal_room_id` only", and "what access trail exists beyond view rows".
- `HIGH` [226-CONTEXT.md vs 226-RESEARCH.md / 226-05-PLAN.md] `share_link_token` has a schema contradiction. `226-CONTEXT.md` D-05 defines `share_link_token (UUID, unique)`, while research/plan text defines it as an HMAC-signed opaque token and stores it as `text`. That is not cosmetic. It affects token format, constant-time comparison, storage, logging, and contract shape.
- `HIGH` [ROADMAP.md, 205/209/221/222/225 contexts, 226-RESEARCH.md] Dependency posture is too permissive for the stated goal. `ROADMAP.md` still shows 205, 209, 221, 222, 225, and 226 as planned, yet 226 repeatedly treats missing upstreams as acceptable fallbacks: pricing placeholder, "fresh + warning" evidence fallback, audit-log fallback for CDP emit, manual-only lifecycle fallback. That may be acceptable for a stub phase, but it conflicts with the stated goal of shipping deal execution tied to CRM, Pricing Engine, and evidence. This needs an explicit go/no-go dependency gate, not silent degradation.
- `MEDIUM` [226-02-PLAN.md, 226-RESEARCH.md, 226-07-PLAN.md] Evidence freshness inheritance is not consistently fail-closed. The plan correctly says stale proof should block customer-facing render, but A21 fallback allows effectively "fresh + warning" when the evidence module is absent. That undercuts the entire freshness doctrine. If EvidenceMap is unavailable, customer-facing proof assembly should fail closed, not self-certify freshness.
- `MEDIUM` [226-05-PLAN.md] Tombstone cascade is not specified as transactional or replay-safe. The plan describes iterative scrub functions across `winloss_records`, `objection_records`, and `deal_room_views`, but not an outbox/retry model or a single transaction boundary. "Some artifacts scrubbed, some not" remains plausible. The docs even describe deal-room-view scrubbing as "best-effort", which is fine operationally, but then the governance claim should stop calling this a fully wired cascade.
- `MEDIUM` [226-06-PLAN.md, lib/markos/auth/botid.ts, lib/markos/auth/rate-limit.ts] The plan overstates reuse of current BotID/rate-limit primitives. `verifyBotIdToken` exists, but current rate limiting is `checkSignupRateLimit(client, { ip, email })`, i.e. signup-specific, not a general per-token/per-route limiter. The phase treats these as nearly drop-in public share defenses. They are not.
- `MEDIUM` [226-CONTEXT.md, 226-01-PLAN.md] The table counts are internally sloppy. `226-CONTEXT.md` says "10 new tables" while listing 15-plus names. `226-01-PLAN.md` says "15 sales tables" but enumerates 16 table names including both version tables. This is not fatal by itself, but it is exactly the sort of counting drift that later causes migration ordering and contract inventory mistakes.
- `MEDIUM` [226-CONTEXT.md, 226-RESEARCH.md, supabase/migrations/53_agent_run_lifecycle.sql] `generated_by_run_id` looks type-misaligned with existing schema. The docs model it as UUID/FK to `markos_agent_runs`, but the actual table uses `run_id text` in `supabase/migrations/53_agent_run_lifecycle.sql`. That needs correction before schema work starts.

## Suggestions
- Replace every "verified existing code" anchor in Phase 226 with the actual repo symbol/path, or mark it explicitly as greenfield. Do not leave speculative adapters presented as already-verified surfaces.
- Add a Wave 0.5 architecture decision that locks the runtime shape: `api/*.js` vs App Router `route.ts`, auth helper (`requireHostedSupabaseAuth` vs new wrapper), OpenAPI generation command, and test runner reality. Right now the plan straddles two architectures.
- Move quote immutability and win/loss-required-on-transition from app-only enforcement to DB-backed enforcement. If the business invariant matters, service-role writes must not be able to violate it.
- Define a concrete dependency gate for P205/P209/P221/P222/P225. Either Phase 226 is stub-capable and says so plainly, or it is blocked until those substrates exist. The current "full governance layer over upstreams" claim is stronger than the actual fallback posture.
- Resolve the public-share security contract precisely: token format, storage type, rotation cadence, revocation path, `404` vs `410` semantics, audit trail, and whether BotID/rate-limit runs at edge or only in app code.
- Treat EvidenceMap absence as fail-closed for customer-facing proof and quote/proposal publishing. "Fresh + warning" is not compatible with claim safety doctrine.
- Add a transactional/outbox design note for lifecycle-triggered DealBrief generation and tombstone propagation, including replay/idempotency behavior.

## Risk Assessment
**Overall: HIGH.** The business design is solid, but the implementation plan is overconfident about the current codebase. There are enough concrete mismatches in symbol names, module paths, route conventions, test commands, and enforcement boundaries that execution will drift immediately unless the plan is corrected first.

## Specific Questions for Plan Author
- Which exact approval helper is canonical for P226: `buildApprovalPackage` in `lib/markos/crm/agent-actions.ts`, or are you introducing a new wrapper? If new, where is that ADR captured?
- Are Phase 226 APIs landing in legacy `api/*.js` or new App Router `route.ts` handlers? The plan currently assumes the latter, but the repo is not there today.
- How is quote immutability enforced against service-role writes after `status='sent'`?
- How is "winloss required on close-state transition" enforced if an opportunity stage changes outside the new `/v1/sales/*` API?
- Is DealBrief generation in the same transaction as the lifecycle transition, on an outbox, or best-effort post-commit?
- What is the exact token contract for `/share/dr/{token}`: storage type, revocation path, rotation path, and whether invalid vs expired responses are distinguishable?
- If P209 EvidenceMap is absent, do customer-facing proof packs block, or does the plan really intend to mark them effectively fresh with a warning?
- Are 205/209/221/222/225 hard prerequisites for 226 go-live, or do you intend to ship 226 with placeholder/fallback behavior in production?

---

## Consensus Summary

> Single reviewer (Codex) — no triangulation. Most severe review yet (10 HIGH + 5 MEDIUM concerns).

### Verified concrete codebase findings (not theoretical)

1. **Approval helper mismatch (RH1)** — Plans cite `lib/markos/crm/copilot.ts::createApprovalPackage`. Actual: `buildApprovalPackage` at `lib/markos/crm/agent-actions.ts:68`. Verified by maintainer grep:
   ```
   $ grep -n "buildApprovalPackage" lib/markos/crm/agent-actions.ts
   68:function buildApprovalPackage(input = {}) {
   133:  buildApprovalPackage,
   ```

2. **Missing module trees (RH2)** — Plans wire to `lib/markos/{sales,cdp,crm360,analytics,conversion,launches,pricing}/*` modules that don't exist on disk. Greenfield presented as "verified existing".

3. **API architecture mismatch (RH3)** — Plan 06 assumes App Router (`route.ts`) + `requireSupabaseAuth`. Repo uses legacy `api/*.js` + `requireHostedSupabaseAuth`. 49 routes wired to nonexistent shape.

4. **Validation stack non-executable (RH4)** — Plans require `vitest`, `playwright`, `npm run supabase-types`, `npm run openapi-generate`. `package.json` only has `npm test`, `chromatic`, `openapi:build`. Plans cannot run.

5. **Schema contradiction (RH9)** — `226-CONTEXT.md` D-05 says `share_link_token (UUID, unique)`. Research/plans say HMAC-signed opaque token stored as `text`. Affects token format, comparison logic, storage shape.

6. **Schema type mismatch (RM5)** — Plans model `generated_by_run_id` as UUID/FK to `markos_agent_runs`. Actual `supabase/migrations/53_agent_run_lifecycle.sql` uses `run_id text`.

### Governance gaps (enforcement at wrong boundary)

7. **Quote-as-Snapshot immutability (RH5)** — App-layer only via `sendQuote` "single enforcement point". No DB trigger/constraint. Service-role writes bypass.

8. **WinLoss required-on-transition (RH6)** — App-layer only at API. Any non-API stage transition bypasses invariant.

9. **DealBrief lifecycle hook (RH7)** — No transaction/outbox. "Opportunity updated, hook didn't fire, no DealBrief" is plausible.

10. **Tombstone cascade (RM2)** — Not transactional or replay-safe. Self-described as "best-effort". Governance claim overstates.

### Security/dependency gaps

11. **Public share security contradictions (RH8)** — `404` vs `410` inconsistent across docs (oracle leak risk). Token revocation, rotation, scope, audit underspecified.

12. **Dependency posture too permissive (RH10)** — Silent degradation when P205/P209/P221/P222/P225 missing. Conflicts with "full governance layer" claim.

13. **Evidence fail-closed undermined (RM1)** — A21 fallback allows "fresh + warning" when evidence module absent. Undercuts freshness doctrine.

14. **BotID/rate-limit primitives overstated (RM3)** — `checkSignupRateLimit` is signup-specific, not a per-token/per-route limiter as plans assume.

### Documentation drift

15. **Table counts sloppy (RM4)** — CONTEXT says 10, plans list 15-16. Drift causes migration/contract inventory mistakes downstream.

### Suggested next move

The 10 HIGH concerns are not stylistic. Several are concrete bugs that will fail at execute-time the same way Phase 227's `lookupPlugin` would have (one already verified — `buildApprovalPackage`). The implementation plan is anchored to a fictional version of the codebase.

**Recommended:** `/gsd-plan-phase 226 --reviews` to incorporate Codex feedback before any execution attempt. This phase appears to need more rework than 227 or 228 — RH1, RH2, RH3, RH4 alone require substantial replanning of module surfaces, route conventions, helper imports, and test infrastructure.

**Strongly recommended:** Add Wave 0.5 architecture-lock decision (per Codex suggestion) before further plan work — pin the runtime shape (`api/*.js` vs App Router), auth helper, OpenAPI command, test runner — so subsequent revisions don't drift between two architectures.

### Reviewer environment

- Codex CLI v0.121.0
- Model: gpt-5.3-codex
- Sandbox: read-only
- Tokens used: 297,365
- 15 concerns across 7 plans + CONTEXT + RESEARCH + VALIDATION + ROADMAP
