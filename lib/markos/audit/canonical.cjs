'use strict';

// Phase 201 D-17: deterministic JSON serialisation for the hash chain.
// Phase 201.1 D-103: canonical-JSON spec lock. See docs/canonical-audit-spec.md.
//
// Locked invariants (all four required for Node ↔ Postgres byte-parity):
//   1. Numbers: ECMA-262 §7.1.13 ToString(Number) shortest-round-trip via JSON.stringify.
//      NaN, Infinity, -Infinity → 'null'. -0 → '0' (explicit Object.is check).
//   2. Strings: NFC normalize via value.normalize('NFC') before JSON.stringify.
//      V8 JSON.stringify emits lowercase \uXXXX for control chars and does NOT escape /.
//   3. Keys: binary-lexicographic sort on UTF-8 bytes (Buffer.compare) — locale-stable.
//      Keys are NOT NFC-normalized (key bytes are preserved as stored).
//   4. Validation: rejects NaN/±Infinity/-0 at number path.
//
// The SQL function append_markos_audit_row produces the same string layout:
//   {"action":...,"actor_id":...,"actor_role":...,"occurred_at":...,"payload":...,"tenant_id":...}
// Keys sorted ASC alphabetically (which is binary-lex for pure ASCII keys), recursively.
// No whitespace.

function canonicalJson(value) {
  if (value === undefined) return undefined; // parent omits this key
  if (value === null) return 'null';
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return 'null'; // NaN, Infinity, -Infinity -> null (matches JSON)
    if (Object.is(value, -0)) return '0'; // D-103: -0 serializes as '0', not '-0'
    return JSON.stringify(value); // ECMA-262 §7.1.13 ToString(Number) shortest-round-trip
  }
  if (typeof value === 'string') {
    // D-103: NFC normalize string VALUES before JSON.stringify.
    // V8 JSON.stringify uses lowercase \uXXXX for control chars and does NOT escape /.
    return JSON.stringify(value.normalize('NFC'));
  }
  if (typeof value === 'boolean') {
    return JSON.stringify(value);
  }
  if (value instanceof Date) {
    return JSON.stringify(value.toISOString());
  }
  if (Array.isArray(value)) {
    const parts = value.map((v) => {
      const s = canonicalJson(v);
      return s === undefined ? 'null' : s; // undefined in arrays becomes null (JSON rule)
    });
    return '[' + parts.join(',') + ']';
  }
  if (typeof value === 'object') {
    // D-103: binary-lexicographic sort on UTF-8 bytes (NOT JS locale sort).
    // Keys are NOT NFC-normalized — key bytes match what Postgres jsonb stores literally.
    const keys = Object.keys(value).sort((a, b) => {
      const ba = Buffer.from(a, 'utf8');
      const bb = Buffer.from(b, 'utf8');
      return Buffer.compare(ba, bb);
    });
    const parts = [];
    for (const k of keys) {
      const s = canonicalJson(value[k]);
      if (s === undefined) continue; // drop undefined fields (JSON rule)
      parts.push(JSON.stringify(k) + ':' + s);
    }
    return '{' + parts.join(',') + '}';
  }
  return JSON.stringify(value);
}

module.exports = { canonicalJson };
