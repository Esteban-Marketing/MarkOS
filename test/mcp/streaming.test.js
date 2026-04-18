'use strict';

// Phase 202 Plan 08 — Task 2: SSE framing + pipeline progress accumulation (D-26).
// Suites: openSseStream headers + writeSseFrame framing + sendProgressNotification envelope
// + pipeline _progressEvents for LLM tools (progressToken) + non-LLM tools ignore progressToken.

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  openSseStream,
  writeSseFrame,
  closeSseStream,
  sendProgressNotification,
  sendResourceUpdated,
} = require('../../lib/markos/mcp/sse.cjs');

function mockRes() {
  return {
    statusCode: 200,
    headers: {},
    body: '',
    setHeader(k, v) { this.headers[k] = v; },
    flushHeaders() { this._flushed = true; },
    write(s) { this.body += s; return true; },
    end() { this._ended = true; },
  };
}

test('Suite 202-08: openSseStream sets correct headers + flushes', () => {
  const res = mockRes();
  openSseStream(res);
  assert.equal(res.headers['Content-Type'], 'text/event-stream');
  assert.equal(res.headers['Cache-Control'], 'no-cache, no-transform');
  assert.equal(res.headers['Connection'], 'keep-alive');
  assert.equal(res.headers['X-Accel-Buffering'], 'no');
  assert.equal(res._flushed, true);
});

test('Suite 202-08: writeSseFrame emits data: <json>\\n\\n framing', () => {
  const res = mockRes();
  openSseStream(res);
  writeSseFrame(res, { hello: 'world' });
  assert.match(res.body, /^data: \{"hello":"world"\}\n\n$/);
});

test('Suite 202-08: writeSseFrame throws when stream not opened first', () => {
  const res = mockRes();
  assert.throws(() => writeSseFrame(res, { x: 1 }), /stream not open/);
});

test('Suite 202-08: sendProgressNotification wraps in JSON-RPC notifications/progress envelope', () => {
  const res = mockRes();
  openSseStream(res);
  sendProgressNotification(res, { progressToken: 'tok', progress: 0.3, total: 1.0, message: 'step 3 of 10' });
  const frame = res.body.replace(/^data: /, '').trim();
  const parsed = JSON.parse(frame);
  assert.equal(parsed.jsonrpc, '2.0');
  assert.equal(parsed.method, 'notifications/progress');
  assert.equal(parsed.params.progressToken, 'tok');
  assert.equal(parsed.params.progress, 0.3);
  assert.equal(parsed.params.total, 1.0);
  assert.equal(parsed.params.message, 'step 3 of 10');
});

test('Suite 202-08: sendResourceUpdated wraps URI in notifications/resources/updated envelope', () => {
  const res = mockRes();
  openSseStream(res);
  sendResourceUpdated(res, 'mcp://markos/canon/t1');
  const frame = res.body.replace(/^data: /, '').trim();
  const parsed = JSON.parse(frame);
  assert.equal(parsed.jsonrpc, '2.0');
  assert.equal(parsed.method, 'notifications/resources/updated');
  assert.equal(parsed.params.uri, 'mcp://markos/canon/t1');
});

test('Suite 202-08: closeSseStream writes [DONE] + ends response', () => {
  const res = mockRes();
  openSseStream(res);
  closeSseStream(res);
  assert.match(res.body, /data: \[DONE\]\n\n$/);
  assert.equal(res._ended, true);
});

test('Suite 202-08: closeSseStream is idempotent (no error on double-close)', () => {
  const res = mockRes();
  openSseStream(res);
  closeSseStream(res);
  assert.doesNotThrow(() => closeSseStream(res));
});

test('Suite 202-08: pipeline accumulates _progressEvents when LLM tool + progressToken present', async () => {
  const { runToolCall } = require('../../lib/markos/mcp/pipeline.cjs');
  const { compileToolSchemas } = require('../../lib/markos/mcp/ajv.cjs');
  const { hashToken } = require('../../lib/markos/mcp/sessions.cjs');

  compileToolSchemas({
    query_canon: {
      input: { type: 'object', required: ['x'], properties: { x: { type: 'string' } }, additionalProperties: false },
      output: {
        type: 'object',
        required: ['content', '_usage'],
        additionalProperties: true,
        properties: {
          content: { type: 'array' },
          _usage: {
            type: 'object',
            required: ['input_tokens', 'output_tokens'],
            properties: { input_tokens: { type: 'integer' }, output_tokens: { type: 'integer' } },
          },
        },
      },
    },
  });

  const token_hash = hashToken('a'.repeat(64));
  const sessionRow = {
    id: 's1',
    token_hash,
    user_id: 'u',
    tenant_id: 't',
    org_id: 'o',
    client_id: 'c',
    scopes: [],
    plan_tier: 'team',
    last_used_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 3600_000).toISOString(),
    revoked_at: null,
  };
  const supabase = {
    from(name) {
      if (name === 'markos_mcp_sessions') {
        return {
          select: () => ({ eq: () => ({ is: () => ({ maybeSingle: async () => ({ data: sessionRow }) }) }) }),
          update: () => ({ eq: () => ({ is: () => Promise.resolve({ error: null }) }) }),
        };
      }
      if (name === 'markos_audit_staging' || name === 'markos_audit_log') {
        return { insert: async () => ({ error: null }) };
      }
      return {
        select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }),
        insert: async () => ({ error: null }),
      };
    },
    rpc: async () => ({ data: [{ ok: true, spent_cents: 0, cap_cents: 100, reset_at: new Date().toISOString() }], error: null }),
  };

  const redis = {
    perSession: { async limit() { return { success: true }; } },
    perTenant: { async limit() { return { success: true }; } },
  };

  const r = await runToolCall({
    supabase,
    redis,
    bearer_token: 'a'.repeat(64),
    tool_name: 'query_canon',
    args: { x: 'hi' },
    id: 1,
    _meta: { progressToken: 'tok' },
    toolRegistry: {
      query_canon: {
        name: 'query_canon',
        latency_tier: 'llm',
        mutating: false,
        cost_model: { base_cents: 0, model: 'claude-haiku-4-5-20260301' },
        handler: async ({ emitProgress }) => {
          if (emitProgress) {
            emitProgress({ progress: 0.25, total: 1.0, message: 'drafting' });
            emitProgress({ progress: 0.75, total: 1.0, message: 'polishing' });
          }
          return { content: [{ type: 'text', text: 'ok' }], _usage: { input_tokens: 10, output_tokens: 20 } };
        },
      },
    },
  });

  assert.equal(r.ok, true, 'pipeline should succeed');
  assert.ok(Array.isArray(r.result._progressEvents), '_progressEvents should be an array');
  assert.equal(r.result._progressEvents.length, 2);
  assert.equal(r.result._progressEvents[0].progressToken, 'tok');
  assert.equal(r.result._progressEvents[0].progress, 0.25);
  assert.equal(r.result._progressEvents[0].message, 'drafting');
  assert.equal(r.result._progressEvents[1].progress, 0.75);
});

test('Suite 202-08: pipeline does NOT attach _progressEvents when simple-tier tool has progressToken', async () => {
  const { runToolCall } = require('../../lib/markos/mcp/pipeline.cjs');
  const { compileToolSchemas } = require('../../lib/markos/mcp/ajv.cjs');
  const { hashToken } = require('../../lib/markos/mcp/sessions.cjs');

  compileToolSchemas({
    list_pain_points: {
      input: { type: 'object', properties: {}, additionalProperties: false },
      output: { type: 'object', required: ['content'], additionalProperties: true, properties: { content: { type: 'array' } } },
    },
  });

  const token_hash = hashToken('a'.repeat(64));
  const sessionRow = {
    id: 's1',
    token_hash,
    user_id: 'u',
    tenant_id: 't',
    org_id: 'o',
    client_id: 'c',
    scopes: [],
    plan_tier: 'team',
    last_used_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 3600_000).toISOString(),
    revoked_at: null,
  };
  const supabase = {
    from(name) {
      if (name === 'markos_mcp_sessions') {
        return {
          select: () => ({ eq: () => ({ is: () => ({ maybeSingle: async () => ({ data: sessionRow }) }) }) }),
          update: () => ({ eq: () => ({ is: () => Promise.resolve({ error: null }) }) }),
        };
      }
      return {
        select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }),
        insert: async () => ({ error: null }),
      };
    },
    rpc: async () => ({ data: [{ ok: true, spent_cents: 0, cap_cents: 100, reset_at: new Date().toISOString() }], error: null }),
  };
  const redis = {
    perSession: { async limit() { return { success: true }; } },
    perTenant: { async limit() { return { success: true }; } },
  };

  let emitProgressWasTruthy = null;
  const r = await runToolCall({
    supabase,
    redis,
    bearer_token: 'a'.repeat(64),
    tool_name: 'list_pain_points',
    args: {},
    id: 2,
    _meta: { progressToken: 'tok' },
    toolRegistry: {
      list_pain_points: {
        name: 'list_pain_points',
        latency_tier: 'simple',
        mutating: false,
        cost_model: { base_cents: 0 },
        handler: async ({ emitProgress }) => {
          emitProgressWasTruthy = emitProgress !== null && emitProgress !== undefined;
          return { content: [{ type: 'text', text: 'x' }] };
        },
      },
    },
  });

  assert.equal(r.ok, true);
  // Handler receives emitProgress === null (or undefined) for non-LLM tiers even with progressToken.
  assert.equal(emitProgressWasTruthy, false, 'emitProgress must not be provided for non-LLM tier');
  assert.equal(r.result._progressEvents, undefined, '_progressEvents must be omitted for non-LLM tier');
});
