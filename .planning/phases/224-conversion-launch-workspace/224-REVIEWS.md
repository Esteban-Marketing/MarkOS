---
phase: 224
phase_name: conversion-launch-workspace
reviewers: [claude-runtime-override]
reviewers_attempted: [codex, claude, gemini, opencode]
reviewers_skipped:
  - codex: usage limit reached (resets 2026-05-02 09:44 AM)
  - gemini: not installed
  - opencode: not installed
reviewer_note: |
  Claude (current runtime) performed this review under explicit user override after
  Codex hit usage limit. Independence rule (workflow normally skips current-runtime CLI)
  was waived by user direction. Treat as single-AI review without triangulation;
  apply same caveats as prior single-Codex reviews of phases 225/226/227/228.
reviewed_at: 2026-04-25
plans_reviewed:
  - 224-01-PLAN.md
  - 224-02-PLAN.md
  - 224-03-PLAN.md
  - 224-04-PLAN.md
  - 224-05-PLAN.md
  - 224-06-PLAN.md
  - 224-07-PLAN.md
overall_risk: HIGH
high_concerns: 9
medium_concerns: 5
low_concerns: 2
---

# Cross-AI Plan Review — Phase 224

> **Single-reviewer caveat (override):** Codex hit usage limit; Gemini/OpenCode not installed. User directed Claude (current runtime) to perform the review. Independence rule waived. Findings stand alone — no triangulation.

> **Verified codebase findings (2026-04-25):**
> - `lib/markos/crm/agent-actions.ts:68` exports `buildApprovalPackage`. `createApprovalPackage` does NOT exist in `lib/markos/crm/copilot.ts` (verified in Phase 226 review).
> - `lib/markos/{cdp,crm360,channels,conversion,launches,operating,sales,analytics,pricing}/` directories DO NOT exist (verified in Phase 226 review). Actual `lib/markos/` trees: audit, auth, billing, cli, contracts, crm, governance, identity, llm, mcp, orgs, outbound, packs, plugins, rbac, telemetry, tenant, theme, webhooks.
> - `package.json` scripts: only `test`, `chromatic`, `openapi:build`. NO `vitest`, `playwright`, `vitest.config.ts`, `playwright.config.ts` (verified Phase 226).
> - `api/` uses legacy `*.js` convention. NO `api/v1/` tree, NO App Router `route.ts` files.
> - `app/` has NO `app/(markos)/` tree. Existing `app/(marketing)/` tree (signup, integrations, docs) confirmed.
> - `onboarding/backend/runtime-context.cjs:491` exports `requireHostedSupabaseAuth` (NOT `requireSupabaseAuth`).

---

## Claude Review

# Claude Review — Phase 224

## Summary

Phase 224 (Conversion + Launch Workspace) is the largest planset reviewed in this milestone (9249 lines, 7 plans, 13 new tables, App Router-shaped public surface). The product design is coherent — block-based conversion pages + governed forms + launch readiness/runbook/rollback orbit a strong governance posture (BotID + rate-limit + honeypot + ConsentState double-gate + LaunchGate evaluators). However, the implementation plans repeat the **same architecture-hallucination pattern** that broke confidence in Phases 225/226/227: plans wire to fictional helpers (`createApprovalPackage`), nonexistent module trees (`lib/markos/cdp/`, `lib/markos/crm360/`, `lib/markos/channels/`), App Router conventions (`api/v1/.../route.ts`, `app/(public)/[...slug]/page.tsx`, `app/(markos)/conversion/page.tsx`) the repo does not use, and test tooling (vitest/playwright) not installed. CONTEXT.md itself codifies these references in canonical_refs and code_context blocks. I would not approve execution.

This is the **same class of failure** Codex flagged for sibling phases. Many references in this phase predate the route-back doctrine that landed in P226 D-87 / P225 D-54.

## Strengths

- Phase boundary is disciplined and well-documented. Out-of-scope items (visual builder, Bayesian MAB, P225 attribution, P226 sales enablement, P227 partner amplification) are explicit, not silently included.
- Block-based ConversionPage with typed validators (D-02) is a strong contract foundation — better than generic JSON blob.
- D-19 belt+suspenders pricing/evidence enforcement (pre-publish gate + runtime template-variable scan + render-time fail-closed return 503) is architecturally correct.
- D-34 fail-closed transactional emit (P222 D-29 carry) for ConversionEvent fan-out is correct posture.
- D-27 invisible honeypot with HMAC-derived per-form field name (Plan 03 line 727-728) — better than a literal `honeypot` field name; harder to evade.
- D-15/D-38 LaunchSurface state machine with explicit rollback transitions is well-modeled.
- D-49 launch audit log with hash chain (P201 carry) gives tamper-evident audit posture.
- D-29 ISR with `cacheTag(${tenant_id}:${page_id})` + `updateTag` on publish/rollback (Vercel Next.js 16 pattern) is the right caching model.

## Concerns

### HIGH (9)

- `HIGH` — `224-CONTEXT.md:241,259`, `224-03-PLAN.md:852,959,969,1019,1043`, `224-04-PLAN.md:73,210,212,904,920,965`, `224-05-PLAN.md:326,333,387`, `224-06-PLAN.md:67`: **`createApprovalPackage` does not exist.** Plans cite `lib/markos/crm/copilot.ts::createApprovalPackage` (CONTEXT L241/L259), but `copilot.ts` exports only `buildCopilotGroundingBundle`, `generateCopilotSummaryModel`, `packageRecommendationAction`, `buildCopilotWorkspaceSnapshot`. The actual approval helper is `buildApprovalPackage` at `lib/markos/crm/agent-actions.ts:68` (verified by grep in Phase 226 review; same evidence applies here). Same fictional-helper bug as Phase 226. Plans 03/04/05/06 import + invoke `createApprovalPackage` — execution fails immediately at `import` resolution.

- `HIGH` — `224-CONTEXT.md:238-240,256-258`, `224-02-PLAN.md:97,197,205,417,546-547,883`, `224-03-PLAN.md:220,251`, `224-06-PLAN.md:204,207,366`: **Nonexistent upstream module trees.** Plans cite `lib/markos/cdp/adapters/crm-projection.ts` (P221), `lib/markos/crm360/*` (P222), `lib/markos/channels/*` (P223). None of these directories exist. `lib/markos/` actual: audit, auth, billing, cli, contracts, crm, governance, identity, llm, mcp, orgs, outbound, packs, plugins, rbac, telemetry, tenant, theme, webhooks. Plans 02/03/06 are wired against fictional upstream surface. Per CLAUDE.md drift-rule + P227 D-31 / P225 D-54 / P226 D-87 route-back doctrine, this should hard-fail at preflight, not silent-stub-and-degrade. Plan 02 lines 546-547/883 explicitly use the soft-skip pattern ("if exists ... bridge stub if absent"), which P225/P226/P227 reviews all rejected.

- `HIGH` — `224-03-PLAN.md:39-40,90,101,829,857,926,1017`, `224-CONTEXT.md:D-29` (line 95): **App Router public surface contradicts repo reality.** Plan 03 ships `app/(public)/[...slug]/page.tsx` + `app/(public)/[...slug]/loading.tsx` as the canonical public landing-page route. Repo has no `app/(public)/` tree. Existing public-marketing routes live under `app/(marketing)/{signup,integrations,docs}/page.tsx` (legacy convention). Same App Router hallucination as Phases 225/226. The plan should either (a) plan against existing `app/(marketing)/` tree OR (b) declare `app/(public)/` as greenfield with hard precondition + explicit ADR for the route-group migration.

- `HIGH` — `224-CONTEXT.md:D-42` (lines 124-126), `224-06-PLAN.md:22-26,94,116,893`, `224-03-PLAN.md:829,1019`, plus `224-04-PLAN.md` + `224-05-PLAN.md`: **App Router API conventions (`api/v1/.../route.ts`) contradict repo reality.** Plan 06 alone declares 5 `route.ts` API handlers under `api/v1/launches/`. Plan 03 ships `api/v1/conversion/pages/[page_id]/publish/route.ts`. Plans 04/05 follow same convention. Repo uses legacy flat `api/*.js` (per Phases 225/226 verification). NO `api/v1/` tree exists. Same hallucination as Phase 225 RH1/RH2 + Phase 226 RH3. Either rewrite to `api/v1/launches/runbooks/index.js` style OR declare App Router migration as prerequisite phase.

- `HIGH` — `224-01-PLAN.md:263,283,330,364,366,370,511,515`, plus 251 hits across all 7 plans (vitest:33+47+33+ etc., playwright references in test paths): **vitest + playwright NOT in package.json.** Plan 01 line 283: "vitest, @vitest/coverage-v8, playwright, @playwright/test already installed from P204/P221 baseline. If missing, install at the same versions used by P204 (vitest@^1.6.0, playwright@^1.45.0)." This is incorrect: package.json scripts are only `test`, `chromatic`, `openapi:build`. P204 did not install vitest/playwright. Plan 01 acceptance line 366 asserts `npx vitest --version` returns >= 1.x — will fail. Same RH4 pattern as Phases 225/226. Either pin to `npm test` (Node `--test`) per Phase 226 D-82 OR add explicit `npm install --save-dev vitest playwright` task with version + script registration in package.json. Currently plans assume installed.

- `HIGH` — `224-CONTEXT.md:D-37` (line 114), `224-06-PLAN.md` (runbook section): **AgentRun bridge stub if P207 absent — soft-degradation pattern.** D-37: "Runbook execution wrapped in AgentRun (P207) ... Bridge stub if P207 absent (carry P221 D-15 pattern)." This is the rejected soft-skip pattern P225 RH8 / P226 RH8 / P227 review all flagged. The runbook IS the launch execution — running with a stub means launch executes without proper run tracking, cancel/pause/resume semantics, or audit of operator actions. Per CONTEXT D-49 launch audit log requirements, soft-skipping AgentRun breaks the audit chain. Should hard-fail with `assertUpstreamReady(['P207'])` per P225 D-54 / P226 D-87.

- `HIGH` — `224-CONTEXT.md:D-45` (lines 137-143): **`app/(markos)/conversion/page.tsx` + `app/(markos)/launches/page.tsx` reference nonexistent route group.** D-45: "ConversionWorkspace (`app/(markos)/conversion/page.tsx`) ... LaunchCockpit (`app/(markos)/launches/page.tsx`)". Repo has no `app/(markos)/` tree. Existing operator-shell routes live elsewhere (likely `app/(marketing)/` subtree or as separate components — verify before assuming). Same `app/(markos)/` hallucination as Phase 225 RH2. UI surface is anchored to fictional app layout.

- `HIGH` — `224-CONTEXT.md:D-19` (lines 76-79): **Pre-publish content classifier carry from P223 — but P223 not landed and `lib/markos/channels/templates/*` doesn't exist.** D-19 third bullet: "Pre-publish content classifier (carry from P223 D-16) scans block bodies for currency patterns + claim-shaped text not bound to evidence_pack_id; flags for approval." Plan 03 line 220 confirms: "From P223 `lib/markos/channels/templates/*` (D-16 content classifier pattern carry — extend, do not duplicate)". P223 has not landed. The claim "extend, do not duplicate" is fictional — there is nothing to extend. Same Phase 226 RM3 issue (Codex: "5-line regex heuristic too local" — but worse here since the source pattern doesn't exist at all).

- `HIGH` — `224-CONTEXT.md:D-13` (line 59), `224-04-PLAN.md`: **Launch readiness gate enforcement is app-only.** D-13 + D-16 readiness gate evaluator is described as logic in `lib/markos/launches/gates/`. No DB-trigger on `launch_surfaces.status` transition checks `internal_readiness_checks` are completed. Same enforcement-boundary bug as Phase 226 RH5/RH6 (quote immutability + winloss-required were app-only). Service-role write to `launch_surfaces SET status='published'` bypasses readiness check. For launch coordination this is high-impact: a non-ready launch could go live via direct SQL or alternative API path.

### MEDIUM (5)

- `MEDIUM` — `224-CONTEXT.md:D-25/D-26` (lines 89-91), `224-03-PLAN.md`: **BotID + rate-limit reuse claims.** D-25 says "Vercel BotID gate before form render (carry P201 signup pattern)" and D-26 ships per-form rate-limits. Phase 226 review (RM3) found `checkSignupRateLimit` is signup-specific, not a general-purpose per-route limiter. Phase 224 likely faces the same issue — rate-limit primitive must be purpose-built per Phase 226 D-90, not a thin wrapper around `checkSignupRateLimit`. Plans should add explicit task to build `lib/markos/conversion/forms/rate-limit-public-form.ts` (or similar) primitive backed by `@upstash/ratelimit`.

- `MEDIUM` — `224-CONTEXT.md:D-28` (line 92), `224-02-PLAN.md`: **ConsentState double-gate is fail-closed in code but reads from a fictional bridge.** D-28: "submit handler creates ConsentState row (per P221 setConsentState) per consent_capture_block selections BEFORE writing ConversionEvent. Mismatch ... → fail-closed." Implementation depends on `lib/markos/cdp/adapters/crm-projection.ts::setConsentState` (HIGH-2). Even if adapter existed, the "fail-closed on mismatch" claim depends on transactional ordering — needs explicit DB-level enforcement (e.g., trigger that rejects ConversionEvent INSERT without matching ConsentState row in same tx) or audit of the actual emit order.

- `MEDIUM` — `224-CONTEXT.md:D-30` (line 96), `224-03-PLAN.md`: **ISR cache invalidation isn't the only trust barrier.** D-30: page render cached with `cacheTag(${tenant_id}:${page_id})`. Publish/rollback calls `updateTag(...)`. If `updateTag` fails (network error, Vercel platform issue), page stays cached with stale content. For pricing/evidence runtime fail-closed (D-19), this means a published-then-unpublished page might continue serving stale pricing copy until cache TTL expires. Should add explicit fallback: render-time check on cache hit must re-validate pricing/evidence freshness even on cache hit OR document acceptable staleness window in CONTEXT.

- `MEDIUM` — `224-CONTEXT.md:D-21..D-24` (lines 83-86), Claude's Discretion: **xxhash3 dep missing.** Claude's Discretion: "Experiment hash function for variant assignment (recommend xxhash3 for speed; fallback SHA-256 truncated)." `package.json` does not contain xxhash-wasm or xxhash3. Phase 225 RH5 found same missing dep (`json-logic-js`, `xxhash-wasm`, `@ai-sdk/gateway`). Phase 224 needs explicit npm install task OR pick SHA-256 fallback (already in Node stdlib).

- `MEDIUM` — `224-CONTEXT.md:D-39/D-40` (lines 118-119), `224-04-PLAN.md`: **LaunchOutcome compute reads `crm_activity` (P222) + `dispatch_events` (P223) — both upstream phases not landed.** D-39: "Reads conversion_events + dispatch_events (P223) + crm_activity (P222) by launch_id linkage." Same upstream-readiness issue as HIGH-2 + HIGH-6. No assertUpstreamReady gate. Outcome compute will silently produce empty rows when P222/P223 absent — corrupted attribution data passed downstream to P225.

### LOW (2)

- `LOW` — `224-CONTEXT.md:D-45`: 6 operator UI workspaces in one phase is high-density. ConversionWorkspace + LaunchCockpit + LaunchReadinessBoard + PageEditor + FormEditor + RunbookEditor. Even if `app/(markos)/` tree existed, 6 workspaces with editor surfaces is a lot of UI for one phase. Consider whether D-45 is realistic for the plan budget or splits across follow-up phase.

- `LOW` — Migration count: 10-13 new migrations + retrofit migration for `api/tracking/ingest.js` (D-56). Phase 226/227 reviews flagged migration slot collisions across plans. Phase 224 should pre-allocate migration slots explicitly (e.g., 121-133) and assert no collision via the same migration-order test pattern Phase 226 D-83..D-86 used.

## Suggestions

- **Replace fictional helper everywhere.** All plans citing `createApprovalPackage` from `lib/markos/crm/copilot.ts` → `buildApprovalPackage` from `lib/markos/crm/agent-actions.ts`. Verify with `grep -c "createApprovalPackage" .planning/phases/224-*` returns 0 positive invocations.

- **Add Wave 0.5 architecture-lock task** (per Phase 226 D-78 + Phase 225 D-49 pattern):
  - Pin runtime: legacy `api/*.js` + `requireHostedSupabaseAuth` from `onboarding/backend/runtime-context.cjs:491`
  - Pin OpenAPI: `contracts/openapi.json` (NOT `public/openapi.json`)
  - Pin MCP: `lib/markos/mcp/tools/index.cjs` (NOT `.ts`)
  - Pin test runner: `npm test` (Node `--test`) OR explicit `npm install --save-dev vitest playwright xxhash-wasm` task
  - Pin app/ tree: declare `app/(public)/` and `app/(markos)/` as greenfield with explicit ADR

- **Add `assertUpstreamReady()` preflight gate** (per Phase 225 D-54 + Phase 226 D-87): hard-fail if P205/P207/P208/P209/P221/P222/P223 not landed. Replace all "bridge stub if absent" patterns with `throw UpstreamPhaseNotLandedError(...)`. The phase declares `Depends on: 205, 207, 208, 209, 221-223` — enforce it.

- **Move launch readiness + LaunchSurface.status enforcement to DB-trigger layer.** Per Phase 226 D-83/D-84 model: BEFORE UPDATE trigger on `launch_surfaces` rejects status='published' if any `launch_gates.status='blocking'` row exists for the launch. Service-role + alternative-API write paths cannot bypass.

- **Convert AgentRun bridge stub (D-37) to fail-closed throw.** Runbook execution requires P207. If absent → `UpstreamPhaseNotLandedError('P207', 'launch-runbook-execution')`. No silent stub log line.

- **Build purpose-built rate-limit primitive for public forms** (per Phase 226 D-90 model): `lib/markos/conversion/forms/rate-limit-public-form.ts` backed by `@upstash/ratelimit` with per-form + per-IP + per-email keys. Don't claim drop-in reuse of `checkSignupRateLimit`.

- **Pricing classifier (D-19 third bullet) is greenfield, not "carry from P223".** Either ship the classifier as a P224 deliverable OR defer to a future content-governance phase. Document explicitly.

- **Add explicit greenfield declaration for `lib/markos/conversion/*` and `lib/markos/launches/*`** (per Phase 226 D-80 model). Don't claim "carry from `lib/markos/cdp/`/`lib/markos/crm360/`/`lib/markos/channels/`" — those don't exist either.

- **Pre-allocate migration slot table** in Plan 01 truths (per Phase 226 B6 lesson): explicit slot → owning plan map. Run migration-slot-collision test in closeout plan.

## Risk Assessment

**Overall: HIGH**

Phase 224 has the same architecture-hallucination class as Phases 225/226/227 — and at higher density given 9249 lines of plan text. The product design is sound but the implementation plans cannot execute as-written:
- `createApprovalPackage` → import resolution fails (concrete bug, verified)
- `lib/markos/{cdp,crm360,channels}/` → module resolution fails (concrete bug, verified)
- `app/(public)/`, `app/(markos)/`, `api/v1/.../route.ts` → file paths don't match repo conventions
- `npx vitest`, `npx playwright` → command not found
- AgentRun bridge stub + ConsentState bridge + Customer360 bridge — soft-skip patterns rejected by sibling-phase reviews

If executed as-is, Plan 01 Task 1 will fail before any meaningful work happens. Even if the executor patches around the immediate failures, the silent soft-skip paths will produce corrupted state (ConversionEvent without ConsentState, LaunchOutcome with empty attribution, runbook execution without AgentRun audit).

## Specific Questions for Plan Author

1. Which approval helper does Phase 224 actually intend to use? `buildApprovalPackage` from `lib/markos/crm/agent-actions.ts:68` exists. `createApprovalPackage` does not. Plans need consistent symbol replacement.

2. Are `app/(public)/` and `app/(markos)/` route groups being created in Phase 224 (greenfield)? If yes, where is the ADR / migration-from-`(marketing)` plan? If no, why do plans reference them?

3. Are 49 (?) `route.ts` files being created (App Router) or are plans intended to use legacy `api/*.js`? The current state of plans 03/04/05/06 is mixed — some `route.ts`, no `*.js`. Pick one.

4. What is the dependency posture for P205/P207/P208/P209/P221/P222/P223? Plans currently soft-skip with bridge stubs. Per route-back doctrine (P226 D-87, P225 D-54), should be hard-fail. Confirm.

5. Are vitest + playwright being installed as part of Phase 224 (Plan 01 task) or are plans expected to migrate to `npm test`? If installed, ADR + version pinning + script registration. If migrated, replace 251+ vitest/playwright references.

6. Where is the launch readiness DB-trigger? Per P226 D-84 enforcement-boundary doctrine, app-only enforcement is bypassable.

7. AgentRun bridge stub (D-37): why is the soft-skip path included given P225/P226/P227 explicitly removed equivalent patterns?

8. Pricing classifier (D-19) — is `lib/markos/channels/templates/*` actually expected to exist by P224 execute time? Currently doesn't.

9. xxhash-wasm / @upstash/ratelimit / json-logic-js — which dependencies does Phase 224 need? Add to Plan 01 npm install task.

10. ISR `updateTag` failure mode — what is the acceptable staleness window when invalidation fails? Should there be a backup eventual-consistency check on cache hit?

---

## Consensus Summary

> Single-reviewer (Claude under user override). No triangulation. Apply same caveats as single-Codex reviews of phases 225/226/227/228.

### Top concerns (HIGH)

1. **`createApprovalPackage` fictional** ✓ same bug as Phase 226 (verified `buildApprovalPackage` at `agent-actions.ts:68`). Plans 03/04/05/06 reference it ~15+ times.

2. **`lib/markos/{cdp,crm360,channels}/` don't exist** ✓ same as Phase 226 RH2. CONTEXT.md L238-240/L256-258 + plans 02/03/06 wire to fictional upstream.

3. **App Router public surface (`app/(public)/[...slug]/page.tsx`)** — repo uses `app/(marketing)/` legacy convention.

4. **App Router API surface (`api/v1/.../route.ts`)** ✓ same as Phase 225 RH1 + Phase 226 RH3. Repo uses legacy `api/*.js`.

5. **vitest/playwright not in package.json** ✓ same as Phase 226 RH4 / Phase 225 RH4. Plan 01 line 283 falsely claims they're installed.

6. **AgentRun bridge stub (D-37) — soft-skip** ✓ same as Phase 226 RH8. Should be assertUpstreamReady throw.

7. **`app/(markos)/conversion/` + `app/(markos)/launches/` route groups don't exist** ✓ same as Phase 225 RH2.

8. **Pricing classifier "carry from P223" — P223 not landed** ✓ compounded RH issue.

9. **Launch readiness gate app-only** ✓ same as Phase 226 RH5/RH6 enforcement-boundary class.

### MEDIUM

10. BotID/rate-limit reuse claims overstated (P226 RM3 pattern)
11. ConsentState double-gate transactional semantics underspecified
12. ISR cache invalidation fail-mode (updateTag failure) not handled
13. xxhash-wasm dep missing (P225 RH5 pattern)
14. LaunchOutcome reads upstream tables without preflight (P225 RH8)

### LOW

15. 6 UI workspaces in one phase (D-45) — scope density
16. Migration slot pre-allocation (P226 B6 lesson)

### Suggested next move

`/gsd-plan-phase 224 --reviews` to incorporate this feedback. Phase 224 needs the same kind of structural rework Phase 226 received: Wave 0.5 architecture-lock + assertUpstreamReady preflight + DB-trigger enforcement for readiness/launch state + remove fictional helpers + remove App Router unless explicitly migrated.

This phase has the largest planset and the most architecture hallucination — likely the most invasive replan yet. Same Hybrid (A-leaning) strategy as P226: Option A (real fixes) for all HIGH/MEDIUM; Option B (auditable deferral) only for items genuinely requiring upstream/infra capability not in milestone scope.

### Reviewer environment

- Reviewer: Claude (current Claude Code runtime, user override after Codex usage limit)
- Independence rule: waived per user direction
- Files inspected: 224-CONTEXT.md (full read), 224-{01..07}-PLAN.md (targeted greps + key sections), key codebase files for verification cross-reference (no read needed — verified anti-patterns identical to Phase 226 already-verified findings)
- Verification source: prior Codex reviews of P225/P226/P227 + own Phase 226 codebase verification

### Trust caveat

Treat this review as one strong external signal but with the caveat that Claude is the runtime executing the plans. Independence is compromised. When Codex usage resets (2026-05-02 09:44 AM), running `/gsd-review --phase 224 --codex` for a triangulated reading is recommended.
