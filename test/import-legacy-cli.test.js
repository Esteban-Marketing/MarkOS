const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { parseCliArgs } = require('../bin/cli-runtime.cjs');
const { withMockedModule } = require('./setup.js');

function loadFresh(modulePath) {
  delete require.cache[require.resolve(modulePath)];
  return require(modulePath);
}

test('import:legacy is routed through the CLI parser with scan-only default', () => {
  const parsed = parseCliArgs(['import:legacy']);
  assert.equal(parsed.command, 'import:legacy');
  assert.equal(parsed.apply, false);
  assert.equal(parsed.projectSlug, null);
});

test('import:legacy parser accepts apply mode and project slug override', () => {
  const parsed = parseCliArgs(['import:legacy', '--apply', '--project-slug', 'acme']);
  assert.equal(parsed.command, 'import:legacy');
  assert.equal(parsed.apply, true);
  assert.equal(parsed.projectSlug, 'acme');
});

test('CLI importer prints scan preview by default without applying writes', async () => {
  const { runImportLegacyCLI } = require('../bin/import-legacy.cjs');
  const lines = [];

  const result = await runImportLegacyCLI({
    cli: { apply: false, projectSlug: 'acme' },
    output: (line) => lines.push(line),
    runtimeLoader: () => ({
      project_slug: 'markos-client',
      canonical_vault: { root_path: 'MarkOS-Vault' },
      vault_root_path: 'MarkOS-Vault',
    }),
    planner: () => ({
      items: [
        {
          source_path: '.markos-local/MIR/Core_Strategy/01_COMPANY/PROFILE.md',
          destination_path: 'MarkOS-Vault/Strategy/company.md',
          proposed_outcome: 'imported',
          warnings: [],
        },
      ],
    }),
    applier: () => {
      throw new Error('applier should not run in scan mode');
    },
  });

  assert.equal(result.mode, 'scan');
  assert.match(lines.join('\n'), /Canonical destination preview:/);
  assert.match(lines.join('\n'), /MarkOS-Vault\/Strategy\/company\.md/);
  assert.match(lines.join('\n'), /Legacy MIR\/MSP content remains untouched/);
  assert.match(lines.join('\n'), /Re-run with --apply/);
});

test('CLI importer apply mode reports totals and durable report note path', async () => {
  const { runImportLegacyCLI } = require('../bin/import-legacy.cjs');
  const lines = [];

  const result = await runImportLegacyCLI({
    cli: { apply: true, projectSlug: 'acme' },
    output: (line) => lines.push(line),
    runtimeLoader: () => ({
      project_slug: 'markos-client',
      canonical_vault: { root_path: 'MarkOS-Vault' },
      vault_root_path: 'MarkOS-Vault',
    }),
    planner: () => ({
      items: [
        {
          source_path: '.markos-local/MIR/Core_Strategy/01_COMPANY/PROFILE.md',
          destination_path: 'MarkOS-Vault/Strategy/company.md',
          proposed_outcome: 'imported',
          warnings: [],
        },
      ],
    }),
    applier: () => ({
      items: [
        {
          source_path: '.markos-local/MIR/Core_Strategy/01_COMPANY/PROFILE.md',
          destination_path: 'MarkOS-Vault/Strategy/company.md',
          outcome: 'imported',
          warnings: [],
        },
      ],
      report_note_path: 'MarkOS-Vault/Memory/Migration Reports/mock-report.md',
    }),
  });

  assert.equal(result.mode, 'apply');
  assert.match(lines.join('\n'), /Applying import plan/);
  assert.match(lines.join('\n'), /Report note: MarkOS-Vault\/Memory\/Migration Reports\/mock-report\.md/);
  assert.match(lines.join('\n'), /Apply complete\. Legacy MIR\/MSP files remain in place/);
});

test('install entrypoint delegates import:legacy to the dedicated CLI adapter', async () => {
  const installPath = path.resolve(__dirname, '../bin/install.cjs');
  const importLegacyPath = path.resolve(__dirname, '../bin/import-legacy.cjs');
  const originalArgv = process.argv;

  try {
    process.argv = ['node', installPath, 'import:legacy', '--apply', '--project-slug', 'acme'];
    let called = false;

    await withMockedModule(importLegacyPath, {
      runImportLegacyCLI: async ({ cli }) => {
        called = true;
        assert.equal(cli.command, 'import:legacy');
        assert.equal(cli.apply, true);
        assert.equal(cli.projectSlug, 'acme');
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