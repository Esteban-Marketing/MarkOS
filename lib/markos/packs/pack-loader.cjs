'use strict';
/**
 * lib/markos/packs/pack-loader.cjs
 *
 * Singleton cache loader for MarkOS pack manifests.
 * Reads *.pack.json files from this directory, validates them with Ajv v8,
 * and returns an adapted array compatible with the legacy FAMILY_REGISTRY shape
 * expected by template-family-map.cjs callers.
 *
 * Exports:
 *   getFamilyRegistry()      → frozen array of legacy-shaped registry entries
 *   resolvePackSelection()   → added in Wave 3 (Task 3 of this plan)
 *   _resetCacheForTests()    → clears the singleton cache (test isolation only)
 */

const fs   = require('fs');
const path = require('path');
const Ajv  = require('ajv');

const PACKS_DIR   = path.resolve(__dirname, '.');
const SCHEMA_PATH = path.resolve(__dirname, 'pack-schema.json');

const SHARED_BASE_DOC  = '.agent/markos/literacy/Shared/TPL-SHARED-tone-and-naturality.md';
const SHARED_PROOF_DOC = '.agent/markos/literacy/Shared/TPL-SHARED-proof-posture.md';

// ─── Singleton state ──────────────────────────────────────────────────────────
let _registryCache = null;
let _validator     = null;
let _warnedEmpty   = false;

// ─── Value canonicalization (mirrors template-family-map.cjs) ────────────────
function canonicalizeValue(value) {
  return String(value == null ? '' : value)
    .trim()
    .toLowerCase()
    .replace(/[._/]+/g, ' ')
    .replace(/\s*&\s*/g, ' and ')
    .replace(/[^a-z0-9\s-]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ─── Ajv validator (compiled once on first use) ───────────────────────────────
function getValidator() {
  if (_validator) return _validator;
  try {
    const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'));
    const ajv = new Ajv({ allErrors: true, strict: false });
    _validator = ajv.compile(schema);
  } catch (err) {
    console.warn('[pack-loader] Failed to compile pack-schema.json:', err.message);
    // Fallback: accept-all validator so loader continues to function
    _validator = () => true;
    _validator.errors = [];
  }
  return _validator;
}

// ─── Overlay key derivation ───────────────────────────────────────────────────
// Mirrors inferOverlayKey() logic from template-family-map.cjs.
// Must produce the same key so adaptToLegacyShape() builds an overlayDocs object
// that getOverlayDocForModel() can look up correctly.
function deriveOverlayKey(slug, aliases) {
  const candidates = [slug, ...(Array.isArray(aliases) ? aliases : [])];
  for (const candidate of candidates) {
    const token = canonicalizeValue(candidate);
    if (token === 'saas' || token === 'software as a service' || token === 'software service') return 'saas';
    if (token === 'consulting' || token === 'consultant') return 'consulting';
    if (
      token === 'ecommerce' || token === 'e-commerce' || token === 'dtc' ||
      token === 'marketplace' || token === 'retail'
    ) return 'ecommerce';
    if (
      token === 'info-products' || token === 'info products' || token === 'digital products' ||
      token === 'course' || token === 'courses' || token === 'education offer'
    ) return 'info-products';
  }
  return null;
}

// ─── Legacy shape adapter ─────────────────────────────────────────────────────
// Translates the rich pack manifest schema to the legacy FAMILY_REGISTRY entry
// shape that template-family-map.cjs callers (example-resolver, skeleton-generator,
// icp-candidate-builder) expect without modification.
function adaptToLegacyShape(manifest) {
  const overlayDocs = {};

  if (manifest.assets && manifest.assets.overlayDoc) {
    const overlayKey = deriveOverlayKey(manifest.slug, manifest.aliases);
    if (overlayKey) {
      overlayDocs[overlayKey] = manifest.assets.overlayDoc;
    }
  }

  return {
    // ── Required legacy fields ──
    slug:        manifest.slug,
    aliases:     Array.isArray(manifest.aliases) ? manifest.aliases : [],
    baseDoc:     (manifest.assets && manifest.assets.baseDoc)  || SHARED_BASE_DOC,
    proofDoc:    (manifest.assets && manifest.assets.proofDoc) || SHARED_PROOF_DOC,
    overlayDocs,
    // ── Extra fields for Phase 110 diagnostics (callers ignore these) ──
    displayName:     manifest.displayName  || '',
    completeness:    manifest.completeness || {},
    fallbackAllowed: manifest.fallbackAllowed !== false,
    type:            manifest.type || 'base',
  };
}

// ─── Main registry loader ─────────────────────────────────────────────────────
function getFamilyRegistry() {
  if (_registryCache) return _registryCache;

  try {
    const packFiles = fs.readdirSync(PACKS_DIR)
      .filter(f => f.endsWith('.pack.json'))
      .sort(); // deterministic order

    if (packFiles.length === 0) {
      if (!_warnedEmpty) {
        console.warn('[pack-loader] No *.pack.json files found in', PACKS_DIR);
        _warnedEmpty = true;
      }
      _registryCache = Object.freeze([]);
      return _registryCache;
    }

    const validate = getValidator();
    const adapted  = [];

    for (const file of packFiles) {
      const filePath = path.join(PACKS_DIR, file);
      let manifest;

      // Security: use readFileSync+JSON.parse, NOT require() — avoids stale require.cache in tests
      try {
        manifest = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } catch (parseErr) {
        console.warn('[pack-loader] Skipping', file, '— JSON parse error:', parseErr.message);
        continue;
      }

      if (!validate(manifest)) {
        console.warn('[pack-loader] Skipping', file, '— schema validation errors:',
          JSON.stringify(validate.errors, null, 2));
        continue;
      }

      adapted.push(adaptToLegacyShape(manifest));
    }

    _registryCache = Object.freeze(adapted);
    return _registryCache;

  } catch (err) {
    console.warn('[pack-loader] Failed to load pack registry:', err.message);
    _registryCache = Object.freeze([]);
    return _registryCache;
  }
}

// ─── Test isolation hook ──────────────────────────────────────────────────────
// Call before each test case that needs a fresh registry read.
// Never called by production code.
function _resetCacheForTests() {
  _registryCache = null;
  _validator     = null;
  _warnedEmpty   = false;
}

// ─── Industry overlay alias map (stub — Phase 108 adds .industry.json files) ─
// Maps canonicalized industry strings → overlay pack slug.
// Security: input is canonicalized (no path chars) before lookup. Static object, no eval.
const INDUSTRY_ALIAS_MAP = Object.freeze({
  // Travel
  'travel':                 'travel',
  'hospitality':            'travel',
  'tourism':                'travel',
  'hotels':                 'travel',
  // Information Technology
  'it':                     'it',
  'information technology': 'it',
  'tech':                   'it',
  'technology':             'it',
  'software':               'it',
  'cybersecurity':          'it',
  // Marketing Services
  'marketing services':     'marketing-services',
  'marketing agency':       'marketing-services',
  'digital marketing':      'marketing-services',
  'performance marketing':  'marketing-services',
  // Professional Services
  'professional services':  'professional-services',
  'consulting services':    'professional-services',
  'advisory':               'professional-services',
  'management consulting':  'professional-services',
});

// Resolve an industry string to its overlay pack slug using INDUSTRY_ALIAS_MAP.
// Returns null if the industry does not match any known overlay.
// Security: canonicalizeValue() strips all non-alphanumeric chars except space and hyphen
// before the lookup — prevents any path traversal or injection via the industry field.
function resolveIndustryOverlay(industry) {
  if (!industry) return null;
  const token = canonicalizeValue(industry);
  return INDUSTRY_ALIAS_MAP[token] || null;
}

// Resolve the base family slug from a business_model string.
// This replicates the normalizeBusinessModel() logic using the loaded registry.
// Internal use only — template-family-map.cjs exports normalizeBusinessModel() for callers.
function resolveBaseSlug(businessModel) {
  if (!businessModel) return null;
  const token = canonicalizeValue(businessModel);
  if (!token) return null;
  for (const entry of getFamilyRegistry()) {
    if (token === canonicalizeValue(entry.slug)) return entry.slug;
    if (entry.aliases.some(a => canonicalizeValue(a) === token)) return entry.slug;
  }
  return null;
}

// ─── Pack selection resolver ──────────────────────────────────────────────────
/**
 * Resolve the canonical pack selection from onboarding seed data.
 *
 * Two-step deterministic algorithm (per Phase 106 Decision 3):
 *   Step 1: business_model → base family slug (alias match)
 *   Step 2: industry → overlay slug (INDUSTRY_ALIAS_MAP lookup)
 *            Missing overlay pack file → base-only with console.warn (never hard failure)
 *
 * @param {object} seed - Onboarding seed object (seed.company.business_model / seed.company.industry)
 * @returns {{ basePack: string|null, overlayPack: string|null, overrideReason: string|null, resolvedAt: string }}
 *          resolvedAt is always an ISO 8601 string. Persisted to seed.packSelection by caller.
 */
function resolvePackSelection(seed) {
  const businessModel = (seed && seed.company && seed.company.business_model) || null;
  const industry      = (seed && seed.company && seed.company.industry)       || null;

  // Step 1: base family
  const baseSlug = resolveBaseSlug(businessModel);

  if (!baseSlug) {
    return {
      basePack:       null,
      overlayPack:    null,
      overrideReason: 'no_business_model_match',
      resolvedAt:     new Date().toISOString(),
    };
  }

  // Step 2: industry overlay
  // Phase 106 uses an inline alias stub; Phase 108 populates actual .industry.json files.
  // If no matching overlay slug is found, or if the overlay pack file does not yet exist,
  // fall back to base-only with a diagnostic log (never a hard failure).
  const overlaySlug = resolveIndustryOverlay(industry);

  if (overlaySlug) {
    // Check whether an overlay pack file exists (Phase 108+ will create these)
    const overlayFilePath = path.join(__dirname, 'industries', overlaySlug + '.industry.json');
    const overlayExists   = fs.existsSync(overlayFilePath);

    if (!overlayExists) {
      console.warn(
        '[pack-loader] Industry overlay pack "' + overlaySlug + '" not found — using base-only (' + baseSlug + ')'
      );
    }

    return {
      basePack:       baseSlug,
      overlayPack:    overlayExists ? overlaySlug : null,
      overrideReason: null,
      resolvedAt:     new Date().toISOString(),
    };
  }

  return {
    basePack:       baseSlug,
    overlayPack:    null,
    overrideReason: null,
    resolvedAt:     new Date().toISOString(),
  };
}

// ─── Exports ──────────────────────────────────────────────────────────────────
module.exports = {
  getFamilyRegistry,
  resolvePackSelection,
  _resetCacheForTests,
};
