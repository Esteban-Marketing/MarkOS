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
  res.end = (b) => {
    res.body = b;
  };
  return res;
}
function parse(res) {
  return JSON.parse(res.body || '{}');
}

test('listTools returns 10 tools with required fields', () => {
  const tools = listTools();
  assert.equal(tools.length, 10);
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

test('invokeTool: list_pain_points returns pains array', async () => {
  const result = await invokeTool('list_pain_points', {});
  const payload = JSON.parse(result.content[0].text);
  assert.ok(Array.isArray(payload.pains));
  assert.ok(payload.pains.length > 0);
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

test('GET /api/mcp/session returns SERVER_INFO + tools', async () => {
  const req = makeReq({ method: 'GET' });
  const res = makeRes();
  await handleSession(req, res);
  assert.equal(res.statusCode, 200);
  const payload = parse(res);
  assert.equal(payload.server.name, SERVER_INFO.name);
  assert.equal(payload.tools.length, 10);
});

test('POST /api/mcp/session tools/list returns 10 tools', async () => {
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
  assert.equal(payload.result.tools.length, 10);
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

test('POST /api/mcp/tools/list_pain_points dispatch returns 200', async () => {
  const req = makeReq({ method: 'POST', url: '/api/mcp/tools/list_pain_points', query: { toolName: 'list_pain_points' } });
  req.body = {};
  const res = makeRes();
  await handleToolInvocation(req, res);
  assert.equal(res.statusCode, 200);
  const payload = parse(res);
  assert.equal(payload.success, true);
  assert.equal(payload.tool, 'list_pain_points');
});

test('POST /api/mcp/tools/unknown returns 404', async () => {
  const req = makeReq({ method: 'POST', url: '/api/mcp/tools/ghost', query: { toolName: 'ghost' } });
  req.body = {};
  const res = makeRes();
  await handleToolInvocation(req, res);
  assert.equal(res.statusCode, 404);
});
