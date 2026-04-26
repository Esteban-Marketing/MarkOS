---
phase: 220
phase_name: saas-community-events-pr-partnership-devrel-growth
reviewers: [claude-runtime-override]
reviewers_attempted: [codex, claude, gemini, opencode]
reviewers_skipped:
  - codex: usage limit reached (resets 2026-05-02 09:44 AM)
  - gemini: not installed
  - opencode: not installed
reviewer_note: |
  Claude (current runtime) performed this review under explicit user override.
  Independence rule waived per user direction (same posture as P221-P224).
reviewed_at: 2026-04-26
plans_reviewed:
  - 220-01-PLAN.md
  - 220-02-PLAN.md
  - 220-03-PLAN.md
  - 220-04-PLAN.md
  - 220-05-PLAN.md
  - 220-06-PLAN.md
overall_risk: BLOCKED
high_concerns: 1
medium_concerns: 6
low_concerns: 2
---

# Cross-AI Plan Review — Phase 220

> **Single-reviewer caveat (override):** Codex usage limit reached. Claude runtime review per user direction.

> **CRITICAL FINDING:** Plans are STUBS (avg ~20 lines each), not executable plans. CONTEXT.md is 16 lines. RESEARCH.md is 23 lines. ROADMAP says "Plans 6/6 drafted" but "drafted" = scope-definition only. NOT reviewable as architectural plans against the P221-P228 framework. Recommend `/gsd-plan-phase 220 --research` to generate full plans BEFORE review can be productive.

---

## Claude Review

# Claude Review — Phase 220

## Summary

Phase 220 (SaaS Community, Events, PR, Partnerships, Developer Marketing, Growth Agent Surface) has 6 PLAN.md files but all are **scope-definition stubs** (~20 lines each: title + status + requirements + 1-sentence objective + 3-bullet scope + 3-bullet acceptance criteria). NO frontmatter (no `wave`, `depends_on`, `files_modified`, `autonomous`). NO tasks. NO code references. NO migrations. NO file paths. NO test files. NO contracts. CONTEXT.md is 16 lines (canonical inputs + "Required phase shape" 4 bullets). RESEARCH.md is 23 lines (research question + current-code support + gaps + tests-implied — high-level only).

This is NOT a P221-P228-style planset. It's a **discuss-phase artifact** masquerading as planned work. Cannot run a meaningful architectural review (no code refs to verify, no API surface to spec-check, no migrations to slot-allocate, no DB triggers to validate).

**Recommendation:** run `/gsd-plan-phase 220 --research` to generate full plans first. Then re-review against P221-P228 patterns.

## Strengths

- **Scope sensibly bounded**: 6 slices map to 6 doc-17 SaaS-marketing-OS strategy domains (referral/viral, community, events, PR/analyst/review, partnerships/affiliate/devrel, growth API/MCP/UI agent closure). Doctrinal coverage looks complete.
- **Compliance hooks cited**: every plan stub references "approval-aware", "evidence-backed", "Pricing Engine", "billing/tax/fraud" gates. Right doctrine, right keywords.
- **Plan 06 reserves growth API/MCP/UI namespaces** for PLG, EXP, ABM, VRL, IAM, CMT, EVT, XP, PR, PRT, DEV, REV tiers — explicit non-runnable agent readiness gate. Sound architectural posture.
- **Acceptance criteria are testable in principle**: "Referral rewards cannot bypass Pricing Engine, billing, tax, fraud, approval, or audit controls" — concrete enough to drive plan tasks once expanded.

## Concerns

### HIGH (1)

- `HIGH` — **Plans are STUBS, not executable**. Average 20 lines each. NO frontmatter (wave/depends_on/files_modified/autonomous). NO tasks (read_first/action/acceptance_criteria). NO code references. NO migration slots. NO F-ID allocation. NO test file paths. NO module trees. CONTEXT 16 lines. RESEARCH 23 lines. **Cannot pass `gsd-plan-checker` validation; cannot execute via `/gsd-execute-phase`; cannot be reviewed for architecture-lock compliance.**
  - **Fix:** Run `/gsd-plan-phase 220 --research` to generate full plans. Then re-review.

### MEDIUM (6)

- `MEDIUM` — **P220 is upstream of P227** ALTER TABLE additive ("5 SaaS-mode tables gain `business_mode` discriminator + ecosystem columns" per ROADMAP P227 entry). P227 D-15 + plan 01 references P220 schema as prerequisite. If P220 ships stubs only (no SOR tables), P227 hard-fails at preflight. Same risk for P222-P228 if any of them references P220 SaaS-mode tables.
  - **Fix:** P220 plans must define explicit table schemas + migration slots before downstream phases can validate dependencies.

- `MEDIUM` — **Compliance enforcement boundary undefined**. Each plan stub says "X cannot bypass Pricing Engine / billing / tax / fraud / approval / audit". P226 RH5/RH6 + P223 D-50/D-51 + P222 D-39 lessons all showed app-only enforcement is bypassable. P220 stubs don't pin RLS-vs-DB-trigger choice for any of: referral payout, community moderation, event rewards, PR claim audit, affiliate commission, developer payout.
  - **Fix:** Plans must specify DB-trigger enforcement points for compliance gates (per P226 D-83/D-84 model). Service-role bypass blocked.

- `MEDIUM` — **No upstream-gate preflight pattern**. ROADMAP says "Depends on: Phases 214-219". None landed. Plans lack `assertUpstreamReady()` preflight per P226 D-87 / P225 D-54 / P223 D-45 model. Downstream phases (P227 references P220 + P215 affiliate/payout compliance hooks) will see same fictional-dependency pattern P224/P225/P226 reviews flagged.
  - **Fix:** Plan 01 Task 0.5 should ship `scripts/preconditions/220-check-upstream.cjs` with REQUIRED_UPSTREAM = [P214, P215, P216, P217, P218, P219].

- `MEDIUM` — **No architecture-lock**. Plans don't pin: legacy `api/*.js` vs App Router; `requireHostedSupabaseAuth`; `npm test` runner; `contracts/openapi.json`; `mcp/tools/index.cjs`. Without architecture-lock, downstream P227 + P228 will inherit ambiguity.
  - **Fix:** Plan 01 Task 0.5 architecture-lock + forbidden-pattern detector per P221 D-32 / P226 D-78 model.

- `MEDIUM` — **Scope/density mismatch**. 6 domains × 6 plans = 1 plan per domain. But each domain (referral, community, events, PR, partnerships, growth-API+agent) is comparable in scope to P221-P228 individual phases (which had 6 plans EACH). Likely needs 30-40 plans across 6 phases (P220a..P220f) OR aggressive scope reduction.
  - **Fix:** Either (a) split P220 into 6 sub-phases (P220.1..P220.6) per domain, OR (b) defer half the scope to v4.3.0 milestone (e.g., PR/analyst/review + PR partnerships → defer; v4.2.1 ships referral + community + events + dev marketing). Recommend (b) — scope is too broad for one phase.

- `MEDIUM` — **No F-ID + migration slot allocation**. Plans cite SG-04/06/07/09-12 + API-01/MCP-01 requirements but no F-IDs reserved. P220 ships ALTER TABLE additive for P227 — needs migration slot reserved (P226 B6 + P223 D-55 + P221 RM4 lesson).
  - **Fix:** Pre-allocate F-ID slot table + migration slot table in Plan 01 truths once expanded.

### LOW (2)

- `LOW` — **RESEARCH.md too thin to support planning**. 23 lines. Lists "Gaps to solve" as 3 bullets. Doesn't survey existing referral/community/event/PR/affiliate codebases (e.g., is there `lib/markos/referral/` or `lib/markos/community/`?). Doesn't pin library choices (event platform integration: native vs Eventbrite/Hopin/Lu.ma; referral attribution: Stripe coupon vs custom). Re-run `/gsd-research-phase 220` for substantive research.

- `LOW` — **DISCUSS.md likely also thin** (20 lines per file ls). Suggests phase hasn't been deeply discussed. Consider `/gsd-discuss-phase 220 --auto` to surface gray areas.

## Suggestions

- **Run `/gsd-plan-phase 220 --research` to generate full plans.** Stubs cannot be reviewed/verified/executed against P221-P228 framework.
- **Or split P220 into sub-phases** (P220.1 referral/viral, P220.2 community, P220.3 events, P220.4 PR/analyst/review, P220.5 partnerships/affiliate/devrel, P220.6 growth API/MCP/UI agent closure). Each sub-phase ~6 plans like P221-P228.
- **Or aggressively scope-reduce** (defer PR/analyst/review + partnerships to v4.3.0; ship referral/community/events/devrel + growth API in v4.2.1).
- **Add Plan 01 Task 0.5 architecture-lock + assertUpstreamReady preflight** for P214-P219 once expanded plans exist.
- **Pin DB-trigger compliance enforcement** for referral payout + affiliate commission + community moderation + event rewards + PR claim audit (per P226 D-83/D-84 / P223 D-51 model).
- **Pre-allocate F-ID + migration slot tables** once schema known.
- **Verify P220 ALTER TABLE schema** matches P227 D-15 expectations (P227 references P220 SaaS-mode discriminator additive).

## Risk Assessment

**Overall: BLOCKED**

P220 cannot proceed as-is. Plans are stubs. CONTEXT/RESEARCH/DISCUSS thin. Cannot verify architecture-lock compliance, cannot allocate migrations/F-IDs, cannot review for P221-P228 anti-patterns. Downstream phases (P227 + possibly P222) reference P220 schema additive — blocking.

**Mitigating:** plan stubs are scope-defined sensibly; doctrine/compliance keywords correct. Easy to expand into full plans via `/gsd-plan-phase 220 --research`.

## Specific Questions for Plan Author

1. Are P220 plans intentionally stubs (deferred until v4.3.0 / future milestone) or expected to be expanded for v4.2.0?
2. Does P220 actually ship code in v4.2.0, or is it scope-only documentation for future implementation?
3. If P220 ships code: which 6 domains are in v4.2.0 scope vs deferred? Recommend split or scope-reduce.
4. Where is P220 ALTER TABLE for P227 SaaS-mode discriminator + ecosystem columns defined? (Currently nowhere — would block P227 execute.)
5. Compliance enforcement boundary: app-layer or DB-trigger? Pick one per domain.
6. Architecture-lock: legacy `api/*.js` + `requireHostedSupabaseAuth` + `npm test` (matches P204/P221-P228) or different?
7. Are P214-P219 hard preflight or soft-skip? Recommend hard preflight per P221 D-35 model.
8. F-ID + migration slot allocation: when?
9. Test runner: `npm test` Node `--test` (matches P204/P221-P228 lockin) or vitest install?
10. P220 → P227 schema compatibility: who owns the contract? Currently neither phase has it pinned.

---

## Consensus Summary

> Single-reviewer (Claude under user override). Codex blocked until 2026-05-02.

### Top concern (HIGH — single)

1. **Plans are STUBS, not executable** — 20 lines each, no frontmatter/tasks/code refs/migrations. Cannot pass `gsd-plan-checker`. Cannot execute. Cannot review architecturally.

### MEDIUM (6)

2. P220 → P227 schema dependency unaddressed (ALTER TABLE for SaaS-mode discriminator)
3. Compliance enforcement boundary undefined (RLS vs DB-trigger per domain)
4. No upstream-gate preflight (P214-P219 dependencies)
5. No architecture-lock (legacy api/*.js + requireHostedSupabaseAuth + npm test)
6. Scope/density mismatch (6 domains in 6 plans = 1 plan per domain, vs P221-P228 6 plans per phase)
7. No F-ID + migration slot allocation

### LOW (2)

8. RESEARCH.md too thin (23 lines)
9. DISCUSS.md likely thin (20 lines)

### Suggested next move

**Path A (recommended):** `/gsd-plan-phase 220 --research` to generate full plans. Then re-review against P221-P228 framework.

**Path B (alternative):** split P220 into sub-phases (P220.1..P220.6) per domain. Each ~6 plans like P221-P228.

**Path C (scope-reduce):** defer PR/analyst/review + partnerships to v4.3.0; ship referral/community/events/devrel + growth API in v4.2.x.

**Path D (defer entirely):** P220 marked "scope-only documentation" for future milestone; remove from v4.2.0 commercial-engines lane.

Recommend **Path A** as default; if scope expands too large after planning, switch to **Path B**.

### Reviewer environment

- Reviewer: Claude (current Claude Code runtime; user override after Codex usage limit)
- Independence rule: waived per user direction
- Files inspected: 220-CONTEXT.md (16 lines, full), 220-RESEARCH.md (23 lines, full), 220-{01..06}-PLAN.md (~20 lines each, full)
- Cross-reference: P221 D-35 (preflight pattern), P226 D-83/D-84 (DB-trigger enforcement), P227 (downstream schema dep)

### Trust caveat

Single-reviewer (Claude is runtime). When Codex resets (2026-05-02 09:44 AM), `/gsd-review --phase 220 --codex` recommended for triangulation — but probably more useful to first run `/gsd-plan-phase 220 --research` so there are real plans to review.
