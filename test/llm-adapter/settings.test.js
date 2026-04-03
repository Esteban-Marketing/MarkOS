const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { compileLlmModules } = require('./llm-build-helper.cjs');

test('Phase 47 Wave 1: encryption round-trip is reversible with the same operator context', async () => {
  const build = compileLlmModules();
  const encryption = require(path.join(build.outDir, 'encryption.js'));

  try {
    const env = { MARKOS_VAULT_SECRET: 'phase-47-test-secret' };
    const encrypted = await encryption.encryptOperatorKey('test-key-1234567890', 'operator-1', env);
    const decrypted = await encryption.decryptOperatorKey(encrypted.encryptedKey, 'operator-1', env);

    assert.equal(decrypted, 'test-key-1234567890');
    assert.match(encrypted.keyHash, /^[a-f0-9]{64}$/);
  } finally {
    build.cleanup();
  }
});

test('Phase 47 Wave 1: redaction preserves shape without leaking the full key', async () => {
  const build = compileLlmModules();
  const encryption = require(path.join(build.outDir, 'encryption.js'));

  try {
    assert.equal(encryption.redactKeyForLogging('anthropic_abc123def456ghi7890'), 'anthropi...7890');
  } finally {
    build.cleanup();
  }
});

test('Phase 47 Wave 1: settings validation accepts a normalized configuration', async () => {
  const build = compileLlmModules();
  const settings = require(path.join(build.outDir, 'settings.js'));

  try {
    const validated = settings.validateSettings({
      availableProviders: ['anthropic', 'openai'],
      primaryProvider: 'anthropic',
      costBudgetMonthlyUsd: 55,
      allowFallback: true,
      fallbackTemplate: 'speed_optimized',
    });

    assert.equal(validated.primaryProvider, 'anthropic');
    assert.equal(validated.costBudgetMonthlyUsd, 55);
    assert.equal(validated.fallbackTemplate, 'speed_optimized');
  } finally {
    build.cleanup();
  }
});

test('Phase 47 Wave 1: settings validation rejects unsupported providers', async () => {
  const build = compileLlmModules();
  const settings = require(path.join(build.outDir, 'settings.js'));

  try {
    assert.throws(
      () => settings.validateSettings({
        availableProviders: ['not-real'],
        primaryProvider: 'anthropic',
        costBudgetMonthlyUsd: 20,
        allowFallback: true,
        fallbackTemplate: 'cost_optimized',
      }),
      /INVALID_CONFIG/,
    );
  } finally {
    build.cleanup();
  }
});

test('Phase 47 Wave 1: loadOperatorSettings falls back to environment defaults', async () => {
  const build = compileLlmModules();
  const settings = require(path.join(build.outDir, 'settings.js'));

  try {
    const loaded = await settings.loadOperatorSettings('operator-1', {
      env: {
        MARKOS_LLM_AVAILABLE_PROVIDERS: 'openai,gemini',
        MARKOS_LLM_PRIMARY_PROVIDER: 'openai',
        MARKOS_LLM_MONTHLY_BUDGET: '250',
        MARKOS_LLM_ALLOW_FALLBACK: 'false',
        MARKOS_LLM_FALLBACK_TEMPLATE: 'reliability_optimized',
      },
      workspaceId: 'workspace-a',
    });

    assert.deepEqual(loaded.availableProviders, ['openai', 'gemini']);
    assert.equal(loaded.primaryProvider, 'openai');
    assert.equal(loaded.costBudgetMonthlyUsd, 250);
    assert.equal(loaded.allowFallback, false);
    assert.equal(loaded.workspaceId, 'workspace-a');
  } finally {
    build.cleanup();
  }
});

test('Phase 47 Wave 1: loadOperatorSettings maps stored database records', async () => {
  const build = compileLlmModules();
  const settings = require(path.join(build.outDir, 'settings.js'));

  try {
    const client = {
      from() {
        return {
          select() {
            return {
              eq() {
                return {
                  maybeSingle: async () => ({
                    data: {
                      operator_id: 'operator-9',
                      workspace_id: 'workspace-z',
                      available_providers: ['anthropic', 'gemini'],
                      primary_provider: 'gemini',
                      cost_budget_monthly_usd: 80,
                      allow_fallback: true,
                      fallback_template: 'cost_optimized',
                    },
                    error: null,
                  }),
                };
              },
            };
          },
        };
      },
    };

    const loaded = await settings.loadOperatorSettings('operator-9', { client });
    assert.equal(loaded.primaryProvider, 'gemini');
    assert.equal(loaded.workspaceId, 'workspace-z');
    assert.deepEqual(loaded.availableProviders, ['anthropic', 'gemini']);
  } finally {
    build.cleanup();
  }
});