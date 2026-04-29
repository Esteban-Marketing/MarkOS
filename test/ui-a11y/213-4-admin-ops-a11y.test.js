'use strict';

// Phase 213.4 admin/operations/status/404/theme a11y suite — grep-shape verifications
// covering 6 new module.css + 13 modified .tsx files. >=30 tests, >=7 AC# mentions
// targeting AB-7, AG-5, O-4, O-5, OT-3, OT-6, SW-4, F-2, X-1, X-2, X-3.
//
// Mirrors test/ui-a11y/213-3-settings-a11y.test.js grep-shape pattern exactly.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = process.cwd();
function read(file) { return fs.readFileSync(path.join(ROOT, file), 'utf8'); }

// ---------------------------------------------------------------------------
// File path constants
// ---------------------------------------------------------------------------

const ADMIN_BILLING_CSS    = 'app/(markos)/admin/billing/page.module.css';
const ADMIN_BILLING_TSX    = 'app/(markos)/admin/billing/page.tsx';
const ADMIN_BILLING_STORIES = 'app/(markos)/admin/billing/reconciliation.stories.tsx';
const ADMIN_GOV_CSS        = 'app/(markos)/admin/governance/page.module.css';
const ADMIN_GOV_TSX        = 'app/(markos)/admin/governance/page.tsx';
const ADMIN_GOV_STORIES    = 'app/(markos)/admin/governance/governance.stories.tsx';
const OPS_CSS              = 'app/(markos)/operations/page.module.css';
const OPS_TSX              = 'app/(markos)/operations/page.tsx';
const OPS_STORIES          = 'app/(markos)/operations/operations.stories.tsx';
const TASKS_CSS            = 'app/(markos)/operations/tasks/task-ui.module.css';
const TASKS_PAGE           = 'app/(markos)/operations/tasks/page.tsx';
const TASKS_STEP_RUNNER    = 'app/(markos)/operations/tasks/step-runner.tsx';
const TASKS_GRAPH          = 'app/(markos)/operations/tasks/task-graph.tsx';
const TASKS_APPROVAL       = 'app/(markos)/operations/tasks/approval-gate.tsx';
const TASKS_EVIDENCE       = 'app/(markos)/operations/tasks/evidence-panel.tsx';
const TASKS_STORIES        = 'app/(markos)/operations/tasks/tasks.stories.tsx';
const STATUS_CSS           = 'app/(markos)/status/webhooks/page.module.css';
const STATUS_TSX           = 'app/(markos)/status/webhooks/page.tsx';
const STATUS_STORIES       = 'app/(markos)/status/webhooks/page.stories.tsx';
const FOUR04_CSS           = 'app/(markos)/404-workspace/page.module.css';
const FOUR04_TSX           = 'app/(markos)/404-workspace/page.tsx';
const FOUR04_STORIES       = 'app/(markos)/404-workspace/page.stories.tsx';
const THEME_STORIES        = 'app/(markos)/settings/theme/theme.stories.tsx';

// ===========================================================================
// AC# AB-* (admin/billing — 7 tests)
// ===========================================================================

test('213.4 AB-1: admin/billing module.css zero inline hex', () => {
  assert.doesNotMatch(read(ADMIN_BILLING_CSS), /#[0-9a-fA-F]{3,8}/);
});

test('213.4 AB-1: admin/billing module.css no Sora/Space Grotesk legacy font', () => {
  assert.doesNotMatch(read(ADMIN_BILLING_CSS), /Sora|Space Grotesk/);
});

test('213.4 AB-2: admin/billing page.tsx composes .c-card', () => {
  assert.match(read(ADMIN_BILLING_TSX), /"c-card"/);
});

test('213.4 AB-5: admin/billing page.tsx uses .c-badge--{warning,info,success} on row state', () => {
  const src = read(ADMIN_BILLING_TSX);
  assert.match(src, /c-badge c-badge--(warning|info|success)/);
});

test('213.4 AB-6: admin/billing page.tsx uses .c-button--primary + .c-button--secondary + .c-button--destructive', () => {
  const src = read(ADMIN_BILLING_TSX);
  assert.match(src, /c-button c-button--primary/);
  assert.match(src, /c-button c-button--secondary/);
  assert.match(src, /c-button c-button--destructive/);
});

test('213.4 AB-7: admin/billing page.tsx variant-driven .c-notice c-notice--{state}', () => {
  assert.match(read(ADMIN_BILLING_TSX), /c-notice c-notice--(success|warning|error)/);
});

test('213.4 AB-8: admin/billing reconciliation.stories.tsx has Healthy + HoldState + SyncFailure exports', () => {
  const src = read(ADMIN_BILLING_STORIES);
  assert.match(src, /export const Healthy:/);
  assert.match(src, /export const HoldState:/);
  assert.match(src, /export const SyncFailure:/);
});

// ===========================================================================
// AC# AG-* (admin/governance — 5 tests)
// ===========================================================================

test('213.4 AG-1: admin/governance module.css zero inline hex', () => {
  assert.doesNotMatch(read(ADMIN_GOV_CSS), /#[0-9a-fA-F]{3,8}/);
});

test('213.4 AG-4: admin/governance module.css no teal border-left stripe', () => {
  assert.doesNotMatch(read(ADMIN_GOV_CSS), /border-left:\s*4px\s+solid/);
});

test('213.4 AG-3: admin/governance page.tsx uses .c-badge--{error,success,info}', () => {
  assert.match(read(ADMIN_GOV_TSX), /c-badge c-badge--(error|success|info)/);
});

test('213.4 AG-5: admin/governance page.tsx variant-driven .c-notice c-notice--{state}', () => {
  assert.match(read(ADMIN_GOV_TSX), /c-notice c-notice--(error|success)/);
});

test('213.4 AG-6: admin/governance.stories.tsx has Default + DeniedMapping + ExportReady exports', () => {
  const src = read(ADMIN_GOV_STORIES);
  assert.match(src, /export const Default:/);
  assert.match(src, /export const DeniedMapping:/);
  assert.match(src, /export const ExportReady:/);
});

// ===========================================================================
// AC# O-* (operations root — 5 tests)
// ===========================================================================

test('213.4 O-1: operations module.css zero inline hex', () => {
  assert.doesNotMatch(read(OPS_CSS), /#[0-9a-fA-F]{3,8}/);
});

test('213.4 O-1: operations module.css no gradient', () => {
  assert.doesNotMatch(read(OPS_CSS), /linear-gradient|radial-gradient/);
});

test('213.4 O-4: operations page.tsx Authorization dual-signal (.c-badge + .c-status-dot + bracketed glyph)', () => {
  const src = read(OPS_TSX);
  assert.match(src, /c-badge c-badge--(success|error)/);
  assert.match(src, /c-status-dot c-status-dot--(live|error)/);
  assert.match(src, /\[(ok|err)\]/);
});

test('213.4 O-5: operations page.tsx Denied state via .c-notice c-notice--error', () => {
  assert.match(read(OPS_TSX), /c-notice c-notice--error/);
});

test('213.4 O-8: operations.stories.tsx has Authorized + Denied named state exports', () => {
  const src = read(OPS_STORIES);
  assert.match(src, /export const Authorized:/);
  assert.match(src, /export const Denied:/);
});

// ===========================================================================
// AC# OT-* (operations/tasks — 10 tests)
// ===========================================================================

test('213.4 OT-1: task-ui.module.css zero inline hex', () => {
  assert.doesNotMatch(read(TASKS_CSS), /#[0-9a-fA-F]{3,8}/);
});

test('213.4 OT-1: task-ui.module.css no gradients/box-shadow/jiggle', () => {
  const src = read(TASKS_CSS);
  assert.doesNotMatch(src, /linear-gradient|radial-gradient/);
  assert.doesNotMatch(src, /box-shadow/);
  assert.doesNotMatch(src, /transform:\s*translate/);
});

test('213.4 OT-3: task-ui.module.css no legacy step-card blue hex colors', () => {
  assert.doesNotMatch(read(TASKS_CSS), /#38bdf8|#bfdbfe|#1d4ed8/);
});

test('213.4 OT-4: task-graph.tsx uses .c-badge--{info,warning,success,error} for task state', () => {
  const src = read(TASKS_GRAPH);
  assert.match(src, /c-badge c-badge--info/);
  assert.match(src, /c-badge c-badge--warning/);
  assert.match(src, /c-badge c-badge--success/);
  assert.match(src, /c-badge c-badge--error/);
});

test('213.4 OT-6: step-runner.tsx helper banners via .c-notice c-notice--{info,warning,error}', () => {
  const src = read(TASKS_STEP_RUNNER);
  assert.match(src, /c-notice c-notice--warning/);
  assert.match(src, /c-notice c-notice--info/);
  assert.match(src, /c-notice c-notice--error/);
});

test('213.4 OT-8: step-runner.tsx step action buttons compose .c-button--{primary,secondary,destructive}', () => {
  const src = read(TASKS_STEP_RUNNER);
  assert.match(src, /c-button c-button--primary/);
  assert.match(src, /c-button c-button--secondary/);
  assert.match(src, /c-button c-button--destructive/);
});

test('213.4 OT-8: approval-gate.tsx abort dialog composes .c-modal + .c-backdrop', () => {
  const src = read(TASKS_APPROVAL);
  assert.match(src, /c-modal/);
  assert.match(src, /c-backdrop/);
});

test('213.4 OT-9: tasks/page.tsx zero Tailwind inline hex', () => {
  assert.doesNotMatch(read(TASKS_PAGE), /bg-\[#|text-\[#|border-\[#|border-gray-/);
});

test('213.4 OT-10: approval-gate.tsx composes .c-input + .c-field for evidence form', () => {
  const src = read(TASKS_APPROVAL);
  assert.match(src, /c-input/);
  assert.match(src, /c-field/);
});

test('213.4 OT-11: evidence-panel.tsx composes .c-card + .c-chip-protocol', () => {
  const src = read(TASKS_EVIDENCE);
  assert.match(src, /c-card/);
  assert.match(src, /c-chip-protocol/);
});

test('213.4 OT-12: tasks.stories.tsx has >=4 named state exports', () => {
  const src = read(TASKS_STORIES);
  const names = ['QueuedTask', 'ExecutingTask', 'CompletedTask', 'FailedTask', 'ApprovalRequired'];
  const found = names.filter((n) => src.includes(`export const ${n}:`));
  assert.ok(found.length >= 4, `expected >=4 of ${names.join(',')} found ${found.length}`);
});

// ===========================================================================
// AC# SW-* (status/webhooks — 5 tests)
// ===========================================================================

test('213.4 SW-1: status/webhooks module.css zero inline hex', () => {
  assert.doesNotMatch(read(STATUS_CSS), /#[0-9a-fA-F]{3,8}/);
});

test('213.4 SW-1: status/webhooks module.css no !important wildcard', () => {
  assert.doesNotMatch(read(STATUS_CSS), /!important/);
});

test('213.4 SW-4: status/webhooks page.tsx .c-notice + .c-status-dot primitives className-driven', () => {
  const src = read(STATUS_TSX);
  assert.match(src, /c-notice c-notice--(success|warning|error)/);
  assert.match(src, /c-status-dot/);
});

test('213.4 SW-4: status/webhooks page.tsx bracketed glyphs prepended to state copy', () => {
  assert.match(read(STATUS_TSX), /\[(ok|warn|err)\]/);
});

test('213.4 SW-7: status/webhooks page.tsx Phase 203 endpoint + classifyStatus preserved', () => {
  const src = read(STATUS_TSX);
  assert.match(src, /api\/public\/webhooks\/status/);
  assert.match(src, /classifyStatus/);
});

test('213.4 SW-6: status/webhooks page.stories.tsx has Operational + Retrying + Elevated exports', () => {
  const src = read(STATUS_STORIES);
  assert.match(src, /export const Operational:/);
  assert.match(src, /export const Retrying:/);
  assert.match(src, /export const Elevated:/);
});

// ===========================================================================
// AC# F-* (404-workspace — 4 tests)
// ===========================================================================

test('213.4 F-1: 404-workspace module.css zero inline hex', () => {
  assert.doesNotMatch(read(FOUR04_CSS), /#[0-9a-fA-F]{3,8}/);
});

test('213.4 F-1: 404-workspace module.css no gradient', () => {
  assert.doesNotMatch(read(FOUR04_CSS), /linear-gradient|radial-gradient/);
});

test('213.4 F-2: 404-workspace page.tsx composes .c-card--feature (D-13 hero exception)', () => {
  assert.match(read(FOUR04_TSX), /c-card--feature/);
});

test('213.4 F-7: 404-workspace page.tsx force-dynamic + searchParams preserved per D-23', () => {
  const src = read(FOUR04_TSX);
  assert.match(src, /force-dynamic/);
  assert.match(src, /searchParams/);
});

test('213.4 F-6: 404-workspace page.stories.tsx has Available + Reserved named exports', () => {
  const src = read(FOUR04_STORIES);
  assert.match(src, /export const Available:/);
  assert.match(src, /export const Reserved:/);
});

// ===========================================================================
// AC# X-* cross-cutting + T-2 theme (5 tests)
// ===========================================================================

test('213.4 X-1: --color-primary never used as standalone text color in any new module.css', () => {
  // Matches lines where the CSS property is exactly `color` (not `border-color`, `background-color`, etc.)
  // Uses a lookbehind to reject any character before `color:` that would indicate a compound property.
  const files = [ADMIN_BILLING_CSS, ADMIN_GOV_CSS, OPS_CSS, TASKS_CSS, STATUS_CSS, FOUR04_CSS];
  for (const file of files) {
    const src = read(file);
    // Split into lines and check each — only flag lines where the sole property is `color:`
    const badLine = src.split('\n').find((line) => /^\s+color:\s+var\(--color-primary\)\s*;/.test(line));
    assert.ok(
      !badLine,
      `${file} uses --color-primary as text color (must use --color-primary-text): "${(badLine || '').trim()}"`
    );
  }
});

test('213.4 X-2: no height: 6px meter tracks across wave (8px sizing parity)', () => {
  const files = [TASKS_CSS, STATUS_CSS];
  for (const file of files) {
    assert.doesNotMatch(read(file), /height:\s*6px/, `${file} contains 6px meter track (must be 8px)`);
  }
});

test('213.4 X-3: task-ui.module.css contains explicit @media (prefers-reduced-motion: reduce) block', () => {
  assert.match(read(TASKS_CSS), /@media[^{]*prefers-reduced-motion:\s*reduce/);
});

test('213.4 X-5: zero @media (pointer: coarse) redeclarations in any new module.css', () => {
  const files = [ADMIN_BILLING_CSS, ADMIN_GOV_CSS, OPS_CSS, TASKS_CSS, STATUS_CSS, FOUR04_CSS];
  for (const file of files) {
    assert.doesNotMatch(
      read(file),
      /@media[^{]*pointer[^{]*coarse/,
      `${file} redeclares (pointer: coarse) — global rule in styles/components.css covers all consumers`
    );
  }
});

test('213.4 T-2: settings/theme/theme.stories.tsx has ColorTokens + SpacingTokens + PrimitiveSampler named exports', () => {
  const src = read(THEME_STORIES);
  assert.match(src, /export const ColorTokens:/);
  assert.match(src, /export const SpacingTokens:/);
  assert.match(src, /export const PrimitiveSampler:/);
});

// Total test blocks: 40 covering AB-1/2/5/6/7/8, AG-1/3/4/5/6, O-1/4/5/8,
// OT-1/3/4/6/8/9/10/11/12, SW-1/4/6/7, F-1/2/6/7, X-1/X-2/X-3/X-5, T-2
// AC# mentions >= 7: AB-7, AG-5, O-4, O-5, OT-3, OT-6, SW-4, F-2, X-1, X-2, X-3
