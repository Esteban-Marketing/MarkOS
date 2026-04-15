---
phase: 107-business-model-starter-library-expansion
plan: 01
subsystem: content-literacy
tags: [b2b, tone-doc, skeleton, prompts, linkedin, lifecycle-email]

requires: []
provides:
  - B2B tone doc at .agent/markos/literacy/Shared/TPL-SHARED-business-model-b2b.md
  - B2B skeleton (5 disciplines): Paid_Media, Content_SEO, Lifecycle_Email, Social, Landing_Pages at onboarding/templates/SKELETONS/b2b/
  - 20 starter prompts (4 per discipline) covering LinkedIn ABM, solution SEO, lead nurture, thought leadership, demo/case study landing pages
affects: [107-06, pack-loader, family-resolver, onboarding-skeleton-routing]

tech-stack:
  added: []
  patterns:
    - "Full tone doc (non-overlay): 9-field YAML frontmatter + 4-section markdown body (EVIDENCE BASE, CORE TACTICS per stage, COUNTER-INDICATORS)"
    - "Skeleton PROMPTS.md: H1 {Family} — {Discipline} Starter Prompts, Context block, 4 numbered prompts"
    - "B2B pain points: long_sales_cycle, multi_stakeholder_friction, low_roi_visibility"

key-files:
  created:
    - .agent/markos/literacy/Shared/TPL-SHARED-business-model-b2b.md
    - onboarding/templates/SKELETONS/b2b/README.md
    - onboarding/templates/SKELETONS/b2b/Paid_Media/PROMPTS.md
    - onboarding/templates/SKELETONS/b2b/Content_SEO/PROMPTS.md
    - onboarding/templates/SKELETONS/b2b/Lifecycle_Email/PROMPTS.md
    - onboarding/templates/SKELETONS/b2b/Social/PROMPTS.md
    - onboarding/templates/SKELETONS/b2b/Landing_Pages/PROMPTS.md
  modified: []

key-decisions:
  - "B2B tone doc is a FULL doc (not a thin overlay extension) — no prior B2B overlay exists"
  - "B2B funnel stages mapped: Awareness=credible-empathy, Consideration=ROI-specific, Decision=proof-confident, Onboarding=implementation-clear, Retention=value-reinforcing"
  - "No urgency language in B2B — COUNTER-INDICATOR"

patterns-established:
  - "Full tone doc pattern: use when no overlay exists for the business model"
  - "B2B paid: LinkedIn-dominant (LinkedIn Lead Gen Form, Thought Leadership, Retargeting)"
  - "B2B email: persona-specific, committee-aware nurture sequences"

requirements-completed: [LIB-03]

duration: 25min
completed: 2026-04-15
---

# Phase 107 Plan 01: B2B Starter Library

**Authored the B2B full tone doc (9-key YAML + 4-section body) and complete 5-discipline skeleton (20 starter prompts) for the B2B business model family.**

## Performance

- **Duration:** ~25 min
- **Tasks:** 2 (tone doc + skeleton)
- **Files created:** 7
- **Commit:** `03690b9`

## Accomplishments

- Created `TPL-SHARED-business-model-b2b.md` — full tone doc with B2B-specific funnel-stage tactics (Awareness through Retention), evidence base, and counter-indicators
- Created `onboarding/templates/SKELETONS/b2b/` — complete 5-discipline skeleton with 4 prompts per discipline (20 prompts total)
- Established B2B content pattern: committee-aware, ROI-framed, LinkedIn-dominant, no urgency language

## Task Commits

1. **Task 1+2: B2B tone doc and skeleton** — `03690b9` (feat: author B2B tone doc and 5-discipline skeleton)

## Files Created/Modified

- `.agent/markos/literacy/Shared/TPL-SHARED-business-model-b2b.md` — Full B2B tone doc
- `onboarding/templates/SKELETONS/b2b/README.md` — Skeleton overview
- `onboarding/templates/SKELETONS/b2b/Paid_Media/PROMPTS.md` — LinkedIn ABM, Lead Gen Form, Google Search, Retargeting
- `onboarding/templates/SKELETONS/b2b/Content_SEO/PROMPTS.md` — Original research, solution pages, comparison, thought leadership
- `onboarding/templates/SKELETONS/b2b/Lifecycle_Email/PROMPTS.md` — Lead nurture 3-email, trial-to-demo, renewal, re-engagement
- `onboarding/templates/SKELETONS/b2b/Social/PROMPTS.md` — LinkedIn POV, case study fragment, transparency, advocacy
- `onboarding/templates/SKELETONS/b2b/Landing_Pages/PROMPTS.md` — Demo request, free trial, case study, persona-specific pain

## Decisions Made

B2B is a full tone doc (not overlay-extension) since no TPL-SHARED-overlay-b2b.md existed. All 5 funnel stages covered with specific B2B mechanics.

## Deviations from Plan

None — plan executed exactly as specified.

## Issues Encountered

None.

## Next Phase Readiness

B2B pack manifest (Plan 107-06 Wave 2) can now reference `TPL-SHARED-business-model-b2b.md` as `assets.baseDoc`.

---
*Phase: 107-business-model-starter-library-expansion*
*Completed: 2026-04-15*
