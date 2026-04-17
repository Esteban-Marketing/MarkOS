'use strict';

const { listTenantsForUser } = require('../../../lib/markos/tenant/switcher.cjs');

async function handler(req, res) {
  if (req.method !== 'GET') { res.statusCode = 405; return res.end(); }

  const user_id = req.headers['x-markos-user-id'] || req.headers['X-Markos-User-Id'] || null;
  if (!user_id) {
    res.statusCode = 401;
    return res.end(JSON.stringify({ error: 'unauthenticated' }));
  }

  const { createClient } = require('@supabase/supabase-js');
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  );

  const orgs = await listTenantsForUser(client, user_id);

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  return res.end(JSON.stringify({ orgs }));
}

module.exports = handler;
