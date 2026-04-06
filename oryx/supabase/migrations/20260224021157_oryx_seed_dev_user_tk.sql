-- Seed a dev user (TK) and grant owner access to internal MIXDEN org.

do $$
declare
  mixden_org_id uuid;
  owner_role_id uuid;
  tk_user_id uuid := '960eb7e0-8e4b-4389-992c-36674b359a21';
begin
  -- Find internal org
    select id into mixden_org_id
  from public.organizations
  where name='MIXDEN Creative' and is_internal=true
  order by created_at desc
  limit 1;

  if mixden_org_id is null then
    insert into public.organizations (name, is_internal)
    values ('MIXDEN Creative', true)
    returning id into mixden_org_id;
  end if;

  -- Ensure TK exists in auth.users
  insert into auth.users (
    id, email, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, aud, role
  ) values (
    tk_user_id,
    'tk@oryx.local',
    '{}'::jsonb,
    '{"display_name":"TK"}'::jsonb,
    now(), now(),
    'authenticated',
    'authenticated'
  )
  on conflict (id) do update
  set email=excluded.email, raw_user_meta_data=excluded.raw_user_meta_data, updated_at=now();

  -- Profile
  insert into public.profiles (user_id, display_name)
  values (tk_user_id, 'TK')
  on conflict (user_id) do update
  set display_name=excluded.display_name;

  -- Membership
  insert into public.org_memberships (org_id, user_id, is_active, created_at)
  values (mixden_org_id, tk_user_id, true, now())
  on conflict (org_id, user_id) do update set is_active=true;

  -- Owner role
  insert into public.org_roles (org_id, role_key, role_name)
  values (mixden_org_id, 'owner', 'Owner')
  on conflict (org_id, role_key) do update set role_name=excluded.role_name;

  select id into owner_role_id
  from public.org_roles
  where org_id=mixden_org_id and role_key='owner';

  -- Assign owner role to TK
  insert into public.org_role_assignments (org_id, user_id, role_id)
  values (mixden_org_id, tk_user_id, owner_role_id)
  on conflict do nothing;

  -- Ensure the 12 permissions exist (same set you used)
  insert into public.org_permissions (org_id, perm_key, perm_name)
  values
    (mixden_org_id,'org.manage','Manage organization'),
    (mixden_org_id,'roles.manage','Manage roles and permissions'),

    (mixden_org_id,'messaging.view','View conversations and messages'),
    (mixden_org_id,'messaging.manage','Create/update/delete conversations and messages'),

    (mixden_org_id,'events.view','View events, staff, tickets, checkins, reports'),
    (mixden_org_id,'events.manage','Create/update/delete events and event ops data'),

    (mixden_org_id,'venues.view','View venues'),
    (mixden_org_id,'venues.manage','Create/update/delete venues'),

    (mixden_org_id,'music.view','View artists, timelines, assets'),
    (mixden_org_id,'music.manage','Create/update/delete music ops data'),

    (mixden_org_id,'finance.view','View finance data'),
    (mixden_org_id,'finance.manage','Create/update/delete finance data')
  on conflict (org_id, perm_key) do update
  set perm_name=excluded.perm_name;

  -- Attach all perms to owner
  insert into public.org_role_permissions (role_id, perm_id)
  select owner_role_id, p.id
  from public.org_permissions p
  where p.org_id=mixden_org_id
  on conflict (role_id, perm_id) do nothing;
end $$;
