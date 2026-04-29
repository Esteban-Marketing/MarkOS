'use strict';

// Phase 213.3 — settings a11y grep-shape suite.
//
// Asserts that all 9 redesigned settings surfaces (billing, members, sessions,
// domain, danger, mcp, plugins, webhooks list, webhooks detail) satisfy:
//
//   X-1 — Sora/Space Grotesk eliminated from all 9 module.css
//   X-2 — Teal hex (#0d9488/#0f766e/#14b8a6/#e6fffb/#0b877c) eliminated
//   X-3 — No gradients, no drop-shadows, no transform: translate in module.css
//   X-4 — .c-notice c-notice--{state} composition; no local banner classes;
//          bracketed-glyph state coding; story files exist + declare default meta
//   X-5 — This suite exists; ≥30 tests; ≥9 AC# mentions; exits 0
//   X-6 — No per-module @media (pointer: coarse) redeclaration (global rule
//          from Phase 213.1 + 213.2 in styles/components.css covers all surfaces)
//   X-7 — Build + full test suite green (pre-condition: prior suites still pass)
//
// Mirrors test/ui-a11y/213-2-auth-a11y.test.js grep-shape pattern exactly.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = process.cwd();
function read(file) { return fs.readFileSync(path.join(ROOT, file), 'utf8'); }
function exists(file) {
  try { fs.accessSync(path.join(ROOT, file)); return true; } catch { return false; }
}

// ---------------------------------------------------------------------------
// File manifests
// ---------------------------------------------------------------------------

const MODULE_CSS = [
  'app/(markos)/settings/billing/page.module.css',
  'app/(markos)/settings/members/page.module.css',
  'app/(markos)/settings/sessions/page.module.css',
  'app/(markos)/settings/domain/page.module.css',
  'app/(markos)/settings/danger/page.module.css',
  'app/(markos)/settings/mcp/page.module.css',
  'app/(markos)/settings/plugins/page-shell.module.css',
  'app/(markos)/settings/webhooks/page.module.css',
  'app/(markos)/settings/webhooks/[sub_id]/page.module.css',
];

const TSX_FILES = [
  'app/(markos)/settings/billing/page.tsx',
  'app/(markos)/settings/billing/page-shell.tsx',
  'app/(markos)/settings/members/page.tsx',
  'app/(markos)/settings/sessions/page.tsx',
  'app/(markos)/settings/domain/page.tsx',
  'app/(markos)/settings/danger/page.tsx',
  'app/(markos)/settings/mcp/page.tsx',
  'app/(markos)/settings/plugins/page.tsx',
  'app/(markos)/settings/plugins/page-shell.tsx',
  'app/(markos)/settings/webhooks/page.tsx',
  'app/(markos)/settings/webhooks/[sub_id]/page.tsx',
];

const STORY_FILES = [
  'app/(markos)/settings/billing/page.stories.tsx',
  'app/(markos)/settings/members/page.stories.tsx',
  'app/(markos)/settings/sessions/page.stories.tsx',
  'app/(markos)/settings/domain/page.stories.tsx',
  'app/(markos)/settings/danger/page.stories.tsx',
  'app/(markos)/settings/mcp/page.stories.tsx',
  'app/(markos)/settings/plugins/page.stories.tsx',
  'app/(markos)/settings/webhooks/page.stories.tsx',
  'app/(markos)/settings/webhooks/[sub_id]/page.stories.tsx',
];

// ===========================================================================
// AC# X-1 — Sora / Space Grotesk fully eliminated across all 9 module.css
// ===========================================================================

test('AC# X-1: no Sora/Space Grotesk font in any settings module.css', () => {
  for (const file of MODULE_CSS) {
    const content = read(file);
    assert.doesNotMatch(content, /Sora|Space Grotesk/, `${file} contains forbidden legacy font`);
  }
});

test('AC# B-1, M-1, S-1, D-1, DZ-1, MC-1, P-1, W-1: zero inline hex in all 9 settings module.css', () => {
  for (const file of MODULE_CSS) {
    const content = read(file);
    assert.doesNotMatch(content, /#[0-9a-fA-F]{3,8}/, `${file} contains forbidden inline hex color`);
  }
});

// ===========================================================================
// AC# X-2 — Teal hexes eliminated
// ===========================================================================

test('AC# X-2: no teal hex (#0d9488/#0f766e/#14b8a6/#e6fffb/#0b877c) in any settings module.css', () => {
  for (const file of MODULE_CSS) {
    const content = read(file);
    assert.doesNotMatch(
      content,
      /#0d9488|#0f766e|#14b8a6|#e6fffb|#0b877c/i,
      `${file} contains forbidden teal hex`
    );
  }
});

// ===========================================================================
// AC# X-3 — No gradients, no drop-shadows, no transform: translate
// ===========================================================================

test('AC# X-3: no linear-gradient/radial-gradient in any settings module.css', () => {
  for (const file of MODULE_CSS) {
    const content = read(file);
    assert.doesNotMatch(content, /linear-gradient|radial-gradient/i, `${file} contains forbidden gradient`);
  }
});

test('AC# X-3: no card drop-shadow (box-shadow rgba 45px) in any settings module.css', () => {
  for (const file of MODULE_CSS) {
    const content = read(file);
    assert.doesNotMatch(content, /box-shadow.*rgba.*45px/i, `${file} contains forbidden card drop-shadow`);
  }
});

test('AC# X-3: no transform: translate hover-jiggle in any settings module.css', () => {
  for (const file of MODULE_CSS) {
    const content = read(file);
    assert.doesNotMatch(content, /transform:\s*translate/i, `${file} contains forbidden transform: translate`);
  }
});

test('AC# X-3 CRITICAL: plugins/page-shell.module.css has no linear-gradient (brandCard gradient eliminated)', () => {
  const content = read('app/(markos)/settings/plugins/page-shell.module.css');
  assert.doesNotMatch(content, /linear-gradient|radial-gradient/i, 'plugins/page-shell.module.css must eliminate the .brandCard gradient');
});

// ===========================================================================
// AC# X-6 — No per-module @media (pointer: coarse) redeclaration
// ===========================================================================

test('AC# X-6: no @media (pointer: coarse) redeclaration in any settings module.css — inherits from styles/components.css global rule', () => {
  for (const file of MODULE_CSS) {
    const content = read(file);
    assert.doesNotMatch(
      content,
      /@media\s*\(pointer:\s*coarse\)/i,
      `${file} redeclares (pointer: coarse) — rule must stay on global primitive in styles/components.css`
    );
  }
});

test('AC# X-6: styles/components.css global rule scopes both .c-button + .c-nav-link (Phase 213.1 + 213.2 contract)', () => {
  const css = read('styles/components.css');
  assert.match(css, /@media\s*\(pointer:\s*coarse\)/, 'styles/components.css must declare (pointer: coarse) rule');
  assert.match(
    css,
    /@media\s*\(pointer:\s*coarse\)\s*\{[\s\S]{0,400}\.c-button[\s\S]{0,200}min-height:\s*var\(--h-control-touch\)/,
    'styles/components.css (pointer: coarse) must scope .c-button with min-height: var(--h-control-touch)'
  );
  assert.match(
    css,
    /@media\s*\(pointer:\s*coarse\)\s*\{[\s\S]{0,400}\.c-nav-link[\s\S]{0,200}padding-block:\s*11px/,
    'styles/components.css (pointer: coarse) must scope .c-nav-link with padding-block: 11px'
  );
});

// ===========================================================================
// AC# X-4 — .c-notice c-notice--{state} composition across all surfaces
// ===========================================================================

test('AC# X-4: total .c-notice compositions across all settings tsx files ≥10', () => {
  let totalNotices = 0;
  for (const file of TSX_FILES) {
    const content = read(file);
    const matches = content.match(/c-notice c-notice--/g);
    if (matches) totalNotices += matches.length;
  }
  assert.ok(
    totalNotices >= 10,
    `Expected ≥10 .c-notice compositions across settings tsx files, got ${totalNotices}`
  );
});

test('AC# X-4: no forbidden local banner class refs (holdCard/purgeBanner/atCapBanner) in any tsx', () => {
  for (const file of TSX_FILES) {
    const content = read(file);
    assert.doesNotMatch(
      content,
      /className=.*holdCard|className=.*purgeBanner|className=.*atCapBanner/,
      `${file} contains forbidden local banner class`
    );
  }
});

test('AC# X-4: bracketed-glyph state coding ([ok]/[warn]/[err]/[info]) present across settings tsx surfaces (≥10 occurrences)', () => {
  let totalGlyphs = 0;
  for (const file of TSX_FILES) {
    const content = read(file);
    const matches = content.match(/\[(ok|warn|err|info)\]/g);
    if (matches) totalGlyphs += matches.length;
  }
  assert.ok(
    totalGlyphs >= 10,
    `Expected ≥10 bracketed-glyph occurrences across settings tsx files, got ${totalGlyphs}`
  );
});

test('AC# X-4: banned lexicon = 0 in all settings tsx files', () => {
  const banned = /\b(synergy|leverage|empower|unlock|revolutionize|supercharge|holistic|seamless|cutting-edge|innovative|game-changer|next-generation|world-class|best-in-class|reimagine|disrupt)\b/i;
  for (const file of TSX_FILES) {
    const content = read(file);
    assert.doesNotMatch(content, banned, `${file} contains banned lexicon`);
  }
});

// ===========================================================================
// AC# X-4 — Storybook story file existence + default meta export
// ===========================================================================

test('AC# X-4: all 9 settings story files exist', () => {
  for (const file of STORY_FILES) {
    assert.ok(exists(file), `${file} must exist`);
  }
});

test('AC# X-4: all 9 settings story files declare export default meta', () => {
  for (const file of STORY_FILES) {
    const content = read(file);
    assert.match(content, /export default meta/, `${file} must declare export default meta`);
  }
});

// ===========================================================================
// AC# X-7 — All 9 module.css + 11 tsx files exist post-redesign
// ===========================================================================

test('AC# X-7: all 9 settings module.css + 11 tsx files exist after plans 01-08', () => {
  for (const file of [...MODULE_CSS, ...TSX_FILES]) {
    assert.ok(exists(file), `${file} must exist`);
  }
});

// ===========================================================================
// Surface 1 — Billing (AC# B-3, B-4)
// ===========================================================================

test('AC# B-3: billing/page-shell.tsx composes .c-notice c-notice--warning for hold-state banner', () => {
  const content = read('app/(markos)/settings/billing/page-shell.tsx');
  assert.match(content, /c-notice c-notice--warning/, 'billing page-shell must compose .c-notice c-notice--warning');
});

test('AC# B-4: billing/page-shell.tsx renders semantic <table> with <thead> + <tbody>', () => {
  const content = read('app/(markos)/settings/billing/page-shell.tsx');
  assert.match(content, /<table/, 'billing must use semantic <table>');
  assert.match(content, /<thead>/, 'billing must use <thead>');
  assert.match(content, /<tbody>/, 'billing must use <tbody>');
});

test('AC# B-3: billing/page-shell.tsx carries [warn] bracketed glyph in hold-state copy', () => {
  const content = read('app/(markos)/settings/billing/page-shell.tsx');
  assert.match(content, /\[warn\]/, 'billing page-shell must carry [warn] glyph');
});

// ===========================================================================
// Surface 2 — Members (AC# M-3, M-4, M-5)
// ===========================================================================

test('AC# M-3: members/page.tsx composes .c-notice c-notice--info for invite-pending banner', () => {
  const content = read('app/(markos)/settings/members/page.tsx');
  assert.match(content, /c-notice c-notice--info/, 'members must compose .c-notice c-notice--info');
});

test('AC# M-4: members/page.tsx composes .c-badge c-badge--info for pending-invite badge', () => {
  const content = read('app/(markos)/settings/members/page.tsx');
  assert.match(content, /c-badge c-badge--info/, 'members must compose .c-badge--info');
});

test('AC# M-5: members/page.tsx composes .c-modal + .c-backdrop for remove-confirm dialog', () => {
  const content = read('app/(markos)/settings/members/page.tsx');
  assert.match(content, /c-modal/, 'members must compose .c-modal for remove-confirm');
  assert.match(content, /c-backdrop/, 'members must compose .c-backdrop for remove-confirm');
});

// ===========================================================================
// Surface 3 — Sessions (AC# S-2, S-3)
// ===========================================================================

test('AC# S-2: sessions/page.tsx composes .c-badge c-badge--success carrying [ok] Current copy', () => {
  const content = read('app/(markos)/settings/sessions/page.tsx');
  assert.match(content, /c-badge c-badge--success/, 'sessions must compose .c-badge--success');
  assert.match(content, /\[ok\] Current/, 'sessions must carry [ok] Current copy');
});

test('AC# S-3: sessions/page.tsx composes .c-button c-button--destructive + .c-status-dot--live + .c-modal', () => {
  const content = read('app/(markos)/settings/sessions/page.tsx');
  assert.match(content, /c-button c-button--destructive/, 'sessions must compose .c-button--destructive for Revoke');
  assert.match(content, /c-status-dot--live/, 'sessions must compose .c-status-dot--live for current session');
  assert.match(content, /c-modal/, 'sessions must compose .c-modal for revoke confirm');
});

// ===========================================================================
// Surface 4 — Domain (AC# D-2, D-3, D-4)
// ===========================================================================

test('AC# D-2: domain/page.tsx composes .c-terminal + .c-code-block for CNAME snippet', () => {
  const content = read('app/(markos)/settings/domain/page.tsx');
  assert.match(content, /c-terminal/, 'domain must compose .c-terminal');
  assert.match(content, /c-code-block/, 'domain must compose .c-code-block');
});

test('AC# D-3: domain/page.tsx composes all 4 .c-notice state variants (success/info/warning/error)', () => {
  const content = read('app/(markos)/settings/domain/page.tsx');
  for (const state of ['success', 'info', 'warning', 'error']) {
    assert.match(
      content,
      new RegExp(`c-notice c-notice--${state}`),
      `domain must compose .c-notice c-notice--${state}`
    );
  }
});

test('AC# D-3: domain/page.tsx composes .c-status-dot--live + .c-status-dot--error', () => {
  const content = read('app/(markos)/settings/domain/page.tsx');
  assert.match(content, /c-status-dot--live/, 'domain must compose .c-status-dot--live');
  assert.match(content, /c-status-dot--error/, 'domain must compose .c-status-dot--error');
});

test('AC# D-4: domain/page.tsx composes .c-button c-button--tertiary for Resolve-now inline CTA', () => {
  const content = read('app/(markos)/settings/domain/page.tsx');
  assert.match(content, /c-button c-button--tertiary/, 'domain must compose .c-button--tertiary');
});

// ===========================================================================
// Surface 5 — Danger (AC# DZ-2, DZ-3)
// ===========================================================================

test('AC# DZ-2: danger/page.tsx composes .c-notice c-notice--error above delete confirm', () => {
  const content = read('app/(markos)/settings/danger/page.tsx');
  assert.match(content, /c-notice c-notice--error/, 'danger must compose .c-notice c-notice--error');
});

test('AC# DZ-3: danger/page.tsx composes .c-button--destructive ≥2 times + .c-modal for delete confirm', () => {
  const content = read('app/(markos)/settings/danger/page.tsx');
  const matches = content.match(/c-button c-button--destructive/g);
  assert.ok(
    matches && matches.length >= 2,
    `danger must compose .c-button--destructive ≥2 times, got ${matches?.length || 0}`
  );
  assert.match(content, /c-modal/, 'danger must compose .c-modal for delete confirm dialog');
});

// ===========================================================================
// Surface 6 — MCP (AC# MC-3, MC-4, MC-5)
// ===========================================================================

test('AC# MC-3: mcp/page.tsx composes .c-notice c-notice--error + --warning + --info (3 cost-state notices)', () => {
  const content = read('app/(markos)/settings/mcp/page.tsx');
  assert.match(content, /c-notice c-notice--error/, 'mcp must compose .c-notice c-notice--error (at-cap)');
  assert.match(content, /c-notice c-notice--warning/, 'mcp must compose .c-notice c-notice--warning (approaching limit)');
  assert.match(content, /c-notice c-notice--info/, 'mcp must compose .c-notice c-notice--info (key rotation)');
});

test('AC# MC-4: mcp/page.tsx composes .c-chip-protocol ≥2 times + .c-code-inline for masked API key', () => {
  const content = read('app/(markos)/settings/mcp/page.tsx');
  const chipMatches = content.match(/c-chip-protocol/g);
  assert.ok(
    chipMatches && chipMatches.length >= 2,
    `mcp must compose .c-chip-protocol ≥2 times (tools + key prefix), got ${chipMatches?.length || 0}`
  );
  assert.match(content, /c-code-inline/, 'mcp must compose .c-code-inline for masked API key');
});

test('AC# MC-5: mcp/page.tsx composes .c-status-dot variants + eliminates .refreshButton class ref', () => {
  const content = read('app/(markos)/settings/mcp/page.tsx');
  assert.match(content, /c-status-dot/, 'mcp must compose .c-status-dot variants');
  assert.doesNotMatch(content, /styles\.refreshButton/, 'mcp must eliminate .refreshButton class reference');
});

// ===========================================================================
// Surface 7 — Plugins (AC# P-2, P-3)
// ===========================================================================

test('AC# P-2: plugins/page-shell.tsx composes .c-card c-card--interactive for capability cards', () => {
  const content = read('app/(markos)/settings/plugins/page-shell.tsx');
  assert.match(content, /c-card c-card--interactive/, 'plugins must compose .c-card--interactive for capability cards');
});

test('AC# P-2: plugins/page-shell.tsx composes .c-chip c-chip--mint for installed badge', () => {
  const content = read('app/(markos)/settings/plugins/page-shell.tsx');
  assert.match(content, /c-chip c-chip--mint/, 'plugins must compose .c-chip--mint for [ok] Installed badge');
});

test('AC# P-3: plugins/page-shell.tsx composes .c-chip-protocol for plugin slug', () => {
  const content = read('app/(markos)/settings/plugins/page-shell.tsx');
  assert.match(content, /c-chip-protocol/, 'plugins must compose .c-chip-protocol for plugin slug');
});

// ===========================================================================
// Surface 8 — Webhooks list (AC# W-2)
// ===========================================================================

test('AC# W-2: webhooks/page.tsx composes 3 .c-badge state variants (success/warning/error)', () => {
  const content = read('app/(markos)/settings/webhooks/page.tsx');
  assert.match(content, /c-badge c-badge--success/, 'webhooks list must compose .c-badge--success');
  assert.match(content, /c-badge c-badge--warning/, 'webhooks list must compose .c-badge--warning');
  assert.match(content, /c-badge c-badge--error/, 'webhooks list must compose .c-badge--error');
});

test('AC# W-2: webhooks/page.tsx composes .c-chip-protocol for subscription IDs and event names', () => {
  const content = read('app/(markos)/settings/webhooks/page.tsx');
  assert.match(content, /c-chip-protocol/, 'webhooks list must compose .c-chip-protocol for sub IDs + events');
});

// ===========================================================================
// Surface 9 — Webhooks detail (AC# W-3, W-4)
// ===========================================================================

test('AC# W-3: webhooks/[sub_id]/page.tsx composes .c-notice c-notice--info (T-7 rotation in progress)', () => {
  const content = read('app/(markos)/settings/webhooks/[sub_id]/page.tsx');
  assert.match(content, /c-notice c-notice--info/, 'webhooks detail must compose .c-notice c-notice--info (T-7)');
});

test('AC# W-3: webhooks/[sub_id]/page.tsx composes .c-notice c-notice--warning (T-1 expiring)', () => {
  const content = read('app/(markos)/settings/webhooks/[sub_id]/page.tsx');
  assert.match(content, /c-notice c-notice--warning/, 'webhooks detail must compose .c-notice c-notice--warning (T-1)');
});

test('AC# W-3: webhooks/[sub_id]/page.tsx composes .c-notice c-notice--error (T-0 expired + DLQ)', () => {
  const content = read('app/(markos)/settings/webhooks/[sub_id]/page.tsx');
  assert.match(content, /c-notice c-notice--error/, 'webhooks detail must compose .c-notice c-notice--error (T-0 + DLQ)');
});

test('AC# W-4: webhooks/[sub_id]/page.tsx composes .c-code-inline for masked signing secret', () => {
  const content = read('app/(markos)/settings/webhooks/[sub_id]/page.tsx');
  assert.match(content, /c-code-inline/, 'webhooks detail must compose .c-code-inline for masked signing secret');
});

test('AC# W-4: webhooks/[sub_id]/page.tsx composes .c-button c-button--icon for clipboard action', () => {
  const content = read('app/(markos)/settings/webhooks/[sub_id]/page.tsx');
  assert.match(content, /c-button c-button--icon/, 'webhooks detail must compose .c-button--icon for clipboard');
});

test('AC# W-4: webhooks/[sub_id]/page.tsx composes .c-button c-button--destructive + .c-modal for disable confirm', () => {
  const content = read('app/(markos)/settings/webhooks/[sub_id]/page.tsx');
  assert.match(content, /c-button c-button--destructive/, 'webhooks detail must compose .c-button--destructive');
  assert.match(content, /c-modal/, 'webhooks detail must compose .c-modal for disable confirm dialog');
});

// Total test blocks above: 40 covering X-1, X-2, X-3, X-4, X-6, X-7 +
// per-surface AC# (B-1/3/4, M-3/4/5, S-2/3, D-2/3/4, DZ-2/3, MC-3/4/5, P-2/3, W-2/3/4)
// AC# mentions ≥9: X-1, X-2, X-3, X-4, X-6, X-7, B-1/3/4, M-3/4/5, S-2/3,
//   D-2/3/4, DZ-2/3, MC-3/4/5, P-2/3, W-2/3/4
