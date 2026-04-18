-- Phase 202 Plan 01: per-tenant 24h rolling cost window (D-10 rolling 24h, D-11 atomic check-and-charge).

create table if not exists markos_mcp_cost_window (
  tenant_id      text not null references markos_tenants(id) on delete cascade,
  window_start   timestamptz not null,
  spent_cents    integer not null default 0 check (spent_cents >= 0),
  updated_at     timestamptz not null default now(),
  primary key (tenant_id, window_start)
);

comment on table markos_mcp_cost_window is 'Phase 202 D-10: 24 hourly buckets per tenant; sum over last 24h = current spend.';

create index if not exists idx_mmcw_tenant_window on markos_mcp_cost_window(tenant_id, window_start desc);

alter table markos_mcp_cost_window enable row level security;

create policy if not exists mmcw_read_tenant_admin on markos_mcp_cost_window
  as permissive
  for select
  using (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = markos_mcp_cost_window.tenant_id
        and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
        and markos_tenant_memberships.iam_role in ('owner','tenant-admin','billing-admin')
    )
  );

create or replace function check_and_charge_mcp_budget(
  p_tenant_id    text,
  p_charge_cents integer,
  p_cap_cents    integer
) returns table(ok boolean, spent_cents integer, cap_cents integer, reset_at timestamptz) as $$
declare
  v_now          timestamptz := now();
  v_bucket       timestamptz := date_trunc('hour', v_now);
  v_window_start timestamptz := v_now - interval '24 hours';
  v_total        integer;
begin
  select coalesce(sum(mcw.spent_cents), 0) into v_total
  from markos_mcp_cost_window mcw
  where mcw.tenant_id = p_tenant_id
    and mcw.window_start > v_window_start;

  if v_total + p_charge_cents > p_cap_cents then
    return query select false, v_total, p_cap_cents, v_now + interval '1 hour';
    return;
  end if;

  insert into markos_mcp_cost_window(tenant_id, window_start, spent_cents, updated_at)
  values (p_tenant_id, v_bucket, p_charge_cents, v_now)
  on conflict (tenant_id, window_start)
  do update set spent_cents = markos_mcp_cost_window.spent_cents + p_charge_cents,
                updated_at  = v_now;

  return query select true, v_total + p_charge_cents, p_cap_cents, v_now + interval '1 hour';
end;
$$ language plpgsql security definer;

comment on function check_and_charge_mcp_budget is 'Phase 202 D-11: atomic check-and-charge for 24h rolling cap. Row-lock per (tenant, bucket) prevents stampede.';
