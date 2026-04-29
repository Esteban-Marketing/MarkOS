'use strict';

const { randomUUID, randomBytes } = require('node:crypto');
const { PassThrough } = require('node:stream');
const { enqueueAuditStaging } = require('../audit/writer.cjs');

const BUNDLE_DOMAINS = Object.freeze([
  'tenant', 'org', 'members', 'crm-contacts', 'crm-deals', 'crm-activity',
  'audit', 'webhooks', 'literacy', 'evidence-pack',
]);

// Phase 201.1 D-102 (closes H3): TTL cut from 604800 (7d) to 86400 (24h).
const SIGNED_URL_TTL_SECONDS = 86400;

// Phase 201.1 M5: ZIP size-bomb guard. Default 2 GiB. Override per-tenant via env for support cases.
const GDPR_EXPORT_MAX_BYTES = Number.parseInt(process.env.GDPR_EXPORT_MAX_BYTES_OVERRIDE || '', 10) || 2_147_483_648;

function loadArchiver(deps) {
  if (deps && deps.streamArchiver) return deps.streamArchiver;
  return require('archiver');
}

async function loadS3Utils(deps) {
  if (deps && deps.s3Client && deps.getSignedUrl && deps.PutObjectCommand && deps.GetObjectCommand) {
    return {
      s3: deps.s3Client,
      getSignedUrl: deps.getSignedUrl,
      PutObjectCommand: deps.PutObjectCommand,
      GetObjectCommand: deps.GetObjectCommand,
    };
  }
  const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
  const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
  const s3 = deps && deps.s3Client ? deps.s3Client : new S3Client({
    region: process.env.AWS_REGION || 'auto',
    endpoint: process.env.R2_ENDPOINT || undefined,
    credentials: (process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY) ? {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    } : undefined,
  });
  return { s3, getSignedUrl, PutObjectCommand, GetObjectCommand };
}

async function streamDomainToArchiver(client, archive, tenant_id, domain) {
  const tableByDomain = {
    'tenant':       { table: 'markos_tenants',       filter: { col: 'id', val: tenant_id } },
    'org':          null,
    'members':      { table: 'markos_tenant_memberships', filter: { col: 'tenant_id', val: tenant_id } },
    'crm-contacts': { table: 'crm_contacts',         filter: { col: 'tenant_id', val: tenant_id } },
    'crm-deals':    { table: 'crm_deals',            filter: { col: 'tenant_id', val: tenant_id } },
    'crm-activity': { table: 'crm_activity_ledger',  filter: { col: 'tenant_id', val: tenant_id } },
    'audit':        { table: 'markos_audit_log',     filter: { col: 'tenant_id', val: tenant_id } },
    'webhooks':     { table: 'markos_webhook_subscriptions', filter: { col: 'tenant_id', val: tenant_id } },
    'literacy':     { table: 'markos_mir_documents', filter: { col: 'tenant_id', val: tenant_id } },
    'evidence-pack':{ table: 'governance_evidence_packs', filter: { col: 'tenant_id', val: tenant_id } },
  };

  let rows = [];
  try {
    if (domain === 'org') {
      const { data: tenant } = await client.from('markos_tenants').select('org_id').eq('id', tenant_id).maybeSingle();
      if (tenant && tenant.org_id) {
        const { data: org } = await client.from('markos_orgs').select('*').eq('id', tenant.org_id).maybeSingle();
        rows = org ? [org] : [];
      }
    } else {
      const cfg = tableByDomain[domain];
      if (!cfg) rows = [];
      else {
        const { data } = await client.from(cfg.table).select('*').eq(cfg.filter.col, cfg.filter.val);
        rows = data || [];
      }
    }
  } catch (e) {
    rows = [{ _error: e && e.message ? e.message : String(e), _domain: domain }];
  }

  archive.append(JSON.stringify(rows, null, 2), { name: `${domain}.json` });
}

// Phase 201.1 D-102: generateExportBundle no longer returns signed_url to the caller.
// The signed URL is persisted server-side on the export row and retrieved only by consumeExportNonce.
// Caller receives { export_id, nonce, expires_at, object_key } — nonce is the client's single-use token.
async function generateExportBundle(client, input) {
  const { tenant_id, bucket } = input || {};
  if (!tenant_id || !bucket) throw new Error('generateExportBundle: tenant_id + bucket required');

  const archiverFn = loadArchiver(input);
  const { s3, getSignedUrl, PutObjectCommand, GetObjectCommand } = await loadS3Utils(input);

  const export_id = `gdpr-${randomUUID()}`;
  const nonce = randomBytes(32).toString('hex');
  const object_key = `exports/${tenant_id}/${export_id}.zip`;

  const archive = archiverFn('zip', { zlib: { level: 9 } });
  const pass = new PassThrough();
  archive.pipe(pass);

  // Phase 201.1 M5: byte-counter PassThrough to enforce GDPR_EXPORT_MAX_BYTES cap.
  let bytesWritten = 0;
  let oversizeAborted = false;
  const maxBytes = (input && typeof input.gdprExportMaxBytes === 'number')
    ? input.gdprExportMaxBytes
    : GDPR_EXPORT_MAX_BYTES;

  const countingPass = new PassThrough();
  pass.pipe(countingPass);

  // Intercept data events to track cumulative bytes.
  pass.on('data', (chunk) => {
    bytesWritten += chunk.length;
    if (!oversizeAborted && bytesWritten > maxBytes) {
      oversizeAborted = true;
      archive.abort();
    }
  });

  const uploadPromise = s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: object_key,
    Body: countingPass,
    ContentType: 'application/zip',
  }));

  archive.append(
    JSON.stringify({
      tenant_id,
      generated_at: new Date().toISOString(),
      bundle_version: 1,
      bundle_domains: [...BUNDLE_DOMAINS],
    }, null, 2),
    { name: 'manifest.json' },
  );

  for (const domain of BUNDLE_DOMAINS) {
    await streamDomainToArchiver(client, archive, tenant_id, domain);
  }

  try {
    await archive.finalize();
    await uploadPromise;
  } catch (archiveErr) {
    // If aborted due to oversize, clean up + mark export row + emit audit.
    if (oversizeAborted) {
      // Attempt partial-object cleanup (best-effort; log but do not throw on failure).
      try {
        if (input && input.deleteObject) {
          await input.deleteObject(bucket, object_key);
        } else {
          const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
          await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: object_key }));
        }
      } catch { /* noop — partial cleanup best-effort */ }

      // Persist oversize marker row for audit trail.
      try {
        await client.from('markos_gdpr_exports').insert({
          id: export_id, tenant_id, bucket, object_key, bytes: bytesWritten,
          signed_url: null, expires_at: null, nonce, audience_tenant_id: tenant_id,
          // status column does not exist on base schema — stored in payload only
        });
      } catch { /* noop */ }

      try {
        await enqueueAuditStaging(client, {
          tenant_id, org_id: null, source_domain: 'governance',
          action: 'gdpr_export.oversize_aborted', actor_id: 'system', actor_role: 'system',
          payload: { export_id, bucket, object_key, bytes_written: bytesWritten, max_bytes: maxBytes },
        });
      } catch { /* noop */ }

      const oversizeErr = new Error(`gdpr_export.oversize_aborted: bundle exceeded ${maxBytes} bytes cap`);
      oversizeErr.code = 'oversize_aborted';
      oversizeErr.export_id = export_id;
      oversizeErr.bytes_written = bytesWritten;
      oversizeErr.max_bytes = maxBytes;
      throw oversizeErr;
    }
    throw archiveErr;
  }

  const signed_url = await getSignedUrl(s3, new GetObjectCommand({ Bucket: bucket, Key: object_key }), { expiresIn: SIGNED_URL_TTL_SECONDS });
  const expires_at = new Date(Date.now() + SIGNED_URL_TTL_SECONDS * 1000).toISOString();

  await client.from('markos_gdpr_exports').insert({
    id: export_id, tenant_id, bucket, object_key, bytes: bytesWritten || null,
    signed_url, expires_at, nonce, audience_tenant_id: tenant_id,
  });

  try {
    await enqueueAuditStaging(client, {
      tenant_id, org_id: null, source_domain: 'governance',
      action: 'gdpr_export.generated', actor_id: 'system', actor_role: 'system',
      payload: { export_id, bucket, object_key, expires_at },
    });
  } catch { /* noop */ }

  // D-102: signed_url is NOT returned to the client. Caller receives nonce + export_id.
  return { export_id, nonce, expires_at, object_key };
}

// Phase 201.1 D-102: Single-use nonce consumption. Enforces download-once at the DB PK layer.
async function consumeExportNonce(client, input) {
  const { export_id, nonce, session_id, user_id, requesting_tenant_id } = input || {};
  if (!export_id || !nonce || !requesting_tenant_id) {
    return { ok: false, reason: 'invalid_input' };
  }

  // 1. Lookup the export row.
  const { data: row, error: selErr } = await client
    .from('markos_gdpr_exports')
    .select('id, audience_tenant_id, signed_url, object_key, bucket, expires_at, nonce')
    .eq('id', export_id)
    .maybeSingle();
  if (selErr || !row) return { ok: false, reason: 'not_found' };

  // 2. Audience claim: the export bundle must belong to the requesting tenant.
  if (row.audience_tenant_id !== requesting_tenant_id) return { ok: false, reason: 'audience_mismatch' };

  // 3. Expiry check.
  if (new Date(row.expires_at).getTime() < Date.now()) return { ok: false, reason: 'expired' };

  // 4. Nonce match (defense-in-depth — attacker must know both export_id AND current nonce).
  if (row.nonce !== nonce) return { ok: false, reason: 'nonce_mismatch' };

  // 5. Single-use enforcement: INSERT (export_id, nonce) — primary key violation = replay attempt.
  const { error: insertErr } = await client.from('markos_gdpr_export_consumed').insert({
    export_id,
    nonce,
    consumed_by_session_id: session_id || null,
    consumed_by_user_id: user_id || null,
  });

  if (insertErr) {
    // Replay path: the PK (export_id, nonce) was already present.
    try {
      await enqueueAuditStaging(client, {
        tenant_id: requesting_tenant_id, org_id: null, source_domain: 'governance',
        action: 'gdpr_export.replay_blocked', actor_id: user_id || 'unknown', actor_role: 'owner',
        payload: { export_id, session_id, error: insertErr.message },
      });
    } catch { /* noop */ }
    return { ok: false, reason: 'consumed' };
  }

  // 6. Success audit.
  try {
    await enqueueAuditStaging(client, {
      tenant_id: requesting_tenant_id, org_id: null, source_domain: 'governance',
      action: 'gdpr_export.downloaded', actor_id: user_id || 'unknown', actor_role: 'owner',
      payload: { export_id, session_id, expires_at: row.expires_at },
    });
  } catch { /* noop */ }

  return { ok: true, signed_url: row.signed_url, object_key: row.object_key, bucket: row.bucket };
}

// Phase 201.1 D-102: Re-auth-required nonce rotation + TTL extension.
// Requires the requestor to be an owner of the requesting tenant.
async function reissueExport(client, input) {
  const { export_id, actor_user_id, session_id, requesting_tenant_id } = input || {};
  if (!export_id || !actor_user_id || !requesting_tenant_id) {
    throw new Error('reissueExport: export_id + actor_user_id + requesting_tenant_id required');
  }

  // Verify the user is owner on the requesting tenant.
  const { data: tenant } = await client.from('markos_tenants').select('org_id').eq('id', requesting_tenant_id).maybeSingle();
  if (!tenant) throw new Error('reissueExport: tenant not found');

  const { data: m } = await client.from('markos_org_memberships')
    .select('role').eq('user_id', actor_user_id).eq('org_id', tenant.org_id).maybeSingle();
  if (!m || m.role !== 'owner') throw new Error('reissueExport: owner role required');

  // Verify export belongs to this tenant.
  const { data: row } = await client.from('markos_gdpr_exports')
    .select('id, audience_tenant_id').eq('id', export_id).maybeSingle();
  if (!row) throw new Error('reissueExport: export not found');
  if (row.audience_tenant_id !== requesting_tenant_id) throw new Error('reissueExport: audience_mismatch');

  const newNonce = randomBytes(32).toString('hex');
  const newExpiresAt = new Date(Date.now() + SIGNED_URL_TTL_SECONDS * 1000).toISOString();

  const { error: updErr } = await client.from('markos_gdpr_exports')
    .update({ nonce: newNonce, expires_at: newExpiresAt, reissued_at: new Date().toISOString() })
    .eq('id', export_id);
  if (updErr) throw new Error(`reissueExport: update failed: ${updErr.message}`);

  try {
    await enqueueAuditStaging(client, {
      tenant_id: requesting_tenant_id, org_id: tenant.org_id, source_domain: 'governance',
      action: 'gdpr_export.reissued', actor_id: actor_user_id, actor_role: 'owner',
      payload: { export_id, session_id, expires_at: newExpiresAt },
    });
  } catch { /* noop */ }

  return { export_id, nonce: newNonce, expires_at: newExpiresAt };
}

module.exports = {
  BUNDLE_DOMAINS,
  SIGNED_URL_TTL_SECONDS,
  GDPR_EXPORT_MAX_BYTES,
  generateExportBundle,
  consumeExportNonce,
  reissueExport,
};
