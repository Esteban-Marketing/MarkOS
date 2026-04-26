---
phase: 221
phase_name: cdp-identity-audience-consent-substrate
reviewers: [claude-runtime-override]
reviewers_attempted: [codex, claude, gemini, opencode]
reviewers_skipped:
  - codex: usage limit reached (resets 2026-05-02 09:44 AM)
  - gemini: not installed
  - opencode: not installed
reviewer_note: |
  Claude (current runtime) performed this review under explicit user override.
  Independence rule waived per user direction (same posture as P222/P223/P224).
reviewed_at: 2026-04-26
plans_reviewed:
  - 221-01-PLAN.md
  - 221-02-PLAN.md
  - 221-03-PLAN.md
  - 221-04-PLAN.md
  - 221-05-PLAN.md
  - 221-06-PLAN.md
overall_risk: MEDIUM
high_concerns: 1
medium_concerns: 4
low_concerns: 3
---

# Cross-AI Plan Review — Phase 221

> **Single-reviewer caveat (override):** Codex usage limit reached. Gemini/OpenCode not installed. Claude runtime review per user direction.

> **Verified codebase findings (P221 grounded — markedly different from P222-P228):**
> - `lib/markos/crm/identity.ts` EXISTS with exact weights cited (lines 18-22: 0.65/0.15/0.1/0.1/0.15) ✓
> - `lib/markos/crm/tracking.ts` EXISTS ✓
> - `lib/markos/crm/merge.cjs` EXISTS ✓
> - `lib/markos/outbound/consent.ts` EXISTS ✓
> - `api/tracking/ingest.js` + `api/tracking/identify.js` EXIST ✓ (legacy `*.js` flat convention preserved)
> - Plans cite real code anchors with verified line numbers; no fictional helpers
> - 0 `route.ts` references; 0 App Router; 0 `app/api/`; 0 `createApprovalPackage`; 0 `requireSupabaseAuth`; 0 `lookupPlugin`
> - P221 OWNS `lib/markos/cdp/*` greenfield (root of CDP lane — correct ownership)

---

## Claude Review

# Claude Review — Phase 221

## Summary

Phase 221 (CDP Identity, Audience, Consent Substrate) is markedly cleaner than P222-P228. Plans are anchored to real existing code (`lib/markos/crm/identity.ts` weights, `tracking.ts`, `merge.cjs`, `outbound/consent.ts`, `api/tracking/{ingest,identify}.js` — all verified exist). P221 OWNS `lib/markos/cdp/*` greenfield correctly. NO App Router hallucination. NO fictional helpers. NO bridge-stub soft-skip patterns. The single architectural concern is Plan 01's explicit install of vitest + playwright — which conflicts with downstream phase architecture-locks (P204 D-49, P226 D-82, P223 D-46, P222 D-39) that pin `npm test` (Node `--test`) as the test runner.

Other concerns are MEDIUM/LOW: ConsentState shim drift reconciliation, JSON Logic DSL audience compute, dual-write transaction safety. P221 is well-scoped, well-grounded, ready to ship after vitest/playwright decision.

## Strengths

- **Real codebase grounding (verified)**: Every cited file (`lib/markos/crm/identity.ts`, `tracking.ts`, `merge.cjs`, `outbound/consent.ts`, `api/tracking/{ingest,identify}.js`) exists. Soft-match weights (0.65/0.15/0.1/0.1/0.15) carried verbatim from `identity.ts:18-22` — verifiable.
- **OWNS `lib/markos/cdp/*` greenfield correctly** (root of CDP lane). All downstream P222-P228 references to this tree are valid IF P221 ships first.
- **Legacy `api/*.js` convention preserved** (no App Router); `api/crons/cdp-consent-drift-audit.js` matches existing project pattern.
- **CRON_SECRET auth pattern referenced** (Plan 02 cron handler pattern — likely follows existing `api/cron/webhooks-dlq-purge.js`).
- **D-04 thresholds explicit**: hard-match 1.0; soft-match weights preserved; 0.40/0.80 review/auto-accept thresholds carried from P101 D-04. Concrete + verifiable.
- **D-08 cdp_events append-only canonical event SOR**: append-only design (compliance + replayability friendly).
- **D-12 ConsentState shim with drift audit** (P221 ships shim; full cutover P223): explicit transition plan.
- **D-13 downstream enforcement** ("Every downstream send/dispatch engine MUST consume `ConsentState` (never a channel-local flag). Enforced at planner/reviewer time for P222-P226."): rare cross-phase architectural constraint — strong governance.
- **D-17 audience separation** (`AudienceDefinition` logic vs `AudienceSnapshot` immutable result): correct doctrine; explicit non-overload of existing `segment` brand entity.
- **D-18 audience double-gate** (snapshot membership + dispatch re-validation): compliance-grade. Snapshot freezes COULD; dispatch confirms CAN.
- **D-24 DSR tombstone + cascade purge with ConsentState retention**: correct compliance posture (legal defensibility of suppression preserved post-deletion).
- **D-29 unified `markos_audit_log` per-tenant hash chain (P201)**: tamper-evident audit. Carries pattern forward.
- **JSON Logic DSL choice documented** (Plan 04 D-17 line 31: "no SQL strings, no custom AST"): research-stage decision committed; json-logic-js install in Plan 01 Task 1 is correctly tied.

## Concerns

### HIGH (1)

- `HIGH` — **Plan 01 Task 1 explicit install of vitest + playwright conflicts with downstream architecture-lock**. Plan 01 lines 157-176: `npm install -D vitest@^1.6.0 @vitest/coverage-v8@^1.6.0 playwright@^1.45.0 @playwright/test@^1.45.0`. Adds `vitest.config.ts` + `playwright.config.ts` at repo root. Adds 4 npm scripts (`test:vitest`, `test:vitest:watch`, `test:cdp`, `test:playwright`). Keeps existing `npm test` "as legacy". **This conflicts with**:
  - **P204 D-49** (architecture-lock pins `npm test` Node `--test`; "no vitest install")
  - **P226 D-82** (npm test runner; "vitest/playwright explicitly forbidden")
  - **P222 D-39** ("NO vitest install ... import from `node:test` + `node:assert/strict`")
  - **P223 D-46** (npm test runner pinned)
  - **P224 D-46** (npm test runner)
  - **P225 D-46** (npm test runner)

  **Two paths:**
  - **(A) Drop vitest/playwright from P221**: rewrite Plan 01-06 test files from `*.test.ts` (vitest) → `*.test.js` (Node `--test` + `node:assert/strict`). Drop `vitest.config.ts` + `playwright.config.ts`. Drop `test:vitest`/`test:playwright` scripts. Keep `json-logic-js` install (separate from test runner). Aligns with P204/P222-P228 architecture-lock.
  - **(B) Accept P221 introduces vitest/playwright**: amend P204 D-49 + P222-P228 architecture-lock to acknowledge "vitest + playwright installed by P221". Risk: two test runners coexisting; downstream phases may inconsistently use vitest vs node:test depending on planner agent state.

  **Recommend (A)** — consistency with downstream phase locks. Single test runner. Less supply-chain. P221 plans use `node --test` instead.

### MEDIUM (4)

- `MEDIUM` — **D-12 ConsentState shim drift audit deferred to Plan 06 reconciliation gate**. Plan 02 ships dual-write (cdp_events + crm_activity) but drift reconciliation queries deferred to Plan 06 (Pitfall 1 / T-221-17 grace-mode logging). Risk: during P221 execute window, cdp_events/crm_activity divergence accumulates without visibility until Plan 06 runs. Mitigations exist (T-221-17 logs `CDP_DUAL_WRITE_FAILED` + sets `x-cdp-write-status: degraded` response header), but operator-task escalation only fires at Plan 06 cron. Should run drift audit cron from Wave 2 onward (Plan 02), not just Plan 06 closeout. Verify.

- `MEDIUM` — **Outbound consent legacy fallback (D-12) — RLS vs trigger choice not pinned**. D-12: "evaluateOutboundEligibility reads ConsentState first, falls back to legacy rows on miss." During migration window, both `outboundConsentRecords` and `cdp_consent_states` are writable. Without DB-level single-writer enforcement (per P226 D-83/D-84 / P223 D-51 model), service-role bypass + legacy app-layer writes can drift. P221 should pin trigger-based blocking on `outboundConsentRecords` writes (forward-port from P223 D-51 pattern), not just app-layer fallback. Otherwise P221's "drift audit" runs forever.

- `MEDIUM` — **D-22 read-only API `/v1/cdp/*` — auth + pagination + tenant-isolation underspecified**. CONTEXT lists 4 GET endpoints + 2 MCP tools. Verify Plan 05 (likely API plan) ships:
  - `requireHostedSupabaseAuth` from `onboarding/backend/runtime-context.cjs:491` (matches P204/P222 D-42 pattern)
  - Cursor pagination (not offset; large CDP profile counts)
  - Tenant-isolation grep test (cross-tenant 404)
  - MCP tools at `lib/markos/mcp/tools/index.cjs` (not `.ts`)

- `MEDIUM` — **F-ID + migration slot pre-allocation inconsistent vs P226 B6 lesson**. Plan 01 Task 1 cites `F-106` + `F-107`. CONTEXT D-30: "expect ~5-7 new contracts" + planner picks. Expected slot table 106-112. Verify Plan 01 truths block has explicit slot table + Plan 06 closeout has F-ID-collision regression test (per P223 D-55 / P226 RL2 lesson).

### LOW (3)

- `LOW` — **JSON Logic DSL safety (Plan 04 D-17)**. JSON Logic is sandbox-safe in principle; verify `json-logic-js` v2.0.5 has no known prototype pollution / injection vectors with arbitrary tenant `logic_json`. Audience compute runs against profile `{ traits, consent, lifecycle_state, mode, jurisdiction }` — tenant-controlled. Add input validation: reject `logic_json` referencing operators outside whitelist (e.g., `if`, `==`, `<`, `in`, etc.; reject `eval`-like operators).

- `LOW` — **Plan 01 Task 1 line 157 magic-number version flexibility**. "If any exact version is unavailable at install time, pin to current latest matching major." Acceptable for vitest/playwright (if shipped) but `json-logic-js@^2.0.5` should pin exact for audience compute reproducibility.

- `LOW` — **6 plans × 4885 lines** — moderate density. Plan 06 likely closeout — check `autonomous: false` if drift reconciliation requires operator review (per P223 D-49 / P226 W1 mitigation).

## Suggestions

- **Path A (recommended): drop vitest + playwright from P221 Plan 01 Task 1.** Rewrite test files `*.test.ts` → `*.test.js`. Use `node:test` + `node:assert/strict` imports. Drop `vitest.config.ts` + `playwright.config.ts`. Keep `json-logic-js` install (separate concern; required for D-17 audience DSL). Aligns with P204 D-49 + P222-P228 architecture-locks.

- **Path B alternative**: amend P204 D-49 + P222 D-39 + P223 D-46 + P224 D-46 + P225 D-46 + P226 D-82 in their CONTEXT.md to acknowledge "vitest + playwright installed by P221 Plan 01 Task 1; downstream phases may use either `node --test` (preferred) or `vitest run` (allowed)". This requires re-replanning all 7 downstream phases — high effort.

- **Add ConsentState single-writer DB-trigger to D-12 shim** (forward-port P223 D-51 pattern). BEFORE INSERT/UPDATE trigger on `outboundConsentRecords` blocks writes outside `setConsentState` GUC. Service-role bypass blocked. Drift audit becomes confirmation, not silent-skip detection.

- **Run drift audit cron from Wave 2** (Plan 02) not just Plan 06 closeout. Dual-write divergence visible from first hour, not month later.

- **Specify Plan 05 read-only API auth + pagination + tenant isolation explicitly**. Match P204/P222 patterns: `requireHostedSupabaseAuth`, cursor pagination, tenant-isolation regression test, MCP tools at `lib/markos/mcp/tools/index.cjs`.

- **Pre-allocate F-ID + migration slot tables in Plan 01 truths** (per P223 D-55 / P226 RL2 lesson). Plan 06 closeout includes F-ID-collision regression test.

- **JSON Logic operator whitelist** for `logic_json` evaluation. Reject operators outside `{ if, ==, !=, <, <=, >, >=, in, and, or, not, +, -, *, / }`. Tenant-controlled `logic_json` is attack surface; restrict.

## Risk Assessment

**Overall: MEDIUM**

P221 is the cleanest plan reviewed in this milestone. Ships solid CDP substrate with verified code anchors. Single architectural conflict (vitest/playwright vs downstream lock) requires user decision. Other concerns are tightening (single-writer trigger, drift cron timing, API spec details) not foundational.

Mitigating: P221 grounds in real existing code (P226 verified; identity.ts weights match exactly). No fictional helpers. No App Router hallucination. No bridge stubs. The replan effort is small — single decision (Path A vs B) plus 4 medium-priority hardenings.

## Specific Questions for Plan Author

1. vitest + playwright install (Plan 01 Task 1): keep (Path B requires P204/P222-P228 amendments) OR drop (Path A keeps consistency)? Strongly recommend Path A.

2. `outboundConsentRecords` legacy fallback during shim window — RLS or DB-trigger single-writer?

3. Drift audit cron schedule — Plan 02 (Wave 2) or only Plan 06 (closeout)?

4. Plan 05 read-only API: `requireHostedSupabaseAuth`? Cursor pagination? Tenant-isolation regression test?

5. F-ID + migration slot allocation pre-allocated in Plan 01 truths? Closeout collision test in Plan 06?

6. JSON Logic operator whitelist for `logic_json` evaluation?

7. Plan 06 `autonomous: false` if drift reconciliation needs operator review?

8. cdp_events dual-write transaction safety: same-transaction with crm_activity OR outbox? Plan 02 needs explicit answer.

9. AudienceSnapshotMembership scale — 1M-row tenant audience snapshot performance? Index design + partition strategy?

10. ConsentState retention post-DSR-deletion (D-24): legal defensibility verified with privacy counsel? Document jurisdictional constraints (CCPA "right to delete" interpretation may require ConsentState purge in some cases).

---

## Consensus Summary

> Single-reviewer (Claude under user override). No triangulation. Codex unblocks 2026-05-02 09:44 AM.

### Top concern (HIGH — single)

1. **vitest + playwright install conflicts with downstream architecture-lock** — Plan 01 Task 1 explicit `npm install -D vitest playwright`. Conflicts with P204 D-49, P222 D-39, P223 D-46, P224 D-46, P225 D-46, P226 D-82. Requires Path A (drop) or Path B (amend 7 phases).

### MEDIUM (4)

2. ConsentState shim drift audit deferred — should run from Wave 2 not Wave 5
3. Outbound consent legacy fallback — RLS vs DB-trigger choice unpinned
4. D-22 read-only API auth + pagination + tenant isolation underspecified
5. F-ID + migration slot pre-allocation inconsistent vs P226 B6 lesson

### LOW (3)

6. JSON Logic DSL operator whitelist for safety
7. Magic-number version flexibility on json-logic-js
8. 6 plans × 4885 lines — Plan 06 autonomous: false?

### Suggested next move

`/gsd-plan-phase 221 --reviews` for Path A (drop vitest/playwright; align to npm test runner).

This is the cleanest replan in the milestone — most fixes are MEDIUM/LOW hardenings, not architectural. Same single-iter PASSED pattern as P223.

### Reviewer environment

- Reviewer: Claude (current Claude Code runtime; user override after Codex usage limit)
- Independence rule: waived per user direction
- Files inspected: 221-CONTEXT.md (full), 221-{01..06}-PLAN.md (targeted greps + key sections + code-anchor verification)
- **Verification**: All cited code anchors verified existing (identity.ts weights, tracking.ts, merge.cjs, consent.ts, api/tracking/*.js)

### Trust caveat

Single-reviewer (Claude is runtime). When Codex resets (2026-05-02 09:44 AM), running `/gsd-review --phase 221 --codex` for triangulation recommended.
