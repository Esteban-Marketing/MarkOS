'use strict';

const {
  OPTIONAL_TAG_FIELDS,
  normalizeTagList,
  normalizeNeuroTriggerTags,
  normalizeNeuroAwareTaxonomy,
} = require('./neuro-literacy-taxonomy.cjs');

const PROFILE_FIELDS = Object.freeze([
  'company_tailoring_profile',
  'icp_tailoring_profile',
  'stage_tailoring_profile',
  'neuro_profile',
]);

function normalizeToken(value) {
  return String(value == null ? '' : value).trim();
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function cloneObject(value) {
  if (!isPlainObject(value)) {
    return {};
  }
  return JSON.parse(JSON.stringify(value));
}

function normalizeNeuroProfile(value) {
  const profile = cloneObject(value);
  const triggerTags = normalizeNeuroTriggerTags(profile.trigger_tags || profile.neuro_trigger_tags);
  const ethicsGuardrails = normalizeTagList(profile.ethics_guardrails || ['evidence_required', 'non_manipulative']);

  return {
    ...profile,
    trigger_tags: triggerTags,
    rationale: normalizeToken(profile.rationale || ''),
    evidence_required: profile.evidence_required !== false,
    manipulation_blocked: profile.manipulation_blocked !== false,
    ethics_guardrails: ethicsGuardrails,
  };
}

function normalizeNeuroLiteracyMetadata(input = {}) {
  const source = input && typeof input === 'object' ? input : {};
  const taxonomy = normalizeNeuroAwareTaxonomy(source);
  const neuroProfile = normalizeNeuroProfile(source.neuro_profile);

  if (taxonomy.neuro_trigger_tags.length > 0 && neuroProfile.trigger_tags.length === 0) {
    neuroProfile.trigger_tags = taxonomy.neuro_trigger_tags.slice();
  }

  return {
    ...taxonomy,
    company_tailoring_profile: cloneObject(source.company_tailoring_profile),
    icp_tailoring_profile: cloneObject(source.icp_tailoring_profile),
    stage_tailoring_profile: cloneObject(source.stage_tailoring_profile),
    neuro_profile: neuroProfile,
  };
}

module.exports = {
  OPTIONAL_TAG_FIELDS,
  PROFILE_FIELDS,
  normalizeNeuroProfile,
  normalizeNeuroLiteracyMetadata,
};
