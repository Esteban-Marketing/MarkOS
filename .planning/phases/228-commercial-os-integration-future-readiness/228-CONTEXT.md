# Phase 228 - Commercial OS Integration and Future-Readiness (Context)

**Milestone:** v4.2.0 Commercial Engines 1.0
**Depends on:** Phases 221-227
**Status:** Hardened for discuss/plan
**Gathered:** 2026-04-25 (augmented with formal sections for planner)
**Purpose:** Integrator closure — this is a parity/enforcement phase, not a new product surface.

<domain>
## Phase Boundary

Phase 228 is the **integrator and parity gate** for the v4.2.0 commercial-engine lane (Phases 221-227, sourcing incoming docs 18-26). It enforces that the eight upstream engines ship as a single coherent Commercial OS: shared contracts, UI/API/MCP parity, provider replaceability, migration/export/archival posture, and cross-engine test doctrine. **Not in scope:** new product surfaces, new MCP verb families, sibling orchestrators on top of 221-227, or reopening upstream engine scope.

</domain>

<decisions>
## Implementation Decisions

### D-01..06: Scope Anchors (parity-only)
- **D-01:** No new product surface, no new MCP verb family, no new API domain in 228. If parity enforcement requires a net-new surface, route back to upstream phase as a gap.
- **D-02:** No sibling orchestrator on top of 221-227. Contract registry **extends** existing substrate, not parallel system.
- **D-03:** No engine ships without provider-replaceability proof — every external dependency has a passing adapter-swap dry run.
- **D-04:** No engine ships with contract gaps vs the registry. UI, API, and MCP each have a registered contract OR an explicit, auditable deferral.
- **D-05:** Engines are **incomplete** if they only exist on one surface (Gate 9: UI/API/MCP parity).
- **D-06:** Pricing-sensitive surfaces route through Pricing Engine (or sanctioned `{{MARKOS_PRICING_ENGINE_PENDING}}` placeholder per Pricing Engine Canon).

### D-07..16: Parity Gates Enforced (10 gates from routing doc lines 113-126)
- **D-07:** Gate 1 — One identity truth. 221 CDP is sole source for profile, consent, audience.
- **D-08:** Gate 2 — One commercial memory. 222 CRM timeline is sole store for deal/campaign/support notes.
- **D-09:** Gate 3 — One governed mutation path. Email/messaging/launch/partner/referral/pricing/sales outputs pass through task, approval, evidence, audit, AgentRun controls.
- **D-10:** Gate 4 — No passive systems. CDP/CRM/analytics/ecosystem/sales must produce tasks, alerts, or decisions (not just dashboards).
- **D-11:** Gate 5 — No pricing bypasses. Every pricing-sensitive surface routes through Pricing Engine.
- **D-12:** Gate 6 — No unsupported external claim. Proof, case study, ROI, competitor, launch language is evidence-linked and freshness-aware (Phase 209 doctrine).
- **D-13:** Gate 7 — No provider lock as architecture. Every external channel/platform has adapter contracts, export posture, migration thinking.
- **D-14:** Gate 8 — No designed obsolescence. Versioned schemas, import/export, archival, recoverability are shipped, not promised.
- **D-15:** Gate 9 — UI/API/MCP parity. Engine incomplete if only one surface.
- **D-16:** Gate 10 — Testability is part of design. Vitest for business logic, Playwright for workflow truth, Chromatic for component states.

### D-17..21: Plan Slice Allocation (from DISCUSS.md)
- **D-17:** Slice 228-01 — Cross-engine contract registry + parity gate (closes Gates 1, 2, 9).
- **D-18:** Slice 228-02 — Provider adapter, export, migration standards (closes Gates 7, 8 partial).
- **D-19:** Slice 228-03 — Recovery, archival, no-obsolescence controls (closes Gate 8).
- **D-20:** Slice 228-04 — Cross-phase testing + verification gate expansion (closes Gate 10, plus Gates 3-6 enforcement coverage).
- **D-21:** Slice 228-05 — Final commercial-stack audit + readiness matrix artifact (closes lane).
- **D-21b:** Slice 228-06 — Documentation, canon sync, execution handoff closure.

### D-22..26: Test Doctrine Bindings
- **D-22:** Vitest required for every contract boundary: CDP identity merge, CRM timeline write, channel dispatch, funnel event, metric layer, deal mutation, ecosystem attribution.
- **D-23:** Playwright required for end-to-end CRM → channel → conversion → analytics → sales → ecosystem chain, including approval + rollback paths.
- **D-24:** Chromatic required for operator surfaces with governed mutations: approval queues, launch cockpits, audience activation, deal rooms, partner consoles.
- **D-25:** Replaceable-adapter tests follow patterns in `lib/markos/outbound/providers/` and `lib/markos/plugins/`. Every new provider binding ships with fail-closed swap test.
- **D-26:** Migration/export invariants — versioned schema + export round-trip + archival recovery test per engine.

### D-27..30: Done Criteria (exit gates)
- **D-27:** Contract registry complete for every F-ID across 221-227: CDP-01..05, CRM-01..05, EML-01..05, MSG-01..05, CNV-01..05, LCH-01..05, ANL-01..05, SEN-01..05, ECO-01..05, COM-01..06, QA-01..15.
- **D-28:** Provider-swap dry run passes for every engine with external dependency (email, messaging, analytics sink, ecosystem connectors, launch distribution).
- **D-29:** Evidence trace proven end-to-end across full chain: CRM → channel → conversion → analytics → sales → ecosystem.
- **D-30:** SOC2-I posture ready — audit, evidence, approval, mutation trails complete and machine-verifiable. Final readiness matrix artifact signed off and linked from ROADMAP.md.

### D-31..D-37: Review-driven hardening (post-Codex review 2026-04-25)
- **D-31 (route-back hard preconditions for Plans 01/02/03):** Replanned per RH3 sequencing concern. Plans 01/02/03 MUST assert upstream-engine code-surface presence via `fs.existsSync` BEFORE creating any registry/adapter/migration scaffolding. Missing surface → exit 1 with route-back-to-upstream-phase message per D-01. Phase 228 cannot accumulate synthetic infrastructure not bound to upstream code. The route-back model is mandatory for these slices, not just 04/05.
- **D-32 (real adapter conformance per RH1):** Plan 02 swap test MUST bind to real adapter modules in `lib/markos/outbound/providers/` (e.g., `resend-adapter.ts`, `twilio-adapter.ts`) — not stub adapters synthesized from fixture JSON. Each binding's `swap_test_real_module_path` is validated via `fs.existsSync` and asserted to NOT be in any `_stub-*` namespace. The `launch_distribution` composite is split into `launch_distribution_email` + `launch_distribution_chat` distinct bindings (each with single-provider swap proof) — composite single-binding form is rejected.
- **D-33 (real exporters/importers per RH2):** Plan 03 archival/migration MUST bind to real engine exporter modules (e.g., `lib/markos/cdp/exporters/identity-profile.js`). The `_default-archive` / `_default-restore` namespace is FORBIDDEN. Missing exporter → fail-closed with route-back to upstream phase per D-01. Stubs from slice 02 (9 representative entries) are acceptable ONLY if they bind to a real upstream module path; otherwise the slice routes the gap back.
- **D-34 (hard follow-through enforcement per RH4):** Sign-off in Plan 05 is valid ONLY if either (a) `verify-readiness-matrix.cjs --strict` exits 0, OR (b) every auditable deferral has a written-and-committed follow-up phase entry in ROADMAP.md (e.g., `Phase 228.1 — Deferred-cell closure: <deferral-list>`) with explicit dependency linkage and target date. `--strict` becomes the closeout gate; advisory-only mode is removed. Plan 06 Task 3 verifies the follow-up phase entries exist.
- **D-35 (independent QA-15 evidence per RM4):** QA-15 closeout is validated against **raw gate output JSON** (e.g., `governed-mutation.test.json`, `passive-system-detector.test.json`, `test-adapter-swap.json`), not by re-running the readiness-matrix verifier. New script `scripts/commercial/verify-readiness-from-raw.cjs` reconstructs expected matrix cells from raw outputs and compares to README matrix. Asserts `compute(matrix) === matrix`.
- **D-36 (real Storybook stories per RM2):** Per D-24, Chromatic stories MUST import the actual upstream component / view-model from a non-`.storybook/` path (e.g., `import { ApprovalQueue } from 'app/(operator)/approvals/approval-queue'`). If upstream component does not exist → fail-closed precondition (route-back per D-01). Placeholder JSX stories are FORBIDDEN.
- **D-37 (AST/allowlist pricing detector per RM3):** Pricing-bypass detector replaces 5-line regex heuristic with allowlisted pricing-accessor enforcement. Detector parses TS/JS source, finds pricing-string literals (matching `$d+`, `/mo`, `/year`, currency patterns), and asserts each is reached only via allowlisted accessors (`getPricingFor`, `formatPrice`, `usePricing`, `pricingFromEngine`) OR is the literal `{{MARKOS_PRICING_ENGINE_PENDING}}` placeholder. Pricing literals reached through any other path fail.

### Claude's Discretion
- Exact registry schema format (JSON vs TypeScript module vs both) — planner picks consistent with existing `lib/markos/plugins/registry.js` patterns.
- Specific test file structure (per-slice vs per-engine) — planner aligns with existing testing-environment-plan.
- Documentation format for readiness matrix (table vs structured JSON + rendered view) — planner picks.
- Whether 228-06 (docs/canon sync) ships as one slice or folds into 228-05 — planner judges based on doc churn discovered in execution.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Doctrine + product canon
- `obsidian/brain/MarkOS Canon.md` — MarkOS product canon (commercial OS scope, single-truth principles)
- `obsidian/brain/SaaS Suite Canon.md` — Suite-level architecture and shared substrate
- `obsidian/brain/Pricing Engine Canon.md` — Pricing-sensitive surface enforcement (Gate 5)
- `obsidian/brain/SaaS Marketing OS Strategy Canon.md` — Marketing OS strategy
- `obsidian/brain/Marketing Operating System Foundation.md` — Foundation principles
- `obsidian/brain/Brand Stance.md` — Evidence-backed claim posture (Gate 6)
- `obsidian/brain/Target ICP.md` — ICP context for surface decisions

### Spec + contracts (operating loop)
- `obsidian/reference/MarkOS v2 Operating Loop Spec.md` — Operating loop compliance posture (gated from v4.0.0)
- `obsidian/reference/MarkOS v2 Requirements Traceability Matrix.md` — Requirement → phase mapping
- `obsidian/reference/Contracts Registry.md` — Contract registry doctrine and structure
- `obsidian/reference/Database Schema.md` — Versioned schema posture (Gate 8)
- `obsidian/reference/Core Lib.md` — Core library structure
- `obsidian/reference/HTTP Layer.md` — API surface conventions
- `obsidian/reference/UI Components.md` — UI surface conventions

### Phase 228 routing + traceability
- `.planning/V4.2.0-INCOMING-18-26-GSD-DISCUSS-RESEARCH-ROUTING.md` (lines 113-126: authoritative quality-gate list)
- `.planning/V4.2.0-DISCUSS-RESEARCH-REFRESH-221-228.md`
- `.planning/V4.0.0-PHASE-TEST-REQUIREMENTS-MATRIX.md` — test traceability anchor (Gate 10)
- `.planning/V4.0.0-TESTING-ENVIRONMENT-PLAN.md` — Vitest/Playwright/Chromatic doctrine
- `.planning/V4.0.0-CODEBASE-VAULT-DEEP-AUDIT.md` — codebase audit baseline
- `.planning/ROADMAP.md` (Phase 228 block, lines ~467-473)

### Incoming engine docs (all 9, sources for 221-227)
- `obsidian/work/incoming/18-CRM-ENGINE.md`
- `obsidian/work/incoming/19-EMAIL-ENGINE.md`
- `obsidian/work/incoming/20-CDP-ENGINE.md`
- `obsidian/work/incoming/21-MESSAGING-ENGINE.md`
- `obsidian/work/incoming/22-ANALYTICS-ENGINE.md`
- `obsidian/work/incoming/23-CONVERSION-ENGINE.md`
- `obsidian/work/incoming/24-SALES-ENABLEMENT-ENGINE.md`
- `obsidian/work/incoming/25-ECOSYSTEM-ENGINE.md`
- `obsidian/work/incoming/26-LAUNCH-ENGINE.md`

### Sibling phase contexts (contract integration targets)
- `.planning/phases/221-cdp-identity-audience-consent-substrate/221-CONTEXT.md` — CDP (doc 20)
- `.planning/phases/222-crm-timeline-commercial-memory-workspace/222-CONTEXT.md` — CRM (doc 18)
- `.planning/phases/223-native-email-messaging-orchestration/223-CONTEXT.md` — email/messaging (docs 19+21)
- `.planning/phases/224-conversion-launch-workspace/224-CONTEXT.md` — conversion/launch (docs 23+26)
- `.planning/phases/225-analytics-attribution-narrative-intelligence/225-CONTEXT.md` — analytics (doc 22)
- `.planning/phases/226-sales-enablement-deal-execution/226-CONTEXT.md` — sales enablement (doc 24)
- `.planning/phases/227-ecosystem-partner-community-developer-growth/227-CONTEXT.md` — ecosystem (doc 25)

### Phase 228 own artifacts
- `.planning/phases/228-commercial-os-integration-future-readiness/DISCUSS.md` — slice plan 228-01..06
- `.planning/phases/228-commercial-os-integration-future-readiness/228-RESEARCH.md` — research findings + recommended path

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/markos/outbound/providers/base-adapter.ts` — replaceable adapter base (reuse for Gate 7 adapter contracts)
- `lib/markos/plugins/registry.js` — explicit contract + validation pattern (model for cross-engine contract registry)
- `lib/markos/plugins/loader.js` — fail-closed loading pattern (model for adapter-swap test infrastructure)

### Established Patterns
- Replaceable-adapter doctrine already in repo for outbound providers — every new provider binding mirrors this
- Plugin registry already demonstrates explicit contracts + validation + fail-closed loading
- Cross-phase testing doctrine already enforced via Vitest/Playwright/Chromatic — extend, do not reinvent
- Versioned-schema posture already partial — must be enforced as exit criterion (Gate 8)

### Integration Points
- Contract registry **extends** `lib/markos/plugins/registry.js` doctrine — no parallel store
- Adapter contracts **extend** `lib/markos/outbound/providers/base-adapter.ts` — no new base
- Test gates **extend** `V4.0.0-PHASE-TEST-REQUIREMENTS-MATRIX.md` — add cross-engine columns, do not fork
- Readiness matrix artifact links from `.planning/ROADMAP.md` Phase 228 block — final closeout signal
- Phase 209 evidence-link doctrine applies to Gate 6 enforcement (claim freshness)

</code_context>

<specifics>
## Specific Ideas

- "Final readiness matrix" should be a machine-verifiable artifact — table + structured data the planner can validate, not just prose.
- "Provider-swap dry run" must be a real test that runs in CI, not a checklist item.
- Evidence-trace test (CRM → channel → conversion → analytics → sales → ecosystem) is the **single Playwright suite** that proves Gate 9 + Gate 10 in one go.
- SOC2-I posture is the audit framing — every governed mutation produces an audit row, every approval produces an evidence row, every external claim links to a freshness timestamp.
- Routing-doc lines 113-126 are the **authoritative** gate list — do not paraphrase, enforce verbatim.

</specifics>

<deferred>
## Deferred Ideas

- New MCP verb families for cross-engine orchestration — out of scope, would be 229+.
- New product surfaces for the readiness matrix UI — readiness matrix renders into existing operator surface; net-new UI is upstream-phase gap.
- SOC2 Type II posture — explicitly Type I in v4.2.0 (per Locked SaaS Decisions 2026-04-16, ROADMAP.md). Type II is a future-milestone concern.
- Marketplace-tier engines (plugin marketplace, agent marketplace beyond Y1 scope) — separate roadmap lane.
- Pricing Engine completion — gated separately; 228 enforces routing through Pricing Engine, not its implementation. `{{MARKOS_PRICING_ENGINE_PENDING}}` placeholder remains valid.

### Review-driven deferrals (post-Codex 2026-04-25)

- **GDPR/right-to-erasure reconciliation for SOC2-I 7-year retention (per RM5).** P221 D-24 specifies tombstone-on-delete (`IdentityProfile` PII columns scrubbed, `identity_id` retained for referential integrity, `ConsentState` retained with `deletion_evidence_ref`). Plan 03 archival-policy.json retention floor of 2555 days applies to the **tombstoned (PII-scrubbed) shell** — NOT to original PII. This must be documented explicitly in archival-policy.json `gdpr_reconciliation` field per entry, citing P221 D-24. If a real exporter for `cdp/identity_profile`, `cdp/consent_state`, or `cdp/audience_snapshot` does NOT enforce PII scrubbing on archive, that entry routes back to phase 221 as a gap (per D-01) — Phase 228 cannot lock 7-year retention on un-scrubbed PII. Plan 03 includes a precondition assertion that the real exporter for these classes references the P221 tombstone fields. If the real exporter is not yet wired in P221, this archival entry is **deferred to phase 221.1** (gap-closure) and Plan 05 sign-off MUST list it in deferred cells per D-34.
- **Real archival exporter implementation for the 21+ archival entries beyond the 9 slice-02 representatives (per RH2).** Slice 03 uses real upstream module paths where available; missing exporters route back to upstream phase. The route-back is intentional per D-33. If 21+ archival exporters land as gap-closure work in upstream phases (221-227.1 etc.), Phase 228 closure waits for those gap-closure phases per D-34 follow-through enforcement.
- **Composite `launch_distribution` binding** if upstream Phase 224 ships it as a single composite workflow rather than two distinct bindings — would require explicit `composite: true` flag with per-component swap proof, documented in CONTEXT update at that time. Default per D-32 is split.

</deferred>

---

*Phase: 228-commercial-os-integration-future-readiness*
*Context augmented: 2026-04-25*

---

## Original Hardened Context (preserved below)


## Why Phase 228 Exists

Phase 228 is the **integrator and parity gate** for the entire commercial-engine lane (`221-227`, sourcing from incoming docs `18-26`). It exists to guarantee that the eight upstream commercial engines ship as a single coherent Commercial OS rather than eight adjacent silos.

This phase explicitly **does NOT**:

- add new product surface (no new UI, no new API domain, no new MCP verb family)
- introduce a sibling orchestrator on top of `221-227`
- reopen scope settled in the upstream engine phases

This phase **DOES**:

- enforce contract parity across UI, API, and MCP for every commercial engine
- prove provider replaceability for every externally-backed capability
- certify migration, export, and archival readiness across the stack
- run the final cross-engine readiness matrix before the commercial lane is declared execution-ready

## Canonical Inputs

**Incoming engine docs (all 9):**

- [`obsidian/work/incoming/18-CRM-ENGINE.md`](../../../obsidian/work/incoming/18-CRM-ENGINE.md)
- [`obsidian/work/incoming/19-EMAIL-ENGINE.md`](../../../obsidian/work/incoming/19-EMAIL-ENGINE.md)
- [`obsidian/work/incoming/20-CDP-ENGINE.md`](../../../obsidian/work/incoming/20-CDP-ENGINE.md)
- [`obsidian/work/incoming/21-MESSAGING-ENGINE.md`](../../../obsidian/work/incoming/21-MESSAGING-ENGINE.md)
- [`obsidian/work/incoming/22-ANALYTICS-ENGINE.md`](../../../obsidian/work/incoming/22-ANALYTICS-ENGINE.md)
- [`obsidian/work/incoming/23-CONVERSION-ENGINE.md`](../../../obsidian/work/incoming/23-CONVERSION-ENGINE.md)
- [`obsidian/work/incoming/24-SALES-ENABLEMENT-ENGINE.md`](../../../obsidian/work/incoming/24-SALES-ENABLEMENT-ENGINE.md)
- [`obsidian/work/incoming/25-ECOSYSTEM-ENGINE.md`](../../../obsidian/work/incoming/25-ECOSYSTEM-ENGINE.md)
- [`obsidian/work/incoming/26-LAUNCH-ENGINE.md`](../../../obsidian/work/incoming/26-LAUNCH-ENGINE.md)

**Routing, refresh, and traceability:**

- [`.planning/V4.2.0-INCOMING-18-26-GSD-DISCUSS-RESEARCH-ROUTING.md`](../../V4.2.0-INCOMING-18-26-GSD-DISCUSS-RESEARCH-ROUTING.md) (authoritative quality-gate list, lines 113-126)
- [`.planning/V4.2.0-DISCUSS-RESEARCH-REFRESH-221-228.md`](../../V4.2.0-DISCUSS-RESEARCH-REFRESH-221-228.md)
- [`.planning/V4.0.0-PHASE-TEST-REQUIREMENTS-MATRIX.md`](../../V4.0.0-PHASE-TEST-REQUIREMENTS-MATRIX.md) (requirements traceability matrix)
- [`.planning/V4.0.0-TESTING-ENVIRONMENT-PLAN.md`](../../V4.0.0-TESTING-ENVIRONMENT-PLAN.md) (Vitest / Playwright / Chromatic doctrine)
- [`.planning/V4.0.0-CODEBASE-VAULT-DEEP-AUDIT.md`](../../V4.0.0-CODEBASE-VAULT-DEEP-AUDIT.md)
- [`.planning/ROADMAP.md`](../../ROADMAP.md) (Phase 228 block, lines ~467-473)
- MarkOS v2 Operating Loop compliance posture (gated from v4.0.0 — see roadmap references to `v2 operating loop compliance`)

**Sibling contracts to integrate (contract targets):**

- [`221-CONTEXT.md`](../221-cdp-identity-audience-consent-substrate/221-CONTEXT.md) — doc 20 CDP
- [`222-CONTEXT.md`](../222-crm-timeline-commercial-memory-workspace/222-CONTEXT.md) — doc 18 CRM
- [`223-CONTEXT.md`](../223-native-email-messaging-orchestration/223-CONTEXT.md) — docs 19 + 21 email/messaging
- [`224-CONTEXT.md`](../224-conversion-launch-workspace/224-CONTEXT.md) — docs 23 + 26 conversion/launch
- [`225-CONTEXT.md`](../225-analytics-attribution-narrative-intelligence/225-CONTEXT.md) — doc 22 analytics
- [`226-CONTEXT.md`](../226-sales-enablement-deal-execution/226-CONTEXT.md) — doc 24 sales enablement
- [`227-CONTEXT.md`](../227-ecosystem-partner-community-developer-growth/227-CONTEXT.md) — doc 25 ecosystem

## Parity Gates Enforced (the 10 from routing doc lines 113-126)

Every commercial engine must clear every gate before 228 exits:

1. **One identity truth** — no duplicate profile, consent, or audience systems; 221 is the sole source.
2. **One commercial memory** — no parallel CRM/deal/campaign/support note stores; 222 is the sole timeline.
3. **One governed mutation path** — email, messaging, launch, partner, referral, pricing, and sales outputs all pass through task, approval, evidence, audit, and AgentRun controls.
4. **No passive systems** — CDP, CRM, analytics, ecosystem, and sales enablement must produce tasks, alerts, or decisions (not just dashboards).
5. **No pricing bypasses** — every pricing-sensitive surface routes through Pricing Engine (or its sanctioned placeholder).
6. **No unsupported external claim** — proof, case study, ROI, competitor, and launch language is evidence-linked and freshness-aware (Phase 209 doctrine).
7. **No provider lock as architecture** — every external channel/platform dependency has adapter contracts, export posture, and migration thinking.
8. **No designed obsolescence** — versioned schemas, import/export posture, archival, and recoverability are shipped, not promised.
9. **UI / API / MCP parity** — engines are incomplete if they only exist on one surface.
10. **Testability is part of design** — business logic provable in `Vitest`, workflow truth in `Playwright`, component states eligible for `Chromatic`.

## Objects and Surfaces That Must Be Parity-Verified

Cross-phase object inventory — 228 certifies each object ships with contract, parity, replaceability, and migration proof:

| Object / Surface | Upstream owner | Parity gate 228 enforces |
|---|---|---|
| Identity, profile, consent, audience snapshot | 221 (doc 20) | Gates 1, 3, 8, 9 — single identity/consent truth with versioned snapshots; UI/API/MCP parity for audience read/activate |
| CRM timeline, account/person/opportunity, next-best-action | 222 (doc 18) | Gates 2, 4, 9 — single timeline truth; every CRM action produces task/approval/evidence |
| Email dispatcher, messaging threads, consent/suppression | 223 (docs 19 + 21) | Gates 3, 7, 9 — governed send path; Resend/Twilio (and successors) behind replaceable adapter contracts |
| Conversion funnel events, landing/form/offer, launch plan + rollback | 224 (docs 23 + 26) | Gates 3, 5, 8, 9 — governed mutation, Pricing Engine respected, rollback posture shipped |
| Analytics events, metric catalog, attribution semantics, narrative | 225 (doc 22) | Gates 1, 4, 6 — shared event taxonomy with CDP; no duplicate revenue truth; provenance and freshness first-class |
| Sales deal records, battlecards, proof packs, proposal/quote | 226 (doc 24) | Gates 2, 5, 6 — CRM-backed; quote/discount stays within Pricing Engine; proof is evidence-linked |
| Ecosystem partner, affiliate, referral, certification, community | 227 (doc 25) | Gates 3, 4, 7 — fraud-aware controls; ecosystem attribution does not fork the revenue ledger |
| Launch plans, rollout/rollback, approval gating | 224 + 223 (doc 26) | Gates 3, 8 — every launch is governed, versioned, and recoverable |

## Non-Negotiables

- **No new sibling orchestrator.** 228 enforces; it does not re-implement what 221-227 own.
- **No new duplicate contract store.** Contract registry extends existing substrate; it is not a parallel system.
- **No engine ships without provider-replaceability proof.** Every external dependency has a passing adapter-swap dry run.
- **No engine ships with contract gaps vs the registry.** UI, API, and MCP surfaces each have a registered contract, or an explicit, auditable deferral.
- **No new product surface introduced here.** If 228 needs a net-new surface to enforce something, that surface is an upstream-phase gap and routes back.

## Codebase-Specific Constraints

The existing [`.planning/V4.0.0-PHASE-TEST-REQUIREMENTS-MATRIX.md`](../../V4.0.0-PHASE-TEST-REQUIREMENTS-MATRIX.md) remains the requirements traceability anchor. Phase 228 extends it with concrete cross-engine test-coverage obligations:

- **Vitest** — unit/integration coverage for every contract boundary (CDP identity merge, CRM timeline write, channel dispatch, funnel event, metric layer, deal mutation, ecosystem attribution).
- **Playwright** — end-to-end workflow truth across CRM → channel → conversion → analytics → sales → ecosystem, including approval and rollback paths.
- **Chromatic** — visual-state coverage for operator surfaces that carry governed mutations (approval queues, launch cockpits, audience activation, deal rooms, partner consoles).
- **Replaceable-adapter tests** — repo patterns under `lib/markos/outbound/providers/` and `lib/markos/plugins/` are the reference; every new provider binding must ship with an equivalent fail-closed swap test.
- **Migration/export invariants** — versioned schema, export round-trip, and archival recovery tests per engine.

## Done Means

Phase 228 exits only when all of the following are true:

- Contract registry is complete for every F-ID spanning `221-227` (CDP-01..05, CRM-01..05, EML-01..05, MSG-01..05, CNV-01..05, LCH-01..05, ANL-01..05, SEN-01..05, ECO-01..05, COM-01..06, plus QA-01..15 coverage).
- Provider-swap dry run has passed for each engine with an external dependency (email, messaging, analytics sink, ecosystem connectors, launch distribution).
- Evidence traces are proven end-to-end across the full chain: CRM → channel → conversion → analytics → sales → ecosystem.
- UI / API / MCP parity is certified for every shipped engine, with deferrals explicit and auditable.
- Migration, export, and archival round-trips pass for every durable object in the inventory above.
- SOC2-I posture is ready — audit, evidence, approval, and mutation trails are complete and machine-verifiable.
- The final readiness matrix artifact is signed off and linked from [`.planning/ROADMAP.md`](../../ROADMAP.md).
