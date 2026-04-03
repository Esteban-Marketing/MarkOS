const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { compileLlmModules } = require('./llm-build-helper.cjs');

test('Phase 47-06: telemetry event includes LLM call shape and sanitizes secrets', () => {
  const build = compileLlmModules();
  const telemetry = require(path.join(build.outDir, 'telemetry-adapter.js'));

  try {
    const event = telemetry.buildLLMCallCompletedEvent(
      {
        workspaceId: 'ws-1',
        role: 'operator',
        requestId: 'req-1',
        provider: 'anthropic',
        model: 'claude-3-5-haiku-20241022',
        inputTokens: 10,
        outputTokens: 5,
        totalTokens: 15,
        latencyMs: 120,
        originalProvider: 'anthropic',
        finalProvider: 'anthropic',
        fallbackAttempts: 0,
        fallbackReasons: [],
        decisionMode: 'default',
        metadata: {
          service_role_key: 'should-not-leak',
        },
      },
      {
        idFactory: () => 'event-123',
      },
    );

    assert.equal(event.name, 'markos_llm_call_completed');
    assert.equal(event.payload.eventId, 'event-123');
    assert.equal(event.payload.service_role_key, '[REDACTED]');
  } finally {
    build.cleanup();
  }
});

test('Phase 47-06: emitLLMCallCompleted sends event and returns id', async () => {
  const build = compileLlmModules();
  const telemetry = require(path.join(build.outDir, 'telemetry-adapter.js'));

  try {
    const emitted = [];
    const eventId = await telemetry.emitLLMCallCompleted(
      {
        workspaceId: 'ws-1',
        provider: 'openai',
        model: 'gpt-4o-mini',
        inputTokens: 10,
        outputTokens: 10,
        totalTokens: 20,
        latencyMs: 50,
        originalProvider: 'openai',
        finalProvider: 'openai',
        fallbackAttempts: 0,
        fallbackReasons: [],
        decisionMode: 'explicit',
      },
      {
        idFactory: () => 'event-456',
        emit: async (event) => {
          emitted.push(event);
        },
      },
    );

    assert.equal(eventId, 'event-456');
    assert.equal(emitted.length, 1);
  } finally {
    build.cleanup();
  }
});
