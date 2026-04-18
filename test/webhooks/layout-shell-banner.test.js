'use strict';

// Phase 203 Plan 11 Task 1 — gap-closure wiring contract test.
//
// Closes VERIFICATION.md gap #1 (truth #12 FAILED): RotationGraceBanner
// must be imported + mounted in the workspace shell with a live fetch
// of /api/tenant/webhooks/rotations/active. Grep-shape test mirrors
// test/webhooks/settings-ui-a11y.test.js posture.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const REPO = path.join(__dirname, '..', '..');
const LAYOUT = path.join(REPO, 'app', '(markos)', 'layout-shell.tsx');
const MOUNT = path.join(REPO, 'app', '(markos)', '_components', 'RotationBannerMount.tsx');
const BANNER = path.join(REPO, 'app', '(markos)', '_components', 'RotationGraceBanner.tsx');

function readIfExists(p) {
  try { return fs.readFileSync(p, 'utf8'); } catch { return ''; }
}

test('Suite 203-11 wiring: all three shell-wiring files exist on disk', () => {
  assert.ok(fs.existsSync(LAYOUT), 'layout-shell.tsx exists');
  assert.ok(fs.existsSync(MOUNT),  'RotationBannerMount.tsx exists');
  assert.ok(fs.existsSync(BANNER), 'RotationGraceBanner.tsx exists');
});

test('Suite 203-11 wiring: layout-shell imports + mounts RotationBannerMount', () => {
  const src = readIfExists(LAYOUT);
  assert.match(src, /import\s+RotationBannerMount\s+from\s+['"]\.\/_components\/RotationBannerMount['"]/,
    'layout-shell.tsx must import RotationBannerMount from ./_components/RotationBannerMount');
  assert.match(src, /<RotationBannerMount\s*\/>/,
    'layout-shell.tsx must render <RotationBannerMount /> in JSX');
});

test('Suite 203-11 wiring: RotationBannerMount is a client component', () => {
  const src = readIfExists(MOUNT);
  assert.match(src, /^['"]use client['"];?/m,
    "RotationBannerMount.tsx must declare 'use client' directive");
});

test('Suite 203-11 wiring: RotationBannerMount fetches /api/tenant/webhooks/rotations/active', () => {
  const src = readIfExists(MOUNT);
  assert.ok(src.includes('/api/tenant/webhooks/rotations/active'),
    'RotationBannerMount.tsx must contain the endpoint URL literal');
  assert.match(src, /fetch\(['"`]\/api\/tenant\/webhooks\/rotations\/active/,
    'RotationBannerMount.tsx must call fetch() against the endpoint');
});

test('Suite 203-11 wiring: RotationBannerMount imports + renders RotationGraceBanner with rotations prop', () => {
  const src = readIfExists(MOUNT);
  assert.match(src, /import\s+RotationGraceBanner\s+from\s+['"]\.\/RotationGraceBanner['"]/,
    'RotationBannerMount.tsx must import RotationGraceBanner from ./RotationGraceBanner');
  assert.match(src, /<RotationGraceBanner\s+rotations=\{rotations\}\s*\/>/,
    'RotationBannerMount.tsx must render <RotationGraceBanner rotations={rotations} />');
});

test('Suite 203-11 wiring: RotationBannerMount uses useEffect + useState from react', () => {
  const src = readIfExists(MOUNT);
  assert.match(src, /useEffect/, 'one-shot fetch belongs in useEffect');
  assert.match(src, /useState/, 'rotations list must be stateful');
});

test('Suite 203-11 wiring: no close/dismiss toggle (UI-SPEC §Surface 4 security rule)', () => {
  // Matches the guard pattern used in test/webhooks/ui-s4-a11y.test.js 2g.
  const src = readIfExists(MOUNT);
  assert.doesNotMatch(src, /\bdismiss\b/i, 'banner must not offer a dismiss control');
  assert.doesNotMatch(src, /\bclose\b/i,   'banner must not offer a close control');
});
