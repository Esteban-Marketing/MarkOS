'use strict';

// Phase 201 D-17: deterministic JSON serialisation for the hash chain.
// The SQL function append_markos_audit_row produces the same string layout:
//   {"action":...,"actor_id":...,"actor_role":...,"occurred_at":...,"payload":...,"tenant_id":...}
// Keys sorted ASC alphabetically, recursively. No whitespace.

function canonicalJson(value) {
  if (value === undefined) return undefined; // parent omits this key
  if (value === null) return 'null';
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return 'null'; // NaN, Infinity -> null (matches JSON)
    return JSON.stringify(value);
  }
  if (typeof value === 'string' || typeof value === 'boolean') {
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
    const keys = Object.keys(value).sort();
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
