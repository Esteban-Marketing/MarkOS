-- Phase 200.1 D-204 migration 71.1: MCP per-tenant auth + cost + rate-limit surfaces.
-- Adapts the plan's generic uuid sketch to the repo's real text-backed tenant/session ids.
-- The kill-switch consumes the existing tenant_billing_holds table from migrations 54/55.

-- 1. API keys table.
create table if not exists markos_mcp_api_keys (
  id text primary key,
  tenant_id text not null references markos_tenants(id) on delete cascade,
  org_id text references markos_orgs(id) on delete cascade,
  key_hash text not null unique,
  label text not null,
  scopes text[] not null default '{}',
  created_by_user_id text,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);

create index if not exists idx_markos_mcp_api_keys_tenant_id
  on markos_mcp_api_keys (tenant_id);
create index if not exists idx_markos_mcp_api_keys_revoked_at
  on markos_mcp_api_keys (revoked_at);

alter table markos_mcp_api_keys enable row level security;

create policy if not exists markos_mcp_api_keys_read_via_membership on markos_mcp_api_keys
  as permissive
  for select
  using (
    exists (
      select 1
      from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = markos_mcp_api_keys.tenant_id
        and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );

create policy if not exists markos_mcp_api_keys_service_role_all on markos_mcp_api_keys
  as permissive
  for all
  to service_role
  using (true)
  with check (true);

comment on table markos_mcp_api_keys is 'Phase 200.1 D-204: hashed MCP bearer keys (mks_...) scoped to one tenant.';

-- 2. Cost events table.
create table if not exists markos_mcp_cost_events (
  id text primary key,
  tenant_id text not null references markos_tenants(id) on delete cascade,
  org_id text references markos_orgs(id) on delete cascade,
  mcp_session_id text references markos_mcp_sessions(id) on delete set null,
  key_id text references markos_mcp_api_keys(id) on delete set null,
  tool_name text not null,
  llm_call_id text,
  cost_cents integer not null default 0 check (cost_cents >= 0),
  occurred_at timestamptz not null default now()
);

create index if not exists idx_markos_mcp_cost_events_tenant_id_occurred_at
  on markos_mcp_cost_events (tenant_id, occurred_at desc);
create index if not exists idx_markos_mcp_cost_events_session
  on markos_mcp_cost_events (mcp_session_id);
create index if not exists idx_markos_mcp_cost_events_key_id
  on markos_mcp_cost_events (key_id);

alter table markos_mcp_cost_events enable row level security;

create policy if not exists markos_mcp_cost_events_read_via_membership on markos_mcp_cost_events
  as permissive
  for select
  using (
    exists (
      select 1
      from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = markos_mcp_cost_events.tenant_id
        and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );

create policy if not exists markos_mcp_cost_events_service_role_all on markos_mcp_cost_events
  as permissive
  for all
  to service_role
  using (true)
  with check (true);

comment on table markos_mcp_cost_events is 'Phase 200.1 D-204: inline MCP per-tool billing telemetry.';

-- 3. Rate-limit rolling window table.
create table if not exists markos_mcp_rate_windows (
  tenant_id text not null references markos_tenants(id) on delete cascade,
  window_start timestamptz not null,
  count integer not null default 0 check (count >= 0),
  primary key (tenant_id, window_start)
);

create index if not exists idx_markos_mcp_rate_windows_window_start
  on markos_mcp_rate_windows (window_start);

alter table markos_mcp_rate_windows enable row level security;

create policy if not exists markos_mcp_rate_windows_service_role_all on markos_mcp_rate_windows
  as permissive
  for all
  to service_role
  using (true)
  with check (true);

comment on table markos_mcp_rate_windows is 'Phase 200.1 D-204: per-tenant minute buckets for MCP bearer throttling.';

-- 4. Atomic increment function for the bearer rate-limit window.
create or replace function markos_mcp_increment_rate_window(
  p_tenant_id text,
  p_window_start timestamptz
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  insert into markos_mcp_rate_windows (tenant_id, window_start, count)
  values (p_tenant_id, p_window_start, 1)
  on conflict (tenant_id, window_start)
    do update set count = markos_mcp_rate_windows.count + 1
  returning count into v_count;

  return v_count;
end;
$$;

comment on function markos_mcp_increment_rate_window(text, timestamptz)
  is 'Phase 200.1 D-204: atomic minute-bucket increment used by MCP bearer rate limiting.';
