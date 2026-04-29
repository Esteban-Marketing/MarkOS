-- Phase 201.1 D-103: lock canonical-JSON spec for the audit hash chain.
-- Closes review concern H4: published byte-parity spec for Node <-> Postgres canonicalization.
-- See docs/canonical-audit-spec.md for the full specification.
--
-- IMPORTANT: markos_canonicalize_jsonb_recursive uses parameter name p_value (NOT p_payload).
-- The helper must dereference keys via p_value (never via p_payload which belongs to the outer fn).

-- ============================================================================
-- 1. markos_canonicalize_audit_payload(jsonb) -- standalone canonicalizer
--
-- Mirrors lib/markos/audit/canonical.cjs::canonicalJson exactly:
--   - NFC normalization on string VALUES (keys preserved as bytes)
--   - ECMA-262 §7.1.13 ToString(Number) (Postgres jsonb numeric formatting)
--   - lowercase \uXXXX escapes for control chars, no forward-slash escape
--   - binary-lexicographic key sort (convert_to(k, 'UTF8') bytea order)
-- ============================================================================
create or replace function markos_canonicalize_audit_payload(p_payload jsonb)
  returns text
  language plpgsql
  immutable
  parallel safe
as $$
begin
  if p_payload is null then
    return 'null';
  end if;

  return markos_canonicalize_jsonb_recursive(p_payload);
end;
$$;

-- ============================================================================
-- 2. Recursive walker (private helper) — handles arrays, objects, primitives.
--
-- Parameter: p_value jsonb  (NOT p_payload — must use p_value -> v_key for key dereference)
-- ============================================================================
create or replace function markos_canonicalize_jsonb_recursive(p_value jsonb)
  returns text
  language plpgsql
  immutable
  parallel safe
as $$
declare
  v_typ    text    := jsonb_typeof(p_value);
  v_keys   text[];
  v_key    text;
  v_parts  text[]  := '{}';
  v_idx    int;
begin
  if v_typ = 'null' then
    return 'null';

  elsif v_typ = 'boolean' or v_typ = 'number' then
    -- Postgres jsonb normalizes numbers to ECMA-262 shortest-round-trip on output.
    -- Cast to text via jsonb -> text (not ::varchar) to preserve that formatting.
    return p_value::text;

  elsif v_typ = 'string' then
    -- NFC normalize the value string, then re-encode as a JSON string literal.
    -- normalize(text, NFC) is a Postgres 13+ built-in.
    -- to_jsonb(...) produces a proper JSON string with all control-char escapes.
    return to_jsonb(normalize(p_value #>> '{}', NFC))::text;

  elsif v_typ = 'array' then
    for v_idx in 0 .. (jsonb_array_length(p_value) - 1) loop
      v_parts := array_append(v_parts, markos_canonicalize_jsonb_recursive(p_value -> v_idx));
    end loop;
    return '[' || array_to_string(v_parts, ',') || ']';

  elsif v_typ = 'object' then
    -- binary-lexicographic sort on UTF-8 bytes: convert_to(k, 'UTF8') returns bytea,
    -- and ORDER BY bytea is byte-by-byte lexicographic -- identical to Buffer.compare in Node.
    select array_agg(k order by convert_to(k, 'UTF8'))
      into v_keys
      from jsonb_object_keys(p_value) k;

    if v_keys is null then
      return '{}';
    end if;

    foreach v_key in array v_keys loop
      -- NOTE: uses p_value -> v_key (p_value is the parameter of THIS function).
      v_parts := array_append(
        v_parts,
        to_jsonb(v_key)::text || ':' || markos_canonicalize_jsonb_recursive(p_value -> v_key)
      );
    end loop;
    return '{' || array_to_string(v_parts, ',') || '}';

  end if;

  return 'null';
end;
$$;

comment on function markos_canonicalize_audit_payload(jsonb)
  is 'Phase 201.1 D-103: standalone canonical-JSON serializer. Byte-identical to lib/markos/audit/canonical.cjs. NFC + ECMA-262 §7.1.13 ToString(Number) + lowercase \uXXXX + binary-lex UTF-8 key sort. Closes review concern H4.';

comment on function markos_canonicalize_jsonb_recursive(jsonb)
  is 'Phase 201.1 D-103: private recursive walker for markos_canonicalize_audit_payload. Parameter is p_value (not p_payload). Handles null/boolean/number/string/array/object.';

-- ============================================================================
-- 3. Re-wire append_markos_audit_row to delegate payload canonicalization to
--    markos_canonicalize_audit_payload. The OUTER 6-key envelope is built the
--    same as migration 82 but the inner payload string now comes from the
--    locked canonicalizer instead of coalesce(p_payload::text, 'null').
--
-- Backward compatibility: existing pre-D-103 rows with ASCII-only payloads
-- produce byte-identical output from both the migration-82 inline canonicalizer
-- and the new markos_canonicalize_audit_payload. Chain continuity is preserved.
-- Non-ASCII edge cases are handled by Plan 06 (D-106) recanonicalize procedure.
-- ============================================================================
create or replace function append_markos_audit_row(
  p_tenant_id     text,
  p_org_id        text,
  p_source_domain text,
  p_action        text,
  p_actor_id      text,
  p_actor_role    text,
  p_payload       jsonb,
  p_occurred_at   timestamptz default now()
) returns table (id bigint, row_hash text, prev_hash text)
language plpgsql
as $$
declare
  v_prev_hash       text;
  v_canonical       text;
  v_row_hash        text;
  v_id              bigint;
  v_payload_canonical text;
begin
  -- Per-tenant advisory lock -- serialises all inserts for this tenant within the transaction.
  perform pg_advisory_xact_lock(hashtext('audit:' || p_tenant_id));

  -- Read the last row_hash for this tenant inside the locked txn.
  select markos_audit_log.row_hash into v_prev_hash
    from markos_audit_log
    where markos_audit_log.tenant_id = p_tenant_id
    order by markos_audit_log.id desc
    limit 1;

  -- Genesis: SHA-256('genesis:' || tenant_id) for the first row in a tenant chain.
  if v_prev_hash is null or v_prev_hash = '' then
    v_prev_hash := encode(digest('genesis:' || p_tenant_id, 'sha256'), 'hex');
  end if;

  -- D-103: payload sub-object canonicalized via the locked spec.
  v_payload_canonical := markos_canonicalize_audit_payload(coalesce(p_payload, '{}'::jsonb));

  -- Outer 6-key envelope: keys sorted ASC (action, actor_id, actor_role, occurred_at, payload, tenant_id).
  -- This matches the Node-side canonicalPayloadForHash in lib/markos/audit/writer.cjs.
  v_canonical :=
    '{"action":'        || to_jsonb(p_action)::text
    || ',"actor_id":'   || to_jsonb(p_actor_id)::text
    || ',"actor_role":' || to_jsonb(p_actor_role)::text
    || ',"occurred_at":' || to_jsonb(to_char(p_occurred_at at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))::text
    || ',"payload":'    || v_payload_canonical
    || ',"tenant_id":'  || to_jsonb(p_tenant_id)::text
    || '}';

  v_row_hash := encode(digest(v_prev_hash || v_canonical, 'sha256'), 'hex');

  insert into markos_audit_log (
    tenant_id, org_id, source_domain, action, actor_id, actor_role,
    payload, prev_hash, row_hash, occurred_at,
    -- Keep legacy columns populated for continuity (Phase 206 will deprecate).
    workspace_id, actor, entity_type, entity_id, details
  ) values (
    p_tenant_id, p_org_id, p_source_domain, p_action, p_actor_id, p_actor_role,
    coalesce(p_payload, '{}'::jsonb), v_prev_hash, v_row_hash, p_occurred_at,
    (select workspace_id from markos_tenants where markos_tenants.id = p_tenant_id),
    p_actor_id, p_source_domain, p_action, coalesce(p_payload, '{}'::jsonb)
  )
  returning markos_audit_log.id into v_id;

  id        := v_id;
  row_hash  := v_row_hash;
  prev_hash := v_prev_hash;
  return next;
end;
$$;

comment on function append_markos_audit_row(text, text, text, text, text, text, jsonb, timestamptz)
  is 'Phase 201.1 D-103: delegates payload canonicalization to markos_canonicalize_audit_payload. Outer envelope keys remain hardcoded-sorted (action, actor_id, actor_role, occurred_at, payload, tenant_id).';

-- ============================================================================
-- pgcrypto is required for digest()/encode(). Ships with Supabase.
-- ============================================================================
create extension if not exists pgcrypto;
