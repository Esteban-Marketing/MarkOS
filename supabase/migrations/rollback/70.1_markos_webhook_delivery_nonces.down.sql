-- Phase 200.1 D-202 rollback for migration 70.1.
-- Idempotent: every drop guarded by if exists.

drop policy if exists markos_webhook_delivery_nonces_service_role on markos_webhook_delivery_nonces;
drop index if exists idx_markos_webhook_delivery_nonces_subscription_id;
drop index if exists idx_markos_webhook_delivery_nonces_created_at;
drop table if exists markos_webhook_delivery_nonces;
