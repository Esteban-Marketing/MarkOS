const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const configCli = require(path.resolve(__dirname, '../../bin/llm-config.cjs'));
const statusCli = require(path.resolve(__dirname, '../../bin/llm-status.cjs'));

function createE2ESupabaseStub() {
  const state = {
    preferences: null,
    keys: [],
    events: [],
  };

  return {
    state,
    from(table) {
      if (table === 'markos_operator_api_keys') {
        return {
          async upsert(rows) {
            state.keys = rows;
            return { error: null };
          },
          select() {
            return {
              eq() {
                return this;
              },
              then(resolve, reject) {
                return Promise.resolve({ data: state.keys, error: null }).then(resolve, reject);
              },
            };
          },
        };
      }

      if (table === 'markos_operator_llm_preferences') {
        return {
          async upsert(row) {
            state.preferences = row;
            return { error: null };
          },
          select() {
            const chain = {
              eq() {
                return chain;
              },
              async maybeSingle() {
                return { data: state.preferences, error: null };
              },
            };
            return chain;
          },
        };
      }

      if (table === 'markos_llm_call_events') {
        return {
          select() {
            const chain = {
              eq() {
                return chain;
              },
              gte() {
                return chain;
              },
              lt() {
                return chain;
              },
              order() {
                return Promise.resolve({ data: state.events, error: null });
              },
            };
            return chain;
          },
        };
      }

      throw new Error(`Unsupported table stub: ${table}`);
    },
  };
}

test('Phase 47-10: e2e flow covers config -> call telemetry -> status', async () => {
  const supabase = createE2ESupabaseStub();
  const configLines = [];
  const statusLines = [];

  const configResult = await configCli.runLLMConfigCLI({
    cli: { provider: 'anthropic', test: true },
    interactive: false,
    output: (line) => configLines.push(line),
    env: {
      MARKOS_VAULT_SECRET: 'phase-47-e2e-secret',
      MARKOS_ANTHROPIC_API_KEY: 'sk-ant-e2e-123',
      MARKOS_LLM_MONTHLY_BUDGET: '100',
      MARKOS_LLM_PRIMARY_PROVIDER: 'anthropic',
      MARKOS_LLM_ALLOW_FALLBACK: 'true',
      MARKOS_WORKSPACE_ID: 'ws-e2e',
      MARKOS_OPERATOR_ID: 'operator-e2e',
      MARKOS_UPDATED_BY: 'phase47-e2e',
    },
    providerSmokeTest: async () => ({
      provider: 'anthropic',
      ok: true,
      text: 'test_success',
      usage: { inputTokens: 100, outputTokens: 40 },
    }),
    supabase,
  });

  assert.equal(configResult.ok, true);
  assert.match(configLines.join('\n'), /LLM configuration saved successfully/);

  supabase.state.events.push({
    provider: 'anthropic',
    input_tokens: 100,
    output_tokens: 40,
    estimated_cost_usd: 0.002,
    created_at: '2026-04-02T10:00:00.000Z',
  });

  const statusResult = await statusCli.runLLMStatusCLI({
    cli: { month: '2026-04' },
    output: (line) => statusLines.push(line),
    env: {
      MARKOS_WORKSPACE_ID: 'ws-e2e',
      MARKOS_OPERATOR_ID: 'operator-e2e',
    },
    supabase,
  });

  assert.equal(statusResult.ok, true);
  assert.equal(statusResult.summary.totals.calls, 1);
  assert.match(statusLines.join('\n'), /LLM Usage & Cost \(2026-04\)/);
});
