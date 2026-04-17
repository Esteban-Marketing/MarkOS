'use strict';

const { createHash } = require('node:crypto');

const RATE_LIMITS = Object.freeze({
  ip_hourly:        { window_ms: 3_600_000, max: 5 },
  email_per_minute: { window_ms: 60_000,    max: 1 },
});

function hashIp(ip) {
  if (typeof ip !== 'string' || !ip) return createHash('sha256').update('unknown').digest('hex');
  return createHash('sha256').update(ip.trim().toLowerCase()).digest('hex');
}

function windowStart(now, window_ms) {
  return new Date(Math.floor(now / window_ms) * window_ms).toISOString();
}

async function checkSignupRateLimit(client, input) {
  if (!client || typeof client.from !== 'function') throw new Error('checkSignupRateLimit: client required');
  const { ip, email } = input || {};
  if (typeof ip !== 'string' || typeof email !== 'string') {
    throw new Error('checkSignupRateLimit: ip + email required');
  }

  const now = Date.now();
  const ipWindow = windowStart(now, RATE_LIMITS.ip_hourly.window_ms);
  const ip_hash = hashIp(ip);

  // Check email throttle first (cheaper table).
  const { data: emailRow, error: emailErr } = await client
    .from('markos_signup_email_throttle')
    .select('last_sent_at')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle();
  if (emailErr) throw new Error(`checkSignupRateLimit: email select failed: ${emailErr.message}`);
  if (emailRow && emailRow.last_sent_at) {
    const elapsed = now - new Date(emailRow.last_sent_at).getTime();
    if (elapsed < RATE_LIMITS.email_per_minute.window_ms) {
      return { allowed: false, reason: 'email_per_minute' };
    }
  }

  // Check IP hourly window.
  const { data: ipRow, error: ipErr } = await client
    .from('markos_signup_rate_limits')
    .select('attempt_count')
    .eq('ip_hash', ip_hash)
    .eq('window_start', ipWindow)
    .maybeSingle();
  if (ipErr) throw new Error(`checkSignupRateLimit: ip select failed: ${ipErr.message}`);
  if (ipRow && ipRow.attempt_count >= RATE_LIMITS.ip_hourly.max) {
    return { allowed: false, reason: 'ip_hourly' };
  }

  return { allowed: true, reason: 'ok' };
}

async function recordSignupAttempt(client, input) {
  const { ip, email } = input;
  const now = Date.now();
  const ipWindow = windowStart(now, RATE_LIMITS.ip_hourly.window_ms);
  const ip_hash = hashIp(ip);

  await client
    .from('markos_signup_rate_limits')
    .upsert(
      { ip_hash, window_start: ipWindow, attempt_count: 1, updated_at: new Date(now).toISOString() },
      { onConflict: 'ip_hash,window_start', ignoreDuplicates: false }
    );
  // Postgres-level increment on conflict isn't a one-liner in PostgREST — use RPC in prod.
  // For now: best-effort upsert + RPC increment lives in Plan 08.

  await client
    .from('markos_signup_email_throttle')
    .upsert(
      { email: email.trim().toLowerCase(), last_sent_at: new Date(now).toISOString() },
      { onConflict: 'email', ignoreDuplicates: false }
    );
}

module.exports = { RATE_LIMITS, hashIp, windowStart, checkSignupRateLimit, recordSignupAttempt };
