-- ORYX 0015: Fix RLS for commission_rates (no org_id on table, join through commission_plans)

begin;

-- Make sure RLS is on
alter table if exists public.commission_rates enable row level security;

-- Remove any broken/old policies (safe if they don't exist)
drop policy if exists oryx_commission_rates_all on public.commission_rates;
drop policy if exists oryx_commission_rates_select on public.commission_rates;
drop policy if exists oryx_commission_rates_manage on public.commission_rates;

-- READ policy
create policy oryx_commission_rates_select
on public.commission_rates
for select
using (
  exists (
    select 1
    from public.commission_plans cp
    where cp.id = commission_rates.plan_id
      and public.is_org_member(cp.org_id)
      and public.has_module(cp.org_id, 'finance')
      and public.has_permission(cp.org_id, 'finance.view')
  )
);

-- WRITE policy (insert/update/delete)
create policy oryx_commission_rates_manage
on public.commission_rates
for all
using (
  exists (
    select 1
    from public.commission_plans cp
    where cp.id = commission_rates.plan_id
      and public.is_org_member(cp.org_id)
      and public.has_module(cp.org_id, 'finance')
      and public.has_permission(cp.org_id, 'finance.manage')
  )
)
with check (
  exists (
    select 1
    from public.commission_plans cp
    where cp.id = commission_rates.plan_id
      and public.is_org_member(cp.org_id)
      and public.has_module(cp.org_id, 'finance')
      and public.has_permission(cp.org_id, 'finance.manage')
  )
);

commit;
