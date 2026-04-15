/**
 * test/example-resolver.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Unit tests for onboarding/backend/agents/example-resolver.cjs
 *
 * Run:  node --test test/example-resolver.test.js
 * Or:   node --test test/
 */
'use strict';

const test   = require('node:test');
const assert = require('node:assert/strict');
const path   = require('path');
const fs     = require('fs');
const os     = require('os');

const { resolveExample, resolveTemplateSelection, resolveSkeleton } = require('../onboarding/backend/agents/example-resolver.cjs');

// ─── Test fixtures ────────────────────────────────────────────────────────────

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'markos-resolver-test-'));
}

const FAKE_CONTENT = `# AUDIENCES — B2B Example\n\nPrimary segment: Mid-Market CTOs.`;

test('Suite 6: example-resolver', async (t) => {

  await t.test('6.1 resolves correct file for known model slug', () => {
    const dir = makeTmpDir();
    fs.writeFileSync(path.join(dir, '_AUDIENCES-b2b.example.md'), FAKE_CONTENT);

    const result = resolveExample('AUDIENCES', 'B2B', '', dir);

    assert.ok(result.length > 0, 'should return non-empty string');
    assert.ok(result.includes('📌 Reference Example'), 'should include header');
    assert.ok(result.includes('B2B'), 'should include model label in header');
    assert.ok(result.includes('Primary segment'), 'should include file content');

    fs.rmSync(dir, { recursive: true, force: true });
  });

  await t.test('6.2 normalizes model slugs (Agents-aaS → agents-aas)', () => {
    const dir = makeTmpDir();
    fs.writeFileSync(path.join(dir, '_BRAND-VOICE-agents-aas.example.md'), '# Agents-aaS Voice');

    const result = resolveExample('BRAND-VOICE', 'Agents-aaS', '', dir);

    assert.ok(result.length > 0, 'should resolve Agents-aaS slug');
    assert.ok(result.includes('Agents-aaS'), 'should include model label');

    fs.rmSync(dir, { recursive: true, force: true });
  });

  await t.test('6.3 returns empty string for missing file (graceful degradation)', () => {
    const dir = makeTmpDir();
    // No files in dir

    const result = resolveExample('AUDIENCES', 'B2B', '', dir);

    assert.strictEqual(result, '', 'should return empty string if file not found');

    fs.rmSync(dir, { recursive: true, force: true });
  });

  await t.test('6.4 returns empty string for unknown business model', () => {
    const dir = makeTmpDir();

    const result = resolveExample('AUDIENCES', 'UNKNOWN_MODEL', '', dir);

    assert.strictEqual(result, '', 'should return empty string for unknown model');

    fs.rmSync(dir, { recursive: true, force: true });
  });

  await t.test('6.5 returns empty string when templateName is missing', () => {
    const dir = makeTmpDir();

    const result = resolveExample('', 'B2B', '', dir);

    assert.strictEqual(result, '', 'should return empty string if templateName is empty');

    fs.rmSync(dir, { recursive: true, force: true });
  });

  await t.test('6.6 injection block has correct format', () => {
    const dir = makeTmpDir();
    fs.writeFileSync(path.join(dir, '_CHANNEL-STRATEGY-saas.example.md'), '# SaaS Strategy');

    const result = resolveExample('CHANNEL-STRATEGY', 'SaaS', '', dir);

    // Must contain the standard injection wrapper parts
    assert.ok(result.includes('## 📌 Reference Example'), 'must have ## header');
    assert.ok(result.includes('quality benchmark'), 'must include instruction note');
    assert.ok(result.includes('Now fill the same template'), 'must include transition instruction');
    assert.ok(result.includes('---'), 'must include divider');

    fs.rmSync(dir, { recursive: true, force: true });
  });

  await t.test('6.7 handles all 7 canonical models without throwing', () => {
    const dir = makeTmpDir();
    const models = ['B2B', 'B2C', 'B2B2C', 'DTC', 'Marketplace', 'SaaS', 'Agents-aaS'];

    for (const model of models) {
      // Test does not throw even without example files
      assert.doesNotThrow(
        () => resolveExample('AUDIENCES', model, '', dir),
        `should not throw for model: ${model}`
      );
    }

    fs.rmSync(dir, { recursive: true, force: true });
  });

  await t.test('6.8 honors a reasoning winner overlay while preserving legacy fallback behavior', () => {
    const fallback = resolveTemplateSelection('Paid_Media', 'B2B');
    const assisted = resolveTemplateSelection('Paid_Media', 'B2B', {
      reasoning: {
        winner: {
          overlay_key: 'saas',
          retrieval_filters: { tenant_scope: 'tenant-alpha-001' },
        },
      },
    });

    assert.equal(fallback.overlayDoc, null);
    assert.match(assisted.overlayDoc || '', /overlay-saas/i);
  });

});

// ── Phase 109: resolveSkeleton overlay tests ─────────────────────────────────

test('resolveSkeleton returns overlay PROMPTS.md content when overlaySlug supplied and file exists', () => {
  const dir = makeTmpDir();
  try {
    const overlayPath = path.join(dir, 'SKELETONS', 'industries', 'travel', 'Paid_Media', 'PROMPTS.md');
    fs.mkdirSync(path.dirname(overlayPath), { recursive: true });
    fs.writeFileSync(overlayPath, '# Travel Paid_Media Overlay Prompt\n\nOverlay content.', 'utf8');

    const result = resolveSkeleton('Paid_Media', 'B2B', dir, 'travel');
    assert.ok(result.includes('Travel Paid_Media Overlay Prompt'), 'should return overlay PROMPTS.md content');
    assert.ok(!result.includes('_SKELETON-'), 'should NOT contain base skeleton filename indicator');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('resolveSkeleton falls back to base skeleton when overlaySlug supplied but overlay file absent', () => {
  const dir = makeTmpDir();
  try {
    const basePath = path.join(dir, 'SKELETONS', 'Paid_Media', '_SKELETON-b2b.md');
    fs.mkdirSync(path.dirname(basePath), { recursive: true });
    fs.writeFileSync(basePath, '# B2B Base Skeleton Content', 'utf8');

    const result = resolveSkeleton('Paid_Media', 'B2B', dir, 'travel');
    assert.ok(result.includes('B2B Base Skeleton Content'), 'should fall back to base skeleton when overlay absent');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('resolveSkeleton behavior unchanged when no overlaySlug supplied (backward compat)', () => {
  const dir = makeTmpDir();
  try {
    const basePath = path.join(dir, 'SKELETONS', 'Content_SEO', '_SKELETON-saas.md');
    fs.mkdirSync(path.dirname(basePath), { recursive: true });
    fs.writeFileSync(basePath, '# SaaS Content SEO Skeleton', 'utf8');

    const result = resolveSkeleton('Content_SEO', 'SaaS', dir);
    assert.ok(result.includes('SaaS Content SEO Skeleton'), 'should resolve base skeleton with no overlaySlug');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
