'use strict';

// Phase 204 Plan 07 Task 1 — env library primitive + migration unit tests.
//
// Covers:
//   lib-01: migration 76 exists + declares table + pgcrypto + 2 RPC signatures
//   lib-02: rollback 76 drops table + functions + policy (NOT pgcrypto)
//   lib-03: listEnv returns array without value / value_encrypted fields
//   lib-04: pullEnv calls RPC get_env_entries with encryption_key + returns pairs
//   lib-05: pushEnv emits audit action='env.pushed' with keys (never values)
//   lib-06: deleteEnv removes rows + emits audit action='env.deleted'
//   lib-07: parseDotenv handles plain + double-quoted + single-quoted + comments/blanks
//   lib-08: serializeDotenv → parseDotenv round-trip preserves entries
//   lib-09: parseDotenv rejects invalid keys (lowercase, starts with digit)
//   lib-10: library source never references value_encrypted column directly

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  listEnv,
  pullEnv,
  pushEnv,
  deleteEnv,
  parseDotenv,
  serializeDotenv,
  TABLE,
} = require('../../lib/markos/cli/env.cjs');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const MIGRATION_PATH = path.resolve(REPO_ROOT, 'supabase', 'migrations', '76_markos_cli_tenant_env.sql');
const ROLLBACK_PATH = path.resolve(REPO_ROOT, 'supabase', 'migrations', 'rollback', '76_markos_cli_tenant_env.down.sql');
const LIB_PATH = path.resolve(REPO_ROOT, 'lib', 'markos', 'cli', 'env.cjs');

// ─── Supabase-like stub — adds .rpc() for env RPCs + audit staging ────────

function createStubClient(initial = {}) {
  const state = {
    env: [...(initial.env || [])],
    audit_rows: [],
    rpc_calls: [],
  };

  function tableFor(name) {
    if (name === 'markos_cli_tenant_env') return state.env;
    if (name === 'markos_audit_log_staging') return state.audit_rows;
    throw new Error(`stub: unknown table ${name}`);
  }

  function makeQuery(tableName) {
    const table = tableFor(tableName);
    let op = 'select';
    let patch = null;
    let filters = [];
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
      delete() { op = 'delete'; return builder; },
      eq(col, val) { filters.push({ col, val }); return builder; },
      order(col, { ascending = true } = {}) { orderBy = { col, ascending }; return builder; },
      maybeSingle() { wantsSingle = true; return builder; },
      single() { wantsSingle = true; return builder; },
      then(resolve) {
        let matched = table.filter((r) => filters.every((f) => r[f.col] === f.val));
        if (op === 'update') {
          for (const r of matched) Object.assign(r, patch);
          resolve({ data: wantsSingle ? (matched[0] || null) : matched, error: null });
          return { catch() { return builder; } };
        }
        if (op === 'delete') {
          // Remove matched rows from the underlying array.
          for (let i = table.length - 1; i >= 0; i--) {
            if (filters.every((f) => table[i][f.col] === f.val)) table.splice(i, 1);
          }
          resolve({ data: [], error: null });
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

  return {
    from(t) { return makeQuery(t); },
    async rpc(name, args) {
      state.rpc_calls.push({ name, args });
      if (name === 'set_env_entry') {
        const idx = state.env.findIndex((r) =>
          r.tenant_id === args.p_tenant_id && r.key === args.p_key);
        const row = {
          tenant_id: args.p_tenant_id,
          key: args.p_key,
          value_encrypted: `enc(${args.p_value})`,
          value_preview: (args.p_value || '').slice(0, 4) + '…',
          updated_by: args.p_user_id,
          updated_at: new Date().toISOString(),
        };
        if (idx >= 0) Object.assign(state.env[idx], row);
        else state.env.push({ ...row, created_at: new Date().toISOString() });
        return { data: null, error: null };
      }
      if (name === 'get_env_entries') {
        const rows = state.env
          .filter((r) => r.tenant_id === args.p_tenant_id)
          .map((r) => ({
            key: r.key,
            value: String(r.value_encrypted || '').replace(/^enc\(/, '').replace(/\)$/, ''),
          }));
        return { data: rows, error: null };
      }
      // Fallback: audit writer RPC (append_markos_audit_row).
      return { data: [{ id: state.audit_rows.length + 1, row_hash: 'r', prev_hash: 'p' }], error: null };
    },
    _state: state,
  };
}

// ─── Tests ─────────────────────────────────────────────────────────────────

test('lib-01: migration 76 file exists + declares table + pgcrypto + RPCs', () => {
  assert.ok(fs.existsSync(MIGRATION_PATH), 'migration 76 file missing');
  const text = fs.readFileSync(MIGRATION_PATH, 'utf8');
  assert.match(text, /create table if not exists markos_cli_tenant_env/);
  assert.match(text, /create extension if not exists pgcrypto/i);
  assert.match(text, /pgp_sym_encrypt/);
  assert.match(text, /pgp_sym_decrypt/);
  assert.match(text, /create or replace function set_env_entry/);
  assert.match(text, /create or replace function get_env_entries/);
  assert.match(text, /enable row level security/i);
  assert.match(text, /markos_cli_tenant_env_tenant_isolation/);
  assert.match(text, /primary key \(tenant_id, key\)/i);
});

test('lib-02: rollback 76 drops table + functions + policy (NOT pgcrypto)', () => {
  assert.ok(fs.existsSync(ROLLBACK_PATH), 'rollback 76 file missing');
  const text = fs.readFileSync(ROLLBACK_PATH, 'utf8');
  assert.match(text, /drop table if exists markos_cli_tenant_env/);
  assert.match(text, /drop function if exists set_env_entry/);
  assert.match(text, /drop function if exists get_env_entries/);
  assert.match(text, /drop policy if exists markos_cli_tenant_env_tenant_isolation/);
  // pgcrypto must NOT be dropped — shared with other domains.
  assert.doesNotMatch(text, /drop extension.*pgcrypto/i);
});

test('lib-03: listEnv returns redacted rows without value / value_encrypted', async () => {
  const client = createStubClient({
    env: [
      { tenant_id: 'ten_a', key: 'FOO', value_encrypted: 'enc(secret1)', value_preview: 'secr…', updated_at: '2026-04-23T00:00:00Z', updated_by: 'usr_a' },
      { tenant_id: 'ten_a', key: 'BAR', value_encrypted: 'enc(secret2)', value_preview: 'secr…', updated_at: '2026-04-23T01:00:00Z', updated_by: 'usr_a' },
      { tenant_id: 'ten_b', key: 'BAZ', value_encrypted: 'enc(other)',   value_preview: 'othe…', updated_at: '2026-04-23T02:00:00Z', updated_by: 'usr_b' },
    ],
  });
  const rows = await listEnv({ client, tenant_id: 'ten_a' });
  assert.equal(rows.length, 2);
  assert.deepEqual(rows.map((r) => r.key), ['BAR', 'FOO']); // sorted
  for (const r of rows) {
    assert.equal(r.value, undefined, 'list must not expose value');
    assert.equal(r.value_encrypted, undefined, 'list must not expose value_encrypted');
    assert.ok(r.value_preview);
  }
});

test('lib-04: pullEnv calls RPC get_env_entries with encryption_key + returns pairs', async () => {
  const client = createStubClient({
    env: [
      { tenant_id: 'ten_a', key: 'FOO', value_encrypted: 'enc(hello)', value_preview: 'hell…', updated_by: 'usr_a', updated_at: 'now' },
      { tenant_id: 'ten_a', key: 'BAR', value_encrypted: 'enc(world)', value_preview: 'worl…', updated_by: 'usr_a', updated_at: 'now' },
    ],
  });
  const rows = await pullEnv({ client, tenant_id: 'ten_a', encryption_key: 'k-s3cr3t' });
  assert.equal(rows.length, 2);
  assert.deepEqual(rows.map((r) => r.key), ['BAR', 'FOO']);
  assert.deepEqual(rows.map((r) => r.value).sort(), ['hello', 'world']);
  // RPC was invoked with the encryption key — not a null.
  const rpc = client._state.rpc_calls.find((c) => c.name === 'get_env_entries');
  assert.ok(rpc);
  assert.equal(rpc.args.p_encryption_key, 'k-s3cr3t');
  assert.equal(rpc.args.p_tenant_id, 'ten_a');
});

test('lib-05: pushEnv emits audit with keys array + count, never values', async () => {
  const client = createStubClient();
  const result = await pushEnv({
    client,
    tenant_id: 'ten_a',
    user_id: 'usr_a',
    encryption_key: 'k-s3cr3t',
    entries: [
      { key: 'FOO', value: 'super-secret-1' },
      { key: 'BAR', value: 'super-secret-2' },
    ],
  });
  assert.equal(result.updated, 2);
  // Two set_env_entry RPCs.
  const sets = client._state.rpc_calls.filter((c) => c.name === 'set_env_entry');
  assert.equal(sets.length, 2);
  // Audit row present.
  const audit = client._state.audit_rows.find((r) => r.action === 'env.pushed');
  assert.ok(audit, 'audit row for env.pushed missing');
  assert.equal(audit.source_domain, 'cli');
  assert.deepEqual(audit.payload.keys.sort(), ['BAR', 'FOO']);
  assert.equal(audit.payload.count, 2);
  // Values MUST NOT appear anywhere in the audit payload.
  const serialized = JSON.stringify(audit.payload);
  assert.ok(!serialized.includes('super-secret-1'), 'value leaked into audit payload');
  assert.ok(!serialized.includes('super-secret-2'), 'value leaked into audit payload');
});

test('lib-06: deleteEnv removes rows + emits audit action=env.deleted', async () => {
  const client = createStubClient({
    env: [
      { tenant_id: 'ten_a', key: 'FOO', value_encrypted: 'enc(a)', value_preview: 'a…', updated_by: 'u', updated_at: 'n' },
      { tenant_id: 'ten_a', key: 'BAR', value_encrypted: 'enc(b)', value_preview: 'b…', updated_by: 'u', updated_at: 'n' },
      { tenant_id: 'ten_a', key: 'BAZ', value_encrypted: 'enc(c)', value_preview: 'c…', updated_by: 'u', updated_at: 'n' },
    ],
  });
  const result = await deleteEnv({
    client, tenant_id: 'ten_a', user_id: 'usr_a', keys: ['FOO', 'BAR'],
  });
  assert.equal(result.deleted, 2);
  const remaining = client._state.env.filter((r) => r.tenant_id === 'ten_a');
  assert.equal(remaining.length, 1);
  assert.equal(remaining[0].key, 'BAZ');
  const audit = client._state.audit_rows.find((r) => r.action === 'env.deleted');
  assert.ok(audit);
  assert.deepEqual(audit.payload.keys.sort(), ['BAR', 'FOO']);
});

test('lib-07: parseDotenv handles plain + double-quoted + single-quoted + comments/blanks', () => {
  const text = [
    '# a header comment',
    '',
    'PLAIN=simple',
    'DOUBLE="with spaces and # hash"',
    "SINGLE='also spaces'",
    '',
    'export EXPORTED=ok',
    'NUMERIC=42',
    '# trailing comment',
    'INLINE=value # inline comment',
  ].join('\n');
  const { ok, entries, errors } = parseDotenv(text);
  assert.ok(ok, `expected ok; errors=${JSON.stringify(errors)}`);
  const map = Object.fromEntries(entries.map((e) => [e.key, e.value]));
  assert.equal(map.PLAIN, 'simple');
  assert.equal(map.DOUBLE, 'with spaces and # hash');
  assert.equal(map.SINGLE, 'also spaces');
  assert.equal(map.EXPORTED, 'ok');
  assert.equal(map.NUMERIC, '42');
  assert.equal(map.INLINE, 'value');
});

test('lib-08: serializeDotenv → parseDotenv round-trip preserves entries', () => {
  const input = [
    { key: 'PLAIN', value: 'simple' },
    { key: 'SPACES', value: 'has spaces' },
    { key: 'EMPTY', value: '' },
    { key: 'SPECIAL', value: 'has = and # inside' },
    { key: 'QUOTED_VALUE', value: '"already quoted"' },
  ];
  const text = serializeDotenv(input);
  const parsed = parseDotenv(text);
  assert.ok(parsed.ok, `parse errors: ${JSON.stringify(parsed.errors)}`);
  const map = Object.fromEntries(parsed.entries.map((e) => [e.key, e.value]));
  for (const e of input) {
    assert.equal(map[e.key], e.value, `round-trip failed for ${e.key}`);
  }
});

test('lib-09: parseDotenv rejects invalid keys (lowercase, digit-leading, hyphen)', () => {
  const text = [
    'lowercase=bad',
    '1DIGIT=bad',
    'HAS-HYPHEN=bad',
    'GOOD=ok',
  ].join('\n');
  const { ok, entries, errors } = parseDotenv(text);
  assert.equal(ok, false);
  assert.ok(errors.length >= 3, `expected 3+ errors, got ${errors.length}`);
  // GOOD still made it into entries.
  assert.ok(entries.some((e) => e.key === 'GOOD' && e.value === 'ok'));
  assert.ok(errors.every((e) => e.reason === 'invalid_key'));
});

test('lib-10: library source never selects value_encrypted directly', () => {
  const text = fs.readFileSync(LIB_PATH, 'utf8');
  // The column name may appear in comments explaining behavior, but never in
  // a select/update allow-list string. We check for common leakage patterns.
  // Must NOT be in LIST_COLUMNS constant.
  const listCols = text.match(/const LIST_COLUMNS = '([^']+)'/);
  assert.ok(listCols, 'LIST_COLUMNS constant not found');
  assert.ok(
    !listCols[1].includes('value_encrypted'),
    `LIST_COLUMNS leaked value_encrypted: ${listCols[1]}`,
  );
  // Ensure table constant is exported.
  assert.equal(TABLE, 'markos_cli_tenant_env');
});
