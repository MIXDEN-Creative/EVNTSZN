create extension if not exists pgcrypto;

alter table if exists epl.opportunities
  add column if not exists is_public boolean not null default true,
  add column if not exists location_city text,
  add column if not exists location_state text,
  add column if not exists priority_score integer not null default 100;

alter table if exists epl.staff_applications
  add column if not exists interview_stage text,
  add column if not exists assigned_city text,
  add column if not exists assigned_reviewer_user_id uuid,
  add column if not exists converted_user_id uuid,
  add column if not exists resume_url text,
  add column if not exists portfolio_url text,
  add column if not exists source_metadata jsonb not null default '{}'::jsonb,
  add column if not exists latest_interview_at timestamptz,
  add column if not exists hiring_decision text;

create table if not exists epl.staff_application_interviews (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  application_id uuid not null references epl.staff_applications(id) on delete cascade,
  interview_stage text not null check (interview_stage in ('zoom', 'phone')),
  status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'canceled')),
  interviewer_user_id uuid,
  interviewer_name text,
  scheduled_at timestamptz,
  completed_at timestamptz,
  recommendation text,
  summary text,
  notes text,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.evntszn_sponsor_placements (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sponsor_partner_id uuid,
  sponsor_package_order_id uuid references public.evntszn_sponsor_package_orders(id) on delete set null,
  name text not null,
  type text not null default 'sponsor' check (type in ('sponsor', 'partner')),
  logo_url text,
  website_url text,
  cta_label text,
  status text not null default 'draft' check (status in ('draft', 'ready', 'live', 'inactive')),
  visibility_locations jsonb not null default '[]'::jsonb,
  display_order integer not null default 100,
  is_featured boolean not null default false,
  starts_at timestamptz,
  ends_at timestamptz,
  notes text,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists epl_staff_application_interviews_application_idx
  on epl.staff_application_interviews(application_id, interview_stage, created_at desc);

create index if not exists evntszn_sponsor_placements_status_idx
  on public.evntszn_sponsor_placements(status, display_order);

drop trigger if exists epl_staff_application_interviews_set_updated_at on epl.staff_application_interviews;
create trigger epl_staff_application_interviews_set_updated_at
before update on epl.staff_application_interviews
for each row execute function public.set_updated_at_column();

drop trigger if exists evntszn_sponsor_placements_set_updated_at on public.evntszn_sponsor_placements;
create trigger evntszn_sponsor_placements_set_updated_at
before update on public.evntszn_sponsor_placements
for each row execute function public.set_updated_at();
