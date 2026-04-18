-- Phase 203 Plan 02 Task 2 rollback: reverse every object created by
-- 72_markos_webhook_dlq_and_rotation.sql in dependency-safe order.
--
-- Idempotent: every DROP uses `if exists` so re-running is a no-op.

-- 1. Functions first (no dependents).
drop function if exists finalize_expired_webhook_rotations(timestamptz);
drop function if exists rollback_webhook_rotation(text, text, text);
drop function if exists start_webhook_rotation(text, text, text, text, timestamptz, text);

-- 2. View (depends on markos_webhook_deliveries).
drop view if exists markos_webhook_fleet_metrics_v1;

-- 3. secret_rotations ledger: policy + indexes + table.
drop policy if exists rotations_read_via_tenant on markos_webhook_secret_rotations;
drop index if exists idx_rotations_active;
drop table if exists markos_webhook_secret_rotations;

-- 4. Deliveries: partial index + FK + columns.
drop index if exists idx_deliveries_dlq_retention;
alter table markos_webhook_deliveries
  drop constraint if exists markos_webhook_deliveries_replayed_from_fkey;
alter table markos_webhook_deliveries
  drop column if exists dlq_at,
  drop column if exists final_attempt,
  drop column if exists dlq_reason,
  drop column if exists replayed_from;

-- 5. Subscriptions: constraint + columns.
alter table markos_webhook_subscriptions
  drop constraint if exists markos_webhook_subscriptions_rotation_state_check;
alter table markos_webhook_subscriptions
  drop column if exists rps_override,
  drop column if exists rotation_state,
  drop column if exists grace_ends_at,
  drop column if exists grace_started_at,
  drop column if exists secret_v2;
