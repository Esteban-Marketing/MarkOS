'use strict';

// Phase 203 Plan 03 Task 2 — DLQ purge cron wrapper + vercel.ts registration (RED).
// Behaviors 2a-2f per 203-03-PLAN.md.

const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Save + restore env around tests that manipulate MARKOS_WEBHOOK_CRON_SECRET.
const ORIGINAL_SECRET = process.env.MARKOS_WEBHOOK_CRON_SECRET;
beforeEach(() => {
  if (ORIGINAL_SECRET === undefined) delete process.env.MARKOS_WEBHOOK_CRON_SECRET;
  else process.env.MARKOS_WEBHOOK_CRON_SECRET = ORIGINAL_SECRET;
});

// Minimal req/res stubs that capture status + body.
function mockRes() {
  const out = { statusCode: null, body: null, headers: {} };
  return {
    writeHead(code, headers) { out.statusCode = code; Object.assign(out.headers, headers); },
    setHeader(k, v) { out.headers[k] = v; },
    set statusCode(v) { out.statusCode = v; },
    get statusCode() { return out.statusCode; },
    end(payload) { out.body = payload; },
    _out: out,
  };
}

function parseJson(res) {
  return JSON.parse(res._out.body);
}

describe('api/cron/webhooks-dlq-purge.js handler', () => {
  test('2a: missing x-markos-cron-secret → 401', async () => {
    process.env.MARKOS_WEBHOOK_CRON_SECRET = 'shh-secret';
    const handler = require('../../api/cron/webhooks-dlq-purge.js');
    const { handle } = handler;
    assert.equal(typeof handle, 'function', 'handler must export named `handle` for testability');

    const req = { method: 'POST', headers: {} };
    const res = mockRes();
    await handle(req, res, { purgeExpired: async () => ({ count: 0 }), supabase: {} });
    assert.equal(res.statusCode, 401);
    const body = parseJson(res);
    assert.equal(body.success, false);
  });

  test('2b: wrong secret → 401', async () => {
    process.env.MARKOS_WEBHOOK_CRON_SECRET = 'shh-secret';
    const { handle } = require('../../api/cron/webhooks-dlq-purge.js');
    const req = { method: 'POST', headers: { 'x-markos-cron-secret': 'not-it' } };
    const res = mockRes();
    await handle(req, res, { purgeExpired: async () => ({ count: 0 }), supabase: {} });
    assert.equal(res.statusCode, 401);
  });

  test('2c: correct secret → 200 { success, count, duration_ms }', async () => {
    process.env.MARKOS_WEBHOOK_CRON_SECRET = 'shh-secret';
    const { handle } = require('../../api/cron/webhooks-dlq-purge.js');
    const req = { method: 'POST', headers: { 'x-markos-cron-secret': 'shh-secret' } };
    const res = mockRes();
    await handle(req, res, { purgeExpired: async () => ({ count: 7 }), supabase: {} });
    assert.equal(res.statusCode, 200);
    const body = parseJson(res);
    assert.equal(body.success, true);
    assert.equal(body.count, 7);
    assert.ok(typeof body.duration_ms === 'number');
  });

  test('2d: wrong method (GET non-cron) still works with shared-secret pattern OR 405', async () => {
    // Plan says "Wrong method (GET) → 405". Mirror cleanup.js pattern (accepts POST or GET for Vercel
    // cron flexibility). Plan requires POST-only; accept strict POST-only per plan text.
    process.env.MARKOS_WEBHOOK_CRON_SECRET = 'shh-secret';
    const { handle } = require('../../api/cron/webhooks-dlq-purge.js');
    const req = { method: 'PUT', headers: { 'x-markos-cron-secret': 'shh-secret' } };
    const res = mockRes();
    await handle(req, res, { purgeExpired: async () => ({ count: 0 }), supabase: {} });
    assert.equal(res.statusCode, 405);
  });

  test('2c.err: handler catches purge error → 500 { success:false }', async () => {
    process.env.MARKOS_WEBHOOK_CRON_SECRET = 'shh-secret';
    const { handle } = require('../../api/cron/webhooks-dlq-purge.js');
    const req = { method: 'POST', headers: { 'x-markos-cron-secret': 'shh-secret' } };
    const res = mockRes();
    const boom = async () => { throw new Error('oops'); };
    await handle(req, res, { purgeExpired: boom, supabase: {} });
    assert.equal(res.statusCode, 500);
    const body = parseJson(res);
    assert.equal(body.success, false);
  });

  test('2c.bearer: Bearer token alt-header accepted (cleanup.js parity)', async () => {
    process.env.MARKOS_WEBHOOK_CRON_SECRET = 'shh-secret';
    const { handle } = require('../../api/cron/webhooks-dlq-purge.js');
    const req = { method: 'POST', headers: { authorization: 'Bearer shh-secret' } };
    const res = mockRes();
    await handle(req, res, { purgeExpired: async () => ({ count: 0 }), supabase: {} });
    assert.equal(res.statusCode, 200);
  });
});

describe('vercel.ts cron registration', () => {
  const vercelTsPath = path.resolve(__dirname, '../../vercel.ts');
  const content = fs.readFileSync(vercelTsPath, 'utf8');

  test('2e: 6th cron entry webhooks-dlq-purge at 30 3 * * *', () => {
    assert.match(content, /\/api\/cron\/webhooks-dlq-purge/, 'cron path required');
    assert.match(content, /30 3 \* \* \*/, 'schedule 30 3 * * * required (daily 03:30 UTC)');
  });

  test('2f: all 5 prior cron paths preserved', () => {
    const required = [
      '/api/audit/drain',
      '/api/tenant/lifecycle/purge-cron',
      '/api/auth/cleanup-unverified-signups',
      '/api/mcp/session/cleanup',
      '/api/cron/mcp-kpi-digest',
    ];
    for (const cron of required) {
      assert.ok(content.includes(cron), `missing existing cron path: ${cron}`);
    }
  });

  test('2f.queue: Plan 203-01 queue trigger still present', () => {
    assert.match(content, /queue\/v2beta/);
    assert.match(content, /markos-webhook-delivery/);
  });
});
