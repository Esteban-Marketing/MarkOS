# Phase 106: Template Taxonomy and Selection Contracts — Research

**Researched:** 2026-04-14
**Domain:** JSON-schema-driven plugin/pack registry in Node.js CJS; backward-compat API facade; file-based manifest loading
**Confidence:** HIGH

---

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

1. **Registry Format:** Per-pack JSON manifests in `lib/markos/packs/{slug}.pack.json`. `template-family-map.cjs` becomes a thin loader.
2. **Pack Schema:** Rich (15+ fields) — slug, version, displayName, type, aliases, disciplines, completeness per discipline, assets (baseDoc, proofDoc, overlayDoc, skeletonDir), fallbackAllowed, overlayFor, dependencies, operatorNotes, changelog.
3. **Conflict Resolution:** base family wins from `seed.company.business_model`; industry field resolves overlay; missing overlay = base-only with diagnostic log.
4. **Operator Override Contract:** `{ basePack, overlayPack, overrideReason, resolvedAt }` persisted to `seed.packSelection`. Phase 106 defines the resolver and data contract only. Phase 109 builds the UI.
5. **Hybrid compiled approach:** Rejected — no build tooling complexity.

### Claude's Discretion

- Exact internal file layout inside `lib/markos/packs/pack-loader.cjs` (factory vs singleton, load-on-require vs lazy)
- Whether industry alias registry lives in separate `.industry.json` files or as inline map in loader
- How deeply to validate manifests at startup (full Ajv vs required-field guards)
- Whether `resolvePackSelection` lives in `pack-loader.cjs` or a sibling `pack-resolver.cjs`

### Deferred Ideas (OUT OF SCOPE)

- Authoring actual pack content (Phase 107/108)
- UI for the operator override (Phase 109)
- Diagnostics and fallback runtime behavior (Phase 110)
- Multi-overlay composition (LIBX-02)
- External marketplace/import flow (LIBX-03)
- Database migration or Supabase changes

</user_constraints>

---

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| LIB-01 | MarkOS can resolve a canonical starter library from onboarding seed data based on business model family | Pack-loader caches validated manifests; `resolveBusinessModelFamily()` delegates to loader's `getFamilyRegistry()` — same call site, same return shape |
| LIB-04 | Library assets are versioned and composable using one base family plus one industry overlay without duplicating existing template architecture | Rich schema `+` two-step resolver: business_model → base, industry → overlay. Loader adapts pack `assets` into the existing `overlayDocs` shape callers already expect |
| INIT-02 | Operators can inspect which model and industry pack was selected and override it before final approval | `resolvePackSelection(seed)` produces `{ basePack, overlayPack, overrideReason, resolvedAt }` written to `seed.packSelection`. Phase 109 reads this field for the UI |

</phase_requirements>

---

## Summary

Phase 106 is an infrastructure phase: it defines the data layer that all downstream phases author into and read from. The primary engineering challenge is **not** the pack schema itself (well-defined in CONTEXT.md) but the **backward-compatibility boundary**: the loader must produce objects that match the exact shape `example-resolver.cjs` and `skeleton-generator.cjs` already expect from `template-family-map.cjs` — without touching those callers.

The established pattern for this problem in Node.js CJS is a **facade adapter**: `template-family-map.cjs` keeps its exported function signatures but replaces its inline `FAMILY_REGISTRY` constant with a call to `pack-loader.cjs`'s cached registry. The loader reads manifests from disk at first call, validates them with Ajv, then translates the rich pack schema into the legacy entry shape. Callers see no difference.

The second challenge is schema validation. Ajv v8 is the industry standard for JSON Schema Draft-07/2019 validation in Node.js. **Contrary to a common assumption, Ajv v8 ships full CJS support** — its `package.json` `main` field resolves to `dist/cjs/core.js`. It requires zero ESM bridging. It is not currently installed as a direct dependency and must be added.

**Primary recommendation:** Add Ajv v8 as a direct dependency, build `pack-loader.cjs` as a module-level singleton cache following the established `discipline-router.cjs` pattern, and make `template-family-map.cjs` a thin facade that delegates to the loader while keeping its original public API signatures intact.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `ajv` | `^8.18.0` | JSON Schema validation of pack manifests at startup | Industry standard for JSON Schema in Node.js; CJS-compatible; strict mode catches schema bugs early; 20M+ weekly downloads |
| `ajv-formats` | `^3.0.1` | Adds `date-time` format support for `changelog[].date` | Companion to Ajv; required for any `format` keyword usage |
| `fs` (built-in) | Node.js 22 | Directory scan (`readdirSync`) and manifest load (`readFileSync`) | Already used throughout codebase for JSON loading; no additional dep needed |
| `path` (built-in) | Node.js 22 | Resolve pack directory and manifest paths | Already used throughout |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `node:test` (built-in) | Node.js 22 | Test runner for unit tests | Already used by all test files in `test/` — no new test framework |
| `node:assert/strict` (built-in) | Node.js 22 | Assertions in tests | Already used across test suite |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `ajv` | Manual required-field guards | Only do manual guards if you want zero deps. Ajv delivers better error messages, catches type mismatches, and the schema doubles as living documentation. Cost: one new direct dep (~145KB). For Phase 110 diagnostic quality, Ajv errors are worth it. |
| `ajv` | `zod` | Zod is ESM-first in v4 and TypeScript-first by design. This codebase is CJS + no TypeScript. Zod v3 works but adds complexity for no gain here. |
| `fs.readdirSync` | `glob` | `glob` is the ecosystem standard for complex patterns, but `readdirSync` + `.filter(f => f.endsWith('.pack.json'))` is sufficient and adds no dependency. |

**Installation:**

```bash
npm install ajv@^8.18.0 ajv-formats@^3.0.1
```

**Version verification (confirmed 2026-04-14):**

```
ajv       → 8.18.0  (latest)
ajv-formats → 3.0.1  (latest)
```

---

## Architecture Patterns

### Recommended File Layout

```
lib/markos/packs/
├── pack-loader.cjs          ← new: scan, validate, cache, expose getFamilyRegistry() + resolvePackSelection()
├── pack-schema.json         ← new: JSON Schema Draft-07 for *.pack.json
├── b2b.pack.json            ← migrated from FAMILY_REGISTRY
├── b2c.pack.json
├── agency.pack.json
├── services.pack.json
├── saas.pack.json
├── ecommerce.pack.json
├── info-products.pack.json
└── industries/
    ├── industry-schema.json ← stub schema for Phase 108 overlay manifests
    └── (Phase 108 populates .industry.json files here)
```

`template-family-map.cjs` stays in place at `onboarding/backend/research/` and keeps all its exported names. It just stops owning the registry data.

### Pattern 1: Module-Level Singleton Cache (the established codebase pattern)

**What:** A module-scoped `let cache = null` variable, populated on first call, returned on every subsequent call. Used by `discipline-router.cjs` for `taxonomy.json` loading. Replicate exactly.

**When to use:** Any file-based registry that should load once at process start, never re-read during a request.

**Example:**

```javascript
// Source: onboarding/backend/agents/discipline-router.cjs (existing pattern)
'use strict';
const fs = require('fs');
const path = require('path');

const PACKS_DIR = path.resolve(__dirname, '.');
let _registryCache = null;
let _warnedMissing = false;

function getFamilyRegistry() {
  if (_registryCache) return _registryCache;

  try {
    const files = fs.readdirSync(PACKS_DIR)
      .filter(f => f.endsWith('.pack.json'));

    if (files.length === 0) {
      if (!_warnedMissing) {
        console.warn('[pack-loader] No pack manifests found in lib/markos/packs/');
        _warnedMissing = true;
      }
      _registryCache = [];
      return _registryCache;
    }

    const validated = [];
    for (const file of files) {
      const manifest = JSON.parse(
        fs.readFileSync(path.join(PACKS_DIR, file), 'utf8')
      );
      const result = validateManifest(manifest);
      if (!result.valid) {
        console.warn(`[pack-loader] Invalid manifest ${file}:`, result.errors);
        continue;
      }
      validated.push(adaptToLegacyShape(manifest));
    }

    _registryCache = Object.freeze(validated);
    return _registryCache;
  } catch (err) {
    console.warn('[pack-loader] Failed to load pack manifests:', err.message);
    _registryCache = [];
    return _registryCache;
  }
}

module.exports = { getFamilyRegistry, resolvePackSelection };
```

### Pattern 2: Facade Adapter for Backward Compatibility

**What:** `template-family-map.cjs` keeps all exported function signatures. Replace only the constant they read. The adaptor (`adaptToLegacyShape`) translates the rich pack manifest into the legacy entry shape.

**When to use:** Any time an internal data source changes shape but public callers must not change.

**Example:**

```javascript
// Source: derived from template-family-map.cjs existing structure

// BEFORE (Phase 105 and earlier):
//   const FAMILY_REGISTRY = Object.freeze([{ slug, aliases, baseDoc, proofDoc, overlayDocs }...])

// AFTER (Phase 106):
const { getFamilyRegistry } = require('../../../lib/markos/packs/pack-loader.cjs');

// All functions stay identical — they call getFamilyRegistry() instead of FAMILY_REGISTRY
function normalizeBusinessModel(value) {
  const token = canonicalizeValue(value);
  if (!token) return '';
  for (const entry of getFamilyRegistry()) {        // ← only change: was FAMILY_REGISTRY
    if (token === canonicalizeValue(entry.slug)) return entry.slug;
    if (entry.aliases.some(a => canonicalizeValue(a) === token)) return entry.slug;
  }
  return '';
}
```

**The `adaptToLegacyShape` function is the critical bridge:**

```javascript
// Translates pack manifest rich schema → legacy FAMILY_REGISTRY entry shape
function adaptToLegacyShape(manifest) {
  // overlayDocs: the legacy shape has { [overlayKey]: docPath }
  // The rich schema stores a single assets.overlayDoc path on the pack itself.
  // For base packs, overlayDocs is empty at Phase 106; Phase 108 populates overlays.
  const overlayDocs = {};
  if (manifest.type === 'overlay' && manifest.assets && manifest.assets.overlayDoc) {
    // Overlay packs expose themselves via the KEY = their slug
    overlayDocs[manifest.slug] = manifest.assets.overlayDoc;
  }

  return {
    slug: manifest.slug,
    aliases: manifest.aliases || [],
    baseDoc: (manifest.assets && manifest.assets.baseDoc) || SHARED_BASE_DOC,
    proofDoc: (manifest.assets && manifest.assets.proofDoc) || SHARED_PROOF_DOC,
    overlayDocs,
    // Extra fields callers ignore but loader may use for future phases
    displayName: manifest.displayName,
    completeness: manifest.completeness || {},
    fallbackAllowed: manifest.fallbackAllowed !== false,
  };
}
```

### Pattern 3: Two-Step Resolver → Selection State

**What:** A `resolvePackSelection(seed)` function that produces the operator-visible contract object. Goes in `pack-loader.cjs` or a sibling `pack-resolver.cjs` (Claude's discretion).

**Example:**

```javascript
function resolvePackSelection(seed) {
  const businessModel = seed && seed.company && seed.company.business_model;
  const industry = seed && seed.company && seed.company.industry;

  // Step 1: base family
  const baseSlug = normalizeBusinessModel(businessModel) || null;
  if (!baseSlug) {
    return {
      basePack: null,
      overlayPack: null,
      overrideReason: 'no_business_model_match',
      resolvedAt: new Date().toISOString(),
    };
  }

  // Step 2: industry overlay
  const overlaySlug = industry ? resolveIndustryOverlay(industry) : null;
  const overlayExists = overlaySlug && Boolean(getIndustryPack(overlaySlug));

  return {
    basePack: baseSlug,
    overlayPack: overlayExists ? overlaySlug : null,
    overrideReason: null,
    resolvedAt: new Date().toISOString(),
  };
}
```

Note: `resolveIndustryOverlay` reads from `industries/*.industry.json` files — or an inline alias map at Phase 106 (Claude's discretion), since Phase 108 will add actual files. At Phase 106 scope, the industry registry can be a minimal inline map pointing to stub slugs. The key is the contract shape is locked.

### Anti-Patterns to Avoid

- **`require()` for JSON manifests**: Node.js caches `require('./foo.json')` permanently in `require.cache`. In tests, stale cache means you can't swap files between test cases. Use `fs.readFileSync + JSON.parse` always.
- **Re-scanning disk on every call**: Load once, cache. The existing `discipline-router.cjs` shows the pattern. Don't add a watch/invalidation mechanism — out of scope for Phase 106.
- **Mutating the cached registry array**: Use `Object.freeze(validated)` after loading, matching how `FAMILY_REGISTRY` is frozen today.
- **Throwing on invalid manifests at startup**: Log `console.warn` and skip the invalid pack. The codebase never throws at module load time for configuration errors — it warns and degrades (see `discipline-router.cjs` lines 50-74).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON Schema validation of pack manifests | Custom field-by-field guard functions | Ajv v8 with a `pack-schema.json` | Edge cases multiply: type coercion, enum checks, required-vs-optional nesting, array-item validation. Ajv handles all of these and produces actionable validation errors for Phase 110 diagnostics. |
| Alias canonicalization | New normalizer | The existing `canonicalizeValue()` in `template-family-map.cjs` | It already exists, is tested, and handles the edge cases (punctuation stripping, hyphen normalization). Copy or re-export it from the loader. |
| Directory scanning | Custom recursive walker | `fs.readdirSync(dir).filter(f => f.endsWith('.pack.json'))` | One-level scan is all that's needed. `glob` is overkill; a recursive walker is wasteful. |
| Date/time ISO string production | Custom formatter | `new Date().toISOString()` | Built-in. No library. |

**Key insight:** This phase is about wiring, not building. The more logic you hand-roll here, the more surfaces Phase 110 diagnostics need to audit. Keep the loader thin.

---

## Runtime State Inventory

> Applies because this is a refactor/migration phase (in-code registry → file-based manifests).

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — FAMILY_REGISTRY is in-memory only; not persisted to any database | Code edit only |
| Live service config | None — template-family-map is not registered in any external service or config UI | None |
| OS-registered state | None | None |
| Secrets/env vars | None — no env vars reference pack names | None |
| Build artifacts | None — no compiled outputs; CJS, no build step | None |

**Conclusion:** This migration is pure code + new JSON files. No data migration required. The `require.cache` concern (see Anti-Patterns) is a test-isolation concern, not a data migration concern.

---

## Common Pitfalls

### Pitfall 1: Ajv v8 Strict Mode Rejects Unknown Keywords

**What goes wrong:** You define the JSON Schema and use `additionalProperties: false`, but Ajv v8's default strict mode also rejects schema keywords it doesn't recognize. If you include a custom field like `"$comment"` without declaring `$schema`, the validator throws at compile time, not validation time.

**Why it happens:** Ajv v8 introduced strict mode as the default. This is a deliberate breaking change from Ajv v6.

**How to avoid:** Declare `new Ajv({ allErrors: true, strict: false })` for the startup validator, or keep the schema conformant to JSON Schema Draft-07 exactly. The `allErrors: true` option gives Phase 110 all validation errors at once rather than stopping at the first failure.

**Warning signs:** `strict mode: unknown keyword "..."` error at validator compile time.

### Pitfall 2: `overlayDocs` Shape Mismatch at Adapter Boundary

**What goes wrong:** The legacy `entry.overlayDocs` object is keyed by **business-model-derived overlay key** (e.g., `{ saas: '...path...' }`), not by industry slug. The new pack schema has `assets.overlayDoc` as a single string path. If the adapter incorrectly puts the wrong key in `overlayDocs`, `getOverlayDocForModel()` silently returns `null` for everything.

**Why it happens:** `inferOverlayKey(businessModel)` in `template-family-map.cjs` derives the overlay key from the business model value (e.g., `"saas"` → `"saas"`, `"consulting"` → `"consulting"`). This is the *current* overlay system. Industry-based overlay resolution (Phase 108's addition) uses a *separate* resolver. They coexist in Phase 106 — don't conflate them.

**How to avoid:** For Phase 106, base pack manifests have `null` `overlayDoc` in `assets`. The `adaptToLegacyShape` function produces `overlayDocs: {}` for base packs. The existing test in `test/example-resolver.test.js` suite checks this — run it to confirm.

**Warning signs:** Overlay resolution tests pass for SaaS but return `null` for all industry queries.

### Pitfall 3: The `getFamilyRegistry()` Array Loads Empty During Tests

**What goes wrong:** Tests that exercise `resolveBusinessModelFamily()` through the new facade load too fast before disk reads happen, or the test's working directory differs from the pack files' location, resulting in an empty registry and all lookups returning `null`.

**Why it happens:** `path.resolve(__dirname, '.')` inside `pack-loader.cjs` resolves relative to the loader file's directory. If the loader is at `lib/markos/packs/pack-loader.cjs`, then `__dirname` is correct. But if a test swaps `require.cache` entries, the `_registryCache` may be stale (the singleton survives across tests in the same Node.js process).

**How to avoid:** Export a `_resetCacheForTests()` function from `pack-loader.cjs`. Only expose it when `process.env.NODE_ENV === 'test'` or always (callers won't misuse it in production). This is a common pattern in CJS singletons tested with `node:test`.

**Warning signs:** First test in the suite passes, second test that modifies the manifest files shows stale data.

### Pitfall 4: `seed.packSelection` Gets Re-Resolved Instead of Read

**What goes wrong:** Phase 109 might call `resolvePackSelection(seed)` again during approval instead of reading the pre-computed `seed.packSelection`. This discards the operator's override.

**Why it happens:** The contract appears stateless — seed data is always available, so re-resolving "looks safe."

**How to avoid:** Document and enforce: the approval step reads `seed.packSelection` **only**. It never calls `resolvePackSelection()` again. This rule belongs in the JSDoc of `resolvePackSelection` and in the Phase 109 plan brief. CONTEXT.md Decision 4 already locks this: "What the approval step reads: only `seed.packSelection`; never re-resolves from seed at approval time."

**Warning signs:** Operator override gets silently overwritten during approval.

### Pitfall 5: Ajv v8 "ESM Only" Misconception

**What goes wrong:** Developer sees forum posts saying "Ajv v8 is ESM" and instead writes a manual field validator to avoid the dependency.

**Why it is wrong:** Ajv v8 ships both CJS and ESM. The `package.json` `main` field points to `dist/cjs/core.js`. `require('ajv')` works in Node.js CJS modules. **Confirmed**: `npm view ajv version` → `8.18.0`; the CJS distribution has been maintained continuously through all v8.x releases.

**How to avoid:** `const Ajv = require('ajv')` — it works. Use it.

---

## Code Examples

### Load and Initialize Ajv with the Pack Schema (CJS)

```javascript
// Source: Ajv v8 official documentation (CJS usage)
'use strict';

const Ajv = require('ajv');
const addFormats = require('ajv-formats');

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

const PACK_SCHEMA = require('./pack-schema.json');
const validatePack = ajv.compile(PACK_SCHEMA);

function validateManifest(data) {
  const valid = validatePack(data);
  return { valid, errors: validatePack.errors || [] };
}
```

### Scanning a Directory for Pack Files (CJS built-ins)

```javascript
// Source: Node.js fs documentation (readdirSync + filter pattern)
const fs = require('fs');
const path = require('path');

const PACKS_DIR = path.join(__dirname);  // same dir as pack-loader.cjs

function scanPackFiles() {
  return fs.readdirSync(PACKS_DIR)
    .filter(f => f.endsWith('.pack.json'))
    .map(f => path.join(PACKS_DIR, f));
}
```

### JSON Schema Draft-07 for Pack Manifests

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["slug", "version", "displayName", "type", "aliases", "disciplines", "completeness", "assets"],
  "additionalProperties": true,
  "properties": {
    "slug": { "type": "string", "pattern": "^[a-z0-9-]+$" },
    "version": { "type": "string" },
    "displayName": { "type": "string", "minLength": 1 },
    "type": { "type": "string", "enum": ["base", "overlay"] },
    "aliases": { "type": "array", "items": { "type": "string" } },
    "industries": { "type": "array", "items": { "type": "string" } },
    "disciplines": { "type": "array", "items": { "type": "string" } },
    "completeness": {
      "type": "object",
      "additionalProperties": {
        "type": "string",
        "enum": ["full", "partial", "stub", "missing"]
      }
    },
    "assets": {
      "type": "object",
      "properties": {
        "baseDoc": { "type": "string" },
        "proofDoc": { "type": "string" },
        "overlayDoc": { "type": ["string", "null"] },
        "skeletonDir": { "type": ["string", "null"] }
      }
    },
    "fallbackAllowed": { "type": "boolean" },
    "overlayFor": { "type": ["array", "null"], "items": { "type": "string" } },
    "dependencies": { "type": "array", "items": { "type": "string" } },
    "operatorNotes": { "type": "string" },
    "changelog": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["version", "date", "summary"],
        "properties": {
          "version": { "type": "string" },
          "date": { "type": "string", "format": "date" },
          "summary": { "type": "string" }
        }
      }
    }
  }
}
```

Note: `"additionalProperties": true` at the top level is intentional — future phases add fields.

### `resolvePackSelection` Contract (Selection State)

```javascript
// lib/markos/packs/pack-loader.cjs (or pack-resolver.cjs — Claude's discretion)

const SELECTION_STATE_OVERRIDE_REASON = Object.freeze({
  NO_MATCH: 'no_business_model_match',
  OPERATOR_OVERRIDE: 'operator_override',
  FALLBACK: 'fallback_no_overlay',
});

function resolvePackSelection(seed) {
  const businessModel = seed && seed.company && seed.company.business_model;
  const industry = seed && seed.company && seed.company.industry;

  const baseSlug = normalizeBusinessModel(businessModel) || null;

  if (!baseSlug) {
    return {
      basePack: null,
      overlayPack: null,
      overrideReason: SELECTION_STATE_OVERRIDE_REASON.NO_MATCH,
      resolvedAt: new Date().toISOString(),
    };
  }

  const overlaySlug = resolveIndustryOverlay(industry);
  const hasOverlay = Boolean(overlaySlug);

  return {
    basePack: baseSlug,
    overlayPack: hasOverlay ? overlaySlug : null,
    overrideReason: hasOverlay ? null : (industry ? SELECTION_STATE_OVERRIDE_REASON.FALLBACK : null),
    resolvedAt: new Date().toISOString(),
  };
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| In-code frozen array as registry (`FAMILY_REGISTRY = Object.freeze([...])`) | Per-file JSON manifests with startup validator | Phase 106 (this phase) | Adding a new pack becomes a JSON file addition, not a code change |
| Overlay resolution: business-model-derived key lookup | Two-step: business model → base, industry → overlay | Phase 106 (this phase) | Enables industry specialization while keeping existing overlay logic intact |
| No selection state | `seed.packSelection: { basePack, overlayPack, overrideReason, resolvedAt }` | Phase 106 | Gives Phase 109 UI a defined read target; preserves operator override through approval flow |

**Deprecated/outdated after this phase:**
- `FAMILY_REGISTRY` constant in `template-family-map.cjs`: replaced by `getFamilyRegistry()` facade. The constant is removed from that file; the data lives in JSON manifests.
- `OVERLAY_DOCS` constant in `template-family-map.cjs`: can remain for the existing business-model overlay lookup (`inferOverlayKey`), or be inlined into the base pack manifests. Keep it unless it creates confusion.

---

## Open Questions

1. **`OVERLAY_DOCS` constant in `template-family-map.cjs`**: The existing `getOverlayDocForModel(entry, businessModel)` uses `inferOverlayKey(businessModel)` which maps business model slugs (not industry slugs) to overlay paths. The new industry overlay system is separate. Should `OVERLAY_DOCS` be removed and its values migrated into overlay pack manifests' `assets.overlayDoc`, or kept as-is to avoid touching the existing overlay path?
   - What we know: The existing consulting/saas/ecommerce/info-products overlay paths are in `OVERLAY_DOCS`. They're overlays by business model, not industry.
   - What's unclear: Whether Phase 106 should migrate these into overlay pack manifests (cleaner) or leave them in place (safer for backward compat).
   - Recommendation: Leave `OVERLAY_DOCS` and `inferOverlayKey` intact for Phase 106. Phase 107/108 can migrate them when actual overlay pack files are authored.

2. **Industry alias registry location**: CONTEXT.md says `lib/markos/packs/industries/{slug}.industry.json` but Phase 108 authors the actual industry packs. At Phase 106, should the industry alias map be:
   - (a) An inline `INDUSTRY_ALIASES` constant in `pack-loader.cjs` (stub — no JSON files yet, just slug mappings), or
   - (b) Actual stub `.industry.json` files for the 4 priority verticals with empty/stub assets
   - Recommendation: (a) for Phase 106 — inline stub map is sufficient to prove the contract. Phase 108 creates the actual JSON files and the loader switches to scanning `industries/*.industry.json`.

---

## Environment Availability

> Step 2.6: Checked — phase is CJS code + new JSON files. No external services, no CLI tools beyond `npm install`.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | runtime | ✓ | v22.13.0 | — |
| `ajv` | Manifest validation | ✗ (not installed) | — | Must `npm install ajv@^8.18.0` |
| `ajv-formats` | `date` format in schema | ✗ (not installed) | — | Must `npm install ajv-formats@^3.0.1` |
| `fs` built-in | Directory scan + JSON load | ✓ | built-in | — |
| `node:test` | Unit tests | ✓ | built-in | — |

**Missing dependencies with no fallback:**
- `ajv` — required for startup manifest validation
- `ajv-formats` — required for `date` format validation in changelog entries

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Node.js built-in `node:test` |
| Config file | none — tests are run directly |
| Quick run command | `node --test test/pack-loader.test.js` |
| Full suite command | `node --test test/` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LIB-01 | `resolveBusinessModelFamily('SaaS')` returns correct family entry via loader | unit | `node --test test/pack-loader.test.js` | ❌ Wave 0 |
| LIB-01 | `normalizeBusinessModel()` aliases still resolve after facade | unit | `node --test test/pack-loader.test.js` | ❌ Wave 0 |
| LIB-04 | `resolvePackSelection({ company: { business_model: 'SaaS', industry: 'IT' } })` returns correct shape | unit | `node --test test/pack-loader.test.js` | ❌ Wave 0 |
| LIB-04 | Selection state shape has all 4 contract fields | unit | `node --test test/pack-loader.test.js` | ❌ Wave 0 |
| INIT-02 | `resolvePackSelection` with unknown industry returns `overrideReason: 'fallback_no_overlay'` | unit | `node --test test/pack-loader.test.js` | ❌ Wave 0 |
| LIB-01 | Existing `example-resolver.test.js` suite 6 still passes through facade | regression | `node --test test/example-resolver.test.js` | ✅ exists |

### Sampling Rate

- **Per task commit:** `node --test test/pack-loader.test.js`
- **Per wave merge:** `node --test test/`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `test/pack-loader.test.js` — covers LIB-01, LIB-04, INIT-02 contract assertions
- [ ] Export `_resetCacheForTests()` from `pack-loader.cjs` so test suite can clear cache between cases

*(Existing test infrastructure in `test/example-resolver.test.js` must remain green as regression gate — no new test file needed for it.)*

---

## Sources

### Primary (HIGH confidence)

- Node.js v22 docs (`fs.readdirSync`, `JSON.parse`, `node:test`) — patterns verified against built-in behavior in this process
- Ajv v8 npm registry — `npm view ajv version` → `8.18.0`; CJS export confirmed as default `main` in v8.x. Source: https://ajv.js.org/guide/getting-started.html
- `onboarding/backend/agents/discipline-router.cjs` (lines 40–74) — canonical codebase pattern for module-level singleton JSON loading with warn-on-missing fallback
- `onboarding/backend/research/template-family-map.cjs` — full public API surface verified: `resolveBusinessModelFamily`, `getOverlayDocForModel`, `normalizeBusinessModel`, `getStageAwareDoc`, `toAbsoluteRepoPath`, `getFamilyEntry`, exported `FAMILY_REGISTRY`, `OVERLAY_DOCS`, `STAGE_AWARE_DOCS`, `SHARED_BASE_DOC`, `SHARED_PROOF_DOC`
- `test/example-resolver.test.js` — existing test suite confirmed using `node:test` + `assert/strict`
- `onboarding/backend/agents/example-resolver.cjs` — verified call sites for `resolveBusinessModelFamily`, `getOverlayDocForModel`, `getStageAwareDoc`, `toAbsoluteRepoPath`, `getFamilyEntry`
- `onboarding/backend/agents/skeleton-generator.cjs` — verified calls `resolveSkeleton` (from example-resolver) and `resolveBusinessModelFamily` (from template-family-map)

### Secondary (MEDIUM confidence)

- Ajv v8 strict mode defaults and CJS compat — cross-verified via npm registry + ajv.js.org documentation pattern

### Tertiary (LOW confidence)

- None — all critical claims verified from primary sources in-repo or Ajv registry

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Ajv version confirmed from npm registry; fs/path built-ins are stable Node.js 22
- Architecture: HIGH — Facade adapter pattern derived directly from existing codebase patterns (`discipline-router.cjs`, `template-family-map.cjs`)
- Pitfalls: HIGH — All pitfalls derived from direct code inspection, not conjecture
- Backward-compat seam: HIGH — Full call graph traced: `skeleton-generator → example-resolver → template-family-map`

**Research date:** 2026-04-14
**Valid until:** 2026-07-14 (stable domain — Ajv v8, fs built-ins are not fast-moving)
