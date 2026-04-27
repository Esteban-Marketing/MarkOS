---
phase: 217
phase_name: saas-suite-revenue-agents-api-ui
reviewers: [claude-runtime-override]
reviewers_attempted: [codex, claude, gemini, opencode]
reviewers_skipped:
  - codex: usage limit reached (resets 2026-05-02 09:44 AM)
  - gemini: not installed
  - opencode: not installed
reviewer_note: |
  Claude (current runtime) per user override. Independence rule waived (consistent with P218-P224 posture).
reviewed_at: 2026-04-26
plans_reviewed:
  - 217-01-PLAN.md
  - 217-02-PLAN.md
  - 217-03-PLAN.md
  - 217-04-PLAN.md
  - 217-05-PLAN.md
  - 217-06-PLAN.md
overall_risk: BLOCKED
high_concerns: 1
medium_concerns: 9
low_concerns: 1
---

# Cross-AI Plan Review — Phase 217

> **Single-reviewer caveat (override):** Codex usage limit. Claude runtime review.

> **CRITICAL FINDING:** Plans are STUBS (25 lines each), CONTEXT 49 lines, RESEARCH 67 lines, DISCUSS 47 lines. Slightly more substance than P218/P219/P220 stubs but still scope-definition only — no frontmatter, tasks, code refs, F-IDs, migrations, tests, or contracts. Same shape as P218-P220. Recommend `/gsd-plan-phase 217 --research` (mirror P218/P219/P220 path).

---

## Claude Review

# Claude Review — Phase 217

## Summary

Phase 217 (SaaS Revenue Intelligence + SAS Agents + API/MCP/UI Readiness) is **same stub pattern as P218 + P219 + P220** — 6 PLAN.md files at 25 lines each. CONTEXT slightly richer (49 lines, with 5 explicit non-negotiables + 8-step required phase shape), RESEARCH more substantive (67 lines including codebase addendum from 2026-04-23 with documented gaps + recommendation). DISCUSS 47 lines.

Plans themselves still scope-only: NO frontmatter (wave/depends_on/files_modified/autonomous), NO tasks (read_first/action/acceptance_criteria), NO code references, NO F-IDs, NO migration slots, NO test files, NO API/MCP/UI contracts.

Apply identical recovery path as P218/P219/P220: `/gsd-plan-phase 217 --research` to generate full plans.

**P217 specifics distinct from P218+P219+P220:**
- 6 domains: revenue metrics + source precedence, SaaSMRRSnapshot + waterfall, SAS-01..06 agent readiness, `/v1/saas/*` API contracts, `markos-saas` MCP tools, SaaS UI navigation + post-217 growth translation gate
- **API/MCP/UI focus** (vs P218-P220 which are domain-data + governance) — Plan 04 (API), Plan 05 (MCP), Plan 06 (UI) need the most architectural specifics
- **Most upstream phase under review** — depends on P202, P205, P207-P216 (per ROADMAP); foundation for P218-P220 governance phases
- SAS-09, SAS-10 own; SG-10 referenced in Plan 03 (SAS agent registry includes growth-agent-readiness scaffolding) — **must verify SG-10 ownership boundary** (SG-10 is foundational across P218/P219/P220 P06 plans)
- Plan 06 lists SG-01..12 — these are P218/P219/P220 territory; should be `integrates_with` NOT requirements (mirror P218 LRN-01..05 pattern)
- LOOP-01..08 referenced in Plan 01 — verify ownership (LOOP-06 = P219; LOOP-08 = P220 events)

## Strengths

- **CONTEXT.md non-negotiables explicit** (5 items): unscoped API/MCP guard, agent readiness contract, SaaS-only navigation, revenue metric provenance, target agent non-runnable until future phase
- **DISCUSS.md 8-step required phase shape** + non-goals (no growth module activation in P217) align with downstream P218 boundary
- **RESEARCH.md codebase addendum (2026-04-23)** documents existing substrate (MCP tenant-bound sessions, OpenAPI build, app shell) + gaps + recommendation — better than P218/P219/P220 stub research
- **Plan 06 explicit "post-217 translation gate"** for PLG/EXP/ABM/VRL/IAM/CMT/EVT/XP/PR/PRT/DEV/REV — bounds scope correctly; no growth-module activation in P217
- **Compliance keywords correct** (approval-gated, evidence-linked, tenant-bound MCP, RLS, audit, cost visibility)
- **Plan 03 SAS agent readiness explicit "no SAS agent runs without contracts/cost/approval/evidence/UI/API/MCP posture"** — strong P226 W1 mitigation pattern
- **Source precedence model required (Plan 01)** — billing/processor/accounting/CRM/manual disagreement resolution is foundational

## Concerns

### HIGH (1)

- `HIGH` — **Plans are STUBS, not executable** (same as P218 H1 / P219 H1 / P220 H1). 25 lines each. NO frontmatter (wave/depends_on/files_modified/autonomous). NO tasks (read_first/action/acceptance_criteria). NO code references. NO F-ID allocation. NO migration slots. NO test file paths. NO API endpoint enumeration. NO MCP tool list. NO UI route map. **Cannot pass `gsd-plan-checker` validation; cannot execute via `/gsd-execute-phase`.**
  - **Fix:** Run `/gsd-plan-phase 217 --research` to generate full plans (mirror P218/P219/P220 path). Then re-review.

### MEDIUM (9)

- `MEDIUM` — **No upstream-gate preflight for P202, P205, P207-P216**. ROADMAP says "Depends on: Phases 202, 205, 207-216". None landed. Same A-N rejected pattern P226 RH8 / P227 / P225 RH8 / P218 RM2 / P219 RM2 / P220 RM2. Particularly critical for P217 because it depends on TWELVE upstream phases (P202 + P205 + P207-216 = 12 prereqs).
  - **Fix:** Plan 01 Task 0.5 ships `scripts/preconditions/217-check-upstream.cjs` with REQUIRED_UPSTREAM = [P202, P205, P207, P208, P209, P210, P211, P212, P213, P214, P215, P216] HARD; OR document SOFT/HARD split per phase.

- `MEDIUM` — **No architecture-lock**. Plans don't pin: legacy `api/*.js` vs App Router; `requireHostedSupabaseAuth`; `npm test` runner; `contracts/openapi.json`; `mcp/tools/index.cjs`; `buildApprovalPackage`; `resolvePlugin`. Same as P218/P219/P220 RM3.
  - **Fix:** Plan 01 Task 0.5 architecture-lock + forbidden-pattern detector per P226 D-78 / P218 / P219 / P220 model.

- `MEDIUM` — **Compliance enforcement boundary undefined per domain**. CONTEXT.md non-negotiables: "No revenue metric without definition/source/timestamp/reconciliation state" (Plan 01-02), "No SAS agent without stable token/role/inputs/outputs/cost/approval posture/failure behavior" (Plan 03), "No SaaS API or MCP tool outside tenant auth/RLS/audit" (Plans 04-05), "No SaaS navigation for inactive or non-SaaS tenants" (Plan 06). All cited but no DB-trigger pinned. P226 RH5/RH6 + P218 RM4 + P219 RM4 / P220 RM4 lessons all showed app-only enforcement bypassable.
  - **Fix:** Plans must specify DB-trigger enforcement points (recommended exception names):
    - Plan 01: `REVENUE_METRIC_REQUIRES_PROVENANCE` (formula + source + timestamp + reconciliation_state non-null)
    - Plan 02: `MRR_SNAPSHOT_REQUIRES_RECONCILIATION_STATE` (snapshot insert without reconciliation = block)
    - Plan 03: `SAS_AGENT_ACTIVATION_REQUIRES_READINESS` (mirror P218/P219/P220 P06 — but P217-specific P217-OWNED registry)
    - Plan 04: `SAAS_API_REQUIRES_TENANT_AUTH_RLS_AUDIT` (API contract row insert/update enforces auth+RLS+audit checks)
    - Plan 05: `MCP_TOOL_REQUIRES_TENANT_SESSION_BOUND` (MCP tool registration without tenant session-bound = block)
    - Plan 06: `SAAS_NAV_REQUIRES_ACTIVATION` (UI nav row visible only when saas_suite_activations active for tenant)

- `MEDIUM` — **Plan 06 SG-01..12 ownership ambiguous**. Stub Plan 06 lists SG-01..12 in requirements field. SG-01..12 spans P218 (SG-01,02,05,07,09,10,11,12), P219 (SG-03,08,09,10,11,12), P220 (SG-04,06,07,09,10,11,12). P217 Plan 06 documents post-217 translation gate but does NOT activate growth modules. Stub conflates downstream-translation with ownership.
  - **Fix:** Plan 06 frontmatter `requirements:` should be `SAS-10, TASK-02..05, QA-01..15` (own SaaS UI nav); add `integrates_with: [SG-01..12 from P218-P220]` or `translation_gate_for: [P218, P219, P220]` field.

- `MEDIUM` — **Plan 03 SG-10 ownership ambiguous (similar shape)**. Stub Plan 03 lists SG-10 in requirements. SG-10 = "growth agent registry seeded runnable=false" — this is P218 P06 + P219 P06 + P220 P06 territory. P217 Plan 03 owns SAS-10 (SAS agent registry) NOT SG-10 (growth agent registry).
  - **Fix:** Plan 03 frontmatter `requirements:` should be `SAS-09, SAS-10, RUN-01..08, TASK-01..05, QA-01..15`. Remove SG-10 — P218/P219/P220 P06 plans own that.

- `MEDIUM` — **LOOP-01..08 ownership in Plan 01 unclear**. Stub Plan 01 lists "LOOP-06" in requirements. LOOP-06 = "SLA breach feedback loop" — that's P219 territory (revenue team / SLA). LOOP-08 (events feedback) = P220. P217 Plan 01 owns revenue metric DEFINITIONS not LOOP cycles.
  - **Fix:** Plan 01 frontmatter `requirements:` should be `SAS-09, QA-01..15`. Verify each LOOP-0X mapping against REQUIREMENTS.md table — likely all LOOPs map to downstream P218-P220 phases.

- `MEDIUM` — **No F-ID + migration slot allocation**. Same as P218 RM7 / P219 RM6 / P220 RM6. P217 needs F-IDs for `/v1/saas/*` API contracts (Plan 04) + `markos-saas` MCP tools (Plan 05) + revenue metric/snapshot tables (Plan 01-02) + SAS agent registry (Plan 03). Estimated 8-12 contracts.
  - **Fix:** Pre-allocate slot tables. **CRITICAL: P217 must use slots that don't collide with foundation 82-89, P220 reservation 90-95+97, slot 96, P218 reservation 101-106. Recommended P217 = slots 98-100 (3 slots) — limited; may need multi-table per slot OR P217 = slots 107-110.** F-IDs avoid P220 F-209..F-227 + P219 F-228..F-237 + P218 F-238..F-246. Recommended P217 = F-247..F-258 (12 IDs).

- `MEDIUM` — **Plan 04 + Plan 05 lack endpoint/tool enumeration**. Stub Plan 04 says "Define `/v1/saas/*` API families with fresh F-IDs" but no endpoint list. Stub Plan 05 says "Define `markos-saas` MCP tools" but no tool list. P217 RESEARCH.md Q-7/Q-8 placeholders only.
  - **Fix:** Research must enumerate API endpoints + MCP tools (likely 8-12 each based on P220/P219 patterns). Examples expected: `/v1/saas/subscriptions`, `/v1/saas/plans`, `/v1/saas/invoices`, `/v1/saas/health`, `/v1/saas/metrics/mrr`, `/v1/saas/metrics/nrr`, `/v1/saas/agents`, `/v1/saas/tasks`, `/v1/saas/approvals`, `/v1/saas/events`. MCP tools mirror.

- `MEDIUM` — **Plan 03 SAS agent registry separate from P218/P219/P220 growth-agent registries**. P217 owns `sas_agent_readiness` (SAS-01..06 + SAS-10 invariant). P218 owns `growth_agent_readiness` (PLG/inapp/experiment). P219 owns `b2b_growth_agent_readiness` (RevTeam/expansion/ABM/advocacy/pricing). P220 owns `growth_agent_readiness` (referral/community/events/PR/partners) — **NAMING COLLISION between P218 and P220 growth_agent_readiness** flagged in P218 review (separate fix needed). For P217: ensure `sas_agent_readiness` doesn't collide with P218/P220 `growth_agent_readiness` table name.
  - **Fix:** Plan 03 ships `sas_agent_readiness` table (matches SAS- prefix). Document non-collision with P218/P220 `growth_agent_readiness` + P219 `b2b_growth_agent_readiness`.

### LOW (1)

- `LOW` — **DISCUSS.md 47 lines** (better than P219 + P220 33-line DISCUSS but still scope-only). Acceptable given CONTEXT richness; not blocking.

## Suggestions

- **Run `/gsd-plan-phase 217 --research`** to generate full plans (mirror P218/P219/P220 path).
- **Plan 06 SG-01..12 + Plan 03 SG-10 + Plan 01 LOOP-0X:** flip from `requirements` to `integrates_with` / `translation_gate_for` per ownership review.
- **Plan 04 + Plan 05 endpoint/tool enumeration:** research must produce concrete lists (8-12 endpoints + 8-12 MCP tools) before planning.
- **Apply P218/P219/P220 lessons:** architecture-lock + assertUpstreamReady + DB-trigger compliance + F-ID/migration pre-allocation + Plan 06 NOT autonomous=false (P217 P06 = UI nav, doesn't activate agents — plain autonomous=true OK; activation gate is in P218/P219/P220 P06 plans, not P217).
- **F-ID + migration slot pre-allocation:** P217 = slots 98-100 OR 107-110 + F-IDs F-247..F-258. Append V4.1.0-MIGRATION-SLOT-COORDINATION.md (P218 Plan 01 Task 0.1 will CREATE — coordinate sequencing).
- **Coordinate with P218:** P217 ships `saas_suite_activations` table FK (P214 owns? or P217?) that P218 mode profile gates on. Verify boundary.
- **Coordinate with P219+P220:** P217 SAS agent registry (sas_agent_readiness) must NOT collide with P218 `growth_agent_readiness` or P219 `b2b_growth_agent_readiness` or P220 `growth_agent_readiness`.
- **Mention Q-7 collision context:** P217 plan-time may discover the same foundation slot 82-89 collision documented for P219. P217 plans must use post-foundation post-P220 free slots from start.

## Risk Assessment

**Overall: BLOCKED**

Same as P218 + P219 + P220 — plans are stubs, not executable. Cannot run architectural review. Recovery path identical: re-research + re-plan via `/gsd-plan-phase 217 --research`.

**Mitigating:** stubs are scope-defined sensibly with stronger CONTEXT/RESEARCH than P218/P219/P220; doctrine keywords correct; non-negotiables explicit.

**Aggravating vs P218/P219/P220:** P217 is FOUNDATION for P218 (which is foundation for P219+P220). P217 ships `/v1/saas/*` API + `markos-saas` MCP + SaaS UI nav that P218+P219+P220 module surfaces extend. **Re-plan must come BEFORE P218 execute** — and P218 already has full plans. Sequencing: P217 must replan, then re-verify P218 doesn't need amendment, then execute P217 → P218 → P219 (after slot fix) → P220.

## Specific Questions for Plan Author

1. Same stub-state as P218+P219+P220 — intentional defer, or expected expansion in v4.2.0?
2. Plan 06 SG-01..12 ownership — own (conflict with P218-P220) or integrates_with / translation_gate?
3. Plan 03 SG-10 ownership — own (conflict with P218-P220 P06) or remove?
4. Plan 01 LOOP-0X ownership — own (conflict with P219-P220) or remove? (LOOP-06=P219, LOOP-08=P220)
5. Plan 04 endpoint count — estimated 8-12? Same for Plan 05 MCP tool count.
6. F-ID + migration slot allocation — when? P217 needs pre-P218 slot reservation (98-100 free, OR 107+).
7. Plan 03 `sas_agent_readiness` table — confirm non-collision with P218/P220 `growth_agent_readiness` (which itself has P218↔P220 naming-collision flagged separately).
8. P217 → P218 contract — what FK? `saas_suite_activations` table from P214 (per CONTEXT.md substrate) drives both P217 nav gate AND P218 mode profile gate. Confirm ownership.
9. Compliance enforcement — DB-trigger per domain (per P226 RH5/RH6 lesson)?
10. Plan 06 autonomous: autonomous=true (UI-only) OR autonomous=false (UI activation gate is the foundation — operator approval required for first-tenant)?

---

## Consensus Summary

> Single-reviewer (Claude under user override). Codex blocked until 2026-05-02.

### Top concern (HIGH)

1. **Plans are STUBS** — same as P218+P219+P220. Not executable. Cannot review architecturally. Path: `/gsd-plan-phase 217 --research`.

### MEDIUM (9)

2. No upstream-gate preflight (P202+P205+P207-P216, 12 prereqs)
3. No architecture-lock
4. Compliance enforcement boundary undefined (6 DB-triggers needed, one per domain)
5. Plan 06 SG-01..12 ownership ambiguous (P218-P220 territory)
6. Plan 03 SG-10 ownership ambiguous (P218-P220 P06 territory)
7. Plan 01 LOOP-0X ownership unclear (LOOP-06=P219, LOOP-08=P220)
8. No F-ID + migration slot allocation (P217 needs pre-P218 + post-foundation slots; recommend 98-100 or 107-110, F-IDs F-247..F-258)
9. Plan 04 + Plan 05 endpoint/tool enumeration missing
10. Plan 03 `sas_agent_readiness` table non-collision verification needed

### LOW (1)

11. DISCUSS.md 47 lines (acceptable given richer CONTEXT)

### Suggested next move

`/gsd-plan-phase 217 --research` (Path A — same as P218+P219+P220 successful recovery). Apply lessons:
- Wave 0.5 architecture-lock + assertUpstreamReady preflight (P202+P205+P207-P216 HARD)
- DB-trigger compliance per domain (6 triggers — see Plan-Author Q-9)
- F-ID + migration slot pre-allocation (P217 = slots 98-100 OR 107-110, F-IDs F-247..F-258); append V4.1.0-MIGRATION-SLOT-COORDINATION.md (which P218 Plan 01 Task 0.1 CREATES — sequence carefully)
- Plan 06 SG-01..12 → `translation_gate_for: [P218, P219, P220]` or `integrates_with`
- Plan 03 SG-10 → remove (P218-P220 P06 own)
- Plan 01 LOOP-0X → remove (P219+P220 own)
- Plan 04 + Plan 05 endpoint/tool enumeration (8-12 each estimated)
- `sas_agent_readiness` table (NOT `growth_agent_readiness`) — non-collision with P218/P219/P220
- buildApprovalPackage / requireHostedSupabaseAuth / resolvePlugin
- legacy api/*.js + npm test + .test.js + node:test
- Plan 06 autonomous decision (UI-only vs activation-gate)

### Reviewer environment

- Reviewer: Claude (current runtime; user override)
- Independence rule: waived (consistent with P218-P224 posture)
- Files inspected: 217-CONTEXT.md (49 lines), 217-RESEARCH.md (67 lines), 217-{01..06}-PLAN.md (25 lines each), DISCUSS.md (47 lines)
- Cross-reference: P218+P219+P220 review patterns (same stub recovery path)

### Trust caveat

Single-reviewer (Claude). Re-run `/gsd-review --phase 217 --codex` 2026-05-02 — but more useful to first run `/gsd-plan-phase 217 --research` so there are real plans.

### Cross-phase impact note (CRITICAL)

**P217 → P218 → P219+P220 chain.** P217 ships SAS revenue intelligence + agent registry + API/MCP/UI surface. P218 mode profile reads SAS-09 metrics + `saas_suite_activations` from upstream. P219+P220 modules extend `/v1/saas/*` API surface. **P217 re-plan must land BEFORE P218 execute.** Sequencing:
1. P217 replan (this review's recommendation)
2. P218 amendment (verify against P217 final contract — already passed; confirm)
3. P219 slot reallocation (Q-7 from P218 review — separate)
4. Execute P217 → P218 → P219 → P220 in order
