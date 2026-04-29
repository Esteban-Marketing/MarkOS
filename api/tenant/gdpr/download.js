'use strict';

// Phase 201.1 D-102 (closes H3): Server-mediated GDPR export download.
// The signed R2/S3 URL never reaches the client — this endpoint is the only download surface.
// Validates session_id + nonce + audience claim before proxying bytes.

const { createClient } = require('@supabase/supabase-js');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { consumeExportNonce } = require('../../../lib/markos/tenant/gdpr-export.cjs');

async function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => { raw += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(raw || '{}')); } catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Allow', 'POST');
    return res.end(JSON.stringify({ error: 'method_not_allowed' }));
  }

  const tenant_id = req.headers['x-markos-tenant-id'];
  const user_id   = req.headers['x-markos-user-id'];
  const session_id = req.headers['x-markos-session-id'];

  if (!tenant_id || !user_id || !session_id) {
    res.statusCode = 401;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'auth_headers_required' }));
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'invalid_json' }));
  }

  const { export_id, nonce } = body || {};
  if (!export_id || !nonce) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'export_id_and_nonce_required' }));
  }

  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'anon-key',
    { auth: { persistSession: false } },
  );

  const result = await consumeExportNonce(client, {
    export_id, nonce, session_id, user_id, requesting_tenant_id: tenant_id,
  });

  if (!result.ok) {
    const status = (result.reason === 'consumed' || result.reason === 'expired') ? 410
      : result.reason === 'audience_mismatch' ? 403
      : result.reason === 'not_found' ? 404
      : 400;
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: result.reason }));
  }

  // Server-side fetch from R2/S3; the signed URL never reaches the client.
  const s3 = new S3Client({
    region: process.env.AWS_REGION || 'auto',
    endpoint: process.env.R2_ENDPOINT || undefined,
    credentials: (process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY) ? {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    } : undefined,
  });

  let getResult;
  try {
    getResult = await s3.send(new GetObjectCommand({ Bucket: result.bucket, Key: result.object_key }));
  } catch (s3Err) {
    res.statusCode = 502;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'storage_unavailable' }));
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${export_id}.zip"`);
  res.setHeader('Cache-Control', 'no-store');

  if (getResult.Body && typeof getResult.Body.pipe === 'function') {
    getResult.Body.pipe(res);
  } else if (getResult.Body && typeof getResult.Body.transformToByteArray === 'function') {
    const buf = await getResult.Body.transformToByteArray();
    res.end(Buffer.from(buf));
  } else {
    res.end();
  }
};
