'use strict';

// Phase 200.1 D-202: purge replay-protection nonces older than 10 minutes.
// Schedule is registered in vercel.ts every 5 minutes. The handler shares the
// existing MARKOS_WEBHOOK_CRON_SECRET auth model with the DLQ and rotation sweeps.

const { enqueueAuditStaging } = require('../../lib/markos/audit/writer.cjs');

const NONCE_RETENTION_MINUTES = 10;

function writeJson(res, statusCode, payload) {
  if (typeof res.writeHead === 'function') {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  } else {
    res.statusCode = statusCode;
    if (typeof res.setHeader === 'function') res.setHeader('Content-Type', 'application/json');
  }
  res.end(JSON.stringify(payload));
}

function authorized(req) {
  const expected = process.env.MARKOS_WEBHOOK_CRON_SECRET;
  if (!expected) return false;
  const vercelSignature = req.headers['x-vercel-cron-signature'] || req.headers['X-Vercel-Cron-Signature'] || '';
  const header = req.headers['x-markos-cron-secret']
    || req.headers['X-Markos-Cron-Secret']
    || '';
  const auth = (req.headers.authorization || req.headers.Authorization || '')
    .replace(/^Bearer\s+/i, '');
  return vercelSignature === expected || header === expected || auth === expected;
}

function defaultSupabaseClient() {
  const { createClient } = require('@supabase/supabase-js');
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  );
}

async function purgeExpiredNonces(client, { now = new Date(), emitAudit = enqueueAuditStaging } = {}) {
  const cutoffIso = new Date(now.getTime() - (NONCE_RETENTION_MINUTES * 60 * 1000)).toISOString();
  const { data, error } = await client
    .from('markos_webhook_delivery_nonces')
    .delete()
    .lt('created_at', cutoffIso)
    .select('nonce, subscription_id');

  if (error) throw new Error(`purgeExpiredNonces: ${error.message}`);

  const deletedCount = Array.isArray(data) ? data.length : 0;
  try {
    await emitAudit(client, {
      tenant_id: 'system',
      org_id: null,
      source_domain: 'webhooks',
      action: 'nonce.purged',
      actor_id: 'system:cron',
      actor_role: 'system',
      payload: {
        deleted_count: deletedCount,
        older_than_minutes: NONCE_RETENTION_MINUTES,
        purged_at: now.toISOString(),
      },
    });
  } catch {
    // Best-effort: purge already succeeded and replay protection remains correct.
  }

  return { deletedCount, cutoffIso };
}

async function handle(req, res, deps = {}) {
  if (req.method !== 'POST') {
    return writeJson(res, 405, { success: false, error: 'METHOD_NOT_ALLOWED' });
  }
  if (!authorized(req)) {
    return writeJson(res, 401, { success: false, error: 'UNAUTHORIZED' });
  }

  const supabase = deps.supabase || defaultSupabaseClient();
  const purge = deps.purgeExpiredNonces || purgeExpiredNonces;

  const started = Date.now();
  try {
    const { deletedCount } = await purge(supabase, {
      now: deps.now || new Date(),
      emitAudit: deps.enqueueAuditStaging || enqueueAuditStaging,
    });
    return writeJson(res, 200, {
      success: true,
      deleted_count: deletedCount,
      duration_ms: Date.now() - started,
    });
  } catch (error) {
    return writeJson(res, 500, {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      duration_ms: Date.now() - started,
    });
  }
}

module.exports = async function handler(req, res) { return handle(req, res); };
module.exports.handle = handle;
module.exports.purgeExpiredNonces = purgeExpiredNonces;
module.exports.NONCE_RETENTION_MINUTES = NONCE_RETENTION_MINUTES;
