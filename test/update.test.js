const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { createTestEnvironment, runCLI, readManifest } = require('./setup.js');

const UPDATE_SCRIPT = path.resolve(__dirname, '../bin/update.cjs');

test('Suite 2: Agentic Patch Engine', async (t) => {
  await t.test('2.1 Local Override Protection', async () => {
    const env = createTestEnvironment();
    try {
      // Seed v0.9.0
      env.seedInstallForUpdate();
      
      // Create a local override to protect the index file
      const localDir = path.join(env.dir, '.markos-local');
      fs.mkdirSync(localDir, { recursive: true });
      fs.writeFileSync(path.join(localDir, 'MARKOS-INDEX.md'), 'My Custom Layout');

      const { code, output } = await runCLI(UPDATE_SCRIPT, env.dir, []);
      
      assert.equal(code, 0, 'Exit code should be 0');
      assert.match(output, /MarkOS Update Engine/, 'Banner should reflect MarkOS branding');
      assert.match(output, /Skipped: 1 files \(\.markos-local\/ compatibility override active\)/, 'Output should mention skipping a compatibility override');

      const installedFile = path.join(env.dir, '.agent', 'markos', 'MARKOS-INDEX.md');
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
      
      // Manually manipulate a file OUTSIDE of .markos-local/
      const rogueEditFile = path.join(env.dir, '.agent', 'markos', 'agents', 'markos-researcher.md');
      fs.writeFileSync(rogueEditFile, 'Rogue Manual Edit');

      // 3-way conflict resolution: choose 'k' to keep mine.
      const { code, output } = await runCLI(UPDATE_SCRIPT, env.dir, ['k'], {
        env: { MARKOS_FORCE_INTERACTIVE: '1' },
      });
      
      assert.equal(code, 0, 'Exit code should be 0');
      assert.match(output, /conflict\(s\) — both you and the update changed these files/, 'Should detect conflict');
      assert.match(output, /Keeping your version/, 'Should print that you kept your version');

      const content = fs.readFileSync(rogueEditFile, 'utf8');
      assert.equal(content, 'Rogue Manual Edit', 'Rogue edit should be kept because user pressed k');
    } finally {
      env.cleanup();
    }
  });

  await t.test('2.2.1 Non-interactive conflicts keep local changes without hanging', async () => {
    const env = createTestEnvironment();
    try {
      env.seedInstallForUpdate();

      const rogueEditFile = path.join(env.dir, '.agent', 'markos', 'agents', 'markos-researcher.md');
      fs.writeFileSync(rogueEditFile, 'Rogue Manual Edit');

      const { code, output } = await runCLI(UPDATE_SCRIPT, env.dir, []);

      assert.equal(code, 0, 'Non-interactive conflict handling should exit cleanly');
      assert.match(output, /Non-interactive mode: keeping your version/);
      assert.equal(fs.readFileSync(rogueEditFile, 'utf8'), 'Rogue Manual Edit');
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
      
      const markosDest = path.join(env.dir, '.agent', 'markos');
      
      // Ensure the NEW VERSION number is written down cleanly
      const manifest = readManifest(env.dir);
      assert.ok(manifest, 'Manifest must still exist');
      assert.notEqual(manifest.version, '0.9.0', 'Manifest version must be upgraded');
      assert.equal(manifest.previous_version, '0.9.0', 'Manifest must record that we came from 0.9.0');
      assert.equal(manifest.bootstrap_model, 'vault-first', 'Manifest should carry forward vault-first bootstrap metadata');
      assert.equal(manifest.legacy_surface_policy, 'migration-only', 'Manifest should classify legacy surfaces as migration-only');
      assert.equal(manifest.install_profile, 'full', 'Legacy manifests should normalize to full profile by default');
      assert.equal(manifest.profile_schema_version, 1, 'Profile schema version should be normalized');
      assert.equal(manifest.components.onboarding_enabled, true, 'Normalized full profile should keep onboarding enabled');
      assert.equal(manifest.components.ui_enabled, true, 'Normalized full profile should keep UI enabled');
      assert.equal(manifest.vault_root, 'MarkOS-Vault', 'Manifest should persist canonical vault root');
      assert.equal(manifest.vault_home_note, 'MarkOS-Vault/Home/HOME.md', 'Manifest should persist canonical home note path');
      assert.ok(manifest.file_hashes?.VERSION, 'Manifest file hashes should be refreshed after update');
      
      const versionFile = fs.readFileSync(path.join(markosDest, 'VERSION'), 'utf8').trim();
      assert.notEqual(versionFile, '0.9.0', 'Protocol VERSION file must match upgraded state');

      assert.ok(fs.existsSync(path.join(env.dir, 'MarkOS-Vault')), 'Update should repair the canonical vault root when missing');
      assert.ok(fs.existsSync(path.join(env.dir, 'MarkOS-Vault', 'Home', 'HOME.md')), 'Update should repair the canonical home note when missing');
      assert.equal(fs.existsSync(path.join(env.dir, '.markos-local', 'MIR')), false, 'Update must not recreate MIR as a canonical default');
      assert.equal(fs.existsSync(path.join(env.dir, '.markos-local', 'MSP')), false, 'Update must not recreate MSP as a canonical default');
    } finally {
      env.cleanup();
    }
  });

  await t.test('2.4 Vault continuity repair preserves existing canonical home note edits', async () => {
    const env = createTestEnvironment();
    try {
      env.seedInstallForUpdate();

      const manifest = readManifest(env.dir);
      manifest.bootstrap_model = 'vault-first';
      manifest.legacy_surface_policy = 'migration-only';
      manifest.vault_root = 'MarkOS-Vault';
      manifest.vault_home_note = 'MarkOS-Vault/Home/HOME.md';
      fs.writeFileSync(path.join(env.dir, '.markos-install-manifest.json'), JSON.stringify(manifest, null, 2));

      const customHomeNotePath = path.join(env.dir, 'MarkOS-Vault', 'Home', 'HOME.md');
      fs.mkdirSync(path.dirname(customHomeNotePath), { recursive: true });
      fs.writeFileSync(customHomeNotePath, 'Custom vault home note');

      const { code, output } = await runCLI(UPDATE_SCRIPT, env.dir, []);

      assert.equal(code, 0, 'Exit code should be 0');
      assert.match(output, /Canonical vault continuity preserved/, 'Update summary should mention vault-first continuity');
      assert.equal(fs.readFileSync(customHomeNotePath, 'utf8'), 'Custom vault home note', 'Existing canonical home note edits should be preserved');
    } finally {
      env.cleanup();
    }
  });

  await t.test('2.5 Existing explicit profile metadata is preserved across update reruns', async () => {
    const env = createTestEnvironment();
    try {
      env.seedInstallForUpdate();

      const manifestPath = path.join(env.dir, '.markos-install-manifest.json');
      const manifest = readManifest(env.dir);
      manifest.install_profile = 'cli';
      manifest.profile_schema_version = 3;
      manifest.components = {
        onboarding_enabled: false,
        ui_enabled: false,
      };
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

      const { code } = await runCLI(UPDATE_SCRIPT, env.dir, []);
      assert.equal(code, 0, 'Update rerun should succeed with explicit profile metadata');

      const postUpdateManifest = readManifest(env.dir);
      assert.equal(postUpdateManifest.install_profile, 'cli');
      assert.equal(postUpdateManifest.profile_schema_version, 3);
      assert.equal(postUpdateManifest.components.onboarding_enabled, false);
      assert.equal(postUpdateManifest.components.ui_enabled, false);
    } finally {
      env.cleanup();
    }
  });
});
