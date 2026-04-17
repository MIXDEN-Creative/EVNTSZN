-- Migration: 20260415000000_currency_performance_desks.sql

-- 1. CURRENCY CONVERSION (CENTS -> DOLLARS)
-- evntszn_ticket_types
alter table public.evntszn_ticket_types alter column price_usd type numeric using (price_usd::numeric / 100.0);

-- evntszn_ticket_orders
alter table public.evntszn_ticket_orders alter column amount_total_usd type numeric using (amount_total_usd::numeric / 100.0);

-- epl.seasons
alter table epl.seasons alter column player_fee_usd type numeric using (player_fee_usd::numeric / 100.0);

-- epl.season_registrations
alter table epl.season_registrations alter column payment_amount_usd type numeric using (payment_amount_usd::numeric / 100.0);

-- epl.season_staff_assignments
alter table epl.season_staff_assignments alter column pay_rate_usd type numeric using (pay_rate_usd::numeric / 100.0);
alter table epl.season_staff_assignments alter column stipend_usd type numeric using (stipend_usd::numeric / 100.0);

-- epl.sponsorship_packages
alter table epl.sponsorship_packages alter column cash_price_usd type numeric using (cash_price_usd::numeric / 100.0);
alter table epl.sponsorship_packages alter column in_kind_floor_usd type numeric using (in_kind_floor_usd::numeric / 100.0);

-- epl.sponsor_partners
alter table epl.sponsor_partners alter column cash_value_usd type numeric using (cash_value_usd::numeric / 100.0);
alter table epl.sponsor_partners alter column in_kind_value_usd type numeric using (in_kind_value_usd::numeric / 100.0);

-- epl.revenue_ledger
alter table epl.revenue_ledger alter column amount_usd type numeric using (amount_usd::numeric / 100.0);

-- epl.merch_catalog
alter table epl.merch_catalog alter column price_usd type numeric using (price_usd::numeric / 100.0);
alter table epl.merch_catalog alter column cost_usd type numeric using (cost_usd::numeric / 100.0);

-- epl.merch_sales
alter table epl.merch_sales alter column gross_amount_usd type numeric using (gross_amount_usd::numeric / 100.0);
alter table epl.merch_sales alter column cost_amount_usd type numeric using (cost_amount_usd::numeric / 100.0);

-- epl.add_on_catalog
alter table epl.add_on_catalog alter column price_usd type numeric using (price_usd::numeric / 100.0);

-- evntszn_link_pages
alter table public.evntszn_link_pages alter column monthly_price_usd type numeric using (monthly_price_usd::numeric / 100.0);

-- evntszn_link_offers
alter table public.evntszn_link_offers alter column fee_amount_usd type numeric using (fee_amount_usd::numeric / 100.0);

-- evntszn_crew_profiles
alter table public.evntszn_crew_profiles alter column rate_amount_usd type numeric using (rate_amount_usd::numeric / 100.0);
alter table public.evntszn_crew_profiles alter column booking_fee_usd type numeric using (booking_fee_usd::numeric / 100.0);

-- evntszn_crew_booking_requests
alter table public.evntszn_crew_booking_requests alter column budget_amount_usd type numeric using (budget_amount_usd::numeric / 100.0);
alter table public.evntszn_crew_booking_requests alter column flat_booking_fee_usd type numeric using (flat_booking_fee_usd::numeric / 100.0);

-- 2. PERFORMANCE ENGINE SCHEMA
create table if not exists public.performance_scores (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('host', 'organizer', 'venue', 'reserve', 'patience')),
  entity_id uuid not null,
  score numeric(5,2) not null default 0,
  breakdown jsonb not null default '{}'::jsonb,
  trend numeric(5,2) default 0,
  last_updated_at timestamptz not null default now(),
  unique (entity_type, entity_id)
);

create table if not exists public.performance_metrics (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  metric_key text not null,
  metric_value numeric not null default 0,
  recorded_at timestamptz not null default now()
);

-- 3. INTERNAL DESK SYSTEM
create table if not exists public.internal_desks (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text
);

insert into public.internal_desks (name, slug, description) values
  ('Organizer Desk', 'organizer', 'Manage organizer intake and status'),
  ('Host Desk', 'host', 'Manage host applications and performance'),
  ('Venue Desk', 'venue', 'Manage venue agreements and onboarding'),
  ('Reserve Desk', 'reserve', 'Manage reserve integration and performance'),
  ('Partner Desk', 'partner', 'Manage partner tiers and payouts'),
  ('Crew Desk', 'crew', 'Manage crew marketplace and inquiries'),
  ('Agreements Desk', 'agreements', 'Legal and contract routing'),
  ('EPL Ops', 'epl-ops', 'League operations and staff'),
  ('Performance / Alerts', 'alerts', 'Performance monitoring and critical alerts')
on conflict (slug) do nothing;

create table if not exists public.internal_work_items (
  id uuid primary key default gen_random_uuid(),
  desk_id uuid references public.internal_desks(id),
  title text not null,
  description text,
  status text not null default 'open' check (status in ('open', 'in_progress', 'completed', 'blocked', 'cancelled')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'critical')),
  assigned_to uuid references public.evntszn_profiles(user_id),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. RESERVE SCHEMA
create table if not exists public.evntszn_reserve_venues (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  venue_id uuid not null unique references public.evntszn_venues(id) on delete cascade,
  is_active boolean not null default true,
  settings jsonb not null default '{}'::jsonb
);

create table if not exists public.evntszn_reserve_slots (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  reserve_venue_id uuid not null references public.evntszn_reserve_venues(id) on delete cascade,
  day_of_week integer not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  capacity_limit integer not null default 0,
  is_active boolean not null default true
);

create table if not exists public.evntszn_reserve_bookings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  reserve_venue_id uuid not null references public.evntszn_reserve_venues(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  guest_name text not null,
  guest_email text not null,
  guest_phone text,
  booking_date date not null,
  booking_time time not null,
  party_size integer not null default 1,
  status text not null default 'confirmed' check (status in ('confirmed', 'waitlisted', 'checked_in', 'no_show', 'cancelled')),
  internal_notes text,
  metadata jsonb not null default '{}'::jsonb
);

-- 5. EPL TEAMS REFRESH (12 TEAMS, FLAG FOOTBALL)
delete from epl.teams where season_id in (select id from epl.seasons where slug = 'season-1');

insert into epl.teams (league_id, season_id, slug, team_name, team_code, team_logo_url, draft_order, captain_name)
select l.id, s.id, v.slug, v.team_name, v.team_code, v.team_logo_url, v.draft_order, v.captain_name
from epl.leagues l
join epl.seasons s on s.league_id = l.id and s.slug = 'season-1'
cross join (
  values
    ('chargers', 'Canton Chargers', 'CHA', '/epl_team_logos/chargers.jpeg', 1, 'Elena Vance'),
    ('raiders', 'Fells Point Raiders', 'RAI', '/epl_team_logos/raiders.jpeg', 2, 'Bo Raider'),
    ('rebels', 'Hampden Rebels', 'REB', '/epl_team_logos/rebels.jpeg', 3, 'Avery Rebel'),
    ('royals', 'Mount Vernon Royals', 'ROY', '/epl_team_logos/royals.jpeg', 4, 'King Royal'),
    ('sentinels', 'Federal Hill Sentinels', 'SEN', '/epl_team_logos/sentinels.jpeg', 5, 'Val Sentinel'),
    ('titans', 'Harbor Titans', 'TIT', '/epl_team_logos/titans.jpeg', 6, 'Max Titan'),
    ('warriors', 'Dewey Warriors', 'WAR', '/epl_team_logos/warriors.jpg', 7, 'Zane Warrior'),
    ('bulldogs', 'Bethany Bulldogs', 'BUL', '/epl_team_logos/bulldogs.jpg', 8, 'Marcus Thorne'),
    ('phantoms', 'Fenwick Phantoms', 'PHA', '/epl_team_logos/phantoms.PNG', 9, 'Riley Ghost'),
    ('comets', 'Ocean City Comets', 'COM', '/epl_team_logos/comets.jpg', 10, 'Chris Bay'),
    ('hawks', 'Delmarva Hawks', 'HWK', '/epl_team_logos/hawks.jpg', 11, 'Sarah Fleet'),
    ('knights', 'Rehoboth Knights', 'KNI', '/epl_team_logos/knights.jpg', 12, 'Jax Neon')
) as v(slug, team_name, team_code, team_logo_url, draft_order, captain_name)
where l.slug = 'epl'
on conflict (season_id, slug) do nothing;


-- 5. RE-SYNC VIEWS (Since they used the old column names)
-- I will re-create the views in a separate step if needed, but the previous views likely broke.
-- epl_v_player_pipeline, epl_v_revenue_pipeline_summary, epl_v_admin_merch_sales, etc.
