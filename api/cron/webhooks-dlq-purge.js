'use strict';

// Phase 203 Plan 03 Task 2: Webhook DLQ purge cron.
// Schedule: '30 3 * * *' (daily 03:30 UTC — offset from 02:00 lifecycle-purge +
// 02:30 cleanup-unverified-signups to avoid contention).
// Auth: shared-secret header (x-markos-cron-secret) OR Bearer token matching
// process.env.MARKOS_WEBHOOK_CRON_SECRET. Returns { success, count, duration_ms } as JSON.
//
// T-203-03-01 mitigation: secret-gated → 401 on mismatch (mirrors 202-01 cleanup cron pattern).
// T-203-03-05 mitigation: purgeExpired emits a single audit row per batch inside dlq.cjs
//   so the hash-chained audit log retains evidence forever after the DLQ rows are hard-deleted.

const { purgeExpired } = require('../../lib/markos/webhooks/dlq.cjs');

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
  const header = req.headers['x-markos-cron-secret']
    || req.headers['X-Markos-Cron-Secret']
    || '';
  const auth = (req.headers.authorization || req.headers.Authorization || '')
    .replace(/^Bearer\s+/i, '');
  return header === expected || auth === expected;
}

function defaultSupabaseClient() {
  const { createClient } = require('@supabase/supabase-js');
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  );
}

async function handle(req, res, deps = {}) {
  // Plan 2d: POST-only. Vercel cron triggers fire POST by default.
  if (req.method !== 'POST') {
    return writeJson(res, 405, { success: false, error: 'METHOD_NOT_ALLOWED' });
  }
  if (!authorized(req)) {
    return writeJson(res, 401, { success: false, error: 'UNAUTHORIZED' });
  }

  const supabase = deps.supabase || defaultSupabaseClient();
  const purge = deps.purgeExpired || purgeExpired;

  const started = Date.now();
  try {
    const { count } = await purge(supabase);
    return writeJson(res, 200, {
      success: true,
      count,
      duration_ms: Date.now() - started,
    });
  } catch (err) {
    return writeJson(res, 500, {
      success: false,
      error: err.message || 'purge_failed',
      duration_ms: Date.now() - started,
    });
  }
}

module.exports = async function handler(req, res) { return handle(req, res); };
module.exports.handle = handle;
