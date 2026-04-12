alter table public.evntszn_link_pages
  drop constraint if exists evntszn_link_pages_plan_tier_check;

update public.evntszn_link_pages
set plan_tier = case
  when lower(coalesce(plan_tier, '')) = 'premium' then 'elite'
  when lower(coalesce(plan_tier, '')) in ('starter', 'pro', 'elite', 'free') then lower(plan_tier)
  else 'free'
end;

alter table public.evntszn_link_pages
  alter column plan_tier set default 'free';

alter table public.evntszn_link_pages
  add constraint evntszn_link_pages_plan_tier_check
  check (plan_tier in ('free', 'starter', 'pro', 'elite'));
