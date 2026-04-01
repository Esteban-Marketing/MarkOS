const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { createTestEnvironment, runCLI, readManifest } = require('./setup.js');

const INSTALL_SCRIPT = path.resolve(__dirname, '../bin/install.cjs');

test('Suite 1: Interactive Install Wizard', async (t) => {
  await t.test('1.0 Node runtime guard rejects versions below 20.16.0', async () => {
    const env = createTestEnvironment();
    try {
      const { code, output } = await runCLI(
        INSTALL_SCRIPT,
        env.dir,
        [],
        { env: { MARKOS_NODE_VERSION_OVERRIDE: '20.15.0' } }
      );

      assert.equal(code, 1, 'Install should fail fast when runtime Node is below supported floor');
      assert.match(output, /requires Node\.js >= 20\.16\.0/);
      assert.match(output, /Current version: 20\.15\.0/);
    } finally {
      env.cleanup();
    }
  });

  await t.test('1.1 Standalone Clean Install', async () => {
    const env = createTestEnvironment();
    try {
      const { code, output } = await runCLI(INSTALL_SCRIPT, env.dir, []);
      
      assert.equal(code, 0, 'Exit code should be 0');
      assert.match(output, /MarkOS protocol files installed/);
      assert.match(output, /Smart defaults applied/);
      
      const markosDest = path.join(env.dir, '.agent', 'markos');
      assert.ok(fs.existsSync(markosDest), 'MarkOS directory should safely copy into temp context');
      assert.ok(fs.existsSync(path.join(markosDest, 'VERSION')), 'VERSION file correctly copied');
      
      const manifest = readManifest(env.dir);
      assert.ok(manifest, '.markos-install-manifest.json is missing');
      assert.equal(manifest.project_name, path.basename(env.dir));
      assert.equal(manifest.location, 'project');
      assert.ok(manifest.project_slug, 'Manifest should capture the inferred project slug');
      assert.ok(manifest.file_hashes, 'Manifest lacks file_hashes map for updates');
      assert.ok(fs.existsSync(path.join(env.dir, '.markos-project.json')), 'Installer should write .markos-project.json');

      const gitignore = fs.readFileSync(path.join(env.dir, '.gitignore'), 'utf8');
      assert.match(gitignore, /# >>> MarkOS private local artifacts >>>/);
      assert.match(gitignore, /\.markos-local\//);
      assert.match(gitignore, /\.markos-local\//);
      assert.match(gitignore, /\.markos-install-manifest\.json/);
      assert.match(gitignore, /\.markos-install-manifest\.json/);
      assert.match(gitignore, /\.markos-project\.json/);
      assert.match(gitignore, /\.markos-project\.json/);
      assert.match(gitignore, /onboarding-seed\.json/);
    } finally {
      env.cleanup();
    }
  });

  await t.test('1.1.1 CLI flags override defaults cleanly', async () => {
    const env = createTestEnvironment();
    try {
      const { code, output } = await runCLI(INSTALL_SCRIPT, env.dir, [], {
        args: ['--yes', '--project-name', 'Flag Client', '--no-onboarding', '--project'],
      });

      assert.equal(code, 0, 'Flag-driven install should succeed');
      assert.match(output, /Project: Flag Client/);
      assert.match(output, /Onboarding auto-launch: No/);

      const manifest = readManifest(env.dir);
      assert.equal(manifest.project_name, 'Flag Client');
      assert.equal(manifest.location, 'project');
    } finally {
      env.cleanup();
    }
  });

  await t.test('1.1.2 Existing .gitignore receives managed block once', async () => {
    const env = createTestEnvironment();
    try {
      const gitignorePath = path.join(env.dir, '.gitignore');
      fs.writeFileSync(gitignorePath, ['node_modules/', '.env'].join('\n'));

      const first = await runCLI(INSTALL_SCRIPT, env.dir, [], {
        args: ['--yes', '--project-name', 'GitignoreClient', '--no-onboarding'],
      });
      assert.equal(first.code, 0, 'Initial install should succeed');

      const firstContent = fs.readFileSync(gitignorePath, 'utf8');
      const marker = '# >>> MarkOS private local artifacts >>>';
      assert.equal((firstContent.match(new RegExp(marker, 'g')) || []).length, 1, 'Managed block should be appended once');
      assert.match(first.output, /\.gitignore updated with private local artifact protections/);

      // Re-run install flow after simulating missing MarkOS install to verify idempotent behavior.
      fs.rmSync(path.join(env.dir, '.agent', 'markos'), { recursive: true, force: true });
      const second = await runCLI(INSTALL_SCRIPT, env.dir, [], {
        args: ['--yes', '--project-name', 'GitignoreClient', '--no-onboarding'],
      });
      assert.equal(second.code, 0, 'Second install should succeed');

      const secondContent = fs.readFileSync(gitignorePath, 'utf8');
      assert.equal((secondContent.match(new RegExp(marker, 'g')) || []).length, 1, 'Managed block must remain unique across repeated installs');
    } finally {
      env.cleanup();
    }
  });

  await t.test('1.2 GSD Co-existence Install', async () => {
    const env = createTestEnvironment();
    try {
      env.seedGSD();
      
      const { code, output } = await runCLI(INSTALL_SCRIPT, env.dir, [], {
        args: ['--yes', '--project-name', 'GsdClient', '--no-onboarding'],
      });
      
      assert.equal(code, 0, 'Exit code should be 0');
      assert.match(output, /Existing GSD install detected/);
      assert.match(output, /MarkOS skills co-exist with GSD/);
      
      const markosDest = path.join(env.dir, '.agent', 'markos');
      assert.ok(fs.existsSync(markosDest), 'MarkOS directory should install properly alongside existing GSD');
      
      // Critical check: Existing GSD is unbothered
      const gsdDest = path.join(env.dir, '.agent', 'get-shit-done', 'VERSION');
      assert.ok(fs.existsSync(gsdDest), 'GSD file was deleted or corrupted during co-existence patch');
    } finally {
      env.cleanup();
    }
  });

  await t.test('1.3 Existing MarkOS Detection', async () => {
    const env = createTestEnvironment();
    try {
      env.seedMarkOS();
      
      // Answers: Run update instead? (y/n): 'n'
      const { code, output } = await runCLI(INSTALL_SCRIPT, env.dir, ['n']);
      
      assert.equal(code, 0, 'Exit code should be 0');
      assert.match(output, /MarkOS is already installed in this project\./);
      assert.match(output, /Run update instead\?/);
    } finally {
      env.cleanup();
    }
  });

  await t.test('1.4 Existing install auto-hands off to update in non-interactive mode', async () => {
    const env = createTestEnvironment();
    try {
      env.seedInstallForUpdate();

      const { code, output } = await runCLI(INSTALL_SCRIPT, env.dir, []);

      assert.equal(code, 0, 'Existing install should hand off to update successfully');
      assert.match(output, /switching to `npx markos update` automatically/i);
      assert.match(output, /MarkOS Update Engine/);
    } finally {
      env.cleanup();
    }
  });
});
