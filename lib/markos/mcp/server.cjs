'use strict';

// MarkOS MCP adapter.
//
// We intentionally do NOT instantiate the SDK's McpServer class here: it expects
// Zod schemas as tool input contracts, and the rest of the project ships plain
// JSON Schema (contracts/F-71-mcp-session-v1.yaml + F-72 + F-73). Introducing
// Zod just for this transport would fork the contract source-of-truth.
//
// Instead, api/mcp/session.js implements the MCP HTTP + JSON-RPC 2.0 envelope
// directly against our `invokeTool` + `listTools` registry. Claude Marketplace
// submission works against this HTTP endpoint via the .claude-plugin/marketplace.json
// manifest. A stdio / streaming transport adapter backed by the SDK can be
// layered on top in 200-06.1 without breaking this registry shape.

const { TOOL_DEFINITIONS, invokeTool, listTools } = require('./tools/index.cjs');

// Phase 202 Plan 08 — Resources capability surface (D-25 / D-27).
// 3 tenant-scoped resources; subscribe/broadcast via subscriptions.cjs; SSE framing in sse.cjs.
const {
  RESOURCE_TEMPLATES,
  listResourceTemplates,
  listResources,
  readResource,
} = require('./resources/index.cjs');
const {
  addSubscription,
  removeSubscription,
  broadcastResourceUpdated,
} = require('./subscriptions.cjs');

// Plan 202-05 bump — matches marketplace.json v2.0.0 in Plan 202-10.
const SERVER_INFO = Object.freeze({
  name: 'markos',
  version: '2.0.0',
});

// Plan 202-05 placeholder was `const RESOURCE_DEFINITIONS = [];` — Plan 202-08 populates it.
const RESOURCE_DEFINITIONS = RESOURCE_TEMPLATES;

async function subscribeResource(redis, session, uri) {
  if (!session?.id) throw new Error('subscribeResource: session.id required');
  await addSubscription(redis, session.id, uri);
}

async function unsubscribeResource(redis, session, uri) {
  if (!session?.id) return;
  await removeSubscription(redis, session.id, uri);
}

// Plan 202-05 — pipeline adapter.
// buildToolRegistryFromDefinitions wraps the Phase 200 TOOL_DEFINITIONS array into the registry
// shape the pipeline expects. Plans 202-06 / 202-07 extend each entry with
// { latency_tier, mutating, cost_model }; until then we derive sensible defaults from the name.
function buildToolRegistryFromDefinitions() {
  const registry = Object.create(null);
  for (const def of TOOL_DEFINITIONS) {
    const isLlm =
      def.name.endsWith('_message') || def.name === 'plan_campaign' || def.name === 'run_neuro_audit';
    registry[def.name] = {
      name: def.name,
      latency_tier: def.latency_tier || (isLlm ? 'llm' : 'simple'),
      mutating: def.mutating === true,
      cost_model: def.cost_model || { base_cents: 0, model: null },
      handler: def.handler,
      preview: def.preview,
    };
  }
  return registry;
}

// runToolCallThroughPipeline is the SOLE dispatch path from api/mcp/session.js into the
// Plan 202-04 middleware pipeline (auth → rate_limit → tool_lookup → … → trueup).
// Returns { jsonRpcResponse, httpStatus, headers?, req_id } so the HTTP layer can
// set WWW-Authenticate / Retry-After / etc. based on the pipeline's outcome.
async function runToolCallThroughPipeline({ supabase, redis, bearer_token, tool_name, args, id, _meta }) {
  const { runToolCall } = require('./pipeline.cjs');
  const toolRegistry = buildToolRegistryFromDefinitions();
  const out = await runToolCall({
    supabase,
    redis,
    bearer_token,
    tool_name,
    args,
    id,
    _meta,
    toolRegistry,
  });
  if (!out.ok) {
    return {
      jsonRpcResponse: out.jsonRpcError,
      httpStatus: out.httpStatus,
      headers: out.headers,
      req_id: out.req_id,
    };
  }
  const metaExisting = (out.result && out.result._meta) || {};
  const envelope = {
    jsonrpc: '2.0',
    id: id === undefined ? null : id,
    result: {
      ...(out.result || {}),
      _meta: { ...metaExisting, req_id: out.req_id },
    },
  };
  return { jsonRpcResponse: envelope, httpStatus: 200, req_id: out.req_id };
}

module.exports = {
  SERVER_INFO,
  TOOL_DEFINITIONS,
  RESOURCE_DEFINITIONS,
  listTools,
  invokeTool,
  // Resources capability (Plan 202-08)
  listResources,
  listResourceTemplates,
  readResource,
  subscribeResource,
  unsubscribeResource,
  broadcastResourceUpdated,
  // Plan 202-05 pipeline dispatch
  runToolCallThroughPipeline,
  buildToolRegistryFromDefinitions,
};
