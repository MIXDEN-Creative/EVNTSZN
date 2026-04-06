-- ORYX v15: Finance RLS fixes for commission_earnings + payouts
-- Fixes tables that do NOT have org_id by joining through parent tables.
-- commission_earnings: org_id exists -> direct policies
-- payout_batches: org_id exists -> direct policies
-- payout_items: NO org_id -> join through payout_batches via batch_id

begin;

-- =========================
-- COMMISSION EARNINGS (has org_id)
-- =========================
alter table if exists public.commission_earnings enable row level security;

drop policy if exists oryx_commission_earnings_select on public.commission_earnings;
drop policy if exists oryx_commission_earnings_manage on public.commission_earnings;

create policy oryx_commission_earnings_select
on public.commission_earnings
for select
using (
  public.is_org_member(org_id)
  and public.has_module(org_id, 'finance')
  and public.has_permission(org_id, 'finance.view')
);

create policy oryx_commission_earnings_manage
on public.commission_earnings
for all
using (
  public.is_org_member(org_id)
  and public.has_module(org_id, 'finance')
  and public.has_permission(org_id, 'finance.manage')
)
with check (
  public.is_org_member(org_id)
  and public.has_module(org_id, 'finance')
  and public.has_permission(org_id, 'finance.manage')
);

-- =========================
-- PAYOUT BATCHES (has org_id)
-- =========================
alter table if exists public.payout_batches enable row level security;

drop policy if exists oryx_payout_batches_select on public.payout_batches;
drop policy if exists oryx_payout_batches_manage on public.payout_batches;

create policy oryx_payout_batches_select
on public.payout_batches
for select
using (
  public.is_org_member(org_id)
  and public.has_module(org_id, 'finance')
  and public.has_permission(org_id, 'finance.view')
);

create policy oryx_payout_batches_manage
on public.payout_batches
for all
using (
  public.is_org_member(org_id)
  and public.has_module(org_id, 'finance')
  and public.has_permission(org_id, 'finance.manage')
)
with check (
  public.is_org_member(org_id)
  and public.has_module(org_id, 'finance')
  and public.has_permission(org_id, 'finance.manage')
);

-- =========================
-- PAYOUT ITEMS (NO org_id) -> join through payout_batches
-- =========================
alter table if exists public.payout_items enable row level security;

drop policy if exists oryx_payout_items_select on public.payout_items;
drop policy if exists oryx_payout_items_manage on public.payout_items;

create policy oryx_payout_items_select
on public.payout_items
for select
using (
  exists (
    select 1
    from public.payout_batches b
    where b.id = payout_items.batch_id
      and public.is_org_member(b.org_id)
      and public.has_module(b.org_id, 'finance')
      and public.has_permission(b.org_id, 'finance.view')
  )
);

create policy oryx_payout_items_manage
on public.payout_items
for all
using (
  exists (
    select 1
    from public.payout_batches b
    where b.id = payout_items.batch_id
      and public.is_org_member(b.org_id)
      and public.has_module(b.org_id, 'finance')
      and public.has_permission(b.org_id, 'finance.manage')
  )
)
with check (
  exists (
    select 1
    from public.payout_batches b
    where b.id = payout_items.batch_id
      and public.is_org_member(b.org_id)
      and public.has_module(b.org_id, 'finance')
      and public.has_permission(b.org_id, 'finance.manage')
  )
);

commit;
