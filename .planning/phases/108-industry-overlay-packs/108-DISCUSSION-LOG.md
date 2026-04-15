# Phase 108: Industry Overlay Packs - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-15 (updated 2026-04-15 post-execution)
**Phase:** 108-industry-overlay-packs
**Areas discussed:** Discipline coverage per vertical, overlayFor mapping, Professional Services overlap, Skeleton approach, Pack loader subdirectory pattern

---

## Discipline Coverage per Vertical

| Option | Description | Selected |
|--------|-------------|----------|
| Uniform — all 5 disciplines for all 4 verticals | Consistent with Phase 107 pattern. Completeness = partial across all. Simpler authoring contract. | ✓ |
| Channel-aware — vary by vertical | Travel heavy on Paid_Media + Social + Landing_Pages; IT heavy on Content_SEO + Lifecycle_Email. More authentic but more planning overhead. | |

**User's choice:** Uniform — all 5 disciplines for all 4 verticals

| Option | Description | Selected |
|--------|-------------|----------|
| All partial (same as Phase 107 base families) | All disciplines at completeness = partial — consistent with Phase 107's result | ✓ |
| Some stub, some partial — reflects real-world importance | Mark less-critical discipline+vertical combos as stub | |

**User's choice:** All partial (same as Phase 107 base families)

---

## overlayFor Mapping

| Option | Description | Selected |
|--------|-------------|----------|
| Specific per vertical | Travel→[b2c,b2b], IT→[b2b,saas,services], Marketing Services→[agency,b2b], Prof Services→[services,b2b]. Cleaner operator UI. | ✓ |
| Universal — all base families for all overlays | All 4 overlays apply to any base family. Simpler, but shows nonsensical combos in operator UI. | |

**User's choice:** Specific per vertical

---

## Professional Services Overlap with Services Base Pack

| Option | Description | Selected |
|--------|-------------|----------|
| Thin delta — overlay adds vertical authority markers only | Adds RFP culture, rate card dynamics, credentialing as proof, peer referral as primary acquisition. Services base handles core B2B service tone. | ✓ |
| Substantive differentiation — independent funnel framing | Treat as meaningfully different: org consulting, boutique advisory, Big 4 adjacent positioning. | |

**User's choice:** Thin delta — overlay adds vertical authority markers only

---

## Skeleton Approach — Standalone vs Addendum

| Option | Description | Selected |
|--------|-------------|----------|
| Standalone — 4 prompts per discipline (same as Phase 107) | Self-contained, consistent with Phase 107. No assumption about active base family. | ✓ |
| Addendum — 2 industry-specific prompts per discipline | Lighter files; assumes base family prompts exist. Creates runtime dependency. | |

**User's choice:** Standalone — 4 prompts per discipline

---

## Agent's Discretion

- Tone doc file naming convention for overlays
- Pack `operatorNotes` field content
- Pack base and proof doc paths for overlay packs

## Post-Execution Update (2026-04-15)

## Pack Loader Subdirectory Pattern

| Option | Description | Selected |
|--------|-------------|----------|
| Two-path pattern — root for base, industries/ for overlays | Note that base packs (*.pack.json) are loaded from lib/markos/packs/ root, and industry overlays (*.industry.json) are loaded from lib/markos/packs/industries/ subdirectory via a separate path.join call — lock this as D-08 for Phase 109 awareness | ✓ |
| Fix the wrong statement in canonical_refs only | Just update the incorrect note in canonical_refs without adding a new decision entry | |

**User's choice:** Two-path pattern — lock as D-08
**Notes:** Confirmed from Pack 108 execution. `path.join(__dirname, 'industries', overlaySlug + '.industry.json')` is a direct lookup, not a glob scan. Phase 109 tooling must scan both paths independently.

## Deferred Ideas

- Channel-aware partial vs stub completeness per discipline+vertical
- Universal `overlayFor` (any overlay to any base family)
- Addendum-style skeleton files
