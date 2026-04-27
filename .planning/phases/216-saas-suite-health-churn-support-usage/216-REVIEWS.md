---
phase: 216
phase_name: saas-suite-health-churn-support-usage
reviewers: [claude-runtime-override]
reviewers_attempted: [codex, claude, gemini, opencode]
reviewers_skipped:
  - codex: usage limit reached (resets 2026-05-02 09:44 AM)
  - gemini: not installed
  - opencode: not installed
reviewer_note: |
  Claude (current runtime) per user override. Independence rule waived (consistent with P217-P224 posture).
reviewed_at: 2026-04-26
plans_reviewed:
  - 216-01-PLAN.md
  - 216-02-PLAN.md
  - 216-03-PLAN.md
  - 216-04-PLAN.md
  - 216-05-PLAN.md
  - 216-06-PLAN.md
overall_risk: BLOCKED
high_concerns: 1
medium_concerns: 9
low_concerns: 1
---

# Cross-AI Plan Review — Phase 216

> **Single-reviewer caveat (override):** Codex usage limit. Claude runtime review.

> **CRITICAL FINDING:** Plans are STUBS (25 lines each). Same shape as P217+P218+P219+P220. Recommend `/gsd-plan-phase 216 --research`.

---

## Claude Review

# Claude Review — Phase 216

## Summary

Phase 216 (SaaS Health + Churn + Support + Product Usage Intelligence) is **same stub pattern as P217+P218+P219+P220**. 6 plans @ 25 lines each. CONTEXT 46 lines (rich, with 5 non-negotiables + 6-step required phase shape). RESEARCH 66 lines (with 2026-04-23 codebase addendum documenting CRM substrate + gaps + recommendation). DISCUSS 47 lines (with Decision matrix table — better DISCUSS than P217-P220).

Plans themselves still scope-only. NO frontmatter / tasks / code refs / F-IDs / migrations / tests / contracts.

Apply identical recovery as P217+P218+P219+P220: `/gsd-plan-phase 216 --research`.

**P216 specifics distinct from P217-P220:**
- 6 domains: SaaSHealthScore + explainability, ProductUsage event ingest + PLG signal map, SaaSSupportTicket + KB grounding + classification, ChurnIntervention playbooks + tasks, Privacy + retention controls, Growth handoff signals (planned-only)
- **Connector dependency** — P216 ingests product analytics (PostHog/Segment/generic) + support tickets (Intercom/Zendesk/HelpScout/HubSpot/generic). Connector substrate per ROADMAP `Depends on: 207, 208, 209, 210, 214`. P210 = connector substrate. CONN-01..06 in ROADMAP requirements.
- **Plan 06 SG-02/03/07/09/10 ownership ambiguous** — these are P218/P219/P220 territory; should be `translation_gate_for: [P218, P219, P220]` (mirror P217 fix)
- **Plan 04 TASK-01..05 ownership** — verify; TASK-01..05 likely owned upstream phase or shared with P207 (CRM)
- **Plan 01 EVD-01..06 ownership** — verify; EVD substrate likely owned by P209 (evidence); P216 should `integrates_with: P209`
- **SAS-09 in Plan 01 + ROADMAP** — Conflict with P217. P217 owns SAS-09 (revenue intelligence + MRR/NRR/expansion). P216 SAS-09 likely refers to "exposes signals for revenue intelligence" — must clarify ownership boundary OR remove SAS-09 from P216 plans (use `integrates_with: P217`)
- **Privacy/retention (Plan 05)** — sensitive support text + product usage data; needs PII classification + retention policy + redaction; this is FOUNDATIONAL for downstream phases (P217-P228 all touch CRM/customer data)
- **Connector decision (DISCUSS)** — generic event ingest first vs PostHog-first. Research should resolve before plan ships F-IDs.

## Strengths

- **CONTEXT 5 non-negotiables explicit:** safe support response review, Pricing Engine save offers, no-black-box health score, dashboard-must-create-tasks, planned-only growth modules
- **DISCUSS Decision matrix (rare!) — has 6 explicit decisions with options + recommended defaults** (health score weights, product analytics connector, support systems, response autonomy, churn interventions, growth handoff). Better than P217-P220 DISCUSS.
- **RESEARCH codebase addendum** documents CRM substrate (already-computed stalled work, success risk, overdue tasks, ownership gaps, recommendations) + gaps + recommendation
- **DISCUSS Acceptance Gate** has 6 measurable conditions for Done
- **Plan 04 explicit "Save offers + discounts require Pricing Engine context and approval"** — sound doctrinal posture (matches Pricing Engine Canon)
- **Plan 06 explicit non-runnable agent registry for growth modules** — matches P217-P220 pattern

## Concerns

### HIGH (1)

- `HIGH` — **Plans are STUBS, not executable** (same as P217 H1 / P218 H1 / P219 H1 / P220 H1). 25 lines each. NO frontmatter (wave/depends_on/files_modified/autonomous/requirements). NO tasks (read_first/action/acceptance_criteria). NO code refs. NO F-IDs. NO migration slots. NO test files. NO connector contracts. NO health score formula schema. **Cannot pass `gsd-plan-checker`; cannot execute via `/gsd-execute-phase`.**
  - **Fix:** `/gsd-plan-phase 216 --research`. Mirror P217+P218+P219+P220 successful recovery.

### MEDIUM (9)

- `MEDIUM` — **No upstream-gate preflight for P207-P210, P214** (5 prereqs). ROADMAP says "Depends on: Phases 207, 208, 209, 210, 214". None landed. Same A-N pattern P226 RH8 / P217 RM2 / P218 RM2.
  - **Fix:** Plan 01 Task 0.5 ships `scripts/preconditions/216-check-upstream.cjs` REQUIRED_UPSTREAM = [P207, P208, P209, P210, P214] HARD; SOFT [P205, P211-P213].

- `MEDIUM` — **No architecture-lock**. Plans don't pin: legacy `api/*.js`; `requireHostedSupabaseAuth`; `npm test`; `contracts/openapi.json`; `mcp/tools/index.cjs`; `buildApprovalPackage`; `resolvePlugin`. Same as P217-P220.
  - **Fix:** Plan 01 Task 0.5 architecture-lock + forbidden-pattern detector.

- `MEDIUM` — **Compliance enforcement boundary undefined per domain**. CONTEXT non-negotiables: "No customer-facing support response without CS review unless safe auto-response configured" (Plan 03), "No save offer/discount/retention without Pricing Engine context + approval" (Plan 04), "No black-box health score" (Plan 01), "No product usage dashboard that doesn't create tasks/alerts/recommendations" (Plan 02). All cited but no DB-trigger pinned. P226 RH5/RH6 + P217-P220 RM4 lessons all showed app-only enforcement bypassable.
  - **Fix:** Plans must specify DB-trigger exception names per domain:
    - Plan 01: `HEALTH_SCORE_REQUIRES_RAW_FACTS` (insert without raw_facts JSONB or weights = block)
    - Plan 02: `PRODUCT_USAGE_INGEST_REQUIRES_TENANT_AUTH` (event row insert without tenant_id + connector_id = block)
    - Plan 03: `SUPPORT_RESPONSE_REQUIRES_CS_APPROVAL_OR_SAFE_AUTO_FLAG` (response dispatch without approval_id AND without safe_auto_flag = block)
    - Plan 04: `CHURN_SAVE_OFFER_REQUIRES_PRICING_AND_APPROVAL` (offer activation without pricing_recommendation_id OR sentinel + approval = block; mirror P218/P219 pricing trigger pattern)
    - Plan 05: `SUPPORT_DATA_REQUIRES_RETENTION_POLICY` (PII insert without retention_class + retention_until = block)
    - Plan 06: NOT a DB-trigger (translation gate is regression test — see Plan 06 fix below)

- `MEDIUM` — **Plan 06 SG-02/03/07/09/10 ownership ambiguous (mirror P217 Plan 06 issue)**. Stub Plan 06 lists SG-02/03/07/09/10 in requirements field. SG-02/05 = P218 (PLG); SG-03 = P219 (account expansion); SG-07 = P218 (experiments); SG-09 = P218/P219/P220 (every-domain task creation); SG-10 = P218/P219/P220 P06 (agent registries). P216 Plan 06 documents post-216 GROWTH HANDOFF but does NOT activate growth modules.
  - **Fix:** Plan 06 frontmatter: `requirements: [QA-01..15]`; add `translation_gate_for: [P218, P219, P220]`; add `integrates_with: [SG-02, SG-03, SG-07, SG-09, SG-10 from P218/P219/P220]` (or list explicit FK-readers).

- `MEDIUM` — **SAS-09 ownership conflict with P217**. Stub Plan 01 lists SAS-09 in requirements. P217 Plan 01 OWNS SAS-09 (revenue intelligence definitions per commit 0354dcf). P216 EXPOSES signals (health/churn/support/usage) that SAS-09 metrics CONSUME — does not own SAS-09 definitions.
  - **Fix:** Plan 01 frontmatter: `requirements: [SAS-07, EVD-01..06, QA-01..15]`; add `integrates_with: [SAS-09 from P217]` (P217 reads health_scores via signal map).

- `MEDIUM` — **EVD-01..06 ownership in Plan 01**. EVD-01..06 = evidence substrate. REQUIREMENTS.md likely maps EVD-01..06 to P209 (evidence). P216 Plan 01 RECORDS evidence for health-score raw facts — INTEGRATES not OWNS.
  - **Fix:** Verify against REQUIREMENTS.md table. If P209 owns EVD-01..06, flip Plan 01 to `integrates_with: [EVD-01..06 from P209]`. P216 own remains: SAS-07.

- `MEDIUM` — **TASK-01..05 ownership in Plan 04**. TASK-01..05 = task substrate. Likely owned by P207 (CRM tasks).
  - **Fix:** Verify; flip to `integrates_with: [TASK-01..05 from P207]` if P207 owns.

- `MEDIUM` — **No F-ID + migration slot allocation; SLOT ORDERING CRISIS**. Same as P217-P220 RM6/RM7. P216 needs slots BEFORE P217 (98+99) numerically — but **all slots 90-99 already claimed** (P220 90-95+97; foundation 96; P217 98-99). **No free pre-P217 slots.** Options:
  - **Option A (recommended):** P216 = slots 112-117 (post-P219 107-111). Sacrifices numerical ordering but unblocks. Document in coordination doc as "P216 plans LATER than P217 in slot space due to upstream collision; execution-order P216 → P217 unaffected (migrations applied in slot order; P216 slot 112 applies AFTER P217 slot 98 but before P218/P219 slot 101+/107+ data dependencies; **CRITICAL: verify P216 schema doesn't have FKs INTO P217 saas_revenue_metric_definitions**).
  - **Option B:** P216 = slots 113-118 (post-P219 + P220 P06 slot 112 if P220 takes it). Requires P220 slot reservation review.
  - **Option C (cleanest, requires cross-phase rewrite):** RENUMBER all reservations. P216 first (slots 90-95), P217 next (96-99), then P220+P218+P219 push up. Major surgery — NOT recommended for V4.1.0.
  - **Decision:** Use Option A; document execution-order independence + FK direction (P216 health_scores read by P217 metrics, not P217 metrics read by P216 — verify in research).

- `MEDIUM` — **Plan 02 + Plan 03 connector decision unresolved**. DISCUSS lists 4 product analytics options + 5 support system options. Research must produce concrete connector list (generic-first per recommendation) before plans ship F-IDs.
  - **Fix:** Research must enumerate connector contracts: F-IDs for `product-event-ingest-generic-v1` + `support-ticket-import-generic-v1` + connector adapter pattern (P210 dependency).

### LOW (1)

- `LOW` — **DISCUSS Decision matrix is good, but missing migration slot decision** (now revealed as a CRITICAL ordering issue). Acceptable scoring.

## Suggestions

- **Run `/gsd-plan-phase 216 --research`**.
- **Cross-phase ownership flips:** SAS-09 → integrates_with P217; EVD-01..06 → integrates_with P209; TASK-01..05 → integrates_with P207; SG-02/03/07/09/10 → translation_gate_for [P218/P219/P220].
- **Slot ordering:** Use Option A (slots 112-117 post-P219); document FK direction (P216 → P217 read, not reverse) so execution order P216-then-P217 still works despite slot-number reversal.
- **Apply P217-P220 lessons:** architecture-lock + assertUpstreamReady (HARD P207/P208/P209/P210/P214) + DB-trigger compliance per domain (5 triggers — see Plan-Author Q-3) + F-ID/migration slot pre-allocation + Plan 06 autonomous-true (UI/handoff only; no agent activation).
- **Connector decision:** generic-first per DISCUSS recommendation; adapter pattern via P210 substrate; specific connectors deferred to v4.2.0.
- **Privacy/retention (Plan 05) FOUNDATIONAL:** PII classification + retention_class enum + retention_until column on every PII-containing table; downstream P217-P228 phases will need to reference. Add `INTEGRATES_BY: [P217, P218, P219, P220, P221, P222, P223, P224, P225, P226, P227, P228]` documentation.
- **F-ID range:** P216 needs IDs avoiding P220 (F-209..F-227), P219 (F-228..F-237), P218 (F-238..F-246), P217 (F-247..F-258). Recommended P216 = F-259..F-270 (12 IDs).
- **DISCUSS Decision matrix should be promoted to RESEARCH §Decisions Locked** with concrete locked-in defaults before planning.

## Risk Assessment

**Overall: BLOCKED**

Same as P217+P218+P219+P220 — plans are stubs. Cannot review architecturally. Recovery: re-research + re-plan via `/gsd-plan-phase 216 --research`.

**Mitigating:** stubs have stronger CONTEXT/RESEARCH/DISCUSS than P217-P220 (Decision matrix + Acceptance Gate + 5 non-negotiables). Easy to expand.

**Aggravating:** SLOT ORDERING CRISIS — P216 is upstream of P217 in execution order but NO free slots remain pre-P217 (all 90-99 occupied). Forces P216 = slots 112-117 (post-P219). Execution-order vs slot-number divergence requires careful FK-direction audit (P216 → P217 reads only; no reverse FKs from P216 into P217 tables).

## Specific Questions for Plan Author

1. Same stub-state as P217+P218+P219+P220 — intentional defer or expansion?
2. Connector decision (Plan 02 + Plan 03) — generic-first per DISCUSS recommendation, or PostHog/Intercom-first?
3. Plan 01 SAS-09 — own (conflict with P217) or integrates_with P217?
4. Plan 01 EVD-01..06 — own (conflict with P209) or integrates_with P209?
5. Plan 04 TASK-01..05 — own (conflict with P207) or integrates_with P207?
6. Plan 06 SG-02/03/07/09/10 — translation_gate_for or integrates_with?
7. Slot allocation — Option A (slots 112-117 post-P219) accepted, or Option C (renumber all)?
8. Plan 05 privacy/retention — PII classification ENUM column or separate `data_classifications` table?
9. Compliance enforcement — DB-trigger per domain (5 triggers per Plan-Author Q-3 fix)?
10. F-IDs F-259..F-270 acceptable, or different range?

---

## Consensus Summary

> Single-reviewer (Claude under user override). Codex blocked until 2026-05-02.

### Top concern (HIGH)

1. **Plans are STUBS** — same as P217+P218+P219+P220. Path: `/gsd-plan-phase 216 --research`.

### MEDIUM (9)

2. No upstream-gate preflight (P207/P208/P209/P210/P214)
3. No architecture-lock
4. Compliance enforcement undefined (5 DB-triggers needed: HEALTH_SCORE_REQUIRES_RAW_FACTS / PRODUCT_USAGE_INGEST_REQUIRES_TENANT_AUTH / SUPPORT_RESPONSE_REQUIRES_CS_APPROVAL_OR_SAFE_AUTO_FLAG / CHURN_SAVE_OFFER_REQUIRES_PRICING_AND_APPROVAL / SUPPORT_DATA_REQUIRES_RETENTION_POLICY)
5. Plan 06 SG-02/03/07/09/10 ownership ambiguous (P218-P220 territory; flip to translation_gate_for)
6. Plan 01 SAS-09 ownership conflict with P217 (flip to integrates_with)
7. Plan 01 EVD-01..06 ownership unclear (likely P209 owns; flip to integrates_with)
8. Plan 04 TASK-01..05 ownership unclear (likely P207 owns; flip to integrates_with)
9. **Slot ordering CRISIS** — no free pre-P217 slots; P216 = slots 112-117 post-P219 (Option A); document FK-direction
10. Plan 02 + Plan 03 connector decision unresolved (generic-first per DISCUSS recommended)

### LOW (1)

11. DISCUSS Decision matrix missing migration slot decision (now revealed as critical ordering issue)

### Suggested next move

`/gsd-plan-phase 216 --research`. Apply lessons:
- Wave 0.5 architecture-lock + assertUpstreamReady (P207/P208/P209/P210/P214 HARD)
- 5 DB-trigger compliance per domain
- F-IDs F-259..F-270 + migration slots 112-117 (Option A)
- Cross-phase ownership flips (SAS-09 → P217; EVD-01..06 → P209; TASK-01..05 → P207; SG-02/03/07/09/10 → translation_gate_for)
- Connector adapter pattern (P210 dependency); generic-first per DISCUSS
- Privacy/retention FOUNDATIONAL (Plan 05) — PII classification ENUM + retention_class + retention_until
- Plan 06 autonomous=true (UI/handoff only, no agent activation; mirror P217 P06)
- Append V4.1.0-MIGRATION-SLOT-COORDINATION.md (P217 Plan 01 Task 0.1 creates; P216 Plan 01 Task 0.1 appends)

### Reviewer environment

- Reviewer: Claude (current runtime; user override)
- Independence rule: waived (consistent with P217-P224 posture)
- Files inspected: 216-CONTEXT.md (46 lines), 216-RESEARCH.md (66 lines), 216-{01..06}-PLAN.md (25 lines each), DISCUSS.md (47 lines)
- Cross-reference: P217+P218+P219+P220 review patterns

### Trust caveat

Single-reviewer (Claude). Re-run `/gsd-review --phase 216 --codex` 2026-05-02 — but more useful to first run `/gsd-plan-phase 216 --research`.

### Cross-phase impact note (CRITICAL)

**Sequencing:** P207-P210+P214 → **P216** → **P217** → P218 → P219+P220. P216 health/churn/support/usage signals feed P217 revenue intelligence (SAS-09) + downstream P218 PLG/PQL signals + P219 expansion signals + P220 community-health signals.

**Slot ordering crisis:** P216 plans must use slots 112-117 (post-P219). Execution order P216 BEFORE P217 still holds (Supabase migrations run in slot order; P216 slot 112+ migrations apply AFTER P217 slot 98+99 — but P216 introduces health_scores table that P217 metrics read; **VERIFY in research that P216 has no FK INTO P217 tables** so out-of-order slot apply works).

P216 re-plan must land BEFORE P217 execute since P217 plans HARD-depend on P216 saas_health_scores per assertUpstreamReady.
