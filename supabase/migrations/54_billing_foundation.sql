-- Phase 54: Billing foundation
-- Establishes MarkOS-owned billing periods, normalized usage events, pricing snapshots,
-- immutable usage ledger rows, and lineage joins for invoice-grade reconciliation.

create table if not exists billing_periods (
  billing_period_id text primary key default gen_random_uuid()::text,
  tenant_id text not null references markos_tenants(id) on delete cascade,
  period_start timestamptz not null,
  period_end timestamptz not null,
  status text not null default 'open' check (status in ('open', 'closing', 'closed')),
  created_at timestamptz not null default now(),
  closed_at timestamptz,
  unique (tenant_id, period_start, period_end)
);

comment on table billing_periods is 'Billing periods by tenant. MarkOS controls billing windows before any downstream provider sync.';

create index if not exists idx_billing_periods_tenant_period on billing_periods(tenant_id, period_start desc, period_end desc);

create table if not exists billing_pricing_snapshots (
  pricing_snapshot_id text primary key default gen_random_uuid()::text,
  tenant_id text not null references markos_tenants(id) on delete cascade,
  billing_period_id text references billing_periods(billing_period_id) on delete set null,
  pricing_version text not null,
  currency text not null default 'usd',
  effective_at timestamptz not null,
  unit_prices jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (tenant_id, pricing_version, effective_at)
);

comment on table billing_pricing_snapshots is 'Append-only price catalog snapshots stored in MarkOS so every billed unit can explain its unit price.';

create index if not exists idx_billing_pricing_snapshots_tenant_effective on billing_pricing_snapshots(tenant_id, effective_at desc);

create table if not exists billing_usage_events (
  usage_event_id text primary key default gen_random_uuid()::text,
  tenant_id text not null references markos_tenants(id) on delete cascade,
  billing_period_id text not null references billing_periods(billing_period_id) on delete cascade,
  correlation_id text not null,
  unit_type text not null check (unit_type in ('agent_run', 'token_input', 'token_output', 'plugin_operation', 'storage_gb_day')),
  quantity numeric(18,6) not null check (quantity >= 0),
  source_type text not null check (source_type in ('agent_run_close', 'agent_provider_attempt', 'plugin_operation', 'storage_snapshot')),
  source_event_key text not null,
  source_payload_ref text not null,
  pricing_key text not null,
  provider_context jsonb,
  raw_lineage jsonb not null default '{}'::jsonb,
  measured_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (tenant_id, source_event_key)
);

comment on table billing_usage_events is 'Normalized, deduplicated usage events derived from immutable plugin and agent telemetry with preserved lineage.';

create index if not exists idx_billing_usage_events_tenant_period on billing_usage_events(tenant_id, billing_period_id, measured_at desc);
create index if not exists idx_billing_usage_events_source on billing_usage_events(source_type, source_payload_ref);
create index if not exists idx_billing_usage_events_correlation on billing_usage_events(correlation_id);

create table if not exists billing_usage_ledger_rows (
  ledger_row_id text primary key default gen_random_uuid()::text,
  tenant_id text not null references markos_tenants(id) on delete cascade,
  billing_period_id text not null references billing_periods(billing_period_id) on delete cascade,
  pricing_snapshot_id text not null references billing_pricing_snapshots(pricing_snapshot_id) on delete restrict,
  unit_type text not null check (unit_type in ('agent_run', 'token_input', 'token_output', 'plugin_operation', 'storage_gb_day')),
  pricing_key text not null,
  aggregated_quantity numeric(18,6) not null check (aggregated_quantity >= 0),
  lineage_count integer not null check (lineage_count >= 0),
  unit_amount_usd numeric(18,6) not null check (unit_amount_usd >= 0),
  amount_usd numeric(18,6) not null check (amount_usd >= 0),
  source_event_keys text[] not null default '{}',
  source_payload_refs text[] not null default '{}',
  raw_lineage jsonb not null default '[]'::jsonb,
  materialized_at timestamptz not null default now(),
  unique (tenant_id, billing_period_id, pricing_snapshot_id, unit_type, pricing_key)
);

comment on table billing_usage_ledger_rows is 'Immutable billing-period ledger rows owned by MarkOS and priced against a stored pricing snapshot.';

create index if not exists idx_billing_usage_ledger_rows_tenant_period on billing_usage_ledger_rows(tenant_id, billing_period_id, materialized_at desc);

create table if not exists billing_usage_ledger_lineage (
  ledger_lineage_id text primary key default gen_random_uuid()::text,
  tenant_id text not null references markos_tenants(id) on delete cascade,
  ledger_row_id text not null references billing_usage_ledger_rows(ledger_row_id) on delete cascade,
  usage_event_id text not null references billing_usage_events(usage_event_id) on delete restrict,
  source_event_key text not null,
  source_payload_ref text not null,
  created_at timestamptz not null default now(),
  unique (ledger_row_id, usage_event_id)
);

comment on table billing_usage_ledger_lineage is 'Join table that maps each immutable ledger row back to the normalized usage events and raw telemetry lineage it contains.';

create index if not exists idx_billing_usage_ledger_lineage_tenant_row on billing_usage_ledger_lineage(tenant_id, ledger_row_id);
create index if not exists idx_billing_usage_ledger_lineage_usage_event on billing_usage_ledger_lineage(usage_event_id);

alter table billing_periods enable row level security;
alter table billing_pricing_snapshots enable row level security;
alter table billing_usage_events enable row level security;
alter table billing_usage_ledger_rows enable row level security;
alter table billing_usage_ledger_lineage enable row level security;

create policy if not exists billing_periods_read_own on billing_periods
  as permissive
  for select
  using (
    tenant_id in (
      select tenant_id from markos_tenant_memberships
      where user_id = auth.jwt()->>'sub'
    )
  );

create policy if not exists billing_periods_write_system on billing_periods
  as permissive
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy if not exists billing_pricing_snapshots_read_own on billing_pricing_snapshots
  as permissive
  for select
  using (
    tenant_id in (
      select tenant_id from markos_tenant_memberships
      where user_id = auth.jwt()->>'sub'
    )
  );

create policy if not exists billing_pricing_snapshots_insert_system on billing_pricing_snapshots
  as permissive
  for insert
  with check (auth.role() = 'service_role');

create policy if not exists billing_usage_events_read_own on billing_usage_events
  as permissive
  for select
  using (
    tenant_id in (
      select tenant_id from markos_tenant_memberships
      where user_id = auth.jwt()->>'sub'
    )
  );

create policy if not exists billing_usage_events_insert_system on billing_usage_events
  as permissive
  for insert
  with check (auth.role() = 'service_role');

create policy if not exists billing_usage_ledger_rows_read_own on billing_usage_ledger_rows
  as permissive
  for select
  using (
    tenant_id in (
      select tenant_id from markos_tenant_memberships
      where user_id = auth.jwt()->>'sub'
    )
  );

create policy if not exists billing_usage_ledger_rows_insert_system on billing_usage_ledger_rows
  as permissive
  for insert
  with check (auth.role() = 'service_role');

create policy if not exists billing_usage_ledger_lineage_read_own on billing_usage_ledger_lineage
  as permissive
  for select
  using (
    tenant_id in (
      select tenant_id from markos_tenant_memberships
      where user_id = auth.jwt()->>'sub'
    )
  );

create policy if not exists billing_usage_ledger_lineage_insert_system on billing_usage_ledger_lineage
  as permissive
  for insert
  with check (auth.role() = 'service_role');

-- Append-only semantics: no UPDATE/DELETE policies exist for pricing snapshots,
-- usage events, ledger rows, or ledger lineage.