-- Phase 201.1 D-105: atomic rate-limit increment for signups.
-- Closes review concern H6: eliminates the read-then-write race in lib/markos/auth/rate-limit.cjs.
-- The pre-existing markos_signup_rate_limits table (migration 83) ships with
-- columns (ip_hash text, window_start timestamptz, attempt_count int, updated_at timestamptz)
-- and primary key on (ip_hash, window_start). This migration only adds the SQL fn.

create or replace function increment_signup_rate(
  p_ip_hash text,
  p_hour_bucket timestamptz
) returns int
  language sql
  volatile
as $$
  insert into markos_signup_rate_limits (ip_hash, window_start, attempt_count, updated_at)
    values (p_ip_hash, p_hour_bucket, 1, now())
  on conflict (ip_hash, window_start) do update
    set attempt_count = markos_signup_rate_limits.attempt_count + 1,
        updated_at = now()
  returning attempt_count;
$$;

comment on function increment_signup_rate(text, timestamptz)
  is 'Phase 201.1 D-105: atomic UPSERT + increment for signup rate limiting. Returns post-increment count. Eliminates read-then-write race (review H6).';

-- Tighten privileges so only authenticated + service_role can call this.
revoke all on function increment_signup_rate(text, timestamptz) from public;
grant execute on function increment_signup_rate(text, timestamptz) to authenticated, service_role, anon;
-- anon required because /api/auth/signup runs PRE-auth on the public route — middleware
-- has not assigned a tenant yet. Rate-limit table itself remains RLS-locked at the
-- markos_signup_rate_limits policy from migration 83.
