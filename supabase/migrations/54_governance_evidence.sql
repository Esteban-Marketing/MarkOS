create table if not exists governance_evidence_packs (
  evidence_pack_id text primary key,
  tenant_id text not null,
  pack_type text not null,
  evidence_sources jsonb not null default '[]',
  privileged_billing_actions jsonb not null default '[]',
  privileged_identity_actions jsonb not null default '[]',
  generated_from_operator_notes boolean not null default false,
  generated_at timestamptz not null default now()
);

create table if not exists governance_access_reviews (
  review_id text primary key,
  tenant_id text not null,
  review_scope text not null,
  last_completed timestamptz not null,
  owner text not null,
  findings_status text not null,
  next_review_due timestamptz not null
);

create table if not exists governance_retention_exports (
  export_record_id text primary key,
  evidence_pack_id text not null references governance_evidence_packs(evidence_pack_id) on delete cascade,
  tenant_id text not null,
  retention_window text not null,
  export_status text not null,
  exported_at timestamptz null,
  export_location text not null
);

create table if not exists governance_vendor_inventory (
  vendor_inventory_id text primary key,
  tenant_id text not null,
  vendor_key text not null,
  vendor_name text not null,
  service_category text not null,
  source_of_truth text not null,
  reviewed_at timestamptz not null,
  evidence_ref text not null
);

alter table governance_evidence_packs enable row level security;
alter table governance_access_reviews enable row level security;
alter table governance_retention_exports enable row level security;
alter table governance_vendor_inventory enable row level security;