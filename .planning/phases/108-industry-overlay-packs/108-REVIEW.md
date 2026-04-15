---
phase: 108
plan_range: 01-07
status: issues-found
severity_counts:
  critical: 0
  high: 0
  medium: 1
  low: 1
  advisory: 1
files_reviewed_list:
  - .agent/markos/literacy/Shared/TPL-SHARED-overlay-industry-travel.md
  - .agent/markos/literacy/Shared/TPL-SHARED-overlay-industry-it.md
  - .agent/markos/literacy/Shared/TPL-SHARED-overlay-industry-marketing-services.md
  - .agent/markos/literacy/Shared/TPL-SHARED-overlay-industry-professional-services.md
  - onboarding/templates/SKELETONS/industries/travel/README.md
  - onboarding/templates/SKELETONS/industries/travel/Paid_Media/PROMPTS.md
  - onboarding/templates/SKELETONS/industries/travel/Content_SEO/PROMPTS.md
  - onboarding/templates/SKELETONS/industries/travel/Lifecycle_Email/PROMPTS.md
  - onboarding/templates/SKELETONS/industries/travel/Social/PROMPTS.md
  - onboarding/templates/SKELETONS/industries/travel/Landing_Pages/PROMPTS.md
  - onboarding/templates/SKELETONS/industries/it/README.md
  - onboarding/templates/SKELETONS/industries/it/Paid_Media/PROMPTS.md
  - onboarding/templates/SKELETONS/industries/it/Content_SEO/PROMPTS.md
  - onboarding/templates/SKELETONS/industries/it/Lifecycle_Email/PROMPTS.md
  - onboarding/templates/SKELETONS/industries/it/Social/PROMPTS.md
  - onboarding/templates/SKELETONS/industries/it/Landing_Pages/PROMPTS.md
  - onboarding/templates/SKELETONS/industries/marketing-services/README.md
  - onboarding/templates/SKELETONS/industries/marketing-services/Paid_Media/PROMPTS.md
  - onboarding/templates/SKELETONS/industries/marketing-services/Content_SEO/PROMPTS.md
  - onboarding/templates/SKELETONS/industries/marketing-services/Lifecycle_Email/PROMPTS.md
  - onboarding/templates/SKELETONS/industries/marketing-services/Social/PROMPTS.md
  - onboarding/templates/SKELETONS/industries/marketing-services/Landing_Pages/PROMPTS.md
  - onboarding/templates/SKELETONS/industries/professional-services/README.md
  - onboarding/templates/SKELETONS/industries/professional-services/Paid_Media/PROMPTS.md
  - onboarding/templates/SKELETONS/industries/professional-services/Content_SEO/PROMPTS.md
  - onboarding/templates/SKELETONS/industries/professional-services/Lifecycle_Email/PROMPTS.md
  - onboarding/templates/SKELETONS/industries/professional-services/Social/PROMPTS.md
  - onboarding/templates/SKELETONS/industries/professional-services/Landing_Pages/PROMPTS.md
  - lib/markos/packs/industries/travel.industry.json
  - lib/markos/packs/industries/it.industry.json
  - lib/markos/packs/industries/marketing-services.industry.json
  - lib/markos/packs/industries/professional-services.industry.json
  - lib/markos/packs/pack-loader.cjs
  - test/pack-loader.test.js
---

# Phase 108 Code Review

**Reviewed:** 2026-04-15T00:00:00Z
**Depth:** standard
**Files Reviewed:** 34
**Status:** issues-found

## Summary

All four industry overlay packs (travel, IT, marketing-services, professional-services) are structurally correct and functionally sound. All manifests carry `"type": "overlay"` and non-empty `overlayFor` arrays. The pack-loader resolves overlays correctly through `INDUSTRY_ALIAS_MAP` for all tested alias forms, and `getFamilyRegistry()` remains isolated to 7 base packs. All 20 PROMPTS.md files contain exactly 4 standalone prompts with `---` separators; no D-07 violations (cross-references to base family files) were found in any PROMPTS.md. The D-06 thin-delta constraint is correctly applied in the professional-services tone document.

Two concrete issues were found:

1. **Medium – Silent overlay miss for hyphenated slug inputs**: `INDUSTRY_ALIAS_MAP` handles `'marketing services'` and `'professional services'` (space-separated display names) but is missing entries for the slug forms `'marketing-services'` and `'professional-services'` (hyphenated). If any consumer passes the slug form as `seed.company.industry`, `resolveIndustryOverlay` returns `null` and the call silently degrades to base-only with no warning. The single-word slugs `travel` and `it` are unaffected. The 11 Suite 108 tests don't exercise slug-form input for multi-word industries, so this gap is not caught by the test suite.

2. **Low – D-04 ordering inconsistency in professional-services**: `professional-services.industry.json` and `TPL-SHARED-overlay-industry-professional-services.md` both declare `overlayFor` / `overlay_for` as `["services", "b2b"]`, but D-04 locks this as `["b2b", "services"]` (b2b first). No runtime impact — arrays are non-empty and both values are present — but it deviates from the locked decision record.

---

## Findings

### M-01 — INDUSTRY_ALIAS_MAP missing slug-form entries for multi-word industries

**Severity:** Medium
**File:** `lib/markos/packs/pack-loader.cjs:187–197`

**Issue:**
`canonicalizeValue()` preserves hyphens (the character class `[^a-z0-9\s-]` explicitly excludes `-` from stripping). Therefore `canonicalizeValue('marketing-services')` → `'marketing-services'` and `canonicalizeValue('professional-services')` → `'professional-services'`. Neither of these is a key in `INDUSTRY_ALIAS_MAP`, which covers only the space-separated forms:

```
'marketing services'  → 'marketing-services'   ✓
'professional services' → 'professional-services' ✓

'marketing-services'  → (absent)               ← BUG
'professional-services' → (absent)             ← BUG
```

If `seed.company.industry` is ever set to the slug form (e.g., programmatically from a route that stores the slug rather than the display name), `resolveIndustryOverlay` returns `null` and `resolvePackSelection` silently returns `overlayPack: null` without a warning. The current test suite only exercises `'marketing services'` (test 108.3) and `'professional services'` (test 108.4), so the gap is undetected.

**Fix:** Add the two missing entries to `INDUSTRY_ALIAS_MAP`:

```javascript
// Marketing Services
'marketing services':     'marketing-services',
'marketing agency':       'marketing-services',
'digital marketing':      'marketing-services',
'performance marketing':  'marketing-services',
'marketing-services':     'marketing-services',   // ← add: slug self-alias
// Professional Services
'professional services':  'professional-services',
'consulting services':    'professional-services',
'advisory':               'professional-services',
'management consulting':  'professional-services',
'professional-services':  'professional-services', // ← add: slug self-alias
```

Optionally add a test:

```javascript
await t.test('108.x marketing-services slug form resolves overlay', () => {
  const { resolvePackSelection, _resetCacheForTests } = getLoader();
  _resetCacheForTests();
  const result = resolvePackSelection({ company: { business_model: 'agency', industry: 'marketing-services' } });
  assert.strictEqual(result.overlayPack, 'marketing-services');
});
```

---

### L-01 — professional-services overlayFor order reversal vs. D-04

**Severity:** Low
**Files:**
- `lib/markos/packs/industries/professional-services.industry.json:20`
- `.agent/markos/literacy/Shared/TPL-SHARED-overlay-industry-professional-services.md:4`

**Issue:**
D-04 locks `professional-services` overlay_for as `["b2b", "services"]` (b2b listed first). Both artefacts declare it in reversed order:

```json
// professional-services.industry.json
"overlayFor": ["services", "b2b"]   ← reversed
```
```yaml
# TPL-SHARED-overlay-industry-professional-services.md
overlay_for: ["services", "b2b"]    ← reversed
```

No runtime consequence — tests only verify the array is non-empty, not its order — but the deviation from the D-04 locked decision creates ambiguity if future consumers interpret array order as priority ordering.

**Fix:** Update both files to match D-04:

```json
"overlayFor": ["b2b", "services"]
```
```yaml
overlay_for: ["b2b", "services"]
```

---

### A-01 — resolvePackSelection has no D-04 runtime constraint validation

**Severity:** Advisory
**File:** `lib/markos/packs/pack-loader.cjs:238–290`

**Issue:**
`resolvePackSelection` resolves `basePack` and `overlayPack` independently without verifying that the resolved base family slug appears in the overlay manifest's `overlayFor` array. A seed with an invalid combination (e.g., `business_model: 'b2c'`, `industry: 'professional services'`) would silently return `{ basePack: 'b2c', overlayPack: 'professional-services' }` despite `professional-services.overlayFor` containing only `['b2b', 'services']`.

The `overlayFor` arrays in the manifests therefore serve only as documentation today; the loader does not enforce them.

**Fix (optional — design decision):** After resolving `overlaySlug`, load the overlay manifest and validate:

```javascript
if (overlayExists) {
  const overlayManifest = JSON.parse(fs.readFileSync(overlayFilePath, 'utf8'));
  if (Array.isArray(overlayManifest.overlayFor) && overlayManifest.overlayFor.length > 0) {
    if (!overlayManifest.overlayFor.includes(baseSlug)) {
      console.warn(
        '[pack-loader] Overlay "' + overlaySlug + '" overlayFor does not include base family "' + baseSlug + '" — overlay applied anyway'
      );
    }
  }
}
```

Whether to warn-only or suppress the overlay on mismatch is a product decision. The advisory is flagged here for awareness; no change is required to pass the Phase 108 acceptance criteria.

---

## Verified Clean

| Check | Result |
|---|---|
| All 4 manifests: `"type": "overlay"` | ✓ All present |
| All 4 manifests: non-empty `overlayFor` | ✓ All present |
| D-04 overlayFor values — travel `["b2c","b2b"]` | ✓ Correct |
| D-04 overlayFor values — it `["b2b","saas","services"]` | ✓ Correct |
| D-04 overlayFor values — marketing-services `["agency","b2b"]` | ✓ Correct |
| D-04 overlayFor values — professional-services `["b2b","services"]` contents | ✓ Both values present (order inconsistency → L-01) |
| pack-loader industries/ path: `path.join(__dirname, 'industries', slug + '.industry.json')` | ✓ Correct |
| `getFamilyRegistry()` isolation — industries/ invisible to `*.pack.json` scan | ✓ Confirmed |
| Tone docs: 10-key YAML frontmatter (doc_id, discipline, overlay_for, industry, pain_point_tags, funnel_stage, buying_maturity, tone_guidance, proof_posture, naturality_expectations) | ✓ All 4 complete |
| D-06 thin-delta body text in professional-services tone doc | ✓ Present and compliant |
| PROMPTS.md count: exactly 4 prompts per file × 20 files | ✓ All 20 verified |
| PROMPTS.md separators: `---` between prompts | ✓ All 20 verified |
| D-07: no cross-references to base family files in any PROMPTS.md | ✓ None found |
| Suite 108 test coverage: 11 tests, all 4 overlays + aliases + unknown + schema + isolation | ✓ Full coverage of documented scenarios |
| Security: canoncalizeValue sanitizes industry input before map lookup | ✓ No injection vector |
| Security: overlayFilePath uses static map output — no user input in path segments | ✓ No path traversal vector |
| No hardcoded secrets or credentials | ✓ None found |

---

_Reviewed: 2026-04-15T00:00:00Z_
_Reviewer: gsd-code-reviewer_
_Depth: standard_
