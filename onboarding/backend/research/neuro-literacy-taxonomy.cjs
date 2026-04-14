'use strict';

const NEURO_TRIGGER_IDS = Object.freeze([
  'B01',
  'B02',
  'B03',
  'B04',
  'B05',
  'B06',
  'B07',
  'B08',
  'B09',
  'B10',
]);

const OPTIONAL_TAG_FIELDS = Object.freeze([
  'desired_outcome_tags',
  'objection_tags',
  'trust_driver_tags',
  'trust_blocker_tags',
  'emotional_state_tags',
  'neuro_trigger_tags',
  'archetype_tags',
  'naturality_tags',
  'icp_segment_tags',
]);

const NEURO_TRIGGER_SET = new Set(NEURO_TRIGGER_IDS);

function normalizeToken(value) {
  return String(value == null ? '' : value).trim();
}

function toList(value) {
  if (value == null) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

function uniqueSorted(values) {
  return Array.from(new Set(values.filter(Boolean))).sort((left, right) => left.localeCompare(right));
}

function normalizeTag(value) {
  return normalizeToken(value)
    .toLowerCase()
    .replace(/\s+/g, '_');
}

function normalizeTagList(value) {
  return uniqueSorted(toList(value).map(normalizeTag));
}

function normalizeNeuroTriggerTag(value) {
  const token = normalizeToken(value).toUpperCase();
  if (!/^B\d{2}$/.test(token)) {
    return '';
  }
  return NEURO_TRIGGER_SET.has(token) ? token : '';
}

function normalizeNeuroTriggerTags(value) {
  return uniqueSorted(toList(value).map(normalizeNeuroTriggerTag));
}

function normalizeNeuroAwareTaxonomy(input = {}) {
  const source = input && typeof input === 'object' ? input : {};

  return {
    desired_outcome_tags: normalizeTagList(source.desired_outcome_tags),
    objection_tags: normalizeTagList(source.objection_tags),
    trust_driver_tags: normalizeTagList(source.trust_driver_tags),
    trust_blocker_tags: normalizeTagList(source.trust_blocker_tags),
    emotional_state_tags: normalizeTagList(source.emotional_state_tags),
    neuro_trigger_tags: normalizeNeuroTriggerTags(source.neuro_trigger_tags || source.trigger_tags),
    archetype_tags: normalizeTagList(source.archetype_tags),
    naturality_tags: normalizeTagList(source.naturality_tags),
    icp_segment_tags: normalizeTagList(source.icp_segment_tags),
  };
}

module.exports = {
  NEURO_TRIGGER_IDS,
  OPTIONAL_TAG_FIELDS,
  normalizeTagList,
  normalizeNeuroTriggerTags,
  normalizeNeuroAwareTaxonomy,
};
