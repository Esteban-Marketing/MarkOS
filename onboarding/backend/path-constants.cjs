'use strict';

/**
 * path-constants.cjs — Central Authority for MGSD Path Resolution
 * ═══════════════════════════════════════════════════════════════════════════════
 * PURPOSE: 
 *   Prevents "dot-hell" path resolution bugs by defining canonical project locations 
 *   in one place. All backend components should use these constants.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const path = require('path');

// Reference: This file is in onboarding/backend/
const BACKEND_DIR = __dirname;
const ONBOARDING_DIR = path.resolve(BACKEND_DIR, '..');
const PROJECT_ROOT = path.resolve(ONBOARDING_DIR, '..');

// Template & Resource Locations
const TEMPLATES_DIR = path.join(PROJECT_ROOT, '.agent/marketing-get-shit-done/templates');
const MIR_TEMPLATES = path.join(TEMPLATES_DIR, 'MIR');
const MSP_TEMPLATES = path.join(TEMPLATES_DIR, 'MSP');

// Config & Seed
const CONFIG_PATH = path.join(ONBOARDING_DIR, 'onboarding-config.json');
const SCHEMA_PATH = path.join(ONBOARDING_DIR, 'onboarding-seed.schema.json');

module.exports = {
  PROJECT_ROOT,
  ONBOARDING_DIR,
  BACKEND_DIR,
  TEMPLATES_DIR,
  MIR_TEMPLATES,
  MSP_TEMPLATES,
  CONFIG_PATH,
  SCHEMA_PATH
};
