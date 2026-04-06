-- ORYX v10: Module catalog + plan-module mapping + entitlement sync helpers
-- NOTE: This migration is defensive and ensures the INTERNAL plan exists.

create extension if not exists pgcrypto;

-- Ensure INTERNAL plan exists (defensive)
insert into public.plan_catalog (
  plan_key,
  plan_name,
  monthly_price_cents,
  annual_price_cents,
  max_seats,
  max_video_participant_minutes
)
values (
  'internal',
  'Internal (MIXDEN)',
  0,
  0,
  1000000,
  1000000000
)
on conflict (plan_key) do nothing;

-- 1) Master module catalog
create table if not exists public.module_catalog (
  module_key text primary key,
  module_name text not null,
  description text,
  created_at timestamptz not null default now()
);

-- 2) Plan -> module mapping
create table if not exists public.plan_modules (
  plan_key text not null references public.plan_catalog(plan_key) on delete cascade,
  module_key text not null references public.module_catalog(module_key) on delete cascade,
  included boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (plan_key, module_key)
);

-- 3) Org entitlements (make sure the columns exist)
alter table public.org_entitlements
  add column if not exists module_key text,
  add column if not exists enabled boolean not null default true,
  add column if not exists source text not null default 'plan',
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

-- Add FK to module_catalog if not already present
do $$
begin
  begin
    alter table public.org_entitlements
      add constraint org_entitlements_module_key_fkey
      foreign key (module_key) references public.module_catalog(module_key) on delete cascade;
  exception when duplicate_object then
    null;
  end;
end $$;

-- Ensure uniqueness per org/module
do $$
begin
  begin
    alter table public.org_entitlements
      add constraint org_entitlements_org_module_unique unique (org_id, module_key);
  exception when duplicate_object then
    null;
  end;
end $$;

-- 4) Helper: does org have module enabled?
create or replace function public.has_module(target_org uuid, target_module text)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.org_entitlements e
    where e.org_id = target_org
      and e.module_key = target_module
      and e.enabled = true
  );
$$;

-- 5) Sync entitlements from org plan
create or replace function public.sync_org_entitlements_from_plan(target_org uuid)
returns void
language plpgsql
as $$
declare
  pkey text;
  internal_org boolean;
begin
  select op.plan_key into pkey
  from public.org_plan op
  where op.org_id = target_org;

  select coalesce(o.is_internal,false) into internal_org
  from public.organizations o
  where o.id = target_org;

  if pkey is null then
    return;
  end if;

  -- Internal org gets everything
  if internal_org then
    insert into public.org_entitlements (org_id, module_key, enabled, source, created_at, updated_at)
    select target_org, m.module_key, true, 'internal', now(), now()
    from public.module_catalog m
    on conflict (org_id, module_key) do update
      set enabled = true,
          source = 'internal',
          updated_at = now();
    return;
  end if;

  -- Non-internal orgs get their plan modules
  insert into public.org_entitlements (org_id, module_key, enabled, source, created_at, updated_at)
  select target_org, pm.module_key, true, 'plan', now(), now()
  from public.plan_modules pm
  where pm.plan_key = pkey
    and pm.included = true
  on conflict (org_id, module_key) do update
    set enabled = true,
        source = 'plan',
        updated_at = now();
end;
$$;

-- 6) Seed module catalog (core ORYX)
insert into public.module_catalog (module_key, module_name, description) values
('org_core', 'Org Core', 'Organizations, members, roles, permissions, onboarding'),
('messaging', 'Messaging', 'Conversations, messages, context-aware messaging'),
('events', 'Events', 'Event ops, staff, tickets, check-ins, readiness, reports'),
('venues', 'Venues', 'Venue management, calendars, ops'),
('music', 'Music Ops', 'Artists, releases, assets, timelines, live stats hooks'),
('finance', 'Finance', 'Royalties, commissions, payouts, financial signals'),
('compliance', 'Compliance', 'Compliance items, status, readiness view'),
('knowledge', 'Knowledge Base', 'Docs, SOPs, incident memory, narrative intelligence'),
('sales_ops', 'Sales Ops', 'CRM-lite pipelines, tasks, internal sales tools'),
('maps', 'Address/Maps', 'Google address autocomplete and standardization')
on conflict (module_key) do nothing;

-- 7) Seed internal plan modules = everything
insert into public.plan_modules (plan_key, module_key, included)
select 'internal', m.module_key, true
from public.module_catalog m
on conflict (plan_key, module_key) do nothing;
