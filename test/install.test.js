const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
const { createTestEnvironment, runCLI, readManifest } = require('./setup.js');

const INSTALL_SCRIPT = path.resolve(__dirname, '../bin/install.cjs');

test('Suite 1: Interactive Install Wizard', async (t) => {
  await t.test('1.1 Standalone Clean Install', async () => {
    const env = createTestEnvironment();
    try {
      // 1) Install location: '1' (This project only)
      // 2) Project/client name: 'TestClient'
      // 3) Launch onboarding: 'n'
      // 4) Proceed: 'y'
      const { code, output } = await runCLI(INSTALL_SCRIPT, env.dir, ['1', 'TestClient', 'n', 'y']);
      
      assert.equal(code, 0, 'Exit code should be 0');
      assert.match(output, /MarkOS protocol files installed/);
      
      const mgsdDest = path.join(env.dir, '.agent', 'marketing-get-shit-done');
      assert.ok(fs.existsSync(mgsdDest), 'MGSD directory should safely copy into temp context');
      assert.ok(fs.existsSync(path.join(mgsdDest, 'VERSION')), 'VERSION file correctly copied');
      
      const manifest = readManifest(env.dir);
      assert.ok(manifest, '.mgsd-install-manifest.json is missing');
      assert.equal(manifest.project_name, 'TestClient');
      assert.equal(manifest.location, 'project');
      assert.ok(manifest.file_hashes, 'Manifest lacks file_hashes map for updates');
    } finally {
      env.cleanup();
    }
  });

  await t.test('1.2 GSD Co-existence Install', async () => {
    const env = createTestEnvironment();
    try {
      env.seedGSD();
      
      const { code, output } = await runCLI(INSTALL_SCRIPT, env.dir, ['1', 'GsdClient', 'n', 'y']);
      
      assert.equal(code, 0, 'Exit code should be 0');
      assert.match(output, /Existing GSD install detected/);
      assert.match(output, /MarkOS skills co-exist with GSD/);
      
      const mgsdDest = path.join(env.dir, '.agent', 'marketing-get-shit-done');
      assert.ok(fs.existsSync(mgsdDest), 'MGSD directory should install properly alongside existing GSD');
      
      // Critical check: Existing GSD is unbothered
      const gsdDest = path.join(env.dir, '.agent', 'get-shit-done', 'VERSION');
      assert.ok(fs.existsSync(gsdDest), 'GSD file was deleted or corrupted during co-existence patch');
    } finally {
      env.cleanup();
    }
  });

  await t.test('1.3 Existing MGSD Detection', async () => {
    const env = createTestEnvironment();
    try {
      env.seedMGSD();
      
      // Answers: Run update instead? (y/n): 'n'
      const { code, output } = await runCLI(INSTALL_SCRIPT, env.dir, ['n']);
      
      assert.equal(code, 0, 'Exit code should be 0');
      assert.match(output, /MarkOS is already installed in this project\./);
      assert.match(output, /Run update instead\?/);
    } finally {
      env.cleanup();
    }
  });
});
