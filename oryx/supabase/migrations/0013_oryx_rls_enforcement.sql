-- ORYX 0013 RLS TEMP SAFE VERSION
-- Minimal, guaranteed no org_id crashes

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

create or replace function public.has_permission(target_org uuid, target_perm_key text)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.org_role_assignments a
    join public.org_role_permissions rp on rp.role_id = a.role_id
    join public.org_permissions p on p.id = rp.perm_id
    where a.org_id = target_org
      and a.user_id = auth.uid()
      and p.org_id = target_org
      and p.perm_key = target_perm_key
  );
$$;

-- PROFILES
alter table if exists public.profiles enable row level security;
drop policy if exists oryx_profiles_self on public.profiles;
create policy oryx_profiles_self on public.profiles
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- EVENTS
alter table if exists public.events enable row level security;
drop policy if exists oryx_events_all on public.events;
create policy oryx_events_all on public.events
for all
using (public.is_org_member(org_id))
with check (public.is_org_member(org_id));

-- EVENT STAFF (no org_id, join through events)
alter table if exists public.event_staff enable row level security;
drop policy if exists oryx_event_staff_all on public.event_staff;
create policy oryx_event_staff_all on public.event_staff
for all
using (
  exists (
    select 1 from public.events e
    where e.id = event_id
      and public.is_org_member(e.org_id)
  )
)
with check (
  exists (
    select 1 from public.events e
    where e.id = event_id
      and public.is_org_member(e.org_id)
  )
);

-- ROYALTY STATEMENTS
alter table if exists public.royalty_statements enable row level security;
drop policy if exists oryx_royalty_statements_all on public.royalty_statements;
create policy oryx_royalty_statements_all on public.royalty_statements
for all
using (public.is_org_member(org_id))
with check (public.is_org_member(org_id));

-- ROYALTY LINES (join through royalty_statements)
alter table if exists public.royalty_statement_lines enable row level security;
drop policy if exists oryx_royalty_statement_lines_all on public.royalty_statement_lines;
create policy oryx_royalty_statement_lines_all on public.royalty_statement_lines
for all
using (
  exists (
    select 1 from public.royalty_statements s
    where s.id = statement_id
      and public.is_org_member(s.org_id)
  )
)
with check (
  exists (
    select 1 from public.royalty_statements s
    where s.id = statement_id
      and public.is_org_member(s.org_id)
  )
);
