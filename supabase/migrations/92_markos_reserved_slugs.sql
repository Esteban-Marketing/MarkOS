-- Phase 201.1 D-109: versioned reserved-slug list + admin override (closes review M6).
-- Replaces the hardcoded JS Set in lib/markos/tenant/reserved-slugs.cjs.
-- Loaded by lib/markos/tenant/reserved-slugs.cjs::loadReservedSlugsFromDb (5-min cache)
-- + admin override via /api/admin/reserved-slugs/* (F-106 contract).

create table if not exists markos_reserved_slugs (
  slug            text primary key,
  category        text not null check (category in ('system','protected','vendor','single_char','profanity')),
  source_version  text not null default '201-01',
  added_at        timestamptz not null default now(),
  added_by        text,
  notes           text
);

create index if not exists idx_markos_reserved_slugs_category on markos_reserved_slugs(category);
create index if not exists idx_markos_reserved_slugs_source_version on markos_reserved_slugs(source_version);

alter table markos_reserved_slugs enable row level security;

-- SELECT allowed for service_role + authenticated; admin endpoints use service_role server-side.
create policy if not exists markos_reserved_slugs_read on markos_reserved_slugs
  for select to authenticated, service_role using (true);

-- INSERT/UPDATE/DELETE only via service_role (admin endpoints inject service_role server-side).
create policy if not exists markos_reserved_slugs_admin on markos_reserved_slugs
  for all to service_role using (true) with check (true);

-- Seed: SYSTEM_NAMES (16 entries from migration-era reserved-slugs.cjs)
insert into markos_reserved_slugs (slug, category, source_version, added_by) values
  ('www','system','201-01','migration-92'),
  ('api','system','201-01','migration-92'),
  ('app','system','201-01','migration-92'),
  ('admin','system','201-01','migration-92'),
  ('mcp','system','201-01','migration-92'),
  ('sdk','system','201-01','migration-92'),
  ('mail','system','201-01','migration-92'),
  ('status','system','201-01','migration-92'),
  ('docs','system','201-01','migration-92'),
  ('blog','system','201-01','migration-92'),
  ('help','system','201-01','migration-92'),
  ('support','system','201-01','migration-92'),
  ('security','system','201-01','migration-92'),
  ('about','system','201-01','migration-92'),
  ('pricing','system','201-01','migration-92'),
  ('integrations','system','201-01','migration-92')
on conflict (slug) do nothing;

-- Seed: PROTECTED_ROUTES (14 entries)
insert into markos_reserved_slugs (slug, category, source_version, added_by) values
  ('root','protected','201-01','migration-92'),
  ('system','protected','201-01','migration-92'),
  ('signup','protected','201-01','migration-92'),
  ('signin','protected','201-01','migration-92'),
  ('login','protected','201-01','migration-92'),
  ('logout','protected','201-01','migration-92'),
  ('register','protected','201-01','migration-92'),
  ('settings','protected','201-01','migration-92'),
  ('billing','protected','201-01','migration-92'),
  ('dashboard','protected','201-01','migration-92'),
  ('invite','protected','201-01','migration-92'),
  ('onboarding','protected','201-01','migration-92'),
  ('auth','protected','201-01','migration-92'),
  ('static','protected','201-01','migration-92')
on conflict (slug) do nothing;

-- Seed: TRADEMARK_VENDORS (16 entries — verbatim from reserved-slugs.cjs)
insert into markos_reserved_slugs (slug, category, source_version, added_by) values
  ('claude','vendor','201-01','migration-92'),
  ('openai','vendor','201-01','migration-92'),
  ('anthropic','vendor','201-01','migration-92'),
  ('supabase','vendor','201-01','migration-92'),
  ('vercel','vendor','201-01','migration-92'),
  ('stripe','vendor','201-01','migration-92'),
  ('hubspot','vendor','201-01','migration-92'),
  ('shopify','vendor','201-01','migration-92'),
  ('slack','vendor','201-01','migration-92'),
  ('google','vendor','201-01','migration-92'),
  ('meta','vendor','201-01','migration-92'),
  ('segment','vendor','201-01','migration-92'),
  ('resend','vendor','201-01','migration-92'),
  ('twilio','vendor','201-01','migration-92'),
  ('posthog','vendor','201-01','migration-92'),
  ('linear','vendor','201-01','migration-92')
on conflict (slug) do nothing;

-- Seed: SINGLE_CHAR (36 entries — a-z and 0-9)
insert into markos_reserved_slugs (slug, category, source_version, added_by)
select c, 'single_char', '201-01', 'migration-92' from unnest(array[
  'a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z',
  '0','1','2','3','4','5','6','7','8','9'
]) as c
on conflict (slug) do nothing;

-- Seed: PROFANITY (6 hand-rolled entries — supplemented by obscenity npm dataset at runtime)
insert into markos_reserved_slugs (slug, category, source_version, added_by, notes) values
  ('fuck','profanity','201-01','migration-92','Phase-201 baseline — runtime adds obscenity dataset'),
  ('shit','profanity','201-01','migration-92','Phase-201 baseline'),
  ('cunt','profanity','201-01','migration-92','Phase-201 baseline'),
  ('bitch','profanity','201-01','migration-92','Phase-201 baseline'),
  ('nigger','profanity','201-01','migration-92','Phase-201 baseline'),
  ('faggot','profanity','201-01','migration-92','Phase-201 baseline')
on conflict (slug) do nothing;

comment on table markos_reserved_slugs is 'Phase 201.1 D-109 (closes M6): versioned reserved-slug list. Loaded by lib/markos/tenant/reserved-slugs.cjs::loadReservedSlugsFromDb (5-min cache) + admin override via /api/admin/reserved-slugs/*.';
