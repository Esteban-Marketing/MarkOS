const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { compileLlmModules } = require('./llm-build-helper.cjs');

function okResult(provider) {
  return {
    ok: true,
    text: provider + ' ok',
    provider,
    model: 'model',
    usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
    latencyMs: 10,
    telemetryEventId: 'pending-wave-3',
  };
}

function errorResult(provider, code) {
  return {
    ok: false,
    text: '',
    provider,
    model: 'model',
    usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
    latencyMs: 10,
    telemetryEventId: 'pending-wave-3',
    error: { code, message: code + ' failure' },
  };
}

test('Phase 47-07: fallback chain succeeds on second provider', async () => {
  const build = compileLlmModules();
  const fallback = require(path.join(build.outDir, 'fallback-chain.js'));

  try {
    const result = await fallback.executeFallbackChain(
      'sys',
      'usr',
      {},
      {
        anthropic: async () => errorResult('anthropic', 'TIMEOUT'),
        openai: async () => okResult('openai'),
        gemini: async () => okResult('gemini'),
      },
      {
        sleep: async () => {},
      },
    );

    assert.equal(result.result.ok, true);
    assert.equal(result.finalProvider, 'openai');
    assert.equal(result.fallbackAttempts, 1);
    assert.deepEqual(result.fallbackReasons, ['TIMEOUT']);
    assert.equal(result.decisionMode, 'fallback');
  } finally {
    build.cleanup();
  }
});

test('Phase 47-07: noFallback stops after primary failure', async () => {
  const build = compileLlmModules();
  const fallback = require(path.join(build.outDir, 'fallback-chain.js'));

  try {
    const result = await fallback.executeFallbackChain(
      'sys',
      'usr',
      { provider: 'anthropic', noFallback: true },
      {
        anthropic: async () => errorResult('anthropic', 'AUTH_ERROR'),
        openai: async () => okResult('openai'),
        gemini: async () => okResult('gemini'),
      },
      {
        sleep: async () => {},
      },
    );

    assert.equal(result.result.ok, false);
    assert.equal(result.result.error.code, 'FALLBACK_EXHAUSTED');
    assert.equal(result.fallbackAttempts, 0);
  } finally {
    build.cleanup();
  }
});

test('Phase 47-07: fallback chain enforces max attempts', async () => {
  const build = compileLlmModules();
  const fallback = require(path.join(build.outDir, 'fallback-chain.js'));

  try {
    let calls = 0;
    const result = await fallback.executeFallbackChain(
      'sys',
      'usr',
      { provider: 'anthropic' },
      {
        anthropic: async () => {
          calls += 1;
          return errorResult('anthropic', 'RATE_LIMITED');
        },
        openai: async () => {
          calls += 1;
          return errorResult('openai', 'TIMEOUT');
        },
        gemini: async () => {
          calls += 1;
          return errorResult('gemini', 'AUTH_ERROR');
        },
      },
      {
        sleep: async () => {},
        maxAttempts: 2,
      },
    );

    assert.equal(calls, 2);
    assert.equal(result.result.error.code, 'FALLBACK_EXHAUSTED');
  } finally {
    build.cleanup();
  }
});
