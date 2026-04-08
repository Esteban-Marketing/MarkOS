-- Phase 58 Wave 1: canonical CRM entities

create table if not exists crm_contacts (
  contact_id text primary key,
  tenant_id text not null references markos_tenants(id) on delete cascade,
  entity_id text not null unique,
  company_id text null,
  account_id text null,
  first_name text not null default '',
  last_name text not null default '',
  full_name text not null,
  primary_email text null,
  phone text null,
  lifecycle_stage text not null default 'lead',
  created_by text null,
  updated_by text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists crm_companies (
  company_id text primary key,
  tenant_id text not null references markos_tenants(id) on delete cascade,
  entity_id text not null unique,
  domain text null,
  legal_name text not null,
  display_name text not null,
  industry text null,
  employee_band text null,
  created_by text null,
  updated_by text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists crm_accounts (
  account_id text primary key,
  tenant_id text not null references markos_tenants(id) on delete cascade,
  entity_id text not null unique,
  company_id text null references crm_companies(company_id) on delete set null,
  owner_contact_id text null,
  account_status text not null default 'prospect',
  health_score numeric(5,2) null,
  created_by text null,
  updated_by text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists crm_customers (
  customer_id text primary key,
  tenant_id text not null references markos_tenants(id) on delete cascade,
  entity_id text not null unique,
  account_id text null references crm_accounts(account_id) on delete set null,
  primary_contact_id text null,
  customer_status text not null default 'active',
  value_band text null,
  created_by text null,
  updated_by text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists crm_deals (
  deal_id text primary key,
  tenant_id text not null references markos_tenants(id) on delete cascade,
  entity_id text not null unique,
  company_id text null references crm_companies(company_id) on delete set null,
  primary_contact_id text null,
  pipeline_key text not null default 'default',
  stage_key text not null default 'qualified',
  amount numeric(12,2) null,
  currency text not null default 'USD',
  expected_close_at timestamptz null,
  created_by text null,
  updated_by text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists crm_tasks (
  task_id text primary key,
  tenant_id text not null references markos_tenants(id) on delete cascade,
  entity_id text not null unique,
  linked_record_kind text not null,
  linked_record_id text not null,
  title text not null,
  task_status text not null default 'open',
  due_at timestamptz null,
  assigned_actor_id text null,
  created_by text null,
  updated_by text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists crm_notes (
  note_id text primary key,
  tenant_id text not null references markos_tenants(id) on delete cascade,
  entity_id text not null unique,
  linked_record_kind text not null,
  linked_record_id text not null,
  body_markdown text not null,
  created_by text null,
  updated_by text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table crm_contacts add constraint crm_contacts_company_fk foreign key (company_id) references crm_companies(company_id) on delete set null;
alter table crm_contacts add constraint crm_contacts_account_fk foreign key (account_id) references crm_accounts(account_id) on delete set null;
alter table crm_accounts add constraint crm_accounts_owner_contact_fk foreign key (owner_contact_id) references crm_contacts(contact_id) on delete set null;
alter table crm_customers add constraint crm_customers_primary_contact_fk foreign key (primary_contact_id) references crm_contacts(contact_id) on delete set null;
alter table crm_deals add constraint crm_deals_primary_contact_fk foreign key (primary_contact_id) references crm_contacts(contact_id) on delete set null;

create index if not exists idx_crm_contacts_tenant_id on crm_contacts(tenant_id);
create index if not exists idx_crm_contacts_company_id on crm_contacts(company_id);
create index if not exists idx_crm_companies_tenant_id on crm_companies(tenant_id);
create index if not exists idx_crm_accounts_tenant_id on crm_accounts(tenant_id);
create index if not exists idx_crm_customers_tenant_id on crm_customers(tenant_id);
create index if not exists idx_crm_deals_tenant_id on crm_deals(tenant_id);
create index if not exists idx_crm_tasks_tenant_id on crm_tasks(tenant_id);
create index if not exists idx_crm_notes_tenant_id on crm_notes(tenant_id);

alter table crm_contacts enable row level security;
alter table crm_companies enable row level security;
alter table crm_accounts enable row level security;
alter table crm_customers enable row level security;
alter table crm_deals enable row level security;
alter table crm_tasks enable row level security;
alter table crm_notes enable row level security;

create policy if not exists crm_contacts_read_via_tenant on crm_contacts
  as permissive for select
  using (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = crm_contacts.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );

create policy if not exists crm_contacts_insert_via_tenant on crm_contacts
  as permissive for insert
  with check (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = crm_contacts.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );

create policy if not exists crm_contacts_update_via_tenant on crm_contacts
  as permissive for update
  using (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = crm_contacts.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  )
  with check (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = crm_contacts.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );

create policy if not exists crm_companies_read_via_tenant on crm_companies
  as permissive for select
  using (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = crm_companies.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );

create policy if not exists crm_companies_insert_via_tenant on crm_companies
  as permissive for insert
  with check (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = crm_companies.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );

create policy if not exists crm_companies_update_via_tenant on crm_companies
  as permissive for update
  using (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = crm_companies.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  )
  with check (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = crm_companies.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );

create policy if not exists crm_accounts_read_via_tenant on crm_accounts
  as permissive for select
  using (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = crm_accounts.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );

create policy if not exists crm_accounts_insert_via_tenant on crm_accounts
  as permissive for insert
  with check (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = crm_accounts.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );

create policy if not exists crm_accounts_update_via_tenant on crm_accounts
  as permissive for update
  using (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = crm_accounts.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  )
  with check (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = crm_accounts.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );

create policy if not exists crm_customers_read_via_tenant on crm_customers
  as permissive for select
  using (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = crm_customers.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );

create policy if not exists crm_customers_insert_via_tenant on crm_customers
  as permissive for insert
  with check (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = crm_customers.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );

create policy if not exists crm_customers_update_via_tenant on crm_customers
  as permissive for update
  using (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = crm_customers.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  )
  with check (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = crm_customers.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );

create policy if not exists crm_deals_read_via_tenant on crm_deals
  as permissive for select
  using (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = crm_deals.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );

create policy if not exists crm_deals_insert_via_tenant on crm_deals
  as permissive for insert
  with check (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = crm_deals.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );

create policy if not exists crm_deals_update_via_tenant on crm_deals
  as permissive for update
  using (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = crm_deals.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  )
  with check (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = crm_deals.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );

create policy if not exists crm_tasks_read_via_tenant on crm_tasks
  as permissive for select
  using (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = crm_tasks.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );

create policy if not exists crm_tasks_insert_via_tenant on crm_tasks
  as permissive for insert
  with check (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = crm_tasks.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );

create policy if not exists crm_tasks_update_via_tenant on crm_tasks
  as permissive for update
  using (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = crm_tasks.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  )
  with check (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = crm_tasks.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );

create policy if not exists crm_notes_read_via_tenant on crm_notes
  as permissive for select
  using (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = crm_notes.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );

create policy if not exists crm_notes_insert_via_tenant on crm_notes
  as permissive for insert
  with check (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = crm_notes.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );

create policy if not exists crm_notes_update_via_tenant on crm_notes
  as permissive for update
  using (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = crm_notes.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  )
  with check (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = crm_notes.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );
