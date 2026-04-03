const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { compileLlmModules } = require('./llm-build-helper.cjs');

test('Phase 47-04: callOpenAI maps usage and content', async () => {
  const build = compileLlmModules();
  const { callOpenAI } = require(path.join(build.outDir, 'providers', 'openai.js'));

  try {
    const mockClient = {
      chat: {
        completions: {
          async create(request) {
            assert.equal(request.model, 'gpt-4o-mini');
            assert.equal(request.max_tokens, 128);
            return {
              choices: [{ message: { content: 'OpenAI response' } }],
              usage: { prompt_tokens: 13, completion_tokens: 9 },
            };
          },
        },
      },
    };

    const result = await callOpenAI('sys', 'usr', { maxTokens: 128 }, { client: mockClient });
    assert.equal(result.ok, true);
    assert.equal(result.text, 'OpenAI response');
    assert.equal(result.usage.inputTokens, 13);
    assert.equal(result.usage.outputTokens, 9);
    assert.equal(result.usage.totalTokens, 22);
  } finally {
    build.cleanup();
  }
});

test('Phase 47-04: callOpenAI maps timeout errors', async () => {
  const build = compileLlmModules();
  const { callOpenAI } = require(path.join(build.outDir, 'providers', 'openai.js'));

  try {
    const timeoutClient = {
      chat: {
        completions: {
          async create() {
            await new Promise((resolve) => setTimeout(resolve, 40));
            return { choices: [{ message: { content: 'late' } }], usage: { prompt_tokens: 1, completion_tokens: 1 } };
          },
        },
      },
    };

    const result = await callOpenAI('sys', 'usr', { timeoutMs: 1 }, { client: timeoutClient });
    assert.equal(result.ok, false);
    assert.equal(result.error.code, 'TIMEOUT');
  } finally {
    build.cleanup();
  }
});
