const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');

const { createTestEnvironment } = require('./setup.js');

function loadFresh(modulePath) {
  delete require.cache[require.resolve(modulePath)];
  return require(modulePath);
}

test('vault writer persists deterministic canonical notes with ordered frontmatter', () => {
  const env = createTestEnvironment();
  env.seedOnboarding();

  try {
    const writerPath = path.join(env.dir, 'onboarding', 'backend', 'vault', 'vault-writer.cjs');
    const { writeApprovedDrafts } = loadFresh(writerPath);

    const result = writeApprovedDrafts({
      config: {
        canonical_vault: { root_path: 'MarkOS-Vault' },
        vault_root_path: 'MarkOS-Vault',
      },
      projectSlug: 'acme',
      approvedDrafts: {
        company_profile: '## Snapshot\n\nAcme helps operators.',
      },
    });

    const notePath = path.join(env.dir, 'MarkOS-Vault', 'Strategy', 'company.md');
    const noteContent = fs.readFileSync(notePath, 'utf8');

    assert.deepEqual(result.written, ['MarkOS-Vault/Strategy/company.md']);
    assert.match(noteContent, /^---\nid: strategy-company-acme\ntitle: Company\nvault_family: Strategy\nnote_family: company\nstatus: active\nowner: acme\nreview_cycle: quarterly\ncreated_at:/);
    assert.match(noteContent, /source_mode: generated/);
    assert.match(noteContent, /# Company/);
    assert.match(noteContent, /Acme helps operators\./);
  } finally {
    env.cleanup();
  }
});

test('vault writer blocks conflicting canonical destinations without overwriting them', () => {
  const env = createTestEnvironment();
  env.seedOnboarding();

  try {
    const writerPath = path.join(env.dir, 'onboarding', 'backend', 'vault', 'vault-writer.cjs');
    const { writeApprovedDrafts } = loadFresh(writerPath);
    const notePath = path.join(env.dir, 'MarkOS-Vault', 'Strategy', 'company.md');
    fs.mkdirSync(path.dirname(notePath), { recursive: true });
    fs.writeFileSync(notePath, 'existing canonical content', 'utf8');

    const result = writeApprovedDrafts({
      config: {
        canonical_vault: { root_path: 'MarkOS-Vault' },
        vault_root_path: 'MarkOS-Vault',
      },
      projectSlug: 'acme',
      approvedDrafts: {
        company_profile: '## Snapshot\n\nNew content',
      },
    });

    assert.deepEqual(result.written, []);
    assert.equal(result.items[0].outcome, 'blocked');
    assert.equal(fs.readFileSync(notePath, 'utf8'), 'existing canonical content');
  } finally {
    env.cleanup();
  }
});

test('run report writes durable memory note with totals and retention statement', () => {
  const env = createTestEnvironment();
  env.seedOnboarding();

  try {
    const reportPath = path.join(env.dir, 'onboarding', 'backend', 'vault', 'run-report.cjs');
    const { writeRunReport } = loadFresh(reportPath);

    const report = writeRunReport({
      config: {
        canonical_vault: { root_path: 'MarkOS-Vault' },
        vault_root_path: 'MarkOS-Vault',
      },
      projectSlug: 'acme',
      mode: 'onboarding_approve',
      surface: 'browser',
      legacyRoots: [{ relative_root: '.markos-local/MIR' }, { relative_root: '.markos-local/MSP' }],
      items: [
        { source_key: 'company_profile', destination_path: 'MarkOS-Vault/Strategy/company.md', note_id: 'strategy-company-acme', outcome: 'imported', warnings: [], errors: [] },
        { source_key: 'brand_voice', destination_path: 'MarkOS-Vault/Strategy/messaging.md', note_id: 'strategy-messaging-acme', outcome: 'blocked', reason: 'DESTINATION_CONFLICT', warnings: [], errors: ['conflict'] },
      ],
      timestamp: new Date('2026-04-11T12:34:56.000Z'),
    });

    const content = fs.readFileSync(path.join(env.dir, report.report_note_path), 'utf8');
    assert.equal(report.report_note_path, 'MarkOS-Vault/Memory/Migration Reports/2026-04-11T12-34-56-000Z-onboarding_approve.md');
    assert.match(content, /note_family: migration_report/);
    assert.match(content, /- imported: 1/);
    assert.match(content, /- blocked: 1/);
    assert.match(content, /Legacy MIR\/MSP content remains in place as migration reference only\./);
  } finally {
    env.cleanup();
  }
});