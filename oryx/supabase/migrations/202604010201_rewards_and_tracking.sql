alter table public.merch_orders
  add column if not exists public_order_number text,
  add column if not exists reward_points_earned integer not null default 0;

update public.merch_orders
set public_order_number = 'EPL-' || upper(substr(replace(id::text, '-', ''), 1, 10))
where public_order_number is null;

alter table public.merch_orders
  alter column public_order_number set not null;

create unique index if not exists merch_orders_public_order_number_idx
  on public.merch_orders(public_order_number);

create table if not exists public.merch_reward_settings (
  id integer primary key,
  points_per_dollar numeric not null default 1.0,
  first_order_bonus integer not null default 25,
  redemption_enabled boolean not null default false,
  redemption_value_cents integer not null default 100,
  minimum_points_to_redeem integer not null default 100
);

insert into public.merch_reward_settings (
  id,
  points_per_dollar,
  first_order_bonus,
  redemption_enabled,
  redemption_value_cents,
  minimum_points_to_redeem
)
values (1, 1.0, 25, false, 100, 100)
on conflict (id) do nothing;

create table if not exists public.merch_reward_accounts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  customer_email text not null unique,
  customer_name text,
  lifetime_points integer not null default 0,
  available_points integer not null default 0,
  total_spent integer not null default 0,
  orders_count integer not null default 0,
  tier text not null default 'Member',
  is_active boolean not null default true
);

create index if not exists merch_reward_accounts_email_idx
  on public.merch_reward_accounts(customer_email);

create table if not exists public.merch_reward_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  customer_email text not null,
  merch_order_id uuid references public.merch_orders(id) on delete set null,
  event_type text not null,
  points integer not null default 0,
  description text
);

create unique index if not exists merch_reward_events_order_type_idx
  on public.merch_reward_events(merch_order_id, event_type);

drop trigger if exists merch_reward_accounts_set_updated_at on public.merch_reward_accounts;

create trigger merch_reward_accounts_set_updated_at
before update on public.merch_reward_accounts
for each row
execute function public.set_updated_at();
