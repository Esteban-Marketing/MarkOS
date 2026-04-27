---
phase: 214
phase_name: saas-suite-activation-subscription-core
reviewers: [claude-runtime-override]
reviewers_attempted: [codex, claude, gemini, opencode]
reviewers_skipped:
  - codex: usage limit reached (resets 2026-05-02 09:44 AM)
  - gemini: not installed
  - opencode: not installed
reviewer_note: |
  Claude (current runtime) per user override. Independence rule waived (consistent with P215-P224 posture).
reviewed_at: 2026-04-27
plans_reviewed:
  - 214-01-PLAN.md
  - 214-02-PLAN.md
  - 214-03-PLAN.md
  - 214-04-PLAN.md
  - 214-05-PLAN.md
  - 214-06-PLAN.md
overall_risk: BLOCKED
high_concerns: 1
medium_concerns: 9
low_concerns: 1
---

# Cross-AI Plan Review — Phase 214

> **Single-reviewer caveat (override):** Codex usage limit. Claude runtime review.

> **CRITICAL FINDING:** Plans are STUBS (25-26 lines each). Same as P215-P220. P214 = TRUE FOUNDATION of entire v4.1.0 SaaS Suite (P215-P220 all HARD-depend on P214 saas_suite_activations + saas_subscriptions). Recommend `/gsd-plan-phase 214 --research`.

---

## Claude Review

# Claude Review — Phase 214

## Summary

Phase 214 (SaaS Suite Activation + Subscription Core) is **same stub pattern as P215-P220**. 6 plans @ 25-26 lines. CONTEXT 51 lines (5 non-negotiables + 8-step phase shape — strongest of all SaaS Suite stubs). RESEARCH 65 lines (with codebase addendum). DISCUSS 48 lines (Decision matrix).

P214 is the TRUE FOUNDATION of v4.1.0 SaaS Suite chain:
- P215 plans HARD-depend on P214 saas_suite_activations + saas_subscriptions
- P216 reads saas_suite_activations.active for nav gate
- P217 SaaSGrowthProfile (P218) gates on P214 activation
- P218 mode profile reads saas_suite_activations
- P219 + P220 modules read activation state
- All SaaS Suite phases reference `business_type = saas` activation

**P214 specifics distinct from P215-P220:**
- 6 domains: Activation Gate + Wizard + ID Allocation (Plan 01), SaaS Profile + Plan + Subscription + Lifecycle Schema (Plan 02), Subscription Lifecycle State Machine (Plan 03 — trial/active/past_due/pause/cancel/reactivate/upgrade/downgrade), SaaS Customer Identity Bridge (Plan 04 — CRM customers/accounts/companies), Lifecycle Tasks + Approvals + Audit (Plan 05), SaaS Core UI/API + Growth-Mode Extension Point (Plan 06)
- **TRUE foundation** — depends on minimal upstreams (P205 Pricing Engine + P207 CRM + P208 approvals; only 3 prereqs)
- **Pricing Engine ownership preserved** — Plan 01 + Plan 02 reference PricingRecommendation FK or sentinel `{{MARKOS_PRICING_ENGINE_PENDING}}`; never own pricing
- **CRM identity reuse** — Plan 04 reuses CRM customers/accounts/companies (no parallel SaaS customer model) per non-negotiable #4
- **Plan 06 growth-mode extension point** — reserves SaaSGrowthProfile fields for P218 (`b2b/b2c/plg_b2b/plg_b2c/b2b2c`) but does NOT activate growth modules
- US + Colombia metadata only (billing execution = P215)
- 8-state subscription lifecycle (richer than typical 3-state CRUD)

## Strengths

- **CONTEXT 5 non-negotiables explicit:** non-SaaS tenant gate, Pricing Engine ownership, AgentRun/task/approval/audit/rollback for subscription mutations, no parallel customer identity, no growth-module activation
- **CONTEXT 8-step required phase shape** — most thorough of any SaaS Suite phase
- **DISCUSS Decision matrix** — 6 explicit decisions (Activation model / Plan ownership / Lifecycle scope / Customer mapping / First country / SaaS growth mode) with options + recommended defaults
- **DISCUSS Acceptance Gate** — 6 measurable conditions
- **RESEARCH codebase addendum** — documents existing tenant/billing/CRM/AgentRun substrate (REUSE pattern, no greenfield); identifies 6 specific gaps
- **Plan 04 explicit "CRM identity reuse"** — sound minimization posture
- **Plan 06 explicit "growth-mode extension point only"** — bounds scope correctly
- **Plan 02 Pricing Engine FK reference pattern** — preserves doctrine

## Concerns

### HIGH (1)

- `HIGH` — **Plans are STUBS, not executable** (same as P215-P220 H1). 25-26 lines each. NO frontmatter (wave/depends_on/files_modified/autonomous). NO tasks (read_first/action/acceptance_criteria). NO code refs. NO F-IDs. NO migration slots. NO test files. NO subscription state machine table or transition guards. NO RLS policy enumeration. NO CRM bridge schema. **Cannot pass `gsd-plan-checker`; cannot execute via `/gsd-execute-phase`.**
  - **Fix:** `/gsd-plan-phase 214 --research`. Mirror P215-P220 successful recovery (most recent template = P215, commit 9b153d2).

### MEDIUM (9)

- `MEDIUM` — **No upstream-gate preflight for P205, P207, P208** (3 prereqs). ROADMAP says "Depends on: Phases 205, 207, 208". None landed. Same A-N pattern P215-P220 RM2.
  - **Fix:** Plan 01 Task 0.5 ships `scripts/preconditions/214-check-upstream.cjs` REQUIRED_UPSTREAM = [P205 (Pricing Engine), P207 (CRM customers/accounts/tasks), P208 (approvals)] HARD; SOFT [P201 tenants/orgs/RLS — likely landed; P209 evidence].

- `MEDIUM` — **No architecture-lock**. Same as P215-P220.
  - **Fix:** Plan 01 Task 0.5 architecture-lock + forbidden-pattern detector (createApprovalPackage / requireSupabaseAuth / requireTenantContext / serviceRoleClient / lookupPlugin / public/openapi.json / app/(saas) / api/v1/.../route.ts / vitest / playwright / .test.ts).

- `MEDIUM` — **Compliance enforcement boundary undefined per domain**. CONTEXT non-negotiables: "No SaaS Suite surface for non-SaaS tenants" (Plan 01 + Plan 06 — activation gate), "No plan price canonical without Pricing Engine" (Plan 02 — pricing FK or sentinel), "No subscription mutation bypasses AgentRun/task/approval/audit/rollback" (Plan 03 + Plan 05 — lifecycle gating), "No parallel customer identity" (Plan 04 — bridge enforcement), "No growth module activation without GSD translation" (Plan 06 — extension point only). All cited but no DB-trigger pinned.
  - **Fix:** Plans must specify DB-trigger exception names per domain:
    - Plan 01: `EXCEPTION 'SAAS_ACTIVATION_REQUIRES_BUSINESS_TYPE'` (insert into saas_suite_activations where tenants.business_type != 'saas' = block)
    - Plan 02: `EXCEPTION 'SAAS_PLAN_REQUIRES_PRICING_RECOMMENDATION_OR_SENTINEL'` (publish active SaaS plan without pricing_recommendation_id IS NOT NULL OR sentinel `{{MARKOS_PRICING_ENGINE_PENDING}}` = block)
    - Plan 03: `EXCEPTION 'SAAS_SUBSCRIPTION_TRANSITION_REQUIRES_APPROVAL'` (lifecycle event insert without approval_id for upgrade/downgrade/pause/cancel/reactivate = block; trial→active OK without approval)
    - Plan 04: `EXCEPTION 'SAAS_CUSTOMER_BRIDGE_REQUIRES_CRM_IDENTITY'` (saas_customer_bridges insert without crm_customer_id OR crm_account_id = block — enforces non-negotiable #4)
    - Plan 05: `EXCEPTION 'SAAS_LIFECYCLE_AUDIT_REQUIRES_EVIDENCE_PACK'` (lifecycle event without audit_log_id + evidence_pack_ref = block)
    - Plan 06: NOT a DB-trigger (translation gate is regression test; mirror P217 P06)

- `MEDIUM` — **Plan 06 SG-01 ownership ambiguous**. Stub Plan 06 lists SG-01 in requirements. SG-01 = "SaaS tenants eventually have a growth-mode profile (b2b/b2c/plg_b2b/plg_b2c/b2b2c)" → P218 owns this contract. P214 Plan 06 RESERVES extension point but does NOT activate growth-mode profile.
  - **Fix:** Plan 06 frontmatter `requirements:` should be `[SAS-04, QA-01..15]`; add `translation_gate_for: [P218]` (P218 will activate SG-01 via SaaSGrowthProfile in slot 101); add `extension_point_for: [SG-01]`.

- `MEDIUM` — **PRC-09 ownership in Plan 01**. Stub Plan 01 lists PRC-09. PRC-09 = Pricing Engine pricing copy routing → P205 owns. P214 Plan 01 REFERENCES Pricing Engine for unresolved pricing fields (uses sentinel pattern); does NOT own PRC-09.
  - **Fix:** Plan 01 frontmatter `requirements:` should be `[SAS-01, SAS-02, QA-01..15]`; add `integrates_with: [PRC-09 from P205]` (P205 substrate; sentinel fallback `{{MARKOS_PRICING_ENGINE_PENDING}}` per Pricing Engine Canon).

- `MEDIUM` — **RUN-01..08 + TASK-01..05 ownership in ROADMAP P214 mapping**. ROADMAP P214 requirements include RUN-01..08 (AgentRun) + TASK-01..05 (CRM tasks). RUN-01..08 likely owned by P207 (AgentRun substrate); TASK-01..05 likely owned by P207 (CRM tasks).
  - **Fix:** Plan 03 + Plan 05 frontmatter `integrates_with: [RUN-01..08 from P207, TASK-01..05 from P207]` (NOT requirements). Plan 03 lifecycle events use AgentRun substrate; Plan 05 creates CRM tasks for approvals.

- `MEDIUM` — **No F-ID + migration slot allocation; Q-7 SLOT ORDERING CRISIS extends**. Same as P215-P220 RM7. Existing on disk: foundation 82-89 + 96 + 100. Reserved: P220 90-95+97 + F-209..F-227. P217 98-99 + F-247..F-258. P218 101-106 + F-238..F-246. P219 107-111 + F-228..F-237. P216 112-117 + F-259..F-270. P215 118-123 + F-271..F-286.

  **Free slots: 124+.** Recommended P214 = slots 124-129 (6 slots). F-IDs P214 = F-287..F-300 (14 IDs). **Q-7 SLOT ORDERING CRISIS extends to P214:** P214 execution-order FIRST in V4.1.0 but slot-order LATEST (124-129). FK direction strictly P215-P220 READ P214; zero reverse FKs from P214 INTO P215-P220 tables. Execution gating via assertUpstreamReady.

- `MEDIUM` — **Subscription lifecycle state machine unspecified**. CONTEXT requires 8-state machine (trial/active/past_due/pause/cancel/reactivate/upgrade/downgrade). Stub Plan 03 mentions "state machine" but no transition map / guard list / approval-required transitions. P226 W1 lesson: implicit state machines = drift risk.
  - **Fix:** Research must produce concrete state transition table (8 states × valid transitions); approval-required vs auto transitions; rollback semantics; idempotency keys; lifecycle event ID per transition.

- `MEDIUM` — **CRM bridge model unspecified**. Plan 04 says "Reuse CRM/customer identity where possible; add SaaS bridge records" but no concrete schema. Stub doesn't specify whether bridge is `saas_customer_bridges (saas_subscription_id, crm_customer_id, crm_account_id, crm_company_id)` table OR ADD COLUMN to existing CRM tables. Different choice = different migration impact + different RLS implications.
  - **Fix:** Research recommends bridge table (separate `saas_customer_bridges` migration row) — keeps P207 CRM schema unchanged + allows multiple subscription records per CRM customer (cohorts).

### LOW (1)

- `LOW` — **DISCUSS Decision matrix is strong but missing migration slot decision** (now revealed as Q-7 ordering crisis). Acceptable; defer to RESEARCH §F-ID + Migration Slot Allocation.

## Suggestions

- **Run `/gsd-plan-phase 214 --research`**. Mirror P215 pattern (commit 9b153d2 — most recent v4.1.0 stub recovery).
- **Cross-phase ownership flips:** PRC-09 → integrates_with P205; SG-01 → translation_gate_for P218 + extension_point_for; RUN-01..08 + TASK-01..05 → integrates_with P207.
- **Q-7 SLOT ORDERING CRISIS extends:** P214 = slots 124-129 (post-P215 in slot space; FIRST in execution order). Document FK direction: P215-P220 READ P214; zero reverse FKs.
- **F-IDs P214 = F-287..F-300** (14 IDs avoiding all prior reservations).
- **Apply P215-P220 lessons:** architecture-lock + assertUpstreamReady (HARD P205/P207/P208) + DB-trigger compliance (5 + activation gate) + F-ID/migration slot pre-allocation + Plan 06 autonomous=true (mirror P217+P216 P06).
- **8-state subscription lifecycle:** research must produce explicit transition table + approval matrix + rollback semantics + idempotency.
- **CRM bridge:** research recommends `saas_customer_bridges` table (NOT ADD COLUMN to CRM); allows multiple subscriptions per CRM customer + preserves P207 schema.
- **Activation wizard:** research must specify wizard fields (countries / processors / accounting / legal billing / enabled modules / autonomy posture) + persistence model.
- **V4.1.0-MIGRATION-SLOT-COORDINATION.md:** P215 Plan 01 Task 0.1 CREATEs the doc (P215 first). P214 executes BEFORE P215 — but if P214 plans are written second (this review), P214 Plan 01 Task 0.1 needs CREATE-or-APPEND. **Recommend P214 Plan 01 Task 0.1 CREATEs the doc since P214 = FIRST execution overall** (P215 then APPENDs). This shifts the "create vs append" responsibility from P215 to P214 — coordinate with P215 plans (commit 9b153d2) which currently say "P215 is FIRST V4.1.0 phase to CREATE."

## Risk Assessment

**Overall: BLOCKED**

Same as P215-P220 — plans are stubs. Cannot review architecturally. Recovery: re-research + re-plan via `/gsd-plan-phase 214 --research`.

**Mitigating:** stubs have STRONGEST CONTEXT/DISCUSS of all SaaS Suite phases (5 non-negotiables + 8-step phase shape + 6-decision matrix + 6-condition Acceptance Gate). RESEARCH codebase addendum is solid. Easy to expand.

**Aggravating:**
1. **TRUE foundation phase** — P215-P220 all depend on P214; if P214 ships wrong contract, entire v4.1.0 SaaS Suite shifts.
2. **8-state lifecycle complexity** — richer state machine than typical phase; needs explicit transition table.
3. **Q-7 SLOT ORDERING CRISIS extends** — P214 slot-order 124-129 LATEST in V4.1.0 (worse than P215 118-123); FK direction must be carefully audited.
4. **P215 coordination doc CREATE responsibility** — P215 plans (commit 9b153d2) say "P215 first to CREATE V4.1.0-MIGRATION-SLOT-COORDINATION.md" but P214 executes BEFORE P215. Cross-phase responsibility re-assignment needed.

## Specific Questions for Plan Author

1. Same stub-state as P215-P220 — intentional defer or expansion?
2. Plan 06 SG-01 — translation_gate_for or extension_point_for or both?
3. Plan 01 PRC-09 — integrates_with P205 (per Pricing Engine Canon)?
4. RUN-01..08 + TASK-01..05 in Plans 03/05 — integrates_with P207?
5. Slot allocation — 124-129 (Option A; Q-7 crisis extends) accepted?
6. F-IDs F-287..F-300 (14 IDs) — acceptable range?
7. Compliance enforcement — DB-trigger per domain (5 active-schema + activation gate)?
8. Subscription lifecycle — 8 states confirmed; explicit transition table needed?
9. CRM bridge — `saas_customer_bridges` table OR ADD COLUMN to CRM customers/accounts/companies?
10. Coordination doc CREATE responsibility — P214 (first execution) OR P215 (first in slot space)?
11. Plan 06 autonomous — true (UI/handoff only) per P215+P216+P217 P06 pattern?
12. Activation wizard — operator-driven (per DISCUSS recommended) vs admin-flag-only?

---

## Consensus Summary

> Single-reviewer (Claude under user override). Codex blocked until 2026-05-02.

### Top concern (HIGH)

1. **Plans are STUBS** — same as P215-P220. Path: `/gsd-plan-phase 214 --research`.

### MEDIUM (9)

2. No upstream-gate preflight (P205/P207/P208)
3. No architecture-lock
4. Compliance enforcement undefined (5 active-schema DB-triggers + activation gate trigger)
5. Plan 06 SG-01 ownership ambiguous (translation_gate_for + extension_point_for P218)
6. Plan 01 PRC-09 ownership (integrates_with P205)
7. RUN-01..08 + TASK-01..05 ownership (integrates_with P207)
8. No F-ID + migration slot allocation (slots 124-129, F-287..F-300; Q-7 crisis extends)
9. Subscription lifecycle state machine unspecified (8 states; explicit transition table needed)
10. CRM bridge model unspecified (saas_customer_bridges table recommended)

### LOW (1)

11. DISCUSS Decision matrix missing migration slot decision (Q-7 crisis defer to RESEARCH)

### Suggested next move

`/gsd-plan-phase 214 --research`. Apply P215-P220 lessons:
- Wave 0.5 architecture-lock + assertUpstreamReady (P205/P207/P208 HARD)
- 5 active-schema DB-triggers + activation gate + Pricing Engine sentinel
- F-IDs F-287..F-300 + slots 124-129
- Cross-phase ownership flips (PRC-09 → P205; SG-01 → translation_gate_for + extension_point_for P218; RUN-01..08 + TASK-01..05 → P207)
- Subscription lifecycle 8-state explicit transition table
- CRM bridge via `saas_customer_bridges` table (NOT ADD COLUMN)
- Activation wizard operator-driven (per DISCUSS recommended)
- Plan 06 autonomous=true (UI/handoff + extension point only)
- **Coordination doc CREATE responsibility:** P214 Plan 01 Task 0.1 CREATEs V4.1.0-MIGRATION-SLOT-COORDINATION.md (P214 = FIRST execution). P215 Plan 01 Task 0.1 (commit 9b153d2) needs amendment — change CREATE to APPEND. Cross-phase replan note for P215.

### Reviewer environment

- Reviewer: Claude (current runtime; user override)
- Independence rule: waived (consistent with P215-P224 posture)
- Files inspected: 214-CONTEXT.md (51 lines), 214-RESEARCH.md (65 lines), 214-{01..06}-PLAN.md (25-26 lines each), DISCUSS.md (48 lines)
- Cross-reference: P215+P216+P217+P218+P219+P220 review patterns

### Trust caveat

Single-reviewer (Claude). Re-run `/gsd-review --phase 214 --codex` 2026-05-02 — but more useful to first run `/gsd-plan-phase 214 --research`.

### Cross-phase impact note (CRITICAL)

**Sequencing:** P201+P205+P207+P208 → **P214 → P215 → P216 → P217 → P218 → P219+P220**.

**P214 ships:** saas_suite_activations + saas_profiles + saas_plans + saas_subscriptions + saas_subscription_events + saas_customer_bridges (Plan 04 — recommended) + lifecycle approval/audit substrate (Plan 05) + UI/API gate (Plan 06).

**Downstream consumers (entire v4.1.0 SaaS Suite):**
- P215 saas_invoices FK saas_subscriptions; saas_processor_configs FK saas_suite_activations
- P216 saas_health_scores reads saas_suite_activations (gate); reads saas_subscriptions (billing dimension)
- P217 SaaSMRRSnapshot reads saas_subscriptions (revenue calc); SaaS UI nav reads saas_suite_activations.active
- P218 saas_growth_profiles FK saas_suite_activations; mode profile depends on activation
- P219 RevenueTeamConfig + ABM modules read saas_suite_activations
- P220 referral/community/events/PR modules read saas_suite_activations

**P214 re-plan must land BEFORE P215 execute** (P215 plans HARD-depend on saas_suite_activations + saas_subscriptions). **P214 = FIRST execution in v4.1.0; P214 Plan 01 Task 0.1 CREATEs coordination doc; P215 Plan 01 Task 0.1 needs amendment to APPEND.**

**Q-7 SLOT ORDERING CRISIS extends to P214:**
- P214 execution-order FIRST in V4.1.0 (foundation; no upstream dependencies in V4.1.0 itself — only V4.0.0 P201/P205/P207/P208)
- P214 slot-order LATEST in V4.1.0 (124-129)
- FK direction strictly P215-P220 READ P214; zero reverse FKs from P214 INTO P215-P220
- Execution gating via assertUpstreamReady, not migration slot numbers
- Documented in coordination doc with full slot-order vs execution-order divergence map
