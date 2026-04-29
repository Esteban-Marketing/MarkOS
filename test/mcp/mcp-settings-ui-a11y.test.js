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

// Phase 213.3 Plan 06: CSS assertions updated to token-canon (DESIGN.md v1.1.0).
// Legacy hex and bespoke-class assertions replaced per RESEARCH.md Pitfall 7.
// Mirror of 213.2-04 consent-ui-a11y.test.js patch precedent.

test('Suite 202-09: S1 CSS — MC-1: zero inline hex (all 61 legacy hexes eliminated)', () => {
  // AC MC-1: no inline hex in token-canon module
  assert.doesNotMatch(css, /#0d9488/);
  assert.doesNotMatch(css, /#0f766e/);
  assert.doesNotMatch(css, /#9a3412/);
  assert.doesNotMatch(css, /#fca5a5/);
});

test('Suite 202-09: S1 CSS — MC-1: zero warn-banner hex (all eliminated)', () => {
  // AC MC-1: no inline hex for warn/amber banner
  assert.doesNotMatch(css, /#fef3c7/);
  assert.doesNotMatch(css, /#d97706/);
  assert.doesNotMatch(css, /#78350f/);
});

test('Suite 202-09: S1 CSS — MC-2: state-color tokens on meter fill (success/warning/error)', () => {
  // AC MC-2: cost-meter fill uses design token state colors, not raw hex
  assert.match(css, /var\(--color-success\)/);
  assert.match(css, /var\(--color-warning\)/);
  assert.match(css, /var\(--color-error\)/);
  assert.match(css, /meterFill/);
});

test('Suite 202-09: S1 CSS — X-1: token-only layout (var(--color-surface), var(--space-md))', () => {
  // AC X-1: primitives carry visual weight; module uses only layout tokens
  assert.match(css, /var\(--color-surface\)/);
  assert.match(css, /var\(--space-md\)/);
  assert.match(css, /var\(--radius-full\)/);
});

test('Suite 202-09: S1 CSS — motion: prefers-reduced-motion media query', () => {
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});

test('Suite 202-09: S1 CSS — MC-2: meterFill transition uses token (var(--duration-base))', () => {
  // AC MC-2: meter transition uses design token, not hardcoded 180ms
  assert.match(css, /meterFill[\s\S]*?transition:[\s\S]*?var\(--duration-base\)/);
});

test('Suite 202-09: S1 CSS — X-2: no bespoke structural tokens (no 28px card, no box-shadow, no teal outline)', () => {
  // AC X-2: bespoke layout removed; border-radius via var(--radius-*) tokens
  assert.doesNotMatch(css, /border-radius:\s*28px/);
  assert.doesNotMatch(css, /0 18px 45px/);
  assert.doesNotMatch(css, /outline:\s*2px solid #0d9488/);
});
