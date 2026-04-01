# Phase 41: Dynamic Skeleton Template Generator — Research

**Researched:** 2026-04-01  
**Domain:** Node.js file generation, onboarding approval hook, markdown template interpolation  
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-41-01:** Headings + section prompts (1–3 sentences per section).
- **D-41-02:** Pain points injected as `###` sub-headings in a dedicated `## Your Priority Challenges` section. Placeholder format: `### {{pain_point_N}}`.
- **D-41-03:** Dynamic placeholder count matching seed — exactly as many sub-headings as `audience.pain_points` declares.
- **D-41-04:** Generated output files carry YAML frontmatter; base templates are clean markdown stubs with no frontmatter.
- **D-41-05:** Always generate all 5 MSP disciplines at approval time — `Paid_Media`, `Content_SEO`, `Lifecycle_Email`, `Social`, `Landing_Pages`.
- **D-41-06:** Blocking post-approval hook; non-fatal errors; response shape `skeletons: { generated: string[], failed: string[] }`; HTTP 200 even on partial errors.
- **D-41-07:** `resolveSkeleton(discipline, businessModel, basePath?)` added to `example-resolver.cjs`; shares `MODEL_SLUG` map; returns `''` on missing file, never throws.

### Claude's Discretion
- Dynamic placeholder count implementation strategy (fixed 3-slot template with orphan removal vs pure construction).
- Exact output filename convention for skeleton files in `.markos-local/MSP/{discipline}/SKELETONS/`.
- Whether `SEED_PATH` is added to `path-constants.cjs` or seed is passed in the approve request body.
- `approvedDrafts` parameter usage within `generateSkeletons` (currently has no mandated implementation role).

### Deferred Ideas (OUT OF SCOPE)
- Discipline-filtering by seed signals (skeleton scope is always all 5 — discipline-router is for Phase 40 retrieval only).
- LLM-assisted skeleton enrichment at generation time.
- Skeleton versioning or content diff on re-approval.
</user_constraints>

---

## Summary

Phase 41 adds a skeleton file generator triggered by the `POST /approve` endpoint. The generator reads the saved onboarding seed, loads 35 pre-authored base markdown templates (7 business models × 5 disciplines), injects YAML frontmatter and pain-point sub-headings, and writes the personalized output to `.markos-local/MSP/{discipline}/SKELETONS/`. Errors are absorbed non-fatally.

The implementation touches three existing files (`example-resolver.cjs`, `handlers.cjs`, `path-constants.cjs`) and adds two new ones (`skeleton-generator.cjs` + 35 template files under `.agent/markos/templates/SKELETONS/`).

**Primary recommendation:** Seed is loaded from disk at hook time (not passed in request body) using a new `SEED_PATH` constant; `generateSkeletons` accepts optional path overrides for test isolation; base templates hold 3 pain-point placeholder slots and the interpolator removes unresolved slots by line-filtering.

---

## Code Archaeology

### File 1: `onboarding/backend/handlers.cjs` — `handleApprove` (lines 1270–1515)

**Full flow (condensed):**

```
handleApprove()
  ├─ 1. Secret check → 503 if missing
  ├─ 2. runtime.canWriteLocalFiles check → 501 if false
  ├─ 3. vectorStore.configure(runtime.config)
  ├─ 4. resolveProjectSlug(...)
  ├─ 5. resolveMirOutputPath(runtime.config) → 400 on out-of-bounds
  ├─ 6. fs.mkdirSync(mirOutputPath, { recursive: true })
  ├─ 7. writeMIR.applyDrafts() → { written, stateUpdated, errors, mergeEvents }
  ├─ 8. for each approvedDraft → vectorStore.storeDraft() (MSP/memory write)
  ├─ 9. combinedErrors = [...errors, ...vectorStoreErrors]
  ├─ 10. if (written.length === 0) → return json(res, 500, APPROVE_WRITE_FAILED)
  │
  │   ◀── HOOK INSERTION POINT (after step 10 guard passes) ──▶
  │     Load seed from disk (SEED_PATH)
  │     skeletonResult = await generateSkeletons(seed, approvedDrafts)
  │     skeletonsSummary = flatten(skeletonResult) → { generated[], failed[] }
  │
  ├─ 11. buildExecutionReadiness(approvedDrafts)
  ├─ 12. if (combinedErrors.length > 0 || mergeFallbackWarnings.length > 0)
  │       → return json(res, 200, { ..., skeletons: skeletonsSummary })   ← ADD HERE
  └─ 13. else
          → return json(res, 200, { ..., skeletons: skeletonsSummary })   ← ADD HERE
```

**Key observation:** `handleApprove` currently receives only `{ approvedDrafts, slug }` from `readBody(req)`. The seed is NOT passed in the approve request. The pattern established by the codebase is to load state from disk (e.g. `writeMIR.applyDrafts` reads template files via `MIR_TEMPLATES` path constant). Loading the seed from `SEED_PATH` at hook time is the natural extension of this pattern.

**Skeleton errors are explicitly non-fatal:** The hook must be wrapped in `try/catch`; any throw should produce `{ generated: [], failed: ['all'] }` without altering the 200 path. The existing `combinedErrors` array must NOT absorb skeleton failures (those live only in `skeletons.failed[]`).

**Response shape extension** — both `json(res, 200, ...)` calls at steps 12 and 13 gain the same `skeletons` field. No new response codes introduced.

---

### File 2: `onboarding/backend/agents/example-resolver.cjs`

**Current exports shape:**
```js
module.exports = { resolveExample, MODEL_SLUG, DEFAULT_BASE };
```

**Current `MODEL_SLUG` map (7 keys — verified from source):**
```js
const MODEL_SLUG = {
  'B2B':        'b2b',
  'B2C':        'b2c',
  'B2B2C':      'b2b2c',
  'DTC':        'dtc',
  'Marketplace':'marketplace',
  'SaaS':       'saas',
  'Agents-aaS': 'agents-aas',
};
```

**`resolveExample` contract (mirrored by `resolveSkeleton`):**
- Graceful degradation: unknown model → `''`; file not found → `''`; read error → `''`
- 4th parameter `basePath` overrides `DEFAULT_BASE` (used in tests with tmp dirs)
- File naming: `_{TEMPLATE}-{slug}.example.md` → `_SKELETON-{slug}.md` for skeletons

**New `resolveSkeleton` addition:**
```js
function resolveSkeleton(discipline, businessModel, basePath = DEFAULT_BASE) {
  const slug = MODEL_SLUG[businessModel];
  if (!slug) return '';

  const filePath = path.join(basePath, 'SKELETONS', discipline, `_SKELETON-${slug}.md`);
  if (!fs.existsSync(filePath)) return '';

  try {
    return fs.readFileSync(filePath, 'utf8').trim();
  } catch (_err) {
    return '';
  }
}
```

**Updated exports:**
```js
module.exports = { resolveExample, resolveSkeleton, MODEL_SLUG, DEFAULT_BASE };
```

---

### File 3: `onboarding/backend/path-constants.cjs`

**Current exports** (all confirmed from source):
`PROJECT_ROOT`, `ONBOARDING_DIR`, `BACKEND_DIR`, `PROTOCOL_DIR`, `TEMPLATES_DIR`, `MIR_TEMPLATES`, `MSP_TEMPLATES`, `LEGACY_LOCAL_DIR`, `MARKOS_LOCAL_DIR`, `COMPATIBILITY_LOCAL_DIRS`, `PROJECT_CONFIG_PATH`, `INSTALL_MANIFEST_PATH`, `CONFIG_PATH`, `SCHEMA_PATH`

**Missing constant (gap to fill):** `SEED_PATH` — the runtime seed file written by the submit flow and consumed by the skeleton hook. Confirmed gitignored (from STATE.md: "`.markos-local/, onboarding-seed.json, .markos-install-manifest.json excluded`").

**Addition needed:**
```js
const SEED_PATH = path.join(PROJECT_ROOT, 'onboarding-seed.json');
```
Add to `module.exports`.

---

### File 4: `onboarding/onboarding-seed.schema.json` — Relevant shape

```json
{
  "company": {
    "business_model": {
      "enum": ["B2B","B2C","B2B2C","DTC","Marketplace","SaaS","Agents-aaS"]
    }
  },
  "audience": {
    "pain_points": {
      "type": "array",
      "items": { "type": "string" },
      "maxItems": 3
    }
  }
}
```

**R004 validation rule** (from `handlers.cjs` line ~94): `audience.pain_points` must be an array of **minimum 2** items. So at generation time, `seed.audience.pain_points.length` is always 2 or 3.

**Accessor pattern in generator:**
```js
const businessModel = seed?.company?.business_model;  // string
const painPoints    = seed?.audience?.pain_points || []; // string[], length 2–3
```

---

### File 5: `.markos-local/MSP/` directory

Currently contains discipline folders + `WINNERS/` per discipline (scaffolded per STATE.md). The `SKELETONS/` subdirectory **does not exist** — it will be created by `generateSkeletons` using `fs.mkdirSync(outputDir, { recursive: true })`.

**Expected output path pattern:**
```
.markos-local/MSP/{discipline}/SKELETONS/_SKELETON-{model_slug}.md
```
Where `{model_slug}` is from `MODEL_SLUG[seed.company.business_model]`.

**Output filename convention (recommended):** Mirror the template filename — `_SKELETON-{model_slug}.md`. This is consistent with example files (`_PAID-ACQUISITION-b2b.example.md`) using underscored prefixes.

---

### File 6: `.planning/phases/40-multi-discipline-orchestrator-retrieval/40-CONTEXT.md`

The 5 canonical MSP discipline names (from D-40-01 channel→discipline map, used in handlers.cjs `DISCIPLINE_ALIASES`):

| Canonical Name | Alias key in handlers.cjs |
|----------------|--------------------------|
| `Paid_Media` | `paid_media` |
| `Content_SEO` | `content_seo` |
| `Lifecycle_Email` | `lifecycle_email` |
| `Social` | `social` |
| `Landing_Pages` | `landing_pages` |

These exact strings are used for `{discipline}` in all path operations. Confirm with `DISCIPLINE_ALIASES` in handlers.cjs (line 46).

---

## Architecture Patterns

### Recommended Module Structure

```
onboarding/backend/agents/skeleton-generator.cjs  ← NEW
.agent/markos/templates/SKELETONS/
  ├── Paid_Media/
  │   ├── _SKELETON-b2b.md
  │   ├── _SKELETON-b2c.md
  │   ├── _SKELETON-b2b2c.md
  │   ├── _SKELETON-dtc.md
  │   ├── _SKELETON-marketplace.md
  │   ├── _SKELETON-saas.md
  │   └── _SKELETON-agents-aas.md
  ├── Content_SEO/   (same 7)
  ├── Lifecycle_Email/ (same 7)
  ├── Social/        (same 7)
  └── Landing_Pages/ (same 7)
```

### Pattern 1: skeleton-generator.cjs module design

```js
'use strict';
const fs   = require('fs');
const path = require('path');
const { MARKOS_LOCAL_DIR, TEMPLATES_DIR } = require('../path-constants.cjs');
const { resolveSkeleton, MODEL_SLUG } = require('./example-resolver.cjs');

const DISCIPLINES = ['Paid_Media', 'Content_SEO', 'Lifecycle_Email', 'Social', 'Landing_Pages'];

function buildFrontmatter(discipline, businessModel, painPoints, generatedAt) {
  const ppLines = painPoints.map(pp => `  - "${pp.replace(/"/g, '\\"')}"`).join('\n');
  return [
    '---',
    `discipline: ${discipline}`,
    `business_model: ${businessModel}`,
    `generated_at: ${generatedAt}`,
    'pain_points:',
    ppLines,
    '---',
    '',
  ].join('\n');
}

function interpolatePainPoints(content, painPoints) {
  let result = content;
  // Replace slots where pain point exists
  painPoints.forEach((pp, i) => {
    result = result.replace(`{{pain_point_${i + 1}}}`, pp);
  });
  // Remove lines with unresolved placeholder slots (e.g. {{pain_point_3}} when only 2 declared)
  result = result
    .split('\n')
    .filter(line => !line.match(/\{\{pain_point_\d+\}\}/))
    .join('\n');
  return result;
}

async function generateSkeletons(seed, approvedDrafts, outputBasePath = MARKOS_LOCAL_DIR, templatesBasePath = TEMPLATES_DIR) {
  const businessModel = seed?.company?.business_model;
  const painPoints    = seed?.audience?.pain_points || [];
  const generatedAt   = new Date().toISOString();

  return DISCIPLINES.map(discipline => {
    const baseContent = resolveSkeleton(discipline, businessModel, templatesBasePath);
    if (!baseContent) {
      return { discipline, files: [], error: 'template_not_found' };
    }
    try {
      const slug      = MODEL_SLUG[businessModel];
      const outputDir = path.join(outputBasePath, 'MSP', discipline, 'SKELETONS');
      fs.mkdirSync(outputDir, { recursive: true });
      const fileName  = `_SKELETON-${slug}.md`;
      const filePath  = path.join(outputDir, fileName);
      const fm        = buildFrontmatter(discipline, businessModel, painPoints, generatedAt);
      const body      = interpolatePainPoints(baseContent, painPoints);
      fs.writeFileSync(filePath, fm + body, 'utf8');
      return { discipline, files: [filePath], error: null };
    } catch (err) {
      return { discipline, files: [], error: err.message };
    }
  });
}

module.exports = { generateSkeletons, interpolatePainPoints, buildFrontmatter };
```

**Note:** `generateSkeletons` is synchronous-in-practice (all fs ops are sync) but the signature is `async` to stay consistent with the await call-site in `handleApprove` and allow future async extension (e.g. telemetry emit).

### Pattern 2: handleApprove hook insertion

Insert between the `written.length === 0` guard (step 10) and `buildExecutionReadiness` (step 11). Three additions total:

```js
// (1) Add require at top of handlers.cjs
const { generateSkeletons } = require('./agents/skeleton-generator.cjs');
const { SEED_PATH } = require('./path-constants.cjs');

// (2) Hook block (insert after step 10's json 500 guard)
let skeletonsSummary = { generated: [], failed: [] };
try {
  let seed = {};
  if (fs.existsSync(SEED_PATH)) {
    seed = JSON.parse(fs.readFileSync(SEED_PATH, 'utf8'));
  }
  const skeletonResults = await generateSkeletons(seed, approvedDrafts);
  skeletonsSummary = skeletonResults.reduce(
    (acc, r) => {
      acc.generated.push(...r.files);
      if (r.error) acc.failed.push(r.discipline);
      return acc;
    },
    { generated: [], failed: [] }
  );
} catch (skeletonErr) {
  skeletonsSummary = { generated: [], failed: ['all'] };
}

// (3) Add `skeletons: skeletonsSummary` to BOTH json(res, 200, ...) calls
// Warning path:
return json(res, 200, {
  success: true, written, stateUpdated, errors: combinedErrors, mergeEvents,
  skeletons: skeletonsSummary,       // ← add
  handoff: { ... },
  outcome: createOutcome(...),
});

// Success path:
return json(res, 200, {
  success: true, written, stateUpdated, errors: [], mergeEvents,
  skeletons: skeletonsSummary,       // ← add
  handoff: { ... },
  outcome: createOutcome(...),
});
```

### Pattern 3: Base template structure

Every base template (`.agent/markos/templates/SKELETONS/{discipline}/_SKELETON-{slug}.md`) follows this skeleton:

```markdown
# {Discipline Friendly Name} — {Business Model} Starter Skeleton

## {Section 1 Heading}

{1–3 sentence prompt describing what to fill in.}

## {Section 2 Heading}

{1–3 sentence prompt.}

## {Section 3 Heading}

{1–3 sentence prompt.}

## Your Priority Challenges

The following are the client's declared priority pain points. Address each of these explicitly in your execution across this discipline.

### {{pain_point_1}}

### {{pain_point_2}}

### {{pain_point_3}}
```

The `{{pain_point_N}}` slots in the base template are ALWAYS 3 (the schema max). The `interpolatePainPoints` function replaces slots 1..N with actual strings and removes lines containing unresolved `{{pain_point_N}}` patterns, so a 2-pain-point seed yields two populated sub-headings and no orphan.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| YAML frontmatter serialization | Custom YAML generator | Simple `Array.join('\n')` string concat — no YAML library needed; values are plain strings with no nesting beyond the pain_points list |
| Template file detection | Glob-based discovery | Direct `fs.existsSync` per file — paths are deterministic from discipline + model_slug |
| Async file writes | Promise-based fs wrapper | Synchronous `fs.writeFileSync` — no I/O concurrency benefit here; keeps error handling simple |

---

## Inconsistencies Found

### Inconsistency A: Seed load path not specified in any canonical ref ⚠️

**What CONTEXT.md says:** `generateSkeletons(seed, approvedDrafts)` — seed is a parameter.  
**What handlers.cjs does:** `handleApprove` receives only `{ approvedDrafts, slug }` from the request body. There is no seed in the request.  
**Root cause:** The discussion assumed the seed would be available, but didn't specify from where.  
**Resolution:** Add `SEED_PATH = path.join(PROJECT_ROOT, 'onboarding-seed.json')` to `path-constants.cjs`. Load from disk in the hook block with a graceful fallback (`{}` if file doesn't exist). Do NOT extend the approve request body — this would require frontend changes and breaks the existing API contract.

---

### Inconsistency B: `approvedDrafts` parameter has no role in Phase 41 logic ℹ️

**What CONTEXT.md says:** Signature `generateSkeletons(seed, approvedDrafts)`.  
**What it implies:** `approvedDrafts` might be used for enrichment or conditioning.  
**Reality:** No mechanism in Phase 41 uses draft content to influence skeleton output. All generation is driven by `seed`.  
**Resolution:** Keep the parameter in the signature (forward-compatibility; Phase 43 may use it for literacy readiness). Document it as unused in Phase 41 with a `// reserved for future enrichment` comment.

---

### Inconsistency C: Dynamic placeholder count vs fixed base template slots ⚠️

**D-41-02 says:** Templates have `### {{pain_point_N}}` placeholders.  
**D-41-03 says:** "Inject exactly that many" (dynamic — 2 or 3).  
**Problem:** A base template with 3 fixed slots and a 2-pain-point seed produces an orphaned `{{pain_point_3}}` sub-heading unless the generator removes it.  
**Resolution (chosen):** Base templates hold exactly 3 `### {{pain_point_N}}` lines (the schema max). The `interpolatePainPoints` function filters out any line still containing `{{pain_point_\d+}}` after substitution. This satisfies D-41-03 (output has exactly seed-count sub-headings) while keeping base templates static.

---

### Inconsistency D: Output filename not specified ℹ️

**CONTEXT.md scope says:** Output goes to `.markos-local/MSP/{discipline}/SKELETONS/` — no filename given.  
**Milestone spec says:** Template stored as `_SKELETON-{model_slug}.md` — this naming applies to input (base templates).  
**Resolution:** Use the same filename for output: `_SKELETON-{model_slug}.md`. Consistent with `resolveExample` pattern where example files mirror the template they illustrate, and with `resolveSkeleton` path construction.

---

### Inconsistency E: YAML frontmatter `{pain_point_N}` notation in CONTEXT.md docs ℹ️

**D-41-04 shows:**
```yaml
pain_points:
  - {pain_point_1}
  - {pain_point_2}
```
**Intended meaning:** These are template documentation placeholders — NOT literal YAML values. The actual generated YAML must contain the real pain point strings from `seed.audience.pain_points`.  
**Resolution:** Generator writes actual string values from `seed.audience.pain_points` into the frontmatter `pain_points:` list, NOT placeholder tokens. The body section `{{pain_point_N}}` interpolation replaces with actual strings too. Both frontmatter and body use real values in output; placeholder syntax exists only in base templates.

---

## Skeleton Content Plan

### Authoring Pattern (applies to all 35 templates)

Each template follows the standard 3-section structure:
1. **Section 1** — Primary tactic section (highest-leverage action for this discipline × model)
2. **Section 2** — Secondary tactic or support section
3. **Section 3** — Channel-specific execution or qualification section
4. **`## Your Priority Challenges`** — Pain-point sub-heading block (always last, always 3 slots)

Section prompts are 1–3 sentences, written as imperative instructions for the client.

---

### `Paid_Media` Skeletons

| Model | Section 1 | Section 2 | Section 3 |
|-------|-----------|-----------|-----------|
| **B2B** | `## ABM Campaign Brief` — Describe the 2–3 target account segments you will run LinkedIn Ads against. Include industry, company size band, and job-title targeting logic. | `## Retargeting Framework` — Define the retargeting layers (site visitors, MQL list, event attendees) and the creative angle for each layer. | `## Conversion Tracking Setup` — List the conversion events you need to instrument (demo request, trial sign-up, form submit) and the measurement platform you'll use to attribute them. |
| **B2C** | `## Performance Campaign Brief` — Describe the audience segments for Meta and Google Ads. Include demographic ranges, interest clusters, and exclusion criteria. | `## Creative Cadence` — Outline the creative formats (video, static, carousel) and the refresh cycle to prevent ad fatigue across your campaign window. | `## ROAS Benchmarks` — Set your target ROAS, acceptable CPA, and the spend thresholds that trigger scale-up or pause decisions. |
| **B2B2C** | `## Dual-Audience Campaign Brief` — Define how your paid strategy splits between end-user acquisition and business-buyer/partner acquisition. Note the channels and budgets for each side. | `## Mid-Funnel Bridge Tactics` — Describe how paid retargeting converts engaged end-users into business-buyer referrals or upgrade signals. | `## Attribution Split` — Explain how you will attribute revenue to the B2C vs B2B acquisition paths and how you'll optimize budget allocation between them. |
| **DTC** | `## Direct Response Campaign Brief` — Describe the product offer, primary creative angle, and audience targeting for your top paid channel (Meta or TikTok). | `## Product Launch Ads Playbook` — Outline the pre-launch teaser, launch-day surge, and post-launch evergreen creative sequence for Meta/TikTok. | `## CAC & AOV Targeting Rules` — Set CAC ceiling, minimum AOV threshold for paid acquisition to be profitable, and any product exclusions from paid spend. |
| **Marketplace** | `## Supply-Side Acquisition Brief` — Describe your paid strategy for acquiring sellers, creators, or service providers. Include the channel mix and quality-gate for supply-side signups. | `## Demand-Side Campaign Brief` — Describe your paid strategy for attracting buyers to the marketplace. Include the intent-signal targeting and the conversion event. | `## Two-Sided Funnel Budget Split` — Define the budget ratio between supply acquisition and demand acquisition and the rebalancing trigger conditions. |
| **SaaS** | `## Trial Acquisition Campaign` — Describe the audience, offer (free trial / freemium tier), and primary paid channel for acquiring trial users. Include the trial-to-paid conversion KPI you'll optimize toward. | `## Free-to-Paid Upgrade Ads` — Outline the retargeting sequence targeting active trial users who haven't converted. Specify the creative angle and the upgrade CTA. | `## CAC/LTV Targeting Framework` — Define your CAC ceiling by plan tier, target LTV:CAC ratio, and the feature-adoption signal that indicates a trial user is high-conversion. |
| **Agents-aaS** | `## Developer Customer Acquisition Brief` — Describe paid channels suitable for developer audiences (Reddit, dev newsletters, API aggregator sponsorships) and the offer or hook that drives API sign-ups. | `## Usage-Tier Upsell Ads` — Define the retargeting trigger (user approaches or exceeds usage threshold) and the ad creative that drives upgrade to a higher tier. | `## Self-Serve Pipeline Attribution` — Set the conversion events you'll track through the self-serve funnel (signup → first API call → first production call → paid) and how you'll attribute and optimize each step. |

---

### `Content_SEO` Skeletons

| Model | Section 1 | Section 2 | Section 3 |
|-------|-----------|-----------|-----------|
| **B2B** | `## Thought Leadership Pillar Post` — Define the cornerstone piece of content (a guide, research report, or framework) that will earn backlinks and establish authority for your primary buyer persona. Include the target keyword cluster and the angle that differentiates it from existing content. | `## Keyword Research Matrix` — Divide your keyword targets into problem-aware (top of funnel) and solution-aware (mid/bottom of funnel) clusters. Map each cluster to a content type and a conversion goal. | `## Competitive Content Gap Analysis` — Identify 2–3 topics your competitors rank for where your product or perspective offers a meaningfully better answer. Outline the counter-content strategy. |
| **B2C** | `## Product & Category SEO Map` — List your top-priority product and category pages with target keywords, current ranking position (if known), and the on-page improvements needed. | `## Buyer Guide Content Plan` — Outline a buyer's guide or comparison article targeting high-intent decision-stage keywords that bridge organic discovery to product pages. | `## UGC & Review Integration Strategy` — Describe how you will surface user-generated content and customer reviews in SEO-adjacent pages to improve trust signals and thin-content pages. |
| **B2B2C** | `## Dual Persona Content Matrix` — Map content topics and formats to your end-user persona (top-of-funnel awareness) separately from your business-buyer persona (evaluation and case study). | `## Comparison & Versus Content Strategy` — Outline comparison pages, competitor alternative articles, and feature comparison tables targeting evaluation-stage searches from both personas. | `## Case Study SEO Plan` — Define how customer success stories will be structured for both keyword targeting and social proof. Include the business-buyer proof formats and the end-user story formats. |
| **DTC** | `## Product Story SEO Plan` — Describe the brand story and product origin narrative optimized for branded + long-tail searches. Include the keyword angle and the hero content format. | `## Collection & Category Keyword Structure` — Map product categories to SEO keyword clusters. Define URL structure, title tag patterns, and the internal linking logic between collection pages and blog content. | `## UGC & Review Integration Strategy` — Describe how product reviews, customer photos, and social proof will be embedded in product and category pages to improve organic rankings for long-tail buyer queries. |
| **Marketplace** | `## Listing Optimization Guide` — Define the SEO best-practice checklist for your marketplace listings (title, description, attribute completeness, image alt text). Include the keyword research approach for high-volume listing terms. | `## Marketplace SEO Tactics` — Outline the tactics for improving category and collection page rankings on your platform and in external search engines. Include structured data and schema markup priorities. | `## Editorial Content Flywheel` — Describe the blog or resource center strategy that drives organic traffic to marketplace category and seller landing pages. |
| **SaaS** | `## Documentation SEO Plan` — Define the documentation structure that captures bottom-of-funnel "how do I" searches. Include the keyword mapping for core feature docs and integration guides. | `## Integration & Feature Content Map` — Outline a content strategy for each integration partner and key feature, targeting the search queries of users evaluating your tool against competitors or seeking workflow solutions. | `## Comparison & Alternative Pages` — Define a set of "[Competitor] alternative" and "[Your product] vs [Competitor]" pages targeting high-intent evaluation queries. Include the SEO and positioning angle for each. |
| **Agents-aaS** | `## Developer Documentation SEO` — Map your API reference, quickstart, and use-case documentation to the search queries developers use when evaluating or adopting your API. Include the keyword priorities. | `## API Use Case Content Map` — Define a content library of use-case tutorials, integration walkthroughs, and demo notebooks targeting developer-audience search queries across your top verticals. | `## Developer Community & Q&A SEO` — Describe your strategy for building SEO authority through developer forum participation (Stack Overflow, GitHub Discussions) and owned technical blog content. |

---

### `Lifecycle_Email` Skeletons

| Model | Section 1 | Section 2 | Section 3 |
|-------|-----------|-----------|-----------|
| **B2B** | `## SDR Outbound Sequence` — Define the 5-step outbound email sequence for new MQLs. Include the hook, value prop, social proof, and breakup email structure. Specify send cadence and follow-up logic. | `## MQL Nurture Track` — Outline the 4–6 email drip sequence for inbound leads not yet ready to book a demo. Include the content types (case study, ROI calculator, testimonial) and the demo-request CTA placement. | `## Win-back Campaign` — Describe the re-engagement sequence for churned or ghosted opportunities. Include the incentive or new angle, send timing, and disqualification criteria. |
| **B2C** | `## Welcome Series` — Define the 3-email welcome sequence for new subscribers. Include the brand introduction, primary value prop reveal, and first purchase CTA. Specify subject line approach and send-time logic. | `## Promotional Cadence` — Outline the promotional email broadcast schedule (seasonal, flash sale, loyalty). Define frequency caps, segmentation rules, and the creative approach for each campaign type. | `## Re-engagement Campaign` — Describe the win-back sequence for subscribers inactive for 60+ days. Include the incentive, segmentation criteria, and unsubscription logic to protect list health. |
| **B2B2C** | `## B2C Welcome + Education Series` — Define the welcome and onboarding sequence for end-users. Include the product benefit introduction, usage tips, and the upgrade-to-business trigger message. | `## Business Buyer Upgrade Trigger Sequence` — Outline the automated sequence that fires when an end-user exhibits business-buyer signals (team invite, bulk usage, API access). Specify the upgrade angle and B2B CTA. | `## Cross-Side Notification Cadence` — If your model involves both sellers and buyers / creators and consumers, describe the notification and engagement email cadence tailored to each side. |
| **DTC** | `## Post-Purchase Flow` — Define the post-purchase email sequence: order confirmation, shipping update, delivery check-in, review request, and first cross-sell or repeat-purchase prompt. Include timing for each step. | `## Abandoned Cart Sequence` — Outline the 3-step abandoned cart recovery sequence. Include the timing intervals, objection-handling angle for each email, and the discount or urgency tactic used at each step. | `## Loyalty Program & VIP Cadence` — Describe the email touchpoints for customers who reach loyalty milestones (second purchase, anniversary, top-spender tier). Include the reward mechanics and upgrade triggers. |
| **Marketplace** | `## Seller Onboarding Sequence` — Define the email drip that activates new sellers: account setup completion prompts, best-practice guides, first-listing milestone, and "ready to launch" confirmation. | `## Buyer Nurture & Repeat-Purchase Series` — Outline the email triggers for buyers after first purchase: review request, saved-search alert, restock notification, and seasonal re-engagement. | `## Platform Health & Safety Notifications` — Describe the transactional and trust email templates for listing approvals, flagged content, and policy updates that keep both marketplace sides compliant and engaged. |
| **SaaS** | `## Trial Onboarding Drip` — Define the in-trial email sequence (days 1, 3, 7, 14) that drives users to their first "aha moment." Map each email to a specific feature adoption milestone. | `## Feature Adoption Series` — Outline the triggered email sequence that fires when a user activates a new feature. Include the use-case angle, in-product tutorial link, and success confirmation. | `## Churn Intervention Sequence` — Describe the early-warning churn signal triggers (inactivity, declining usage, failed payment) and the email response for each. Include the save offer and cancellation feedback capture. |
| **Agents-aaS** | `## API Onboarding Sequence` — Define the email drip from API key creation through first production call. Map emails to developer milestones (first successful call, first integration deployed, first real workload run). | `## Usage Milestone & Upgrade Emails` — Outline the triggered emails at usage thresholds: approaching plan limit, exceeding tier, first month of consistent usage. Include the upgrade angle for each. | `## Developer Retention & Community Emails` — Describe the monthly roundup cadence (new endpoints, changelog, community highlights) and the annual renewal or contract renewal reminder sequence. |

---

### `Social` Skeletons

| Model | Section 1 | Section 2 | Section 3 |
|-------|-----------|-----------|-----------|
| **B2B** | `## LinkedIn Thought Leadership Cadence` — Define the weekly posting rhythm for company page and executive personal brand. Include the post format mix (insight post, data post, storytelling post) and the ICP-resonance angle. | `## LinkedIn Event & Webinar Promotion` — Outline the 3-week social promotion sequence for an event or webinar: pre-announcement, registration push, and post-event content repurposing. | `## Employee Advocacy Activation` — Describe the system for activating employee and founder voices on LinkedIn: suggested post topics, share cadence, and the amplification signal you'll track. |
| **B2C** | `## Instagram & TikTok Product Content Calendar` — Define the weekly content rhythm across short-form video and static formats. Include the content pillars, posting frequency per platform, and the engagement hook pattern. | `## Community Building Plan` — Outline the strategy for building an owned community (comments, DM outreach, brand hashtag, or group). Include the community management cadence and the conversion path from community member to buyer. | `## Seasonal & Trend Campaign Playbook` — Describe how you will plan and produce reactive content for seasonal moments and viral trends while maintaining brand consistency. Include the go/no-go decision framework. |
| **B2B2C** | `## Platform-Split Social Strategy` — Define the social channels and content angle for reaching end-users (brand awareness, lifestyle content) separately from business buyers (case studies, ROI-led content, LinkedIn). | `## Co-Marketing & Partner Social Cadence` — Outline the social amplification strategy for joint campaigns with business partners or channel partners. Include the content handoff protocol and co-branding rules. | `## User Spotlight & Case Study Series` — Describe the recurring social content series that celebrates customer success stories — differentiated by end-user stories (emotional, aspirational) and business-buyer stories (outcomes, ROI). |
| **DTC** | `## UGC Brief` — Define the call-to-action and incentive structure for generating user content. Include the hashtag, the creative brief, and the curation-to-publication workflow. | `## Influencer Outreach Sequence` — Outline the prospecting, outreach, briefing, and content approval process for micro and mid-tier influencer activations. Include the brief structure and approval criteria. | `## Product Drop Social Plan` — Describe the social media countdown, launch-day posting sequence, and post-drop engagement tactics for new product releases. |
| **Marketplace** | `## Dual-Sided Social Campaign` — Define how your social content addresses both sellers/creators and buyers/consumers. Include the platform split, content mix, and the call-to-action for each side. | `## Seller Spotlight Series` — Outline the recurring content format celebrating top sellers or creators on your platform. Include the production cadence, story angle, and cross-promotion agreement. | `## Buyer Testimonial & UGC Amplification` — Describe the system for surfacing and amplifying buyer reviews and user-generated content across social channels. Include the curation criteria and the repurposing workflow. |
| **SaaS** | `## Product Hunt & Launch Day Playbook` — Define the pre-launch hunter outreach, launch-day posting sequence on Product Hunt and Twitter/X, and the 48-hour post-launch engagement plan. | `## Twitter/X Founder + ICP Community Plan` — Outline the weekly cadence for founder-led and company-page social content on Twitter/X: insight threads, product updates, ICP question engagement. | `## Changelog & Feature Announcement Social` — Describe the social template and distribution workflow for publishing product updates. Include the format for minor releases and major feature launches. |
| **Agents-aaS** | `## Developer Advocacy Content Plan` — Define the technical content series (demos, use-case threads, API tutorials) published on Twitter/X, LinkedIn, and developer communities. Include the posting frequency and the technical depth level per format. | `## GitHub & Community Engagement Cadence` — Outline the strategy for maintaining developer community presence: GitHub Discussions, Reddit (r/programming, r/MachineLearning), Discord, and similar channels. Include the response SLA and proactive outreach triggers. | `## Integration Partner Co-Promotion` — Describe the social amplification plan for integration partnerships. Include the announcement format, partner tag protocol, and the cross-promotion cadence. |

---

### `Landing_Pages` Skeletons

| Model | Section 1 | Section 2 | Section 3 |
|-------|-----------|-----------|-----------|
| **B2B** | `## Demo Request Page Brief` — Define the headline approach, hero value prop, proof elements (customer logos, testimonials, case study excerpt), and form field count for your primary demo request page. Include the CTA copy direction. | `## Case Study Hub Brief` — Outline the structure of your case study listing page: filtering/sorting by industry and use case, case study card format, and the conversion action at the end of each story. | `## ROI Calculator or Assessment Page` — Describe the interactive tool (calculator, quiz, or diagnostic) that creates a personalized value statement for your ICP. Include the output format, data inputs, and gate/no-gate decision. |
| **B2C** | `## Product Landing Page Template` — Define the narrative arc of your primary product landing page: hook, outcome statement, social proof, feature showcase, objection handling, and CTA. Include the page flow and the primary conversion metric. | `## Seasonal Promotion Page Brief` — Outline the page structure for a time-limited promotional event: urgency mechanism, offer clarity, trust signals, and mobile-first CTA placement. | `## Referral or Loyalty Landing Page` — Describe the landing page for your referral program or loyalty activation. Include the incentive presentation, sharing mechanic, and conversion event definition. |
| **B2B2C** | `## Dual-CTA Landing Page Brief` — Define how a single landing page serves both end-users (free/self-serve CTA) and business buyers (demo/contact CTA). Include the page structure, audience signal detection, and CTA placement hierarchy. | `## Partner or Reseller Signup Page` — Outline the landing page for recruiting channel partners, resellers, or franchise partners. Include the value proposition for the supplier side and the qualification form. | `## End-User Proof Gallery` — Describe the social proof landing page that aggregates end-user success stories, ratings, and testimonials to support both organic SEO and paid retargeting flows. |
| **DTC** | `## Product Launch Landing Page` — Define the narrative arc for a new product launch: pre-launch waitlist version and live-launch version. Include the offer, hero image direction, social proof, and urgency mechanism. | `## Flash Sale or Limited-Time Offer Page` — Outline the page structure for a time-bounded promotion: countdown timer placement, product selection criteria, urgency copy, and post-sale follow-up capture. | `## Subscription or Bundle Offer Page` — Describe the landing page structure for a subscription or bundle upsell: savings quantification, comparison to one-time purchase, and trial or cancellation-risk reduction copy. |
| **Marketplace** | `## Seller Signup Landing Page` — Define the value proposition, trust signals (average earnings, success stories, fee structure), and onboarding friction reduction for the seller/creator sign-up page. | `## Buyer Feature or Category Landing Page` — Outline the landing page for a product category or feature announcement targeting buyers. Include the discovery hook, social proof format, and call-to-browse or call-to-buy CTA. | `## Trust & Safety Landing Page` — Describe the dedicated page explaining your marketplace's buyer and seller protection policies. This page supports paid retargeting and SEO for trust-sensitive queries. |
| **SaaS** | `## Free Trial Signup Page` — Define the above-fold hook, feature highlights, proof elements, and form design for your primary free trial signup page. Include the trial length, credit-card-required decision, and CTA copy direction. | `## Pricing Comparison Page Brief` — Outline the tier structure, feature comparison table, value anchoring copy, and FAQ sections for your pricing page. Include the upgrade trigger placement and annual vs monthly toggle logic. | `## Integration or Use Case Landing Page` — Describe the landing page template for individual integration partner pages or use-case-specific pages. Include the SEO structure, pain-point-first headline approach, and the demo/trial CTA. |
| **Agents-aaS** | `## Developer Quickstart Landing Page` — Define the landing page structure for developers evaluating your API: elevator pitch, live code snippet, curl example, authentication method, and primary CTA (API key signup, docs, or sandbox). | `## API Pricing Page Brief` — Outline the pricing page structure for usage-based billing: tier explanation, unit definition (requests, tokens, tasks), overage policy, enterprise contact CTA, and the FAQs that reduce upgrade friction. | `## Integration Use Case Page Template` — Describe the landing page template for specific integration walkthroughs (e.g. "Build an AI email responder with [API]"). Include the SEO structure, code block placement, and conversion path. |

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | `node:test` (built-in) + `node:assert/strict` |
| Config file | none — glob invocation |
| Quick run command | `node --test test/skeleton-generator.test.js` |
| Full suite command | `node --test test/**/*.test.js` |

### New Test File: `test/skeleton-generator.test.js`

#### T-41-01: `resolveSkeleton` unit tests (mirrors example-resolver suite pattern)

```js
test('Suite N: resolveSkeleton', async (t) => {

  await t.test('N.1 resolves correct base template for known discipline + model', () => {
    const dir = makeTmpDir();
    const skelDir = path.join(dir, 'SKELETONS', 'Paid_Media');
    fs.mkdirSync(skelDir, { recursive: true });
    fs.writeFileSync(path.join(skelDir, '_SKELETON-b2b.md'), '## ABM Campaign Brief\n\nPrompt text.');

    const result = resolveSkeletonFn('Paid_Media', 'B2B', dir);

    assert.ok(result.includes('ABM Campaign Brief'));
    fs.rmSync(dir, { recursive: true, force: true });
  });

  await t.test('N.2 returns empty string for unknown business model', () => {
    const result = resolveSkeletonFn('Paid_Media', 'UnknownModel', '/any/dir');
    assert.strictEqual(result, '');
  });

  await t.test('N.3 returns empty string for missing template file', () => {
    const dir = makeTmpDir();
    const result = resolveSkeletonFn('Paid_Media', 'B2B', dir);
    assert.strictEqual(result, '');
    fs.rmSync(dir, { recursive: true, force: true });
  });

  await t.test('N.4 resolves Agents-aaS slug (agents-aas)', () => {
    const dir = makeTmpDir();
    const skelDir = path.join(dir, 'SKELETONS', 'Social');
    fs.mkdirSync(skelDir, { recursive: true });
    fs.writeFileSync(path.join(skelDir, '_SKELETON-agents-aas.md'), '## Developer Advocacy\n\nContent.');
    const result = resolveSkeletonFn('Social', 'Agents-aaS', dir);
    assert.ok(result.includes('Developer Advocacy'));
    fs.rmSync(dir, { recursive: true, force: true });
  });
});
```

#### T-41-02: `generateSkeletons` per-model output test

```js
await t.test('N.5 generateSkeletons writes 5 output files for a valid seed', async () => {
  const seedDir = makeTmpDir();
  const outDir  = makeTmpDir();
  const templatesDir = makeTmpDir();

  // Seed all 35 base templates into tmp templates dir
  const DISCIPLINES = ['Paid_Media','Content_SEO','Lifecycle_Email','Social','Landing_Pages'];
  const SLUGS = ['b2b','b2c','b2b2c','dtc','marketplace','saas','agents-aas'];
  for (const d of DISCIPLINES) {
    const skelDir = path.join(templatesDir, 'SKELETONS', d);
    fs.mkdirSync(skelDir, { recursive: true });
    for (const s of SLUGS) {
      fs.writeFileSync(path.join(skelDir, `_SKELETON-${s}.md`),
        `## Section\n\nPrompt.\n\n## Your Priority Challenges\n\n### {{pain_point_1}}\n\n### {{pain_point_2}}\n\n### {{pain_point_3}}\n`
      );
    }
  }

  const seed = {
    company: { business_model: 'B2B' },
    audience: { pain_points: ['unclear attribution', 'slow sales cycle'] },
  };

  const result = await generateSkeletons(seed, {}, outDir, templatesDir);

  assert.strictEqual(result.length, 5, 'should return results for all 5 disciplines');
  assert.ok(result.every(r => r.files.length === 1), 'each discipline should produce 1 file');

  for (const r of result) {
    const filePath = r.files[0];
    assert.ok(fs.existsSync(filePath), `output file should exist: ${filePath}`);
    const content = fs.readFileSync(filePath, 'utf8');
    assert.ok(content.startsWith('---'), 'output should start with YAML frontmatter');
    assert.ok(content.includes('discipline: ' + r.discipline));
    assert.ok(content.includes('business_model: B2B'));
  }

  fs.rmSync(outDir, { recursive: true, force: true });
  fs.rmSync(templatesDir, { recursive: true, force: true });
});
```

#### T-41-03: Pain-point injection produces valid markdown

```js
await t.test('N.6 interpolatePainPoints replaces all slots and removes orphans', () => {
  const base = [
    '## Section',
    '',
    'Prompt text.',
    '',
    '## Your Priority Challenges',
    '',
    '### {{pain_point_1}}',
    '',
    '### {{pain_point_2}}',
    '',
    '### {{pain_point_3}}',
  ].join('\n');

  const result = interpolatePainPoints(base, ['unclear attribution', 'high churn']);

  assert.ok(result.includes('### unclear attribution'), 'pain point 1 should be replaced');
  assert.ok(result.includes('### high churn'), 'pain point 2 should be replaced');
  assert.ok(!result.includes('{{pain_point_3}}'), 'orphaned slot 3 should be removed');
  assert.ok(!result.includes('{{pain_point_'), 'no remaining placeholder tokens');
  // Validate it's still a parseable markdown structure
  assert.ok(result.includes('## Your Priority Challenges'));
});
```

#### T-41-04: Post-approval hook integration test

```js
await t.test('N.7 handleApprove response includes skeletons block', async () => {
  // Setup temp dirs  
  const env = createTestEnvironment();
  // ... seed MIR templates and seed.json into env.dir ...

  const mockSkeletons = { generated: ['path/A.md', 'path/B.md'], failed: [] };

  await withMockedModule(
    path.resolve(__dirname, '../onboarding/backend/agents/skeleton-generator.cjs'),
    {
      generateSkeletons: async () => [
        { discipline: 'Paid_Media', files: ['path/A.md'], error: null },
        { discipline: 'Content_SEO', files: ['path/B.md'], error: null },
        { discipline: 'Lifecycle_Email', files: [], error: 'template_not_found' },
        { discipline: 'Social', files: [], error: 'template_not_found' },
        { discipline: 'Landing_Pages', files: [], error: 'template_not_found' },
      ],
    },
    async () => {
      // Load handler via fresh require
      const { handleApprove } = require('../onboarding/backend/handlers.cjs');
      const req = createJsonRequest({ approvedDrafts: { company_profile: '## Test\n\nContent' } }, '/approve');
      const res = createMockResponse();
      await handleApprove(req, res);

      const payload = JSON.parse(res.body);
      assert.ok('skeletons' in payload, 'response should include skeletons field');
      assert.ok(Array.isArray(payload.skeletons.generated), 'skeletons.generated should be array');
      assert.ok(Array.isArray(payload.skeletons.failed), 'skeletons.failed should be array');
    }
  );
  env.cleanup();
});
```

#### T-41-05: Non-fatal skeleton failure preserves 200 response

```js
await t.test('N.8 skeleton generation failure does not affect HTTP 200 response', async () => {
  await withMockedModule(skeletonGeneratorPath, {
    generateSkeletons: async () => { throw new Error('disk full'); }
  }, async () => {
    // ... same pattern as T-41-04 ...
    // Assert res.statusCode === 200
    // Assert payload.skeletons.failed deep equals ['all']
    // Assert payload.success === true
  });
});
```

### Phase Requirements → Test Map

| Req | Behavior | Test Type | File | Automated Command |
|-----|----------|-----------|------|-------------------|
| D-41-07 | `resolveSkeleton` returns `''` on missing file | unit | `test/skeleton-generator.test.js` | `node --test test/skeleton-generator.test.js` |
| D-41-03 | Dynamic placeholder count: 2 pain points → 2 sub-headings | unit | same | same |
| D-41-04 | Generated file has valid YAML frontmatter | unit | same | same |
| D-41-05 | All 5 disciplines generated regardless of seed | integration | same | same |
| D-41-06 | Skeleton failure non-fatal; HTTP 200 preserved | integration | same | same |
| D-41-06 | Response includes `skeletons: { generated[], failed[] }` | integration | `test/onboarding-server.test.js` or `test/skeleton-generator.test.js` | `node --test test/**/*.test.js` |

### Wave 0 Gaps

- [ ] `test/skeleton-generator.test.js` — new file; covers T-41-01 through T-41-05
- No framework gaps (node:test is available in current Node version)

---

## Environment Availability

Step 2.6: SKIPPED — all work is code + file authoring; no external services or CLI tools are required beyond Node.js (already confirmed operational from test suite).

---

## Common Pitfalls

### Pitfall 1: SEED_PATH file absent at approve time

**What goes wrong:** `handleApprove` loads `SEED_PATH` and the file does not exist (e.g. tests, or approve called before submit).  
**Why it happens:** `onboarding-seed.json` is only written by the submit flow. If approve is called in isolation (tests, CI, manual testing), the file won't exist.  
**How to avoid:** Guard with `if (fs.existsSync(SEED_PATH)) seed = JSON.parse(...)` — if absent, pass empty seed `{}` to `generateSkeletons`. The generator will call `resolveSkeleton` with `businessModel = undefined`, get `''`, and return all 5 disciplines in `failed[]`. The approve response still returns 200.

### Pitfall 2: require.cache invalidation order in tests

**What goes wrong:** `withMockedModule` injects a mock, but handlers.cjs still holds a cached reference to the real `skeleton-generator.cjs` (required at module parse time via top-level require).  
**Why it happens:** Node.js caches modules on first require. If `handlers.cjs` uses a top-level `const { generateSkeletons } = require('./agents/skeleton-generator.cjs')`, the mock won't intercept it — the cached reference is already bound.  
**How to avoid:** In `handlers.cjs`, use a **lazy require** inside the hook block: `const { generateSkeletons } = require('./agents/skeleton-generator.cjs');` placed inside the try block (not at module top-level). This mirrors the existing pattern in `handleApprove` for `vector-store-client.cjs` (line ~1328: `const vectorStore = require('./vector-store-client.cjs');`).

### Pitfall 3: Discipline name case mismatch in path construction

**What goes wrong:** `generateSkeletons` uses `'paid_media'` instead of `'Paid_Media'` → writes to wrong directory; `resolveSkeleton` can't find the template.  
**Why it happens:** `DISCIPLINE_ALIASES` in handlers.cjs maps lowercase aliases to canonical names. Generator must use canonical names exclusively.  
**How to avoid:** Hard-code the canonical 5 names in `skeleton-generator.cjs`: `['Paid_Media', 'Content_SEO', 'Lifecycle_Email', 'Social', 'Landing_Pages']`.

### Pitfall 4: YAML frontmatter with unescaped special characters

**What goes wrong:** A pain point containing `:`, `"`, or `#` (e.g. `"#1 problem: attribution"`) breaks YAML parsing if the value is unquoted.  
**Why it happens:** Simple string concatenation into YAML doesn't escape values.  
**How to avoid:** Wrap pain point values in double quotes in the frontmatter and escape internal double quotes: `"${pp.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`. *(Already shown in the `buildFrontmatter` code pattern above.)*

### Pitfall 5: Windows path separator in output paths stored in `generated[]`

**What goes wrong:** `generated[]` paths use `\` on Windows; downstream consumers expecting `/` separators fail.  
**Why it happens:** `path.join` on Windows returns backslash paths. The `generated[]` array is returned in the API response.  
**How to avoid:** The paths in `generated[]` are informational strings in the API response; no downstream code parses them. Use `path.join` as-is and document that these are OS-native paths. (If forward-slash normalization is needed, apply `.replace(/\\/g, '/')` only on the API-response values, not on the filesystem calls.)

---

## Sources

### Primary (HIGH confidence)
- Direct codebase read: `onboarding/backend/handlers.cjs` (lines 1270–1515) — `handleApprove` full flow
- Direct codebase read: `onboarding/backend/agents/example-resolver.cjs` — `MODEL_SLUG` map, `resolveExample` contract, current exports
- Direct codebase read: `onboarding/backend/path-constants.cjs` — all exported constants, `SEED_PATH` gap confirmed
- Direct codebase read: `onboarding/onboarding-seed.schema.json` — `audience.pain_points` shape and `company.business_model` enum
- Direct codebase read: `test/setup.js` — `withMockedModule` implementation pattern
- Direct codebase read: `test/example-resolver.test.js` — tmp-dir test pattern for resolver
- Direct codebase read: `.planning/phases/40-multi-discipline-orchestrator-retrieval/40-CONTEXT.md` — canonical discipline names
- Direct codebase read: `.planning/config.json` — `nyquist_validation: true` confirmed

---

## Metadata

**Confidence breakdown:**
- Code archaeology: HIGH — all files read directly from source
- Hook insertion architecture: HIGH — handleApprove flow fully mapped
- Skeleton content plan (35 templates): HIGH for headings, MEDIUM for prompt specificity (final wording is authoring task)
- Test patterns: HIGH — mirrors existing resolver test suite

**Research date:** 2026-04-01  
**Valid until:** 2026-05-01 (or until handlers.cjs handleApprove is modified by another phase)
