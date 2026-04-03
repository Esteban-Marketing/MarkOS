const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { compileLlmModules } = require('./llm-build-helper.cjs');

test('Phase 47 Wave 1: provider registry compiles and exposes defaults', () => {
  const build = compileLlmModules();
  const registry = require(path.join(build.outDir, 'provider-registry.js'));

  try {
    assert.deepEqual(
      Object.keys(registry.PROVIDER_REGISTRY).sort((left, right) => left.localeCompare(right)),
      ['anthropic', 'gemini', 'openai'],
    );
    assert.equal(registry.getDefaultModel('anthropic'), 'claude-3-5-haiku-20241022');
    assert.equal(registry.getDefaultModel('openai'), 'gpt-4o-mini');
    assert.equal(registry.getDefaultModel('gemini'), 'gemini-2.5-flash');
  } finally {
    build.cleanup();
  }
});

test('Phase 47 Wave 3: adapter executes fallback chain and surfaces exhaustion without API keys', async () => {
  const build = compileLlmModules();
  const adapter = require(path.join(build.outDir, 'adapter.js'));

  try {
    const result = await adapter.call('system prompt', 'user prompt');
    assert.equal(result.ok, false);
    assert.equal(result.error.code, 'FALLBACK_EXHAUSTED');
    assert.equal(typeof result.telemetryEventId, 'string');
  } finally {
    build.cleanup();
  }
});

test('Phase 47 Wave 2: adapter validates maxTokens before provider execution', async () => {
  const build = compileLlmModules();
  const adapter = require(path.join(build.outDir, 'adapter.js'));

  try {
    const result = await adapter.call('system prompt', 'user prompt', { maxTokens: 0 });
    assert.equal(result.ok, false);
    assert.equal(result.error.code, 'INVALID_CONFIG');
  } finally {
    build.cleanup();
  }
});

test('Phase 47 Wave 1: invalid provider is rejected before runtime execution', async () => {
  const build = compileLlmModules();
  const adapter = require(path.join(build.outDir, 'adapter.js'));

  try {
    await assert.rejects(
      adapter.call('system prompt', 'user prompt', { provider: 'bogus' }),
      /INVALID_CONFIG: Unsupported provider/,
    );
  } finally {
    build.cleanup();
  }
});