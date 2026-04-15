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

// ─── Inline helpers (same pattern as test/skeleton-generator.test.js) ─────────
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

function createRuntimeContextMock(outputRoot) {
  return {
    getOutputRoot:  () => outputRoot,
    getTenantId:    () => 'test-tenant',
    getProjectSlug: () => 'test-project',
  };
}

// ─── Suite 110 ────────────────────────────────────────────────────────────────
test('Suite 110: getPackDiagnostics — null packSelection returns fallbackApplied=true',
  { todo: 'implement in plan 110-04' });

test('Suite 110: getPackDiagnostics — stub pack returns fallbackApplied=true',
  { todo: 'implement in plan 110-04' });

test('Suite 110: getPackDiagnostics — null basePack returns fallbackApplied=true',
  { todo: 'implement in plan 110-04' });

test('Suite 110: getPackDiagnostics — missing overlay file resolves base-only, fallbackApplied computed from base',
  { todo: 'implement in plan 110-04' });

test('Suite 110: getPackDiagnostics — operator_override preserved in diagnostics shape',
  { todo: 'implement in plan 110-04' });

test('Suite 110: handleApprove — packDiagnostics present in response alongside packSelection',
  { todo: 'implement in plan 110-04' });

test('Suite 110: handleApprove — packOverride in request body sets overrideReason=operator_override',
  { todo: 'implement in plan 110-04' });

test('Suite 110: handleApprove — seed.packSelection.overrideReason=operator_override preserved without re-resolve',
  { todo: 'implement in plan 110-04' });

test('Suite 110: getAvailablePackOptions — returns base and overlay arrays with slug/displayName/completeness',
  { todo: 'implement in plan 110-04' });

test('Suite 110: completeness graduation — all 9 authored packs report full across all disciplines',
  { todo: 'implement in plan 110-04' });
