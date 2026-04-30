---
phase: 208
slug: human-operating-interface
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-27
ui_spec_fold: 2026-04-29
ui_spec_acs_total: 89
ui_spec_acs_per_surface:
  S: 10  # Shell (208-01)
  B: 16  # Morning Brief (208-02)
  T: 17  # Task Board (208-03)
  A: 19  # Approval Inbox (208-04)
  R: 14  # Recovery Center (208-05)
  N: 13  # Weekly Narrative (208-06)
  X: 10  # Cross-cutting carry-forward (gates 208-01 + 208-06 final wave)
---

# Phase 208 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
>
> **2026-04-29 UI-SPEC fold:** 76 UI-SPEC ACs across 6 surfaces (S/B/T/A/R/N) + 10 cross-cutting carry-forward ACs (X) = 89 total verification gates folded into Plans 208-01..208-06. Each AC has a verbatim grep / test / Storybook command. The cross-cutting X axis is wired as a Wave-1 tripwire (208-01-00) AND a final-wave closure test (208-06-03).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node `--test` |
| **Config file** | none - uses the built-in Node runner |
| **Quick run command** | `npm test -- test/operator-cockpit/phase-208/preflight/` |
| **Full suite command** | `npm test -- test/operator-cockpit/phase-208/` |
| **Estimated runtime** | ~30-60s |
| **Storybook build** | `npm run build-storybook` (~25s; verifies all 4 new + 1 extended *.stories.tsx) |

---

## Sampling Rate

- **After every task commit:** Run the plan-specific domain suite, or `npm test -- test/operator-cockpit/phase-208/preflight/` for Wave 0.5 work.
- **After every plan wave:** Run `npm test -- test/operator-cockpit/phase-208/`.
- **Before `/gsd-verify-work`:** Full suite must be green AND `npm run build-storybook` must succeed AND Chromatic visual baselines captured for 23 new state stories.
- **Max feedback latency:** ~60s

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | UI-SPEC ACs covered | Status |
|---------|------|------|-------------|-----------|-------------------|---------------------|--------|
| 208-01-00 | 01 | 1 | QA-01, QA-02, QA-03 | preflight + cross-cutting X-axis tripwire | `npm test -- test/operator-cockpit/phase-208/preflight/cross-cutting-x-axis.test.js` | X-1..X-10 (Wave-1 tripwire) | pending |
| 208-01-01 | 01 | 1 | QA-01, QA-02 | preflight + architecture-lock + shell-baseline | `npm test -- test/operator-cockpit/phase-208/preflight/` | S-8 (architecture-lock forbidden strings) | pending |
| 208-01-02 | 01 | 1 | TASK-05 | shell-route-contract + Surface-A UI-SPEC fold | `npm test -- test/operator-cockpit/phase-208/domain-1/` | S-1, S-2, S-3, S-4, S-5, S-6, S-7, S-9, S-10 | pending |
| 208-02-00 | 02 | 2 | TASK-02 | UI-SPEC §Surface B fold preflight | `node -e "require('node:fs').readFileSync('test/operator-cockpit/phase-208/domain-2/morning-brief-ui-spec.test.js')"` | B-1..B-16 (harness creation) | pending |
| 208-02-01 | 02 | 2 | TASK-02 | morning-brief-contract + assembler | `npm test -- test/operator-cockpit/phase-208/domain-2/brief-sections.test.js test/operator-cockpit/phase-208/domain-2/empty-states.test.js` | B-5, B-6, B-7, B-10 (data + sentinel) | pending |
| 208-02-02 | 02 | 2 | TASK-02, QA-05, QA-06 | Morning Brief UI render | `npm test -- test/operator-cockpit/phase-208/domain-2/morning-brief-ui-spec.test.js` | B-1, B-2, B-3, B-4, B-8, B-9, B-11, B-12, B-13, B-14, B-15, B-16 | pending |
| 208-03-00 | 03 | 3 | TASK-03 | UI-SPEC §Surface C fold preflight | `node -e "require('node:fs').readFileSync('test/operator-cockpit/phase-208/domain-3/task-board-ui-spec.test.js')"` | T-1..T-17 (harness creation) | pending |
| 208-03-01 | 03 | 3 | TASK-01, TASK-03 | task-board-contract + 207 collapse maps | `npm test -- test/operator-cockpit/phase-208/domain-3/task-record.test.js test/operator-cockpit/phase-208/domain-3/grouping-state.test.js` | T-3, T-4, T-5, T-6, T-7 (data + collapse) | pending |
| 208-03-02 | 03 | 3 | TASK-03, QA-07, QA-08 | Task Board UI render | `npm test -- test/operator-cockpit/phase-208/domain-3/task-board-ui-spec.test.js` | T-1, T-2, T-8, T-9, T-10, T-11, T-12, T-13, T-14, T-15, T-16, T-17 | pending |
| 208-04-00 | 04 | 4 | TASK-04 | UI-SPEC §Surface D fold preflight | `node -e "require('node:fs').readFileSync('test/operator-cockpit/phase-208/domain-4/approval-inbox-ui-spec.test.js')"` | A-1..A-19 (harness creation) | pending |
| 208-04-01 | 04 | 4 | TASK-04 | approval-inbox-contract + 206 mutation-class doctrine | `npm test -- test/operator-cockpit/phase-208/domain-4/approval-item.test.js test/operator-cockpit/phase-208/domain-4/blocker-states.test.js` | A-3, A-4, A-5, A-6 (data + 206 mapping) | pending |
| 208-04-02 | 04 | 4 | TASK-04, QA-09, QA-10 | Approval Inbox UI render | `npm test -- test/operator-cockpit/phase-208/domain-4/approval-inbox-ui-spec.test.js` | A-1, A-2, A-7, A-8, A-9, A-10, A-11, A-12, A-13, A-14, A-15, A-16, A-17, A-18, A-19 | pending |
| 208-05-00 | 05 | 5 | TASK-01 | UI-SPEC §Surface E fold preflight | `node -e "require('node:fs').readFileSync('test/operator-cockpit/phase-208/domain-5/recovery-center-ui-spec.test.js')"` | R-1..R-14 (harness creation) | pending |
| 208-05-01 | 05 | 5 | TASK-01 | recovery-center-contract + 207 AgentFailureClass mapping | `npm test -- test/operator-cockpit/phase-208/domain-5/recovery-item.test.js test/operator-cockpit/phase-208/domain-5/impacted-work.test.js` | R-3, R-4, R-5 (data + AgentFailureClass) | pending |
| 208-05-02 | 05 | 5 | TASK-01, QA-11, QA-12 | Recovery Center UI render | `npm test -- test/operator-cockpit/phase-208/domain-5/recovery-center-ui-spec.test.js` | R-1, R-2, R-6, R-7, R-8, R-9, R-10, R-11, R-12, R-13, R-14 | pending |
| 208-06-00 | 06 | 6 | TASK-02, TASK-05 | UI-SPEC §Surface F fold preflight | `node -e "require('node:fs').readFileSync('test/operator-cockpit/phase-208/domain-6/weekly-narrative-ui-spec.test.js')"` | N-1..N-13 (harness creation) | pending |
| 208-06-01 | 06 | 6 | TASK-02, TASK-05, QA-13 | weekly-narrative-contract + UI render | `npm test -- test/operator-cockpit/phase-208/domain-6/weekly-narrative.test.js test/operator-cockpit/phase-208/domain-6/weekly-narrative-ui-spec.test.js` | N-1, N-2, N-3, N-4, N-5, N-6, N-7, N-8, N-9, N-11, N-12, N-13 | pending |
| 208-06-02 | 06 | 6 | QA-14, QA-15 | future-integration-boundaries doctrine | `npm test -- test/operator-cockpit/phase-208/domain-6/future-integrations.test.js` | N-10 | pending |
| 208-06-03 | 06 | 6 | QA-13, QA-14, QA-15 | **FINAL WAVE** cross-cutting X-1..X-10 closure across all 208 surface files | `npm test -- test/operator-cockpit/phase-208/wave-final/cross-cutting-x-axis-final.test.js` | X-1, X-2, X-3, X-4, X-5, X-6, X-7, X-8, X-9, X-10 (FINAL closure — no skip-soft) | pending |

---

## Wave 0 Requirements

- [ ] `.planning/operator-cockpit/208-upstream-readiness.md` - authoritative readiness checklist for Phases 205-207 with blocker ownership.
- [ ] `scripts/operator-cockpit/check-interface-upstream-readiness.mjs` - hard and soft preflight for pricing, compliance, and AgentRun substrate.
- [ ] `scripts/operator-cockpit/check-interface-architecture-lock.mjs` - forbidden-pattern detector for second-dashboard drift, desktop-only critical actions, and hidden future-phase assumptions.
- [ ] `scripts/operator-cockpit/assert-shell-baseline.mjs` - baseline validator for plan-to-validation coverage and shell doctrine assumptions (S-1, S-2, S-3, S-7).
- [ ] `test/operator-cockpit/phase-208/preflight/upstream-readiness.test.js`
- [ ] `test/operator-cockpit/phase-208/preflight/architecture-lock.test.js`
- [ ] `test/operator-cockpit/phase-208/preflight/shell-baseline.test.js`
- [ ] `test/operator-cockpit/phase-208/preflight/cross-cutting-x-axis.test.js` (Wave-1 tripwire — 208-01-00)

---

## UI-SPEC AC Coverage Map

> Single source of truth for the 89 UI-SPEC AC verification gates. Every row maps to a `<task>` in Plans 208-01..208-06.
>
> Verification command column is the verbatim grep / test / Storybook check from 208-UI-SPEC.md §Acceptance Criteria. Status column moves from `pending` → `verified` once the responsible task's automated test passes.

### S-* — Shell + Default Landing (Plan 208-01)

| AC | Surface | Plan | Task | Verification | Status |
|----|---------|------|------|--------------|--------|
| S-1 | layout-shell | 208-01 | 208-01-02 | `! grep -nE "#[0-9a-fA-F]{3,8}" app/(markos)/layout-shell.module.css` returns 0 | pending |
| S-2 | layout-shell | 208-01 | 208-01-02 | `grep -c "Operator cockpit" app/(markos)/layout-shell.tsx` >= 1 | pending |
| S-3 | NavList | 208-01 | 208-01-02 | `grep -c "Morning brief\|Approvals\|Tasks\|Recovery\|Narrative" app/(markos)/_components/NavList.tsx` >= 5 | pending |
| S-4 | shell.ts | 208-01 | 208-01-02 | `grep -c "surface_family\|mobile_priority\|placeholder_policy\|source_dependencies" lib/markos/operator/shell.ts` >= 4 | pending |
| S-5 | shell.ts | 208-01 | 208-01-02 | `grep -c "morning_brief\|task_board\|approval_inbox\|recovery_center\|weekly_narrative" lib/markos/operator/shell.ts` >= 5 | pending |
| S-6 | shell.ts | 208-01 | 208-01-02 | `grep -c "critical\|secondary\|desktop_only" lib/markos/operator/shell.ts` >= 3 AND `grep -nE "(morning_brief\|approval_inbox\|task_board)\b.*desktop_only" lib/markos/operator/shell.ts` returns 0 | pending |
| S-7 | landing | 208-01 | 208-01-02 | `grep -c "ENTITY_ORDER\|Phase 37 scaffold" app/(markos)/page.tsx` returns 0 | pending |
| S-8 | architecture-lock | 208-01 | 208-01-01 | `grep -c "second dashboard shell\|desktop-only approval\|future-phase data assumption\|hidden rejection reason" scripts/operator-cockpit/check-interface-architecture-lock.mjs` >= 4 | pending |
| S-9 | shell mobile | 208-01 | 208-01-02 | `grep -nE "@media \(pointer: coarse\)" styles/components.css` returns >=1 | pending |
| S-10 | shell focus | 208-01 | 208-01-02 | `grep -E "outline:\s*(none\|0)" app/(markos)/layout-shell.module.css` returns 0 | pending |

### B-* — Morning Brief (Plan 208-02)

| AC | Surface | Plan | Task | Verification | Status |
|----|---------|------|------|--------------|--------|
| B-1 | page | 208-02 | 208-02-02 | `! grep -nE "#[0-9a-fA-F]{3,8}" app/(markos)/page.module.css` returns 0 | pending |
| B-2 | page | 208-02 | 208-02-02 | `grep -c "Morning brief" app/(markos)/page.tsx` >= 1 AND `grep -c "t-lead" app/(markos)/page.tsx` >= 1 | pending |
| B-3 | page | 208-02 | 208-02-02 | `grep -c "urgent_approvals\|run_failures\|pricing_risks\|compliance_alerts\|top_opportunities\|recent_wins\|future_evidence_placeholder\|future_recovery_placeholder" app/(markos)/page.tsx` >= 8 | pending |
| B-4 | page | 208-02 | 208-02-02 | `grep -c "PlaceholderBanner.*future_phase_209\|PlaceholderBanner.*future_phase_210" app/(markos)/page.tsx` >= 2 | pending |
| B-5 | page | 208-02 | 208-02-01 | `grep -c "urgency\|next_action_type\|upstream_dependency\|placeholder_state" lib/markos/operator/morning-brief.ts` >= 4 | pending |
| B-6 | page | 208-02 | 208-02-01 | `grep -c "urgent_approvals\|run_failures\|pricing_risks\|compliance_alerts\|top_opportunities\|recent_wins" lib/markos/operator/morning-brief.ts` >= 6 | pending |
| B-7 | page | 208-02 | 208-02-01 | `grep -c "waiting_phase_209\|waiting_phase_210\|waiting_phase_211" lib/markos/operator/morning-brief.ts` >= 3 | pending |
| B-8 | page | 208-02 | 208-02-02 | `grep -c "c-card[^-]\|owner_role\|owner_id" app/(markos)/page.tsx` >= 4 AND `grep -c "c-card--feature" app/(markos)/page.tsx` returns 0 | pending |
| B-9 | page | 208-02 | 208-02-02 | `grep -c "c-badge" app/(markos)/page.tsx` >= 6 | pending |
| B-10 | page | 208-02 | 208-02-02 | `grep -c "MARKOS_PRICING_ENGINE_PENDING\|billing_placeholder" app/(markos)/page.tsx` >= 1 | pending |
| B-11 | page | 208-02 | 208-02-02 | `grep -c "c-button--tertiary\|c-chip-protocol" app/(markos)/page.tsx` >= 2 | pending |
| B-12 | page | 208-02 | 208-02-02 | `grep -c "\[ok\]\|\[warn\]\|\[err\]\|\[info\]" app/(markos)/page.tsx` >= 8 | pending |
| B-13 | page | 208-02 | 208-02-02 | `grep -c "prefers-reduced-motion" app/(markos)/page.module.css` >= 1 | pending |
| B-14 | page | 208-02 | 208-02-02 | `! grep -nE "synergy\|leverage\|empower\|unlock\|transform" app/(markos)/page.tsx` returns 0 | pending |
| B-15 | page | 208-02 | 208-02-02 | manual + Storybook viewport check (iPhone 14 Pro `max-width: 640px`) | pending |
| B-16 | page | 208-02 | 208-02-02 | `grep -c "Default\|EmptyAcrossSections\|UrgentBacklog\|PlaceholderHeavy" app/(markos)/page.stories.tsx` >= 4 | pending |

### T-* — Task Board (Plan 208-03)

| AC | Surface | Plan | Task | Verification | Status |
|----|---------|------|------|--------------|--------|
| T-1 | tasks/page | 208-03 | 208-03-02 | `! grep -nE "#[0-9a-fA-F]{3,8}" app/(markos)/operations/tasks/task-ui.module.css` returns 0 | pending |
| T-2 | tasks/page | 208-03 | 208-03-02 | `grep -c "Task board" app/(markos)/operations/tasks/page.tsx` >= 1 | pending |
| T-3 | tasks/page | 208-03 | 208-03-01 | `grep -c "approval_required\|evidence_status\|agent_run_id\|chain_id\|pricing_context_ref\|blocked_by" lib/markos/operator/task-board.ts` >= 6 | pending |
| T-4 | tasks/page | 208-03 | 208-03-01 | `grep -c "urgent\|high\|normal\|low" lib/markos/operator/task-board.ts` >= 4 | pending |
| T-5 | tasks/page | 208-03 | 208-03-01 | `grep -c "queued\|in_progress\|blocked\|awaiting_approval\|done" lib/markos/operator/task-board.ts` >= 5 | pending |
| T-6 | tasks/page | 208-03 | 208-03-01 | `grep -c "requested\|context_loaded\|executing\|awaiting_approval\|approved\|rejected\|paused\|retry_wait\|failed\|canceled\|dlq\|completed\|archived" lib/markos/operator/task-board.ts` >= 13 | pending |
| T-7 | tasks/page | 208-03 | 208-03-01 | `grep -c "P0\|P1\|P2\|P3\|P4" lib/markos/operator/task-board.ts` >= 5 | pending |
| T-8 | tasks/page | 208-03 | 208-03-02 | `grep -c "cli\|ui\|mcp\|webhook\|cron\|chain\|system" app/(markos)/operations/tasks/page.tsx` >= 7 | pending |
| T-9 | tasks/page | 208-03 | 208-03-02 | `grep -c "c-badge\|c-status-dot--live" app/(markos)/operations/tasks/page.tsx` >= 5 | pending |
| T-10 | tasks/page | 208-03 | 208-03-02 | `grep -c "c-table" app/(markos)/operations/tasks/page.tsx` returns 0 AND `grep -c "<table\|<tr\|<th\|<td" app/(markos)/operations/tasks/page.tsx` >= 4 | pending |
| T-11 | tasks/page | 208-03 | 208-03-02 | `grep -c "c-button--destructive\|c-modal" app/(markos)/operations/tasks/page.tsx` >= 2 | pending |
| T-12 | tasks/page | 208-03 | 208-03-02 | `grep -c "c-button--primary" app/(markos)/operations/tasks/page.tsx` <= 1 | pending |
| T-13 | tasks/page | 208-03 | 208-03-02 | `grep -c "\[ok\]\|\[warn\]\|\[err\]\|\[info\]" app/(markos)/operations/tasks/page.tsx` >= 5 | pending |
| T-14 | tasks/page | 208-03 | 208-03-02 | `grep -c "c-chip-protocol\|c-button--tertiary" app/(markos)/operations/tasks/page.tsx` >= 2 | pending |
| T-15 | tasks/page | 208-03 | 208-03-02 | `grep -c "prefers-reduced-motion" app/(markos)/operations/tasks/task-ui.module.css` >= 1 | pending |
| T-16 | tasks/page | 208-03 | 208-03-02 | `! grep -nE "synergy\|leverage\|empower\|unlock\|transform" app/(markos)/operations/tasks/page.tsx` returns 0 | pending |
| T-17 | tasks/page | 208-03 | 208-03-02 | `grep -c "BoardEmpty\|BoardSinglePriority\|BoardCrossPriority\|BoardWithBlocker" app/(markos)/operations/tasks/tasks.stories.tsx` >= 4 | pending |

### A-* — Approval Inbox (Plan 208-04)

| AC | Surface | Plan | Task | Verification | Status |
|----|---------|------|------|--------------|--------|
| A-1 | approvals/page | 208-04 | 208-04-02 | `! grep -nE "#[0-9a-fA-F]{3,8}" app/(markos)/operations/approvals/page.module.css` returns 0 | pending |
| A-2 | approvals/page | 208-04 | 208-04-02 | `grep -c "Approvals" app/(markos)/operations/approvals/page.tsx` >= 1 | pending |
| A-3 | approvals.ts | 208-04 | 208-04-01 | `grep -c "compliance_status\|pricing_status\|evidence_status\|cost_estimate_ref\|rejection_reason_required" lib/markos/operator/approvals.ts` >= 5 | pending |
| A-4 | approvals.ts | 208-04 | 208-04-01 | `grep -c "content_publish\|crm_mutation\|price_change\|connector_action_placeholder" lib/markos/operator/approvals.ts` >= 4 | pending |
| A-5 | approvals.ts | 208-04 | 208-04-01 | `grep -c "not_required\|waiting_phase_209\|ready\|blocked" lib/markos/operator/approvals.ts` >= 4 | pending |
| A-6 | approvals.ts | 208-04 | 208-04-01 | `grep -c "external\.send\|billing\.charge\|connector\.mutate\|price\.change\|public\.claim\|data\.export" lib/markos/operator/approvals.ts` >= 6 | pending |
| A-7 | approvals/page | 208-04 | 208-04-02 | `grep -c "handoff_kind\|approval\b\|recovery\|follow_up\|manual_input" app/(markos)/operations/approvals/page.tsx` >= 4 | pending |
| A-8 | approvals/page | 208-04 | 208-04-02 | `grep -c "c-button--primary\|c-button--destructive\|c-modal\|c-input" app/(markos)/operations/approvals/page.tsx` >= 4 | pending |
| A-9 | approvals/page | 208-04 | 208-04-02 | `grep -c "dual_approval\|Second approval required" app/(markos)/operations/approvals/page.tsx` >= 1 | pending |
| A-10 | approvals/page | 208-04 | 208-04-02 | `grep -c "autonomy_ceiling\|Autonomy ceiling reached" app/(markos)/operations/approvals/page.tsx` >= 1 | pending |
| A-11 | approvals/page | 208-04 | 208-04-02 | `grep -c "future_phase_209\|waiting_phase_209" app/(markos)/operations/approvals/page.tsx` >= 1 | pending |
| A-12 | approvals/page | 208-04 | 208-04-02 | `grep -c "Money\|estimated_cost_usd_micro\|MARKOS_PRICING_ENGINE_PENDING" app/(markos)/operations/approvals/page.tsx` >= 2 | pending |
| A-13 | approvals/page | 208-04 | 208-04-02 | `grep -c "\[ok\]\|\[warn\]\|\[err\]\|\[info\]\|\[block\]" app/(markos)/operations/approvals/page.tsx` >= 6 | pending |
| A-14 | approvals/page | 208-04 | 208-04-02 | `grep -c "c-table\|c-card--feature" app/(markos)/operations/approvals/page.tsx` returns 0 | pending |
| A-15 | approvals/page | 208-04 | 208-04-02 | `grep -c "c-notice--success\|c-notice--error" app/(markos)/operations/approvals/page.tsx` >= 2 | pending |
| A-16 | approvals/page | 208-04 | 208-04-02 | `grep -c "prefers-reduced-motion" app/(markos)/operations/approvals/page.module.css` >= 1 | pending |
| A-17 | approvals/page | 208-04 | 208-04-02 | manual + Storybook viewport check (iPhone 14 Pro stacked full-width buttons) | pending |
| A-18 | approvals/page | 208-04 | 208-04-02 | `! grep -nE "synergy\|leverage\|empower\|unlock\|transform" app/(markos)/operations/approvals/page.tsx` returns 0 | pending |
| A-19 | approvals/page | 208-04 | 208-04-02 | `grep -c "Default\|Empty\|DualApprovalRequired\|AutonomyCeilingReached\|EvidenceWaitingPhase209\|EvidenceBlocked" app/(markos)/operations/approvals/page.stories.tsx` >= 6 | pending |

### R-* — Recovery Center (Plan 208-05)

| AC | Surface | Plan | Task | Verification | Status |
|----|---------|------|------|--------------|--------|
| R-1 | recovery/page | 208-05 | 208-05-02 | `! grep -nE "#[0-9a-fA-F]{3,8}" app/(markos)/operations/recovery/page.module.css` returns 0 | pending |
| R-2 | recovery/page | 208-05 | 208-05-02 | `grep -c "Recovery center" app/(markos)/operations/recovery/page.tsx` >= 1 | pending |
| R-3 | recovery.ts | 208-05 | 208-05-01 | `grep -c "impact_scope\|blocked_run_ids\|blocked_task_ids\|owner_role\|translation_gate" lib/markos/operator/recovery.ts` >= 5 | pending |
| R-4 | recovery.ts | 208-05 | 208-05-01 | `grep -c "provider_failure\|billing_hold\|webhook_delivery\|run_blocker\|connector_placeholder" lib/markos/operator/recovery.ts` >= 5 | pending |
| R-5 | recovery.ts | 208-05 | 208-05-01 | `grep -c "translation_gate.*none\|translation_gate.*phase_210" lib/markos/operator/recovery.ts` >= 1 | pending |
| R-6 | recovery/page | 208-05 | 208-05-02 | `grep -c "provider_failure\|billing_hold\|webhook_delivery\|run_blocker\|connector_placeholder\|future_phase_210" app/(markos)/operations/recovery/page.tsx` >= 6 | pending |
| R-7 | recovery/page | 208-05 | 208-05-02 | `grep -c "c-chip-protocol" app/(markos)/operations/recovery/page.tsx` >= 2 | pending |
| R-8 | recovery/page | 208-05 | 208-05-02 | `grep -c "Resume run\|c-button--primary" app/(markos)/operations/recovery/page.tsx` >= 1 | pending |
| R-9 | recovery/page | 208-05 | 208-05-02 | `grep -c "c-button--destructive\|Move to DLQ" app/(markos)/operations/recovery/page.tsx` >= 1 | pending |
| R-10 | recovery/page | 208-05 | 208-05-02 | `grep -c "c-table" app/(markos)/operations/recovery/page.tsx` returns 0 | pending |
| R-11 | recovery/page | 208-05 | 208-05-02 | `grep -c "\[ok\]\|\[warn\]\|\[err\]\|\[info\]" app/(markos)/operations/recovery/page.tsx` >= 4 | pending |
| R-12 | recovery/page | 208-05 | 208-05-02 | `grep -c "prefers-reduced-motion" app/(markos)/operations/recovery/page.module.css` >= 1 | pending |
| R-13 | recovery/page | 208-05 | 208-05-02 | `! grep -nE "synergy\|leverage\|empower\|unlock\|transform" app/(markos)/operations/recovery/page.tsx` returns 0 | pending |
| R-14 | recovery/page | 208-05 | 208-05-02 | `grep -c "Default\|Empty\|ProviderFailureBacklog\|BillingHoldActive\|ConnectorPlaceholderOnly" app/(markos)/operations/recovery/page.stories.tsx` >= 5 | pending |

### N-* — Weekly Narrative (Plan 208-06)

| AC | Surface | Plan | Task | Verification | Status |
|----|---------|------|------|--------------|--------|
| N-1 | narrative/page | 208-06 | 208-06-01 | `! grep -nE "#[0-9a-fA-F]{3,8}" app/(markos)/operations/narrative/page.module.css` returns 0 | pending |
| N-2 | narrative/page | 208-06 | 208-06-01 | `grep -c "Weekly narrative" app/(markos)/operations/narrative/page.tsx` >= 1 | pending |
| N-3 | narrative.ts | 208-06 | 208-06-01 | `grep -c "wins\|risks\|blocked_work\|operator_decisions\|next_actions\|placeholder_sections" lib/markos/operator/weekly-narrative.ts` >= 6 | pending |
| N-4 | narrative.ts | 208-06 | 208-06-01 | `grep -c "phase_209_evidence\|phase_210_connector\|phase_211_loop\|phase_212_learning" lib/markos/operator/weekly-narrative.ts` >= 4 | pending |
| N-5 | narrative/page | 208-06 | 208-06-01 | `grep -c "Wins\|Risks\|Blocked work\|Operator decisions\|Next actions" app/(markos)/operations/narrative/page.tsx` >= 5 AND `grep -c "c-card--feature" app/(markos)/operations/narrative/page.tsx` returns 0 | pending |
| N-6 | narrative/page | 208-06 | 208-06-01 | `grep -c "future_phase_209\|future_phase_210\|future_phase_211\|future_phase_212" app/(markos)/operations/narrative/page.tsx` >= 4 | pending |
| N-7 | narrative/page | 208-06 | 208-06-01 | `grep -c "c-chip-protocol\|mutation_class" app/(markos)/operations/narrative/page.tsx` >= 1 | pending |
| N-8 | narrative/page | 208-06 | 208-06-01 | `grep -c "This week\|c-chip" app/(markos)/operations/narrative/page.tsx` >= 1 | pending |
| N-9 | narrative/page | 208-06 | 208-06-01 | `grep -c "\[ok\]\|\[warn\]\|\[err\]\|\[info\]" app/(markos)/operations/narrative/page.tsx` >= 4 | pending |
| N-10 | future-integration-boundaries.md | 208-06 | 208-06-02 | `grep -c "evidence_posture\|connector_recovery\|dispatch_outcomes\|learning_suggestions\|future_translation_gate" .planning/operator-cockpit/future-integration-boundaries.md` >= 5 | pending |
| N-11 | narrative/page | 208-06 | 208-06-01 | `grep -c "prefers-reduced-motion" app/(markos)/operations/narrative/page.module.css` >= 1 | pending |
| N-12 | narrative/page | 208-06 | 208-06-01 | `! grep -nE "synergy\|leverage\|empower\|unlock\|transform" app/(markos)/operations/narrative/page.tsx` returns 0 | pending |
| N-13 | narrative/page | 208-06 | 208-06-01 | `grep -c "Default\|EmptyWeek\|WinsHeavy\|BlockedHeavy" app/(markos)/operations/narrative/page.stories.tsx` >= 4 | pending |

### X-* — Cross-cutting (carry-forward closure)

> Wired as Wave-1 tripwire (208-01-00) AND final-wave closure test (208-06-03). Final-wave version has no skip-soft.

| AC | Scope | Plan | Task | Verification | Status |
|----|-------|------|------|--------------|--------|
| X-1 | All 6 surfaces | 208-01 + 208-06 | 208-01-00 (tripwire) + 208-06-03 (final) | `! grep -rnE "#[0-9a-fA-F]{3,8}" app/(markos)/page.module.css app/(markos)/operations/{approvals,recovery,narrative}/page.module.css app/(markos)/operations/tasks/task-ui.module.css app/(markos)/layout-shell.module.css` returns 0 | pending |
| X-2 | All 6 surfaces | 208-01 + 208-06 | 208-01-00 + 208-06-03 | `! grep -nE "background:\s+var\(--color-primary\)[^-]" app/(markos)/{page,operations/approvals/page,operations/recovery/page,operations/narrative/page}.module.css` returns 0 | pending |
| X-3 | All 6 surfaces | 208-01 + 208-06 | 208-01-00 + 208-06-03 | `! grep -rnE "\.banner\|\.alert\|\.warning\|\.callout\|\.noticeBar" app/(markos)/page.module.css app/(markos)/operations/{approvals,recovery,narrative}/page.module.css` returns 0 | pending |
| X-4 | All 6 surfaces | 208-01 + 208-06 | 208-01-00 + 208-06-03 | `! grep -rnE "c-card--feature" app/(markos)/page.tsx app/(markos)/operations/{approvals,recovery,narrative,tasks}/page.tsx` returns 0 | pending |
| X-5 | All 6 surfaces | 208-01 + 208-06 | 208-01-00 + 208-06-03 | `! grep -rnE "c-table" app/(markos)/page.tsx app/(markos)/operations/{approvals,recovery,narrative,tasks}/page.tsx` returns 0 | pending |
| X-6 | All 6 surfaces | 208-01 + 208-06 | 208-01-00 + 208-06-03 | `find components/markos/operator -name "*.tsx" -newer .planning/phases/208-human-operating-interface/208-01-PLAN.md` returns ≤ 5 (only proven-reuse extractions: PlaceholderBanner + Money) | pending |
| X-7 | All 6 surfaces | 208-01 + 208-06 | 208-01-00 + 208-06-03 | ≥4 new page.stories.tsx exist (page, approvals, recovery, narrative) + tasks.stories.tsx extended in-place | pending |
| X-8 | All 6 surfaces | 208-01 + 208-06 | 208-01-00 + 208-06-03 | `grep -nE "@media \(pointer: coarse\)" styles/components.css` returns ≥1 + manual viewport check | pending |
| X-9 | All 6 surfaces | 208-01 + 208-06 | 208-01-00 + 208-06-03 | `! grep -rnE "synergy\|leverage\|empower\|unlock\|transform\|revolutionize\|supercharge\|holistic\|seamless\|cutting-edge\|innovative\|game-changer\|next-generation\|world-class\|best-in-class\|reimagine\|disrupt" app/(markos)/page.tsx app/(markos)/operations/{approvals,recovery,narrative,tasks}/page.tsx lib/markos/operator/*.ts` returns 0 | pending |
| X-10 | All 6 surfaces | 208-01 + 208-06 | 208-01-00 + 208-06-03 | `npm test -- test/operator-cockpit/phase-208/preflight/architecture-lock.test.js` exits 0 | pending |

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Shell posture sanity check | TASK-02, TASK-05 | Contract tests can pass while the shell still feels like a passive admin dashboard. | Review the landing route and nav labels and confirm the first screen prompts decisions, not generic monitoring. |
| Mobile operator action sanity check | TASK-05 | Contract tests can pass while approve/reject/recover actions still require desktop-only layouts in practice. | Review one Morning Brief item, one approval item, and one recovery item in narrow viewport design states and confirm they remain actionable. |
| **B-15 / A-17 / X-8 mobile breakpoint** | TASK-05 | Storybook viewport at iPhone 14 Pro emulation; verify single column, full-width CTA, ≥44px touch target. | Open Storybook → page.stories.tsx + approvals/page.stories.tsx → switch viewport to iPhone 14 Pro; confirm column collapse + full-width buttons + tap targets ≥44px. |
| **B-13 / T-15 / A-16 / R-12 / N-11 prefers-reduced-motion** | QA-* | OS-level preference required to verify; CSS @media query existence is automated, runtime behavior is manual. | Enable system Reduce Motion (macOS / Windows); confirm modal fade collapses to 0; confirm `.c-status-dot--live` freezes at full opacity. |
| Light-theme rendering | DESIGN.md a11y | Forced-colors / data-theme="light" toolbar in Storybook; contrast confirmed via DevTools. | Storybook toolbar → set theme="light"; verify contrast ratios via DevTools color picker. |
| Forced-colors (Windows High Contrast) | DESIGN.md a11y | Edge browser with Windows High Contrast Aquatic theme. | Open in Edge with Aquatic theme; confirm focus rings + state badges remain visible. |
| Chromatic visual regression baselines for 23 new state stories | X-7 | Visual regression cannot be done by grep. | After final wave (208-06-03), capture Chromatic baselines for: 4 (page) + 4 (tasks new) + 6 (approvals) + 5 (recovery) + 4 (narrative) = 23 stories. |

---

## Validation Architecture

- **Preflight:** upstream readiness, architecture lock, plan-to-validation baseline, AND cross-cutting X-axis Wave-1 tripwire
- **Domain 1:** shell route contract, default landing route, mobile-priority policy, Surface-A UI-SPEC fold (S-1..S-10)
- **Domain 2:** Morning Brief sections, urgency, owner, next action, placeholder states, Surface-B UI-SPEC fold (B-1..B-16)
- **Domain 3:** Task Board record shape, grouping, status transitions, blocked state, approval-required state, 207 collapse maps, Surface-C UI-SPEC fold (T-1..T-17)
- **Domain 4:** Approval Inbox preview, pricing/compliance posture, rejection reason, evidence placeholder states, 206 mutation-class doctrine, Surface-D UI-SPEC fold (A-1..A-19)
- **Domain 5:** Recovery Center failure family, impacted-work visibility, owner, translation gate, 207 AgentFailureClass mapping, Surface-E UI-SPEC fold (R-1..R-14)
- **Domain 6:** Weekly Narrative contract, placeholder sections, future integration boundary matrix, Surface-F UI-SPEC fold (N-1..N-13)
- **Wave-final:** cross-cutting X-1..X-10 closure across ALL 208 surface files (X-axis closure)

Architecture lock runs first in every wave. It should verify:

- required posture exists: `app/(markos)/layout-shell.tsx`, `app/(markos)/operations/page.tsx`, `PRC-09`, `COMP-01`, and `RUN-01..08`
- forbidden Phase 208 patterns do not appear: `vitest`, `playwright`, `.test.ts`, `route.ts`, `second dashboard shell`, `desktop-only approval`, `future-phase data assumption`, and `hidden rejection reason`

---

## Dimensions Coverage (Nyquist 8 dimensions)

| Dimension | Status | Coverage |
|-----------|--------|----------|
| 1. Requirements coverage | DRAFT | `TASK-01..05` and `QA-01..15` are distributed across Plans 01-06; evidence, connector, loop, and learning families remain translation gates or integration inputs rather than primary ownership |
| 2. Anti-shallow execution | DRAFT | Each plan includes explicit `read_first`, `action`, `acceptance_criteria`, `verify`, `done` blocks; UI-SPEC fold adds per-AC verification harnesses (76 ACs × verbatim grep gate) |
| 3. Architecture-lock | LOCKED | Plan 01 owns the preflight, shell-drift guardrails, future-phase boundary lock, AND cross-cutting X-axis tripwire |
| 4. Compliance enforcement | LOCKED | Plans 02 and 04 require pricing/compliance posture now and reserve evidence-specific blocking for Phase 209 translation; 206 mutation-class doctrine is enforced via UI in Plans 03/04/05/06 |
| 5. Cross-phase coordination | LOCKED | Phase 208 depends on P205-P207 directly and defines explicit translation gates for P209-P212 instead of silently borrowing their substrate; future-integration-boundaries.md is the doctrine anchor |
| 6. Single-writer / governance posture | LOCKED | Phase 208 creates cockpit contracts and operator surfaces; it does not re-own evidence, connector, loop, or learning engines |
| 7. Test runner pinned | LOCKED | Node `--test`; no `vitest`, no `playwright`; UI-SPEC fold adds 6 new domain-* test suites + 1 final-wave gate |
| 8. Validation strategy (this doc) | DRAFT | Full sampling strategy defined; UI-SPEC AC Coverage Map enumerates all 89 ACs; frontmatter stays false until execution proves Wave 0 + final wave + Chromatic baseline capture |

---

*Phase: 208-human-operating-interface*
*Validation strategy created: 2026-04-27*
*UI-SPEC fold: 2026-04-29 (76 surface ACs + 10 cross-cutting = 89 total verification gates)*
*Source: 208-RESEARCH.md + 208-REVIEWS.md + 208-UI-SPEC.md*
