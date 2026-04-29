-- Rollback: drop the atomic increment fn. lib/markos/auth/rate-limit.cjs MUST be reverted
-- to the migration-83-era upsert pattern BEFORE this rollback runs (otherwise signup breaks).
revoke all on function if exists increment_signup_rate(text, timestamptz) from public, authenticated, service_role, anon;
drop function if exists increment_signup_rate(text, timestamptz);
