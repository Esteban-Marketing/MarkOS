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

function createIngestRouter(options = {}) {
  const persistArtifact = asFunction(
    options.persistArtifact,
    'E_INGEST_PERSIST_REQUIRED',
    'persistArtifact(event) function is required.'
  );

  const indexArtifact = asFunction(
    options.indexArtifact,
    'E_INGEST_INDEX_REQUIRED',
    'indexArtifact(event) function is required.'
  );

  async function route({ event }) {
    if (!event || typeof event !== 'object') {
      throw createError('E_INGEST_EVENT_REQUIRED', 'ingest router requires an event payload.');
    }

    const persisted = await persistArtifact(event);
    const indexed = await indexArtifact(event);

    return {
      accepted: true,
      event,
      persisted,
      indexed,
    };
  }

  return {
    route,
  };
}

module.exports = {
  createIngestRouter,
};
