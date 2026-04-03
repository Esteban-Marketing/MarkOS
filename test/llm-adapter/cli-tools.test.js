const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const configCli = require(path.resolve(__dirname, '../../bin/llm-config.cjs'));
const statusCli = require(path.resolve(__dirname, '../../bin/llm-status.cjs'));

function createPromptStub(answers) {
  const queue = [...answers];
  return {
    async ask() {
      return queue.shift() || '';
    },
    close() {},
  };
}

function createSupabaseConfigStub({ keyError = null, preferenceError = null } = {}) {
  const calls = [];
  return {
    calls,
    from(table) {
      return {
        async upsert(payload) {
          calls.push({ table, payload });
          if (table === 'markos_operator_api_keys') {
            return { error: keyError };
          }
          return { error: preferenceError };
        },
      };
    },
  };
}

function createSupabaseStatusStub({ preference, events, keys, fail = {} }) {
  return {
    from(table) {
      return {
        select() {
          const state = { table };
          const chain = {
            eq(column, value) {
              state[column] = value;
              return chain;
            },
            gte(column, value) {
              state[column] = value;
              return chain;
            },
            lt(column, value) {
              state[column] = value;
              return chain;
            },
            order() {
              return chain;
            },
            async maybeSingle() {
              if (fail.preference && table === 'markos_operator_llm_preferences') {
                return { data: null, error: { message: 'boom-pref' } };
              }
              return { data: preference || null, error: null };
            },
            then(resolve, reject) {
              const response = (() => {
                if (table === 'markos_llm_call_events') {
                  if (fail.events) {
                    return { data: null, error: { message: 'boom-events' } };
                  }
                  return { data: events || [], error: null };
                }

                if (table === 'markos_operator_api_keys') {
                  if (fail.keys) {
                    return { data: null, error: { message: 'boom-keys' } };
                  }
                  return { data: keys || [], error: null };
                }

                return { data: [], error: null };
              })();

              return Promise.resolve(response).then(resolve, reject);
            },
          };

          return chain;
        },
      };
    },
  };
}

test('Phase 47 Wave 4: llm config parse accepts provider aliases', () => {
  const parsed = configCli.parseConfigArgs({ provider: 'claude', test: true });
  assert.equal(parsed.provider, 'anthropic');
  assert.equal(parsed.test, true);
});

test('Phase 47 Wave 4: llm config validates budget parsing', () => {
  assert.equal(configCli.parseBudget('42.50'), 42.5);
  assert.throws(() => configCli.parseBudget('-1'), /Budget must be a non-negative number/);
});

test('Phase 47 Wave 4: llm config encrypts key and stores preferences before success', async () => {
  const supabase = createSupabaseConfigStub();
  const outputLines = [];

  const result = await configCli.runLLMConfigCLI({
    cli: { provider: 'openai' },
    interactive: false,
    output: (line) => outputLines.push(line),
    env: {
      MARKOS_VAULT_SECRET: 'wave-4-secret',
      MARKOS_OPENAI_API_KEY: 'sk-test-123',
      MARKOS_LLM_MONTHLY_BUDGET: '125',
      MARKOS_LLM_PRIMARY_PROVIDER: 'openai',
      MARKOS_LLM_ALLOW_FALLBACK: 'true',
      MARKOS_WORKSPACE_ID: 'ws-1',
      MARKOS_OPERATOR_ID: 'operator-1',
      MARKOS_UPDATED_BY: 'tester',
    },
    supabase,
  });

  assert.equal(result.ok, true);
  assert.equal(result.primaryProvider, 'openai');
  assert.equal(result.budget, 125);
  assert.equal(supabase.calls.length, 2);
  assert.equal(supabase.calls[0].table, 'markos_operator_api_keys');
  assert.equal(supabase.calls[1].table, 'markos_operator_llm_preferences');
  assert.match(supabase.calls[0].payload[0].encrypted_key, /^v1:/);
  assert.match(outputLines.join('\n'), /LLM configuration saved successfully/);
});

test('Phase 47 Wave 4: llm config test mode invokes provider smoke test', async () => {
  const supabase = createSupabaseConfigStub();
  const outputLines = [];

  const result = await configCli.runLLMConfigCLI({
    cli: { provider: 'gemini', test: true },
    interactive: false,
    output: (line) => outputLines.push(line),
    env: {
      MARKOS_VAULT_SECRET: 'wave-4-secret',
      MARKOS_GEMINI_API_KEY: 'gm-test-123',
      MARKOS_LLM_MONTHLY_BUDGET: '100',
      MARKOS_LLM_PRIMARY_PROVIDER: 'gemini',
      MARKOS_LLM_ALLOW_FALLBACK: 'true',
      MARKOS_WORKSPACE_ID: 'ws-1',
      MARKOS_OPERATOR_ID: 'operator-1',
      MARKOS_UPDATED_BY: 'tester',
    },
    supabase,
    providerSmokeTest: async () => ({
      provider: 'gemini',
      ok: true,
      text: 'test_success',
      usage: { inputTokens: 12, outputTokens: 5 },
    }),
  });

  assert.equal(result.ok, true);
  assert.match(outputLines.join('\n'), /test_success/);
  assert.match(outputLines.join('\n'), /Test call successful/);
});

test('Phase 47 Wave 4: llm status defaults month and validates exports', () => {
  const parsed = statusCli.parseStatusArgs({});
  assert.match(parsed.month, /^\d{4}-\d{2}$/);
  assert.equal(parsed.exportFormat, null);

  assert.throws(() => statusCli.parseStatusArgs({ month: '2026/04' }), /YYYY-MM/);
  assert.throws(() => statusCli.parseStatusArgs({ month: '2026-04', exportFormat: 'json' }), /Only --export=csv/);
});

test('Phase 47 Wave 4: llm status table and budget percent are computed correctly', async () => {
  const lines = [];
  const supabase = createSupabaseStatusStub({
    preference: {
      cost_budget_monthly_usd: 100,
      available_providers: ['anthropic', 'openai'],
      primary_provider: 'anthropic',
    },
    events: [
      { provider: 'anthropic', input_tokens: 1000, output_tokens: 400, estimated_cost_usd: 1.2 },
      { provider: 'openai', input_tokens: 700, output_tokens: 200, estimated_cost_usd: 0.7 },
    ],
  });

  const result = await statusCli.runLLMStatusCLI({
    cli: { month: '2026-03' },
    output: (line) => lines.push(line),
    env: { MARKOS_WORKSPACE_ID: 'ws-1', MARKOS_OPERATOR_ID: 'operator-1' },
    supabase,
  });

  assert.equal(result.ok, true);
  assert.equal(result.mode, 'table');
  assert.equal(result.summary.totals.calls, 2);
  assert.equal(result.summary.totals.cost, 1.9);
  assert.match(lines.join('\n'), /LLM Usage & Cost \(2026-03\)/);
});

test('Phase 47 Wave 4: llm status csv export returns valid csv rows', async () => {
  const lines = [];
  const supabase = createSupabaseStatusStub({
    preference: { cost_budget_monthly_usd: 50 },
    events: [{ provider: 'gemini', input_tokens: 20, output_tokens: 15, estimated_cost_usd: 0.01 }],
  });

  const result = await statusCli.runLLMStatusCLI({
    cli: { month: '2026-03', exportFormat: 'csv' },
    output: (line) => lines.push(line),
    env: { MARKOS_WORKSPACE_ID: 'ws-1', MARKOS_OPERATOR_ID: 'operator-1' },
    supabase,
  });

  assert.equal(result.ok, true);
  assert.equal(result.mode, 'csv');
  assert.match(result.csv, /^provider,calls,input_tokens,output_tokens,cost_usd/m);
  assert.match(lines.join('\n'), /gemini/);
});

test('Phase 47 Wave 4: llm status providers mode shows provider validation state', async () => {
  const lines = [];
  const supabase = createSupabaseStatusStub({
    preference: {
      available_providers: ['openai', 'gemini'],
      primary_provider: 'openai',
    },
    keys: [
      { provider: 'openai', updated_at: '2026-04-02T00:00:00.000Z' },
      { provider: 'gemini', updated_at: '2026-04-02T00:00:00.000Z' },
    ],
  });

  const result = await statusCli.runLLMStatusCLI({
    cli: { providers: true },
    output: (line) => lines.push(line),
    env: { MARKOS_WORKSPACE_ID: 'ws-1', MARKOS_OPERATOR_ID: 'operator-1' },
    supabase,
  });

  assert.equal(result.ok, true);
  assert.equal(result.mode, 'providers');
  assert.match(lines.join('\n'), /Configured Providers/);
  assert.match(lines.join('\n'), /openai/);
});

test('Phase 47 Wave 4: llm status surfaces Supabase errors clearly', async () => {
  const supabase = createSupabaseStatusStub({ fail: { preference: true } });

  await assert.rejects(
    () => statusCli.runLLMStatusCLI({
      cli: { month: '2026-03' },
      output: () => {},
      env: { MARKOS_WORKSPACE_ID: 'ws-1', MARKOS_OPERATOR_ID: 'operator-1' },
      supabase,
    }),
    /Failed to load preferences/,
  );
});
