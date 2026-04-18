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
//   - GET metadata + initialize + tools/list remain unauthenticated for marketplace introspection
//     (spec-compliant; any mutation paths require Bearer)
//   - capabilities.resources advertised at initialize time (Plan 202-08 populates)

const { randomUUID } = require('node:crypto');
const { writeJson } = require('../../lib/markos/crm/api.cjs');
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

const OAUTH_ISSUER_URL = process.env.OAUTH_ISSUER_URL || 'https://markos.dev';
const OAUTH_RESOURCE_METADATA_URL = `${OAUTH_ISSUER_URL}/.well-known/oauth-protected-resource`;

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
    const mod = require('../../lib/markos/auth/session.ts');
    return mod.getSupabase ? mod.getSupabase() : null;
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

async function handleSession(req, res, deps = {}) {
  const req_id = `mcp-req-${randomUUID()}`;

  // GET remains unauthenticated — marketplace discovery shows metadata + tool list only.
  if (req.method === 'GET') {
    return writeJson(res, 200, {
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
    return writeJson(res, 405, { success: false, error: 'METHOD_NOT_ALLOWED', _meta: { req_id } });
  }

  let envelope;
  try {
    envelope = await readJson(req);
  } catch (error) {
    return writeJson(res, 400, { success: false, error: 'INVALID_JSON', message: error.message, _meta: { req_id } });
  }

  const { id = null, method, params = {} } = envelope;

  try {
    // initialize is unauthenticated per MCP 2025-06-18 — capability negotiation only, no data access.
    if (method === 'initialize') {
      return writeJson(res, 200, {
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
      return writeJson(res, 200, {
        jsonrpc: '2.0',
        id,
        result: { tools: listTools(), _meta: { req_id } },
      });
    }

    // Plan 202-08: notifications/initialized is a client-to-server lifecycle signal (no auth, no-op).
    // Per MCP 2025-06-18 spec, server never rejects this notification.
    if (method === 'notifications/initialized') {
      return writeJson(res, 200, { jsonrpc: '2.0', id, result: {} });
    }

    // All other methods require Bearer per MCP spec + Pitfall 1 (Authorization on EVERY request).
    const bearer = extractBearer(req);
    if (!bearer) {
      res.setHeader('WWW-Authenticate', wwwAuthenticateHeader());
      return writeJson(res, 401, {
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
      const supabase = getSupabase(deps);
      const redis = getRedis(deps);
      const outcome = await runToolCallThroughPipeline({
        supabase,
        redis,
        bearer_token: bearer,
        tool_name: params.name,
        args: params.arguments || {},
        id,
        _meta: params._meta || {},
      });
      if (outcome.headers) {
        for (const [k, v] of Object.entries(outcome.headers)) res.setHeader(k, v);
      }
      if (outcome.httpStatus === 401) res.setHeader('WWW-Authenticate', wwwAuthenticateHeader());
      return writeJson(res, outcome.httpStatus, outcome.jsonRpcResponse);
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
      const supabase = getSupabase(deps);
      const redis = getRedis(deps);
      let session = null;
      try {
        session = await lookupSession(supabase, bearer);
      } catch {
        session = null;
      }
      if (!session) {
        res.setHeader('WWW-Authenticate', wwwAuthenticateHeader());
        return writeJson(res, 401, {
          jsonrpc: '2.0',
          id,
          error: {
            code: -32600,
            message: 'invalid_token',
            data: { req_id, resource_metadata: OAUTH_RESOURCE_METADATA_URL },
          },
        });
      }

      if (method === 'resources/list') {
        return writeJson(res, 200, {
          jsonrpc: '2.0',
          id,
          result: { resources: listResources(session), _meta: { req_id } },
        });
      }
      if (method === 'resources/templates/list') {
        return writeJson(res, 200, {
          jsonrpc: '2.0',
          id,
          result: { resourceTemplates: listResourceTemplates(), _meta: { req_id } },
        });
      }
      if (method === 'resources/read') {
        const uri = params.uri;
        if (!uri) {
          return writeJson(res, 400, {
            jsonrpc: '2.0',
            id,
            error: { code: -32602, message: 'missing uri param', data: { req_id } },
          });
        }
        const out = await readResource(uri, session, supabase);
        if (out.error === 'resource_not_found') {
          return writeJson(res, 404, {
            jsonrpc: '2.0',
            id,
            error: { code: -32002, message: 'resource_not_found', data: { uri, req_id } },
          });
        }
        if (out.error === 'cross_tenant_blocked') {
          return writeJson(res, 403, {
            jsonrpc: '2.0',
            id,
            error: { code: -32600, message: 'cross_tenant_blocked', data: { uri, req_id } },
          });
        }
        return writeJson(res, 200, {
          jsonrpc: '2.0',
          id,
          result: { ...out, _meta: { req_id } },
        });
      }
      if (method === 'resources/subscribe') {
        const uri = params.uri;
        if (!uri) {
          return writeJson(res, 400, {
            jsonrpc: '2.0',
            id,
            error: { code: -32602, message: 'missing uri', data: { req_id } },
          });
        }
        await subscribeResource(redis, session, uri);
        return writeJson(res, 200, {
          jsonrpc: '2.0',
          id,
          result: { subscribed: true, uri, _meta: { req_id } },
        });
      }
      if (method === 'resources/unsubscribe') {
        const uri = params.uri;
        if (!uri) {
          return writeJson(res, 400, {
            jsonrpc: '2.0',
            id,
            error: { code: -32602, message: 'missing uri', data: { req_id } },
          });
        }
        await unsubscribeResource(redis, session, uri);
        return writeJson(res, 200, {
          jsonrpc: '2.0',
          id,
          result: { unsubscribed: true, uri, _meta: { req_id } },
        });
      }
    }

    // Unknown method — return -32601 with req_id threaded into error.data.
    return writeJson(res, 200, {
      jsonrpc: '2.0',
      id,
      error: { code: -32601, message: `method not found: ${method}`, data: { req_id } },
    });
  } catch (error) {
    return writeJson(res, 200, {
      jsonrpc: '2.0',
      id,
      error: { code: -32000, message: error.message || 'internal_error', data: { req_id } },
    });
  }
}

module.exports = async function handler(req, res) {
  return handleSession(req, res);
};
module.exports.handleSession = handleSession;
