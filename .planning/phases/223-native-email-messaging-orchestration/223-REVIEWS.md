---
phase: 223
phase_name: native-email-messaging-orchestration
reviewers: [claude-runtime-override]
reviewers_attempted: [codex, claude, gemini, opencode]
reviewers_skipped:
  - codex: usage limit reached (resets 2026-05-02 09:44 AM)
  - gemini: not installed
  - opencode: not installed
reviewer_note: |
  Claude (current runtime) performed this review under explicit user override after
  Codex hit usage limit. Independence rule waived per user direction (same posture
  as Phase 224 review). Treat as single-AI signal without triangulation.
reviewed_at: 2026-04-26
plans_reviewed:
  - 223-01-PLAN.md
  - 223-02-PLAN.md
  - 223-03-PLAN.md
  - 223-04-PLAN.md
  - 223-05-PLAN.md
  - 223-06-PLAN.md
overall_risk: HIGH
high_concerns: 7
medium_concerns: 5
low_concerns: 2
---

# Cross-AI Plan Review — Phase 223

> **Single-reviewer caveat (override):** Codex usage limit reached. Gemini/OpenCode not installed. User directed Claude (current runtime) to perform the review.

> **Verified codebase findings (cross-referenced from prior P224/P225/P226 reviews):**
> - `lib/markos/crm/agent-actions.ts:68` exports `buildApprovalPackage`. `createApprovalPackage` does NOT exist.
> - `lib/markos/{cdp,crm360,channels}/` directories DO NOT exist.
> - `package.json` scripts: only `test`, `chromatic`, `openapi:build`. NO vitest, NO playwright.
> - `api/` uses legacy `*.js` flat convention. NO `api/v1/` tree, NO App Router `route.ts`.
> - **GROUNDED:** `lib/markos/outbound/{base-adapter,resend-adapter,twilio-adapter}.ts` actually exist. `api/crm/outbound/*.js` + `api/webhooks/*.js` legacy convention exists. P223 partly anchors to real code (good).

---

## Claude Review

# Claude Review — Phase 223

## Summary

Phase 223 (Native Email + Messaging Orchestration) is structurally similar to Phase 224 — large planset (5262 lines, 6 plans) with significant architecture-hallucination patterns AND meaningful grounding in real existing code. The product design is coherent (per-channel program models + ConsentState double-gate + AgentRun-wrapped fan-out + layered approval triggers). The grounded parts (extending `lib/markos/outbound/providers/` real adapters, reusing `api/webhooks/*.js` legacy convention) are good. The hallucinated parts (`createApprovalPackage` ~10+ invocations, `lib/markos/{cdp,crm360,channels}/*` nonexistent trees, 5 App Router `route.ts` cron handlers, vitest/playwright assumed installed, AgentRun bridge stub) repeat the failure mode caught in P224/P225/P226/P227/P228.

Same Hybrid (A-leaning) replan as P224 will fix this — Wave 0.5 architecture-lock + assertUpstreamReady preflight + remove fictional helpers + convert App Router cron to legacy `api/*.js`.

## Strengths

- **Real codebase grounding**: `lib/markos/outbound/{base-adapter,resend-adapter,twilio-adapter}.ts` are extended (not fictionalized). P223 understands current outbound substrate. Better than P224's wholesale `lib/markos/conversion/launches/` greenfield.
- **Substitution posture explicit (CONTEXT line 22)**: deprecation of `outboundConsentRecords` + `api/crm/outbound/*` documented; legacy adapter pattern preserves transition. Clear migration story.
- **5-layer fail-CLOSED approval triggers (D-16)**: class + count + content + manual + re-engagement. Well-designed (better than typical "single threshold" approval gate).
- **D-19 layered double-gate (5 checks)**: ConsentState + suppression + frequency cap + quiet hours + jurisdiction. Comprehensive per-recipient gate; matches GDPR + CAN-SPAM + WhatsApp 24-hour rules.
- **Single fan-out emit() (D-29)**: every webhook normalizer goes through one function. cdp_events + crm_activity + dispatch_events + ConsentState all updated transactionally. Fail-closed. Architectural correct.
- **Knock for push** (D-09): pragmatic provider choice (Vercel Marketplace partner, FCM/APNS abstraction, opensource SDK).
- **D-38 webhook signature verification mandatory**: Resend/Twilio/Knock all signed. Verification failure → 401 + audit. No silent acceptance.

## Concerns

### HIGH (7)

- `HIGH` — **`createApprovalPackage` does not exist** ✓ verified. CONTEXT.md L231/L250 + Plans 03 (lines 41/43/61/73/136/305/307/330/345/386/420) + Plan 04 (lines 121/255) + Plan 05 (line 472) reference `lib/markos/crm/copilot.ts::createApprovalPackage`. Real export at `lib/markos/crm/agent-actions.ts:68` is `buildApprovalPackage`. ~14 invocations across plans. Same fictional-helper bug as Phases 224/225/226. Plans 03/04/05 import + invoke — execution fails at import resolution. F-131 contract Plan 03 ships claims to extend P105 createApprovalPackage which doesn't exist either.

- `HIGH` — **App Router `route.ts` cron handlers in Plan 06**. Plan 06 frontmatter `files_modified` lines 12-16 + body lines 98/100/102/104/106/123/126/132/212/237 ship 5 cron handlers under `app/api/cron/channels-*/route.ts` (App Router convention). Repo: legacy `api/*.js` flat (NO `api/v1/` tree, NO App Router). Plan 06 line 237 even has soft-skip language: "if absent, use vercel.json + any prior cron route as template" — hallucinates that `app/api/cron/crm360-drift/route.ts` (P222 reference) exists. Same App Router bug as P224 RH3/RH4 and P225 RH1.

- `HIGH` — **`lib/markos/cdp/adapters/crm-projection.ts` (P221) and `lib/markos/crm360/*` (P222) don't exist**. CONTEXT L229/L230/L248/L249 + Plans 02/03/04/05 cite. P221 + P222 not landed. Same as P224 RH2 / P225 RH3 / P226 RH2. Plans need explicit greenfield framing + assertUpstreamReady throw on missing.

- `HIGH` — **`lib/markos/channels/*` is greenfield but referenced as "extending" doctrine**. CONTEXT L268: `lib/markos/channels/adapters/legacy-outbound.ts` is NEW. CONTEXT line 99: `lib/markos/channels/events/emit.ts` NEW. The "evolved CRM outbound workspace" narrative implies extending existing code, but `lib/markos/channels/` is greenfield (verified — no such tree on disk). Plans should mark explicitly as P223-owned greenfield with clear file-creation tasks (NOT "evolve existing").

- `HIGH` — **vitest + playwright NOT in package.json**. 226 hits across 6 plans (avg ~38/plan). Plan 01 = 26, Plan 02 = 37, Plan 03 = 25, Plan 04 = 30, Plan 05 = 28, Plan 06 = 50. Same as P224 RH5 / P225 RH4 / P226 RH4. Either pin to `npm test` (Node `--test`) per Phase 226 D-82 OR add explicit Plan 01 npm install task with version pinning + script registration. Currently plans assume installed.

- `HIGH` — **AgentRun bridge stub if P207 absent (D-15)**. CONTEXT line 56: "P207 not yet executed at P223 plan time. Bridge: AgentRun wrapper writes directly to `markos_audit_log` if `markos_agent_runs` table absent; flag in config `workflow.agentrun_v2_available` controls behavior." Same rejected pattern as P225 RH8 / P226 RH8 / P227 / P224. Channel dispatch IS the run-tracked operation — soft-skipping AgentRun breaks audit chain (D-37). Should hard-fail with `assertUpstreamReady(['P207'])` per P226 D-87 / P225 D-54 model.

- `HIGH` — **Soft-skip dependency posture across multiple plans for P205/P207/P208/P209/P210/P221/P222**. Plan 06 line 237: "if absent, use vercel.json + any prior cron route as template" — fallback when P222 cron pattern absent. CONTEXT D-15: AgentRun bridge stub. CONTEXT D-11/D-12: ConsentState reads via fictional `lib/markos/cdp/adapters/`. Frequency cap implementation (Claude's Discretion line 165): "Vercel Queues vs alternative ... fallback to Supabase pg_boss if not." Same escape-hatch pattern P226 RH8 / P227 / P225 RH8 rejected. Should hard-fail with assertUpstreamReady preflight gate.

### MEDIUM (5)

- `MEDIUM` — **Content classifier "carry from P211" (D-16, D-25, D-27) — P211 may not be landed**. ROADMAP shows P211 as in-progress/planned. P223 D-16 says "{{MARKOS_PRICING_ENGINE_PENDING}} detection (P211 rule + Pricing Engine Canon)". If P211 hasn't landed the classifier yet, P223 ships it as greenfield. Same compounded RH issue as P224 RH8 ("carry from P223" when P223 not landed). Plans should declare classifier as P223-owned OR fail-closed assertUpstreamReady on P211.

- `MEDIUM` — **Frequency cap implementation Claude's Discretion (CONTEXT line 165)**. "rolling window in dispatch_events vs Redis sliding window. Planner decides per scale." This is enforcement-boundary deferral — P226 RH5/RH6 reviews showed app-only enforcement bypassable. Frequency cap is a compliance-grade gate (CAN-SPAM regulatory). Should be DB-trigger or unique-constraint enforced (e.g., partial unique index on `(profile_id, channel, dispatch_window_id)` blocks > N sends per window), not service-layer rolling window.

- `MEDIUM` — **Pricing classifier 5-line regex heuristic risk (P226 RM3 carry)**. CONTEXT D-16 + D-27 says content classifier blocks dispatch on `{{MARKOS_PRICING_ENGINE_PENDING}}` checks. Phase 226 review (RM3) found 5-line regex misses cross-module assembly. Phase 223 likely faces same issue. Replace with AST/allowlist pattern per P226 D-37.

- `MEDIUM` — **D-12 RLS-blocking legacy `outboundConsentRecords` writes underspecified**. "legacy direct writes are blocked at the table level via RLS or trigger." Choice not pinned in CONTEXT. RLS policies and BEFORE INSERT triggers have different bypass profiles (service-role bypasses RLS by default). For compliance-grade single-writer enforcement, prefer trigger (per P226 D-83/D-84 enforcement-boundary doctrine).

- `MEDIUM` — **WhatsApp 24-hour session window composability (D-19 specifics)**. CONTEXT specifics: "WhatsApp 24-hour session window: existing twilio-adapter handles; D-19 quiet-hours + frequency-cap layer composes with it (no override of WhatsApp rules)." But there's no test or guard verifying the composition is correct (no override of WhatsApp rules). If quiet-hours defers a send past the 24-hour session window, the session is lost and template message rules apply (different cost + different consent). Need explicit ordering rule + test.

### LOW (2)

- `LOW` — **6 plans × 5262 lines is moderate but borderline-dense**. Acceptable per P226 W1 mitigation pattern. Consider explicit `autonomous: false` on Plan 06 (cron handlers + ops surface — operator action likely needed for warming sender + DKIM/SPF setup).

- `LOW` — **F-ID allocation deferred to planner (CONTEXT D-40)**. "Continue after P222's F-121. Expect 9-12 new contracts." P227/P226/P225 reviews showed contract-slot collisions across plans (P226 B6 issue). Plan 01 should pre-allocate F-IDs explicitly (e.g., F-122..F-131) and document in truths. Run F-ID-collision regression test in Plan 06 closeout.

## Suggestions

- **Replace `createApprovalPackage` everywhere → `buildApprovalPackage`** from `lib/markos/crm/agent-actions.ts:68`. Verify with `grep -c "createApprovalPackage" .planning/phases/223-*` zero positive invocations.

- **Convert Plan 06 App Router cron handlers to legacy `api/*.js`**: `api/cron/channels-deliverability-rollup.js`, `api/cron/channels-lifecycle-journey-poll.js`, `api/cron/channels-bounce-spike-alert.js`, `api/cron/channels-tombstone-cascade.js`, `api/cron/channels-soft-bounce-promote.js`. Use `requireHostedSupabaseAuth` from `onboarding/backend/runtime-context.cjs:491`.

- **Add Wave 0.5 architecture-lock + preflight gate to Plan 01** (per P226 D-78 / P225 D-49 model):
  - Pin runtime: legacy `api/*.js` + `requireHostedSupabaseAuth` + `npm test` runner (Node `--test`) + `contracts/openapi.json` + `lib/markos/mcp/tools/index.cjs`
  - `lib/markos/channels/` declared as P223-owned greenfield
  - assertUpstreamReady() preflight CLI for P205/P207/P208/P209/P210/P221/P222
  - Forbidden-pattern detector test (createApprovalPackage, requireSupabaseAuth, requireTenantContext, serviceRoleClient, lookupPlugin, public/openapi.json, app/(public), app/(markos), api/v1/.../route.ts, vitest run, from 'vitest', .test.ts)

- **Convert AgentRun bridge stub (D-15) to fail-closed throw**. Phase 223 hard-fails if P207 absent. No `workflow.agentrun_v2_available` config flag fallback.

- **Mark `lib/markos/cdp/adapters/`, `lib/markos/crm360/`, `lib/markos/channels/` explicitly as upstream/P223-greenfield** with hard preconditions. Remove all "if exists / bridge stub if absent" patterns.

- **Move frequency cap enforcement to DB layer** (per P226 D-83/D-84 model). Partial unique index OR BEFORE INSERT trigger that counts dispatch_events in rolling window.

- **Replace pricing classifier 5-line regex heuristic with AST/allowlist** (per P226 D-37 / RM3 fix model). Add `@babel/parser` (or stick with regex on bounded code paths only — pick one, document).

- **Pre-allocate F-ID slot table in Plan 01 truths** (per P226 B6 lesson). Run F-ID-collision regression test in Plan 06.

- **WhatsApp 24-hour session window ordering rule**: D-19 gate ordering must be explicit. Quiet-hours defer < 24-hour session boundary OR session-aware deferral. Add test.

- **Pin npm deps for new providers**: Knock SDK (D-09) + any Vercel Queues client lib. If `@upstash/qstash` or similar needed, add explicit Plan 01 npm install task (per P225 RH5 model).

## Risk Assessment

**Overall: HIGH**

Same architecture-hallucination class as Phases 224/225/226/227. Concrete bugs that will fail at execute-time:
- `createApprovalPackage` import resolution fails (~14 invocations)
- `lib/markos/cdp/adapters/crm-projection.ts` module resolution fails
- `lib/markos/crm360/*` module resolution fails
- `app/api/cron/channels-*/route.ts` files don't match repo conventions
- `npx vitest`, `npx playwright` command not found
- AgentRun bridge stub silent-skip breaks audit chain

Mitigating factor: P223 has more grounded code than P224 — `lib/markos/outbound/{base-adapter,resend,twilio}.ts` and `api/{crm/outbound,webhooks}/*.js` are real legacy convention reuse. The replan effort is smaller than P224 (~16h vs ~9249 lines of correction).

Recommended path: same Hybrid (A-leaning) replan as P226. Apply Phase 226 lessons (sync frontmatter to body; migration slot pre-allocation; DB-trigger enforcement for compliance gates; assertUpstreamReady preflight; remove fictional helpers + App Router).

## Specific Questions for Plan Author

1. Approval helper: `buildApprovalPackage` from `lib/markos/crm/agent-actions.ts:68` exists. `createApprovalPackage` does not. Plans need consistent symbol replacement. Confirm.

2. App Router migration for cron handlers in Plan 06 — intentional? If yes, where is the route-group migration ADR? If no, rewrite to legacy `api/cron/*.js`.

3. Are P205/P207/P208/P209/P210/P221/P222 hard prerequisites or soft-skip-with-bridge? Currently mixed (D-15 says bridge; CONTEXT line 268 says legacy adapter). Pick one — recommend hard-fail per route-back doctrine.

4. Frequency cap enforcement boundary — DB layer (compliance grade) or service layer (P226 RH5 anti-pattern)?

5. WhatsApp 24-hour session window: how does D-19 quiet-hours defer interact? Defer-past-session loses session.

6. Are vitest + playwright being installed by P223 (Plan 01 task) or migrating to `npm test`? 226 references across 6 plans. Confirm.

7. Pricing classifier regex vs AST — current shape unclear. Specify test extent.

8. Knock SDK + Vercel Queues client deps — add to package.json explicitly?

9. Are 9-12 new F-IDs pre-allocated explicitly? P227 review found multi-plan F-ID collision (B6 lesson).

10. `lib/markos/channels/` is greenfield owned by P223 (verified — directory does not exist). Plans should mark as NEW, not "evolve existing".

---

## Consensus Summary

> Single-reviewer (Claude under user override). No triangulation. Apply same caveats as Phase 224 review.

### Top concerns (HIGH)

1. **`createApprovalPackage` fictional** ✓ verified — Plans 03/04/05 ~14 invocations. Same as Phases 224/225/226.
2. **App Router `route.ts` cron handlers in Plan 06** — 5 handlers under `app/api/cron/.../route.ts`. Repo uses legacy `api/*.js`. Same as P225 RH1 / P224 RH3-4.
3. **`lib/markos/{cdp,crm360,channels}/*` nonexistent** — same as P224 RH2 / P225 RH3 / P226 RH2.
4. **`lib/markos/channels/*` greenfield not marked** — narrative says "evolve existing" but tree doesn't exist.
5. **vitest/playwright not in package.json** — 226 references across 6 plans. Same as P224 RH5 / P225 RH4 / P226 RH4.
6. **AgentRun bridge stub if P207 absent (D-15)** — soft-skip pattern. Same as P226 RH8 / P227.
7. **Soft-skip dependency posture for P205/P207/P208/P209/P210/P221/P222** — escape hatches in CONTEXT + Plan 06 fallback narrative.

### MEDIUM

8. Content classifier "carry from P211" — P211 not landed. Same compounded issue as P224 RH8.
9. Frequency cap enforcement boundary fuzzy (service-layer vs DB-trigger).
10. Pricing classifier 5-line regex heuristic risk — same as P226 RM3.
11. D-12 RLS-vs-trigger choice not pinned for legacy outboundConsentRecords blocking.
12. WhatsApp 24-hour session window composability with quiet-hours defer.

### LOW

13. 6 plans × 5262 lines — borderline-dense, mitigate via Plan 06 `autonomous: false`.
14. F-ID allocation deferred — pre-allocate slot table per P226 B6 lesson.

### Suggested next move

`/gsd-plan-phase 223 --reviews` to incorporate this feedback. Apply Hybrid (A-leaning) strategy from Phase 226:
1. Wave 0.5 architecture-lock in Plan 01 Task 0.5
2. assertUpstreamReady() preflight gate
3. DB-trigger frequency cap + RLS-vs-trigger consent-write enforcement
4. AST/allowlist pricing classifier
5. Replace `createApprovalPackage` everywhere
6. Convert App Router cron → legacy `api/*.js`
7. Mark `lib/markos/channels/` as P223-owned greenfield + hard preconditions for upstream trees
8. F-ID pre-allocation table

### Reviewer environment

- Reviewer: Claude (current Claude Code runtime, user override after Codex usage limit)
- Independence rule: waived per user direction
- Files inspected: 223-CONTEXT.md (full), 223-{01..06}-PLAN.md (targeted greps + key sections)
- Verification source: prior Codex reviews of P225/P226/P227/P228 + own P224 codebase verification

### Trust caveat

Single-reviewer (Claude is runtime executing plans). Independence compromised. When Codex resets (2026-05-02 09:44 AM), running `/gsd-review --phase 223 --codex` for triangulated reading recommended.
