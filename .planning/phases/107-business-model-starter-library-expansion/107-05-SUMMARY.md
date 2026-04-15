---
phase: 107-business-model-starter-library-expansion
plan: 05
subsystem: content-literacy
tags: [services, consulting, tone-doc, skeleton, prompts, linkedin, trust-building, no-urgency]

requires:
  - phase: N/A
    provides: TPL-SHARED-overlay-consulting.md (pre-existing — core posture: credible, relationship-first, senior, calm)
provides:
  - Services tone doc at .agent/markos/literacy/Shared/TPL-SHARED-business-model-services.md
  - Services skeleton (5 disciplines) at onboarding/templates/SKELETONS/services/
  - 20 starter prompts covering LinkedIn thought leadership ads, expert SEO articles, lead nurture sequences, LinkedIn POV posts, trust-led service pages
affects: [107-06, pack-loader, family-resolver, onboarding-skeleton-routing]

tech-stack:
  added: []
  patterns:
    - "Thin overlay-extension tone doc: extends overlay-consulting, adds funnel-stage breakdown with explicit NO-urgency rule"
    - "Services acquisition model: thought leadership → consideration via case study proof → low-commitment CTA (discovery call)"
    - "Urgency is COUNTER-INDICATOR: literally all urgency/scarcity language is prohibited in services content"

key-files:
  created:
    - .agent/markos/literacy/Shared/TPL-SHARED-business-model-services.md
    - onboarding/templates/SKELETONS/services/README.md
    - onboarding/templates/SKELETONS/services/Paid_Media/PROMPTS.md
    - onboarding/templates/SKELETONS/services/Content_SEO/PROMPTS.md
    - onboarding/templates/SKELETONS/services/Lifecycle_Email/PROMPTS.md
    - onboarding/templates/SKELETONS/services/Social/PROMPTS.md
    - onboarding/templates/SKELETONS/services/Landing_Pages/PROMPTS.md
  modified: []

key-decisions:
  - "Services tone doc is THIN (overlay-extension) — extends TPL-SHARED-overlay-consulting.md"
  - "Urgency language is STRICTLY PROHIBITED in all services content — not just discouraged"
  - "Low-commitment CTA pattern: discovery call / free audit / strategy session — never 'buy now' or 'get started'"
  - "Thought leadership as primary acquisition: educational > promotional in every context"

patterns-established:
  - "Services email: 3-email lead nurture (insight → case proof → soft ask), post-proposal 3-email (check-in → relevant context → close/release)"
  - "Services LinkedIn: POV contrarian opening, client result metric-first format, methodology transparency posts"
  - "Services landing pages: explicit 'who this is NOT for' section as trust signal"

requirements-completed: [LIB-03]

duration: 30min
completed: 2026-04-15
---

# Phase 107 Plan 05: Services Starter Library

**Authored the Services thin-overlay tone doc (extends TPL-SHARED-overlay-consulting.md) and complete 5-discipline skeleton (20 starter prompts) with explicit zero-urgency stance.**

## Performance

- **Duration:** ~30 min
- **Tasks:** 2 (tone doc + skeleton)
- **Files created:** 7
- **Commit:** `4905d84`

## Accomplishments

- Created `TPL-SHARED-business-model-services.md` — thin extension of overlay-consulting, adds funnel-stage tactics with explicit urgency prohibition as primary COUNTER-INDICATOR
- Created `onboarding/templates/SKELETONS/services/` — complete 5-discipline skeleton with 4 prompts per discipline
- Established services as the most trust-sensitive model: relationship acquisition path, no transaction pressure, case study and process transparency as primary conversion tools

## Task Commits

1. **Task 1+2: Services tone doc and skeleton** — `4905d84` (feat: author Services tone doc (extends consulting overlay) and 5-discipline skeleton)

## Files Created/Modified

- `.agent/markos/literacy/Shared/TPL-SHARED-business-model-services.md` — Thin services tone doc
- `onboarding/templates/SKELETONS/services/README.md` — Skeleton overview
- `onboarding/templates/SKELETONS/services/Paid_Media/PROMPTS.md` — LinkedIn thought leadership ad, retargeting mid-funnel, LinkedIn Lead Gen Form, Google Search RSA
- `onboarding/templates/SKELETONS/services/Content_SEO/PROMPTS.md` — Thought leadership article, case study page, methodology/how-we-work page, industry-specific service landing
- `onboarding/templates/SKELETONS/services/Lifecycle_Email/PROMPTS.md` — 3-email lead nurture, 3-email post-proposal follow-up, client onboarding 2-email, re-engagement
- `onboarding/templates/SKELETONS/services/Social/PROMPTS.md` — LinkedIn POV post, client result post, process/methodology transparency, content distribution teaser
- `onboarding/templates/SKELETONS/services/Landing_Pages/PROMPTS.md` — Core service page, free consultation offer, case study landing, homepage expertise section

## Decisions Made

Services has the most extensive COUNTER-INDICATORS section: urgency in any form, price anchoring in awareness content, generic testimonials, and startup jargon are all explicitly prohibited.

## Deviations from Plan

None.

## Issues Encountered

None.

## Next Phase Readiness

Services pack manifest (Plan 107-06) can reference `TPL-SHARED-business-model-services.md` as `assets.baseDoc`. overlayDoc (consulting) remains set.

---
*Phase: 107-business-model-starter-library-expansion*
*Completed: 2026-04-15*
