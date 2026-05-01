'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');
const assert = require('node:assert/strict');

const ROOT = process.cwd();
const SCRIPT_PATH = path.join(ROOT, 'scripts/verify/verify-phase-200.cjs');
const verifier = require(SCRIPT_PATH);

function mkTmpDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function ensureFile(root, relativePath, content = '') {
  const target = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content, 'utf8');
}

function appendFileLine(map, relativePath, line) {
  const current = map.get(relativePath) || '';
  map.set(relativePath, `${current}${line}\n`);
}

function buildCoverageExclusionList() {
  const rows = [
    ['test/agents/approval-gate.test.js', 'PERMANENT-EXCLUSION', 'n/a', 'Sandboxed full-suite run failed at file-runner spawn layer (EPERM); scoped phase suites run with --test-isolation=none.'],
    ['test/audit/hash-chain.test.js', 'PERMANENT-EXCLUSION', 'n/a', 'Sandboxed full-suite run failed before individual test execution because node:test worker spawn is blocked.'],
    ['test/auth/signup.test.js', 'PERMANENT-EXCLUSION', 'n/a', 'Broad baseline capture is tracked as a file-level exclusion under the Windows sandbox runner.'],
    ['test/cli/login.test.js', 'PERMANENT-EXCLUSION', 'n/a', 'Worker-process spawn fails under the baseline command in this environment; focused suites remain the canonical evidence.'],
    ['test/mcp/pipeline.test.js', 'PERMANENT-EXCLUSION', 'n/a', 'Full-suite sandbox baseline is non-executable with default worker isolation; verifier records the exclusion explicitly.'],
    ['test/mcp/server.test.js', 'PERMANENT-EXCLUSION', 'n/a', 'File-level EPERM in the broad baseline run; Phase 200.1 uses focused no-isolation MCP suites instead.'],
    ['test/onboarding-server.test.js', 'PERMANENT-EXCLUSION', 'n/a', 'Excluded from gate-4 baseline accounting because the broad command fails before content-level assertions begin.'],
    ['test/webhooks/signing.test.js', 'PERMANENT-EXCLUSION', 'n/a', 'Sandbox baseline worker spawn failure; covered by focused webhook verification commands in 200.1-05 and 200.1-06.'],
    ['test/webhooks/url-validator.test.js', 'PERMANENT-EXCLUSION', 'n/a', 'Sandbox baseline worker spawn failure; focused 200.1-01 suite is the operative verification artifact.'],
    ['test/webhooks/rotate-secret.test.js', 'PERMANENT-EXCLUSION', 'n/a', 'Sandbox baseline worker spawn failure; covered by focused no-isolation suite for 200.1-06 and 200.1-09.'],
  ];

  const lines = [
    '### Coverage Exclusion List',
    '',
    '| Test File | Status | Owner Phase | Rationale |',
    '|-----------|--------|-------------|-----------|',
  ];

  for (const row of rows) {
    lines.push(`| ${row[0]} | ${row[1]} | ${row[2]} | ${row[3]} |`);
  }

  return lines.join('\n');
}

function seedPassingFixture(root) {
  const files = new Map();

  for (const gate of verifier.GATES) {
    for (const check of gate.checks || []) {
      if (check.type === 'file') {
        appendFileLine(files, check.path, `fixture for ${check.path}`);
        continue;
      }
      if (check.type === 'grep') {
        appendFileLine(files, check.path, check.sample || 'sample');
        continue;
      }
      if (check.type === 'grep-any') {
        appendFileLine(files, check.path, check.sample || 'sample');
        continue;
      }
      if (check.type === 'coverage-exclusion-list') {
        appendFileLine(files, check.path, buildCoverageExclusionList());
      }
    }
  }

  for (const concern of verifier.CONCERNS) {
    for (const evidencePath of concern.evidence) {
      appendFileLine(files, evidencePath, `fixture for ${evidencePath}`);
    }
  }

  for (let index = 1; index <= 10; index += 1) {
    const summaryPath = `.planning/phases/200.1-saas-readiness-hardening/200.1-${String(index).padStart(2, '0')}-SUMMARY.md`;
    appendFileLine(files, summaryPath, `Summary ${index}`);
  }

  for (const [relativePath, content] of files.entries()) {
    ensureFile(root, relativePath, content);
  }
}

function runInProcess(args) {
  const captured = { stdout: '', stderr: '' };
  const result = verifier.main(
    ['node', SCRIPT_PATH, ...args],
    {
      stdout(message) {
        captured.stdout += `${message}\n`;
      },
      stderr(message) {
        captured.stderr += `${message}\n`;
      },
    },
  );

  return {
    status: result.exitCode,
    stdout: captured.stdout,
    stderr: captured.stderr,
    fallback: true,
    payload: result.payload,
  };
}

function runCli(args) {
  const result = spawnSync(process.execPath, [SCRIPT_PATH, ...args], {
    cwd: ROOT,
    encoding: 'utf8',
  });

  if (result.error && result.error.code === 'EPERM') {
    return runInProcess(args);
  }

  if (result.error) throw result.error;

  return {
    status: result.status,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    fallback: false,
  };
}

function parseDryRunOutput(result) {
  const raw = (result.stdout || '').trim();
  assert.notEqual(raw, '', 'expected JSON output from --dry-run');
  return JSON.parse(raw);
}

test('verify-phase-200 :: exports gate and concern registries', () => {
  assert.equal(verifier.GATES.length, 15);
  assert.equal(verifier.CONCERNS.length, 12);
  assert.deepEqual([...verifier.EMPTY_CHECKS_ALLOWLIST], ['load-tests']);
});

test('verify-phase-200 :: parseArgs handles dry-run and fixture-root', () => {
  const parsed = verifier.parseArgs(['node', SCRIPT_PATH, '--dry-run', '--fixture-root', 'C:\\tmp\\fixture']);
  assert.equal(parsed.dryRun, true);
  assert.equal(parsed.fixtureRoot, path.resolve('C:\\tmp\\fixture'));
});

test('verify-phase-200 :: checkGate passes on synthetic all-passing fixture', () => {
  const fixtureRoot = mkTmpDir('verify-phase-200-pass-');
  seedPassingFixture(fixtureRoot);

  const result = verifier.checkGate(fixtureRoot, verifier.GATES[0]);
  assert.equal(result.pass, true);
  assert.equal(result.missing.length, 0);
});

test('verify-phase-200 :: checkGate fails when one required file is missing', () => {
  const fixtureRoot = mkTmpDir('verify-phase-200-missing-');
  seedPassingFixture(fixtureRoot);
  fs.unlinkSync(path.join(fixtureRoot, 'contracts/openapi.json'));

  const result = verifier.checkGate(fixtureRoot, verifier.GATES[0]);
  assert.equal(result.pass, false);
  assert.ok(result.missing.length > 0);
});

test('verify-phase-200 :: dry-run works on synthetic pass fixture', () => {
  const fixtureRoot = mkTmpDir('verify-phase-200-dry-run-');
  seedPassingFixture(fixtureRoot);

  const result = runCli(['--dry-run', '--fixture-root', fixtureRoot]);
  assert.equal(result.status, 0);
  const payload = parseDryRunOutput(result);
  assert.equal(payload.verdict, 'PASS-with-deferred-items');
  assert.equal(payload.summary.gates_failed, 0);
  assert.equal(payload.summary.concerns_open, 0);
});

test('verify-phase-200 :: rationale-only deferred gate load-tests reports deferred with zero checks', () => {
  const fixtureRoot = mkTmpDir('verify-phase-200-empty-');

  const result = runCli(['--dry-run', '--fixture-root', fixtureRoot]);
  assert.equal(result.status, 1);
  const payload = parseDryRunOutput(result);
  assert.equal(payload.gates['7'].status, 'deferred-with-rationale');
  assert.equal(payload.gates['7'].checks, 0);
});

test('verify-phase-200 :: deferred-with-followup gates fail when artifact markers are missing', () => {
  const fixtureRoot = mkTmpDir('verify-phase-200-no-followup-');
  seedPassingFixture(fixtureRoot);
  fs.unlinkSync(path.join(fixtureRoot, '.planning/phases/200-saas-readiness-wave-0/200-VERIFICATION.md'));

  const result = runCli(['--dry-run', '--fixture-root', fixtureRoot]);
  assert.equal(result.status, 1);
  const payload = parseDryRunOutput(result);
  assert.equal(payload.gates['4'].status, 'fail');
  assert.equal(payload.gates['6'].status, 'fail');
  assert.equal(payload.gates['14'].status, 'fail');
});

test('verify-phase-200 :: deferred-with-followup gates report deferred when markers exist', () => {
  const fixtureRoot = mkTmpDir('verify-phase-200-with-followup-');
  seedPassingFixture(fixtureRoot);

  const result = runCli(['--dry-run', '--fixture-root', fixtureRoot]);
  assert.equal(result.status, 0);
  const payload = parseDryRunOutput(result);
  assert.equal(payload.gates['4'].status, 'deferred-with-followup');
  assert.equal(payload.gates['6'].status, 'deferred-with-followup');
  assert.equal(payload.gates['14'].status, 'deferred-with-followup');
});

test('verify-phase-200 :: concern map detects closed and open evidence sets', () => {
  const fixtureRoot = mkTmpDir('verify-phase-200-concerns-');
  seedPassingFixture(fixtureRoot);

  const initial = parseDryRunOutput(runCli(['--dry-run', '--fixture-root', fixtureRoot]));
  assert.equal(initial.concerns.H1.status, 'closed');
  assert.equal(initial.concerns.H7.status, 'closed');

  fs.unlinkSync(path.join(fixtureRoot, 'lib/markos/webhooks/url-validator.cjs'));
  const afterDelete = parseDryRunOutput(runCli(['--dry-run', '--fixture-root', fixtureRoot]));
  assert.equal(afterDelete.concerns.H1.status, 'open');
  assert.equal(afterDelete.concerns.H7.status, 'closed');
});
