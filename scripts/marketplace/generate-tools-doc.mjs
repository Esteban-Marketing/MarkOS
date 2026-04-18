#!/usr/bin/env node
// Phase 202 Plan 10 Task 2: Generate docs/mcp-tools.md from TOOL_DEFINITIONS.
// One-shot codegen during this plan (not a commit-time codegen).

import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { TOOL_DEFINITIONS } = require('../../lib/markos/mcp/tools/index.cjs');

const header = `# MarkOS MCP — Tool Reference

Phase 202 — 30 tools live (marketing-weighted).

Every tool is accessed via MCP 2025-06-18 JSON-RPC at \`POST /api/mcp\` with an OAuth 2.1 bearer.
See [VS Code setup](/docs/vscode-mcp-setup) for the first-connection flow + [OAuth flow](/docs/oauth)
for the full PKCE curl walkthrough.

`;

const sections = TOOL_DEFINITIONS.map((d) => {
  const required = (d.inputSchema && d.inputSchema.required) || [];
  const additionalProps = d.inputSchema && d.inputSchema.additionalProperties === false
    ? 'false (strict)'
    : 'true';
  const mutating = d.mutating
    ? 'yes — requires approval_token round-trip (D-03)'
    : 'no';
  return [
    `## ${d.name}`,
    '',
    d.description,
    '',
    `- **Latency tier:** \`${d.latency_tier}\``,
    `- **Mutating:** \`${mutating}\``,
    `- **Cost model:** \`${d.cost_model && d.cost_model.model ? d.cost_model.model : 'simple (no LLM)'}\``,
    `- **Required input fields:** \`${required.join(', ') || '(none)'}\``,
    `- **Input schema additionalProperties:** \`${additionalProps}\``,
    '',
  ].join('\n');
}).join('\n');

const footer = `
## See also

- [OAuth 2.1 + PKCE flow](/docs/oauth)
- [VS Code setup](/docs/vscode-mcp-setup)
- [Red-team checklist](/docs/mcp-redteam-checklist)
- [F-89 OAuth contract](/contracts/F-89-mcp-oauth-v1.yaml)
- [F-90..F-95 Tool + Resources + Cost contracts](/contracts)
`;

writeFileSync('docs/mcp-tools.md', header + sections + footer);
console.log(`[generate-tools-doc] wrote docs/mcp-tools.md (${TOOL_DEFINITIONS.length} tools)`);
