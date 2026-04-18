'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { emitLogLine } = require('../../lib/markos/mcp/log-drain.cjs');
const { captureToolError, setupSentryContext, _internalResetForTests } = require('../../lib/markos/mcp/sentry.cjs');

test('Suite 202-05: emitLogLine returns an entry with domain=mcp + every D-30 field', () => {
  const entry = emitLogLine({
    req_id: 'mcp-req-abc', session_id: 'mcp-sess-1',
    tenant_id: 't1', tool_id: 'draft_message',
    duration_ms: 237, status: 'ok', cost_cents: 3, error_code: null,
  });
  assert.equal(entry.domain, 'mcp');
  assert.equal(entry.req_id, 'mcp-req-abc');
  assert.equal(entry.session_id, 'mcp-sess-1');
  assert.equal(entry.tenant_id, 't1');
  assert.equal(entry.tool_id, 'draft_message');
  assert.equal(entry.duration_ms, 237);
  assert.equal(entry.status, 'ok');
  assert.equal(entry.cost_cents, 3);
  assert.equal(entry.error_code, null);
  assert.ok(entry.timestamp);
});

test('Suite 202-05: emitLogLine coerces undefined fields to null (wire-safe JSON)', () => {
  const entry = emitLogLine({});
  assert.equal(entry.req_id, null);
  assert.equal(entry.session_id, null);
  assert.equal(entry.tenant_id, null);
  assert.equal(entry.tool_id, null);
  assert.equal(entry.duration_ms, null);
  assert.equal(entry.status, null);
  assert.equal(entry.cost_cents, 0); // default for cost
  assert.equal(entry.error_code, null);
});

test('Suite 202-05: emitLogLine output is JSON.stringify-safe (no undefined in round-trip)', () => {
  const entry = emitLogLine({ req_id: 'r', tool_id: 't', duration_ms: 5, status: 'ok' });
  const rt = JSON.parse(JSON.stringify(entry));
  assert.deepEqual(rt, entry);
});

test('Suite 202-05: captureToolError no-ops when SENTRY_DSN env unset (graceful degrade)', () => {
  const prev = process.env.SENTRY_DSN;
  delete process.env.SENTRY_DSN;
  _internalResetForTests();
  const r = captureToolError(new Error('boom'), { req_id: 'r', session_id: 's', tenant_id: 't', tool_id: 'x' });
  assert.equal(r, false);
  if (prev) process.env.SENTRY_DSN = prev;
});

test('Suite 202-05: captureToolError calls injected sentry with correct tags + extra (D-32)', () => {
  _internalResetForTests();
  const calls = [];
  const fakeSentry = {
    captureException(err, ctx) { calls.push({ err: err.message, tags: ctx.tags, extra: ctx.extra }); },
    setTag() {},
  };
  const r = captureToolError(new Error('boom'), {
    req_id: 'mcp-req-a', session_id: 'mcp-sess-1', tenant_id: 't1', tool_id: 'draft_message',
  }, { sentry: fakeSentry });
  assert.equal(r, true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].tags.domain, 'mcp');
  assert.equal(calls[0].tags.tool_id, 'draft_message');
  assert.equal(calls[0].tags.status, 'error');
  assert.equal(calls[0].extra.req_id, 'mcp-req-a');
  assert.equal(calls[0].extra.session_id, 'mcp-sess-1');
  assert.equal(calls[0].extra.tenant_id, 't1');
});

test('Suite 202-05: captureToolError tolerates Sentry.captureException throwing (never re-throws)', () => {
  _internalResetForTests();
  const fakeSentry = { captureException() { throw new Error('sentry down'); }, setTag() {} };
  const r = captureToolError(new Error('boom'), { req_id: 'r', session_id: 's', tenant_id: 't', tool_id: 'x' }, { sentry: fakeSentry });
  assert.equal(r, false);
});

test('Suite 202-05: setupSentryContext sets domain + req_id tags via injected Sentry', () => {
  _internalResetForTests();
  const tagged = [];
  const fakeSentry = { setTag(k, v) { tagged.push([k, v]); }, captureException() {} };
  setupSentryContext({ req_id: 'mcp-req-xyz', session_id: 'mcp-sess-2' }, { sentry: fakeSentry });
  assert.ok(tagged.some(([k]) => k === 'domain'));
  assert.ok(tagged.some(([k, v]) => k === 'req_id' && v === 'mcp-req-xyz'));
});

test('Suite 202-05: instrumentation.ts exports register + onRequestError symbols', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const src = fs.readFileSync(path.join(__dirname, '..', '..', 'instrumentation.ts'), 'utf8');
  assert.match(src, /export async function register/);
  assert.match(src, /export const onRequestError/);
  assert.match(src, /NEXT_RUNTIME === 'nodejs'/);
});

test('Suite 202-05: sentry.server.config.ts sets tracesSampleRate 0.1 + environment from VERCEL_ENV', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const src = fs.readFileSync(path.join(__dirname, '..', '..', 'sentry.server.config.ts'), 'utf8');
  assert.match(src, /tracesSampleRate:\s*0\.1/);
  assert.match(src, /process\.env\.VERCEL_ENV/);
  assert.match(src, /process\.env\.SENTRY_DSN/);
});
