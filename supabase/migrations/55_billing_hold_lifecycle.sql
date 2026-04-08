create table if not exists billing_hold_events (
  hold_event_id text primary key,
  tenant_id text not null,
  provider text not null check (provider in ('stripe')),
  billing_period_start timestamptz not null,
  billing_period_end timestamptz not null,
  event_type text not null check (event_type in ('hold_opened', 'hold_extended', 'hold_released')),
  hold_state text not null check (hold_state in ('hold', 'released')),
  reason_code text null,
  sync_attempt_id text null references billing_provider_sync_attempts(sync_attempt_id) on delete set null,
  released_by_sync_attempt_id text null references billing_provider_sync_attempts(sync_attempt_id) on delete set null,
  evidence_payload jsonb not null default '{}',
  created_at timestamptz not null default now(),
  released_at timestamptz null
);

create index if not exists idx_billing_hold_events_tenant_period
  on billing_hold_events (tenant_id, billing_period_start desc, billing_period_end desc, created_at desc);

alter table billing_hold_events enable row level security;