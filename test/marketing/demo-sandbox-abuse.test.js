'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { withMockedModule } = require('../setup.js');

const DEMO_MODULE_PATH = '../../lib/markos/marketing/demo-sandbox.cjs';

function loadDemoSandbox() {
  delete require.cache[require.resolve(DEMO_MODULE_PATH)];
  return require(DEMO_MODULE_PATH);
}

async function withDemoSandbox(overrides, run) {
  const botid = overrides?.botid || { verifyBotIdToken: async () => ({ ok: true, reason: 'verified' }) };
  const audit = overrides?.audit || { enqueueAuditStaging: async () => ({ staging_id: 1 }) };

  return withMockedModule('../lib/markos/auth/botid.cjs', botid, () =>
    withMockedModule('../lib/markos/audit/writer.cjs', audit, async () => {
      const demoSandbox = loadDemoSandbox();
      demoSandbox._resetDemoCostTotalsForTests();
      return run(demoSandbox);
    }),
  );
}

function createCostClient(state = {}) {
  const rows = state.rows || [];
  const audit = [];

  return {
    state: { rows, audit },
    from(name) {
      if (name === 'markos_orgs' || name === 'markos_tenants' || name === 'markos_mcp_sessions') {
        return {
          upsert: async (row) => {
            audit.push({ table: name, row });
            return { error: null };
          },
        };
      }

      if (name === 'markos_mcp_cost_events') {
        return {
          select() {
            return {
              eq(_tenantField, tenantValue) {
                return {
                  eq: async (_sessionField, sessionValue) => ({
                    data: rows
                      .filter((row) => row.tenant_id === tenantValue && row.mcp_session_id === sessionValue)
                      .map((row) => ({ cost_cents: row.cost_cents })),
                    error: null,
                  }),
                };
              },
            };
          },
          insert: async (row) => {
            rows.push(row);
            return { error: null };
          },
        };
      }

      throw new Error(`unexpected table: ${name}`);
    },
  };
}

test.beforeEach(() => {
  process.env.MARKOS_DEMO_TOKEN_SECRET = 'demo-secret-demo-secret-demo-secret-demo-secret-demo-secret-1234';
});

test('issueDemoSessionToken rejects when BotID verification fails', async () => {
  await withDemoSandbox(
    { botid: { verifyBotIdToken: async () => ({ ok: false, reason: 'invalid' }) } },
    async (demoSandbox) => {
      const result = await demoSandbox.issueDemoSessionToken({ botid_token: 'bad-token' });
      assert.equal(result.ok, false);
      assert.equal(result.reason, 'botid_failed');
    },
  );
});

test('issueDemoSessionToken returns a 15-minute JWT with the restricted tool subset', async () => {
  await withDemoSandbox({}, async (demoSandbox) => {
    const result = await demoSandbox.issueDemoSessionToken({
      botid_token: 'good-token',
      ip: '203.0.113.10',
      ua: 'demo-agent',
      supabaseClient: {},
    });

    assert.equal(result.ok, true);
    assert.equal(result.demo_session_token.split('.').length, 3);
    assert.deepEqual(result.allowed_tools, ['draft_message', 'audit_claim']);
    assert.equal(result.cost_cap_cents, 50);

    const expiresAt = Date.parse(result.expires_at);
    const deltaSeconds = Math.round((expiresAt - Date.now()) / 1000);
    assert.ok(deltaSeconds <= 900 && deltaSeconds >= 895, `expected ~900s TTL, got ${deltaSeconds}s`);
  });
});

test('verifyDemoSessionToken accepts a freshly-issued token and returns claims', async () => {
  await withDemoSandbox({}, async (demoSandbox) => {
    const issue = await demoSandbox.issueDemoSessionToken({ botid_token: 'good-token' });
    assert.equal(issue.ok, true);

    const verify = demoSandbox.verifyDemoSessionToken(issue.demo_session_token);
    assert.equal(verify.ok, true);
    assert.equal(verify.claims.aud, 'demo-sandbox');
    assert.deepEqual(verify.claims.allowed_tools, ['draft_message', 'audit_claim']);
    assert.equal(verify.claims.cost_cap_cents, 50);
  });
});

test('verifyDemoSessionToken rejects signature tampering', async () => {
  await withDemoSandbox({}, async (demoSandbox) => {
    const issue = await demoSandbox.issueDemoSessionToken({ botid_token: 'good-token' });
    assert.equal(issue.ok, true);

    const tampered = `${issue.demo_session_token.slice(0, -1)}${issue.demo_session_token.endsWith('a') ? 'b' : 'a'}`;
    const verify = demoSandbox.verifyDemoSessionToken(tampered);
    assert.equal(verify.ok, false);
    assert.equal(verify.reason, 'signature_invalid');
  });
});

test('verifyDemoSessionToken rejects an expired token', async () => {
  await withDemoSandbox({}, async (demoSandbox) => {
    const issue = await demoSandbox.issueDemoSessionToken({ botid_token: 'good-token' });
    assert.equal(issue.ok, true);

    const realNow = Date.now;
    Date.now = () => realNow() + 901_000;
    try {
      const verify = demoSandbox.verifyDemoSessionToken(issue.demo_session_token);
      assert.equal(verify.ok, false);
      assert.equal(verify.reason, 'token_expired');
    } finally {
      Date.now = realNow;
    }
  });
});

test('assertToolAllowed only permits draft_message and audit_claim', async () => {
  await withDemoSandbox({}, async (demoSandbox) => {
    const issue = await demoSandbox.issueDemoSessionToken({ botid_token: 'good-token' });
    assert.equal(issue.ok, true);

    const verify = demoSandbox.verifyDemoSessionToken(issue.demo_session_token);
    assert.equal(verify.ok, true);

    assert.deepEqual(demoSandbox.assertToolAllowed(verify.claims, 'draft_message'), { ok: true });
    assert.deepEqual(demoSandbox.assertToolAllowed(verify.claims, 'audit_claim'), { ok: true });
    assert.deepEqual(demoSandbox.assertToolAllowed(verify.claims, 'schedule_post'), {
      ok: false,
      reason: 'tool_not_allowed',
      detail: 'schedule_post',
    });
  });
});

test('recordDemoCost enforces the $0.50 total cap', async () => {
  await withDemoSandbox({}, async (demoSandbox) => {
    const client = createCostClient();

    const first = await demoSandbox.recordDemoCost(client, 'demo:cost-cap', demoSandbox.DEMO_SYNTHETIC_TENANT_ID, 30, 'draft_message');
    assert.deepEqual(first, { ok: true, total_cents: 30 });

    const second = await demoSandbox.recordDemoCost(client, 'demo:cost-cap', demoSandbox.DEMO_SYNTHETIC_TENANT_ID, 20, 'audit_claim');
    assert.deepEqual(second, { ok: true, total_cents: 50 });

    const third = await demoSandbox.recordDemoCost(client, 'demo:cost-cap', demoSandbox.DEMO_SYNTHETIC_TENANT_ID, 1, 'audit_claim');
    assert.equal(third.ok, false);
    assert.equal(third.reason, 'cost_cap_exceeded');
    assert.equal(third.total_cents, 51);
  });
});

test('recordDemoCost returns db_error when the backing client fails', async () => {
  await withDemoSandbox({}, async (demoSandbox) => {
    const failingClient = {
      from(name) {
        if (name === 'markos_orgs' || name === 'markos_tenants' || name === 'markos_mcp_sessions') {
          return {
            upsert: async () => ({ error: { message: 'boom' } }),
          };
        }
        return {
          select() {
            return {
              eq() {
                return {
                  eq: async () => ({ data: null, error: { message: 'boom' } }),
                };
              },
            };
          },
          insert: async () => ({ error: { message: 'boom' } }),
        };
      },
    };

    const result = await demoSandbox.recordDemoCost(
      failingClient,
      'demo:broken',
      demoSandbox.DEMO_SYNTHETIC_TENANT_ID,
      10,
      'draft_message',
    );

    assert.equal(result.ok, false);
    assert.equal(result.reason, 'db_error');
  });
});
