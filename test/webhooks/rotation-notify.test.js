'use strict';

// Phase 203 Plan 06 Task 1 — rotation-notify library + daily cron tests.
// Covers behaviors 1a-1j per 203-06-PLAN.md.
//
// RED → GREEN TDD flow. Mocks:
//   - Supabase client: records chain calls + returns canned data.
//   - Redis: Map-backed, honors { nx: true } semantics.
//   - Resend: captures `emails.send` args.
//   - computeStage: imported from rotation.cjs (may not yet exist — test asserts both
//     paths: if rotation.cjs is absent, the library must expose a local computeStage).

const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const LIB_PATH = path.join(__dirname, '..', '..', 'lib', 'markos', 'webhooks', 'rotation-notify.cjs');
const VERCEL_TS = path.join(__dirname, '..', '..', 'vercel.ts');

// ---------------------------------------------------------------------------
// Mock Supabase client — thenable chain that records calls + returns canned data.
// Supports .from().select().eq().in().order() + terminal await.
// ---------------------------------------------------------------------------
function mockSupabase({ tableResponses = {} } = {}) {
  const calls = [];

  function chain(table, op) {
    const state = {
      table,
      op,
      filters: [],
      selectCols: null,
      orders: [],
    };
    const handle = {
      select(cols, opts) { state.selectCols = cols; state.selectOpts = opts; return handle; },
      update(patch) { state.patch = patch; return handle; },
      insert(row) { state.row = row; return handle; },
      delete() { state.op = 'delete'; return handle; },
      eq(col, val) { state.filters.push(['eq', col, val]); return handle; },
      in(col, vals) { state.filters.push(['in', col, vals]); return handle; },
      not(col, operator, val) { state.filters.push(['not', col, operator, val]); return handle; },
      gte(col, val) { state.filters.push(['gte', col, val]); return handle; },
      lt(col, val) { state.filters.push(['lt', col, val]); return handle; },
      order(col, opts) { state.orders.push([col, opts]); return handle; },
      limit(n) { state.limit = n; return handle; },
      async maybeSingle() {
        calls.push({ ...state, terminal: 'maybeSingle' });
        const resp = tableResponses[table];
        if (resp && typeof resp === 'function') return resp(state);
        return { data: null, error: null };
      },
      then(onFulfilled, onRejected) {
        calls.push({ ...state, terminal: 'await' });
        const resp = tableResponses[table];
        let result;
        if (resp && typeof resp === 'function') {
          result = resp(state);
        } else {
          result = { data: [], error: null };
        }
        return Promise.resolve(result).then(onFulfilled, onRejected);
      },
    };
    return handle;
  }

  return {
    from(table) {
      return {
        select(cols, opts) { return chain(table, 'select').select(cols, opts); },
        update(patch) { return chain(table, 'update').update(patch); },
        insert(row) { return chain(table, 'insert').insert(row); },
        delete() { return chain(table, 'delete').delete(); },
      };
    },
    _calls: calls,
  };
}

// ---------------------------------------------------------------------------
// Mock Redis — Map-backed set with NX + EX semantics.
// Returns 'OK' when key is new (NX succeeds); null when key exists.
// ---------------------------------------------------------------------------
function mockRedis() {
  const store = new Map();
  return {
    _store: store,
    async set(key, val, opts = {}) {
      if (opts.nx && store.has(key)) return null;
      store.set(key, val);
      return 'OK';
    },
    async get(key) { return store.has(key) ? store.get(key) : null; },
    async del(key) { store.delete(key); return 1; },
  };
}

// ---------------------------------------------------------------------------
// Mock Resend client — captures emails.send args.
// ---------------------------------------------------------------------------
function mockResend() {
  const sent = [];
  return {
    _sent: sent,
    emails: {
      async send(args) {
        sent.push(args);
        return { id: 'em_' + (sent.length), data: { id: 'em_' + sent.length }, error: null };
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Env helpers — save/restore RESEND_API_KEY around tests.
// ---------------------------------------------------------------------------
const ORIGINAL_RESEND = process.env.RESEND_API_KEY;
beforeEach(() => {
  if (ORIGINAL_RESEND === undefined) delete process.env.RESEND_API_KEY;
  else process.env.RESEND_API_KEY = ORIGINAL_RESEND;
});

// ---------------------------------------------------------------------------
// Fixtures.
// ---------------------------------------------------------------------------
function futureDate(days) {
  return new Date(Date.now() + days * 86400 * 1000).toISOString();
}

function pastDate(days) {
  return new Date(Date.now() - days * 86400 * 1000).toISOString();
}

const fixtureSubscription = {
  id: 'whsub_1',
  url: 'https://example.com/hook',
  tenant_id: 't-1',
};

// ---------------------------------------------------------------------------
// Tests 1a-1c — buildEmailTemplate subject + HTML per stage.
// ---------------------------------------------------------------------------
describe('buildEmailTemplate', () => {
  test('1a: stage=t-7 → subject includes "7 days remain"; html includes subscription url', () => {
    const { buildEmailTemplate } = require(LIB_PATH);
    const out = buildEmailTemplate({
      stage: 't-7',
      subscription: fixtureSubscription,
      rotation: { grace_ends_at: futureDate(7) },
      grace_ends_at: futureDate(7),
    });
    assert.match(out.subject, /7 days remain/i);
    assert.match(out.html, /example\.com\/hook/);
  });

  test('1b: stage=t-1 → subject "1 day remains"', () => {
    const { buildEmailTemplate } = require(LIB_PATH);
    const out = buildEmailTemplate({
      stage: 't-1',
      subscription: fixtureSubscription,
      rotation: { grace_ends_at: futureDate(1) },
      grace_ends_at: futureDate(1),
    });
    assert.match(out.subject, /1 day remain/i);
  });

  test('1c: stage=t-0 → subject "grace ends today"', () => {
    const { buildEmailTemplate } = require(LIB_PATH);
    const out = buildEmailTemplate({
      stage: 't-0',
      subscription: fixtureSubscription,
      rotation: { grace_ends_at: new Date().toISOString() },
      grace_ends_at: new Date().toISOString(),
    });
    assert.match(out.subject, /grace ends today/i);
  });

  test('1c.throws: unsupported stage throws', () => {
    const { buildEmailTemplate } = require(LIB_PATH);
    assert.throws(
      () => buildEmailTemplate({
        stage: 'normal',
        subscription: fixtureSubscription,
        rotation: { grace_ends_at: futureDate(30) },
        grace_ends_at: futureDate(30),
      }),
      /unsupported_stage/
    );
  });
});

// ---------------------------------------------------------------------------
// Tests 1d-1e — sendRotationNotification dry-run + real send.
// ---------------------------------------------------------------------------
describe('sendRotationNotification', () => {
  test('1d: RESEND_API_KEY absent → dry-run, no email send, returns {delivered:false, reason:"dry-run"}', async () => {
    delete process.env.RESEND_API_KEY;
    const { sendRotationNotification } = require(LIB_PATH);
    const resend = mockResend();
    const out = await sendRotationNotification({ resendClient: resend }, {
      subscription: fixtureSubscription,
      rotation: { grace_ends_at: futureDate(7) },
      stage: 't-7',
      recipients: ['admin@example.com'],
    });
    assert.equal(out.delivered, false);
    assert.equal(out.reason, 'dry-run');
    assert.equal(resend._sent.length, 0, 'dry-run must NOT call resend.emails.send');
  });

  test('1e: RESEND_API_KEY present → calls resend.emails.send once with correct args; returns {delivered:true}', async () => {
    process.env.RESEND_API_KEY = 're_test_key';
    const { sendRotationNotification } = require(LIB_PATH);
    const resend = mockResend();
    const out = await sendRotationNotification({ resendClient: resend }, {
      subscription: fixtureSubscription,
      rotation: { grace_ends_at: futureDate(7) },
      stage: 't-7',
      recipients: ['admin@example.com', 'owner@example.com'],
    });
    assert.equal(out.delivered, true);
    assert.ok(out.id, 'returns id from resend');
    assert.equal(resend._sent.length, 1);
    const call = resend._sent[0];
    assert.ok(call.from, 'from set');
    assert.deepEqual(call.to, ['admin@example.com', 'owner@example.com']);
    assert.match(call.subject, /7 days remain/i);
    assert.match(call.html, /example\.com\/hook/);
  });
});

// ---------------------------------------------------------------------------
// Tests 1f-1h — notifyRotations iteration + dedupe + audit.
// ---------------------------------------------------------------------------
describe('notifyRotations', () => {
  test('1f: iterates active rotations at t-7/t-1/t-0; fetches tenant admins with role IN (owner,admin)', async () => {
    process.env.RESEND_API_KEY = 're_test';
    const { notifyRotations } = require(LIB_PATH);

    const rotations = [
      {
        id: 'rot_1',
        subscription_id: 'whsub_1',
        tenant_id: 't-1',
        grace_ends_at: futureDate(6.5), // t-7 stage (2 < days <= 7)
        subscription: { id: 'whsub_1', url: 'https://sub1.example.com/hook', tenant_id: 't-1' },
      },
    ];

    const client = mockSupabase({
      tableResponses: {
        markos_webhook_secret_rotations: () => ({ data: rotations, error: null }),
        markos_tenant_memberships: () => ({
          data: [
            { user_id: 'u1', users: { email: 'owner@example.com' } },
            { user_id: 'u2', users: { email: 'admin@example.com' } },
          ],
          error: null,
        }),
        markos_audit_log_staging: () => ({ data: { id: 'audit_1' }, error: null }),
      },
    });

    const resend = mockResend();
    const redis = mockRedis();
    const out = await notifyRotations(client, new Date(), { redis, resendClient: resend });

    assert.equal(out.sent, 1, 'should send 1 email');
    assert.equal(resend._sent.length, 1);
    assert.deepEqual(resend._sent[0].to, ['owner@example.com', 'admin@example.com']);

    // Verify membership query used role IN ['owner','admin']
    const memCall = client._calls.find((c) => c.table === 'markos_tenant_memberships' && c.terminal === 'await');
    assert.ok(memCall, 'membership query must run');
    const inFilter = memCall.filters.find((f) => f[0] === 'in' && f[1] === 'role');
    assert.ok(inFilter, 'must use .in() on role column');
    assert.deepEqual(inFilter[2].sort(), ['admin', 'owner']);
    // Tenant scope first
    const tenantFilter = memCall.filters.find((f) => f[0] === 'eq' && f[1] === 'tenant_id');
    assert.ok(tenantFilter, 'tenant_id filter required');
    assert.equal(tenantFilter[2], 't-1');
  });

  test('1g: idempotency — second call for same rotation+stage returns skipped:1, sent:0', async () => {
    process.env.RESEND_API_KEY = 're_test';
    const { notifyRotations } = require(LIB_PATH);

    const rotations = [
      {
        id: 'rot_42',
        subscription_id: 'whsub_1',
        tenant_id: 't-1',
        grace_ends_at: futureDate(6.5),
        subscription: { id: 'whsub_1', url: 'https://sub1.example.com/hook', tenant_id: 't-1' },
      },
    ];

    const tableResp = () => ({ data: rotations, error: null });
    const memResp = () => ({
      data: [{ user_id: 'u1', users: { email: 'owner@example.com' } }],
      error: null,
    });

    const client = mockSupabase({
      tableResponses: {
        markos_webhook_secret_rotations: tableResp,
        markos_tenant_memberships: memResp,
        markos_audit_log_staging: () => ({ data: { id: 'a1' }, error: null }),
      },
    });

    const redis = mockRedis(); // shared redis across both calls
    const resend = mockResend();

    const out1 = await notifyRotations(client, new Date(), { redis, resendClient: resend });
    assert.equal(out1.sent, 1);

    // Second call — same rotation+stage → redis NX returns null → skipped
    const client2 = mockSupabase({
      tableResponses: {
        markos_webhook_secret_rotations: tableResp,
        markos_tenant_memberships: memResp,
        markos_audit_log_staging: () => ({ data: { id: 'a2' }, error: null }),
      },
    });
    const out2 = await notifyRotations(client2, new Date(), { redis, resendClient: resend });
    assert.equal(out2.sent, 0, 'second call must not send');
    assert.equal(out2.skipped, 1, 'second call must record skipped');
    assert.equal(resend._sent.length, 1, 'resend.send still only called once total');
  });

  test('1h: emits one audit row per successful send with source_domain=webhooks action=secret.rotation_notified', async () => {
    process.env.RESEND_API_KEY = 're_test';
    const { notifyRotations } = require(LIB_PATH);

    const rotations = [
      {
        id: 'rot_3',
        subscription_id: 'whsub_1',
        tenant_id: 't-3',
        grace_ends_at: futureDate(6.5),
        subscription: { id: 'whsub_1', url: 'https://sub3.example.com/hook', tenant_id: 't-3' },
      },
    ];

    const client = mockSupabase({
      tableResponses: {
        markos_webhook_secret_rotations: () => ({ data: rotations, error: null }),
        markos_tenant_memberships: () => ({
          data: [{ user_id: 'u1', users: { email: 'admin@example.com' } }],
          error: null,
        }),
      },
    });

    // Inject enqueueAuditStaging via deps so we capture audit rows without
    // needing the mock to implement .select().single() terminals.
    const auditInserts = [];
    const auditEmit = async (_client, entry) => {
      auditInserts.push(entry);
      return { staging_id: 'a_' + auditInserts.length };
    };

    const redis = mockRedis();
    const resend = mockResend();
    await notifyRotations(client, new Date(), {
      redis,
      resendClient: resend,
      enqueueAuditStaging: auditEmit,
    });

    assert.equal(auditInserts.length, 1);
    assert.equal(auditInserts[0].source_domain, 'webhooks');
    assert.equal(auditInserts[0].action, 'secret.rotation_notified');
    assert.equal(auditInserts[0].payload.rotation_id, 'rot_3');
    assert.equal(auditInserts[0].payload.stage, 't-7');
    assert.equal(auditInserts[0].payload.recipients_count, 1);
  });

  test('1f.skip: rotations at stage=normal are NOT sent (grace > 7 days out)', async () => {
    process.env.RESEND_API_KEY = 're_test';
    const { notifyRotations } = require(LIB_PATH);
    const rotations = [
      {
        id: 'rot_x',
        subscription_id: 'whsub_x',
        tenant_id: 't-x',
        grace_ends_at: futureDate(20), // normal stage
        subscription: { id: 'whsub_x', url: 'https://x.example.com/hook', tenant_id: 't-x' },
      },
    ];
    const client = mockSupabase({
      tableResponses: {
        markos_webhook_secret_rotations: () => ({ data: rotations, error: null }),
      },
    });
    const redis = mockRedis();
    const resend = mockResend();
    const out = await notifyRotations(client, new Date(), { redis, resendClient: resend });
    assert.equal(out.sent, 0);
    assert.equal(resend._sent.length, 0);
  });
});

// ---------------------------------------------------------------------------
// Test 1i — cron handler gates + success.
// ---------------------------------------------------------------------------
describe('api/cron/webhooks-rotation-notify.js', () => {
  const ORIGINAL_SECRET = process.env.MARKOS_WEBHOOK_CRON_SECRET;
  beforeEach(() => {
    if (ORIGINAL_SECRET === undefined) delete process.env.MARKOS_WEBHOOK_CRON_SECRET;
    else process.env.MARKOS_WEBHOOK_CRON_SECRET = ORIGINAL_SECRET;
  });

  function mockRes() {
    const out = { statusCode: null, body: null, headers: {} };
    return {
      writeHead(code, headers) { out.statusCode = code; Object.assign(out.headers, headers || {}); },
      setHeader(k, v) { out.headers[k] = v; },
      set statusCode(v) { out.statusCode = v; },
      get statusCode() { return out.statusCode; },
      end(payload) { out.body = payload; },
      _out: out,
    };
  }

  test('1i-a: wrong method → 405', async () => {
    process.env.MARKOS_WEBHOOK_CRON_SECRET = 'shh';
    const { handle } = require('../../api/cron/webhooks-rotation-notify.js');
    const req = { method: 'PUT', headers: { 'x-markos-cron-secret': 'shh' } };
    const res = mockRes();
    await handle(req, res, {
      notifyRotations: async () => ({ sent: 0, skipped: 0, total_active: 0 }),
      supabase: {},
      redis: {},
    });
    assert.equal(res.statusCode, 405);
  });

  test('1i-b: missing or wrong secret → 401', async () => {
    process.env.MARKOS_WEBHOOK_CRON_SECRET = 'shh';
    const { handle } = require('../../api/cron/webhooks-rotation-notify.js');
    const req = { method: 'POST', headers: {} };
    const res = mockRes();
    await handle(req, res, {
      notifyRotations: async () => ({ sent: 0, skipped: 0, total_active: 0 }),
      supabase: {},
      redis: {},
    });
    assert.equal(res.statusCode, 401);

    const req2 = { method: 'POST', headers: { 'x-markos-cron-secret': 'wrong' } };
    const res2 = mockRes();
    await handle(req2, res2, {
      notifyRotations: async () => ({ sent: 0, skipped: 0, total_active: 0 }),
      supabase: {},
      redis: {},
    });
    assert.equal(res2.statusCode, 401);
  });

  test('1i-c: correct secret → 200 { ok, sent_count, skipped_count, duration_ms }', async () => {
    process.env.MARKOS_WEBHOOK_CRON_SECRET = 'shh';
    const { handle } = require('../../api/cron/webhooks-rotation-notify.js');
    const req = { method: 'POST', headers: { 'x-markos-cron-secret': 'shh' } };
    const res = mockRes();
    await handle(req, res, {
      notifyRotations: async () => ({ sent: 3, skipped: 1, total_active: 4 }),
      supabase: {},
      redis: {},
    });
    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res._out.body);
    assert.equal(body.ok, true);
    assert.equal(body.sent_count, 3);
    assert.equal(body.skipped_count, 1);
    assert.ok(typeof body.duration_ms === 'number');
  });
});

// ---------------------------------------------------------------------------
// Test 1j — vercel.ts 7th cron entry at 04:00 UTC.
// ---------------------------------------------------------------------------
describe('vercel.ts cron registration', () => {
  test('1j: vercel.ts contains webhooks-rotation-notify + 0 4 * * * schedule', () => {
    const src = fs.readFileSync(VERCEL_TS, 'utf8');
    assert.match(src, /webhooks-rotation-notify/);
    assert.match(src, /0 4 \* \* \*/);
  });

  test('1j.parity: all 7 crons + queue trigger still present', () => {
    const src = fs.readFileSync(VERCEL_TS, 'utf8');
    // 5 original crons
    assert.match(src, /audit\/drain/);
    assert.match(src, /lifecycle\/purge-cron/);
    assert.match(src, /cleanup-unverified-signups/);
    assert.match(src, /mcp\/session\/cleanup/);
    assert.match(src, /mcp-kpi-digest/);
    // Phase 203 crons
    assert.match(src, /webhooks-dlq-purge/);
    assert.match(src, /webhooks-rotation-notify/);
    // Queue trigger
    assert.match(src, /queue\/v2beta/);
  });
});

// ---------------------------------------------------------------------------
// Exports sanity.
// ---------------------------------------------------------------------------
describe('exports', () => {
  test('module exports buildEmailTemplate, sendRotationNotification, notifyRotations', () => {
    const mod = require(LIB_PATH);
    assert.equal(typeof mod.buildEmailTemplate, 'function');
    assert.equal(typeof mod.sendRotationNotification, 'function');
    assert.equal(typeof mod.notifyRotations, 'function');
    assert.ok(typeof mod.NOTIFIED_KEY_PREFIX === 'string');
    assert.ok(typeof mod.NOTIFIED_TTL_SEC === 'number');
  });

  test('dual-export: .cjs + .ts both exist', () => {
    assert.ok(fs.existsSync(LIB_PATH), 'rotation-notify.cjs exists');
    const tsPath = LIB_PATH.replace('.cjs', '.ts');
    assert.ok(fs.existsSync(tsPath), 'rotation-notify.ts exists');
  });
});
