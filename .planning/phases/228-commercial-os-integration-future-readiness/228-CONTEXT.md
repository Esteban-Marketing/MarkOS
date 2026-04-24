# Phase 228 - Commercial OS Integration and Future-Readiness (Context)

**Milestone:** v4.2.0 Commercial Engines 1.0
**Depends on:** Phases 221-227
**Status:** Hardened for discuss/plan
**Purpose:** Integrator closure — this is a parity/enforcement phase, not a new product surface.

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
