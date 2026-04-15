# Phase 106 Context: Template Taxonomy and Selection Contracts

**Phase:** 106 — Template Taxonomy and Selection Contracts  
**Milestone:** v3.9.0 Vertical Plugin Literacy Libraries  
**Status:** Discussion complete — ready for planning  
**Date:** 2026-04-14  

---

## Domain Boundary

This phase defines the foundational data contracts for the entire v3.9.0 library system:

- What a "pack" is and what schema it carries
- How the resolver selects a base family + overlay from onboarding seed data
- How conflicts and ambiguous signals are resolved deterministically
- What the operator override contract looks like (what the approval UX reads/writes)
- The runtime contract between the new manifest system and existing resolver/skeleton seams

All downstream phases (107–110) depend on decisions locked here. Phase 107 can only author packs after the schema contract is defined. Phase 109 can only wire the approval override step after this phase defines what it reads.

---

<decisions>

## Decision 1 — Registry Format: Per-Pack JSON Manifest Files

**Decision:** Library packs are defined as individual JSON manifest files in a `lib/markos/packs/` directory. The existing JS module (`template-family-map.cjs`) becomes a thin loader that reads and validates manifests at runtime.

**Rationale:** Per-pack manifest files are operator-readable and contributor-friendly without requiring code changes. They align with the existing plugin directory pattern (`lib/markos/plugins/`). Runtime performance is equivalent to the current JS module since the loader caches at startup. This approach also gives Phase 107/108 a clean, file-based authoring target where each new pack is just a new JSON file — no code edit required.

**Rejected:** Hybrid compiled-from-manifests approach — unnecessary build tooling complexity for v3.9.0, can be revisited in a future milestone if needed.

**Implementation implications:**
- Phase 106 defines the JSON schema and writes the loader
- Existing `FAMILY_REGISTRY` entries in `template-family-map.cjs` are migrated to seed manifests
- Loader must validate manifest schema at startup and log warnings for missing/malformed packs
- Existing unit tests for `resolveBusinessModelFamily()` must still pass through the loader

---

## Decision 2 — Pack Schema: Rich (15+ Fields)

**Decision:** Each pack manifest is rich, not minimal. Required fields:

```json
{
  "slug": "saas",
  "version": "1.0.0",
  "displayName": "SaaS (Software-as-a-Service)",
  "type": "base",
  "aliases": ["saas", "software as a service"],
  "industries": [],
  "disciplines": ["Paid_Media", "Content_SEO", "Lifecycle_Email", "Social", "Landing_Pages"],
  "completeness": {
    "Paid_Media": "full",
    "Content_SEO": "full",
    "Lifecycle_Email": "full",
    "Social": "partial",
    "Landing_Pages": "full"
  },
  "assets": {
    "baseDoc": ".agent/markos/literacy/Shared/TPL-SHARED-tone-and-naturality.md",
    "proofDoc": ".agent/markos/literacy/Shared/TPL-SHARED-proof-posture.md",
    "overlayDoc": ".agent/markos/literacy/Shared/TPL-SHARED-overlay-saas.md",
    "skeletonDir": "onboarding/templates/SKELETONS/saas/"
  },
  "fallbackAllowed": true,
  "overlayFor": null,
  "dependencies": [],
  "operatorNotes": "",
  "changelog": [
    { "version": "1.0.0", "date": "2026-04-14", "summary": "Initial pack definition migrated from FAMILY_REGISTRY" }
  ]
}
```

**Rationale:** Rich schema now means Phase 110 diagnostics have clean data to work from (completeness per discipline, fallback flag). Phase 107/108 authors fill in `completeness` as they produce assets. Operator notes field gives the approval UX something useful to surface. Changelog supports future versioned packs without schema changes.

**Overlay packs use same schema** with `type: "overlay"` and `overlayFor: ["b2b", "services", ...]` declaring which base families they apply to.

**Completeness values:** `"full"` | `"partial"` | `"stub"` | `"missing"` — loader uses these for GOV-01 graceful degradation decisions.

---

## Decision 3 — Conflict Resolution: Base Family Wins, Industry Stacks as Overlay

**Decision:** The resolver uses a simple two-step deterministic algorithm:

1. **Step 1 — Base Family:** Resolve `seed.company.business_model` → canonical base family slug using alias matching (same logic as current `normalizeBusinessModel()`). This always wins.
2. **Step 2 — Industry Overlay:** Resolve `seed.company.industry` (if present) → overlay slug using a new industry alias map. If a matching overlay pack exists, stack it. If not, proceed base-only with a diagnostic log.

**No merging or ranking between base families.** If seed data is ambiguous (multiple business model aliases match), the resolver picks the first match in registry order and logs a warning — deterministic, not smart-ranking.

**Conflict examples (locked):**
- `SaaS + IT industry` → base: `saas`, overlay: `it` (if `it` overlay pack exists, else base-only)
- `Marketing Agency` → base: `agency`
- `Professional Services + IT` → base: `services`, overlay: `it`
- `B2B SaaS` → normalize to `saas` (saas alias wins over b2b when both match)

**Industry overlay mapping** is a new `INDUSTRY_REGISTRY` (manifest files or a seed config in Phase 106), parallel to `FAMILY_REGISTRY`. Phase 108 populates Travel, IT, Marketing Services, Professional Services entries.

---

## Decision 4 — Operator Override Surface: Approval Flow Step

**Decision:** After auto-resolution from seed data, the onboarding approval flow presents a "Review Library Selection" step before the final approval is recorded. This step:

- Shows the resolved base family slug + display name
- Shows the overlay (or "none" with reason if fallback applied)
- Shows completeness summary per discipline (from the rich schema)
- Offers a dropdown/select to override base and/or overlay

**Contract this phase must define:**
- The selection state shape: `{ basePack: string, overlayPack: string|null, overrideReason: string|null, resolvedAt: ISO8601 }`
- Where it's persisted: `seed.packSelection` (in the approval-tracked seed record, not a separate file — keeps everything in the existing provenance trail)
- What the approval step reads: only `seed.packSelection`; never re-resolves from seed at approval time

**What Phase 109 builds:** The actual UI step and the form that writes the override to `seed.packSelection`.

**What Phase 106 builds:** Only the contract type and the resolver that produces the initial `packSelection` from seed fields. Phase 109 wires the override into the approval UX.

</decisions>

---

<specifics>

## Key References

- `onboarding/backend/research/template-family-map.cjs` — existing FAMILY_REGISTRY and resolver functions; Phase 106 refactors this to be manifest-driven
- `onboarding/backend/agents/example-resolver.cjs` — MODEL_SLUG map and resolveExample/resolveSkeleton; Phase 106 must preserve these public APIs
- `onboarding/backend/agents/skeleton-generator.cjs` — generateSkeletons(); calls resolveSkeleton() from example-resolver; Phase 106 must not break this
- `lib/markos/plugins/digital-agency/plugin-guard.js` — existing plugin directory pattern; `lib/markos/packs/` mirrors this location convention
- `.planning/REQUIREMENTS.md` — LIB-01, LIB-04, INIT-02 are the requirements in scope for this phase
- `.planning/milestones/v3.9.0-PLUGIN-LITERACY-LIBRARIES-CONTEXT.md` — milestone-level context and locked decisions

## Schema Location

New pack manifests: `lib/markos/packs/{slug}.pack.json`
Loader module: `lib/markos/packs/pack-loader.cjs`
Industry registry: `lib/markos/packs/industries/{slug}.industry.json`

## Backward Compatibility Constraint

`template-family-map.cjs` public API surface must remain stable:
- `resolveBusinessModelFamily(value)` — must still return a family entry object
- `getOverlayDocForModel(businessModel)` — must still return a doc path or null
- `normalizeBusinessModel(value)` — must still return a slug string

The loader wraps the manifest data into these same shapes. Callers (example-resolver, skeleton-generator) don't need changes in Phase 106.

</specifics>

---

<deferred>

## Deferred Ideas

- **Hybrid manifests compiled to JS:** Compile manifests to optimized JS at build time. Better cold-start performance at scale. Defer to future milestone once pack count grows.
- **Multi-overlay stacking:** Allow a SaaS + B2B + IT triple stack. Potentially useful but ruled out of v3.9.0 scope (LIBX-02).
- **External pack import:** Let operators drop a third-party pack manifest into a local folder. Defer to future milestone (LIBX-03).
- **Completeness-based conflict resolution:** Use per-discipline completeness scores to pick the "best coverage" base family automatically. Deferred — requires Phase 107 completeness data to exist first.

</deferred>

---

## Next Step

Run `/gsd-plan-phase 106` to produce the execution plan.
