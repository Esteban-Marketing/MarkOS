# Canonical-JSON Specification for the MarkOS Audit Hash Chain

**Version:** D-103 (Phase 201.1)
**Status:** Locked — any deviation from this spec is a protocol violation.
**Implemented by:**
- Node: `lib/markos/audit/canonical.cjs` (`canonicalJson` function)
- Postgres: `supabase/migrations/90_markos_audit_canonicalizer.sql` (`markos_canonicalize_audit_payload(jsonb)`)

---

## Purpose

The per-tenant SHA-256 audit hash chain requires byte-identical canonicalization on both the Node.js runtime and the Postgres database. A single-byte divergence (e.g., different number formatting, Unicode normalization form, escape encoding, or key ordering) produces a false-positive tamper-detection event, breaking the entire chain for the affected tenant.

This specification pins every decision to a specific rule so that independent implementations (Node, Postgres, any future language runtime) can produce identical output for all well-formed audit payloads.

---

## 1. Numbers

**Rule:** ECMA-262 §7.1.13 ToString(Number) — shortest round-trip decimal representation.

- Finite integers (e.g., `1`, `42`, `-7`) are emitted without a decimal point.
- Finite floats use the shortest representation that round-trips exactly (e.g., `1.5`, `1.5e-10`).
- Very large integers where the shortest representation is scientific notation emit that form (e.g., `1e+21` — note the `+` sign in the exponent).
- `NaN` → emitted as `null`.
- `Infinity` → emitted as `null`.
- `-Infinity` → emitted as `null`.
- `-0` → emitted as `0` (the negative zero sentinel must be stripped). Implementation uses `Object.is(value, -0)` to detect.

**Rationale:** Postgres `jsonb` type applies its own numeric normalization. For values that survive `jsonb` round-trip without distortion (normal finite floats, integers), Postgres and V8 both apply ECMA-262 shortest-round-trip. The `-0` → `0` rule is needed because Postgres `jsonb` has no concept of negative zero.

---

## 2. Unicode (NFC Normalization)

**Rule:** All string VALUES must be NFC-normalized before serialization.

- Node: `value.normalize('NFC')` applied before `JSON.stringify`.
- Postgres: `normalize(value_text, NFC)` (Postgres 13+ built-in) applied before `to_jsonb(...)`.

**What NFC means:** composed form. Code point U+00E9 (`é`) is the canonical composed form; the equivalent decomposed sequence U+0065 U+0301 (`e` + combining acute) is first composed to U+00E9.

**Keys are NOT NFC-normalized.** Key bytes are preserved exactly as stored in the JSON object / `jsonb` column. Only string values at leaves of the JSON tree are normalized.

**Rationale:** Postgres `jsonb` preserves string bytes as-is and does not apply NFC normalization internally. Without explicit NFC on the Node side, a decomposed string arriving from a web client could differ byte-for-byte from the composed form stored by a Postgres-emitted row.

---

## 3. String Escape Encoding

**Rule:** Standard JSON string encoding — lowercase `\uXXXX` for control characters (U+0000..U+001F), no forward-slash escape.

| Character | Emitted form |
|-----------|--------------|
| `"` (U+0022) | `\"` |
| `\` (U+005C) | `\\` |
| Newline (U+000A) | `\n` |
| Tab (U+0009) | `\t` |
| Carriage return (U+000D) | `\r` |
| Form feed (U+000C) | `\f` |
| Backspace (U+0008) | `\b` |
| U+0000..U+001F (other controls) | `\u00XX` (lowercase hex digits) |
| `/` (U+002F) | `/` (NOT `\/` — forward-slash is NOT escaped) |
| Non-ASCII printable (U+0080+) | emitted as UTF-8 bytes, NOT as `\uXXXX` surrogate pairs |

**Rationale:** V8's `JSON.stringify` already produces this encoding. The forward-slash rule (`/` not escaped) diverges from some older JSON implementations that escape it for HTML-safety. This spec explicitly pins the non-escaped form so Postgres and Node agree.

---

## 4. Key Ordering

**Rule:** binary-lexicographic on UTF-8 byte sequences — NOT JavaScript's default sort (which is UTF-16 code-unit order, locale-sensitive on some platforms).

**Algorithm (Node):**
```javascript
Object.keys(value).sort((a, b) => {
  const ba = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  return Buffer.compare(ba, bb);
});
```

**Algorithm (Postgres):**
```sql
select array_agg(k order by convert_to(k, 'UTF8'))
  from jsonb_object_keys(p_value) k;
```

`convert_to(k, 'UTF8')` returns the key as a `bytea` value, and `order by` on `bytea` in Postgres is byte-by-byte lexicographic — identical to `Buffer.compare` in Node.

**Implication:** For pure ASCII keys, binary-lex order is identical to ASCII order (and to JS `String.prototype.localeCompare` with `'C'` locale). For keys containing non-ASCII characters (e.g., `'é'` = UTF-8 bytes `0xC3 0xA9`), binary-lex places them AFTER all ASCII keys (all of which have bytes < 0x80).

**Rationale:** JS `.sort()` without a comparator uses UTF-16 code-unit order, which differs from UTF-8 byte order for characters in the range U+0080..U+FFFF. Since `jsonb` keys are stored as UTF-8, binary-lex on UTF-8 is the only order that is stable across both runtimes.

---

## 5. Validation

**Rejected values:**

| Value | Behavior |
|-------|----------|
| `NaN` | serialized as `null` |
| `Infinity` | serialized as `null` |
| `-Infinity` | serialized as `null` |
| `-0` | serialized as `'0'` |
| `undefined` at object key | key is dropped (JSON rule) |
| `undefined` in array | element becomes `null` (JSON rule) |

**Accepted types:** `null`, `boolean`, `number` (finite), `string`, `object`, `Array`, `Date` (serialized as ISO 8601 UTC string).

---

## 6. Backward Compatibility

The D-103 spec lock is designed to be backward-compatible with the inline canonicalizer shipped in migration 82 (`append_markos_audit_row` before D-103) for the following reason:

- Pre-D-103 payloads in production contain only ASCII strings and ASCII object keys.
- For ASCII-only content: NFC normalization is a no-op, binary-lex equals ASCII order, and there are no `-0` or `NaN` values in audit rows.

Therefore, pre-existing rows in `markos_audit_log` continue to verify via `verifyTenantChain` after migration 90. No chain-break false-positives are introduced by the spec lock.

**Exception:** if a pre-D-103 row contains non-ASCII content (e.g., an emoji in a payload value, or a decomposed Unicode string), its `row_hash` was computed against the non-NFC-normalized byte sequence. Such a row will fail hash-chain verification after the spec lock. Plan 06 (D-106) documents the `erase_audit_pii` + recanonicalize procedure for handling such edge cases.

---

## 7. Reference Implementations

| Runtime | File | Key function |
|---------|------|-------------|
| Node.js (CJS) | `lib/markos/audit/canonical.cjs` | `canonicalJson(value)` |
| Node.js (TS) | `lib/markos/audit/canonical.ts` | `canonicalJson(value: unknown): string \| undefined` |
| Postgres (plpgsql) | `supabase/migrations/90_markos_audit_canonicalizer.sql` | `markos_canonicalize_audit_payload(p_payload jsonb)` |
| Postgres helper | same migration | `markos_canonicalize_jsonb_recursive(p_value jsonb)` |

---

## 8. Test Coverage

| Test file | What it covers |
|-----------|----------------|
| `test/audit/canonical-spec.test.js` | All 6 locked invariants (NFC, ECMA-262, binary-lex, lowercase \uXXXX, no /-escape, backward-compat) |
| `test/audit/canonical-fuzzer.test.js` | 10k random objects, Node vs Postgres byte-parity; requires `MARKOS_TEST_SUPABASE_URL` env |
| `test/audit/canonical.test.js` | Pre-D-103 regression suite (23 tests) |
| `test/audit/chain-checker.test.js` | Hash-chain verifier with D-103 payloads |
| `test/audit/hash-chain.test.js` | Writer + drain integration |
