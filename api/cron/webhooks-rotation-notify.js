'use strict';

// Phase 203 Plan 06 Task 1: Webhook rotation notification cron.
// Schedule: '0 4 * * *' (daily 04:00 UTC — offset from dlq-purge at 03:30 UTC).
// Auth: shared-secret header (x-markos-cron-secret) OR Bearer token matching
// process.env.MARKOS_WEBHOOK_CRON_SECRET (same env as Plan 203-03 dlq-purge —
// one secret serves both webhook crons).
// Delegates to lib/markos/webhooks/rotation-notify.cjs notifyRotations, which:
//   1. Lists active rotations via migration 72 markos_webhook_secret_rotations
//   2. Filters to stage ∈ {t-7, t-1, t-0} via computeStage(grace_ends_at)
//   3. Dedups via Redis SET NX EX 90d (T-203-06-02)
//   4. Fetches tenant admins (role IN 'owner','admin') (T-203-06-01)
//   5. Emails via Resend (or console-log dry-run when RESEND_API_KEY absent)
//   6. Emits one audit row per successful send (T-203-06-05)

const { notifyRotations } = require('../../lib/markos/webhooks/rotation-notify.cjs');

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
  // eslint-disable-next-line global-require
  const { createClient } = require('@supabase/supabase-js');
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  );
}

function defaultRedisClient() {
  // Upstash Redis via @upstash/redis — lazy-required so dev environments
  // without the package can still run this handler under injection.
  try {
    // eslint-disable-next-line global-require
    const { Redis } = require('@upstash/redis');
    return Redis.fromEnv();
  } catch {
    // Fall through to noop redis so notifyRotations treats every key as new.
    // Production MUST set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN —
    // cron runs without Redis lose idempotency but not correctness.
    return null;
  }
}

async function handle(req, res, deps = {}) {
  // POST-only (Vercel cron triggers fire POST by default; tighter than GET).
  if (req.method !== 'POST') {
    return writeJson(res, 405, { ok: false, error: 'METHOD_NOT_ALLOWED' });
  }
  if (!authorized(req)) {
    return writeJson(res, 401, { ok: false, error: 'UNAUTHORIZED' });
  }

  const supabase = deps.supabase || defaultSupabaseClient();
  const redis = deps.redis !== undefined ? deps.redis : defaultRedisClient();
  const notifyFn = deps.notifyRotations || notifyRotations;

  const started = Date.now();
  try {
    const result = await notifyFn(supabase, new Date(), {
      redis,
      resendClient: deps.resendClient || null,
    });
    return writeJson(res, 200, {
      ok: true,
      sent_count: result.sent || 0,
      skipped_count: result.skipped || 0,
      total_active: result.total_active || 0,
      duration_ms: Date.now() - started,
    });
  } catch (err) {
    return writeJson(res, 500, {
      ok: false,
      error: (err && err.message) || 'notify_failed',
      duration_ms: Date.now() - started,
    });
  }
}

module.exports = async function handler(req, res) { return handle(req, res); };
module.exports.handle = handle;
