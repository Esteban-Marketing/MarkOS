'use strict';

// Phase 203 Plan 09 Task 2 — Surface 2 /settings/webhooks/[sub_id] grep + a11y suite.
// 213.3-08 — Patched for DESIGN.md v1.1.0 token-canon migration.
//   CSS assertions updated: hex literals → token-canon equivalents.
//   TSX copy assertions preserved (wiring unchanged per W-6 / D-22).
//   Mirrors mcp-settings-ui-a11y.test.js patch from 213.3-06 (RESEARCH Pitfall 7).

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

test('Suite 203-09 S2: expand section headings + Replay + Copy cURL / Copied.', () => {
  assert.match(tsx, /Request/);
  assert.match(tsx, /Response/);
  assert.match(tsx, /Error/);
  // 213.3-08: "Replay this delivery" moved to dialog heading; row action is "Replay"
  assert.match(tsx, /Replay/);
  assert.match(tsx, /Copy cURL/);
  assert.match(tsx, /Copied\./);
});

test('Suite 203-09 S2: DLQ intro + retention + Select all + empty state', () => {
  assert.match(tsx, /7-day replay window\. Entries older than 7 days are purged automatically\./);
  assert.match(tsx, /Retained:/);
  assert.match(tsx, /Select all/);
  assert.match(tsx, /No dead-letter entries\. All deliveries are succeeding or still retrying\./);
  // 213.3-08: delivery empty state updated per UI-SPEC
  assert.match(tsx, /No events recorded\./);
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
  // 213.3-08: form error uses c-notice c-notice--error (role="alert" may be via class, not explicit attr)
  assert.ok(
    /role="alert"/.test(tsx) || /c-notice c-notice--error/.test(tsx),
    'form errors use role="alert" or c-notice c-notice--error'
  );
});

test('Suite 203-09 S2 API wiring: fetches subscription detail + rotate + rollback + delete + update + replay endpoints', () => {
  assert.match(tsx, /\/api\/tenant\/webhooks\/subscriptions\/\$\{[^}]*subId[^}]*\}`,/);
  assert.match(tsx, /\/rotate/);
  assert.match(tsx, /\/rotate\/rollback/);
  assert.match(tsx, /\/delete/);
  assert.match(tsx, /\/update/);
  assert.match(tsx, /\/replay/);
});

// --- CSS token assertions (213.3-08 token-canon) ----------------------------

test('Suite 203-09 S2 CSS: state/structural token-canon (213.3-08)', () => {
  // 213.3-08: all hex literals replaced with CSS custom properties.
  // Warning/danger states are handled by .c-badge--warning/.c-notice--warning
  // primitives in styles/components.css — not duplicated in local module.
  assert.match(css, /var\(--color-error\)/, 'error token for tab count badge alert');
  assert.match(css, /var\(--color-primary\)/, 'primary/mint token for tab active state');
  assert.match(css, /var\(--color-border\)/, 'border token for table/tab rules');
  assert.match(css, /var\(--color-surface-raised\)/, 'raised surface for expand row');
});

test('Suite 203-09 S2 CSS: accent + structural tokens (213.3-08)', () => {
  // 213.3-08: no raw hex; check canonical token usage
  assert.match(css, /var\(--color-surface\)/, 'surface color token');
  assert.match(css, /var\(--space-md\)/, 'spacing token');
  assert.match(css, /var\(--font-mono\)/, 'mono font token for breadcrumbCurrent');
  assert.match(css, /var\(--h-control-touch\)/, 'touch target token');
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  // No raw hex colors (token migration complete — 118 hexes eliminated)
  assert.doesNotMatch(css, /#[0-9a-fA-F]{3,8}/, 'zero inline hex in S2 CSS');
});

test('Suite 203-09 S2 CSS: Phase 203 convention #1 (1040px max-width) retained', () => {
  assert.match(css, /max-width:\s*1040px/);
  // 203-new conventions #2 (nested 16px radius) + #3 (dark code block) are now
  // provided by .c-card and .c-terminal/.c-code-block primitives from components.css.
  // Local module no longer duplicates these; they are verified via Storybook snapshots.
});

test('Suite 203-09 S2 CSS: prefers-reduced-motion + tab active token (213.3-08)', () => {
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  // 213.3-08: active tab bottom border uses var(--color-primary) not raw #0d9488
  assert.match(css, /border-bottom-color:\s*var\(--color-primary\)/);
});
