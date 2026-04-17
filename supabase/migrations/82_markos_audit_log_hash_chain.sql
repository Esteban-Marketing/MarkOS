-- Phase 201: Audit Log Consolidation + Hash Chain (Migration 82)
-- Decisions: D-16 (unified markos_audit_log + CDC intake via staging), D-17 (per-tenant hash chain)
-- Pitfall mitigations: #3 at-least-once staging (no lost events on subscriber downtime),
--                      #4 per-tenant advisory lock (prevents concurrent-insert hash forks)
--
-- DOES NOT DROP existing columns from migration 37 (workspace_id, actor, entity_type, entity_id, details).
-- Phase 206 will deprecate them after full cutover. Today they coexist with the new payload jsonb column.

-- ============================================================================
-- 1. Extend markos_audit_log with D-16 + D-17 columns
-- ============================================================================
alter table markos_audit_log
  add column if not exists org_id text,
  add column if not exists source_domain text not null default 'legacy',
  add column if not exists actor_id text,
  add column if not exists actor_role text,
  add column if not exists payload jsonb,
  add column if not exists prev_hash text,
  add column if not exists row_hash text not null default '',
  add column if not exists occurred_at timestamptz not null default now();

create index if not exists idx_markos_audit_log_tenant_occurred on markos_audit_log(tenant_id, occurred_at desc);
create index if not exists idx_markos_audit_log_source_domain on markos_audit_log(source_domain);
create index if not exists idx_markos_audit_log_org_id on markos_audit_log(org_id);

comment on column markos_audit_log.source_domain is 'Phase 201 D-16: auth | tenancy | orgs | billing | crm | outbound | webhooks | approvals | consent | governance | system';
comment on column markos_audit_log.prev_hash is 'Phase 201 D-17: SHA-256 of the previous row in this tenant chain, or SHA-256(genesis:tenant_id) for first row';
comment on column markos_audit_log.row_hash is 'Phase 201 D-17: SHA-256(prev_hash || canonical_json(action, actor_id, actor_role, tenant_id, occurred_at, payload))';

-- ============================================================================
-- 2. RESTRICTIVE RLS: block UPDATE and DELETE for all callers (append-only)
-- Service-role bypasses RLS, so drain.js cron can still clean staging — but nothing
-- can ever mutate a row in markos_audit_log through normal auth.
-- ============================================================================
create policy if not exists markos_audit_log_block_update on markos_audit_log
  as restrictive
  for update
  using (false);

create policy if not exists markos_audit_log_block_delete on markos_audit_log
  as restrictive
  for delete
  using (false);

-- ============================================================================
-- 3. markos_audit_log_staging — at-least-once intake buffer (Pitfall 3 mitigation)
-- Every operational table that emits audit events either calls enqueueAuditStaging
-- directly or has a Postgres AFTER INSERT trigger that writes here. drain.js cron
-- replays into markos_audit_log via append_markos_audit_row.
-- ============================================================================
create table if not exists markos_audit_log_staging (
  id bigserial primary key,
  tenant_id text not null,
  org_id text,
  source_domain text not null,
  action text not null,
  actor_id text,
  actor_role text,
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  claimed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_markos_audit_log_staging_unclaimed
  on markos_audit_log_staging(id)
  where claimed_at is null;

comment on table markos_audit_log_staging is 'Phase 201 D-16 pitfall-3: at-least-once intake; drain job calls append_markos_audit_row per row and sets claimed_at.';

-- ============================================================================
-- 4. markos_audit_chain_checks — hash-chain verifier ledger
-- ============================================================================
create table if not exists markos_audit_chain_checks (
  id bigserial primary key,
  run_at timestamptz not null default now(),
  tenant_id text not null,
  row_count integer not null default 0,
  breaks_found integer not null default 0,
  status text not null check (status in ('pass', 'fail', 'empty')),
  details jsonb not null default '{}'::jsonb
);

create index if not exists idx_markos_audit_chain_checks_tenant_run on markos_audit_chain_checks(tenant_id, run_at desc);

comment on table markos_audit_chain_checks is 'Phase 201 D-17: per-run chain replay results. Empty chains report status=empty (not a break).';

-- ============================================================================
-- 5. append_markos_audit_row — single serialised writer with pg_advisory_xact_lock
--
-- Takes the advisory lock on the tenant partition, reads last row_hash, computes
-- the new row_hash inside the same txn, INSERTs, releases the lock on commit.
-- Eliminates the concurrent-fork race (Pitfall 4).
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
  -- Per-tenant advisory lock — serialises all inserts for this tenant within the transaction.
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
  is 'Phase 201 D-17: per-tenant serialised audit writer. Acquires pg_advisory_xact_lock; computes SHA-256 hash chain inside the txn; mitigates Pitfall 4 (concurrent-fork).';

-- ============================================================================
-- 6. Note: pgcrypto (digest, encode) is expected to be available — it ships with
--    Supabase. If a fresh Postgres lacks it, run: create extension if not exists pgcrypto;
-- ============================================================================
create extension if not exists pgcrypto;

-- ============================================================================
-- Phase 201 Plan 02: audit-log consolidation + hash chain complete.
-- ============================================================================
