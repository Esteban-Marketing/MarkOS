create table if not exists governance_deletion_workflows (
  deletion_request_id text primary key,
  evidence_pack_id text not null references governance_evidence_packs(evidence_pack_id) on delete cascade,
  tenant_id text not null,
  request_received_at timestamptz not null,
  request_scope text not null,
  requested_by_actor_id text not null,
  approval_reference text not null,
  export_before_delete_status text not null,
  export_record_id text null references governance_retention_exports(export_record_id) on delete set null,
  export_completed_at timestamptz null,
  deletion_action text not null,
  workflow_status text not null,
  resulting_evidence_ref text not null,
  completed_at timestamptz null
);

alter table governance_deletion_workflows enable row level security;