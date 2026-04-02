'use strict';

const DEFAULT_TABLES = Object.freeze([
  'markos_literacy_chunks',
  'markos_artifacts',
  'markos_vector_index_config',
]);

async function verifyRlsPolicies(options = {}) {
  const tables = Array.isArray(options.tables) && options.tables.length > 0
    ? options.tables
    : [...DEFAULT_TABLES];

  const fetchTableRlsStatus = options.fetchTableRlsStatus;
  const checkAnonDenied = options.checkAnonDenied;

  if (typeof fetchTableRlsStatus !== 'function') {
    throw new Error('verifyRlsPolicies requires fetchTableRlsStatus(tables).');
  }

  if (typeof checkAnonDenied !== 'function') {
    throw new Error('verifyRlsPolicies requires checkAnonDenied(table).');
  }

  const statusRows = await fetchTableRlsStatus(tables);
  const statusMap = new Map(
    (Array.isArray(statusRows) ? statusRows : []).map((row) => [row.table_name, Boolean(row.rls_enabled)])
  );

  const tableReports = [];

  for (const tableName of tables) {
    const rlsEnabled = statusMap.get(tableName) === true;
    let anonDenied = false;
    let anonError = null;

    if (rlsEnabled) {
      try {
        anonDenied = await checkAnonDenied(tableName);
      } catch (error) {
        anonDenied = false;
        anonError = error.message;
      }
    }

    const ok = rlsEnabled && anonDenied;
    tableReports.push({
      table: tableName,
      rls_enabled: rlsEnabled,
      anon_denied: anonDenied,
      ok,
      error: anonError,
    });
  }

  return {
    ok: tableReports.every((entry) => entry.ok),
    tables: tableReports,
  };
}

module.exports = {
  DEFAULT_TABLES,
  verifyRlsPolicies,
};
