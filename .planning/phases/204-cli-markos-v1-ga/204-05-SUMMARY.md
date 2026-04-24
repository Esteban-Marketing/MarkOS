---
phase: 204-cli-markos-v1-ga
plan: 05
subsystem: cli
tags: [cli, init, plan, eval, dry-run, rubric, pluggable-llm, F-103, agent-run-v2-compat]

# Dependency graph
requires:
  - phase: 204-01 (Plan 01)
    provides: "bin/lib/cli/{http,output,errors,config,keychain}.cjs primitives + EXIT_CODES + formatError + 10 dispatch stubs"
  - phase: 204-04 (Plan 04)
    provides: "lib/markos/cli/whoami.cjs — resolveWhoami + resolveSessionWhoami dual-auth Bearer-to-tenant resolver"
  - phase: 200-02
    provides: "bin/lib/brief-parser.cjs parseBrief/validateBrief/normalizeBrief + bin/lib/generate-runner.cjs runDraft/stubLlm"
  - phase: 207-01 (CONTRACT-LOCK)
    provides: "AgentRun v2 schema (priority, chain_id, tokens_input/output, estimated_cost_usd_micro BIGINT) — 204-05 envelope is forward-compat"
provides:
  - "bin/commands/init.cjs — markos init delegator that spawns bin/install.cjs --yes with flag passthrough"
  - "bin/commands/plan.cjs — markos plan <brief> dry-run CLI"
  - "bin/commands/eval.cjs — markos eval <brief> [--draft=<path>] local rubric CLI"
  - "bin/lib/eval-runner.cjs — scoreDraft primitive (4-dimension rubric, pluggable LLM)"
  - "api/tenant/runs/plan.js — POST dry-run planner endpoint (dual-auth, strict no-write)"
  - "lib/markos/cli/plan.cjs + .ts — buildPlanEnvelope + hashToken + plan constants (shared with Phase 207 shape)"
  - "contracts/F-103-cli-runs-plan-v1.yaml — /api/tenant/runs/plan contract"
  - "openapi regen: 67 → 68 flows, 104 → 105 paths (+1 path: /api/tenant/runs/plan)"
  - "Wave 2 opens — pre-execution trio (init/plan/eval) lets users inspect + validate before 204-06 ships durable runs"
affects:
  - "204-06 (run / SSE) — consumes lib/markos/cli/plan.cjs::buildPlanEnvelope; envelope shape is AgentRun v2 compatible so /api/tenant/runs can reuse it verbatim"
  - "204-07 (env pull/push/diff/merge) — mirrors the dual-auth endpoint pattern"
  - "205 (Bearer middleware) — imports hashToken + resolveWhoami as canonical primitives"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Delegator subprocess pattern: init.cjs spawns bin/install.cjs via process.execPath to preserve pinned runtime + stdio:inherit for UX continuity"
    - "AgentRun v2 forward-compat envelope: estimated_cost_usd_micro (BIGINT-safe integer), priority default P2, chain_id default null, model nullable"
    - "Strict no-write handler invariant: plan.js delegates sha256 to lib/markos/cli/plan.cjs::hashToken so handler source never chains .update() / .insert() / .upsert() — tests grep-assert"
    - "Pluggable LLM rubric: eval-runner.cjs::scoreDraft accepts { llm } option that refines (but cannot fabricate) base rubric scores; default is pure offline"
    - "Dual-auth plan endpoint: Bearer precedence + legacy session fallback mirrored from 204-04 whoami shape"

key-files:
  created:
    - "bin/commands/init.cjs — spawn-based installer delegator with --yes / --no-onboarding / --preset / --profile passthrough"
    - "bin/commands/plan.cjs — brief-driven dry-run CLI with TTY table + --json mode + D-10 exit codes"
    - "bin/commands/eval.cjs — local rubric CLI with --draft / --threshold / JSON output / runDraft fallback"
    - "bin/lib/eval-runner.cjs — scoreDraft + 4 dimension helpers (voice/claims/structure/length) + pluggable LLM hook"
    - "api/tenant/runs/plan.js — POST dry-run endpoint; no DB write; dual-auth; body → validateBrief → envelope"
    - "lib/markos/cli/plan.cjs — PLAN_STEPS + COST_PER_TOKEN_USD + buildPlanEnvelope + hashToken + AGENT_ID"
    - "lib/markos/cli/plan.ts — TS twin (PlanEnvelope + PlanStep + buildPlanEnvelope signatures)"
    - "contracts/F-103-cli-runs-plan-v1.yaml — F-103 contract (PlanEnvelope + BriefInput schemas + 3 error envelopes)"
    - "test/cli/init.test.js — 7 tests (init-01..06 + init-meta)"
    - "test/cli/plan.test.js — 6 tests (p-01..05 + p-meta)"
    - "test/cli/runs-plan-endpoint.test.js — 6 tests (pep-01..06)"
    - "test/cli/eval.test.js — 10 tests (eval-01..09 + eval-meta)"
  modified:
    - "contracts/openapi.json — regenerated (68 flows / 105 paths)"
    - "contracts/openapi.yaml — regenerated (68 flows / 105 paths)"

key-decisions:
  - "init delegates via spawn (process.execPath + install.cjs + --yes) rather than in-process require — preserves installer's readline / process.exit lifecycle and keeps parent shell clean. Tests use _spawnImpl seam to spy without forking."
  - "Plan endpoint shape matches Phase 207 AgentRun v2 subset (estimated_cost_usd_micro BIGINT, priority P2, chain_id null, model null) so Plan 204-06's durable POST /api/tenant/runs can reuse the envelope builder verbatim. Reuse, don't reshape."
  - "sha256 hashing on the plan endpoint delegates to lib/markos/cli/plan.cjs::hashToken. This keeps `.update(` out of handler source so the no-DB-write grep invariant (tests pep-04) can be asserted literally. The test string grep matches Supabase writer patterns with a single regex."
  - "eval-runner's scoreDraft exposes pluggable `{ llm }` like 200-02 runDraft. Default path is fully local per CONTEXT D-03 ('no tenant round-trip; fully local; pluggable LLM'). LLM refinement can only adjust rubric scores (clamped to [0, 100]); it cannot fabricate points without the rubric earning them."
  - "F-103 ships as a mini-contract instead of bolted onto F-102 — F-102 is api-keys scope, F-103 reserves the `/api/tenant/runs/*` path family for Plan 204-06's POST /api/tenant/runs + /events SSE to extend."
  - "Eval exit code semantics: 0 when score >= threshold (default 60), 1 otherwise. This composes cleanly with CI gates (`markos eval brief.yaml --threshold=80 || fail-build`). Invalid brief / missing args → exit 1 (USER_ERROR per D-10)."

patterns-established:
  - "Pattern: subprocess-based CLI delegator — spawn the real tool rather than require it in-process, propagate exit code verbatim, use _spawnImpl seam for tests."
  - "Pattern: AgentRun v2 forward-compat envelope builder — library primitive (lib/markos/cli/plan.cjs) exposes buildPlanEnvelope so both dry-run (204-05) and durable run (204-06) emit identical shapes."
  - "Pattern: strict no-write endpoint — delegate crypto helpers to a library so the handler source contains zero Supabase writer regex hits; grep-asserted in tests."
  - "Pattern: 4-dimension rubric (voice/claims/structure/length) with pluggable LLM refinement — matches 200-02 precedent for tiered severity."

requirements-completed:
  - CLI-01
  - QA-01
  - QA-02
  - QA-04
  - QA-11

# Metrics
duration: ~60min
completed: 2026-04-23
---

# Phase 204 Plan 05: markos init + plan + eval — Wave 2 lead Summary

**Pre-execution CLI trio shipped: `markos init` delegates cleanly to `bin/install.cjs --yes`, `markos plan <brief>` returns a dry-run DAG + cost estimate from the new no-write `/api/tenant/runs/plan` endpoint, and `markos eval <brief>` scores drafts against a 4-dimension local rubric. 23 new tests green (7 init + 12 plan+endpoint + 10 eval). openapi: 67 → 68 flows / 104 → 105 paths. Plan envelope is forward-compatible with Phase 207 AgentRun v2.**

## Performance

- **Tasks:** 3 of 3 complete
- **Commits:** 3 atomic (one per task), hooks ON, no --no-verify
- **Tests:** 29 new passing (7 init + 6 plan CLI + 6 plan endpoint + 10 eval)
- **Regression check:** 119/119 prior CLI tests green (modulo login.test.js which is a pre-existing slow-test hazard documented in 204-02)

## Accomplishments

### Task 1 — markos init delegator (commit `d9c5c0a`)

- `bin/commands/init.cjs` replaces the 204-01 stub with a thin delegator. `main({ cli })` spawns `node bin/install.cjs --yes [--no-onboarding] [--preset=<b>] [--project|--global] [--profile=<p>] [--project-name=<n>] [--project-slug=<s>]` via `child_process.spawn(process.execPath, …, { stdio: 'inherit' })`, awaits the close event, and propagates the child's exit code verbatim. Spawn errors → exit 5 (INTERNAL_BUG) with a formatted envelope.
- Design choice: subprocess over require(). `bin/install.cjs` uses top-level readline + process.exit, so an in-process require would mutate parent shell state + leak readline handles. A fresh Node subprocess keeps the lifecycle clean, preserves the user's pinned runtime (`process.execPath`), and lets the child print its banners/prompts through the shared stdio.
- Test seam: `module.exports._spawnImpl = null` — tests override this to spy on subprocess invocations without actually forking the installer. Implementation mirrors the whoami `retries` escape hatch pattern.
- `--help` short-circuits to a one-line usage print + exit 0, matching D-10's 0=SUCCESS for non-error exits.
- 7 tests green (init-01..06 + init-meta) covering flag passthrough, help, exit-code propagation, and meta assertions (no stub message, requires install.cjs + --yes).

### Task 2 — /api/tenant/runs/plan + markos plan CLI + lib/markos/cli/plan.cjs (commit `bc184ff`)

- **New endpoint `api/tenant/runs/plan.js`** — POST-only, dual-auth (Bearer precedence + legacy session fallback, resolved via `resolveWhoami` + `resolveSessionWhoami` from Plan 04). Body shape `{ brief: object }` → `validateBrief` (REQUIRED_FIELDS channel/audience/pain/promise/brand) → `normalizeBrief` → `buildPlanEnvelope(tenant_id)`. Returns 200 with the envelope; 400 `{ error: 'invalid_brief', errors: [...] }` on brief failure; 401 on auth; 405 on non-POST. **ZERO database writes** — grep-asserted against `.insert/.update/.upsert` in tests.
- **New library `lib/markos/cli/plan.cjs`** — single source of truth for the plan envelope shape. Exports `PLAN_STEPS` (audit → draft → score), `COST_PER_TOKEN_USD` placeholder, `buildPlanEnvelope({ tenant_id, plan_id?, model?, priority? })`, `hashToken` (SHA-256 hex delegate so handlers don't import node:crypto directly), plus math helpers (`computeTokens`, `computeCostUsd`, `computeCostUsdMicro`, `computeDurationMs`). Phase 207 AgentRun v2 compatible: the envelope includes `estimated_cost_usd_micro` as a BIGINT-safe integer and defaults `priority='P2'`, `chain_id=null`, `model=null`.
- **TS twin `lib/markos/cli/plan.ts`** — type-only facade exporting `PlanEnvelope`, `PlanStep`, `PlanPriority`, `BuildPlanEnvelopeParams`, plus declared function signatures. Re-exports the runtime via `module.exports = runtime` for CJS interop (matches whoami.ts pattern).
- **`bin/commands/plan.cjs`** — parses brief (positional[0] or --brief), validates, resolves keychain token, POSTs normalized brief to `/api/tenant/runs/plan`, renders either a TTY breakdown (step table + tokens + cost + duration summary) or --json envelope. Refactored into `loadAndValidateBrief`, `postPlan`, `handleResponse` helpers to stay under the cognitive-complexity budget.
- **Contract `contracts/F-103-cli-runs-plan-v1.yaml`** — `flow_id: F-103`, single path `/api/tenant/runs/plan`, schemas for `BriefInput`, `PlanStep`, `PlanEnvelope`, plus `InvalidBriefError`, `UnauthorizedError`, `InvalidTokenError`, `RevokedTokenError`. Dual-auth block documented. STRIDE register: T-204-05-01 (info disclosure — accept; brief echo is intentional UX), T-204-05-02 (DoS — mitigated by Phase 201 rate-limit), T-204-05-03 (EoP — accept; tenant_id derives from caller's own key).
- **openapi regen** — `node scripts/openapi/build-openapi.cjs` → 68 flows / 105 paths. Matches the plan's expected delta (`+1 path`).
- 12 tests green (p-01..05 + p-meta + pep-01..06) covering usage/invalid/happy/401/non-TTY JSON paths plus the 4 write-invariant assertions (no-write grep against plan.js, no mutation in the api_keys stub rows, read-only operation semantics, AgentRun v2 shape compatibility).

### Task 3 — markos eval + bin/lib/eval-runner.cjs (commit `4ddb95e`)

- **New library `bin/lib/eval-runner.cjs`** — pure function `scoreDraft(draft, brief, options?)` with 4-dimension rubric: `voice` (brand mention), `claims` (promise substring), `structure` (>= 2 sentences), `length` (20-300 words). Each dimension awards 0 or 25 points for a 0-100 total. Issues array captures one human-readable line per failed dimension. Pluggable LLM: `options.llm({ draft, brief, rubric, issues })` can return `{ score?, dimensions?, issues? }` which is merged into the result; scores are clamped to `[0, MAX_SCORE]` so the LLM cannot fabricate points beyond the rubric ceiling. Helpers (`countWords`, `countSentences`, `scoreVoice`, `scoreClaims`, `scoreStructure`, `scoreLength`) are exported for downstream tests.
- **`bin/commands/eval.cjs`** — parses brief, resolves draft source (--draft=<path> or regenerate via `runDraft` from `generate-runner.cjs`), calls `scoreDraft`, renders TTY header + dimension table + issues list (or --json object), exits 0 if score >= threshold (default 60, --threshold override) or 1 otherwise. Strictly offline per CONTEXT D-03: handler source contains zero `/api/tenant` references (test-asserted).
- 10 tests green (eval-01..09 + eval-meta) covering rubric behaviour at each boundary (happy, missing brand, missing promise substring, one sentence, too short), CLI threshold semantics, regenerate-via-runDraft path, JSON output surface, and meta assertions.

## Task Commits

Each task was committed atomically (hooks ON, sequential execution):

1. **Task 1** — `d9c5c0a` `feat(204-05): markos init delegator + 7 tests`
2. **Task 2** — `bc184ff` `feat(204-05): markos plan dry-run CLI + /api/tenant/runs/plan endpoint + F-103 + 12 tests`
3. **Task 3** — `4ddb95e` `feat(204-05): markos eval local rubric + eval-runner scoreDraft + 10 tests`

## Files Created / Modified

### Created (11)

CLI commands (3):
- `bin/commands/init.cjs` (was stub)
- `bin/commands/plan.cjs` (was stub)
- `bin/commands/eval.cjs` (was stub)

Libraries (3):
- `bin/lib/eval-runner.cjs`
- `lib/markos/cli/plan.cjs`
- `lib/markos/cli/plan.ts`

Server endpoint (1):
- `api/tenant/runs/plan.js`

Contract (1):
- `contracts/F-103-cli-runs-plan-v1.yaml`

Tests (4):
- `test/cli/init.test.js`
- `test/cli/plan.test.js`
- `test/cli/runs-plan-endpoint.test.js`
- `test/cli/eval.test.js`

### Modified (2)

- `contracts/openapi.json` — 67 → 68 flows / 104 → 105 paths
- `contracts/openapi.yaml` — same

## Exported APIs (Stable — Wave 2+ consumers)

### lib/markos/cli/plan.cjs

```
PLAN_STEPS                        // frozen [{name,inputs,estimated_tokens}×3]
COST_PER_TOKEN_USD = 0.000003     // Claude-tier placeholder
DEFAULT_PRIORITY = 'P2'
AGENT_ID = 'markos.plan.v1'

generatePlanId()               -> 'plan_' + 16 hex chars
hashToken(text)                -> sha256 hex digest
computeTokens(steps)           -> int
computeCostUsd(tokens)         -> number (6 dp)
computeCostUsdMicro(tokens)    -> int (BIGINT-safe)
computeDurationMs(steps,toks)  -> int
buildPlanEnvelope({ tenant_id, plan_id?, model?, priority? })
  -> { run_id:null, plan_id, steps, estimated_tokens, estimated_cost_usd,
       estimated_cost_usd_micro, estimated_duration_ms, tenant_id,
       priority, chain_id:null, model, agent_id }
```

### bin/lib/eval-runner.cjs

```
scoreDraft(draft, brief, { llm? } = {})
  -> { score:0-100, dimensions:{voice,claims,structure,length},
       issues:string[], word_count, sentence_count }

MAX_SCORE = 100
DIMENSION_POINTS = 25
LENGTH_MIN_WORDS = 20
LENGTH_MAX_WORDS = 300
STRUCTURE_MIN_SENTENCES = 2
PROMISE_SUBSTRING_LEN = 40
countWords, countSentences, scoreVoice, scoreClaims,
scoreStructure, scoreLength  // per-dimension helpers
```

### HTTP surface (api/tenant/runs/plan.js)

```
POST /api/tenant/runs/plan
  Auth: Bearer mks_ak_<64 hex>   OR   x-markos-user-id + x-markos-tenant-id
  Body: { brief: object }
  200 -> PlanEnvelope (Phase 207 AgentRun v2 compatible)
  400 -> { error:'invalid_brief', errors:[...] }
  401 -> { error:'unauthorized' | 'invalid_token' | 'revoked_token' }
  405 -> { error:'method_not_allowed' }
  500 -> { error:'plan_failed' }
  STRICT NO-WRITE INVARIANT — tests grep-assert .insert/.update/.upsert == 0
```

### CLI surfaces

```
markos init [--no-onboarding] [--preset=<bucket>] [--project|--global]
  Exit: 0=success; any non-zero → propagated from bin/install.cjs

markos plan <brief.yaml> [--json] [--profile=<name>]
  Exit: 0=success; 1=invalid brief; 2=transient (5xx/net); 3=auth failure

markos eval <brief> [--draft=<path>] [--threshold=<int>] [--json]
  Exit: 0 when score >= threshold (default 60); 1 otherwise
  Fully offline (D-03) — no /api/tenant round-trip in handler source
```

## Decisions Made

- **init delegates via spawn, not require.** `bin/install.cjs` uses top-level readline + process.exit. Requiring in-process would mutate parent shell state + leak readline handles. Spawn keeps lifecycle clean and propagates the child's exit code verbatim, matching D-10.
- **Plan envelope is Phase 207 AgentRun v2 forward-compat.** Library helper `buildPlanEnvelope` emits `estimated_cost_usd_micro` (BIGINT-safe integer, matches 207 line 274), `priority='P2'`, `chain_id=null`, `model=null`. Plan 204-06's durable POST /api/tenant/runs can reuse the same builder and just flip `run_id` from null → the real inserted row id.
- **hashToken delegate instead of inline crypto.** The no-DB-write grep invariant (tests pep-04) pattern-matches against `.update(` / `.insert(` / `.upsert(`. `node:crypto.createHash('sha256').update(…)` is a false positive for that regex. Moving the hash into the library keeps the handler source literally clean so the test can grep-assert hermetically.
- **F-103 as a new mini-contract.** Adding the plan path to F-102 (api-keys) would mix scopes. F-103 reserves the `/api/tenant/runs/*` path family so Plan 204-06 can extend it with POST /api/tenant/runs (durable) + /events SSE without a contract restructure.
- **eval is fully offline.** CONTEXT D-03 explicitly states "no tenant round-trip; fully local; pluggable LLM." eval.cjs contains zero `/api/tenant` references (test-asserted in eval-meta). The `--remote` flag path was deferred — eval-runner's `{ llm }` option is the extensibility seam, not a network-coupled flag.
- **eval exit code = 0 iff score >= threshold.** Clean CI composition: `markos eval brief.yaml --threshold=80 || exit 1`. Default threshold 60 is permissive; tighter gates are opt-in.
- **Plan endpoint echoes the normalized brief.** The response includes `brief` for client-side confirmation UX. Safe because brief content is user-supplied (no tenant secret material by convention).

## Deviations from Plan

**1. [Task 2] Extracted hashToken into lib/markos/cli/plan.cjs.** The plan's acceptance criterion `grep -c "\\.insert\\|\\.update\\|\\.upsert" api/tenant/runs/plan.js == 0` was impossible to satisfy while inlining `crypto.createHash('sha256').update(String(text))` in the handler. Moving the hash primitive into the plan library keeps the handler source literally match-free without changing endpoint behaviour. Library becomes the canonical hash-helper entry for future handlers.

- **Found during:** Task 2 test run — pep-04 failed because the handler's `crypto.createHash('sha256').update(...)` tripped the `.update\(` regex assertion.
- **Issue:** False positive between crypto write-API and Supabase writer-API.
- **Fix:** Library `hashToken` helper in `lib/markos/cli/plan.cjs`; handler imports it via `{ hashToken }`.
- **Impact on plan:** None — handler behaviour is identical; test invariant remains strict; F-103 library surface grew by one exported symbol.

**2. [Task 2] F-103 instead of extending F-102.** Plan's `<action>` block noted "create a new mini-contract file per plan's guidance" — this was the chosen path. F-102 stays scoped to api-keys; F-103 owns `/api/tenant/runs/*`.

**Total deviations:** 2 (pure factoring; no behavioural or API changes)
**Impact on plan:** None — all acceptance criteria satisfied.

## Issues Encountered

1. **Test harness promise-vs-exit race in init.cjs.** First draft wrapped the spawn close handler in `await new Promise((resolve) => { child.on('close', … process.exit … resolve()) })`. Because the test harness's `process.exit` throws `ExitSignal`, the throw escaped the close handler before `resolve()` ran — the awaited promise never settled, hanging the test. Fixed by resolving the promise with `{ kind, code }` first, then calling `process.exit` outside the await boundary.
2. **pep-04 grep false positive on crypto.update.** See deviation 1 above. Resolved by moving hashing to the library.
3. **login.test.js pre-existing slow timeout.** Known from Plan 204-02 — the 5xx retry test takes ~15s via exponential backoff. Running login alone passes 9/9 in ~72s. Not regressed by 204-05; the other 11 CLI test files pass in < 0.3s combined.

## Next Phase Readiness

- **Plan 204-06 (run / SSE)** — can import `lib/markos/cli/plan.cjs::buildPlanEnvelope` directly. The durable POST /api/tenant/runs endpoint just persists what this function returns, flips `run_id` from null → the real inserted id, and decrements billing. Envelope shape does not change.
- **Plan 204-07 (env pull/push/diff/merge)** — inherits the dual-auth pattern from api/tenant/runs/plan.js (Bearer + legacy session fallback via resolveWhoami / resolveSessionWhoami).
- **Phase 207 (AgentRun v2)** — Plan 01 CONTRACT-LOCK fields (`priority`, `chain_id`, `estimated_cost_usd_micro`) are already present in the 204-05 envelope. When 207-02 ships the DAG substrate, the builder can add `tokens_input` / `tokens_output` without touching the response contract.

## Verification

```
$ node --test test/cli/init.test.js
ℹ tests 7   ℹ pass 7   ℹ fail 0

$ node --test test/cli/plan.test.js test/cli/runs-plan-endpoint.test.js
ℹ tests 12  ℹ pass 12  ℹ fail 0

$ node --test test/cli/eval.test.js
ℹ tests 10  ℹ pass 10  ℹ fail 0

$ node --test $(ls test/cli/*.test.js | grep -v login.test.js)
ℹ tests 119 ℹ pass 119 ℹ fail 0
# Plans 204-01..04 regression clean; 204-05 green

$ node --test test/cli/login.test.js
ℹ tests 9   ℹ pass 9   ℹ fail 0
# Pre-existing slow (~72s) from 204-02; passes in isolation
```

- openapi: 68 flows / 105 paths confirmed via `node scripts/openapi/build-openapi.cjs`.
- `grep -c '\.insert\|\.update\|\.upsert' api/tenant/runs/plan.js` = 0 (no-write invariant).
- `grep -c '/api/tenant' bin/commands/eval.cjs` = 0 (D-03 offline invariant).

---
*Phase: 204-cli-markos-v1-ga*
*Plan: 05*
*Completed: 2026-04-23*
*Wave 2 lead — pre-execution trio (init/plan/eval) unblocks 204-06 durable runs + 204-07 env*
