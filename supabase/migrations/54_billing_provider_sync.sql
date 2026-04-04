create table if not exists billing_provider_sync_attempts (
  sync_attempt_id text primary key,
  tenant_id text not null,
  provider text not null check (provider in ('stripe')),
  sync_status text not null check (sync_status in ('pending', 'succeeded', 'failed')),
  reason_code text null,
  billing_truth_source text not null default 'markos-ledger' check (billing_truth_source in ('markos-ledger')),
  synced_at timestamptz not null default now()
);

create table if not exists billing_invoice_projections (
  projection_id text primary key,
  tenant_id text not null,
  provider text not null check (provider in ('stripe')),
  invoice_id text not null,
  line_items jsonb not null default '[]',
  billing_truth_source text not null default 'markos-ledger' check (billing_truth_source in ('markos-ledger')),
  created_at timestamptz not null default now()
);

alter table billing_provider_sync_attempts enable row level security;
alter table billing_invoice_projections enable row level security;