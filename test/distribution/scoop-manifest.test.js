'use strict';

// Shape tests for the Scoop bucket manifest + bump script.
// No network calls; no external deps; structural assertions only.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const MANIFEST_PATH = path.join(REPO_ROOT, 'bucket', 'markos.json');
const BUMP_SCRIPT = path.join(REPO_ROOT, 'scripts', 'distribution', 'bump-scoop-manifest.cjs');
const PKG_JSON = path.join(REPO_ROOT, 'package.json');

function loadManifest() {
  const raw = fs.readFileSync(MANIFEST_PATH, 'utf8');
  return { raw, json: JSON.parse(raw) };
}

test('sc-01: bucket/markos.json parses as valid JSON', () => {
  const raw = fs.readFileSync(MANIFEST_PATH, 'utf8');
  assert.doesNotThrow(() => JSON.parse(raw), 'manifest must be valid JSON');
});

test('sc-02: manifest $schema points to ScoopInstaller schema.json', () => {
  const { json } = loadManifest();
  assert.ok(json['$schema'], 'manifest must have $schema field');
  assert.match(
    json['$schema'],
    /ScoopInstaller\/Scoop\/.*schema\.json$/,
    `$schema must point to ScoopInstaller/Scoop/.../schema.json (got ${json['$schema']})`
  );
});

test('sc-03: depends === "nodejs-lts" (NOT nodejs@22 — parity with Homebrew floating node)', () => {
  const { json } = loadManifest();
  assert.equal(json.depends, 'nodejs-lts', 'depends must be nodejs-lts for Homebrew parity');
  assert.ok(!/nodejs@22|node@22/.test(json.depends), 'depends must not pin a specific Node major');
});

test('sc-04: bin === "bin/install.cjs" (matches package.json bin.markos)', () => {
  const { json } = loadManifest();
  const pkg = JSON.parse(fs.readFileSync(PKG_JSON, 'utf8'));
  assert.equal(json.bin, 'bin/install.cjs', 'manifest bin must match package.json bin.markos');
  // Cross-check package.json bin mapping agrees with manifest
  const pkgBin = typeof pkg.bin === 'string' ? pkg.bin : pkg.bin && pkg.bin.markos;
  assert.ok(pkgBin, 'package.json must expose bin.markos');
  // strip any leading "./" from package.json bin path
  const normalized = pkgBin.replace(/^\.\/?/, '');
  assert.equal(json.bin, normalized, `manifest.bin (${json.bin}) must equal package.json bin.markos (${normalized})`);
});

test('sc-05: post_install is an array and runs "npm install --production"', () => {
  const { json } = loadManifest();
  assert.ok(Array.isArray(json.post_install), 'post_install must be an array');
  assert.ok(json.post_install.length >= 1, 'post_install must have at least one step');
  const joined = json.post_install.join(' ');
  assert.match(joined, /npm install --production/, 'post_install must run npm install --production');
  assert.match(joined, /\$dir/, 'post_install should reference Scoop $dir install path');
});

test('sc-06: checkver.url points to registry.npmjs.org/markos/latest + jsonpath $.version', () => {
  const { json } = loadManifest();
  assert.ok(json.checkver && typeof json.checkver === 'object', 'checkver must be an object');
  assert.equal(
    json.checkver.url,
    'https://registry.npmjs.org/markos/latest',
    'checkver.url must target npm registry /markos/latest'
  );
  assert.equal(json.checkver.jsonpath, '$.version', 'checkver.jsonpath must be $.version');
});

test('sc-07: autoupdate.url uses $version placeholder; autoupdate.hash derives from registry', () => {
  const { json } = loadManifest();
  assert.ok(json.autoupdate && typeof json.autoupdate === 'object', 'autoupdate must be an object');
  assert.match(
    json.autoupdate.url,
    /\$version/,
    `autoupdate.url must contain $version placeholder (got ${json.autoupdate.url})`
  );
  assert.match(
    json.autoupdate.url,
    /^https:\/\/registry\.npmjs\.org\/markos\/-\/markos-\$version\.tgz$/,
    'autoupdate.url must match the npm tarball pattern'
  );
  assert.ok(json.autoupdate.hash && typeof json.autoupdate.hash === 'object', 'autoupdate.hash must be an object');
  assert.match(
    json.autoupdate.hash.url,
    /registry\.npmjs\.org\/markos\/\$version/,
    'autoupdate.hash.url must target registry.npmjs.org/markos/$version'
  );
});

test('sc-08: bump script loads without throw and exports expected helpers', () => {
  assert.ok(fs.existsSync(BUMP_SCRIPT), 'bump script must exist on disk');
  const src = fs.readFileSync(BUMP_SCRIPT, 'utf8');
  // package.json referenced (reads version as source of truth)
  assert.match(src, /package\.json/, 'bump script must reference package.json');
  // Uses JSON.parse + JSON.stringify (structural rewrite, not regex)
  assert.match(src, /JSON\.parse/, 'bump script must use JSON.parse');
  assert.match(src, /JSON\.stringify/, 'bump script must use JSON.stringify');
  // Loads without throwing
  let mod;
  assert.doesNotThrow(() => { mod = require(BUMP_SCRIPT); }, 'bump script must load without throwing');
  assert.equal(typeof mod.readPackageVersion, 'function', 'exports readPackageVersion');
  assert.equal(typeof mod.tarballUrl, 'function', 'exports tarballUrl');
  assert.equal(typeof mod.rewriteManifest, 'function', 'exports rewriteManifest');
});

test('sc-09: required Scoop manifest fields are all present', () => {
  const { json } = loadManifest();
  const required = ['version', 'description', 'homepage', 'license', 'url', 'hash', 'bin', 'depends', 'extract_dir', 'checkver', 'autoupdate'];
  for (const field of required) {
    assert.ok(
      Object.prototype.hasOwnProperty.call(json, field),
      `manifest missing required field: ${field}`
    );
  }
  assert.match(json.hash, /^sha256:[0-9a-f]{64}$/, 'hash must be "sha256:" + 64 hex chars');
  assert.match(
    json.url,
    /^https:\/\/registry\.npmjs\.org\/markos\/-\/markos-[0-9]+\.[0-9]+\.[0-9]+\.tgz$/,
    'url must match npm tarball pattern with semver'
  );
});

test('sc-10: rewriteManifest correctly updates version/url/hash without mutating input', () => {
  const { rewriteManifest, tarballUrl } = require(BUMP_SCRIPT);
  const { json: before } = loadManifest();
  const frozenBefore = JSON.parse(JSON.stringify(before));
  const fakeSha = 'a'.repeat(64);
  const after = rewriteManifest(before, { version: '9.9.9', sha256: fakeSha });
  // Input not mutated
  assert.deepEqual(before, frozenBefore, 'rewriteManifest must not mutate input');
  // Output fields updated
  assert.equal(after.version, '9.9.9');
  assert.equal(after.url, tarballUrl('9.9.9'));
  assert.equal(after.hash, `sha256:${fakeSha}`);
  // Structural fields preserved
  assert.equal(after.bin, before.bin);
  assert.equal(after.depends, before.depends);
  assert.deepEqual(after.checkver, before.checkver);
  assert.deepEqual(after.autoupdate, before.autoupdate);
});
