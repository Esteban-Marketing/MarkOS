create table if not exists tenant_billing_subscriptions (
  subscription_id text primary key,
  tenant_id text not null,
  plan_key text not null,
  billing_state text not null check (billing_state in ('active', 'degraded', 'restricted', 'hold')),
  seats_limit integer not null default 0,
  projects_limit integer not null default 0,
  agent_runs_limit integer not null default 0,
  token_budget_limit integer not null default 0,
  storage_gb_days_limit integer not null default 0,
  premium_feature_flags jsonb not null default '{}',
  effective_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists tenant_billing_holds (
  hold_id text primary key,
  tenant_id text not null,
  subscription_id text not null references tenant_billing_subscriptions(subscription_id) on delete cascade,
  hold_state text not null check (hold_state in ('review', 'hold', 'released')),
  reason_code text not null,
  restricted_actions jsonb not null default '[]',
  read_access_preserved boolean not null default true,
  actor_id text null,
  applied_at timestamptz not null default now(),
  released_at timestamptz null
);

create table if not exists tenant_entitlement_snapshots (
  snapshot_id text primary key,
  tenant_id text not null,
  subscription_id text not null references tenant_billing_subscriptions(subscription_id) on delete cascade,
  billing_period_start timestamptz not null,
  billing_period_end timestamptz not null,
  status text not null check (status in ('active', 'degraded', 'restricted', 'hold')),
  enforcement_source text not null default 'markos-ledger' check (enforcement_source in ('markos-ledger')),
  restricted_actions jsonb not null default '[]',
  restricted_capabilities jsonb not null default '[]',
  allowances jsonb not null default '{}',
  usage_to_date jsonb not null default '{}',
  read_access_preserved boolean not null default true,
  reason_code text null,
  generated_at timestamptz not null default now()
);

create index if not exists idx_tenant_billing_subscriptions_tenant on tenant_billing_subscriptions (tenant_id, updated_at desc);
create index if not exists idx_tenant_billing_holds_tenant on tenant_billing_holds (tenant_id, applied_at desc);
create index if not exists idx_tenant_entitlement_snapshots_tenant_period on tenant_entitlement_snapshots (tenant_id, billing_period_start desc, billing_period_end desc);

alter table tenant_billing_subscriptions enable row level security;
alter table tenant_billing_holds enable row level security;
alter table tenant_entitlement_snapshots enable row level security;