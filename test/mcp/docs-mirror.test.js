'use strict';

// Suite 202-10: Docs freshness + llms.txt mirror.
// Asserts Phase 202 documentation matches the code (30 tools) + LLM discoverability
// (public/llms.txt) + preserves Phase 201 content.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..', '..');
const READ = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

test('Suite 202-10: all 5 Phase-202 docs files exist', () => {
  const expected = [
    'docs/mcp-tools.md',
    'docs/vscode-mcp-setup.md',
    'docs/oauth.md',
    'docs/mcp-redteam-checklist.md',
    'docs/llms/phase-202-mcp.md',
  ];
  for (const p of expected) {
    assert.ok(fs.existsSync(path.join(ROOT, p)), `missing: ${p}`);
  }
});

test('Suite 202-10: docs/mcp-tools.md lists all 30 tool_ids from TOOL_DEFINITIONS', () => {
  const { TOOL_DEFINITIONS } = require('../../lib/markos/mcp/tools/index.cjs');
  const md = READ('docs/mcp-tools.md');
  for (const d of TOOL_DEFINITIONS) {
    assert.match(md, new RegExp(`## ${d.name}\\b`), `missing section for ${d.name}`);
  }
});

test('Suite 202-10: public/llms.txt has Phase 202 section (QA-15)', () => {
  const t = READ('public/llms.txt');
  assert.match(t, /## Phase 202 — MCP Server GA/);
  assert.match(t, /mcp-tools/);
  assert.match(t, /vscode-mcp-setup/);
});

test('Suite 202-10: docs/vscode-mcp-setup.md references .vscode/mcp.json + OAuth flow', () => {
  const md = READ('docs/vscode-mcp-setup.md');
  assert.match(md, /\.vscode\/mcp\.json/);
  assert.match(md, /oauth-protected-resource|OAuth/i);
});

test('Suite 202-10: docs/oauth.md provides curl examples for every OAuth endpoint', () => {
  const md = READ('docs/oauth.md');
  assert.match(md, /\/oauth\/register/);
  assert.match(md, /\/oauth\/authorize/);
  assert.match(md, /\/oauth\/token/);
  assert.match(md, /\/oauth\/revoke/);
  assert.match(md, /code_challenge/);
});

test('Suite 202-10: docs/mcp-redteam-checklist.md covers injection + cross-tenant + budget + approval sections', () => {
  const md = READ('docs/mcp-redteam-checklist.md');
  assert.match(md, /Prompt Injection/i);
  assert.match(md, /Cross-Tenant/i);
  assert.match(md, /Cost Budget/i);
  assert.match(md, /Approval-Token/i);
});

test('Suite 202-10: docs/mcp-redteam-checklist.md covers D-31 Vercel Rolling Releases (M1)', () => {
  const md = READ('docs/mcp-redteam-checklist.md');
  assert.match(md, /Rolling Releases|D-31/);
});

test('Suite 202-10: docs/mcp-redteam-checklist.md covers D-19 observability alert (M2)', () => {
  const md = READ('docs/mcp-redteam-checklist.md');
  assert.match(md, /p95 > 300ms|D-19|observability/i);
});

test('Suite 202-10: Phase 201 llms.txt section preserved (regression)', () => {
  const t = READ('public/llms.txt');
  assert.match(t, /Phase 201/);
});

test('Suite 202-10: docs/llms/phase-202-mcp.md references 30 tools + key doc links', () => {
  const md = READ('docs/llms/phase-202-mcp.md');
  assert.match(md, /Phase 202/);
  assert.match(md, /30/);
  assert.match(md, /mcp-tools/);
});
