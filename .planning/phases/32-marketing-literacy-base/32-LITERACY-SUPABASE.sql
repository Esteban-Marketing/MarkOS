-- Supabase schema for canonical literacy chunks
-- Table: markos_literacy_chunks

create table if not exists markos_literacy_chunks (
  chunk_id text primary key,
  doc_id text not null,
  category text not null,
  discipline text not null,
  sub_discipline text,
  business_model text[],
  company_size text[],
  industry_tags text[],
  funnel_stage text,
  content_type text,
  evidence_level text,
  recency text,
  source_type text,
  source_ref text,
  last_validated date,
  version text,
  ttl_days integer default 180,
  status text default 'canonical',
  agent_use text[],
  retrieval_keywords text[],
  chunk_text text not null,
  vector_namespace text not null,
  checksum_sha256 text,
  conflict_note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table markos_literacy_chunks enable row level security;

-- service_role bypasses RLS automatically. Keep explicit read scope for canonical/superseded access.
create policy "agents_read_canonical" on markos_literacy_chunks
  for select using (status in ('canonical', 'superseded'));
