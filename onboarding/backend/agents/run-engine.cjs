'use strict';

const crypto = require('crypto');

const RUN_STATES = Object.freeze([
  'requested',
  'accepted',
  'context_loaded',
  'executing',
  'awaiting_approval',
  'approved',
  'rejected',
  'completed',
  'failed',
  'archived',
]);

const ALLOWED_TRANSITIONS = Object.freeze({
  requested: new Set(['accepted']),
  accepted: new Set(['context_loaded']),
  context_loaded: new Set(['executing']),
  executing: new Set(['awaiting_approval', 'completed', 'failed']),
  awaiting_approval: new Set(['approved', 'rejected']),
  approved: new Set(['executing']),
  rejected: new Set(['archived']),
  completed: new Set(['archived']),
  failed: new Set(['archived']),
  archived: new Set([]),
});

function ensureNonEmptyString(value, fieldName) {
  if (!value || String(value).trim().length === 0) {
    throw new Error(`RUN_ENVELOPE_MISSING_${fieldName.toUpperCase()}`);
  }
}

function ensurePolicyObject(value, fieldName) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).length === 0) {
    throw new Error(`RUN_ENVELOPE_MISSING_${fieldName.toUpperCase()}`);
  }
}

function createInMemoryEventStore(seed = []) {
  const events = Array.isArray(seed) ? [...seed] : [];

  return {
    appendEvent(event) {
      events.push({ ...event });
      return event;
    },
    listEventsForRun(runId) {
      return events.filter((event) => event.run_id === runId);
    },
    listEvents() {
      return [...events];
    },
    clear() {
      events.length = 0;
    },
  };
}

function createInMemorySideEffectLedger(seed = []) {
  const entries = new Map();

  for (const entry of Array.isArray(seed) ? seed : []) {
    const key = `${entry.tenant_id}:${entry.run_id}:${entry.step_key}:${entry.effect_hash}`;
    entries.set(key, { ...entry });
  }

  return {
    set(key, value) {
      entries.set(key, value);
    },
    get(key) {
      return entries.get(key);
    },
    has(key) {
      return entries.has(key);
    },
    delete(key) {
      return entries.delete(key);
    },
    listEffects() {
      return Array.from(entries.values());
    },
    clear() {
      entries.clear();
    },
  };
}

function createRunEnvelope(input = {}) {
  const {
    tenant_id,
    actor_id,
    correlation_id,
    provider_policy,
    tool_policy,
    idempotency_key,
    project_slug = null,
    prompt_version = null,
    registry = null,
  } = input;

  ensureNonEmptyString(tenant_id, 'tenant_id');
  ensureNonEmptyString(actor_id, 'actor_id');
  ensureNonEmptyString(correlation_id, 'correlation_id');
  ensurePolicyObject(provider_policy, 'provider_policy');
  ensurePolicyObject(tool_policy, 'tool_policy');

  const scopedKey = idempotency_key ? `${tenant_id}:${idempotency_key}:agent_run` : null;
  if (scopedKey && registry && registry.has(scopedKey)) {
    return {
      created: false,
      run: registry.get(scopedKey),
      idempotency_key,
    };
  }

  const createdAt = new Date().toISOString();
  const run = {
    run_id: input.run_id || `run_${crypto.randomUUID()}`,
    tenant_id,
    actor_id,
    correlation_id,
    idempotency_key: idempotency_key || null,
    project_slug,
    prompt_version,
    provider_policy,
    tool_policy,
    state: 'requested',
    created_at: createdAt,
    updated_at: createdAt,
  };

  if (scopedKey && registry) {
    registry.set(scopedKey, run);
  }

  return {
    created: true,
    run,
    idempotency_key,
  };
}

function assertTransitionAllowed(input = {}) {
  const {
    run_id,
    tenant_id,
    from_state,
    to_state,
    eventStore,
    actor_id = null,
    correlation_id = null,
    reason = null,
  } = input;

  ensureNonEmptyString(run_id, 'run_id');
  ensureNonEmptyString(tenant_id, 'tenant_id');
  ensureNonEmptyString(from_state, 'from_state');
  ensureNonEmptyString(to_state, 'to_state');

  const now = new Date().toISOString();
  const transitionAllowed = Boolean(ALLOWED_TRANSITIONS[from_state] && ALLOWED_TRANSITIONS[from_state].has(to_state));

  if (transitionAllowed) {
    const event = {
      run_id,
      tenant_id,
      event_type: 'agent_run_transitioned',
      from_state,
      to_state,
      actor_id,
      correlation_id,
      reason,
      created_at: now,
    };
    if (eventStore && typeof eventStore.appendEvent === 'function') {
      eventStore.appendEvent(event);
    }
    return {
      allowed: true,
      run_id,
      tenant_id,
      from_state,
      to_state,
    };
  }

  const denied = {
    run_id,
    tenant_id,
    event_type: 'agent_run_transition_denied',
    from_state,
    to_state,
    actor_id,
    correlation_id,
    reason,
    error_code: 'AGENT_RUN_INVALID_TRANSITION',
    created_at: now,
  };

  if (eventStore && typeof eventStore.appendEvent === 'function') {
    eventStore.appendEvent(denied);
  }

  return {
    allowed: false,
    run_id,
    tenant_id,
    from_state,
    to_state,
    error_code: 'AGENT_RUN_INVALID_TRANSITION',
  };
}

function recordSideEffect(input = {}) {
  const {
    ledger,
    run_id,
    tenant_id,
    step_key,
    effect_hash,
    effect_type,
    payload = null,
  } = input;

  ensureNonEmptyString(run_id, 'run_id');
  ensureNonEmptyString(tenant_id, 'tenant_id');
  ensureNonEmptyString(step_key, 'step_key');
  ensureNonEmptyString(effect_hash, 'effect_hash');
  ensureNonEmptyString(effect_type, 'effect_type');

  if (!ledger || typeof ledger.has !== 'function' || typeof ledger.set !== 'function') {
    throw new Error('SIDE_EFFECT_LEDGER_INVALID');
  }

  const key = `${tenant_id}:${run_id}:${step_key}:${effect_hash}`;
  if (ledger.has(key)) {
    return {
      applied: false,
      reason: 'IDEMPOTENT_REDELIVERY',
      entry: ledger.get(key),
    };
  }

  const entry = {
    run_id,
    tenant_id,
    step_key,
    effect_hash,
    effect_type,
    payload,
    committed_at: new Date().toISOString(),
  };

  ledger.set(key, entry);

  return {
    applied: true,
    reason: null,
    entry,
  };
}

module.exports = {
  RUN_STATES,
  ALLOWED_TRANSITIONS,
  createRunEnvelope,
  assertTransitionAllowed,
  createInMemoryEventStore,
  createInMemorySideEffectLedger,
  recordSideEffect,
};
