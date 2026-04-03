const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { compileLlmModules } = require('./llm-build-helper.cjs');

test('Phase 47-05: callGemini maps text and usage metadata', async () => {
  const build = compileLlmModules();
  const { callGemini } = require(path.join(build.outDir, 'providers', 'gemini.js'));

  try {
    const mockClient = {
      getGenerativeModel(request) {
        assert.equal(request.model, 'gemini-2.5-flash');
        return {
          async generateContent(prompt) {
            assert.equal(prompt, 'usr');
            return {
              response: {
                text: () => 'Gemini response',
                usageMetadata: {
                  promptTokenCount: 5,
                  candidatesTokenCount: 3,
                },
              },
            };
          },
        };
      },
    };

    const result = await callGemini('sys', 'usr', {}, { client: mockClient });
    assert.equal(result.ok, true);
    assert.equal(result.text, 'Gemini response');
    assert.equal(result.usage.inputTokens, 5);
    assert.equal(result.usage.outputTokens, 3);
    assert.equal(result.usage.totalTokens, 8);
  } finally {
    build.cleanup();
  }
});

test('Phase 47-05: callGemini maps auth-style provider errors', async () => {
  const build = compileLlmModules();
  const { callGemini } = require(path.join(build.outDir, 'providers', 'gemini.js'));

  try {
    const failingClient = {
      getGenerativeModel() {
        return {
          async generateContent() {
            const err = new Error('auth token is invalid');
            err.status = 403;
            throw err;
          },
        };
      },
    };

    const result = await callGemini('sys', 'usr', {}, { client: failingClient });
    assert.equal(result.ok, false);
    assert.equal(result.error.code, 'AUTH_ERROR');
  } finally {
    build.cleanup();
  }
});
