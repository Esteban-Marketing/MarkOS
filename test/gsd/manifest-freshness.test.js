const test = require('node:test');
const assert = require('node:assert/strict');
const childProcess = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const { buildManifest, ensureTarget, repoRoot } = require('../../tools/gsd-refresh-manifest.cjs');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

test('64.3 GSD manifests stay fresh for every tracked shared and localized file', async () => {
  childProcess.execFileSync(process.execPath, ['tools/gsd-refresh-manifest.cjs', '--check'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });

  for (const target of ensureTarget('all')) {
    const expected = buildManifest(target);
    const current = readJson(target.manifestPath);

    assert.equal(typeof current.timestamp, 'string', `${path.relative(repoRoot, target.manifestPath)} should include a timestamp`);
    assert.equal(current.version, expected.version, `${path.relative(repoRoot, target.manifestPath)} should use the tree VERSION value`);
    assert.deepEqual(current.files, expected.files, `${path.relative(repoRoot, target.manifestPath)} should match live hashes for every tracked file`);
  }
});