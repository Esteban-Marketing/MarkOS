const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  applyPendingMigrations,
  sha256,
} = require('../onboarding/backend/provisioning/migration-runner.cjs');

function makeDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'markos-migrations-'));
}

test('42-03-01 applies SQL migrations in deterministic lexical order', async () => {
  const tmpDir = makeDir();
  const migrationsDir = path.join(tmpDir, 'migrations');
  fs.mkdirSync(migrationsDir, { recursive: true });
  fs.writeFileSync(path.join(migrationsDir, '20_b.sql'), 'create table b(id int);');
  fs.writeFileSync(path.join(migrationsDir, '10_a.sql'), 'create table a(id int);');

  const executed = [];

  try {
    const summary = await applyPendingMigrations({
      migrationsDir,
      executeSql: async (_sql, meta) => {
        if (meta.kind === 'ledger-read') {
          return { rows: [] };
        }
        if (meta.kind === 'migration') {
          executed.push(meta.filename);
        }
        return { rows: [] };
      },
    });

    assert.deepEqual(executed, ['10_a.sql', '20_b.sql']);
    assert.deepEqual(summary.applied, ['10_a.sql', '20_b.sql']);
    assert.deepEqual(summary.skipped, []);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('42-03-02 writes markos_migrations ledger and skips already applied files on rerun', async () => {
  const tmpDir = makeDir();
  const migrationsDir = path.join(tmpDir, 'migrations');
  fs.mkdirSync(migrationsDir, { recursive: true });

  const fileA = path.join(migrationsDir, '10_a.sql');
  const fileB = path.join(migrationsDir, '20_b.sql');
  fs.writeFileSync(fileA, 'create table a(id int);');
  fs.writeFileSync(fileB, 'create table b(id int);');

  const expectedA = sha256(fs.readFileSync(fileA, 'utf8'));
  const ledgerWrites = [];
  const executed = [];

  try {
    const summary = await applyPendingMigrations({
      migrationsDir,
      executeSql: async (_sql, meta) => {
        if (meta.kind === 'ledger-read') {
          return {
            rows: [{ filename: '10_a.sql', checksum: expectedA }],
          };
        }

        if (meta.kind === 'migration') {
          executed.push(meta.filename);
        }

        if (meta.kind === 'ledger-write') {
          ledgerWrites.push(meta.filename);
        }

        return { rows: [] };
      },
    });

    assert.deepEqual(summary.skipped, ['10_a.sql']);
    assert.deepEqual(summary.applied, ['20_b.sql']);
    assert.deepEqual(executed, ['20_b.sql']);
    assert.deepEqual(ledgerWrites, ['20_b.sql']);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('42-03-03 stops on first failing migration and reports failing file', async () => {
  const tmpDir = makeDir();
  const migrationsDir = path.join(tmpDir, 'migrations');
  fs.mkdirSync(migrationsDir, { recursive: true });
  fs.writeFileSync(path.join(migrationsDir, '10_a.sql'), 'create table a(id int);');
  fs.writeFileSync(path.join(migrationsDir, '20_b.sql'), 'create table b(id int);');

  const executed = [];

  try {
    await assert.rejects(
      () => applyPendingMigrations({
        migrationsDir,
        executeSql: async (_sql, meta) => {
          if (meta.kind === 'ledger-read') {
            return { rows: [] };
          }

          if (meta.kind === 'migration') {
            executed.push(meta.filename);
            if (meta.filename === '20_b.sql') {
              throw new Error('syntax error at line 1');
            }
          }

          return { rows: [] };
        },
      }),
      (error) => {
        assert.equal(error.code, 'MIGRATION_FAILED');
        assert.equal(error.filename, '20_b.sql');
        assert.match(error.message, /20_b\.sql/);
        return true;
      }
    );

    assert.deepEqual(executed, ['10_a.sql', '20_b.sql']);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
