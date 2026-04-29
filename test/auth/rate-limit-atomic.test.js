'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

const { hashIp, windowStart, recordSignupAttempt } = require('../../lib/markos/auth/rate-limit.cjs');

// ============================================================================
// Test 1: recordSignupAttempt calls RPC increment_signup_rate exactly once
//         with the correct args and returns the attempt_count from RPC.
// ============================================================================
test('Suite 201.1-02: recordSignupAttempt calls rpc increment_signup_rate once with correct args', async () => {
  const calls = [];
  const mockData = 3;
  const client = {
    rpc: (name, args) => {
      calls.push({ name, args });
      return Promise.resolve({ data: mockData, error: null });
    },
    from: () => ({
      upsert: () => Promise.resolve({ error: null }),
    }),
  };

  const result = await recordSignupAttempt(client, { ip: '1.2.3.4', email: 'test@example.com' });

  assert.equal(calls.length, 1, 'rpc should be called exactly once');
  assert.equal(calls[0].name, 'increment_signup_rate', 'rpc name must be increment_signup_rate');

  const expectedHash = hashIp('1.2.3.4');
  assert.equal(calls[0].args.p_ip_hash, expectedHash, 'p_ip_hash must be sha256(ip)');
  assert.ok(typeof calls[0].args.p_hour_bucket === 'string', 'p_hour_bucket must be a string (ISO)');
  assert.ok(calls[0].args.p_hour_bucket.endsWith(':00.000Z'), 'p_hour_bucket must be snapped to hour boundary');

  assert.deepEqual(result, { attempt_count: mockData }, 'return value must carry attempt_count from RPC');
});

// ============================================================================
// Test 2: 50 concurrent calls all use the same ip_hash + hour_bucket;
//         no call falls back to the legacy .from('markos_signup_rate_limits').upsert path.
// ============================================================================
test('Suite 201.1-02: 50 concurrent recordSignupAttempt all use same ip_hash + hour_bucket', async () => {
  const rpcCalls = [];
  const fromCalls = [];
  let counter = 0;

  const client = {
    rpc: (name, args) => {
      rpcCalls.push({ name, args });
      counter++;
      return Promise.resolve({ data: counter, error: null });
    },
    from: (table) => {
      fromCalls.push(table);
      return {
        upsert: () => Promise.resolve({ error: null }),
      };
    },
  };

  await Promise.all(
    Array.from({ length: 50 }, () =>
      recordSignupAttempt(client, { ip: '1.2.3.4', email: 'a@b.com' })
    )
  );

  assert.equal(rpcCalls.length, 50, 'Exactly 50 RPC calls must be made');

  const uniqueHashes = new Set(rpcCalls.map((c) => c.args.p_ip_hash));
  assert.equal(uniqueHashes.size, 1, 'All 50 calls must use the same p_ip_hash');

  const uniqueBuckets = new Set(rpcCalls.map((c) => c.args.p_hour_bucket));
  assert.equal(uniqueBuckets.size, 1, 'All 50 calls must use the same p_hour_bucket');

  // Verify NO call went to the legacy IP rate-limit table (email throttle is OK)
  const legacyIpTableCalls = fromCalls.filter((t) => t === 'markos_signup_rate_limits');
  assert.equal(legacyIpTableCalls.length, 0, 'No call should use the legacy markos_signup_rate_limits.upsert path');
});

// ============================================================================
// Test 3: When rpc returns an error, recordSignupAttempt re-throws with prefix.
// ============================================================================
test('Suite 201.1-02: recordSignupAttempt re-throws rpc error with prefix', async () => {
  const client = {
    rpc: () => Promise.resolve({ data: null, error: { message: 'connection refused' } }),
    from: () => ({ upsert: () => Promise.resolve({ error: null }) }),
  };

  await assert.rejects(
    () => recordSignupAttempt(client, { ip: '1.2.3.4', email: 'a@b.com' }),
    (err) => {
      assert.ok(err.message.startsWith('recordSignupAttempt:'), 'Error must have recordSignupAttempt: prefix');
      assert.ok(err.message.includes('connection refused'), 'Error must include original message');
      return true;
    }
  );
});

// ============================================================================
// Test 4: Email throttle (.from('markos_signup_email_throttle').upsert) is still called.
// ============================================================================
test('Suite 201.1-02: recordSignupAttempt still calls email throttle upsert', async () => {
  const emailUpsertCalls = [];

  const client = {
    rpc: () => Promise.resolve({ data: 1, error: null }),
    from: (table) => ({
      upsert: (payload, opts) => {
        if (table === 'markos_signup_email_throttle') {
          emailUpsertCalls.push({ payload, opts });
        }
        return Promise.resolve({ error: null });
      },
    }),
  };

  await recordSignupAttempt(client, { ip: '10.0.0.1', email: 'User@Example.COM' });

  assert.equal(emailUpsertCalls.length, 1, 'Email throttle upsert must be called once');
  assert.equal(
    emailUpsertCalls[0].payload.email,
    'user@example.com',
    'Email must be lowercased + trimmed'
  );
  assert.ok(
    typeof emailUpsertCalls[0].payload.last_sent_at === 'string',
    'last_sent_at must be an ISO string'
  );
});
