'use strict';

const { writeJson } = require('../../../lib/markos/crm/api.cjs');
const { invokeTool, listTools } = require('../../../lib/markos/mcp/server.cjs');

async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      try {
        resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function resolveToolName(req) {
  if (req.query && typeof req.query.toolName === 'string') return req.query.toolName;
  const url = req.url || '';
  const match = url.match(/\/api\/mcp\/tools\/([^/?#]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

async function handleToolInvocation(req, res) {
  if (req.method === 'GET' && (resolveToolName(req) === '' || resolveToolName(req) === null)) {
    return writeJson(res, 200, { success: true, tools: listTools() });
  }
  if (req.method !== 'POST') {
    return writeJson(res, 405, { success: false, error: 'METHOD_NOT_ALLOWED' });
  }

  const name = resolveToolName(req);
  if (!name) return writeJson(res, 400, { success: false, error: 'TOOL_NAME_REQUIRED' });

  let args;
  try {
    args = await readJsonBody(req);
  } catch {
    return writeJson(res, 400, { success: false, error: 'INVALID_JSON' });
  }

  try {
    const result = await invokeTool(name, args);
    return writeJson(res, 200, { success: true, tool: name, result });
  } catch (error) {
    const status = /unknown tool/i.test(error.message) ? 404 : 500;
    return writeJson(res, status, { success: false, error: error.message });
  }
}

module.exports = async function handler(req, res) {
  return handleToolInvocation(req, res);
};
module.exports.handleToolInvocation = handleToolInvocation;
