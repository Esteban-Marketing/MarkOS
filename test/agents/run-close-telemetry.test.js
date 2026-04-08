const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

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

test('AGT-04: orchestrator finalizer preserves multi-attempt provider telemetry from live agent results', () => {
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
        provider: 'gemini',
        model: 'gemini-2.5-flash',
        providerAttempts: [
          {
            provider: 'openai',
            model: 'gpt-4o-mini',
            attempt_number: 1,
            primary_provider: 'openai',
            outcome_state: 'error',
            reason_code: 'TIMEOUT',
            latency_ms: 25,
            token_usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
          },
          {
            provider: 'gemini',
            model: 'gemini-2.5-flash',
            attempt_number: 2,
            primary_provider: 'openai',
            outcome_state: 'success',
            fallback_reason: 'TIMEOUT',
            latency_ms: 15,
            token_usage: { promptTokens: 8, completionTokens: 4, totalTokens: 12 },
          },
        ],
        usage: {
          promptTokens: 8,
          completionTokens: 4,
          totalTokens: 12,
        },
      },
    },
    errors: [],
  });

  assert.equal(record.tool_events.length, 2);
  assert.equal(record.tool_events[0].provider, 'openai');
  assert.equal(record.tool_events[0].reason_code, 'TIMEOUT');
  assert.equal(record.tool_events[1].provider, 'gemini');
  assert.equal(record.tool_events[1].fallback_reason, 'TIMEOUT');
});

test('AGT-04: canonical telemetry event contract names rollout, execution, provider, and run-close evidence', () => {
  const eventsPath = path.resolve(__dirname, '../../lib/markos/telemetry/events.ts');
  const source = fs.readFileSync(eventsPath, 'utf8');

  assert.match(source, /rollout_endpoint_observed/);
  assert.match(source, /execution_readiness_blocked/);
  assert.match(source, /markos_agent_run_provider_attempt/);
  assert.match(source, /markos_agent_run_close_completed/);
});