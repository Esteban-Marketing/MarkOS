---
phase: 107-business-model-starter-library-expansion
plan: 03
subsystem: content-literacy
tags: [saas, tone-doc, skeleton, prompts, plg, trial-conversion, linkedin]

requires:
  - phase: N/A
    provides: TPL-SHARED-overlay-saas.md (pre-existing — core posture: operator-like, efficient, product-literate, trust-building)
provides:
  - SaaS tone doc at .agent/markos/literacy/Shared/TPL-SHARED-business-model-saas.md
  - SaaS skeleton (5 disciplines) at onboarding/templates/SKELETONS/saas/
  - 20 starter prompts covering Google/LinkedIn search, competitor comparison SEO, trial activation email, product social proof, free trial and pricing landing pages
affects: [107-06, pack-loader, family-resolver, onboarding-skeleton-routing]

tech-stack:
  added: []
  patterns:
    - "Thin overlay-extension tone doc: extends existing overlay, adds funnel-stage breakdown only"
    - "SaaS distinct mechanic: trial conversion is the primary funnel milestone (not purchase, not form fill)"
    - "SaaS email: trial activation 72hr sequence, trial-to-paid 3 days out, post-upgrade D14, expansion milestone"

key-files:
  created:
    - .agent/markos/literacy/Shared/TPL-SHARED-business-model-saas.md
    - onboarding/templates/SKELETONS/saas/README.md
    - onboarding/templates/SKELETONS/saas/Paid_Media/PROMPTS.md
    - onboarding/templates/SKELETONS/saas/Content_SEO/PROMPTS.md
    - onboarding/templates/SKELETONS/saas/Lifecycle_Email/PROMPTS.md
    - onboarding/templates/SKELETONS/saas/Social/PROMPTS.md
    - onboarding/templates/SKELETONS/saas/Landing_Pages/PROMPTS.md
  modified: []

key-decisions:
  - "SaaS tone doc is THIN (overlay-extension) — reads TPL-SHARED-overlay-saas.md for core posture, adds funnel-stage breakdown"
  - "tone_guidance field references overlay: 'Extends TPL-SHARED-overlay-saas.md'"
  - "SaaS stages: Awareness=problem-category-educate, Consideration=product-literate-proof, Decision=trial-friction-reducing, Onboarding=activation-first, Retention=expansion-usage"

patterns-established:
  - "Thin overlay-extension pattern: YAML frontmatter references extends, tone_guidance names overlay"
  - "SaaS PLG social: product screenshots in-use, feature demo video brief, customer win metric posts, G2 review amplification"
  - "SaaS landing pages: free trial (no credit card), pricing 3-tier job-to-be-done, integration co-marketing, PLG homepage hero"

requirements-completed: [LIB-03]

duration: 30min
completed: 2026-04-15
---

# Phase 107 Plan 03: SaaS Starter Library

**Authored the SaaS thin-overlay tone doc (extends TPL-SHARED-overlay-saas.md with funnel-stage breakdown) and complete 5-discipline skeleton (20 starter prompts) for PLG/self-serve SaaS.**

## Performance

- **Duration:** ~30 min
- **Tasks:** 2 (tone doc + skeleton)
- **Files created:** 7
- **Commit:** `81659c4`

## Accomplishments

- Created `TPL-SHARED-business-model-saas.md` — thin extension of overlay-saas, adds funnel-stage tactics for trial-led self-serve SaaS
- Created `onboarding/templates/SKELETONS/saas/` — complete 5-discipline skeleton with 4 prompts per discipline
- Established thin overlay-extension tone doc pattern (first usage in Phase 107 file set)

## Task Commits

1. **Task 1+2: SaaS tone doc and skeleton** — `81659c4` (feat: author SaaS tone doc (extends overlay) and 5-discipline skeleton)

## Files Created/Modified

- `.agent/markos/literacy/Shared/TPL-SHARED-business-model-saas.md` — Thin SaaS tone doc (extends overlay)
- `onboarding/templates/SKELETONS/saas/README.md` — Skeleton overview
- `onboarding/templates/SKELETONS/saas/Paid_Media/PROMPTS.md` — Google search intent, LinkedIn sponsored enterprise, retargeting trial visitor, YouTube pre-roll 30s
- `onboarding/templates/SKELETONS/saas/Content_SEO/PROMPTS.md` — Competitor comparison, use-case vertical SEO, integration page, problem-aware education
- `onboarding/templates/SKELETONS/saas/Lifecycle_Email/PROMPTS.md` — Trial activation 72hr, trial-to-paid 3 days, post-upgrade D14, expansion usage milestone
- `onboarding/templates/SKELETONS/saas/Social/PROMPTS.md` — Feature launch post, customer win post, product demo walkthrough, G2 review amplification
- `onboarding/templates/SKELETONS/saas/Landing_Pages/PROMPTS.md` — Free trial signup, pricing 3-tier, integration co-marketing, PLG homepage hero

## Decisions Made

Used thin overlay-extension pattern: read TPL-SHARED-overlay-saas.md first (core posture established), then created tone doc that only adds funnel-stage breakdown without repeating the overlay's core characterization.

## Deviations from Plan

None.

## Issues Encountered

Context window budget exceeded during initial execution, resuming from Lifecycle_Email. Remaining 2 files (Social, Landing_Pages) created in continuation session without functional deviation.

## Next Phase Readiness

SaaS pack manifest (Plan 107-06) can reference `TPL-SHARED-business-model-saas.md` as `assets.baseDoc`. overlayDoc already set in pack manifest (unchanged).

---
*Phase: 107-business-model-starter-library-expansion*
*Completed: 2026-04-15*
