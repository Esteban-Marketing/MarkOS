'use strict';

// Phase 203 Plan 10 Task 2 — Surface 3 locked-copy + a11y marker greps.
// Does NOT render the component (no JSX test runner). Matches UI-SPEC Surface 3 spec.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const PAGE_PATH = path.join(REPO_ROOT, 'app', '(markos)', 'status', 'webhooks', 'page.tsx');

function pageSrc() { return fs.readFileSync(PAGE_PATH, 'utf8'); }

test('2d: Surface 3 h1 locked copy — "Webhook delivery status"', () => {
  const src = pageSrc();
  assert.ok(src.includes('Webhook delivery status'), 'h1 copy missing');
});

test('2d: Surface 3 subheading locked copy', () => {
  const src = pageSrc();
  assert.ok(src.includes('Live metrics for the MarkOS webhook platform. Updated every 60 seconds.'), 'subheading copy missing');
});

test('2d: Surface 3 status-line all three variants present', () => {
  const src = pageSrc();
  assert.ok(src.includes('All systems operational.'), 'operational copy missing');
  assert.ok(src.includes('Some deliveries are being retried.'), 'retrying copy missing');
  assert.ok(src.includes('Elevated failure rate.'), 'elevated copy missing');
});

test('2d: Surface 3 footer link to /docs/webhooks with locked copy', () => {
  const src = pageSrc();
  assert.ok(src.includes('Subscriber? Learn how to configure webhooks.'), 'footer copy missing');
  assert.ok(src.includes('/docs/webhooks'), 'footer href missing');
});

test('2e: a11y markers — <main>, aria-labelledby="status-heading", <time dateTime=', () => {
  const src = pageSrc();
  assert.ok(src.includes('<main'), '<main> wrapper missing');
  assert.ok(src.includes('aria-labelledby="status-heading"'), 'aria-labelledby missing');
  assert.ok(src.includes('<time dateTime='), 'time dateTime missing');
});

test('2e: a11y markers — role="status" + aria-live="polite" on status line', () => {
  const src = pageSrc();
  assert.ok(src.includes('role="status"'), 'role=status missing');
  assert.ok(src.includes('aria-live="polite"'), 'aria-live=polite missing');
});

test('2d: h1 has id="status-heading" so aria-labelledby resolves', () => {
  const src = pageSrc();
  assert.match(src, /id="status-heading"/);
});

test('2d: 4 hero labels present in page (mirrors S1 count)', () => {
  // UI-SPEC: 4 hero cards (deliveries 24h, success rate, avg latency, DLQ count).
  const src = pageSrc();
  // At minimum references to the 4 metric keys exist (label copy uses them).
  assert.match(src, /total_24h|Deliveries|24h/i);
  assert.match(src, /success_rate|Success/i);
  assert.match(src, /avg_latency_ms|Latency/i);
  assert.match(src, /dlq_count|DLQ|Dead/i);
});
