create extension if not exists pgcrypto;

create schema if not exists epl;

create or replace function public.set_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists epl.leagues (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  sport text,
  league_type text,
  city text,
  state text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists epl.seasons (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references epl.leagues(id) on delete cascade,
  slug text not null unique,
  name text not null,
  status text not null default 'planning',
  player_fee_usd integer not null default 9500,
  registration_opens_at timestamptz,
  registration_closes_at timestamptz,
  season_starts_at timestamptz,
  season_ends_at timestamptz,
  draft_event_title text,
  draft_state text not null default 'setup',
  production_message text,
  sponsor_message text,
  reveal_duration_ms integer not null default 6000,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists epl.teams (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references epl.leagues(id) on delete cascade,
  season_id uuid not null references epl.seasons(id) on delete cascade,
  slug text not null,
  team_name text not null,
  team_code text,
  team_logo_url text,
  draft_order integer,
  captain_name text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (season_id, slug)
);

create table if not exists epl.player_profiles (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text not null unique,
  phone text,
  age integer,
  hometown text,
  preferred_position text,
  secondary_position text,
  jersey_name text,
  preferred_jersey_number_1 integer,
  preferred_jersey_number_2 integer,
  jersey_name_policy_accepted boolean not null default false,
  headshot_storage_path text,
  status text not null default 'prospect',
  is_draft_eligible boolean not null default true,
  draft_eligibility_reason text,
  bio text,
  social_handle text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists epl.player_applications (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references epl.leagues(id) on delete cascade,
  season_id uuid not null references epl.seasons(id) on delete cascade,
  player_profile_id uuid not null references epl.player_profiles(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  age integer,
  city text,
  state text,
  position_primary text,
  position_secondary text,
  experience_level text,
  jersey_name_requested text,
  preferred_jersey_number_1 integer,
  preferred_jersey_number_2 integer,
  jersey_name_policy_accepted boolean not null default false,
  headshot_storage_path text,
  status text not null default 'submitted',
  source text,
  pipeline_stage text not null default 'submitted',
  answers jsonb not null default '{}'::jsonb,
  internal_notes text,
  submitted_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists epl.season_registrations (
  id uuid primary key default gen_random_uuid(),
  registration_code text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)),
  league_id uuid not null references epl.leagues(id) on delete cascade,
  season_id uuid not null references epl.seasons(id) on delete cascade,
  player_profile_id uuid not null references epl.player_profiles(id) on delete cascade,
  application_id uuid references epl.player_applications(id) on delete set null,
  registration_status text not null default 'pending_payment',
  player_status text not null default 'prospect',
  payment_amount_usd integer not null default 9500,
  waived_fee boolean not null default false,
  paid_at timestamptz,
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  registration_source text,
  currency_code text not null default 'usd',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists epl.opportunities (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references epl.leagues(id) on delete cascade,
  season_id uuid references epl.seasons(id) on delete set null,
  role_code text not null,
  title text not null,
  department text,
  opportunity_type text,
  summary text,
  description text,
  requirements jsonb not null default '[]'::jsonb,
  perks jsonb not null default '[]'::jsonb,
  pay_label text,
  status text not null default 'open',
  display_order integer not null default 100,
  is_active boolean not null default true,
  is_archived boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists epl.staff_applications (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references epl.leagues(id) on delete cascade,
  season_id uuid references epl.seasons(id) on delete set null,
  opportunity_id uuid references epl.opportunities(id) on delete set null,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  city text,
  state text,
  preferred_roles jsonb not null default '[]'::jsonb,
  experience_summary text,
  availability_summary text,
  why_join text,
  status text not null default 'submitted',
  source text,
  internal_notes text,
  is_active boolean not null default true,
  is_archived boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists epl.staff_roles_catalog (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references epl.leagues(id) on delete cascade,
  role_code text not null,
  display_name text not null,
  department text,
  description text,
  sort_order integer not null default 100,
  default_access_scope jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (league_id, role_code)
);

create table if not exists epl.season_staff_assignments (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references epl.leagues(id) on delete cascade,
  season_id uuid not null references epl.seasons(id) on delete cascade,
  staff_application_id uuid references epl.staff_applications(id) on delete set null,
  role_id uuid not null references epl.staff_roles_catalog(id) on delete cascade,
  assignment_status text not null default 'assigned',
  compensation_tier text not null default 'volunteer',
  pay_rate_usd integer,
  stipend_usd integer,
  access_scope jsonb not null default '{}'::jsonb,
  can_access_admin boolean not null default false,
  can_access_draft_console boolean not null default false,
  can_access_scanner boolean not null default false,
  can_access_finance boolean not null default false,
  is_active boolean not null default true,
  is_archived boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists epl.sponsorship_packages (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references epl.leagues(id) on delete cascade,
  package_name text not null,
  description text,
  cash_price_usd integer not null default 0,
  in_kind_floor_usd integer not null default 0,
  benefits jsonb not null default '[]'::jsonb,
  sort_order integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists epl.sponsor_partners (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references epl.leagues(id) on delete cascade,
  season_id uuid references epl.seasons(id) on delete set null,
  company_name text not null,
  contact_name text,
  contact_email text,
  contact_phone text,
  package_name text,
  cash_value_usd integer not null default 0,
  in_kind_value_usd integer not null default 0,
  status text not null default 'active',
  notes text,
  is_active boolean not null default true,
  is_archived boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists epl.sponsor_deliverables (
  id uuid primary key default gen_random_uuid(),
  sponsor_partner_id uuid not null references epl.sponsor_partners(id) on delete cascade,
  season_id uuid references epl.seasons(id) on delete set null,
  deliverable_title text not null,
  deliverable_type text not null,
  due_at timestamptz,
  completed_at timestamptz,
  status text not null default 'pending',
  owner_assignment_id uuid references epl.season_staff_assignments(id) on delete set null,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists epl.revenue_ledger (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references epl.leagues(id) on delete cascade,
  season_id uuid references epl.seasons(id) on delete set null,
  stream_code text not null,
  money_direction text not null default 'inflow',
  amount_usd integer not null default 0,
  memo text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists epl.merch_catalog (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references epl.leagues(id) on delete cascade,
  season_id uuid references epl.seasons(id) on delete set null,
  sku text not null,
  item_name text not null,
  item_type text,
  price_usd integer not null default 0,
  cost_usd numeric(10,2) not null default 0,
  inventory_count integer not null default 0,
  image_url text,
  is_active boolean not null default true,
  is_archived boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (season_id, sku)
);

create table if not exists epl.merch_sales (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references epl.leagues(id) on delete cascade,
  season_id uuid references epl.seasons(id) on delete set null,
  merch_catalog_id uuid not null references epl.merch_catalog(id) on delete cascade,
  quantity integer not null default 1,
  gross_amount_usd integer not null default 0,
  cost_amount_usd integer not null default 0,
  sale_channel text not null default 'on_site',
  sold_at timestamptz not null default timezone('utc', now()),
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists epl.add_on_catalog (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references epl.leagues(id) on delete cascade,
  season_id uuid references epl.seasons(id) on delete set null,
  code text not null,
  item_name text not null,
  description text,
  price_usd integer not null default 0,
  fulfillment_type text not null default 'digital',
  is_active boolean not null default true,
  is_archived boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (season_id, code)
);

create table if not exists epl.coach_profiles (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references epl.leagues(id) on delete cascade,
  season_id uuid references epl.seasons(id) on delete set null,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  coach_type text not null default 'head_coach',
  status text not null default 'active',
  assigned_team_id uuid references epl.teams(id) on delete set null,
  bio text,
  years_experience integer,
  specialties jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  is_archived boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists epl.draft_sessions (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references epl.seasons(id) on delete cascade,
  title text not null,
  status text not null default 'ready',
  current_pick_number integer not null default 0,
  total_picks integer not null default 72,
  snake_mode boolean not null default true,
  auto_mode boolean not null default false,
  auto_interval_seconds integer not null default 12,
  production_state text not null default 'ready',
  production_message text,
  sponsor_message text,
  reveal_duration_ms integer not null default 6000,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists epl.draft_picks (
  id uuid primary key default gen_random_uuid(),
  draft_session_id uuid not null references epl.draft_sessions(id) on delete cascade,
  season_id uuid not null references epl.seasons(id) on delete cascade,
  team_id uuid not null references epl.teams(id) on delete cascade,
  round_number integer not null,
  pick_number_in_round integer not null,
  overall_pick_number integer not null,
  player_profile_id uuid references epl.player_profiles(id) on delete set null,
  selection_method text not null default 'random',
  selection_note text,
  is_trade_acquired boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (draft_session_id, overall_pick_number)
);

create table if not exists epl.draft_action_log (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references epl.seasons(id) on delete cascade,
  draft_session_id uuid references epl.draft_sessions(id) on delete set null,
  related_team_id uuid references epl.teams(id) on delete set null,
  related_player_profile_id uuid references epl.player_profiles(id) on delete set null,
  action_type text not null,
  action_label text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists epl.draft_trades (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references epl.seasons(id) on delete cascade,
  draft_session_id uuid references epl.draft_sessions(id) on delete set null,
  from_team_id uuid not null references epl.teams(id) on delete cascade,
  to_team_id uuid not null references epl.teams(id) on delete cascade,
  from_pick_id uuid references epl.draft_picks(id) on delete set null,
  to_pick_id uuid references epl.draft_picks(id) on delete set null,
  status text not null default 'proposed',
  notes text,
  resolution_note text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists epl.team_war_room_notes (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references epl.seasons(id) on delete cascade,
  team_id uuid not null references epl.teams(id) on delete cascade,
  note text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists epl.player_scouting_notes (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references epl.seasons(id) on delete cascade,
  player_profile_id uuid not null references epl.player_profiles(id) on delete cascade,
  note text not null,
  grade text,
  tags jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists epl_player_profiles_email_idx on epl.player_profiles (lower(email));
create index if not exists epl_player_applications_season_idx on epl.player_applications (season_id, submitted_at desc);
create index if not exists epl_season_registrations_season_idx on epl.season_registrations (season_id, registration_status);
create index if not exists epl_staff_applications_season_idx on epl.staff_applications (season_id, created_at desc);
create index if not exists epl_draft_picks_session_idx on epl.draft_picks (draft_session_id, overall_pick_number);
create index if not exists epl_draft_action_log_session_idx on epl.draft_action_log (draft_session_id, created_at desc);

do $$
declare
  t text;
begin
  foreach t in array array[
    'leagues',
    'seasons',
    'teams',
    'player_profiles',
    'player_applications',
    'season_registrations',
    'opportunities',
    'staff_applications',
    'staff_roles_catalog',
    'season_staff_assignments',
    'sponsorship_packages',
    'sponsor_partners',
    'sponsor_deliverables',
    'revenue_ledger',
    'merch_catalog',
    'merch_sales',
    'add_on_catalog',
    'coach_profiles',
    'draft_sessions',
    'draft_picks',
    'draft_trades'
  ]
  loop
    execute format('drop trigger if exists set_%I_updated_at on epl.%I', t, t);
    execute format('create trigger set_%I_updated_at before update on epl.%I for each row execute function public.set_updated_at_column()', t, t);
  end loop;
end
$$;

insert into epl.leagues (slug, name, sport, league_type, city, state)
values ('epl', 'EVNTSZN Prime League', 'flag football', 'coed adult', 'Atlanta', 'GA')
on conflict (slug) do update
set
  name = excluded.name,
  sport = excluded.sport,
  league_type = excluded.league_type,
  city = excluded.city,
  state = excluded.state,
  updated_at = timezone('utc', now());

insert into epl.seasons (league_id, slug, name, status, player_fee_usd, draft_event_title)
select l.id, 'season-1', 'Season 1', 'active', 9500, 'EVNTSZN Prime League Draft Night'
from epl.leagues l
where l.slug = 'epl'
on conflict (slug) do update
set
  name = excluded.name,
  status = excluded.status,
  player_fee_usd = excluded.player_fee_usd,
  draft_event_title = excluded.draft_event_title,
  updated_at = timezone('utc', now());

insert into epl.staff_roles_catalog (league_id, role_code, display_name, department, description, sort_order, default_access_scope)
select l.id, v.role_code, v.display_name, v.department, v.description, v.sort_order, v.default_access_scope::jsonb
from epl.leagues l
cross join (
  values
    ('commissioner', 'Commissioner', 'league-office', 'League control and executive decisions', 10, '{"scope":"founder"}'),
    ('operations', 'Operations Lead', 'operations', 'Game day and league operations', 20, '{"scope":"admin"}'),
    ('scanner', 'Scanner Staff', 'event-ops', 'Ticket scanning and check-in access', 30, '{"scope":"scanner"}'),
    ('revenue', 'Revenue Lead', 'finance', 'Sponsors, payouts, and ledger management', 40, '{"scope":"revenue"}'),
    ('content', 'Content Producer', 'media', 'Draft presentation and social capture', 50, '{"scope":"content"}')
) as v(role_code, display_name, department, description, sort_order, default_access_scope)
where l.slug = 'epl'
on conflict (league_id, role_code) do update
set
  display_name = excluded.display_name,
  department = excluded.department,
  description = excluded.description,
  sort_order = excluded.sort_order,
  default_access_scope = excluded.default_access_scope,
  updated_at = timezone('utc', now());

insert into epl.sponsorship_packages (league_id, package_name, description, cash_price_usd, in_kind_floor_usd, benefits, sort_order)
select l.id, v.package_name, v.description, v.cash_price_usd, v.in_kind_floor_usd, v.benefits::jsonb, v.sort_order
from epl.leagues l
cross join (
  values
    ('Founding Partner', 'Top-tier EPL founding sponsor placement', 150000, 50000, '["Field logo placement","Draft night feature","Premium social placements"]', 10),
    ('Game Day Partner', 'On-site and digital game day support package', 75000, 15000, '["Venue signage","PA mention","Ticketing feature slot"]', 20),
    ('Community Partner', 'Brand association with league community programming', 35000, 5000, '["Event listing mention","Community recap inclusion"]', 30)
) as v(package_name, description, cash_price_usd, in_kind_floor_usd, benefits, sort_order)
where l.slug = 'epl'
on conflict do nothing;

insert into epl.teams (league_id, season_id, slug, team_name, team_code, team_logo_url, draft_order, captain_name)
select l.id, s.id, v.slug, v.team_name, v.team_code, v.team_logo_url, v.draft_order, v.captain_name
from epl.leagues l
join epl.seasons s on s.league_id = l.id and s.slug = 'season-1'
cross join (
  values
    ('onyx', 'Onyx FC', 'ONY', 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=400&q=80', 1, 'Ari Bennett'),
    ('ghost', 'Ghost Route', 'GHO', 'https://images.unsplash.com/photo-1547347298-4074fc3086f0?auto=format&fit=crop&w=400&q=80', 2, 'Taylor Reid'),
    ('voltage', 'Voltage', 'VOL', 'https://images.unsplash.com/photo-1511886929837-354d827aae26?auto=format&fit=crop&w=400&q=80', 3, 'Jordan Webb'),
    ('district', 'District IX', 'DS9', 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=400&q=80', 4, 'Morgan Ellis'),
    ('nightshift', 'Night Shift', 'NGT', 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=400&q=80', 5, 'Cameron Blake'),
    ('royals', 'Mount Vernon Royals', 'ROY', '/epl_team_logos/royals.jpeg', 6, 'Jamie Cole'),
    ('northstar', 'Northstar', 'NST', 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=400&q=80', 7, 'Drew Parker'),
    ('rush', 'Redline Rush', 'RSH', 'https://images.unsplash.com/photo-1486286701208-1d58e9338013?auto=format&fit=crop&w=400&q=80', 8, 'Sky Harper')
) as v(slug, team_name, team_code, team_logo_url, draft_order, captain_name)
where l.slug = 'epl'
on conflict (season_id, slug) do update
set
  team_name = excluded.team_name,
  team_code = excluded.team_code,
  team_logo_url = excluded.team_logo_url,
  draft_order = excluded.draft_order,
  captain_name = excluded.captain_name,
  updated_at = timezone('utc', now());

insert into epl.opportunities (league_id, season_id, role_code, title, department, opportunity_type, summary, description, requirements, perks, pay_label, status, display_order)
select l.id, s.id, v.role_code, v.title, v.department, v.opportunity_type, v.summary, v.description, v.requirements::jsonb, v.perks::jsonb, v.pay_label, 'open', v.display_order
from epl.leagues l
join epl.seasons s on s.league_id = l.id and s.slug = 'season-1'
cross join (
  values
    ('scanner_lead', 'Scanner Lead', 'event-ops', 'paid', 'Run premium check-in flow on game day.', 'Own mobile-first scanner execution, staff rhythm, and gate throughput.', '["Comfort with iPhone/iPad event ops","Fast decision making","Calm under pressure"]', '["Premium event operations access","Priority game-day placement"]', '$18-$24/hr', 10),
    ('content_runner', 'Content Runner', 'media', 'paid', 'Capture sideline moments and sponsor hits.', 'Support league content capture, sponsor inventory, and post-game recap handoff.', '["Short-form content instincts","Reliable attendance","Comfort around live events"]', '["League credentials","Access to premium production workflows"]', '$150 stipend', 20),
    ('community_ambassador', 'Community Ambassador', 'growth', 'volunteer', 'Help EPL grow through community outreach and referrals.', 'Drive interest, team culture, and social attendance loops around each event.', '["Strong local network","Outgoing communication style"]', '["Referral-ready access","Priority merch and event perks"]', 'Volunteer + perks', 30)
) as v(role_code, title, department, opportunity_type, summary, description, requirements, perks, pay_label, display_order)
where l.slug = 'epl'
on conflict do nothing;

insert into storage.buckets (id, name, public)
values ('epl-player-photos', 'epl-player-photos', false)
on conflict (id) do nothing;

create or replace view public.epl_v_public_opportunities as
select
  o.id,
  o.league_id,
  o.season_id,
  s.slug as season_slug,
  s.name as season_name,
  o.role_code,
  o.title,
  o.department,
  o.opportunity_type,
  o.summary,
  o.description,
  o.requirements,
  o.perks,
  o.pay_label,
  o.status,
  o.display_order,
  o.is_active,
  o.is_archived,
  o.created_at
from epl.opportunities o
left join epl.seasons s on s.id = o.season_id
where o.is_archived = false and o.is_active = true;

create or replace view public.epl_v_staff_roles_catalog as
select
  r.id,
  r.league_id,
  l.slug as league_slug,
  r.role_code,
  r.display_name,
  r.department,
  r.description,
  r.sort_order,
  r.default_access_scope,
  r.is_active,
  r.created_at
from epl.staff_roles_catalog r
join epl.leagues l on l.id = r.league_id;

create or replace view public.epl_v_staff_pipeline as
select
  a.id,
  a.league_id,
  a.season_id,
  s.slug as season_slug,
  s.name as season_name,
  a.opportunity_id,
  o.title as opportunity_title,
  o.department,
  a.first_name,
  a.last_name,
  concat_ws(' ', a.first_name, a.last_name) as applicant_name,
  a.email,
  a.phone,
  a.city,
  a.state,
  a.preferred_roles,
  a.experience_summary,
  a.availability_summary,
  a.why_join,
  a.status,
  a.source,
  a.internal_notes,
  a.created_at
from epl.staff_applications a
left join epl.seasons s on s.id = a.season_id
left join epl.opportunities o on o.id = a.opportunity_id;

create or replace view public.epl_v_player_pipeline as
select
  a.id as application_id,
  a.league_id,
  a.season_id,
  s.slug as season_slug,
  s.name as season_name,
  a.player_profile_id,
  concat_ws(' ', p.first_name, p.last_name) as player_name,
  a.email,
  a.phone,
  a.status as application_status,
  a.pipeline_stage,
  a.submitted_at,
  r.id as registration_id,
  r.registration_code,
  r.registration_status,
  r.player_status,
  r.payment_amount_usd,
  r.waived_fee,
  r.paid_at,
  p.preferred_position,
  p.secondary_position,
  p.jersey_name,
  p.is_draft_eligible as draft_eligible,
  p.draft_eligibility_reason
from epl.player_applications a
join epl.player_profiles p on p.id = a.player_profile_id
join epl.seasons s on s.id = a.season_id
left join epl.season_registrations r on r.application_id = a.id;

create or replace view public.epl_v_revenue_pipeline_summary as
select
  s.slug as season_slug,
  r.stream_code,
  coalesce(sum(case when r.money_direction = 'inflow' then r.amount_usd else 0 end), 0) as inflow_amount_usd,
  coalesce(sum(case when r.money_direction = 'outflow' then r.amount_usd else 0 end), 0) as outflow_amount_usd,
  coalesce(sum(case when r.money_direction = 'inflow' then r.amount_usd else -r.amount_usd end), 0) as net_amount_usd
from epl.revenue_ledger r
left join epl.seasons s on s.id = r.season_id
group by s.slug, r.stream_code;

create or replace view public.epl_v_sponsor_partners as
select
  p.*,
  s.slug as season_slug,
  s.name as season_name
from epl.sponsor_partners p
left join epl.seasons s on s.id = p.season_id;

create or replace view public.epl_v_merch_catalog as
select
  m.*,
  s.slug as season_slug,
  s.name as season_name
from epl.merch_catalog m
left join epl.seasons s on s.id = m.season_id;

create or replace view public.epl_v_add_on_catalog as
select
  a.*,
  s.slug as season_slug,
  s.name as season_name
from epl.add_on_catalog a
left join epl.seasons s on s.id = a.season_id;

create or replace view public.epl_v_admin_coaches as
select
  c.*,
  s.slug as season_slug,
  concat_ws(' ', c.first_name, c.last_name) as coach_name,
  t.team_name
from epl.coach_profiles c
left join epl.seasons s on s.id = c.season_id
left join epl.teams t on t.id = c.assigned_team_id;

create or replace view public.epl_v_admin_merch_sales as
select
  ms.*,
  s.slug as season_slug,
  mc.sku,
  mc.item_name,
  mc.item_type,
  (ms.gross_amount_usd - ms.cost_amount_usd) as margin_amount_usd
from epl.merch_sales ms
join epl.merch_catalog mc on mc.id = ms.merch_catalog_id
left join epl.seasons s on s.id = ms.season_id;

create or replace view public.epl_v_admin_sponsor_deliverables as
select
  d.*,
  sp.company_name,
  s.slug as season_slug,
  src.display_name as owner_role_name
from epl.sponsor_deliverables d
join epl.sponsor_partners sp on sp.id = d.sponsor_partner_id
left join epl.seasons s on s.id = d.season_id
left join epl.season_staff_assignments ssa on ssa.id = d.owner_assignment_id
left join epl.staff_roles_catalog src on src.id = ssa.role_id;

create or replace view public.epl_v_admin_players_master as
select
  coalesce(pp.id::text, pa.email) as player_key,
  pp.id as player_profile_id,
  concat_ws(' ', pp.first_name, pp.last_name) as player_name,
  pp.email,
  pp.phone,
  pp.preferred_position,
  pp.secondary_position,
  pp.jersey_name,
  pp.preferred_jersey_number_1,
  pp.preferred_jersey_number_2,
  count(pa.id) as total_applications,
  count(*) filter (where pa.status = 'approved') as approved_applications,
  count(*) filter (where pa.status = 'waitlisted') as waitlisted_applications,
  count(*) filter (where pa.status = 'declined') as declined_applications,
  count(*) filter (where sr.registration_status = 'paid') as paid_seasons,
  string_agg(distinct s.name, ', ' order by s.name) as seasons,
  array_remove(array_agg(distinct s.slug), null) as season_slugs,
  max(pa.submitted_at) as last_submitted_at,
  max(sr.paid_at) as last_paid_at
from epl.player_profiles pp
left join epl.player_applications pa on pa.player_profile_id = pp.id
left join epl.season_registrations sr on sr.player_profile_id = pp.id and sr.season_id = pa.season_id
left join epl.seasons s on s.id = pa.season_id
group by
  coalesce(pp.id::text, pa.email),
  pp.id,
  pp.first_name,
  pp.last_name,
  pp.email,
  pp.phone,
  pp.preferred_position,
  pp.secondary_position,
  pp.jersey_name,
  pp.preferred_jersey_number_1,
  pp.preferred_jersey_number_2;

create or replace view public.epl_v_draft_sessions as
select
  ds.id as draft_session_id,
  ds.season_id,
  s.slug as season_slug,
  s.name as season_name,
  ds.title,
  ds.status,
  ds.current_pick_number,
  ds.total_picks,
  ds.snake_mode,
  ds.auto_mode,
  ds.auto_interval_seconds,
  ds.production_state,
  ds.production_message,
  ds.sponsor_message,
  ds.reveal_duration_ms,
  ds.created_at,
  ds.updated_at
from epl.draft_sessions ds
join epl.seasons s on s.id = ds.season_id;

create or replace view public.epl_v_admin_player_pool as
select
  sr.id as registration_id,
  sr.season_id,
  s.slug as season_slug,
  sr.player_profile_id,
  concat_ws(' ', pp.first_name, pp.last_name) as player_name,
  pp.email,
  pp.phone,
  pp.jersey_name,
  pp.preferred_position,
  pp.secondary_position,
  pp.headshot_storage_path,
  sr.registration_status,
  sr.player_status,
  sr.waived_fee,
  sr.payment_amount_usd,
  sr.paid_at,
  pp.is_draft_eligible,
  pp.draft_eligibility_reason
from epl.season_registrations sr
join epl.player_profiles pp on pp.id = sr.player_profile_id
join epl.seasons s on s.id = sr.season_id;

create or replace view public.epl_v_admin_full_draft_board as
select
  dp.id as draft_pick_id,
  dp.draft_session_id,
  dp.season_id,
  s.slug as season_slug,
  ds.title as draft_title,
  dp.team_id,
  t.team_name,
  t.team_logo_url,
  dp.round_number,
  dp.pick_number_in_round,
  dp.overall_pick_number,
  dp.player_profile_id,
  concat_ws(' ', pp.first_name, pp.last_name) as player_name,
  pp.preferred_position,
  pp.secondary_position,
  pp.jersey_name,
  pp.headshot_storage_path,
  dp.selection_method,
  dp.selection_note,
  dp.is_trade_acquired
from epl.draft_picks dp
join epl.draft_sessions ds on ds.id = dp.draft_session_id
join epl.seasons s on s.id = dp.season_id
join epl.teams t on t.id = dp.team_id
left join epl.player_profiles pp on pp.id = dp.player_profile_id;

create or replace view public.epl_v_draft_presentation_picks as
select * from public.epl_v_admin_full_draft_board;

create or replace view public.epl_v_admin_draft_action_log as
select
  dal.id,
  dal.season_id,
  s.slug as season_slug,
  dal.draft_session_id,
  dal.action_type,
  dal.action_label,
  dal.details,
  dal.created_at,
  t.team_name as related_team_name,
  concat_ws(' ', pp.first_name, pp.last_name) as related_player_name
from epl.draft_action_log dal
join epl.seasons s on s.id = dal.season_id
left join epl.teams t on t.id = dal.related_team_id
left join epl.player_profiles pp on pp.id = dal.related_player_profile_id;

create or replace view public.epl_v_admin_team_roster_summary as
select
  t.id as team_id,
  t.season_id,
  s.slug as season_slug,
  t.team_name,
  t.team_logo_url,
  count(dp.id) filter (where dp.player_profile_id is not null) as roster_size,
  string_agg(concat_ws(' ', pp.first_name, pp.last_name), ', ' order by dp.overall_pick_number) as drafted_players
from epl.teams t
join epl.seasons s on s.id = t.season_id
left join epl.draft_picks dp on dp.team_id = t.id
left join epl.player_profiles pp on pp.id = dp.player_profile_id
group by t.id, t.season_id, s.slug, t.team_name, t.team_logo_url;

create or replace view public.epl_v_admin_team_draft_needs as
select
  t.id as team_id,
  s.slug as season_slug,
  t.team_name,
  t.team_logo_url,
  greatest(0, 2 - count(*) filter (where coalesce(pp.preferred_position, '') ilike '%qb%')) as qb_need,
  greatest(0, 4 - count(*) filter (where coalesce(pp.preferred_position, '') ilike '%wr%')) as receiver_need,
  greatest(0, 4 - count(*) filter (where coalesce(pp.preferred_position, '') ilike '%db%' or coalesce(pp.preferred_position, '') ilike '%def%')) as defense_need
from epl.teams t
join epl.seasons s on s.id = t.season_id
left join epl.draft_picks dp on dp.team_id = t.id
left join epl.player_profiles pp on pp.id = dp.player_profile_id
group by t.id, s.slug, t.team_name, t.team_logo_url;

create or replace view public.epl_v_admin_team_war_room_notes as
select
  n.id,
  n.season_id,
  s.slug as season_slug,
  n.team_id,
  t.team_name,
  n.note,
  n.created_at
from epl.team_war_room_notes n
join epl.seasons s on s.id = n.season_id
join epl.teams t on t.id = n.team_id;

create or replace view public.epl_v_admin_player_scouting_notes as
select
  n.id,
  n.season_id,
  s.slug as season_slug,
  n.player_profile_id,
  concat_ws(' ', pp.first_name, pp.last_name) as player_name,
  n.note,
  n.grade,
  n.tags,
  n.created_at
from epl.player_scouting_notes n
join epl.seasons s on s.id = n.season_id
join epl.player_profiles pp on pp.id = n.player_profile_id;

create or replace view public.epl_v_admin_draft_trades as
select
  dt.id,
  dt.season_id,
  s.slug as season_slug,
  dt.draft_session_id,
  dt.from_team_id,
  tf.team_name as from_team_name,
  dt.to_team_id,
  tt.team_name as to_team_name,
  dt.from_pick_id,
  fp.overall_pick_number as from_pick_number,
  dt.to_pick_id,
  tp.overall_pick_number as to_pick_number,
  dt.status,
  dt.notes,
  dt.resolution_note,
  dt.created_at,
  dt.updated_at
from epl.draft_trades dt
join epl.seasons s on s.id = dt.season_id
join epl.teams tf on tf.id = dt.from_team_id
join epl.teams tt on tt.id = dt.to_team_id
left join epl.draft_picks fp on fp.id = dt.from_pick_id
left join epl.draft_picks tp on tp.id = dt.to_pick_id;

create or replace function public.epl_log_draft_action(
  p_season_slug text,
  p_action_type text,
  p_action_label text,
  p_draft_session_id uuid default null,
  p_related_team_id uuid default null,
  p_related_player_profile_id uuid default null,
  p_details jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
as $$
declare
  v_season_id uuid;
  v_id uuid := gen_random_uuid();
begin
  select id into v_season_id from epl.seasons where slug = p_season_slug limit 1;
  if v_season_id is null then
    raise exception 'Season not found for slug %', p_season_slug;
  end if;

  insert into epl.draft_action_log (
    id,
    season_id,
    draft_session_id,
    related_team_id,
    related_player_profile_id,
    action_type,
    action_label,
    details
  )
  values (
    v_id,
    v_season_id,
    p_draft_session_id,
    p_related_team_id,
    p_related_player_profile_id,
    p_action_type,
    p_action_label,
    coalesce(p_details, '{}'::jsonb)
  );

  return v_id;
end;
$$;

create or replace function public.epl_set_player_pipeline_status(
  p_application_id uuid,
  p_application_status text default null,
  p_registration_status text default null,
  p_draft_eligible boolean default null,
  p_player_status text default null,
  p_waived_fee boolean default null
)
returns void
language plpgsql
as $$
declare
  v_player_profile_id uuid;
begin
  if p_application_status is not null then
    update epl.player_applications
    set status = p_application_status
    where id = p_application_id;
  end if;

  update epl.season_registrations
  set
    registration_status = coalesce(p_registration_status, registration_status),
    player_status = coalesce(p_player_status, player_status),
    waived_fee = coalesce(p_waived_fee, waived_fee),
    paid_at = case
      when p_registration_status = 'paid' and paid_at is null then timezone('utc', now())
      else paid_at
    end
  where application_id = p_application_id;

  select player_profile_id into v_player_profile_id
  from epl.player_applications
  where id = p_application_id;

  if v_player_profile_id is not null then
    update epl.player_profiles
    set
      is_draft_eligible = coalesce(p_draft_eligible, is_draft_eligible),
      status = coalesce(p_player_status, status)
    where id = v_player_profile_id;
  end if;
end;
$$;

create or replace function public.epl_create_staff_assignment(
  p_staff_application_id uuid,
  p_role_id uuid,
  p_compensation_tier text,
  p_pay_rate_usd integer default null,
  p_stipend_usd integer default null,
  p_can_access_admin boolean default false,
  p_can_access_draft_console boolean default false,
  p_can_access_scanner boolean default false,
  p_can_access_finance boolean default false
)
returns uuid
language plpgsql
as $$
declare
  v_app epl.staff_applications%rowtype;
  v_role epl.staff_roles_catalog%rowtype;
  v_id uuid := gen_random_uuid();
begin
  select * into v_app from epl.staff_applications where id = p_staff_application_id;
  select * into v_role from epl.staff_roles_catalog where id = p_role_id;

  if v_app.id is null or v_role.id is null then
    raise exception 'Staff application or role not found';
  end if;

  insert into epl.season_staff_assignments (
    id,
    league_id,
    season_id,
    staff_application_id,
    role_id,
    assignment_status,
    compensation_tier,
    pay_rate_usd,
    stipend_usd,
    access_scope,
    can_access_admin,
    can_access_draft_console,
    can_access_scanner,
    can_access_finance
  )
  values (
    v_id,
    v_app.league_id,
    coalesce(v_app.season_id, (select id from epl.seasons order by created_at asc limit 1)),
    v_app.id,
    v_role.id,
    'assigned',
    coalesce(p_compensation_tier, 'volunteer'),
    p_pay_rate_usd,
    p_stipend_usd,
    v_role.default_access_scope,
    p_can_access_admin,
    p_can_access_draft_console,
    p_can_access_scanner,
    p_can_access_finance
  );

  update epl.staff_applications
  set status = 'assigned'
  where id = v_app.id;

  return v_id;
end;
$$;

create or replace function public.epl_create_opportunity(
  p_role_code text,
  p_title text,
  p_department text,
  p_opportunity_type text,
  p_summary text,
  p_description text,
  p_requirements jsonb default '[]'::jsonb,
  p_perks jsonb default '[]'::jsonb,
  p_pay_label text default null,
  p_display_order integer default 100
)
returns uuid
language plpgsql
as $$
declare
  v_league_id uuid;
  v_season_id uuid;
  v_id uuid := gen_random_uuid();
begin
  select id into v_league_id from epl.leagues where slug = 'epl' limit 1;
  select id into v_season_id from epl.seasons where slug = 'season-1' limit 1;

  insert into epl.opportunities (
    id, league_id, season_id, role_code, title, department, opportunity_type, summary,
    description, requirements, perks, pay_label, display_order
  )
  values (
    v_id, v_league_id, v_season_id, p_role_code, p_title, p_department, p_opportunity_type,
    p_summary, p_description, coalesce(p_requirements, '[]'::jsonb), coalesce(p_perks, '[]'::jsonb),
    p_pay_label, coalesce(p_display_order, 100)
  );

  return v_id;
end;
$$;

create or replace function public.epl_create_revenue_entry(
  p_season_slug text,
  p_stream_code text,
  p_money_direction text,
  p_amount_usd integer,
  p_memo text default null
)
returns uuid
language plpgsql
as $$
declare
  v_season epl.seasons%rowtype;
  v_id uuid := gen_random_uuid();
begin
  select * into v_season from epl.seasons where slug = p_season_slug;
  if v_season.id is null then
    raise exception 'Season not found';
  end if;

  insert into epl.revenue_ledger (id, league_id, season_id, stream_code, money_direction, amount_usd, memo)
  values (v_id, v_season.league_id, v_season.id, p_stream_code, p_money_direction, p_amount_usd, p_memo);

  return v_id;
end;
$$;

create or replace function public.epl_create_sponsor_partner(
  p_season_slug text,
  p_company_name text,
  p_contact_name text default null,
  p_contact_email text default null,
  p_package_name text default null,
  p_cash_value_usd integer default 0,
  p_in_kind_value_usd integer default 0,
  p_notes text default null
)
returns uuid
language plpgsql
as $$
declare
  v_season epl.seasons%rowtype;
  v_id uuid := gen_random_uuid();
begin
  select * into v_season from epl.seasons where slug = p_season_slug;
  if v_season.id is null then
    raise exception 'Season not found';
  end if;

  insert into epl.sponsor_partners (
    id, league_id, season_id, company_name, contact_name, contact_email, package_name,
    cash_value_usd, in_kind_value_usd, notes
  )
  values (
    v_id, v_season.league_id, v_season.id, p_company_name, p_contact_name, p_contact_email, p_package_name,
    coalesce(p_cash_value_usd, 0), coalesce(p_in_kind_value_usd, 0), p_notes
  );

  return v_id;
end;
$$;

create or replace function public.epl_create_merch_item(
  p_season_slug text,
  p_sku text,
  p_item_name text,
  p_item_type text,
  p_price_usd integer,
  p_cost_usd integer default 0,
  p_inventory_count integer default 0
)
returns uuid
language plpgsql
as $$
declare
  v_season epl.seasons%rowtype;
  v_id uuid := gen_random_uuid();
begin
  select * into v_season from epl.seasons where slug = p_season_slug;
  if v_season.id is null then
    raise exception 'Season not found';
  end if;

  insert into epl.merch_catalog (
    id, league_id, season_id, sku, item_name, item_type, price_usd, cost_usd, inventory_count
  )
  values (
    v_id, v_season.league_id, v_season.id, p_sku, p_item_name, p_item_type,
    coalesce(p_price_usd, 0), coalesce(p_cost_usd, 0), coalesce(p_inventory_count, 0)
  );

  return v_id;
end;
$$;

create or replace function public.epl_create_add_on(
  p_season_slug text,
  p_code text,
  p_item_name text,
  p_description text default null,
  p_price_usd integer default 0,
  p_fulfillment_type text default 'digital'
)
returns uuid
language plpgsql
as $$
declare
  v_season epl.seasons%rowtype;
  v_id uuid := gen_random_uuid();
begin
  select * into v_season from epl.seasons where slug = p_season_slug;
  if v_season.id is null then
    raise exception 'Season not found';
  end if;

  insert into epl.add_on_catalog (
    id, league_id, season_id, code, item_name, description, price_usd, fulfillment_type
  )
  values (
    v_id, v_season.league_id, v_season.id, p_code, p_item_name, p_description,
    coalesce(p_price_usd, 0), coalesce(p_fulfillment_type, 'digital')
  );

  return v_id;
end;
$$;

create or replace function public.epl_generate_random_draft_session(
  p_season_slug text,
  p_title text default null,
  p_snake boolean default true,
  p_auto_interval_seconds integer default 8
)
returns uuid
language plpgsql
as $$
declare
  v_season epl.seasons%rowtype;
  v_session_id uuid := gen_random_uuid();
  v_team_count integer;
  v_rounds integer := 9;
begin
  select * into v_season from epl.seasons where slug = p_season_slug;
  if v_season.id is null then
    raise exception 'Season not found';
  end if;

  insert into epl.draft_sessions (
    id, season_id, title, status, current_pick_number, total_picks, snake_mode, auto_mode, auto_interval_seconds
  )
  select
    v_session_id,
    v_season.id,
    coalesce(p_title, coalesce(v_season.draft_event_title, v_season.name || ' Draft')),
    'ready',
    0,
    greatest(count(*) * v_rounds, 1),
    coalesce(p_snake, true),
    false,
    coalesce(p_auto_interval_seconds, 8)
  from epl.teams
  where season_id = v_season.id;

  select count(*) into v_team_count from epl.teams where season_id = v_season.id;
  if coalesce(v_team_count, 0) = 0 then
    raise exception 'No teams found for season %', p_season_slug;
  end if;

  insert into epl.draft_picks (
    draft_session_id, season_id, team_id, round_number, pick_number_in_round, overall_pick_number, player_profile_id, selection_method
  )
  with rounds as (
    select generate_series(1, v_rounds) as round_number
  ),
  ordered_teams as (
    select
      id as team_id,
      row_number() over (order by coalesce(draft_order, 999), team_name, id) as seed
    from epl.teams
    where season_id = v_season.id
  ),
  eligible_players as (
    select
      sr.player_profile_id,
      row_number() over (
        order by
          coalesce(sr.paid_at, sr.created_at, timezone('utc', now())),
          pp.last_name,
          pp.first_name
      ) as rn
    from epl.season_registrations sr
    join epl.player_profiles pp on pp.id = sr.player_profile_id
    where sr.season_id = v_season.id
      and sr.registration_status in ('approved', 'paid', 'pending_payment')
      and pp.is_draft_eligible = true
  ),
  planned_picks as (
    select
      ot.team_id,
      r.round_number,
      case
        when coalesce(p_snake, true) = true and mod(r.round_number, 2) = 0
          then (v_team_count - ot.seed + 1)
        else ot.seed
      end as pick_number_in_round
    from rounds r
    cross join ordered_teams ot
  ),
  sequenced as (
    select
      team_id,
      round_number,
      pick_number_in_round,
      row_number() over (order by round_number, pick_number_in_round) as overall_pick_number
    from planned_picks
  )
  select
    v_session_id,
    v_season.id,
    s.team_id,
    s.round_number,
    s.pick_number_in_round,
    s.overall_pick_number,
    ep.player_profile_id,
    'random'
  from sequenced s
  left join eligible_players ep on ep.rn = s.overall_pick_number
  order by s.overall_pick_number;

  perform public.epl_log_draft_action(
    p_season_slug,
    'session',
    'Draft Session Generated',
    v_session_id,
    null,
    null,
    jsonb_build_object('snake_mode', p_snake, 'auto_interval_seconds', p_auto_interval_seconds)
  );

  return v_session_id;
end;
$$;

create or replace function public.epl_reset_draft_for_season(p_season_slug text)
returns void
language plpgsql
as $$
declare
  v_season_id uuid;
begin
  select id into v_season_id from epl.seasons where slug = p_season_slug limit 1;
  if v_season_id is null then
    return;
  end if;

  delete from epl.draft_action_log where season_id = v_season_id;
  delete from epl.draft_trades where season_id = v_season_id;
  delete from epl.draft_picks where season_id = v_season_id;
  delete from epl.draft_sessions where season_id = v_season_id;
end;
$$;

create or replace function public.epl_add_team_war_room_note(
  p_season_slug text,
  p_team_id uuid,
  p_note text
)
returns uuid
language plpgsql
as $$
declare
  v_season_id uuid;
  v_id uuid := gen_random_uuid();
begin
  select id into v_season_id from epl.seasons where slug = p_season_slug limit 1;
  if v_season_id is null then
    raise exception 'Season not found';
  end if;

  insert into epl.team_war_room_notes (id, season_id, team_id, note)
  values (v_id, v_season_id, p_team_id, p_note);
  return v_id;
end;
$$;

create or replace function public.epl_add_player_scouting_note(
  p_season_slug text,
  p_player_profile_id uuid,
  p_note text,
  p_grade text default null,
  p_tags jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
as $$
declare
  v_season_id uuid;
  v_id uuid := gen_random_uuid();
begin
  select id into v_season_id from epl.seasons where slug = p_season_slug limit 1;
  if v_season_id is null then
    raise exception 'Season not found';
  end if;

  insert into epl.player_scouting_notes (id, season_id, player_profile_id, note, grade, tags)
  values (v_id, v_season_id, p_player_profile_id, p_note, p_grade, coalesce(p_tags, '[]'::jsonb));
  return v_id;
end;
$$;

create or replace function public.epl_set_player_draft_eligibility(
  p_season_slug text,
  p_player_profile_id uuid,
  p_is_eligible boolean,
  p_reason text default null
)
returns void
language plpgsql
as $$
begin
  update epl.player_profiles
  set
    is_draft_eligible = p_is_eligible,
    draft_eligibility_reason = p_reason
  where id = p_player_profile_id;
end;
$$;

create or replace function public.epl_manual_assign_pick_player(
  p_draft_pick_id uuid,
  p_player_profile_id uuid,
  p_note text default null
)
returns void
language plpgsql
as $$
begin
  update epl.draft_picks
  set
    player_profile_id = p_player_profile_id,
    selection_method = 'manual',
    selection_note = p_note
  where id = p_draft_pick_id;
end;
$$;

create or replace function public.epl_swap_draft_picks(
  p_pick_a uuid,
  p_pick_b uuid,
  p_note text default null
)
returns void
language plpgsql
as $$
declare
  v_team_a uuid;
  v_team_b uuid;
begin
  select team_id into v_team_a from epl.draft_picks where id = p_pick_a;
  select team_id into v_team_b from epl.draft_picks where id = p_pick_b;

  update epl.draft_picks
  set team_id = case when id = p_pick_a then v_team_b else v_team_a end,
      is_trade_acquired = true,
      selection_note = coalesce(selection_note, p_note)
  where id in (p_pick_a, p_pick_b);
end;
$$;

create or replace function public.epl_propose_trade(
  p_season_slug text,
  p_draft_session_id uuid,
  p_from_team_id uuid,
  p_to_team_id uuid,
  p_from_pick_id uuid default null,
  p_to_pick_id uuid default null,
  p_notes text default null
)
returns uuid
language plpgsql
as $$
declare
  v_season_id uuid;
  v_id uuid := gen_random_uuid();
begin
  select id into v_season_id from epl.seasons where slug = p_season_slug limit 1;
  if v_season_id is null then
    raise exception 'Season not found';
  end if;

  insert into epl.draft_trades (
    id, season_id, draft_session_id, from_team_id, to_team_id, from_pick_id, to_pick_id, notes
  )
  values (
    v_id, v_season_id, p_draft_session_id, p_from_team_id, p_to_team_id, p_from_pick_id, p_to_pick_id, p_notes
  );

  return v_id;
end;
$$;

create or replace function public.epl_resolve_trade(
  p_trade_id uuid,
  p_resolution text,
  p_note text default null
)
returns void
language plpgsql
as $$
declare
  v_trade epl.draft_trades%rowtype;
begin
  select * into v_trade from epl.draft_trades where id = p_trade_id;
  if v_trade.id is null then
    raise exception 'Trade not found';
  end if;

  update epl.draft_trades
  set
    status = p_resolution,
    resolution_note = p_note
  where id = p_trade_id;

  if p_resolution = 'accepted' and v_trade.from_pick_id is not null and v_trade.to_pick_id is not null then
    perform public.epl_swap_draft_picks(v_trade.from_pick_id, v_trade.to_pick_id, p_note);
  end if;
end;
$$;

create or replace function public.epl_set_production_state(
  p_session_id uuid,
  p_state text,
  p_message text default null,
  p_sponsor_message text default null,
  p_reveal_duration_ms integer default null
)
returns void
language plpgsql
as $$
begin
  update epl.draft_sessions
  set
    production_state = coalesce(p_state, production_state),
    production_message = p_message,
    sponsor_message = p_sponsor_message,
    reveal_duration_ms = coalesce(p_reveal_duration_ms, reveal_duration_ms)
  where id = p_session_id;
end;
$$;
