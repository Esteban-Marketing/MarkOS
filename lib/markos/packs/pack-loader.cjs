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

// ─── Exports ──────────────────────────────────────────────────────────────────
module.exports = {
  getFamilyRegistry,
  _resetCacheForTests,
  // resolvePackSelection exported in Task 3 (Wave 3)
};
