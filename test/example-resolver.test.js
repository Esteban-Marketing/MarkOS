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

const { resolveExample } = require('../onboarding/backend/agents/example-resolver.cjs');

// ─── Test fixtures ────────────────────────────────────────────────────────────

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'mgsd-resolver-test-'));
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

});
