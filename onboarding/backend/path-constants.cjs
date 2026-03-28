'use strict';

/**
 * path-constants.cjs — Central Authority for MarkOS Path Resolution
 * ═══════════════════════════════════════════════════════════════════════════════
 * PURPOSE:
 *   Prevents "dot-hell" path resolution bugs by defining canonical project locations
 *   in one place. MarkOS remains publicly canonical while several filesystem
 *   surfaces stay on legacy MGSD-compatible paths during v2.1.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const path = require('path');

// Reference: This file is in onboarding/backend/
const BACKEND_DIR = __dirname;
const ONBOARDING_DIR = path.resolve(BACKEND_DIR, '..');
const PROJECT_ROOT = path.resolve(ONBOARDING_DIR, '..');

// Template & Resource Locations
const PROTOCOL_DIR = path.join(PROJECT_ROOT, '.agent/marketing-get-shit-done');
const TEMPLATES_DIR = path.join(PROJECT_ROOT, '.agent/marketing-get-shit-done/templates');
const MIR_TEMPLATES = path.join(TEMPLATES_DIR, 'MIR');
const MSP_TEMPLATES = path.join(TEMPLATES_DIR, 'MSP');

// Legacy compatibility state surfaces retained during identity normalization
const LEGACY_LOCAL_DIR = path.join(PROJECT_ROOT, '.mgsd-local');
const PROJECT_CONFIG_PATH = path.join(PROJECT_ROOT, '.mgsd-project.json');
const INSTALL_MANIFEST_PATH = path.join(PROJECT_ROOT, '.mgsd-install-manifest.json');

// Config & Seed
const CONFIG_PATH = path.join(ONBOARDING_DIR, 'onboarding-config.json');
const SCHEMA_PATH = path.join(ONBOARDING_DIR, 'onboarding-seed.schema.json');

module.exports = {
  PROJECT_ROOT,
  ONBOARDING_DIR,
  BACKEND_DIR,
  PROTOCOL_DIR,
  TEMPLATES_DIR,
  MIR_TEMPLATES,
  MSP_TEMPLATES,
  LEGACY_LOCAL_DIR,
  PROJECT_CONFIG_PATH,
  INSTALL_MANIFEST_PATH,
  CONFIG_PATH,
  SCHEMA_PATH
};
