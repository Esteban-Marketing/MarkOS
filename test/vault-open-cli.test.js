const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { parseCliArgs } = require('../bin/cli-runtime.cjs');
const { createTestEnvironment, withMockedModule } = require('./setup.js');

function loadFresh(modulePath) {
  delete require.cache[require.resolve(modulePath)];
  return require(modulePath);
}

test('vault:open is routed through the CLI parser with Home-note default', () => {
  const parsed = parseCliArgs(['vault:open']);
  assert.equal(parsed.command, 'vault:open');
  assert.equal(parsed.vaultOpenTarget, 'home');
});

test('vault:open parser accepts root override', () => {
  const parsed = parseCliArgs(['vault:open', '--root']);
  assert.equal(parsed.command, 'vault:open');
  assert.equal(parsed.vaultOpenTarget, 'root');
});

test('vault:* navigation commands route through vault opener with canonical families', () => {
  const execution = parseCliArgs(['vault:execution']);
  const evidence = parseCliArgs(['vault:evidence']);
  const review = parseCliArgs(['vault:review']);

  assert.equal(execution.command, 'vault:open');
  assert.equal(execution.vaultFamily, 'execution');

  assert.equal(evidence.command, 'vault:open');
  assert.equal(evidence.vaultFamily, 'evidence');

  assert.equal(review.command, 'vault:open');
  assert.equal(review.vaultFamily, 'reviews');
});

test('vault opener reports blocked status when Obsidian is not detected', async () => {
  const env = createTestEnvironment();
  try {
    const { runVaultOpenCLI } = require('../bin/vault-open.cjs');
    const vaultRoot = path.join(env.dir, 'MarkOS-Vault', 'Home');
    fs.mkdirSync(vaultRoot, { recursive: true });
    fs.writeFileSync(path.join(vaultRoot, 'HOME.md'), '# Home\n');

    const lines = [];
    const errors = [];
    const result = await runVaultOpenCLI({
      cli: { vaultOpenTarget: 'home' },
      cwd: env.dir,
      output: (line) => lines.push(line),
      errorOutput: (line) => errors.push(line),
      detectObsidian: () => ({ available: false, path: null, source: 'test' }),
    });

    assert.equal(result.ok, false);
    assert.equal(result.reason, 'obsidian-not-detected');
    assert.match(errors.join('\n'), /Obsidian was not detected/);
    assert.match(lines.join('\n'), /MarkOS-Vault\/Home\/HOME\.md/);
  } finally {
    env.cleanup();
  }
});

test('vault opener targets the canonical Home note through Obsidian URI', async () => {
  const env = createTestEnvironment();
  try {
    const { buildObsidianOpenUri, runVaultOpenCLI } = require('../bin/vault-open.cjs');
    const vaultRoot = path.join(env.dir, 'MarkOS-Vault', 'Home');
    const homeNotePath = path.join(vaultRoot, 'HOME.md');
    fs.mkdirSync(vaultRoot, { recursive: true });
    fs.writeFileSync(homeNotePath, '# Home\n');

    const lines = [];
    let openedUri = null;
    const result = await runVaultOpenCLI({
      cli: { vaultOpenTarget: 'home' },
      cwd: env.dir,
      output: (line) => lines.push(line),
      detectObsidian: () => ({ available: true, path: 'C:/Program Files/Obsidian/Obsidian.exe', source: 'test' }),
      protocolOpener: (uri) => {
        openedUri = uri;
      },
      executableOpener: () => {
        throw new Error('executable fallback should not run');
      },
    });

    assert.equal(result.ok, true);
    assert.equal(result.method, 'uri');
    assert.equal(openedUri, buildObsidianOpenUri(homeNotePath));
    assert.match(lines.join('\n'), /Opened Home note in Obsidian/);
  } finally {
    env.cleanup();
  }
});

test('vault opener falls back to direct executable launch when URI open fails', async () => {
  const env = createTestEnvironment();
  try {
    const { runVaultOpenCLI } = require('../bin/vault-open.cjs');
    const vaultRoot = path.join(env.dir, 'MarkOS-Vault');
    fs.mkdirSync(vaultRoot, { recursive: true });

    const lines = [];
    const launches = [];
    const result = await runVaultOpenCLI({
      cli: { vaultOpenTarget: 'root' },
      cwd: env.dir,
      output: (line) => lines.push(line),
      detectObsidian: () => ({ available: true, path: '/opt/Obsidian/obsidian', source: 'test' }),
      protocolOpener: () => {
        throw new Error('protocol unavailable');
      },
      executableOpener: (executablePath, targetPath) => {
        launches.push({ executablePath, targetPath });
      },
    });

    assert.equal(result.ok, true);
    assert.equal(result.method, 'executable');
    assert.equal(launches.length, 1);
    assert.equal(launches[0].targetPath, vaultRoot);
    assert.match(lines.join('\n'), /Fell back to direct executable launch/);
  } finally {
    env.cleanup();
  }
});

test('vault opener resolves family target and opens canonical family path', async () => {
  const env = createTestEnvironment();
  try {
    const { buildObsidianOpenUri, runVaultOpenCLI } = require('../bin/vault-open.cjs');
    const evidenceDir = path.join(env.dir, 'MarkOS-Vault', 'Evidence');
    fs.mkdirSync(evidenceDir, { recursive: true });

    let openedUri = null;
    const result = await runVaultOpenCLI({
      cli: { vaultFamily: 'evidence' },
      cwd: env.dir,
      detectObsidian: () => ({ available: true, path: '/opt/Obsidian/obsidian', source: 'test' }),
      protocolOpener: (uri) => {
        openedUri = uri;
      },
      executableOpener: () => {
        throw new Error('executable fallback should not run');
      },
    });

    assert.equal(result.ok, true);
    assert.equal(result.target, 'evidence');
    assert.equal(result.method, 'uri');
    assert.equal(openedUri, buildObsidianOpenUri(evidenceDir));
  } finally {
    env.cleanup();
  }
});

test('install entrypoint delegates vault:open to the dedicated CLI adapter', async () => {
  const installPath = path.resolve(__dirname, '../bin/install.cjs');
  const vaultOpenPath = path.resolve(__dirname, '../bin/vault-open.cjs');
  const originalArgv = process.argv;

  try {
    process.argv = ['node', installPath, 'vault:open', '--root'];
    let called = false;

    await withMockedModule(vaultOpenPath, {
      runVaultOpenCLI: async ({ cli }) => {
        called = true;
        assert.equal(cli.command, 'vault:open');
        assert.equal(cli.vaultOpenTarget, 'root');
        return { ok: true };
      },
    }, async () => {
      const { run } = loadFresh(installPath);
      await run();
    });

    assert.equal(called, true);
  } finally {
    process.argv = originalArgv;
  }
});