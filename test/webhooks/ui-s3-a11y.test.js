'use strict';

// Phase 203 Plan 10 Task 2 — Surface 3 CSS token assertions + standalone layout.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const CSS_PATH = path.join(REPO_ROOT, 'app', '(markos)', 'status', 'webhooks', 'page.module.css');

function cssSrc() { return fs.readFileSync(CSS_PATH, 'utf8'); }

test('2f: inner card max-width 720px (status-page spec)', () => {
  const src = cssSrc();
  assert.match(src, /max-width:\s*720px/);
});

test('2f: hero card border-radius 28px (matches invite-page lineage)', () => {
  const src = cssSrc();
  assert.match(src, /border-radius:\s*28px/);
});

test('2f: teal accent token #0d9488 present (hero numbers / operational dot)', () => {
  const src = cssSrc();
  assert.match(src, /#0d9488/i);
});

test('2f: warn status-line variant uses amber #d97706 or background #fef3c7', () => {
  const src = cssSrc();
  // Either amber dot color or the warn bg used in S1 lineage
  assert.ok(/#d97706|#fef3c7|#78350f/.test(src), 'warn token missing');
});

test('2f: elevated status-line variant uses red token #dc2626 or bg #fef2f2', () => {
  const src = cssSrc();
  assert.ok(/#dc2626|#fef2f2|#991b1b/.test(src), 'error token missing');
});

test('2f: standalone layout — no workspace shell classes', () => {
  const src = cssSrc();
  // Must NOT reference layout-shell / workspace / sidebar wrappers from /settings pages
  assert.ok(!/layout-shell/i.test(src), 'CSS must NOT reference layout-shell (standalone)');
  assert.ok(!/workspace-sidebar|workspaceSidebar/i.test(src), 'CSS must NOT reference workspace sidebar');
});

test('2f: hero grid classes present (duplicated from S1 per co-location rule)', () => {
  const src = cssSrc();
  assert.ok(/\.heroGrid/.test(src) || /hero-grid/.test(src), 'heroGrid class missing');
  assert.ok(/\.heroCard/.test(src) || /hero-card/.test(src), 'heroCard class missing');
  assert.ok(/\.heroNumber/.test(src) || /hero-number/.test(src), 'heroNumber class missing');
  assert.ok(/\.heroLabel/.test(src) || /hero-label/.test(src), 'heroLabel class missing');
});

test('2f: responsive media query present', () => {
  const src = cssSrc();
  assert.match(src, /@media \(max-width:/);
});

test('2f: prefers-reduced-motion query present', () => {
  const src = cssSrc();
  assert.match(src, /prefers-reduced-motion/);
});
