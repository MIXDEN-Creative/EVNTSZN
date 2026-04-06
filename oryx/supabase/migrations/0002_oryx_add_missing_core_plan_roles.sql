-- ORYX v2: Add missing tables for core, plans/Stripe gating, and roles system
-- SAFE: Only creates missing tables and helper function. No drops.

create extension if not exists pgcrypto;

-- =========================
-- Core missing tables
-- =========================

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  legal_name text,
  industry_tags text[] not null default '{}',
  regions text[] not null default '{}',
  website text,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- =========================
-- Plans + Stripe gating
-- =========================

create table if not exists public.plan_catalog (
  plan_key text primary key,
  plan_name text not null,
  monthly_price_cents integer not null default 0,
  annual_price_cents integer not null default 0,
  max_seats integer not null default 0,
  max_video_participant_minutes integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.org_plan (
  org_id uuid primary key references public.organizations(id) on delete cascade,
  plan_key text not null references public.plan_catalog(plan_key),
  is_active boolean not null default true,
  current_seats integer not null default 1,
  video_minutes_used integer not null default 0,
  period_start timestamptz,
  period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.stripe_customers (
  org_id uuid primary key references public.organizations(id) on delete cascade,
  stripe_customer_id text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.stripe_subscriptions (
  org_id uuid primary key references public.organizations(id) on delete cascade,
  stripe_subscription_id text not null unique,
  stripe_price_id text,
  status text not null,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================
-- Roles system missing tables
-- =========================

create table if not exists public.org_roles (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  role_key text not null,
  role_name text not null,
  created_at timestamptz not null default now(),
  unique (org_id, role_key)
);

create table if not exists public.org_role_permissions (
  role_id uuid not null references public.org_roles(id) on delete cascade,
  perm_id uuid not null references public.org_permissions(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (role_id, perm_id)
);

create table if not exists public.org_role_assignments (
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role_id uuid not null references public.org_roles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (org_id, user_id, role_id)
);

-- =========================
-- Membership helper for RLS
-- =========================

create or replace function public.is_org_member(target_org uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.org_memberships m
    where m.org_id = target_org
      and m.user_id = auth.uid()
      and m.is_active = true
  );
$$;
