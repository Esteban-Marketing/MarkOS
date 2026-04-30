---
phase: 210
slug: connector-wow-loop-and-recovery
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-27
updated: 2026-04-29 (UI-SPEC AC fold — 44 ACs mapped per task)
---

# Phase 210 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution. Updated 2026-04-29 to fold 44 UI-SPEC ACs (CR-1..CR-22, B-1..B-12, X-1..X-10) into the per-task verification map.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node `--test` + `@testing-library/react` for the 210-03 UI tests |
| **Config file** | none - uses the built-in Node runner |
| **Quick run command** | `npm test -- test/connectors/phase-210/preflight/` |
| **Full suite command** | `npm test -- test/connectors/phase-210/` |
| **Storybook command** | `npm run storybook` (manual: 8 ConnectorRecommendationCard stories at iPhone 14 Pro emulation) |
| **DESIGN.md lint** | `npx @google/design.md lint DESIGN.md` |
| **Estimated runtime** | ~30-60s (full suite) |

---

## Sampling Rate

- **After every task commit:** Run the plan-specific domain suite, or `npm test -- test/connectors/phase-210/preflight/` for Wave 0.5 work.
- **After every plan wave:** Run `npm test -- test/connectors/phase-210/` + `npx @google/design.md lint DESIGN.md` for the 210-03 UI plan.
- **Before `/gsd-verify-work`:** Full suite must be green AND DESIGN.md lint passes for the 210-03 page.
- **Max feedback latency:** ~60s

---

## Per-Task Verification Map (UI-SPEC AC Fold)

This map covers all 10 Phase 210 task IDs (after the 210-03 split) and ties each to the UI-SPEC ACs it satisfies (CR-1..CR-22, B-1..B-12, X-1..X-10).

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | UI-SPEC ACs | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|-------------|--------|
| 210-01-00 | 01 | 1 | QA-01, QA-02 | preflight | `npm test -- test/connectors/phase-210/preflight/` | B-4 (architecture-lock 4 forbidden strings), B-11 (4-row readiness for 206/207/208/209), B-12 (VALIDATION row coverage) | W0 missing | pending |
| 210-01-01 | 01 | 1 | CONN-01 | connector-install-contract | `npm test -- test/connectors/phase-210/domain-1/connector-install-contract.test.js test/connectors/phase-210/domain-1/status-transitions.test.js` | B-1 (5 named fields), B-2 (8 status literals), B-3 (4 auth_type literals), Inheritance Bindings — From 210-01 (22-field UI consumption table) | W0 missing | pending |
| 210-01-02 | 01 | 1 | CONN-01 | operator-shell-mobile-critical | `npm test -- test/connectors/phase-210/domain-1/operator-shell-mobile-critical.test.js` | UI-SPEC §Design System mobile posture; §Plan Scope Classification 210-03 row Mobile Priority: critical; §Checker Sign-Off mobile-critical declaration gate | W0 missing | pending |
| 210-02-01 | 02 | 2 | CONN-06 | adapter-matrix | `npm test -- test/connectors/phase-210/domain-2/` | B-5 (6 provider rows), B-6 (3 preferred_adapter literals), Inheritance Bindings — From 210-02 (5-field UI consumption + evidence_status drives pending-verification notice) | W0 missing | pending |
| 210-03-01 | 03 | 3 | CONN-02 | onboarding-recommendation-backend | `npm test -- test/connectors/phase-210/domain-3/recommendation-logic.test.js` | CR-3 (max-3 invariant), CR-8 (5 tenant profiles), CR-9 (5 bundle fields), CR-10 (6 providers + `[ok]` glyph), CR-11 (specificity gate seconds/minutes), CR-12 (recovery 3-clause), CR-19 (banned-lexicon zero matches), CR-21 (5 tenant-profile bundles), B-6 (recommendation policy doctrine), X-8 (banned-lexicon zero matches) | W0 missing | pending |
| 210-03-02 | 03 | 3 | CONN-02, QA-07, QA-08 | onboarding-recommendation-ui-render | `npm test -- test/connectors/phase-210/domain-3/recommendation-card-render.test.js && npx @google/design.md lint DESIGN.md` | CR-1 (token-only), CR-2 (page heading + .t-lead), CR-3 (max-3 render), CR-4 (.c-card not feature), CR-5 (4 eyebrows), CR-6 (.c-button--primary), CR-7 (.c-button--tertiary skip), CR-13 (.c-notice per state), CR-14 (bracketed glyphs), CR-15 (.c-chip-protocol recovery_task_id), CR-16 (.c-status-dot--live + prefers-reduced-motion), CR-17 (vanilla `<ul>` + .c-code-inline), CR-18 (no self-placeholder), CR-19 (banned-lexicon), CR-20 (mobile inheritance), CR-22 (8 Storybook stories), X-1 (token-only), X-2 (mint never as fill), X-3 (.c-notice mandatory no local state classes), X-4 (.c-card--feature reserved), X-5 (no .c-table), X-6 (D-15 co-located not extracted), X-7 (touch-target 44px), X-8 (banned-lexicon), X-9 (no emoji), X-10 (prefers-reduced-motion) | W0 missing | pending |
| 210-04-01 | 04 | 4 | CONN-03, CONN-05 | wow-audit + no-write-on-first-wow | `npm test -- test/connectors/phase-210/domain-4/` | B-7 (3 audit_type literals + 4 audit_status literals), Inheritance Bindings — From 210-04 (audit_status drives 210-03 install-success vs recovery routing; time_to_wow_minutes drives copy verbatim), DESIGN.md Compliance Assertion `No write-capable first-wow path` | W0 missing | pending |
| 210-05-01 | 05 | 5 | CONN-04 | pause-and-recovery + recovery-routing-208-05 | `npm test -- test/connectors/phase-210/domain-5/` | B-8 (4 failure_kind literals + 4 status literals), Inheritance Bindings — From 210-05 (failure_kind drives install-failure copy variant on 210-03 page), Inheritance Bindings — From 208-UI-SPEC §Surface E (Recovery Center routing dissolves connector_placeholder family), Translation gates dissolved by Phase 210 (3 gates: 208-05 connector_placeholder, 209-04 claim_type==competitive, 208-02 future_recovery_placeholder), Architecture-lock forbidden string `silent connector degradation` | W0 missing | pending |
| 210-06-01 | 06 | 6 | CONN-01, CONN-04 | sync-and-recovery-evidence | `npm test -- test/connectors/phase-210/domain-6/sync-evidence.test.js` | B-9 (3 sync_mode + 6 status + 3 freshness_status = 12 literals), Inheritance Bindings — From 210-06 (downstream P211+ admin views consume sync_mode/status/freshness_status) | W0 missing | pending |
| 210-06-02 | 06 | 6 | CONN-05, CONN-06 | future-connector-compatibility + VALIDATION coverage | `npm test -- test/connectors/phase-210/domain-6/future-compatibility.test.js` | B-10 (8 future-consumer rows + future_consumer status), B-12 (VALIDATION per-task map covers all 10 task IDs including 210-03 split), Translation gates preserved (future_phase_211 loop-dispatch + future_phase_212 learning fixtures) | W0 missing | pending |

---

## UI-SPEC AC Coverage Summary (44 ACs folded)

### CR-* — 22 surface ACs (210-03 UI plan)

| AC | Folded into Task | Verification |
|----|-------------------|--------------|
| CR-1 (token-only zero hex) | 210-03-02 | `! grep -nE "#[0-9a-fA-F]{3,8}" app/(markos)/onboarding/connectors/page.module.css page.tsx _components/ConnectorRecommendationCard.tsx` returns 0 |
| CR-2 (page heading + .t-lead) | 210-03-02 | `grep -c "Connect your data\|t-lead" app/(markos)/onboarding/connectors/page.tsx` >= 2 |
| CR-3 (max-3 invariant) | 210-03-01 (data layer) + 210-03-02 (render layer) | `grep -c "MAX_RECOMMENDED" recommendations.cjs` >= 1; `grep -c "slice(0,\\s*3)\|length.*[<=]\\s*3" page.tsx` >= 1 |
| CR-4 (.c-card not feature) | 210-03-02 | `grep -c "c-card[^-]" ConnectorRecommendationCard.tsx` >= 1; `grep -c "c-card--feature" ` returns 0 |
| CR-5 (4 eyebrows verbatim) | 210-03-02 | `grep -c "What you'll get\|Setup time\|Permissions\|If something fails" ConnectorRecommendationCard.tsx` >= 4 |
| CR-6 (.c-button--primary "Connect" prefix) | 210-03-02 | `grep -c "c-button--primary\|Connect " ConnectorRecommendationCard.tsx` >= 2 |
| CR-7 (skip CTA verbatim) | 210-03-02 | `grep -c "c-button--tertiary\|Skip — start with read-only audit instead" page.tsx` >= 2 |
| CR-8 (5 tenant profiles) | 210-03-01 | `grep -c "saas\|ecommerce\|services\|agency\|low_data" recommendations.cjs` >= 5 |
| CR-9 (5 bundle fields) | 210-03-01 | `grep -c "recommended_connectors\|wow_promise\|setup_minutes_estimate\|fallback_connector\|failure_task_template" recommendations.cjs` >= 5 |
| CR-10 (6 providers verbatim wow_promise + `[ok]`) | 210-03-01 | `grep -c "ga4\|gsc\|hubspot\|linkedin\|meta\|posthog" recommendation-copy.cjs` >= 6; `grep -c "\\[ok\\]" recommendation-copy.cjs` >= 6 |
| CR-11 (specificity gate seconds/minutes) | 210-03-01 | `grep -cE "(seconds\|minutes)" recommendation-copy.cjs` >= 6; banned generic terms zero |
| CR-12 (recovery 3-clause) | 210-03-01 | `grep -c "pause\|Recovery Center\|re-authorize" recommendation-copy.cjs` >= 3 |
| CR-13 (.c-notice per state) | 210-03-02 | `grep -c "c-notice--info\|c-notice--warning\|c-notice--error\|c-notice--success" ConnectorRecommendationCard.tsx` >= 4 |
| CR-14 (bracketed glyphs + no emoji) | 210-03-02 | `grep -c "\\[ok\\]\|\\[warn\\]\|\\[err\\]\|\\[info\\]"` >= 6; emoji regex returns 0 |
| CR-15 (.c-chip-protocol recovery_task_id) | 210-03-02 | `grep -c "c-chip-protocol\|recovery_task_id" ConnectorRecommendationCard.tsx` >= 2 |
| CR-16 (.c-status-dot--live + prefers-reduced-motion) | 210-03-02 | `grep -c "c-status-dot--live" ConnectorRecommendationCard.tsx` >= 1; `grep -c "prefers-reduced-motion" page.module.css` >= 1 |
| CR-17 (vanilla `<ul>` + .c-code-inline; no .c-table) | 210-03-02 | `grep -c "c-code-inline\|<ul\|<li"` >= 3; `grep -c "c-table"` returns 0 |
| CR-18 (no self-placeholder) | 210-03-02 | `grep -c "future_phase_210\|future_phase_209" page.tsx` returns 0 |
| CR-19 (banned-lexicon zero matches) | 210-03-01 + 210-03-02 | `! grep -nE "synergy\|leverage\|empower\|...\|innovative" page.tsx ConnectorRecommendationCard.tsx recommendation-copy.cjs recommendations.cjs` returns 0 |
| CR-20 (mobile inheritance) | 210-03-02 | manual + Storybook viewport check at iPhone 14 Pro emulation |
| CR-21 (5 tenant-profile bundles) | 210-03-01 | bundle test `recommendation-logic.test.js` |
| CR-22 (8 Storybook stories) | 210-03-02 | `grep -c "Default\|InProgress\|Success\|FailureTokenRevoked\|FailureMissingScope\|RateLimited\|PartialSuccess\|PendingVerification" ConnectorRecommendationCard.stories.tsx` >= 8 |

### B-* — 12 cross-cutting backend doctrine ACs

| AC | Folded into Task | Plan |
|----|-------------------|------|
| B-1 (5 named fields in connector-install-contract.md) | 210-01-01 | 210-01 |
| B-2 (8 status literals in connector-install.ts) | 210-01-01 | 210-01 |
| B-3 (4 auth_type literals in connector-install.ts) | 210-01-01 | 210-01 |
| B-4 (4 architecture-lock forbidden strings) | 210-01-00 | 210-01 |
| B-5 (6 provider rows in adapter-decision-matrix.md) | 210-02-01 | 210-02 |
| B-6 (3 preferred_adapter literals) | 210-02-01 | 210-02 |
| B-7 (3 audit_type + 4 audit_status literals) | 210-04-01 | 210-04 |
| B-8 (4 failure_kind + 4 status literals) | 210-05-01 | 210-05 |
| B-9 (12 sync-attempt literals) | 210-06-01 | 210-06 |
| B-10 (8 future-consumer rows) | 210-06-02 | 210-06 |
| B-11 (Wave 0.5 readiness for 206/207/208/209) | 210-01-00 | 210-01 |
| B-12 (VALIDATION row coverage all 10 task IDs) | 210-01-00 + 210-06-02 | 210-01 + 210-06 |

### X-* — 10 cross-cutting carry-forward ACs (210-03 page only)

| AC | Decision | Folded into Task |
|----|----------|-------------------|
| X-1 (D-08 token-only) | D-08 | 210-03-02 |
| X-2 (D-09 mint-as-text never as fill) | D-09 | 210-03-02 |
| X-3 (D-09b .c-notice mandatory; no local state classes) | D-09b | 210-03-02 |
| X-4 (D-13 .c-card--feature reserved) | D-13 | 210-03-02 |
| X-5 (D-14 no .c-table primitive) | D-14 | 210-03-02 |
| X-6 (D-15 selective extraction co-located) | D-15 | 210-03-02 |
| X-7 (touch-target 44px on (pointer: coarse)) | inherits 213.2 | 210-03-02 (consumes global) |
| X-8 (banned-lexicon zero matches) | CLAUDE.md | 210-03-01 + 210-03-02 |
| X-9 (no emoji) | CLAUDE.md | 210-03-01 + 210-03-02 |
| X-10 (prefers-reduced-motion in page.module.css) | DESIGN.md | 210-03-02 |

---

## Wave 0 Requirements

- [ ] `.planning/connectors/210-upstream-readiness.md` - authoritative readiness checklist for Phases 206-209 with blocker ownership.
- [ ] `scripts/connectors/check-connector-upstream-readiness.mjs` - hard and soft preflight for compliance, run linkage, task routing, and evidence posture.
- [ ] `scripts/connectors/check-connector-architecture-lock.mjs` - forbidden-pattern detector for plain-text secrets, silent degradation, too-many recommendations, and write-capable first-wow posture (4 connector-specific literals from UI-SPEC §Copywriting Contract).
- [ ] `scripts/connectors/assert-connector-contract-baseline.mjs` - baseline validator for plan-to-validation coverage and connector doctrine assumptions.
- [ ] `test/connectors/phase-210/preflight/upstream-readiness.test.js`
- [ ] `test/connectors/phase-210/preflight/architecture-lock.test.js`
- [ ] `test/connectors/phase-210/preflight/contract-baseline.test.js`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Secret redaction sanity check | CONN-01 | Contract tests can pass while logs or prompts still expose sensitive connector details in practice. | Review one ConnectorInstall payload and one recovery task payload and confirm only `credential_ref` is present, never raw tokens or secrets. |
| Wow-audit usefulness sanity check | CONN-03, CONN-05 | The audit can be structurally valid while still not delivering a useful operator outcome. | Review one `ready` wow audit and one `recovery_needed` outcome and confirm the operator either gets actionable insight or a precise recovery task, not a passive status card. |
| 210-03 page mobile critical sanity check | CONN-02 | Storybook viewport emulation is automated, but a real device check confirms the touch-target inheritance and stack behavior at iPhone 14 Pro emulation. | Open the page at `(pointer: coarse)` ≤640px breakpoint; confirm card stack, full-width Connect CTA with `--h-control-touch` (44px), no horizontal scroll, scope `<ul>` items vertical, raw `.c-code-inline` wraps without overflow. |
| 210-03 page banned-lexicon sanity check | CONN-02 | Grep handles the banned-lexicon list verbatim, but a human review of wow-promise + recovery-copy + scope-display copy ensures specificity and operator-readability without softeners. | Read all 6 wow_promise / recovery_copy / setup_minutes_estimate entries; confirm every one cites specific connector + numeric time + named outcome and the recovery copy contains the 3 required clauses (`pause`, `Recovery Center`, `re-authorize`). |

---

## Validation Architecture

- **Preflight:** upstream readiness, architecture lock, and plan-to-validation baseline
- **Domain 1:** ConnectorInstall contract, status transitions, auth types, secret redaction, operator-shell mobile-critical declaration
- **Domain 2:** adapter decision matrix, provider rows, official-doc traceability, decision vocabulary, evidence_status pending-verification binding
- **Domain 3:** onboarding recommendation backend (max-3 invariant + 5 tenant profiles + 6 providers verbatim) AND onboarding-connectors UI render (server-component page + co-located client subcomponent + token-only CSS module + 8 Storybook state stories)
- **Domain 4:** first wow audit outcomes, fallback paths, time-to-connect and time-to-wow posture, no-write-on-first-wow gate
- **Domain 5:** dependent-agent pause, impacted-run linkage, recovery-task creation, safe resumption, 208-05 Recovery Center routing dissolution of `connector_placeholder` family
- **Domain 6:** sync/backfill/retry/DLQ evidence, freshness posture, future connector compatibility map, preserved translation gates `future_phase_211` and `future_phase_212`

Architecture lock runs first in every wave. It should verify:

- required posture exists: `createSession`, `revokeSession`, `subscribe`, `unsubscribe`, `getOutboundChannelCapabilities`, and the Phase 206-209 planning artifacts
- forbidden Phase 210 patterns do not appear: `vitest`, `playwright`, `.test.ts`, `route.ts`, `plain text access token`, `silent connector degradation`, `recommend four connectors`, `write-capable first wow`

---

## Dimensions Coverage (Nyquist 8 dimensions)

| Dimension | Status | Coverage |
|-----------|--------|----------|
| 1. Requirements coverage | DRAFT | `CONN-01..06` and `QA-01..15` are distributed across Plans 01-06; upstream families remain integration inputs rather than primary ownership |
| 2. Anti-shallow execution | DRAFT | Each plan includes explicit `read_first`, `action`, `acceptance_criteria`, `verify`, and `done` blocks; the 210-03 UI plan now carries explicit `<behavior>` test cases per task-level TDD posture |
| 3. Architecture-lock | LOCKED | Plan 01 owns the preflight, secret-handling guardrails, and nonstandard-surface lock; 4 connector-specific architecture-lock forbidden strings enforced (UI-SPEC §B-4) |
| 4. Compliance enforcement | LOCKED | Plans 01, 04, and 06 require privacy, consent, evidence, and recovery posture before connector outputs are trusted |
| 5. Cross-phase coordination | LOCKED | Plan 01 hard-gates Phase 210 on P206-P209 readiness rather than letting connector work absorb missing upstream systems; UI-SPEC inheritance bindings cite 206/207/208/209 verbatim |
| 6. Single-writer / governance posture | LOCKED | Phase 210 creates connector contracts and recovery rules; it does not re-own run, task, evidence, or compliance substrate. The single 210-03 UI plan ships ONE page + ONE co-located client subcomponent — no global layout, no global CSS, no shadcn init |
| 7. Test runner pinned | LOCKED | Node `--test`; no `vitest`, no `playwright` |
| 8. Validation strategy (this doc) | DRAFT | Full sampling strategy defined; UI-SPEC AC fold complete (44 ACs across 10 task IDs); frontmatter stays false until execution proves Wave 0 and task coverage |

---

*Phase: 210-connector-wow-loop-and-recovery*
*Validation strategy created: 2026-04-27*
*Updated: 2026-04-29 (UI-SPEC AC fold — 44 ACs mapped across 10 task IDs)*
*Source: 210-RESEARCH.md + 210-REVIEWS.md + 210-UI-SPEC.md*
