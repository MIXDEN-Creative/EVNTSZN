-- ORYX v6: Platform-level free minutes pool (shared across all orgs)
-- Goal: 10,000 free participant-minutes total per month across ORYX,
-- then bill orgs for overages.

create extension if not exists pgcrypto;

-- 1) Platform pool configuration + monthly pool ledger
create table if not exists public.platform_usage_pool (
  id boolean primary key default true, -- singleton row
  pool_minutes_per_month integer not null default 10000,
  overage_rate numeric(12,6) not null default 0.001500,
  currency text not null default 'USD',
  created_at timestamptz not null default now()
);

insert into public.platform_usage_pool (id)
values (true)
on conflict (id) do nothing;

create table if not exists public.platform_usage_pool_monthly (
  month_start date primary key,
  pool_minutes integer not null,
  allocated_minutes integer not null default 0,
  consumed_free_minutes numeric(18,4) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2) Per-org allocation for a month
create table if not exists public.org_free_minutes_allocations (
  org_id uuid not null references public.organizations(id) on delete cascade,
  month_start date not null,

  allocated_minutes integer not null default 0,
  consumed_minutes numeric(18,4) not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  primary key (org_id, month_start)
);

create index if not exists idx_org_alloc_month on public.org_free_minutes_allocations(month_start);

-- 3) Ensure a pool row exists for the month
create or replace function public.ensure_pool_month(target_month_start date)
returns void
language plpgsql
as $$
declare
  pool_total int;
begin
  select pool_minutes_per_month into pool_total
  from public.platform_usage_pool
  where id = true;

  insert into public.platform_usage_pool_monthly (month_start, pool_minutes, allocated_minutes, consumed_free_minutes)
  values (target_month_start, pool_total, 0, 0)
  on conflict (month_start) do nothing;
end;
$$;

-- 4) Allocate pool equally across ACTIVE orgs for a month
-- "Active" is defined as org_plan exists and is active OR stripe_subscriptions status active/trialing.
-- If you want a different definition later, we change only this function.
create or replace function public.allocate_pool_equally(target_month_start date)
returns void
language plpgsql
as $$
declare
  pool_total int;
  org_count int;
  per_org int;
begin
  perform public.ensure_pool_month(target_month_start);

  select pool_minutes into pool_total
  from public.platform_usage_pool_monthly
  where month_start = target_month_start;

  -- Count active orgs
  select count(*) into org_count
  from public.organizations o
  join public.org_plan op on op.org_id = o.id
  where coalesce(op.status,'') in ('active','trialing');

  if org_count <= 0 then
    -- Nothing to allocate
    update public.platform_usage_pool_monthly
      set allocated_minutes = 0,
          updated_at = now()
    where month_start = target_month_start;
    return;
  end if;

  per_org := floor(pool_total::numeric / org_count)::int;

  -- Upsert allocations
  insert into public.org_free_minutes_allocations (org_id, month_start, allocated_minutes, consumed_minutes)
  select op.org_id, target_month_start, per_org, 0
  from public.org_plan op
  where coalesce(op.status,'') in ('active','trialing')
  on conflict (org_id, month_start) do update
    set allocated_minutes = excluded.allocated_minutes,
        updated_at = now();

  update public.platform_usage_pool_monthly
    set allocated_minutes = per_org * org_count,
        updated_at = now()
  where month_start = target_month_start;
end;
$$;

-- 5) Apply usage: consume free allocation first, remainder becomes billable
-- This should be called after inserting video_usage_events, typically per event/session or nightly.
create or replace function public.apply_free_minutes_and_compute_billable(target_org uuid, target_month_start date)
returns void
language plpgsql
as $$
declare
  month_end date := (target_month_start + interval '1 month')::date;
  total_minutes numeric(18,4);
  free_alloc int;
  free_used numeric(18,4);
  billable_minutes numeric(18,4);
  rate numeric(12,6);
  currency_code text;
  billable_amount numeric(18,2);
begin
  -- Ensure allocations exist (idempotent)
  perform public.ensure_pool_month(target_month_start);

  select overage_rate, currency into rate, currency_code
  from public.platform_usage_pool
  where id = true;

  -- Get total org usage for month
  select coalesce(sum(e.participant_minutes),0)
    into total_minutes
  from public.video_usage_events e
  where e.org_id = target_org
    and e.created_at >= target_month_start::timestamptz
    and e.created_at < month_end::timestamptz;

  -- Allocation for org (if missing, treat as 0)
  select coalesce(a.allocated_minutes,0), coalesce(a.consumed_minutes,0)
    into free_alloc, free_used
  from public.org_free_minutes_allocations a
  where a.org_id = target_org
    and a.month_start = target_month_start;

  -- free consumed is min(total, allocation)
  free_used := least(total_minutes, free_alloc::numeric);

  billable_minutes := greatest(total_minutes - free_used, 0);
  billable_amount := round((billable_minutes * rate)::numeric, 2);

  -- Update allocation consumption
  insert into public.org_free_minutes_allocations (org_id, month_start, allocated_minutes, consumed_minutes)
  values (target_org, target_month_start, free_alloc, free_used)
  on conflict (org_id, month_start) do update
    set consumed_minutes = excluded.consumed_minutes,
        updated_at = now();

  -- Update monthly org usage rollup (reuse your org_usage_monthly table)
  insert into public.org_usage_monthly (org_id, month_start, participant_minutes, included_minutes, overage_minutes, overage_amount, currency, last_calculated_at)
  values (target_org, target_month_start, total_minutes, free_alloc, billable_minutes, billable_amount, currency_code, now())
  on conflict (org_id, month_start) do update
    set participant_minutes = excluded.participant_minutes,
        included_minutes = excluded.included_minutes,
        overage_minutes = excluded.overage_minutes,
        overage_amount = excluded.overage_amount,
        currency = excluded.currency,
        last_calculated_at = now();

  -- Update platform pool consumption aggregate
  update public.platform_usage_pool_monthly
    set consumed_free_minutes = (
      select coalesce(sum(consumed_minutes),0)
      from public.org_free_minutes_allocations
      where month_start = target_month_start
    ),
    updated_at = now()
  where month_start = target_month_start;
end;
$$;
