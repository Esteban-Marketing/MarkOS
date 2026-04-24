'use strict';

// Phase 204 Plan 12 Task 1: shape test for .github/workflows/release-cli.yml.
//
// Asserts the workflow file exists, references the expected trigger, 5-job
// DAG, cross-platform smoke matrix, secret usage, and the distribution
// action + script handles from Plans 204-10 and 204-11.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const WORKFLOW_PATH = path.resolve(
  __dirname,
  '..',
  '..',
  '.github',
  'workflows',
  'release-cli.yml',
);

function readWorkflow() {
  return fs.readFileSync(WORKFLOW_PATH, 'utf8');
}

test('rw-01: release-cli.yml exists and is non-empty', () => {
  assert.ok(fs.existsSync(WORKFLOW_PATH), 'release-cli.yml must exist');
  const text = readWorkflow();
  assert.ok(text.length > 200, 'release-cli.yml must be substantive');
});

test("rw-02: triggers on push of 'v*' tags", () => {
  const text = readWorkflow();
  assert.match(text, /on:\s*\n\s*push:\s*\n\s*tags:/);
  assert.match(text, /'v\*'/);
});

test('rw-03: defines all 5 jobs (verify, npm, brew, scoop, smoke)', () => {
  const text = readWorkflow();
  for (const job of ['verify:', 'npm:', 'brew:', 'scoop:', 'smoke:']) {
    assert.match(text, new RegExp(`^\\s{2}${job}`, 'm'), `missing job: ${job}`);
  }
});

test('rw-04: smoke job matrix spans ubuntu + macos + windows', () => {
  const text = readWorkflow();
  assert.match(text, /matrix:/);
  assert.match(text, /ubuntu-latest/);
  assert.match(text, /macos-latest/);
  assert.match(text, /windows-latest/);
});

test('rw-05: brew job uses mislav/bump-homebrew-formula-action', () => {
  const text = readWorkflow();
  assert.match(text, /mislav\/bump-homebrew-formula-action@v3/);
  assert.match(text, /formula-name:\s*markos/);
  assert.match(text, /formula-path:\s*Formula\/markos\.rb/);
  assert.match(text, /homebrew-tap:\s*markos\/homebrew-tap/);
});

test('rw-06: scoop job invokes bump-scoop-manifest.cjs with ref_name', () => {
  const text = readWorkflow();
  assert.match(text, /bump-scoop-manifest\.cjs/);
  assert.match(text, /markos\/scoop-bucket/);
  assert.match(text, /github\.ref_name/);
});

test('rw-07: verify job runs npm test AND npm run release:smoke', () => {
  const text = readWorkflow();
  assert.match(text, /npm test/);
  assert.match(text, /npm run release:smoke/);
});

test('rw-08: all 3 publish secrets referenced via ${{ secrets.* }}', () => {
  const text = readWorkflow();
  assert.match(text, /secrets\.NPM_TOKEN/);
  assert.match(text, /secrets\.HOMEBREW_TAP_TOKEN/);
  assert.match(text, /secrets\.SCOOP_BUCKET_TOKEN/);
  // Ensure we never hardcode token values (no assignment ending in a non-secret literal)
  assert.doesNotMatch(
    text,
    /NODE_AUTH_TOKEN:\s*['"]?npm_[A-Za-z0-9]+/,
    'NPM_TOKEN must never be inlined',
  );
});

test('rw-09: DAG is correct (verify → npm → brew+scoop → smoke)', () => {
  const text = readWorkflow();
  // npm needs verify
  assert.match(text, /npm:\s*[\s\S]*?needs:\s*\[verify\]/);
  // brew + scoop need npm
  assert.match(text, /brew:\s*[\s\S]*?needs:\s*\[npm\]/);
  assert.match(text, /scoop:\s*[\s\S]*?needs:\s*\[npm\]/);
  // smoke needs all 3 upstream channels
  assert.match(text, /smoke:\s*[\s\S]*?needs:\s*\[npm,\s*brew,\s*scoop\]/);
});

test('rw-10: smoke installs published version and runs markos --version', () => {
  const text = readWorkflow();
  assert.match(text, /npm install -g markos@\$\{\{ github\.ref_name \}\}/);
  assert.match(text, /markos --version/);
});
