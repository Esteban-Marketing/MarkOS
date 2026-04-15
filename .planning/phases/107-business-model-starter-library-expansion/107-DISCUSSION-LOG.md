# Phase 107: Business-Model Starter Library Expansion - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-15
**Phase:** 107-business-model-starter-library-expansion
**Areas discussed:** Family Coverage, Discipline Scope, Doc Location, Skeleton Content, Completeness Grade

---

## Family Coverage

| Option | Description | Selected |
|--------|-------------|----------|
| Priority 5 only (B2B, B2C, SaaS, Ecommerce, Services) — Agency + Info-products deferred | Matches STATE.md language, keeps Phase 107 focused | ✓ |
| All 7 families | More complete, but broader authoring scope in one phase | |
| B2B and SaaS only | Smallest scope, highest-quality output | |

**User's choice:** Priority 5 only — B2B, B2C, SaaS, Ecommerce, Services. Agency and Info-products deferred to Phase 108+.
**Notes:** Aligns with the STATE.md canonical statement: "Priority business families for the first cut are B2B, B2C, SaaS, Ecommerce, and service-led businesses."

---

## Discipline Scope

| Option | Description | Selected |
|--------|-------------|----------|
| All 5 disciplines for each priority family | Each priority family gets all 5 disciplines, completeness moves stub → partial/full | ✓ |
| Discipline matrix — tailored subset per model | Only 2–3 disciplines most relevant to each model | |
| Shared tone + proof docs per family only | Discipline-level examples are Phase 109 scope | |

**User's choice:** All 5 disciplines (Paid_Media, Content_SEO, Lifecycle_Email, Social, Landing_Pages) for each of the 5 priority families.
**Notes:** Full coverage; 25 PROMPTS.md files total (5 families × 5 disciplines).

---

## Doc Location

| Option | Description | Selected |
|--------|-------------|----------|
| All in .agent/markos/literacy/Shared/ | Consistent with current Shared/ overlay pattern | ✓ |
| Per-family subdirectory under .agent/markos/literacy/ | Mirrors discipline folder structure | |
| Discipline folders with business_model frontmatter | Reuses existing LIT-* naming pattern | |

**User's choice:** All in `.agent/markos/literacy/Shared/` with naming `TPL-SHARED-business-model-{slug}.md`.
**Notes:** Keeps consistency with existing `TPL-SHARED-overlay-*.md` files already in Shared/.

---

## Skeleton Content

| Option | Description | Selected |
|--------|-------------|----------|
| README.md + PROMPTS.md per discipline folder | Lightweight but functional; enough for Phase 109 wiring | ✓ |
| README.md only at family root | Minimal placeholder | |
| Full templates — README + brief + done-for-you template per discipline | Heavier authoring scope | |

**User's choice:** README.md at family root + PROMPTS.md per discipline folder.
**Notes:** Structure: `onboarding/templates/SKELETONS/{slug}/README.md` + `onboarding/templates/SKELETONS/{slug}/{Discipline}/PROMPTS.md`. 3–5 starter prompts per PROMPTS.md.

---

## Completeness Grade

| Option | Description | Selected |
|--------|-------------|----------|
| Move to 'partial' — content exists but not yet wired | Phase 109 closes to 'full' after integration | ✓ |
| Move to 'full' — if Phase 107 delivers complete docs + skeletons | | |
| Keep 'stub' until Phase 109 | Completeness is a runtime signal | |

**User's choice:** Move to `"partial"` for all 5 disciplines of the 5 priority families.
**Notes:** Signals that authoring is complete but live integration is pending. `"full"` reserved for Phase 109 close.

---

## the agent's Discretion

- Exact prompt wording in each PROMPTS.md file
- README.md content per model
- Tone characterization depth in per-family tone docs (thinner for models with existing overlays like SaaS and ecommerce)

## Deferred Ideas

- Agency + Info-products full authoring (Phase 108+)
- Industry overlay composition (Phase 108)
- Live hydration wiring (Phase 109)
- Graduating completeness from `partial` to `full` (Phase 109)
