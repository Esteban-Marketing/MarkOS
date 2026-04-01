/**
 * onboarding/backend/handlers/submit.cjs — Intake form validation & Linear automation
 * 
 * Exports:
 *   - validateIntakeSeed(seed) → validates against 8 rules (R001–R008)
 *   - ensureUniqueSlug(proposedSlug, vectorMemory) → checks uniqueness, appends timestamp on collision
 *   - buildLinearTasks(seed, slug) → creates MARKOS-ITM-OPS-03 + MARKOS-ITM-INT-01 tasks
 */

'use strict';

const crypto = require('crypto');

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const COMPANY_STAGES = ['pre-launch', '0-1M MRR', '1-10M MRR', '+10M MRR'];
const CONTENT_MATURITY_LEVELS = ['none', 'basic', 'moderate', 'mature'];
const INTAKE_ALLOWED_TOKENS = ['MARKOS-ITM-OPS-03', 'MARKOS-ITM-INT-01'];

// ─────────────────────────────────────────────────────────────────────────────
// Validation Rules (R001–R008)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validate intake seed against 8 rules + cross-field checks
 * @param {Object} seed - Intake seed data
 * @returns {Object} { valid: boolean, errors: Array<{rule_id, field, message}> }
 */
function validateIntakeSeed(seed) {
  const errors = [];

  if (!seed || typeof seed !== 'object') {
    return { valid: false, errors: [{ rule_id: 'ROOT', field: 'seed', message: 'Seed must be a valid object' }] };
  }

  // R001: company.name required, non-empty, max 100 chars
  if (!seed?.company?.name || seed.company.name.trim() === '' || seed.company.name.length > 100) {
    errors.push({
      rule_id: 'R001',
      field: 'company.name',
      message: 'Company name is required (max 100 chars)'
    });
  }

  // R002: company.stage in enum
  if (!seed?.company?.stage || !COMPANY_STAGES.includes(seed.company.stage)) {
    errors.push({
      rule_id: 'R002',
      field: 'company.stage',
      message: 'Company stage must be one of: pre-launch, 0-1M MRR, 1-10M MRR, +10M MRR'
    });
  }

  // R003: product.name required, non-empty, max 100 chars
  if (!seed?.product?.name || seed.product.name.trim() === '' || seed.product.name.length > 100) {
    errors.push({
      rule_id: 'R003',
      field: 'product.name',
      message: 'Product name is required (max 100 chars)'
    });
  }

  // R004: audience.pain_points array, min 2 items
  if (!Array.isArray(seed?.audience?.pain_points) || seed.audience.pain_points.length < 2) {
    errors.push({
      rule_id: 'R004',
      field: 'audience.pain_points',
      message: 'At least 2 audience pain points required'
    });
  }

  // R005: market.competitors array, min 2 objects with name + positioning
  const competitors = seed?.market?.competitors;
  const validCompetitors =
    Array.isArray(competitors) &&
    competitors.length >= 2 &&
    competitors.every(c => c?.name && c?.positioning);
  
  if (!validCompetitors) {
    errors.push({
      rule_id: 'R005',
      field: 'market.competitors',
      message: 'At least 2 competitors with positioning required'
    });
  }

  // R006: market.market_trends array, min 1 item
  if (!Array.isArray(seed?.market?.market_trends) || seed.market.market_trends.length < 1) {
    errors.push({
      rule_id: 'R006',
      field: 'market.market_trends',
      message: 'At least 1 market trend required'
    });
  }

  // R007: content.content_maturity in enum
  if (!seed?.content?.content_maturity || !CONTENT_MATURITY_LEVELS.includes(seed.content.content_maturity)) {
    errors.push({
      rule_id: 'R007',
      field: 'content.content_maturity',
      message: 'Content maturity level required'
    });
  }

  // R008: slug (if provided) alphanumeric + hyphens only
  if (seed?.slug !== undefined && seed.slug !== null) {
    const slugRegex = /^[a-z0-9-]+$/;
    if (typeof seed.slug !== 'string' || !slugRegex.test(seed.slug)) {
      errors.push({
        rule_id: 'R008',
        field: 'slug',
        message: 'Project slug must be alphanumeric with hyphens only'
      });
    }
  }

  // Cross-field consistency: Pre-launch companies must have market trends
  if (seed?.company?.stage === 'pre-launch' && (!Array.isArray(seed?.market?.market_trends) || seed.market.market_trends.length === 0)) {
    errors.push({
      rule_id: 'CROSS-FIELD',
      field: 'market.market_trends',
      message: 'Pre-launch companies must provide market trends'
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Slug Handling
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Auto-generate slug from company name
 * @param {string} companyName
 * @returns {string} Sanitized slug
 */
function generateSlug(companyName) {
  if (!companyName) return `project-${Date.now()}`;
  
  return companyName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-')
    .slice(0, 50);
}

/**
 * Ensure slug uniqueness by checking vector memory
 * If slug exists, append timestamp + uuid suffix
 * @param {string} proposedSlug
 * @param {Object} vectorMemory - Vector store client
 * @returns {Promise<string>} Final unique slug
 */
async function ensureUniqueSlug(proposedSlug, vectorMemory) {
  if (!vectorMemory || !proposedSlug) {
    return proposedSlug;
  }

  // Check if slug already exists
  const exists = await vectorMemory.exists(`${proposedSlug}/seed`);
  
  if (!exists) {
    return proposedSlug;
  }

  // Collision detected: append timestamp + uuid
  const timestamp = Date.now();
  const uuid = crypto.randomUUID().slice(0, 4);
  return `${proposedSlug}-${timestamp}-${uuid}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Linear Ticket Building
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build Linear task array for /linear/sync endpoint
 * Creates exactly 2 tasks: MARKOS-ITM-OPS-03 (intake received) + MARKOS-ITM-INT-01 (data quality)
 * @param {Object} seed - Intake seed data
 * @param {string} slug - Project slug
 * @returns {Array} Tasks array for /linear/sync
 */
function buildLinearTasks(seed, slug) {
  const tasks = [
    {
      token: 'MARKOS-ITM-OPS-03',
      variables: {
        client_name: seed?.company?.name || 'Unknown Client',
        company_stage: seed?.company?.stage || 'Unknown Stage',
        project_slug: slug
      },
      assignee: null
    },
    {
      token: 'MARKOS-ITM-INT-01',
      variables: {
        client_name: seed?.company?.name || 'Unknown Client',
        validation_timestamp: new Date().toISOString(),
        project_slug: slug
      },
      assignee: null
    }
  ];

  // Filter by whitelist (only allowed tokens)
  return tasks.filter(t => INTAKE_ALLOWED_TOKENS.includes(t.token));
}

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  validateIntakeSeed,
  ensureUniqueSlug,
  buildLinearTasks,
  generateSlug
};
