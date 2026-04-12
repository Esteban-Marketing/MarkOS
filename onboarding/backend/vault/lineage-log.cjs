'use strict';

function createError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function asFunction(value, code, message) {
  if (typeof value !== 'function') {
    throw createError(code, message);
  }
  return value;
}

function normalize(value) {
  return String(value || '').trim();
}

async function appendLineageEvent(entry, append) {
  const tenantId = normalize(entry && entry.tenant_id);
  const artifactId = normalize(entry && entry.artifact_id);

  if (!tenantId || !artifactId) {
    throw createError(
      'E_LINEAGE_IDENTITY_REQUIRED',
      'Lineage events require tenant_id and artifact_id.'
    );
  }

  const payload = {
    ...entry,
    tenant_id: tenantId,
    artifact_id: artifactId,
    timestamp: normalize(entry && entry.timestamp) || new Date().toISOString(),
  };

  return append(payload);
}

function createLineageLogger(options = {}) {
  const append = asFunction(
    options.append,
    'E_LINEAGE_APPEND_REQUIRED',
    'append(entry) is required for lineage logger.'
  );

  return {
    appendLineageEvent(entry) {
      return appendLineageEvent(entry, append);
    },
  };
}

module.exports = {
  appendLineageEvent,
  createLineageLogger,
};
