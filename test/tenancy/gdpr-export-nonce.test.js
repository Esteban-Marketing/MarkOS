'use strict';

// Phase 201.1 D-102 (closes H3): nonce shape, TTL, oversize cap tests.

const test = require('node:test');
const assert = require('node:assert/strict');
const { generateExportBundle, SIGNED_URL_TTL_SECONDS, GDPR_EXPORT_MAX_BYTES } = require('../../lib/markos/tenant/gdpr-export.cjs');

function makeMockArchiver(opts) {
  const appended = [];
  const archive = {
    _appended: appended,
    pipe: () => {},
    append: (data, o) => { appended.push({ data, opts: o }); },
    finalize: async () => {},
    abort: () => {},
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

function makeClient(state) {
  return {
    from: (table) => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => (table === 'markos_tenants' ? { data: { org_id: 'o1' } } : { data: null }) }) }),
      insert: (row) => {
        (state.inserts = state.inserts || []).push({ table, row });
        return { then: (resolve) => resolve({ error: null }) };
      },
    }),
  };
}

test('Suite 201.1-08: SIGNED_URL_TTL_SECONDS is 86400 (24h)', () => {
  assert.equal(SIGNED_URL_TTL_SECONDS, 86400);
});

test('Suite 201.1-08: GDPR_EXPORT_MAX_BYTES is 2 GiB by default', () => {
  assert.equal(GDPR_EXPORT_MAX_BYTES, 2_147_483_648);
});

test('Suite 201.1-08: generateExportBundle returns { export_id, nonce, expires_at, object_key } — no signed_url', async () => {
  const state = {};
  const client = makeClient(state);
  const archiveFn = makeMockArchiver();
  const s3 = makeMockS3();
  const getSignedUrl = async () => 'https://signed.example/?sig=abc';
  class PutObjectCommand { constructor(p) { this.input = p; } }
  class GetObjectCommand { constructor(p) { this.input = p; } }

  const r = await generateExportBundle(client, {
    tenant_id: 't-nonce', bucket: 'markos-gdpr',
    streamArchiver: archiveFn, s3Client: s3, getSignedUrl, PutObjectCommand, GetObjectCommand,
  });

  assert.ok(r.export_id.startsWith('gdpr-'), 'export_id must start with gdpr-');
  assert.ok(typeof r.nonce === 'string' && r.nonce.length === 64, 'nonce must be 64 hex chars');
  assert.ok(r.expires_at, 'expires_at must be present');
  assert.ok(r.object_key.startsWith('exports/t-nonce/'), 'object_key must be scoped to tenant');
  // D-102: signed_url must NOT be returned to the caller.
  assert.equal(r.signed_url, undefined, 'signed_url must NOT be in return value (D-102 H3 closure)');
});

test('Suite 201.1-08: nonce is 64 hex chars (randomBytes(32).toString("hex"))', async () => {
  const state = {};
  const client = makeClient(state);
  const archiveFn = makeMockArchiver();
  const s3 = makeMockS3();
  const getSignedUrl = async () => 'https://signed.example/?sig=abc';
  class PutObjectCommand { constructor(p) { this.input = p; } }
  class GetObjectCommand { constructor(p) { this.input = p; } }

  const r = await generateExportBundle(client, {
    tenant_id: 't-nonce2', bucket: 'markos-gdpr',
    streamArchiver: archiveFn, s3Client: s3, getSignedUrl, PutObjectCommand, GetObjectCommand,
  });

  assert.match(r.nonce, /^[0-9a-f]{64}$/, 'nonce must be lowercase hex');
});

test('Suite 201.1-08: expires_at is ~24h from now', async () => {
  const state = {};
  const client = makeClient(state);
  const archiveFn = makeMockArchiver();
  const s3 = makeMockS3();
  const getSignedUrl = async () => 'https://signed.example/?sig=abc';
  class PutObjectCommand { constructor(p) { this.input = p; } }
  class GetObjectCommand { constructor(p) { this.input = p; } }

  const before = Date.now();
  const r = await generateExportBundle(client, {
    tenant_id: 't-ttl', bucket: 'markos-gdpr',
    streamArchiver: archiveFn, s3Client: s3, getSignedUrl, PutObjectCommand, GetObjectCommand,
  });
  const after = Date.now();

  const expiresMs = new Date(r.expires_at).getTime();
  assert.ok(expiresMs >= before + 86400 * 1000 - 5_000, 'expires_at must be at least 24h from now');
  assert.ok(expiresMs <= after + 86400 * 1000 + 5_000, 'expires_at must not be more than 24h+5s from now');
});

test('Suite 201.1-08 M5: oversize export throws with code oversize_aborted and emits audit', async () => {
  const state = {};
  const auditStaged = [];

  // Client that captures inserts + audit staging
  const client = {
    from: (table) => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }),
      insert: (row) => {
        (state.inserts = state.inserts || []).push({ table, row });
        if (table === 'markos_audit_log_staging') auditStaged.push(row);
        return { then: (resolve) => resolve({ error: null }), select: () => ({ single: async () => ({ data: { id: 1 }, error: null }) }) };
      },
    }),
  };

  let deleteCalled = false;
  const deleteObject = async () => { deleteCalled = true; };

  // Archiver that immediately emits enough data to cross the tiny 10-byte cap.
  // We simulate this by having the PassThrough emit data via the pipe event in the real code.
  // Since the archiver mock doesn't pipe real data, we set an impossibly small cap.
  const archiveFn = makeMockArchiver();

  // Intercept finalize to simulate data flowing through pass
  const realArchive = archiveFn._archive;
  realArchive._pipeTarget = null;
  realArchive.pipe = (target) => { realArchive._pipeTarget = target; };
  realArchive.finalize = async () => {
    // Simulate 100 bytes flowing through the PassThrough to trigger oversize.
    if (realArchive._pipeTarget) {
      realArchive._pipeTarget.emit('data', Buffer.alloc(100));
    }
    throw new Error('archive aborted');
  };

  const s3 = makeMockS3();
  const getSignedUrl = async () => 'https://signed.example/?sig=abc';
  class PutObjectCommand { constructor(p) { this.input = p; } }
  class GetObjectCommand { constructor(p) { this.input = p; } }

  let threw = null;
  try {
    await generateExportBundle(client, {
      tenant_id: 't-oversize', bucket: 'markos-gdpr',
      streamArchiver: archiveFn, s3Client: s3, getSignedUrl, PutObjectCommand, GetObjectCommand,
      deleteObject,
      gdprExportMaxBytes: 10, // 10-byte cap for test
    });
  } catch (e) {
    threw = e;
  }

  assert.ok(threw, 'must throw on oversize');
  assert.equal(threw.code, 'oversize_aborted', 'error code must be oversize_aborted');
  assert.ok(threw.max_bytes === 10, 'max_bytes must reflect the cap');
  assert.ok(deleteCalled, 'partial object must be deleted on oversize');

  const oversizeAudit = auditStaged.find(r => r && r.action === 'gdpr_export.oversize_aborted');
  assert.ok(oversizeAudit, 'must emit gdpr_export.oversize_aborted audit row');
  assert.equal(oversizeAudit.source_domain, 'governance');
});
