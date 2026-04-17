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

const SERVER_INFO = Object.freeze({
  name: 'markos',
  version: '1.0.0',
});

module.exports = {
  SERVER_INFO,
  TOOL_DEFINITIONS,
  listTools,
  invokeTool,
};
