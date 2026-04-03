-- Phase 53: immutable approval decision ledger for AGT-03 / IAM-03

create table if not exists markos_agent_approval_decisions (
  decision_id text primary key default gen_random_uuid()::text,
  run_id text not null unique references markos_agent_runs(run_id) on delete cascade,
  tenant_id text not null references markos_tenants(id) on delete cascade,
  decision text not null check (decision in ('approved', 'rejected')),
  actor_id text not null,
  actor_role text not null,
  rationale text,
  correlation_id text not null,
  created_at timestamptz not null default now()
);

comment on table markos_agent_approval_decisions is 'Immutable approval decision ledger for high-impact run mutations.';

create index if not exists idx_markos_agent_approval_decisions_tenant_created
  on markos_agent_approval_decisions (tenant_id, created_at desc);

create index if not exists idx_markos_agent_approval_decisions_correlation
  on markos_agent_approval_decisions (correlation_id);

create or replace function markos_block_approval_decision_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'APPROVAL_DECISION_IMMUTABLE';
end;
$$;

drop trigger if exists trg_markos_block_approval_decision_update on markos_agent_approval_decisions;
create trigger trg_markos_block_approval_decision_update
before update on markos_agent_approval_decisions
for each row execute function markos_block_approval_decision_mutation();

drop trigger if exists trg_markos_block_approval_decision_delete on markos_agent_approval_decisions;
create trigger trg_markos_block_approval_decision_delete
before delete on markos_agent_approval_decisions
for each row execute function markos_block_approval_decision_mutation();

alter table markos_agent_approval_decisions enable row level security;

create policy if not exists markos_agent_approval_decisions_read_own on markos_agent_approval_decisions
  as permissive
  for select
  using (
    tenant_id in (
      select tenant_id from markos_tenant_memberships
      where user_id = auth.jwt()->>'sub'
    )
  );

create policy if not exists markos_agent_approval_decisions_insert_member on markos_agent_approval_decisions
  as permissive
  for insert
  with check (
    tenant_id in (
      select tenant_id from markos_tenant_memberships
      where user_id = auth.jwt()->>'sub'
    )
  );

-- No update/delete policies by design. Append-only immutability is enforced by trigger.