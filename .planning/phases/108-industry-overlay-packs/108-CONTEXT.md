# Phase 108: Industry Overlay Packs - Context

**Gathered:** 2026-04-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Add 4 industry vertical overlay packs — Travel, IT, Marketing Services, and Professional Services — including tone docs, discipline skeleton PROMPTS.md files, and pack manifests, and register them so `resolvePackSelection()` returns the correct overlay when `seed.company.industry` matches. Phase 108 does NOT wire the operator override UI (Phase 109) or add fallback diagnostics (Phase 110).

</domain>

<decisions>
## Implementation Decisions

### Discipline Coverage

- **D-01:** All 4 industry overlays cover all 5 disciplines uniformly (Paid_Media, Content_SEO, Lifecycle_Email, Social, Landing_Pages). Consistent with Phase 107's base family pattern.
- **D-02:** All disciplines set to completeness `"partial"` in pack manifests — consistent with Phase 107's result for base families.
- **D-03:** No discipline skipped or set to `"stub"` based on channel relevance. Uniform authoring contract across all 4 verticals simplifies downstream agent and operator behavior.

### overlayFor Mapping

- **D-04:** Each industry overlay declares specific base family compatibility in the `overlayFor` field (not universal). Locked mappings:
  - `travel` → `["b2c", "b2b"]`
  - `it` → `["b2b", "saas", "services"]`
  - `marketing-services` → `["agency", "b2b"]`
  - `professional-services` → `["services", "b2b"]`
- **D-05:** The `INDUSTRY_ALIAS_MAP` in `pack-loader.cjs` is already stubbed with aliases for all 4 industries. Phase 108 only needs to add the 4 overlay pack JSON files — no loader changes required for basic functionality.

### Professional Services vs Services Base Pack

- **D-06:** Professional Services overlay is a **thin delta** on top of the Services base pack. The overlay adds vertical-specific authority markers only: RFP culture, rate card dynamics, credentialing as proof posture, peer referral as primary acquisition channel. Does NOT re-author the core services funnel framing — that lives in the `services` base pack.

### Skeleton Approach

- **D-07:** Industry overlay skeletons are **fully standalone** — 4 prompts per discipline per vertical, same format as Phase 107 base family skeletons. No assumption about which base family skeleton is also active. Self-contained authoring, no runtime dependencies between base and overlay skeleton files.

### Agent's Discretion
- Tone doc file naming convention for overlays (e.g., `TPL-SHARED-industry-travel.md` vs `TPL-SHARED-overlay-industry-travel.md`) — agent should follow the existing overlay naming pattern (`TPL-SHARED-overlay-{slug}`) for consistency
- Slug formatting for multi-word verticals: use hyphenated lowercase (`marketing-services`, `professional-services`) — consistent with the `INDUSTRY_ALIAS_MAP` already in place
- `operatorNotes` field content per pack — agent discretion; should surface key composition guidance (e.g., "Best composed with B2C or B2B base family")
- Pack base and proof doc paths — overlay packs may reuse `TPL-SHARED-tone-and-naturality.md` and `TPL-SHARED-proof-posture.md` as shared fallbacks if no industry-specific doc is needed beyond the overlay doc itself

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Pack Schema and Loader
- `lib/markos/packs/pack-schema.json` — Ajv-compilable JSON Schema. Overlay packs use `type: "overlay"`, same 12-field schema as base packs
- `lib/markos/packs/pack-loader.cjs` — Singleton loader. `INDUSTRY_ALIAS_MAP` stub already maps all 4 verticals. `resolvePackSelection()` returns `overlayPack` slug when a match exists. Scans `lib/markos/packs/*.pack.json` only (not a subdirectory)
- `lib/markos/packs/b2b.pack.json` — Reference base pack at v1.1.0 structure to match for overlay packs

### Phase 106 Contracts (Locked)
- `.planning/phases/106-template-taxonomy-and-selection-contracts/106-CONTEXT.md` — All composition model decisions, pack schema decisions, conflict resolution rules, and operator override contract locked here
- `.planning/phases/106-template-taxonomy-and-selection-contracts/106-01-PLAN.md` — Implementation details for pack-loader, schema, and INDUSTRY_ALIAS_MAP threat model

### Phase 107 Patterns (Follow same file format)
- `.agent/markos/literacy/Shared/TPL-SHARED-business-model-saas.md` — Example thin overlay-extension tone doc format to follow for industry overlays
- `.agent/markos/literacy/Shared/TPL-SHARED-overlay-saas.md` — Example existing overlay doc format (9-key YAML frontmatter)
- `onboarding/templates/SKELETONS/saas/Content_SEO/PROMPTS.md` — Reference skeleton PROMPTS.md format (H1, context block, 4 numbered prompts)

### Requirements
- `.planning/REQUIREMENTS.md` §LIB-02, §LIB-04 — LIB-02 drives the 4-vertical requirement; LIB-04 requires composability without duplicating template architecture

### Test File
- `test/pack-loader.test.js` — All new overlay packs must pass the existing 14 tests; Phase 108 should add overlay-specific tests (resolvePackSelection with industry field)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/markos/packs/pack-loader.cjs`: `INDUSTRY_ALIAS_MAP` already has all 4 industry slug mappings — no loader changes required to activate overlay resolution
- `lib/markos/packs/pack-schema.json`: `type: "overlay"` and `overlayFor` fields already supported — overlay packs validate against the existing schema without schema changes
- `lib/markos/packs/b2b.pack.json`: v1.1.0 structure is the reference format for all new packs (including overlays)
- `.agent/markos/literacy/Shared/TPL-SHARED-overlay-saas.md`: existing overlay doc with 9-key YAML frontmatter — use this pattern for all 4 industry overlay tone docs
- `onboarding/templates/SKELETONS/*/` (5 base family dirs): existing skeleton directory tree — mirrored for industry overlays under `onboarding/templates/SKELETONS/industries/{slug}/`

### Established Patterns
- Tone docs use triple-backtick YAML frontmatter (9 keys: doc_id, discipline, overlay_for, business_model/industry, pain_point_tags, funnel_stage, buying_maturity, tone_guidance, proof_posture, naturality_expectations)
- PROMPTS.md: H1 `{Vertical} — {Discipline} Industry Overlay Prompts`, `> **Context:**` block, `## Prompts`, 4 numbered `### N.` prompts
- Pack manifests: version 1.0.0 at creation, completeness all-`"partial"` from Phase 107 forward, full changelog entry

### Integration Points
- `resolvePackSelection()` in `pack-loader.cjs` already calls `resolveIndustryOverlay()` which calls `INDUSTRY_ALIAS_MAP` lookup — adding a `*.pack.json` file with matching slug is all that's needed to activate overlay resolution
- `test/pack-loader.test.js` Suite 106 tests validate getFamilyRegistry and resolvePackSelection — Phase 108 tests should extend this suite with Suite 108 overlay tests

</code_context>

<specifics>
## Specific Ideas

- overlayFor mapping locked: travel→[b2c,b2b], it→[b2b,saas,services], marketing-services→[agency,b2b], professional-services→[services,b2b]
- Professional Services overlay: thin delta on Services base — adds RFP culture, rate card dynamics, credentialing as proof, peer referral as primary acquisition
- Skeleton location for overlays: `onboarding/templates/SKELETONS/industries/{slug}/` (mirrors base family SKELETONS pattern in a dedicated `industries/` subdir to distinguish overlay skeletons from base family skeletons)
- Tone doc location: `.agent/markos/literacy/Shared/TPL-SHARED-overlay-industry-{slug}.md` (following overlay naming convention)

</specifics>

<deferred>
## Deferred Ideas

- Channel-aware partial vs stub completeness per discipline+vertical combo — may be revisited in a follow-up pass once Phase 110 diagnostics are built
- Universal overlayFor (apply any overlay to any base family) — deferred; specific mapping is cleaner for v3.9.0 operator UI
- Addendum-style skeleton files — deferred; adds authoring complexity vs the standalone pattern established in Phase 107

</deferred>

---

*Phase: 108-industry-overlay-packs*
*Context gathered: 2026-04-15*
