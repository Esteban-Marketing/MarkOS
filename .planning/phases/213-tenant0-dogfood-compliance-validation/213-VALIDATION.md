---
phase: 213
slug: tenant0-dogfood-compliance-validation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-27
ui_spec_fold_applied: 2026-04-29
ui_spec_fold_variant: light-fold-no-ui-scope
---

# Phase 213 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node `--test` |
| **Config file** | none - uses the built-in Node runner |
| **Quick run command** | `npm test -- test/tenant-zero/phase-213/preflight/` |
| **Full suite command** | `npm test -- test/tenant-zero/phase-213/` |
| **Estimated runtime** | ~30-60s |

---

## Sampling Rate

- **After every task commit:** Run the plan-specific domain suite, or `npm test -- test/tenant-zero/phase-213/preflight/` for Wave 0.5 work.
- **After every plan wave:** Run `npm test -- test/tenant-zero/phase-213/`.
- **Before `/gsd-verify-work`:** Full suite must be green.
- **Max feedback latency:** ~60s

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 213-01-00 | 01 | 1 | QA-01, QA-02 | preflight | `npm test -- test/tenant-zero/phase-213/preflight/` | ❌ W0 | ⬜ pending |
| 213-01-01 | 01 | 1 | T0-01, T0-02 | workspace+policy | `npm test -- test/tenant-zero/phase-213/preflight/` | ❌ W0 | ⬜ pending |
| 213-02-01 | 02 | 2 | T0-01, T0-02 | loop-flow | `npm test -- test/tenant-zero/phase-213/domain-2/` | ❌ W0 | ⬜ pending |
| 213-03-01 | 03 | 3 | T0-03 | pricing-gate | `npm test -- test/tenant-zero/phase-213/domain-3/` | ❌ W0 | ⬜ pending |
| 213-04-01 | 04 | 4 | T0-04 | claim-audit | `npm test -- test/tenant-zero/phase-213/domain-4/` | ❌ W0 | ⬜ pending |
| 213-05-01 | 05 | 5 | T0-05, QA-14 | matrix+gap-register | `npm test -- test/tenant-zero/phase-213/domain-5/requirement-matrix.test.js` | ❌ W0 | ⬜ pending |
| 213-05-02 | 05 | 5 | T0-05, QA-15 | go-no-go | `npm test -- test/tenant-zero/phase-213/domain-5/go-no-go-decision.test.js` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky · ❌ W0 = file does not exist yet (created in Wave 0)*

---

## UI-SPEC AC Coverage Map

> Light-fold map applied 2026-04-29. Phase 213 is `ui_scope: NO_UI` per 213-UI-SPEC.md frontmatter. Each backend doctrine assertion below derives from a load-bearing 213-UI-SPEC.md section and is enforced as a CI gate by the named script + test surface. Translation-gate dissolutions/openings, downstream UI inheritance citations, 213.4 carry-forward (D-08..D-15), and cross-cutting doctrine binding to 206/207/208/209/210/211/212 are recorded for traceability so future surfaces consuming 213 substrate can cite their lineage.

### Backend doctrine assertions (verbatim string enforcement per task)

| AC ID | Assertion | UI-SPEC source section | Owning task | Enforcing surface |
|-------|-----------|------------------------|-------------|-------------------|
| BD-01 | 3 architecture-lock forbidden strings: `synthetic proof`, `fake case study`, `mock customer logo` (verbatim, rejected by CI) | 213-UI-SPEC.md §Copywriting Contract (architecture-lock forbidden strings) + §DESIGN.md Compliance Assertions (architecture-lock row) | 213-01-00 | `scripts/tenant-zero/check-architecture-lock.mjs` + `test/tenant-zero/phase-213/preflight/architecture-lock.test.js` |
| BD-02 | Banned-lexicon zero-match in `.planning/tenant-zero/*.md` (CLAUDE.md 17-word list + `just`-as-softener + exclamation points + emoji) | 213-UI-SPEC.md §Copywriting Contract (CLAUDE.md banned lexicon) + §DESIGN.md Compliance Assertions (banned-lexicon row) | 213-01-00 (gate) + 213-01-01 + 213-02-01 + 213-03-01 + 213-04-01 + 213-05-01 + 213-05-02 (zero-match in their authored doctrine) | `scripts/tenant-zero/check-architecture-lock.mjs` + `scripts/tenant-zero/audit-public-claims.mjs` (213-04 9-row banned-phrases enforcement) |
| BD-03 | Sentinel `{{MARKOS_PRICING_ENGINE_PENDING}}` discipline: appears verbatim on every `placeholder_only` surface; removal hard-gated by `release_ready` + `recommendation_id` + `approval_ref` + `evidence_fresh: true` | 213-UI-SPEC.md §Public Pricing Release-Gate Copy Contract §Sentinel-discipline rules | 213-03-01 | `scripts/tenant-zero/audit-public-pricing.mjs` + `scripts/tenant-zero/assert-pricing-linkage.mjs` + `test/tenant-zero/phase-213/domain-3/pricing-placeholder-regression.test.js` |
| BD-04 | 4 canonical `release_reason` literals verbatim: `pricing_engine_not_yet_activated`, `recommendation_approval_missing`, `evidence_freshness_expired`, `compliance_posture_insufficient` | 213-UI-SPEC.md §Public Pricing Release-Gate Copy Contract §Blocking-reason copy contract (4-row table) | 213-03-01 | `scripts/tenant-zero/audit-public-pricing.mjs` source contains all 4 verbatim |
| BD-05 | 9-row banned-phrases table verbatim (case-insensitive substring match on author-time): SOC 2 overreach, enterprise-grade overreach, comparative claims without evidence, 17-word CLAUDE.md banned-lexicon, `just`-as-softener, exclamation points, emoji, hedging without evidence, `production-grade` overreach | 213-UI-SPEC.md §Public Proof Boundary Copy Contract §Banned phrases (9-row table) | 213-04-01 | `scripts/tenant-zero/audit-public-claims.mjs` + `test/tenant-zero/phase-213/domain-4/public-claim-audit.test.js` |
| BD-06 | Allowed-phrasing template `MarkOS Tenant 0 ran <verb-phrase> with <evidence_ref linkage> in <time window>` enforced as the constrained shape for Tenant 0 case-study claims | 213-UI-SPEC.md §Public Proof Boundary Copy Contract §Allowed phrasing template | 213-04-01 | `scripts/tenant-zero/audit-public-claims.mjs` enforces substring marker `MarkOS Tenant 0 ran` |
| BD-07 | 3 forward translation gates OPENED: `future_phase_214_saas_suite_activation`, `future_saas_country_suite`, `future_tenant0_ongoing_monitoring` | 213-UI-SPEC.md §Translation Gate Dissolution and Opening (gates opened by Phase 213) | 213-05-02 | `scripts/tenant-zero/render-go-no-go.mjs` references all 3 verbatim |
| BD-08 | 2 upstream translation gates DISSOLVED: 211-UI-SPEC §Translation Gates Opened (`future_phase_213_tenant0` for loop-readiness) + 212-UI-SPEC §Translation Gates Opened (`future_phase_213_tenant0` for learning-readiness) | 213-UI-SPEC.md §Translation Gate Dissolution and Opening (gates dissolved by Phase 213) | 213-02-01 (loop-01 chain) + 213-05-01 (LRN family row in matrix) | `scripts/tenant-zero/verify-first-loop.mjs` + `scripts/tenant-zero/verify-vault-codebase-readiness.mjs` |
| BD-09 | 7-column requirement-matrix schema verbatim: `family`, `owner_phase`, `implementation_surface`, `test_surface`, `evidence_surface`, `status`, `blocker` | 213-UI-SPEC.md §Downstream UI Inheritance Map row "Requirements coverage matrix browser" | 213-05-01 | `test/tenant-zero/phase-213/domain-5/requirement-matrix.test.js` |
| BD-10 | 9 family literals verbatim: `PRC`, `COMP`, `RUN`, `TASK`, `EVD`, `CONN`, `LOOP`, `LRN`, `T0` | 213-UI-SPEC.md §Copywriting Contract claim-class vocabulary + §Downstream UI Inheritance Map "Requirements coverage matrix browser" filter chips | 213-05-01 | `test/tenant-zero/phase-213/domain-5/requirement-matrix.test.js` contains all 9 verbatim |
| BD-11 | 6-field unresolved-gap envelope verbatim: `gap_id`, `description`, `owner`, `route`, `severity`, `closure_condition` | 213-UI-SPEC.md §Downstream UI Inheritance Map row "Unresolved-gap register browser" | 213-05-01 | `scripts/tenant-zero/verify-vault-codebase-readiness.mjs` |
| BD-12 | 3 go/no-go status literals verbatim: `green`, `yellow`, `red` (no intermediate or extended literals) | 213-UI-SPEC.md §Copywriting Contract go/no-go vocabulary + §Downstream UI Inheritance Map "Go/No-Go decision artifact viewer" | 213-05-02 | `test/tenant-zero/phase-213/domain-5/go-no-go-decision.test.js` |
| BD-13 | 4 phase sections + 1 hard_blockers section verbatim: `P214`, `P215`, `P216`, `P217`, `hard_blockers` | 213-UI-SPEC.md §Downstream UI Inheritance Map "Go/No-Go decision artifact viewer" (one section per phase + shared hard_blockers) | 213-05-02 | `test/tenant-zero/phase-213/domain-5/go-no-go-decision.test.js` |
| BD-14 | Exact sentence `doc 17 remains future-routing context` verbatim in `final-readiness-summary.md` | 213-UI-SPEC.md §Copywriting Contract + §Downstream UI Inheritance Map "Go/No-Go decision artifact viewer" footer-render rule | 213-05-02 | `test/tenant-zero/phase-213/domain-5/go-no-go-decision.test.js` |
| BD-15 | 3 claim-class literals verbatim: `implemented_verified`, `roadmap_only`, `internal_only` | 213-UI-SPEC.md §Copywriting Contract claim-class vocabulary | 213-04-01 | `test/tenant-zero/phase-213/domain-4/public-claim-audit.test.js` |
| BD-16 | 4 compliance-status literals verbatim: `designed_control`, `type1_in_preparation`, `type1_verified`, `type2_future` | 213-UI-SPEC.md §Copywriting Contract compliance-language vocabulary | 213-04-01 | `test/tenant-zero/phase-213/domain-4/compliance-language-boundary.test.js` |
| BD-17 | 7-field case-study envelope verbatim: `claim_id`, `surface`, `evidence_ref`, `approval_ref`, `fresh_until`, `privacy_class`, `status` | 213-UI-SPEC.md §Downstream UI Inheritance Map row "Public-claim audit summary browser" | 213-04-01 | `scripts/tenant-zero/audit-public-claims.mjs` + `test/tenant-zero/phase-213/domain-4/public-claim-audit.test.js` |
| BD-18 | 3 pricing-classification literals verbatim: `placeholder_only`, `release_ready`, `blocked` | 213-UI-SPEC.md §Copywriting Contract pricing-classification vocabulary | 213-03-01 | `scripts/tenant-zero/audit-public-pricing.mjs` |
| BD-19 | 5 audit-target paths SCAN ONLY (NEVER modified): `app/(marketing)/integrations/claude/page.tsx`, `app/(marketing)/docs/[[...slug]]/page.tsx`, `app/docs/llms-full.txt/route.ts`, `public/llms.txt`, `docs/pricing/public-tier-placeholder.md` | 213-UI-SPEC.md §Scope Verification (audit-target vs. modified-target disambiguation) | 213-03-01 | `scripts/tenant-zero/audit-public-pricing.mjs` source contains all 5 path strings verbatim; 213-03 `files_modified` block contains zero of these |
| BD-20 | 5 canonical loop statuses verbatim: `approval_status: approved`, `claim_status: evidence_backed`, `dispatch_status: published \| ready_to_publish`, `measurement_window_days: 7`, `learning_handoff_status: recorded` | 213-UI-SPEC.md §Downstream UI Inheritance Map row "Tenant 0 dogfood runlog timeline" | 213-02-01 | `scripts/tenant-zero/verify-first-loop.mjs` + `test/tenant-zero/phase-213/domain-2/*.test.js` |
| BD-21 | 3 connector-status literals verbatim from 210-UI-SPEC.md: `healthy`, `degraded`, `unavailable` | 213-UI-SPEC.md §Downstream UI Inheritance Map row "Connector inventory + data-source policy viewer" + 210-UI-SPEC inheritance | 213-01-01 | `scripts/tenant-zero/assert-tenant-workspace-ready.mjs` |
| BD-22 | 3 data-source-policy section headings verbatim: `## Public Evidence`, `## Private Internal`, `## Never Exported` | 213-UI-SPEC.md §Downstream UI Inheritance Map "Connector inventory + data-source policy viewer" (Never-Exported hard-block) | 213-01-01 | `test/tenant-zero/phase-213/preflight/public-private-policy.test.js` |
| BD-23 | Workspace-profile literal `publish_if_healthy_else_ready_to_publish` verbatim | 213-UI-SPEC.md §Downstream UI Inheritance Map "Tenant 0 readiness dashboard" + 210 connector inheritance | 213-01-01 | `scripts/tenant-zero/assert-tenant-workspace-ready.mjs` |

### Translation gate dissolutions/openings traceability

| Gate ID | Direction | Variant | Owning plan/task | Dissolution/opening rule |
|---------|-----------|---------|------------------|--------------------------|
| TG-D-01 | DISSOLVED | `future_phase_213_tenant0` (211 loop-readiness) | 213-02-01 produces full 6-artifact loop-01 chain | Per 211-UI-SPEC §Translation Gates Opened — dissolves once `claim_status: evidence_backed` + `approval_status: approved` + `dispatch_status: published \| ready_to_publish` + `measurement_window_days: 7` + `learning_handoff_status: recorded` |
| TG-D-02 | DISSOLVED | `future_phase_213_tenant0` (212 learning-readiness) | 213-02-01 produces `loop-01-learning-handoff.json` + 213-05-01 maps LRN family row | Per 212-UI-SPEC §Translation Gates Opened — dissolves once `learning_handoff_status: recorded` + LRN row in `requirement-implementation-matrix.md` |
| TG-O-01 | OPENED | `future_phase_214_saas_suite_activation` (covers P214-P217) | 213-05-02 produces `214-217-go-no-go.md` | Per 213-UI-SPEC §Translation Gate Dissolution and Opening — `red` status is a hard workflow lock; `yellow` requires operator override; `green` unlocks |
| TG-O-02 | OPENED | `future_saas_country_suite` (post-P217) | 213-05-02 + Tenant 0 governance scaffold | Per 213-UI-SPEC §Translation Gate Dissolution and Opening — country-suite tenants inherit Tenant 0 governance verbatim |
| TG-O-03 | OPENED | `future_tenant0_ongoing_monitoring` (live monitoring) | 213-05-02 + ALL of 213 doctrine | Per 213-UI-SPEC §Translation Gate Dissolution and Opening — out-of-scope for v4.0.0 |
| TG-O-04 | OPENED | `future_gap_resolution` (per-gap; secondary) | 213-05-01 unresolved-gap-register | Per 213-UI-SPEC §Translation Gate Dissolution and Opening — dissolves per gap once `closure_condition` met |
| TG-O-05 | OPENED | `future_compliance_language_log` (post-P206 SOC 2 Type II; secondary) | 213-04-01 compliance-language-boundary | Per 213-UI-SPEC §Translation Gate Dissolution and Opening — out-of-scope for v4.0.0 |

### Downstream UI inheritance citations (12 future surfaces)

| Future surface | Originating doctrine | Owning plan | Surface phase (illustrative) |
|----------------|---------------------|-------------|------------------------------|
| Tenant 0 readiness dashboard (single-pane health) | `workspace-profile.json` + `connector-inventory.json` + `data-source-policy.md` + `public-proof-allowlist.md` + `213-upstream-readiness.md` + `loop-01-*` chain + `final-readiness-summary.md` | 213-01 + 213-02 + 213-05 | P217+ marketing-site readiness panel or future enterprise admin |
| Public-pricing release-gate report viewer | `public-pricing-audit.md` + `public-pricing-release-gate.json` + `recommendation-linkage.md` | 213-03 | P205 follow-up admin or future enterprise admin |
| Case-study editor with public-proof boundary enforcement | `public-proof-policy.md` + `case-study-readiness-checklist.md` + `compliance-language-boundary.md` + 213-UI-SPEC §Public Proof Boundary Copy Contract | 213-04 | P217+ marketing-site editor (DUAL mutation-class `public.claim` + `external.send`) |
| Requirements coverage matrix browser | `requirement-implementation-matrix.md` | 213-05 | Future enterprise admin or P217+ vault-codebase compliance dashboard |
| Unresolved-gap register browser | `unresolved-gap-register.md` | 213-05 | Future enterprise admin or P217+ vault-codebase compliance dashboard |
| Go/No-Go decision artifact viewer (P214-P217 gate) | `214-217-go-no-go.md` + `final-readiness-summary.md` | 213-05 | P214 SaaS Suite Activation cockpit + P215/P216/P217 cockpits (`data.export` mutation) |
| Tenant 0 dogfood runlog timeline | `loop-01-brief.md` + `loop-01-claim-map.json` + `loop-01-approval-log.md` + `loop-01-dispatch-log.json` + `loop-01-outcome.md` + `loop-01-learning-handoff.json` | 213-02 | Future enterprise admin or P217+ Tenant 0 health dashboard |
| Connector inventory + data-source policy viewer | `connector-inventory.json` + `data-source-policy.md` | 213-01 | Future enterprise admin or P210 connector recovery extension |
| P214-P217 readiness panel (SaaS Suite Activation gate) | `214-217-go-no-go.md` + `requirement-implementation-matrix.md` + `unresolved-gap-register.md` + `final-readiness-summary.md` | 213-05 | P214 SaaS Suite Activation cockpit (entry gate) |
| Compliance-language audit log | `compliance-language-boundary.md` + `public-claim-audit-summary.md` | 213-04 | Future compliance-monitoring phase (post-P206 SOC 2 Type II) or P217+ enterprise admin |
| Public-claim audit summary browser | `public-claim-audit-summary.md` | 213-04 | P217+ marketing-site editor pre-publish gate or future enterprise admin |
| Tenant 0 ongoing-monitoring health panel | ALL of 213 doctrine + future ongoing-monitoring substrate | All 5 plans | Future ongoing-monitoring phase (TBD; out-of-scope for v4.0.0) |

### 213.4 carry-forward (D-08..D-15) applicable rows

> Per 213-UI-SPEC.md §Downstream UI Inheritance Map decision-table; the 213.x decimal phases (213.1, 213.2, 213.3, 213.4) closed 2026-04-29 per STATE.md. Decisions D-08..D-15 are inherited verbatim into every future surface that consumes 213 doctrine.

| Decision | Carry-forward rule | Applies to (future surface) |
|----------|---------------------|------------------------------|
| D-08 (token-only) | Zero inline hex; every color via `var(--color-*)`; every spacing via `var(--space-*)`; every typography via DESIGN.md `typography.*` token | All 12 future surfaces enumerated above |
| D-09 (mint-as-text) | Protocol Mint via `--color-primary-text` for `.c-button--tertiary` link CTAs and `.c-chip-protocol` IDs only; never as fill on surfaces > button/chip | Tenant-0 workspace-profile ID copy-link CTAs, loop-01 brief-ID chips, claim-ID chips, recommendation-ID chips, gap-ID chips, route mint-chip deep-links |
| D-09b (`.c-notice` mandatory) | Every Tenant-0 readiness notice (upstream-gate-failed, workspace-not-ready, loop-blocked, pricing-blocked, proof-blocked, gap-open, gate-red), every go/no-go status notice composes `.c-notice c-notice--{info,warning,success,error}` | All 12 future surfaces; 4 compliance-status literals map to notice variants |
| D-13 (`.c-card--feature` reserved) | `.c-card--feature` reserved for hero panels in 404-workspace + 213.5 marketing; future Tenant-0 surfaces use `.c-card` default | Tenant-0 readiness dashboard, dogfood runlog timeline, public-proof claim browser, pricing release-gate viewer, requirement-matrix browser, gap-register browser, go/no-go decision viewer, connector-inventory browser, data-source-policy browser, compliance-language audit log |
| D-14 (no `.c-table` primitive) | Future tabular surfaces use vanilla `<table>` semantic + token-only recipe on `<th>`/`<td>` + `.c-badge--{state}` for row state | Requirement-implementation-matrix browser, unresolved-gap register browser, public-pricing release-gate per-surface table, public-claim audit-summary table, connector-inventory table, dogfood-runlog timeline table, go/no-go per-phase table |
| D-15 (selective extraction) | Pages co-locate with their tenant-zero-record read first; primitives extract only when reuse is proven across ≥2 surfaces | Go/no-go status badge in P214 cockpit + P217 marketing-readiness dashboard reuse pattern |

### Cross-cutting doctrine binding (206/207/208/209/210/211/212)

| Parent UI-SPEC | Doctrine inherited | Binding plan | Binding rule |
|----------------|--------------------|--------------|--------------|
| 206-UI-SPEC.md | mutation-class doctrine origin | 213-04 (case-study `public.claim` DUAL with `external.send`); 213-05 (go/no-go + final readiness `data.export`) | Every 213-substrate destructive action maps to one of the 6 `mutation_class` literals; default approval mode `dual_approval` minimum for downstream consumers |
| 207-UI-SPEC.md | RunApiEnvelope + AgentRunEventType + ApprovalHandoffRecord | 213-02 (loop-01 runs link via `agent_run_id`); 213-04 (approval log inherits ApprovalHandoffRecord) | Every loop-01 artifact includes or links to an `agent_run_id`; future runlog timeline deep-links back to AgentRun trace |
| 208-UI-SPEC.md | Operator cockpit (Approval Inbox, Recovery Center, Weekly Narrative, Morning Brief, Task Board) | 213-02 (cockpit CONSUMED in production by dogfood loop, NOT modified) | Modifying any P208 file in 213 would invalidate the dogfood proof; 213 itself does not modify any P208 file |
| 209-UI-SPEC.md | EvidenceMap substrate + `<EvidenceSummary />` | 213-02 (every claim has `evidence_ref` linkage; `claim_status: evidence_backed`); 213-04 (case-study editor reuses `<EvidenceSummary />` read-only) | Future readiness dashboards reuse `<EvidenceSummary />` as a read-only consumer; missing evidence blocks publish |
| 210-UI-SPEC.md | Connector substrate (3 status literals `healthy`, `degraded`, `unavailable`) | 213-01 (`connector-inventory.json` reads `ConnectorInstall` health); 213-02 (degraded → `dispatch_status: ready_to_publish` blocker, NEVER fake) | Connector substrate is CONSUMED in production, NOT modified |
| 211-UI-SPEC.md | Loop substrate (PARENT — `MarketingStrategyRun → MeasurementHandoff` chain) | 213-02 (Tenant 0 dogfood IS one real 211 chain); 213-05 (matrix LOOP family row) | 6 loop-01 artifacts map 1:1 to 211 envelope; loop substrate is CONSUMED in production, NOT modified |
| 212-UI-SPEC.md | Learning substrate (PARENT — ArtifactPerformanceLog, TenantOverlay, LearningRecommendation) | 213-02 (`learning_handoff_status: recorded` binding handshake); 213-05 (matrix LRN family row) | Loop ends in `learning_handoff_status: recorded`; learning substrate is CONSUMED in production, NOT modified |

---

## Wave 0 Requirements

- [ ] `.planning/tenant-zero/213-upstream-readiness.md` - authoritative P205-P212 readiness checklist with blocker ownership.
- [ ] `scripts/tenant-zero/check-upstream-readiness.mjs` - hard and soft preflight for upstream execution outputs.
- [ ] `scripts/tenant-zero/check-architecture-lock.mjs` - forbidden-pattern detector for fake proof, invalid public-pricing release, and nonstandard test/router surfaces. Enforces banned-lexicon zero-match in `.planning/tenant-zero/*.md` per BD-02.
- [ ] `scripts/tenant-zero/assert-tenant-workspace-ready.mjs` - workspace-profile, connector inventory, and data-policy validator.
- [ ] `test/tenant-zero/phase-213/preflight/upstream-readiness.test.js`
- [ ] `test/tenant-zero/phase-213/preflight/architecture-lock.test.js`
- [ ] `test/tenant-zero/phase-213/preflight/workspace-baseline.test.js`
- [ ] `test/tenant-zero/phase-213/preflight/public-private-policy.test.js`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Real connector publication sanity check | T0-02, CONN-01..06 | The first dogfood loop may end in `published` or `ready_to_publish` depending on live connector health. An operator must confirm the state is honest. | Review the loop dispatch artifact; confirm the connector status matches reality and that degraded connectors produce a recovery blocker instead of fake publication. |
| Public proof wording review | T0-04, COMP-01 | Evidence can be audited automatically, but final public language still needs human review for nuance and overclaim risk. | Read the public claim audit summary and the compliance language boundary doc; confirm every public sentence is classified as `implemented_verified`, `roadmap_only`, or `internal_only`. |
| 214-217 go/no-go readout | T0-05 | The gate is an operational decision, not just a parser result. | Review the final readiness summary with the unresolved-gap register and confirm the go/no-go artifact explicitly calls out green, yellow, or red status for Phases 214-217. |

---

## Validation Architecture

- **Preflight:** upstream readiness, architecture lock, workspace-profile integrity, public/private data classification
- **Domain 2:** first real loop artifact chain from brief -> claim map -> approval -> dispatch -> measurement -> learning handoff
- **Domain 3:** pricing placeholder regression, approved recommendation linkage, release gate classification (4 `release_reason` literals)
- **Domain 4:** public claim audit (9-row banned-phrases table + allowed-phrasing template), case-study readiness policy, compliance language boundary (4 status literals)
- **Domain 5:** requirement matrix completeness (7-column schema + 9 family literals), unresolved-gap visibility (6-field envelope), 214-217 go/no-go determinism (4 phase sections + `hard_blockers` + 3 status literals + verbatim doc-17 sentence)

Architecture lock runs first in every wave. It should verify:

- required posture exists: `{{MARKOS_PRICING_ENGINE_PENDING}}`, `buildGovernanceEvidencePack`, `buildReadinessReport`, `normalizeAgentRunUsageEvent`, and the Phase 205 Tenant 0 pricing dogfood artifacts
- forbidden phase-213 patterns do not appear: `vitest`, `playwright`, `.test.ts`, `route.ts`, `synthetic proof`, `fake case study`, `mock customer logo`
- banned-lexicon zero-match across `.planning/tenant-zero/*.md` per BD-02 (CLAUDE.md 17-word list + `just`-as-softener + exclamation points + emoji)

---

## Dimensions Coverage (Nyquist 8 dimensions)

| Dimension | Status | Coverage |
|-----------|--------|----------|
| 1. Requirements coverage | DRAFT | `T0-01..05` and `QA-01..15` are distributed across Plans 01-05; upstream families remain integration inputs rather than primary ownership |
| 2. Anti-shallow execution | DRAFT | Each plan includes explicit `read_first`, `action`, `acceptance_criteria`, `verify`, `done`, AND `<ui_spec_fold>` blocks (light fold applied 2026-04-29) |
| 3. Architecture-lock | LOCKED | Plan 01 owns the preflight, fake-proof guard, public-pricing guard, test-surface lock, AND banned-lexicon zero-match per BD-02 |
| 4. Compliance enforcement | LOCKED | Plans 03-05 require evidence linkage, approval linkage, freshness status, explicit go/no-go status, AND 4-row `release_reason` literal verbatim enforcement (BD-04) AND 9-row banned-phrases verbatim enforcement (BD-05) |
| 5. Cross-phase coordination | LOCKED | Plan 01 hard-gates execution on Phases 205-212 outputs; UI-SPEC fold cross-cutting doctrine binding to 206/207/208/209/210/211/212 documented per cross-cutting-doctrine-binding map above |
| 6. Single-writer / governance posture | LOCKED | P213 validates and links upstream artifacts; it does not re-own upstream Pricing Engine, compliance, evidence, connector, or loop substrate. 5 audit-target paths confirmed SCAN-ONLY per BD-19 (NEVER in `files_modified`) |
| 7. Test runner pinned | LOCKED | Node `--test`; no `vitest`, no `playwright` |
| 8. Validation strategy (this doc) | DRAFT | Full sampling strategy defined; UI-SPEC AC Coverage Map added 2026-04-29 with 23 backend doctrine assertions (BD-01..BD-23), 7 translation gate dissolutions/openings (TG-D-01..02 + TG-O-01..05), 12 downstream UI inheritance citations, 6 D-08..D-15 carry-forward rows, and 7 cross-cutting doctrine binding rows. Frontmatter stays false until execution proves Wave 0 and task coverage |

---

*Phase: 213-tenant0-dogfood-compliance-validation*
*Validation strategy created: 2026-04-27*
*UI-SPEC fold applied: 2026-04-29 (light fold; no-UI-scope variant; 213-UI-SPEC.md §parent_doctrine_chain + §Public Pricing Release-Gate Copy Contract + §Public Proof Boundary Copy Contract + §Translation Gate Dissolution and Opening + §Downstream UI Inheritance Map citations folded into 213-01..213-05)*
*Source: 213-RESEARCH.md + 213-REVIEWS.md + 213-UI-SPEC.md*
</content>
</invoke>