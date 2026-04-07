create extension if not exists pgcrypto;

alter table if exists public.evntszn_operator_profiles
  add column if not exists organizer_classification text not null default 'internal_operator'
    check (organizer_classification in ('evntszn_host', 'independent_organizer', 'city_host', 'venue_partner', 'internal_operator')),
  add column if not exists network_status text not null default 'active'
    check (network_status in ('prospect', 'active', 'paused', 'alumni'));

alter table if exists public.evntszn_applications
  add column if not exists organizer_classification text
    check (organizer_classification in ('evntszn_host', 'independent_organizer', 'city_host', 'venue_partner', 'internal_operator')),
  add column if not exists sponsor_interest boolean not null default false,
  add column if not exists requested_program text
    check (requested_program in ('signal', 'ambassador'));

alter table if exists public.evntszn_applications
  drop constraint if exists evntszn_applications_application_type_check;

alter table if exists public.evntszn_applications
  add constraint evntszn_applications_application_type_check
  check (application_type in ('host', 'organizer', 'partner', 'signal', 'ambassador'));

create table if not exists public.evntszn_sponsor_accounts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null,
  slug text unique,
  account_type text not null default 'sponsor' check (account_type in ('sponsor', 'partner')),
  scope_type text not null default 'platform' check (scope_type in ('platform', 'epl', 'city', 'event', 'venue')),
  city_scope jsonb not null default '[]'::jsonb,
  scope_reference text,
  tier_label text,
  status text not null default 'lead' check (status in ('lead', 'pending', 'active', 'archived')),
  logo_url text,
  website_url text,
  cta_label text,
  is_featured boolean not null default false,
  notes text,
  metadata jsonb not null default '{}'::jsonb
);

alter table if exists public.evntszn_sponsor_placements
  add column if not exists sponsor_account_id uuid references public.evntszn_sponsor_accounts(id) on delete set null;

create table if not exists public.evntszn_program_members (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  program_key text not null check (program_key in ('signal', 'ambassador')),
  status text not null default 'applicant' check (status in ('applicant', 'reviewing', 'active', 'paused', 'archived', 'rejected')),
  full_name text not null,
  email text not null,
  phone text,
  city text,
  state text,
  operator_user_id uuid,
  assigned_manager_user_id uuid,
  role_tags jsonb not null default '[]'::jsonb,
  activation_state text not null default 'pending' check (activation_state in ('pending', 'enabled', 'paused', 'inactive')),
  referral_ready boolean not null default false,
  notes text,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists evntszn_operator_profiles_organizer_classification_idx
  on public.evntszn_operator_profiles(organizer_classification, role_key);

create index if not exists evntszn_applications_program_idx
  on public.evntszn_applications(application_type, requested_program, status);

create index if not exists evntszn_sponsor_accounts_scope_idx
  on public.evntszn_sponsor_accounts(scope_type, status);

create index if not exists evntszn_program_members_program_status_idx
  on public.evntszn_program_members(program_key, status, created_at desc);

drop trigger if exists evntszn_sponsor_accounts_set_updated_at on public.evntszn_sponsor_accounts;
create trigger evntszn_sponsor_accounts_set_updated_at
before update on public.evntszn_sponsor_accounts
for each row execute function public.set_updated_at();

drop trigger if exists evntszn_program_members_set_updated_at on public.evntszn_program_members;
create trigger evntszn_program_members_set_updated_at
before update on public.evntszn_program_members
for each row execute function public.set_updated_at();
