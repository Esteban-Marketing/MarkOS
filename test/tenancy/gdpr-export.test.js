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

test('Suite 201-07: SIGNED_URL_TTL_SECONDS is 7 days (D-15)', () => {
  assert.equal(SIGNED_URL_TTL_SECONDS, 604800);
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
  assert.ok(r.signed_url.startsWith('https://'));
  assert.ok(new Date(r.expires_at).getTime() - Date.now() >= 6 * 24 * 3600 * 1000 - 10_000);

  const names = archiveFn._archive._appended.map(a => a.opts && a.opts.name);
  assert.ok(names.includes('manifest.json'));
  for (const d of BUNDLE_DOMAINS) {
    assert.ok(names.includes(`${d}.json`), `missing ${d}.json in bundle`);
  }

  assert.equal(s3._sent.length, 1);
  assert.equal(s3._sent[0].input.Bucket, 'markos-gdpr');

  assert.ok(state.inserts.some(i => i.table === 'markos_gdpr_exports' && i.row.tenant_id === 't-acme'));
});
