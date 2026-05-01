'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  sign,
  parseSignatureHeader,
  verify,
} = require('../../lib/markos/webhooks/signing.cjs');
const {
  FRESHNESS_WINDOW_SECONDS,
  recordNonce,
  isStaleTimestamp,
  verifySignatureWithReplayProtection,
} = require('../../lib/markos/webhooks/replay-protection.cjs');

function makeNonceClient() {
  const rows = new Map();
  return {
    rows,
    from(table) {
      assert.equal(table, 'markos_webhook_delivery_nonces');
      return {
        insert: async (row) => {
          if (rows.has(row.nonce)) {
            return { error: { code: '23505', message: 'duplicate key value violates unique constraint' } };
          }
          rows.set(row.nonce, row);
          return { error: null };
        },
      };
    },
  };
}

function makeFailingClient(message = 'database offline') {
  return {
    from() {
      return {
        insert: async () => ({ error: { code: 'XX000', message } }),
      };
    },
  };
}

test('FRESHNESS_WINDOW_SECONDS stays pinned to 300 seconds', () => {
  assert.equal(FRESHNESS_WINDOW_SECONDS, 300);
});

test('sign emits t=, n=, and sha256= segments with a 16-byte hex nonce', () => {
  const header = sign('shh', '{"ok":true}', {
    timestamp: 1_700_000_000,
    nonce: '00112233445566778899aabbccddeeff',
  });
  assert.equal(
    header,
    't=1700000000,n=00112233445566778899aabbccddeeff,sha256=e8933a3303ffede38a5fa348989f3b504717d5cf160cc7aa8f1d53f2d5d02bba',
  );
});

test('sign generates a random nonce when none is provided', () => {
  const header = sign('shh', 'body', { timestamp: 1_700_000_000 });
  const parsed = parseSignatureHeader(header);
  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    assert.equal(parsed.t, 1_700_000_000);
    assert.match(parsed.n, /^[a-f0-9]{32}$/);
    assert.match(parsed.sha256, /^[a-f0-9]{64}$/);
  }
});

test('parseSignatureHeader tolerates out-of-order segments and normalizes casing', () => {
  const parsed = parseSignatureHeader('sha256=abcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd,n=AABBCCDDEEFF00112233445566778899,t=1700000000');
  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    assert.equal(parsed.t, 1_700_000_000);
    assert.equal(parsed.n, 'aabbccddeeff00112233445566778899');
    assert.equal(parsed.sha256, 'abcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd');
  }
});

test('parseSignatureHeader rejects missing nonce as malformed_signature', () => {
  const parsed = parseSignatureHeader('t=1700000000,sha256=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
  assert.deepEqual(parsed, { ok: false, reason: 'malformed_signature' });
});

test('verify accepts a valid structured signature without nonce recording', async () => {
  const body = JSON.stringify({ event: 'approval.created' });
  const header = sign('topsecret', body, {
    timestamp: 1_700_000_000,
    nonce: '00112233445566778899aabbccddeeff',
  });
  const result = await verify('topsecret', body, header, { now: 1_700_000_200 });
  assert.deepEqual(result, {
    ok: true,
    timestamp: '1700000000',
    nonce: '00112233445566778899aabbccddeeff',
  });
});

test('verify rejects stale_timestamp when older than 300 seconds', async () => {
  const header = sign('topsecret', 'body', {
    timestamp: 1_700_000_000,
    nonce: '00112233445566778899aabbccddeeff',
  });
  const result = await verify('topsecret', 'body', header, { now: 1_700_000_301 });
  assert.deepEqual(result, {
    ok: false,
    reason: 'stale_timestamp',
    detail: '1700000000',
  });
});

test('verify rejects malformed_signature when nonce segment is absent', async () => {
  const result = await verify(
    'topsecret',
    'body',
    't=1700000000,sha256=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    { now: 1_700_000_000 },
  );
  assert.deepEqual(result, { ok: false, reason: 'malformed_signature' });
});

test('verify rejects malformed_timestamp when timestamp is not numeric', async () => {
  const result = await verify(
    'topsecret',
    'body',
    't=not-a-number,n=00112233445566778899aabbccddeeff,sha256=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    { now: 1_700_000_000 },
  );
  assert.deepEqual(result, { ok: false, reason: 'malformed_timestamp' });
});

test('verify rejects signature_mismatch when the body is tampered', async () => {
  const header = sign('topsecret', 'original body', {
    timestamp: 1_700_000_000,
    nonce: '00112233445566778899aabbccddeeff',
  });
  const result = await verify('topsecret', 'tampered body', header, { now: 1_700_000_000 });
  assert.deepEqual(result, { ok: false, reason: 'signature_mismatch' });
});

test('verify integrates recordNonce callback and rejects replayed nonces', async () => {
  const body = 'payload';
  const header = sign('topsecret', body, {
    timestamp: 1_700_000_000,
    nonce: '00112233445566778899aabbccddeeff',
  });
  const seen = new Set();
  const record = async (nonce) => {
    if (seen.has(nonce)) return { ok: false, reason: 'replay', detail: nonce };
    seen.add(nonce);
    return { ok: true };
  };

  const first = await verify('topsecret', body, header, {
    now: 1_700_000_000,
    recordNonce: record,
  });
  const second = await verify('topsecret', body, header, {
    now: 1_700_000_000,
    recordNonce: record,
  });

  assert.equal(first.ok, true);
  assert.deepEqual(second, {
    ok: false,
    reason: 'replay',
    detail: '00112233445566778899aabbccddeeff',
  });
});

test('recordNonce returns ok on first insert and replay on duplicate nonce', async () => {
  const client = makeNonceClient();
  const first = await recordNonce(client, 'whsub_123', '00112233445566778899aabbccddeeff');
  const second = await recordNonce(client, 'whsub_123', '00112233445566778899aabbccddeeff');

  assert.deepEqual(first, { ok: true });
  assert.deepEqual(second, {
    ok: false,
    reason: 'replay',
    detail: '00112233445566778899aabbccddeeff',
  });
});

test('recordNonce returns db_error when the backing store fails', async () => {
  const result = await recordNonce(
    makeFailingClient('insert blew up'),
    'whsub_123',
    '00112233445566778899aabbccddeeff',
  );
  assert.deepEqual(result, {
    ok: false,
    reason: 'db_error',
    detail: 'insert blew up',
  });
});

test('verifySignatureWithReplayProtection wires client-backed nonce storage end-to-end', async () => {
  const client = makeNonceClient();
  const body = JSON.stringify({ event: 'campaign.launched' });
  const header = sign('topsecret', body, {
    timestamp: 1_700_000_000,
    nonce: '00112233445566778899aabbccddeeff',
  });

  const first = await verifySignatureWithReplayProtection('topsecret', body, header, {
    now: 1_700_000_100,
    client,
    subscriptionId: 'whsub_123',
  });
  const second = await verifySignatureWithReplayProtection('topsecret', body, header, {
    now: 1_700_000_100,
    client,
    subscriptionId: 'whsub_123',
  });

  assert.equal(first.ok, true);
  assert.deepEqual(second, {
    ok: false,
    reason: 'replay',
    detail: '00112233445566778899aabbccddeeff',
  });
});

test('isStaleTimestamp enforces the five-minute boundary symmetrically', () => {
  assert.equal(isStaleTimestamp(1_700_000_000, 1_700_000_300), false);
  assert.equal(isStaleTimestamp(1_700_000_000, 1_700_000_301), true);
  assert.equal(isStaleTimestamp(1_700_000_000, 1_699_999_700), false);
  assert.equal(isStaleTimestamp(1_700_000_000, 1_699_999_699), true);
});
