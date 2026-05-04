-- Phase 200.1 D-208 rollback for supabase/migrations/70_markos_webhook_subscriptions.sql
-- Idempotent: every drop guarded by `if exists`. Safe to re-run.
-- Ships under Phase 200.1 (the rollback Phase 200 originally omitted).
--
-- Order: policies -> indexes -> tables (reverse dependency).

-- 1. Drop policies first so table drops never depend on policy state.
drop policy if exists markos_webhook_deliveries_update_via_tenant on markos_webhook_deliveries;
drop policy if exists markos_webhook_deliveries_insert_via_tenant on markos_webhook_deliveries;
drop policy if exists markos_webhook_deliveries_read_via_tenant on markos_webhook_deliveries;

drop policy if exists markos_webhook_subscriptions_delete_via_tenant on markos_webhook_subscriptions;
drop policy if exists markos_webhook_subscriptions_update_via_tenant on markos_webhook_subscriptions;
drop policy if exists markos_webhook_subscriptions_insert_via_tenant on markos_webhook_subscriptions;
drop policy if exists markos_webhook_subscriptions_read_via_tenant on markos_webhook_subscriptions;

-- 2. Drop indexes explicitly for rollback parity with Phase 201 conventions.
drop index if exists idx_markos_webhook_deliveries_next_retry;
drop index if exists idx_markos_webhook_deliveries_status;
drop index if exists idx_markos_webhook_deliveries_tenant_id;
drop index if exists idx_markos_webhook_deliveries_subscription_id;

drop index if exists idx_markos_webhook_subscriptions_active;
drop index if exists idx_markos_webhook_subscriptions_tenant_id;

-- 3. Drop tables in reverse dependency order.
drop table if exists markos_webhook_deliveries;
drop table if exists markos_webhook_subscriptions;
