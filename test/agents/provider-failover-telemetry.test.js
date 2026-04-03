const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { compileLlmModules } = require('../llm-adapter/llm-build-helper.cjs');

function okResult(provider, model = 'model') {
  return {
    ok: true,
    text: `${provider} ok`,
    provider,
    model,
    usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
    latencyMs: 10,
    telemetryEventId: 'pending-wave-3',
  };
}

function errorResult(provider, code, model = 'model') {
  return {
    ok: false,
    text: '',
    provider,
    model,
    usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
    latencyMs: 10,
    telemetryEventId: 'pending-wave-3',
    error: { code, message: `${code} failure` },
  };
}

test('D-07/D-08: fallback chain selects configured primary provider before bounded fallback', async () => {
  const build = compileLlmModules();
  const fallback = require(path.join(build.outDir, 'fallback-chain.js'));

  try {
    const callOrder = [];
    const result = await fallback.executeFallbackChain(
      'sys',
      'usr',
      { primaryProvider: 'openai', allowedProviders: ['gemini', 'anthropic'] },
      {
        anthropic: async () => {
          callOrder.push('anthropic');
          return okResult('anthropic', 'claude');
        },
        openai: async () => {
          callOrder.push('openai');
          return errorResult('openai', 'TIMEOUT', 'gpt-4o-mini');
        },
        gemini: async () => {
          callOrder.push('gemini');
          return okResult('gemini', 'gemini-2.5-flash');
        },
      },
      {
        sleep: async () => {},
        maxAttempts: 2,
      },
    );

    assert.deepEqual(callOrder, ['openai', 'gemini']);
    assert.equal(result.originalProvider, 'openai');
    assert.equal(result.finalProvider, 'gemini');
    assert.equal(result.providerAttempts[0].provider, 'openai');
    assert.equal(result.providerAttempts[1].fallbackReason, 'TIMEOUT');
  } finally {
    build.cleanup();
  }
});

test('D-09: provider attempt telemetry event preserves reason codes and sanitizes secrets', () => {
  const build = compileLlmModules();
  const telemetry = require(path.join(build.outDir, 'telemetry-adapter.js'));

  try {
    const event = telemetry.buildProviderAttemptEvent(
      {
        workspaceId: 'ws-1',
        role: 'operator',
        requestId: 'req-1',
        provider: 'openai',
        model: 'gpt-4o-mini',
        attemptNumber: 2,
        primaryProvider: 'openai',
        latencyMs: 100,
        fallbackReason: 'TIMEOUT',
        errorCode: 'RATE_LIMITED',
        metadata: {
          service_role_key: 'secret',
        },
      },
      {
        idFactory: () => 'provider-attempt-1',
      },
    );

    assert.equal(event.name, 'markos_agent_run_provider_attempt');
    assert.equal(event.payload.eventId, 'provider-attempt-1');
    assert.equal(event.payload.fallbackReason, 'TIMEOUT');
    assert.equal(event.payload.errorCode, 'RATE_LIMITED');
    assert.equal(event.payload.service_role_key, '[REDACTED]');
  } finally {
    build.cleanup();
  }
});