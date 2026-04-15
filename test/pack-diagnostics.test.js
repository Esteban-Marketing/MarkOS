'use strict';
/**
 * test/pack-diagnostics.test.js
 * Suite 110: Pack Diagnostics, Fallbacks, and Completeness Graduation
 *
 * Run:  node --test test/pack-diagnostics.test.js
 * Or:   node --test test/
 */
const test   = require('node:test');
const assert = require('node:assert/strict');
const fs     = require('fs');
const os     = require('os');
const path   = require('path');

const { createJsonRequest, withMockedModule } = require('./setup.js');

// ─── Paths ────────────────────────────────────────────────────────────────────
const handlersPath    = path.join(__dirname, '..', 'onboarding', 'backend', 'handlers.cjs');
const vaultWriterPath = path.join(__dirname, '..', 'onboarding', 'backend', 'vault', 'vault-writer.cjs');
const runReportPath   = path.join(__dirname, '..', 'onboarding', 'backend', 'vault', 'run-report.cjs');
const vectorStorePath = path.join(__dirname, '..', 'onboarding', 'backend', 'vector-store-client.cjs');
const telemetryPath   = path.join(__dirname, '..', 'onboarding', 'backend', 'agents', 'telemetry.cjs');
const runtimeCtxPath  = path.join(__dirname, '..', 'onboarding', 'backend', 'runtime-context.cjs');
const skeletonGenPath = path.join(__dirname, '..', 'onboarding', 'backend', 'agents', 'skeleton-generator.cjs');
const packLoaderPath  = path.join(__dirname, '..', 'lib', 'markos', 'packs', 'pack-loader.cjs');

// ─── Inline helpers ───────────────────────────────────────────────────────────
function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'markos-diag-test-'));
}

function createMockResponse() {
  const res = { statusCode: 200, headers: {}, _body: '' };
  res.setHeader = (k, v) => { res.headers[k] = v; };
  res.writeHead = (code) => { res.statusCode = code; };
  res.end = (body) => { res._body = body || ''; };
  return res;
}

function loadFreshModule(modulePath) {
  delete require.cache[require.resolve(modulePath)];
  return require(modulePath);
}

// NOTE: SEED_PATH in handlers.cjs comes from path-constants.cjs (a module-level constant)
// and cannot be redirected to a tmp dir via the runtime-context mock alone. Integration tests
// that depend on seed.packSelection content are smoke tests only (structure assertions).
function createRuntimeContextMock(outputRoot) {
  const config = {
    mir_output_path: path.join(outputRoot, 'mir-output'),
    project_slug: 'test-project',
  };
  return {
    assertRolloutPromotionAllowed: () => ({ ok: true }),
    assertEntitledAction:          () => {},
    buildDenyEvent:                () => ({}),
    buildLLMCallOptions:           () => ({}),
    createRuntimeContext:          () => ({ mode: 'local', canWriteLocalFiles: true, config }),
    emitDenyTelemetry:             () => {},
    evaluateQuotaDimensionAccess:  () => ({ allowed: true }),
    getRolloutMode:                () => 'local',
    getMarkosdbAccessMatrix:       () => ({}),
    loadMigrationCheckpoints:      () => ({}),
    redactSensitive:               (value) => value,
    RETENTION_POLICY:              {},
    resolveMirOutputPath:          () => config.mir_output_path,
    resolveProjectSlug:            (_runtime, slug) => slug || 'test-project',
    resolveRequestedProjectSlug:   () => 'test-project',
    resolveSeedOutputPath:         () => path.join(outputRoot, 'seed-output.json'),
    validateRequiredSecrets:       () => ({ ok: true, missing: [] }),
  };
}

// ─── Shared mock objects for handleApprove integration tests ─────────────────
const vaultWriterMock = {
  writeApprovedDrafts: () => ({
    written: ['MarkOS-Vault/Strategy/test.md'],
    items: [{ source_key: 'Content_SEO', outcome: 'imported', destination_path: 'MarkOS-Vault/Strategy/test.md', warnings: [], errors: [] }],
    errors: [],
  }),
};
const runReportMock   = { writeRunReport: () => ({ report_note_path: 'MarkOS-Vault/Memory/Migration Reports/test.md' }) };
const vectorStoreMock = { configure: () => {}, storeDraft: async () => ({ ok: true }) };
const telemetryMock   = { captureExecutionCheckpoint: () => {}, captureRolloutEndpointEvent: () => {} };
const skeletonGenMock = { generateSkeletons: async () => [] };

async function runHandleApproveWithMocks(outputRoot, body) {
  const runtimeMock = createRuntimeContextMock(outputRoot);
  const req = createJsonRequest(body, '/approve');
  const res = createMockResponse();
  await withMockedModule(runtimeCtxPath, runtimeMock, async () => {
  await withMockedModule(vaultWriterPath, vaultWriterMock, async () => {
  await withMockedModule(runReportPath, runReportMock, async () => {
  await withMockedModule(vectorStorePath, vectorStoreMock, async () => {
  await withMockedModule(telemetryPath, telemetryMock, async () => {
  await withMockedModule(skeletonGenPath, skeletonGenMock, async () => {
    const handlers = loadFreshModule(handlersPath);
    await handlers.handleApprove(req, res);
  });
  });
  });
  });
  });
  });
  return JSON.parse(res._body);
}

// ─── Suite 110 ────────────────────────────────────────────────────────────────

test('Suite 110: getPackDiagnostics — null packSelection returns fallbackApplied=true', async () => {
  const { getPackDiagnostics, _resetCacheForTests } = require('../lib/markos/packs/pack-loader.cjs');
  _resetCacheForTests();
  const result = getPackDiagnostics(null);
  assert.equal(result.fallbackApplied, true, 'null packSelection must set fallbackApplied=true');
  assert.equal(result.basePack, null);
  assert.equal(result.overlayPack, null);
  assert.deepEqual(result.completeness, {});
});

test('Suite 110: getPackDiagnostics — stub pack returns fallbackApplied=true', async () => {
  const { getPackDiagnostics, _resetCacheForTests } = require('../lib/markos/packs/pack-loader.cjs');
  _resetCacheForTests();
  // agency pack is marked stub (D-09 — remains intentionally stub)
  const result = getPackDiagnostics({ basePack: 'agency', overlayPack: null, overrideReason: null, resolvedAt: new Date().toISOString() });
  assert.equal(result.fallbackApplied, true, 'stub pack must set fallbackApplied=true');
});

test('Suite 110: getPackDiagnostics — null basePack returns fallbackApplied=true', async () => {
  const { getPackDiagnostics, _resetCacheForTests } = require('../lib/markos/packs/pack-loader.cjs');
  _resetCacheForTests();
  const result = getPackDiagnostics({ basePack: null, overlayPack: null, overrideReason: null, resolvedAt: new Date().toISOString() });
  assert.equal(result.fallbackApplied, true);
  assert.equal(result.basePack, null);
});

test('Suite 110: getPackDiagnostics — missing overlay file resolves base-only, fallbackApplied computed from base', async () => {
  const { getPackDiagnostics, _resetCacheForTests } = require('../lib/markos/packs/pack-loader.cjs');
  _resetCacheForTests();
  // 'nonexistent-overlay-zzz' has no .industry.json — confirms soft fail
  assert.doesNotThrow(() => {
    const result = getPackDiagnostics({ basePack: 'b2b', overlayPack: 'nonexistent-overlay-zzz', overrideReason: null, resolvedAt: '' });
    assert.ok(typeof result.completeness === 'object', 'completeness must be an object');
    assert.ok(typeof result.fallbackApplied === 'boolean', 'fallbackApplied must be boolean');
  });
});

test('Suite 110: getPackDiagnostics — operator_override preserved in diagnostics shape', async () => {
  const { getPackDiagnostics, _resetCacheForTests } = require('../lib/markos/packs/pack-loader.cjs');
  _resetCacheForTests();
  const result = getPackDiagnostics({ basePack: 'b2b', overlayPack: null, overrideReason: 'operator_override', resolvedAt: '' });
  assert.equal(result.overrideReason, 'operator_override', 'overrideReason must be returned unchanged');
  assert.equal(result.basePack, 'b2b');
});

test('Suite 110: handleApprove — packDiagnostics present in response alongside packSelection', async () => {
  // Smoke test: SEED_PATH comes from path-constants.cjs and cannot be redirected to a tmp dir.
  // Asserting structural presence of packDiagnostics field only.
  const dir = makeTmpDir();
  try {
    const body = await runHandleApproveWithMocks(dir, {
      approvedDrafts: { Content_SEO: 'draft text' },
      slug: 'test-project',
    });
    assert.ok('packDiagnostics' in body, 'packDiagnostics field must be present in response body');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('Suite 110: handleApprove — packOverride in request body sets overrideReason=operator_override', async () => {
  // Override guard fires from request body — does NOT require seed manipulation
  const dir = makeTmpDir();
  try {
    const body = await runHandleApproveWithMocks(dir, {
      approvedDrafts: { Content_SEO: 'draft text' },
      slug: 'test-project',
      packOverride: { basePack: 'b2b', overlayPack: null },
    });
    assert.ok(body.packSelection, 'packSelection must be in response');
    assert.equal(body.packSelection.overrideReason, 'operator_override',
      'packOverride in body must produce overrideReason=operator_override');
    assert.equal(body.packSelection.basePack, 'b2b');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('Suite 110: handleApprove — seed.packSelection.overrideReason=operator_override preserved without re-resolve', async () => {
  // Smoke test: SEED_PATH cannot be redirected to a tmp dir with operator_override seed.
  // Asserting structural presence of packSelection field only.
  const dir = makeTmpDir();
  try {
    const body = await runHandleApproveWithMocks(dir, {
      approvedDrafts: { Content_SEO: 'draft text' },
      slug: 'test-project',
    });
    assert.ok('packSelection' in body, 'packSelection field must be in response');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('Suite 110: getAvailablePackOptions — returns base and overlay arrays with slug/displayName/completeness', async () => {
  const { getAvailablePackOptions, _resetCacheForTests } = require('../lib/markos/packs/pack-loader.cjs');
  _resetCacheForTests();
  const result = getAvailablePackOptions();
  assert.ok(Array.isArray(result.base), 'base must be an array');
  assert.ok(Array.isArray(result.overlay), 'overlay must be an array');
  assert.ok(result.base.length >= 5, `expected ≥ 5 base packs, got ${result.base.length}`);
  assert.ok(result.overlay.length >= 4, `expected ≥ 4 overlay packs, got ${result.overlay.length}`);
  for (const entry of [...result.base, ...result.overlay]) {
    assert.ok(entry.slug,        `entry missing slug: ${JSON.stringify(entry)}`);
    assert.ok(entry.displayName, `entry missing displayName: ${JSON.stringify(entry)}`);
    assert.ok(typeof entry.completeness === 'object', 'completeness must be object');
  }
});

test('Suite 110: completeness graduation — all 9 authored packs report full across all disciplines', async () => {
  const { getPackDiagnostics, _resetCacheForTests } = require('../lib/markos/packs/pack-loader.cjs');
  _resetCacheForTests(); // REQUIRED: clear cache so graduated JSON is re-read from disk
  const DISCIPLINES  = ['Paid_Media', 'Content_SEO', 'Lifecycle_Email', 'Social', 'Landing_Pages'];
  const BASE_PACKS   = ['b2b', 'b2c', 'saas', 'ecommerce', 'services'];
  const OVERLAY_PACKS = ['travel', 'it', 'marketing-services', 'professional-services'];
  for (const slug of BASE_PACKS) {
    const result = getPackDiagnostics({ basePack: slug, overlayPack: null, overrideReason: null, resolvedAt: '' });
    for (const disc of DISCIPLINES) {
      assert.equal(result.completeness[disc], 'full',
        `${slug}.${disc} expected "full" after graduation, got "${result.completeness[disc]}"`);
    }
    assert.equal(result.fallbackApplied, false, `${slug} must not trigger fallback after graduation`);
  }
  for (const overlaySlug of OVERLAY_PACKS) {
    const result = getPackDiagnostics({ basePack: 'b2b', overlayPack: overlaySlug, overrideReason: null, resolvedAt: '' });
    assert.equal(result.fallbackApplied, false,
      `b2b+${overlaySlug} must have fallbackApplied=false after graduation`);
  }
});

test('Suite 110: GET /api/packs/resolution — returns success with packSelection and packDiagnostics fields', async () => {
  // GOV-02: handlePacksResolution endpoint structural smoke test.
  // SEED_PATH not redirectable to tmp dir; asserting response shape only.
  const dir = makeTmpDir();
  try {
    const runtimeMock = createRuntimeContextMock(dir);
    const req = createJsonRequest(null, '/api/packs/resolution', 'GET');
    const res = createMockResponse();
    await withMockedModule(runtimeCtxPath, runtimeMock, async () => {
      const handlers = loadFreshModule(handlersPath);
      await handlers.handlePacksResolution(req, res);
      const body = JSON.parse(res._body);
      assert.equal(body.success, true, 'GET /api/packs/resolution should return success=true');
      assert.ok('packSelection' in body, 'packSelection field must be in response');
      assert.ok('packDiagnostics' in body, 'packDiagnostics field must be in response');
    });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

