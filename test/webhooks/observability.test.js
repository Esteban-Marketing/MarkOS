'use strict';

// Phase 203 Plan 10 Task 1 — Webhook observability: log-drain + Sentry + delivery.cjs wiring.
// Mirrors test/mcp/observability.test.js shape with domain='webhook'.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const { emitLogLine } = require('../../lib/markos/webhooks/log-drain.cjs');
const {
  captureToolError,
  setupSentryContext,
  _internalResetForTests,
} = require('../../lib/markos/webhooks/sentry.cjs');

test('1a: emitLogLine returns entry with domain=webhook + every D-30 webhook field', () => {
  const entry = emitLogLine({
    domain: 'webhook',
    req_id: 'whk-req-1',
    tenant_id: 't1',
    sub_id: 'whsub_1',
    delivery_id: 'whdel_1',
    event_type: 'crm.deal.updated',
    delivery_attempt: 3,
    duration_ms: 217,
    status: 'delivered',
    error_code: null,
  });
  assert.equal(entry.domain, 'webhook');
  assert.equal(entry.req_id, 'whk-req-1');
  assert.equal(entry.tenant_id, 't1');
  assert.equal(entry.sub_id, 'whsub_1');
  assert.equal(entry.delivery_id, 'whdel_1');
  assert.equal(entry.event_type, 'crm.deal.updated');
  assert.equal(entry.delivery_attempt, 3);
  assert.equal(entry.duration_ms, 217);
  assert.equal(entry.status, 'delivered');
  assert.equal(entry.error_code, null);
  assert.ok(entry.timestamp);
});

test('1a: emitLogLine coerces undefined fields to null', () => {
  const entry = emitLogLine({ domain: 'webhook' });
  assert.equal(entry.req_id, null);
  assert.equal(entry.tenant_id, null);
  assert.equal(entry.sub_id, null);
  assert.equal(entry.delivery_id, null);
  assert.equal(entry.event_type, null);
  assert.equal(entry.delivery_attempt, null);
  assert.equal(entry.duration_ms, null);
  assert.equal(entry.status, null);
  assert.equal(entry.error_code, null);
});

test('1b: emitLogLine missing domain defaults to webhook (permissive) OR throws', () => {
  // Per spec: require domain to be webhook or mcp. Missing → auto-default to webhook.
  const entry = emitLogLine({});
  assert.ok(entry.domain === 'webhook' || entry.domain === 'mcp');
});

test('1c: emitLogLine output is JSON.stringify-safe (single-line)', () => {
  const entry = emitLogLine({ domain: 'webhook', req_id: 'r', status: 'ok', duration_ms: 5 });
  const rt = JSON.parse(JSON.stringify(entry));
  assert.deepEqual(rt, entry);
});

test('1d: captureToolError no-ops when SENTRY_DSN env unset', () => {
  const prev = process.env.SENTRY_DSN;
  delete process.env.SENTRY_DSN;
  _internalResetForTests();
  const r = captureToolError(new Error('boom'), {
    req_id: 'whk-req-1', delivery_id: 'whdel_1', sub_id: 'whsub_1',
  });
  assert.equal(r, false);
  if (prev) process.env.SENTRY_DSN = prev;
});

test('1e: captureToolError with mock Sentry fires with domain=webhook tag', () => {
  _internalResetForTests();
  const prev = process.env.SENTRY_DSN;
  process.env.SENTRY_DSN = 'https://example@sentry.io/1';
  const calls = [];
  const fakeSentry = {
    captureException(err, ctx) { calls.push({ err: err.message, tags: ctx.tags, extra: ctx.extra }); },
    setTag() {},
  };
  const r = captureToolError(new Error('boom'), {
    req_id: 'whk-req-1', delivery_id: 'whdel_1', sub_id: 'whsub_1', tenant_id: 't1',
  }, { sentry: fakeSentry });
  assert.equal(r, true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].tags.domain, 'webhook');
  if (prev) process.env.SENTRY_DSN = prev; else delete process.env.SENTRY_DSN;
});

test('1f: captureToolError tolerates Sentry throwing (triple-safety)', () => {
  _internalResetForTests();
  const prev = process.env.SENTRY_DSN;
  process.env.SENTRY_DSN = 'https://example@sentry.io/1';
  const fakeSentry = { captureException() { throw new Error('sentry down'); }, setTag() {} };
  const r = captureToolError(new Error('boom'), { req_id: 'r' }, { sentry: fakeSentry });
  assert.equal(r, false);
  if (prev) process.env.SENTRY_DSN = prev; else delete process.env.SENTRY_DSN;
});

test('1j: log-drain source grep — domain=webhook referenced in module', () => {
  const src = fs.readFileSync(path.join(REPO_ROOT, 'lib/markos/webhooks/log-drain.cjs'), 'utf8');
  assert.match(src, /['"]webhook['"]/);
});

test('1j: sentry module references domain=webhook tag', () => {
  const src = fs.readFileSync(path.join(REPO_ROOT, 'lib/markos/webhooks/sentry.cjs'), 'utf8');
  assert.match(src, /domain:\s*['"]webhook['"]/);
});

test('1j: sentry module has triple-safety — env gate + lazy import + try/catch', () => {
  const src = fs.readFileSync(path.join(REPO_ROOT, 'lib/markos/webhooks/sentry.cjs'), 'utf8');
  assert.match(src, /process\.env\.SENTRY_DSN/);
  assert.match(src, /@sentry\/nextjs/);
  assert.match(src, /try\s*\{/);
});

test('1i: api/webhooks/queues/deliver.js imports real log-drain + sentry modules (no safe-require stub)', () => {
  const src = fs.readFileSync(path.join(REPO_ROOT, 'api/webhooks/queues/deliver.js'), 'utf8');
  assert.match(src, /require\(['"][^'"]*log-drain\.cjs['"]\)/);
  assert.match(src, /require\(['"][^'"]*sentry\.cjs['"]\)/);
});

test('1g/1h/1k/1l/1m/1n: delivery.cjs wires log-drain + sentry + recordOutcome', () => {
  // These are grep assertions that the observability wrapper ships in delivery.cjs.
  // Integration tests with a seeded redis mock are in delivery.test.js (not here).
  const src = fs.readFileSync(path.join(REPO_ROOT, 'lib/markos/webhooks/delivery.cjs'), 'utf8');
  // 1g: finally block emits log line
  assert.match(src, /emitLogLine/);
  // 1h: catch block captures
  assert.match(src, /captureToolError/);
  // 1k/1l/1m: post-fetch breaker recordOutcome + classifyOutcome
  assert.match(src, /recordOutcome/);
  assert.match(src, /classifyOutcome/);
  // Require import of breaker.cjs
  assert.match(src, /require\(['"][^'"]*breaker(?:\.cjs)?['"]\)/);
});
