'use strict';

const { verifyBotIdToken } = require('./botid.cjs');
const { checkSignupRateLimit, recordSignupAttempt, hashIp } = require('./rate-limit.cjs');

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

async function enqueueSignup(client, input, options = {}) {
  const { email, botIdToken, ip } = input || {};
  const { fetchImpl, skipBotIdInTest, baseUrl } = options;

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    return { ok: false, code: 'invalid_email', message: 'email missing or malformed' };
  }
  const normalised = email.trim().toLowerCase();

  // 1) BotID pre-submit gate (D-03, fail-closed)
  const bot = await verifyBotIdToken(botIdToken, { fetchImpl, skipInTest: skipBotIdInTest });
  if (!bot.ok) return { ok: false, code: 'bot_detected', message: `BotID ${bot.reason}` };

  // 2) Rate-limit pre-buffer (D-03)
  const rl = await checkSignupRateLimit(client, { ip: ip || 'unknown', email: normalised });
  if (!rl.allowed) return { ok: false, code: 'rate_limited', message: rl.reason };

  // 3) Buffer into markos_unverified_signups (NOT markos_orgs — Pitfall 1)
  const { error: bufferErr } = await client
    .from('markos_unverified_signups')
    .upsert(
      {
        email: normalised,
        botid_token: botIdToken || null,
        ip_hash: hashIp(ip || 'unknown'),
      },
      { onConflict: 'email' }
    );
  if (bufferErr) return { ok: false, code: 'db_error', message: bufferErr.message };

  // 4) Send the magic link. Supabase creates auth.users synchronously — that is expected per
  //    Pitfall 1. The app-layer gate is the buffer + provisioner, NOT auth.users presence.
  const redirectTo = `${baseUrl || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/callback`;
  const { error: otpErr } = await client.auth.signInWithOtp({
    email: normalised,
    options: { shouldCreateUser: true, emailRedirectTo: redirectTo },
  });
  if (otpErr) return { ok: false, code: 'supabase_error', message: otpErr.message };

  // 5) Record the attempt for future rate-limit windows (best-effort).
  try { await recordSignupAttempt(client, { ip: ip || 'unknown', email: normalised }); } catch { /* noop */ }

  // Buffer expires 1 hour after insert (migration 83 default).
  return { ok: true, buffer_expires_at: new Date(Date.now() + 3_600_000).toISOString() };
}

module.exports = { enqueueSignup };
