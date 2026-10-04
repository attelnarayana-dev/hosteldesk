-- HostelDesk V5 production PostgreSQL schema.
-- Data model preserves the current JSON fields while adding production-safe raw_data/payload storage.
-- Apply this schema before running scripts/migrate-json-to-postgres.mjs.

create extension if not exists pgcrypto;

create table if not exists customers (
  id text primary key,
  tenant_id text unique,
  hostel_name text not null,
  owner_name text,
  mobile text,
  email text unique not null,
  password_hash text not null,
  role text not null default 'CUSTOMER',
  status text not null default 'Active',
  created_at timestamptz not null default now()
);

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  token_hash text unique not null,
  customer_id text not null references customers(id) on delete cascade,
  tenant_id text,
  role text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists sessions_customer_idx on sessions(customer_id);
create index if not exists sessions_expires_idx on sessions(expires_at);

create table if not exists rooms (
  id text primary key,
  tenant_id text not null,
  floor text not null,
  room_number text not null,
  unique (tenant_id, room_number)
);
create index if not exists rooms_tenant_idx on rooms(tenant_id);

create table if not exists students (
  id text primary key,
  tenant_id text not null,
  full_name text not null,
  mobile text,
  gender text,
  dob text,
  document_number text,
  emergency text,
  address text,
  room_number text,
  floor text,
  bed text,
  advance numeric(12,2) default 0,
  monthly_rent numeric(12,2) default 0,
  status text not null default 'Active',
  front_proof_key text,
  back_proof_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  raw_data jsonb not null default '{}'::jsonb
);
create index if not exists students_tenant_idx on students(tenant_id);
create index if not exists students_mobile_idx on students(tenant_id, mobile);

create table if not exists beds (
  id text primary key,
  tenant_id text not null,
  room_id text not null references rooms(id) on delete cascade,
  label text not null,
  status text not null default 'Available',
  student_id text references students(id) on delete set null,
  unique (tenant_id, room_id, label)
);
create index if not exists beds_tenant_idx on beds(tenant_id);
create index if not exists beds_student_idx on beds(student_id);

create table if not exists guests (
  id text primary key,
  tenant_id text not null,
  full_name text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'Active',
  created_at timestamptz not null default now(),
  updated_at timestamptz
);
create index if not exists guests_tenant_idx on guests(tenant_id);

create table if not exists student_history (
  id text primary key,
  tenant_id text not null,
  student_id text,
  snapshot jsonb not null,
  checked_out_at timestamptz not null default now()
);
create index if not exists student_history_tenant_idx on student_history(tenant_id);

create table if not exists guest_history (
  id text primary key,
  tenant_id text not null,
  guest_id text,
  snapshot jsonb not null,
  checked_out_at timestamptz not null default now()
);
create index if not exists guest_history_tenant_idx on guest_history(tenant_id);

create table if not exists payments (
  id text primary key,
  tenant_id text not null,
  student_id text not null,
  student_name text,
  month text,
  amount numeric(12,2) not null,
  paid_at timestamptz not null,
  note text
);
create index if not exists payments_tenant_idx on payments(tenant_id);
create index if not exists payments_student_idx on payments(tenant_id, student_id, paid_at desc);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id text,
  actor_customer_id text,
  action text not null,
  target_type text,
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_tenant_idx on audit_logs(tenant_id, created_at desc);
