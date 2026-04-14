'use strict';

const { normalizeNeuroLiteracyMetadata } = require('../research/neuro-literacy-schema.cjs');

function createError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function normalizeToken(value) {
  return String(value || '').trim();
}

function normalizeStringList(value) {
  const list = Array.isArray(value) ? value : [];
  return list.map((entry) => normalizeToken(entry)).filter((entry) => entry.length > 0);
}

function assertRequiredField(metadata, key) {
  const value = metadata[key];
  if (value === null || value === undefined) {
    throw createError('E_AUDIENCE_METADATA_REQUIRED', `Missing required metadata field: ${key}`);
  }

  if (typeof value === 'string' && !normalizeToken(value)) {
    throw createError('E_AUDIENCE_METADATA_REQUIRED', `Missing required metadata field: ${key}`);
  }
}

function isAllowedAudienceTag(value) {
  return /^(ICP|SEGMENT|ROLE|PAIN):[A-Za-z0-9_-]+$/i.test(value);
}

function validateAudienceMetadata(input) {
  const metadata = input && typeof input === 'object' ? input : {};

  assertRequiredField(metadata, 'discipline');
  assertRequiredField(metadata, 'audience');
  assertRequiredField(metadata, 'business_model');
  assertRequiredField(metadata, 'pain_point_tags');

  const audience = normalizeStringList(metadata.audience);
  if (audience.length === 0) {
    throw createError('E_AUDIENCE_TAG_INVALID', 'Audience metadata must contain at least one allowed tag.');
  }

  for (const tag of audience) {
    if (!isAllowedAudienceTag(tag)) {
      throw createError('E_AUDIENCE_TAG_INVALID', `Audience tag is invalid: ${tag}`);
    }
  }

  const painPointTags = normalizeStringList(metadata.pain_point_tags);
  if (painPointTags.length === 0) {
    throw createError('E_AUDIENCE_METADATA_REQUIRED', 'pain_point_tags must contain at least one value.');
  }

  return {
    discipline: normalizeToken(metadata.discipline),
    business_model: normalizeToken(metadata.business_model),
    audience,
    pain_point_tags: painPointTags,
    ...normalizeNeuroLiteracyMetadata(metadata),
  };
}

module.exports = {
  validateAudienceMetadata,
};
