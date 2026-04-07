create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.evntszn_profiles (
  user_id uuid primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  full_name text,
  primary_role text not null default 'attendee' check (primary_role in ('attendee', 'organizer', 'venue', 'scanner', 'admin')),
  city text,
  state text,
  phone text,
  referral_code text unique,
  is_active boolean not null default true,
  notes text
);

create table if not exists public.evntszn_venues (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  owner_user_id uuid,
  name text not null,
  slug text unique not null,
  city text not null,
  state text not null,
  timezone text not null default 'America/New_York',
  capacity integer,
  contact_email text,
  contact_phone text,
  is_active boolean not null default true,
  notes text
);

create table if not exists public.evntszn_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  organizer_user_id uuid,
  venue_id uuid references public.evntszn_venues(id) on delete set null,
  title text not null,
  slug text unique not null,
  subtitle text,
  description text,
  hero_note text,
  status text not null default 'draft' check (status in ('draft', 'published', 'sold_out', 'completed', 'canceled')),
  visibility text not null default 'private_preview' check (visibility in ('private_preview', 'published')),
  start_at timestamptz not null,
  end_at timestamptz not null,
  timezone text not null default 'America/New_York',
  city text not null,
  state text not null,
  banner_image_url text,
  capacity integer,
  currency_code text not null default 'usd',
  payout_account_label text,
  scanner_status text not null default 'ready' check (scanner_status in ('ready', 'live', 'closed')),
  check_in_count integer not null default 0,
  notes text
);

create table if not exists public.evntszn_event_staff (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  event_id uuid not null references public.evntszn_events(id) on delete cascade,
  user_id uuid not null,
  role_code text not null check (role_code in ('organizer', 'venue_manager', 'scanner', 'admin')),
  permission_scope jsonb not null default '{}'::jsonb,
  can_manage_event boolean not null default false,
  can_scan boolean not null default false,
  can_manage_tickets boolean not null default false,
  can_view_finance boolean not null default false,
  status text not null default 'active' check (status in ('active', 'inactive')),
  unique (event_id, user_id, role_code)
);

create table if not exists public.evntszn_ticket_types (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  event_id uuid not null references public.evntszn_events(id) on delete cascade,
  name text not null,
  description text,
  price_cents integer not null default 0,
  quantity_total integer not null default 0,
  quantity_sold integer not null default 0,
  max_per_order integer not null default 6,
  sales_start_at timestamptz,
  sales_end_at timestamptz,
  is_active boolean not null default true,
  unique (event_id, name)
);

create table if not exists public.evntszn_ticket_orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  event_id uuid not null references public.evntszn_events(id) on delete cascade,
  ticket_type_id uuid not null references public.evntszn_ticket_types(id) on delete restrict,
  purchaser_user_id uuid,
  purchaser_email text not null,
  purchaser_name text,
  quantity integer not null default 1,
  amount_total_cents integer not null default 0,
  currency_code text not null default 'usd',
  status text not null default 'pending' check (status in ('pending', 'paid', 'comped', 'refunded', 'canceled'))
);

create table if not exists public.evntszn_tickets (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  event_id uuid not null references public.evntszn_events(id) on delete cascade,
  ticket_type_id uuid not null references public.evntszn_ticket_types(id) on delete restrict,
  order_id uuid not null references public.evntszn_ticket_orders(id) on delete cascade,
  purchaser_user_id uuid,
  attendee_name text,
  attendee_email text,
  ticket_code text not null unique,
  share_code text unique,
  referral_code text,
  status text not null default 'issued' check (status in ('issued', 'checked_in', 'voided')),
  checked_in_at timestamptz,
  checked_in_by uuid,
  notes text
);

create table if not exists public.evntszn_referrals (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  referrer_ticket_id uuid not null references public.evntszn_tickets(id) on delete cascade,
  referred_email text,
  invite_code text not null unique,
  status text not null default 'pending' check (status in ('pending', 'claimed', 'converted')),
  claimed_ticket_id uuid references public.evntszn_tickets(id) on delete set null
);

create table if not exists public.evntszn_event_activity (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  event_id uuid references public.evntszn_events(id) on delete cascade,
  actor_user_id uuid,
  activity_type text not null,
  activity_label text not null,
  payload jsonb not null default '{}'::jsonb
);

create index if not exists evntszn_profiles_role_idx on public.evntszn_profiles(primary_role);
create index if not exists evntszn_venues_owner_idx on public.evntszn_venues(owner_user_id);
create index if not exists evntszn_events_organizer_idx on public.evntszn_events(organizer_user_id);
create index if not exists evntszn_events_status_idx on public.evntszn_events(status);
create index if not exists evntszn_events_start_idx on public.evntszn_events(start_at);
create index if not exists evntszn_event_staff_event_idx on public.evntszn_event_staff(event_id);
create index if not exists evntszn_event_staff_user_idx on public.evntszn_event_staff(user_id);
create index if not exists evntszn_ticket_types_event_idx on public.evntszn_ticket_types(event_id);
create index if not exists evntszn_ticket_orders_event_idx on public.evntszn_ticket_orders(event_id);
create index if not exists evntszn_ticket_orders_purchaser_idx on public.evntszn_ticket_orders(purchaser_user_id, purchaser_email);
create index if not exists evntszn_tickets_event_idx on public.evntszn_tickets(event_id);
create index if not exists evntszn_tickets_attendee_idx on public.evntszn_tickets(attendee_email, attendee_name);
create index if not exists evntszn_event_activity_event_idx on public.evntszn_event_activity(event_id, created_at desc);

drop trigger if exists evntszn_profiles_set_updated_at on public.evntszn_profiles;
create trigger evntszn_profiles_set_updated_at before update on public.evntszn_profiles for each row execute function public.set_updated_at();

drop trigger if exists evntszn_venues_set_updated_at on public.evntszn_venues;
create trigger evntszn_venues_set_updated_at before update on public.evntszn_venues for each row execute function public.set_updated_at();

drop trigger if exists evntszn_events_set_updated_at on public.evntszn_events;
create trigger evntszn_events_set_updated_at before update on public.evntszn_events for each row execute function public.set_updated_at();

drop trigger if exists evntszn_event_staff_set_updated_at on public.evntszn_event_staff;
create trigger evntszn_event_staff_set_updated_at before update on public.evntszn_event_staff for each row execute function public.set_updated_at();

drop trigger if exists evntszn_ticket_types_set_updated_at on public.evntszn_ticket_types;
create trigger evntszn_ticket_types_set_updated_at before update on public.evntszn_ticket_types for each row execute function public.set_updated_at();

drop trigger if exists evntszn_ticket_orders_set_updated_at on public.evntszn_ticket_orders;
create trigger evntszn_ticket_orders_set_updated_at before update on public.evntszn_ticket_orders for each row execute function public.set_updated_at();

drop trigger if exists evntszn_tickets_set_updated_at on public.evntszn_tickets;
create trigger evntszn_tickets_set_updated_at before update on public.evntszn_tickets for each row execute function public.set_updated_at();

drop trigger if exists evntszn_referrals_set_updated_at on public.evntszn_referrals;
create trigger evntszn_referrals_set_updated_at before update on public.evntszn_referrals for each row execute function public.set_updated_at();

insert into public.evntszn_venues (id, name, slug, city, state, timezone, capacity, contact_email, is_active)
values
  ('00000000-0000-0000-0000-00000000e001', 'Oryx Field House', 'oryx-field-house', 'New York', 'NY', 'America/New_York', 240, 'ops@evntszn.com', true)
on conflict (id) do nothing;

insert into public.evntszn_events (
  id,
  venue_id,
  title,
  slug,
  subtitle,
  description,
  hero_note,
  status,
  visibility,
  start_at,
  end_at,
  timezone,
  city,
  state,
  capacity,
  payout_account_label,
  scanner_status
)
values (
  '00000000-0000-0000-0000-00000000e101',
  '00000000-0000-0000-0000-00000000e001',
  'EVNTSZN Midnight Run',
  'evntszn-midnight-run',
  'Premium night session for the EVNTSZN launch circuit.',
  'A premium EVNTSZN live event designed to exercise event ops, ticketing, venue workflow, and mobile-first check-in.',
  'Black-card access. Tight operations. High-trust entry.',
  'published',
  'published',
  '2026-06-20T20:00:00-04:00',
  '2026-06-20T23:00:00-04:00',
  'America/New_York',
  'New York',
  'NY',
  240,
  'ORYX Live Events',
  'ready'
)
on conflict (id) do nothing;

-- removed invalid demo seed insert for evntszn_ticket_types during production migration push
