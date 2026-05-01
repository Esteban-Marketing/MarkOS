'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { handleRotateSecret } = require('../../api/webhooks/rotate-secret.js');

function makeReq({ method = 'POST', body = {}, tenant_id = 'ten_a' } = {}) {
  return {
    method,
    body,
    headers: {},
    markosAuth: { tenant_id },
    on() {},
  };
}

function makeRes() {
  return {
    statusCode: 200,
    headers: {},
    body: '',
    setHeader(key, value) {
      this.headers[key] = value;
    },
    writeHead(code, headers) {
      this.statusCode = code;
      if (headers) Object.assign(this.headers, headers);
    },
    end(body) {
      this.body = body;
    },
  };
}

function parse(res) {
  return JSON.parse(res.body || '{}');
}

function makeSupabase({ subscription = { id: 'whsub_1', tenant_id: 'ten_a', secret_vault_ref: 'markos:webhook:secret:whsub_1' }, lookupError = null, updateError = null } = {}) {
  const calls = [];
  return {
    __calls: calls,
    from(table) {
      if (table !== 'markos_webhook_subscriptions') throw new Error(`unexpected table ${table}`);
      const state = { mode: 'select' };
      const builder = {
        select() {
          state.mode = 'select';
          return builder;
        },
        update(patch) {
          state.mode = 'update';
          state.patch = patch;
          return builder;
        },
        eq(column, value) {
          calls.push({ table, mode: state.mode, column, value, patch: state.patch || null });
          if (state.mode === 'select') {
            return {
              async maybeSingle() {
                return { data: subscription, error: lookupError };
              },
            };
          }
          return Promise.resolve({ data: null, error: updateError });
        },
      };
      return builder;
    },
  };
}

function auth(tenant_id = 'ten_a') {
  return {
    ok: true,
    tenant_id,
    iamRole: 'owner',
    principal: { id: 'usr_1', tenant_role: 'owner' },
  };
}

test('successful rotation returns 200 with plaintext_secret_show_once', async () => {
  const supabase = makeSupabase();
  const res = makeRes();
  await handleRotateSecret(makeReq({ body: { subscription_id: 'whsub_1' } }), res, {
    supabase,
    auth: auth(),
    rotateSecret: async () => 'markos:webhook:secret:whsub_1',
    enqueueAuditStaging: async () => ({ staging_id: 'aud_1' }),
  });
  assert.equal(res.statusCode, 200);
  const body = parse(res);
  assert.equal(body.ok, true);
  assert.equal(body.subscription_id, 'whsub_1');
  assert.equal(typeof body.plaintext_secret_show_once, 'string');
  assert.equal(body.plaintext_secret_show_once.length, 64);
});

test('successful rotation emits audit row with secret.rotated action', async () => {
  const supabase = makeSupabase();
  const res = makeRes();
  const auditCalls = [];
  await handleRotateSecret(makeReq({ body: { subscription_id: 'whsub_1' } }), res, {
    supabase,
    auth: auth(),
    rotateSecret: async () => 'markos:webhook:secret:whsub_1',
    enqueueAuditStaging: async (_client, entry) => {
      auditCalls.push(entry);
      return { staging_id: 'aud_1' };
    },
  });
  assert.equal(res.statusCode, 200);
  assert.equal(auditCalls.length, 1);
  assert.equal(auditCalls[0].action, 'secret.rotated');
});

test('audit emit failure returns 500 audit_emit_failed', async () => {
  const supabase = makeSupabase();
  const res = makeRes();
  await handleRotateSecret(makeReq({ body: { subscription_id: 'whsub_1' } }), res, {
    supabase,
    auth: auth(),
    rotateSecret: async () => 'markos:webhook:secret:whsub_1',
    enqueueAuditStaging: async () => {
      throw new Error('audit down');
    },
  });
  assert.equal(res.statusCode, 500);
  assert.equal(parse(res).error, 'audit_emit_failed');
});

test('wrong tenant returns 403', async () => {
  const supabase = makeSupabase({ subscription: { id: 'whsub_1', tenant_id: 'ten_b', secret_vault_ref: 'markos:webhook:secret:whsub_1' } });
  const res = makeRes();
  await handleRotateSecret(makeReq({ body: { subscription_id: 'whsub_1' }, tenant_id: 'ten_a' }), res, {
    supabase,
    auth: auth('ten_a'),
  });
  assert.equal(res.statusCode, 403);
  assert.equal(parse(res).error, 'forbidden');
});

test('missing subscription_id returns 400', async () => {
  const res = makeRes();
  await handleRotateSecret(makeReq({ body: {} }), res, {
    supabase: makeSupabase(),
    auth: auth(),
  });
  assert.equal(res.statusCode, 400);
  assert.equal(parse(res).error, 'missing_subscription_id');
});

test('non-POST method returns 405', async () => {
  const res = makeRes();
  await handleRotateSecret(makeReq({ method: 'GET', body: {} }), res, {
    supabase: makeSupabase(),
    auth: auth(),
  });
  assert.equal(res.statusCode, 405);
  assert.equal(parse(res).error, 'method_not_allowed');
});
