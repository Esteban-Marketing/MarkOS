create table if not exists markos_migrations (
  filename text primary key,
  checksum text not null,
  applied_at timestamptz not null default now()
);
