# Phase 108: Industry Overlay Packs — Research

**Researched:** 2026-04-15
**Domain:** Content authoring + pack manifest structure + loader integration
**Confidence:** HIGH (all findings verified directly against live codebase)

---

<user_constraints>
## User Constraints (from 108-CONTEXT.md)

### Locked Decisions

- **D-01:** All 4 industry overlays cover all 5 disciplines uniformly (Paid_Media, Content_SEO, Lifecycle_Email, Social, Landing_Pages).
- **D-02:** All disciplines set to completeness `"partial"` in pack manifests — consistent with Phase 107.
- **D-03:** No discipline skipped or set to `"stub"` — uniform authoring contract across all 4 verticals.
- **D-04:** `overlayFor` mappings locked:
  - `travel` → `["b2c", "b2b"]`
  - `it` → `["b2b", "saas", "services"]`
  - `marketing-services` → `["agency", "b2b"]`
  - `professional-services` → `["services", "b2b"]`
- **D-05:** `INDUSTRY_ALIAS_MAP` in `pack-loader.cjs` is already stubbed — Phase 108 only adds overlay files, no loader code changes.
- **D-06:** Professional Services overlay is a thin delta on the Services base pack: adds RFP culture, rate card dynamics, credentialing as proof posture, peer referral as primary acquisition. Does NOT re-author core services funnel framing.
- **D-07:** Industry overlay skeletons are fully standalone — 4 prompts per discipline per vertical, same format as Phase 107 base family skeletons. No runtime dependency between base and overlay skeleton files.

### Claude's Discretion

- Tone doc naming convention: follow `TPL-SHARED-overlay-{slug}` pattern → `TPL-SHARED-overlay-industry-{slug}.md`
- Slug formatting: hyphenated lowercase — `marketing-services`, `professional-services`
- `operatorNotes` field content per pack
- Overlay packs may reuse `TPL-SHARED-tone-and-naturality.md` and `TPL-SHARED-proof-posture.md` as shared fallbacks for `assets.baseDoc` / `assets.proofDoc`

### Deferred Ideas (OUT OF SCOPE)

- Channel-aware partial vs stub completeness per discipline+vertical combo
- Universal `overlayFor` (apply any overlay to any base family)
- Addendum-style skeleton files

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| LIB-02 | MarkOS supports industry overlays for at least Travel, IT, Marketing Services, and Professional Services in the first milestone cut. | Verified: loader's `resolvePackSelection()` already resolves industry slugs via `INDUSTRY_ALIAS_MAP` and `resolveIndustryOverlay()`. Activation requires only creating `industries/{slug}.industry.json` files. |
| LIB-04 | Library assets are versioned and composable using one base family plus one vertical overlay without duplicating the existing template architecture. | Verified: overlay packs reference shared base/proof docs; standalone skeletons avoid duplication; `resolvePackSelection()` returns both `basePack` and `overlayPack` slugs separately. |

</phase_requirements>

---

## Summary

Phase 108 is a content authoring phase, not a library-selection phase. All infrastructure from Phases 106 and 107 is already in place. The only missing deliverables are: 4 overlay manifest files, 4 tone documents, and 20 skeleton PROMPTS.md files (4 verticals × 5 disciplines).

The most important finding from code inspection is a **file format and location split** that the CONTEXT.md describes ambiguously: base family packs are `*.pack.json` in the `lib/markos/packs/` root (read by `getFamilyRegistry()`), while industry overlay packs must be `{slug}.industry.json` files inside a `lib/markos/packs/industries/` subdirectory (checked by `resolvePackSelection()` via `fs.existsSync()`). These are two different file types at two different paths. Putting overlays in the root as `*.pack.json` files would break the existing test suite (test 106.1 expects exactly 7 entries) and would NOT activate overlay resolution.

A secondary finding: the loader only performs existence-check on `.industry.json` files — it does not parse, validate, or consume their content at Phase 108 runtime. Schema compliance in the manifest JSON is a forward-compatibility requirement for Phase 109/110 (operator UI needs display names and completeness), not a Phase 108 runtime enforcement.

**Primary recommendation:** Create `lib/markos/packs/industries/` directory; create 4 `.industry.json` manifests there following the pack schema; create 4 tone docs as `TPL-SHARED-overlay-industry-{slug}.md`; create 20 PROMPTS.md skeleton files under `onboarding/templates/SKELETONS/industries/{slug}/{Discipline}/`; add Suite 108 tests to `test/pack-loader.test.js`.

---

## Critical Architectural Finding: Overlay File Location

> **This is the most important finding in this research document and must drive file placement decisions.**

The loader currently has **two separate systems** for pack files:

### System 1 — Base Family Packs (`getFamilyRegistry()`)
```
lib/markos/packs/*.pack.json          ← scanned by getFamilyRegistry()
```
- File extension: `.pack.json`
- Location: root of `lib/markos/packs/`
- Loaded by: `fs.readdirSync(PACKS_DIR).filter(f => f.endsWith('.pack.json'))`
- Schema-validated: Yes, via Ajv at load time
- Currently: 7 files (agency, b2b, b2c, ecommerce, info-products, saas, services)
- Test 106.1 asserts: **exactly 7 entries** — adding any `*.pack.json` here breaks this test

### System 2 — Industry Overlay Packs (`resolvePackSelection()`)
```
lib/markos/packs/industries/{slug}.industry.json    ← checked by resolvePackSelection()
```
- File extension: `.industry.json`
- Location: `industries/` subdirectory (does not yet exist — must be created)
- Checked by: `fs.existsSync(path.join(__dirname, 'industries', overlaySlug + '.industry.json'))`
- Schema-validated: **No** — loader only calls `existsSync()`, never reads content
- Currently: directory does not exist; all 4 overlays return `overlayPack: null`

**Exact loader code (lines 258–271 of pack-loader.cjs):**
```javascript
const overlaySlug = resolveIndustryOverlay(industry);

if (overlaySlug) {
  const overlayFilePath = path.join(__dirname, 'industries', overlaySlug + '.industry.json');
  const overlayExists   = fs.existsSync(overlayFilePath);

  if (!overlayExists) {
    console.warn(
      '[pack-loader] Industry overlay pack "' + overlaySlug + '" not found — using base-only (' + baseSlug + ')'
    );
  }

  return {
    basePack:    baseSlug,
    overlayPack: overlayExists ? overlaySlug : null,
    ...
  };
}
```

**Conclusion:** Phase 108 creates `.industry.json` files in `lib/markos/packs/industries/`. The `*.pack.json` root is strictly base-family territory.

---

## Standard Stack

### Core (all already installed — zero new dependencies)

| Asset | Version | Role |
|-------|---------|------|
| `lib/markos/packs/pack-schema.json` | Phase 106 | Ajv Draft-07 schema; overlay packs use `type: "overlay"`, `overlayFor` field |
| `lib/markos/packs/pack-loader.cjs` | Phase 106 | Singleton loader; `INDUSTRY_ALIAS_MAP` and `resolveIndustryOverlay()` already operational |
| `node:test` + `assert/strict` | Node built-in | Test framework used by existing `test/pack-loader.test.js` Suite 106 |

No new npm dependencies required.

---

## Architecture Patterns

### Pack Manifest Structure — Industry Overlay (`.industry.json`)

**Reference:** `lib/markos/packs/b2b.pack.json` (v1.1.0) as format reference; `pack-schema.json` for required fields.

```json
{
  "slug": "travel",
  "version": "1.0.0",
  "displayName": "Travel & Hospitality",
  "type": "overlay",
  "aliases": ["travel", "hospitality", "tourism", "hotels"],
  "industries": ["travel"],
  "disciplines": ["Paid_Media", "Content_SEO", "Lifecycle_Email", "Social", "Landing_Pages"],
  "completeness": {
    "Paid_Media": "partial",
    "Content_SEO": "partial",
    "Lifecycle_Email": "partial",
    "Social": "partial",
    "Landing_Pages": "partial"
  },
  "assets": {
    "baseDoc": ".agent/markos/literacy/Shared/TPL-SHARED-tone-and-naturality.md",
    "proofDoc": ".agent/markos/literacy/Shared/TPL-SHARED-proof-posture.md",
    "overlayDoc": ".agent/markos/literacy/Shared/TPL-SHARED-overlay-industry-travel.md",
    "skeletonDir": "onboarding/templates/SKELETONS/industries/travel/"
  },
  "fallbackAllowed": false,
  "overlayFor": ["b2c", "b2b"],
  "dependencies": [],
  "operatorNotes": "Best composed with B2C or B2B base family. Adds destination aspiration, seasonal urgency framing, and review-based social proof posture.",
  "changelog": [
    { "version": "1.0.0", "date": "2026-04-15", "summary": "Phase 108: initial Travel & Hospitality industry overlay pack" }
  ]
}
```

**Key differences from base packs:**
- `type: "overlay"` (not `"base"`)
- `overlayFor`: array of base pack slugs (not null)
- `fallbackAllowed: false` — overlays are not fallback candidates
- `assets.baseDoc`: reuses shared fallback `TPL-SHARED-tone-and-naturality.md` (per agent's discretion in CONTEXT.md — no industry-specific base doc needed)
- `assets.overlayDoc`: points to the industry-specific tone doc created in this phase

**Schema validation note:** The schema requires `aliases` has `minItems: 1` — all 4 overlays have at least one alias (the slug itself). All other required fields (slug, version, displayName, type, aliases, disciplines, completeness, assets, fallbackAllowed, changelog) are present. `overlayFor`, `dependencies`, `operatorNotes` are optional.

### File Layout — Complete Phase 108 Deliverables

```
lib/markos/packs/
  industries/                                        ← CREATE this directory
    travel.industry.json                             ← new
    it.industry.json                                 ← new
    marketing-services.industry.json                 ← new
    professional-services.industry.json              ← new

.agent/markos/literacy/Shared/
  TPL-SHARED-overlay-industry-travel.md              ← new
  TPL-SHARED-overlay-industry-it.md                  ← new
  TPL-SHARED-overlay-industry-marketing-services.md  ← new
  TPL-SHARED-overlay-industry-professional-services.md ← new

onboarding/templates/SKELETONS/industries/           ← CREATE this directory
  travel/
    Paid_Media/PROMPTS.md                            ← new (×5 disciplines, ×4 verticals = 20 files)
    Content_SEO/PROMPTS.md
    Lifecycle_Email/PROMPTS.md
    Social/PROMPTS.md
    Landing_Pages/PROMPTS.md
  it/
    Paid_Media/PROMPTS.md
    ... (×5)
  marketing-services/
    ... (×5)
  professional-services/
    ... (×5)

test/pack-loader.test.js                              ← add Suite 108 tests
```

**Total new files: 4 manifests + 4 tone docs + 20 PROMPTS.md = 28 files**

### Tone Document Format

**Reference:** `TPL-SHARED-overlay-saas.md` (9-key YAML frontmatter pattern) + `TPL-SHARED-business-model-saas.md` (content depth/format to follow).

**Confirmed 9-key YAML frontmatter keys (triple-backtick block):**

```yaml
doc_id: "TPL-SHARED-overlay-industry-{slug}"
discipline: "Shared"
overlay_for: ["{base-slug-1}", "{base-slug-2}"]
industry: ["{slug}"]
pain_point_tags: [...]
funnel_stage: ["Awareness", "Consideration", "Decision", "Onboarding", "Retention"]
buying_maturity: "..."
tone_guidance: "..."
proof_posture: "..."
naturality_expectations: "..."
```

**Notes:**
- `overlay_for` contains the locked base pack slugs (same as `overlayFor` in the JSON manifest)
- `industry` replaces `business_model` for industry overlay docs (distinguishes them from base pack tone docs)
- Content depth: substantive sections (EVIDENCE BASE + CORE TACTICS + COUNTER-INDICATORS), similar to `TPL-SHARED-business-model-services.md`

### PROMPTS.md Format

**Reference:** `onboarding/templates/SKELETONS/saas/Content_SEO/PROMPTS.md`

```markdown
# {Vertical} — {Discipline} Industry Overlay Prompts

> **Context:** [2-4 sentence framing of what makes this vertical+discipline combination distinct and what drives conversions]

## Prompts

### 1. {Prompt Title}

[Prompt body]

---

### 2. {Prompt Title}

[Prompt body]

---

### 3. {Prompt Title}

[Prompt body]

---

### 4. {Prompt Title}

[Prompt body]
```

H1 pattern: `{Vertical} — {Discipline} Industry Overlay Prompts`
- e.g., `Travel & Hospitality — Content & SEO Industry Overlay Prompts`
- e.g., `IT & Technology — Paid Media Industry Overlay Prompts`

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| Industry alias resolution | Custom lookup logic | `INDUSTRY_ALIAS_MAP` already in `pack-loader.cjs` — add `.industry.json` file only |
| Schema validation for overlays | Custom validator | `pack-schema.json` already supports `type: "overlay"` and `overlayFor` — reuse it as the spec for file authoring |
| New test framework | Jest or new infra | `node:test` + `assert/strict` already in use throughout Suite 106 |
| Base family tone content in overlays | Full re-author | Reference `TPL-SHARED-tone-and-naturality.md` (shared) + the relevant base family's `TPL-SHARED-business-model-{slug}.md` implicitly |

---

## Common Pitfalls

### Pitfall 1: Placing `.industry.json` files in the wrong location

**What goes wrong:** Author creates `lib/markos/packs/travel.pack.json` with `type: "overlay"` instead of `lib/markos/packs/industries/travel.industry.json`.

**Why it happens:** CONTEXT.md says "Pack files go in lib/markos/packs/ root" and "loader scans *.pack.json in that dir" — this refers to BASE PACKS only. The overlay resolution lookup specifically uses `path.join(__dirname, 'industries', overlaySlug + '.industry.json')`.

**What breaks:** Two failures simultaneously:
1. Test 106.1 fails: `getFamilyRegistry()` would return 8+ entries instead of 7
2. Overlay never activates: `resolvePackSelection()` looks in `industries/` subdir; the root `.pack.json` is invisible to it

**How to avoid:** Industry overlay files MUST be `lib/markos/packs/industries/{slug}.industry.json`. File extension is `.industry.json`, not `.pack.json`. Directory is `industries/` (must be created — does not exist yet).

---

### Pitfall 2: Loader does not read `.industry.json` content — schema compliance is not runtime-enforced

**What goes wrong:** Author assumes the loader validates `.industry.json` against `pack-schema.json` at startup, similar to base packs.

**Why it happens:** Base pack loading pipeline applies Ajv schema validation. A reasonable assumption is that overlay manifests are loaded the same way.

**Reality:** `resolvePackSelection()` only calls `fs.existsSync()`. The manifest JSON is never parsed or validated by the current loader. An empty `{}` or malformed JSON file would still activate the overlay.

**Impact:** Schema compliance matters for Phase 109 (operator UI needs `displayName`, `completeness`) and Phase 110 (diagnostics need `overlayFor`). Phase 108 must author correct JSON even without enforcement, to prevent downstream breakage.

**How to avoid:** Validate each `.industry.json` manually or in the test suite using `require('../lib/markos/packs/pack-schema.json')` + Ajv compilation.

---

### Pitfall 3: `overlayFor` compatibility is NOT enforced by the loader

**What goes wrong:** Author assumes `resolvePackSelection()` checks whether the resolved base pack is in the overlay's `overlayFor` list before returning `overlayPack`.

**Reality:** The loader does not cross-check `overlayFor`. If `business_model: "b2c"` and `industry: "it"`, the resolver returns `overlayPack: "it"` even though `it.industry.json` declares `overlayFor: ["b2b", "saas", "services"]` only. The cross-check is Phase 110's responsibility.

**Impact for Phase 108:** This is not a bug to fix — it's a known design boundary. Tone doc and skeleton content should still be authored for the declared `overlayFor` base families only. No action needed in Phase 108, but it should not surprise the planner.

---

### Pitfall 4: Professional Services slug conflicts with the Services base pack

**What goes wrong:** `services.pack.json` already has `"aliases": ["services", "service", "consulting", "consultant", "professional services"]`. An author might try to use `"professional-services"` as an alias in the Services base pack or add it to INDUSTRY_ALIAS_MAP pointing to a base pack.

**Reality:** The slug `professional-services` in INDUSTRY_ALIAS_MAP correctly points to the INDUSTRY OVERLAY, not the base family. The Services BASE pack (`services.pack.json`) already handles the business model. The overlay adds vertical-specific authority markers ON TOP of the services base.

**Correct composition:** If seed has `business_model: "consulting"` and `industry: "professional services"`, the result should be:
- `basePack: "services"` (from `services.pack.json` aliases)
- `overlayPack: "professional-services"` (from `INDUSTRY_ALIAS_MAP["professional services"]`)

Both resolve correctly without any changes to base pack aliases.

---

### Pitfall 5: 20 skeleton PROMPTS.md are standalone, not addendum-style

**What goes wrong:** Author writes overlay PROMPTS.md as addendum prompts ("use these ON TOP OF the base family prompts"), breaking the standalone contract in D-07.

**How to avoid:** Each PROMPTS.md must contain 4 complete, self-contained prompts. An operator who has only the overlay PROMPTS.md (without the base family PROMPTS.md) must be able to use them as-is. No references like "extend Prompt 3 from the b2b skeleton."

---

## Code Examples

### Suite 108 Test Pattern (verified against existing Suite 106 style)

```javascript
test('Suite 108: pack-loader — industry overlay resolution', async (t) => {

  await t.test('108.1 travel industry resolves overlayPack=travel', () => {
    const { resolvePackSelection, _resetCacheForTests } = getLoader();
    _resetCacheForTests();
    const result = resolvePackSelection({ company: { business_model: 'b2b', industry: 'travel' } });
    assert.strictEqual(result.basePack, 'b2b');
    assert.strictEqual(result.overlayPack, 'travel');
  });

  await t.test('108.2 it industry resolves overlayPack=it', () => {
    const { resolvePackSelection, _resetCacheForTests } = getLoader();
    _resetCacheForTests();
    const result = resolvePackSelection({ company: { business_model: 'saas', industry: 'it' } });
    assert.strictEqual(result.basePack, 'saas');
    assert.strictEqual(result.overlayPack, 'it');
  });

  await t.test('108.3 marketing-services industry resolves overlayPack=marketing-services', () => {
    const { resolvePackSelection, _resetCacheForTests } = getLoader();
    _resetCacheForTests();
    const result = resolvePackSelection({ company: { business_model: 'agency', industry: 'marketing services' } });
    assert.strictEqual(result.basePack, 'agency');
    assert.strictEqual(result.overlayPack, 'marketing-services');
  });

  await t.test('108.4 professional-services industry resolves overlayPack=professional-services', () => {
    const { resolvePackSelection, _resetCacheForTests } = getLoader();
    _resetCacheForTests();
    const result = resolvePackSelection({ company: { business_model: 'services', industry: 'professional services' } });
    assert.strictEqual(result.basePack, 'services');
    assert.strictEqual(result.overlayPack, 'professional-services');
  });

  await t.test('108.5 hospitality alias resolves to travel overlay', () => {
    const { resolvePackSelection, _resetCacheForTests } = getLoader();
    _resetCacheForTests();
    const result = resolvePackSelection({ company: { business_model: 'b2c', industry: 'hospitality' } });
    assert.strictEqual(result.overlayPack, 'travel');
  });

  await t.test('108.6 information technology alias resolves to it overlay', () => {
    const { resolvePackSelection, _resetCacheForTests } = getLoader();
    _resetCacheForTests();
    const result = resolvePackSelection({ company: { business_model: 'b2b', industry: 'information technology' } });
    assert.strictEqual(result.overlayPack, 'it');
  });

  await t.test('108.7 digital marketing alias resolves to marketing-services overlay', () => {
    const { resolvePackSelection, _resetCacheForTests } = getLoader();
    _resetCacheForTests();
    const result = resolvePackSelection({ company: { business_model: 'agency', industry: 'digital marketing' } });
    assert.strictEqual(result.overlayPack, 'marketing-services');
  });

  await t.test('108.8 advisory alias resolves to professional-services overlay', () => {
    const { resolvePackSelection, _resetCacheForTests } = getLoader();
    _resetCacheForTests();
    const result = resolvePackSelection({ company: { business_model: 'b2b', industry: 'advisory' } });
    assert.strictEqual(result.overlayPack, 'professional-services');
  });

  await t.test('108.9 unknown industry resolves overlayPack=null', () => {
    const { resolvePackSelection, _resetCacheForTests } = getLoader();
    _resetCacheForTests();
    const result = resolvePackSelection({ company: { business_model: 'b2b', industry: 'agriculture' } });
    assert.strictEqual(result.basePack, 'b2b');
    assert.strictEqual(result.overlayPack, null);
  });

  await t.test('108.10 industry overlay manifests are valid JSON with required fields', () => {
    const fs   = require('fs');
    const path = require('path');
    const Ajv  = require('ajv');
    const schema = JSON.parse(fs.readFileSync(
      path.resolve(__dirname, '../lib/markos/packs/pack-schema.json'), 'utf8'
    ));
    const ajv = new Ajv({ allErrors: true, strict: false });
    const validate = ajv.compile(schema);
    const slugs = ['travel', 'it', 'marketing-services', 'professional-services'];
    for (const slug of slugs) {
      const filePath = path.resolve(__dirname, '../lib/markos/packs/industries', slug + '.industry.json');
      assert.ok(fs.existsSync(filePath), `${slug}.industry.json must exist`);
      const manifest = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      assert.ok(validate(manifest), `${slug}.industry.json must pass schema validation: ${JSON.stringify(validate.errors)}`);
      assert.strictEqual(manifest.type, 'overlay', `${slug} must have type=overlay`);
      assert.ok(Array.isArray(manifest.overlayFor) && manifest.overlayFor.length > 0,
        `${slug} must have overlayFor array`);
    }
  });

  await t.test('108.11 existing 106.1 still passes (7 base pack entries, no overlay inflation)', () => {
    const { getFamilyRegistry, _resetCacheForTests } = getLoader();
    _resetCacheForTests();
    const registry = getFamilyRegistry();
    assert.strictEqual(registry.length, 7, 'registry must still have exactly 7 base pack entries after Phase 108');
  });
});
```

**Notes on test design:**
- Tests 108.1–108.9 depend on the actual `.industry.json` files being present on disk — they test the file + loader contract together (integration-style for the overlay resolution path)
- Test 108.10 schema-validates all 4 manifests using Ajv directly — compensates for the lack of runtime schema enforcement
- Test 108.11 guards against accidentally inflating `getFamilyRegistry()` with overlay entries
- `_resetCacheForTests()` is called per test (from the existing pattern) to ensure fresh state; it does NOT affect `fs.existsSync()` calls — those always hit disk

---

## Vertical Content Angles (Tone Research)

### Travel & Hospitality

**Core buying dynamic:** Aspiration-then-practicality. Buyers are emotionally engaged first (destination desire, experience vision) and shift to practical evaluation (price, reviews, logistics) before booking. Trust is built through real guest reviews, vivid imagery, and transparent logistics — not claims.

**Distinct mechanics vs base packs:**
- **Urgency framing is appropriate** — seasonal availability, limited inventory, price tiers genuinely exist. Unlike services/B2B, "book before prices rise" is accurate, not manipulative.
- **Social proof format:** Reviews and user-generated content (photos, trip reports) are the highest-trust signal — more than polished brand copy
- **Multi-channel inspiration journey:** Google Discover/SEO for consideration-stage research; Instagram/TikTok for aspiration; email for loyalty retention; paid for mid-funnel retargeting
- **Loyalty mechanics:** Repeat customers are disproportionately valuable; email and lifecycle channels serve loyalty program depth
- **Seasonal content calendar:** Content must reflect seasonality and booking windows (4–12 weeks ahead for most leisure travel)

**Tone:** Aspirational but reliable. Vivid without overselling. Trusts the reader to imagine themselves in the destination — doesn't need to oversell it.

**PROMPTS.md context block angles per discipline:**
- Paid_Media: Performance campaigns built around booking-window targeting, urgency signals, retargeting abandoned searches
- Content_SEO: Destination guides, "best of" rankings, comparison content (when to book, where to stay)
- Lifecycle_Email: Loyalty tier progression, pre-trip logistics, post-trip retention/review requests
- Social: UGC amplification, inspiration content, destination highlights, seasonal campaigns
- Landing_Pages: Booking-optimized landing pages, destination landing pages, deal/package pages

---

### IT & Technology

**Core buying dynamic:** Multi-stakeholder technical evaluation with budget justification. IT buyers combine technical due diligence (security, integration, compliance) with ROI/TCO framing for budget holders. Risk reduction is the dominant motivator, not aspiration.

**Distinct mechanics vs base packs:**
- **Security and compliance are table stakes** — any IT-sector content must address them proactively (not as differentiators, as baseline credibility signals)
- **Integration ecosystem proof:** "Plays well with [existing stack]" is a major conversion signal for IT buyers
- **ROI/TCO framing for budget justification:** IT buyers are often presenting to a CFO; content must give them the language and data
- **Technical credibility without jargon overload:** Enough specificity to pass the technical review; accessible enough for the business stakeholder
- **Cybersecurity sub-vertical:** Threat landscape framing, compliance posture (SOC 2, ISO 27001), incident response credibility

**Tone:** Solution-confident, technically specific, vendor-agnostic in framing where possible. Evidence-led. Never hype.

**PROMPTS.md context block angles per discipline:**
- Paid_Media: LinkedIn targeting by job title (IT Director, CISO, CIO), security/compliance urgency campaigns, retargeting for long evaluation cycles
- Content_SEO: Technical comparison pages, implementation guides, compliance/security knowledge articles
- Lifecycle_Email: Technical nurture sequences, proof-point drip (case studies, certifications), evaluation-stage content
- Social: LinkedIn thought leadership, security threat awareness, product capability demos
- Landing_Pages: Solution pages with integration proof, security/compliance signal pages, ROI calculator pages

---

### Marketing Services (Agency)

**Core buying dynamic:** Agency-to-client or in-house marketing team buying an agency partner. The buyer knows marketing. They're evaluating execution track record, methodology transparency, and whether the agency has delivered results for their specific channel or business type. Generic claims are immediately discounted.

**Distinct mechanics vs base packs:**
- **Show the numbers:** Marketing buyers evaluate campaign results, not just service descriptions. Specific metrics (ROAS, CPL, CTR, conversion rate lifts) are non-negotiable in case studies
- **Methodology transparency:** Buyers want to understand HOW the agency works before committing. Process documentation converts better than outcomes alone
- **Differentiation from commodity agencies:** The market is saturated; positioning on specific channel specialization, industry depth, or performance track record > generic "full-service" claims
- **Retainer vs project model positioning:** Impacts how the sales motion works; lifecycle email and relationship-nurturing patterns differ by model
- **Attribution honesty:** Sophisticated buyers are skeptical of inflated attribution claims; acknowledging attribution challenges builds more trust than claiming to own all the credit

**Tone:** Performance-confident, result-specific, methodology-transparent. Peer positioning (marketing-to-marketing). Avoids the irony of bad marketing in marketing services content.

**PROMPTS.md context block angles per discipline:**
- Paid_Media: Agency's own paid acquisition campaigns that demonstrate what they preach (eat-your-own-cooking positioning)
- Content_SEO: Case study pages with specific channel+metric proof, methodology/how-we-work pages, channel-specific SEO guides
- Lifecycle_Email: Prospect nurture with results evidence, client onboarding sequences, retainer health check-ins
- Social: Campaign result spotlights, methodology POV content, behind-the-scenes execution content
- Landing_Pages: Service-specific landing pages (channel/industry combination), case study landing pages, free audit CTAs

---

### Professional Services

**Core buying dynamic:** Identical to the Services base pack at the funnel mechanics level — trust-first, relationship-led, expertise-demonstrated, urgency-counter-indicated. The Professional Services OVERLAY adds distinct formal procurement and credentialing mechanics NOT present in general services.

**Thin delta additions (D-06):**

1. **RFP culture:** Professional services buyers (legal, accounting, HR consulting, management consulting, advisory) often run formal procurement processes — RFPs with scoring criteria, proposal formats, and evaluator committees. Content must prepare for and support formal evaluation, not just relationship development.
   - Content type: RFP response guidance, proposal structure best practices, evaluation checklist content
   - Credibility signal: demonstrable experience with formal procurement (references, response track record)

2. **Rate card dynamics:** Billable hour and retainer pricing transparency is more common in professional services than in general consulting. Buyers expect to understand value-per-unit. "Value-based pricing" framing works but must be backed by outcome proof.
   - Content type: Rate comparison framing ("what you're really paying for"), transparency pages, scoping guides
   - Counter-indicator: Hiding pricing entirely (buyers in formal procurement need numbers to proceed)

3. **Credentialing as proof posture:** Professional certifications, accreditations, professional body memberships (CPA, CFA, PMP, SHRM, bar admission) are high-trust signals specific to professional services verticals.
   - These are NOT relevant for general consulting/services; they're specific to licensed or certified professional practices
   - Content should surface credentials as proof, not just USPs

4. **Peer referral as primary acquisition:** Professional services firms (especially law, accounting, HR, financial advisory) acquire a disproportionate share of new clients through professional networks and peer referrals — not inbound marketing. Content strategy should support referral amplification (LinkedIn, thought leadership for former clients to share, testimonial structures that help referrers vouch credibly).

**Services base pack tone characteristics inherited (do not re-author):** Senior practitioner voice, no urgency language, case study as primary proof, low-commitment CTAs (discovery call/free assessment), long sales cycle nurture.

**PROMPTS.md context block angles per discipline:**
- Paid_Media: LinkedIn thought leadership for credentialing signals, retargeting for formal evaluations, peer-network amplification
- Content_SEO: Credentialing / accreditation pages, RFP guide content, professional methodology articles
- Lifecycle_Email: Proposal follow-up sequences, formal evaluation nurture, referral cultivation
- Social: Credential and achievement sharing, knowledge-sharing for peer referral cultivation, professional community positioning
- Landing_Pages: Credential/team pages, service scope and rate clarity pages, discovery session landing pages

---

## INDUSTRY_ALIAS_MAP — Verified Active Entries

Source: `lib/markos/packs/pack-loader.cjs` lines ~193–214 (confirmed in code, not comment):

```javascript
const INDUSTRY_ALIAS_MAP = Object.freeze({
  'travel':                 'travel',
  'hospitality':            'travel',
  'tourism':                'travel',
  'hotels':                 'travel',
  'it':                     'it',
  'information technology': 'it',
  'tech':                   'it',
  'technology':             'it',
  'software':               'it',
  'cybersecurity':          'it',
  'marketing services':     'marketing-services',
  'marketing agency':       'marketing-services',
  'digital marketing':      'marketing-services',
  'performance marketing':  'marketing-services',
  'professional services':  'professional-services',
  'consulting services':    'professional-services',
  'advisory':               'professional-services',
  'management consulting':  'professional-services',
});
```

**Lookup path:** Industry string → `canonicalizeValue()` (lowercases, strips punctuation, collapses spaces) → INDUSTRY_ALIAS_MAP key lookup → overlay slug.

**Examples of canonical form:**
- `"Travel"` → `"travel"` → slug `travel`
- `"Information Technology"` → `"information technology"` → slug `it`
- `"Marketing Services"` → `"marketing services"` → slug `marketing-services`
- `"Professional Services"` → `"professional services"` → slug `professional-services`

**Note on `canonicalizeValue()`:** It replaces `.`, `_`, `/` with space; `&` with "and"; strips non-alphanumeric except space/hyphen. Multi-word aliases in the map already match the canonical form.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | `node:test` (Node.js built-in test runner) |
| Config file | None — `package.json` scripts: `"test": "node --test test/**/*.test.js"` |
| Quick run | `node --test test/pack-loader.test.js` |
| Full suite | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command |
|--------|----------|-----------|-------------------|
| LIB-02 | `travel.industry.json` activates `overlayPack: "travel"` | integration | `node --test test/pack-loader.test.js` (test 108.1) |
| LIB-02 | `it.industry.json` activates `overlayPack: "it"` | integration | test 108.2 |
| LIB-02 | `marketing-services.industry.json` activates | integration | test 108.3 |
| LIB-02 | `professional-services.industry.json` activates | integration | test 108.4 |
| LIB-02 | Aliases resolve correctly (hospitality→travel, etc.) | integration | tests 108.5–108.8 |
| LIB-02 | Unknown industry → `overlayPack: null` (no hard fail) | integration | test 108.9 |
| LIB-04 | All 4 overlay manifests pass `pack-schema.json` Ajv validation | unit | test 108.10 |
| LIB-04 | `getFamilyRegistry()` still returns exactly 7 entries | regression | test 108.11 |

### Sampling Rate
- **Per task commit:** `node --test test/pack-loader.test.js`
- **Phase gate:** `npm test` (full suite, all 25 tests green)

### Wave 0 Gaps
- [ ] `lib/markos/packs/industries/` directory (does not exist — must be created before any `.industry.json` files)
- [ ] Suite 108 test block in `test/pack-loader.test.js` (11 new tests — add before implementing manifests)

---

## Open Questions

1. **Should `.industry.json` files also be Ajv-validated by the loader at startup?**
   - What we know: Current loader does not load or validate `.industry.json` content
   - What's unclear: Phase 109 operator UI will need `displayName`, `completeness`, `overlayFor` — does Phase 109 read these directly or rely on the loader exposing them?
   - Recommendation: Author correct schema-compliant JSON now; note for Phase 109 that the loader may need a `getOverlayRegistry()` function parallel to `getFamilyRegistry()`

2. **Should `fallbackAllowed` be `false` for all industry overlays?**
   - What we know: CONTEXT.md does not specify; agent's discretion applies
   - Recommendation: `false` — overlays should not be selected as fallbacks; if no industry match, base-only is the correct behavior (Phase 106 Decision 3 Step 2)

---

## Environment Availability

Step 2.6: SKIPPED — Phase 108 is a content/file authoring phase with no new external dependencies.

---

## Sources

### Primary (HIGH confidence — verified against live code/files)
- `lib/markos/packs/pack-loader.cjs` — verified overlay file lookup path (lines 258–271), INDUSTRY_ALIAS_MAP (lines 193–214), canonicalizeValue() behavior
- `lib/markos/packs/pack-schema.json` — verified required fields, `type: "overlay"` enum, `overlayFor` definition
- `lib/markos/packs/b2b.pack.json` — verified v1.1.0 manifest format to match
- `test/pack-loader.test.js` — verified Suite 106 test patterns, node:test style, assert/strict usage, `getLoader()` helper pattern
- Directory scan `lib/markos/packs/` — confirmed exactly 7 `*.pack.json` files, no `industries/` subdir
- `npm test` baseline — confirmed all 14 existing tests pass, zero failures

### Secondary (HIGH confidence — verified against Phase 106/107 artifacts)
- `.planning/phases/106-template-taxonomy-and-selection-contracts/106-CONTEXT.md` — schema decisions, conflict resolution algorithm, selection state shape
- `.agent/markos/literacy/Shared/TPL-SHARED-overlay-saas.md` — confirmed 9-key YAML frontmatter format
- `.agent/markos/literacy/Shared/TPL-SHARED-business-model-saas.md` — confirmed content depth standard for tone docs
- `.agent/markos/literacy/Shared/TPL-SHARED-business-model-services.md` + `TPL-SHARED-overlay-consulting.md` — confirmed Services base tone doc structure; identifies what Professional Services overlay must NOT re-author
- `onboarding/templates/SKELETONS/saas/Content_SEO/PROMPTS.md` — confirmed H1 pattern, context block, 4-prompt structure

---

## Metadata

**Confidence breakdown:**
- Overlay file location/format: HIGH — verified directly in loader code
- Test patterns: HIGH — modeled precisely on existing Suite 106 style
- Tone doc format: HIGH — verified against 2 existing overlay files
- Professional Services differentiation: HIGH — verified against services base pack content (what NOT to re-author)
- Content angles per vertical: MEDIUM — based on established marketing domain knowledge; specific evidence cited per vertical in Tone Research section

**Research date:** 2026-04-15
**Valid until:** Stable — depends only on this codebase's loader code, which won't change in Phase 108
