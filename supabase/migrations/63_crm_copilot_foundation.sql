create table if not exists crm_copilot_summaries (
  summary_id text primary key,
  tenant_id text not null,
  record_kind text,
  record_id text,
  conversation_id text,
  summary_mode text not null check (summary_mode in ('record', 'conversation')),
  source_classes jsonb not null default '[]'::jsonb,
  missing_context jsonb not null default '[]'::jsonb,
  summary_text text not null,
  rationale jsonb not null default '{}'::jsonb,
  risk_flags jsonb not null default '[]'::jsonb,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists crm_copilot_approval_packages (
  package_id text primary key,
  tenant_id text not null,
  review_tenant_id text not null,
  run_id text not null,
  mutation_family text not null,
  target_record_kind text,
  target_record_id text,
  approval_required boolean not null default true,
  status text not null default 'awaiting_approval' check (status in ('awaiting_approval', 'approved', 'rejected')),
  rationale jsonb not null default '{}'::jsonb,
  evidence jsonb not null default '[]'::jsonb,
  proposed_changes jsonb not null default '{}'::jsonb,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists crm_copilot_mutation_outcomes (
  outcome_id text primary key,
  package_id text not null,
  tenant_id text not null,
  review_tenant_id text not null,
  run_id text not null,
  mutation_family text not null,
  status text not null,
  actor_id text not null,
  actor_role text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_crm_copilot_summaries_tenant on crm_copilot_summaries(tenant_id, created_at desc);
create index if not exists idx_crm_copilot_packages_tenant on crm_copilot_approval_packages(tenant_id, status, created_at desc);
create index if not exists idx_crm_copilot_outcomes_tenant on crm_copilot_mutation_outcomes(tenant_id, created_at desc);

alter table crm_copilot_summaries enable row level security;
alter table crm_copilot_approval_packages enable row level security;
alter table crm_copilot_mutation_outcomes enable row level security;