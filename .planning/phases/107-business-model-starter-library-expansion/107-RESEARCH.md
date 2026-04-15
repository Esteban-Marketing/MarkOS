# Phase 107: Business-Model Starter Library Expansion — Research

**Researched:** 2026-04-14
**Domain:** Content authoring (literacy docs + starter prompts) + pack manifest updates
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Author content for 5 priority families only: `b2b`, `b2c`, `saas`, `ecommerce`, `services`.
- **D-02:** `agency` and `info-products` remain at `completeness: stub` — no content authored in this phase.
- **D-03:** All 5 disciplines covered for each priority family: `Paid_Media`, `Content_SEO`, `Lifecycle_Email`, `Social`, `Landing_Pages`.
- **D-04:** Each family × discipline intersection produces a `PROMPTS.md` file inside the skeleton.
- **D-05:** New per-family tone docs live in `.agent/markos/literacy/Shared/`.
- **D-06:** Naming: `TPL-SHARED-business-model-{slug}.md`.
- **D-07:** Update `assets.baseDoc` in each priority pack's `.pack.json` to new family tone doc path.
- **D-08:** Skeleton: `onboarding/templates/SKELETONS/{slug}/{Discipline}/PROMPTS.md` + `README.md` at root.
- **D-09:** Each `PROMPTS.md` contains 3–5 concrete, immediately actionable prompts per family+discipline.
- **D-10:** `README.md` per family: business model description, primary marketing challenges, disciplines covered.
- **D-11:** Set all 5 disciplines of all 5 priority families to `completeness: "partial"` after authoring.
- **D-12:** `"full"` reserved for after Phase 109 integration testing.
- **D-13:** `agency` and `info-products` manifests stay unchanged.
- **D-14:** Only mutate `assets.baseDoc` and `completeness` in priority `.pack.json` files. Do not touch `proofDoc`, `overlayDoc`, `fallbackAllowed`, or any other fields.

### Claude's Discretion
- Exact wording and content of individual `PROMPTS.md` files.
- Exact wording of each `README.md`.
- Whether per-family tone doc needs distinct `tone_guidance`/`proof_posture` or can share broad characterizations.

### Deferred Ideas (OUT OF SCOPE)
- Agency and Info-products full authoring (Phase 108+).
- Industry overlay composition with base packs (Phase 108).
- Live onboarding hydration wiring (Phase 109).
- Completeness graduating from `partial` to `full` (Phase 109).
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| LIB-03 | Each supported library includes discipline-aware literacy examples, starter skeletons, and initialization docs for the core operating disciplines. | Satisfied by: 5 per-family tone docs + 5×5 PROMPTS.md files + 5 README.md files + completeness graduation to "partial". |
</phase_requirements>

---

## Summary

Phase 107 is a **content authoring phase**, not a software engineering phase. The primary deliverables are: (1) 5 per-family tone and naturality docs, (2) 25 discipline-specific PROMPTS.md starter files (5 families × 5 disciplines), (3) 5 skeleton README.md files, and (4) 5 `.pack.json` manifest updates. No new code is written.

Three of the five families (SaaS, ecommerce, services) already have overlay docs that establish their tone posture. The new per-family tone docs for those three should be thin and non-duplicative — extending rather than restating what's already in the overlay. B2B and B2C have no existing overlay docs, so their tone docs carry the full characterization.

The only engineering risk is manifest ordering: the new `TPL-SHARED-business-model-{slug}.md` files **must be authored before** the pack manifests are updated to reference them. Writing a `baseDoc` path that points to a nonexistent file passes JSON validation (Ajv only checks string non-empty) but would break runtime consumers.

**Primary recommendation:** Author all 41 files (5 tone docs + 25 PROMPTS.md + 5 README.md + 5 changelog entries + 1 version bump per pack) in family-first waves. Update manifests last, after confirming each literacy file exists on disk.

---

## Standard Stack

This phase has **no new library dependencies**. All tooling and file formats are established from Phase 106.

### File Formats in Use
| Format | Purpose | Pattern |
|--------|---------|---------|
| Markdown + YAML frontmatter | Literacy docs (tone docs, overlay docs, LIT-*) | Fenced ` ```yaml ` block at top of `.md` file |
| JSON (hand-edited) | Pack manifest updates | `.pack.json` — validated by Ajv v8 against `pack-schema.json` |
| Plain Markdown | Skeleton PROMPTS.md and README.md | No frontmatter required |

### Validation
Pack manifests are validated by `lib/markos/packs/pack-loader.cjs` using Ajv v8 with `strict: false`. Validation failures produce a `console.warn` and fall back to an accept-all validator — the loader does **not** throw. This means an invalid manifest still loads, but schema violations should be treated as bugs.

---

## Architecture Patterns

### Per-Family Tone Doc Structure

Every new `TPL-SHARED-business-model-{slug}.md` must follow this exact pattern (derived from `TPL-SHARED-tone-and-naturality.md` and `TPL-SHARED-overlay-saas.md`):

```markdown
```yaml
doc_id: "TPL-SHARED-business-model-{slug}"
discipline: "Shared"
business_model: ["{slug}"]
pain_point_tags: ["{primary_pain_1}", "{primary_pain_2}"]
funnel_stage: ["Awareness", "Consideration", "Decision", "Onboarding", "Retention"]
buying_maturity: "{maturity range for this model}"
tone_guidance: "{stage-by-stage tone prescription}"
proof_posture: "{evidence-escalation rule specific to this model}"
naturality_expectations: "{voice + anti-pattern call-outs specific to this model}"
```​

# {DisplayName} Tone and Naturality Guidance

{2–3 sentence framing paragraph}

## EVIDENCE BASE
- {Evidence point 1}
- {Evidence point 2}

## CORE TACTICS
### Awareness
{Specific guidance for this model at awareness stage}

### Consideration
{Specific guidance for this model at consideration stage}

### Decision
{Specific guidance for this model at decision stage}

### Onboarding
{Specific guidance for this model at onboarding stage — if applicable}

### Retention
{Specific guidance for this model at retention stage — if applicable}

## COUNTER-INDICATORS
- {What NOT to do in this model's voice}
- {Common tone mistake for this model}
```

**YAML frontmatter is the contract.** The `doc_id` field must be globally unique. `business_model` must be `["{slug}"]` (not `["all"]`). All nine frontmatter keys are required.

### Skeleton PROMPTS.md Structure

No YAML frontmatter required. Use a consistent markdown header:

```markdown
# {FamilyDisplayName} — {Discipline} Starter Prompts

> **Context:** {1-sentence grounding of why this family+discipline combination is distinct. E.g., "B2B Paid Media skews toward LinkedIn and account-based targeting — prompts reflect multi-stakeholder buyer journeys."}

## Prompts

### 1. {Short label — what the prompt produces}

{Full prompt text. Be specific: name the model, the channel, the outcome, and the buyer stage. Avoid generic placeholders.}

---

### 2. {Short label}

{prompt text}

---

{...continue for 3–5 total prompts}
```

**Quality bar:** Each prompt must be immediately usable — paste it into a system like MarkOS without editing. No `[INSERT COMPANY NAME HERE]` placeholders. Instead, use context-appropriate specifics like "your ICP title", "your category", "your core benefit".

### Skeleton README.md Structure

```markdown
# {FamilyDisplayName} Starter Pack

**Business model:** {One-sentence definition.}
**Primary marketing challenges:** {2–3 challenge bullets.}
**Disciplines covered:** Paid_Media · Content_SEO · Lifecycle_Email · Social · Landing_Pages

## When to use this pack
{1 short paragraph: scenarios, company types, size signals.}

## Pack contents
| File | Description |
|------|-------------|
| Paid_Media/PROMPTS.md | Starter prompts for paid acquisition |
| Content_SEO/PROMPTS.md | Starter prompts for organic content strategy |
| Lifecycle_Email/PROMPTS.md | Starter prompts for email sequences |
| Social/PROMPTS.md | Starter prompts for social copy |
| Landing_Pages/PROMPTS.md | Starter prompts for landing page copy |
```

### Pack Manifest Update Pattern

Mutate only `assets.baseDoc` (string → new per-family path), `completeness` (all 5 discipline values → `"partial"`), and append a `changelog` entry. Bump `version` from `1.0.0` → `1.1.0`.

```json
{
  "version": "1.1.0",
  "completeness": {
    "Paid_Media": "partial",
    "Content_SEO": "partial",
    "Lifecycle_Email": "partial",
    "Social": "partial",
    "Landing_Pages": "partial"
  },
  "assets": {
    "baseDoc": ".agent/markos/literacy/Shared/TPL-SHARED-business-model-{slug}.md",
    "proofDoc": "...(unchanged)",
    "overlayDoc": "...(unchanged)",
    "skeletonDir": "...(unchanged)"
  },
  "changelog": [
    { "version": "1.0.0", "date": "2026-04-14", "summary": "Initial pack definition migrated from FAMILY_REGISTRY" },
    { "version": "1.1.0", "date": "2026-04-14", "summary": "Phase 107: authored per-family tone doc, 5-discipline skeletons; graduated completeness stub→partial" }
  ]
}
```

**Do NOT** change `proofDoc`, `overlayDoc`, `fallbackAllowed`, `type`, `slug`, `aliases`, `industries`, `disciplines`, `operatorNotes`, `overlayFor`, or `dependencies`.

---

## Business Model Distinctiveness

### B2B
- **Buyer:** Committee decisions, multi-stakeholder, procurement/legal involved at high ACV
- **Cycle length:** Weeks to months; 3–12 touchpoints before a deal
- **Trust mechanics:** ROI proof, implementation confidence, peer logos, case studies, product integrations
- **Primary channels:** LinkedIn (dominant), Google Search (high intent), email nurture
- **Tone posture:** Measured, credible, senior-audience-aware, evidence-first. Avoid startup-hype language.
- **Proof posture:** ROI/payback data, named customer evidence, analyst validation
- **No existing overlay doc** — tone doc carries full characterization

### B2C
- **Buyer:** Individual consumer, emotional + rational split; impulse AND considered purchase coexist depending on AOV
- **Cycle length:** Hours to days; often driven by emotion, urgency, or social proof
- **Trust mechanics:** Brand identity, lifestyle fit, peer reviews, UGC, social validation
- **Primary channels:** Meta/Instagram (dominant), YouTube, TikTok, Google Shopping
- **Tone posture:** Engaging, benefit-led, brand voice-consistent, emotionally resonant. Not clinical.
- **Proof posture:** Social proof (reviews, UGC), lifestyle alignment, before/after, "people like you" signals
- **No existing overlay doc** — tone doc carries full characterization
- **Critical distinction from ecommerce:** B2C is the parent model (brand relationship + product); ecommerce is a *transaction mechanics* specialization. B2C can include service subscriptions, apps, and non-transactional offers that ecommerce prompts wouldn't fit.

### SaaS
- **Buyer:** Individual champion + economic buyer at higher tiers; product-led entry is common
- **Cycle length:** Days (PLG/self-serve) to months (enterprise); trial/freemium mid-funnel
- **Trust mechanics:** Product-led proof, trial activation speed, transparent pricing, integration depth, NPS/G2 social proof
- **Primary channels:** Google Search (high intent), LinkedIn (enterprise tier), in-app, email
- **Tone posture:** Operator-like, efficient, product-literate, low-fluff. *(Aligns with existing `TPL-SHARED-overlay-saas.md` — tone doc must NOT duplicate it)*
- **Proof posture:** Activation outcomes, time-to-value, trial transparency, product screenshots
- **Existing overlay doc:** `TPL-SHARED-overlay-saas.md` already captures core tone + proof posture. New per-family tone doc (`TPL-SHARED-business-model-saas.md`) should be thinner and can reference it.

### Ecommerce
- **Buyer:** Consumer or business buyer transacting via an online store; focus is on transaction conversion and LTV
- **Cycle length:** Minutes to days; cart abandonment is the dominant conversion failure
- **Trust mechanics:** Product reviews, product photography quality, scarcity/urgency cues, return policy confidence, site trust signals
- **Primary channels:** Meta/Google Shopping (dominant), email/SMS (lifecycle), TikTok/Instagram (discovery)
- **Tone posture:** Energetic but credible, urgency-aware, benefit-led. *(Aligns with existing `TPL-SHARED-overlay-ecommerce.md` — tone doc must NOT duplicate it)*
- **Proof posture:** Review-led, product proof, ethical scarcity, purchase reassurance
- **Existing overlay doc:** `TPL-SHARED-overlay-ecommerce.md` already captures core posture. New tone doc should be thinner.
- **Critical distinction from B2C:** Ecommerce focuses on *transaction mechanics* (cart, checkout, product discovery, abandon recovery, repurchase). B2C is broader and includes brand relationship outside the transaction.

### Services (Professional Services / Consulting)
- **Buyer:** Executive or business owner; personal trust in the practitioner is a primary decision factor
- **Cycle length:** Weeks to months; referral-influenced; proposal process is standard
- **Trust mechanics:** Case studies, process credibility, thought leadership, credentials, testimonials
- **Primary channels:** LinkedIn, SEO/content, referral networks, email relationship-nurture
- **Tone posture:** Credible, relationship-first, senior, calm. *(Aligns with existing `TPL-SHARED-overlay-consulting.md`)*
- **Proof posture:** Case studies (outcome + process), high-ticket commitment signaling, low-pressure CTA
- **Existing overlay doc:** `TPL-SHARED-overlay-consulting.md` (overlay_for: "services") already captures core posture. New tone doc should be thinner.

---

## Discipline Distinctiveness by Business Model

### Summary Matrix (content angles per intersection)

| Discipline | B2B Angle | B2C Angle | SaaS Angle | Ecommerce Angle | Services Angle |
|------------|-----------|-----------|------------|-----------------|----------------|
| **Paid_Media** | LinkedIn ABM, lead-gen forms, ROI-framed | Meta/TikTok UGC, emotion + urgency | Google + LinkedIn, trial CTAs, bottom-funnel | Meta/Google Shopping, dynamic retargeting | LinkedIn awareness + retargeting content |
| **Content_SEO** | Thought leadership, original research, solution pages | Lifestyle listicles, buyer guides, how-to | Comparison/alternative pages, integration pages, use-case | Buying guides, product comparison, category pages | Expertise articles, process guides, case study SEO |
| **Lifecycle_Email** | Nurture sequences, persona-tiered, sales-aligned | Behavioral triggers, post-purchase, loyalty | Onboarding sequences, trial-to-paid, in-app triggered | Abandoned cart, post-purchase, repurchase LTV | Relationship-nurture, proposal follow-up, referral ask |
| **Social** | LinkedIn thought leadership, educational > promotional | UGC, influencer-compatible, share-worthy | Product screenshots, feature demos, customer wins | Product showcase, UGC, reviews | LinkedIn expertise, before/after client stories |
| **Landing_Pages** | Demo/trial CTA, logo proof, case study snippets | Visual-forward, benefit bullets, social proof | Free trial CTA, integration proof, pricing clarity | Product-page psychology, scarcity + reviews, single-product focus | Credibility-led, low-commitment CTA (free consult/audit) |

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| Per-model tone characterization from scratch | Original research into marketing theory | Reference the existing overlay docs for SaaS, ecommerce, services — they are already the single source of truth. Extend them. |
| A new YAML schema for the tone docs | Custom frontmatter fields | The 9-key schema from `TPL-SHARED-tone-and-naturality.md` is established. Follow it exactly. |
| New skeleton directory structure | A custom nested format | Follow D-08 exactly: `SKELETONS/{slug}/{Discipline}/PROMPTS.md`. The `skeletonDir` in each pack.json already encodes this expectation. |
| Pack validation logic | A custom JSON validator | Ajv v8 on `pack-schema.json` is the validator. Trust it. |
| New test helpers for completeness assertions | Writing a new test loop to assert "partial" | **No new assertions needed.** The existing tests do NOT assert specific `completeness` string values — see §Test Mutation Analysis below. |

---

## Test Mutation Analysis

**Critical finding:** `test/pack-loader.test.js` does **NOT** contain any test assertion that checks for `completeness === "stub"` at the discipline level. The CONTEXT.md warned that such tests "may need updating" — that warning was precautionary, not based on actual test content.

**What the tests actually assert (all 12 tests, 106.1–106.12):**
- `106.1`: registry has 7 entries (count)
- `106.2`: each entry has required legacy shape fields (types only — `slug` is string, `aliases` is array, `baseDoc` is string, `proofDoc` is string, `overlayDocs` is object)
- `106.3`: registry is frozen
- `106.4`: cache returns same reference
- `106.5`: `_resetCacheForTests` produces 7 entries
- `106.6`: `saas.overlayDocs.saas` is a non-empty string (reads from `overlayDoc` in the pack.json — **unchanged by this phase**)
- `106.7`: `services.overlayDocs.consulting` is a string (reads from `overlayDoc` — **unchanged by this phase**)
- `106.8–106.12`: `resolvePackSelection` shape tests (business model routing, ISO date, override reason)

**Conclusion:** Promoting `completeness` from `"stub"` to `"partial"` and changing `assets.baseDoc` to a new path will **not break any existing test** — provided the referenced file actually exists on disk when the loader is exercised.

**One risk:** If tests were to add `baseDoc` path existence checks in the future (they don't now), a missing file would fail. This reinforces the ordering constraint: **author content files before updating pack manifests**.

---

## Common Pitfalls

### Pitfall 1: Updating the manifest before the file exists
**What goes wrong:** `assets.baseDoc` pointing to `TPL-SHARED-business-model-b2b.md` before that file is created. JSON is valid, Ajv passes (it only checks the string is non-empty), but any runtime consumer that resolves the path gets a file-not-found.
**How to avoid:** Wave execution: author all content in Wave 1 → update manifests in Wave 2.
**Warning signs:** File listed in `baseDoc` not present on disk when pack-loader is invoked.

### Pitfall 2: Duplicating overlay doc content in the tone doc for SaaS / ecommerce / services
**What goes wrong:** The new `TPL-SHARED-business-model-saas.md` restates the same `tone_guidance` and `proof_posture` already in `TPL-SHARED-overlay-saas.md`. No functional breakage, but two authoritative documents with possible future divergence.
**How to avoid:** For SaaS, ecommerce, and services, the per-family tone doc should add specificity _beyond_ what the overlay provides (e.g., funnel-stage breakdown) without restating it. Keep the tone doc thinner. The overlay stays the overlay.

### Pitfall 3: Using generic/placeholder prompts in PROMPTS.md
**What goes wrong:** Prompts that say "Write a [DISCIPLINE] post for a [BUSINESS MODEL] company" — these are placeholder quality, not starter quality.
**How to avoid:** Each prompt should name the channel, buyer persona, specific pain or intent, and the desired output format. No `[PLACEHOLDER]` syntax. Use referential specifics like "your ICP title", "your category keyword", "your core differentiator".

### Pitfall 4: Wrong `business_model` value in YAML frontmatter
**What goes wrong:** Using `business_model: ["all"]` (copied from the shared tone doc) instead of `["{slug}"]`. The doc loads but future tooling that filters by `business_model` would route incorrectly.
**How to avoid:** Every new `TPL-SHARED-business-model-{slug}.md` must have `business_model: ["{slug}"]` not `["all"]`.

### Pitfall 5: Wrong `doc_id` format
**What goes wrong:** `doc_id` copied from another file and not updated — creates two docs with the same ID.
**How to avoid:** Set `doc_id: "TPL-SHARED-business-model-{slug}"` exactly (e.g., `"TPL-SHARED-business-model-b2b"` not `"TPL-SHARED-tone-and-naturality"`).

### Pitfall 6: Mutating pack.json fields outside D-14 scope
**What goes wrong:** Accidentally overwriting `overlayDoc` (which is `null` for b2b/b2c and correctly set for saas/ecommerce/services) or toggling `fallbackAllowed`.
**How to avoid:** Only touch `version`, `completeness`, `assets.baseDoc`, and `changelog`. All other fields are read-only for this phase.

### Pitfall 7: Discipline directory name case mismatch
**What goes wrong:** Creating `onboarding/templates/SKELETONS/b2b/paid_media/PROMPTS.md` instead of `onboarding/templates/SKELETONS/b2b/Paid_Media/PROMPTS.md`.
**How to avoid:** Use exact capitalization from the schema enum: `Paid_Media`, `Content_SEO`, `Lifecycle_Email`, `Social`, `Landing_Pages`.

---

## Code Examples

### Verified: Pack JSON mutation (b2b example)
```json
// lib/markos/packs/b2b.pack.json — after Phase 107
{
  "slug": "b2b",
  "version": "1.1.0",
  "displayName": "B2B (Business-to-Business)",
  "type": "base",
  "aliases": ["b2b", "business to business", "enterprise"],
  "industries": [],
  "disciplines": ["Paid_Media", "Content_SEO", "Lifecycle_Email", "Social", "Landing_Pages"],
  "completeness": {
    "Paid_Media": "partial",
    "Content_SEO": "partial",
    "Lifecycle_Email": "partial",
    "Social": "partial",
    "Landing_Pages": "partial"
  },
  "assets": {
    "baseDoc": ".agent/markos/literacy/Shared/TPL-SHARED-business-model-b2b.md",
    "proofDoc": ".agent/markos/literacy/Shared/TPL-SHARED-proof-posture.md",
    "overlayDoc": null,
    "skeletonDir": "onboarding/templates/SKELETONS/b2b/"
  },
  "fallbackAllowed": true,
  "overlayFor": null,
  "dependencies": [],
  "operatorNotes": "",
  "changelog": [
    { "version": "1.0.0", "date": "2026-04-14", "summary": "Initial pack definition migrated from FAMILY_REGISTRY" },
    { "version": "1.1.0", "date": "2026-04-14", "summary": "Phase 107: authored per-family tone doc, 5-discipline skeletons; graduated completeness stub→partial" }
  ]
}
```

### Verified: Tone doc frontmatter (b2b example)
```yaml
doc_id: "TPL-SHARED-business-model-b2b"
discipline: "Shared"
business_model: ["b2b"]
pain_point_tags: ["long_sales_cycle", "multi_stakeholder_friction"]
funnel_stage: ["Awareness", "Consideration", "Decision", "Onboarding", "Retention"]
buying_maturity: "problem-aware to most-aware"
tone_guidance: "Awareness=credible-empathy; Consideration=ROI-specific; Decision=proof-confident; Onboarding=implementation-clear; Retention=value-reinforcing"
proof_posture: "Scale from category education at Awareness to named-customer ROI data at Decision."
naturality_expectations: "Senior, authoritative, plainspoken, anti-startup-hype. No buzzword stacking."
```

### Verified: Schema fields that are safe to mutate vs. read-only
```
MUTABLE in Phase 107:
  version          (string semver — bump to 1.1.0)
  completeness.*   (enum: "full"|"partial"|"stub"|"missing" — change to "partial")
  assets.baseDoc   (string — point to new per-family tone doc)
  changelog        (array — append new entry; never replace existing)

READ-ONLY in Phase 107 (per D-14):
  slug, displayName, type, aliases, industries, disciplines
  assets.proofDoc, assets.overlayDoc, assets.skeletonDir
  fallbackAllowed, overlayFor, dependencies, operatorNotes
```

### Verified: Skeleton directory layout
```
onboarding/templates/SKELETONS/
├── b2b/
│   ├── README.md
│   ├── Paid_Media/PROMPTS.md
│   ├── Content_SEO/PROMPTS.md
│   ├── Lifecycle_Email/PROMPTS.md
│   ├── Social/PROMPTS.md
│   └── Landing_Pages/PROMPTS.md
├── b2c/             (same structure)
├── saas/            (same structure)
├── ecommerce/       (same structure)
└── services/        (same structure)
```

---

## Existing Overlay Docs — Avoid These Gaps and Duplications

| Pack | Existing overlay doc | Tone doc status | Guidance |
|------|---------------------|-----------------|----------|
| `b2b` | None | NEW — carries full characterization | Write comprehensive tone doc. No overlap risk. |
| `b2c` | None | NEW — carries full characterization | Write comprehensive tone doc. No overlap risk. |
| `saas` | `TPL-SHARED-overlay-saas.md` — tone: operator-like, efficient; proof: product-led, trial-framed | NEW — must be thinner | Extend with funnel-stage detail. Do not re-state `tone_guidance` already in overlay. Can cross-reference overlay path. |
| `ecommerce` | `TPL-SHARED-overlay-ecommerce.md` — tone: energetic but credible, urgency-aware; proof: review-led, scarcity | NEW — must be thinner | Extend with funnel-stage detail. Do not re-state what overlay already says. |
| `services` | `TPL-SHARED-overlay-consulting.md` (overlay_for: services) — tone: credible, relationship-first, senior; proof: case studies, process confidence | NEW — must be thinner | Extend with funnel-stage breakdown. Avoid re-stating consulting overlay. |

---

## Validation Architecture

The existing Nyquist validation suite (`node --test test/**/*.test.js`) must remain green after this phase. No new tests need to be written for Phase 107 because:
1. The `completeness` mutation is not currently asserted in `test/pack-loader.test.js`.
2. The `assets.baseDoc` mutation is only checked as "string exists" (not path validity).
3. Content files (tone docs, PROMPTS.md, README.md) are not covered by the existing test suite scope.

**Phase gate check (before marking phase complete):**
```bash
node --test test/pack-loader.test.js
```
All 12 tests (106.1–106.12) must remain green after pack.json mutations.

---

## Environment Availability

Step 2.6: SKIPPED (no external tools, services, or CLIs required — phase is pure content authoring and JSON mutation).

---

## Sources

### Primary (HIGH confidence)
- `lib/markos/packs/pack-schema.json` — definitive field enumeration, validation rules, `additionalProperties: false` constraints
- `lib/markos/packs/b2b.pack.json`, `saas.pack.json`, `b2c.pack.json`, `ecommerce.pack.json`, `services.pack.json` — current manifest state
- `lib/markos/packs/pack-loader.cjs` — how completeness and baseDoc are consumed at runtime
- `test/pack-loader.test.js` — all 12 test assertions read directly; confirms no completeness string assertions exist
- `.agent/markos/literacy/Shared/TPL-SHARED-tone-and-naturality.md` — canonical tone doc format (9-key frontmatter, section names)
- `.agent/markos/literacy/Shared/TPL-SHARED-overlay-saas.md` — existing saas tone posture
- `.agent/markos/literacy/Shared/TPL-SHARED-overlay-ecommerce.md` — existing ecommerce tone posture
- `.agent/markos/literacy/Shared/TPL-SHARED-overlay-consulting.md` — existing services/consulting tone posture
- `.agent/markos/literacy/Paid_Media/LIT-PM-001-high-cpr.md` — quality bar reference for literacy docs

### Secondary (MEDIUM confidence)
- `.planning/phases/107-business-model-starter-library-expansion/107-CONTEXT.md` — locked decisions and agent discretion scope
- `.agent/markos/literacy/Shared/TPL-SHARED-business-model-map.md` — prior phase's model family definitions

---

## Metadata

**Confidence breakdown:**
- Pack schema mutation rules: HIGH — read directly from schema and loader source
- Test impact assessment: HIGH — read all 12 test assertions directly
- Business model distinctiveness: HIGH — grounded in existing overlay docs (for saas/ecommerce/services), supplemented by training knowledge for B2B/B2C
- Prompt quality bar: HIGH — derived from LIT-PM-001 quality bar + D-09 specificity requirement
- File ordering constraint: HIGH — derived from Ajv validation behavior in pack-loader.cjs

**Research date:** 2026-04-14
**Valid until:** This phase only — phase produces new files, after which all paths and content are locked by subsequent phases.
