begin;

alter table if exists epl.season_registrations
  add column if not exists draft_eligible boolean not null default false,
  add column if not exists draft_eligibility_reason text null,
  add column if not exists draft_eligibility_set_at timestamptz null,
  add column if not exists draft_eligibility_set_by uuid null references auth.users(id) on delete set null;

create index if not exists idx_epl_season_registrations_draft_eligible
  on epl.season_registrations(season_id, draft_eligible);

create or replace function public.epl_set_registration_draft_eligible(
  p_registration_id uuid,
  p_eligible boolean,
  p_reason text default null,
  p_set_by uuid default null
)
returns void
language plpgsql
security definer
set search_path = public, epl
as $$
begin
  update epl.season_registrations
  set
    draft_eligible = p_eligible,
    draft_eligibility_reason = p_reason,
    draft_eligibility_set_at = now(),
    draft_eligibility_set_by = p_set_by,
    player_status = case
      when p_eligible and player_status = 'prospect' then 'draft_pool'::epl.epl_player_status
      else player_status
    end,
    updated_at = now()
  where id = p_registration_id;
end;
$$;

create or replace function public.epl_bulk_mark_draft_eligible_for_season(
  p_season_slug text,
  p_set_by uuid default null,
  p_reason text default 'Commissioner approved for draft'
)
returns integer
language plpgsql
security definer
set search_path = public, epl
as $$
declare
  v_updated integer := 0;
begin
  update epl.season_registrations sr
  set
    draft_eligible = true,
    draft_eligibility_reason = p_reason,
    draft_eligibility_set_at = now(),
    draft_eligibility_set_by = p_set_by,
    player_status = case
      when sr.player_status = 'prospect' then 'draft_pool'::epl.epl_player_status
      else sr.player_status
    end,
    updated_at = now()
  from epl.seasons s
  where s.id = sr.season_id
    and s.slug = p_season_slug
    and sr.team_id is null
    and (
      sr.player_status = 'draft_pool'
      or sr.registration_status = 'paid'
      or (sr.registration_status = 'approved' and sr.waived_fee = true)
    );

  get diagnostics v_updated = row_count;
  return v_updated;
end;
$$;

grant execute on function public.epl_set_registration_draft_eligible(uuid, boolean, text, uuid) to anon, authenticated, service_role;
grant execute on function public.epl_bulk_mark_draft_eligible_for_season(text, uuid, text) to anon, authenticated, service_role;

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
    and sr.draft_eligible = true;

  select count(*) into v_player_count from tmp_draft_players;

  if v_player_count = 0 then
    raise exception 'No commissioner-approved draft eligible players found for season %', p_season_slug;
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

update epl.teams t
set logo_url = case t.slug
  when 'chargers' then '/epl_team_logos/chargers.jpeg'
  when 'raiders' then '/epl_team_logos/raiders.jpeg'
  when 'rebels' then '/epl_team_logos/rebels.jpeg'
  when 'royals' then '/epl_team_logos/royals.jpeg'
  when 'sentinels' then '/epl_team_logos/sentinels.jpeg'
  when 'titans' then '/epl_team_logos/titans.jpeg'
  else t.logo_url
end
from epl.seasons s
where s.id = t.season_id
  and s.slug = 'season-1'
  and t.slug in ('chargers','raiders','rebels','royals','sentinels','titans');

commit;
