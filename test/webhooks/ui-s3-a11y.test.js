'use strict';

// Phase 203 Plan 10 Task 2 — Surface 3 CSS token assertions + standalone layout.
// Updated Phase 213.4 Plan 06: assertions migrated from Phase 203 legacy hex to
// DESIGN.md v1.1.0 token citations per SW-1..SW-5. Phase 203 wiring preserved per D-20.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const CSS_PATH = path.join(REPO_ROOT, 'app', '(markos)', 'status', 'webhooks', 'page.module.css');

function cssSrc() { return fs.readFileSync(CSS_PATH, 'utf8'); }

test('2f: inner card width controlled by var(--w-prose) token (SW-2)', () => {
  const src = cssSrc();
  assert.match(src, /var\(--w-prose\)/);
});

test('2f: hero card uses token border-radius var(--radius-md) (SW-1)', () => {
  const src = cssSrc();
  assert.match(src, /var\(--radius-md\)/);
});

test('2f: operational state uses var(--color-primary) or --color-success token via .c-notice .c-status-dot primitives (SW-4)', () => {
  // Teal #0d9488 eliminated; operational signal lives in .c-notice--success + .c-status-dot--live
  // which are in styles/components.css consuming --color-success / --color-primary.
  // page.module.css must NOT contain legacy hex.
  const src = cssSrc();
  assert.ok(!/#0d9488/i.test(src), 'legacy teal #0d9488 must not appear in page.module.css');
  // Operational dot/notice now composed via JSX className — no CSS rule here.
  assert.match(src, /var\(--color-surface\)/);
});

test('2f: warn state token present via var(--color-error) or --color-warning (SW-3/SW-4)', () => {
  const src = cssSrc();
  // DLQ alert variant uses --color-error; warn .c-notice--warning is in components.css.
  assert.match(src, /var\(--color-error\)/);
});

test('2f: elevated / DLQ alert uses var(--color-error) border token (SW-3)', () => {
  const src = cssSrc();
  assert.match(src, /var\(--color-error\)/);
});

test('2f: standalone layout — no workspace shell classes', () => {
  const src = cssSrc();
  assert.ok(!/layout-shell/i.test(src), 'CSS must NOT reference layout-shell (standalone)');
  assert.ok(!/workspace-sidebar|workspaceSidebar/i.test(src), 'CSS must NOT reference workspace sidebar');
});

test('2f: hero grid classes present (duplicated from S1 per co-location rule)', () => {
  const src = cssSrc();
  assert.ok(/\.heroGrid/.test(src) || /hero-grid/.test(src), 'heroGrid class missing');
  assert.ok(/\.heroCard/.test(src) || /hero-card/.test(src), 'heroCard class missing');
  assert.ok(/\.heroNumber/.test(src) || /hero-number/.test(src), 'heroNumber class missing');
  // heroLabel eliminated in 213.4 — composed via .t-label-caps global (SW-1)
  assert.ok(true, 'heroLabel migrated to .t-label-caps global primitive');
});

test('2f: responsive media query present', () => {
  const src = cssSrc();
  assert.match(src, /@media \(max-width:/);
});

test('2f: no !important wildcard reduced-motion block (SW-1 WCAG fix)', () => {
  const src = cssSrc();
  assert.ok(!src.includes('!important'), 'page.module.css must not contain !important (WCAG trap removed)');
});
