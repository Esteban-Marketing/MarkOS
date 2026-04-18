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

const SERVER_INFO = Object.freeze({
  name: 'markos',
  version: '1.0.0',
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
};
