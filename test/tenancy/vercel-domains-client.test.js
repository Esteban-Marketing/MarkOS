'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { VERCEL_DOMAINS_BASE, addDomain, removeDomain, getDomainStatus } = require('../../lib/markos/tenant/vercel-domains-client.cjs');

test('Suite 201-06: VERCEL_DOMAINS_BASE points to v10', () => {
  assert.equal(VERCEL_DOMAINS_BASE, 'https://api.vercel.com/v10');
});

test('Suite 201-06: addDomain fails closed on missing input', async () => {
  assert.deepEqual(await addDomain({}), { ok: false, status: 0, error: 'invalid_input' });
});

test('Suite 201-06: addDomain posts to the projects/:id/domains endpoint with Bearer auth', async () => {
  let capturedUrl = null, capturedInit = null;
  const fetchImpl = async (url, init) => {
    capturedUrl = url; capturedInit = init;
    return { ok: true, status: 200, json: async () => ({ id: 'vdm-1', verification: [{ type: 'CNAME', domain: 'x', value: 'cname.vercel-dns.com' }] }) };
  };
  const r = await addDomain({ token: 'tok', projectId: 'prj', domain: 'acme.com' }, { fetchImpl });
  assert.equal(r.ok, true);
  assert.equal(r.vercel_domain_id, 'vdm-1');
  assert.ok(capturedUrl.startsWith('https://api.vercel.com/v10/projects/prj/domains'));
  assert.equal(capturedInit.method, 'POST');
  assert.match(capturedInit.headers.Authorization, /^Bearer tok$/);
});

test('Suite 201-06: addDomain returns error on non-200', async () => {
  const fetchImpl = async () => ({ ok: false, status: 409, json: async () => ({}) });
  const r = await addDomain({ token: 'tok', projectId: 'prj', domain: 'acme.com' }, { fetchImpl });
  assert.equal(r.ok, false);
  assert.equal(r.status, 409);
});

test('Suite 201-06: addDomain fails closed on network error', async () => {
  const fetchImpl = async () => { throw new Error('ECONNREFUSED'); };
  const r = await addDomain({ token: 'tok', projectId: 'prj', domain: 'acme.com' }, { fetchImpl });
  assert.equal(r.ok, false);
  assert.match(r.error, /ECONNREFUSED|network_error/);
});

test('Suite 201-06: removeDomain DELETEs project/domains/:domain', async () => {
  let capturedUrl = null, capturedInit = null;
  const fetchImpl = async (url, init) => {
    capturedUrl = url; capturedInit = init;
    return { ok: true, status: 200 };
  };
  const r = await removeDomain({ token: 'tok', projectId: 'prj', domain: 'acme.com' }, { fetchImpl });
  assert.equal(r.ok, true);
  assert.ok(capturedUrl.includes('/projects/prj/domains/acme.com'));
  assert.equal(capturedInit.method, 'DELETE');
});

test('Suite 201-06: getDomainStatus returns verified=true + ssl_issued_at when Vercel says so', async () => {
  const fetchImpl = async () => ({
    ok: true,
    json: async () => ({
      verified: true,
      misconfigured: false,
      sslIssuedAt: '2026-04-17T00:00:00Z',
      recommendedCNAME: ['cname.vercel-dns.com'],
    }),
  });
  const r = await getDomainStatus({ token: 't', projectId: 'p', domain: 'acme.com' }, { fetchImpl });
  assert.equal(r.ok, true);
  assert.equal(r.verified, true);
  assert.equal(r.ssl_issued_at, '2026-04-17T00:00:00Z');
  assert.equal(r.cname_target, 'cname.vercel-dns.com');
});

test('Suite 201-06: getDomainStatus treats misconfigured=true as not verified', async () => {
  const fetchImpl = async () => ({ ok: true, json: async () => ({ verified: true, misconfigured: true }) });
  const r = await getDomainStatus({ token: 't', projectId: 'p', domain: 'acme.com' }, { fetchImpl });
  assert.equal(r.verified, false);
});
