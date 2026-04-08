create table if not exists crm_execution_recommendations (
  recommendation_id text primary key,
  tenant_id text not null,
  record_kind text not null,
  record_id text not null,
  queue_tab text not null,
  urgency_score integer not null default 0,
  status text not null default 'active' check (status in ('active', 'dismissed', 'approved', 'snoozed')),
  rationale_summary text not null,
  source_signals jsonb not null default '[]'::jsonb,
  bounded_actions jsonb not null default '[]'::jsonb,
  dismissed_at timestamptz null,
  snoozed_until timestamptz null,
  approved_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists crm_execution_queue_preferences (
  preference_id text primary key,
  tenant_id text not null,
  actor_id text not null,
  queue_scope text not null check (queue_scope in ('personal', 'team')),
  active_tab text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists crm_execution_draft_suggestions (
  suggestion_id text primary key,
  tenant_id text not null,
  recommendation_id text not null,
  record_kind text not null,
  record_id text not null,
  channel text not null,
  suggestion_only boolean not null default true,
  send_disabled boolean not null default true,
  sequence_disabled boolean not null default true,
  preview_text text not null,
  dismissed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_crm_execution_recommendations_tenant_id on crm_execution_recommendations(tenant_id);
create index if not exists idx_crm_execution_queue_preferences_tenant_actor on crm_execution_queue_preferences(tenant_id, actor_id);
create index if not exists idx_crm_execution_draft_suggestions_tenant_id on crm_execution_draft_suggestions(tenant_id);

alter table crm_execution_recommendations enable row level security;
alter table crm_execution_queue_preferences enable row level security;
alter table crm_execution_draft_suggestions enable row level security;