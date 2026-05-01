'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');
const assert = require('node:assert/strict');

const ROOT = process.cwd();
const SCRIPT_PATH = path.join(ROOT, 'scripts/ci/check-preset-parity.cjs');
const REAL_BIN_DIR = path.join(ROOT, 'bin/lib/presets');
const REAL_AGENT_DIR = path.join(ROOT, '.agent/markos/templates/presets');

function mkTmpDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function writeJson(dir, fileName, value, rawOverride) {
  fs.mkdirSync(dir, { recursive: true });
  const payload = rawOverride ?? `${JSON.stringify(value, null, 2)}\n`;
  fs.writeFileSync(path.join(dir, fileName), payload, 'utf8');
}

function copyTree(srcDir, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyTree(srcPath, destPath);
      continue;
    }
    fs.copyFileSync(srcPath, destPath);
  }
}

function makeFixturePair() {
  const tmpRoot = mkTmpDir('preset-parity-');
  const binDir = path.join(tmpRoot, 'bin-presets');
  const agentDir = path.join(tmpRoot, 'agent-presets');
  fs.mkdirSync(binDir, { recursive: true });
  fs.mkdirSync(agentDir, { recursive: true });
  return { tmpRoot, binDir, agentDir };
}

function runInProcess(args) {
  const script = require(SCRIPT_PATH);
  const captured = { stdout: '', stderr: '' };
  const result = script.main(
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

function mutateRealShapePreset(filePath) {
  const payload = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  payload._description = `${payload._description} mutated`;
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

test('preset parity :: matching trees pass', () => {
  const { binDir, agentDir } = makeFixturePair();
  const baseline = { z: 3, nested: { b: 2, a: 1 } };

  writeJson(binDir, 'a.json', baseline);
  writeJson(agentDir, 'a.json', baseline);
  writeJson(binDir, 'b.json', { channel: 'email' });
  writeJson(agentDir, 'b.json', { channel: 'email' });

  const result = runCli(['--bin-dir', binDir, '--agent-dir', agentDir]);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /preset parity OK/);
});

test('preset parity :: missing file in agent fails', () => {
  const { binDir, agentDir } = makeFixturePair();
  writeJson(binDir, 'a.json', { value: 1 });

  const result = runCli(['--bin-dir', binDir, '--agent-dir', agentDir]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /missing in/);
  assert.match(result.stderr, /a\.json/);
});

test('preset parity :: extra file in agent fails', () => {
  const { binDir, agentDir } = makeFixturePair();
  writeJson(binDir, 'a.json', { value: 1 });
  writeJson(agentDir, 'a.json', { value: 1 });
  writeJson(agentDir, 'b.json', { value: 2 });

  const result = runCli(['--bin-dir', binDir, '--agent-dir', agentDir]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /extra in/);
  assert.match(result.stderr, /b\.json/);
});

test('preset parity :: content diff fails with snippet', () => {
  const { binDir, agentDir } = makeFixturePair();
  writeJson(binDir, 'a.json', { value: 1 });
  writeJson(agentDir, 'a.json', { value: 2 });

  const result = runCli(['--bin-dir', binDir, '--agent-dir', agentDir]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /content diverges/);
  assert.match(result.stderr, /@@ line/);
});

test('preset parity :: key order tolerated by default', () => {
  const { binDir, agentDir } = makeFixturePair();
  writeJson(binDir, 'ordered.json', { a: 1, b: 2 }, '{\n  "a": 1,\n  "b": 2\n}\n');
  writeJson(agentDir, 'ordered.json', { b: 2, a: 1 }, '{\n  "b": 2,\n  "a": 1\n}\n');

  const result = runCli(['--bin-dir', binDir, '--agent-dir', agentDir]);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /preset parity OK/);
});

test('preset parity :: --strict rejects key order drift', () => {
  const { binDir, agentDir } = makeFixturePair();
  writeJson(binDir, 'ordered.json', { a: 1, b: 2 }, '{\n  "a": 1,\n  "b": 2\n}\n');
  writeJson(agentDir, 'ordered.json', { b: 2, a: 1 }, '{\n  "b": 2,\n  "a": 1\n}\n');

  const result = runCli(['--strict', '--bin-dir', binDir, '--agent-dir', agentDir]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /content diverges/);
});

test('preset parity :: real prod trees match', () => {
  const result = runCli([]);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /preset parity OK: 5\/5 files match/);
});

test('preset parity :: real-shape negative-drift regression', () => {
  const tmpRoot = mkTmpDir('preset-parity-real-');
  const realBin = path.join(tmpRoot, 'real-bin');
  const realAgent = path.join(tmpRoot, 'real-agent');
  copyTree(REAL_BIN_DIR, realBin);
  copyTree(REAL_AGENT_DIR, realAgent);

  const target = path.join(realAgent, 'b2b-saas.json');
  mutateRealShapePreset(target);

  const result = runCli(['--bin-dir', realBin, '--agent-dir', realAgent]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /content diverges/);
  assert.match(result.stderr, /b2b-saas\.json/);
});

test('preset parity :: in-process fallback keeps behavior under sandboxed spawnSync', () => {
  const script = require(SCRIPT_PATH);
  const { binDir, agentDir } = makeFixturePair();
  writeJson(binDir, 'a.json', { value: 1 });
  writeJson(agentDir, 'a.json', { value: 1 });

  const captured = { stdout: '', stderr: '' };
  const result = script.main(
    ['node', SCRIPT_PATH, '--bin-dir', binDir, '--agent-dir', agentDir],
    {
      stdout(message) {
        captured.stdout += `${message}\n`;
      },
      stderr(message) {
        captured.stderr += `${message}\n`;
      },
    },
  );

  assert.equal(result.exitCode, 0);
  assert.match(captured.stdout, /preset parity OK/);
});
