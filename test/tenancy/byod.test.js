'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { addCustomDomain, removeCustomDomain, pollDomainStatus, normaliseDomain } = require('../../lib/markos/tenant/domains.cjs');

function mockClient({ active = false, tenantRow = { org_id: 'o1' } } = {}) {
  const calls = { inserts: [], updates: [], audit: [] };
  return {
    calls,
    from: (table) => ({
      select: () => ({
        eq: (col, val) => ({
          eq: () => ({ maybeSingle: async () => ({
            data: table === 'markos_custom_domains'
              ? { tenant_id: 't1', vercel_domain_id: 'vdm', status: 'verified' }
              : null,
            error: null,
          }) }),
          in: () => ({ limit: async () => ({ data: active ? [{ domain: 'x' }] : [], error: null }) }),
          is: () => ({ order: () => Promise.resolve({ data: [], error: null }) }),
          maybeSingle: async () => {
            if (table === 'markos_tenants') return { data: tenantRow, error: null };
            return { data: null, error: null };
          },
        }),
      }),
      insert: async (row) => { calls.inserts.push({ table, row }); return { error: null }; },
      update: (patch) => {
        let recorded = false;
        const record = () => {
          if (recorded) return;
          recorded = true;
          calls.updates.push({ table, patch });
        };
        const chain = {
          eq: () => {
            record();
            return chain;
          },
          then: (resolve) => { record(); resolve({ error: null }); },
        };
        return chain;
      },
    }),
  };
}

const okVercel = {
  addDomain: async () => ({ ok: true, vercel_domain_id: 'vdm-1', verification: [{ type: 'CNAME', value: 'cname.vercel-dns.com' }] }),
  removeDomain: async () => ({ ok: true }),
  getDomainStatus: async () => ({ ok: true, verified: true, ssl_issued_at: '2026-04-17T00:00:00Z', cname_target: 'cname.vercel-dns.com' }),
};

test('Suite 201-06: normaliseDomain lowercases + strips protocol + strips trailing path', () => {
  assert.equal(normaliseDomain('https://ACME.COM/'), 'acme.com');
  assert.equal(normaliseDomain('  Acme.com  '), 'acme.com');
});

test('Suite 201-06: addCustomDomain rejects when org already has an active domain (D-13)', async () => {
  const c = mockClient({ active: true });
  const r = await addCustomDomain(c, { org_id: 'o1', tenant_id: 't1', domain: 'acme.com', actor_id: 'u1' }, okVercel);
  assert.deepEqual(r, { ok: false, error: 'quota_exceeded' });
});

test('Suite 201-06: addCustomDomain rejects invalid format', async () => {
  const c = mockClient();
  const r = await addCustomDomain(c, { org_id: 'o1', tenant_id: 't1', domain: 'no-dots', actor_id: 'u1' }, okVercel);
  assert.deepEqual(r, { ok: false, error: 'invalid_domain_format' });
});

test('Suite 201-06: addCustomDomain succeeds + inserts row + emits audit', async () => {
  const c = mockClient();
  const r = await addCustomDomain(c, { org_id: 'o1', tenant_id: 't1', domain: 'acme.com', actor_id: 'u1' }, okVercel);
  assert.equal(r.ok, true);
  assert.equal(r.status, 'pending');
  assert.equal(r.domain, 'acme.com');
  const custom = c.calls.inserts.find(i => i.table === 'markos_custom_domains');
  assert.ok(custom, 'expected insert into markos_custom_domains');
  assert.equal(custom.row.status, 'pending');
  assert.equal(custom.row.vercel_domain_id, 'vdm-1');
  const audit = c.calls.inserts.find(i => i.table === 'markos_audit_log_staging');
  assert.ok(audit, 'expected audit emission');
  assert.equal(audit.row.source_domain, 'tenancy');
  assert.equal(audit.row.action, 'custom_domain.added');
});

test('Suite 201-06: addCustomDomain fails when Vercel API returns non-ok', async () => {
  const c = mockClient();
  const failVercel = { ...okVercel, addDomain: async () => ({ ok: false, status: 500, error: 'vercel_error' }) };
  const r = await addCustomDomain(c, { org_id: 'o1', tenant_id: 't1', domain: 'acme.com', actor_id: 'u1' }, failVercel);
  assert.equal(r.ok, false);
  assert.match(r.error, /vercel_api_failed/);
  // No insert should have occurred.
  assert.equal(c.calls.inserts.filter(i => i.table === 'markos_custom_domains').length, 0);
});

test('Suite 201-06: removeCustomDomain soft-deletes + emits audit', async () => {
  const c = mockClient();
  const r = await removeCustomDomain(c, { org_id: 'o1', domain: 'acme.com', actor_id: 'u1' }, okVercel);
  assert.equal(r.ok, true);
  const update = c.calls.updates.find(u => u.table === 'markos_custom_domains');
  assert.ok(update);
  assert.equal(update.patch.status, 'failed');
  assert.ok(update.patch.removed_at);
  const audit = c.calls.inserts.find(i => i.table === 'markos_audit_log_staging');
  assert.ok(audit);
  assert.equal(audit.row.action, 'custom_domain.removed');
});

test('Suite 201-06: pollDomainStatus flips to verified and stores ssl_issued_at', async () => {
  const c = mockClient();
  const r = await pollDomainStatus(c, 'acme.com', okVercel);
  assert.equal(r.status, 'verified');
  assert.ok(r.verified_at);
  assert.ok(r.ssl_issued_at);
});

test('Suite 201-06: pollDomainStatus stays verifying when Vercel reports misconfigured', async () => {
  const c = mockClient();
  const deps = { ...okVercel, getDomainStatus: async () => ({ ok: true, verified: false, ssl_issued_at: null, cname_target: null }) };
  const r = await pollDomainStatus(c, 'acme.com', deps);
  assert.equal(r.status, 'verifying');
  assert.equal(r.verified_at, null);
});
