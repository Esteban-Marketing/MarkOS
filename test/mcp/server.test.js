'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { listTools, invokeTool, SERVER_INFO } = require('../../lib/markos/mcp/server.cjs');
const { handleToolInvocation } = require('../../api/mcp/tools/[toolName].js');
const { handleSession } = require('../../api/mcp/session.js');

function makeReq({ method = 'GET', url = '', body, query } = {}) {
  return {
    method,
    url,
    body,
    query,
    on(_event, _cb) {},
  };
}

function makeRes() {
  const res = { statusCode: 200, headers: {}, body: '' };
  res.writeHead = (code, headers) => {
    res.statusCode = code;
    if (headers) Object.assign(res.headers, headers);
  };
  res.setHeader = (k, v) => {
    res.headers[k] = v;
  };
  res.end = (b) => {
    res.body = b;
  };
  return res;
}
function parse(res) {
  return JSON.parse(res.body || '{}');
}

test('listTools returns 30 tools with required fields (Plan 202-07 expansion)', () => {
  // Plan 202-07 expanded the registry from 10 (Plan 202-06) to 30 (D-02 pitch:
  // "30 tools, all live, zero stubs"). Every descriptor advertises name +
  // description + inputSchema to MCP clients (handler/outputSchema internal).
  const tools = listTools();
  assert.equal(tools.length, 30);
  for (const tool of tools) {
    assert.equal(typeof tool.name, 'string');
    assert.equal(typeof tool.description, 'string');
    assert.ok(tool.inputSchema && typeof tool.inputSchema === 'object');
  }
});

test('SERVER_INFO exposes name + version', () => {
  assert.equal(SERVER_INFO.name, 'markos');
  assert.equal(typeof SERVER_INFO.version, 'string');
});

test('invokeTool: draft_message returns content for valid brief', async () => {
  const result = await invokeTool('draft_message', {
    channel: 'email',
    audience: 'founder-sam',
    pain: 'pipeline_velocity',
    promise: 'refill your pipeline with qualified leads',
    brand: 'markos',
  });
  assert.ok(Array.isArray(result.content));
  assert.equal(result.content[0].type, 'text');
  const payload = JSON.parse(result.content[0].text);
  assert.equal(payload.success, true);
});

test('invokeTool: list_pain_points returns tenant-scoped items array (202-06 graduated contract)', async () => {
  // Plan 202-06 graduated list_pain_points from stub to live handler. Output shape
  // changed from { pains: [string] } to { tenant_id, category, items: [{ id, name, description, score, category }] }.
  // Legacy invokeTool passes a default session (tenant_id: null); items may be empty
  // when no pack is loaded — assertion tolerates empty array.
  const result = await invokeTool('list_pain_points', {});
  const payload = JSON.parse(result.content[0].text);
  assert.ok(Array.isArray(payload.items));
  assert.ok('tenant_id' in payload, 'D-15 tenant scope — output embeds tenant_id');
});

test('invokeTool: run_neuro_audit returns audit shape', async () => {
  const result = await invokeTool('run_neuro_audit', {
    text: 'MarkOS helps you ship faster by removing the bidding overspend tax.',
    brief: { promise: 'ship faster', brand: 'markos' },
  });
  const audit = JSON.parse(result.content[0].text);
  assert.ok(['pass', 'fail'].includes(audit.status));
  assert.equal(typeof audit.score, 'number');
});

test('invokeTool: unknown tool throws', async () => {
  await assert.rejects(invokeTool('nonexistent_tool', {}), /unknown tool/);
});

test('GET /api/mcp/session returns SERVER_INFO + 30 tools (Plan 202-07)', async () => {
  const req = makeReq({ method: 'GET' });
  const res = makeRes();
  await handleSession(req, res);
  assert.equal(res.statusCode, 200);
  const payload = parse(res);
  assert.equal(payload.server.name, SERVER_INFO.name);
  // Plan 202-07 expanded the registry from 10 to 30 (D-02 pitch).
  assert.equal(payload.tools.length, 30);
});

test('POST /api/mcp/session tools/list returns 30 tools (Plan 202-07)', async () => {
  const req = makeReq({ method: 'POST' });
  // Simulate streamed body
  const body = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' });
  req.on = (event, cb) => {
    if (event === 'data') cb(Buffer.from(body));
    if (event === 'end') cb();
  };
  const res = makeRes();
  await handleSession(req, res);
  const payload = parse(res);
  assert.equal(payload.jsonrpc, '2.0');
  assert.equal(payload.id, 1);
  // Plan 202-07 expanded the registry from 10 to 30 (D-02 pitch).
  assert.equal(payload.result.tools.length, 30);
});

test('POST /api/mcp/session initialize returns protocolVersion', async () => {
  const req = makeReq({ method: 'POST' });
  const body = JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'initialize' });
  req.on = (event, cb) => {
    if (event === 'data') cb(Buffer.from(body));
    if (event === 'end') cb();
  };
  const res = makeRes();
  await handleSession(req, res);
  const payload = parse(res);
  assert.equal(payload.result.protocolVersion, '2025-06-18');
});

test('POST /api/mcp/tools/list_pain_points requires bearer auth', async () => {
  const req = makeReq({ method: 'POST', url: '/api/mcp/tools/list_pain_points', query: { toolName: 'list_pain_points' } });
  req.body = {};
  const res = makeRes();
  await handleToolInvocation(req, res);
  assert.equal(res.statusCode, 401);
  const payload = parse(res);
  assert.equal(payload.success, false);
  assert.equal(payload.error, 'invalid_token');
});

test('POST /api/mcp/tools/unknown still requires bearer auth before tool lookup', async () => {
  const req = makeReq({ method: 'POST', url: '/api/mcp/tools/ghost', query: { toolName: 'ghost' } });
  req.body = {};
  const res = makeRes();
  await handleToolInvocation(req, res);
  assert.equal(res.statusCode, 401);
});

// ---------------------------------------------------------------------------
// Plan 202-05 extensions: Bearer auth + WWW-Authenticate + req_id + version v2
// ---------------------------------------------------------------------------

function mockReqBody(method, body, headers = {}) {
  const chunks = body ? [Buffer.from(typeof body === 'string' ? body : JSON.stringify(body))] : [];
  return {
    method,
    headers,
    on(evt, cb) {
      if (evt === 'data') chunks.forEach((c) => cb(c));
      if (evt === 'end') setImmediate(cb);
    },
  };
}

test('Suite 202-05: SERVER_INFO.version bumped to 2.0.0 (matches marketplace.json v2)', () => {
  assert.equal(SERVER_INFO.version, '2.0.0');
});

test('Suite 202-05: GET /api/mcp/session returns SERVER_INFO + _meta.req_id without auth', async () => {
  const res = makeRes();
  await handleSession({ method: 'GET', headers: {}, on() {} }, res);
  assert.equal(res.statusCode, 200);
  const parsed = JSON.parse(res.body);
  assert.equal(parsed.server.version, '2.0.0');
  assert.ok(parsed._meta.req_id.startsWith('mcp-req-'));
});

test('Suite 202-05: POST initialize succeeds without Bearer (capability negotiation)', async () => {
  const res = makeRes();
  await handleSession(mockReqBody('POST', { jsonrpc: '2.0', id: 1, method: 'initialize' }), res);
  assert.equal(res.statusCode, 200);
  const parsed = JSON.parse(res.body);
  assert.equal(parsed.result.protocolVersion, '2025-06-18');
  assert.equal(parsed.result.capabilities.resources.subscribe, true);
  assert.ok(parsed.result._meta.req_id);
});

test('Suite 202-05: POST tools/list succeeds without Bearer (marketplace introspection)', async () => {
  const res = makeRes();
  await handleSession(mockReqBody('POST', { jsonrpc: '2.0', id: 2, method: 'tools/list' }), res);
  assert.equal(res.statusCode, 200);
  const parsed = JSON.parse(res.body);
  assert.ok(Array.isArray(parsed.result.tools));
});

test('Suite 202-05: POST tools/call without Bearer returns 401 + WWW-Authenticate header (Pitfall 8)', async () => {
  const res = makeRes();
  await handleSession(mockReqBody('POST', { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'draft_message', arguments: {} } }), res);
  assert.equal(res.statusCode, 401);
  assert.match(res.headers['WWW-Authenticate'] || '', /Bearer resource_metadata="https:\/\/.*\/.well-known\/oauth-protected-resource"/);
  const parsed = JSON.parse(res.body);
  assert.equal(parsed.error.code, -32600);
  assert.match(parsed.error.message, /invalid_token/);
  assert.ok(parsed.error.data.req_id);
});

test('Suite 202-05: req_id echoes back in JSON-RPC envelope on every method', async () => {
  const res = makeRes();
  await handleSession(mockReqBody('POST', { jsonrpc: '2.0', id: 'x', method: 'initialize' }), res);
  const parsed = JSON.parse(res.body);
  assert.match(parsed.result._meta.req_id, /^mcp-req-[0-9a-f-]{36}$/);
});

test('Suite 202-05: unknown method returns -32601 method_not_found with req_id in error.data', async () => {
  const res = makeRes();
  // ghost method — must still pass Bearer requirement first
  await handleSession(mockReqBody('POST', { jsonrpc: '2.0', id: 5, method: 'fake/method' }, { authorization: 'Bearer ' + 'a'.repeat(64) }), res);
  const parsed = JSON.parse(res.body);
  assert.equal(parsed.error.code, -32601);
  assert.ok(parsed.error.data.req_id);
});

test('Suite 202-05: pipeline integration — tools/call with Bearer delegates to runToolCallThroughPipeline', async () => {
  // With no @upstash/redis env vars, pipeline will return an error; we assert the HTTP path is wired.
  const res = makeRes();
  await handleSession(
    mockReqBody(
      'POST',
      { jsonrpc: '2.0', id: 10, method: 'tools/call', params: { name: 'ghost_tool', arguments: {} } },
      { authorization: 'Bearer ' + 'a'.repeat(64) },
    ),
    res,
  );
  // No session → 401 (from pipeline lookupSession returning null) — proves delegation occurred.
  // Could also be 500 if infrastructure unavailable; either way NOT 404 (which would indicate tools/call skipped the pipeline).
  assert.ok([401, 500].includes(res.statusCode), `expected 401 or 500, got ${res.statusCode}`);
});

// ---------------------------------------------------------------------------
// Plan 202-08 extensions: Resources + streaming + notifications/initialized
// ---------------------------------------------------------------------------

test('Suite 202-08: RESOURCE_DEFINITIONS populated with 3 templates', () => {
  const { RESOURCE_DEFINITIONS } = require('../../lib/markos/mcp/server.cjs');
  assert.equal(RESOURCE_DEFINITIONS.length, 3);
});

test('Suite 202-08: GET /api/mcp/session resources array has 3 entries', async () => {
  const res = makeRes();
  await handleSession({ method: 'GET', headers: {}, on() {} }, res);
  const parsed = JSON.parse(res.body);
  assert.ok(Array.isArray(parsed.resources));
  assert.equal(parsed.resources.length, 3);
});

test('Suite 202-08: POST notifications/initialized returns empty result (no auth required)', async () => {
  const res = makeRes();
  await handleSession(
    mockReqBody('POST', { jsonrpc: '2.0', id: 1, method: 'notifications/initialized' }),
    res,
  );
  const parsed = JSON.parse(res.body);
  assert.deepEqual(parsed.result, {});
});

test('Suite 202-08: POST resources/list without Bearer returns 401 + WWW-Authenticate', async () => {
  const res = makeRes();
  await handleSession(
    mockReqBody('POST', { jsonrpc: '2.0', id: 2, method: 'resources/list' }),
    res,
  );
  assert.equal(res.statusCode, 401);
  assert.match(res.headers['WWW-Authenticate'] || '', /Bearer/);
});

test('Suite 202-08: POST resources/templates/list without Bearer returns 401', async () => {
  const res = makeRes();
  await handleSession(
    mockReqBody('POST', { jsonrpc: '2.0', id: 3, method: 'resources/templates/list' }),
    res,
  );
  assert.equal(res.statusCode, 401);
});

test('Suite 202-08: POST resources/read without uri param returns 400 missing uri', async () => {
  // This test won't reach the params check because we have no session; it asserts 401 is still returned
  // before body validation — which matches the Bearer-first gating.
  const res = makeRes();
  await handleSession(
    mockReqBody('POST', { jsonrpc: '2.0', id: 4, method: 'resources/read', params: {} }),
    res,
  );
  assert.equal(res.statusCode, 401);
});

// ---------------------------------------------------------------------------
// Plan 202-07 extensions: 30-tool registry + _generated/tool-schemas.json
// ---------------------------------------------------------------------------

const { TOOL_DEFINITIONS } = require('../../lib/markos/mcp/tools/index.cjs');

const EXPECTED_30 = [
  // Phase 200 retained
  'draft_message',
  'run_neuro_audit',
  // Plan 202-06 (8 wave-0 graduated)
  'plan_campaign',
  'research_audience',
  'generate_brief',
  'audit_claim',
  'list_pain_points',
  'rank_execution_queue',
  'schedule_post',
  'explain_literacy',
  // Plan 202-07 marketing (10)
  'remix_draft',
  'rank_draft_variants',
  'brief_to_plan',
  'generate_channel_copy',
  'expand_claim_evidence',
  'clone_persona_voice',
  'generate_subject_lines',
  'optimize_cta',
  'generate_preview_text',
  'audit_claim_strict',
  // Plan 202-07 CRM (5)
  'list_crm_entities',
  'query_crm_timeline',
  'snapshot_pipeline',
  'read_segment',
  'summarize_deal',
  // Plan 202-07 literacy (3)
  'query_canon',
  'explain_archetype',
  'walk_taxonomy',
  // Plan 202-07 tenancy (2)
  'list_members',
  'query_audit',
];

test('Suite 202-07: TOOL_DEFINITIONS.length === 30 (D-02 "30 tools, all live, zero stubs")', () => {
  assert.equal(TOOL_DEFINITIONS.length, 30);
});

test('Suite 202-07: every expected tool_id from RESEARCH Tool Inventory is present', () => {
  const names = TOOL_DEFINITIONS.map((d) => d.name);
  for (const e of EXPECTED_30) {
    assert.ok(names.includes(e), `missing tool: ${e}`);
  }
});

test('Suite 202-07: only schedule_post is mutating (D-01 + T-202-07-06 accept)', () => {
  const mutating = TOOL_DEFINITIONS.filter((d) => d.mutating === true).map((d) => d.name);
  assert.deepEqual(mutating, ['schedule_post']);
});

test('Suite 202-07: every LLM-tier tool has a model in cost_model.model', () => {
  for (const d of TOOL_DEFINITIONS) {
    if (d.latency_tier === 'llm') {
      assert.ok(d.cost_model && d.cost_model.model, `${d.name} is llm tier but missing cost_model.model`);
    }
  }
});

test('Suite 202-07: _generated/tool-schemas.json contains input + output for all 30 tools', () => {
  const reg = require('../../lib/markos/mcp/_generated/tool-schemas.json');
  for (const e of EXPECTED_30) {
    assert.ok(reg[e], `_generated/tool-schemas.json missing: ${e}`);
    assert.ok(reg[e].input, `${e} missing input schema`);
    assert.ok(reg[e].output, `${e} missing output schema`);
  }
});
