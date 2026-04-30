'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '../../..');
const MANIFEST_DIR = path.join(ROOT, 'winget-pkgs', 'manifests', 'm', 'markos', 'markos', 'PLACEHOLDER_VERSION');
const SCRIPT = path.join(ROOT, 'scripts', 'distribution', 'bump-winget-manifest.cjs');
const bumpWinget = require(SCRIPT);

const files = [
  'markos.markos.yaml',
  'markos.markos.installer.yaml',
  'markos.markos.locale.en-US.yaml',
];

function read(name) {
  return fs.readFileSync(path.join(MANIFEST_DIR, name), 'utf8');
}

test('204.1 winget placeholder manifest files exist', () => {
  for (const file of files) {
    assert.equal(fs.existsSync(path.join(MANIFEST_DIR, file)), true, `${file} should exist`);
  }
});

test('204.1 winget manifests share the package identifier', () => {
  for (const file of files) {
    assert.match(read(file), /^PackageIdentifier:\s*markos\.markos$/m, `${file} identifier`);
  }
});

test('204.1 winget version manifest only declares version metadata', () => {
  const yaml = read('markos.markos.yaml');
  assert.match(yaml, /^ManifestType:\s*version$/m);
  assert.doesNotMatch(yaml, /InstallerSha256|InstallerUrl|PackageLocale/);
});

test('204.1 winget installer manifest declares hash, URL, architecture, and OS floor', () => {
  const yaml = read('markos.markos.installer.yaml');
  assert.match(yaml, /InstallerSha256:\s*PLACEHOLDER_SHA256/);
  assert.match(yaml, /InstallerUrl:\s*https:\/\/registry\.npmjs\.org\/markos\/-\/markos-PLACEHOLDER_VERSION\.tgz/);
  assert.match(yaml, /Architecture:\s*x64/);
  assert.match(yaml, /MinimumOSVersion:\s*10\.0\.17763\.0/);
});

test('204.1 winget locale manifest declares publisher, package name, and license', () => {
  const yaml = read('markos.markos.locale.en-US.yaml');
  assert.match(yaml, /^Publisher:\s*Inarcus$/m);
  assert.match(yaml, /^PackageName:\s*MarkOS$/m);
  assert.match(yaml, /^License:\s*MIT$/m);
});

test('204.1 winget manifests declare schema 1.6.0', () => {
  for (const file of files) {
    assert.match(read(file), /^ManifestVersion:\s*1\.6\.0$/m, `${file} schema`);
  }
});

test('204.1 winget bump script dry-run renders three replaced manifests', () => {
  const opts = bumpWinget.parseArgs([
    '--dry-run',
    '--version',
    '1.2.3',
    '--sha256',
    'abc123',
  ]);

  assert.equal(opts.dryRun, true);
  const rendered = bumpWinget.renderManifests({ version: opts.version, sha256: opts.sha256 });
  assert.deepEqual(Object.keys(rendered).sort(), files.slice().sort());
  for (const content of Object.values(rendered)) {
    assert.match(content, /PackageVersion:\s*1\.2\.3/);
    assert.doesNotMatch(content, /PLACEHOLDER_VERSION/);
  }
  assert.match(rendered['markos.markos.installer.yaml'], /InstallerSha256:\s*abc123/);
  assert.doesNotMatch(rendered['markos.markos.installer.yaml'], /PLACEHOLDER_SHA256/);
});

test('204.1 winget bump script output is deterministic for the same inputs', () => {
  const first = bumpWinget.renderManifests({ version: 'v1.2.3', sha256: 'abc123' });
  const second = bumpWinget.renderManifests({ version: '1.2.3', sha256: 'abc123' });
  assert.deepEqual(first, second);
});
