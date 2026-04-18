'use strict';

// Phase 202 Plan 10 Task 3: weekly MCP KPI digest cron.
// Schedule: '0 9 * * 1' (Monday 9am UTC) — D-23 KPI tracking.
// Auth: MARKOS_MCP_CRON_SECRET shared secret (pattern from Plan 202-01 cleanup cron).
// Delegates to scripts/mcp/emit-kpi-digest.mjs (pure-function module).

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
  const expected = process.env.MARKOS_MCP_CRON_SECRET;
  if (!expected) return false;
  const header = req.headers['x-markos-cron-secret']
    || req.headers['X-Markos-Cron-Secret']
    || '';
  const auth = (req.headers.authorization || req.headers.Authorization || '')
    .replace(/^Bearer\s+/i, '');
  return header === expected || auth === expected;
}

function defaultClient() {
  const { createClient } = require('@supabase/supabase-js');
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
}

async function handle(req, res, deps = {}) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return writeJson(res, 405, { success: false, error: 'METHOD_NOT_ALLOWED' });
  }
  if (!authorized(req)) {
    return writeJson(res, 401, { success: false, error: 'UNAUTHORIZED' });
  }

  const supabase = deps.supabase || defaultClient();

  // Dynamic-import the ESM module from CJS.
  const { computeWeeklyKpi, sendDigest } = await import('../../scripts/mcp/emit-kpi-digest.mjs');

  try {
    const digest = await computeWeeklyKpi(supabase);
    const outcome = await sendDigest(digest, process.env.RESEND_API_KEY);
    return writeJson(res, 200, { success: true, digest, outcome });
  } catch (err) {
    return writeJson(res, 500, { success: false, error: err.message });
  }
}

module.exports = async function handler(req, res) { return handle(req, res); };
module.exports.handle = handle;
