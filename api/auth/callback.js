'use strict';

// Phase 201 Plan 03: GET /api/auth/callback?token_hash=...&type=magiclink
// verifyOtp + provision org+tenant on first verify. Redirects to /onboarding.

const { provisionOrgAndTenantOnVerify } = require('../../lib/markos/auth/provisioner.cjs');

async function handler(req, res) {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'method_not_allowed' }));
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  const urlParams = new URL(req.url, baseUrl);
  const token_hash = urlParams.searchParams.get('token_hash');
  const type = urlParams.searchParams.get('type') || 'magiclink';

  if (!token_hash) {
    res.statusCode = 302;
    res.setHeader('Location', `${baseUrl}/login?error=missing_token`);
    return res.end();
  }

  let client;
  try {
    const { createClient } = require('@supabase/supabase-js');
    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } },
    );
  } catch (e) {
    res.statusCode = 500;
    return res.end('client_init_failed');
  }

  const { data, error } = await client.auth.verifyOtp({ token_hash, type });
  if (error || !data || !data.user) {
    res.statusCode = 302;
    res.setHeader('Location', `${baseUrl}/login?error=invalid_link`);
    return res.end();
  }

  try {
    await provisionOrgAndTenantOnVerify(client, { user_id: data.user.id, email: data.user.email });
  } catch (e) {
    res.statusCode = 302;
    res.setHeader('Location', `${baseUrl}/login?error=provision_failed&message=${encodeURIComponent(e.message)}`);
    return res.end();
  }

  res.statusCode = 302;
  res.setHeader('Location', `${baseUrl}/onboarding`);
  return res.end();
}

module.exports = handler;
