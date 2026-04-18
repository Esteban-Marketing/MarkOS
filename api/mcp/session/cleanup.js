'use strict';

// Phase 202 Plan 01: MCP session cleanup cron.
// Hard-purges rows whose expires_at OR revoked_at + 7d has passed (D-06 retention window).
// Scheduled at 0 */6 * * * (every 6 hours) via vercel.ts cron registry.
//
// Auth: shared-secret header (x-markos-cron-secret) OR Bearer token matching
// process.env.MARKOS_MCP_CRON_SECRET. Returns { success, purged } as JSON.

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
  const auth = (req.headers.authorization || req.headers.Authorization || '').replace(/^Bearer\s+/i, '');
  return header === expected || auth === expected;
}

function defaultClient() {
  const { createClient } = require('@supabase/supabase-js');
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  );
}

async function handleCleanup(req, res, deps = {}) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return writeJson(res, 405, { success: false, error: 'METHOD_NOT_ALLOWED' });
  }
  if (!authorized(req)) {
    return writeJson(res, 401, { success: false, error: 'UNAUTHORIZED' });
  }

  const client = deps.client || defaultClient();

  // 7-day retention window for both expired and revoked sessions.
  const cutoff = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();

  const { data, error } = await client
    .from('markos_mcp_sessions')
    .delete()
    .or(`expires_at.lt.${cutoff},revoked_at.lt.${cutoff}`)
    .select('id');
  if (error) return writeJson(res, 500, { success: false, error: error.message });

  const purged = Array.isArray(data) ? data.length : 0;
  return writeJson(res, 200, { success: true, purged });
}

module.exports = async function handler(req, res) { return handleCleanup(req, res); };
module.exports.handleCleanup = handleCleanup;
