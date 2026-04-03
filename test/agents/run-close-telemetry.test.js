const test = require('node:test');
const assert = require('node:assert/strict');

const telemetry = require('../../onboarding/backend/agents/telemetry.cjs');
const orchestrator = require('../../onboarding/backend/agents/orchestrator.cjs');

function createExecutionContext() {
  return orchestrator.resolveExecutionContext('acme', {
    tenant_id: 'tenant-1',
    actor_id: 'operator-1',
    correlation_id: 'corr-1',
    request_id: 'req-1',
    prompt_version: 'phase53-v1',
    provider_policy: {
      primary_provider: 'openai',
      allow_fallback: true,
      max_fallback_attempts: 3,
    },
    tool_policy: {
      profile: 'default',
      allow_external_mutations: false,
    },
  });
}

test('AGT-04: captureRunClose rejects terminal payloads missing required fields', () => {
  assert.throws(
    () => telemetry.captureRunClose({
      run_id: 'run-1',
      tenant_id: 'tenant-1',
      model: 'gpt-4o-mini',
      prompt_version: 'phase53-v1',
      tool_events: [],
      latency_ms: 120,
      cost_usd: 0.01,
      outcome: 'completed',
    }),
    /RUN_CLOSE_INCOMPLETE:tool_events/
  );
});

test('AGT-04: orchestrator finalizer blocks terminal close when provider attempt evidence is missing', () => {
  orchestrator.__testing.resetRunEngineState();
  const executionContext = createExecutionContext();
  const lifecycle = orchestrator.__testing.bootstrapRunLifecycle('acme', executionContext);

  assert.throws(
    () => orchestrator.__testing.finalizeRunClose({
      slug: 'acme',
      runEnvelope: lifecycle.run,
      resolvedExecutionContext: executionContext,
      agentResults: {},
      errors: [],
    }),
    /RUN_CLOSE_INCOMPLETE:model,tool_events/
  );
});

test('AGT-04: orchestrator finalizer records complete run-close payload with provider attempts', () => {
  orchestrator.__testing.resetRunEngineState();
  const executionContext = createExecutionContext();
  const lifecycle = orchestrator.__testing.bootstrapRunLifecycle('acme', executionContext);

  const record = orchestrator.__testing.finalizeRunClose({
    slug: 'acme',
    runEnvelope: lifecycle.run,
    resolvedExecutionContext: executionContext,
    agentResults: {
      company_profile: {
        ok: true,
        provider: 'openai',
        model: 'gpt-4o-mini',
        latencyMs: 80,
        usage: {
          promptTokens: 10,
          completionTokens: 5,
          totalTokens: 15,
        },
      },
    },
    errors: [],
  });

  assert.equal(record.prompt_version, 'phase53-v1');
  assert.equal(record.model, 'gpt-4o-mini');
  assert.equal(record.outcome, 'completed');
  assert.equal(record.tool_events.length, 1);
  assert.equal(record.tool_events[0].provider_policy_primary, 'openai');
  assert.ok(record.cost_usd >= 0);
});