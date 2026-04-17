'use strict';

const { writeJson } = require('../../lib/markos/crm/api.cjs');
const { SERVER_INFO, listTools } = require('../../lib/markos/mcp/server.cjs');

async function handleSession(req, res) {
  if (req.method === 'GET') {
    return writeJson(res, 200, {
      success: true,
      server: SERVER_INFO,
      capabilities: { tools: { listChanged: false } },
      tools: listTools(),
      transport_hint: 'POST JSON-RPC 2.0 payloads to this endpoint; streaming transport lands in 200-06.1.',
    });
  }
  if (req.method !== 'POST') {
    return writeJson(res, 405, { success: false, error: 'METHOD_NOT_ALLOWED' });
  }

  // JSON-RPC 2.0 envelope minimal support: initialize + tools/list + tools/call
  const chunks = [];
  req.on('data', (c) => chunks.push(c));
  await new Promise((resolve) => req.on('end', resolve));
  let envelope;
  try {
    envelope = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
  } catch (error) {
    return writeJson(res, 400, { success: false, error: 'INVALID_JSON', message: error.message });
  }

  const { id = null, method, params = {} } = envelope;
  try {
    if (method === 'initialize') {
      return writeJson(res, 200, {
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2025-06-18',
          serverInfo: SERVER_INFO,
          capabilities: { tools: { listChanged: false } },
        },
      });
    }
    if (method === 'tools/list') {
      return writeJson(res, 200, { jsonrpc: '2.0', id, result: { tools: listTools() } });
    }
    if (method === 'tools/call') {
      const { invokeTool } = require('../../lib/markos/mcp/server.cjs');
      const result = await invokeTool(params.name, params.arguments || {});
      return writeJson(res, 200, { jsonrpc: '2.0', id, result });
    }
    return writeJson(res, 200, {
      jsonrpc: '2.0',
      id,
      error: { code: -32601, message: `method not found: ${method}` },
    });
  } catch (error) {
    return writeJson(res, 200, {
      jsonrpc: '2.0',
      id,
      error: { code: -32000, message: error.message },
    });
  }
}

module.exports = async function handler(req, res) {
  return handleSession(req, res);
};
module.exports.handleSession = handleSession;
