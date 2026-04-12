'use strict';

function toTimestamp(value) {
  const epoch = Date.parse(String(value || ''));
  if (Number.isNaN(epoch)) {
    return 0;
  }
  return epoch;
}

function createError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function resolveConflict(input = {}) {
  const incomingEvent = input.incomingEvent && typeof input.incomingEvent === 'object' ? input.incomingEvent : null;
  const incomingKey = String(input.incomingKey || '').trim();
  const currentRevision = input.currentRevision && typeof input.currentRevision === 'object' ? input.currentRevision : null;

  if (!incomingEvent || !incomingKey) {
    throw createError('E_CONFLICT_INPUT', 'incomingEvent and incomingKey are required for conflict resolution.');
  }

  if (!currentRevision) {
    return {
      winner: 'incoming',
      outcome: 'applied',
      supersedes: null,
    };
  }

  if (currentRevision.idempotency_key === incomingKey) {
    return {
      winner: 'current',
      outcome: 'duplicate',
      supersedes: null,
    };
  }

  const currentObservedAt = toTimestamp(currentRevision.observed_at);
  const incomingObservedAt = toTimestamp(incomingEvent.observed_at);

  if (incomingObservedAt > currentObservedAt) {
    return {
      winner: 'incoming',
      outcome: 'superseded',
      supersedes: currentRevision,
    };
  }

  if (incomingObservedAt < currentObservedAt) {
    return {
      winner: 'current',
      outcome: 'stale',
      supersedes: null,
    };
  }

  if (incomingKey > String(currentRevision.idempotency_key || '')) {
    return {
      winner: 'incoming',
      outcome: 'superseded',
      supersedes: currentRevision,
    };
  }

  return {
    winner: 'current',
    outcome: 'stale',
    supersedes: null,
  };
}

module.exports = {
  resolveConflict,
};
