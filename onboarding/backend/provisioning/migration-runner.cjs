'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const LEDGER_TABLE_SQL = `
create table if not exists markos_migrations (
  filename text primary key,
  checksum text not null,
  applied_at timestamptz not null default now()
);
`;

function sha256(content) {
  return crypto.createHash('sha256').update(String(content || ''), 'utf8').digest('hex');
}

function escapeSqlLiteral(value) {
  return String(value || '').replace(/'/g, "''");
}

function containsDestructiveSql(sqlText) {
  const text = String(sqlText || '').toLowerCase();
  return /\bdrop\s+table\b/.test(text) || /\btruncate\b/.test(text);
}

function listMigrationFiles(migrationsDir, fsApi = fs) {
  if (!fsApi.existsSync(migrationsDir)) {
    return [];
  }

  return fsApi
    .readdirSync(migrationsDir)
    .filter((name) => name.toLowerCase().endsWith('.sql'))
    .sort((a, b) => a.localeCompare(b));
}

async function applyPendingMigrations(options = {}) {
  const migrationsDir = options.migrationsDir || path.resolve(process.cwd(), 'supabase', 'migrations');
  const executeSql = options.executeSql;
  const fsApi = options.fsApi || fs;

  if (typeof executeSql !== 'function') {
    throw new Error('applyPendingMigrations requires an executeSql(sql, meta) function.');
  }

  const files = listMigrationFiles(migrationsDir, fsApi);
  await executeSql(LEDGER_TABLE_SQL, { kind: 'ledger-ensure' });

  const appliedResult = await executeSql(
    'select filename, checksum from markos_migrations order by filename;',
    { kind: 'ledger-read' }
  );

  const appliedRows = Array.isArray(appliedResult && appliedResult.rows)
    ? appliedResult.rows
    : [];
  const appliedMap = new Map(appliedRows.map((row) => [row.filename, row.checksum]));

  const summary = {
    total: files.length,
    applied: [],
    skipped: [],
  };

  for (const filename of files) {
    const filePath = path.join(migrationsDir, filename);
    const sqlText = fsApi.readFileSync(filePath, 'utf8');
    const checksum = sha256(sqlText);

    if (containsDestructiveSql(sqlText)) {
      throw new Error(`Destructive SQL detected in migration ${filename}.`);
    }

    if (appliedMap.get(filename) === checksum) {
      summary.skipped.push(filename);
      continue;
    }

    try {
      await executeSql(sqlText, { kind: 'migration', filename });
      await executeSql(
        `
insert into markos_migrations (filename, checksum, applied_at)
values ('${escapeSqlLiteral(filename)}', '${escapeSqlLiteral(checksum)}', now())
on conflict (filename)
do update set checksum = excluded.checksum, applied_at = excluded.applied_at;
`.trim(),
        { kind: 'ledger-write', filename, checksum }
      );
      summary.applied.push(filename);
    } catch (error) {
      const wrapped = new Error(`Migration failed for ${filename}: ${error.message}`);
      wrapped.code = 'MIGRATION_FAILED';
      wrapped.filename = filename;
      wrapped.cause = error;
      throw wrapped;
    }
  }

  return summary;
}

module.exports = {
  LEDGER_TABLE_SQL,
  applyPendingMigrations,
  containsDestructiveSql,
  listMigrationFiles,
  sha256,
};
