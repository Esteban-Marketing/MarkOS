const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createRunEnvelope,
  createInMemorySideEffectLedger,
  recordSideEffect,
} = require('../../onboarding/backend/agents/run-engine.cjs');

test('53-01-01: duplicate run envelope create with same idempotency key resolves to existing run', () => {
  const registry = new Map();

  const first = createRunEnvelope({
    tenant_id: 'tenant-1',
    actor_id: 'actor-1',
    correlation_id: 'corr-1',
    provider_policy: { primary_provider: 'openai' },
    tool_policy: { profile: 'default' },
    idempotency_key: 'same-delivery-key',
    registry,
  });

  const duplicate = createRunEnvelope({
    tenant_id: 'tenant-1',
    actor_id: 'actor-1',
    correlation_id: 'corr-1',
    provider_policy: { primary_provider: 'openai' },
    tool_policy: { profile: 'default' },
    idempotency_key: 'same-delivery-key',
    registry,
  });

  assert.equal(duplicate.created, false);
  assert.equal(duplicate.run.run_id, first.run.run_id);
});

test('53-01-01: recordSideEffect commits first effect and no-ops duplicate delivery', () => {
  const ledger = createInMemorySideEffectLedger();

  const firstCommit = recordSideEffect({
    ledger,
    run_id: 'run-1',
    tenant_id: 'tenant-1',
    step_key: 'publish-mutation',
    effect_hash: 'effect-abc',
    effect_type: 'external_mutation',
    payload: { destination: 'campaigns', status: 'published' },
  });

  const duplicateCommit = recordSideEffect({
    ledger,
    run_id: 'run-1',
    tenant_id: 'tenant-1',
    step_key: 'publish-mutation',
    effect_hash: 'effect-abc',
    effect_type: 'external_mutation',
    payload: { destination: 'campaigns', status: 'published' },
  });

  assert.equal(firstCommit.applied, true);
  assert.equal(duplicateCommit.applied, false);
  assert.equal(duplicateCommit.reason, 'IDEMPOTENT_REDELIVERY');
  assert.equal(ledger.listEffects().length, 1);
});
