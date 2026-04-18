'use strict';

// Phase 203 Plan 09 Task 2 — Surface 2 /settings/webhooks/[sub_id] grep + a11y suite.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const TSX = path.join(__dirname, '..', '..', 'app', '(markos)', 'settings', 'webhooks', '[sub_id]', 'page.tsx');
const CSS = path.join(__dirname, '..', '..', 'app', '(markos)', 'settings', 'webhooks', '[sub_id]', 'page.module.css');
const tsx = fs.readFileSync(TSX, 'utf8');
const css = fs.readFileSync(CSS, 'utf8');

// --- Copy assertions ---------------------------------------------------------

test('Suite 203-09 S2: breadcrumb "Webhooks" + 3 tab labels literal', () => {
  assert.match(tsx, /Webhooks/);
  assert.match(tsx, /Deliveries/);
  assert.match(tsx, /DLQ/);
  assert.match(tsx, /Settings/);
});

test('Suite 203-09 S2: expand section headings + Replay this delivery + Copy cURL / Copied.', () => {
  assert.match(tsx, /Request/);
  assert.match(tsx, /Response/);
  assert.match(tsx, /Error/);
  assert.match(tsx, /Replay this delivery/);
  assert.match(tsx, /Copy cURL/);
  assert.match(tsx, /Copied\./);
});

test('Suite 203-09 S2: DLQ intro + retention + Select all + empty state', () => {
  assert.match(tsx, /7-day replay window\. Entries older than 7 days are purged automatically\./);
  assert.match(tsx, /Retained:/);
  assert.match(tsx, /Select all/);
  assert.match(tsx, /No dead-letter entries\. All deliveries are succeeding or still retrying\./);
  assert.match(tsx, /No deliveries yet\./);
});

test('Suite 203-09 S2: Rotate / rotation dialog copy + dual-sig headers', () => {
  assert.match(tsx, /Rotate secret/);
  assert.match(tsx, /Rotate signing secret\?/);
  assert.match(tsx, /A new secret will be generated now\. Both old and new secrets will sign every webhook for 30 days\./);
  assert.match(tsx, /x-markos-signature-v1/);
  assert.match(tsx, /x-markos-signature-v2/);
});

test('Suite 203-09 S2: Rollback + Delete + save copy', () => {
  assert.match(tsx, /Rollback to old secret/);
  assert.match(tsx, /Rollback rotation\?/);
  assert.match(tsx, /Delete subscription/);
  assert.match(tsx, /Delete this subscription\?/);
  assert.match(tsx, /This cannot be undone\./);
  assert.match(tsx, /Save changes/);
  assert.match(tsx, /Settings saved\./);
});

test('Suite 203-09 S2: toast strings (Rotation started prefix)', () => {
  assert.match(tsx, /Rotation started\. Old secret retires on/);
});

// --- A11y markers -----------------------------------------------------------

test('Suite 203-09 S2 a11y: role tablist/tab/tabpanel + aria-selected + aria-controls', () => {
  assert.match(tsx, /role="tablist"/);
  assert.match(tsx, /role="tab"/);
  assert.match(tsx, /role="tabpanel"/);
  assert.match(tsx, /aria-selected=/);
  assert.match(tsx, /aria-controls=/);
});

test('Suite 203-09 S2 a11y: aria-expanded on row toggle + <caption> + scope="col"', () => {
  assert.match(tsx, /aria-expanded=/);
  assert.match(tsx, /<caption>/);
  assert.match(tsx, /scope="col"/);
});

test('Suite 203-09 S2 a11y: <dialog> for all confirms + <pre> + <code> payload blocks', () => {
  const dialogCount = (tsx.match(/<dialog/g) || []).length;
  assert.ok(dialogCount >= 4, `expected ≥ 4 <dialog> elements (rotate, rollback, delete, replay), got ${dialogCount}`);
  assert.match(tsx, /<pre/);
  assert.match(tsx, /<code/);
});

test('Suite 203-09 S2 a11y: role="status" toast + aria-live=polite + role="alert" on form errors', () => {
  assert.match(tsx, /role="status"/);
  assert.match(tsx, /aria-live="polite"/);
  assert.match(tsx, /role="alert"/);
});

test('Suite 203-09 S2 API wiring: fetches subscription detail + rotate + rollback + delete + update + replay endpoints', () => {
  assert.match(tsx, /\/api\/tenant\/webhooks\/subscriptions\/\$\{[^}]*subId[^}]*\}`,/);
  assert.match(tsx, /\/rotate/);
  assert.match(tsx, /\/rotate\/rollback/);
  assert.match(tsx, /\/delete/);
  assert.match(tsx, /\/update/);
  assert.match(tsx, /\/replay/);
});

// --- CSS tokens -------------------------------------------------------------

test('Suite 203-09 S2 CSS: warn panel + danger card tokens', () => {
  assert.match(css, /#fef3c7/);
  assert.match(css, /#78350f/);
  assert.match(css, /#fef2f2/);
  assert.match(css, /#9a3412/);
  assert.match(css, /#fca5a5/);
});

test('Suite 203-09 S2 CSS: accent + structural tokens', () => {
  assert.match(css, /#0d9488/);
  assert.match(css, /#0f766e/);
  assert.match(css, /border-radius:\s*28px/);
  assert.match(css, /outline:\s*2px solid #0d9488/);
  const tapMatches = (css.match(/min-height:\s*44px/g) || []).length;
  assert.ok(tapMatches >= 3, `min-height 44px appears ${tapMatches} times, expected ≥ 3`);
});

test('Suite 203-09 S2 CSS: 203-new convention #1 (1040px) + #2 (nested 16px) + #3 (dark code block)', () => {
  assert.match(css, /max-width:\s*1040px/);
  assert.match(css, /border-radius:\s*16px/);
  // 203-new convention #3 — dark mono code block uses #0f172a + #e2e8f0 in .codeBlock.
  assert.match(css, /\.codeBlock[\s\S]*?#0f172a/);
  assert.match(css, /\.codeBlock[\s\S]*?#e2e8f0/);
});

test('Suite 203-09 S2 CSS: prefers-reduced-motion + tab underline tokens', () => {
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  // active tab = 2px solid #0d9488 (bottom border)
  assert.match(css, /border-bottom-color:\s*#0d9488/);
});
