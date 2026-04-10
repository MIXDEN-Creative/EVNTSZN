alter table if exists public.roles
  add column if not exists primary_role text,
  add column if not exists role_subtype text,
  add column if not exists default_scope_type text,
  add column if not exists default_scope jsonb not null default '{}'::jsonb,
  add column if not exists capability_groups text[] not null default '{}'::text[],
  add column if not exists capability_overrides jsonb not null default '{}'::jsonb;

alter table if exists public.user_roles
  add column if not exists role_subtype text,
  add column if not exists scope_type text,
  add column if not exists scope_values jsonb not null default '{}'::jsonb,
  add column if not exists capability_groups text[] not null default '{}'::text[],
  add column if not exists capability_overrides jsonb not null default '{}'::jsonb;

alter table if exists public.invites
  add column if not exists role_subtype text,
  add column if not exists scope_type text,
  add column if not exists scope_values jsonb not null default '{}'::jsonb,
  add column if not exists capability_groups text[] not null default '{}'::text[],
  add column if not exists capability_overrides jsonb not null default '{}'::jsonb;

alter table public.roles add column if not exists is_active boolean not null default true;

create index if not exists roles_primary_role_idx on public.roles (primary_role, role_subtype, is_active);
alter table public.user_roles add column if not exists is_active boolean not null default true;

create index if not exists user_roles_scope_idx on public.user_roles (scope_type, is_active);
do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'invites'
  ) then
    create index if not exists invites_scope_idx on public.invites (scope_type, status);
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'roles'
      and column_name = 'code'
  ) then
    update public.roles
    set
      primary_role = case
        when code = 'hq_operator' then 'hq'
        when code = 'platform_admin' then 'admin'
        when code = 'office_operator' then 'office_manager'
        when code = 'ops_operator' then 'ops'
        else coalesce(primary_role, 'admin')
      end,
      role_subtype = case
        when code = 'hq_operator' then 'hq_staff'
        when code = 'platform_admin' then 'global_admin'
        when code = 'office_operator' then 'office_manager'
        when code = 'ops_operator' then 'ops_operator'
        else coalesce(role_subtype, 'global_admin')
      end,
      default_scope_type = case
        when code = 'hq_operator' then 'global'
        when code = 'platform_admin' then 'global'
        when code = 'office_operator' then 'city'
        when code = 'ops_operator' then 'city'
        else coalesce(default_scope_type, 'global')
      end,
      capability_groups = case
        when code = 'hq_operator' then array['users','roles_invites','approvals','discovery','events','ticketing','scanner','support','opportunities','hiring','sponsors','offices','epl','reports','store','settings']::text[]
        when code = 'platform_admin' then array['users','roles_invites','approvals','discovery','events','ticketing','scanner','support','opportunities','hiring','sponsors','offices','reports','store']::text[]
        when code = 'office_operator' then array['events','scanner','support','opportunities','offices']::text[]
        when code = 'ops_operator' then array['events','ticketing','scanner','support']::text[]
        else capability_groups
      end
    where primary_role is null
       or role_subtype is null
       or default_scope_type is null
       or capability_groups = '{}'::text[];
  end if;
end $$;
