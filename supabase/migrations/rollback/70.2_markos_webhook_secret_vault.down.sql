-- Phase 200.1 D-203 rollback for migration 70.2.
-- WARNING: this rollback is informational only for the secret column. Original
-- secret values are NOT recoverable here because they live only in Vault.
-- Operators must rotate each subscription after rollback if they want a fresh
-- plaintext secret column value.

alter table markos_webhook_subscriptions
  add column if not exists secret text;

alter table markos_webhook_subscriptions
  drop column if exists secret_vault_ref;

drop function if exists vault_create_or_update_secret(text, text, text);

-- Vault entries named markos:webhook:secret:* are intentionally left in place.
-- Operators may clean them manually after rollback drills if desired:
--   delete from vault.secrets where name like 'markos:webhook:secret:%';
