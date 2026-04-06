-- ORYX seed: local/dev bootstrap
-- Creates MIXDEN Creative as internal org + internal plan
-- Adds the owner user by email if present, and assigns membership + owner role + allowlist

-- 1) Ensure internal plan exists
insert into public.plan_catalog (plan_key, plan_name, monthly_price_cents, annual_price_cents, max_seats, max_video_participant_minutes)
values ('internal', 'Internal (MIXDEN)', 0, 0, 1000000, 1000000000)
on conflict (plan_key) do nothing;

-- 2) Activate MIXDEN org plan
-- Seed org_plan for the internal MIXDEN org (no hardcoded UUID)
insert into public.org_plan (org_id, plan_key, status, current_seats, created_at, updated_at)
select
  o.id,
  'internal',           -- plan_key
  'active',             -- status
  1,                    -- current_seats
  now(), now()
from public.organizations o
where o.name = 'MIXDEN Creative'
  and o.is_internal = true
order by o.created_at asc
limit 1
on conflict (org_id) do update
set
  plan_key = excluded.plan_key,
  status = excluded.status,
  current_seats = excluded.current_seats,
  updated_at = now();

-- 3) If the owner user exists in auth.users, allowlist + membership + role assignment
-- NOTE: local dev requires you to create this user in Studio Auth first.
with owner_user as (
  select id
  from auth.users
  where email = 'hello@mixdencreative.com'
  limit 1
)
insert into public.internal_access_allowlist (user_id, note)
select id, 'TK owner internal access'
from owner_user
on conflict (user_id) do nothing;

with owner_user as (
  select id
  from auth.users
  where email = 'hello@mixdencreative.com'
  limit 1
)
insert into public.org_memberships (org_id, user_id, is_active, created_at)
select '4448f577-9d16-4891-9fbc-d8f72a60ecb0', id, true, now()
from owner_user
on conflict (org_id, user_id) do update
set is_active = true;

with owner_user as (
  select id
  from auth.users
  where email = 'hello@mixdencreative.com'
  limit 1
),
owner_role as (
  select id
  from public.org_roles
  where org_id = '4448f577-9d16-4891-9fbc-d8f72a60ecb0'
    and role_key = 'owner'
  limit 1
)
insert into public.org_role_assignments (org_id, user_id, role_id)
select '4448f577-9d16-4891-9fbc-d8f72a60ecb0', u.id, r.id
from owner_user u, owner_role r
on conflict do nothing;
