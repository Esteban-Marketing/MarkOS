'use strict';

// Phase 204 Plan 07 Task 1 — CLI tenant env primitive library.
//
// Six exports back the `markos env` CLI + `/api/tenant/env/*` endpoints:
//
//   - listEnv({ client, tenant_id })
//       SELECT explicit column allow-list — NEVER value_encrypted or decrypted
//       value. Returns [{ key, value_preview, updated_at, updated_by }] sorted
//       by key. Safe for member role: value_preview is 4 chars + '…' per
//       T-204-07-01 mitigation.
//
//   - pullEnv({ client, tenant_id, encryption_key })
//       Bulk decrypt via RPC get_env_entries. Returns [{ key, value }].
//       CALLED ONLY from the /pull endpoint AFTER owner|admin gate — never
//       from list. encryption_key is read from process.env at the endpoint
//       and threaded through (keeps the key out of library constants).
//
//   - pushEnv({ client, tenant_id, user_id, entries, encryption_key })
//       For each { key, value } entry: invoke RPC set_env_entry which does
//       `pgp_sym_encrypt(value, key)` server-side. Emits a single audit row
//       action='env.pushed' with payload { keys: [...], count } — KEYS ONLY,
//       NEVER VALUES (T-204-07-03).
//
//   - deleteEnv({ client, tenant_id, user_id, keys })
//       DELETE WHERE tenant_id=$1 AND key = ANY($2). Emits audit row
//       action='env.deleted' payload { keys }.
//
//   - parseDotenv(text) → { ok, entries, errors }
//       Zero-dep dotenv parser (D-08). Handles:
//         KEY=value
//         KEY="quoted value with spaces"
//         KEY='single quoted'
//         # comment lines (skipped)
//         (blank lines skipped)
//       Key validation: /^[A-Z][A-Z0-9_]*$/ (same regex as push.js server
//       validator). Invalid keys are collected in `errors` but valid keys
//       are still returned in `entries` — the caller chooses whether to
//       push anyway or abort.
//
//   - serializeDotenv(entries) → string
//       Produces a dotenv-formatted string parseable by parseDotenv (round
//       trip safe). Values containing whitespace, '#', '=' or starting with
//       a quote are double-quoted with embedded quotes/backslashes escaped.
//
// Defense-in-depth over RLS (T-204-07-01): listEnv explicit allow-list never
// selects value_encrypted, so even if RLS were disabled the library still
// cannot leak the bytea column into a log capture.

// ─── Constants ─────────────────────────────────────────────────────────────

const TABLE = 'markos_cli_tenant_env';

// Explicit column allow-list for listEnv. NEVER includes value_encrypted.
const LIST_COLUMNS = 'key, value_preview, updated_at, updated_by';

// Dotenv key regex — same shape as the server push.js validator + upstream
// POSIX env-var convention. Uppercase first char, then [A-Z0-9_]. Rejects
// lowercase, hyphens, or digit-leading keys.
const DOTENV_KEY_RE = /^[A-Z][A-Z0-9_]*$/;

// ─── Helpers ───────────────────────────────────────────────────────────────

function assertClient(client, fn) {
  if (!client || typeof client.from !== 'function') {
    throw new Error(`${fn}: client required`);
  }
}

async function runQuery(builder) {
  if (!builder) return { data: null, error: null };
  if (typeof builder.then === 'function') return await builder;
  return builder;
}

// Best-effort audit emit — swallow errors per Plan 203-03 / 204-03 pattern.
async function emitAuditSafe(client, entry) {
  try {
    const { enqueueAuditStaging } = require('../audit/writer.cjs');
    await enqueueAuditStaging(client, entry);
  } catch {
    /* advisory — never block the primitive on audit failure */
  }
}

// ─── listEnv ──────────────────────────────────────────────────────────────

async function listEnv(params = {}) {
  const { client, tenant_id } = params;
  assertClient(client, 'listEnv');
  if (!tenant_id) throw new Error('listEnv: tenant_id required');

  let builder = client.from(TABLE).select(LIST_COLUMNS).eq('tenant_id', tenant_id);
  if (typeof builder.order === 'function') {
    builder = builder.order('key', { ascending: true });
  }

  const res = await runQuery(builder);
  if (res.error) throw new Error(`listEnv: select failed: ${res.error.message || String(res.error)}`);

  const rows = Array.isArray(res.data) ? res.data : [];
  // Whitelist projection — guarantee no value_encrypted escapes regardless of
  // how the driver/stub shaped the response (T-204-07-01 hard rail).
  return rows.map((r) => ({
    key: r.key,
    value_preview: r.value_preview,
    updated_at: r.updated_at,
    updated_by: r.updated_by,
  })).sort((a, b) => String(a.key).localeCompare(String(b.key)));
}

// ─── pullEnv ───────────────────────────────────────────────────────────────

async function pullEnv(params = {}) {
  const { client, tenant_id, encryption_key } = params;
  assertClient(client, 'pullEnv');
  if (!tenant_id) throw new Error('pullEnv: tenant_id required');
  if (!encryption_key) throw new Error('pullEnv: encryption_key required');
  if (typeof client.rpc !== 'function') {
    throw new Error('pullEnv: client.rpc required');
  }

  const { data, error } = await client.rpc('get_env_entries', {
    p_tenant_id: tenant_id,
    p_encryption_key: encryption_key,
  });
  if (error) throw new Error(`pullEnv: rpc failed: ${error.message || String(error)}`);

  const rows = Array.isArray(data) ? data : [];
  return rows.map((r) => ({
    key: r.key,
    value: r.value,
  })).sort((a, b) => String(a.key).localeCompare(String(b.key)));
}

// ─── pushEnv ───────────────────────────────────────────────────────────────

async function pushEnv(params = {}) {
  const { client, tenant_id, user_id, entries, encryption_key } = params;
  assertClient(client, 'pushEnv');
  if (!tenant_id) throw new Error('pushEnv: tenant_id required');
  if (!user_id) throw new Error('pushEnv: user_id required');
  if (!encryption_key) throw new Error('pushEnv: encryption_key required');
  if (!Array.isArray(entries)) throw new Error('pushEnv: entries array required');
  if (typeof client.rpc !== 'function') {
    throw new Error('pushEnv: client.rpc required');
  }

  for (const entry of entries) {
    if (!entry || typeof entry.key !== 'string' || typeof entry.value !== 'string') {
      throw new Error('pushEnv: each entry must have string key + value');
    }
    const { error } = await client.rpc('set_env_entry', {
      p_tenant_id: tenant_id,
      p_key: entry.key,
      p_value: entry.value,
      p_user_id: user_id,
      p_encryption_key: encryption_key,
    });
    if (error) {
      throw new Error(`pushEnv: set_env_entry failed for ${entry.key}: ${error.message || String(error)}`);
    }
  }

  // Audit emit — KEYS ONLY, NEVER VALUES (T-204-07-03 hard rail).
  await emitAuditSafe(client, {
    tenant_id,
    source_domain: 'cli',
    action: 'env.pushed',
    actor_id: user_id,
    actor_role: 'tenant_admin', // real role re-asserted at endpoint boundary
    payload: {
      keys: entries.map((e) => e.key),
      count: entries.length,
    },
  });

  return { updated: entries.length };
}

// ─── deleteEnv ─────────────────────────────────────────────────────────────

async function deleteEnv(params = {}) {
  const { client, tenant_id, user_id, keys } = params;
  assertClient(client, 'deleteEnv');
  if (!tenant_id) throw new Error('deleteEnv: tenant_id required');
  if (!user_id) throw new Error('deleteEnv: user_id required');
  if (!Array.isArray(keys) || keys.length === 0) {
    throw new Error('deleteEnv: keys array required');
  }

  // Delete one key at a time for broader stub compatibility (some fluent
  // drivers differ on `.in()` vs `.contains()`). Cost is linear in key count
  // and production `keys` size is bounded by the push/delete API (max 100).
  let deleted = 0;
  for (const key of keys) {
    if (typeof key !== 'string') continue;
    let builder = client.from(TABLE)
      .delete()
      .eq('tenant_id', tenant_id)
      .eq('key', key);
    const res = await runQuery(builder);
    if (res?.error) {
      throw new Error(`deleteEnv: delete failed for ${key}: ${res.error.message || String(res.error)}`);
    }
    deleted += 1;
  }

  await emitAuditSafe(client, {
    tenant_id,
    source_domain: 'cli',
    action: 'env.deleted',
    actor_id: user_id,
    actor_role: 'tenant_admin',
    payload: {
      keys: keys.slice(),
      count: keys.length,
    },
  });

  return { deleted };
}

// ─── parseDotenv ───────────────────────────────────────────────────────────

// Zero-dep dotenv parser. Returns { ok, entries, errors }. `entries` is an
// array of { key, value } in source order. `errors` is an array of
// { line, key, reason } for invalid lines (bad key or malformed syntax).
// `ok` is true only when `errors.length === 0`.
//
// Supports (per .env convention):
//   KEY=value
//   KEY="quoted value with spaces"
//   KEY='single quoted'
//   # comment
//   (blank line)
//
// Does NOT support:
//   - ${interpolation} (rejected; values are literal)
//   - multi-line quoted values (single-line values only for v1)
function parseDotenv(text) {
  const entries = [];
  const errors = [];
  if (typeof text !== 'string') {
    return { ok: false, entries, errors: [{ line: 0, reason: 'input_not_string' }] };
  }
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trimStart();
    if (!line || line.startsWith('#')) continue;

    // Strip optional `export ` prefix (bashrc-style).
    const stripped = line.startsWith('export ') ? line.slice(7).trimStart() : line;

    const eqIdx = stripped.indexOf('=');
    if (eqIdx <= 0) {
      errors.push({ line: i + 1, reason: 'malformed_line', raw });
      continue;
    }
    const key = stripped.slice(0, eqIdx).trim();
    let rawValue = stripped.slice(eqIdx + 1);

    if (!DOTENV_KEY_RE.test(key)) {
      errors.push({ line: i + 1, key, reason: 'invalid_key' });
      continue;
    }

    // Strip trailing comment (unquoted values only).
    let value;
    const first = rawValue.trimStart();
    if (first.startsWith('"')) {
      // Double-quoted: consume until the matching closing quote, honoring
      // backslash escapes (\" \\ \n) so the output of serializeDotenv
      // round-trips cleanly back through parseDotenv.
      const body = first.slice(1);
      let decoded = '';
      let terminated = false;
      for (let j = 0; j < body.length; j++) {
        const ch = body[j];
        if (ch === '\\' && j + 1 < body.length) {
          const next = body[j + 1];
          if (next === 'n') { decoded += '\n'; j++; continue; }
          if (next === 't') { decoded += '\t'; j++; continue; }
          if (next === '"') { decoded += '"';  j++; continue; }
          if (next === '\\') { decoded += '\\'; j++; continue; }
          // Unknown escape — keep literal backslash + next.
          decoded += ch;
          continue;
        }
        if (ch === '"') { terminated = true; break; }
        decoded += ch;
      }
      if (!terminated) {
        errors.push({ line: i + 1, key, reason: 'unterminated_double_quote' });
        continue;
      }
      value = decoded;
    } else if (first.startsWith("'")) {
      // Single-quoted: literal, no escape processing.
      const body = first.slice(1);
      const closeIdx = body.indexOf("'");
      if (closeIdx === -1) {
        errors.push({ line: i + 1, key, reason: 'unterminated_single_quote' });
        continue;
      }
      value = body.slice(0, closeIdx);
    } else {
      // Unquoted: strip trailing inline comment + trim.
      const hashIdx = first.indexOf(' #');
      const unquoted = hashIdx >= 0 ? first.slice(0, hashIdx) : first;
      value = unquoted.trim();
    }

    entries.push({ key, value });
  }
  return { ok: errors.length === 0, entries, errors };
}

// ─── serializeDotenv ───────────────────────────────────────────────────────

// Serialize an entries array back to dotenv text. Values that contain
// whitespace, a '#', '=' or start with a quote are double-quoted with
// embedded quotes/backslashes escaped.
function serializeDotenv(entries) {
  if (!Array.isArray(entries)) return '';
  const lines = [];
  for (const e of entries) {
    if (!e || typeof e.key !== 'string') continue;
    const key = e.key;
    const value = e.value == null ? '' : String(e.value);
    const needsQuote = value === '' ||
      /[\s#=]/.test(value) ||
      value.startsWith('"') ||
      value.startsWith("'");
    if (needsQuote) {
      const escaped = value
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n');
      lines.push(`${key}="${escaped}"`);
    } else {
      lines.push(`${key}=${value}`);
    }
  }
  return lines.join('\n') + (lines.length ? '\n' : '');
}

// ─── Exports ───────────────────────────────────────────────────────────────

module.exports = {
  // Data primitives
  listEnv,
  pullEnv,
  pushEnv,
  deleteEnv,
  // Dotenv helpers
  parseDotenv,
  serializeDotenv,
  // Constants
  TABLE,
  LIST_COLUMNS,
  DOTENV_KEY_RE,
};
