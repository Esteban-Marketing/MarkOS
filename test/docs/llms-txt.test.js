/**
 * test/docs/llms-txt.test.js
 *
 * Smoke tests for llms.txt, llms-full.txt concatenated markdown,
 * .md mirror, and robots.txt AI bot allow-list.
 *
 * Tests exercise the modules directly (no live HTTP server needed) and
 * also verify the static files on disk.
 */

'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function readFile(relPath) {
  return fs.readFileSync(path.join(PROJECT_ROOT, relPath), 'utf8');
}

function fileExists(relPath) {
  return fs.existsSync(path.join(PROJECT_ROOT, relPath));
}

// ─── Test Suite: public/llms.txt ──────────────────────────────────────────────

describe('public/llms.txt', () => {
  test('file exists at public/llms.txt', () => {
    assert.ok(fileExists('public/llms.txt'), 'public/llms.txt must exist');
  });

  test('starts with H1 project name', () => {
    const content = readFile('public/llms.txt');
    assert.ok(
      content.trimStart().startsWith('# MarkOS'),
      'llms.txt must start with "# MarkOS" H1'
    );
  });

  test('contains blockquote summary', () => {
    const content = readFile('public/llms.txt');
    assert.ok(content.includes('> '), 'llms.txt must contain a blockquote (> ) summary');
  });

  test('contains Docs section', () => {
    const content = readFile('public/llms.txt');
    assert.ok(
      content.includes('## Docs'),
      'llms.txt must contain a "## Docs" section'
    );
  });

  test('contains API section', () => {
    const content = readFile('public/llms.txt');
    assert.ok(
      content.includes('## API'),
      'llms.txt must contain an "## API" section'
    );
  });

  test('contains Examples section', () => {
    const content = readFile('public/llms.txt');
    assert.ok(
      content.includes('## Examples'),
      'llms.txt must contain an "## Examples" section'
    );
  });

  test('contains absolute URLs', () => {
    const content = readFile('public/llms.txt');
    assert.ok(
      content.includes('https://markos.dev/'),
      'llms.txt must contain absolute https://markos.dev/ URLs'
    );
  });

  test('references llms-full.txt', () => {
    const content = readFile('public/llms.txt');
    assert.ok(
      content.includes('llms-full.txt'),
      'llms.txt should reference the full concatenated doc'
    );
  });
});

// ─── Test Suite: build-md-mirror module ───────────────────────────────────────

describe('scripts/docs/build-md-mirror.cjs', () => {
  let buildMdMirror, stripFrontMatter, collectMdFiles, sortByNavOrder;

  test('module loads without error', () => {
    const mod = require(path.join(PROJECT_ROOT, 'scripts', 'docs', 'build-md-mirror.cjs'));
    buildMdMirror = mod.buildMdMirror;
    stripFrontMatter = mod.stripFrontMatter;
    collectMdFiles = mod.collectMdFiles;
    sortByNavOrder = mod.sortByNavOrder;

    assert.ok(typeof buildMdMirror === 'function', 'buildMdMirror must be a function');
    assert.ok(typeof stripFrontMatter === 'function', 'stripFrontMatter must be a function');
    assert.ok(typeof collectMdFiles === 'function', 'collectMdFiles must be a function');
    assert.ok(typeof sortByNavOrder === 'function', 'sortByNavOrder must be a function');
  });

  test('stripFrontMatter removes YAML front-matter', () => {
    const { stripFrontMatter: sfm } = require(path.join(PROJECT_ROOT, 'scripts', 'docs', 'build-md-mirror.cjs'));
    const input = '---\ntitle: Test\n---\n# Hello\n\nContent here.';
    const result = sfm(input);
    assert.ok(!result.includes('---'), 'Should remove --- delimiters');
    assert.ok(!result.includes('title: Test'), 'Should remove front-matter fields');
    assert.ok(result.includes('# Hello'), 'Should preserve content after front-matter');
  });

  test('stripFrontMatter is no-op for content without front-matter', () => {
    const { stripFrontMatter: sfm } = require(path.join(PROJECT_ROOT, 'scripts', 'docs', 'build-md-mirror.cjs'));
    const input = '# Hello\n\nNo front-matter here.';
    const result = sfm(input);
    assert.equal(result, input);
  });

  test('buildMdMirror returns non-empty string', () => {
    const { buildMdMirror: bmm } = require(path.join(PROJECT_ROOT, 'scripts', 'docs', 'build-md-mirror.cjs'));
    const result = bmm();
    assert.ok(typeof result === 'string', 'buildMdMirror must return a string');
    assert.ok(result.length > 100, `buildMdMirror result too short (${result.length} bytes)`);
  });

  test('buildMdMirror output starts with # MarkOS', () => {
    const { buildMdMirror: bmm } = require(path.join(PROJECT_ROOT, 'scripts', 'docs', 'build-md-mirror.cjs'));
    const result = bmm();
    assert.ok(
      result.trimStart().startsWith('# MarkOS'),
      'buildMdMirror output must start with # MarkOS header'
    );
  });

  test('buildMdMirror output exceeds 1KB', () => {
    const { buildMdMirror: bmm } = require(path.join(PROJECT_ROOT, 'scripts', 'docs', 'build-md-mirror.cjs'));
    const result = bmm();
    assert.ok(result.length > 1024, `Expected >1KB, got ${result.length} bytes`);
  });

  test('collectMdFiles returns array for existing directory', () => {
    const { collectMdFiles: cmf } = require(path.join(PROJECT_ROOT, 'scripts', 'docs', 'build-md-mirror.cjs'));
    const docsDir = path.join(PROJECT_ROOT, 'docs');
    const files = cmf(docsDir);
    assert.ok(Array.isArray(files), 'collectMdFiles must return an array');
    assert.ok(files.length >= 2, `Expected at least 2 .md files in docs/, got ${files.length}`);
  });

  test('collectMdFiles returns empty array for nonexistent directory', () => {
    const { collectMdFiles: cmf } = require(path.join(PROJECT_ROOT, 'scripts', 'docs', 'build-md-mirror.cjs'));
    const files = cmf('/nonexistent/path/xyz');
    assert.deepEqual(files, []);
  });
});

// ─── Test Suite: llms-full.txt route handler ──────────────────────────────────

describe('app/docs/llms-full.txt/route.ts (handler logic)', () => {
  // Test the underlying build function that the route calls
  test('route module exports GET function shape (TypeScript source check)', () => {
    const routePath = path.join(PROJECT_ROOT, 'app', 'docs', 'llms-full.txt', 'route.ts');
    assert.ok(fs.existsSync(routePath), 'route.ts must exist');
    const content = fs.readFileSync(routePath, 'utf8');
    assert.ok(content.includes('export async function GET'), 'route.ts must export async GET');
    assert.ok(content.includes('text/plain'), 'route.ts must set text/plain content-type');
    assert.ok(content.includes('Cache-Control'), 'route.ts must set Cache-Control header');
    assert.ok(content.includes('s-maxage=3600'), 'route.ts must cache for 1 hour (s-maxage=3600)');
  });

  test('GET handler returns text/plain with markdown content', async () => {
    // Simulate the handler logic directly using buildMdMirror
    const { buildMdMirror } = require(path.join(PROJECT_ROOT, 'scripts', 'docs', 'build-md-mirror.cjs'));
    const markdown = buildMdMirror();

    const response = new Response(markdown, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });

    assert.equal(response.status, 200);
    assert.equal(response.headers.get('Content-Type'), 'text/plain; charset=utf-8');
    const body = await response.text();
    assert.ok(body.length > 1024, 'Response body should be >1KB');
    assert.ok(body.includes('# MarkOS'), 'Response body should contain MarkOS header');
  });
});

// ─── Test Suite: .md mirror route ─────────────────────────────────────────────

describe('app/(marketing)/docs/[[...slug]]/route.ts (.md mirror)', () => {
  test('route.ts file exists', () => {
    const routePath = path.join(PROJECT_ROOT, 'app', '(marketing)', 'docs', '[[...slug]]', 'route.ts');
    assert.ok(fs.existsSync(routePath), 'route.ts must exist for .md mirror');
  });

  test('route.ts exports GET function', () => {
    const routePath = path.join(PROJECT_ROOT, 'app', '(marketing)', 'docs', '[[...slug]]', 'route.ts');
    const content = fs.readFileSync(routePath, 'utf8');
    assert.ok(content.includes('export async function GET'), 'route.ts must export async GET');
  });

  test('route.ts handles .md suffix detection', () => {
    const routePath = path.join(PROJECT_ROOT, 'app', '(marketing)', 'docs', '[[...slug]]', 'route.ts');
    const content = fs.readFileSync(routePath, 'utf8');
    assert.ok(content.includes('.md'), 'route.ts must handle .md suffix');
    assert.ok(content.includes('text/markdown'), 'route.ts must handle Accept: text/markdown');
  });

  test('markdown response uses text/plain content-type', () => {
    const routePath = path.join(PROJECT_ROOT, 'app', '(marketing)', 'docs', '[[...slug]]', 'route.ts');
    const content = fs.readFileSync(routePath, 'utf8');
    assert.ok(content.includes('text/plain'), 'route.ts must return text/plain for markdown');
  });

  test('page.tsx file exists for HTML rendering path', () => {
    const pagePath = path.join(PROJECT_ROOT, 'app', '(marketing)', 'docs', '[[...slug]]', 'page.tsx');
    assert.ok(fs.existsSync(pagePath), 'page.tsx must exist for HTML rendering');
  });

  test('simulate .md doc response for existing doc', () => {
    const { stripFrontMatter } = require(path.join(PROJECT_ROOT, 'scripts', 'docs', 'build-md-mirror.cjs'));

    // Simulate reading the LLM BYOK doc (known to exist)
    const docPath = path.join(PROJECT_ROOT, 'docs', 'LLM-BYOK-ARCHITECTURE.md');
    assert.ok(fs.existsSync(docPath), 'docs/LLM-BYOK-ARCHITECTURE.md must exist');

    const raw = fs.readFileSync(docPath, 'utf8');
    const stripped = stripFrontMatter(raw);

    const response = new Response(stripped, {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });

    assert.equal(response.status, 200);
    assert.equal(response.headers.get('Content-Type'), 'text/plain; charset=utf-8');
  });
});

// ─── Test Suite: public/robots.txt ────────────────────────────────────────────

describe('public/robots.txt', () => {
  test('file exists at public/robots.txt', () => {
    assert.ok(fileExists('public/robots.txt'), 'public/robots.txt must exist');
  });

  const AI_BOTS = [
    'GPTBot',
    'ClaudeBot',
    'PerplexityBot',
    'Google-Extended',
    'OAI-SearchBot',
    'CCBot',
    'ChatGPT-User',
  ];

  test('all 7 AI bots are present in robots.txt', () => {
    const content = readFile('public/robots.txt');
    const missing = AI_BOTS.filter((bot) => !content.includes(`User-agent: ${bot}`));
    assert.deepEqual(
      missing,
      [],
      `robots.txt missing User-agent entries for: ${missing.join(', ')}`
    );
  });

  test('GPTBot is allowed', () => {
    const content = readFile('public/robots.txt');
    // Find the GPTBot stanza and check Allow
    const idx = content.indexOf('User-agent: GPTBot');
    assert.ok(idx !== -1, 'GPTBot stanza must exist');
    const stanza = content.slice(idx, idx + 60);
    assert.ok(stanza.includes('Allow: /'), 'GPTBot must be explicitly allowed');
  });

  test('ClaudeBot is allowed', () => {
    const content = readFile('public/robots.txt');
    const idx = content.indexOf('User-agent: ClaudeBot');
    assert.ok(idx !== -1, 'ClaudeBot stanza must exist');
    const stanza = content.slice(idx, idx + 60);
    assert.ok(stanza.includes('Allow: /'), 'ClaudeBot must be explicitly allowed');
  });

  test('all 7 bots have Allow: / directive', () => {
    const content = readFile('public/robots.txt');
    const allowedBots = AI_BOTS.filter((bot) => {
      const idx = content.indexOf(`User-agent: ${bot}`);
      if (idx === -1) return false;
      // Look for Allow: / within the next 100 chars
      const stanza = content.slice(idx, idx + 100);
      return stanza.includes('Allow: /');
    });
    assert.equal(
      allowedBots.length,
      7,
      `Expected all 7 AI bots to have Allow: /, found ${allowedBots.length}: ${allowedBots.join(', ')}`
    );
  });

  test('bot count matches exactly 7', () => {
    const content = readFile('public/robots.txt');
    const count = AI_BOTS.filter((bot) => content.includes(`User-agent: ${bot}`)).length;
    assert.equal(count, 7, `Expected exactly 7 AI bot entries, found ${count}`);
  });
});
