'use strict';

const { parseLiteracyFrontmatter } = require('../literacy-chunker.cjs');

const REQUIRED_TEMPLATE_FIELDS = Object.freeze([
  'doc_id',
  'discipline',
  'business_model',
  'pain_point_tags',
  'funnel_stage',
  'buying_maturity',
  'tone_guidance',
  'proof_posture',
  'naturality_expectations',
]);

function hasValue(value) {
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === 'object') return Object.keys(value).length > 0;
  return value !== undefined && value !== null && String(value).trim() !== '';
}

function validateTemplateMetadata(metadata = {}, options = {}) {
  const errors = [];
  const source = metadata && typeof metadata === 'object' ? metadata : {};

  for (const field of REQUIRED_TEMPLATE_FIELDS) {
    if (!hasValue(source[field])) {
      errors.push(`missing required field: ${field}`);
    }
  }

  if (options.requireOverlay) {
    if (!hasValue(source.overlay_for)) {
      errors.push('missing required field: overlay_for');
    }

    const businessModel = source.business_model;
    const usesAll = Array.isArray(businessModel)
      ? businessModel.map((entry) => String(entry).toLowerCase()).includes('all')
      : String(businessModel || '').toLowerCase() === 'all';

    if (usesAll) {
      errors.push('overlay docs must target a specific business_model, not all');
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    metadata: source,
  };
}

function validateTemplateMarkdown(markdown, options = {}) {
  const metadata = parseLiteracyFrontmatter(markdown);
  return validateTemplateMetadata(metadata, options);
}

module.exports = {
  REQUIRED_TEMPLATE_FIELDS,
  validateTemplateMetadata,
  validateTemplateMarkdown,
};
