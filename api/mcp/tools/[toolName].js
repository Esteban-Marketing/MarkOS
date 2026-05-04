'use strict';

const { enqueueAuditStaging } = require('../../../lib/markos/audit/writer.cjs');
const { writeJson } = require('../../../lib/markos/crm/api.cjs');
const { recordCostEvent } = require('../../../lib/markos/mcp/cost-events.cjs');
const { initOtel, withSpan, recordEvent } = require('../../../lib/markos/observability/otel.cjs');
const { listTools } = require('../../../lib/markos/mcp/server.cjs');
const { _authenticateProtectedMethod: authenticateProtectedMethod } = require('../session.js');

initOtel({ serviceName: 'markos' });

function writeJsonWithSpan(span, res, statusCode, payload) {
  span?.setAttribute('status_code', statusCode);
  return writeJson(res, statusCode, payload);
}

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

async function handleToolInvocation(req, res, deps = {}, span) {
  if (req.method === 'GET' && (resolveToolName(req) === '' || resolveToolName(req) === null)) {
    return writeJsonWithSpan(span, res, 200, { success: true, tools: listTools() });
  }
  if (req.method !== 'POST') {
    return writeJsonWithSpan(span, res, 405, { success: false, error: 'METHOD_NOT_ALLOWED' });
  }

  const name = resolveToolName(req);
  if (!name) return writeJsonWithSpan(span, res, 400, { success: false, error: 'TOOL_NAME_REQUIRED' });
  span?.setAttribute('tool_name', name);

  let args;
  try {
    args = await readJsonBody(req);
  } catch {
    return writeJsonWithSpan(span, res, 400, { success: false, error: 'INVALID_JSON' });
  }

  const auth = await authenticateProtectedMethod(req, deps);
  if (!auth.ok) {
    if (auth.headers) {
      for (const [k, v] of Object.entries(auth.headers)) res.setHeader(k, v);
    }
    return writeJsonWithSpan(span, res, auth.status, {
      success: false,
      error: auth.code,
      detail: auth.detail || {},
    });
  }

  span?.setAttribute('tenant_id', auth.auth_context.tenant_id);
  req.markosTenantId = auth.auth_context.tenant_id;
  req.markosMcpAuth = auth.auth_context;

  const { runToolCall } = require('../../../lib/markos/mcp/pipeline.cjs');
  const { buildToolRegistryFromDefinitions } = require('../../../lib/markos/mcp/server.cjs');
  const outcome = await runToolCall({
    supabase: auth.supabase,
    redis: auth.redis,
    bearer_token: auth.bearer,
    auth_context: auth.auth_context,
    skip_rate_limit: true,
    skip_kill_switch: true,
    tool_name: name,
    args,
    id: null,
    _meta: {},
    toolRegistry: buildToolRegistryFromDefinitions(),
  });

  const mcp_session_id = auth.auth_context.auth_type === 'session_token' ? auth.auth_context.id : null;
  if (mcp_session_id) span?.setAttribute('mcp_session_id', mcp_session_id);
  if (outcome.invoked) {
    const occurred_at = new Date().toISOString();
    const cost_cents = Number.isFinite(outcome.cost_cents) ? outcome.cost_cents : 1;
    span?.setAttribute('cost_cents', cost_cents);
    try {
      await enqueueAuditStaging(auth.supabase, {
        tenant_id: auth.auth_context.tenant_id,
        org_id: auth.auth_context.org_id || null,
        source_domain: 'mcp',
        action: 'tool.invoked',
        actor_id: auth.auth_context.user_id || auth.auth_context.tenant_id,
        actor_role: auth.auth_context.actor_role || 'mcp-client',
        payload: {
          tenant_id: auth.auth_context.tenant_id,
          mcp_session_id,
          tool_name: name,
          occurred_at,
          req_id: outcome.req_id,
          key_id: auth.auth_context.key_id || null,
        },
      });
      await recordCostEvent(auth.supabase, {
        tenant_id: auth.auth_context.tenant_id,
        org_id: auth.auth_context.org_id || null,
        mcp_session_id,
        key_id: auth.auth_context.key_id || null,
        tool_name: name,
        llm_call_id: outcome.ok && outcome.result && typeof outcome.result === 'object' ? outcome.result.llm_call_id || null : null,
        cost_cents,
        occurred_at,
      });
      recordEvent('mcp.tool.invoked', {
        tenant_id: auth.auth_context.tenant_id,
        mcp_session_id,
        tool_name: name,
        cost_cents,
      });
    } catch (error) {
      return writeJsonWithSpan(span, res, 500, {
        success: false,
        error: 'audit_emit_failed',
        message: error.message || String(error),
        req_id: outcome.req_id,
      });
    }
  }

  if (outcome.ok) {
    return writeJsonWithSpan(span, res, 200, {
      success: true,
      tool: name,
      result: outcome.result,
      req_id: outcome.req_id,
    });
  }

  return writeJsonWithSpan(span, res, outcome.httpStatus || 500, {
    success: false,
    error: outcome.jsonRpcError && outcome.jsonRpcError.error ? outcome.jsonRpcError.error.message : 'internal_error',
    code: outcome.jsonRpcError && outcome.jsonRpcError.error ? outcome.jsonRpcError.error.code : -32000,
    detail: outcome.jsonRpcError && outcome.jsonRpcError.error ? outcome.jsonRpcError.error.data || {} : {},
    req_id: outcome.req_id,
  });
}

module.exports = async function handler(req, res, deps = {}) {
  return withSpan('mcp.tool', { method: req.method }, async (span) => handleToolInvocation(req, res, deps, span));
};
module.exports.handleToolInvocation = handleToolInvocation;
