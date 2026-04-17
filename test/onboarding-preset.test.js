'use strict';
/**
 * test/onboarding-preset.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Verifies that preset-seeded onboarding completes non-interactively and
 * that TTFD (time-to-first-draft artifact on disk) is under 90 seconds for
 * the solopreneur bucket.
 *
 * Run: node --test test/onboarding-preset.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');

// ── Paths ─────────────────────────────────────────────────────────────────────
const PKG_ROOT = path.resolve(__dirname, '..');
const PRESET_LOADER = path.join(PKG_ROOT, 'bin', 'lib', 'preset-loader.cjs');
const PRESETS_DIR = path.join(PKG_ROOT, 'bin', 'lib', 'presets');
const TEMPLATES_PRESETS_DIR = path.join(PKG_ROOT, '.agent', 'markos', 'templates', 'presets');

const VALID_BUCKETS = ['b2b-saas', 'dtc', 'agency', 'local-services', 'solopreneur'];

// ── Helpers ───────────────────────────────────────────────────────────────────

function readPreset(dir, bucket) {
  const p = path.join(dir, `${bucket}.json`);
  assert.ok(fs.existsSync(p), `Preset file missing: ${p}`);
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

// ── Suite 1: Preset JSON structure ───────────────────────────────────────────

describe('Preset JSON files', () => {
  for (const bucket of VALID_BUCKETS) {
    describe(`bucket: ${bucket}`, () => {
      let preset;

      before(() => {
        preset = readPreset(PRESETS_DIR, bucket);
      });

      it('has _schema markos-preset-v1', () => {
        assert.equal(preset._schema, 'markos-preset-v1');
      });

      it('has matching _bucket', () => {
        assert.equal(preset._bucket, bucket);
      });

      it('has mir_seed with required fields', () => {
        assert.ok(preset.mir_seed, 'mir_seed missing');
        assert.ok(preset.mir_seed.company, 'mir_seed.company missing');
        assert.ok(preset.mir_seed.audience, 'mir_seed.audience missing');
        assert.ok(Array.isArray(preset.mir_seed.audience.pain_points), 'pain_points must be array');
        assert.ok(preset.mir_seed.audience.pain_points.length >= 2, 'need at least 2 pain_points');
        assert.ok(Array.isArray(preset.mir_seed.audience.success_criteria), 'success_criteria must be array');
      });

      it('has msp_seed with motion_templates', () => {
        assert.ok(preset.msp_seed, 'msp_seed missing');
        assert.ok(Array.isArray(preset.msp_seed.motion_templates), 'motion_templates must be array');
        assert.ok(preset.msp_seed.motion_templates.length >= 3, 'need at least 3 motion templates');
        for (const tpl of preset.msp_seed.motion_templates) {
          assert.ok(tpl.id, `template missing id`);
          assert.ok(tpl.name, `template ${tpl.id} missing name`);
          assert.ok(tpl.channel, `template ${tpl.id} missing channel`);
          assert.ok(tpl.pain, `template ${tpl.id} missing pain`);
        }
      });

      it('has brand_pack_placeholder with tone and voice_archetype', () => {
        assert.ok(preset.brand_pack_placeholder, 'brand_pack_placeholder missing');
        assert.ok(preset.brand_pack_placeholder.tone, 'brand_pack_placeholder.tone missing');
        assert.ok(preset.brand_pack_placeholder.voice_archetype, 'brand_pack_placeholder.voice_archetype missing');
      });

      it('has literacy_nodes with shared and diagnostics arrays', () => {
        assert.ok(preset.literacy_nodes, 'literacy_nodes missing');
        assert.ok(Array.isArray(preset.literacy_nodes.shared), 'literacy_nodes.shared must be array');
        assert.ok(preset.literacy_nodes.shared.length >= 3, 'need at least 3 shared literacy nodes');
        assert.ok(Array.isArray(preset.literacy_nodes.diagnostics), 'literacy_nodes.diagnostics must be array');
        assert.ok(preset.literacy_nodes.diagnostics.length >= 3, 'need at least 3 diagnostic nodes');
      });
    });
  }
});

// ── Suite 2: Mirror parity ────────────────────────────────────────────────────

describe('Template mirror parity', () => {
  for (const bucket of VALID_BUCKETS) {
    it(`${bucket} matches .agent/markos/templates/presets/${bucket}.json`, () => {
      const binPreset = readPreset(PRESETS_DIR, bucket);
      const tplPreset = readPreset(TEMPLATES_PRESETS_DIR, bucket);
      assert.deepEqual(binPreset, tplPreset, `Mirror mismatch for bucket "${bucket}"`);
    });
  }
});

// ── Suite 3: Preset loader module ────────────────────────────────────────────

describe('preset-loader.cjs', () => {
  const { loadPreset, applyPreset, validateBucket, VALID_PRESET_BUCKETS } = require(PRESET_LOADER);

  it('exports VALID_PRESET_BUCKETS with 5 entries', () => {
    assert.ok(Array.isArray(VALID_PRESET_BUCKETS));
    assert.equal(VALID_PRESET_BUCKETS.length, 5);
  });

  it('validateBucket returns valid=true for known buckets', () => {
    for (const b of VALID_BUCKETS) {
      assert.equal(validateBucket(b).valid, true, `Expected valid for ${b}`);
    }
  });

  it('validateBucket returns valid=false for unknown bucket', () => {
    assert.equal(validateBucket('unknown-bucket').valid, false);
    assert.ok(validateBucket('unknown-bucket').error);
  });

  it('loadPreset loads solopreneur preset', () => {
    const p = loadPreset('solopreneur');
    assert.equal(p._bucket, 'solopreneur');
    assert.ok(p.mir_seed);
  });

  it('loadPreset throws on invalid bucket', () => {
    assert.throws(() => loadPreset('not-a-bucket'), /Unknown preset bucket/);
  });

  it('applyPreset substitutes {{company_name}} placeholder', () => {
    const p = loadPreset('b2b-saas');
    const seed = applyPreset(p, { company_name: 'TestCo', product_name: 'TestProduct' });
    assert.equal(seed.company.name, 'TestCo');
    assert.equal(seed.product.name, 'TestProduct');
  });

  it('applyPreset sets _preset_bucket field', () => {
    const p = loadPreset('dtc');
    const seed = applyPreset(p);
    assert.equal(seed._preset_bucket, 'dtc');
  });

  it('applyPreset includes msp motion_templates', () => {
    const p = loadPreset('agency');
    const seed = applyPreset(p);
    assert.ok(Array.isArray(seed.msp.motion_templates));
    assert.ok(seed.msp.motion_templates.length >= 3);
  });
});

// ── Suite 4: TTFD < 90s for solopreneur ──────────────────────────────────────

describe('TTFD (time-to-first-draft-artifact) for solopreneur preset', () => {
  let tmpDir;

  before(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'markos-preset-ttfd-'));
  });

  after(() => {
    // Clean up tmp dir
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {}
  });

  it('solopreneur preset seed is written to disk in < 90s', { timeout: 95000 }, () => {
    const { loadPreset, applyPreset, writePresetSeed } = require(PRESET_LOADER);

    const seedPath = path.join(tmpDir, 'onboarding-seed.json');

    const t0 = Date.now();

    // Load preset (synchronous — exercises the full loader pipeline)
    const preset = loadPreset('solopreneur');
    assert.equal(preset._bucket, 'solopreneur', 'Loaded wrong preset');

    // Apply substitutions
    const seed = applyPreset(preset, {
      company_name: 'TTFD Test Creator',
      product_name: 'TTFD Test Product',
      creator_name: 'TTFD Test Creator',
    });

    // Write seed to disk (the "first draft artifact")
    writePresetSeed(seedPath, seed);

    const elapsedMs = Date.now() - t0;
    const elapsedSec = elapsedMs / 1000;

    // Verify file exists and is valid JSON
    assert.ok(fs.existsSync(seedPath), 'Seed file was not written to disk');
    const written = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
    assert.equal(written._preset_bucket, 'solopreneur', 'Written seed has wrong bucket');
    assert.ok(written._preset_applied_at, 'Written seed missing _preset_applied_at');

    // Verify TTFD constraint
    assert.ok(
      elapsedSec < 90,
      `TTFD exceeded 90s: ${elapsedSec.toFixed(2)}s (seed written in ${elapsedMs}ms)`
    );

    console.log(`  TTFD: ${elapsedSec.toFixed(3)}s (limit: 90s) — PASS`);
  });

  it('all 5 preset buckets can be loaded and seeded within 90s total', { timeout: 95000 }, () => {
    const { loadPreset, applyPreset, writePresetSeed } = require(PRESET_LOADER);
    const t0 = Date.now();

    for (const bucket of VALID_BUCKETS) {
      const seedPath = path.join(tmpDir, `onboarding-seed-${bucket}.json`);
      const preset = loadPreset(bucket);
      const seed = applyPreset(preset, { company_name: 'Test', product_name: 'Test', creator_name: 'Test', service_name: 'Test' });
      writePresetSeed(seedPath, seed);
      assert.ok(fs.existsSync(seedPath), `Seed missing for ${bucket}`);
    }

    const elapsedSec = (Date.now() - t0) / 1000;
    assert.ok(elapsedSec < 90, `All-bucket TTFD exceeded 90s: ${elapsedSec.toFixed(2)}s`);
    console.log(`  All-bucket TTFD: ${elapsedSec.toFixed(3)}s (limit: 90s) — PASS`);
  });
});

// ── Suite 5: CLI flag parsing ─────────────────────────────────────────────────

describe('CLI --preset flag parsing', () => {
  const { parseCliArgs, VALID_PRESET_BUCKETS } = require(path.join(PKG_ROOT, 'bin', 'cli-runtime.cjs'));

  it('VALID_PRESET_BUCKETS is exported', () => {
    assert.ok(Array.isArray(VALID_PRESET_BUCKETS));
    assert.equal(VALID_PRESET_BUCKETS.length, 5);
  });

  it('parseCliArgs parses --preset=solopreneur', () => {
    const result = parseCliArgs(['--preset=solopreneur']);
    assert.equal(result.preset, 'solopreneur');
  });

  it('parseCliArgs parses --preset=b2b-saas (inline)', () => {
    const result = parseCliArgs(['--preset=b2b-saas']);
    assert.equal(result.preset, 'b2b-saas');
  });

  it('parseCliArgs parses --preset <bucket> (space-separated)', () => {
    const result = parseCliArgs(['--preset', 'dtc']);
    assert.equal(result.preset, 'dtc');
  });

  it('preset defaults to null when not provided', () => {
    const result = parseCliArgs([]);
    assert.equal(result.preset, null);
  });

  it('preset does not conflict with other flags', () => {
    const result = parseCliArgs(['--preset=agency', '--yes', '--no-onboarding']);
    assert.equal(result.preset, 'agency');
    assert.equal(result.yes, true);
    assert.equal(result.noOnboarding, true);
  });
});
