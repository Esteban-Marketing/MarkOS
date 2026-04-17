'use strict';

// Phase 201 D-03: Vercel BotID server-side token verification.
// BotID is an invisible pre-submit token issued by Vercel's BotID script in the browser.
// The server MUST verify before acting on the submission. Fail-closed on any error.
// (Research.md Assumption A1: verify endpoint shape may change — config via env var.)

const BOTID_VERIFY_ENDPOINT = process.env.BOTID_VERIFY_ENDPOINT || 'https://botid.vercel.app/verify';

async function verifyBotIdToken(token, options = {}) {
  const { skipInTest, fetchImpl, endpoint } = options;

  if (skipInTest) return { ok: true, reason: 'test_skip' };
  if (!token || typeof token !== 'string') return { ok: false, reason: 'missing_token' };

  const fetchFn = fetchImpl || (typeof fetch !== 'undefined' ? fetch : null);
  if (!fetchFn) return { ok: false, reason: 'network_error' };

  try {
    const resp = await fetchFn(endpoint || BOTID_VERIFY_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.VERCEL_BOTID_SECRET || ''}`,
      },
      body: JSON.stringify({ token }),
    });
    if (!resp || !resp.ok) return { ok: false, reason: 'network_error' };
    const body = await resp.json().catch(() => null);
    if (!body || body.verified !== true) return { ok: false, reason: 'invalid' };
    return { ok: true, reason: 'verified' };
  } catch {
    return { ok: false, reason: 'network_error' };
  }
}

module.exports = { verifyBotIdToken, BOTID_VERIFY_ENDPOINT };
