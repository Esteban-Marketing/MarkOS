'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '../../..');
const SCRIPT = path.join(ROOT, 'scripts', 'distribution', 'bump-apt-package.cjs');
const APT_DOC = path.join(ROOT, 'docs', 'cli', 'installation-apt.md');
const WINGET_DOC = path.join(ROOT, 'docs', 'cli', 'installation-winget.md');

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function commandExists(command) {
  const checker = process.platform === 'win32' ? 'where' : 'which';
  const result = spawnSync(checker, [command], { stdio: 'ignore' });
  return result.status === 0;
}

test('204.1 apt bump script exists and can be required', () => {
  assert.equal(fs.existsSync(SCRIPT), true);
  assert.doesNotThrow(() => require(SCRIPT));
});

test('204.1 apt bump script exports a main entrypoint', () => {
  const mod = require(SCRIPT);
  assert.equal(typeof mod.main, 'function');
  assert.match(read(SCRIPT), /if \(require\.main === module\)/);
});

test('204.1 apt bump script references required apt environment variables', () => {
  const script = read(SCRIPT);
  for (const envName of ['MARKOS_APT_GPG_KEY', 'MARKOS_APT_GPG_PASSPHRASE', 'MARKOS_APT_REPO_HOST']) {
    assert.match(script, new RegExp(envName), `${envName} should be documented and referenced`);
  }
});

test('204.1 apt bump script invokes Debian packaging and signing tools', () => {
  const script = read(SCRIPT);
  for (const tool of ['dpkg-deb', 'dpkg-scanpackages', 'gpg']) {
    assert.match(script, new RegExp(tool), `${tool} should be referenced`);
  }
});

test('204.1 apt and winget docs exist with required headings', () => {
  for (const doc of [APT_DOC, WINGET_DOC]) {
    assert.equal(fs.existsSync(doc), true, `${doc} should exist`);
    const text = read(doc);
    for (const heading of ['## Install', '## Update', '## Verify', '## Uninstall']) {
      assert.match(text, new RegExp(`^${heading}$`, 'm'), `${heading} missing from ${doc}`);
    }
  }
});

test('204.1 apt docs use exact key URL', () => {
  assert.match(read(APT_DOC), /https:\/\/apt\.markos\.dev\/key\.gpg/);
});

test('204.1 apt docs use modern signed-by keyring flow', () => {
  const text = read(APT_DOC);
  assert.match(text, /signed-by=\/etc\/apt\/keyrings\/markos\.gpg/);
  assert.doesNotMatch(text, /apt-key add/);
});

test('204.1 apt dry-run integration builds package when explicitly enabled', { skip: !process.env.APT_INTEGRATION }, () => {
  for (const tool of ['tar', 'dpkg-deb', 'dpkg-scanpackages', 'gzip', 'gpg']) {
    assert.equal(commandExists(tool), true, `${tool} must be on PATH`);
  }

  const outputDir = path.join(ROOT, 'dist', 'apt-test');
  const result = spawnSync(process.execPath, [
    SCRIPT,
    '--dry-run',
    '--skip-sign',
    '--version',
    '3.3.0',
    '--output-dir',
    outputDir,
  ], { encoding: 'utf8' });

  assert.equal(result.status, 0, result.stderr);
  const payload = JSON.parse(result.stdout);
  assert.equal(fs.existsSync(payload.debPath), true);

  const info = spawnSync('dpkg-deb', ['--info', payload.debPath], { encoding: 'utf8' });
  assert.equal(info.status, 0, info.stderr);
  assert.match(info.stdout, /Package:\s+markos/);
  assert.match(info.stdout, /Version:\s+3\.3\.0/);
});
