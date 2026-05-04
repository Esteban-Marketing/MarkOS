'use strict';

// Phase 202 Plan 05 — MCP HTTP JSON-RPC 2.0 envelope.
//
// Additions over Phase 200:
//   - req_id (mcp-req-<uuid>) generated at handler entry; echoed in every response _meta
//   - Bearer extraction from Authorization header with WWW-Authenticate on 401 (MCP 2025-06-18 spec
//     + Claude Marketplace cert requirement — Pitfall 1 / Pitfall 8)
//   - tools/call routed through runToolCallThroughPipeline (Plan 202-04 middleware: auth →
//     rate_limit → tool_lookup → validate_input → free_tier → approval → cost → invoke →
//     validate_output → trueup)
//   - Phase 200.1 Plan 07 adds tenant-minted `mks_...` bearer keys with a SQL rate-limit and
//     billing kill-switch, while preserving the older opaque MCP session-token flow.
//   - GET metadata + initialize + tools/list remain unauthenticated for marketplace introspection
//     (spec-compliant; any mutation paths require Bearer)
//   - capabilities.resources advertised at initialize time (Plan 202-08 populates)

const { randomUUID } = require('node:crypto');
const { writeJson } = require('../../lib/markos/crm/api.cjs');
const { initOtel, withSpan } = require('../../lib/markos/observability/otel.cjs');
const {
  SERVER_INFO,
  listTools,
  listResources,
  listResourceTemplates,
  readResource,
  subscribeResource,
  unsubscribeResource,
  runToolCallThroughPipeline,
} = require('../../lib/markos/mcp/server.cjs');
const { lookupSession } = require('../../lib/markos/mcp/sessions.cjs');
const {
  checkRateLimit: checkSessionRateLimit,
  buildRateLimitedJsonRpcError,
} = require('../../lib/markos/mcp/rate-limit.cjs');
const { verifyBearer } = require('../../lib/markos/mcp/auth-bearer.cjs');
const { isMcpApiKeyToken } = require('../../lib/markos/mcp/api-keys.cjs');
const { checkRateLimit: checkBearerRateLimit } = require('../../lib/markos/mcp/rate-limit-bearer.cjs');
const { checkKillSwitch, buildKillSwitchJsonRpcError } = require('../../lib/markos/mcp/kill-switch.cjs');

initOtel({ serviceName: 'markos' });

const OAUTH_ISSUER_URL = process.env.OAUTH_ISSUER_URL || 'https://markos.dev';
const OAUTH_RESOURCE_METADATA_URL = `${OAUTH_ISSUER_URL}/.well-known/oauth-protected-resource`;

function writeJsonWithSpan(span, res, statusCode, payload) {
  span?.setAttribute('status_code', statusCode);
  return writeJson(res, statusCode, payload);
}

function wwwAuthenticateHeader() {
  return `Bearer resource_metadata="${OAUTH_RESOURCE_METADATA_URL}"`;
}

function extractBearer(req) {
  const a = (req.headers && req.headers.authorization) || '';
  const m = a.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

function getSupabase(deps) {
  if (deps && deps.supabase) return deps.supabase;
  try {
    const { createClient } = require('@supabase/supabase-js');
    return createClient(
      process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co',
      process.env.SUPABASE_SERVICE_ROLE_KEY || 'anon-key',
      { auth: { persistSession: false } },
    );
  } catch {
    return null;
  }
}

function getRedis(deps) {
  if (deps && deps.redis) return deps.redis;
  try {
    const { Redis } = require('@upstash/redis');
    return Redis.fromEnv();
  } catch {
    return null;
  }
}

async function readJson(req) {
  const chunks = [];
  req.on('data', (c) => chunks.push(c));
  await new Promise((resolve) => req.on('end', resolve));
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
  } catch {
    return {};
  }
}

function safeListResources() {
  // GET metadata is unauthenticated → no session is available, so we advertise the resource
  // TEMPLATES (not tenant-bound concrete URIs). listResources(session) without a session returns
  // an empty array by design (Plan 202-08); templates are safe to expose for marketplace discovery.
  try {
    const concrete = listResources();
    if (Array.isArray(concrete) && concrete.length > 0) return concrete;
  } catch {}
  try {
    if (typeof listResourceTemplates === 'function') return listResourceTemplates();
  } catch {}
  return [];
}

async function authenticateProtectedMethod(req, deps = {}) {
  const bearer = extractBearer(req);
  if (!bearer) {
    return {
      ok: false,
      status: 401,
      code: 'invalid_token',
      headers: { 'WWW-Authenticate': wwwAuthenticateHeader() },
      detail: { resource_metadata: OAUTH_RESOURCE_METADATA_URL },
    };
  }

  const supabase = getSupabase(deps);
  const redis = getRedis(deps);
  if (!supabase) {
    return {
      ok: false,
      status: 500,
      code: 'backend_unavailable',
      detail: { error: 'supabase_client_unavailable' },
    };
  }

  if (isMcpApiKeyToken(bearer)) {
    const auth = await verifyBearer(req, supabase);
    if (!auth.ok) {
      return {
        ok: false,
        status: 401,
        code: 'invalid_token',
        headers: { 'WWW-Authenticate': wwwAuthenticateHeader() },
        detail: { reason: auth.reason, resource_metadata: OAUTH_RESOURCE_METADATA_URL },
      };
    }

    const rateLimit = await checkBearerRateLimit(supabase, auth.tenant_id);
    if (!rateLimit.ok) {
      return {
        ok: false,
        status: 429,
        code: 'rate_limited',
        headers: { 'Retry-After': String(rateLimit.retry_after_seconds || 60) },
        detail: {
          scope: 'tenant',
          retry_after: rateLimit.retry_after_seconds || 60,
          limit: rateLimit.limit,
          count: rateLimit.count,
        },
      };
    }

    const kill = await checkKillSwitch(supabase, auth.tenant_id, {
      actor_id: auth.user_id || auth.tenant_id,
      actor_role: auth.actor_role || 'mcp-api-key',
      org_id: auth.org_id || null,
    });
    if (kill.tripped) {
      return {
        ok: false,
        status: 402,
        code: 'kill_switch_triggered',
        detail: kill,
      };
    }

    return { ok: true, bearer, auth_context: auth, supabase, redis };
  }

  let session = null;
  try {
    session = await lookupSession(supabase, bearer);
  } catch {
    session = null;
  }
  if (!session) {
    return {
      ok: false,
      status: 401,
      code: 'invalid_token',
      headers: { 'WWW-Authenticate': wwwAuthenticateHeader() },
      detail: { resource_metadata: OAUTH_RESOURCE_METADATA_URL },
    };
  }

  session = { ...session, auth_type: 'session_token', actor_role: 'mcp-session' };

  const rateLimit = await checkSessionRateLimit(redis, session);
  if (!rateLimit.ok) {
    return {
      ok: false,
      status: 429,
      code: 'rate_limited',
      headers: { 'Retry-After': String(rateLimit.retry_after || 60) },
      detail: {
        scope: rateLimit.scope,
        retry_after: rateLimit.retry_after,
        limit: rateLimit.limit,
      },
    };
  }

  const kill = await checkKillSwitch(supabase, session.tenant_id, {
    actor_id: session.user_id || session.tenant_id,
    actor_role: session.actor_role,
    org_id: session.org_id || null,
  });
  if (kill.tripped) {
    return {
      ok: false,
      status: 402,
      code: 'kill_switch_triggered',
      detail: kill,
    };
  }

  return { ok: true, bearer, auth_context: session, supabase, redis };
}

async function handleSession(req, res, deps = {}, span) {
  const req_id = `mcp-req-${randomUUID()}`;
  span?.setAttribute('req_id', req_id);

  // GET remains unauthenticated — marketplace discovery shows metadata + tool list only.
  if (req.method === 'GET') {
    return writeJsonWithSpan(span, res, 200, {
      success: true,
      server: SERVER_INFO,
      capabilities: {
        tools: { listChanged: false },
        resources: { subscribe: true, listChanged: false },
      },
      tools: listTools(),
      resources: safeListResources(),
      transport_hint:
        'POST JSON-RPC 2.0 payloads to this endpoint. OAuth bearer required for tools/call and resources/*.',
      _meta: { req_id },
    });
  }
  if (req.method !== 'POST') {
    return writeJsonWithSpan(span, res, 405, { success: false, error: 'METHOD_NOT_ALLOWED', _meta: { req_id } });
  }

  let envelope;
  try {
    envelope = await readJson(req);
  } catch (error) {
    return writeJsonWithSpan(span, res, 400, { success: false, error: 'INVALID_JSON', message: error.message, _meta: { req_id } });
  }

  const { id = null, method, params = {} } = envelope;
  if (method === 'tools/call' && params && typeof params.name === 'string') {
    span?.setAttribute('tool_name', params.name);
  }

  try {
    // initialize is unauthenticated per MCP 2025-06-18 — capability negotiation only, no data access.
    if (method === 'initialize') {
      return writeJsonWithSpan(span, res, 200, {
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2025-06-18',
          serverInfo: SERVER_INFO,
          capabilities: {
            tools: { listChanged: false },
            resources: { subscribe: true, listChanged: false },
          },
          _meta: { req_id },
        },
      });
    }

    // tools/list remains available without Bearer so marketplace bots can introspect.
    if (method === 'tools/list') {
      return writeJsonWithSpan(span, res, 200, {
        jsonrpc: '2.0',
        id,
        result: { tools: listTools(), _meta: { req_id } },
      });
    }

    // Plan 202-08: notifications/initialized is a client-to-server lifecycle signal (no auth, no-op).
    // Per MCP 2025-06-18 spec, server never rejects this notification.
    if (method === 'notifications/initialized') {
      return writeJsonWithSpan(span, res, 200, { jsonrpc: '2.0', id, result: {} });
    }

    // All other methods require Bearer per MCP spec + Pitfall 1 (Authorization on EVERY request).
    const bearer = extractBearer(req);
    if (!bearer) {
      res.setHeader('WWW-Authenticate', wwwAuthenticateHeader());
      return writeJsonWithSpan(span, res, 401, {
        jsonrpc: '2.0',
        id,
        error: {
          code: -32600,
          message: 'invalid_token',
          data: { req_id, resource_metadata: OAUTH_RESOURCE_METADATA_URL },
        },
      });
    }

    if (method === 'tools/call') {
      const auth = await authenticateProtectedMethod(req, deps);
      if (!auth.ok) {
        if (auth.headers) {
          for (const [k, v] of Object.entries(auth.headers)) res.setHeader(k, v);
        }
        if (auth.code === 'rate_limited') {
          return writeJsonWithSpan(span, res, 429, buildRateLimitedJsonRpcError(id, req_id, auth.detail));
        }
        if (auth.code === 'kill_switch_triggered') {
          return writeJsonWithSpan(span, res, 402, buildKillSwitchJsonRpcError(id, req_id, auth.detail));
        }
        return writeJsonWithSpan(span, res, 401, {
          jsonrpc: '2.0',
          id,
          error: {
            code: -32600,
            message: 'invalid_token',
            data: { req_id, resource_metadata: OAUTH_RESOURCE_METADATA_URL },
          },
        });
      }
      span?.setAttribute('tenant_id', auth.auth_context.tenant_id);
      if (auth.auth_context.id) span?.setAttribute('mcp_session_id', auth.auth_context.id);
      req.markosTenantId = auth.auth_context.tenant_id;
      req.markosMcpAuth = auth.auth_context;
      const outcome = await runToolCallThroughPipeline({
        supabase: auth.supabase,
        redis: auth.redis,
        auth_context: auth.auth_context,
        skip_rate_limit: true,
        skip_kill_switch: true,
        tool_name: params.name,
        args: params.arguments || {},
        id,
        _meta: params._meta || {},
      });
      if (outcome.headers) {
        for (const [k, v] of Object.entries(outcome.headers)) res.setHeader(k, v);
      }
      if (outcome.httpStatus === 401) res.setHeader('WWW-Authenticate', wwwAuthenticateHeader());
      if (Number.isFinite(outcome.cost_cents)) span?.setAttribute('cost_cents', outcome.cost_cents);
      return writeJsonWithSpan(span, res, outcome.httpStatus, outcome.jsonRpcResponse);
    }

    // Plan 202-08 — resources/* methods (all require authenticated session).
    // Single session lookup serves list / templates/list / read / subscribe / unsubscribe.
    const resourceMethods = new Set([
      'resources/list',
      'resources/templates/list',
      'resources/read',
      'resources/subscribe',
      'resources/unsubscribe',
    ]);
    if (resourceMethods.has(method)) {
      const auth = await authenticateProtectedMethod(req, deps);
      if (!auth.ok) {
        if (auth.headers) {
          for (const [k, v] of Object.entries(auth.headers)) res.setHeader(k, v);
        }
        if (auth.code === 'rate_limited') {
          return writeJsonWithSpan(span, res, 429, buildRateLimitedJsonRpcError(id, req_id, auth.detail));
        }
        if (auth.code === 'kill_switch_triggered') {
          return writeJsonWithSpan(span, res, 402, buildKillSwitchJsonRpcError(id, req_id, auth.detail));
        }
        return writeJsonWithSpan(span, res, 401, {
          jsonrpc: '2.0',
          id,
          error: {
            code: -32600,
            message: 'invalid_token',
            data: { req_id, resource_metadata: OAUTH_RESOURCE_METADATA_URL },
          },
        });
      }
      const session = auth.auth_context;
      span?.setAttribute('tenant_id', session.tenant_id);
      if (session.id) span?.setAttribute('mcp_session_id', session.id);

      if (method === 'resources/list') {
        return writeJsonWithSpan(span, res, 200, {
          jsonrpc: '2.0',
          id,
          result: { resources: listResources(session), _meta: { req_id } },
        });
      }
      if (method === 'resources/templates/list') {
        return writeJsonWithSpan(span, res, 200, {
          jsonrpc: '2.0',
          id,
          result: { resourceTemplates: listResourceTemplates(), _meta: { req_id } },
        });
      }
      if (method === 'resources/read') {
        const uri = params.uri;
        if (!uri) {
          return writeJsonWithSpan(span, res, 400, {
            jsonrpc: '2.0',
            id,
            error: { code: -32602, message: 'missing uri param', data: { req_id } },
          });
        }
        const out = await readResource(uri, session, auth.supabase);
        if (out.error === 'resource_not_found') {
          return writeJsonWithSpan(span, res, 404, {
            jsonrpc: '2.0',
            id,
            error: { code: -32002, message: 'resource_not_found', data: { uri, req_id } },
          });
        }
        if (out.error === 'cross_tenant_blocked') {
          return writeJsonWithSpan(span, res, 403, {
            jsonrpc: '2.0',
            id,
            error: { code: -32600, message: 'cross_tenant_blocked', data: { uri, req_id } },
          });
        }
        return writeJsonWithSpan(span, res, 200, {
          jsonrpc: '2.0',
          id,
          result: { ...out, _meta: { req_id } },
        });
      }
      if (method === 'resources/subscribe') {
        const uri = params.uri;
        if (!uri) {
          return writeJsonWithSpan(span, res, 400, {
            jsonrpc: '2.0',
            id,
            error: { code: -32602, message: 'missing uri', data: { req_id } },
          });
        }
        await subscribeResource(auth.redis, session, uri);
        return writeJsonWithSpan(span, res, 200, {
          jsonrpc: '2.0',
          id,
          result: { subscribed: true, uri, _meta: { req_id } },
        });
      }
      if (method === 'resources/unsubscribe') {
        const uri = params.uri;
        if (!uri) {
          return writeJsonWithSpan(span, res, 400, {
            jsonrpc: '2.0',
            id,
            error: { code: -32602, message: 'missing uri', data: { req_id } },
          });
        }
        await unsubscribeResource(auth.redis, session, uri);
        return writeJsonWithSpan(span, res, 200, {
          jsonrpc: '2.0',
          id,
          result: { unsubscribed: true, uri, _meta: { req_id } },
        });
      }
    }

    // Unknown method — return -32601 with req_id threaded into error.data.
    return writeJsonWithSpan(span, res, 200, {
      jsonrpc: '2.0',
      id,
      error: { code: -32601, message: `method not found: ${method}`, data: { req_id } },
    });
  } catch (error) {
    return writeJsonWithSpan(span, res, 200, {
      jsonrpc: '2.0',
      id,
      error: { code: -32000, message: error.message || 'internal_error', data: { req_id } },
    });
  }
}

module.exports = async function handler(req, res, deps = {}) {
  return withSpan('mcp.session', { method: req.method }, async (span) => handleSession(req, res, deps, span));
};
module.exports.handleSession = handleSession;
module.exports._authenticateProtectedMethod = authenticateProtectedMethod;
module.exports._extractBearer = extractBearer;
module.exports._getSupabase = getSupabase;
module.exports._getRedis = getRedis;
