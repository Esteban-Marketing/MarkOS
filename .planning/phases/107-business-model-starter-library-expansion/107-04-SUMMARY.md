---
phase: 107-business-model-starter-library-expansion
plan: 04
subsystem: content-literacy
tags: [ecommerce, tone-doc, skeleton, prompts, meta-dpa, cart-abandonment, google-shopping]

requires:
  - phase: N/A
    provides: TPL-SHARED-overlay-ecommerce.md (pre-existing — core posture: energetic but credible, urgency-aware, benefit-led)
provides:
  - Ecommerce tone doc at .agent/markos/literacy/Shared/TPL-SHARED-business-model-ecommerce.md
  - Ecommerce skeleton (5 disciplines) at onboarding/templates/SKELETONS/ecommerce/
  - 20 starter prompts covering Meta DPA, Google Shopping feed optimization, abandoned cart 3-email, UGC amplification, product page conversion psychology
affects: [107-06, pack-loader, family-resolver, onboarding-skeleton-routing]

tech-stack:
  added: []
  patterns:
    - "Thin overlay-extension tone doc: extends overlay-ecommerce, adds funnel-stage transaction mechanics"
    - "Ecommerce distinct from B2C: transaction-mechanic focus (cart abandonment ~70%, ROAS, LTV, repurchase) vs brand-relationship model"
    - "Credible urgency rule: scarcity/urgency only when real (actual stock level, genuine sale window)"

key-files:
  created:
    - .agent/markos/literacy/Shared/TPL-SHARED-business-model-ecommerce.md
    - onboarding/templates/SKELETONS/ecommerce/README.md
    - onboarding/templates/SKELETONS/ecommerce/Paid_Media/PROMPTS.md
    - onboarding/templates/SKELETONS/ecommerce/Content_SEO/PROMPTS.md
    - onboarding/templates/SKELETONS/ecommerce/Lifecycle_Email/PROMPTS.md
    - onboarding/templates/SKELETONS/ecommerce/Social/PROMPTS.md
    - onboarding/templates/SKELETONS/ecommerce/Landing_Pages/PROMPTS.md
  modified: []

key-decisions:
  - "Ecommerce tone doc is THIN (overlay-extension) — extends TPL-SHARED-overlay-ecommerce.md"
  - "Transaction mechanics focus: cart abandonment recovery, dynamic retargeting, post-purchase LTV, repurchase — not brand relationship"
  - "Fake urgency is COUNTER-INDICATOR: 'Don't miss out!' without real constraint actively damages trust"

patterns-established:
  - "Ecommerce email: 3-email cart recovery (1hr → 24hr → 72hr), post-purchase first-buyer 2-email, review request timed to delivery, LTV repurchase trigger"
  - "Ecommerce paid: Meta DPA brief format (3 visual variants + 25-char headline + 125-char primary copy)"

requirements-completed: [LIB-03]

duration: 25min
completed: 2026-04-15
---

# Phase 107 Plan 04: Ecommerce Starter Library

**Authored the Ecommerce thin-overlay tone doc (extends TPL-SHARED-overlay-ecommerce.md with transaction mechanics) and complete 5-discipline skeleton (20 starter prompts).**

## Performance

- **Duration:** ~25 min
- **Tasks:** 2 (tone doc + skeleton)
- **Files created:** 7
- **Commit:** `93d985b`

## Accomplishments

- Created `TPL-SHARED-business-model-ecommerce.md` — thin extension of overlay-ecommerce, adds cart abandonment mechanics, ROAS-driven creative, post-purchase LTV distinctions from B2C brand model
- Created `onboarding/templates/SKELETONS/ecommerce/` — complete 5-discipline skeleton with 4 prompts per discipline
- Established the critical ecommerce/B2C distinctiveness: ecommerce = transaction mechanics, B2C = brand relationship (different models even though often conflated)

## Task Commits

1. **Task 1+2: Ecommerce tone doc and skeleton** — `93d985b` (feat: author Ecommerce tone doc (extends overlay) and 5-discipline skeleton)

## Files Created/Modified

- `.agent/markos/literacy/Shared/TPL-SHARED-business-model-ecommerce.md` — Thin ecommerce tone doc
- `onboarding/templates/SKELETONS/ecommerce/README.md` — Skeleton overview
- `onboarding/templates/SKELETONS/ecommerce/Paid_Media/PROMPTS.md` — Meta DPA creative brief (3 variants), Google Shopping feed copy, mid-funnel video retargeting, Google Search RSA
- `onboarding/templates/SKELETONS/ecommerce/Content_SEO/PROMPTS.md` — PDP conversion copy, category SEO hub, gift/buying guide, product comparison page
- `onboarding/templates/SKELETONS/ecommerce/Lifecycle_Email/PROMPTS.md` — 3-email cart recovery, post-purchase first-buyer 2-email, review request, LTV repurchase trigger
- `onboarding/templates/SKELETONS/ecommerce/Social/PROMPTS.md` — UGC product demo brief, product launch post, seasonal promotion, review amplification
- `onboarding/templates/SKELETONS/ecommerce/Landing_Pages/PROMPTS.md` — PDP conversion framework, sale/promotions page, category landing (paid traffic), bundle landing

## Decisions Made

Ecommerce tone doc distinctiveness maintained from B2C: focused on transaction-mechanism language (cart, checkout, abandon, repurchase, ROAS) rather than brand narrative.

## Deviations from Plan

None.

## Issues Encountered

None.

## Next Phase Readiness

Ecommerce pack manifest (Plan 107-06) can reference `TPL-SHARED-business-model-ecommerce.md` as `assets.baseDoc`. overlayDoc already set (unchanged).

---
*Phase: 107-business-model-starter-library-expansion*
*Completed: 2026-04-15*
