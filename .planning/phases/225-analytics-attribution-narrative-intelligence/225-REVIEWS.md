---
phase: 225
phase_name: analytics-attribution-narrative-intelligence
reviewers: [codex]
reviewers_attempted: [codex, claude, gemini, opencode]
reviewers_skipped:
  - claude: current runtime — skipped per independence rule
  - gemini: not installed
  - opencode: not installed
reviewed_at: 2026-04-25
plans_reviewed:
  - 225-01-PLAN.md
  - 225-02-PLAN.md
  - 225-03-PLAN.md
  - 225-04-PLAN.md
  - 225-05-PLAN.md
  - 225-06-PLAN.md
  - 225-07-PLAN.md
codex_model: gpt-5.3-codex
codex_tokens_used: 364868
overall_risk: HIGH
high_concerns: 9
medium_concerns: 5
low_concerns: 1
---

# Cross-AI Plan Review — Phase 225

> **Single-reviewer caveat:** Only Codex (`gpt-5.3-codex`) was available. Claude is current runtime (skipped per independence rule). Gemini/OpenCode not installed. No triangulation.

> **Verified codebase findings (2026-04-25):**
> - `contracts/openapi.json` EXISTS; `public/openapi.json` DOES NOT exist (Codex M1 verified)
> - `lib/markos/mcp/tools/index.cjs` EXISTS (`.ts` does not — Codex H7 verified)
> - `lib/markos/{cdp,crm360,channels,conversion,launches,operating}` directories DO NOT exist (Codex H3 verified)
> - `package.json` scripts: only `test`, `chromatic`, `openapi:build` (no `vitest`, no `playwright` — Codex H4 verified, same as Phase 226)
> - Repo helpers: `buildApprovalPackage` at `lib/markos/crm/agent-actions.ts:68`; `requireHostedSupabaseAuth` at `onboarding/backend/runtime-context.cjs:491` (Codex H6 verified)

---

## Codex Review

# Codex Review — Phase 225

## Summary
Phase 225 is directionally strong on product intent, but the implementation plans are not grounded in the current codebase. The main problem is not analytics design quality; it is execution credibility. Multiple plans assume an App Router API shape the repo does not use, cite module trees and helpers that do not exist, rely on test tooling that is not installed, and soften hard phase dependencies into stubs/manual fallbacks. In its current form, I would not treat this as implementation-ready.

## Strengths
- The phase goal is coherent: metric semantics, attribution, freshness/explainability, narratives, and writeback belong together.
- The plans consistently emphasize evidence linkage, freshness, explainability, and auditability rather than pure dashboarding.
- The writeback concept is strategically good: analytics should feed launches, pricing, and learning instead of terminating at reporting.
- The review materials at least try to define source precedence, decision routing, and testing obligations explicitly.

## Concerns
- `HIGH` — `225-07-PLAN.md:10-40,259` plans `api/v1/analytics/*/route.ts` and explicitly says "Next.js App Router conventions," but this repo is still using legacy `api/*.js` handlers. There is no `api/v1` tree in the current repo. This is the same category of architecture hallucination that broke confidence in Phase 226.
- `HIGH` — `225-07-PLAN.md:49-63` plans an `app/(markos)/analytics/...` surface, but that tree does not exist today. Treating it as an established target is not a small omission; it means the UI surface plan is anchored to a fictional app layout.
- `HIGH` — `225-CONTEXT.md:205-209,223-227`, `225-03-PLAN.md:89,95,123`, and `225-07-PLAN.md:179-203,586-606` reference upstream trees that do not exist in the current codebase: `lib/markos/cdp/*`, `lib/markos/crm360/*`, `lib/markos/channels/*`, `lib/markos/conversion/*`, `lib/markos/launches/*`, `lib/markos/operating/*`. The actual `lib/markos` tree currently contains things like `audit`, `auth`, `billing`, `crm`, `mcp`, `plugins`, `telemetry`, `tenant`, and not those domains.
- `HIGH` — `225-RESEARCH.md:1166-1169,1221-1224`, `225-VALIDATION.md:12-17`, and large parts of `225-07-PLAN.md` assume `vitest` and `playwright`. Current repo scripts are only `test`, `chromatic`, and `openapi:build` in `package.json`. There is no `vitest.config.ts`, no `playwright.config.ts`, and no matching scripts.
- `HIGH` — `225-RESEARCH.md:223-244,958-960,1333,1435` and `225-05-PLAN.md:194,222,293-294,678` assume `json-logic-js`, `xxhash-wasm`, and `@ai-sdk/gateway` are already available. They are not present in `package.json`. This is a concrete dependency mismatch, not a stylistic issue.
- `HIGH` — `225-07-PLAN.md:261` uses `requireTenantContext(req)` and `225-04-PLAN.md:692` / `225-05-PLAN.md:874` use `serviceRoleClient()`. I could not find those helpers in the current repo. This mirrors earlier fictional-helper failures. By contrast, the repo does have real helpers such as `buildApprovalPackage` at `lib/markos/crm/agent-actions.ts:68` and `requireHostedSupabaseAuth` at `onboarding/backend/runtime-context.cjs:491`.
- `HIGH` — `225-07-PLAN.md` targets `lib/markos/mcp/tools/index.ts`, but the real file is `lib/markos/mcp/tools/index.cjs`. This is another concrete codebase mismatch.
- `HIGH` — `225-RESEARCH.md:1304,1337,1344`, `225-02-PLAN.md:52,105,169,201,215,298`, `225-04-PLAN.md:59-60,435,555,570`, `225-05-PLAN.md:71,483,507`, and `225-06-PLAN.md:901-905` repeatedly convert hard dependencies into stubs, draft-only bridges, or inactive rules if upstream phases are absent. The phase brief says 225 depends on 209, 211, 212, and 221-224. This plan posture effectively says "ship anyway and degrade." That is the same escape hatch pattern that caused real concern in earlier phase reviews.
- `HIGH` — Freshness and explainability are supposed to be fail-closed for decision-grade measurement, but the plans still permit narrative generation/manual draft fallback when the evidence layer from P209 is absent (`225-RESEARCH.md:1304,1337,1344`; `225-05-PLAN.md:71,483,507`). That weakens the entire semantic-layer claim. If evidence freshness is missing, the safe behavior is block or quarantine, not "draft with warnings."
- `MEDIUM` — `225-07-PLAN.md:70,158,183,245,342,444,487,496,926` repeatedly targets `public/openapi.json`, but the repo's generated OpenAPI artifact is `contracts/openapi.json`. This will break plan traceability and build wiring.
- `MEDIUM` — `DISCUSS.md` slice labeling does not match the actual 01-07 plan set cleanly. The user's stated slice map and the files on disk diverge materially, especially around 03-06. That weakens requirement traceability and makes review harder than it should be.
- `MEDIUM` — `225-01-PLAN` talks about source precedence, but the plan set does not convincingly establish where precedence is enforced when sources disagree. I do not see a crisp fail-closed DB/view-layer contract that says one metric instance has one canonical derivation path and conflicting source rows cannot silently co-exist. Too much of the precedence logic reads app-level.
- `MEDIUM` — `225-02-PLAN` needs tighter boundaries with the attribution ledger. If touches are written here while sibling work is also extending attribution touch tables/FKs, you risk duplicate ledgers or dual-write semantics. I do not see a hard "single writer, single ledger" rule.
- `MEDIUM` — `225-04-PLAN` talks about routing narratives to "decisions," but decision semantics are still fuzzy. What is an auto-decision vs. an approval-required recommendation? Where is the audit trail written? What blocks autonomous execution when evidence is stale or confidence is low?
- `MEDIUM` — `225-05-PLAN` writeback behavior is underspecified under missing dependencies. The current posture appears closer to silent skip / bridge record / inactive routing than hard failure. For launches, pricing, and learning, that creates hidden non-delivery rather than explicit non-availability.
- `LOW` — Registry references should be validated against real APIs before finalizing any plugin-related analytics routing. The repo exposes `resolvePlugin` at `lib/markos/plugins/registry.js:102`, and prior review already found how easy it is for plans to invent neighboring names.

## Suggestions
- Rewrite Phase 225 against the actual repo architecture first. If the system still uses legacy `api/*.js`, plan that way, or explicitly declare a prerequisite migration phase before analytics work begins.
- Split "greenfield targets" from "existing integration points." It is fine to propose a new `lib/markos/analytics/*` tree; it is not fine to treat nonexistent `cdp`, `crm360`, `launches`, `operating`, and `channels` trees as if they are already shippable dependencies.
- Replace every fictional helper/module reference with verified symbols or mark them as new files to be created. Use this standard everywhere: "existing file/function" vs "new file/function."
- Rework validation to the actual repo toolchain. If tests must remain on `node --test`, then specify that. If Vitest/Playwright are truly required, make adding them an explicit prerequisite change, not an implicit assumption.
- Tighten the dependency contract. If 209/211/212/221-224 are real prerequisites, then Phase 225 should hard-fail or remain blocked when they are absent. Do not mask missing foundations with draft stubs.
- Define metric precedence at the data contract level, not just service logic. I would expect canonical views/materializations or equivalent DB-enforced derivation rules, plus explicit conflict states when sources disagree.
- Define attribution ownership explicitly. One ledger, one writer path, one reconciliation rule.
- For narrative intelligence, add a strict publish gate: no externalized narrative unless evidence links are present, freshness is within SLA, and each claim has explainability metadata.
- For writeback, require explicit delivery outcomes: `written`, `blocked_missing_dependency`, `blocked_policy`, `rejected`, not silent skip.
- Reconcile `DISCUSS.md`, roadmap language, and 01-07 file scopes so requirement traceability is reviewable.

## Risk Assessment
Overall: `HIGH`

The risk is high because the current plan is not only ambitious; it is materially detached from the repo it claims to implement against. The main failure mode is not a bad semantic model. It is building a plan on fictional routes, fictional helpers, nonexistent module trees, and unsupported test/tooling assumptions, then papering over missing dependencies with soft-degradation paths. That combination usually produces partial implementations that look complete in planning but cannot land cleanly.

## Specific Questions for Plan Author
1. Which exact existing API surface is Phase 225 targeting: legacy `api/*.js` or a planned App Router migration? If the latter, where is that migration phase defined?
2. Which of these trees are real dependencies today versus proposed new trees: `analytics`, `cdp`, `crm360`, `channels`, `conversion`, `launches`, `operating`?
3. Where is source precedence enforced when two systems disagree on the same metric: DB/view/materialization layer, or only application code?
4. What is the single canonical attribution ledger, and which component is the only writer?
5. If evidence freshness is missing or stale, what exact operation is blocked: narrative draft creation, narrative publication, decision routing, alert emission, or all of them?
6. When launches/pricing/learning phases are absent, should analytics writeback fail loudly or queue for retry? The current plans read like soft skip.
7. Are `vitest` and `playwright` being introduced in this phase? If yes, where is that repo/tooling change specified and approved?
8. Why does the plan target `public/openapi.json` when the repo currently builds `contracts/openapi.json`?
9. What are the real auth/context helpers for analytics endpoints in this repo? I do not see `requireTenantContext` or `serviceRoleClient`.
10. Can you produce a corrected file map that distinguishes new files to create, existing files to modify, and upstream files that do not exist yet and therefore cannot be treated as dependencies?

---

## Consensus Summary

> Single reviewer (Codex). Same architecture-hallucination pattern as Phases 226/227.

### Verified concrete codebase findings (not theoretical)

1. **App Router hallucination (RH1, RH2)** — Plan 07 plans `api/v1/analytics/*/route.ts` + `app/(markos)/analytics/...`. Repo uses legacy `api/*.js`. No `api/v1/` tree. No `app/(markos)/` tree.

2. **Missing module trees (RH3)** ✓ verified — `lib/markos/{cdp,crm360,channels,conversion,launches,operating}/` do NOT exist. Actual trees: audit, auth, billing, crm, mcp, plugins, telemetry, tenant.

3. **Test stack non-executable (RH4)** ✓ verified — package.json scripts: only `test`, `chromatic`, `openapi:build`. No vitest, no playwright. Same as Phase 226.

4. **Missing npm deps (RH5)** — `json-logic-js`, `xxhash-wasm`, `@ai-sdk/gateway` not in package.json.

5. **Fictional helpers (RH6)** — `requireTenantContext(req)` + `serviceRoleClient()` cited but don't exist. Real helpers: `requireHostedSupabaseAuth` at `onboarding/backend/runtime-context.cjs:491`, `buildApprovalPackage` at `lib/markos/crm/agent-actions.ts:68`.

6. **MCP file extension (RH7)** ✓ verified — Plan 07 targets `lib/markos/mcp/tools/index.ts`. Actual file: `lib/markos/mcp/tools/index.cjs`.

7. **OpenAPI path wrong (RM1)** ✓ verified — Plan targets `public/openapi.json`. Actual: `contracts/openapi.json` (verified by `test -f`).

### Governance gaps

8. **Soft-skip dependency posture (RH8)** — Plans 02/04/05/06/RESEARCH convert hard dependencies on P209/P211/P212/P221-P224 into stubs/draft-only bridges/inactive rules. Same escape hatch as 226/227 — "ship anyway and degrade".

9. **Evidence not fail-closed (RH9)** — When P209 evidence layer absent, plans permit narrative generation with warnings. Should block/quarantine.

10. **Source precedence enforced at app layer only (RM3)** — Plan 01: no DB/view-layer canonical derivation. Two-source disagreement can silently coexist.

11. **Attribution single-writer not enforced (RM4)** — Plan 02 doesn't establish hard "single writer, single ledger" rule. Risk of duplicate ledger / dual-write conflicting with P227's attribution_touches FK extension.

12. **Decision semantics fuzzy (RM5)** — Plan 04 routes narratives to "decisions" but auto-decision vs approval-required boundary unclear. Audit trail location unspecified.

13. **Writeback delivery outcomes underspecified (RM6)** — Plan 05 reads like soft skip. Should be explicit: `written`, `blocked_missing_dependency`, `blocked_policy`, `rejected`.

### Documentation drift

14. **DISCUSS.md vs 01-07 plans don't align (RM2)** — slices 03-06 diverge materially.

15. **Plugin registry references (RL1)** — verify against `resolvePlugin` (exists at registry.js:102), not invented neighbor names. Same lookupPlugin issue Phase 227 had.

### Suggested next move

15 concerns, mostly architecture-anchoring (same pattern as 226/227). Sharper than 227 (10 HIGH+5 MED in 226 → 9 HIGH+5 MED+1 LOW in 225 → 5 HIGH in 227). All addressable via:

1. Replace fictional helpers/trees with verified symbols (or mark as greenfield)
2. Add Wave 0.5 architecture-lock to Plan 01 (api/*.js + requireHostedSupabaseAuth + npm test + contracts/openapi.json + index.cjs)
3. Add explicit npm deps task for json-logic-js + xxhash-wasm + @ai-sdk/gateway
4. Add hard go/no-go preflight gate for P209/P211/P212/P221-P224
5. Convert soft-degradation paths to fail-closed
6. Define source precedence + attribution writer + decision semantics + writeback outcomes at data contract level

**Recommended:** `/gsd-plan-phase 225 --reviews` to incorporate Codex feedback before execution.

### Reviewer environment

- Codex CLI v0.121.0
- Model: gpt-5.3-codex
- Sandbox: read-only
- Tokens used: 364,868
- 15 concerns across 7 plans + CONTEXT + RESEARCH + VALIDATION
