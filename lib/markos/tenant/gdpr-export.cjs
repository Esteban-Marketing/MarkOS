'use strict';

const { randomUUID } = require('node:crypto');
const { PassThrough } = require('node:stream');
const { enqueueAuditStaging } = require('../audit/writer.cjs');

const BUNDLE_DOMAINS = Object.freeze([
  'tenant', 'org', 'members', 'crm-contacts', 'crm-deals', 'crm-activity',
  'audit', 'webhooks', 'literacy', 'evidence-pack',
]);
const SIGNED_URL_TTL_SECONDS = 604800; // 7 days

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

async function generateExportBundle(client, input) {
  const { tenant_id, bucket } = input || {};
  if (!tenant_id || !bucket) throw new Error('generateExportBundle: tenant_id + bucket required');

  const archiver = loadArchiver(input);
  const { s3, getSignedUrl, PutObjectCommand, GetObjectCommand } = await loadS3Utils(input);

  const export_id = `gdpr-${randomUUID()}`;
  const object_key = `exports/${tenant_id}/${export_id}.zip`;

  const archive = archiver('zip', { zlib: { level: 9 } });
  const pass = new PassThrough();
  archive.pipe(pass);

  const uploadPromise = s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: object_key,
    Body: pass,
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

  await archive.finalize();
  await uploadPromise;

  const signed_url = await getSignedUrl(s3, new GetObjectCommand({ Bucket: bucket, Key: object_key }), { expiresIn: SIGNED_URL_TTL_SECONDS });
  const expires_at = new Date(Date.now() + SIGNED_URL_TTL_SECONDS * 1000).toISOString();

  await client.from('markos_gdpr_exports').insert({
    id: export_id, tenant_id, bucket, object_key, bytes: null, signed_url, expires_at,
  });

  try {
    await enqueueAuditStaging(client, {
      tenant_id, org_id: null, source_domain: 'governance',
      action: 'gdpr_export.generated', actor_id: 'system', actor_role: 'system',
      payload: { export_id, bucket, object_key, expires_at },
    });
  } catch { /* noop */ }

  return { export_id, object_key, signed_url, expires_at };
}

module.exports = { BUNDLE_DOMAINS, SIGNED_URL_TTL_SECONDS, generateExportBundle };
