begin;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'epl_draft_session_status'
      and n.nspname = 'epl'
  ) then
    create type epl.epl_draft_session_status as enum (
      'setup',
      'ready',
      'live',
      'paused',
      'completed'
    );
  end if;
end
$$;

create table if not exists epl.draft_sessions (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references epl.leagues(id) on delete cascade,
  season_id uuid not null references epl.seasons(id) on delete cascade,
  draft_board_id uuid not null references epl.draft_boards(id) on delete cascade,
  title text not null,
  status epl.epl_draft_session_status not null default 'setup',
  current_pick_number integer not null default 0 check (current_pick_number >= 0),
  total_picks integer not null default 0 check (total_picks >= 0),
  auto_mode boolean not null default false,
  auto_interval_seconds integer not null default 8 check (auto_interval_seconds between 2 and 120),
  snake_mode boolean not null default true,
  random_team_order boolean not null default true,
  random_player_order boolean not null default true,
  started_at timestamptz null,
  paused_at timestamptz null,
  completed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_epl_draft_sessions_season_id on epl.draft_sessions(season_id);
create index if not exists idx_epl_draft_sessions_board_id on epl.draft_sessions(draft_board_id);

drop trigger if exists trg_epl_draft_sessions_updated_at on epl.draft_sessions;
create trigger trg_epl_draft_sessions_updated_at
before update on epl.draft_sessions
for each row execute function epl.set_updated_at();

create or replace view epl.v_draft_sessions as
select
  ds.id as draft_session_id,
  ds.league_id,
  ds.season_id,
  ds.draft_board_id,
  ds.title,
  ds.status,
  ds.current_pick_number,
  ds.total_picks,
  ds.auto_mode,
  ds.auto_interval_seconds,
  ds.snake_mode,
  ds.random_team_order,
  ds.random_player_order,
  ds.started_at,
  ds.paused_at,
  ds.completed_at,
  ds.created_at,
  ds.updated_at,
  s.name as season_name,
  s.slug as season_slug,
  l.name as league_name,
  l.slug as league_slug
from epl.draft_sessions ds
join epl.seasons s on s.id = ds.season_id
join epl.leagues l on l.id = ds.league_id;

create or replace view epl.v_draft_presentation_picks as
select
  ds.id as draft_session_id,
  ds.title as draft_title,
  ds.season_id,
  s.name as season_name,
  s.slug as season_slug,
  dp.id as draft_pick_id,
  dp.overall_pick_number,
  dp.round_number,
  dp.pick_number_in_round,
  t.id as team_id,
  t.display_name as team_name,
  t.logo_url as team_logo_url,
  pp.id as player_profile_id,
  trim(pp.first_name || ' ' || pp.last_name) as player_name,
  pp.preferred_position,
  pp.secondary_position,
  pp.jersey_name,
  pp.jersey_number,
  sr.id as season_registration_id
from epl.draft_sessions ds
join epl.draft_picks dp on dp.draft_board_id = ds.draft_board_id
join epl.teams t on t.id = dp.team_id
join epl.player_profiles pp on pp.id = dp.player_profile_id
join epl.season_registrations sr on sr.id = dp.season_registration_id
join epl.seasons s on s.id = ds.season_id;

create or replace view public.epl_v_draft_sessions as
select * from epl.v_draft_sessions;

create or replace view public.epl_v_draft_presentation_picks as
select * from epl.v_draft_presentation_picks;

grant select on public.epl_v_draft_sessions to anon, authenticated, service_role;
grant select on public.epl_v_draft_presentation_picks to anon, authenticated, service_role;

create or replace function public.epl_generate_random_draft_session(
  p_season_slug text,
  p_title text default null,
  p_snake boolean default true,
  p_auto_interval_seconds integer default 8
)
returns uuid
language plpgsql
security definer
set search_path = public, epl
as $$
declare
  v_league_id uuid;
  v_season_id uuid;
  v_board_id uuid;
  v_session_id uuid;
  v_title text;
  v_team_count integer;
  v_player_count integer;
  v_round_count integer;
  v_round_id uuid;
  v_team_slot integer;
  v_team_id uuid;
  v_registration_id uuid;
  v_player_profile_id uuid;
  v_overall integer := 0;
  v_round integer;
  v_slot integer;
begin
  select l.id, s.id, coalesce(p_title, s.name || ' Draft Night')
    into v_league_id, v_season_id, v_title
  from epl.seasons s
  join epl.leagues l on l.id = s.league_id
  where l.slug = 'epl'
    and s.slug = p_season_slug
  limit 1;

  if v_season_id is null then
    raise exception 'Season not found for slug %', p_season_slug;
  end if;

  create temporary table tmp_draft_teams (
    slot integer,
    team_id uuid
  ) on commit drop;

  insert into tmp_draft_teams (slot, team_id)
  select
    row_number() over (order by gen_random_uuid()) as slot,
    t.id
  from epl.teams t
  where t.season_id = v_season_id
    and t.status in ('draft', 'active');

  select count(*) into v_team_count from tmp_draft_teams;

  if v_team_count = 0 then
    raise exception 'No teams found for season %', p_season_slug;
  end if;

  create temporary table tmp_draft_players (
    rn integer,
    season_registration_id uuid,
    player_profile_id uuid
  ) on commit drop;

  insert into tmp_draft_players (rn, season_registration_id, player_profile_id)
  select
    row_number() over (order by gen_random_uuid()) as rn,
    sr.id,
    sr.player_profile_id
  from epl.season_registrations sr
  where sr.season_id = v_season_id
    and sr.team_id is null
    and (
      sr.registration_status in ('paid', 'approved')
      or sr.player_status = 'draft_pool'
    );

  select count(*) into v_player_count from tmp_draft_players;

  if v_player_count = 0 then
    raise exception 'No eligible players found for season %', p_season_slug;
  end if;

  v_round_count := ceil(v_player_count::numeric / v_team_count::numeric);

  insert into epl.draft_boards (
    league_id,
    season_id,
    name,
    status,
    is_active,
    draft_at,
    notes
  )
  values (
    v_league_id,
    v_season_id,
    v_title,
    'ready',
    true,
    now(),
    'Auto-generated random draft board'
  )
  returning id into v_board_id;

  for v_round in 1..v_round_count loop
    insert into epl.draft_rounds (
      draft_board_id,
      round_number,
      label
    )
    values (
      v_board_id,
      v_round,
      'Round ' || v_round
    )
    returning id into v_round_id;

    for v_slot in 1..v_team_count loop
      v_overall := v_overall + 1;

      exit when v_overall > v_player_count;

      if p_snake and mod(v_round, 2) = 0 then
        v_team_slot := (v_team_count - v_slot) + 1;
      else
        v_team_slot := v_slot;
      end if;

      select team_id
        into v_team_id
      from tmp_draft_teams
      where slot = v_team_slot;

      select season_registration_id, player_profile_id
        into v_registration_id, v_player_profile_id
      from tmp_draft_players
      where rn = v_overall;

      insert into epl.draft_picks (
        draft_board_id,
        draft_round_id,
        team_id,
        season_registration_id,
        player_profile_id,
        round_number,
        pick_number_in_round,
        overall_pick_number
      )
      values (
        v_board_id,
        v_round_id,
        v_team_id,
        v_registration_id,
        v_player_profile_id,
        v_round,
        v_slot,
        v_overall
      );
    end loop;
  end loop;

  insert into epl.draft_sessions (
    league_id,
    season_id,
    draft_board_id,
    title,
    status,
    current_pick_number,
    total_picks,
    auto_mode,
    auto_interval_seconds,
    snake_mode,
    random_team_order,
    random_player_order
  )
  values (
    v_league_id,
    v_season_id,
    v_board_id,
    v_title,
    'ready',
    0,
    v_player_count,
    false,
    p_auto_interval_seconds,
    p_snake,
    true,
    true
  )
  returning id into v_session_id;

  return v_session_id;
end;
$$;

create or replace function public.epl_draft_next_pick(
  p_draft_session_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, epl
as $$
declare
  v_current integer;
  v_total integer;
begin
  select current_pick_number, total_picks
    into v_current, v_total
  from epl.draft_sessions
  where id = p_draft_session_id;

  if v_current is null then
    raise exception 'Draft session not found';
  end if;

  update epl.draft_sessions
  set
    current_pick_number = least(v_current + 1, v_total),
    status = case
      when least(v_current + 1, v_total) >= v_total then 'completed'::epl.epl_draft_session_status
      else 'live'::epl.epl_draft_session_status
    end,
    started_at = coalesce(started_at, now()),
    completed_at = case
      when least(v_current + 1, v_total) >= v_total then now()
      else completed_at
    end,
    updated_at = now()
  where id = p_draft_session_id;
end;
$$;

create or replace function public.epl_draft_prev_pick(
  p_draft_session_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, epl
as $$
begin
  update epl.draft_sessions
  set
    current_pick_number = greatest(current_pick_number - 1, 0),
    status = case
      when greatest(current_pick_number - 1, 0) = 0 then 'ready'::epl.epl_draft_session_status
      else 'paused'::epl.epl_draft_session_status
    end,
    auto_mode = false,
    paused_at = now(),
    completed_at = null,
    updated_at = now()
  where id = p_draft_session_id;
end;
$$;

create or replace function public.epl_draft_set_auto_mode(
  p_draft_session_id uuid,
  p_auto_mode boolean,
  p_auto_interval_seconds integer default null
)
returns void
language plpgsql
security definer
set search_path = public, epl
as $$
begin
  update epl.draft_sessions
  set
    auto_mode = p_auto_mode,
    auto_interval_seconds = coalesce(p_auto_interval_seconds, auto_interval_seconds),
    status = case
      when p_auto_mode then 'live'::epl.epl_draft_session_status
      else 'paused'::epl.epl_draft_session_status
    end,
    started_at = coalesce(started_at, now()),
    paused_at = case when p_auto_mode then null else now() end,
    updated_at = now()
  where id = p_draft_session_id;
end;
$$;

create or replace function public.epl_draft_jump_to_pick(
  p_draft_session_id uuid,
  p_pick_number integer
)
returns void
language plpgsql
security definer
set search_path = public, epl
as $$
begin
  update epl.draft_sessions
  set
    current_pick_number = greatest(0, least(p_pick_number, total_picks)),
    status = 'paused',
    auto_mode = false,
    paused_at = now(),
    completed_at = case when p_pick_number >= total_picks then now() else null end,
    updated_at = now()
  where id = p_draft_session_id;
end;
$$;

grant execute on function public.epl_generate_random_draft_session(text, text, boolean, integer) to anon, authenticated, service_role;
grant execute on function public.epl_draft_next_pick(uuid) to anon, authenticated, service_role;
grant execute on function public.epl_draft_prev_pick(uuid) to anon, authenticated, service_role;
grant execute on function public.epl_draft_set_auto_mode(uuid, boolean, integer) to anon, authenticated, service_role;
grant execute on function public.epl_draft_jump_to_pick(uuid, integer) to anon, authenticated, service_role;

commit;
