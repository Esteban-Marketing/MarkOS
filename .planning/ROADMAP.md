# Roadmap: MarkOS (MARKOS)

## Milestones

> Archived milestone phase details are intentionally kept in the matching files under `.planning/milestones/`, while this roadmap stays summary-first for active planning work.

- 🚧 **v3.9.0 Vertical Plugin Literacy Libraries** — Active milestone initialized 2026-04-15; phase planning starts at Phases 106-110
- ✅ **v3.8.0 Revenue CRM and Customer Intelligence Core** — Phases 100-105 completed; archived at `.planning/milestones/v3.8.0-ROADMAP.md` (2026-04-15)
- ✅ **v3.7.0 Neuro-Adaptive Literacy Intelligence** — Phases 96-99.1 completed; archived at `.planning/milestones/v3.7.0-ROADMAP.md` (2026-04-14)
- ✅ **v3.6.0 Deep Research Tailoring Engine** — Phases 91-95 completed; archived at `.planning/milestones/v3.6.0-ROADMAP.md` (2026-04-14)
- ✅ **v3.5.0 Ultimate Literacy Vault** — Phases 84-90 completed; archived at `.planning/milestones/v3.5.0-ROADMAP.md` (2026-04-13)
- ✅ **v3.4.0 Complete Branding Engine** — Phases 73-83 completed; archived at `.planning/milestones/v3.4.0-ROADMAP.md` (2026-04-12)
- ✅ **v3.1.0 Operator Surface Unification** — Phases 45-50 completed; archived at `.planning/milestones/v3.1.0-ROADMAP.md` (2026-04-03)
- ✅ **v1.0 Initial Protocol** — Phases 1-7 shipped (2026-03-23)

## Active Milestone: v3.9.0 — Vertical Plugin Literacy Libraries

**Status:** Planning active — milestone direction is locked and phase work can now begin.

**Goal:** Make MarkOS initialization feel domain-native by loading composable business-model and industry literacy packs that generate better starter examples, skeletons, prompts, and workspace artifacts from day one.

**Requirements to map:** LIB-01, LIB-02, LIB-03, LIB-04, INIT-01, INIT-02, INIT-03, GOV-01, GOV-02

**Research/context:** `.planning/milestones/v3.9.0-PLUGIN-LITERACY-LIBRARIES-CONTEXT.md`

### Phase 106: Template Taxonomy and Selection Contracts
**Goal:** Define the canonical library registry, pack metadata, selection rules, and operator override contract for base family plus industry overlay composition.
**Requirements Mapped:** LIB-01, LIB-04, INIT-02
**Depends on:** Shipped v3.8.0 onboarding, literacy, and plugin foundations
**Status:** 📋 Planned
**Plans:** 2/2 plans complete

Plans:
- [x] 106-01-PLAN.md — Wave 0–3: Ajv install + test stub; pack-schema.json + 7 manifests + pack-loader.cjs; template-family-map.cjs facade; resolvePackSelection + INDUSTRY_ALIAS_MAP

### Phase 107: Business-Model Starter Library Expansion
**Goal:** Author and normalize the base starter packs for priority business families so each supported model has discipline-aware examples and initialization scaffolding.
**Requirements Mapped:** LIB-03
**Depends on:** Phase 106
**Status:** 📋 Planned
**Plans:** 6 plans

Plans:
- [ ] 107-01-PLAN.md — Wave 1: B2B tone doc + 5-discipline skeleton
- [ ] 107-02-PLAN.md — Wave 1: B2C tone doc + 5-discipline skeleton
- [ ] 107-03-PLAN.md — Wave 1: SaaS tone doc (extends overlay) + 5-discipline skeleton
- [ ] 107-04-PLAN.md — Wave 1: Ecommerce tone doc (extends overlay) + 5-discipline skeleton
- [ ] 107-05-PLAN.md — Wave 1: Services tone doc (extends overlay) + 5-discipline skeleton
- [ ] 107-06-PLAN.md — Wave 2: Mutate 5 pack.json manifests (version + completeness + baseDoc + changelog)

### Phase 108: Industry Overlay Packs
**Goal:** Add the first vertical overlays for Travel, IT, Marketing Services, and Professional Services and ensure they compose cleanly with the base family packs.
**Requirements Mapped:** LIB-02
**Depends on:** Phase 106, Phase 107
**Status:** 📋 Planned

### Phase 109: Initialization and Workspace Hydration Integration
**Goal:** Wire the library selection flow into onboarding, approval, and local workspace hydration so the correct packs appear automatically during project setup.
**Requirements Mapped:** INIT-01, INIT-03
**Depends on:** Phase 106 through Phase 108
**Status:** 📋 Planned

### Phase 110: Diagnostics, Fallbacks, and Closeout Hardening
**Goal:** Add graceful fallback behavior, coverage diagnostics, and regression safeguards so partial library support stays trustworthy and auditable.
**Requirements Mapped:** GOV-01, GOV-02
**Depends on:** Phase 106 through Phase 109
**Status:** 📋 Planned

## Archived Milestone Notes

Historical milestone details remain under `.planning/milestones/` and committed git history so the root roadmap can stay focused on the active execution lane.

