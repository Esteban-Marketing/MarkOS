'use strict';

function normalizeToken(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function uniqueTokens(values) {
  const tokens = Array.isArray(values) ? values : [];
  const normalized = tokens
    .map((value) => normalizeToken(value))
    .filter((value) => value.length > 0);
  return Array.from(new Set(normalized));
}

function buildManifestEntries({ dimension, values, destination }) {
  const tokenValues = uniqueTokens(values);
  if (tokenValues.length === 0) {
    return [];
  }

  return tokenValues.map((value) => ({
    dimension,
    value,
    discipline_root_path: destination.discipline_root_path,
    note_id: destination.note_id,
    destination_path: destination.destination_path,
    manifest_path: `${destination.canonical_root}/Semantic-Index/${dimension}/${value}.json`,
  }));
}

function buildSemanticIndexManifests({ destination, audience = [], funnel = [], concepts = [] }) {
  if (!destination || !destination.canonical_root || !destination.destination_path) {
    return [];
  }

  return [
    ...buildManifestEntries({ dimension: 'audience', values: audience, destination }),
    ...buildManifestEntries({ dimension: 'funnel', values: funnel, destination }),
    ...buildManifestEntries({ dimension: 'concept', values: concepts, destination }),
  ];
}

module.exports = {
  buildSemanticIndexManifests,
  normalizeToken,
  uniqueTokens,
};
