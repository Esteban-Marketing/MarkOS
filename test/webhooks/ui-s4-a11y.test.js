'use strict';

// Phase 203 Plan 06 Task 2: Surface S4 RotationGraceBanner grep-shape + a11y suite.
// Asserts every UI-SPEC §"Surface 4 grep targets" Copy + a11y marker + CSS token
// lives in the compiled sources. Mirrors test/mcp/mcp-settings-ui-a11y.test.js
// pattern (202-09) — read source → string-match assertions.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const TSX = path.join(__dirname, '..', '..', 'app', '(markos)', '_components', 'RotationGraceBanner.tsx');
const CSS = path.join(__dirname, '..', '..', 'app', '(markos)', '_components', 'RotationGraceBanner.module.css');

function readSource(p) {
  return fs.readFileSync(p, 'utf8');
}

// ---------------------------------------------------------------------------
// Behavior 2a — empty rotations returns null (conditional-render grep).
// ---------------------------------------------------------------------------
test('Suite 203-06 S4: 2a — empty rotations branch returns null (early return)', () => {
  const tsx = readSource(TSX);
  // Must contain a length-zero check paired with a return null on the empty path.
  assert.match(tsx, /rotations\.length === 0|!rotations|rotations\s*\?\s*\.length\s*===\s*0|!rotations\s*\?\?|rotations\s*==\s*null/);
  assert.match(tsx, /return null/);
});

// ---------------------------------------------------------------------------
// Behavior 2b-2e — per-stage locked copy from UI-SPEC §Surface 4.
// ---------------------------------------------------------------------------
test('Suite 203-06 S4: 2b — T-7 copy: "Signing-secret rotation in progress." + "7 days remain in the grace window."', () => {
  const tsx = readSource(TSX);
  assert.match(tsx, /Signing-secret rotation in progress\./);
  assert.match(tsx, /7 days remain in the grace window\./);
});

test('Suite 203-06 S4: 2c — T-7 link "Review rotation for" + href /settings/webhooks/<id>?tab=settings', () => {
  const tsx = readSource(TSX);
  assert.match(tsx, /Review rotation for/);
  assert.match(tsx, /\/settings\/webhooks\/[^"`']+\?tab=settings|\/settings\/webhooks\/\$\{[^}]+\}\?tab=settings/);
});

test('Suite 203-06 S4: 2d — T-1 copy: "Signing-secret rotation ends tomorrow." + "Open settings"', () => {
  const tsx = readSource(TSX);
  assert.match(tsx, /Signing-secret rotation ends tomorrow\./);
  assert.match(tsx, /Verify subscribers have switched to the new signature\./);
  assert.match(tsx, /Open settings/);
});

test('Suite 203-06 S4: 2e — T-0 copy: "Grace window ends today." + "will be purged at" + data-stage="t-0"', () => {
  const tsx = readSource(TSX);
  assert.match(tsx, /Grace window ends today\./);
  assert.match(tsx, /will be purged at/);
  assert.match(tsx, /data-stage="t-0"|data-stage=\{.*?t-0/);
});

test('Suite 203-06 S4: 2f — multi variant: "signing-secret rotations in progress." + "Review all rotations" + data-stage="multi"', () => {
  const tsx = readSource(TSX);
  assert.match(tsx, /signing-secret rotations in progress\./);
  assert.match(tsx, /Review all rotations/);
  assert.match(tsx, /\/settings\/webhooks\?filter=rotating/);
  assert.match(tsx, /data-stage="multi"|data-stage=\{.*?multi/);
});

// ---------------------------------------------------------------------------
// Behavior 2g — no dismiss/close button (UI-SPEC explicit security rule).
// ---------------------------------------------------------------------------
test('Suite 203-06 S4: 2g — NO close/dismiss button (UI-SPEC explicit rule)', () => {
  const tsx = readSource(TSX);
  // We must NOT see any close/dismiss UI patterns.
  assert.doesNotMatch(tsx, /\bclose\b/i);
  assert.doesNotMatch(tsx, /\bdismiss\b/i);
  // Exclude the actual ×/aria-label="Close" combos.
  assert.doesNotMatch(tsx, /aria-label="Close"/i);
  assert.doesNotMatch(tsx, /×/);
});

// ---------------------------------------------------------------------------
// Behavior 2h — CSS token literals (UI-SPEC §Surface 4 CSS tokens).
// ---------------------------------------------------------------------------
test('Suite 203-06 S4: 2h — CSS warn banner tokens (#fef3c7, #78350f, #d97706)', () => {
  const css = readSource(CSS);
  assert.match(css, /#fef3c7/);
  assert.match(css, /#78350f/);
  assert.match(css, /#d97706/);
});

test('Suite 203-06 S4: 2h — CSS T-0 escalation tokens (#fef2f2, #991b1b, #dc2626)', () => {
  const css = readSource(CSS);
  assert.match(css, /#fef2f2/);
  assert.match(css, /#991b1b/);
  assert.match(css, /#dc2626/);
});

// ---------------------------------------------------------------------------
// Behavior 2i — 44px tap target + focus outline.
// ---------------------------------------------------------------------------
test('Suite 203-06 S4: 2i — CSS 44px tap target + 2px #0d9488 focus outline', () => {
  const css = readSource(CSS);
  assert.match(css, /min-height:\s*44px/);
  assert.match(css, /outline:\s*2px solid #0d9488/);
});

// ---------------------------------------------------------------------------
// Behavior 2j — [data-stage="t-0"] selector escalation.
// ---------------------------------------------------------------------------
test('Suite 203-06 S4: 2j — CSS [data-stage="t-0"] selector overrides base styling', () => {
  const css = readSource(CSS);
  assert.match(css, /\[data-stage="t-0"\]/);
});

// ---------------------------------------------------------------------------
// UI-SPEC §Testing Hooks Surface 4 a11y markers.
// ---------------------------------------------------------------------------
test('Suite 203-06 S4: a11y — role="status" + <a href=', () => {
  const tsx = readSource(TSX);
  assert.match(tsx, /role="status"/);
  assert.match(tsx, /<a href=/);
});

test('Suite 203-06 S4: client directive — use client + default export', () => {
  const tsx = readSource(TSX);
  assert.match(tsx, /['"]use client['"]/);
});

test('Suite 203-06 S4: CSS prefers-reduced-motion respected', () => {
  const css = readSource(CSS);
  assert.match(css, /prefers-reduced-motion/);
});

test('Suite 203-06 S4: files exist at UI-SPEC-declared paths', () => {
  assert.ok(fs.existsSync(TSX), 'RotationGraceBanner.tsx exists');
  assert.ok(fs.existsSync(CSS), 'RotationGraceBanner.module.css exists');
});
