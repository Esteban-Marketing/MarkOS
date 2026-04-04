create table if not exists tenant_sso_bindings (
  binding_id text primary key,
  tenant_id text not null,
  sso_provider_id text not null,
  provider_type text not null check (provider_type in ('saml', 'oidc')),
  idp_entity_id text not null,
  attribute_mappings jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists identity_role_mapping_rules (
  rule_id text primary key,
  tenant_id text not null,
  sso_provider_id text not null,
  claim_type text not null,
  claim_value text not null,
  canonical_role text not null,
  created_at timestamptz not null default now()
);

create table if not exists identity_role_mapping_events (
  event_id text primary key,
  tenant_id text not null,
  actor_id text not null,
  correlation_id text not null,
  sso_provider_id text not null,
  matched_rule_id text null,
  canonical_role text null,
  decision text not null check (decision in ('granted', 'denied')),
  denial_reason text null,
  source_claims jsonb not null default '[]',
  mapped_at timestamptz not null default now()
);

alter table tenant_sso_bindings enable row level security;
alter table identity_role_mapping_rules enable row level security;
alter table identity_role_mapping_events enable row level security;