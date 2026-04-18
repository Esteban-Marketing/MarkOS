'use strict';

// Phase 203 Plan 09 Task 2 — consolidation UI a11y suite.
//
// Asserts the sidebar nav carries a "Webhooks" link alongside MCP, both page
// files exist, and Design-Token Alignment Table rules hold across the 2 modules.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const REPO = path.join(__dirname, '..', '..');

function readIfExists(p) {
  try { return fs.readFileSync(p, 'utf8'); } catch { return ''; }
}

const S1_TSX = path.join(REPO, 'app', '(markos)', 'settings', 'webhooks', 'page.tsx');
const S1_CSS = path.join(REPO, 'app', '(markos)', 'settings', 'webhooks', 'page.module.css');
const S2_TSX = path.join(REPO, 'app', '(markos)', 'settings', 'webhooks', '[sub_id]', 'page.tsx');
const S2_CSS = path.join(REPO, 'app', '(markos)', 'settings', 'webhooks', '[sub_id]', 'page.module.css');
const LAYOUT = path.join(REPO, 'app', '(markos)', 'layout-shell.tsx');

test('Suite 203-09 consolidation: 2 page.tsx + 2 page.module.css files exist', () => {
  assert.ok(fs.existsSync(S1_TSX), 'S1 page.tsx exists');
  assert.ok(fs.existsSync(S1_CSS), 'S1 page.module.css exists');
  assert.ok(fs.existsSync(S2_TSX), 'S2 page.tsx exists');
  assert.ok(fs.existsSync(S2_CSS), 'S2 page.module.css exists');
});

test('Suite 203-09 consolidation: sidebar carries Webhooks link adjacent to MCP', () => {
  const layout = readIfExists(LAYOUT);
  // The layout nav must expose both settings/mcp + settings/webhooks hrefs alongside
  // a "Webhooks" label so tenant-admins have one-click access.
  assert.match(layout, /\/settings\/webhooks/);
  assert.match(layout, /Webhooks/);
  // Also verify MCP entry is present so the ordering rule in UI-SPEC holds.
  assert.match(layout, /\/settings\/mcp/);
});

test('Suite 203-09 consolidation: every module has 12px button + 28px card + focus ring + 44px tap target', () => {
  for (const mod of [readIfExists(S1_CSS), readIfExists(S2_CSS)]) {
    assert.ok(mod.includes('border-radius: 28px'), 'top-level card radius 28px');
    assert.ok(mod.includes('border-radius: 12px'), 'button radius 12px');
    assert.ok(/outline:\s*2px solid #0d9488/.test(mod), 'accent focus ring');
    assert.ok(/min-height:\s*44px/.test(mod), '44px tap target');
  }
});

test('Suite 203-09 consolidation: every module declares #0d9488 + #0f766e (accent + dark-teal)', () => {
  for (const mod of [readIfExists(S1_CSS), readIfExists(S2_CSS)]) {
    assert.ok(mod.includes('#0d9488'));
    assert.ok(mod.includes('#0f766e'));
  }
});

test('Suite 203-09 consolidation: S2 module declares 3 203-new conventions (1040 max-w + 16px nested + dark code block)', () => {
  const s2 = readIfExists(S2_CSS);
  assert.match(s2, /max-width:\s*1040px/);
  assert.match(s2, /border-radius:\s*16px/);
  // Dark mono code block — both tokens present in .codeBlock context.
  assert.match(s2, /\.codeBlock[\s\S]*?#0f172a/);
  assert.match(s2, /\.codeBlock[\s\S]*?#e2e8f0/);
});

test('Suite 203-09 consolidation: S1 declares 1040px max-width (203-new convention #1)', () => {
  const s1 = readIfExists(S1_CSS);
  assert.match(s1, /max-width:\s*1040px/);
});

test('Suite 203-09 consolidation: prefers-reduced-motion honored on both modules', () => {
  for (const mod of [readIfExists(S1_CSS), readIfExists(S2_CSS)]) {
    assert.match(mod, /@media \(prefers-reduced-motion: reduce\)/);
  }
});

test('Suite 203-09 consolidation: pages share dialog + toast families (co-location rule)', () => {
  const s1 = readIfExists(S1_CSS);
  const s2 = readIfExists(S2_CSS);
  assert.match(s1, /\.dialog/);
  assert.match(s2, /\.dialog/);
  assert.match(s1, /\.toast/);
  assert.match(s2, /\.toast/);
});
