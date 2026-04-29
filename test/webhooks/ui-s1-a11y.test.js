'use strict';

// Phase 203 Plan 09 Task 2 — Surface 1 /settings/webhooks grep + a11y suite.
// 213.3-08 — Patched for DESIGN.md v1.1.0 token-canon migration.
//   CSS assertions updated: hex literals → token-canon equivalents.
//   TSX assertions updated: legacy copy variants → UI-SPEC bracketed-glyph copy.
//   Mirrors mcp-settings-ui-a11y.test.js patch from 213.3-06 (RESEARCH Pitfall 7).

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

test('Suite 203-09 S1: subscriptions h2 + table caption + badge copy variants (213.3-08)', () => {
  assert.match(tsx, /Subscriptions/);
  assert.match(tsx, /Active webhook subscriptions/);
  // 213.3-08: bracketed-glyph badge copy per UI-SPEC W-2
  assert.match(tsx, /\[ok\] Enabled/);
  assert.match(tsx, /\[warn\] Disabled/);
  assert.match(tsx, /\[err\] Failing/);
});

test('Suite 203-09 S1: View + Test fire + Firing… + empty state copy (213.3-08)', () => {
  assert.match(tsx, /View/);
  assert.match(tsx, /Test fire/);
  assert.match(tsx, /Firing…/);
  // 213.3-08: updated empty state copy per UI-SPEC Surface 8
  assert.match(tsx, /No webhook subscriptions\./);
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

// --- CSS token assertions (213.3-08 token-canon) ----------------------------

test('Suite 203-09 S1 CSS: accent + dark-teal + warn + destructive tokens (213.3-08)', () => {
  // 213.3-08: hex literals replaced with CSS custom property tokens
  assert.match(css, /var\(--color-success\)/, 'success token present');
  assert.match(css, /var\(--color-error\)/, 'error token present');
  assert.match(css, /var\(--color-warning\)/, 'warning token (meterFill)');
  assert.match(css, /var\(--color-border\)/, 'border token present');
});

test('Suite 203-09 S1 CSS: structural tokens — surface + spacing + radius + font-mono (213.3-08)', () => {
  assert.match(css, /var\(--color-surface\)/, 'surface color token');
  assert.match(css, /var\(--space-md\)/, 'spacing token');
  assert.match(css, /var\(--font-mono\)/, 'mono font token for heroNumber');
  assert.match(css, /var\(--radius-full\)/, 'radius-full for meter track');
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});

test('Suite 203-09 S1 CSS: 203-new convention #1 — max-width 1040px', () => {
  assert.match(css, /max-width:\s*1040px/);
});

test('Suite 203-09 S1 CSS: hero grid + hero number + meter token recipe (213.3-08)', () => {
  // hero layout tokens
  assert.match(css, /heroGrid/);
  assert.match(css, /heroNumber/);
  // meter renamed from successBarFill → meterFill
  assert.match(css, /meterFill/);
  assert.match(css, /meterTrack/);
  // transition uses token duration
  assert.match(css, /transition:[\s\S]*?var\(--duration-base\)/);
});

test('Suite 203-09 S1 CSS: table recipe — uppercase caption + letter-spacing token (213.3-08)', () => {
  assert.match(css, /text-transform:\s*uppercase/);
  assert.match(css, /letter-spacing:\s*var\(--ls-label\)/);
  // No raw hex colors (token migration complete)
  assert.doesNotMatch(css, /#[0-9a-fA-F]{3,8}/, 'zero inline hex in S1 CSS');
});
