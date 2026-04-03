const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createRunEnvelope,
  createInMemorySideEffectLedger,
  recordSideEffect,
} = require('../../onboarding/backend/agents/run-engine.cjs');
const orchestrator = require('../../onboarding/backend/agents/orchestrator.cjs');

test.beforeEach(() => {
  orchestrator.__testing.resetRunEngineState();
});

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

test('53-01-03: orchestrator resolveExecutionContext fails without tenant-scoped principal', () => {
  assert.throws(
    () => orchestrator.resolveExecutionContext('demo', {
      actor_id: 'actor-1',
      correlation_id: 'corr-1',
    }),
    /tenant_id/i
  );
});

test('53-01-03: orchestrator bootstrap uses run-engine idempotency for duplicate queue deliveries', () => {
  const context = {
    tenant_id: 'tenant-1',
    actor_id: 'actor-1',
    correlation_id: 'corr-1',
    request_id: 'req-1',
    provider_policy: { primary_provider: 'openai' },
    tool_policy: { profile: 'default' },
  };

  const resolved = orchestrator.resolveExecutionContext('demo', context);
  const first = orchestrator.__testing.bootstrapRunLifecycle('demo', resolved);
  const duplicate = orchestrator.__testing.bootstrapRunLifecycle('demo', resolved);

  assert.equal(first.created, true);
  assert.equal(duplicate.created, false);
  assert.equal(first.run.run_id, duplicate.run.run_id);

  const effectOne = orchestrator.__testing.recordOrchestratorSideEffect(first.run, 'company_profile', 'alpha');
  const effectTwo = orchestrator.__testing.recordOrchestratorSideEffect(first.run, 'company_profile', 'alpha');
  assert.equal(effectOne.applied, true);
  assert.equal(effectTwo.applied, false);
  assert.equal(effectTwo.reason, 'IDEMPOTENT_REDELIVERY');
});
