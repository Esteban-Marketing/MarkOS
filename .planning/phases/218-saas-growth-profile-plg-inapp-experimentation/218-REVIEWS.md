---
phase: 218
phase_name: saas-growth-profile-plg-inapp-experimentation
reviewers: [claude-runtime-override]
reviewers_attempted: [codex, claude, gemini, opencode]
reviewers_skipped:
  - codex: usage limit reached (resets 2026-05-02 09:44 AM)
  - gemini: not installed
  - opencode: not installed
reviewer_note: |
  Claude (current runtime) per user override. Independence rule waived (same posture as P219-P224).
reviewed_at: 2026-04-26
plans_reviewed:
  - 218-01-PLAN.md
  - 218-02-PLAN.md
  - 218-03-PLAN.md
  - 218-04-PLAN.md
  - 218-05-PLAN.md
  - 218-06-PLAN.md
overall_risk: BLOCKED
high_concerns: 1
medium_concerns: 8
low_concerns: 2
---

# Cross-AI Plan Review — Phase 218

> **Single-reviewer caveat (override):** Codex usage limit. Claude runtime review.

> **CRITICAL FINDING:** Plans are STUBS (21 lines each), CONTEXT 25 lines, RESEARCH 25 lines, DISCUSS 33 lines. Same shape as P219 + P220. Not reviewable as architectural plans against P221-P228 framework. Recommend `/gsd-plan-phase 218 --research` to generate full plans (mirror P219/P220 path: re-research → re-plan → verify).

---

## Claude Review

# Claude Review — Phase 218

## Summary

Phase 218 (SaaS Growth Profile, PLG, In-App, Experimentation) is **same stub state as P219 + P220** — 6 PLAN.md files at 21 lines each, CONTEXT 25 lines, RESEARCH 25 lines, DISCUSS 33 lines. NO frontmatter, NO tasks, NO code refs, NO migrations, NO test files, NO contracts. Scope-definition documents only.

Apply identical recovery path as P219/P220: `/gsd-plan-phase 218 --research` to generate full plans, then verify against P221-P228 framework.

**P218 specifics distinct from P219/P220:**
- 6 domains: SaaSGrowthProfile+ModeRouting, ActivationDefinition+MilestoneFunnels+PQLScore, UpgradeTrigger+pricing-safe-conversion, InAppCampaign+Suppression+Approval, MarketingExperiment+ICE+Guardrails+Decisions, PLG/in-app/experiment agent readiness
- Pricing Engine integration is CRITICAL across **two plans**: Plan 03 (UpgradeTrigger pricing-safe conversion prompts) AND Plan 04 (InAppCampaign — every in-app prompt with monetization angle routes through PricingRecommendation per CONTEXT.md non-negotiable)
- LRN-01..05 referenced in stub Plan 05 — these are P212-owned per REQUIREMENTS:221 (`LRN-01..05 | Phase 212`); P218 Plan 05 must INTEGRATE (write to ArtifactPerformanceLog/TenantOverlay/LiteracyUpdateCandidate) NOT redefine
- SAS-09 referenced in stub Plan 01 — SAS-09 is "SaaS product usage + revenue intelligence" (REQUIREMENTS:126); maps to Phase 217 base + P218 surfaces growth signals
- SG-01 mode enum is ARCHITECTURAL: `b2b | b2c | plg_b2b | plg_b2c | b2b2c` — every downstream P219+P220 module gates on this
- 5-mode routing means EACH module needs mode-eligibility matrix (otherwise `requireGrowthMode()` runtime helper is implicit and bypassable)

## Strengths

- **Scope sensibly bounded** to 6 doc-17 SaaS-marketing-OS PLG-aligned domains
- **Compliance keywords correct** (Pricing Engine routing, approval-gated, evidence-linked, EvidenceMap, learning handoff)
- **Plan 03 + Plan 04 explicit "no in-app prompt / upgrade nudge / discount / save offer / pricing copy bypasses Pricing Engine"** — sound doctrinal posture (matches Pricing Engine Canon)
- **Plan 05 explicit "no experiment runs without guardrails, owner, decision criteria, learning handoff"** — mirrors LRN-01..05 integration without redefining
- **Plan 06 explicit non-runnable agent registry** — matches P219/P220 Plan 06 + P226 W1 mitigation pattern
- **DISCUSS.md non-goals correctly flag** P219 (ABM/expansion) + P220 (community/events/PR/partnership/devrel) boundary

## Concerns

### HIGH (1)

- `HIGH` — **Plans are STUBS, not executable** (same as P219 H1 + P220 H1). 21 lines each. NO frontmatter (wave/depends_on/files_modified/autonomous). NO tasks (read_first/action/acceptance_criteria). NO code references. NO migration slots. NO F-ID allocation. NO test file paths. CONTEXT 25 lines. RESEARCH 25 lines. **Cannot pass `gsd-plan-checker` validation; cannot execute via `/gsd-execute-phase`.**
  - **Fix:** Run `/gsd-plan-phase 218 --research` to generate full plans (mirror P219/P220 path). Then re-review.

### MEDIUM (8)

- `MEDIUM` — **P205 Pricing Engine hard dependency for Plan 03 + Plan 04 unaddressed**. CONTEXT.md non-negotiable: "No in-app prompt, upgrade nudge, discount, save offer, or pricing copy bypasses Pricing Engine." Plan 03 (UpgradeTrigger) routes "pricing-safe conversion prompts" through PricingRecommendation. Plan 04 (InAppCampaign) routes every monetization-angle prompt through PricingRecommendation. P205 not landed (per ROADMAP). Soft-skip pattern would fail compliance per P226 RH8 / P223 D-45 / P219 RM2. Plans 03+04 need `assertUpstreamReady(['P205'])` hard-fail OR `{{MARKOS_PRICING_ENGINE_PENDING}}` placeholder fallback per Pricing Engine Canon.
  - **Fix:** Plan 03 + Plan 04 explicit hard-prereq P205 OR document `{{MARKOS_PRICING_ENGINE_PENDING}}` sentinel fallback in CONTEXT (mirror P219 Plan 05 pattern).

- `MEDIUM` — **No upstream-gate preflight pattern for P214-P217**. ROADMAP says "Depends on: Phases 214-217". None landed. Same A-N rejected pattern P226 RH8 / P227 / P225 RH8 / P219 RM2 / P220 RM2.
  - **Fix:** Plan 01 Task 0.5 ships `scripts/preconditions/218-check-upstream.cjs` with REQUIRED_UPSTREAM = [P214, P215, P216, P217] HARD; SOFT [P205, P207-P212].

- `MEDIUM` — **No architecture-lock**. Plans don't pin: legacy `api/*.js` vs App Router; `requireHostedSupabaseAuth`; `npm test` runner; `contracts/openapi.json`; `mcp/tools/index.cjs`; `buildApprovalPackage`; `resolvePlugin`. Same as P219 RM3 / P220 RM3.
  - **Fix:** Plan 01 Task 0.5 architecture-lock + forbidden-pattern detector per P226 D-78 / P219 D-32 model.

- `MEDIUM` — **Compliance enforcement boundary undefined per domain**. CONTEXT.md non-negotiable #3: "No customer-facing in-app action bypasses approval unless an earned-autonomy policy exists." Plan 04 InAppCampaign customer-facing dispatch. Plan 03 UpgradeTrigger pricing copy. Plan 05 experiment activation. All cited as "approval-gated" but no DB-trigger pinned. P226 RH5/RH6 + P223 D-50/D-51 + P222 D-39 + P219 RM4 lessons all showed app-only enforcement bypassable.
  - **Fix:** Plans must specify DB-trigger enforcement points (recommended exception names):
    - Plan 01: `GROWTH_MODE_REQUIRES_SAAS_ACTIVATION` (mode change requires P214 SaaSSuiteActivation)
    - Plan 02: `PQL_SCORE_REQUIRES_EVIDENCE` (PQL transition requires explainable inputs)
    - Plan 03: `UPGRADE_TRIGGER_PRICING_REQUIRED` (pricing recommendation FK or sentinel)
    - Plan 04: `INAPP_CAMPAIGN_REQUIRES_APPROVAL_AND_PRICING` (approval + pricing FK or sentinel)
    - Plan 05: `EXPERIMENT_ACTIVATION_REQUIRES_GUARDRAILS_OWNER_DECISION_CRITERIA` (4-field constraint)
    - Plan 06: `AGENT_ACTIVATION_REQUIRES_READINESS` (mirror P219/P220 P06)

- `MEDIUM` — **Plan 05 LRN-01..05 ownership ambiguous**. Stub Plan 05 lists LRN-01..05 in requirements field. REQUIREMENTS.md:221 maps `LRN-01..05 | Phase 212`. Phase 212 owns the artifact-performance / overlay / literacy substrate. P218 Plan 05 INTEGRATES (writes to ArtifactPerformanceLog/TenantOverlay/LiteracyUpdateCandidate as RESEARCH §Tests-implied describes) — does not own definitions. Stub conflates ownership with integration.
  - **Fix:** Plan 05 frontmatter `requirements:` should be `SG-07, QA-01..15` (own SG-07 experiment registry); add separate `integrates_with: [LRN-01..05]` or `consumes_from: P212` field. Otherwise drift detector will flag double-ownership when P212 lands.

- `MEDIUM` — **Plan 01 SAS-09 ownership ambiguous (same shape as LRN issue)**. Stub Plan 01 lists SAS-09 in requirements. REQUIREMENTS.md:126 SAS-09 = "SaaS product usage and revenue intelligence" — maps to Phase 217 base. P218 Plan 01 SaaSGrowthProfile CONSUMES revenue intelligence (gates module activation on SAS metrics) — does not own SAS-09.
  - **Fix:** Plan 01 frontmatter `requirements:` should be `SG-01, QA-01..15` (own SG-01 mode profile); add `integrates_with: [SAS-09 from P217]`.

- `MEDIUM` — **5-mode routing matrix missing**. SG-01 mode enum (b2b/b2c/plg_b2b/plg_b2c/b2b2c) gates downstream module activation across P218+P219+P220. Stub Plan 01 says "Route ... modes to eligible modules" with no matrix. If matrix is implicit, every downstream module silently passes mode check — bypassable (same shape as P226 RH5/RH6 app-only enforcement).
  - **Fix:** Plan 01 must ship: (a) `markos_growth_modes` ENUM column on `markos_tenants` or `saas_growth_profiles` table, (b) `module_mode_eligibility` matrix table or static map (`{ABMAccountPackage: [b2b, plg_b2b]}`, etc.), (c) DB-trigger `MODULE_REQUIRES_ELIGIBLE_GROWTH_MODE` on every downstream-table insert (P219/P220 modules check via this trigger).

- `MEDIUM` — **No F-ID + migration slot allocation**. Same as P219 RM6 / P220 RM6.
  - **Fix:** Pre-allocate slot tables per P226 B6 / P223 D-55 lessons once full plans generated. P218 likely needs slots 82-84 or similar pre-P219 (85-89) pre-P220 (90-95+97) range.

### LOW (2)

- `LOW` — **RESEARCH.md too thin** (25 lines). Same as P219 RL1 / P220 RL1.
- `LOW` — **DISCUSS.md adequate but thin** (33 lines — better than P219/P220 but still scope-only, no architectural decisions).

## Suggestions

- **Run `/gsd-plan-phase 218 --research`** to generate full plans (mirror P219/P220 path).
- **Plans 03+04 must hard-fail on P205 absent** OR document `{{MARKOS_PRICING_ENGINE_PENDING}}` placeholder fallback per Pricing Engine Canon.
- **Plan 05 LRN-01..05 + Plan 01 SAS-09:** flip from `requirements_addressed` to `integrates_with` to avoid double-ownership drift with P212/P217.
- **Plan 01 mode-routing matrix:** ship `markos_growth_modes` ENUM + `module_mode_eligibility` matrix + DB-trigger `MODULE_REQUIRES_ELIGIBLE_GROWTH_MODE` (this is the foundation P219+P220 modules gate on).
- **Apply P219/P220 lessons:** architecture-lock + assertUpstreamReady + DB-trigger compliance + F-ID/migration pre-allocation + Plan 06 autonomous=false + checkpoint:human-action.
- **Coordinate with P219+P220:** P218 Plan 01 mode profile is the gate; ensure P219/P220 Plan 01 reads `saas_growth_profile.mode` before module activation.
- **PRC-09 (Pricing copy routing):** referenced in ROADMAP requirements_mapped — verify Plan 03 + Plan 04 cover (or split to dedicated Plan 03 ownership).

## Risk Assessment

**Overall: BLOCKED**

Same as P219 + P220 — plans are stubs, not executable. Cannot run architectural review. Recovery path identical: re-research + re-plan via `/gsd-plan-phase 218 --research`.

**Mitigating:** stubs are scope-defined sensibly; doctrine keywords correct; non-negotiables explicit in CONTEXT (Pricing Engine routing, approval gates, experiment guardrails). Easy to expand into full plans.

**Aggravating vs P219/P220:** P218 is the FOUNDATION phase — SG-01 mode profile gates ALL downstream P219+P220 module activation. Stub state means downstream phases (already replanned with depends_on=[214-217]) have no concrete contract to hand off from. Re-plan must come BEFORE P219/P220 execute.

## Specific Questions for Plan Author

1. Same stub-state as P219+P220 — intentional defer, or expected expansion in v4.2.0?
2. Plans 03+04 Pricing Engine: hard-prereq P205 OR sentinel fallback for both?
3. SAS-09 in Plan 01 — own (conflict with P217) or integrate (correct)?
4. LRN-01..05 in Plan 05 — own (conflict with P212) or integrate (correct)?
5. PRC-09 ROADMAP requirement — Plan 03 ownership or split?
6. 5-mode routing matrix — explicit table+trigger OR implicit app-helper?
7. P218 → P219/P220 handoff — what contract? `saas_growth_profiles.mode` direct read, or service layer?
8. Compliance enforcement — DB-trigger per domain (per P226 RH5/RH6 lesson)?
9. F-ID + migration slot allocation: when? P218 needs slots before P219 (85-89) and P220 (90-95+97).
10. Plan 06 autonomous=false + checkpoint:human-action: confirm mirror P219/P220 P06.

---

## Consensus Summary

> Single-reviewer (Claude under user override). Codex blocked until 2026-05-02.

### Top concern (HIGH)

1. **Plans are STUBS** — same as P219+P220. Not executable. Cannot review architecturally. Path: `/gsd-plan-phase 218 --research`.

### MEDIUM (8)

2. P205 Pricing Engine hard-prereq for Plans 03+04 unaddressed (TWO plans, not one)
3. No upstream-gate preflight (P214-P217)
4. No architecture-lock
5. Compliance enforcement boundary undefined (DB-trigger missing per domain)
6. Plan 05 LRN-01..05 ownership ambiguous (conflict with P212)
7. Plan 01 SAS-09 ownership ambiguous (conflict with P217)
8. 5-mode routing matrix missing (foundation for P219+P220 module activation)
9. No F-ID + migration slot allocation

### LOW (2)

10. RESEARCH.md 25 lines too thin
11. DISCUSS.md 33 lines (better than P219/P220 but still scope-only)

### Suggested next move

`/gsd-plan-phase 218 --research` (Path A — same as P219+P220 successful recovery). Apply P219/P220 lessons:
- Wave 0.5 architecture-lock + assertUpstreamReady preflight P214-P217 HARD; P205 SOFT with sentinel fallback
- DB-trigger compliance enforcement per domain (6 triggers — see Plan-Author Q-8)
- Mode-routing matrix table + DB-trigger `MODULE_REQUIRES_ELIGIBLE_GROWTH_MODE` (foundational for P219+P220)
- buildApprovalPackage wiring (NOT createApprovalPackage)
- legacy api/*.js + requireHostedSupabaseAuth
- npm test + .test.js + node:test + node:assert/strict
- Plan 06 autonomous=false + checkpoint:human-action for first-run agent activation
- F-ID + migration slot pre-allocation (estimate slots 82-84 pre-P219; F-IDs ~F-220..F-227 pre-P219 F-228)
- LRN-01..05 in Plan 05 → flip to `integrates_with: P212`
- SAS-09 in Plan 01 → flip to `integrates_with: P217`
- Append V4.1.0-MIGRATION-SLOT-COORDINATION.md with P218 reservation (UPSTREAM of P219+P220 reservations)

### Reviewer environment

- Reviewer: Claude (current runtime; user override)
- Independence rule: waived (consistent with P219-P224 posture)
- Files inspected: 218-CONTEXT.md (25 lines), 218-RESEARCH.md (25 lines), 218-{01..06}-PLAN.md (21 lines each), DISCUSS.md (33 lines)
- Cross-reference: P219+P220 review pattern (same stub recovery path)

### Trust caveat

Single-reviewer (Claude). Re-run `/gsd-review --phase 218 --codex` 2026-05-02 — but more useful to first run `/gsd-plan-phase 218 --research` so there are real plans.

### Cross-phase impact note (CRITICAL)

P218 is FOUNDATION for P219 + P220. Both downstream phases already replanned with `depends_on: [Phases 214-218]`. P219/P220 Plan 01 reads `saas_growth_profiles.mode` to gate module activation. If P218 plans remain stubs at P219/P220 execution time, downstream phases have NO concrete contract to consume. **P218 re-plan must land BEFORE P219/P220 execute** — not after.
