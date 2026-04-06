begin;

create extension if not exists pgcrypto;
create schema if not exists epl;

do $$
begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace where t.typname = 'epl_league_status' and n.nspname = 'epl') then
    create type epl.epl_league_status as enum ('draft', 'active', 'paused', 'completed', 'archived');
  end if;

  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace where t.typname = 'epl_season_status' and n.nspname = 'epl') then
    create type epl.epl_season_status as enum ('planning', 'registration_open', 'registration_closed', 'draft_ready', 'drafted', 'in_season', 'playoffs', 'championship', 'completed', 'archived');
  end if;

  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace where t.typname = 'epl_sport_type' and n.nspname = 'epl') then
    create type epl.epl_sport_type as enum ('flag_football');
  end if;

  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace where t.typname = 'epl_team_status' and n.nspname = 'epl') then
    create type epl.epl_team_status as enum ('draft', 'active', 'inactive', 'archived');
  end if;

  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace where t.typname = 'epl_application_status' and n.nspname = 'epl') then
    create type epl.epl_application_status as enum ('submitted', 'reviewing', 'approved', 'waitlisted', 'declined', 'withdrawn');
  end if;

  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace where t.typname = 'epl_registration_status' and n.nspname = 'epl') then
    create type epl.epl_registration_status as enum ('pending_payment', 'paid', 'approved', 'waitlisted', 'declined', 'cancelled', 'refunded');
  end if;

  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace where t.typname = 'epl_player_status' and n.nspname = 'epl') then
    create type epl.epl_player_status as enum ('prospect', 'draft_pool', 'drafted', 'active', 'inactive', 'suspended', 'released', 'archived');
  end if;

  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace where t.typname = 'epl_staff_role' and n.nspname = 'epl') then
    create type epl.epl_staff_role as enum ('commissioner', 'league_ops', 'team_manager', 'coach', 'assistant_coach', 'referee', 'stat_keeper', 'photographer', 'videographer', 'media', 'security', 'trainer', 'volunteer');
  end if;

  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace where t.typname = 'epl_game_status' and n.nspname = 'epl') then
    create type epl.epl_game_status as enum ('scheduled', 'ready', 'live', 'final', 'postponed', 'cancelled', 'forfeit');
  end if;

  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace where t.typname = 'epl_game_type' and n.nspname = 'epl') then
    create type epl.epl_game_type as enum ('scrimmage', 'preseason', 'regular_season', 'playoff', 'championship', 'all_star', 'showcase');
  end if;

  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace where t.typname = 'epl_draft_status' and n.nspname = 'epl') then
    create type epl.epl_draft_status as enum ('not_eligible', 'eligible', 'drafted', 'undrafted', 'removed');
  end if;

  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace where t.typname = 'epl_event_link_type' and n.nspname = 'epl') then
    create type epl.epl_event_link_type as enum ('registration', 'draft', 'game', 'combine', 'media_day', 'gala', 'other');
  end if;
end
$$;

create table if not exists epl.leagues (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  display_name text not null,
  sport_type epl.epl_sport_type not null default 'flag_football',
  city_id uuid null,
  description text null,
  logo_url text null,
  cover_image_url text null,
  primary_color text null,
  secondary_color text null,
  accent_color text null,
  status epl.epl_league_status not null default 'draft',
  is_public boolean not null default false,
  sort_order integer not null default 0,
  settings jsonb not null default '{}'::jsonb,
  created_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists epl.seasons (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references epl.leagues(id) on delete cascade,
  slug text not null,
  name text not null,
  display_name text not null,
  season_number integer null,
  status epl.epl_season_status not null default 'planning',
  registration_open_at timestamptz null,
  registration_close_at timestamptz null,
  draft_at timestamptz null,
  opening_day_at timestamptz null,
  playoffs_start_at timestamptz null,
  championship_at timestamptz null,
  gala_at timestamptz null,
  start_date date null,
  end_date date null,
  max_teams integer null,
  target_players integer null,
  player_fee_cents integer not null default 9500 check (player_fee_cents >= 0),
  notes text null,
  settings jsonb not null default '{}'::jsonb,
  is_public boolean not null default false,
  created_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (league_id, slug)
);

create table if not exists epl.teams (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references epl.leagues(id) on delete cascade,
  season_id uuid not null references epl.seasons(id) on delete cascade,
  slug text not null,
  name text not null,
  short_name text null,
  display_name text not null,
  city_name text null,
  status epl.epl_team_status not null default 'draft',
  logo_url text null,
  wordmark_url text null,
  banner_url text null,
  primary_color text null,
  secondary_color text null,
  accent_color text null,
  home_venue_id uuid null,
  founded_year integer null,
  sort_order integer not null default 0,
  captain_player_id uuid null,
  is_public boolean not null default true,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (season_id, slug)
);

create table if not exists epl.team_staff (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references epl.teams(id) on delete cascade,
  season_id uuid not null references epl.seasons(id) on delete cascade,
  user_id uuid null references auth.users(id) on delete set null,
  full_name text not null,
  email text null,
  phone text null,
  role epl.epl_staff_role not null,
  is_primary boolean not null default false,
  status text not null default 'active',
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists epl.player_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null references auth.users(id) on delete set null,
  first_name text not null,
  last_name text not null,
  email text null,
  phone text null,
  birth_date date null,
  age integer null,
  hometown text null,
  height_text text null,
  weight_text text null,
  dominant_hand text null,
  preferred_position text null,
  secondary_position text null,
  jersey_name text null,
  jersey_number integer null,
  instagram_handle text null,
  tiktok_handle text null,
  emergency_contact_name text null,
  emergency_contact_phone text null,
  medical_notes text null,
  profile_image_url text null,
  highlights_url text null,
  bio text null,
  status epl.epl_player_status not null default 'prospect',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists epl.player_applications (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references epl.leagues(id) on delete cascade,
  season_id uuid not null references epl.seasons(id) on delete cascade,
  player_profile_id uuid null references epl.player_profiles(id) on delete set null,
  user_id uuid null references auth.users(id) on delete set null,
  source text null,
  application_number bigserial,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text null,
  age integer null,
  city text null,
  state text null,
  position_primary text null,
  position_secondary text null,
  experience_level text null,
  jersey_name_requested text null,
  payment_intent_id text null,
  event_id uuid null,
  notes text null,
  internal_notes text null,
  answers jsonb not null default '{}'::jsonb,
  status epl.epl_application_status not null default 'submitted',
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz null,
  reviewed_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_epl_player_applications_application_number
  on epl.player_applications (application_number);

create table if not exists epl.season_registrations (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references epl.leagues(id) on delete cascade,
  season_id uuid not null references epl.seasons(id) on delete cascade,
  player_profile_id uuid not null references epl.player_profiles(id) on delete cascade,
  application_id uuid null references epl.player_applications(id) on delete set null,
  registration_code text not null unique,
  registration_status epl.epl_registration_status not null default 'pending_payment',
  player_status epl.epl_player_status not null default 'prospect',
  team_id uuid null references epl.teams(id) on delete set null,
  payment_amount_cents integer not null default 0 check (payment_amount_cents >= 0),
  paid_at timestamptz null,
  approved_at timestamptz null,
  approved_by uuid null references auth.users(id) on delete set null,
  waived_fee boolean not null default false,
  check_in_eligible boolean not null default false,
  is_captain boolean not null default false,
  is_featured boolean not null default false,
  notes text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (season_id, player_profile_id)
);

create table if not exists epl.draft_boards (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references epl.leagues(id) on delete cascade,
  season_id uuid not null references epl.seasons(id) on delete cascade,
  name text not null,
  status text not null default 'draft',
  is_active boolean not null default false,
  draft_at timestamptz null,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists epl.draft_pool (
  id uuid primary key default gen_random_uuid(),
  draft_board_id uuid not null references epl.draft_boards(id) on delete cascade,
  season_registration_id uuid not null references epl.season_registrations(id) on delete cascade,
  player_profile_id uuid not null references epl.player_profiles(id) on delete cascade,
  draft_status epl.epl_draft_status not null default 'eligible',
  overall_rank integer null,
  position_rank integer null,
  scouting_grade numeric(5,2) null,
  scouting_notes text null,
  is_combine_complete boolean not null default false,
  is_media_ready boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (draft_board_id, season_registration_id)
);

create table if not exists epl.draft_rounds (
  id uuid primary key default gen_random_uuid(),
  draft_board_id uuid not null references epl.draft_boards(id) on delete cascade,
  round_number integer not null check (round_number > 0),
  label text null,
  created_at timestamptz not null default now(),
  unique (draft_board_id, round_number)
);

create table if not exists epl.draft_picks (
  id uuid primary key default gen_random_uuid(),
  draft_board_id uuid not null references epl.draft_boards(id) on delete cascade,
  draft_round_id uuid null references epl.draft_rounds(id) on delete set null,
  team_id uuid not null references epl.teams(id) on delete cascade,
  season_registration_id uuid not null references epl.season_registrations(id) on delete cascade,
  player_profile_id uuid not null references epl.player_profiles(id) on delete cascade,
  round_number integer not null,
  pick_number_in_round integer not null,
  overall_pick_number integer not null,
  announced_at timestamptz null,
  announced_by uuid null references auth.users(id) on delete set null,
  notes text null,
  created_at timestamptz not null default now(),
  unique (draft_board_id, overall_pick_number),
  unique (draft_board_id, season_registration_id)
);

create table if not exists epl.games (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references epl.leagues(id) on delete cascade,
  season_id uuid not null references epl.seasons(id) on delete cascade,
  event_id uuid null,
  slug text not null,
  title text not null,
  game_type epl.epl_game_type not null default 'regular_season',
  status epl.epl_game_status not null default 'scheduled',
  week_number integer null,
  game_number integer null,
  home_team_id uuid not null references epl.teams(id) on delete cascade,
  away_team_id uuid not null references epl.teams(id) on delete cascade,
  venue_id uuid null,
  field_name text null,
  scheduled_at timestamptz null,
  check_in_open_at timestamptz null,
  kickoff_at timestamptz null,
  end_at timestamptz null,
  home_score integer not null default 0,
  away_score integer not null default 0,
  winner_team_id uuid null references epl.teams(id) on delete set null,
  attendance_count integer not null default 0,
  ticket_price_cents integer null check (ticket_price_cents is null or ticket_price_cents >= 0),
  livestream_url text null,
  notes text null,
  internal_notes text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (season_id, slug),
  constraint games_teams_different check (home_team_id <> away_team_id)
);

create table if not exists epl.game_staff_assignments (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references epl.games(id) on delete cascade,
  user_id uuid null references auth.users(id) on delete set null,
  full_name text not null,
  role epl.epl_staff_role not null,
  team_id uuid null references epl.teams(id) on delete set null,
  status text not null default 'assigned',
  check_in_status text not null default 'pending',
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists epl.game_player_assignments (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references epl.games(id) on delete cascade,
  season_registration_id uuid not null references epl.season_registrations(id) on delete cascade,
  player_profile_id uuid not null references epl.player_profiles(id) on delete cascade,
  team_id uuid not null references epl.teams(id) on delete cascade,
  is_active boolean not null default true,
  is_starting boolean not null default false,
  jersey_number integer null,
  check_in_status text not null default 'pending',
  availability_status text not null default 'expected',
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (game_id, season_registration_id)
);

create table if not exists epl.team_standings (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references epl.leagues(id) on delete cascade,
  season_id uuid not null references epl.seasons(id) on delete cascade,
  team_id uuid not null references epl.teams(id) on delete cascade,
  games_played integer not null default 0,
  wins integer not null default 0,
  losses integer not null default 0,
  ties integer not null default 0,
  points_for integer not null default 0,
  points_against integer not null default 0,
  point_diff integer not null default 0,
  win_pct numeric(6,3) not null default 0,
  streak_type text null,
  streak_count integer not null default 0,
  rank integer null,
  updated_at timestamptz not null default now(),
  unique (season_id, team_id)
);

create table if not exists epl.player_game_stats (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references epl.games(id) on delete cascade,
  season_id uuid not null references epl.seasons(id) on delete cascade,
  team_id uuid not null references epl.teams(id) on delete cascade,
  player_profile_id uuid not null references epl.player_profiles(id) on delete cascade,
  season_registration_id uuid null references epl.season_registrations(id) on delete set null,
  passing_tds integer not null default 0,
  rushing_tds integer not null default 0,
  receiving_tds integer not null default 0,
  interceptions integer not null default 0,
  flag_pulls integer not null default 0,
  sacks integer not null default 0,
  extra_points integer not null default 0,
  passing_yards integer not null default 0,
  rushing_yards integer not null default 0,
  receiving_yards integer not null default 0,
  completions integer not null default 0,
  pass_attempts integer not null default 0,
  receptions integer not null default 0,
  targets integer not null default 0,
  carries integer not null default 0,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (game_id, player_profile_id)
);

create table if not exists epl.event_links (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references epl.leagues(id) on delete cascade,
  season_id uuid null references epl.seasons(id) on delete cascade,
  event_id uuid not null,
  link_type epl.epl_event_link_type not null,
  game_id uuid null references epl.games(id) on delete cascade,
  draft_board_id uuid null references epl.draft_boards(id) on delete cascade,
  notes text null,
  created_at timestamptz not null default now(),
  unique (event_id, link_type)
);

create index if not exists idx_epl_leagues_city_id on epl.leagues(city_id);
create index if not exists idx_epl_seasons_league_id on epl.seasons(league_id);
create index if not exists idx_epl_teams_season_id on epl.teams(season_id);
create index if not exists idx_epl_teams_league_id on epl.teams(league_id);
create index if not exists idx_epl_player_profiles_user_id on epl.player_profiles(user_id);
create index if not exists idx_epl_player_applications_season_id on epl.player_applications(season_id);
create index if not exists idx_epl_player_applications_status on epl.player_applications(status);
create index if not exists idx_epl_season_registrations_season_id on epl.season_registrations(season_id);
create index if not exists idx_epl_season_registrations_team_id on epl.season_registrations(team_id);
create index if not exists idx_epl_draft_pool_board_id on epl.draft_pool(draft_board_id);
create index if not exists idx_epl_games_season_id on epl.games(season_id);
create index if not exists idx_epl_games_status on epl.games(status);
create index if not exists idx_epl_games_scheduled_at on epl.games(scheduled_at);
create index if not exists idx_epl_game_staff_assignments_game_id on epl.game_staff_assignments(game_id);
create index if not exists idx_epl_game_player_assignments_game_id on epl.game_player_assignments(game_id);
create index if not exists idx_epl_team_standings_season_id on epl.team_standings(season_id);
create index if not exists idx_epl_player_game_stats_game_id on epl.player_game_stats(game_id);

create or replace function epl.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_epl_leagues_updated_at on epl.leagues;
create trigger trg_epl_leagues_updated_at before update on epl.leagues
for each row execute function epl.set_updated_at();

drop trigger if exists trg_epl_seasons_updated_at on epl.seasons;
create trigger trg_epl_seasons_updated_at before update on epl.seasons
for each row execute function epl.set_updated_at();

drop trigger if exists trg_epl_teams_updated_at on epl.teams;
create trigger trg_epl_teams_updated_at before update on epl.teams
for each row execute function epl.set_updated_at();

drop trigger if exists trg_epl_team_staff_updated_at on epl.team_staff;
create trigger trg_epl_team_staff_updated_at before update on epl.team_staff
for each row execute function epl.set_updated_at();

drop trigger if exists trg_epl_player_profiles_updated_at on epl.player_profiles;
create trigger trg_epl_player_profiles_updated_at before update on epl.player_profiles
for each row execute function epl.set_updated_at();

drop trigger if exists trg_epl_player_applications_updated_at on epl.player_applications;
create trigger trg_epl_player_applications_updated_at before update on epl.player_applications
for each row execute function epl.set_updated_at();

drop trigger if exists trg_epl_season_registrations_updated_at on epl.season_registrations;
create trigger trg_epl_season_registrations_updated_at before update on epl.season_registrations
for each row execute function epl.set_updated_at();

drop trigger if exists trg_epl_draft_boards_updated_at on epl.draft_boards;
create trigger trg_epl_draft_boards_updated_at before update on epl.draft_boards
for each row execute function epl.set_updated_at();

drop trigger if exists trg_epl_draft_pool_updated_at on epl.draft_pool;
create trigger trg_epl_draft_pool_updated_at before update on epl.draft_pool
for each row execute function epl.set_updated_at();

drop trigger if exists trg_epl_games_updated_at on epl.games;
create trigger trg_epl_games_updated_at before update on epl.games
for each row execute function epl.set_updated_at();

drop trigger if exists trg_epl_game_staff_assignments_updated_at on epl.game_staff_assignments;
create trigger trg_epl_game_staff_assignments_updated_at before update on epl.game_staff_assignments
for each row execute function epl.set_updated_at();

drop trigger if exists trg_epl_game_player_assignments_updated_at on epl.game_player_assignments;
create trigger trg_epl_game_player_assignments_updated_at before update on epl.game_player_assignments
for each row execute function epl.set_updated_at();

drop trigger if exists trg_epl_player_game_stats_updated_at on epl.player_game_stats;
create trigger trg_epl_player_game_stats_updated_at before update on epl.player_game_stats
for each row execute function epl.set_updated_at();

create or replace function epl.generate_registration_code()
returns text
language plpgsql
as $$
declare
  code text;
begin
  code := 'EPL-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  return code;
end;
$$;

create or replace function epl.set_registration_code()
returns trigger
language plpgsql
as $$
begin
  if new.registration_code is null or new.registration_code = '' then
    new.registration_code := epl.generate_registration_code();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_epl_set_registration_code on epl.season_registrations;
create trigger trg_epl_set_registration_code
before insert on epl.season_registrations
for each row execute function epl.set_registration_code();

create or replace function epl.sync_team_from_draft_pick()
returns trigger
language plpgsql
as $$
begin
  update epl.season_registrations
     set team_id = new.team_id,
         player_status = 'drafted',
         updated_at = now()
   where id = new.season_registration_id;

  update epl.player_profiles
     set status = 'drafted',
         updated_at = now()
   where id = new.player_profile_id;

  return new;
end;
$$;

drop trigger if exists trg_epl_sync_team_from_draft_pick on epl.draft_picks;
create trigger trg_epl_sync_team_from_draft_pick
after insert on epl.draft_picks
for each row execute function epl.sync_team_from_draft_pick();

create or replace function epl.ensure_standing_row_for_team()
returns trigger
language plpgsql
as $$
begin
  insert into epl.team_standings (league_id, season_id, team_id)
  values (new.league_id, new.season_id, new.id)
  on conflict (season_id, team_id) do nothing;

  return new;
end;
$$;

drop trigger if exists trg_epl_ensure_standing_row_for_team on epl.teams;
create trigger trg_epl_ensure_standing_row_for_team
after insert on epl.teams
for each row execute function epl.ensure_standing_row_for_team();

create or replace function epl.rebuild_standings(p_season_id uuid)
returns void
language plpgsql
as $$
begin
  insert into epl.team_standings (league_id, season_id, team_id)
  select t.league_id, t.season_id, t.id
  from epl.teams t
  where t.season_id = p_season_id
  on conflict (season_id, team_id) do nothing;

  update epl.team_standings s
     set games_played = x.games_played,
         wins = x.wins,
         losses = x.losses,
         ties = x.ties,
         points_for = x.points_for,
         points_against = x.points_against,
         point_diff = x.points_for - x.points_against,
         win_pct = case
                     when x.games_played = 0 then 0
                     else round(((x.wins::numeric + (x.ties::numeric * 0.5)) / x.games_played::numeric), 3)
                   end,
         updated_at = now()
    from (
      select
        t.id as team_id,
        t.season_id,
        count(g.id) filter (where g.status = 'final') as games_played,
        count(g.id) filter (
          where g.status = 'final'
            and (
              (g.home_team_id = t.id and g.home_score > g.away_score)
              or
              (g.away_team_id = t.id and g.away_score > g.home_score)
            )
        ) as wins,
        count(g.id) filter (
          where g.status = 'final'
            and (
              (g.home_team_id = t.id and g.home_score < g.away_score)
              or
              (g.away_team_id = t.id and g.away_score < g.home_score)
            )
        ) as losses,
        count(g.id) filter (
          where g.status = 'final'
            and g.home_score = g.away_score
        ) as ties,
        coalesce(sum(
          case
            when g.home_team_id = t.id then g.home_score
            when g.away_team_id = t.id then g.away_score
            else 0
          end
        ) filter (where g.status = 'final'), 0) as points_for,
        coalesce(sum(
          case
            when g.home_team_id = t.id then g.away_score
            when g.away_team_id = t.id then g.home_score
            else 0
          end
        ) filter (where g.status = 'final'), 0) as points_against
      from epl.teams t
      left join epl.games g
        on g.season_id = t.season_id
       and (g.home_team_id = t.id or g.away_team_id = t.id)
      where t.season_id = p_season_id
      group by t.id, t.season_id
    ) x
   where s.season_id = x.season_id
     and s.team_id = x.team_id;

  with ranked as (
    select
      id,
      row_number() over (
        order by wins desc, point_diff desc, points_for desc, updated_at asc
      ) as new_rank
    from epl.team_standings
    where season_id = p_season_id
  )
  update epl.team_standings s
     set rank = r.new_rank
    from ranked r
   where s.id = r.id;
end;
$$;

create or replace function epl.rebuild_standings_from_game()
returns trigger
language plpgsql
as $$
begin
  perform epl.rebuild_standings(coalesce(new.season_id, old.season_id));
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_epl_rebuild_standings_from_game_insert on epl.games;
create trigger trg_epl_rebuild_standings_from_game_insert
after insert or update or delete on epl.games
for each row execute function epl.rebuild_standings_from_game();

create or replace view epl.v_season_dashboard as
select
  s.id as season_id,
  s.league_id,
  l.name as league_name,
  s.name as season_name,
  s.display_name as season_display_name,
  s.status,
  s.start_date,
  s.end_date,
  s.registration_open_at,
  s.registration_close_at,
  s.draft_at,
  s.championship_at,
  coalesce((select count(*) from epl.teams t where t.season_id = s.id), 0) as team_count,
  coalesce((select count(*) from epl.player_applications a where a.season_id = s.id), 0) as application_count,
  coalesce((select count(*) from epl.season_registrations r where r.season_id = s.id), 0) as registration_count,
  coalesce((select count(*) from epl.season_registrations r where r.season_id = s.id and r.registration_status in ('paid','approved')), 0) as paid_or_approved_count,
  coalesce((select count(*) from epl.games g where g.season_id = s.id), 0) as game_count
from epl.seasons s
join epl.leagues l on l.id = s.league_id;

create or replace view epl.v_team_rosters as
select
  t.id as team_id,
  t.season_id,
  t.name as team_name,
  t.display_name as team_display_name,
  t.logo_url,
  r.id as registration_id,
  p.id as player_profile_id,
  trim(p.first_name || ' ' || p.last_name) as player_name,
  p.preferred_position,
  p.secondary_position,
  p.jersey_name,
  p.jersey_number,
  r.player_status,
  r.is_captain,
  r.is_featured
from epl.teams t
left join epl.season_registrations r on r.team_id = t.id
left join epl.player_profiles p on p.id = r.player_profile_id;

create or replace view epl.v_game_cards as
select
  g.id as game_id,
  g.season_id,
  g.slug,
  g.title,
  g.game_type,
  g.status,
  g.week_number,
  g.scheduled_at,
  g.kickoff_at,
  g.home_score,
  g.away_score,
  ht.display_name as home_team_name,
  ht.logo_url as home_team_logo_url,
  at.display_name as away_team_name,
  at.logo_url as away_team_logo_url,
  g.venue_id,
  g.field_name,
  g.ticket_price_cents,
  g.attendance_count
from epl.games g
join epl.teams ht on ht.id = g.home_team_id
join epl.teams at on at.id = g.away_team_id;

create or replace view epl.v_player_leaderboard as
select
  s.season_id,
  p.id as player_profile_id,
  trim(p.first_name || ' ' || p.last_name) as player_name,
  t.display_name as team_name,
  sum(s.passing_tds) as passing_tds,
  sum(s.rushing_tds) as rushing_tds,
  sum(s.receiving_tds) as receiving_tds,
  sum(s.interceptions) as interceptions,
  sum(s.flag_pulls) as flag_pulls,
  sum(s.sacks) as sacks,
  sum(s.passing_yards) as passing_yards,
  sum(s.rushing_yards) as rushing_yards,
  sum(s.receiving_yards) as receiving_yards
from epl.player_game_stats s
join epl.player_profiles p on p.id = s.player_profile_id
join epl.teams t on t.id = s.team_id
group by s.season_id, p.id, p.first_name, p.last_name, t.display_name;

insert into epl.leagues (
  slug, name, display_name, sport_type, status, is_public, primary_color, secondary_color, accent_color
)
values (
  'epl',
  'EVNTSZN Prime League',
  'EVNTSZN Prime League',
  'flag_football',
  'draft',
  false,
  '#000000',
  '#F5F5F5',
  '#A259FF'
)
on conflict (slug) do nothing;

insert into epl.seasons (
  league_id,
  slug,
  name,
  display_name,
  season_number,
  status,
  target_players,
  max_teams,
  player_fee_cents,
  is_public
)
select
  l.id,
  'season-1',
  'Season 1',
  'Season 1',
  1,
  'planning',
  90,
  6,
  9500,
  false
from epl.leagues l
where l.slug = 'epl'
on conflict (league_id, slug) do nothing;

commit;
