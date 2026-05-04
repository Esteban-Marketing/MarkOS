'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const otel = require('../../lib/markos/observability/otel.cjs');

function reset() {
  otel._internalResetForTests();
  delete process.env.SENTRY_DSN;
  delete process.env.OTEL_SAMPLE_RATE;
}

function withCapturedSink() {
  const lines = [];
  otel.setTestSink((line, payload) => {
    lines.push({ line, payload });
  });
  return lines;
}

test('otel: initOtel is idempotent and preserves the first service name', () => {
  reset();
  const lines = withCapturedSink();
  otel.initOtel({ serviceName: 'service-a' });
  otel.initOtel({ serviceName: 'service-b' });
  const span = otel.startSpan('otel.idempotent', { tenant_id: 't1' });
  span.end();
  assert.equal(lines.length, 1);
  assert.equal(lines[0].payload.service, 'service-a');
  otel.clearTestSink();
});

test('otel: startSpan returns end() and setAttribute()', () => {
  reset();
  const span = otel.startSpan('otel.surface');
  assert.equal(typeof span.end, 'function');
  assert.equal(typeof span.setAttribute, 'function');
});

test('otel: startSpan emits JSON with attrs and duration_ms', () => {
  reset();
  const lines = withCapturedSink();
  const span = otel.startSpan('otel.emit', { tenant_id: 'tenant-a', tool_name: 'draft_message' });
  span.setAttribute('status_code', 200);
  span.end();
  assert.equal(lines.length, 1);
  assert.equal(lines[0].payload.name, 'otel.emit');
  assert.equal(lines[0].payload.attrs.tenant_id, 'tenant-a');
  assert.equal(lines[0].payload.attrs.tool_name, 'draft_message');
  assert.equal(lines[0].payload.attrs.status_code, 200);
  assert.equal(typeof lines[0].payload.duration_ms, 'number');
  otel.clearTestSink();
});

test('otel: undefined attrs are dropped from span payloads', () => {
  reset();
  const lines = withCapturedSink();
  const span = otel.startSpan('otel.drop', {
    tenant_id: 'tenant-a',
    webhook_subscription_id: undefined,
  });
  span.setAttribute('mcp_session_id', undefined);
  span.end();
  assert.equal('webhook_subscription_id' in lines[0].payload.attrs, false);
  assert.equal('mcp_session_id' in lines[0].payload.attrs, false);
  otel.clearTestSink();
});

test('otel: end() is idempotent and only emits once', () => {
  reset();
  const lines = withCapturedSink();
  const span = otel.startSpan('otel.once');
  span.end();
  span.end({ status_code: 200 });
  assert.equal(lines.length, 1);
  otel.clearTestSink();
});

test('otel: withSpan resolves the wrapped result and auto-ends with status ok', async () => {
  reset();
  const lines = withCapturedSink();
  const result = await otel.withSpan('otel.resolve', { tenant_id: 'tenant-a' }, async (span) => {
    span.setAttribute('status_code', 201);
    return 42;
  });
  assert.equal(result, 42);
  assert.equal(lines.length, 1);
  assert.equal(lines[0].payload.attrs.status, 'ok');
  assert.equal(lines[0].payload.attrs.status_code, 201);
  otel.clearTestSink();
});

test('otel: withSpan rethrows wrapped errors and tags the span as error', async () => {
  reset();
  const lines = withCapturedSink();
  await assert.rejects(
    () => otel.withSpan('otel.reject', { tool_name: 'schedule_post' }, async () => {
      const err = new Error('boom');
      err.code = 'exploded';
      throw err;
    }),
    /boom/,
  );
  assert.equal(lines.length, 1);
  assert.equal(lines[0].payload.attrs.error, true);
  assert.equal(lines[0].payload.attrs.error_code, 'exploded');
  assert.equal(lines[0].payload.attrs.status, 'error');
  otel.clearTestSink();
});

test('otel: recordEvent emits an event payload without duration_ms', () => {
  reset();
  const lines = withCapturedSink();
  otel.recordEvent('mcp.tool.invoked', {
    tenant_id: 'tenant-a',
    tool_name: 'audit_claim',
    cost_cents: 3,
  });
  assert.equal(lines.length, 1);
  assert.equal(lines[0].payload.event, 'mcp.tool.invoked');
  assert.equal(lines[0].payload.attrs.cost_cents, 3);
  assert.equal('duration_ms' in lines[0].payload, false);
  otel.clearTestSink();
});

test('otel: startSpan swallows test sink failures', () => {
  reset();
  otel.setTestSink(() => {
    throw new Error('sink failure');
  });
  assert.doesNotThrow(() => {
    const span = otel.startSpan('otel.sink.failure');
    span.end();
  });
  otel.clearTestSink();
});

test('otel: recordEvent swallows console.log failures', () => {
  reset();
  otel.clearTestSink();
  const original = console.log;
  console.log = () => {
    throw new Error('console failure');
  };
  try {
    assert.doesNotThrow(() => {
      otel.recordEvent('otel.console.failure', { tenant_id: 'tenant-a' });
    });
  } finally {
    console.log = original;
  }
});

test('otel: startSpan uses console fallback when no test sink is present', () => {
  reset();
  otel.clearTestSink();
  const seen = [];
  const original = console.log;
  console.log = (line) => {
    seen.push(JSON.parse(line));
  };
  try {
    const span = otel.startSpan('otel.console', { tenant_id: 'tenant-a' });
    span.end({ status_code: 204 });
  } finally {
    console.log = original;
  }
  assert.equal(seen.length, 1);
  assert.equal(seen[0].name, 'otel.console');
  assert.equal(seen[0].attrs.status_code, 204);
});

test('otel: line payloads are JSON-safe and preserve service + ts', () => {
  reset();
  const lines = withCapturedSink();
  const span = otel.startSpan('otel.json.safe', { tenant_id: 'tenant-a' });
  span.end();
  const parsed = JSON.parse(lines[0].line);
  assert.equal(parsed.name, 'otel.json.safe');
  assert.equal(parsed.service, 'markos');
  assert.ok(parsed.ts);
  otel.clearTestSink();
});
