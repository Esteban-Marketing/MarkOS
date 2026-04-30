---
phase: 209
slug: evidence-research-and-claim-safety
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-27
ui_spec_fold: 2026-04-29
ui_spec_acs_total: 42
ui_spec_acs_per_surface:
  surface_a_evidence_summary: 22
  backend_doctrine: 10
  cross_cutting_carry_forward: 10
---

# Phase 209 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node `--test` |
| **Config file** | none - uses the built-in Node runner |
| **Quick run command** | `npm test -- test/evidence/phase-209/preflight/` |
| **Full suite command** | `npm test -- test/evidence/phase-209/` |
| **Estimated runtime** | ~30-60s |

---

## Sampling Rate

- **After every task commit:** Run the plan-specific domain suite, or `npm test -- test/evidence/phase-209/preflight/` for Wave 0.5 work.
- **After every plan wave:** Run `npm test -- test/evidence/phase-209/`.
- **Before `/gsd-verify-work`:** Full suite must be green.
- **Max feedback latency:** ~60s

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | UI-SPEC ACs | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-------------|-----------|-------------------|-------------|--------|
| 209-01-00 | 01 | 1 | QA-01, QA-02, QA-03 | B-2, X-8 origin | preflight | `npm test -- test/evidence/phase-209/preflight/` | W0 missing | pending |
| 209-01-01 | 01 | 1 | EVD-01, QA-04 | B-1, E-4/E-7/E-8/E-9 upstream | evidence-map-contract | `npm test -- test/evidence/phase-209/domain-1/` | W0 missing | pending |
| 209-02-01 | 02 | 2 | EVD-03, EVD-06, QA-05, QA-06, QA-07 | B-3, B-4, E-10 upstream | source-quality-and-pricing-bridge | `npm test -- test/evidence/phase-209/domain-2/` | W0 missing | pending |
| 209-03-01 | 03 | 3 | EVD-01, EVD-02, EVD-04, QA-08, QA-09, QA-10 | B-5, E-7 upstream | freshness-and-known-gaps | `npm test -- test/evidence/phase-209/domain-3/` | W0 missing | pending |
| 209-04-01 | 04 | 4 | EVD-02, EVD-05, QA-11, QA-12 | B-6, E-4, E-5, E-6, E-20 | approval-blocking | `npm test -- test/evidence/phase-209/domain-4/approval-blocking.test.js` | W0 missing | pending |
| 209-04-02 | 04 | 4 | EVD-02, EVD-05, QA-04, QA-11, QA-12 | E-1, E-2, E-3, E-7..E-19, E-21, E-22, X-1..X-10 | evidence-summary-render | `npm test -- test/evidence/phase-209/domain-4/evidence-summary-render.test.js` | W0 missing | pending |
| 209-05-01 | 05 | 5 | EVD-04, QA-13 | B-7 | research-context-reuse | `npm test -- test/evidence/phase-209/domain-5/` | W0 missing | pending |
| 209-06-01 | 06 | 6 | EVD-01..06, QA-14, QA-15 | B-8 | citation-and-hallucination-defense | `npm test -- test/evidence/phase-209/domain-6/hallucination-defense.test.js` | W0 missing | pending |
| 209-06-02 | 06 | 6 | EVD-05, EVD-06, QA-15 | B-9, B-10 | future-claim-evidence-matrix | `npm test -- test/evidence/phase-209/domain-6/future-consumers.test.js` | W0 missing | pending |

---

## Wave 0 Requirements

- [ ] `.planning/evidence/209-upstream-readiness.md` - authoritative readiness checklist for Phases 205-208 with blocker ownership.
- [ ] `scripts/evidence/check-evidence-upstream-readiness.mjs` - hard and soft preflight for pricing, compliance, AgentRun lineage, and approval-surface posture.
- [ ] `scripts/evidence/check-evidence-architecture-lock.mjs` - forbidden-pattern detector for unsupported-claim approval, freshness bypass, and nonstandard test/router surfaces.
- [ ] `scripts/evidence/assert-evidence-contract-baseline.mjs` - baseline validator for plan-to-validation coverage and evidence doctrine assumptions.
- [ ] `test/evidence/phase-209/preflight/upstream-readiness.test.js`
- [ ] `test/evidence/phase-209/preflight/architecture-lock.test.js`
- [ ] `test/evidence/phase-209/preflight/contract-baseline.test.js`

---

## Manual-Only Verifications

| Behavior | Requirement | UI-SPEC AC | Why Manual | Test Instructions |
|----------|-------------|------------|------------|-------------------|
| Approval evidence sanity check | EVD-05 | E-3..E-10 | Contract tests can pass while approval evidence is still too confusing for a human reviewer. | Review one blocked approval and one editable approval snapshot and confirm the evidence summary, TTL posture, and unsupported-claim list are understandable without reading raw logs. |
| Inference-label sanity check | EVD-02 | E-8 | Automated labels can be syntactically correct while still misleading a human about factual certainty. | Review one `supported`, one `inferred`, and one `unsupported` fixture and confirm the label meaning is obvious to an operator. |
| Mobile breakpoint (evidence-summary) | QA-04, QA-11 | E-18, X-7 | Storybook viewport check; touch-target measurement requires real device emulation. | Open Storybook story `Operations/Approvals/EvidenceFreshSupported` at iPhone 14 Pro emulation. Verify sources table collapses to vertical KV stacks at `max-width: 640px`. Verify `.c-button--destructive` and `.c-input` measure ≥44px (`getComputedStyle().minHeight`). |
| Reduced-motion (evidence-summary) | QA-04 | X-10 | OS-level preference must be set; runtime check. | Set OS `prefers-reduced-motion: reduce`. Verify sub-component itself has no motion; parent's modal fade collapses to 0ms. |
| axe-core a11y scan (evidence-summary) | QA-11 | E-1..E-22, X-9 | Browser-only DOM accessibility audit. | Run `axe.run()` on the rendered sub-component in Storybook iframe. Verify 0 critical/serious violations. |
| Chromatic baseline (evidence-summary) | QA-11 | E-21 | Visual-regression baseline requires reviewer approval. | Capture Chromatic snapshots for all 6 state stories: `EvidenceFreshSupported`, `EvidenceStale`, `EvidenceExpired`, `EvidenceContradictory`, `EvidenceKnownGap`, `EvidenceUnsupportedOverride`. Approve baselines in Chromatic UI. |

---

## Validation Architecture

- **Preflight:** upstream readiness, architecture lock, and plan-to-validation baseline
- **Domain 1:** EvidenceMap fields, claim relations, inference labels, redaction posture
- **Domain 2:** source-quality rubric, research tiers, claim-class thresholds, pricing-evidence bridge
- **Domain 3:** TTL, freshness, contradictory evidence, known-gap creation, refresh triggers
- **Domain 4:** approval evidence snapshots, blocked action families, override lineage
- **Domain 5:** research-context lookup, reuse decisions, insufficiency triggers, AgentRun linkage
- **Domain 6:** citation fixtures, inference labeling, hallucination defense, and future claim-evidence consumer map

Architecture lock runs first in every wave. It should verify:

- required posture exists: `audit_claim`, `audit_claim_strict`, `expand_claim_evidence`, `buildGovernanceEvidencePack`, `buildReadinessReport`, and `EvidencePanel`
- forbidden Phase 209 patterns do not appear: `vitest`, `playwright`, `.test.ts`, `route.ts`, `approve unsupported claim`, `freshness ignored`, `price claim without timestamp`, `silent inference`

---

## UI-SPEC AC Coverage Map

> All 42 UI-SPEC ACs (22 surface + 10 backend doctrine + 10 cross-cutting) folded into Phase 209 plans on 2026-04-29. This map enumerates verbatim grep/test commands per AC.

### Surface ACs (E-* — Plan 209-04 evidence-summary.tsx, 22 total)

| AC | Truth | Owning Task | Verification Command |
|----|-------|-------------|----------------------|
| E-1 | File exists at `app/(markos)/operations/approvals/evidence-summary.tsx` | 209-04-02 | `test -f app/(markos)/operations/approvals/evidence-summary.tsx` |
| E-2 | Token-only: zero inline hex | 209-04-02 | `! grep -nE "#[0-9a-fA-F]{3,8}" app/(markos)/operations/approvals/evidence-summary.tsx` returns 0 |
| E-3 | `<h3>` heading "Evidence" | 209-04-02 | `grep -c "<h3" app/(markos)/operations/approvals/evidence-summary.tsx` >= 1 |
| E-4 | ApprovalEvidenceSnapshot 11 fields verbatim | 209-04-01 | `grep -c "snapshot_id\|approval_id\|evidence_refs\|source_quality_summary\|ttl_summary\|assumption_list\|unsupported_claims\|inference_labels\|override_reason\|actor_id\|created_at" lib/markos/evidence/approval-evidence.ts` >= 11 |
| E-5 | claim-blocking literals `unsupported_claims`, `override_reason` | 209-04-01 | `grep -c "unsupported_claims\|override_reason" lib/markos/evidence/claim-blocking.ts` >= 2 |
| E-6 | 5 blocked-action families verbatim | 209-04-01 | `grep -c "publish\|send\|social\|pricing\|support" lib/markos/evidence/claim-blocking.ts` >= 5 |
| E-7 | 5 freshness states verbatim | 209-04-02 | `grep -c "fresh\|stale\|expired\|contradictory\|gap_known" app/(markos)/operations/approvals/evidence-summary.tsx` >= 5 |
| E-8 | 3 inference labels verbatim | 209-04-02 | `grep -c "none\|inferred\|unsupported" app/(markos)/operations/approvals/evidence-summary.tsx` >= 3 |
| E-9 | 7 claim types verbatim | 209-04-02 | `grep -c "marketing_copy\|pricing\|competitive\|public_proof\|sales_enablement\|support_guidance\|saas_metric" app/(markos)/operations/approvals/evidence-summary.tsx` >= 7 |
| E-10 | 6 source-quality bands as `.c-badge` | 209-04-02 | `grep -c "First-party\|Official\|Analyst\|Public web\|Operator note\|Unsupported" app/(markos)/operations/approvals/evidence-summary.tsx` >= 6 |
| E-11 | Override `.c-input` + `.c-field` + required-validation | 209-04-02 | `grep -c "c-input\|c-field\|override_reason\|override reason is required" app/(markos)/operations/approvals/evidence-summary.tsx` >= 4 |
| E-12 | `.c-button--destructive` "Continue without evidence" / "Request second approver" | 209-04-02 | `grep -c "c-button--destructive\|Continue without evidence\|Request second approver" app/(markos)/operations/approvals/evidence-summary.tsx` >= 2 |
| E-13 | Bracketed glyphs `[ok]`, `[warn]`, `[err]`, `[info]`, `[block]` | 209-04-02 | `grep -c "\[ok\]\|\[warn\]\|\[err\]\|\[info\]\|\[block\]" app/(markos)/operations/approvals/evidence-summary.tsx` >= 5 |
| E-14 | Vanilla `<table>`; no `.c-table`, no `.c-card--feature` | 209-04-02 | `grep -c "c-table\|c-card--feature" app/(markos)/operations/approvals/evidence-summary.tsx` returns 0; `grep -c "<table" app/(markos)/operations/approvals/evidence-summary.tsx` >= 1 |
| E-15 | `.c-notice c-notice--{state}` for every state banner | 209-04-02 | `grep -c "c-notice c-notice--success\|c-notice c-notice--warning\|c-notice c-notice--error\|c-notice c-notice--info" app/(markos)/operations/approvals/evidence-summary.tsx` >= 4 |
| E-16 | `.c-chip-protocol` for IDs (mint-as-text via D-09) | 209-04-02 | `grep -c "c-chip-protocol" app/(markos)/operations/approvals/evidence-summary.tsx` >= 4 |
| E-17 | Redaction notice when `redaction_policy != 'none'` | 209-04-02 | `grep -c "redaction_policy\|redacted by tenant policy\|\[redacted\]" app/(markos)/operations/approvals/evidence-summary.tsx` >= 2 |
| E-18 | Mobile-critical `max-width: 640px` collapse + 44px touch | 209-04-02 | manual + Storybook iPhone 14 Pro viewport check |
| E-19 | Banned-lexicon zero matches | 209-04-02 | `! grep -nE "synergy\|leverage\|empower\|unlock\|transform\|revolutionize\|supercharge\|holistic\|seamless\|cutting-edge\|innovative\|game-changer" app/(markos)/operations/approvals/evidence-summary.tsx` returns 0 |
| E-20 | Override commit emits audit event with run_id | 209-04-01 | `grep -c "run_id\|created_by_run_id" lib/markos/evidence/claim-blocking.ts` >= 1 |
| E-21 | 6 Storybook state stories | 209-04-02 | `grep -c "EvidenceFreshSupported\|EvidenceStale\|EvidenceExpired\|EvidenceContradictory\|EvidenceKnownGap\|EvidenceUnsupportedOverride" app/(markos)/operations/approvals/page.stories.tsx` >= 6 |
| E-22 | Migration anchor: immutable-evidence callout | 209-04-02 | `grep -c "Evidence is immutable\|cannot be edited\|immutable" app/(markos)/operations/approvals/evidence-summary.tsx` >= 1 |

### Backend doctrine ACs (B-* — Plans 209-01..03, 05, 06, 10 total)

| AC | Plan | Verification Command |
|----|------|----------------------|
| B-1 | 209-01-01 | `grep -c "evidence_id\|tenant_id\|claim_text\|claim_type\|source_class\|source_url\|source_title\|source_captured_at\|source_published_at\|extraction_method\|confidence\|source_quality_score\|freshness_ttl_hours\|expires_at\|supported\|known_gaps\|inference_label\|created_by_run_id\|approval_id\|related_object_type\|related_object_id\|redaction_policy\|created_at\|updated_at" .planning/evidence/evidence-map-contract.md` >= 24 |
| B-2 | 209-01-00 | `grep -c "approve unsupported claim\|freshness ignored\|price claim without timestamp\|silent inference" scripts/evidence/check-evidence-architecture-lock.mjs` >= 4 |
| B-3 | 209-02-01 | `grep -c "1.00\|0.85\|0.65\|0.40\|0.20\|0.00\|tier_1_strict\|tier_2_standard\|tier_3_exploratory\|tier_4_operator_note" .planning/evidence/source-quality-rubric.md` >= 10 |
| B-4 | 209-02-01 | `grep -c "competitor_pricing\|pricing_recommendation_support\|public_pricing_copy" .planning/evidence/pricing-evidence-bridge.md` >= 3 |
| B-5 | 209-03-01 | `grep -c "fresh\|stale\|expired\|contradictory\|gap_known\|24-168h\|7-30d\|90-365d" .planning/evidence/freshness-and-known-gaps-policy.md` >= 8 |
| B-6 | 209-04-01 | `grep -c "snapshot_id\|approval_id\|evidence_refs\|source_quality_summary\|ttl_summary\|assumption_list\|unsupported_claims\|inference_labels\|override_reason\|actor_id\|created_at\|publish\|send\|social\|pricing\|support" .planning/evidence/approval-claim-blocking-policy.md` >= 16 |
| B-7 | 209-05-01 | `grep -c "research_context_id\|tenant_id\|topic_key\|claim_type\|source_classes\|evidence_refs\|freshness_status\|reuse_decision\|reuse_reason\|insufficiency_reason\|created_by_run_id\|reused_by_run_ids\|expires_at\|updated_at\|reuse\b\|refresh\|insufficient" .planning/evidence/research-context-reuse.md` >= 17 |
| B-8 | 209-06-01 | `grep -c "supported_claim\|unsupported_claim\|stale_claim\|contradictory_claim\|pricing_claim\|public_proof_claim\|inferred_claim" .planning/evidence/hallucination-defense-fixtures.md` >= 7 |
| B-9 | 209-06-02 | `grep -c "tenant0_public_proof\|pr\|reviews\|events\|abm\|referral\|partnerships\|developer_marketing\|future_consumer" .planning/evidence/future-claim-evidence-matrix.md` >= 9 |
| B-10 | 209-06-02 | `grep -c "209-01-00\|209-01-01\|209-02-01\|209-03-01\|209-04-01\|209-05-01\|209-06-01\|209-06-02" .planning/phases/209-evidence-research-and-claim-safety/209-VALIDATION.md` >= 8 |

### Cross-cutting carry-forward ACs (X-* — Plan 209-04 evidence-summary.tsx, 10 total)

| AC | Carry | Verification Command |
|----|-------|----------------------|
| X-1 | D-08 token-only | `! grep -nE "#[0-9a-fA-F]{3,8}" app/(markos)/operations/approvals/evidence-summary.tsx` returns 0 |
| X-2 | D-09 mint-as-text via `--color-primary-text` | `! grep -nE "background:[[:space:]]+var\(--color-primary\)[^-]" app/(markos)/operations/approvals/evidence-summary.tsx` returns 0 |
| X-3 | D-09b `.c-notice` mandatory | `! grep -nE "className=\"(banner\|alert\|warning\|evidence-state)" app/(markos)/operations/approvals/evidence-summary.tsx` returns 0 |
| X-4 | D-13 `.c-card--feature` zero usage | `grep -c "c-card--feature" app/(markos)/operations/approvals/evidence-summary.tsx` returns 0 |
| X-5 | D-14 vanilla `<table>` only | `grep -c "c-table" app/(markos)/operations/approvals/evidence-summary.tsx` returns 0 |
| X-6 | D-15 sub-component co-located | `! find components/markos/operator -name "evidence-summary*" 2>/dev/null` returns nothing |
| X-7 | Touch-target ≥44px | manual + Storybook iPhone 14 Pro viewport check |
| X-8 | Banned-lexicon + no exclamation points | `! grep -nE "synergy\|leverage\|empower\|unlock\|transform\|revolutionize\|supercharge\|holistic\|seamless\|cutting-edge\|innovative\|game-changer\|next-generation\|world-class\|best-in-class\|reimagine\|disrupt\|just[[:space:]]" app/(markos)/operations/approvals/evidence-summary.tsx` returns 0 |
| X-9 | No emoji (bracketed glyphs only) | `! grep -nE "[\xF0-\xF7][\x80-\xBF]{3}" app/(markos)/operations/approvals/evidence-summary.tsx` returns 0 |
| X-10 | `prefers-reduced-motion` honored | inherited from parent; manual OS-level check |

### Inheritance citations (load-bearing)

- **206-UI-SPEC §Downstream:** mutation-class doctrine (`external.send | billing.charge | connector.mutate | price.change | public.claim | data.export`); `default_approval_mode`; `evidence_required`; `autonomy_ceiling` — all consumed in 209-04-02 override CTA + 209-04-01 mutation-class binding.
- **207-UI-SPEC §Downstream:** `RunApiEnvelope.run_id` linked via `EvidenceMap.created_by_run_id` (209-01-01) + `ResearchContextRecord.created_by_run_id`/`reused_by_run_ids` (209-05-01) + `commitOverride(snapshot, reason, run_id) -> AuditEvent` (209-04-01).
- **208-UI-SPEC §Surface D — Approval Inbox:** PARENT surface; 209-04 sub-component REPLACES `<PlaceholderBanner variant="future_phase_209">`; preserves parent Approve/Decline/Snooze CTAs; mobile_priority: critical inherited.
- **213.4 carry-forward (D-08..D-15):** All 6 decisions enforced via X-1..X-6 grep gates on evidence-summary.tsx; D-08 (token-only), D-09 (mint-as-text), D-09b (.c-notice mandatory), D-13 (.c-card--feature zero), D-14 (vanilla `<table>`), D-15 (selective extraction).

### Forward translation gates

- `<PlaceholderBanner variant="future_phase_210">` for `claim_type == 'competitive'` connector-derived evidence — dissolves when P210 ships.
- `<PlaceholderBanner variant="future_phase_212">` for `inference_label == 'inferred'` learning-fixture evidence — dissolves when P212 ships.
- `{{MARKOS_PRICING_ENGINE_PENDING}}` placeholder verbatim until P205 attaches PricingRecommendation context (per CLAUDE.md placeholder rule).

---

## Dimensions Coverage (Nyquist 8 dimensions)

| Dimension | Status | Coverage |
|-----------|--------|----------|
| 1. Requirements coverage | DRAFT | `EVD-01..06` and `QA-01..15` are distributed across Plans 01-06; upstream families remain integration inputs rather than primary ownership |
| 2. Anti-shallow execution | DRAFT | Each plan includes explicit `read_first`, `action`, `acceptance_criteria`, `verify`, and `done` blocks |
| 3. Architecture-lock | LOCKED | Plan 01 owns the preflight, unsupported-claim guardrails, and nonstandard-surface lock |
| 4. Compliance enforcement | LOCKED | Plans 02-04 require pricing evidence, public-claim posture, and approval blocking before customer-facing claims are trusted |
| 5. Cross-phase coordination | LOCKED | Plan 01 hard-gates Phase 209 on P205-P208 readiness rather than letting evidence work absorb missing upstream systems |
| 6. Single-writer / governance posture | LOCKED | Phase 209 creates evidence contracts and claim-safety rules; it does not re-own pricing, loop, or approval-surface substrate |
| 7. Test runner pinned | LOCKED | Node `--test`; no `vitest`, no `playwright` |
| 8. Validation strategy (this doc) | DRAFT | Full sampling strategy defined; frontmatter stays false until execution proves Wave 0 and task coverage |

---

*Phase: 209-evidence-research-and-claim-safety*
*Validation strategy created: 2026-04-27*
*Source: 209-RESEARCH.md + 209-REVIEWS.md*
