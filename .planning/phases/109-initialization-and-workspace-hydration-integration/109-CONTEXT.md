# Phase 109: Initialization and Workspace Hydration Integration - Context

**Phase:** 109 — Initialization and Workspace Hydration Integration
**Milestone:** v3.9.0 Vertical Plugin Literacy Libraries
**Status:** Discussion complete — ready for research + planning
**Date:** 2026-04-15

<domain>
## Phase Boundary

Wire `resolvePackSelection()` from `pack-loader.cjs` into the live onboarding initialization/approval flow so that when a project is approved, the correct industry-aware starter pack is used for skeleton generation. This phase covers:

1. Calling `resolvePackSelection(seed)` with seed data at approval time (using already-extracted `seed.company.business_model` + `seed.company.industry`)
2. Persisting the resolved selection to `seed.packSelection` on disk before skeleton generation
3. Updating `skeleton-generator.cjs` so that when an `overlayPack` is resolved, it uses industry overlay skeletons (`SKELETONS/industries/{overlayPack}/{discipline}/PROMPTS.md`) instead of base family skeletons
4. Wiring the `resolvePackSelection` call in `handlers.cjs` (the approval endpoint) using the already-available seed data

This phase does NOT include:
- Operator override UI (Phase 110 scope per Phase 106 D-04 — "The actual UI step and the form that writes the override")
- Fallback/diagnostic reporting when overlays are missing (Phase 110)
- Coverage of industries beyond the 4 built in Phase 108 (future)
- Changes to `template-family-map.cjs` public API (backward-compat constraint from Phase 106)

</domain>

<decisions>
## Implementation Decisions

### D-01: Pack Selection Call Site — Approval Handler

**Decision:** Call `resolvePackSelection(seed)` in the approval handler (`handlers.cjs`) at the start of the skeleton generation block, immediately after the seed is read from disk. The resolved `{ basePack, overlayPack }` is then passed into `generateSkeletons()` as a new `packSelection` parameter.

**Rationale:** The seed is already read from disk at line 2384 (`if (fs.existsSync(SEED_PATH))`). This is the earliest point where both `business_model` and `industry` are available. The skeleton generation block is the correct downstream consumer.

---

### D-02: Pack Selection Persistence — Write to seed on disk (Option A)

**Decision:** After calling `resolvePackSelection(seed)`, mutate `seed.packSelection` and write the updated seed object back to `SEED_PATH` (as JSON) before calling `generateSkeletons()`. 

**Rationale:** Phase 106 D-04 states seed.packSelection is where the selection is persisted and where the approval UX reads from. Writing it to the seed file before skeleton generation keeps everything in the existing provenance trail. This is the pattern Phase 106 prescribed: "persisted to seed.packSelection by caller."

**Implementation note:** Write must use `JSON.stringify(seed, null, 2)` and a try/catch. A write failure must NOT hard-fail the approval flow — log a warning and continue (same try/catch pattern already used for skeleton generation).

---

### D-03: Template Precedence Strategy — Replace (Option A)

**Decision:** When `overlayPack` is non-null, `resolveSkeleton()` in `example-resolver.cjs` checks for an industry overlay skeleton at `SKELETONS/industries/{overlayPack}/{discipline}/PROMPTS.md`. If the file exists, it is used **entirely** in place of the base family skeleton. If the file does NOT exist, fall back transparently to the base family skeleton (existing behavior). No merging or injection.

**Rationale:** Phase 108 D-07 explicitly states industry overlay skeletons are "fully standalone." Phase 108 also built `assets.skeletonDir` in each industry pack manifest pointing to `onboarding/templates/SKELETONS/industries/{slug}/`. Reading from `PROMPTS.md` (industry overlay format) vs `_SKELETON-{slug}.md` (base family format) directly matches the file structure both phases produced.

**API change:** `resolveSkeleton(discipline, businessModel, basePath)` gains a new optional `overlaySlug` parameter. When supplied and non-null, the overlay path check runs first. Callers that pass no overlay slug see zero behavioral change (backward-compat).

---

### D-04: generateSkeletons API Change — packSelection parameter

**Decision:** `generateSkeletons(seed, approvedDrafts)` gains a new optional third parameter `packSelection` (shape: `{ basePack, overlayPack }`). When supplied, `resolveSkeleton` is called with `overlaySlug = packSelection.overlayPack`. When not supplied (or null), behavior is unchanged — existing callers unaffected.

**Rationale:** Minimal additive API change. Prevents breaking existing test harness and any future callers that don't have pack selection context yet.

---

### D-05: template-family-map.cjs — Leave as-is (Option A)

**Decision:** `template-family-map.cjs` and its hardcoded `OVERLAY_DOCS` dict (saas, consulting, ecommerce, info-products) are NOT modified in Phase 109. The duplicate overlay resolution path remains.

**Rationale:** `template-family-map.cjs` serves `example-resolver.cjs` → `skeleton-generator.cjs` for the LLM injection overlay docs (tone, proof posture). This is a different purpose from the skeleton template selection that Phase 109 targets. Consolidation would require touching `getOverlayDocForModel`, `inferOverlayKey`, and downstream consumers simultaneously — this is Phase 110+ cleanup scope. Phase 109 operates only at the skeleton template level.

---

### D-06: Failure Mode — Soft Fail, Never Hard Block

**Decision:** All new Phase 109 code paths (pack resolution, seed write, overlay skeleton lookup) must be wrapped in try/catch. Any failure degrades silently to the pre-Phase-109 behavior (base-only skeleton from existing `resolveSkeleton()` logic). No new error codes or response shape changes.

**Rationale:** Phase 110 owns diagnostics (GOV-01). Phase 109 must not introduce new hard failure modes into the already-working approval flow.

---

### D-07: Pack Selection in Response Payload

**Decision:** Include `packSelection` in the approve endpoint response body alongside the existing `skeletons` field. Shape: `{ basePack: string|null, overlayPack: string|null, overrideReason: string|null, resolvedAt: string }`. If resolution throws, emit `packSelection: null`.

**Rationale:** Enables Phase 110 operator UI to read this from the response without needing a separate seed read.

---

### D-08: Seed packSelection shape

**Decision:** The written `seed.packSelection` field matches exactly what `resolvePackSelection()` returns:
```json
{
  "basePack": "b2b",
  "overlayPack": "travel",
  "overrideReason": null,
  "resolvedAt": "2026-04-15T12:00:00.000Z"
}
```
No transformation. Written as-is from `resolvePackSelection()` return value.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Pack Loader
- `lib/markos/packs/pack-loader.cjs` — `resolvePackSelection(seed)` is the entry point. Reads `seed.company.business_model` + `seed.company.industry`. Returns `{ basePack, overlayPack, overrideReason, resolvedAt }`. Two-path arch: base packs at `lib/markos/packs/*.pack.json`, overlays at `lib/markos/packs/industries/*.industry.json`

### Integration Target Files
- `onboarding/backend/handlers.cjs` — Approval endpoint. Seed read at ~line 2384. Skeleton generation block ~lines 2382-2437. Pack selection call and seed write must be inserted here.
- `onboarding/backend/agents/skeleton-generator.cjs` — `generateSkeletons(seed, approvedDrafts)`. Calls `resolveSkeleton()` from `example-resolver.cjs`. Gets `seed.company.business_model` and calls `getModelSlug()`. Phase 109 adds `packSelection` parameter and passes `overlaySlug` through.
- `onboarding/backend/agents/example-resolver.cjs` — `resolveSkeleton(discipline, businessModel, basePath)`. Phase 109 adds optional `overlaySlug` parameter. When present and non-null, checks `SKELETONS/industries/{overlaySlug}/{discipline}/PROMPTS.md` first.

### Industry Overlay Skeleton Templates (Phase 108 output)
- `onboarding/templates/SKELETONS/industries/travel/{discipline}/PROMPTS.md` — one per discipline
- `onboarding/templates/SKELETONS/industries/it/{discipline}/PROMPTS.md`
- `onboarding/templates/SKELETONS/industries/marketing-services/{discipline}/PROMPTS.md`
- `onboarding/templates/SKELETONS/industries/professional-services/{discipline}/PROMPTS.md`

### Seed Schema
- `onboarding/onboarding-seed.schema.json` — `seed.company.industry` is a string field (optional). `seed.packSelection` will be added as a new field (not in existing schema — no schema update needed, extra fields allowed per Draft-07 default).

### Phase 106 Operator Override Contract (Upstream lock)
- `.planning/phases/106-template-taxonomy-and-selection-contracts/106-CONTEXT.md` — D-04 defines `seed.packSelection` shape and approval UX contract. Phase 109 is bounded by this.

### Phase 108 Pack Structure (Upstream lock)
- `.planning/phases/108-industry-overlay-packs/108-CONTEXT.md` — D-07 (skeletons standalone), D-08 (two-path arch). Phase 109 reads `skeletonDir` from industry pack manifests.

### Requirements
- `.planning/REQUIREMENTS.md` §INIT-01 — Auto-hydrate selected starter library at initialization
- `.planning/REQUIREMENTS.md` §INIT-03 — Starter packs produce immediately usable examples, prompts, and templates at onboarding time

### Tests
- `test/pack-loader.test.js` — 26/26 tests must still pass after Phase 109 (pack-loader.cjs unchanged)
- New tests needed: `generateSkeletons` with overlay pack seed, `resolveSkeleton` with overlaySlug param, approval handler response includes `packSelection`

</canonical_refs>

<specifics>
## Specific Ideas

- `resolveSkeleton` overlay lookup path: `path.join(basePath, 'SKELETONS', 'industries', overlaySlug, discipline, 'PROMPTS.md')` — matches Phase 108 industry skeleton directory structure exactly
- Seed write: `fs.writeFileSync(SEED_PATH, JSON.stringify(seed, null, 2), 'utf8')` inside try/catch that does NOT rethrow
- `handlers.cjs` insertion point: immediately after `seed = JSON.parse(...)` (line ~2387), before `const skeletonResults = await generateSkeletons(...)`. Require pack-loader at the top of the approval handler (or inline require inside the try block).
- Response shape addition: append `packSelection: resolvedPackSelection` to both the warning-path and success-path return objects in the approval handler

</specifics>

<deferred>
## Deferred Ideas

- Operator override UI step — Phase 110 + future scope per Phase 106 D-04
- Fallback diagnostics when overlay skeleton missing — Phase 110 (GOV-01)
- Consolidating `template-family-map.cjs` OVERLAY_DOCS with pack-loader industry resolution — post-Phase-110 cleanup
- Skeleton merging (base + overlay content combined) — rejected for v3.9.0, replacement approach is cleaner and sufficient
- `onboarding-seed.schema.json` update to formally declare `packSelection` field — low priority, Draft-07 allows extra fields

</deferred>

---

*Phase: 109-initialization-and-workspace-hydration-integration*
*Context gathered: 2026-04-15, gray areas resolved by orchestrator before discuss-phase write*
