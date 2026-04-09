create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  legacy_admin_role_id uuid unique,
  code text unique,
  name text not null,
  description text,
  is_system boolean not null default false,
  is_active boolean not null default true,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.permissions (
  id uuid primary key default gen_random_uuid(),
  legacy_admin_permission_id uuid unique,
  code text not null unique,
  label text not null,
  description text,
  category text not null default 'admin',
  is_system boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.role_permissions (
  id uuid primary key default gen_random_uuid(),
  role_id uuid not null references public.roles (id) on delete cascade,
  permission_id uuid not null references public.permissions (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (role_id, permission_id)
);

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  role_id uuid not null references public.roles (id) on delete cascade,
  is_active boolean not null default true,
  assigned_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, role_id)
);

create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  role_id uuid not null references public.roles (id) on delete cascade,
  token_hash text not null unique,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked', 'expired')),
  created_by uuid references auth.users (id) on delete set null,
  accepted_by uuid references auth.users (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  email_sent_at timestamptz,
  last_sent_at timestamptz,
  accepted_at timestamptz,
  expires_at timestamptz not null default now() + interval '7 days',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists roles_active_idx on public.roles (is_active, name);
create index if not exists permissions_category_idx on public.permissions (category, code);
create index if not exists user_roles_user_idx on public.user_roles (user_id, is_active);
create index if not exists invites_email_status_idx on public.invites (email, status);

create trigger roles_set_updated_at
before update on public.roles
for each row execute function public.update_updated_at_column();

create trigger user_roles_set_updated_at
before update on public.user_roles
for each row execute function public.update_updated_at_column();

create trigger invites_set_updated_at
before update on public.invites
for each row execute function public.update_updated_at_column();

insert into public.permissions (code, label, description, category, is_system)
values
  ('admin.manage', 'Admin Manage', 'Full team and access administration.', 'access', true),
  ('roles.manage', 'Roles Manage', 'Create and edit roles and role permissions.', 'access', true),
  ('invites.manage', 'Invites Manage', 'Create, resend, revoke, and review invites.', 'access', true),
  ('orders.view', 'Orders View', 'View order operations.', 'commerce', true),
  ('orders.manage', 'Orders Manage', 'Manage order operations.', 'commerce', true),
  ('rewards.view', 'Rewards View', 'View rewards and loyalty data.', 'rewards', true),
  ('rewards.manage', 'Rewards Manage', 'Manage rewards and loyalty settings.', 'rewards', true),
  ('catalog.manage', 'Catalog Manage', 'Manage discovery, sponsors, store, and public catalog.', 'catalog', true),
  ('customers.view', 'Customers View', 'View customer records.', 'customers', true),
  ('analytics.view', 'Analytics View', 'View analytics and reporting.', 'analytics', true),
  ('approvals.manage', 'Approvals Manage', 'Review and approve applications and onboarding.', 'operations', true),
  ('sponsors.manage', 'Sponsors Manage', 'Manage sponsor accounts, placements, and packages.', 'revenue', true),
  ('store.manage', 'Store Manage', 'Manage storefront and merch operations.', 'commerce', true),
  ('content.manage', 'Content Manage', 'Manage homepage, discovery, and public content modules.', 'content', true),
  ('scanner.manage', 'Scanner Manage', 'Manage scanner access and event scan tooling.', 'operations', true),
  ('events.manage', 'Events Manage', 'Create and manage native event inventory.', 'events', true),
  ('opportunities.manage', 'Opportunities Manage', 'Manage opportunities and hiring access mappings.', 'staffing', true),
  ('city.manage', 'City Manage', 'Manage city-office operations and scoped business controls.', 'operations', true)
on conflict (code) do update
set label = excluded.label,
    description = excluded.description,
    category = excluded.category;

insert into public.roles (code, name, description, is_system, is_active)
values
  ('platform_admin', 'Platform Admin', 'Full operational admin access across EVNTSZN and EPL.', true, true),
  ('catalog_operator', 'Catalog Operator', 'Discovery, sponsor, store, and public catalog management.', true, true),
  ('operations_manager', 'Operations Manager', 'Approvals, scanner, event operations, and city execution.', true, true)
on conflict (code) do update
set name = excluded.name,
    description = excluded.description,
    is_active = true;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code in (
  'admin.manage', 'roles.manage', 'invites.manage', 'orders.view', 'orders.manage', 'rewards.view', 'rewards.manage',
  'catalog.manage', 'customers.view', 'analytics.view', 'approvals.manage', 'sponsors.manage', 'store.manage',
  'content.manage', 'scanner.manage', 'events.manage', 'opportunities.manage', 'city.manage'
)
where r.code = 'platform_admin'
on conflict (role_id, permission_id) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code in ('catalog.manage', 'sponsors.manage', 'store.manage', 'content.manage', 'analytics.view', 'opportunities.manage')
where r.code = 'catalog_operator'
on conflict (role_id, permission_id) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code in ('approvals.manage', 'scanner.manage', 'events.manage', 'city.manage', 'analytics.view', 'opportunities.manage')
where r.code = 'operations_manager'
on conflict (role_id, permission_id) do nothing;

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public' and table_name = 'admin_roles'
  ) then
    insert into public.roles (legacy_admin_role_id, code, name, description, is_system, is_active)
    select
      ar.id,
      regexp_replace(lower(coalesce(ar.name, 'role')), '[^a-z0-9]+', '_', 'g'),
      ar.name,
      ar.description,
      false,
      true
    from public.admin_roles ar
    on conflict (legacy_admin_role_id) do update
    set name = excluded.name,
        description = excluded.description,
        is_active = true;
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public' and table_name = 'admin_permissions'
  ) then
    insert into public.permissions (legacy_admin_permission_id, code, label, description, category, is_system)
    select
      ap.id,
      ap.code,
      ap.label,
      ap.description,
      'legacy',
      true
    from public.admin_permissions ap
    on conflict (legacy_admin_permission_id) do update
    set code = excluded.code,
        label = excluded.label,
        description = excluded.description;
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public' and table_name = 'admin_role_permissions'
  ) then
    insert into public.role_permissions (role_id, permission_id)
    select r.id, p.id
    from public.admin_role_permissions arp
    join public.roles r on r.legacy_admin_role_id = arp.role_id
    join public.permissions p on p.legacy_admin_permission_id = arp.permission_id
    on conflict (role_id, permission_id) do nothing;
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public' and table_name = 'admin_memberships'
  ) then
    insert into public.user_roles (user_id, role_id, is_active, assigned_by)
    select
      am.user_id,
      r.id,
      coalesce(am.is_active, true),
      null
    from public.admin_memberships am
    join public.roles r on r.legacy_admin_role_id = am.role_id
    on conflict (user_id, role_id) do update
    set is_active = excluded.is_active;
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public' and table_name = 'admin_invites'
  ) then
    insert into public.invites (
      id,
      email,
      role_id,
      token_hash,
      status,
      created_by,
      metadata,
      email_sent_at,
      last_sent_at,
      accepted_at,
      expires_at,
      created_at,
      updated_at
    )
    select
      ai.id,
      lower(ai.email),
      r.id,
      encode(digest(ai.invite_token, 'sha256'), 'hex'),
      case
        when ai.status in ('pending', 'accepted', 'revoked', 'expired') then ai.status
        else 'pending'
      end,
      null,
      jsonb_build_object('full_name', ai.full_name),
      ai.created_at,
      ai.created_at,
      ai.accepted_at,
      coalesce(ai.expires_at, ai.created_at + interval '7 days'),
      ai.created_at,
      now()
    from public.admin_invites ai
    join public.roles r on r.legacy_admin_role_id = ai.role_id
    on conflict (id) do nothing;
  end if;
end $$;

alter table if exists epl.opportunities
  add column if not exists access_role_id uuid references public.roles (id) on delete set null;

alter table if exists epl.opportunities
  add column if not exists assignment_permission_codes text[] not null default '{}'::text[];

alter table if exists epl.opportunities
  add column if not exists assignment_logic jsonb not null default '{}'::jsonb;
