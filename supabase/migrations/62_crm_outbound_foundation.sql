create table if not exists crm_outbound_sends (
  outbound_id text primary key,
  tenant_id text not null,
  contact_id text not null,
  record_kind text not null,
  record_id text not null,
  channel text not null check (channel in ('email', 'sms', 'whatsapp')),
  provider text not null,
  provider_message_id text,
  status text not null,
  outcome text not null,
  subject text,
  body_markdown text not null,
  use_case text not null default 'marketing',
  risk_level text not null default 'standard',
  contact_point text,
  approval_required boolean not null default false,
  approval_granted_at timestamptz,
  scheduled_at timestamptz,
  sent_at timestamptz,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists crm_outbound_sends_tenant_idx
  on crm_outbound_sends (tenant_id, channel, created_at desc);

create table if not exists crm_contact_channel_consent (
  consent_id text primary key,
  tenant_id text not null,
  contact_id text not null,
  channel text not null check (channel in ('email', 'sms', 'whatsapp')),
  status text not null,
  lawful_basis text not null default 'marketing',
  verified_at timestamptz,
  unsubscribed_at timestamptz,
  opt_out_reason text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, contact_id, channel)
);

create index if not exists crm_contact_channel_consent_tenant_idx
  on crm_contact_channel_consent (tenant_id, contact_id, channel);

create table if not exists crm_outbound_conversations (
  conversation_id text primary key,
  tenant_id text not null,
  contact_id text not null,
  channel text not null check (channel in ('email', 'sms', 'whatsapp')),
  provider_thread_id text,
  conversation_status text not null default 'active',
  last_outbound_at timestamptz,
  last_inbound_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table crm_outbound_sends is 'Phase 62 outbound send foundation. Provider references and status changes write back to crm_activity_ledger as outbound_event.';
comment on table crm_contact_channel_consent is 'Phase 62 channel-specific consent and opt-out posture.';
comment on table crm_outbound_conversations is 'Phase 62 conversation placeholder for inbound or reply writeback.';