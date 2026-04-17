create extension if not exists pgcrypto;

create table if not exists public.evntszn_operator_profiles (
  user_id uuid primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  role_key text not null default 'attendee',
  job_title text,
  functions jsonb not null default '[]'::jsonb,
  city_scope jsonb not null default '[]'::jsonb,
  dashboard_access jsonb not null default '[]'::jsonb,
  surface_access jsonb not null default '[]'::jsonb,
  module_access jsonb not null default '[]'::jsonb,
  approval_authority jsonb not null default '[]'::jsonb,
  team_scope jsonb not null default '[]'::jsonb,
  sponsor_scope jsonb not null default '[]'::jsonb,
  can_manage_content boolean not null default false,
  can_manage_discovery boolean not null default false,
  can_manage_store boolean not null default false,
  can_manage_sponsors boolean not null default false,
  can_access_scanner boolean not null default false,
  is_active boolean not null default true,
  notes text
);

create table if not exists public.evntszn_applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  application_type text not null check (application_type in ('host', 'organizer', 'partner')),
  status text not null default 'new' check (status in ('new', 'reviewing', 'approved', 'rejected')),
  user_id uuid,
  requested_role_key text,
  full_name text not null,
  email text not null,
  phone text,
  company_name text,
  city text,
  state text,
  motivation text,
  experience_summary text,
  training_acknowledged boolean not null default false,
  terms_accepted boolean not null default false,
  discovery_eligible boolean not null default false,
  desired_city_scope jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  internal_notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  rejection_reason text
);

create table if not exists public.evntszn_system_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  source text not null,
  severity text not null default 'error' check (severity in ('info', 'warning', 'error', 'critical')),
  code text,
  status text not null default 'open' check (status in ('open', 'monitoring', 'resolved')),
  message text not null,
  context jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists public.evntszn_sponsor_package_orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  package_id uuid references epl.sponsorship_packages(id) on delete set null,
  sponsor_partner_id uuid references epl.sponsor_partners(id) on delete set null,
  company_name text not null,
  contact_name text,
  contact_email text not null,
  contact_phone text,
  package_name text,
  source_surface text not null default 'web',
  order_type text not null default 'purchase' check (order_type in ('inquiry', 'purchase')),
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'canceled', 'inquiry')),
  amount_usd integer not null default 0,
  currency_code text not null default 'usd',
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  notes text,
  wants_followup boolean not null default true,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists evntszn_operator_profiles_role_idx
  on public.evntszn_operator_profiles(role_key);
create index if not exists evntszn_applications_type_status_idx
  on public.evntszn_applications(application_type, status);
create index if not exists evntszn_applications_email_idx
  on public.evntszn_applications(email);
create index if not exists evntszn_system_logs_source_status_idx
  on public.evntszn_system_logs(source, status, occurred_at desc);
create index if not exists evntszn_sponsor_package_orders_status_idx
  on public.evntszn_sponsor_package_orders(status, created_at desc);

drop trigger if exists evntszn_operator_profiles_set_updated_at on public.evntszn_operator_profiles;
create trigger evntszn_operator_profiles_set_updated_at
before update on public.evntszn_operator_profiles
for each row execute function public.set_updated_at();

drop trigger if exists evntszn_applications_set_updated_at on public.evntszn_applications;
create trigger evntszn_applications_set_updated_at
before update on public.evntszn_applications
for each row execute function public.set_updated_at();

drop trigger if exists evntszn_system_logs_set_updated_at on public.evntszn_system_logs;
create trigger evntszn_system_logs_set_updated_at
before update on public.evntszn_system_logs
for each row execute function public.set_updated_at();

drop trigger if exists evntszn_sponsor_package_orders_set_updated_at on public.evntszn_sponsor_package_orders;
create trigger evntszn_sponsor_package_orders_set_updated_at
before update on public.evntszn_sponsor_package_orders
for each row execute function public.set_updated_at();
