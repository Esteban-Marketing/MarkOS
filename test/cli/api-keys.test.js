'use strict';

// Phase 204 Plan 03 Task 1 — API-key library primitive unit tests.
//
// Covers:
//   ak-01: mintKey generates mks_ak_<64 hex> + sha256 key_hash + 8-char fingerprint
//   ak-02: mintKey returns access_token only in its result — DB row carries key_hash
//   ak-03: listKeys filters revoked_at IS NULL + sorts by created_at DESC
//   ak-04: listKeys response never includes key_hash or access_token
//   ak-05: revokeKey cross-tenant → throws 'cross_tenant_forbidden' + row unchanged
//   ak-06: revokeKey key_not_found → throws 'key_not_found'
//   ak-07: revokeKey happy → UPDATE revoked_at + audit row with source_domain='cli'
//   ak-08: resolveKeyByHash active → returns row + UPDATE last_used_at
//   ak-09: resolveKeyByHash revoked → returns row with revoked_at populated
//   ak-10: device-flow.cjs imports mintKey from ./api-keys.cjs (grep assertion)

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  mintKey,
  listKeys,
  revokeKey,
  resolveKeyByHash,
  sha256Hex,
  KEY_PLAINTEXT_PREFIX,
  KEY_ID_PREFIX,
} = require('../../lib/markos/cli/api-keys.cjs');

const REPO_ROOT = path.resolve(__dirname, '..', '..');

// ─── Supabase-like stub — same shape as test/cli/device-flow.test.js ──────

function createStubClient(initial = {}) {
  const state = {
    api_keys: [...(initial.api_keys || [])],
    audit_rows: [],
  };

  function tableFor(name) {
    if (name === 'markos_cli_api_keys') return state.api_keys;
    if (name === 'markos_audit_log_staging') return state.audit_rows;
    throw new Error(`stub: unknown table ${name}`);
  }

  function makeQuery(tableName) {
    const table = tableFor(tableName);
    let op = 'select';
    let patch = null;
    let filters = [];
    let isFilters = [];
    let wantsSingle = false;
    let orderBy = null;

    const builder = {
      select() { return builder; },
      insert(row) {
        if (Array.isArray(row)) for (const r of row) table.push({ ...r });
        else table.push({ ...row });
        return { data: Array.isArray(row) ? row : [row], error: null };
      },
      update(p) { op = 'update'; patch = p; return builder; },
      eq(col, val) { filters.push({ col, val }); return builder; },
      is(col, val) { isFilters.push({ col, val }); return builder; },
      order(col, { ascending = true } = {}) { orderBy = { col, ascending }; return builder; },
      maybeSingle() { wantsSingle = true; return builder; },
      single() { wantsSingle = true; return builder; },
      then(resolve) {
        let matched = table.filter((r) => filters.every((f) => r[f.col] === f.val));
        matched = matched.filter((r) => isFilters.every((f) => {
          const v = r[f.col];
          return f.val === null ? (v == null) : (v === f.val);
        }));
        if (op === 'update') {
          for (const r of matched) Object.assign(r, patch);
          resolve({ data: wantsSingle ? (matched[0] || null) : matched, error: null });
          return { catch() { return builder; } };
        }
        if (orderBy) {
          matched = matched.slice().sort((a, b) => {
            const av = a[orderBy.col];
            const bv = b[orderBy.col];
            if (av === bv) return 0;
            const cmp = String(av).localeCompare(String(bv));
            return orderBy.ascending ? cmp : -cmp;
          });
        }
        resolve({ data: wantsSingle ? (matched[0] || null) : matched, error: null });
        return { catch() { return builder; } };
      },
    };
    return builder;
  }

  return { from(t) { return makeQuery(t); }, _state: state };
}

// ─── Tests ─────────────────────────────────────────────────────────────────

test('ak-01: mintKey generates mks_ak_<64 hex> + sha256 hash + 8-char fingerprint', async () => {
  const client = createStubClient();
  const result = await mintKey({
    client,
    tenant_id: 'ten_a',
    user_id: 'usr_a',
    name: 'my-laptop',
  });

  assert.ok(result.access_token.startsWith(KEY_PLAINTEXT_PREFIX), 'access_token must start with mks_ak_ prefix');
  assert.match(result.access_token, /^mks_ak_[a-f0-9]{64}$/, 'access_token must be 64 hex chars');
  assert.ok(result.key_id.startsWith(KEY_ID_PREFIX), 'key_id must start with cak_ prefix');
  assert.equal(result.key_fingerprint.length, 8);
  assert.equal(result.name, 'my-laptop');
  assert.ok(result.created_at);

  // DB row has key_hash = sha256(access_token); key_fingerprint = first 8 chars.
  assert.equal(client._state.api_keys.length, 1);
  const row = client._state.api_keys[0];
  const expected_hash = sha256Hex(result.access_token);
  assert.equal(row.key_hash, expected_hash);
  assert.equal(row.key_fingerprint, expected_hash.slice(0, 8));
  assert.equal(row.key_fingerprint, result.key_fingerprint);
});

test('ak-02: mintKey returns access_token ONCE — DB carries only the hash', async () => {
  const client = createStubClient();
  const result = await mintKey({ client, tenant_id: 'ten_b', user_id: 'usr_b' });

  const row = client._state.api_keys[0];
  // Plaintext must NEVER equal the stored hash (one-way digest).
  assert.notEqual(row.key_hash, result.access_token);
  // Row must not carry the plaintext in any column.
  for (const [k, v] of Object.entries(row)) {
    assert.notEqual(v, result.access_token, `row.${k} leaked plaintext`);
  }
  // Audit emit payload must NOT carry the plaintext either.
  if (client._state.audit_rows.length > 0) {
    const audit = client._state.audit_rows[0];
    const json = JSON.stringify(audit);
    assert.ok(!json.includes(result.access_token), 'audit payload must NOT include plaintext');
  }
});

test('ak-03: listKeys filters revoked_at IS NULL + sorts created_at DESC', async () => {
  const now = new Date();
  const client = createStubClient({
    api_keys: [
      { id: 'cak_a', tenant_id: 'ten_list', name: 'old',    key_hash: 'h1', key_fingerprint: 'fp00001a', scope: 'cli', created_at: new Date(now - 3000).toISOString(), last_used_at: null, revoked_at: null },
      { id: 'cak_b', tenant_id: 'ten_list', name: 'mid',    key_hash: 'h2', key_fingerprint: 'fp00002b', scope: 'cli', created_at: new Date(now - 2000).toISOString(), last_used_at: null, revoked_at: null },
      { id: 'cak_c', tenant_id: 'ten_list', name: 'new',    key_hash: 'h3', key_fingerprint: 'fp00003c', scope: 'cli', created_at: new Date(now - 1000).toISOString(), last_used_at: null, revoked_at: null },
      { id: 'cak_d', tenant_id: 'ten_list', name: 'gone',   key_hash: 'h4', key_fingerprint: 'fp00004d', scope: 'cli', created_at: new Date(now - 500).toISOString(),  last_used_at: null, revoked_at: new Date(now - 100).toISOString() },
      { id: 'cak_e', tenant_id: 'ten_other', name: 'noise', key_hash: 'h5', key_fingerprint: 'fp00005e', scope: 'cli', created_at: new Date(now).toISOString(),        last_used_at: null, revoked_at: null },
    ],
  });

  const { keys } = await listKeys({ client, tenant_id: 'ten_list' });
  assert.equal(keys.length, 3, 'revoked key + cross-tenant key must be excluded');
  assert.deepEqual(keys.map((k) => k.id), ['cak_c', 'cak_b', 'cak_a'], 'sorted newest first');
});

test('ak-04: listKeys response never leaks key_hash / access_token / revoked rows', async () => {
  const now = new Date().toISOString();
  const client = createStubClient({
    api_keys: [
      { id: 'cak_x', tenant_id: 'ten_x', name: 'a', key_hash: 'secret_hash_value', key_fingerprint: 'fp00000x', scope: 'cli', created_at: now, last_used_at: null, revoked_at: null },
    ],
  });

  const { keys } = await listKeys({ client, tenant_id: 'ten_x' });
  assert.equal(keys.length, 1);
  const entry = keys[0];
  assert.equal(entry.key_hash, undefined, 'key_hash must not appear in list response');
  assert.equal(entry.access_token, undefined, 'access_token must not appear in list response');
  const serialized = JSON.stringify(entry);
  assert.ok(!serialized.includes('secret_hash_value'), 'hash value must NOT leak into response');
});

test('ak-05: revokeKey cross-tenant → throws cross_tenant_forbidden + row unchanged', async () => {
  const client = createStubClient({
    api_keys: [
      { id: 'cak_z', tenant_id: 'ten_owner', user_id: 'usr_o', key_hash: 'h', key_fingerprint: 'fpzzzzzz', scope: 'cli', created_at: new Date().toISOString(), revoked_at: null },
    ],
  });

  await assert.rejects(
    revokeKey({ client, tenant_id: 'ten_attacker', user_id: 'usr_att', key_id: 'cak_z' }),
    /cross_tenant_forbidden/,
  );
  // Row must remain unchanged.
  assert.equal(client._state.api_keys[0].revoked_at, null, 'cross-tenant revoke must NOT modify row');
});

test('ak-06: revokeKey key_not_found → throws key_not_found', async () => {
  const client = createStubClient();
  await assert.rejects(
    revokeKey({ client, tenant_id: 'ten_a', user_id: 'usr_a', key_id: 'cak_ghost' }),
    /key_not_found/,
  );
});

test('ak-07: revokeKey happy → UPDATE revoked_at + audit row emitted (source_domain=cli action=api_key.revoked)', async () => {
  const client = createStubClient({
    api_keys: [
      { id: 'cak_ok', tenant_id: 'ten_rv', user_id: 'usr_rv', key_hash: 'h', key_fingerprint: 'fpokokok', scope: 'cli', created_at: new Date().toISOString(), revoked_at: null },
    ],
  });

  const res = await revokeKey({ client, tenant_id: 'ten_rv', user_id: 'usr_rv', key_id: 'cak_ok' });
  assert.ok(res.revoked_at, 'revokeKey must return revoked_at timestamp');

  // Row mutated.
  const row = client._state.api_keys[0];
  assert.ok(row.revoked_at, 'row.revoked_at must be set after revoke');

  // Audit row emitted.
  assert.ok(client._state.audit_rows.length >= 1, 'audit row must be emitted');
  const audit = client._state.audit_rows[client._state.audit_rows.length - 1];
  assert.equal(audit.source_domain, 'cli');
  assert.equal(audit.action, 'api_key.revoked');
  assert.equal(audit.actor_id, 'usr_rv');
  assert.equal(audit.payload.key_id, 'cak_ok');
  assert.equal(audit.payload.key_fingerprint, 'fpokokok');
  // key_hash NEVER appears in the audit payload.
  assert.ok(!('key_hash' in audit.payload), 'audit payload must NOT include key_hash');
});

test('ak-08: resolveKeyByHash active → returns row + bumps last_used_at', async () => {
  const hash = sha256Hex('mks_ak_fixture');
  const client = createStubClient({
    api_keys: [
      { id: 'cak_live', tenant_id: 'ten_live', user_id: 'usr_live', key_hash: hash, key_fingerprint: hash.slice(0, 8), scope: 'cli', created_at: new Date().toISOString(), last_used_at: null, revoked_at: null },
    ],
  });

  const row = await resolveKeyByHash({ client, key_hash: hash });
  assert.ok(row);
  assert.equal(row.key_id, 'cak_live');
  assert.equal(row.tenant_id, 'ten_live');
  assert.equal(row.user_id, 'usr_live');
  assert.equal(row.scope, 'cli');
  assert.equal(row.revoked_at, null);

  // last_used_at was bumped.
  assert.ok(client._state.api_keys[0].last_used_at, 'last_used_at must be updated on successful resolution');
});

test('ak-09: resolveKeyByHash revoked key → returns row with revoked_at set', async () => {
  const hash = sha256Hex('mks_ak_revoked_fixture');
  const revoked_at = new Date().toISOString();
  const client = createStubClient({
    api_keys: [
      { id: 'cak_rvk', tenant_id: 'ten_rvk', user_id: 'usr_rvk', key_hash: hash, key_fingerprint: hash.slice(0, 8), scope: 'cli', created_at: new Date().toISOString(), last_used_at: null, revoked_at },
    ],
  });

  const row = await resolveKeyByHash({ client, key_hash: hash });
  assert.ok(row);
  assert.equal(row.revoked_at, revoked_at, 'caller must see revoked_at so it can deny');
  // last_used_at must NOT be bumped for revoked key.
  assert.equal(client._state.api_keys[0].last_used_at, null, 'revoked key must not bump last_used_at');
});

test('ak-meta: resolveKeyByHash unknown hash → returns null', async () => {
  const client = createStubClient();
  const row = await resolveKeyByHash({ client, key_hash: 'no-such-hash' });
  assert.equal(row, null);
});

test('ak-10: device-flow.cjs now imports mintKey from ./api-keys.cjs', () => {
  const text = fs.readFileSync(path.join(REPO_ROOT, 'lib', 'markos', 'cli', 'device-flow.cjs'), 'utf8');
  assert.ok(
    /require\(['"]\.\/api-keys\.cjs['"]\)/.test(text),
    'device-flow.cjs must require("./api-keys.cjs")',
  );
  assert.ok(
    /mintKey/.test(text),
    'device-flow.cjs must reference mintKey from the shared primitive',
  );
});
