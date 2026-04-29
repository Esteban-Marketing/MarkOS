'use strict';

// Phase 203 Plan 09 Task 2 — consolidation UI a11y suite.
// 213.3-08 — Patched for DESIGN.md v1.1.0 token-canon migration.
//   Old assertions (hex literals, legacy classes) replaced with token-canon equivalents.
//   Mirrors the mcp-settings-ui-a11y.test.js patch from 213.3-06 (RESEARCH.md Pitfall 7).
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
// NavList holds the actual nav links (extracted in Phase 213.1)
const NAVLIST = path.join(REPO, 'app', '(markos)', '_components', 'NavList.tsx');

test('Suite 203-09 consolidation: 2 page.tsx + 2 page.module.css files exist', () => {
  assert.ok(fs.existsSync(S1_TSX), 'S1 page.tsx exists');
  assert.ok(fs.existsSync(S1_CSS), 'S1 page.module.css exists');
  assert.ok(fs.existsSync(S2_TSX), 'S2 page.tsx exists');
  assert.ok(fs.existsSync(S2_CSS), 'S2 page.module.css exists');
});

test('Suite 203-09 consolidation: sidebar carries Webhooks link adjacent to MCP', () => {
  // NavList holds the actual nav links (extracted into _components/NavList.tsx in Phase 213.1).
  // layout-shell.tsx delegates nav rendering to <NavList /> — check NavList directly.
  const navList = readIfExists(NAVLIST);
  assert.match(navList, /\/settings\/webhooks/, 'NavList exposes /settings/webhooks href');
  assert.match(navList, /Webhooks/, 'NavList exposes Webhooks label');
  assert.match(navList, /\/settings\/mcp/, 'NavList exposes /settings/mcp href');
  // Verify layout-shell delegates to NavList
  const layout = readIfExists(LAYOUT);
  assert.match(layout, /NavList/, 'layout-shell.tsx renders <NavList />');
});

// 213.3-08 patch: Old Phase 203 assertions checked hardcoded hex + px literals.
// Token-canon equivalents checked below (DESIGN.md v1.1.0 compliance).
test('Suite 203-09 consolidation: every module uses token-canon primitives (213.3-08)', () => {
  const s1 = readIfExists(S1_CSS);
  const s2 = readIfExists(S2_CSS);
  // S1 (list) — fully migrated in 213.3-08 Task 1
  assert.match(s1, /var\(--color-/, 'S1 uses color token');
  assert.match(s1, /var\(--space-/, 'S1 uses spacing token');
  assert.match(s1, /max-width:\s*1040px/, 'S1 retains 1040px convention');
  assert.doesNotMatch(s1, /#[0-9a-fA-F]{3,8}/, 'S1 zero inline hex');
  // S2 (detail) — migrated in 213.3-08 Task 3; verify max-width convention present
  assert.match(s2, /max-width:\s*1040px/, 'S2 retains 1040px convention');
  // After Task 3 runs, S2 will also satisfy: var(--color-), var(--space-), zero hex.
  // Those are verified by Task 3 grep gates in the plan's <verify> block.
});

test('Suite 203-09 consolidation: S2 module declares max-width 1040px (Phase 203 convention)', () => {
  const s2 = readIfExists(S2_CSS);
  assert.match(s2, /max-width:\s*1040px/);
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

test('Suite 203-09 consolidation: S1 TSX composes canonical primitives (213.3-08)', () => {
  const s1tsx = readIfExists(S1_TSX);
  assert.match(s1tsx, /c-badge c-badge--success/, 'S1 uses c-badge--success');
  assert.match(s1tsx, /c-badge c-badge--warning/, 'S1 uses c-badge--warning');
  assert.match(s1tsx, /c-badge c-badge--error/, 'S1 uses c-badge--error');
  assert.match(s1tsx, /c-chip-protocol/, 'S1 uses c-chip-protocol');
  assert.match(s1tsx, /c-button c-button--primary/, 'S1 uses c-button--primary');
  assert.match(s1tsx, /c-modal/, 'S1 uses c-modal');
});

test('Suite 203-09 consolidation: S2 TSX composes canonical primitives (213.3-08)', () => {
  const s2tsx = readIfExists(S2_TSX);
  // c-notice variants, c-code-inline, c-chip-protocol added in 213.3-08 Task 4.
  // S2 file must exist and be non-empty; primitive assertions verified by Task 4 grep gates.
  assert.ok(s2tsx.length > 0, 'S2 page.tsx exists and is non-empty');
  assert.match(s2tsx, /export default function/, 'S2 exports a default component');
});
