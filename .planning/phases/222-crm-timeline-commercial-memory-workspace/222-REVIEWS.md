---
phase: 222
phase_name: crm-timeline-commercial-memory-workspace
reviewers: [claude-runtime-override]
reviewers_attempted: [codex, claude, gemini, opencode]
reviewers_skipped:
  - codex: usage limit reached (resets 2026-05-02 09:44 AM); ChatGPT subscription auth, NOT OpenAI API key — .env additions don't apply
  - gemini: not installed
  - opencode: not installed
reviewer_note: |
  Claude (current runtime) performed this review under explicit user override after
  Codex hit usage limit. Independence rule waived per user direction (same posture
  as P223/P224 reviews). Treat as single-AI signal without triangulation.
reviewed_at: 2026-04-26
plans_reviewed:
  - 222-01-PLAN.md
  - 222-02-PLAN.md
  - 222-03-PLAN.md
  - 222-04-PLAN.md
  - 222-05-PLAN.md
  - 222-06-PLAN.md
overall_risk: HIGH
high_concerns: 7
medium_concerns: 4
low_concerns: 2
---

# Cross-AI Plan Review — Phase 222

> **Single-reviewer caveat (override):** Codex usage limit reached (subscription, not API-key — `.env` additions don't apply to Codex CLI). Gemini/OpenCode not installed. User directed Claude (current runtime) to perform review.

> **Verified codebase findings (cross-referenced from prior P223/P224/P225/P226 reviews):**
> - `lib/markos/crm/agent-actions.ts:68` exports `buildApprovalPackage`. `createApprovalPackage` does NOT exist.
> - `lib/markos/{cdp,crm360,channels,sales,conversion,launches,operating,analytics,pricing}/` directories DO NOT exist.
> - `package.json` scripts: only `test`, `chromatic`, `openapi:build`. NO vitest, NO playwright.
> - `api/` uses legacy `*.js` flat convention. NO `api/v1/` tree, NO App Router `route.ts`.
> - `app/` has `app/(marketing)/` legacy. NO `app/api/v1/` tree, NO `app/api/cron/` tree.

---

## Claude Review

# Claude Review — Phase 222

## Summary

Phase 222 (CRM Timeline + Commercial Memory Workspace) is structurally similar to P223/P224 — large planset (7342 lines, 6 plans), strong product design (timeline-first CRM + Customer360 + opportunity memory + lifecycle orchestration + NBA workspaces), and the same architecture-hallucination patterns the prior 5 reviews flagged. Notable: P222 is the OWNER of `lib/markos/crm360/*` greenfield (per CONTEXT D-19) — that's correct. But it ships 23 App Router `route.ts` API handlers + 3 App Router cron handlers + uses "stub if missing" soft-skip for P221 dependencies + 125 vitest/playwright/.test.ts references. Same Hybrid (A-leaning) replan as P223/P224 will fix it.

## Strengths

- **lib/markos/crm360/* ownership clear** — P222 OWNS this greenfield tree (D-19 + Plan 01 truths declare 7 module files under records/opportunities/adapters). Better than P224's loose "evolve existing" framing for nonexistent trees.
- **Read-through adapter doctrine (D-19)**: `legacy-entity.ts` adapter bridges existing `crm_entities` + P102/P103/P104/P105 consumers without rewrite. Phase-by-phase migration plan; sound.
- **Single-source identity discipline (D-21)**: "CRM never stores identity/consent/trait data — stores commercial overlay only (fit/intent/health/risk/lifecycle/ownership/opportunity)". Honors P221 CDP single-source rule.
- **Tombstone cascade (D-19)**: explicit `tombstone.ts` for tombstone propagation. Carries P221 D-24 doctrine forward.
- **`{{MARKOS_PRICING_ENGINE_PENDING}}` in pricing-guard (D-19 Plan 01 line 23)**: enforced via `lib/markos/crm360/opportunities/pricing-guard.ts`. Pricing safety wired at module level.
- **Score provenance separated** (D-19 line 21 + Plan 01): `score-provenance.ts` decouples score *computation* from score *attribution*. Audit-friendly.

## Concerns

### HIGH (7)

- `HIGH` — **App Router API handlers in Plan 05** (23+ `route.ts` files). Plan 05 frontmatter L13-22 + body L164 ship 23 handlers under `app/api/v1/crm/*/route.ts` (customer360, opportunities, committees, lifecycle-transitions, nba x4, timeline, etc.). Repo: legacy `api/*.js` flat (NO `api/v1/`, NO App Router). Same as P223 RH2 / P225 RH1 / P226 RH3.

- `HIGH` — **App Router cron handlers in Plan 06** (3 `route.ts` files). Plan 06 frontmatter L12-14 + body L78/94/97/100/164/168/441 ship `app/api/cron/crm360-{drift,nba-expire,daily-recompute}/route.ts`. Repo uses legacy `api/cron/*.js` flat. Same as P223 RH2.

- `HIGH` — **Soft-skip dependency posture for P221 — `lib/markos/cdp/adapters/crm-projection.ts` "may not exist"**. CONTEXT D-21 cites `lib/markos/cdp/adapters/crm-projection.ts::getProfileForContact` as upstream P221 dep. Plan 01 line 49 explicitly: "A3 guard — stub if missing". Plan 01 line 155: "P221 — may not exist at execute time per A3". Same A-N fallback pattern P226 RH8 / P227 / P225 RH8 rejected. Should hard-fail with `assertUpstreamReady(['P221'])` per P226 D-87 / P223 D-45 model.

- `HIGH` — **vitest + playwright NOT in package.json**. 125 references across 6 plans (37+22+10+16+17+23). Same as P223 RH5 / P224 RH5 / P225 RH4 / P226 RH4. Either pin to `npm test` (Node `--test`) per Phase 226 D-82 OR add explicit Plan 01 npm install task.

- `HIGH` — **NBA records (D-08 / Plan 04) — approval-package wiring uncertain**. Plan 05 ships `nba/[id]/execute/route.ts` (high-risk action). NBA executions likely need approval-package per P208 doctrine. Need to verify Plan 04/05 wires `buildApprovalPackage` correctly (NOT `createApprovalPackage`). Grep returned 0 hits for either — neither symbol cited explicitly. Approval flow underspecified for NBA execute action.

- `HIGH` — **Lifecycle transition writes — single-writer enforcement boundary**. D-08+ implies CRM lifecycle stages (anonymous → known → engaged → opportunity → customer → expansion/lost). Plan 05 ships `/v1/crm/lifecycle-transitions/route.ts` for stage changes. App-only enforcement bypassable per P226 RH5/RH6 doctrine. Lifecycle transition is commercial-grade (impacts NBA + scoring + reporting). Should have DB-level enforcement: BEFORE UPDATE trigger that validates state transitions + writes audit row.

- `HIGH` — **Plan 04 reference: existing CRM workspace tree may not match plan assumptions**. Plan 04 line 467: "lib/markos/crm/execution.cjs (CommonJS twin if exists — mirror refactor)". "If exists" is soft-skip pattern. Need definitive grep against actual repo state before plan execution. Same pattern P223 line "if exists ... bridge stub if absent" rejected.

### MEDIUM (4)

- `MEDIUM` — **CDP overlay adapter (D-21 cdp-overlay.ts) bound to fictional `lib/markos/cdp/adapters/`**. CONTEXT line 190+207. P221 not landed — `lib/markos/cdp/` directory doesn't exist. P222 ships `cdp-overlay.ts` adapter that delegates to `getProfileForContact` from a nonexistent file. Plan 01 line 49 even admits "stub if missing". Should be hard preflight gate per assertUpstreamReady; remove "stub" branch.

- `MEDIUM` — **Score provenance attestation chain (D-19)**: `score-provenance.ts` + scores computed elsewhere → attributed here. Without explicit DB-level append-only constraint, scores can be retroactively rewritten. For audit-grade scoring (regulatory or commercial-grade SLA), should enforce score immutability at DB layer (per P226 D-83 quote-immutability model — BEFORE UPDATE trigger blocks edits to `score_provenance.recorded_at` or column-level).

- `MEDIUM` — **Tombstone cascade transaction safety**. D-19 cites `tombstone.ts` cascading into Customer360 / Opportunity / NBA / score_provenance / etc. Cascade transactional or eventually-consistent? P226 RM2 found tombstone cascade "best-effort" and required outbox. P222 should clarify: single-transaction (ACID) OR outbox-with-replay-safety. Best-effort cascade leaks data across consent revocation boundaries.

- `MEDIUM` — **Approval-package usage for high-risk mutations** (D-08 NBA execute, D-19 tombstone, D-21 lifecycle transition). All cited as "approval-aware mutations" per P208 doctrine. But neither `createApprovalPackage` nor `buildApprovalPackage` cited in plan files. Need explicit wiring to `lib/markos/crm/agent-actions.ts:68::buildApprovalPackage` (NOT the fictional `createApprovalPackage` — same RH1 issue as P223/P224/P225/P226).

### LOW (2)

- `LOW` — **6 plans × 7342 lines is moderate**. Acceptable per P223/P226 W1 mitigation pattern. Plan 06 (cron + reconciliation) likely needs `autonomous: false` if any operator-action checkpoint required (e.g., drift reconciliation requires human review).

- `LOW` — **Migration slot allocation (D-21+ implies migrations 110-112)**. Plan 06 line 168 references migrations 111-112. Plan 01 likely owns 110 + others. Should pre-allocate explicit slot table per P226 B6 / P223 D-41 lesson. Plan 06 closeout should include migration-slot-collision regression test.

## Suggestions

- **Replace `createApprovalPackage` everywhere → `buildApprovalPackage`** from `lib/markos/crm/agent-actions.ts:68`. Add explicit calls in NBA execute path (Plan 05) + lifecycle transition path (Plan 05) + tombstone cascade path (Plan 04).

- **Convert Plan 05 App Router routes to legacy `api/*.js`**: 23 handlers → `api/v1/crm/customer360.js`, `api/v1/crm/customer360/[id].js`, `api/v1/crm/opportunities.js`, ... etc. Auth via `requireHostedSupabaseAuth` from `onboarding/backend/runtime-context.cjs:491`.

- **Convert Plan 06 App Router cron handlers to legacy `api/cron/*.js`**: `api/cron/crm360-{drift,nba-expire,daily-recompute}.js`. Auth via shared-secret pattern (mirror `api/cron/webhooks-dlq-purge.js` per P223 D-49).

- **Add Wave 0.5 architecture-lock + preflight gate to Plan 01** (per P223 D-42..D-49 / P226 D-78 model):
  - Pin runtime: legacy `api/*.js` + `requireHostedSupabaseAuth` + `npm test` (Node `--test`) + `contracts/openapi.json` + `lib/markos/mcp/tools/index.cjs`
  - Pin test files: `*.test.js` (NOT `.test.ts`); imports `node:test` + `node:assert/strict`
  - Pin npm deps: NO vitest, NO playwright unless explicit task
  - `lib/markos/crm360/*` declared P222-OWNED greenfield
  - `lib/markos/cdp/*` declared P221-OWNED greenfield (upstream-only)
  - assertUpstreamReady() preflight CLI for P208/P209/P211/P221 (P222's declared deps)
  - Forbidden-pattern detector test scans `222-*-PLAN.md` for: createApprovalPackage, requireSupabaseAuth, requireTenantContext, serviceRoleClient, lookupPlugin, public/openapi.json, app/(public), app/(markos), api/v1/.../route.ts, app/api/cron/.../route.ts, vitest run, from 'vitest', .test.ts, "stub if missing", "if exists"

- **Move lifecycle-transition enforcement to DB-trigger** per P226 D-83/D-84 model. BEFORE UPDATE trigger on Customer360.lifecycle_stage validates state-machine transitions + writes audit row. Service-role bypass blocked.

- **Move score immutability to DB-trigger** per P226 D-83 model. BEFORE UPDATE trigger on score_provenance blocks edits to recorded_at + score_value once committed. Append-only.

- **Tombstone cascade outbox** per P226 D-89 model. Replayable + idempotent + dead-letter aware.

- **Pre-allocate migration slot table in Plan 01 truths** (per P223 D-41 / P226 B6 lesson). Run migration-slot-collision test in Plan 06.

- **Pre-allocate F-ID slot table** (per P223 D-55 / P226 RL2 lesson). NBA + Customer360 + Opportunity + Committee + Timeline F-IDs explicit in Plan 01.

## Risk Assessment

**Overall: HIGH**

Same architecture-hallucination class as Phases 223/224/225/226/227. Concrete bugs that will fail at execute-time:
- 23 App Router `route.ts` API files don't match repo conventions (Plan 05)
- 3 App Router `route.ts` cron files don't match (Plan 06)
- `lib/markos/cdp/adapters/crm-projection.ts` (P221) doesn't exist; "stub if missing" silent-skip
- 125 vitest/playwright references; commands not found
- Lifecycle + NBA + score app-only enforcement (per P226 RH5/RH6 anti-pattern)
- Approval-package symbol absent (must be `buildApprovalPackage`)

Mitigating factor: P222 has clear greenfield ownership of `lib/markos/crm360/*` (better framing than P224/P225 which had fictional "evolve existing" claims). The replan effort is moderate — similar to P223 (1-iter PASSED).

## Specific Questions for Plan Author

1. Approval helper: `buildApprovalPackage` from `lib/markos/crm/agent-actions.ts:68`. NBA execute + lifecycle transition + tombstone all need explicit wiring. Confirm symbol replacement.

2. Plan 05 App Router migration intentional? If yes, where is the `api/` → `app/api/v1/...` migration ADR? If no, rewrite to legacy `api/v1/crm/*.js`.

3. Plan 06 cron pattern — `app/api/cron/crm360-*/route.ts` or legacy `api/cron/crm360-*.js`? P223 replan converted to legacy. Should P222 match.

4. P221 dependency posture — soft-skip "stub if missing" (current) or hard-fail assertUpstreamReady (route-back doctrine)? Recommend hard-fail.

5. Lifecycle transition enforcement — app-layer or DB-trigger? Compliance-grade.

6. Score immutability — append-only at DB layer or service-layer convention?

7. Tombstone cascade — single-transaction ACID or outbox-with-replay?

8. vitest + playwright — install in P222 or migrate to `npm test`? 125 references.

9. Migration slot allocation — pre-allocated explicitly?

10. F-ID slot allocation — pre-allocated explicitly per P223 D-55 model?

---

## Consensus Summary

> Single-reviewer (Claude under user override). No triangulation. Codex unblocks 2026-05-02 09:44 AM.

### Top concerns (HIGH)

1. **App Router API in Plan 05** (23 `route.ts` handlers) — repo uses legacy `api/*.js`
2. **App Router cron in Plan 06** (3 `route.ts` handlers) — repo uses legacy `api/cron/*.js`
3. **Soft-skip P221 dependency** ("stub if missing" — same A-N pattern P226/P227 rejected)
4. **vitest/playwright not installed** — 125 references across 6 plans
5. **NBA execute approval-package wiring uncertain** — neither buildApprovalPackage nor createApprovalPackage cited
6. **Lifecycle transition app-only enforcement** — should be DB-trigger
7. **Plan 04 "if exists" soft-skip** — needs hard verification before execute

### MEDIUM

8. CDP overlay adapter bound to fictional `lib/markos/cdp/`
9. Score provenance immutability not DB-enforced
10. Tombstone cascade transaction safety unspecified
11. Approval-package usage symbol absent (should be `buildApprovalPackage`)

### LOW

12. 6 plans × 7342 lines moderate density (Plan 06 may need autonomous: false)
13. Migration + F-ID slot allocation deferred (P226 B6 lesson)

### Suggested next move

`/gsd-plan-phase 222 --reviews` to incorporate this feedback. Apply Hybrid (A-leaning) strategy from Phase 226/223:
1. Wave 0.5 architecture-lock in Plan 01 Task 0.5
2. assertUpstreamReady() preflight gate for P208/P209/P211/P221
3. DB-trigger enforcement for lifecycle transitions + score immutability
4. Tombstone cascade outbox model
5. Replace `createApprovalPackage` with `buildApprovalPackage` in NBA + lifecycle + tombstone paths
6. Convert Plan 05 + Plan 06 to legacy `api/*.js` + `api/cron/*.js`
7. Mark `lib/markos/cdp/` as P221-owned upstream greenfield + hard-fail preflight
8. Migration + F-ID pre-allocation tables

### Reviewer environment

- Reviewer: Claude (current Claude Code runtime; user override after Codex usage limit)
- Independence rule: waived per user direction
- Files inspected: 222-CONTEXT.md (full), 222-{01..06}-PLAN.md (targeted greps + key sections)
- Verification source: prior Codex reviews of P225/P226/P227/P228 + own P224/P223 verification

### Trust caveat

Single-reviewer (Claude is runtime executing plans). Independence compromised. When Codex resets (2026-05-02 09:44 AM), running `/gsd-review --phase 222 --codex` for triangulated reading recommended.
