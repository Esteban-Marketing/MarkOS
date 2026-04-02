const test = require('node:test');
const assert = require('node:assert/strict');

const { verifyRlsPolicies } = require('../onboarding/backend/provisioning/rls-verifier.cjs');

test('42-04-01 verifies required literacy tables have RLS enabled and anon access denied', async () => {
  const report = await verifyRlsPolicies({
    fetchTableRlsStatus: async () => [
      { table_name: 'markos_literacy_chunks', rls_enabled: true },
      { table_name: 'markos_artifacts', rls_enabled: true },
      { table_name: 'markos_vector_index_config', rls_enabled: true },
    ],
    checkAnonDenied: async () => true,
  });

  assert.equal(report.ok, true);
  assert.equal(report.tables.length, 3);
  assert.equal(report.tables.every((table) => table.ok), true);
});

test('42-04-01 fails closed when any table is missing RLS or anon denial check fails', async () => {
  const report = await verifyRlsPolicies({
    fetchTableRlsStatus: async () => [
      { table_name: 'markos_literacy_chunks', rls_enabled: true },
      { table_name: 'markos_artifacts', rls_enabled: false },
      { table_name: 'markos_vector_index_config', rls_enabled: true },
    ],
    checkAnonDenied: async (table) => table !== 'markos_vector_index_config',
  });

  assert.equal(report.ok, false);
  assert.equal(report.tables.find((table) => table.table === 'markos_artifacts').ok, false);
  assert.equal(report.tables.find((table) => table.table === 'markos_vector_index_config').anon_denied, false);
});
