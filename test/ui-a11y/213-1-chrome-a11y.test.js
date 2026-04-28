'use strict';

// Phase 213.1 — chrome a11y grep-shape suite.
//
// Asserts that the redesigned chrome (layout-shell + RotationGraceBanner)
// satisfies UI-SPEC AC#3 (.c-* primitive composition), AC#9 (bracketed-glyph
// state coding), AC#11 (Sora/Space Grotesk eliminated), AC#12 (teal hexes
// eliminated), AC#15 ((pointer: coarse) rule on global primitive), and the
// Storybook preview wiring that lets stories render against DESIGN.md tokens
// (RESEARCH.md Risk R2 mitigation).
//
// Mirrors the canonical pattern from test/ui-a11y/accessibility.test.js —
// grep-shape only; runtime axe assertions live in the Storybook addon-a11y
// + Chromatic pipeline per .github/workflows/ui-quality.yml.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = process.cwd();
function read(file) {
  return fs.readFileSync(path.join(ROOT, file), 'utf8');
}

// ---------------------------------------------------------------------------
// Wave 0 artifact existence — story files must exist for addon-a11y to run.
// ---------------------------------------------------------------------------
test('213.1 chrome a11y: layout-shell story file exists', () => {
  assert.equal(fs.existsSync(path.join(ROOT, 'app/(markos)/layout.stories.tsx')), true);
});

test('213.1 chrome a11y: RotationGraceBanner story file exists', () => {
  assert.equal(fs.existsSync(path.join(ROOT, 'app/(markos)/_components/RotationGraceBanner.stories.tsx')), true);
});

test('213.1 chrome a11y: NavList client subcomponent file exists', () => {
  assert.equal(fs.existsSync(path.join(ROOT, 'app/(markos)/_components/NavList.tsx')), true);
});

// ---------------------------------------------------------------------------
// AC#3 — Component primitive composition in TSX.
// ---------------------------------------------------------------------------
test('213.1 chrome a11y AC#3: layout-shell.tsx composes c-sidebar / c-card / c-chip / c-chip-protocol / t-lead / t-label-caps', () => {
  const tsx = read('app/(markos)/layout-shell.tsx');
  assert.match(tsx, /c-sidebar/);
  assert.match(tsx, /c-card/);
  assert.match(tsx, /c-chip\s+c-chip--mint|c-chip c-chip--mint/);
  assert.match(tsx, /c-chip-protocol/);
  assert.match(tsx, /t-lead/);
  assert.match(tsx, /t-label-caps/);
});

test('213.1 chrome a11y AC#3: NavList.tsx composes c-nav-link primitive', () => {
  const tsx = read('app/(markos)/_components/NavList.tsx');
  assert.match(tsx, /c-nav-link/);
});

test('213.1 chrome a11y AC#3: RotationGraceBanner.tsx composes c-status-dot primitive', () => {
  const tsx = read('app/(markos)/_components/RotationGraceBanner.tsx');
  assert.match(tsx, /c-status-dot/);
});

// ---------------------------------------------------------------------------
// AC#8 — Active nav state wired via usePathname() + aria-current="page".
// ---------------------------------------------------------------------------
test('213.1 chrome a11y AC#8: NavList.tsx uses usePathname() + aria-current="page" ternary', () => {
  const tsx = read('app/(markos)/_components/NavList.tsx');
  assert.match(tsx, /usePathname\(\)/);
  assert.match(tsx, /aria-current=\{pathname === item\.href \? "page" : undefined\}/);
});

// ---------------------------------------------------------------------------
// AC#9 — Bracketed-glyph state coding on banner + denied-state eyebrow.
// ---------------------------------------------------------------------------
test('213.1 chrome a11y AC#9: RotationGraceBanner.tsx uses [warn] prefix on T-7/T-1/multi <strong>', () => {
  const tsx = read('app/(markos)/_components/RotationGraceBanner.tsx');
  assert.match(tsx, /<strong>\[warn\] Signing-secret rotation in progress\./);
  assert.match(tsx, /<strong>\[warn\] Signing-secret rotation ends tomorrow\./);
  assert.match(tsx, /<strong>\[warn\] \{rotations\.length\} signing-secret rotations in progress\./);
});

test('213.1 chrome a11y AC#9: RotationGraceBanner.tsx uses [err] prefix on T-0 <strong>', () => {
  const tsx = read('app/(markos)/_components/RotationGraceBanner.tsx');
  assert.match(tsx, /<strong>\[err\] Grace window ends today\./);
});

test('213.1 chrome a11y AC#9: layout-shell.tsx denied state uses [err] prefix on eyebrow', () => {
  const tsx = read('app/(markos)/layout-shell.tsx');
  assert.match(tsx, /\[err\] Protected workspace route/);
});

// ---------------------------------------------------------------------------
// AC#11 — Sora / Space Grotesk eliminated from chrome module.css files.
// ---------------------------------------------------------------------------
test('213.1 chrome a11y AC#11: layout-shell.module.css contains no Sora/Space Grotesk fonts', () => {
  const css = read('app/(markos)/layout-shell.module.css');
  assert.doesNotMatch(css, /Sora|Space Grotesk/);
});

test('213.1 chrome a11y AC#11: RotationGraceBanner.module.css contains no Sora/Space Grotesk fonts', () => {
  const css = read('app/(markos)/_components/RotationGraceBanner.module.css');
  assert.doesNotMatch(css, /Sora|Space Grotesk/);
});

// ---------------------------------------------------------------------------
// AC#12 — Teal legacy hexes eliminated.
// ---------------------------------------------------------------------------
test('213.1 chrome a11y AC#12: layout-shell.module.css contains no teal hexes', () => {
  const css = read('app/(markos)/layout-shell.module.css');
  assert.doesNotMatch(css, /#0d9488|#0f766e|#14b8a6|#e6fffb/i);
});

test('213.1 chrome a11y AC#12: RotationGraceBanner.module.css contains no teal hexes', () => {
  const css = read('app/(markos)/_components/RotationGraceBanner.module.css');
  assert.doesNotMatch(css, /#0d9488|#0f766e|#14b8a6|#e6fffb/i);
});

// ---------------------------------------------------------------------------
// AC#13 — No gradients, no drop-shadows on cards.
// ---------------------------------------------------------------------------
test('213.1 chrome a11y AC#13: chrome modules contain no gradients and no drop-shadows on cards', () => {
  const layoutCss = read('app/(markos)/layout-shell.module.css');
  const bannerCss = read('app/(markos)/_components/RotationGraceBanner.module.css');
  assert.doesNotMatch(layoutCss, /linear-gradient|radial-gradient|box-shadow/);
  assert.doesNotMatch(bannerCss, /linear-gradient|radial-gradient|box-shadow/);
});

// ---------------------------------------------------------------------------
// AC#15 — (pointer: coarse) rule on .c-nav-link in styles/components.css.
// ---------------------------------------------------------------------------
test('213.1 chrome a11y AC#15: styles/components.css declares (pointer: coarse) bump for .c-nav-link', () => {
  const css = read('styles/components.css');
  assert.match(css, /@media\s*\(pointer:\s*coarse\)/);
  // Rule body must scope to .c-nav-link with padding-block lifted.
  assert.match(css, /@media\s*\(pointer:\s*coarse\)\s*\{[\s\S]{0,200}\.c-nav-link[\s\S]{0,200}padding-block:\s*11px/);
});

test('213.1 chrome a11y AC#15: chrome module.css does NOT redeclare (pointer: coarse) (rule lives on global primitive)', () => {
  const layoutCss = read('app/(markos)/layout-shell.module.css');
  const bannerCss = read('app/(markos)/_components/RotationGraceBanner.module.css');
  assert.doesNotMatch(layoutCss, /@media\s*\(pointer:\s*coarse\)/);
  assert.doesNotMatch(bannerCss, /@media\s*\(pointer:\s*coarse\)/);
});

// ---------------------------------------------------------------------------
// Storybook readiness — preview.tsx imports DESIGN.md tokens (R2 mitigation).
// ---------------------------------------------------------------------------
test('213.1 chrome a11y: .storybook/preview.tsx imports app/globals.css for DESIGN.md cascade', () => {
  const preview = read('.storybook/preview.tsx');
  assert.match(preview, /import\s+["']\.\.\/app\/globals\.css["']/);
});

test('213.1 chrome a11y: .storybook/preview.tsx gates legacy ThemeProvider behind opt-in', () => {
  const preview = read('.storybook/preview.tsx');
  assert.match(preview, /themeVariant !== "legacy"/);
  assert.match(preview, /themeVariant !== "white-label"/);
});

// ---------------------------------------------------------------------------
// Token consumption positive assertions — modules cite var(--*) tokens.
// ---------------------------------------------------------------------------
test('213.1 chrome a11y: layout-shell.module.css consumes DESIGN.md var(--color-*) + var(--space-*) tokens', () => {
  const css = read('app/(markos)/layout-shell.module.css');
  assert.match(css, /var\(--color-surface\)/);
  assert.match(css, /var\(--space-md\)/);
  assert.match(css, /var\(--w-container\)/);
  assert.match(css, /var\(--w-sidebar\)/);
});

test('213.1 chrome a11y: RotationGraceBanner.module.css consumes var(--color-warning) + var(--color-error) + canonical alpha-tint formulas', () => {
  const css = read('app/(markos)/_components/RotationGraceBanner.module.css');
  assert.match(css, /var\(--color-warning\)/);
  assert.match(css, /var\(--color-error\)/);
  assert.match(css, /rgb\(255 184 0 \/ 0\.12\)/);
  assert.match(css, /rgb\(248 81 73 \/ 0\.12\)/);
});

// ---------------------------------------------------------------------------
// Banner stories cover all 5 states for addon-a11y runtime axe coverage.
// ---------------------------------------------------------------------------
test('213.1 chrome a11y: RotationGraceBanner stories cover Empty / T7Warning / T1Warning / T0Error / MultiWarning', () => {
  const content = read('app/(markos)/_components/RotationGraceBanner.stories.tsx');
  assert.match(content, /export const Empty/);
  assert.match(content, /export const T7Warning/);
  assert.match(content, /export const T1Warning/);
  assert.match(content, /export const T0Error/);
  assert.match(content, /export const MultiWarning/);
});
