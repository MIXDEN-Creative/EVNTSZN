-- ORYX v7: Add org_plan.status and fix platform pool allocation function

-- 1) Add status column to org_plan (needed for gating + pool eligibility)
alter table public.org_plan
  add column if not exists status text not null default 'inactive';

-- Helpful index for queries
create index if not exists idx_org_plan_status on public.org_plan(status);

-- 2) Replace allocate_pool_equally to use org_plan.status
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
  from public.org_plan op
  where op.status in ('active','trialing');

  if org_count <= 0 then
    update public.platform_usage_pool_monthly
      set allocated_minutes = 0,
          updated_at = now()
    where month_start = target_month_start;
    return;
  end if;

  per_org := floor(pool_total::numeric / org_count)::int;

  insert into public.org_free_minutes_allocations (org_id, month_start, allocated_minutes, consumed_minutes)
  select op.org_id, target_month_start, per_org, 0
  from public.org_plan op
  where op.status in ('active','trialing')
  on conflict (org_id, month_start) do update
    set allocated_minutes = excluded.allocated_minutes,
        updated_at = now();

  update public.platform_usage_pool_monthly
    set allocated_minutes = per_org * org_count,
        updated_at = now()
  where month_start = target_month_start;
end;
$$;
