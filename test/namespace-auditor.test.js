const test = require('node:test');
const assert = require('node:assert/strict');

const { auditNamespaces } = require('../onboarding/backend/provisioning/namespace-auditor.cjs');

test('42-04-02 validates client namespace isolation and standards namespace invariants', async () => {
  const report = await auditNamespaces({
    projectSlug: 'acme-inc',
    disciplines: ['paid_media', 'seo'],
    listNamespaces: async () => [
      'markos-acme-inc-company',
      'markos-acme-inc-audience',
    ],
  });

  assert.equal(report.ok, true);
  assert.deepEqual(report.errors, []);
  assert.equal(report.standards_namespaces_checked.length, 2);
});

test('42-04-03 namespace audit report is consumable by db:setup workflow diagnostics', async () => {
  const report = await auditNamespaces({
    projectSlug: 'acme-inc',
    disciplines: ['paid_media'],
    listNamespaces: async () => [
      'markos-other-client-company',
      'markos-acme-inc-audience',
    ],
  });

  assert.equal(report.ok, false);
  assert.match(report.errors[0], /outside slug scope acme-inc/);
});
