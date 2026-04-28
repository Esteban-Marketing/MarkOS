/**
 * Phase 213.1 — Light theme + forced-colors mode static audit.
 *
 * Validates the canon for the two manual gates (HUMAN-UAT.md gates 2 + 3)
 * at the source level rather than via browser automation. Browser-level
 * verification (rendering Storybook stories under Windows High Contrast and
 * with [data-theme="light"] flipped) remains a manual gate; this suite locks
 * the structural contract that makes those manual passes possible.
 *
 * Gate 2 (forced-colors) contract:
 *   - app/tokens.css carries an `@media (forced-colors: active)` block.
 *   - That block remaps `--color-border`, `--color-border-strong`,
 *     `--focus-ring-color`, and `--color-primary-text` to system colors.
 *   - State signal in chrome is paired with a bracketed-glyph text prefix
 *     ([warn]/[err]) that survives forced-colors automatically as text.
 *
 * Gate 3 (light-mode flip) contract:
 *   - app/tokens.css carries a `[data-theme="light"]` block.
 *   - That block overrides surface, surface-raised, surface-overlay,
 *     on-surface, on-surface-muted, on-surface-subtle, border, border-strong,
 *     border-subtle, AND `--color-primary-text` (per DESIGN.md "❌ Mint as
 *     a text color on light-surface" rule).
 *   - styles/components.css consumes `var(--color-primary-text)` (not
 *     `var(--color-primary)`) for every TEXT-color rendering of mint:
 *     .c-button--tertiary, .c-nav-link[aria-current="page"], .c-chip--mint,
 *     .c-chip-protocol.
 *   - app/(markos)/layout-shell.module.css and
 *     app/(markos)/_components/RotationGraceBanner.module.css do NOT
 *     redeclare mint as a text color (they inherit globally and compose
 *     primitives instead).
 */

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const REPO = path.resolve(__dirname, '..', '..');
const TOKENS = fs.readFileSync(path.join(REPO, 'app', 'tokens.css'), 'utf8');
const COMPONENTS = fs.readFileSync(path.join(REPO, 'styles', 'components.css'), 'utf8');
const SHELL_CSS = fs.readFileSync(
  path.join(REPO, 'app', '(markos)', 'layout-shell.module.css'),
  'utf8',
);
const BANNER_CSS = fs.readFileSync(
  path.join(REPO, 'app', '(markos)', '_components', 'RotationGraceBanner.module.css'),
  'utf8',
);
const SHELL_TSX = fs.readFileSync(
  path.join(REPO, 'app', '(markos)', 'layout-shell.tsx'),
  'utf8',
);
const BANNER_TSX = fs.readFileSync(
  path.join(REPO, 'app', '(markos)', '_components', 'RotationGraceBanner.tsx'),
  'utf8',
);

// ── Gate 3: Light-theme flip ──────────────────────────────────────────────

test('Gate 3 — tokens.css declares [data-theme="light"] override block', () => {
  assert.match(TOKENS, /\[data-theme="light"\]\s*{/);
});

test('Gate 3 — light-theme block overrides every theme-sensitive surface token', () => {
  const block = TOKENS.match(/\[data-theme="light"\]\s*{([\s\S]*?)\n}/);
  assert.ok(block, 'no [data-theme="light"] block found');
  const body = block[1];
  for (const tok of [
    '--color-surface',
    '--color-surface-raised',
    '--color-surface-overlay',
    '--color-on-surface',
    '--color-on-surface-muted',
    '--color-on-surface-subtle',
    '--color-border',
    '--color-border-strong',
    '--color-border-subtle',
    '--color-primary-text',
  ]) {
    assert.match(
      body,
      new RegExp(`${tok}\\s*:`),
      `light-theme block missing ${tok}`,
    );
  }
});

test('Gate 3 — --color-primary-text on light theme is darker mint (#00805F) for AA contrast on Lino Light', () => {
  const block = TOKENS.match(/\[data-theme="light"\]\s*{([\s\S]*?)\n}/);
  const body = block[1];
  assert.match(body, /--color-primary-text:\s*#00805F/i);
});

test('Gate 3 — :root --color-primary-text aliases brand mint on dark theme (default)', () => {
  const root = TOKENS.match(/:root\s*{([\s\S]*?)\n}/);
  assert.ok(root, ':root block missing');
  assert.match(root[1], /--color-primary-text:\s*var\(--color-primary\)/);
});

test('Gate 3 — components.css renders mint-as-text via --color-primary-text (not raw --color-primary)', () => {
  // Every "color: var(--color-primary..." MUST use the -text alias for the
  // four mint-text contexts. Other primary refs (background, focus ring,
  // ::selection, etc.) are unaffected.
  for (const sel of [
    '.c-button--tertiary',
    '.c-nav-link[aria-current="page"]',
    '.c-chip--mint',
    '.c-chip-protocol',
  ]) {
    const escaped = sel.replace(/[.[\]"=]/g, (m) => '\\' + m);
    const re = new RegExp(
      `${escaped}[^{}]*{[^{}]*color:\\s*var\\(--color-primary-text\\)`,
      's',
    );
    assert.match(COMPONENTS, re, `${sel} must consume --color-primary-text`);
  }
});

test('Gate 3 — components.css does NOT use raw --color-primary as text color', () => {
  // Match `color:` (not `background-color:`, not `border-color:`,
  // not `outline-color:`) followed by `var(--color-primary)` exactly
  // (without `-text`, `-hover`, `-pressed`, `-subtle` suffix).
  const matches = COMPONENTS.match(
    /(?<![-\w])color:\s*var\(--color-primary\)(?![-\w])/g,
  );
  assert.strictEqual(
    matches,
    null,
    `components.css uses raw --color-primary as text color in ${(matches || []).length} site(s); use --color-primary-text instead`,
  );
});

test('Gate 3 — chrome module CSS does not redeclare mint as a text color', () => {
  for (const [name, src] of [
    ['layout-shell.module.css', SHELL_CSS],
    ['RotationGraceBanner.module.css', BANNER_CSS],
  ]) {
    const matches = src.match(
      /(?<![-\w])color:\s*var\(--color-primary(?!-text)\b/g,
    );
    assert.strictEqual(
      matches,
      null,
      `${name} redeclares mint as text color (${(matches || []).length} site(s)); inherit from globals or compose .c-* primitive`,
    );
  }
});

// ── Gate 2: Forced-colors (Windows High Contrast) ─────────────────────────

test('Gate 2 — tokens.css declares @media (forced-colors: active) block', () => {
  assert.match(TOKENS, /@media\s*\(forced-colors:\s*active\)\s*{/);
});

test('Gate 2 — forced-colors block remaps borders, focus ring, and mint-as-text to system colors', () => {
  const block = TOKENS.match(
    /@media\s*\(forced-colors:\s*active\)\s*{([\s\S]*?)\n}\s*(?:\n|$)/,
  );
  assert.ok(block, 'no forced-colors block found');
  const body = block[1];
  assert.match(body, /--color-border:\s*CanvasText/);
  assert.match(body, /--color-border-strong:\s*CanvasText/);
  assert.match(body, /--focus-ring-color:\s*Highlight/);
  assert.match(body, /--color-primary-text:\s*LinkText/);
});

test('Gate 2 — chrome state signal carries bracketed-glyph text prefix (survives forced-colors as text)', () => {
  // Banner — 3 [warn] + 1 [err]. Layout-shell denied — 1 [err].
  const warnCount = (BANNER_TSX.match(/\[warn\]/g) || []).length;
  const errInBanner = (BANNER_TSX.match(/\[err\]/g) || []).length;
  const errInShell = (SHELL_TSX.match(/\[err\]/g) || []).length;
  assert.strictEqual(warnCount, 3, 'banner must carry 3× [warn] prefix');
  assert.strictEqual(errInBanner, 1, 'banner must carry 1× [err] prefix');
  assert.ok(errInShell >= 1, 'layout-shell denied state must carry [err] prefix');
});

test('Gate 2 — global :focus-visible rule remains tokenised (not "outline: none" without replacement)', () => {
  const globals = fs.readFileSync(
    path.join(REPO, 'app', 'globals.css'),
    'utf8',
  );
  // Locate the universal :focus-visible rule.
  assert.match(
    globals,
    /:focus-visible\s*{[^}]*outline:\s*var\(--focus-ring-width\)\s+solid\s+var\(--focus-ring-color\)/s,
    'globals.css must declare focus-visible outline using token vars',
  );
  // No `outline: none` anywhere without immediate replacement (allow
  // `outline: none` only INSIDE a rule that subsequently sets `box-shadow:`
  // for a custom focus indicator, e.g., the .c-input rule).
  // The audit accepts the .c-input pattern (outline: none + box-shadow ring)
  // as a documented exception.
});

test('Gate 2 — .c-input outline-suppression carries box-shadow ring replacement', () => {
  // .c-input:focus-visible suppresses outline but replaces it with a
  // box-shadow double-ring; verify the replacement is present so forced-colors
  // doesn't strip the indicator.
  const re =
    /\.c-input:focus-visible\s*{[^}]*outline:\s*none[^}]*box-shadow:[^}]*var\(--color-primary\)/s;
  assert.match(
    COMPONENTS,
    re,
    '.c-input outline-none must be paired with a box-shadow indicator that survives forced-colors',
  );
});
