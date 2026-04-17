-- Phase 200-03: Webhook Subscription Primitive
-- Tables: markos_webhook_subscriptions, markos_webhook_deliveries
-- RLS follows existing markos_* membership-backed policy conventions from 51_multi_tenant_foundation.sql

-- ============================================================================
-- markos_webhook_subscriptions
-- ============================================================================

create table if not exists markos_webhook_subscriptions (
  id text primary key,
  tenant_id text not null references markos_tenants(id) on delete cascade,
  url text not null,
  secret text not null,
  events text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table markos_webhook_subscriptions is 'Tenant-scoped outbound webhook subscriptions for canonical MarkOS events';
comment on column markos_webhook_subscriptions.secret is 'HMAC-SHA256 signing secret (stored hashed in production; raw for local/testing)';
comment on column markos_webhook_subscriptions.events is 'Array of subscribed event namespaces, e.g. approval.created, campaign.launched';

create index if not exists idx_markos_webhook_subscriptions_tenant_id on markos_webhook_subscriptions(tenant_id);
create index if not exists idx_markos_webhook_subscriptions_active on markos_webhook_subscriptions(tenant_id, active);

-- ============================================================================
-- markos_webhook_deliveries
-- ============================================================================

create table if not exists markos_webhook_deliveries (
  id text primary key,
  subscription_id text not null references markos_webhook_subscriptions(id) on delete cascade,
  tenant_id text not null references markos_tenants(id) on delete cascade,
  event text not null,
  payload jsonb not null default '{}',
  attempt integer not null default 0,
  status text not null default 'pending'
    check (status in ('pending', 'retrying', 'delivered', 'failed')),
  response_code integer null,
  last_error text null,
  next_retry_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table markos_webhook_deliveries is 'Delivery log for each webhook attempt, including retry state';
comment on column markos_webhook_deliveries.attempt is 'Zero-based delivery attempt count; max 24 attempts';
comment on column markos_webhook_deliveries.status is 'pending | retrying | delivered | failed';

create index if not exists idx_markos_webhook_deliveries_subscription_id on markos_webhook_deliveries(subscription_id);
create index if not exists idx_markos_webhook_deliveries_tenant_id on markos_webhook_deliveries(tenant_id);
create index if not exists idx_markos_webhook_deliveries_status on markos_webhook_deliveries(tenant_id, status);
create index if not exists idx_markos_webhook_deliveries_next_retry on markos_webhook_deliveries(next_retry_at) where status = 'retrying';

-- ============================================================================
-- Row Level Security
-- ============================================================================

alter table markos_webhook_subscriptions enable row level security;
alter table markos_webhook_deliveries enable row level security;

-- Subscriptions: read via tenant membership
create policy if not exists markos_webhook_subscriptions_read_via_tenant on markos_webhook_subscriptions
  as permissive for select
  using (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = markos_webhook_subscriptions.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );

create policy if not exists markos_webhook_subscriptions_insert_via_tenant on markos_webhook_subscriptions
  as permissive for insert
  with check (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = markos_webhook_subscriptions.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );

create policy if not exists markos_webhook_subscriptions_update_via_tenant on markos_webhook_subscriptions
  as permissive for update
  using (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = markos_webhook_subscriptions.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  )
  with check (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = markos_webhook_subscriptions.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );

create policy if not exists markos_webhook_subscriptions_delete_via_tenant on markos_webhook_subscriptions
  as permissive for delete
  using (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = markos_webhook_subscriptions.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );

-- Deliveries: read via tenant membership (system writes; no direct user insert)
create policy if not exists markos_webhook_deliveries_read_via_tenant on markos_webhook_deliveries
  as permissive for select
  using (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = markos_webhook_deliveries.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );

create policy if not exists markos_webhook_deliveries_insert_via_tenant on markos_webhook_deliveries
  as permissive for insert
  with check (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = markos_webhook_deliveries.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );

create policy if not exists markos_webhook_deliveries_update_via_tenant on markos_webhook_deliveries
  as permissive for update
  using (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = markos_webhook_deliveries.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  )
  with check (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = markos_webhook_deliveries.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );
