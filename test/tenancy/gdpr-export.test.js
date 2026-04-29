'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { BUNDLE_DOMAINS, SIGNED_URL_TTL_SECONDS, generateExportBundle } = require('../../lib/markos/tenant/gdpr-export.cjs');

test('Suite 201-07: BUNDLE_DOMAINS matches RESEARCH.md locked list', () => {
  assert.deepEqual([...BUNDLE_DOMAINS], [
    'tenant', 'org', 'members', 'crm-contacts', 'crm-deals', 'crm-activity',
    'audit', 'webhooks', 'literacy', 'evidence-pack',
  ]);
  assert.equal(Object.isFrozen(BUNDLE_DOMAINS), true);
});

test('Suite 201-07: SIGNED_URL_TTL_SECONDS is 24 hours (D-102, was 7d — H3 closure)', () => {
  assert.equal(SIGNED_URL_TTL_SECONDS, 86400);
});

function makeMockArchiver() {
  const appended = [];
  const archive = {
    _appended: appended,
    pipe: () => {},
    append: (data, opts) => { appended.push({ data, opts }); },
    finalize: async () => {},
  };
  const fn = () => archive;
  fn._archive = archive;
  return fn;
}

function makeMockS3() {
  const sent = [];
  return {
    send: async (cmd) => { sent.push(cmd); return {}; },
    _sent: sent,
  };
}

test('Suite 201-07: generateExportBundle writes manifest + one file per BUNDLE_DOMAINS + inserts markos_gdpr_exports row', async () => {
  const state = { inserts: [] };
  const client = {
    from: (table) => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => (table === 'markos_tenants' ? { data: { org_id: 'o1' }, error: null } : { data: null, error: null }) }) }),
      insert: (row) => {
        state.inserts.push({ table, row });
        return {
          select: () => ({ single: async () => ({ data: { id: 'mock' }, error: null }) }),
          then: (resolve) => resolve({ error: null }),
        };
      },
    }),
  };

  const archiveFn = makeMockArchiver();
  const s3 = makeMockS3();
  const getSignedUrl = async () => 'https://signed.example/?sig=abc';

  class PutObjectCommand { constructor(p) { this.input = p; } }
  class GetObjectCommand { constructor(p) { this.input = p; } }

  const r = await generateExportBundle(client, {
    tenant_id: 't-acme', bucket: 'markos-gdpr',
    streamArchiver: archiveFn, s3Client: s3, getSignedUrl, PutObjectCommand, GetObjectCommand,
  });

  assert.ok(r.export_id.startsWith('gdpr-'));
  assert.ok(r.object_key.startsWith('exports/t-acme/'));
  // D-102: signed_url must NOT be returned to the caller (URL leakage H3 closure).
  assert.equal(r.signed_url, undefined, 'signed_url must not be returned to caller (D-102)');
  assert.ok(typeof r.nonce === 'string' && r.nonce.length === 64, 'nonce must be 64 hex chars');
  assert.ok(new Date(r.expires_at).getTime() - Date.now() >= 23 * 3600 * 1000 - 10_000, 'expires_at must be ~24h from now');

  const names = archiveFn._archive._appended.map(a => a.opts && a.opts.name);
  assert.ok(names.includes('manifest.json'));
  for (const d of BUNDLE_DOMAINS) {
    assert.ok(names.includes(`${d}.json`), `missing ${d}.json in bundle`);
  }

  assert.equal(s3._sent.length, 1);
  assert.equal(s3._sent[0].input.Bucket, 'markos-gdpr');

  const exportInsert = state.inserts.find(i => i.table === 'markos_gdpr_exports' && i.row.tenant_id === 't-acme');
  assert.ok(exportInsert, 'must insert into markos_gdpr_exports');
  assert.ok(typeof exportInsert.row.nonce === 'string' && exportInsert.row.nonce.length === 64, 'insert must include nonce');
  assert.equal(exportInsert.row.audience_tenant_id, 't-acme', 'insert must include audience_tenant_id = tenant_id');
  // signed_url is stored server-side only (not returned to caller)
  assert.ok(typeof exportInsert.row.signed_url === 'string', 'signed_url persisted on row for server-side use');
});
