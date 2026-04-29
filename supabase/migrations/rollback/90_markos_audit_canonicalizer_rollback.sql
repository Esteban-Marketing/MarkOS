-- Phase 201.1 D-103 ROLLBACK: remove canonical-JSON spec lock functions and
-- restore append_markos_audit_row to its migration-82 inline canonicalizer body.
-- Run this BEFORE rolling back migration 90 if you need to revert D-103.

-- ============================================================================
-- 1. Drop the Phase 201.1 D-103 functions.
-- ============================================================================
drop function if exists markos_canonicalize_audit_payload(jsonb);
drop function if exists markos_canonicalize_jsonb_recursive(jsonb);

-- ============================================================================
-- 2. Restore append_markos_audit_row to its migration-82 body (verbatim copy).
-- ============================================================================
create or replace function append_markos_audit_row(
  p_tenant_id text,
  p_org_id text,
  p_source_domain text,
  p_action text,
  p_actor_id text,
  p_actor_role text,
  p_payload jsonb,
  p_occurred_at timestamptz default now()
) returns table (id bigint, row_hash text, prev_hash text)
language plpgsql
as $$
declare
  v_prev_hash text;
  v_canonical text;
  v_row_hash text;
  v_id bigint;
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

  -- Canonical payload mirrors lib/markos/audit/canonical.cjs output:
  -- keys sorted ASC: action, actor_id, actor_role, occurred_at, payload, tenant_id
  v_canonical :=
    '{"action":'      || to_jsonb(p_action)::text
    || ',"actor_id":' || to_jsonb(p_actor_id)::text
    || ',"actor_role":' || to_jsonb(p_actor_role)::text
    || ',"occurred_at":' || to_jsonb(to_char(p_occurred_at at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))::text
    || ',"payload":'  || coalesce(p_payload::text, 'null')
    || ',"tenant_id":' || to_jsonb(p_tenant_id)::text
    || '}';

  v_row_hash := encode(digest(v_prev_hash || v_canonical, 'sha256'), 'hex');

  insert into markos_audit_log (
    tenant_id, org_id, source_domain, action, actor_id, actor_role,
    payload, prev_hash, row_hash, occurred_at,
    -- Keep legacy columns populated for continuity.
    workspace_id, actor, entity_type, entity_id, details
  ) values (
    p_tenant_id, p_org_id, p_source_domain, p_action, p_actor_id, p_actor_role,
    coalesce(p_payload, '{}'::jsonb), v_prev_hash, v_row_hash, p_occurred_at,
    -- Legacy-column compatibility (phase 206 will deprecate).
    (select workspace_id from markos_tenants where markos_tenants.id = p_tenant_id),
    p_actor_id, p_source_domain, p_action, coalesce(p_payload, '{}'::jsonb)
  )
  returning markos_audit_log.id into v_id;

  id := v_id;
  row_hash := v_row_hash;
  prev_hash := v_prev_hash;
  return next;
end;
$$;

comment on function append_markos_audit_row(text, text, text, text, text, text, jsonb, timestamptz)
  is 'Phase 201 D-17: per-tenant serialised audit writer. Acquires pg_advisory_xact_lock; computes SHA-256 hash chain inside the txn; mitigates Pitfall 4 (concurrent-fork). (Restored to migration-82 body by 90_rollback.)';
