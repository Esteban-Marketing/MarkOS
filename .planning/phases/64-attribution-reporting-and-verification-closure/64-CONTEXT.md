---
phase: "64"
name: "Attribution, Reporting, and Verification Closure"
created: "2026-04-04"
---

# Phase 64: Attribution, Reporting, and Verification Closure - Context

## Client Brief

MarkOS v3.3.0 cannot close on CRM schema, execution, outbound, and copilot capabilities alone. After Phases 58 through 63 establish the canonical CRM record model, identity and behavior history, multi-view workspace, explainable execution, native outbound, and approval-aware CRM copilots, Phase 64 must close the milestone with CRM-native attribution, operator and executive reporting, live verification, and acceptance evidence.

This phase is not a new growth-analytics platform and not an excuse to reopen the AI-copilot surface area. It must consolidate the milestone into one coherent CRM reporting shell that exposes pipeline health, conversion, attribution, SLA risk, agent productivity, operational readiness, and closeout evidence without leaving the product. It should also provide controlled cross-tenant reporting rollups for central operators, while keeping drill-down and any execution-adjacent transitions approval-aware.

Phase 64 consumes the canonical CRM schema from Phase 58, the tracking and identity substrate from Phase 59, the multi-view CRM workspace from Phase 60, the execution and recommendation layer from Phase 61, the outbound history and conversation telemetry from Phase 62, and the audit-aware copilot and playbook model from Phase 63. It should close the milestone with reporting truth and verification evidence rather than expanding into MMM, a custom BI builder, or another major AI surface.

## Brand Constraints

- Voice: Reference `.markos-local/markos/MIR/VOICE-TONE.md` for direct, proof-driven, non-hype reporting language.
- Visual: Preserve the existing MarkOS CRM shell and reporting surfaces inside the product rather than introducing a detached analytics studio or dashboard brand.
- Prohibited: No full MMM in this phase, no open-ended custom BI builder, and no unnecessary AI-reporting sprawl beyond what is required to close ATT-01 and REP-01.

## Audience Segment

- Target ICP: Internal MarkOS operators plus future revenue teams across frontline operators, managers or team leads, tenant admins, controlled central operators, and executive stakeholders consuming simplified readouts.
- Funnel stage: Decision and retention for the product itself; this is milestone-closeout reporting and verification rather than acquisition marketing.
- Audience size: Whole operator and oversight layer for v3.3.0, including tenant-scoped reporting users and controlled cross-tenant reporting consumers.

## Budget

- Phase budget: $0 external spend beyond existing platform and model usage; internal engineering and planning only.
- Allocated from: Core platform roadmap capacity under v3.3.0.

## Decisions

_Decisions captured during /gsd:discuss-phase 64_

| # | Decision | Rationale | Impact |
|---|----------|-----------|--------|
| D-01 | Phase 64 must serve frontline operators, managers or team leads, tenant admins, controlled central operators, and executive readouts in the first pass | The milestone closeout needs both operational depth and simplified top-level visibility | Planning cannot optimize only for operator dashboards or only for executive summaries |
| D-02 | The first-pass reporting shell must include pipeline health and conversion, attribution views, SLA and risk reporting, agent productivity reporting, and milestone verification evidence | The user selected the full closeout set rather than a narrow attribution-only phase | Planning must design one coherent CRM-native reporting surface instead of isolated widgets |
| D-03 | Phase 64 should implement deeper weighted attribution, but with fixed heuristic weights rather than stage-varying or highly adaptive modeling in the first pass | The user wants more than directional attribution, but still inside a deterministic closeout scope | Planning should specify an explicit weighted multi-touch model that is inspectable and stable |
| D-04 | Executive readouts must live inside the CRM reporting shell rather than as a separate analytics product | The reporting experience should remain one product surface with role-aware simplification | Planning should include a simplified executive layer inside the same reporting architecture |
| D-05 | Cross-tenant reporting is allowed only for central operators through controlled rollups with approval-aware drill-down boundaries | The user wants cross-tenant visibility, but not silent expansion of oversight scope | Planning must separate tenant reporting from central rollups and preserve explicit governance for deeper inspection |
| D-06 | Phase 64 must produce operator-facing validation views, direct acceptance evidence artifacts, a live verification workflow, and backoffice health or readiness reporting | The milestone needs both product-facing proof and operational closure evidence | Planning must include validation-ledger and live-check outputs in addition to reporting UI |
| D-07 | ATT-01 should close with CRM-native attribution across contact, deal, and campaign reporting, with visible revenue contribution and influence views | The requirement explicitly calls for CRM-layer multi-touch attribution, not a detached analytics layer | Planning must anchor attribution to canonical CRM objects and histories rather than external dashboards |
| D-08 | REP-01 should close by consolidating pipeline health, conversion, attribution, SLA risk, and agent productivity into one CRM-native reporting shell | REP-01 has been partially advanced in earlier phases, but this phase must complete the coherent operational cockpit | Planning should treat reporting unification as a milestone-closeout requirement, not optional polish |
| D-09 | Backoffice readiness and data-completeness reporting are in scope in the first pass | Verification closure requires proof that attribution and reporting inputs are healthy, not only visible | Planning should include health and completeness reporting for tracked inputs, stitched identities, and attribution readiness |
| D-10 | Full MMM and an open-ended custom BI builder are explicitly deferred, not removed | The user wants both concepts preserved as future seeds instead of rejected ideas | Context should mark these as deferred expansions for later milestone or phase discussion |
| D-11 | Phase 64 should avoid broad AI-reporting expansion unless it is strictly necessary to close the reporting and verification loop | The user did not want this phase to re-expand copilot scope unnecessarily | Planning should prefer deterministic reporting and evidence surfaces over fresh AI surface sprawl |
| D-12 | Verification closure is part of the product scope for this phase, not just an internal note | The roadmap goal explicitly includes live verification and acceptance evidence | Planning must define both the reporting deliverables and the closeout artifact set together |

## Discretion Areas

_Where the executor can use judgment without checkpointing:_

1. Exact reporting layout and navigation structure, provided all required surfaces remain inside the existing CRM shell.
2. Exact fixed heuristic weighting scheme for first-pass attribution, provided it stays deterministic, inspectable, and CRM-native.
3. Exact split between operator-detail views and simplified executive summaries, provided they reuse the same reporting truth model.
4. Exact shape of backoffice readiness reporting, provided it clearly exposes attribution and reporting data health.
5. Exact presentation of central-operator cross-tenant rollups, provided deeper drill-down stays explicitly governed.

## Deferred Ideas

_Ideas surfaced but not in scope for this phase:_

1. Full MMM or other advanced attribution modeling beyond the fixed weighted multi-touch first pass.
2. A custom BI builder or open-ended analytics studio.
3. Broader AI-generated reporting expansion beyond what is necessary to close ATT-01 and REP-01.
4. Finance-grade external warehouse reporting and deep RevOps analytics expansion.
5. Export-heavy reporting workflows as the primary reporting model.

---

_Phase: 64-attribution-reporting-and-verification-closure_
_Context gathered: 2026-04-04_
_Decisions locked: 12 (D-01 through D-12)_
