---
phase: 200-saas-readiness-wave-0
plan: "06"
subsystem: mcp-server
tags: [mcp, claude-marketplace, json-rpc, tool-registry]
dependency_graph:
  requires: [200-01, 200-02]
  provides:
    - lib/markos/mcp/server.cjs
    - lib/markos/mcp/tools/index.cjs
    - api/mcp/session.js
    - api/mcp/tools/[toolName].js
    - .claude-plugin/marketplace.json
    - contracts/F-71-mcp-session-v1.yaml
  affects: [200-08]
tech_stack:
  added: ["@modelcontextprotocol/sdk"]
  patterns: [json-rpc-2-0, tool-registry, dispatch-route]
key_files:
  created:
    - lib/markos/mcp/server.cjs
    - lib/markos/mcp/tools/index.cjs
    - api/mcp/session.js
    - api/mcp/tools/[toolName].js
    - .claude-plugin/marketplace.json
    - contracts/F-71-mcp-session-v1.yaml
    - test/mcp/server.test.js
  modified:
    - contracts/openapi.json
    - contracts/openapi.yaml
    - package.json
    - package-lock.json
decisions:
  - "Skip SDK's McpServer/registerTool path: it requires Zod schemas and the project's contract source of truth is JSON Schema. Instead, api/mcp/session.js implements the JSON-RPC 2.0 envelope directly against invokeTool + listTools. Result: contracts stay in YAML, no Zod fork."
  - "Tools shipped as 2 live wires (draft_message, run_neuro_audit) + 8 typed stubs. Stubs return schema-compliant shapes so Claude Marketplace submission works today; 200-06.1 backend wiring is non-breaking since handlers are pluggable."
  - "Marketplace listing points at https://markos.dev/api/mcp/session — this URL must resolve once deployed; manifest version 1.0.0 tracks package.json."
metrics:
  tasks_completed: 4
  tasks_total: 4
  files_created: 7
  files_modified: 4
  tests_passing: 11
---

# Phase 200 Plan 06: MCP Server + Claude Marketplace Summary

Shipped an MCP server exposing 10 MarkOS tools via a JSON-RPC 2.0 HTTP transport,
plus a dispatch endpoint `/api/mcp/tools/[toolName]` and a Claude Marketplace
listing manifest. OpenAPI now merges F-71 alongside F-72/F-73 (42 flows total).

## Tasks

| # | Task | Status |
|---|------|--------|
| 1 | MCP server + session endpoint | ✓ |
| 2 | 10 tool adapters (2 live, 8 stubs) | ✓ |
| 3 | Tool dispatch route | ✓ |
| 4 | Marketplace listing + F-71 contract | ✓ |

## 10 Tools

| Tool | Status | Notes |
|------|--------|-------|
| draft_message | live | wraps bin/lib/generate-runner#runDraft |
| run_neuro_audit | live | wraps bin/lib/generate-runner#auditDraft |
| plan_campaign | stub | wire in 200-06.1 |
| research_audience | stub | wire in 200-06.1 |
| generate_brief | stub | wire in 200-06.1 |
| audit_claim | stub | wire in 200-06.1 |
| list_pain_points | stub | returns canonical pain taxonomy |
| rank_execution_queue | stub | 200-06.1 → lib/markos/crm/execution |
| schedule_post | stub | 200-06.1 → channel queue |
| explain_literacy | stub | 200-06.1 → literacy registry reader |

## Verification

- `node --test test/mcp/server.test.js` → 11/11 pass (registry, handlers, JSON-RPC envelope, dispatch route)
- `node --test test/openapi/openapi-build.test.js` → 13/13 still pass; 42 F-NN flows, 45 paths
- Marketplace manifest validates as JSON

## Commits

- `chore(200): add wave-2 deps — mcp-sdk, openapi-fetch, openapi-typescript` (earlier)
- `feat(200-06): add MCP server + 10 tools + F-71 contract + marketplace listing (11 tests pass)`

## Follow-up (200-06.1)

- Swap SDK transport (stdio/SSE) once downstream clients beyond Claude Desktop need it
- Wire the 8 stub tools to real backends (copilot grounding, literacy reader, campaign planner, etc.)
- Submit marketplace.json to Claude Marketplace review once markos.dev deployment is live

## Self-Check: PASSED (11/11 tests, 10 tools registered, 1 atomic commit)
