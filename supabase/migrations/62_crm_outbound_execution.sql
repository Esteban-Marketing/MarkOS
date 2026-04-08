create table if not exists crm_outbound_templates (
  template_id text primary key,
  tenant_id text not null,
  template_key text not null,
  channel text not null,
  display_name text not null,
  subject text,
  body_markdown text not null,
  variables jsonb not null default '[]'::jsonb,
  approval_state text not null default 'approved',
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists crm_outbound_sequences (
  sequence_id text primary key,
  tenant_id text not null,
  sequence_key text not null,
  contact_id text not null,
  record_kind text not null,
  record_id text not null,
  use_case text not null,
  risk_level text not null,
  approval_state text not null,
  steps jsonb not null default '[]'::jsonb,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists crm_outbound_queue (
  queue_id text primary key,
  tenant_id text not null,
  work_type text not null,
  status text not null,
  due_at timestamptz not null,
  contact_id text not null,
  record_kind text not null,
  record_id text not null,
  channel text not null,
  template_key text,
  sequence_id text,
  sequence_key text,
  sequence_step_id text,
  bulk_send_id text,
  approval_state text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists crm_outbound_bulk_sends (
  bulk_send_id text primary key,
  tenant_id text not null,
  channel text not null,
  record_kind text not null,
  use_case text not null,
  subject text,
  body_markdown text not null,
  schedule_at timestamptz not null,
  approval_required boolean not null default true,
  approval_state text not null,
  total_contacts integer not null default 0,
  eligible_contacts integer not null default 0,
  blocked_contacts integer not null default 0,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);