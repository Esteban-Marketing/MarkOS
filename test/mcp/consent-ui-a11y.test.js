'use strict';
// Suite 202-02: Surface S2 /oauth/consent grep-shape + a11y + UI-SPEC token audit.
// Source-reads page.tsx + page.module.css — does not render; asserts every Testing Hook
// listed in 202-UI-SPEC.md §"Surface 2" is present.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const TSX = path.join(__dirname, '..', '..', 'app', '(markos)', 'oauth', 'consent', 'page.tsx');
const CSS = path.join(__dirname, '..', '..', 'app', '(markos)', 'oauth', 'consent', 'page.module.css');
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

test('Suite 202-02: consent page renders UI-SPEC locked copy strings', () => {
  const tsx = readFile(TSX);
  assert.match(tsx, /Authorize/);
  assert.match(tsx, /is requesting access to:/);
  assert.match(tsx, /Which workspace\?/);
  assert.match(tsx, /Approve access/);
  assert.match(tsx, /\bDeny\b/);
  assert.match(tsx, /Pick a workspace to continue/);
  assert.match(tsx, /This authorization expires in 24 hours/);
  assert.match(tsx, /What is MCP\?/);
  // Either invalid-param fallback copy is allowed — must mention expired OR missing.
  assert.match(tsx, /Consent request expired|missing required fields/);
});

test('Suite 202-02: consent page includes a11y markers from UI-SPEC', () => {
  const tsx = readFile(TSX);
  assert.match(tsx, /<fieldset/);
  assert.match(tsx, /<legend/);
  assert.match(tsx, /aria-labelledby="consent-heading"/);
  assert.match(tsx, /aria-describedby/);
  assert.match(tsx, /role="alert"/);
  assert.match(tsx, /<code/);
  assert.match(tsx, /<details/);
  assert.match(tsx, /<summary>/);
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

test('Suite 202-02: consent page module.css contains every UI-SPEC token', () => {
  const css = readFile(CSS);
  assert.match(css, /#0d9488/);                        // accent teal
  assert.match(css, /#0f766e/);                        // dark teal (caption + chip text)
  assert.match(css, /border-radius:\s*28px/);          // card
  assert.match(css, /border-radius:\s*12px/);          // button
  assert.match(css, /outline:\s*2px solid #0d9488/);   // focus ring
  assert.match(css, /min-height:\s*44px/);             // tap target
  assert.match(css, /#fef2f2/);                        // error alert bg
  assert.match(css, /#e6fffb/);                        // scope chip bg
  assert.match(css, /0 18px 45px/);                    // card shadow (matches Phase 201)
});

test('Suite 202-02: consent page module.css uses Sora 28px on heading', () => {
  const css = readFile(CSS);
  assert.match(css, /font-family:\s*'Sora'/);
  assert.match(css, /\.heading[\s\S]*?font-size:\s*28px/);
});

test('Suite 202-02: consent page module.css honors prefers-reduced-motion', () => {
  const css = readFile(CSS);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
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
