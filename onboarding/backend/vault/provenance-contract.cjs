'use strict';

function createError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function normalizeToken(value) {
  return String(value || '').trim();
}

function normalizeStringArray(value) {
  const list = Array.isArray(value) ? value : [];
  return Array.from(new Set(list.map((entry) => normalizeToken(entry)).filter((entry) => entry.length > 0)));
}

function normalizeProvenance(provenance, defaults = {}) {
  const payload = provenance && typeof provenance === 'object' ? provenance : {};

  return {
    source: payload.source || {
      system: defaults.sourceSystem || 'vault-writer',
      kind: defaults.sourceKind || defaults.sourceMode || 'generated',
    },
    timestamp: payload.timestamp || defaults.timestamp || new Date().toISOString(),
    actor: payload.actor || {
      id: defaults.actorId || defaults.projectSlug || 'system',
      type: defaults.actorType || 'system',
    },
    lineage: Array.isArray(payload.lineage) ? payload.lineage : ['vault-writer'],
    joins: {
      audience: normalizeStringArray(payload?.joins?.audience),
      pain_point_tags: normalizeStringArray(payload?.joins?.pain_point_tags),
    },
  };
}

function validateTimestamp(value) {
  if (!normalizeToken(value)) {
    throw createError('E_PROVENANCE_MISSING_TIMESTAMP', 'Provenance timestamp is required.');
  }

  if (Number.isNaN(Date.parse(value))) {
    throw createError('E_PROVENANCE_INVALID_TIMESTAMP', 'Provenance timestamp must be a valid ISO timestamp.');
  }

  return value;
}

function validateProvenance(provenance) {
  if (!provenance || typeof provenance !== 'object') {
    throw createError('E_PROVENANCE_INVALID_PAYLOAD', 'Provenance payload must be an object.');
  }

  const sourceSystem = normalizeToken(provenance?.source?.system);
  const sourceKind = normalizeToken(provenance?.source?.kind);
  if (!sourceSystem || !sourceKind) {
    throw createError('E_PROVENANCE_MISSING_SOURCE', 'Provenance source.system and source.kind are required.');
  }

  const actorId = normalizeToken(provenance?.actor?.id);
  const actorType = normalizeToken(provenance?.actor?.type);
  if (!actorId || !actorType) {
    throw createError('E_PROVENANCE_MISSING_ACTOR', 'Provenance actor.id and actor.type are required.');
  }

  const lineage = normalizeStringArray(provenance.lineage);
  if (lineage.length === 0) {
    throw createError('E_PROVENANCE_MISSING_LINEAGE', 'Provenance lineage must contain at least one step.');
  }

  const timestamp = validateTimestamp(provenance.timestamp);

  return {
    source: {
      system: sourceSystem,
      kind: sourceKind,
    },
    timestamp,
    actor: {
      id: actorId,
      type: actorType,
    },
    lineage,
    joins: {
      audience: normalizeStringArray(provenance?.joins?.audience),
      pain_point_tags: normalizeStringArray(provenance?.joins?.pain_point_tags),
    },
  };
}

module.exports = {
  normalizeProvenance,
  validateProvenance,
};
