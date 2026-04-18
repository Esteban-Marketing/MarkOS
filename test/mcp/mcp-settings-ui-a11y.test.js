'use strict';

// Phase 202 Plan 09 Task 2: Surface S1 `/settings/mcp` grep-shape + a11y suite.
// Asserts every UI-SPEC §"Testing Hooks" Surface 1 target lives in the compiled sources.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const TSX = path.join(__dirname, '..', '..', 'app', '(markos)', 'settings', 'mcp', 'page.tsx');
const CSS = path.join(__dirname, '..', '..', 'app', '(markos)', 'settings', 'mcp', 'page.module.css');
const tsx = fs.readFileSync(TSX, 'utf8');
const css = fs.readFileSync(CSS, 'utf8');

test('Suite 202-09: S1 copy — MCP server + subheading + Daily budget + Resets in + Active MCP sessions', () => {
  assert.match(tsx, /MCP server/);
  assert.match(tsx, /Model Context Protocol access lets agents/);
  assert.match(tsx, /Daily budget/);
  assert.match(tsx, /Resets in/);
  assert.match(tsx, /Active MCP sessions/);
});

test('Suite 202-09: S1 copy — Revoke session + Revoke MCP session? + Per-tool cost breakdown', () => {
  assert.match(tsx, /Revoke session/);
  assert.match(tsx, /Revoke MCP session\?/);
  assert.match(tsx, /Per-tool cost breakdown/);
});

test('Suite 202-09: S1 copy — Daily MCP budget reached + Upgrade to increase your cap', () => {
  assert.match(tsx, /Daily MCP budget reached/);
  assert.match(tsx, /Upgrade to increase your cap/);
});

test('Suite 202-09: S1 copy — No MCP sessions yet + VS Code setup guide link', () => {
  assert.match(tsx, /No MCP sessions yet/);
  assert.match(tsx, /Read the VS Code setup guide/);
});

test('Suite 202-09: S1 copy — dialog body exact string', () => {
  assert.match(tsx, /The client will need to re-authorize on next use/);
});

test('Suite 202-09: S1 a11y — aria-labelledby on 3 sections + role=alert banner + role=status toast', () => {
  assert.match(tsx, /aria-labelledby="mcp-usage-heading"/);
  assert.match(tsx, /aria-labelledby="mcp-sessions-heading"/);
  assert.match(tsx, /aria-labelledby="mcp-breakdown-heading"/);
  assert.match(tsx, /role="alert"/);
  assert.match(tsx, /role="status"/);
  assert.match(tsx, /aria-live="polite"/);
});

test('Suite 202-09: S1 a11y — role=meter + table caption + scope=col + native dialog', () => {
  assert.match(tsx, /role="meter"/);
  assert.match(tsx, /<caption>/);
  assert.match(tsx, /scope="col"/);
  assert.match(tsx, /<dialog/);
});

test('Suite 202-09: S1 API integration — fetches /api/tenant/mcp/usage + sessions + cost-breakdown + revoke', () => {
  assert.match(tsx, /\/api\/tenant\/mcp\/usage/);
  assert.match(tsx, /\/api\/tenant\/mcp\/sessions/);
  assert.match(tsx, /\/api\/tenant\/mcp\/cost-breakdown/);
  assert.match(tsx, /\/api\/tenant\/mcp\/sessions\/revoke/);
});

test('Suite 202-09: S1 CSS — accent + dark-teal + destructive tokens present', () => {
  assert.match(css, /#0d9488/);
  assert.match(css, /#0f766e/);
  assert.match(css, /#9a3412/);
  assert.match(css, /#fca5a5/);
});

test('Suite 202-09: S1 CSS — warn banner tokens', () => {
  assert.match(css, /#fef3c7/);
  assert.match(css, /#d97706/);
  assert.match(css, /#78350f/);
});

test('Suite 202-09: S1 CSS — structural tokens (28px card, 12px button, focus ring, tap target)', () => {
  assert.match(css, /border-radius:\s*28px/);
  assert.match(css, /border-radius:\s*12px/);
  assert.match(css, /outline:\s*2px solid #0d9488/);
  assert.match(css, /min-height:\s*44px/);
});

test('Suite 202-09: S1 CSS — card shadow token (Phase 201 ancestor)', () => {
  assert.match(css, /0 18px 45px/);
});

test('Suite 202-09: S1 CSS — motion: prefers-reduced-motion media query', () => {
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});

test('Suite 202-09: S1 CSS — cost meter fill transition 180ms ease-out (matches Phase 201 seatBar)', () => {
  assert.match(css, /costMeterFill[\s\S]*?transition:[\s\S]*?180ms[\s\S]*?ease-out/);
});

test('Suite 202-09: S1 CSS — table caption eyebrow (uppercase, letter-spacing, #0f766e)', () => {
  assert.match(css, /text-transform:\s*uppercase/);
  assert.match(css, /letter-spacing:\s*0\.08em/);
});
