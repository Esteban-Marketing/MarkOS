'use strict';

// Phase 203 Plan 09 Task 2 — Surface 1 /settings/webhooks grep + a11y suite.
// Pattern mirrors test/mcp/mcp-settings-ui-a11y.test.js (Plan 202-09).
// Every UI-SPEC §"Testing Hooks" Surface 1 target must live in the compiled sources.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const TSX = path.join(__dirname, '..', '..', 'app', '(markos)', 'settings', 'webhooks', 'page.tsx');
const CSS = path.join(__dirname, '..', '..', 'app', '(markos)', 'settings', 'webhooks', 'page.module.css');
const tsx = fs.readFileSync(TSX, 'utf8');
const css = fs.readFileSync(CSS, 'utf8');

// --- Copy assertions ---------------------------------------------------------

test('Suite 203-09 S1: h1 "Webhooks" + subheading substring + Create subscription CTA', () => {
  assert.match(tsx, /Webhooks/);
  assert.match(tsx, /HMAC-signed payloads with automatic retry/);
  assert.match(tsx, /Create subscription/);
});

test('Suite 203-09 S1: 4 hero labels literal', () => {
  assert.match(tsx, /24h deliveries/);
  assert.match(tsx, /Success rate/);
  assert.match(tsx, /Avg latency \(p50\)/);
  assert.match(tsx, /Dead-letter queue/);
});

test('Suite 203-09 S1: subscriptions h2 + table caption + 3 chip copy variants', () => {
  assert.match(tsx, /Subscriptions/);
  assert.match(tsx, /Active webhook subscriptions/);
  assert.match(tsx, /Healthy/);
  assert.match(tsx, /Half-open/);
  assert.match(tsx, /Tripped/);
});

test('Suite 203-09 S1: View + Test fire + Firing… + empty state copy', () => {
  assert.match(tsx, /View/);
  assert.match(tsx, /Test fire/);
  assert.match(tsx, /Firing…/);
  assert.match(tsx, /No webhook subscriptions yet\. Create one to start receiving event callbacks\./);
});

test('Suite 203-09 S1: loading strings + create dialog heading', () => {
  assert.match(tsx, /Loading metrics…/);
  assert.match(tsx, /Loading subscriptions…/);
  assert.match(tsx, /Create webhook subscription/);
});

test('Suite 203-09 S1: error + toast literals', () => {
  assert.match(tsx, /A subscription with this URL already exists\./);
  assert.match(tsx, /Private IPs are not allowed as subscriber endpoints\./);
  assert.match(tsx, /Subscription created\./);
  assert.match(tsx, /Test fired — check the Deliveries tab\./);
  assert.match(tsx, /Could not fire test\. Try again\./);
});

// --- A11y markers -----------------------------------------------------------

test('Suite 203-09 S1 a11y: aria-labelledby on hero + subs sections', () => {
  assert.match(tsx, /aria-labelledby="webhooks-hero-heading"/);
  assert.match(tsx, /aria-labelledby="webhooks-subs-heading"/);
});

test('Suite 203-09 S1 a11y: role=meter success-rate + role=status toast + aria-live=polite', () => {
  assert.match(tsx, /role="meter"/);
  assert.match(tsx, /role="status"/);
  assert.match(tsx, /aria-live="polite"/);
});

test('Suite 203-09 S1 a11y: <caption> + scope="col" + <dialog>', () => {
  assert.match(tsx, /<caption>/);
  assert.match(tsx, /scope="col"/);
  assert.match(tsx, /<dialog/);
});

test('Suite 203-09 S1 API wiring: fetches /api/tenant/webhooks/fleet-metrics + /subscriptions', () => {
  assert.match(tsx, /\/api\/tenant\/webhooks\/fleet-metrics/);
  assert.match(tsx, /\/api\/tenant\/webhooks\/subscriptions/);
});

// --- CSS token assertions ---------------------------------------------------

test('Suite 203-09 S1 CSS: accent + dark-teal + warn + destructive tokens', () => {
  const matches = (re) => (css.match(re) || []).length;
  assert.ok(matches(/#0d9488/g) >= 3, 'accent teal appears ≥ 3 times');
  assert.match(css, /#0f766e/);
  assert.match(css, /#fef3c7/);
  assert.match(css, /#fef2f2/);
});

test('Suite 203-09 S1 CSS: structural tokens — 28px card + 12px button + focus ring + 44px tap + motion query', () => {
  assert.match(css, /border-radius:\s*28px/);
  assert.match(css, /border-radius:\s*12px/);
  assert.match(css, /outline:\s*2px solid #0d9488/);
  const tapMatches = (css.match(/min-height:\s*44px/g) || []).length;
  assert.ok(tapMatches >= 3, `min-height 44px appears ${tapMatches} times, expected ≥ 3`);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});

test('Suite 203-09 S1 CSS: 203-new convention #1 — max-width 1040px', () => {
  assert.match(css, /max-width:\s*1040px/);
});

test('Suite 203-09 S1 CSS: card shadow + hero + meter fill transition tokens', () => {
  assert.match(css, /0 18px 45px/);
  assert.match(css, /heroGrid/);
  assert.match(css, /heroNumber/);
  // success-rate fill matches 202 .costMeterFill semantics — 180ms ease-out
  assert.match(css, /successBarFill[\s\S]*?transition:[\s\S]*?180ms[\s\S]*?ease-out/);
});

test('Suite 203-09 S1 CSS: table caption eyebrow + letter-spacing + dark-teal', () => {
  assert.match(css, /text-transform:\s*uppercase/);
  assert.match(css, /letter-spacing:\s*0\.08em/);
  assert.match(css, /#0f766e/);
});
