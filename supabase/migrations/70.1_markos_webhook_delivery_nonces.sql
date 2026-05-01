-- Phase 200.1 D-202 migration 70.1: webhook delivery nonce store.
-- Closes review concern H2 (HMAC replay window + nonce idempotency).
-- NOTE: markos_webhook_subscriptions.id is currently text, so subscription_id
-- matches the real schema instead of assuming a uuid column.

create table if not exists markos_webhook_delivery_nonces (
  nonce text primary key,
  subscription_id text not null references markos_webhook_subscriptions(id) on delete cascade,
  created_at timestamptz not null default now()
);

comment on table markos_webhook_delivery_nonces is 'Short-lived nonce store for webhook replay protection';
comment on column markos_webhook_delivery_nonces.nonce is 'Random 16-byte hex nonce carried by signed webhook payloads';
comment on column markos_webhook_delivery_nonces.subscription_id is 'Owning webhook subscription for replay detection';

create index if not exists idx_markos_webhook_delivery_nonces_created_at
  on markos_webhook_delivery_nonces(created_at);

create index if not exists idx_markos_webhook_delivery_nonces_subscription_id
  on markos_webhook_delivery_nonces(subscription_id);

alter table markos_webhook_delivery_nonces enable row level security;

drop policy if exists markos_webhook_delivery_nonces_service_role on markos_webhook_delivery_nonces;
create policy markos_webhook_delivery_nonces_service_role
  on markos_webhook_delivery_nonces
  for all
  to service_role
  using (true)
  with check (true);
