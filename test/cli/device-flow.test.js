'use strict';

// Phase 204 Plan 02 Task 1 — device-flow state-machine unit tests.
//
// Covers RFC 8628 §3.5 surface area:
//   df-01  createDeviceSession inserts well-formed pending row + returns codes
//   df-02  pollToken returns authorization_pending when pending + interval OK
//   df-03  pollToken returns slow_down when now - last_poll_at < interval
//   df-04  pollToken returns expired_token when now > expires_at
//   df-05  pollToken returns access_denied when status='denied'
//   df-06  pollToken on approved → mints api key + returns full token envelope
//   df-07  pollToken approved → consumed one-shot (second call returns invalid_grant)
//   df-08  approveDeviceSession pending → approved + emits audit row
//   df-09  approveDeviceSession raises already_approved when status != pending
//   df-10  approveDeviceSession raises expired when now > expires_at

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createDeviceSession,
  pollToken,
  approveDeviceSession,
  DEVICE_CODE_TTL_SEC,
  DEFAULT_INTERVAL_SEC,
  USER_CODE_ALPHABET,
  USER_CODE_REGEX,
} = require('../../lib/markos/cli/device-flow.cjs');

// ─── Supabase-like stub ────────────────────────────────────────────────────
//
// Implements the subset of the fluent builder API used by device-flow.cjs:
//   .from(table).insert(row)                        → { error }
//   .from(table).select(cols).eq(col, val).maybeSingle() → thenable { data, error }
//   .from(table).update(patch).eq(...).eq(...).select().maybeSingle() → { data, error }
//
// Tables are backed by arrays on `state`. Queries replay filters in-memory.

function createStubClient(initial = {}) {
  const state = {
    device_sessions: [...(initial.device_sessions || [])],
    api_keys: [...(initial.api_keys || [])],
    audit_rows: [],
  };

  function tableFor(name) {
    if (name === 'markos_cli_device_sessions') return state.device_sessions;
    if (name === 'markos_cli_api_keys') return state.api_keys;
    if (name === 'markos_audit_log_staging') return state.audit_rows;
    throw new Error(`stub: unknown table ${name}`);
  }

  function makeQuery(tableName) {
    const table = tableFor(tableName);
    let op = 'select';
    let patch = null;
    let filters = [];
    let wantsSingle = false;

    const builder = {
      select(_cols) {
        // For chained select after update — capture but noop for stub.
        return builder;
      },
      insert(row) {
        if (Array.isArray(row)) {
          for (const r of row) table.push({ ...r });
        } else {
          table.push({ ...row });
        }
        // insert() returns a shape-compatible error-bearing object.
        return { data: Array.isArray(row) ? row : [row], error: null };
      },
      update(p) {
        op = 'update';
        patch = p;
        return builder;
      },
      delete() {
        op = 'delete';
        return builder;
      },
      eq(col, val) {
        filters.push({ col, val });
        return builder;
      },
      maybeSingle() {
        wantsSingle = true;
        return builder;
      },
      single() {
        wantsSingle = true;
        return builder;
      },
      then(resolve, reject) {
        try {
          const matched = table.filter((row) => filters.every((f) => row[f.col] === f.val));
          if (op === 'update') {
            for (const row of matched) Object.assign(row, patch);
            const data = wantsSingle ? (matched[0] || null) : matched;
            resolve({ data, error: null });
            return { catch() { return builder; } };
          }
          if (op === 'delete') {
            for (const row of matched) {
              const idx = table.indexOf(row);
              if (idx >= 0) table.splice(idx, 1);
            }
            resolve({ data: matched, error: null });
            return { catch() { return builder; } };
          }
          // select
          const data = wantsSingle ? (matched[0] || null) : matched;
          resolve({ data, error: null });
          return { catch() { return builder; } };
        } catch (err) {
          if (reject) reject(err);
          return { catch() { return builder; } };
        }
      },
    };
    return builder;
  }

  return {
    from(tableName) {
      return makeQuery(tableName);
    },
    _state: state,
  };
}

// ─── Tests ─────────────────────────────────────────────────────────────────

test('df-01: createDeviceSession inserts row + returns well-formed codes', async () => {
  const client = createStubClient();
  const envelope = await createDeviceSession({ client, client_id: 'markos-cli', scope: 'cli' });

  assert.ok(envelope.device_code.startsWith('djNhcl8'), 'device_code must start with djNhcl8 prefix');
  assert.ok(envelope.device_code.length >= 22, 'device_code must be ≥22 chars');
  assert.match(envelope.user_code, USER_CODE_REGEX, 'user_code must match 4+4 32-alphabet pattern');
  assert.equal(envelope.expires_in, DEVICE_CODE_TTL_SEC);
  assert.equal(envelope.interval, DEFAULT_INTERVAL_SEC);
  assert.ok(envelope.verification_uri.startsWith('https://app.markos.com'));
  assert.ok(envelope.verification_uri_complete.includes(envelope.user_code));

  // Exactly one pending row landed in the stub.
  assert.equal(client._state.device_sessions.length, 1);
  const row = client._state.device_sessions[0];
  assert.equal(row.status, 'pending');
  assert.equal(row.device_code, envelope.device_code);
  assert.equal(row.user_code, envelope.user_code);
  assert.ok(row.expires_at);
});

test('df-02: pollToken returns authorization_pending when pending + no recent poll', async () => {
  const device_code = 'djNhcl8abc';
  const now = new Date();
  const client = createStubClient({
    device_sessions: [{
      device_code,
      user_code: 'ABCD-EFGH',
      status: 'pending',
      issued_at: now.toISOString(),
      expires_at: new Date(now.getTime() + 900_000).toISOString(),
      poll_count: 0,
      last_poll_at: null,
    }],
  });

  const res = await pollToken({ client, device_code, client_id: 'markos-cli' });
  assert.equal(res.error, 'authorization_pending');
});

test('df-03: pollToken returns slow_down when polled too fast', async () => {
  const device_code = 'djNhcl8xyz';
  const now = new Date();
  const client = createStubClient({
    device_sessions: [{
      device_code,
      user_code: 'WXYZ-2345',
      status: 'pending',
      issued_at: now.toISOString(),
      expires_at: new Date(now.getTime() + 900_000).toISOString(),
      poll_count: 3,
      last_poll_at: new Date(now.getTime() - 500).toISOString(), // 500 ms ago < 5000ms
    }],
  });

  const res = await pollToken({ client, device_code });
  assert.equal(res.error, 'slow_down');
});

test('df-04: pollToken returns expired_token when now > expires_at', async () => {
  const device_code = 'djNhcl8exp';
  const now = new Date();
  const client = createStubClient({
    device_sessions: [{
      device_code,
      user_code: 'EXPI-RED2',
      status: 'pending',
      issued_at: new Date(now.getTime() - 1_000_000).toISOString(),
      expires_at: new Date(now.getTime() - 100).toISOString(), // already expired
      poll_count: 1,
      last_poll_at: null,
    }],
  });

  const res = await pollToken({ client, device_code });
  assert.equal(res.error, 'expired_token');
});

test('df-05: pollToken returns access_denied when status=denied', async () => {
  const device_code = 'djNhcl8den';
  const now = new Date();
  const client = createStubClient({
    device_sessions: [{
      device_code,
      user_code: 'DENY-1234',
      status: 'denied',
      issued_at: now.toISOString(),
      expires_at: new Date(now.getTime() + 900_000).toISOString(),
      poll_count: 1,
      last_poll_at: null,
    }],
  });

  const res = await pollToken({ client, device_code });
  assert.equal(res.error, 'access_denied');
});

test('df-06: pollToken on approved mints api key + returns full token envelope', async () => {
  const device_code = 'djNhcl8app';
  const now = new Date();
  const client = createStubClient({
    device_sessions: [{
      device_code,
      user_code: 'APPR-OVED',
      status: 'approved',
      tenant_id: 'ten_demo',
      user_id: 'usr_demo',
      issued_at: now.toISOString(),
      expires_at: new Date(now.getTime() + 900_000).toISOString(),
      approved_at: now.toISOString(),
      poll_count: 5,
      last_poll_at: new Date(now.getTime() - 10_000).toISOString(),
    }],
  });

  const res = await pollToken({ client, device_code });
  assert.ok(res.access_token, 'access_token must be returned');
  assert.match(res.access_token, /^mks_ak_[a-f0-9]{32,}$/, 'access_token must match mks_ak_<hex> format');
  assert.equal(res.token_type, 'bearer');
  assert.equal(res.tenant_id, 'ten_demo');
  assert.equal(res.scope, 'cli');
  assert.ok(res.key_fingerprint);
  assert.equal(res.key_fingerprint.length, 8);

  // Exactly one api_keys row inserted.
  assert.equal(client._state.api_keys.length, 1);
  const row = client._state.api_keys[0];
  assert.equal(row.tenant_id, 'ten_demo');
  assert.equal(row.scope, 'cli');
  assert.equal(row.key_fingerprint, res.key_fingerprint);
  assert.ok(row.key_hash, 'key_hash must be persisted');
  assert.notEqual(row.key_hash, res.access_token, 'plaintext MUST NOT be stored');

  // Session flipped approved → consumed.
  const session = client._state.device_sessions[0];
  assert.equal(session.status, 'consumed');
});

test('df-07: pollToken approved→consumed is one-shot (replay returns invalid_grant)', async () => {
  const device_code = 'djNhcl8rep';
  const now = new Date();
  const client = createStubClient({
    device_sessions: [{
      device_code,
      user_code: 'REPL-AYQQ',
      status: 'approved',
      tenant_id: 'ten_r',
      user_id: 'usr_r',
      issued_at: now.toISOString(),
      expires_at: new Date(now.getTime() + 900_000).toISOString(),
      approved_at: now.toISOString(),
      poll_count: 2,
      last_poll_at: new Date(now.getTime() - 10_000).toISOString(),
    }],
  });

  const first = await pollToken({ client, device_code });
  assert.ok(first.access_token, 'first call returns access_token');

  const second = await pollToken({ client, device_code });
  assert.equal(second.error, 'invalid_grant', 'replay must return invalid_grant (T-204-02-03)');
  assert.equal(client._state.api_keys.length, 1, 'no second api key minted on replay');
});

test('df-08: approveDeviceSession flips pending→approved + emits audit row', async () => {
  const user_code = 'ABCD-EFGH';
  const now = new Date();
  const client = createStubClient({
    device_sessions: [{
      device_code: 'djNhcl8apr',
      user_code,
      status: 'pending',
      issued_at: now.toISOString(),
      expires_at: new Date(now.getTime() + 900_000).toISOString(),
      poll_count: 0,
      last_poll_at: null,
    }],
  });

  const res = await approveDeviceSession({
    client,
    user_code,
    tenant_id: 'ten_approve',
    user_id: 'usr_approve',
    user_role: 'admin',
  });

  assert.equal(res.approved, true);
  const session = client._state.device_sessions[0];
  assert.equal(session.status, 'approved');
  assert.equal(session.tenant_id, 'ten_approve');
  assert.equal(session.user_id, 'usr_approve');
  assert.ok(session.approved_at);

  // Audit row was enqueued best-effort.
  assert.ok(client._state.audit_rows.length >= 1, 'audit row must be emitted');
  const audit = client._state.audit_rows[0];
  assert.equal(audit.source_domain, 'cli');
  assert.equal(audit.action, 'device.approved');
  assert.equal(audit.actor_id, 'usr_approve');
  assert.equal(audit.payload.user_code, user_code);
});

test('df-09: approveDeviceSession raises already_approved when status != pending', async () => {
  const user_code = 'WDJB-MJHT';
  const now = new Date();
  const client = createStubClient({
    device_sessions: [{
      device_code: 'djNhcl8arp',
      user_code,
      status: 'approved',
      tenant_id: 'ten_prev',
      user_id: 'usr_prev',
      issued_at: now.toISOString(),
      expires_at: new Date(now.getTime() + 900_000).toISOString(),
      approved_at: now.toISOString(),
      poll_count: 0,
    }],
  });

  await assert.rejects(
    approveDeviceSession({
      client,
      user_code,
      tenant_id: 'ten_new',
      user_id: 'usr_new',
      user_role: 'owner',
    }),
    /already_approved/,
  );
});

test('df-10: approveDeviceSession raises expired when now > expires_at', async () => {
  const user_code = 'EXPE-RING';
  const now = new Date();
  const client = createStubClient({
    device_sessions: [{
      device_code: 'djNhcl8exb',
      user_code,
      status: 'pending',
      issued_at: new Date(now.getTime() - 1_000_000).toISOString(),
      expires_at: new Date(now.getTime() - 100).toISOString(),
      poll_count: 0,
    }],
  });

  await assert.rejects(
    approveDeviceSession({
      client,
      user_code,
      tenant_id: 'ten_exp',
      user_id: 'usr_exp',
      user_role: 'owner',
    }),
    /expired/,
  );
});

// Smoke test: alphabet sanity — prevents regression of A14 lock.
test('df-meta: USER_CODE_ALPHABET excludes ambiguous chars (0/1/I/O)', () => {
  assert.equal(USER_CODE_ALPHABET.length, 32);
  assert.ok(!USER_CODE_ALPHABET.includes('0'));
  assert.ok(!USER_CODE_ALPHABET.includes('1'));
  assert.ok(!USER_CODE_ALPHABET.includes('I'));
  assert.ok(!USER_CODE_ALPHABET.includes('O'));
});
