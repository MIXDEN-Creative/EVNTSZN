create extension if not exists pgcrypto;

create table if not exists public.app_users (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  email text not null unique,
  full_name text,
  account_type text not null default 'customer',
  is_active boolean not null default true
);

create table if not exists public.customer_profiles (
  user_id uuid primary key references public.app_users(id) on delete cascade,
  marketing_opt_in boolean not null default false
);

create table if not exists public.admin_roles (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null unique,
  description text
);

create table if not exists public.admin_permissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  code text not null unique,
  label text not null,
  description text
);

create table if not exists public.admin_role_permissions (
  id uuid primary key default gen_random_uuid(),
  role_id uuid not null references public.admin_roles(id) on delete cascade,
  permission_id uuid not null references public.admin_permissions(id) on delete cascade,
  unique(role_id, permission_id)
);

create table if not exists public.admin_memberships (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  role_id uuid not null references public.admin_roles(id) on delete restrict,
  is_owner boolean not null default false,
  is_active boolean not null default true,
  unique(user_id, role_id)
);

create table if not exists public.admin_invites (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  email text not null,
  full_name text,
  role_id uuid not null references public.admin_roles(id) on delete restrict,
  invite_token text not null unique,
  invited_by uuid references public.app_users(id) on delete set null,
  status text not null default 'pending',
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz
);

create index if not exists admin_invites_email_idx
  on public.admin_invites(email);

create table if not exists public.customer_reward_wallets (
  user_id uuid primary key references public.app_users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  available_points integer not null default 0,
  lifetime_points integer not null default 0,
  points_redeemed integer not null default 0,
  tier text not null default 'Member'
);

create table if not exists public.customer_reward_ledger (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  merch_order_id uuid references public.merch_orders(id) on delete set null,
  event_type text not null,
  points integer not null,
  description text
);

create index if not exists customer_reward_ledger_user_idx
  on public.customer_reward_ledger(user_id, created_at desc);

alter table public.merch_orders
  add column if not exists user_id uuid references public.app_users(id) on delete set null,
  add column if not exists reward_wallet_applied boolean not null default false;

insert into public.admin_roles (name, description)
values
  ('Owner', 'Full system access'),
  ('Operations Admin', 'Manage operations and orders'),
  ('Merch Admin', 'Manage merchandise, orders, and rewards'),
  ('Support Admin', 'View customers and help with orders')
on conflict (name) do nothing;

insert into public.admin_permissions (code, label, description)
values
  ('admin.manage', 'Manage Admins', 'Create invites, roles, and admin memberships'),
  ('orders.view', 'View Orders', 'View merchandise orders'),
  ('orders.manage', 'Manage Orders', 'Refund, cancel, resend orders'),
  ('rewards.view', 'View Rewards', 'View customer rewards accounts'),
  ('rewards.manage', 'Manage Rewards', 'Adjust rewards settings and wallet balances'),
  ('catalog.manage', 'Manage Catalog', 'Manage curated storefront catalog'),
  ('customers.view', 'View Customers', 'View customer account records')
on conflict (code) do nothing;

insert into public.admin_role_permissions (role_id, permission_id)
select r.id, p.id
from public.admin_roles r
join public.admin_permissions p on
  (
    r.name = 'Owner'
    or (r.name = 'Operations Admin' and p.code in ('orders.view','orders.manage','customers.view'))
    or (r.name = 'Merch Admin' and p.code in ('orders.view','orders.manage','rewards.view','rewards.manage','catalog.manage','customers.view'))
    or (r.name = 'Support Admin' and p.code in ('orders.view','customers.view','rewards.view'))
  )
on conflict (role_id, permission_id) do nothing;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists app_users_set_updated_at on public.app_users;
create trigger app_users_set_updated_at
before update on public.app_users
for each row execute function public.set_updated_at();

drop trigger if exists admin_invites_set_updated_at on public.admin_invites;
create trigger admin_invites_set_updated_at
before update on public.admin_invites
for each row execute function public.set_updated_at();

drop trigger if exists customer_reward_wallets_set_updated_at on public.customer_reward_wallets;
create trigger customer_reward_wallets_set_updated_at
before update on public.customer_reward_wallets
for each row execute function public.set_updated_at();

alter table public.app_users enable row level security;
alter table public.customer_profiles enable row level security;
alter table public.customer_reward_wallets enable row level security;
alter table public.customer_reward_ledger enable row level security;
alter table public.admin_roles enable row level security;
alter table public.admin_permissions enable row level security;
alter table public.admin_role_permissions enable row level security;
alter table public.admin_memberships enable row level security;
alter table public.admin_invites enable row level security;

create policy "users can read own app user"
on public.app_users
for select
to authenticated
using (auth.uid() = id);

create policy "users can update own app user"
on public.app_users
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "users can read own profile"
on public.customer_profiles
for select
to authenticated
using (auth.uid() = user_id);

create policy "users can update own profile"
on public.customer_profiles
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "users can read own wallet"
on public.customer_reward_wallets
for select
to authenticated
using (auth.uid() = user_id);

create policy "users can read own reward ledger"
on public.customer_reward_ledger
for select
to authenticated
using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.app_users (id, email, full_name, account_type, is_active)
  values (
    new.id,
    lower(coalesce(new.email, '')),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    'customer',
    true
  )
  on conflict (id) do nothing;

  insert into public.customer_profiles (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.customer_reward_wallets (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
