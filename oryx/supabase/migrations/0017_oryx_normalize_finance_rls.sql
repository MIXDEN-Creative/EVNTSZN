-- ORYX v17: Normalize Finance / Royalties / Payouts RLS policies
-- Goal:
--  - Remove duplicates like royalty_statements_all
--  - Use consistent *_select (view permission) and *_manage (manage permission)
--  - For tables without org_id, infer org via joins

-- =========================
-- ROYALTY_STATEMENTS (has org_id)
-- =========================
alter table if exists public.royalty_statements enable row level security;

drop policy if exists oryx_royalty_statements_all on public.royalty_statements;
drop policy if exists oryx_royalty_statements_select on public.royalty_statements;
drop policy if exists oryx_royalty_statements_manage on public.royalty_statements;

create policy oryx_royalty_statements_select on public.royalty_statements
for select
using (
  public.is_org_member(org_id)
  and public.has_module(org_id,'finance')
  and public.has_permission(org_id,'finance.view')
);

create policy oryx_royalty_statements_manage on public.royalty_statements
for all
using (
  public.is_org_member(org_id)
  and public.has_module(org_id,'finance')
  and public.has_permission(org_id,'finance.manage')
)
with check (
  public.is_org_member(org_id)
  and public.has_module(org_id,'finance')
  and public.has_permission(org_id,'finance.manage')
);

-- =========================
-- ROYALTY_STATEMENT_LINES (NO org_id -> join through royalty_statements)
-- =========================
alter table if exists public.royalty_statement_lines enable row level security;

drop policy if exists oryx_royalty_statement_lines_all on public.royalty_statement_lines;
drop policy if exists oryx_royalty_statement_lines_select on public.royalty_statement_lines;
drop policy if exists oryx_royalty_statement_lines_manage on public.royalty_statement_lines;

create policy oryx_royalty_statement_lines_select on public.royalty_statement_lines
for select
using (
  exists (
    select 1
    from public.royalty_statements s
    where s.id = royalty_statement_lines.statement_id
      and public.is_org_member(s.org_id)
      and public.has_module(s.org_id,'finance')
      and public.has_permission(s.org_id,'finance.view')
  )
);

create policy oryx_royalty_statement_lines_manage on public.royalty_statement_lines
for all
using (
  exists (
    select 1
    from public.royalty_statements s
    where s.id = royalty_statement_lines.statement_id
      and public.is_org_member(s.org_id)
      and public.has_module(s.org_id,'finance')
      and public.has_permission(s.org_id,'finance.manage')
  )
)
with check (
  exists (
    select 1
    from public.royalty_statements s
    where s.id = royalty_statement_lines.statement_id
      and public.is_org_member(s.org_id)
      and public.has_module(s.org_id,'finance')
      and public.has_permission(s.org_id,'finance.manage')
  )
);

-- =========================
-- COMMISSION_PLANS (has org_id)
-- =========================
alter table if exists public.commission_plans enable row level security;

drop policy if exists oryx_commission_plans_all on public.commission_plans;
drop policy if exists oryx_commission_plans_select on public.commission_plans;
drop policy if exists oryx_commission_plans_manage on public.commission_plans;

create policy oryx_commission_plans_select on public.commission_plans
for select
using (
  public.is_org_member(org_id)
  and public.has_module(org_id,'finance')
  and public.has_permission(org_id,'finance.view')
);

create policy oryx_commission_plans_manage on public.commission_plans
for all
using (
  public.is_org_member(org_id)
  and public.has_module(org_id,'finance')
  and public.has_permission(org_id,'finance.manage')
)
with check (
  public.is_org_member(org_id)
  and public.has_module(org_id,'finance')
  and public.has_permission(org_id,'finance.manage')
);

-- =========================
-- COMMISSION_RATES (NO org_id -> join through commission_plans via plan_id)
-- =========================
alter table if exists public.commission_rates enable row level security;

drop policy if exists oryx_commission_rates_all on public.commission_rates;
drop policy if exists oryx_commission_rates_select on public.commission_rates;
drop policy if exists oryx_commission_rates_manage on public.commission_rates;

create policy oryx_commission_rates_select on public.commission_rates
for select
using (
  exists (
    select 1
    from public.commission_plans cp
    where cp.id = commission_rates.plan_id
      and public.is_org_member(cp.org_id)
      and public.has_module(cp.org_id,'finance')
      and public.has_permission(cp.org_id,'finance.view')
  )
);

create policy oryx_commission_rates_manage on public.commission_rates
for all
using (
  exists (
    select 1
    from public.commission_plans cp
    where cp.id = commission_rates.plan_id
      and public.is_org_member(cp.org_id)
      and public.has_module(cp.org_id,'finance')
      and public.has_permission(cp.org_id,'finance.manage')
  )
)
with check (
  exists (
    select 1
    from public.commission_plans cp
    where cp.id = commission_rates.plan_id
      and public.is_org_member(cp.org_id)
      and public.has_module(cp.org_id,'finance')
      and public.has_permission(cp.org_id,'finance.manage')
  )
);

-- =========================
-- COMMISSION_EARNINGS (has org_id) - normalize naming only
-- =========================
alter table if exists public.commission_earnings enable row level security;

drop policy if exists oryx_commission_earnings_all on public.commission_earnings;
drop policy if exists oryx_commission_earnings_select on public.commission_earnings;
drop policy if exists oryx_commission_earnings_manage on public.commission_earnings;

create policy oryx_commission_earnings_select on public.commission_earnings
for select
using (
  public.is_org_member(org_id)
  and public.has_module(org_id,'finance')
  and public.has_permission(org_id,'finance.view')
);

create policy oryx_commission_earnings_manage on public.commission_earnings
for all
using (
  public.is_org_member(org_id)
  and public.has_module(org_id,'finance')
  and public.has_permission(org_id,'finance.manage')
)
with check (
  public.is_org_member(org_id)
  and public.has_module(org_id,'finance')
  and public.has_permission(org_id,'finance.manage')
);

-- =========================
-- PAYOUT_BATCHES (has org_id)
-- =========================
alter table if exists public.payout_batches enable row level security;

drop policy if exists oryx_payout_batches_all on public.payout_batches;
drop policy if exists oryx_payout_batches_select on public.payout_batches;
drop policy if exists oryx_payout_batches_manage on public.payout_batches;

create policy oryx_payout_batches_select on public.payout_batches
for select
using (
  public.is_org_member(org_id)
  and public.has_module(org_id,'finance')
  and public.has_permission(org_id,'finance.view')
);

create policy oryx_payout_batches_manage on public.payout_batches
for all
using (
  public.is_org_member(org_id)
  and public.has_module(org_id,'finance')
  and public.has_permission(org_id,'finance.manage')
)
with check (
  public.is_org_member(org_id)
  and public.has_module(org_id,'finance')
  and public.has_permission(org_id,'finance.manage')
);

-- =========================
-- PAYOUT_ITEMS (NO org_id -> join through payout_batches via batch_id)
-- =========================
alter table if exists public.payout_items enable row level security;

drop policy if exists oryx_payout_items_all on public.payout_items;
drop policy if exists oryx_payout_items_select on public.payout_items;
drop policy if exists oryx_payout_items_manage on public.payout_items;

create policy oryx_payout_items_select on public.payout_items
for select
using (
  exists (
    select 1
    from public.payout_batches b
    where b.id = payout_items.batch_id
      and public.is_org_member(b.org_id)
      and public.has_module(b.org_id,'finance')
      and public.has_permission(b.org_id,'finance.view')
  )
);

create policy oryx_payout_items_manage on public.payout_items
for all
using (
  exists (
    select 1
    from public.payout_batches b
    where b.id = payout_items.batch_id
      and public.is_org_member(b.org_id)
      and public.has_module(b.org_id,'finance')
      and public.has_permission(b.org_id,'finance.manage')
  )
)
with check (
  exists (
    select 1
    from public.payout_batches b
    where b.id = payout_items.batch_id
      and public.is_org_member(b.org_id)
      and public.has_module(b.org_id,'finance')
      and public.has_permission(b.org_id,'finance.manage')
  )
);

