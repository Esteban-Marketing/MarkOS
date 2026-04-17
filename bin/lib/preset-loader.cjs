'use strict';
/**
 * preset-loader.cjs — MarkOS Preset Bucket Loader
 * ═══════════════════════════════════════════════════════════════════════════════
 * PURPOSE:
 *   Loads a named preset bucket JSON from bin/lib/presets/ and provides
 *   helpers to apply it to the installer context and seed data.
 *
 * USAGE:
 *   const { loadPreset, applyPreset, VALID_PRESET_BUCKETS } = require('./lib/preset-loader.cjs');
 *   const preset = loadPreset('b2b-saas');
 *   const seed = applyPreset(preset, { company_name: 'Acme', product_name: 'Acme CRM' });
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const fs = require('node:fs');
const path = require('node:path');

const PRESETS_DIR = path.join(__dirname, 'presets');

const VALID_PRESET_BUCKETS = Object.freeze([
  'b2b-saas',
  'dtc',
  'agency',
  'local-services',
  'solopreneur',
]);

/**
 * Validates that a preset bucket name is supported.
 * @param {string} bucket
 * @returns {{ valid: boolean, error?: string }}
 */
function validateBucket(bucket) {
  if (!bucket || typeof bucket !== 'string') {
    return { valid: false, error: 'Preset bucket name must be a non-empty string.' };
  }
  if (!VALID_PRESET_BUCKETS.includes(bucket)) {
    return {
      valid: false,
      error: `Unknown preset bucket "${bucket}". Valid buckets: ${VALID_PRESET_BUCKETS.join(', ')}`,
    };
  }
  return { valid: true };
}

/**
 * Loads a preset JSON by bucket name.
 * @param {string} bucket - One of the VALID_PRESET_BUCKETS values
 * @returns {object} Parsed preset JSON
 * @throws {Error} If bucket is invalid or file cannot be read
 */
function loadPreset(bucket) {
  const check = validateBucket(bucket);
  if (!check.valid) {
    throw new Error(check.error);
  }

  const presetPath = path.join(PRESETS_DIR, `${bucket}.json`);
  if (!fs.existsSync(presetPath)) {
    throw new Error(`Preset file not found: ${presetPath}. Reinstall MarkOS to restore preset files.`);
  }

  try {
    return JSON.parse(fs.readFileSync(presetPath, 'utf8'));
  } catch (err) {
    throw new Error(`Failed to parse preset "${bucket}": ${err.message}`);
  }
}

/**
 * Builds a seed object from a preset, substituting template placeholders.
 *
 * Placeholder variables (e.g. {{company_name}}) in string values are replaced
 * with values from the provided substitutions map. Unknown placeholders are
 * left as-is so callers can identify what data to fill in.
 *
 * @param {object} preset - Loaded preset object (from loadPreset)
 * @param {object} [substitutions={}] - Map of placeholder keys to replacement strings
 * @returns {object} Seed data ready to write to onboarding-seed.json
 */
function applyPreset(preset, substitutions = {}) {
  const substituted = substituteDeep(preset, substitutions);

  return {
    _preset_bucket: preset._bucket,
    _preset_schema: preset._schema,
    _preset_applied_at: new Date().toISOString(),
    company: substituted.mir_seed?.company || {},
    product: substituted.mir_seed?.product || {},
    audience: substituted.mir_seed?.audience || {},
    market: substituted.mir_seed?.market || {},
    content_maturity: substituted.mir_seed?.content_maturity || 'none',
    budget_range: substituted.mir_seed?.budget_range || null,
    msp: substituted.msp_seed || {},
    brand_pack: substituted.brand_pack_placeholder || {},
    literacy_nodes: substituted.literacy_nodes || {},
  };
}

/**
 * Recursively walks an object/array and substitutes {{placeholder}} tokens.
 * @param {*} value
 * @param {object} substitutions
 * @returns {*}
 */
function substituteDeep(value, substitutions) {
  if (typeof value === 'string') {
    return value.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      return Object.prototype.hasOwnProperty.call(substitutions, key)
        ? String(substitutions[key])
        : `{{${key}}}`;
    });
  }
  if (Array.isArray(value)) {
    return value.map(item => substituteDeep(item, substitutions));
  }
  if (value !== null && typeof value === 'object') {
    const result = {};
    for (const [k, v] of Object.entries(value)) {
      result[k] = substituteDeep(v, substitutions);
    }
    return result;
  }
  return value;
}

/**
 * Writes a preset-derived seed to the canonical seed path.
 * @param {string} seedPath - Absolute path to write onboarding-seed.json
 * @param {object} seed - Seed data from applyPreset()
 */
function writePresetSeed(seedPath, seed) {
  fs.mkdirSync(path.dirname(seedPath), { recursive: true });
  fs.writeFileSync(seedPath, JSON.stringify(seed, null, 2), 'utf8');
}

module.exports = {
  VALID_PRESET_BUCKETS,
  validateBucket,
  loadPreset,
  applyPreset,
  writePresetSeed,
};
