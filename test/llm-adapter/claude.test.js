const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { compileLlmModules } = require('./llm-build-helper.cjs');

test('Phase 47-03: callClaude maps usage and response text', async () => {
  const build = compileLlmModules();
  const { callClaude } = require(path.join(build.outDir, 'providers', 'claude.js'));

  try {
    const mockClient = {
      messages: {
        async create(request) {
          assert.equal(request.model, 'claude-3-5-haiku-20241022');
          assert.equal(request.max_tokens, 200);
          return {
            content: [{ type: 'text', text: 'Claude response' }],
            usage: { input_tokens: 11, output_tokens: 7 },
          };
        },
      },
    };

    const result = await callClaude('sys', 'usr', { maxTokens: 200 }, { client: mockClient });
    assert.equal(result.ok, true);
    assert.equal(result.text, 'Claude response');
    assert.equal(result.usage.inputTokens, 11);
    assert.equal(result.usage.outputTokens, 7);
    assert.equal(result.usage.totalTokens, 18);
  } finally {
    build.cleanup();
  }
});

test('Phase 47-03: callClaude maps provider auth and rate limit failures', async () => {
  const build = compileLlmModules();
  const { callClaude } = require(path.join(build.outDir, 'providers', 'claude.js'));

  try {
    const authClient = {
      messages: {
        async create() {
          const err = new Error('invalid API key');
          err.status = 401;
          throw err;
        },
      },
    };

    const rateClient = {
      messages: {
        async create() {
          const err = new Error('rate limit exceeded');
          err.status = 429;
          throw err;
        },
      },
    };

    const authResult = await callClaude('sys', 'usr', {}, { client: authClient });
    const rateResult = await callClaude('sys', 'usr', {}, { client: rateClient });

    assert.equal(authResult.ok, false);
    assert.equal(authResult.error.code, 'AUTH_ERROR');
    assert.equal(rateResult.ok, false);
    assert.equal(rateResult.error.code, 'RATE_LIMITED');
  } finally {
    build.cleanup();
  }
});
