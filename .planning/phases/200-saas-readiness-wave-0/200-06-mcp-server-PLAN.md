---
phase: 200-saas-readiness-wave-0
plan: 06
type: execute
wave: 2
depends_on: [200-01]
files_modified:
  - api/mcp/session.js
  - api/mcp/tools/[toolName].js
  - lib/markos/mcp/server.ts
  - lib/markos/mcp/tools/draft-message.ts
  - lib/markos/mcp/tools/plan-campaign.ts
  - lib/markos/mcp/tools/research-audience.ts
  - lib/markos/mcp/tools/run-neuro-audit.ts
  - lib/markos/mcp/tools/generate-brief.ts
  - lib/markos/mcp/tools/audit-claim.ts
  - lib/markos/mcp/tools/list-pain-points.ts
  - lib/markos/mcp/tools/rank-execution-queue.ts
  - lib/markos/mcp/tools/schedule-post.ts
  - lib/markos/mcp/tools/explain-literacy.ts
  - .claude-plugin/marketplace.json
  - contracts/F-71-mcp-session-v1.yaml
  - test/mcp/server.test.js
autonomous: true
must_haves:
  truths:
    - "api/mcp/session.js runs on Fluid Compute and streams SSE per MCP spec"
    - "api/mcp/tools/[toolName].js dispatches to lib/markos/mcp/tools/ adapters"
    - "lib/markos/mcp/server.ts exposes the 10 tools with JSON-schema input from contracts/openapi.json"
    - "Each of the 10 tool adapters invokes existing MarkOS primitives (copilot, neuro-audit, queue ranking, literacy resolvers)"
    - ".claude-plugin/marketplace.json conforms to Claude Marketplace submission schema"
    - "F-71-mcp-session-v1.yaml contract merged into OpenAPI"
  artifacts:
    - path: "lib/markos/mcp/server.ts"
      provides: "MCP server adapter registering 10 tools"
      exports: ["createMcpServer"]
    - path: ".claude-plugin/marketplace.json"
      provides: "Claude Marketplace listing manifest"
---

<objective>
Stand up an MCP server exposing 10 MarkOS skills so Claude Desktop and other MCP clients
can drive MarkOS natively, and file the Claude Marketplace listing.

Reuses OpenAPI schemas from 200-01 so tool input contracts stay in lockstep with the REST
surface and the SDK (200-07).
</objective>

<context>
@.planning/phases/200-saas-readiness-wave-0/200-OVERVIEW.md
@lib/markos/crm/copilot.ts
@lib/markos/crm/execution.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: MCP server + session endpoint</name>
  <files>api/mcp/session.js, lib/markos/mcp/server.ts</files>
  <action>
Use @modelcontextprotocol/sdk. session.js is a Fluid Compute function that accepts an MCP
handshake, creates a server via createMcpServer(), streams SSE. server.ts registers tools
with JSON schemas sourced from contracts/openapi.json.
  </action>
  <verify>local Claude Desktop connects and lists 10 tools</verify>
</task>

<task type="auto">
  <name>Task 2: 10 tool adapters</name>
  <files>lib/markos/mcp/tools/*.ts</files>
  <action>
One adapter per tool. Each imports an existing MarkOS primitive and returns the contract
shape. Tools: draft_message, plan_campaign, research_audience, run_neuro_audit,
generate_brief, audit_claim, list_pain_points, rank_execution_queue, schedule_post,
explain_literacy.
  </action>
  <verify>test/mcp/server.test.js invokes each tool with a valid fixture and asserts output shape</verify>
</task>

<task type="auto">
  <name>Task 3: Tool dispatch route</name>
  <files>api/mcp/tools/[toolName].js</files>
  <action>
Dynamic route that looks up the tool in server.ts registry and invokes it with validated input.
  </action>
  <verify>POST /api/mcp/tools/draft_message returns a draft for valid input, 400 for invalid</verify>
</task>

<task type="auto">
  <name>Task 4: Marketplace listing + contract</name>
  <files>.claude-plugin/marketplace.json, contracts/F-71-mcp-session-v1.yaml</files>
  <action>
Author marketplace.json with name, description, icon, MCP URL, categories, 10 tools listed.
Author F-71 contract describing MCP session endpoint + tool list.
  </action>
  <verify>marketplace.json passes Claude Marketplace JSON schema; F-71 merges into OpenAPI</verify>
</task>

</tasks>

<success_criteria>
- [ ] Claude Desktop connects + lists 10 tools
- [ ] Each tool returns correct shape
- [ ] Marketplace submission queued
- [ ] F-71 in OpenAPI
</success_criteria>
