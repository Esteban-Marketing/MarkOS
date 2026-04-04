const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const WRAPPER_PATH = path.resolve(__dirname, '../../onboarding/backend/agents/llm-adapter.cjs');

function loadWrapperFresh() {
  delete require.cache[require.resolve(WRAPPER_PATH)];
  return require(WRAPPER_PATH);
}

test('Phase 47-09: legacy wrapper uses modern adapter bridge when available', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'markos-modern-bridge-'));
  const adapterPath = path.join(tmpDir, 'adapter.js');

  try {
    fs.writeFileSync(
      adapterPath,
      [
        'module.exports = {',
        '  async call(systemPrompt, userPrompt, options) {',
        '    return {',
        '      ok: true,',
        '      text: `modern:${systemPrompt}:${userPrompt}`,',
        '      provider: options.provider || "anthropic",',
        '      model: options.model || "claude-3-5-haiku-20241022",',
        '      usage: { inputTokens: 12, outputTokens: 8, totalTokens: 20 },',
        '      latencyMs: 42,',
        '      telemetryEventId: "evt-modern-1"',
        '    };',
        '  }',
        '};',
      ].join('\n'),
      'utf8',
    );

    process.env.MARKOS_LLM_ADAPTER_PATH = adapterPath;
    const wrapper = loadWrapperFresh();
    const result = await wrapper.call('sys', 'usr', { provider: 'openai', model: 'gpt-4o-mini' });

    assert.equal(result.ok, true);
    assert.equal(result.text, 'modern:sys:usr');
    assert.equal(result.provider, 'openai');
    assert.equal(result.usage.promptTokens, 12);
    assert.equal(result.usage.completionTokens, 8);
    assert.equal(result.usage.totalTokens, 20);
    assert.equal(result.telemetryEventId, 'evt-modern-1');
  } finally {
    delete process.env.MARKOS_LLM_ADAPTER_PATH;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('Phase 47-09: legacy wrapper falls back to static response on modern adapter failure', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'markos-modern-fail-'));
  const adapterPath = path.join(tmpDir, 'adapter.js');

  try {
    fs.writeFileSync(
      adapterPath,
      [
        'module.exports = {',
        '  async call() {',
        '    throw new Error("adapter failure");',
        '  }',
        '};',
      ].join('\n'),
      'utf8',
    );

    process.env.MARKOS_LLM_ADAPTER_PATH = adapterPath;
    const wrapper = loadWrapperFresh();
    const result = await wrapper.call('company profile request', 'user content', {});

    assert.equal(result.ok, true);
    assert.equal(result.isFallback, true);
    assert.equal(result.provider, 'static-mock');
    assert.match(result.text, /AUTO-FALLBACK|NO AI AVAILABLE/i);
  } finally {
    delete process.env.MARKOS_LLM_ADAPTER_PATH;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('Phase 53-04: legacy wrapper honors primary-provider-first bounded fallback at runtime', async () => {
  const wrapper = loadWrapperFresh();
  const callOrder = [];

  wrapper.__testing.setProviderImplementations({
    openai: async () => {
      callOrder.push('openai');
      const error = new Error('timeout');
      error.code = 'TIMEOUT';
      throw error;
    },
    gemini: async (_systemPrompt, _userPrompt, options) => {
      callOrder.push('gemini');
      return {
        text: 'gemini success',
        model: options.model,
        usage: { promptTokens: 7, completionTokens: 3, totalTokens: 10 },
      };
    },
    anthropic: async () => {
      callOrder.push('anthropic');
      return {
        text: 'anthropic should not run',
        model: 'claude-3-5-haiku-20241022',
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      };
    },
  });

  try {
    const result = await wrapper.call('sys', 'usr', {
      primaryProvider: 'openai',
      allowedProviders: ['gemini', 'anthropic'],
      max_fallback_attempts: 2,
    });

    assert.equal(result.ok, true);
    assert.equal(result.provider, 'gemini');
    assert.deepEqual(callOrder, ['openai', 'gemini']);
    assert.equal(result.providerAttempts.length, 2);
    assert.equal(result.providerAttempts[0].provider, 'openai');
    assert.equal(result.providerAttempts[0].reason_code, 'TIMEOUT');
    assert.equal(result.providerAttempts[1].provider, 'gemini');
  } finally {
    wrapper.__testing.resetProviderImplementations();
  }
});
