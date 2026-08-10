-- ALPFA Convention Volunteer Hub schema
-- Run this once in the Supabase SQL editor (Project > SQL Editor > New query).
-- Re-running is safe (all creates are idempotent); it will not wipe data.

create extension if not exists "pgcrypto";

create table if not exists volunteers (
  id uuid primary key default gen_random_uuid(),
  volunteer_id text unique,
  full_name text not null,
  first_name text,
  last_name text,
  email text,
  phone text,
  member_type text,
  team text,
  status text,
  roles text[] default '{}',
  created_at timestamptz not null default now()
);

create table if not exists shifts (
  id uuid primary key default gen_random_uuid(),
  volunteer_id uuid references volunteers(id) on delete cascade,
  day_order int,
  day_label text,
  start_time time,
  end_time time,
  session text,
  location text,
  team text,
  leads text[] default '{}',
  created_at timestamptz not null default now()
);

create table if not exists partnership_assignments (
  id uuid primary key default gen_random_uuid(),
  volunteer_id uuid references volunteers(id) on delete cascade,
  sponsor_company text not null,
  created_at timestamptz not null default now()
);

create table if not exists sponsor_contacts (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  first_name text,
  last_name text,
  title text,
  email text,
  phone text,
  sponsorship_level text,
  created_at timestamptz not null default now()
);

create table if not exists conf_schedule (
  id uuid primary key default gen_random_uuid(),
  session text not null,
  type text,
  room text,
  day_order int,
  day_label text,
  start_time time,
  end_time time,
  created_at timestamptz not null default now()
);

create table if not exists key_contacts (
  id uuid primary key default gen_random_uuid(),
  area text not null,
  name text not null,
  role text,
  phone text,
  email text,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists shifts_volunteer_id_idx on shifts(volunteer_id);
create index if not exists partnership_assignments_volunteer_id_idx on partnership_assignments(volunteer_id);
create index if not exists volunteers_full_name_idx on volunteers(full_name);
create index if not exists sponsor_contacts_company_name_idx on sponsor_contacts(company_name);
create index if not exists conf_schedule_type_idx on conf_schedule(type);

-- Row Level Security stays on with no policies: the app only talks to
-- Supabase from the server using the secret key, which bypasses RLS.
alter table volunteers enable row level security;
alter table shifts enable row level security;
alter table partnership_assignments enable row level security;
alter table sponsor_contacts enable row level security;
alter table conf_schedule enable row level security;
alter table key_contacts enable row level security;
