'use strict';

async function handler(req, res) {
  if (req.method !== 'GET') { res.statusCode = 405; return res.end(); }

  const userId = (req.headers['x-markos-user-id'] || req.headers['X-Markos-User-Id']) || process.env.MARKOS_ACTIVE_USER_ID;
  const tenantId = (req.headers['x-markos-tenant-id'] || req.headers['X-Markos-Tenant-Id']) || null;
  const currentSessionId = (req.headers['x-markos-session-id'] || req.headers['X-Markos-Session-Id']) || null;

  if (!userId || !tenantId) { res.statusCode = 401; return res.end(JSON.stringify({ error: 'unauthenticated' })); }

  const { createClient } = require('@supabase/supabase-js');
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  );

  const { data, error } = await client
    .from('markos_sessions_devices')
    .select('session_id, device_label, user_agent, last_seen_at, revoked_at')
    .eq('user_id', userId)
    .eq('tenant_id', tenantId)
    .is('revoked_at', null)
    .order('last_seen_at', { ascending: false });

  if (error) { res.statusCode = 500; return res.end(JSON.stringify({ error: error.message })); }

  const sessions = (data || []).map(s => ({
    session_id: s.session_id,
    device_label: s.device_label,
    user_agent: s.user_agent,
    last_seen_at: s.last_seen_at,
    location: null, // Geo enrichment deferred to phase 206
    is_current: currentSessionId === s.session_id,
  }));

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  return res.end(JSON.stringify({ sessions }));
}

module.exports = handler;
