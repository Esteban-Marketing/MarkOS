'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

const {
  PASSKEY_CHALLENGE_TTL_MS,
  PASSKEY_PROMPT_DISMISSED_COOKIE,
  createRegistrationOptions,
  verifyRegistrationResponse,
  createAuthenticationOptions,
  listUserPasskeys,
  recordLoginEvent,
  shouldPromptPasskey,
} = require('../../lib/markos/auth/passkey.cjs');

function makeMockClient() {
  const state = {
    challenges: [],
    credentials: [],
    login_events: [],
    audit_log_staging: [],
  };
  function bucketFor(table) {
    if (table === 'markos_passkey_challenges') return 'challenges';
    if (table === 'markos_passkey_credentials') return 'credentials';
    if (table === 'markos_login_events') return 'login_events';
    if (table === 'markos_audit_log_staging') return 'audit_log_staging';
    return table;
  }
  return {
    state,
    from: (table) => {
      const bucket = bucketFor(table);
      return {
        select: () => ({
          eq: (col, val) => {
            const filtered = () => state[bucket].filter((c) => c[col] === val);
            const result = {
              eq: (col2, val2) => ({
                maybeSingle: async () => {
                  const row = state[bucket].find((c) => c[col] === val && c[col2] === val2);
                  return { data: row || null, error: null };
                },
              }),
              maybeSingle: async () => {
                const row = state[bucket].find((c) => c[col] === val);
                return { data: row || null, error: null };
              },
              limit: () => Promise.resolve({ data: filtered(), error: null }),
              order: () => Promise.resolve({ data: filtered(), error: null }),
              then: (resolve) => resolve({ data: filtered(), error: null }),
            };
            return result;
          },
        }),
        insert: async (row) => {
          if (Array.isArray(row)) row.forEach((r) => state[bucket].push(r));
          else state[bucket].push(row);
          // Match chain for writer.cjs .select('id').single()
          return {
            select: () => ({ single: async () => ({ data: { id: state[bucket].length }, error: null }) }),
            error: null,
          };
        },
        delete: () => ({
          eq: async (col, val) => {
            state[bucket] = state[bucket].filter((r) => r[col] !== val);
            return { error: null };
          },
        }),
        update: (patch) => ({
          eq: async (col, val) => {
            for (const r of state[bucket]) { if (r[col] === val) Object.assign(r, patch); }
            return { error: null };
          },
        }),
      };
    },
  };
}

function stubWebauthn(overrides = {}) {
  return {
    generateRegistrationOptions: overrides.generateRegistrationOptions || (async () => ({
      challenge: 'chal-abc',
      rp: { id: 'markos.dev', name: 'MarkOS' },
      user: { id: 'u1' },
    })),
    verifyRegistrationResponse: overrides.verifyRegistrationResponse || (async () => ({
      verified: true,
      registrationInfo: {
        credential: { id: 'cred-1', publicKey: Buffer.from('pk-bytes'), counter: 0 },
        credentialDeviceType: 'singleDevice',
        credentialBackedUp: false,
        aaguid: 'aa-1',
      },
    })),
    generateAuthenticationOptions: overrides.generateAuthenticationOptions || (async () => ({
      challenge: 'chal-auth',
      rpId: 'markos.dev',
    })),
    verifyAuthenticationResponse: overrides.verifyAuthenticationResponse || (async () => ({
      verified: true,
      authenticationInfo: { newCounter: 5 },
    })),
  };
}

test('Suite 201-04: constants are the expected values', () => {
  assert.equal(PASSKEY_CHALLENGE_TTL_MS, 120_000);
  assert.equal(PASSKEY_PROMPT_DISMISSED_COOKIE, 'markos_passkey_prompt_dismissed');
});

test('Suite 201-04: createRegistrationOptions inserts a challenge row + returns options', async () => {
  const client = makeMockClient();
  const { options, challenge_id } = await createRegistrationOptions(
    client,
    { user_id: 'u1', rpID: 'markos.dev', rpName: 'MarkOS', userName: 'alice@acme.com' },
    { webauthn: stubWebauthn() },
  );
  assert.ok(challenge_id.startsWith('pkchal-'));
  assert.equal(options.challenge, 'chal-abc');
  assert.equal(client.state.challenges.length, 1);
  assert.equal(client.state.challenges[0].kind, 'registration');
  assert.equal(client.state.challenges[0].user_id, 'u1');
});

test('Suite 201-04: verifyRegistrationResponse consumes challenge + inserts credential + audit row', async () => {
  const client = makeMockClient();
  const { challenge_id } = await createRegistrationOptions(
    client,
    { user_id: 'u1', rpID: 'markos.dev' },
    { webauthn: stubWebauthn() },
  );
  const result = await verifyRegistrationResponse(
    client,
    { user_id: 'u1', challenge_id, attResponse: { id: 'cred-1', response: {} }, expectedOrigin: 'https://markos.dev', expectedRPID: 'markos.dev' },
    { webauthn: stubWebauthn() },
  );
  assert.equal(result.verified, true);
  assert.equal(result.credential_id, 'cred-1');
  assert.equal(client.state.credentials.length, 1);
  assert.equal(client.state.credentials[0].user_id, 'u1');
  assert.equal(client.state.credentials[0].credential_id, 'cred-1');
  assert.equal(client.state.challenges.length, 0, 'challenge must be consumed');
});

test('Suite 201-04: verifyRegistrationResponse rejects expired challenge', async () => {
  const client = makeMockClient();
  client.state.challenges.push({
    id: 'pkchal-old',
    user_id: 'u1',
    challenge: 'chal',
    kind: 'registration',
    expires_at: new Date(Date.now() - 1000).toISOString(),
  });
  await assert.rejects(
    () => verifyRegistrationResponse(
      client,
      { user_id: 'u1', challenge_id: 'pkchal-old', attResponse: {}, expectedOrigin: 'https://markos.dev', expectedRPID: 'markos.dev' },
      { webauthn: stubWebauthn() },
    ),
    /challenge_expired/,
  );
});

test('Suite 201-04: verifyRegistrationResponse rejects missing challenge', async () => {
  const client = makeMockClient();
  await assert.rejects(
    () => verifyRegistrationResponse(
      client,
      { user_id: 'u1', challenge_id: 'nope', attResponse: {}, expectedOrigin: 'x', expectedRPID: 'x' },
      { webauthn: stubWebauthn() },
    ),
    /challenge_not_found/,
  );
});

test('Suite 201-04: createAuthenticationOptions lists user creds and inserts challenge', async () => {
  const client = makeMockClient();
  client.state.credentials.push({ id: 'pkcred-1', user_id: 'u1', credential_id: 'cred-1' });
  const { options, challenge_id } = await createAuthenticationOptions(
    client,
    { user_id: 'u1', rpID: 'markos.dev' },
    { webauthn: stubWebauthn() },
  );
  assert.equal(options.challenge, 'chal-auth');
  assert.ok(challenge_id.startsWith('pkchal-'));
  assert.equal(client.state.challenges.filter((c) => c.kind === 'authentication').length, 1);
});

test('Suite 201-04: listUserPasskeys returns empty array for new user', async () => {
  const client = makeMockClient();
  const list = await listUserPasskeys(client, 'u-empty');
  assert.deepEqual(list, []);
});

test('Suite 201-04: recordLoginEvent inserts + rejects invalid event', async () => {
  const client = makeMockClient();
  await recordLoginEvent(client, { user_id: 'u1', event: 'magic_link' });
  assert.equal(client.state.login_events.length, 1);
  assert.equal(client.state.login_events[0].event, 'magic_link');

  await assert.rejects(
    () => recordLoginEvent(client, { user_id: 'u1', event: 'sms' }),
    /invalid event/,
  );
});

test('Suite 201-04: shouldPromptPasskey returns false with dismiss cookie', async () => {
  const client = makeMockClient();
  const r = await shouldPromptPasskey(client, 'u1', 'dismissed');
  assert.equal(r, false);
});

test('Suite 201-04: shouldPromptPasskey returns false with zero login events', async () => {
  const client = makeMockClient();
  const r = await shouldPromptPasskey(client, 'u1');
  assert.equal(r, false);
});

test('Suite 201-04: shouldPromptPasskey returns false with existing passkey', async () => {
  const client = makeMockClient();
  client.state.credentials.push({ id: 'pkcred-1', user_id: 'u1', credential_id: 'cred-1' });
  client.state.login_events.push({ user_id: 'u1', event: 'magic_link' });
  client.state.login_events.push({ user_id: 'u1', event: 'magic_link' });
  const r = await shouldPromptPasskey(client, 'u1');
  assert.equal(r, false);
});

test('Suite 201-04: shouldPromptPasskey returns true with >=2 login events + no passkey + no cookie', async () => {
  const client = makeMockClient();
  client.state.login_events.push({ user_id: 'u1', event: 'magic_link' });
  client.state.login_events.push({ user_id: 'u1', event: 'magic_link' });
  const r = await shouldPromptPasskey(client, 'u1');
  assert.equal(r, true);
});
