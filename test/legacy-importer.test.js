const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');

const { createTestEnvironment } = require('./setup.js');

function loadFresh(modulePath) {
  delete require.cache[require.resolve(modulePath)];
  return require(modulePath);
}

test('legacy importer plans and applies one-way canonical writes while preserving legacy files', () => {
  const env = createTestEnvironment();
  env.seedOnboarding();

  try {
    const importerPath = path.join(env.dir, 'onboarding', 'backend', 'vault', 'import-engine.cjs');
    const importer = loadFresh(importerPath);

    const mirProfilePath = path.join(env.dir, '.markos-local', 'MIR', 'Core_Strategy', '01_COMPANY', 'PROFILE.md');
    const mspChannelPath = path.join(env.dir, '.markos-local', 'MSP', 'Strategy', '00_MASTER-PLAN', 'CHANNEL-STRATEGY.md');
    fs.mkdirSync(path.dirname(mirProfilePath), { recursive: true });
    fs.mkdirSync(path.dirname(mspChannelPath), { recursive: true });
    fs.writeFileSync(mirProfilePath, '# Company Profile\n\n## Snapshot\n\nLegacy company truth', 'utf8');
    fs.writeFileSync(mspChannelPath, '# Channel Strategy\n\n## Channels\n\nPaid and lifecycle', 'utf8');

    const config = {
      canonical_vault: { root_path: 'MarkOS-Vault' },
      vault_root_path: 'MarkOS-Vault',
      legacy_outputs: {
        mir: { output_path: '.markos-local/MIR' },
        msp: { output_path: '.markos-local/MSP' },
      },
    };

    const plan = importer.planImport({ config, projectSlug: 'acme' });
    assert.equal(plan.items.length, 2);
    assert.deepEqual(plan.items.map((item) => item.destination_path).sort(), [
      'MarkOS-Vault/Execution/channel-system.md',
      'MarkOS-Vault/Strategy/company.md',
    ]);
    assert.ok(plan.items.every((item) => item.proposed_outcome === 'imported'));

    const result = importer.applyImportPlan({ config, projectSlug: 'acme', plan, surface: 'cli' });
    assert.equal(result.report_note_path.startsWith('MarkOS-Vault/Memory/Migration Reports/'), true);
    assert.ok(fs.existsSync(path.join(env.dir, 'MarkOS-Vault', 'Strategy', 'company.md')));
    assert.ok(fs.existsSync(path.join(env.dir, 'MarkOS-Vault', 'Execution', 'channel-system.md')));
    assert.ok(fs.existsSync(mirProfilePath));
    assert.ok(fs.existsSync(mspChannelPath));
    assert.ok(result.items.every((item) => item.outcome === 'imported'));
  } finally {
    env.cleanup();
  }
});

test('legacy importer blocks conflicting canonical destinations without mutating the existing note', () => {
  const env = createTestEnvironment();
  env.seedOnboarding();

  try {
    const importerPath = path.join(env.dir, 'onboarding', 'backend', 'vault', 'import-engine.cjs');
    const importer = loadFresh(importerPath);

    const mirProfilePath = path.join(env.dir, '.markos-local', 'MIR', 'Core_Strategy', '01_COMPANY', 'PROFILE.md');
    const canonicalPath = path.join(env.dir, 'MarkOS-Vault', 'Strategy', 'company.md');
    fs.mkdirSync(path.dirname(mirProfilePath), { recursive: true });
    fs.mkdirSync(path.dirname(canonicalPath), { recursive: true });
    fs.writeFileSync(mirProfilePath, '# Company Profile\n\n## Snapshot\n\nLegacy company truth', 'utf8');
    fs.writeFileSync(canonicalPath, 'existing canonical note', 'utf8');

    const config = {
      canonical_vault: { root_path: 'MarkOS-Vault' },
      vault_root_path: 'MarkOS-Vault',
      legacy_outputs: {
        mir: { output_path: '.markos-local/MIR' },
        msp: { output_path: '.markos-local/MSP' },
      },
    };

    const plan = importer.planImport({ config, projectSlug: 'acme' });
    assert.equal(plan.items[0].proposed_outcome, 'blocked');

    const result = importer.applyImportPlan({ config, projectSlug: 'acme', plan, surface: 'cli' });
    assert.equal(result.items[0].outcome, 'blocked');
    assert.equal(fs.readFileSync(canonicalPath, 'utf8'), 'existing canonical note');
  } finally {
    env.cleanup();
  }
});