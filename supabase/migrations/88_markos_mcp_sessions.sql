-- Phase 202 Plan 01: MCP session persistence (D-06 opaque token + 24h rolling TTL; D-07 tenant-bound).

create table if not exists markos_mcp_sessions (
  id             text primary key,
  token_hash     text not null unique,
  user_id        text not null,
  tenant_id      text not null references markos_tenants(id) on delete cascade,
  org_id         text not null references markos_orgs(id)    on delete cascade,
  client_id      text not null,
  scopes         text[] not null default '{}',
  plan_tier      text not null default 'free',
  created_at     timestamptz not null default now(),
  last_used_at   timestamptz not null default now(),
  expires_at     timestamptz not null default (now() + interval '24 hours'),
  revoked_at     timestamptz,
  revoke_reason  text
);

comment on table markos_mcp_sessions is 'Phase 202 D-06: opaque OAuth 2.1 token -> session. 24h rolling TTL via last_used_at+24h. No JWT, no refresh.';

create index if not exists idx_mmsess_token_hash on markos_mcp_sessions(token_hash) where revoked_at is null;
create index if not exists idx_mmsess_tenant_id  on markos_mcp_sessions(tenant_id);
create index if not exists idx_mmsess_user_tenant on markos_mcp_sessions(user_id, tenant_id) where revoked_at is null;
create index if not exists idx_mmsess_expires    on markos_mcp_sessions(expires_at) where revoked_at is null;

alter table markos_mcp_sessions enable row level security;

create policy if not exists mmsess_read_own on markos_mcp_sessions
  as permissive
  for select
  using (user_id = auth.jwt()->>'sub');

create policy if not exists mmsess_read_tenant_admin on markos_mcp_sessions
  as permissive
  for select
  using (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = markos_mcp_sessions.tenant_id
        and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
        and markos_tenant_memberships.iam_role in ('owner','tenant-admin')
    )
  );

create policy if not exists mmsess_revoke_own on markos_mcp_sessions
  as permissive
  for update
  using (user_id = auth.jwt()->>'sub');

create policy if not exists mmsess_revoke_tenant_owner on markos_mcp_sessions
  as permissive
  for update
  using (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = markos_mcp_sessions.tenant_id
        and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
        and markos_tenant_memberships.iam_role = 'owner'
    )
  );
