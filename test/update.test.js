const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
const { createTestEnvironment, runCLI, readManifest } = require('./setup.js');

const UPDATE_SCRIPT = path.resolve(__dirname, '../bin/update.cjs');

test('Suite 2: Agentic Patch Engine', async (t) => {
  await t.test('2.1 Local Override Protection', async () => {
    const env = createTestEnvironment();
    try {
      // Seed v0.9.0
      env.seedInstallForUpdate();
      
      // Create a local override to protect the index file
      const localDir = path.join(env.dir, '.mgsd-local');
      fs.mkdirSync(localDir, { recursive: true });
      fs.writeFileSync(path.join(localDir, 'MGSD-INDEX.md'), 'My Custom Layout');

      const { code, output } = await runCLI(UPDATE_SCRIPT, env.dir, []);
      
      assert.equal(code, 0, 'Exit code should be 0');
      assert.match(output, /MarkOS Update Engine/, 'Banner should reflect MarkOS branding');
      assert.match(output, /Skipped: 1 files \(\.mgsd-local\/ override active\)/, 'Output should mention skipping an override');

      const installedFile = path.join(env.dir, '.agent', 'marketing-get-shit-done', 'MGSD-INDEX.md');
      const content = fs.readFileSync(installedFile, 'utf8');
      
      // Because we skipped it, it should NOT have been updated to the real pkg file. 
      // It should remain exactly as we seeded it.
      assert.equal(content, 'Old Index v0.9.0', 'Installed file should be untouched due to override protection');
      
    } finally {
      env.cleanup();
    }
  });

  await t.test('2.2 Out-of-Band Modification Conflict (3-way merge)', async () => {
    const env = createTestEnvironment();
    try {
      env.seedInstallForUpdate();
      
      // Manually manipulate a file OUTSIDE of .mgsd-local/
      const rogueEditFile = path.join(env.dir, '.agent', 'marketing-get-shit-done', 'agents', 'mgsd-researcher.md');
      fs.writeFileSync(rogueEditFile, 'Rogue Manual Edit');

      // 3-way conflict resolution: choose 'k' to keep mine.
      const { code, output } = await runCLI(UPDATE_SCRIPT, env.dir, ['k']);
      
      assert.equal(code, 0, 'Exit code should be 0');
      assert.match(output, /conflict\(s\) — both you and the update changed these files/, 'Should detect conflict');
      assert.match(output, /Keeping your version/, 'Should print that you kept your version');

      const content = fs.readFileSync(rogueEditFile, 'utf8');
      assert.equal(content, 'Rogue Manual Edit', 'Rogue edit should be kept because user pressed k');
    } finally {
      env.cleanup();
    }
  });

  await t.test('2.3 Clean Update Application', async () => {
    const env = createTestEnvironment();
    try {
      env.seedInstallForUpdate();
      
      const { code, output } = await runCLI(UPDATE_SCRIPT, env.dir, []);
      
      assert.equal(code, 0, 'Exit code should be 0');
      assert.match(output, /Applied: \d+ files updated/, 'Output should confirm applied files');
      
      const mgsdDest = path.join(env.dir, '.agent', 'marketing-get-shit-done');
      
      // Ensure the NEW VERSION number is written down cleanly
      const manifest = readManifest(env.dir);
      assert.ok(manifest, 'Manifest must still exist');
      assert.notEqual(manifest.version, '0.9.0', 'Manifest version must be upgraded');
      assert.equal(manifest.previous_version, '0.9.0', 'Manifest must record that we came from 0.9.0');
      
      const versionFile = fs.readFileSync(path.join(mgsdDest, 'VERSION'), 'utf8').trim();
      assert.notEqual(versionFile, '0.9.0', 'Protocol VERSION file must match upgraded state');
    } finally {
      env.cleanup();
    }
  });
});
