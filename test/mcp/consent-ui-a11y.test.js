'use strict';
// Suite 202-02: Surface S2 /oauth/consent grep-shape + a11y + UI-SPEC token audit.
// Source-reads page.tsx + page.module.css — does not render; asserts every Testing Hook
// listed in 202-UI-SPEC.md §"Surface 2" is present.
// Phase 213.2 Plan-04 patch: visual-token + Sora-font + prefers-reduced-motion + 1 copy
// assertions REPLACED with token-citation + primitive-composition + global-reduced-motion +
// revised-copy assertions; wiring + DOM-shape + F-89 contract assertions PRESERVED verbatim.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const TSX = path.join(__dirname, '..', '..', 'app', '(markos)', 'oauth', 'consent', 'page.tsx');
const CSS = path.join(__dirname, '..', '..', 'app', '(markos)', 'oauth', 'consent', 'page.module.css');
const CARD = path.join(__dirname, '..', '..', 'app', '(markos)', 'oauth', 'consent', '_components', 'ConsentCard.tsx');
const YAML = path.join(__dirname, '..', '..', 'contracts', 'F-89-mcp-oauth-v1.yaml');

function readFile(p) {
  return fs.readFileSync(p, 'utf8');
}

test('Suite 202-02: consent page.tsx exists', () => {
  assert.ok(fs.existsSync(TSX), `expected ${TSX} to exist`);
});

test('Suite 202-02: consent page.module.css exists', () => {
  assert.ok(fs.existsSync(CSS), `expected ${CSS} to exist`);
});

test('Suite 202-02 (213.2 redesigned): consent surface renders UI-SPEC locked copy strings', () => {
  const tsx = readFile(TSX);
  const card = readFile(CARD);
  const all = tsx + '\n' + card;
  assert.match(all, /Authorize/);
  assert.match(all, /is requesting access to:/);
  assert.match(all, /Which workspace\?/);
  assert.match(all, /Approve access/);
  assert.match(all, /\bDeny\b/);
  assert.match(all, /Pick a workspace to continue\./);
  assert.match(all, /Authorization expires in 24 hours\./);
  assert.match(all, /What is MCP\?/);
  // Either invalid-param fallback copy is allowed — must mention expired OR missing.
  assert.match(all, /Consent request expired|missing required fields/);
});

test('Suite 202-02 (213.2 redesigned): consent surface includes a11y markers from UI-SPEC', () => {
  const tsx = readFile(TSX);
  const card = readFile(CARD);
  const all = tsx + '\n' + card;
  assert.match(all, /<fieldset/);
  assert.match(all, /<legend/);
  assert.match(all, /aria-labelledby="consent-heading"/);
  assert.match(all, /aria-describedby/);
  assert.match(all, /role="alert"/);
  assert.match(all, /<code/);
  assert.match(all, /<details/);
  assert.match(all, /<summary>/);
});

test('Suite 202-02: consent page posts to /oauth/authorize/approve', () => {
  const tsx = readFile(TSX);
  assert.match(tsx, /\/oauth\/authorize\/approve/);
});

test('Suite 202-02: consent page fetches tenant list (D-07 tenant-bind at consent)', () => {
  const tsx = readFile(TSX);
  assert.match(tsx, /\/api\/tenant\/switcher\/list/);
});

test('Suite 202-02: consent page uses "use client" directive (Next.js App Router)', () => {
  const tsx = readFile(TSX);
  assert.match(tsx, /^['"]use client['"]/m);
});

test('Suite 202-02 (213.2 redesigned): consent page.module.css cites DESIGN.md tokens', () => {
  const css = readFile(CSS);
  assert.match(css, /var\(--color-surface\)/);
  assert.match(css, /var\(--space-/);
  assert.match(css, /var\(--radius-/);
  assert.doesNotMatch(css, /'Sora'|'Space Grotesk'/);
  assert.doesNotMatch(css, /#0d9488|#0f766e|#14b8a6|#e6fffb|#0b877c/i);
  assert.doesNotMatch(css, /linear-gradient|radial-gradient|box-shadow|18px 45px/);
  assert.doesNotMatch(css, /border-radius:\s*28px|border-radius:\s*999px/);
});

test('Suite 202-02 (213.2 redesigned): consent surface composes c-button--primary + c-button--destructive + c-chip-protocol + c-code-inline', () => {
  const tsx = readFile(TSX);
  const card = readFile(CARD);
  const all = tsx + '\n' + card;
  assert.match(all, /c-button c-button--primary/);
  assert.match(all, /c-button c-button--destructive/);
  assert.match(all, /c-chip-protocol/);
  assert.match(all, /c-code-inline/);
});

test('Suite 202-02 (213.2 redesigned): consent page.module.css does NOT redeclare prefers-reduced-motion (global covers)', () => {
  const css = readFile(CSS);
  assert.doesNotMatch(css, /@media\s*\(prefers-reduced-motion/);
});

// ---- F-89 contract ----

test('Suite 202-02: F-89 contract YAML exists', () => {
  assert.ok(fs.existsSync(YAML), `expected ${YAML} to exist`);
});

test('Suite 202-02: F-89 declares all 7 OAuth paths', () => {
  const y = readFile(YAML);
  // Count top-level path entries under paths: (4-space indent, starts with /).
  // Check each expected path explicitly — simpler than regex-parsing YAML blocks.
  const expectedPaths = [
    '/.well-known/oauth-protected-resource:',
    '/.well-known/oauth-authorization-server:',
    '/oauth/register:',
    '/oauth/authorize:',
    '/oauth/authorize/approve:',
    '/oauth/token:',
    '/oauth/revoke:',
  ];
  for (const p of expectedPaths) {
    assert.ok(y.includes(p), `expected F-89 to declare path ${p}`);
  }
});

test('Suite 202-02: F-89 references RFCs 7636 + 8707 + 8414 + 9728 + 7591', () => {
  const y = readFile(YAML);
  assert.match(y, /rfc_7636|RFC 7636/i);
  assert.match(y, /rfc_8707|RFC 8707/i);
  assert.match(y, /rfc_8414|RFC 8414/i);
  assert.match(y, /rfc_9728|RFC 9728/i);
  assert.match(y, /rfc_7591|RFC 7591/i);
});

test('Suite 202-02: F-89 advertises code_challenge_methods_supported', () => {
  const y = readFile(YAML);
  assert.match(y, /code_challenge_methods_supported/);
});
