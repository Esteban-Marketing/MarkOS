---
phase: 107-business-model-starter-library-expansion
plan: 02
subsystem: content-literacy
tags: [b2c, tone-doc, skeleton, prompts, meta, lifecycle-email, instagram]

requires: []
provides:
  - B2C tone doc at .agent/markos/literacy/Shared/TPL-SHARED-business-model-b2c.md
  - B2C skeleton (5 disciplines) at onboarding/templates/SKELETONS/b2c/
  - 20 starter prompts covering Meta/TikTok UGC creative, lifestyle SEO, welcome series, UGC amplification, DTC landing pages
affects: [107-06, pack-loader, family-resolver, onboarding-skeleton-routing]

tech-stack:
  added: []
  patterns:
    - "Full tone doc (non-overlay): B2C has distinct brand-relationship model, distinct from ecommerce transaction mechanics"
    - "B2C Paid: Meta video UGC brief, TikTok problem-solution, Google Shopping feed, YouTube pre-roll"
    - "B2C email: welcome series, post-purchase first-buyer, loyalty milestone, win-back"

key-files:
  created:
    - .agent/markos/literacy/Shared/TPL-SHARED-business-model-b2c.md
    - onboarding/templates/SKELETONS/b2c/README.md
    - onboarding/templates/SKELETONS/b2c/Paid_Media/PROMPTS.md
    - onboarding/templates/SKELETONS/b2c/Content_SEO/PROMPTS.md
    - onboarding/templates/SKELETONS/b2c/Lifecycle_Email/PROMPTS.md
    - onboarding/templates/SKELETONS/b2c/Social/PROMPTS.md
    - onboarding/templates/SKELETONS/b2c/Landing_Pages/PROMPTS.md
  modified: []

key-decisions:
  - "B2C tone doc is FULL doc (not overlay) — distinct from ecommerce (brand-relationship vs transaction-mechanic)"
  - "B2C stages: Awareness=brand-resonant-curiosity, Consideration=benefit-led-proof, Decision=social-proof-frictionless, Onboarding=welcome-delight, Retention=relationship-loyalty"
  - "Key distinctiveness maintained: B2C = emotional-resonant brand relationship; no transaction/cart/abandon language (that's ecommerce)"

patterns-established:
  - "B2C paid: UGC-heavy, Meta/TikTok dominant, aspirational lifestyle framing"
  - "B2C social: Instagram carousel, Reels/TikTok UGC, brand story content"

requirements-completed: [LIB-03]

duration: 25min
completed: 2026-04-15
---

# Phase 107 Plan 02: B2C Starter Library

**Authored the B2C full tone doc (brand-relationship model, distinct from ecommerce transaction mechanics) and complete 5-discipline skeleton (20 starter prompts).**

## Performance

- **Duration:** ~25 min
- **Tasks:** 2 (tone doc + skeleton)
- **Files created:** 7
- **Commit:** `adc8979`

## Accomplishments

- Created `TPL-SHARED-business-model-b2c.md` — full tone doc with brand-relationship model distinction (B2C vs ecommerce), UGC-heavy tactics, loyalty mechanics
- Created `onboarding/templates/SKELETONS/b2c/` — complete 5-discipline skeleton with 4 prompts per discipline
- Established key distinctiveness: B2C = DTC brand relationship, emotional + rational; ecommerce = transaction mechanics. Not the same.

## Task Commits

1. **Task 1+2: B2C tone doc and skeleton** — `adc8979` (feat: author B2C tone doc and 5-discipline skeleton)

## Files Created/Modified

- `.agent/markos/literacy/Shared/TPL-SHARED-business-model-b2c.md` — Full B2C tone doc
- `onboarding/templates/SKELETONS/b2c/README.md` — Skeleton overview
- `onboarding/templates/SKELETONS/b2c/Paid_Media/PROMPTS.md` — Meta video UGC, TikTok problem-solution, Google Shopping, YouTube 15s pre-roll
- `onboarding/templates/SKELETONS/b2c/Content_SEO/PROMPTS.md` — Lifestyle buyer's guide, how-to, collection page, brand story
- `onboarding/templates/SKELETONS/b2c/Lifecycle_Email/PROMPTS.md` — Welcome 3-email, post-purchase first-buyer, loyalty milestone, win-back
- `onboarding/templates/SKELETONS/b2c/Social/PROMPTS.md` — Instagram carousel, Reels/TikTok, UGC amplification, brand story
- `onboarding/templates/SKELETONS/b2c/Landing_Pages/PROMPTS.md` — Hero product DTC, new arrivals, first purchase welcome, thank you post-purchase

## Decisions Made

B2C is a full tone doc (not overlay-extension) since no prior B2C overlay exists, and the B2C model is meaningfully distinct enough from ecommerce to warrant its own doc.

## Deviations from Plan

None.

## Issues Encountered

None.

## Next Phase Readiness

B2C pack manifest (Plan 107-06) can reference `TPL-SHARED-business-model-b2c.md` as `assets.baseDoc`.

---
*Phase: 107-business-model-starter-library-expansion*
*Completed: 2026-04-15*
