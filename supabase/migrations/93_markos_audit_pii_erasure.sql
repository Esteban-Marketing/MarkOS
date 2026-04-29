-- Phase 201.1 D-106 (closes M4): right-to-erasure vs hash chain reconciliation.
-- Pseudonymize-with-tombstone policy: original row's payload is redacted in place,
-- row_hash is recomputed, and a NEW audit row announces the redaction.
-- Chain verifier (lib/markos/audit/chain-checker.cjs) cross-references the tombstone.
--
-- ATOMICITY CONTRACT (W-2 closure):
-- erase_audit_pii is a single PL/pgSQL function call. PL/pgSQL provides an implicit
-- transaction around the function body, so if ANY step (tombstone INSERT in step 3
-- or the payload UPDATE in step 6) raises, the ENTIRE function rolls back, including
-- the tombstone. This guarantees the chain never ends up with a tombstone but no
-- redaction (or vice versa). Atomicity is verified by test/audit/erasure-atomicity.test.js
-- via fault-injection.
--
-- Advisory-lock serialization: erase_audit_pii acquires the SAME per-tenant advisory lock
-- as append_markos_audit_row (migration 82/90): pg_advisory_xact_lock(hashtext('audit:' || tenant_id)).
-- This serializes against concurrent writers and prevents hash-chain forks.
--
-- Migration slots: 88 and 89 are reserved (MCP sessions). 90-92 are canonical/signup/slugs.
-- This migration is 93.

create extension if not exists pgcrypto;

-- ============================================================================
-- 1. Schema: redacted_at + redacted_by columns
--    Operator hints only — NOT part of the canonicalized payload envelope.
--    They have no effect on the hash chain.
-- ============================================================================
alter table markos_audit_log
  add column if not exists redacted_at timestamptz,
  add column if not exists redacted_by text;

create index if not exists idx_markos_audit_log_redacted_at
  on markos_audit_log(redacted_at)
  where redacted_at is not null;

comment on column markos_audit_log.redacted_at
  is 'Phase 201.1 D-106: timestamp at which PII was erased. NULL means original row.';
comment on column markos_audit_log.redacted_by
  is 'Phase 201.1 D-106: actor_id who triggered the erasure (matches the tombstone audit row actor_id).';

-- ============================================================================
-- 2. RLS note: migration 82 created markos_audit_log_block_update as RESTRICTIVE.
--    We retain it. erase_audit_pii runs with SECURITY DEFINER as the function owner
--    (typically the supabase admin / postgres role) which bypasses RLS for DML
--    executed inside the function body. Direct UPDATEs from anon/authenticated
--    remain blocked by the RESTRICTIVE policy. No policy change is needed.
-- ============================================================================

-- ============================================================================
-- 3. erase_audit_pii — pseudonymize-with-tombstone fn (atomic per implicit txn)
--
-- 5-step erasure protocol (CONTEXT D-106):
--   1. Fetch row + tenant_id (FOR UPDATE inside the advisory-lock scope).
--   2. Acquire pg_advisory_xact_lock(hashtext('audit:' || tenant_id)).
--   3. Append tombstone row via append_markos_audit_row (action='audit.pii_erased').
--   4. Build deterministic redacted payload shape.
--   5. Recompute row_hash via markos_canonicalize_audit_payload (Plan 01 locked spec).
--   6. UPDATE original row with new payload + row_hash + redacted_at/by.
--   7. Return id, tombstone_id, new_row_hash.
-- ============================================================================
create or replace function erase_audit_pii(
  p_audit_row_id  bigint,
  p_redaction_marker text,
  p_actor_id      text
) returns table (id bigint, tombstone_id bigint, new_row_hash text)
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_row              record;
  v_redacted_payload jsonb;
  v_new_canonical    text;
  v_new_row_hash     text;
  v_tombstone_id     bigint;
begin
  -- Step 1: Fetch the target row.
  select al.id, al.tenant_id, al.org_id, al.source_domain, al.action,
         al.actor_id, al.actor_role, al.payload, al.occurred_at,
         al.prev_hash, al.row_hash
    into v_row
    from markos_audit_log al
    where al.id = p_audit_row_id;

  if v_row.id is null then
    raise exception 'erase_audit_pii: audit row not found: %', p_audit_row_id;
  end if;
  if v_row.tenant_id is null then
    raise exception 'erase_audit_pii: row has null tenant_id (illegal state)';
  end if;
  -- Refuse double-redaction (DoS mitigation per threat T-201.1-06-05).
  if v_row.payload ? '__redacted' then
    raise exception 'erase_audit_pii: row % is already redacted', p_audit_row_id;
  end if;

  -- Step 2: Per-tenant advisory lock — serializes against append_markos_audit_row.
  perform pg_advisory_xact_lock(hashtext('audit:' || v_row.tenant_id));

  -- Step 3: Append the tombstone row via the standard writer.
  --    ATOMICITY CONTRACT: if the UPDATE in step 6 fails (e.g., fault-injection trigger),
  --    the implicit PL/pgSQL transaction rolls back this INSERT too.
  select t.id into v_tombstone_id
    from append_markos_audit_row(
      v_row.tenant_id,
      v_row.org_id,
      'governance',
      'audit.pii_erased',
      p_actor_id,
      'owner',
      jsonb_build_object(
        'original_row_id',   p_audit_row_id,
        'redaction_marker',  p_redaction_marker,
        'reason',            p_redaction_marker
      ),
      now()
    ) as t;

  -- Step 4: Build the deterministic redacted payload (canonical shape per D-106).
  v_redacted_payload := jsonb_build_object(
    '__redacted', p_redaction_marker,
    'at',         to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'by',         p_actor_id
  );

  -- Step 5: Recompute row_hash using the locked canonical spec (Plan 01 markos_canonicalize_audit_payload).
  --    Outer 6-key envelope matches append_markos_audit_row and canonical.cjs exactly.
  v_new_canonical :=
    '{"action":'        || to_jsonb(v_row.action)::text
    || ',"actor_id":'   || to_jsonb(v_row.actor_id)::text
    || ',"actor_role":' || to_jsonb(v_row.actor_role)::text
    || ',"occurred_at":' || to_jsonb(to_char(v_row.occurred_at at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))::text
    || ',"payload":'    || markos_canonicalize_audit_payload(v_redacted_payload)
    || ',"tenant_id":'  || to_jsonb(v_row.tenant_id)::text
    || '}';

  v_new_row_hash := encode(digest(v_row.prev_hash || v_new_canonical, 'sha256'), 'hex');

  -- Step 6: UPDATE the row in place.
  --    SECURITY DEFINER auth bypasses the RESTRICTIVE block-UPDATE RLS policy.
  --    If this UPDATE fails (e.g., a fault-injection BEFORE UPDATE trigger raises),
  --    the entire function rolls back per PL/pgSQL implicit txn — the tombstone
  --    INSERT from step 3 is also rolled back. This is the load-bearing atomicity
  --    property verified by test/audit/erasure-atomicity.test.js.
  update markos_audit_log
    set payload     = v_redacted_payload,
        row_hash    = v_new_row_hash,
        redacted_at = now(),
        redacted_by = p_actor_id
    where markos_audit_log.id = p_audit_row_id;

  -- Step 7: Return.
  id           := p_audit_row_id;
  tombstone_id := v_tombstone_id;
  new_row_hash := v_new_row_hash;
  return next;
end;
$$;

comment on function erase_audit_pii(bigint, text, text)
  is 'Phase 201.1 D-106: pseudonymize PII in place; emit tombstone audit row (action=''audit.pii_erased''); recompute row_hash. Chain verifier learns to detect this via the tombstone. Atomic per PL/pgSQL implicit txn — verified by test/audit/erasure-atomicity.test.js. Serializes against concurrent writers via pg_advisory_xact_lock.';

revoke all on function erase_audit_pii(bigint, text, text) from public;
grant execute on function erase_audit_pii(bigint, text, text) to service_role;

-- ============================================================================
-- 4. recanonicalize_legacy_audit_row — one-shot backward-compat helper
--
-- For rows whose row_hash drifts when the locked spec (Plan 01 D-103) produces
-- different byte-output than the migration-82 inline canonicalizer (non-ASCII edge cases).
--
-- IMPORTANT: Application layer gates this via env flag MARKOS_AUDIT_RECANONICALIZE_ENABLED=1.
-- The SQL function itself has NO env-flag gate — that responsibility lives in
-- lib/markos/audit/erasure.cjs::recanonicalizeLegacyRow.
--
-- Tombstone action = 'audit.recanonicalized' so the chain verifier accepts the drift.
-- ============================================================================
create or replace function recanonicalize_legacy_audit_row(
  p_audit_row_id bigint,
  p_actor_id     text
) returns table (id bigint, tombstone_id bigint, old_row_hash text, new_row_hash text)
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_row           record;
  v_new_canonical text;
  v_new_row_hash  text;
  v_tombstone_id  bigint;
begin
  select al.id, al.tenant_id, al.org_id, al.action, al.actor_id, al.actor_role,
         al.payload, al.occurred_at, al.prev_hash, al.row_hash
    into v_row
    from markos_audit_log al
    where al.id = p_audit_row_id;

  if v_row.id is null then
    raise exception 'recanonicalize_legacy_audit_row: row not found: %', p_audit_row_id;
  end if;
  if v_row.payload ? '__redacted' then
    raise exception 'recanonicalize_legacy_audit_row: row % is already redacted; use erase_audit_pii instead', p_audit_row_id;
  end if;

  -- Same advisory lock as erase_audit_pii and append_markos_audit_row.
  perform pg_advisory_xact_lock(hashtext('audit:' || v_row.tenant_id));

  -- Tombstone: action='audit.recanonicalized', not 'audit.pii_erased'.
  select t.id into v_tombstone_id
    from append_markos_audit_row(
      v_row.tenant_id, v_row.org_id, 'system', 'audit.recanonicalized',
      p_actor_id, 'system',
      jsonb_build_object(
        'original_row_id', p_audit_row_id,
        'reason',          'phase_201.1_d103_canonicalizer_lock'
      ),
      now()
    ) as t;

  -- Re-canonicalize the ORIGINAL payload through the locked spec.
  v_new_canonical :=
    '{"action":'        || to_jsonb(v_row.action)::text
    || ',"actor_id":'   || to_jsonb(v_row.actor_id)::text
    || ',"actor_role":' || to_jsonb(v_row.actor_role)::text
    || ',"occurred_at":' || to_jsonb(to_char(v_row.occurred_at at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))::text
    || ',"payload":'    || markos_canonicalize_audit_payload(v_row.payload)
    || ',"tenant_id":'  || to_jsonb(v_row.tenant_id)::text
    || '}';

  v_new_row_hash := encode(digest(v_row.prev_hash || v_new_canonical, 'sha256'), 'hex');

  update markos_audit_log
    set row_hash    = v_new_row_hash,
        redacted_at = now(),
        redacted_by = p_actor_id
    where markos_audit_log.id = p_audit_row_id;

  id           := p_audit_row_id;
  tombstone_id := v_tombstone_id;
  old_row_hash := v_row.row_hash;
  new_row_hash := v_new_row_hash;
  return next;
end;
$$;

comment on function recanonicalize_legacy_audit_row(bigint, text)
  is 'Phase 201.1 D-106 backward-compat: one-shot recanonicalize for rows whose row_hash drifts under the locked spec (Plan 01 D-103). Emits ''audit.recanonicalized'' tombstone so the chain verifier accepts the drift. Gated at app layer via MARKOS_AUDIT_RECANONICALIZE_ENABLED env flag.';

revoke all on function recanonicalize_legacy_audit_row(bigint, text) from public;
grant execute on function recanonicalize_legacy_audit_row(bigint, text) to service_role;
