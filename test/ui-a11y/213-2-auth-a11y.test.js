'use strict';

// Phase 213.2 — auth a11y grep-shape suite.
//
// Asserts that the redesigned auth surfaces (login, signup, invite/[token],
// oauth/consent) satisfy UI-SPEC AC X-1 (Sora/Space Grotesk eliminated),
// X-2 (teal hexes eliminated), X-3 (gradients/shadows/translate eliminated),
// X-4 (Storybook 8 CSF3 stories per surface), X-5 (this suite exists),
// AC#3 (.c-* primitive composition per surface), AC#9 (bracketed-glyph
// state coding), AC#15 ((pointer: coarse) global rule on .c-button + .c-nav-link).
//
// Mirrors the canonical pattern from test/ui-a11y/213-1-chrome-a11y.test.js —
// grep-shape only; runtime axe assertions live in the Storybook addon-a11y
// + Chromatic pipeline.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = process.cwd();
function read(file) {
  return fs.readFileSync(path.join(ROOT, file), 'utf8');
}

const MODULE_FILES = [
  'app/(markos)/login/page.module.css',
  'app/(marketing)/signup/page.module.css',
  'app/(markos)/invite/[token]/page.module.css',
  'app/(markos)/oauth/consent/page.module.css',
];

const STORY_FILES = [
  'app/(markos)/login/_components/LoginCard.stories.tsx',
  'app/(marketing)/signup/page.stories.tsx',
  'app/(markos)/invite/[token]/page.stories.tsx',
  'app/(markos)/oauth/consent/_components/ConsentCard.stories.tsx',
];

// ---------------------------------------------------------------------------
// X-4 — Wave 0 artifact existence: 4 story files must exist for addon-a11y.
// ---------------------------------------------------------------------------
test('213.2 auth a11y X-4: login LoginCard.stories.tsx file exists', () => {
  assert.equal(fs.existsSync(path.join(ROOT, 'app/(markos)/login/_components/LoginCard.stories.tsx')), true);
});

test('213.2 auth a11y X-4: signup page.stories.tsx file exists', () => {
  assert.equal(fs.existsSync(path.join(ROOT, 'app/(marketing)/signup/page.stories.tsx')), true);
});

test('213.2 auth a11y X-4: invite/[token] page.stories.tsx file exists', () => {
  assert.equal(fs.existsSync(path.join(ROOT, 'app/(markos)/invite/[token]/page.stories.tsx')), true);
});

test('213.2 auth a11y X-4: oauth/consent ConsentCard.stories.tsx file exists', () => {
  assert.equal(fs.existsSync(path.join(ROOT, 'app/(markos)/oauth/consent/_components/ConsentCard.stories.tsx')), true);
});

// ---------------------------------------------------------------------------
// AC#3 — Component primitive composition in TSX. One assertion per surface.
// ---------------------------------------------------------------------------
test('213.2 auth a11y AC#3: login LoginCard.tsx composes c-card--feature / c-input / c-field / c-field__label / c-field__help / c-button--primary', () => {
  const tsx = read('app/(markos)/login/_components/LoginCard.tsx');
  assert.match(tsx, /c-card c-card--feature/);
  assert.match(tsx, /c-input/);
  assert.match(tsx, /c-field__label/);
  assert.match(tsx, /c-field__help/);
  assert.match(tsx, /c-button c-button--primary/);
});

test('213.2 auth a11y AC#3: signup page.tsx composes c-card--feature / c-input / c-field / c-button--primary / c-button--tertiary / c-field__error / c-field__help', () => {
  const tsx = read('app/(marketing)/signup/page.tsx');
  assert.match(tsx, /c-card c-card--feature/);
  assert.match(tsx, /c-input/);
  assert.match(tsx, /c-field__label/);
  assert.match(tsx, /c-field__help/);
  assert.match(tsx, /c-field__error/);
  assert.match(tsx, /c-button c-button--primary/);
  assert.match(tsx, /c-button c-button--tertiary/);
});

test('213.2 auth a11y AC#3: invite/[token] page.tsx composes c-card--feature / c-button--primary / t-lead', () => {
  const tsx = read('app/(markos)/invite/[token]/page.tsx');
  assert.match(tsx, /c-card c-card--feature/);
  assert.match(tsx, /c-button c-button--primary/);
  assert.match(tsx, /t-lead/);
});

test('213.2 auth a11y AC#3: oauth/consent ConsentCard.tsx composes c-card--feature / c-button--primary / c-button--destructive / c-chip-protocol / c-code-inline / c-field__help / t-lead', () => {
  const tsx = read('app/(markos)/oauth/consent/_components/ConsentCard.tsx');
  assert.match(tsx, /c-card c-card--feature/);
  assert.match(tsx, /c-button c-button--primary/);
  assert.match(tsx, /c-button c-button--destructive/);
  assert.match(tsx, /c-chip-protocol/);
  assert.match(tsx, /c-code-inline/);
  assert.match(tsx, /c-field__help/);
  assert.match(tsx, /t-lead/);
});

// ---------------------------------------------------------------------------
// AC#9 — Bracketed-glyph state coding (signup + invite + oauth).
// Login has no state-coded copy (no [err]/[warn]/[ok] required).
// ---------------------------------------------------------------------------
test('213.2 auth a11y AC#9: signup page.tsx uses [ok] Check your inbox + [warn] for bot/rate-limit', () => {
  const tsx = read('app/(marketing)/signup/page.tsx');
  assert.match(tsx, /\[ok\] Check your inbox/);
  assert.match(tsx, /\[warn\]/);
});

test('213.2 auth a11y AC#9: invite/[token] page.tsx uses [err] on all 7 reason codes + [ok] on success', () => {
  const tsx = read('app/(markos)/invite/[token]/page.tsx');
  assert.match(tsx, /\[err\] Invite expired/);
  assert.match(tsx, /\[err\] Email mismatch/);
  assert.match(tsx, /\[err\] Invite withdrawn/);
  assert.match(tsx, /\[err\] Invite already accepted/);
  assert.match(tsx, /\[err\] Invite not found/);
  assert.match(tsx, /\[err\] Seat limit reached/);
  assert.match(tsx, /\[err\] Accept failed/);
  assert.match(tsx, /\[ok\] Accepted/);
});

test('213.2 auth a11y AC#9: oauth/consent page.tsx uses [err] on all 4 invalidReason strings', () => {
  const tsx = read('app/(markos)/oauth/consent/page.tsx');
  assert.match(tsx, /\[err\] Consent request missing/);
  assert.match(tsx, /\[err\] Consent request expired/);
  assert.match(tsx, /\[err\] Approval failed/);
  assert.match(tsx, /\[err\] Invalid redirect_uri/);
});

// ---------------------------------------------------------------------------
// AC#11 / X-1 — Sora / Space Grotesk eliminated across all 4 module.css files.
// ---------------------------------------------------------------------------
test('213.2 auth a11y AC#11/X-1: all 4 module.css files contain no Sora/Space Grotesk fonts', () => {
  for (const f of MODULE_FILES) {
    assert.doesNotMatch(read(f), /Sora|Space Grotesk/, `${f} must not contain legacy fonts`);
  }
});

// ---------------------------------------------------------------------------
// AC#12 / X-2 — Teal legacy hexes eliminated across all 4 module.css files.
// ---------------------------------------------------------------------------
test('213.2 auth a11y AC#12/X-2: all 4 module.css files contain no teal hexes', () => {
  for (const f of MODULE_FILES) {
    assert.doesNotMatch(read(f), /#0d9488|#0f766e|#14b8a6|#e6fffb|#0b877c/i, `${f} must not contain legacy teal hexes`);
  }
});

// ---------------------------------------------------------------------------
// AC#13 / X-3 — No gradients, no drop-shadows on cards, no transform translate.
// ---------------------------------------------------------------------------
test('213.2 auth a11y AC#13/X-3: all 4 module.css files contain no gradients, no drop-shadows, no transform translate', () => {
  for (const f of MODULE_FILES) {
    assert.doesNotMatch(read(f), /linear-gradient|radial-gradient|box-shadow|0 18px 45px|transform:\s*translate/, `${f} must not contain forbidden visuals`);
  }
});

// ---------------------------------------------------------------------------
// AC#15 — (pointer: coarse) rule on global primitive (.c-button + .c-nav-link).
// ---------------------------------------------------------------------------
test('213.2 auth a11y AC#15: styles/components.css declares (pointer: coarse) bump for .c-button (Phase 213.2 extension)', () => {
  const css = read('styles/components.css');
  assert.match(css, /@media\s*\(pointer:\s*coarse\)/);
  // Rule body must scope to .c-button with min-height: var(--h-control-touch).
  assert.match(css, /@media\s*\(pointer:\s*coarse\)\s*\{[\s\S]{0,400}\.c-button[\s\S]{0,200}min-height:\s*var\(--h-control-touch\)/);
});

test('213.2 auth a11y AC#15: styles/components.css ALSO declares (pointer: coarse) bump for .c-nav-link (Phase 213.1 contract preserved)', () => {
  const css = read('styles/components.css');
  assert.match(css, /@media\s*\(pointer:\s*coarse\)\s*\{[\s\S]{0,400}\.c-nav-link[\s\S]{0,200}padding-block:\s*11px/);
});

test('213.2 auth a11y AC#15: auth module.css does NOT redeclare (pointer: coarse) (rule lives on global primitive)', () => {
  for (const f of MODULE_FILES) {
    assert.doesNotMatch(read(f), /@media\s*\(pointer:\s*coarse\)/, `${f} must not redeclare touch-target media query`);
  }
});

// ---------------------------------------------------------------------------
// X-4 — Story files declare named state exports per UI-SPEC.
// ---------------------------------------------------------------------------
test('213.2 auth a11y X-4: login LoginCard stories cover Default / Filled / Branded / ErrorState', () => {
  const content = read('app/(markos)/login/_components/LoginCard.stories.tsx');
  assert.match(content, /export const Default/);
  assert.match(content, /export const Filled/);
  assert.match(content, /export const Branded/);
  assert.match(content, /export const ErrorState/);
});

test('213.2 auth a11y X-4: signup stories cover Default / Filled / Loading / Sent / BotBlocked / RateLimited / Error', () => {
  const content = read('app/(marketing)/signup/page.stories.tsx');
  assert.match(content, /export const Default/);
  assert.match(content, /export const Filled/);
  assert.match(content, /export const Loading/);
  assert.match(content, /export const Sent/);
  assert.match(content, /export const BotBlocked/);
  assert.match(content, /export const RateLimited/);
  assert.match(content, /export const Error/);
});

test('213.2 auth a11y X-4: invite/[token] stories cover Default / Accepting / Success / Error', () => {
  const content = read('app/(markos)/invite/[token]/page.stories.tsx');
  assert.match(content, /export const Default/);
  assert.match(content, /export const Accepting/);
  assert.match(content, /export const Success/);
  assert.match(content, /export const Error/);
});

test('213.2 auth a11y X-4: oauth/consent ConsentCard stories cover Default / MultiScope / MultiTenant / Loading / Approving / Declined / InvalidExpired', () => {
  const content = read('app/(markos)/oauth/consent/_components/ConsentCard.stories.tsx');
  assert.match(content, /export const Default/);
  assert.match(content, /export const MultiScope/);
  assert.match(content, /export const MultiTenant/);
  assert.match(content, /export const Loading/);
  assert.match(content, /export const Approving/);
  assert.match(content, /export const Declined/);
  assert.match(content, /export const InvalidExpired/);
});

// ---------------------------------------------------------------------------
// Token consumption positive assertions — modules cite var(--*) tokens.
// ---------------------------------------------------------------------------
test('213.2 auth a11y: login + invite + oauth module.css consume var(--color-surface) + var(--space-*)', () => {
  for (const f of [
    'app/(markos)/login/page.module.css',
    'app/(markos)/invite/[token]/page.module.css',
    'app/(markos)/oauth/consent/page.module.css',
  ]) {
    const css = read(f);
    assert.match(css, /var\(--color-surface\)/, `${f} must consume var(--color-surface)`);
    assert.match(css, /var\(--space-/, `${f} must consume var(--space-*) tokens`);
  }
});

test('213.2 auth a11y: signup module.css consumes var(--color-success) + canonical 12% alpha-tint formula on success panel', () => {
  const css = read('app/(marketing)/signup/page.module.css');
  assert.match(css, /var\(--color-success\)/);
  assert.match(css, /rgb\(63 185 80 \/ 0\.12\)/);
});

test('213.2 auth a11y: invite + oauth module.css consume var(--color-error) + 12% error-tint on notice', () => {
  for (const f of ['app/(markos)/invite/[token]/page.module.css', 'app/(markos)/oauth/consent/page.module.css']) {
    const css = read(f);
    assert.match(css, /var\(--color-error\)/);
    assert.match(css, /rgb\(248 81 73 \/ 0\.12\)/);
  }
});

// ---------------------------------------------------------------------------
// Banned lexicon scan = 0 across all auth-surface .tsx files (CONTEXT D-07).
// ---------------------------------------------------------------------------
test('213.2 auth a11y: banned lexicon = 0 in all auth-surface .tsx (no Please/synergy/leverage/etc.)', () => {
  const TSX_FILES = [
    'app/(markos)/login/page.tsx',
    'app/(markos)/login/_components/LoginCard.tsx',
    'app/(marketing)/signup/page.tsx',
    'app/(markos)/invite/[token]/page.tsx',
    'app/(markos)/oauth/consent/page.tsx',
    'app/(markos)/oauth/consent/_components/ConsentCard.tsx',
  ];
  // Match banned lexicon as standalone words/phrases in product copy.
  // Tolerated: technical identifiers like JSON.stringify (no "synergy"/"leverage" inside such tokens occur in auth surfaces).
  const banned = /\b(synergy|leverage|empower|unlock|revolutionize|supercharge|holistic|seamless|cutting-edge|innovative|game-changer|next-generation|world-class|best-in-class|reimagine|disrupt)\b/i;
  for (const f of TSX_FILES) {
    assert.doesNotMatch(read(f), banned, `${f} must not contain banned lexicon`);
  }
});
