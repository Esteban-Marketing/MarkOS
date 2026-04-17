'use strict';

const { randomUUID } = require('node:crypto');

// @simplewebauthn/server v13 — wrapped so the rest of the codebase never imports it directly.
// On install failure / missing module the library still loads for test purposes (tests stub it).
let webauthn = null;
function getWebauthn() {
  if (webauthn) return webauthn;
  try {
    webauthn = require('@simplewebauthn/server');
  } catch (err) {
    throw new Error(`@simplewebauthn/server not installed. Run: npm install @simplewebauthn/server@^13.3.0 — underlying: ${err.message}`);
  }
  return webauthn;
}

const { enqueueAuditStaging } = require('../audit/writer.cjs');

const PASSKEY_CHALLENGE_TTL_MS = 120_000;
const PASSKEY_PROMPT_DISMISSED_COOKIE = 'markos_passkey_prompt_dismissed';

async function createRegistrationOptions(client, input, deps = {}) {
  const { user_id, rpID, rpName, userName } = input;
  if (!user_id || !rpID) throw new Error('createRegistrationOptions: user_id + rpID required');

  const impl = deps.webauthn || getWebauthn();
  const options = await impl.generateRegistrationOptions({
    rpName: rpName || 'MarkOS',
    rpID,
    userName: userName || user_id,
    userID: new TextEncoder().encode(user_id),
    attestationType: 'none',
    authenticatorSelection: { residentKey: 'required', userVerification: 'required' },
    timeout: 60_000,
  });

  const challenge_id = `pkchal-${randomUUID()}`;
  const { error } = await client
    .from('markos_passkey_challenges')
    .insert({
      id: challenge_id,
      user_id,
      challenge: options.challenge,
      kind: 'registration',
      expires_at: new Date(Date.now() + PASSKEY_CHALLENGE_TTL_MS).toISOString(),
    });
  if (error) throw new Error(`createRegistrationOptions: challenge insert failed: ${error.message}`);

  return { options, challenge_id };
}

async function consumeChallenge(client, challenge_id, user_id, kind) {
  const { data: row, error } = await client
    .from('markos_passkey_challenges')
    .select('id, challenge, user_id, kind, expires_at')
    .eq('id', challenge_id)
    .maybeSingle();

  if (error) throw new Error(`consumeChallenge: select failed: ${error.message}`);
  if (!row) throw new Error('challenge_not_found');
  if (row.user_id !== user_id) throw new Error('challenge_user_mismatch');
  if (row.kind !== kind) throw new Error('challenge_kind_mismatch');
  if (new Date(row.expires_at).getTime() < Date.now()) throw new Error('challenge_expired');

  // Delete immediately — one-time token.
  await client.from('markos_passkey_challenges').delete().eq('id', row.id);

  return row.challenge;
}

async function verifyRegistrationResponse(client, input, deps = {}) {
  const { user_id, challenge_id, attResponse, expectedOrigin, expectedRPID } = input;
  if (!user_id || !challenge_id || !attResponse) throw new Error('verifyRegistrationResponse: user_id + challenge_id + attResponse required');

  const expectedChallenge = await consumeChallenge(client, challenge_id, user_id, 'registration');
  const impl = deps.webauthn || getWebauthn();
  const verification = await impl.verifyRegistrationResponse({
    response: attResponse,
    expectedChallenge,
    expectedOrigin,
    expectedRPID,
  });

  if (!verification.verified || !verification.registrationInfo) {
    return { verified: false };
  }

  const info = verification.registrationInfo;
  const credential = info.credential || info; // v13 moved shape slightly; handle both

  const credential_id = credential.id;
  const public_key_b64 = Buffer.from(credential.publicKey).toString('base64');

  const id = `pkcred-${randomUUID()}`;
  const { error } = await client
    .from('markos_passkey_credentials')
    .insert({
      id,
      user_id,
      credential_id,
      public_key: public_key_b64,
      counter: credential.counter || 0,
      device_type: info.credentialDeviceType || null,
      backed_up: !!info.credentialBackedUp,
      aaguid: info.aaguid || null,
    });
  if (error) throw new Error(`verifyRegistrationResponse: credential insert failed: ${error.message}`);

  // Emit audit row (best-effort, fire-and-forget pattern) — staging drained by Plan 02 cron.
  try {
    await enqueueAuditStaging(client, {
      tenant_id: user_id,              // audit keyed on user_id for auth events
      org_id: null,
      source_domain: 'auth',
      action: 'passkey.registered',
      actor_id: user_id,
      actor_role: 'owner',
      payload: { credential_id, device_type: info.credentialDeviceType, backed_up: !!info.credentialBackedUp },
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[passkey] audit staging failed:', err.message);
  }

  return { verified: true, credential_id };
}

async function createAuthenticationOptions(client, input, deps = {}) {
  const { user_id, rpID } = input;
  if (!user_id || !rpID) throw new Error('createAuthenticationOptions: user_id + rpID required');

  // Pull the user's existing credentials so the client can pick one.
  const { data: creds, error } = await client
    .from('markos_passkey_credentials')
    .select('credential_id')
    .eq('user_id', user_id);
  if (error) throw new Error(`createAuthenticationOptions: cred list failed: ${error.message}`);

  const impl = deps.webauthn || getWebauthn();
  const options = await impl.generateAuthenticationOptions({
    rpID,
    allowCredentials: (creds || []).map((c) => ({
      id: c.credential_id,
      type: 'public-key',
    })),
    userVerification: 'required',
    timeout: 60_000,
  });

  const challenge_id = `pkchal-${randomUUID()}`;
  await client
    .from('markos_passkey_challenges')
    .insert({
      id: challenge_id,
      user_id,
      challenge: options.challenge,
      kind: 'authentication',
      expires_at: new Date(Date.now() + PASSKEY_CHALLENGE_TTL_MS).toISOString(),
    });

  return { options, challenge_id };
}

async function verifyAuthenticationResponse(client, input, deps = {}) {
  const { user_id, challenge_id, authResponse, expectedOrigin, expectedRPID } = input;
  if (!user_id || !challenge_id || !authResponse) throw new Error('verifyAuthenticationResponse: required fields missing');

  const expectedChallenge = await consumeChallenge(client, challenge_id, user_id, 'authentication');

  const { data: cred, error } = await client
    .from('markos_passkey_credentials')
    .select('id, credential_id, public_key, counter')
    .eq('user_id', user_id)
    .eq('credential_id', authResponse.id)
    .maybeSingle();
  if (error) throw new Error(`verifyAuthenticationResponse: cred load failed: ${error.message}`);
  if (!cred) throw new Error('credential_not_found');

  const impl = deps.webauthn || getWebauthn();
  const verification = await impl.verifyAuthenticationResponse({
    response: authResponse,
    expectedChallenge,
    expectedOrigin,
    expectedRPID,
    credential: {
      id: cred.credential_id,
      publicKey: Buffer.from(cred.public_key, 'base64'),
      counter: Number(cred.counter),
    },
  });

  if (!verification.verified) return { verified: false };

  await client
    .from('markos_passkey_credentials')
    .update({
      counter: verification.authenticationInfo.newCounter,
      last_used_at: new Date().toISOString(),
    })
    .eq('id', cred.id);

  await recordLoginEvent(client, { user_id, event: 'passkey' });

  try {
    await enqueueAuditStaging(client, {
      tenant_id: user_id,
      org_id: null,
      source_domain: 'auth',
      action: 'passkey.authenticated',
      actor_id: user_id,
      actor_role: 'owner',
      payload: { credential_id: cred.credential_id, new_counter: verification.authenticationInfo.newCounter },
    });
  } catch { /* noop */ }

  return { verified: true, credential_id: cred.credential_id };
}

async function listUserPasskeys(client, user_id) {
  if (!user_id) throw new Error('listUserPasskeys: user_id required');
  const { data, error } = await client
    .from('markos_passkey_credentials')
    .select('id, nickname, last_used_at, created_at, device_type, backed_up')
    .eq('user_id', user_id)
    .order('created_at', { ascending: false });
  if (error) throw new Error(`listUserPasskeys: select failed: ${error.message}`);
  return data || [];
}

async function recordLoginEvent(client, input) {
  const { user_id, event } = input || {};
  if (!user_id || !event) throw new Error('recordLoginEvent: user_id + event required');
  if (!['magic_link', 'passkey'].includes(event)) throw new Error(`recordLoginEvent: invalid event "${event}"`);

  await client.from('markos_login_events').insert({ user_id, event });
}

async function shouldPromptPasskey(client, user_id, dismissedCookie) {
  if (!user_id) return false;
  if (dismissedCookie) return false;

  // Any existing passkey suppresses the prompt.
  const { data: creds, error: credsErr } = await client
    .from('markos_passkey_credentials')
    .select('id')
    .eq('user_id', user_id)
    .limit(1);
  if (credsErr) return false;
  if ((creds || []).length > 0) return false;

  // Must have >=2 login events (D-01: prompt on second successful login).
  const { data: events, error: eventsErr } = await client
    .from('markos_login_events')
    .select('id')
    .eq('user_id', user_id);
  if (eventsErr) return false;

  return (events || []).length >= 2;
}

module.exports = {
  PASSKEY_CHALLENGE_TTL_MS,
  PASSKEY_PROMPT_DISMISSED_COOKIE,
  createRegistrationOptions,
  verifyRegistrationResponse,
  createAuthenticationOptions,
  verifyAuthenticationResponse,
  listUserPasskeys,
  recordLoginEvent,
  shouldPromptPasskey,
};
