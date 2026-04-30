---
phase: 213
slug: tenant0-dogfood-compliance-validation
status: draft
shadcn_initialized: false
preset: not-applicable-no-ui-phase
domain: tenant0-dogfood-loop-public-pricing-audit-public-proof-boundary-requirements-matrix-go-no-go-decision
created: 2026-04-29
canonical_visual_contract: /DESIGN.md
design_md_version: v1.1.0
mode: no-ui-surface-phase
ui_scope: zero-surface
plans_in_scope: [213-01, 213-02, 213-03, 213-04, 213-05]
plans_with_ui_surfaces: []
parent_phase_milestone_wave_status: |
  Phases 213.1, 213.2, 213.3, 213.4 already executed earlier in the v4.0.0 milestone wave (full markos chrome
  surface to DESIGN.md v1.1.0 canon — closed 2026-04-29 per STATE.md). This document is the PARENT 213 capstone
  closeout phase: Tenant 0 dogfood + compliance validation + go/no-go gate. The 213.x decimal phases were UI
  adoption work; this 213 parent is the doctrine + audit + closeout substrate.
parent_doctrine_chain:
  - 206-UI-SPEC.md (mutation-class doctrine — `public.claim` for case-study claims, `data.export` for go/no-go report and final readiness summary, `external.send` deferred to consumers)
  - 207-UI-SPEC.md (RunApiEnvelope; AgentRunEventType; Tenant 0 dogfood loop runs link via `agent_run_id`; ApprovalHandoffRecord for loop-01 approval log)
  - 208-UI-SPEC.md (PARENT — Approval Inbox, Recovery Center, Weekly Narrative, Morning Brief, Task Board are the consumers that Tenant 0 actually uses to RUN the dogfood loop on already-shipped capability; cockpit is consumed in production, NOT modified)
  - 209-UI-SPEC.md (PARENT — case-study claims require official-grade evidence; `EvidenceMap` substrate inherits; `<EvidenceSummary />` consumed by future Tenant 0 readiness dashboards; `inference_label` posture inherits for any inferred outcome)
  - 210-UI-SPEC.md (connector substrate consumer — Tenant 0 connector inventory reads ConnectorInstall health; degraded connectors produce `dispatch_status: ready_to_publish` blocker, NEVER fake publication)
  - 211-UI-SPEC.md (PARENT — Tenant 0 dogfood loop IS one real `MarketingStrategyRun → ContentBrief → MarketingArtifact → ArtifactAudit → DispatchAttempt → RevenueFeedbackLink → MeasurementHandoff` chain; loop substrate consumed in production)
  - 212-UI-SPEC.md (PARENT — Tenant 0 learning posture reads `ArtifactPerformanceLog`, `TenantOverlay`, `LearningRecommendation` substrate; loop ends in `learning_handoff_status: recorded` per 211 and 212 contract chain)
translation_gates_dissolved_by_213:
  - "211 §Translation Gates Opened — `<PlaceholderBanner variant=\"future_phase_213_tenant0\">` for Tenant-0-dogfood-readiness loop-readiness-panel surfaces dissolves once 213-02 produces the full loop-01 artifact chain with `claim_status: evidence_backed` + `approval_status: approved` + `dispatch_status: published | ready_to_publish` + `measurement_window_days: 7` + `learning_handoff_status: recorded`"
  - "212 §Translation Gates Opened — `<PlaceholderBanner variant=\"future_phase_213_tenant0\">` for Tenant-0-learning-readiness surfaces dissolves once 213-02 produces `loop-01-learning-handoff.json` with `learning_handoff_status: recorded` and 213-05 maps the LRN family row in `requirement-implementation-matrix.md`"
translation_gates_opened_by_213:
  - "future_phase_214_saas_suite_activation — `.planning/tenant-zero/214-217-go-no-go.md` produces `green | yellow | red` gate per phase; future SaaS Suite Activation surfaces (P214 cockpit overlays, growth-mode recipes, country-suite previews) MUST render `<PlaceholderBanner variant=\"future_phase_214_saas_suite\">` with the linked go/no-go status until P214 ships and the gate flips to `green`"
  - "future_phase_220+_saas_country_suite — once a future SaaS Country Suite expansion phase lands (post P217), surfaces consuming country-suite readiness must inherit Tenant 0 governance (workspace-profile, public-proof boundary, pricing release-gate) AND render `<PlaceholderBanner variant=\"future_saas_country_suite\">` until that phase produces its own activation artifact"
  - "future_tenant0_ongoing_monitoring — Tenant 0 is not a one-shot proof; future surfaces that monitor ongoing Tenant 0 health (loop-runlog freshness, evidence-pack staleness, connector-inventory drift, public-proof claim freshness, pricing release-gate drift) render `<PlaceholderBanner variant=\"future_tenant0_ongoing_monitoring\">` until a follow-up phase ships ongoing-monitoring substrate"
---

# Phase 213 — UI Design Contract (no-UI-scope)

> **Phase 213 ships zero new UI surfaces.** This is the explicit no-surface
> declaration for the Tenant 0 Dogfood and Compliance Validation phase. There
> is no `app/`, no `components/`, no `*.stories.tsx`, no `page.tsx`, no
> `layout.tsx`, no `*.module.css`, and no `*.css` modified or created in any
> of the five plans (213-01 through 213-05).
>
> **Critical posture:** Phase 213 RUNS on already-shipped capability. The
> P208 operator cockpit (Approval Inbox, Recovery Center, Weekly Narrative,
> Morning Brief, Task Board), the P211 marketing operating loop substrate,
> the P209 evidence substrate, and the P207 RunApiEnvelope are CONSUMED by
> Tenant 0 in production — they are NOT modified by this phase. The phase's
> proof model is "MarkOS runs MarkOS on MarkOS" using the live cockpit and
> live substrate. If 213 modified those surfaces, the dogfood would no
> longer be a real proof.
>
> What Phase 213 *does* ship is the **Tenant 0 dogfood + audit + closeout
> substrate** — **doctrine + audit artifacts** (`.planning/tenant-zero/*.md`
> + `.planning/tenant-zero/*.json` + `.planning/tenant-zero/pricing/*.md|.json`
> — 23 docs covering upstream readiness, workspace profile, connector
> inventory, data-source policy, public-proof allowlist, loop-01 artifact
> chain (brief / claim-map / approval-log / dispatch-log / outcome /
> learning-handoff), public-pricing audit + release-gate + recommendation
> linkage, public-proof policy + case-study readiness checklist + compliance-
> language boundary + public-claim audit summary, requirement-implementation
> matrix, unresolved-gap register, 214-217 go/no-go decision, and final
> readiness summary), **CI assertion scripts** (`scripts/tenant-zero/*.mjs`
> — 9 Node CLI runners: `check-upstream-readiness.mjs`,
> `check-architecture-lock.mjs`, `assert-tenant-workspace-ready.mjs`,
> `run-first-loop.mjs`, `verify-first-loop.mjs`, `audit-public-pricing.mjs`,
> `assert-pricing-linkage.mjs`, `audit-public-claims.mjs`,
> `verify-vault-codebase-readiness.mjs`, `render-go-no-go.mjs`), **tests**
> (`test/tenant-zero/phase-213/{preflight, domain-2, domain-3, domain-4,
> domain-5}/*.test.js`), and **phase validation map**
> (`.planning/phases/213-tenant0-dogfood-compliance-validation/213-VALIDATION.md`).
> None of those files compose, import, or render any visual primitive from
> `styles/components.css` or any token from `app/tokens.css`. There are no
> Node API handlers added in this phase (the public surfaces audited by
> 213-03 are AUDIT TARGETS that already exist from earlier phases).
>
> However, **every downstream phase (214-217 SaaS Suite Activation, future
> 220+ SaaS Country Suite, future Tenant 0 ongoing-monitoring extensions,
> future P208 admin extensions for compliance and audit visibility) that
> consumes a Phase 213 governance contract WILL eventually need a UI
> surface** — Tenant 0 readiness dashboards, public-pricing release-gate
> viewers, case-study editors with public-proof boundary enforcement,
> requirement coverage matrix browsers, unresolved-gap register browsers,
> go/no-go decision artifact viewers, Tenant 0 dogfood runlog timelines,
> connector inventory + data-source policy viewers, P214-P217 readiness
> panels, compliance-language audit logs. This UI-SPEC therefore also
> serves as a forward-looking inheritance map so future UI-SPECs can cite
> their lineage back to the Tenant 0 doctrine defined here.
>
> Authority chain: DESIGN.md v1.1.0 → 213.x adoption-wave decisions
> (D-08, D-09, D-09b, D-13, D-14, D-15) → 206-UI-SPEC (mutation-class
> doctrine origin: `public.claim` for case-study claims, `data.export` for
> go/no-go and final readiness exports) → 207-UI-SPEC (`RunApiEnvelope`,
> `AgentRunEventType`, `ApprovalHandoffRecord`; loop-01 runs link via
> `agent_run_id`) → 208-UI-SPEC (operator-cockpit consumed in production:
> Approval Inbox handles loop-01 approval, Task Board handles brief/edit
> tasks, Recovery Center handles connector degradation, Weekly Narrative
> reads loop outcomes, Morning Brief reads loop briefs) → 209-UI-SPEC
> (case-study claims require official-grade evidence; `EvidenceMap`
> substrate inherits; `<EvidenceSummary />` reused as read-only consumer
> by future readiness dashboards) → 210-UI-SPEC (connector substrate;
> Tenant 0 `connector-inventory.json` reads `ConnectorInstall` health;
> degraded → `ready_to_publish` blocker, NEVER fake) → 211-UI-SPEC (loop
> substrate; Tenant 0 dogfood IS one real `MarketingStrategyRun →
> MeasurementHandoff` chain; future Tenant 0 readiness dashboards consume
> 211 envelopes) → 212-UI-SPEC (learning substrate; loop ends in
> `learning_handoff_status: recorded` per 211 + 212 contract chain) →
> this document. Generated by gsd-ui-researcher. Status: draft (checker
> upgrades to approved once the no-UI declaration is verified).

---

## Scope Verification

The orchestrator's preliminary finding has been verified by reading all
five plans plus context, research, reviews, and validation. The full file
set declared in `files_modified` across 213-01..213-05 is enumerated below,
with surface classification per file:

| File class | Path glob | Plan(s) | UI surface? |
|------------|-----------|---------|-------------|
| Phase validation | `.planning/phases/213-tenant0-dogfood-compliance-validation/213-VALIDATION.md` | 213-01, 213-02, 213-03, 213-04, 213-05 | NO |
| Tenant 0 readiness doctrine | `.planning/tenant-zero/213-upstream-readiness.md` | 213-01 | NO |
| Tenant 0 workspace doctrine | `.planning/tenant-zero/{workspace-profile.json, connector-inventory.json, data-source-policy.md, public-proof-allowlist.md}` (4 files) | 213-01 | NO (JSON contract + Markdown policy) |
| Tenant 0 first-loop artifact chain | `.planning/tenant-zero/{loop-01-brief.md, loop-01-claim-map.json, loop-01-approval-log.md, loop-01-dispatch-log.json, loop-01-outcome.md, loop-01-learning-handoff.json}` (6 files) | 213-02 | NO (deterministic loop-record artifacts; brief + outcome are Markdown narrative; claim-map + dispatch-log + learning-handoff are JSON envelopes) |
| Pricing audit doctrine | `.planning/tenant-zero/pricing/{public-pricing-audit.md, public-pricing-release-gate.json, recommendation-linkage.md}` (3 files) | 213-03 | NO |
| Public-proof boundary doctrine | `.planning/tenant-zero/{public-proof-policy.md, case-study-readiness-checklist.md, compliance-language-boundary.md, public-claim-audit-summary.md}` (4 files) | 213-04 | NO |
| Closeout doctrine | `.planning/tenant-zero/{requirement-implementation-matrix.md, unresolved-gap-register.md, 214-217-go-no-go.md, final-readiness-summary.md}` (4 files) | 213-05 | NO |
| CI assertion scripts | `scripts/tenant-zero/{check-upstream-readiness.mjs, check-architecture-lock.mjs, assert-tenant-workspace-ready.mjs, run-first-loop.mjs, verify-first-loop.mjs, audit-public-pricing.mjs, assert-pricing-linkage.mjs, audit-public-claims.mjs, verify-vault-codebase-readiness.mjs, render-go-no-go.mjs}` (10 files) | 213-01..213-05 | NO (Node CLI assertion runners; stdout limited to `node --test` output format and JSON gate emission) |
| Test files | `test/tenant-zero/phase-213/{preflight, domain-2, domain-3, domain-4, domain-5}/*.test.js` (~12 files) | 213-01..213-05 | NO |

**Search assertions** (verified during scope confirmation; ripgrep across
all five plan files in `files_modified` blocks):

| Assertion | Result |
|-----------|--------|
| `files_modified` glob `app/**` across 213-01..213-05 | 0 matches |
| `files_modified` glob `app/(markos)/**` across 213-01..213-05 | 0 matches |
| `files_modified` glob `app/(marketing)/**` across 213-01..213-05 | 0 matches |
| `files_modified` glob `components/**` across 213-01..213-05 | 0 matches |
| `files_modified` glob `*.stories.tsx` across 213-01..213-05 | 0 matches |
| `files_modified` glob `stories/**` or `.storybook/**` across 213-01..213-05 | 0 matches |
| `files_modified` glob `*.module.css` or `*.css` across 213-01..213-05 | 0 matches |
| `files_modified` containing `page.tsx`, `layout.tsx`, or `route.tsx` | 0 matches |
| `files_modified` containing `*.scss`, `*.sass`, `tailwind.config.*`, `app/globals.css`, `app/tokens.css`, `styles/components.css` | 0 matches |
| `files_modified` containing `route.ts` (Phase 213 architecture-lock forbidden string) | 0 matches |
| `files_modified` glob `lib/**` (typed runtime modules — non-UI) | 0 matches (213 ships scripts + doctrine only; runtime substrate inherited from P205-P212) |
| `files_modified` glob `api/**` (Node API handlers) | 0 matches |
| `files_modified` glob `supabase/migrations/**` (DDL) | 0 matches |

**Disambiguation note (audit-target paths vs. modified paths):** The
following public surfaces appear in 213-03's `<read_first>` and as scan-
target string literals embedded in `scripts/tenant-zero/audit-public-pricing.mjs`
— but they are NEVER in any `files_modified` block:

- `app/(marketing)/integrations/claude/page.tsx` — Phase 200 Claude integration page; AUDIT TARGET only
- `app/(marketing)/docs/[[...slug]]/page.tsx` — Phase 200 marketing-docs page; AUDIT TARGET only
- `app/docs/llms-full.txt/route.ts` — Phase 204 LLMs-full route handler; AUDIT TARGET only
- `public/llms.txt` — Phase 204 static LLMs surface; AUDIT TARGET only
- `docs/pricing/public-tier-placeholder.md` — Phase 205 pricing placeholder doc; AUDIT TARGET only

The audit script reads these surfaces, scans for the exact sentinel
`{{MARKOS_PRICING_ENGINE_PENDING}}` (or for an explicit Phase 205
release-gate approval row in `public-pricing-release-gate.json`), and
classifies each as `placeholder_only`, `release_ready`, or `blocked` —
without modifying any of them. Surface-content edits to those public
surfaces are the responsibility of P205 follow-up (when an approved
PricingRecommendation lands) or P217+ marketing-site phases (when a
case-study editor with public-proof boundary enforcement ships).

**Disambiguation note (existing surfaces NOT modified by 213):** The P208
operator cockpit (`app/(markos)/operations/{tasks, approvals, recovery,
narrative, morning}/page.tsx` — already shipped), the P211 loop substrate
(`lib/markos/loop/**` — already shipped), the P209 evidence substrate
(`lib/markos/evidence/**` + `<EvidenceSummary />` — already shipped), and
the P210 connector substrate (`lib/markos/connectors/**` — already
shipped) are CONSUMED in production by Tenant 0 during the 213-02 first
loop. The dogfood proof requires that these surfaces work for a real
tenant under real conditions — modifying them in 213 would invalidate
the proof. **213 itself does not modify any P207, P208, P209, P210,
P211, or P212 file.**

**Disambiguation note (213.x decimal phases vs. 213 parent phase):**
Phases 213.1, 213.2, 213.3, and 213.4 already executed earlier in the
v4.0.0 milestone wave (per STATE.md "Phase 213.4 Plan Progress" closed
2026-04-29). Those decimal phases brought the full markos chrome surface
to DESIGN.md v1.1.0 canon (auth surfaces in 213.2; settings + admin
surfaces in 213.3; admin operations + status + 404 + workspace + theme
in 213.4). Decisions D-08 (token-only), D-09 (mint-as-text), D-09b
(`.c-notice` mandatory), D-13 (`.c-card--feature` reserved), D-14 (no
`.c-table` primitive), D-15 (selective extraction) were locked in those
adoption waves and are inherited verbatim into the §Downstream UI
Inheritance Map below. **This 213 parent phase ships zero UI work; it is
the doctrine + audit + closeout substrate that closes v4.0.0 and gates
P214-P217.**

**Conclusion:** No-UI-surface declaration **CONFIRMED**. This phase is
pure Tenant 0 governance + audit + dogfood + closeout authoring +
contracts + CI scripts + tests. There are no visual decisions to
specify, no typography choices to lock, no copywriting copy to draft for
end-user surfaces, and no component primitives to compose.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | not applicable — no UI surface authored in this phase |
| Preset | not applicable |
| Component library | not applicable |
| Icon library | not applicable |
| Heading font | not applicable |
| Body font | not applicable |
| Default theme | not applicable |
| Form authoring posture | not applicable — no forms |
| Banner authoring posture | not applicable — no banners |
| Card authoring posture | not applicable — no cards |
| Money display posture | not applicable in 213 directly — Tenant 0 first loop's outcome may include revenue feedback if connector chain reaches `RevenueFeedbackLink`, but rendering is downstream (P208 Weekly Narrative consumes; future readiness dashboards in P217+ extend); 213 records `revenue_amount` + `currency` only as JSON in `loop-01-outcome.md` per 211 contract |
| Table authoring posture | not applicable — registry tables in `.planning/tenant-zero/*.md` are GitHub-flavored Markdown rendered by Markdown viewers, not React tables; the requirement-implementation matrix (`requirement-implementation-matrix.md`) and the unresolved-gap register (`unresolved-gap-register.md`) are markdown tables for human and CI parsing, never React tables |
| Placeholder posture | `{{MARKOS_PRICING_ENGINE_PENDING}}` sentinel is the central audit signal of 213-03: every public pricing-sensitive surface must contain the verbatim sentinel OR be classified `release_ready` in `.planning/tenant-zero/pricing/public-pricing-release-gate.json` with non-empty `recommendation_id`, `approval_ref`, and `evidence_fresh` fields, OR be classified `blocked` with a named `release_reason`; the sentinel never renders into a UI surface in this phase |
| CI script output posture | `scripts/tenant-zero/*.mjs` are Node CLI assertion runners. They emit `node --test`-format output OR pass/fail JSON envelopes. They DO NOT render HTML, JSX, or any visual surface. CLI text uses bracketed-glyph severity prefixes (`[ok]`, `[warn]`, `[err]`, `[block]`, `[info]`) per DESIGN.md CLI rule, never emoji. |
| Doctrine prose posture | `.planning/tenant-zero/*.md` doctrine docs are markdown only; no rendered components inside. They are read by humans (auditor, planner, executor, vault-canon reviewers) and parsed by CI scripts (`scripts/tenant-zero/*.mjs`) for forbidden-string and contract-baseline assertions. |
| JSON contract posture | `.planning/tenant-zero/{workspace-profile, connector-inventory, loop-01-claim-map, loop-01-dispatch-log, loop-01-learning-handoff, pricing/public-pricing-release-gate}.json` are deterministic JSON envelopes consumed by the CI scripts and (downstream) by future readiness-dashboard surfaces. They DO NOT render HTML. |

---

## Spacing / Typography / Color

**Not applicable.** Phase 213 emits no CSS, no JSX, no tabular React
display. Every spacing, typography, and color decision is deferred to the
downstream phases that will surface this Tenant 0 substrate (P214-P217
SaaS Suite Activation surfaces, P208 admin extensions for compliance and
audit visibility, future P217+ marketing-site case-study editors).

CLI script stdout from `scripts/tenant-zero/*.mjs` follows the DESIGN.md
"CLI output" rule: bracketed glyphs only, no emoji, no ANSI gradients,
no soft-shadow box-drawing characters, terse engineering prose with no
banned-lexicon terms.

---

## Translation Gate Dissolution and Opening

This is a load-bearing section unique to Phase 213 because 213 is the
**v4.0.0 closeout gate**: it dissolves the final two `future_phase_213_tenant0`
placeholders left in 211 and 212, and it opens three new gates that bind
the entire P214-P217 SaaS Suite Activation lane plus future SaaS Country
Suite expansions plus ongoing Tenant 0 monitoring. Every future surface
that consumes 213 substrate inherits both the dissolved-gate status (no
longer needs `<PlaceholderBanner variant="future_phase_213_tenant0">`)
and the newly-opened-gate status (must render `<PlaceholderBanner
variant="future_phase_214_saas_suite">` or sibling variants until those
phases ship).

### Gates dissolved by Phase 213 (downstream surfaces remove these placeholders)

| Upstream surface | Placeholder authored | Dissolution rule once 213 ships |
|------------------|---------------------|----------------------------------|
| 211-UI-SPEC §Translation Gates Opened (Tenant 0 loop-readiness panel) | `<PlaceholderBanner variant="future_phase_213_tenant0">` rendered when a tenant-0 readiness surface needs to assert that the 211 loop has run end-to-end on Tenant 0 | 213-02 produces the full loop-01 artifact chain (`loop-01-brief.md` + `loop-01-claim-map.json` + `loop-01-approval-log.md` + `loop-01-dispatch-log.json` + `loop-01-outcome.md` + `loop-01-learning-handoff.json`) with the canonical statuses `claim_status: evidence_backed`, `approval_status: approved`, `dispatch_status: published \| ready_to_publish`, `measurement_window_days: 7`, and `learning_handoff_status: recorded`. Future Tenant 0 readiness dashboards (P217+) read these artifacts directly and remove the placeholder banner. |
| 212-UI-SPEC §Translation Gates Opened (Tenant 0 learning-readiness) | `<PlaceholderBanner variant="future_phase_213_tenant0">` rendered when ArtifactPerformanceLog has not yet logged real outcomes and LiteracyUpdateCandidate has no promoted entry on Tenant 0 data | 213-02 produces `loop-01-learning-handoff.json` with `learning_handoff_status: recorded` (the binding handshake into 212 substrate); 213-05 maps the LRN family row in `requirement-implementation-matrix.md` with explicit `implementation_surface`, `test_surface`, `evidence_surface`, `status`, and `blocker` columns. Future Tenant 0 learning surfaces (P217+ growth-experiment registries, P225 analytics narrative) read these artifacts directly and remove the placeholder banner. |

### Gates opened by Phase 213 (future surfaces must render these placeholders)

| Downstream consumer (future phase) | Placeholder required | Dissolution phase |
|------------------------------------|---------------------|-------------------|
| `214-217-go-no-go.md` consumers (per-phase gate readers) | `<PlaceholderBanner variant="future_phase_214_saas_suite">` (or `future_phase_215`, `future_phase_216`, `future_phase_217`) rendered with the linked go/no-go status when a SaaS-Suite-Activation surface attempts to start work on a phase whose 213-05 status is `yellow` or `red` | P214 (SaaS Suite Activation), P215, P216, P217 — banner dissolves once that phase ships AND the 213-05 gate flips to `green` for that phase |
| Future SaaS Country Suite expansions (post-P217) | `<PlaceholderBanner variant="future_saas_country_suite">` rendered when a country-suite surface attempts to onboard a tenant without inheriting Tenant 0 governance posture (workspace-profile, public-proof boundary, pricing release-gate) | Future SaaS Country Suite phase (TBD post-217) — banner dissolves once that phase produces its own activation artifact and country-suite tenants inherit the Tenant 0 governance scaffold verbatim |
| Tenant 0 ongoing-monitoring consumers | `<PlaceholderBanner variant="future_tenant0_ongoing_monitoring">` rendered when a surface attempts to monitor live Tenant 0 health (loop-runlog freshness, evidence-pack staleness, connector-inventory drift, public-proof claim freshness, pricing release-gate drift, requirement-matrix drift, unresolved-gap register churn) | Future ongoing-monitoring phase (TBD; out of scope for v4.0.0) — banner dissolves once that phase ships ongoing-monitoring substrate |
| `unresolved-gap-register.md` consumers | `<PlaceholderBanner variant="future_gap_resolution">` rendered when a surface attempts to display gap rows whose `closure_condition` has not yet been met | Per-gap; banner dissolves per gap once the gap-owning phase closes that specific row |
| Compliance-language audit log consumers | `<PlaceholderBanner variant="future_compliance_language_log">` rendered when a public-claim audit surface needs to display historical violations against the four `compliance-language-boundary.md` literals (`designed_control`, `type1_in_preparation`, `type1_verified`, `type2_future`) | Future compliance-monitoring phase (TBD post-P206 SOC2 Type II) — banner dissolves once that phase ships compliance-language audit log substrate |

**Critical guardrail:** Phase 213 itself does NOT author any
`<PlaceholderBanner>` component. It only specifies which placeholder
variants downstream phases must render until their respective dependencies
ship. The placeholder component itself is owned by the surface that
renders it (typically the operator cockpit in P208 or a future enterprise-
admin surface in P217+).

---

## Downstream UI Inheritance Map

This is the load-bearing section of this document. When a future phase
ships a UI surface that consumes a Phase 213 governance contract, that
phase's UI-SPEC.md MUST cite the row below that authorizes its surface
family. This binds the visual contract back to the Tenant 0 doctrine and
prevents drift.

All downstream UI surfaces below MUST author to **DESIGN.md v1.1.0** and
inherit the 213.x adoption-wave decisions (carried forward from CONTEXT.md
decisions D-08 through D-15 of the 213.3 / 213.4 waves):

| 213.x Decision | Carry-forward rule for any future surface that consumes 213 doctrine |
|----------------|---------------------------------------------------------------------|
| D-08 (token-only) | Zero inline hex literals; every color via `var(--color-*)`; every spacing via `var(--space-*)`; every typography via DESIGN.md `typography.*` token. Tenant-0 readiness-status badges (loop-ready / pricing-clear / proof-ready / requirement-mapped / gap-closed), go/no-go status badges (`green`/`yellow`/`red`), pricing-classification badges (`placeholder_only`/`release_ready`/`blocked`), claim-class badges (`implemented_verified`/`roadmap_only`/`internal_only`), compliance-status badges (`designed_control`/`type1_in_preparation`/`type1_verified`/`type2_future`), connector-inventory badges (`healthy`/`degraded`/`unavailable`), data-source-policy badges (`public_evidence`/`private_internal`/`never_exported`), gap-severity badges all token-only. |
| D-09 (mint-as-text) | Protocol Mint `#00D9A3` allowed as text via `--color-primary-text` for `.c-button--tertiary` link CTAs and `.c-chip-protocol` IDs only; never as fill on surfaces larger than a button or chip. Tenant-0 workspace-profile ID copy-link CTAs, loop-01 brief-ID chips, claim-ID chips, dispatch-attempt-ID chips, recommendation-ID chips, gap-ID chips use mint-as-text. |
| D-09b (`.c-notice` mandatory) | Every Tenant-0 readiness notice (upstream-gate-failed, workspace-not-ready, loop-blocked, pricing-blocked, proof-blocked, gap-open, gate-red), every go/no-go status notice composes `.c-notice c-notice--{info,warning,success,error}` from `styles/components.css`. No local `.banner`/`.alert`/`.warning`/`.noticeBar` classes. The five-status compliance-language vocabulary maps to notice variants: `designed_control` → `c-notice--info`, `type1_in_preparation` → `c-notice--warning`, `type1_verified` → `c-notice--success`, `type2_future` → `c-notice--info`. |
| D-13 (`.c-card--feature` reserved) | `.c-card--feature` is reserved for hero panels in `404-workspace` + `213.5` marketing. Any future Tenant-0 surface (readiness dashboard, dogfood runlog timeline, public-proof claim browser, pricing release-gate viewer, requirement-matrix browser, gap-register browser, go/no-go decision viewer, connector-inventory browser, data-source-policy browser, compliance-language audit log) uses `.c-card` default — never `.c-card--feature`. |
| D-14 (no `.c-table` primitive) | Any future tabular surface (requirement-implementation matrix browser, unresolved-gap register browser, public-pricing release-gate per-surface table, public-claim audit-summary table, connector-inventory table, dogfood-runlog timeline table, go/no-go per-phase table) uses vanilla `<table>` semantic + token-only recipe on `<th>`/`<td>` + `.c-badge--{state}` for row state. The `.c-table` primitive remains deferred to Phase 214+. |
| D-15 (selective extraction) | When a future phase extracts a Tenant-0-substrate read pattern into a reusable component, the extraction is selective: pages co-locate with their tenant-zero-record read first, primitives extract only when reuse is proven across ≥2 surfaces (e.g. go/no-go status badge in P214 SaaS Suite Activation cockpit + P217 marketing-readiness dashboard). |

### Future-surface inheritance table

| Future surface (illustrative; not implemented in 213) | Originating Phase 213 doctrine | Phase that ships the surface | Inheritance citation required |
|-------------------------------------------------------|-------------------------------|-------------------------------|-------------------------------|
| Tenant 0 readiness dashboard (single-pane health) | `.planning/tenant-zero/{workspace-profile.json, connector-inventory.json, data-source-policy.md, public-proof-allowlist.md, 213-upstream-readiness.md}` (213-01) + `loop-01-*` chain (213-02) + `final-readiness-summary.md` (213-05) | P217+ (marketing-site readiness panel) or future enterprise admin | Future UI-SPEC must cite `213-UI-SPEC.md §Downstream UI Inheritance Map` and bind to `workspace-profile.json` fields verbatim (`org_slug`, `tenant_slug`, `business_model`, `roles`, `pricing_mode`, `connector_policy`); compose `<PlaceholderBanner variant="future_phase_214_saas_suite">` if any P214 readiness gate is `yellow`/`red`. The dashboard renders a `.c-card` panel per readiness dimension (loop / pricing / proof / requirement / gap) with `.c-badge--{success,warning,error,info}` mapping. Reads `loop-01-learning-handoff.json` `learning_handoff_status` to confirm closeout completion. |
| Public-pricing release-gate report viewer | `.planning/tenant-zero/pricing/{public-pricing-audit.md, public-pricing-release-gate.json, recommendation-linkage.md}` (213-03) | P205 follow-up admin (when an approved PricingRecommendation lands and surfaces flip from `placeholder_only` to `release_ready`) or future enterprise admin | Future UI-SPEC must enumerate the three `classification` literals (`placeholder_only`, `release_ready`, `blocked`) verbatim as status badges with `.c-badge--{warning,success,error}` mapping. The five audited public surfaces (`docs/pricing/public-tier-placeholder.md`, `public/llms.txt`, `app/(marketing)/integrations/claude/page.tsx`, `app/(marketing)/docs/[[...slug]]/page.tsx`, `app/docs/llms-full.txt/route.ts`) render as a vanilla `<table>` (D-14 recipe) with per-surface columns: `surface`, `classification`, `recommendation_id`, `approval_ref`, `evidence_fresh`, `release_reason`. `release_ready` rows compose `.c-chip-protocol` (mint-as-text per D-09) for the `recommendation_id` deep-link to P205 PricingRecommendation viewer. `blocked` rows compose `.c-notice c-notice--error` with the named `release_reason` copy. The exact sentinel `{{MARKOS_PRICING_ENGINE_PENDING}}` is rendered VERBATIM in `placeholder_only` row detail (never paraphrased, never localized). Cross-binding: 205 PricingRecommendation as `recommendation_id` source-of-truth, 206 `data.export` mutation-class for the report itself, 209 evidence freshness via `evidence_fresh`. |
| Case-study editor with public-proof boundary enforcement | `.planning/tenant-zero/{public-proof-policy.md, case-study-readiness-checklist.md, compliance-language-boundary.md}` (213-04) | P217+ marketing-site editor or future content-authoring phase | Future UI-SPEC must implement the editor with hard pre-publish gates: every claim must have `claim_id`, `surface`, `evidence_ref`, `approval_ref`, `fresh_until`, `privacy_class`, and `status` fields populated per `case-study-readiness-checklist.md`. The three claim-class literals (`implemented_verified`, `roadmap_only`, `internal_only`) render as a 3-radio control with token-only recipe; `roadmap_only` and `internal_only` selections BLOCK the publish CTA (`.c-button--primary` disabled with `.c-notice c-notice--error` "[block] Roadmap claim cannot publish — required class is implemented_verified"). The four compliance-status literals (`designed_control`, `type1_in_preparation`, `type1_verified`, `type2_future`) render as a constrained dropdown; selecting `type1_verified` requires evidence linkage to a verified Phase 206 SOC 2 Type 1 evidence pack. **Banned-phrases enforcement is mandatory:** the editor's claim-text linter rejects on submit any of the public-proof-boundary banned phrases (e.g. "SOC 2 certified" before a verified cert exists, "10× faster than competitor X" without evidence linkage, "best-in-class" or other DESIGN.md banned-lexicon terms, "MarkOS is the only..." without evidence-backed comparative claim). Allowed phrasing is constrained to the form "MarkOS Tenant 0 ran X loop with Y evidence in Z time"; the editor surfaces this template as a `.c-notice c-notice--info` "[info] Allowed phrasing template" suggestion when an unsupported claim is detected. Every public claim renders an inline `<EvidenceSummary />` (209) with `evidence_ref` linkage; missing evidence blocks publish. Mutation-class binding per 206-02: `public.claim` (DUAL with `external.send` if the case study targets external email/social distribution). Approval mode: `dual_approval` minimum (operator + brand officer per 206 mutation-class doctrine). |
| Requirements coverage matrix browser | `.planning/tenant-zero/requirement-implementation-matrix.md` (213-05) | Future enterprise admin or P217+ vault-codebase compliance dashboard | Future UI-SPEC must surface the seven-column matrix verbatim (`family`, `owner_phase`, `implementation_surface`, `test_surface`, `evidence_surface`, `status`, `blocker`); the nine family literals (`PRC`, `COMP`, `RUN`, `TASK`, `EVD`, `CONN`, `LOOP`, `LRN`, `T0`) render as filter chips at the top of the browser. `status` column maps to `.c-badge--{success,warning,error,info}` per row. `blocker` column composes `.c-notice c-notice--error` inline when non-empty. D-14 vanilla `<table>` recipe required. Cross-binding: each row's `owner_phase` deep-links to the phase's STATE.md row; `evidence_surface` deep-links to 209 `<EvidenceSummary />`. |
| Unresolved-gap register browser | `.planning/tenant-zero/unresolved-gap-register.md` (213-05) | Future enterprise admin or P217+ vault-codebase compliance dashboard | Future UI-SPEC must surface the six-field gap envelope verbatim (`gap_id`, `description`, `owner`, `route`, `severity`, `closure_condition`); `severity` maps to `.c-badge--{error,warning,info}` per row. `route` composes `.c-chip-protocol` (mint-as-text per D-09) for the deep-link to the routing destination phase. `closure_condition` renders as a `.c-card` detail panel when expanded. Filter chips for severity at the top. D-14 vanilla `<table>` recipe required. Cross-binding: `owner` deep-links to the owning phase; the browser composes `<PlaceholderBanner variant="future_gap_resolution">` until each gap row's `closure_condition` is met. |
| Go/No-Go decision artifact viewer (P214-P217 gate) | `.planning/tenant-zero/214-217-go-no-go.md` (213-05) | P214 SaaS Suite Activation cockpit (entry gate) and P215, P216, P217 cockpits | Future UI-SPEC must surface one section per phase (`P214`, `P215`, `P216`, `P217`) plus the shared `hard_blockers` section. The three status literals (`green`, `yellow`, `red`) render as `.c-badge--{success,warning,error}` with the exact bracketed-glyph pairing required by DESIGN.md "Color blindness" rule (`[ok]` / `[warn]` / `[err]`). Each section's `reasons`, `required_follow_up`, and `evidence_refs` arrays render as nested `.c-card` panels. `hard_blockers` section composes a header `.c-notice c-notice--error` listing every blocker. The exact sentence `doc 17 remains future-routing context` from `final-readiness-summary.md` renders verbatim as a `.c-notice c-notice--info` "[info] doc 17 remains future-routing context — SaaS Marketing OS Strategy is NOT yet implementable" footer. **Hard gate behavior:** future P214/P215/P216/P217 cockpits MUST treat a `red` status as a workflow lock: no Plan-01 task may begin execution until the linked 213 gate flips to `yellow` or `green`. `yellow` status surfaces a `.c-notice c-notice--warning` "[warn] Phase has yellow blockers — proceed with explicit override" gate that requires operator override with `override_reason` ≥10 chars. `green` status renders `.c-notice c-notice--success` "[ok] Gate clear" and unlocks workflow. Mutation-class binding per 206-02: `data.export` for the gate report itself when emitted to external SaaS-Suite-Activation governance. |
| Tenant 0 dogfood runlog timeline | `.planning/tenant-zero/{loop-01-brief.md, loop-01-claim-map.json, loop-01-approval-log.md, loop-01-dispatch-log.json, loop-01-outcome.md, loop-01-learning-handoff.json}` (213-02) | Future enterprise admin or P217+ Tenant 0 health dashboard | Future UI-SPEC must render the 7-stage loop as a directed timeline: nodes = brief → claim-map → approval-log → dispatch-log → outcome → learning-handoff. Each stage renders a `.c-card` panel with the relevant artifact's status badge (`.c-badge--success` for completed, `.c-badge--warning` for ready_to_publish, `.c-badge--error` for blocker). The five canonical loop statuses (`approval_status: approved`, `claim_status: evidence_backed`, `dispatch_status: published \| ready_to_publish`, `measurement_window_days: 7`, `learning_handoff_status: recorded`) render as a status header `.c-notice c-notice--success` "[ok] Tenant 0 loop-01 complete" when all five are met; partial completion renders `.c-notice c-notice--warning` "[warn] Tenant 0 loop-01 in progress — N of 5 stages complete" with the named blocker. No glow, no gradient on edges (DESIGN.md elevation rule). Reduced-motion freezes any auto-traversal animation per DESIGN.md motion rule. Cross-binding: 207 `RunApiEnvelope` lineage via `agent_run_id` on each loop record, 208 `ApprovalHandoffRecord` via approval-log entries, 211 loop substrate as the upstream contract origin, 212 learning-substrate as the downstream consumer of `learning_handoff_status: recorded`. |
| Connector inventory + data-source policy viewer | `.planning/tenant-zero/{connector-inventory.json, data-source-policy.md}` (213-01) | Future enterprise admin or P210 connector recovery extension | Future UI-SPEC must surface the per-connector envelope verbatim (`connector_slug`, `status`, `required_for_loop`, `fallback_action`, `last_verified_at`); the three `status` literals (`healthy`, `degraded`, `unavailable`) render as `.c-badge--{success,warning,error}` with bracketed-glyph pairing per DESIGN.md "Color blindness" rule. `required_for_loop == true` rows compose `.c-chip` "required" chip. `last_verified_at` renders as a tabular-numeral JetBrains-Mono timestamp per DESIGN.md typography rule. The data-source-policy viewer renders the three section headings (`## Public Evidence`, `## Private Internal`, `## Never Exported`) as `.c-card` panels with per-source row entries. A hard-rule guardrail must reject any UI attempt to surface a `Never Exported` source in any export action — the export CTA composes `.c-button--destructive` AS DISABLED with `.c-notice c-notice--error` "[block] Source classified Never Exported — cannot export" inline. D-14 vanilla `<table>` recipe required. |
| P214-P217 readiness panel (SaaS Suite Activation gate) | `.planning/tenant-zero/{214-217-go-no-go.md, requirement-implementation-matrix.md, unresolved-gap-register.md, final-readiness-summary.md}` (213-05) | P214 SaaS Suite Activation cockpit (entry gate) | Future UI-SPEC must compose the four-quadrant readiness panel: top-left = go/no-go status (per phase); top-right = requirement matrix completeness (per family); bottom-left = unresolved gap count (by severity); bottom-right = final readiness summary excerpt. Each quadrant is a `.c-card`. The panel surfaces a workflow lock if any P214/P215/P216/P217 status is `red`: composes `.c-notice c-notice--error` "[block] Phase 214 cannot activate — gate red" full-width and disables every Plan-01-start CTA on the cockpit. Mutation-class binding per 206-02: `data.export` for the panel's export-to-PDF or export-to-CRM follow-up; the export CTA inherits `dual_approval` minimum approval mode. |
| Compliance-language audit log | `.planning/tenant-zero/{compliance-language-boundary.md, public-claim-audit-summary.md}` (213-04) | Future compliance-monitoring phase (post-P206 SOC 2 Type II) or P217+ enterprise admin | Future UI-SPEC must surface every detected compliance-language violation as a row: each row records the surface, the offending phrase, the detected-at timestamp, the operator notified, the closure status. The four compliance-status literals (`designed_control`, `type1_in_preparation`, `type1_verified`, `type2_future`) render as filter chips. Violations render `.c-notice c-notice--error` with bracketed-glyph `[err] Banned compliance phrase: "<phrase>"` inline. The browser composes `<PlaceholderBanner variant="future_compliance_language_log">` until ongoing-monitoring substrate ships. D-14 vanilla `<table>` recipe required. Cross-binding: 206 SOC 2 evidence pack as the source-of-truth for `type1_verified` claims. |
| Public-claim audit summary browser | `.planning/tenant-zero/public-claim-audit-summary.md` (213-04) | P217+ marketing-site editor pre-publish gate or future enterprise admin | Future UI-SPEC must surface every audited public claim with its 7-field row (`claim_id`, `surface`, `evidence_ref`, `approval_ref`, `fresh_until`, `privacy_class`, `status`). The three claim-class statuses (`implemented_verified`, `roadmap_only`, `internal_only`) render as `.c-badge--{success,warning,info}` mapping. `fresh_until` renders as a tabular-numeral countdown timestamp; expired rows compose `.c-notice c-notice--warning` "[warn] Claim freshness expired — re-audit required". Privacy-class chips compose `.c-chip-protocol` (mint-as-text per D-09). D-14 vanilla `<table>` recipe required. |
| Tenant 0 ongoing-monitoring health panel | All of 213 doctrine + future ongoing-monitoring substrate | Future ongoing-monitoring phase (TBD; out of scope for v4.0.0) | Future UI-SPEC must compose a six-row panel: loop-runlog freshness, evidence-pack staleness, connector-inventory drift, public-proof claim freshness, pricing release-gate drift, requirement-matrix drift. Each row reads its source artifact's `last_verified_at` or equivalent freshness signal and renders `.c-badge--{success,warning,error}` based on a configurable freshness threshold. The panel composes `<PlaceholderBanner variant="future_tenant0_ongoing_monitoring">` until the ongoing-monitoring phase ships. Cross-binding: every row deep-links back to the originating 213 artifact. |

**Critical guardrail:** The downstream-inheritance table above is
**illustrative**, not a phase-implementation schedule. None of those
surfaces are implemented in Phase 213. They are listed so that when each
subsequently lands as a real phase, that phase's UI-SPEC.md can cite this
document as the doctrine origin instead of re-deriving Tenant-0-record /
gate-status / classification-literal / claim-class / compliance-status
field names from scratch.

**Cross-phase doctrine binding:** The case-study editor surface above
inherits from FIVE doctrine maps simultaneously: 206 (mutation-class
doctrine — what kinds of public claims need evidence + dual approval),
207 (runtime envelope — which run created which claim), 209 (evidence
doctrine — what evidence looks like + how it blocks publish), 211 (loop
substrate — the artifact + audit envelope that produces the publishable
case study), and 213 (Tenant 0 governance — public-proof boundary +
case-study readiness checklist + compliance-language boundary + banned-
phrases enforcement). Any future surface that authors a public case-study
claim MUST cite all five. The five inheritance maps compose cleanly:
206 delivers the **mutation-class doctrine**, 207 delivers the **runtime
envelope**, 209 delivers the **evidence doctrine**, 211 delivers the
**loop substrate**, and 213 delivers the **public-proof boundary** that
ties them into one governed public-claim system.

---

## Public Pricing Release-Gate Copy Contract (load-bearing)

This section enforces the Phase 213-03 sentinel-discipline + named-
blocking-reason copy contract on every future UI surface that consumes the
public pricing release-gate. It is load-bearing because Phase 205
intentionally deferred PricingRecommendation activation; until P205
follow-up lands, every public pricing surface either carries the verbatim
sentinel or is `blocked` with a named reason. This contract enforces the
sentinel-discipline and the blocking-reason copy on every future UI
consumer.

### Sentinel-discipline rules

1. **Sentinel verbatim:** When a future pricing-display surface renders a
   public-pricing-sensitive value, the value MUST be exactly
   `{{MARKOS_PRICING_ENGINE_PENDING}}` until `public-pricing-release-gate.json`
   classifies that surface `release_ready` with non-empty `recommendation_id`,
   `approval_ref`, AND `evidence_fresh: true`. The sentinel is rendered
   verbatim — never localized, never paraphrased, never abbreviated, never
   replaced with a marketing alias like "TBD pricing" or "Coming soon" or
   "Contact sales" or any other softener.
2. **Sentinel display recipe:** When the sentinel renders, it is wrapped
   in a `.c-code-inline` primitive (token-only) so consumers immediately
   recognize it as a contract sentinel rather than displayed copy. A paired
   `.c-notice c-notice--info` "[info] Pricing TBD — Pricing Engine output
   pending" inline note explains the sentinel to end users.
3. **No silent removal:** Future UI cannot silently strip the sentinel.
   Removal requires `release_ready` classification + linked
   `recommendation_id` + `approval_ref` AS A HARD GATE. The
   `scripts/tenant-zero/assert-pricing-linkage.mjs` CI assertion enforces
   this: removal of `{{MARKOS_PRICING_ENGINE_PENDING}}` from any audited
   public surface fails the CI run unless the gate JSON marks that surface
   `release_ready`.

### Blocking-reason copy contract

When `public-pricing-release-gate.json` classifies a surface `blocked`,
the future UI surface that displays the blocked status MUST render the
exact named reason verbatim. The four canonical `release_reason` literals
authored by 213-03 are:

| `release_reason` literal | UI display copy | UI recipe |
|--------------------------|-----------------|-----------|
| `pricing_engine_not_yet_activated` | `[block] Pricing Engine not yet activated — surface remains sentinel-protected` | `.c-notice c-notice--warning` |
| `recommendation_approval_missing` | `[block] PricingRecommendation approval missing — release gate cannot pass` | `.c-notice c-notice--error` |
| `evidence_freshness_expired` | `[block] Pricing evidence freshness expired — re-audit required before release` | `.c-notice c-notice--warning` |
| `compliance_posture_insufficient` | `[block] Phase 206 compliance posture insufficient for this claim — block until SOC 2 Type 1 verified` | `.c-notice c-notice--error` |

Any future surface that adds a new `release_reason` literal MUST update
`213-UI-SPEC.md §Public Pricing Release-Gate Copy Contract` AND
`.planning/tenant-zero/pricing/public-pricing-audit.md` simultaneously,
with the new literal added to the table above with its UI display copy
and recipe. New literals cannot be silently introduced.

### Cross-binding

- 205 PricingRecommendation as `recommendation_id` source-of-truth
- 206 SOC 2 Type 1 evidence pack as `compliance_posture_insufficient` source-of-truth
- 209 `EvidenceMap` freshness as `evidence_freshness_expired` source-of-truth
- 213-03 `public-pricing-release-gate.json` as the per-surface gate-state-of-truth

---

## Public Proof Boundary Copy Contract (load-bearing)

This section enforces the Phase 213-04 banned-phrases + allowed-phrasing
copy contract on every future UI surface that publishes a Tenant 0 claim.
It is load-bearing because the case-study editor and any future
marketing-site copy editor MUST hard-block on banned phrases at the
authoring layer — relying on post-publish review is insufficient because
review has limited bandwidth and bandied-around phrases drift.

### Banned phrases (case-insensitive substring match — author-time gate)

| Banned phrase | Reason banned | Allowed alternative phrasing |
|---------------|---------------|------------------------------|
| `SOC 2 certified`, `SOC 2 compliant`, `SOC 2 verified` (before P206 verified cert exists) | Compliance overreach — Phase 206 ships designed controls and Type 1 preparation; SOC 2 verification is post-cert only | `Designed for SOC 2 Type 1 controls`, `SOC 2 Type 1 in preparation`, `SOC 2 Type 1 verified` (post-P206 cert) |
| `enterprise-grade`, `enterprise-ready` (without evidence linkage) | Marketing overreach — requires real Tenant 0 readiness gate green | `Tenant 0 readiness gate green per 213-05 final-readiness-summary` (with `evidence_ref` linkage) |
| `10× faster than competitor X` (without evidence linkage), `the only AI marketing OS that...` (without evidence linkage) | Comparative claim without evidence linkage | `In MarkOS Tenant 0, X loop ran with Y evidence in Z time` (with `evidence_ref` linkage) |
| `revolutionize`, `transform`, `unlock`, `empower`, `synergy`, `leverage`, `seamless`, `cutting-edge`, `innovative`, `game-changer`, `next-generation`, `world-class`, `best-in-class`, `reimagine`, `disrupt`, `holistic`, `supercharge` (CLAUDE.md banned-lexicon list) | DESIGN.md banned-lexicon | Concrete, verifiable language describing what shipped |
| `just` (as softener — "just one click", "just press start") (CLAUDE.md banned-lexicon) | DESIGN.md banned-lexicon | Remove the softener; describe the action concretely |
| Any exclamation point in product surface copy | DESIGN.md banned-lexicon | Periods only |
| Emoji in any product surface copy, CLI output, error message, or technical doc | DESIGN.md no-emoji rule | Bracketed glyphs (`[ok]`, `[warn]`, `[err]`, `[block]`, `[info]`) |
| `we strive to`, `best-effort`, `we believe`, `we think` (hedging without evidence) | Hedging without evidence linkage | Concrete claim with `evidence_ref` linkage |
| `production-grade` (without evidence linkage) | Marketing overreach | `Used in production by MarkOS Tenant 0` (with `evidence_ref` linkage) |

### Allowed phrasing template

The constrained allowed-phrasing template for any Tenant 0 case-study
claim is:

```
MarkOS Tenant 0 ran <verb-phrase describing actual loop> with <evidence_ref linkage> in <time window>.
```

Examples that PASS the boundary:
- `MarkOS Tenant 0 ran loop-01 with 7 evidence-backed claims approved by dual-approver in 14 hours.`
- `MarkOS Tenant 0 published a public-proof artifact with EvidenceMap-supported claims in a 7-day measurement window.`
- `MarkOS Tenant 0 dispatched a marketing artifact through the LinkedIn connector with operator approval and evidence-pack linkage.`

Examples that FAIL the boundary (from the banned-phrases table above):
- `MarkOS is enterprise-ready and SOC 2 certified.` (FAILS: SOC 2 unverified before P206 cert; "enterprise-ready" without evidence linkage)
- `Unlock 10× faster marketing operations with our world-class AI.` (FAILS: banned-lexicon "unlock", "world-class"; comparative claim without evidence)
- `Just press start and revolutionize your marketing.` (FAILS: banned-lexicon "just" softener, "revolutionize"; missing evidence)

### Author-time enforcement

The future case-study editor MUST run a pre-publish linter that:

1. Substring-matches every banned phrase from the table above (case-insensitive)
2. Renders inline `.c-notice c-notice--error` per offending phrase with the exact display copy `[err] Banned phrase detected: "<phrase>" — see allowed alternatives in 213-UI-SPEC.md §Public Proof Boundary Copy Contract`
3. Disables `.c-button--primary` "Publish" until every banned-phrase notice is dismissed (operator must edit the offending phrase, not override)
4. Logs every dismissal AND every correction to a future compliance-language audit log surface (per §Translation Gates Opened above)

### Cross-binding

- 206 SOC 2 evidence pack as `SOC 2 certified` claim source-of-truth
- 209 `EvidenceMap` as comparative-claim source-of-truth
- 213-04 `compliance-language-boundary.md` as the four-status compliance vocabulary source-of-truth
- 213-04 `public-proof-policy.md` as the three-class claim vocabulary source-of-truth
- 213-04 `case-study-readiness-checklist.md` as the per-claim 7-field envelope source-of-truth
- DESIGN.md "Banned lexicon" as the lexicon source-of-truth

---

## Copywriting Contract

**End-user / surface copy: not applicable.** Phase 213 emits no copy to
any human UI surface. The two load-bearing copy contracts above (§Public
Pricing Release-Gate Copy Contract and §Public Proof Boundary Copy
Contract) are FORWARD-LOOKING contracts for future UI consumers, not
copy authored in this phase.

**Doctrine prose copy** in `.planning/tenant-zero/*.md` and the loop-01
artifact-chain Markdown narrative is governed by:

- The CLAUDE.md banned lexicon (`synergy`, `leverage`, `empower`,
  `unlock`, `transform`, `revolutionize`, `supercharge`, `holistic`,
  `seamless`, `cutting-edge`, `innovative`, `game-changer`,
  `next-generation`, `world-class`, `best-in-class`, `reimagine`,
  `disrupt`, `just` as softener — and no exclamation points).
- Engineering-readability: short sentences, concrete contract field
  names, named owning plans. No marketing voice. No hedging language.
  Every contract row asserts a specific field, literal, or test-gate
  procedure.
- Pricing-placeholder rule: `{{MARKOS_PRICING_ENGINE_PENDING}}` appears
  verbatim in `public-pricing-audit.md`, `public-pricing-release-gate.json`
  (as the `placeholder_only` classification's expected sentinel value),
  and `test/tenant-zero/phase-213/domain-3/pricing-placeholder-regression.test.js`
  per CLAUDE.md Pricing Engine Canon and 205 placeholder rule.
- Forbidden architecture-lock strings (rejected by
  `scripts/tenant-zero/check-architecture-lock.mjs` per 213-01-00 AC):
  `synthetic proof`, `fake case study`, `mock customer logo`. The
  script also rejects the four test-substrate-mismatch strings
  inherited from the wider GSD architecture lock: `vitest`,
  `playwright`, `.test.ts`, `route.ts`. None of these strings may
  appear in 213 doctrine markdown, in 213 CI scripts, or in 213 test
  fixtures.
- Ownership-boundary copy: every reference to upstream substrate in 213
  doctrine prose must explicitly defer ownership to the originating
  phase per the `integrates_with` declarations on each plan (PRC from
  P205, COMP from P206, RUN from P207, TASK from P208, EVD from P209,
  CONN from P210, LOOP from P211, LRN from P212). 213 doctrine never
  claims to "own" any of those families — only to consume their
  substrate via foreign-key references and audit them via CI scripts.
  Phase 213 directly owns ONLY `T0-01..05` + `QA-01..15` per
  REQUIREMENTS.md traceability and the 213-REVIEWS HIGH#2 correction.
- Compliance-language vocabulary: the four `compliance-language-boundary.md`
  literals (`designed_control`, `type1_in_preparation`, `type1_verified`,
  `type2_future`) MUST be used verbatim in 213 doctrine and in any
  future UI consumer per §Public Proof Boundary Copy Contract above.
  No row may use synonyms like `compliant`, `certified`, `audited`
  (without status qualifier), etc.
- Claim-class vocabulary: the three `public-proof-policy.md` literals
  (`implemented_verified`, `roadmap_only`, `internal_only`) MUST be used
  verbatim in 213 doctrine and in any future UI consumer. No row may
  use synonyms like `live`, `shipped`, `planned`, `coming_soon`, etc.
- Pricing-classification vocabulary: the three `public-pricing-audit.md`
  literals (`placeholder_only`, `release_ready`, `blocked`) MUST be used
  verbatim. No row may use synonyms like `pending`, `approved`,
  `rejected`, etc.
- Loop-status vocabulary: the canonical loop-01 statuses
  (`approval_status: approved`, `claim_status: evidence_backed`,
  `dispatch_status: published`, `dispatch_status: ready_to_publish`,
  `learning_handoff_status: recorded`) MUST be used verbatim in
  `loop-01-*` artifacts. The exact phrase `ready_to_publish` is the
  only acceptable alternative to `published` — `pending`,
  `not_yet_published`, `partial`, etc. are forbidden.
- Go/no-go vocabulary: the three status literals (`green`, `yellow`,
  `red`) MUST be used verbatim in `214-217-go-no-go.md`. No
  intermediate or extended literals are permitted. The exact sentence
  `doc 17 remains future-routing context` MUST appear verbatim in
  `final-readiness-summary.md` per 213-05-02 AC.

**CI script CLI output:** When `scripts/tenant-zero/*.mjs` emit
human-facing CLI lines (status, blocker, gate result), the output
follows these rules:

- Bracketed-glyph severity prefixes (`[ok]`, `[warn]`, `[err]`,
  `[block]`, `[info]`) per DESIGN.md "Color blindness" rule, never
  emoji.
- Engineering-grade short sentences. No marketing voice. No hedging.
  No banned-lexicon terms. No exclamation points.
- Gate JSON envelopes (e.g. `public-pricing-release-gate.json`) follow
  the API-envelope rule: `{ surface, classification, ... }` structured
  fields only — no embedded marketing copy in `release_reason` (only
  the four canonical `release_reason` literals defined in §Public
  Pricing Release-Gate Copy Contract above).
- These rules apply to 213 CLI scripts because consumers (P208 cockpit,
  P217+ readiness dashboards, P214 SaaS Suite Activation cockpit) may
  surface CLI output verbatim in their UX, and surfacing a banned-
  lexicon string would violate the downstream surface's DESIGN.md
  Pillar 1 audit.

These are doctrine-prose rules, gate-JSON-envelope rules, and CLI-
output rules, not UI copywriting rules — included here only because the
orchestrator's downstream-inheritance question requires future UI
surfaces consuming this Tenant 0 substrate to honor the same lexicon
discipline when they render any classification literal, claim-class
literal, compliance-status literal, gate status, blocking reason, or
contract field name into a UI label, banner, or modal body.

---

## Destructive Actions

**Not applicable in Phase 213.** No surface ships, so no confirm-modals
are authored.

The Tenant 0 dogfood loop in 213-02 DOES execute destructive actions
(public dispatch via 211 connector chain, approval mutations via 207
ApprovalHandoffRecord, evidence-pack writes via 209 EvidenceMap), but
those mutations execute through ALREADY-SHIPPED P207-P211 surfaces — the
P208 Approval Inbox handles approval, the P208 Recovery Center handles
connector degradation, the P208 Task Board handles brief edits. 213
itself does not author any new mutation entry points.

When future phases ship surfaces that mutate any 213-substrate state
(e.g. flip a P214 go/no-go status from `red` to `yellow` after gap
closure, mark an `unresolved-gap-register` row as closed, edit a
`workspace-profile.json` field, override a `public-claim-audit-summary`
violation, force-update a `connector-inventory` row's `status`, publish
a case-study claim that passes the public-proof boundary, export a
go/no-go report or final-readiness-summary), each such mutation MUST:

1. Map to one of the six `mutation_class` literals from 206-02
   (`external.send`, `billing.charge`, `connector.mutate`,
   `price.change`, `public.claim`, `data.export`). Most 213-state
   mutations fall under:
   - `public.claim` — any case-study editor publish action where the
     artifact targets a Tenant 0 marketing-site or public-docs
     surface; case-study text passes the §Public Proof Boundary Copy
     Contract above as a hard gate.
   - `data.export` — any go/no-go report export, final-readiness-
     summary export, requirement-implementation-matrix export, or
     unresolved-gap-register export to an external SaaS-Suite-
     Activation governance system.
   - `price.change` — any pricing-classification flip from
     `placeholder_only` to `release_ready` (gated on linked
     `recommendation_id` + `approval_ref` per §Public Pricing Release-
     Gate Copy Contract).
   - `external.send` — any case-study external-distribution publish
     (DUAL-CLASS with `public.claim`); any compliance-language audit
     log notification to a tenant-facing channel.
   - `connector.mutate` — any force-update to `connector-inventory.json`
     status (admin override of degraded-connector classification).
   - `billing.charge` — not applicable to 213 directly (213 does not
     directly charge); inherited from 207 cost-bridge if a downstream
     readiness export incurs a billing event.
2. Compose `.c-modal` + `.c-backdrop` + `.c-button--destructive` per the
   213.x and 205 pattern, plus the 206 inheritance for mutation-class
   binding.
3. Honor the `default_approval_mode` declared in
   `.planning/compliance/mutation-class-policy.md` for that class
   (206-02-01 doctrine). For dual-class (`public.claim` +
   `external.send`), the surface must honor whichever class has the
   stricter approval mode (typically `public.claim` requires
   `dual_approval`).
4. Surface the `ApprovalHandoffRecord.handoff_kind` correctly (per 207
   doctrine) — `approval` for tenant-facing dangerous mutations,
   `recovery` for force-updating a degraded connector, `manual_input`
   for go/no-go status override or compliance-language audit dismissal,
   `follow_up` for non-blocking gap-closure tasks generated by 213-05
   `unresolved-gap-register` rows.
5. When a surface authors an override of a 213 hard gate (e.g.
   operator overrides a `red` go/no-go status to start P214 Plan-01
   work anyway, or operator dismisses a banned-phrase violation in
   the case-study editor), the override path inherits 209-04
   doctrine: `override_path == 'denied'` for autonomy-ceiling reach
   (no override possible — `red` go/no-go and banned-phrases on case-
   study publish are not override-able); otherwise
   `.c-button--destructive` with `override_reason` ≥10 chars required,
   and the override is recorded permanently on a future compliance-
   language audit log.

---

## Storybook Coverage

**Not applicable.** No visual components rendered; nothing to story.

Test coverage replaces Storybook for this phase:

- `test/tenant-zero/phase-213/preflight/upstream-readiness.test.js` (213-01)
- `test/tenant-zero/phase-213/preflight/architecture-lock.test.js` (213-01)
- `test/tenant-zero/phase-213/preflight/workspace-baseline.test.js` (213-01)
- `test/tenant-zero/phase-213/preflight/public-private-policy.test.js` (213-01)
- `test/tenant-zero/phase-213/domain-2/loop-artifact-chain.test.js` (213-02)
- `test/tenant-zero/phase-213/domain-2/dispatch-honesty.test.js` (213-02)
- `test/tenant-zero/phase-213/domain-2/learning-handoff.test.js` (213-02)
- `test/tenant-zero/phase-213/domain-3/pricing-placeholder-regression.test.js` (213-03)
- `test/tenant-zero/phase-213/domain-3/recommendation-linkage.test.js` (213-03)
- `test/tenant-zero/phase-213/domain-4/public-claim-audit.test.js` (213-04)
- `test/tenant-zero/phase-213/domain-4/compliance-language-boundary.test.js` (213-04)
- `test/tenant-zero/phase-213/domain-5/requirement-matrix.test.js` (213-05)
- `test/tenant-zero/phase-213/domain-5/go-no-go-decision.test.js` (213-05)

Runner: `npm test -- test/tenant-zero/phase-213/` (per each plan's
`<verify><automated>` block; CommonJS `node --test` per CLAUDE.md
Architecture Lock and 213-01 architecture-lock script).

---

## DESIGN.md Compliance Assertions

| Rule | DESIGN.md citation | Status in Phase 213 |
|------|--------------------|---------------------|
| Default dark surface `#0A0E14` | `colors.surface` | not applicable — no surface authored |
| Protocol Mint < 5% composition | "Composition proportion" | not applicable — no surface authored |
| Two typefaces only (JetBrains Mono + Inter) | `typography.*` | not applicable — no surface authored |
| 8px grid | "Spacing" | not applicable — no surface authored |
| Borders over shadows | "Elevation" | not applicable — no surface authored |
| WCAG 2.1 AA + 2px focus rings | "Accessibility" | not applicable — no surface authored |
| Whitespace ≥ 30% | "Whitespace as primitive" | not applicable — no surface authored |
| No emoji in product UI / CLI / docs | CLAUDE.md | **ENFORCED in doctrine prose + CI script CLI output + gate JSON envelopes** — all 23 tenant-zero docs + 10 CI scripts + 5 test directories author plain ASCII; bracketed glyphs `[ok]`/`[warn]`/`[err]`/`[block]`/`[info]` reserved for downstream surfaces and CLI output |
| No gradients, no glow, no soft shadows | "Elevation / Motion" | not applicable — no surface authored |
| `prefers-reduced-motion` collapse | "Motion" | not applicable — no surface authored |
| Banned lexicon enforced in product copy + UI labels + CLI strings | CLAUDE.md | **ENFORCED in doctrine prose + CI script CLI output + gate JSON envelopes** — engineering-readable language only; `release_reason` enums cannot embed banned lexicon because consumers may render them verbatim per §Public Pricing Release-Gate Copy Contract |
| Pricing placeholder rule | CLAUDE.md + Pricing Engine Canon | **ENFORCED + LOAD-BEARING** — `{{MARKOS_PRICING_ENGINE_PENDING}}` is the central audit signal of 213-03; appears verbatim in `public-pricing-audit.md`, `public-pricing-release-gate.json`, and `test/tenant-zero/phase-213/domain-3/pricing-placeholder-regression.test.js`; full sentinel-discipline contract authored in §Public Pricing Release-Gate Copy Contract above |
| Architecture-lock forbidden strings | CLAUDE.md + 213-RESEARCH §"Domain 0" + 213-CONTEXT §"Non-negotiables" | **ENFORCED** — `check-architecture-lock.mjs` rejects the three exact strings `synthetic proof`, `fake case study`, `mock customer logo` per 213-01-00 AC.3 |
| Ownership-boundary doctrine | 213-REVIEWS HIGH#2 + 213-CONTEXT "Ownership boundary" + 213-RESEARCH "Ownership boundary" | **ENFORCED** — every `213-XX-PLAN.md` declares `integrates_with` rows for upstream PRC/COMP/RUN/TASK/EVD/CONN/LOOP/LRN families instead of re-owning them; 213 directly owns ONLY `T0-01..05` + `QA-01..15` per REQUIREMENTS.md traceability |
| Public-proof banned-phrases doctrine | 213-04 `public-proof-policy.md` + `compliance-language-boundary.md` | **ENFORCED + LOAD-BEARING** — full banned-phrases + allowed-phrasing-template contract authored in §Public Proof Boundary Copy Contract above; `audit-public-claims.mjs` enforces banned-phrases on every audited public claim |
| Translation-gate dissolution doctrine | 211 §Translation Gates Opened + 212 §Translation Gates Opened | **ENFORCED via §Translation Gate Dissolution and Opening above** — 213 closes 2 upstream `future_phase_213_tenant0` gates and opens 5 downstream gates (P214 + P215 + P216 + P217 SaaS Suite Activation + future SaaS Country Suite + future Tenant 0 ongoing-monitoring + future gap-resolution + future compliance-language-log); future surfaces consuming 213 must respect the dissolution / opening status declared here |
| 213.x adoption-wave decision carry-forward | 213.3 / 213.4 CONTEXT D-08..D-15 + STATE.md "213.x milestone wave CLOSED" | **ENFORCED** — D-08 (token-only), D-09 (mint-as-text), D-09b (`.c-notice` mandatory), D-13 (`.c-card--feature` reserved), D-14 (no `.c-table` primitive), D-15 (selective extraction) carried forward verbatim into §Downstream UI Inheritance Map; future surfaces consuming Tenant 0 doctrine MUST honor these decisions |
| Audit-target vs. modified-target discipline | 213-RESEARCH "Public surfaces already exist and can be audited" | **ENFORCED** — `app/(marketing)/integrations/claude/page.tsx`, `app/(marketing)/docs/[[...slug]]/page.tsx`, `app/docs/llms-full.txt/route.ts`, `public/llms.txt`, `docs/pricing/public-tier-placeholder.md` are AUDIT TARGETS only (read by `audit-public-pricing.mjs` + `audit-public-claims.mjs`); they are NOT in any `files_modified` block; surface-content edits to those public surfaces are deferred to P205 follow-up or P217+ marketing-site phases |

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none | not applicable — no UI authored |
| Third-party | none | not applicable — no UI authored |

No third-party component registries declared. No vetting gate required.

---

## Pre-Populated From

| Source | Decisions Used |
|--------|---------------|
| 213-CONTEXT.md | "Why this phase exists" (1 — confirmed Tenant-0-dogfood + audit + closeout substrate, no new UI), "Required phase shape" (8 — Wave 0.5 preflight + workspace + first loop + pricing audit + proof boundary + requirement matrix + go/no-go + doc-17 deferral, all substrate-level), "Non-negotiables" (5 — no synthetic proof, no claim without evidence + approval + freshness, no hard-coded public pricing, no enterprise-readiness without traceability, no doc 17 implementation), "Ownership boundary" (3 — direct ownership = `T0-01..05` + `QA-01..15`; integrates_with = upstream substrate from P205-P212; downstream consumer = P214-P217), "Done means" file list (5 — 23 tenant-zero artifacts plus CI scripts plus tests, all server-side or doctrine) |
| 213-RESEARCH.md | Domain 0..5 recommendations (6 — all field schemas for Tenant 0 substrate, none surface-bearing): Domain 0 upstream readiness + architecture lock; Domain 1 workspace-profile + connector-inventory + data-source-policy + public-proof-allowlist field sets; Domain 2 loop-01 6-artifact chain + 5 canonical statuses; Domain 3 pricing-classification 3-literal vocabulary + 5 audit surfaces; Domain 4 claim-class 3-literal vocabulary + compliance-status 4-literal vocabulary + case-study 7-field envelope; Domain 5 requirement-matrix 7-column schema + 9 family literals + go/no-go 3-status vocabulary |
| 213-REVIEWS.md | HIGH#1 (1 — plans must adopt executable schema; 213.x parent confirmed scope-narrow, doctrine + scripts + tests only) and HIGH#2 (1 — ownership boundary correction; all upstream families converted to integrates_with), MEDIUM#1 (1 — VALIDATION.md exists already per 213-VALIDATION.md presence on disk) and MEDIUM#2 (1 — Wave 0.5 upstream preflight in 213-01) |
| 213-01..213-05 plan frontmatter | `files_modified` enumeration (47 paths verified across 5 plans, 0 UI surfaces); 5 `<read_first>` blocks confirm public surfaces are AUDIT TARGETS not modification targets |
| 206-UI-SPEC.md | Mutation-class doctrine inheritance for all future 213-substrate destructive actions (`public.claim` for case-study, `data.export` for go/no-go and final-readiness exports, `external.send` for case-study distribution); pricing-placeholder posture; banned-lexicon enforcement pattern; 213.x carry-forward decision rows |
| 207-UI-SPEC.md | `RunApiEnvelope` lineage via `agent_run_id` foreign-key on loop-01 artifact chain; `ApprovalHandoffRecord` integration for loop-01 approval log (`handoff_kind == 'approval'` for case-study publish, `'recovery'` for connector degradation, `'manual_input'` for status override, `'follow_up'` for gap-closure tasks); chain-engine downstream consumer pattern |
| 208-UI-SPEC.md | Operator-cockpit consumer pattern: Approval Inbox (208-04) handles loop-01 approval-log mutations, Task Board (208-03) handles loop-01 brief edits, Recovery Center (208-05) handles loop-01 connector degradation, Weekly Narrative (208-06) reads loop-01 outcome, Morning Brief (208-02) reads loop-01 brief; cockpit is CONSUMED in production by 213-02 dogfood loop, NOT modified |
| 209-UI-SPEC.md | Case-study claim evidence-gate inheritance — every public claim in `loop-01-claim-map.json` MUST have `evidence_ref` linkage; `claim_status: evidence_backed` is the binding gate; `<EvidenceSummary />` reused as read-only consumer by future Tenant 0 readiness dashboards; `inference_label` posture inherits for any inferred outcome in `loop-01-outcome.md` |
| 210-UI-SPEC.md | Connector substrate consumer pattern: `connector-inventory.json` reads `ConnectorInstall` health; the three `status` literals (`healthy`, `degraded`, `unavailable`) inherit verbatim from 210; degraded → `dispatch_status: ready_to_publish` blocker, NEVER fake publication |
| 211-UI-SPEC.md | Loop substrate consumer pattern (PARENT): Tenant 0 dogfood loop IS one real `MarketingStrategyRun → MeasurementHandoff` chain per 211 contract; the 6 loop-01 artifacts map 1:1 to 211 envelope (brief = ContentBrief; claim-map = MarketingArtifact + ArtifactAudit; approval-log = ApprovalHandoffRecord; dispatch-log = DispatchAttempt; outcome = RevenueFeedbackLink; learning-handoff = MeasurementHandoff); the `future_phase_213_tenant0` placeholder from 211 §Translation Gates Opened dissolves once 213-02 produces the chain |
| 212-UI-SPEC.md | Learning substrate consumer pattern (PARENT): loop-01 ends in `learning_handoff_status: recorded` (binding handshake into 212 substrate); the `future_phase_213_tenant0` placeholder from 212 §Translation Gates Opened dissolves once 213-02 lands and 213-05 maps the LRN family row in `requirement-implementation-matrix.md` |
| 213-VALIDATION.md (existing) | Verification rows for 213-01-00, 213-01-01, 213-02-01, 213-03-01, 213-04-01, 213-05-01, 213-05-02 (7 tasks across 5 plans) |
| DESIGN.md v1.1.0 | Banned lexicon, no-emoji rule, pricing placeholder rule, mint-as-text token reference, `.c-notice` / `.c-card` / `.c-card--feature` / `.c-table` policy carried forward to §Downstream UI Inheritance Map |
| 213.3 / 213.4 CONTEXT carry-forward (D-08, D-09, D-09b, D-13, D-14, D-15) | 6 decisions enumerated in §Downstream UI Inheritance Map (token-only, mint-as-text, `.c-notice` mandatory, `.c-card--feature` reserved, no `.c-table` primitive, selective extraction) — milestone wave CLOSED 2026-04-29 per STATE.md |
| REQUIREMENTS.md | Traceability table — `T0-01..05` + `QA-01..15` mapped to Phase 213 confirms 213 ownership scope; PRC/COMP/RUN/TASK/EVD/CONN/LOOP/LRN families correctly assigned to upstream phases per 213-REVIEWS HIGH#2 correction |
| User input | 0 — no-UI scope fully verified by upstream artifacts; no questions needed |

---

## Checker Sign-Off

For a no-UI-scope phase, the six dimensions resolve as follows. The
checker's job here is to verify the no-surface declaration is accurate
and the downstream-inheritance map is load-bearing for future phases —
not to evaluate visual quality of surfaces that don't exist.

- [ ] Dimension 1 Copywriting: PASS-BY-EXEMPTION (doctrine prose + CI-script CLI output + gate-JSON-envelope strings only; banned lexicon enforced; pricing placeholder verbatim and load-bearing per §Public Pricing Release-Gate Copy Contract; banned phrases enforced per §Public Proof Boundary Copy Contract; architecture-lock forbidden strings enforced; compliance-status and claim-class vocabularies verbatim)
- [ ] Dimension 2 Visuals: PASS-BY-EXEMPTION (no visuals authored)
- [ ] Dimension 3 Color: PASS-BY-EXEMPTION (no colors authored)
- [ ] Dimension 4 Typography: PASS-BY-EXEMPTION (no typography authored)
- [ ] Dimension 5 Spacing: PASS-BY-EXEMPTION (no spacing authored)
- [ ] Dimension 6 Registry Safety: PASS-BY-EXEMPTION (no registry consumed)

**No-UI declaration verification gate** (checker MUST verify before approving):

- [ ] All 5 plans confirmed to ship zero `app/`, zero `components/`,
      zero `*.stories.tsx`, zero `page.tsx`, zero `layout.tsx`, zero
      `*.css`, zero `*.module.css`, zero `tailwind.config.*`, zero
      `lib/**`, zero `api/**`, zero `supabase/migrations/**`,
      zero `route.ts` paths in `files_modified` (search assertions
      table above).
- [ ] Public surfaces (`app/(marketing)/integrations/claude/page.tsx`,
      `app/(marketing)/docs/[[...slug]]/page.tsx`,
      `app/docs/llms-full.txt/route.ts`, `public/llms.txt`,
      `docs/pricing/public-tier-placeholder.md`) confirmed as AUDIT
      TARGETS only — present in `<read_first>` and CI-script-scan
      string literals, ABSENT from every `files_modified` block.
- [ ] §Downstream UI Inheritance Map enumerates ≥ 12 future surface
      families with explicit Phase 213 doctrine origin (tenant-zero
      `.md|.json` doc) and 213.x carry-forward citation (D-08..D-15).
- [ ] §Translation Gate Dissolution and Opening enumerates ≥ 2
      dissolved gates (211 + 212 `future_phase_213_tenant0`) and
      ≥ 3 opened gates (P214-P217 SaaS Suite Activation + future SaaS
      Country Suite + future Tenant 0 ongoing-monitoring +
      gap-resolution + compliance-language-log).
- [ ] §Public Pricing Release-Gate Copy Contract authors sentinel-
      discipline rules + 4 canonical `release_reason` literals with
      verbatim UI display copy.
- [ ] §Public Proof Boundary Copy Contract authors banned-phrases
      table + allowed-phrasing-template + author-time enforcement
      flow.
- [ ] §DESIGN.md Compliance Assertions correctly marks visual rules as
      "not applicable" and enforces the seven non-visual rules
      (no-emoji in docs + CI scripts + gate JSON envelopes, banned
      lexicon, pricing placeholder, architecture-lock forbidden
      strings, ownership-boundary doctrine, banned-phrases doctrine,
      audit-target vs. modified-target discipline).
- [ ] Cross-phase doctrine binding to 206-UI-SPEC, 207-UI-SPEC,
      208-UI-SPEC, 209-UI-SPEC, 210-UI-SPEC, 211-UI-SPEC, 212-UI-SPEC
      verified for surfaces that involve mutation-class enforcement,
      run-envelope lineage, operator-cockpit consumption, evidence-
      gate dissolution, connector substrate readiness, loop-substrate
      consumption, and learning-substrate consumption.
- [ ] Translation gate dissolution explicitly identifies that 211
      `future_phase_213_tenant0` placeholder dissolves into 213-02
      loop-01 artifact chain AND 212 `future_phase_213_tenant0`
      placeholder dissolves into 213-02 `learning_handoff_status:
      recorded` + 213-05 LRN family row.
- [ ] 213.x adoption-wave carry-forward (D-08..D-15) enumerated in
      §Downstream UI Inheritance Map.
- [ ] Existing P208 cockpit + P211 loop substrate + P209 evidence
      substrate + P210 connector substrate correctly identified as
      CONSUMED in production (NOT modified by 213); dogfood-proof
      integrity preserved.
- [ ] 213.x decimal phases (213.1, 213.2, 213.3, 213.4) correctly
      identified as CLOSED 2026-04-29 per STATE.md milestone wave;
      this 213 parent confirmed as separate doctrine + audit +
      closeout substrate phase.

**Approval:** pending

---

## UI-SPEC COMPLETE
