'use strict';

const { initiateOffboarding } = require('../../../lib/markos/tenant/lifecycle.cjs');

async function handler(req, res) {
  if (req.method !== 'POST') { res.statusCode = 405; return res.end(); }

  const actor_id = req.headers['x-markos-user-id'] || req.headers['X-Markos-User-Id'] || null;
  const tenant_id = req.headers['x-markos-tenant-id'] || req.headers['X-Markos-Tenant-Id'] || null;
  if (!actor_id || !tenant_id) {
    res.statusCode = 401;
    return res.end(JSON.stringify({ error: 'unauthenticated' }));
  }

  const { createClient } = require('@supabase/supabase-js');
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  );

  try {
    const result = await initiateOffboarding(client, { tenant_id, actor_id });
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify(result));
  } catch (e) {
    if (e && e.code === 'forbidden') {
      res.statusCode = 403;
      return res.end(JSON.stringify({ error: 'forbidden' }));
    }
    if (e && e.code === 'already_offboarding') {
      res.statusCode = 409;
      return res.end(JSON.stringify({ error: 'already_offboarding' }));
    }
    res.statusCode = 500;
    return res.end(JSON.stringify({ error: 'offboard_failed', message: e && e.message }));
  }
}

module.exports = handler;
