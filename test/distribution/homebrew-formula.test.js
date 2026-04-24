'use strict';

// Phase 204 Plan 10 — Formula shape + bump script shape tests.
//
// Grep-asserts the static shape of Formula/markos.rb and
// scripts/distribution/bump-homebrew-formula.cjs. No network IO; no live bump.
// The live bump path is exercised by release CI (Plan 204-12).

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const FORMULA_PATH = path.join(ROOT, 'Formula', 'markos.rb');
const BUMP_PATH = path.join(ROOT, 'scripts', 'distribution', 'bump-homebrew-formula.cjs');

function readFormula() {
  return fs.readFileSync(FORMULA_PATH, 'utf-8');
}

function readBumpScript() {
  return fs.readFileSync(BUMP_PATH, 'utf-8');
}

test('form-01: Formula/markos.rb exists with class + desc + homepage + depends_on node', () => {
  assert.ok(fs.existsSync(FORMULA_PATH), 'Formula/markos.rb must exist');
  const text = readFormula();
  assert.match(text, /class Markos < Formula/, 'missing `class Markos < Formula`');
  assert.match(text, /^\s*desc\s+"[^"]+"/m, 'missing `desc "…"` line');
  assert.match(text, /^\s*homepage\s+"[^"]+"/m, 'missing `homepage "…"` line');
  assert.match(text, /depends_on\s+"node"/, 'missing `depends_on "node"`');
  assert.match(text, /license\s+"MIT"/, 'missing `license "MIT"`');
});

test('form-02: Formula does NOT pin node@22 (deprecation 2026-10-28)', () => {
  const text = readFormula();
  assert.doesNotMatch(text, /node@22/, 'Formula must use floating `node`, not `node@22`');
  // Also rule out any other pinned node@N to preserve floating LTS posture.
  assert.doesNotMatch(text, /depends_on\s+"node@\d+"/, 'no pinned node@N allowed');
});

test('form-03: Formula contains install block with std_npm_install_args + bin.install_symlink', () => {
  const text = readFormula();
  assert.match(text, /def install/, 'missing `def install`');
  assert.match(text, /Language::Node\.std_npm_install_args/, 'missing std_npm_install_args call');
  assert.match(text, /bin\.install_symlink/, 'missing bin.install_symlink');
});

test('form-04: Formula has test block asserting `markos --version` output', () => {
  const text = readFormula();
  assert.match(text, /test do/, 'missing `test do` block');
  assert.match(text, /markos --version/, 'test block must invoke `markos --version`');
  assert.match(text, /assert_match\s+"markos"/, 'test block must assert_match "markos"');
});

test('form-05: Formula url points at registry.npmjs.org/markos with sha256 field', () => {
  const text = readFormula();
  assert.match(text, /url\s+"https:\/\/registry\.npmjs\.org\/markos\/-\/markos-[^"]+\.tgz"/, 'url must target npm registry tarball');
  assert.match(text, /^\s*sha256\s+"[0-9a-f]{64}"/m, 'sha256 must be 64 hex chars (placeholder or real)');
});

test('form-06: bump script exists, requires cleanly, and exposes expected API', () => {
  assert.ok(fs.existsSync(BUMP_PATH), 'bump script must exist');
  const mod = require(BUMP_PATH);
  assert.equal(typeof mod.readVersion, 'function', 'readVersion export missing');
  assert.equal(typeof mod.tarballUrl, 'function', 'tarballUrl export missing');
  assert.equal(typeof mod.rewriteFormula, 'function', 'rewriteFormula export missing');
  assert.equal(typeof mod.fetchSha256, 'function', 'fetchSha256 export missing');
  assert.equal(
    mod.tarballUrl('9.9.9'),
    'https://registry.npmjs.org/markos/-/markos-9.9.9.tgz',
    'tarballUrl must build registry url'
  );
});

test('form-07: bump script reads package.json + uses crypto.createHash("sha256")', () => {
  const text = readBumpScript();
  assert.match(text, /package\.json/, 'bump script must reference package.json');
  assert.match(text, /crypto\.createHash\(['"]sha256['"]\)/, 'bump script must hash with sha256');
  assert.match(text, /registry\.npmjs\.org\/markos/, 'bump script must target npm registry markos');
});

test('form-08: rewriteFormula swaps url + sha256 without touching surrounding text', () => {
  const { rewriteFormula } = require(BUMP_PATH);
  const src = [
    'class Markos < Formula',
    '  desc "x"',
    '  homepage "https://example.test"',
    '  url "https://registry.npmjs.org/markos/-/markos-0.0.0.tgz"',
    '  sha256 "0000000000000000000000000000000000000000000000000000000000000000"',
    '  license "MIT"',
    'end',
    '',
  ].join('\n');
  const newUrl = 'https://registry.npmjs.org/markos/-/markos-9.9.9.tgz';
  const newSha = 'a'.repeat(64);
  const { after } = rewriteFormula(src, newUrl, newSha);
  assert.ok(after.includes(`url "${newUrl}"`), 'new url must land in output');
  assert.ok(after.includes(`sha256 "${newSha}"`), 'new sha256 must land in output');
  assert.ok(after.includes('class Markos < Formula'), 'class line preserved');
  assert.ok(after.includes('homepage "https://example.test"'), 'homepage preserved');
  assert.ok(!after.includes('markos-0.0.0.tgz'), 'old url must be replaced');
  assert.ok(!after.includes('"0000000000000000000000000000000000000000000000000000000000000000"'), 'old sha must be replaced');
});
