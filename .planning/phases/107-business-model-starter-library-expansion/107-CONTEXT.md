# Phase 107: Business-Model Starter Library Expansion - Context

**Gathered:** 2026-04-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Author and publish the per-family tone docs, per-discipline starter prompts, and skeleton directories for the **5 priority business model families** (B2B, B2C, SaaS, Ecommerce, Services). Update each pack manifest's `completeness` fields from `stub` → `partial` and update `assets.baseDoc` to point to the new per-family tone doc. Agency and Info-products remain at `stub` and are deferred to Phase 108+.

This phase does **not** wire anything into the live onboarding or hydration flow — that is Phase 109. It produces the authoring artifacts the integration phase will consume.

</domain>

<decisions>
## Implementation Decisions

### Family Coverage (Phase 107 Scope)
- **D-01:** Author content for 5 priority families only: `b2b`, `b2c`, `saas`, `ecommerce`, `services`.
- **D-02:** `agency` and `info-products` remain at `completeness: stub` and are explicitly deferred to Phase 108+. Do not author content for them in this phase.

### Discipline Coverage
- **D-03:** All 5 disciplines covered for each priority family: `Paid_Media`, `Content_SEO`, `Lifecycle_Email`, `Social`, `Landing_Pages`.
- **D-04:** Each family × discipline intersection produces a `PROMPTS.md` file inside the skeleton directory structure.

### Per-Family Tone Doc Location and Naming
- **D-05:** New per-family tone docs live in `.agent/markos/literacy/Shared/` alongside the existing overlay docs.
- **D-06:** Naming convention: `TPL-SHARED-business-model-{slug}.md` (e.g., `TPL-SHARED-business-model-b2b.md`, `TPL-SHARED-business-model-saas.md`).
- **D-07:** After authoring, update `assets.baseDoc` in each priority pack's `.pack.json` to point to its new family-specific tone doc instead of the shared fallback.

### Skeleton Directory Structure
- **D-08:** Skeleton structure: `onboarding/templates/SKELETONS/{slug}/{Discipline}/PROMPTS.md` per discipline, plus a `README.md` at the family root.
  - Example: `onboarding/templates/SKELETONS/b2b/README.md`
  - Example: `onboarding/templates/SKELETONS/b2b/Paid_Media/PROMPTS.md`
- **D-09:** Each `PROMPTS.md` contains 3–5 starter prompts specific to the family + discipline combination. Prompts should be concrete and immediately actionable (not generic placeholders).
- **D-10:** The `README.md` at the family root briefly describes the business model, its primary marketing challenges, and which disciplines are covered.

### Completeness Grading
- **D-11:** After Phase 107, set `completeness` for all 5 disciplines of each priority family to `"partial"`.
- **D-12:** `"full"` is reserved until Phase 109 wires the packs into the live onboarding hydration flow and integration tests pass.
- **D-13:** `agency` and `info-products` pack manifests stay unchanged (`completeness: stub`, no asset updates).

### Pack Manifest Updates
- **D-14:** Only update `assets.baseDoc` and `completeness` fields in the 5 priority `.pack.json` files. Do not change `assets.proofDoc`, `overlayDoc`, `fallbackAllowed`, or any other fields.

### the agent's Discretion
- Exact wording and content of individual `PROMPTS.md` files — agent decides based on the business model and discipline, following the literacy doc style established in existing `LIT-*` and `TPL-*` files.
- Exact wording of each `README.md` — agent author per model's marketing context.
- Whether the per-family tone doc for a given model needs a distinct `tone_guidance` and `proof_posture` or can share broad characterizations (e.g., B2C may share some SaaS-adjacent concepts). Agent decides on a model-by-model basis.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 106 Deliverables (foundation for this phase)
- `lib/markos/packs/pack-schema.json` — Ajv Draft-07 schema. All pack manifest updates must remain schema-valid.
- `lib/markos/packs/pack-loader.cjs` — Registry loader. `getFamilyRegistry()` uses the 7 pack JSON files. Completeness and asset path changes must not break existing tests.
- `lib/markos/packs/b2b.pack.json` — Reference manifest structure (same pattern for all 7 families).
- `lib/markos/packs/saas.pack.json`
- `lib/markos/packs/b2c.pack.json`
- `lib/markos/packs/ecommerce.pack.json`
- `lib/markos/packs/services.pack.json`

### Existing Literacy Docs (style reference)
- `.agent/markos/literacy/Shared/TPL-SHARED-tone-and-naturality.md` — Canonical tone doc format. New per-family tone docs follow this structure.
- `.agent/markos/literacy/Shared/TPL-SHARED-overlay-saas.md` — Example of a model-specific overlay doc. Per-family tone docs adopt a similar YAML frontmatter + Markdown body pattern.
- `.agent/markos/literacy/Paid_Media/LIT-PM-001-high-cpr.md` — Canonical LIT-* doc format (evidence-led, YAML frontmatter, structured sections). Prompts.md files need not match this depth but should be consistent in quality.

### Requirements
- `.planning/REQUIREMENTS.md` — LIB-03: "Each supported library includes discipline-aware literacy examples, starter skeletons, and initialization docs for the core operating disciplines."

### Tests
- `test/pack-loader.test.js` — Suite 106. All 14 tests must remain green after pack.json mutations. Particularly: `getFamilyRegistry()` shape tests and the `completeness` field assertions (currently assert `"stub"` — tests may need updating to `"partial"` for the 5 priority families).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `.agent/markos/literacy/Shared/TPL-SHARED-tone-and-naturality.md`: Template format for new per-family tone docs — copy YAML structure, replace `business_model: ["all"]` with the specific slug.
- `.agent/markos/literacy/Shared/TPL-SHARED-overlay-saas.md`, `TPL-SHARED-overlay-ecommerce.md`, etc.: Overlay docs already written for SaaS, ecommerce, consulting, info-products — these can inform the corresponding per-family tone docs (avoid duplication; per-family tone doc can reference or extend the overlay where applicable).

### Established Patterns
- YAML frontmatter block (fenced with triple-backtick yaml) at top of every literacy doc.
- Required frontmatter keys: `doc_id`, `discipline`, `business_model`, `pain_point_tags`, `funnel_stage`, `buying_maturity`, `tone_guidance`, `proof_posture`, `naturality_expectations`.
- Discipline slugs used in directory names: `Paid_Media`, `Content_SEO`, `Lifecycle_Email`, `Social`, `Landing_Pages` — must match exactly (uppercase, underscore).
- Pack manifest discipline keys and completeness values are validated against the schema enum — only `"full"`, `"partial"`, `"stub"`, `"missing"` are valid.

### Integration Points
- `pack-loader.cjs` reads the `.pack.json` files from disk at `lib/markos/packs/`. Updating `assets.baseDoc` paths in pack manifests means the loader will serve the new paths — ensure the files actually exist before updating.
- `test/pack-loader.test.js` asserts `completeness` values for each discipline in several tests. Tests checking for `"stub"` will need to be updated to `"partial"` for the 5 priority families.
- `onboarding/backend/research/template-family-map.cjs` reads `getFamilyRegistry()` — no changes needed there, but the skeleton paths referenced in pack manifests are not currently consumed by it.

</code_context>

<specifics>
## Specific Ideas

- The agent noted during codebase scouting that overlay docs already exist for SaaS (`TPL-SHARED-overlay-saas.md`) and ecommerce (`TPL-SHARED-overlay-ecommerce.md`). The new per-family tone docs should complement these, not duplicate them. For SaaS and ecommerce, the tone doc can be thinner and reference/link the overlay doc.
- Skeleton `PROMPTS.md` files should follow a consistent header structure: model context at top, then 3–5 numbered prompts, each with a brief label and the prompt text.

</specifics>

<deferred>
## Deferred Ideas

- Agency and Info-products full authoring — Phase 108+ (they have pack manifests from Phase 106 but no content authored here).
- Industry overlay composition with base packs — Phase 108.
- Live onboarding hydration wiring — Phase 109.
- Completeness graduating from `partial` to `full` — Phase 109 (after integration testing).

### Reviewed Todos (not folded)
None — no todos matched Phase 107 scope.

</deferred>

---

*Phase: 107-business-model-starter-library-expansion*
*Context gathered: 2026-04-15*
