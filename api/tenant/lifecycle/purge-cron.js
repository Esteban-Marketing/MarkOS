'use strict';

const { runPurgeJob } = require('../../../lib/markos/tenant/lifecycle.cjs');

async function handler(req, res) {
  if (req.method !== 'POST') { res.statusCode = 405; return res.end(); }

  const secret = process.env.MARKOS_PURGE_CRON_SECRET || '';
  const provided = req.headers['x-markos-cron-secret'] || req.headers['X-Markos-Cron-Secret'] || '';
  if (!secret || provided !== secret) {
    res.statusCode = 401;
    return res.end(JSON.stringify({ error: 'unauthorised' }));
  }

  const { createClient } = require('@supabase/supabase-js');
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  );

  const result = await runPurgeJob(client);
  res.statusCode = result && Array.isArray(result.errors) && result.errors.length === 0 ? 200 : 207;
  res.setHeader('Content-Type', 'application/json');
  return res.end(JSON.stringify(result));
}

module.exports = handler;
