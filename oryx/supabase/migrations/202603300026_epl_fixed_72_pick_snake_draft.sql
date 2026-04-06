begin;

create or replace function public.epl_reset_draft_for_season(
  p_season_slug text
)
returns void
language plpgsql
security definer
set search_path = public, epl
as $$
declare
  v_season_id uuid;
begin
  select s.id
    into v_season_id
  from epl.seasons s
  join epl.leagues l on l.id = s.league_id
  where l.slug = 'epl'
    and s.slug = p_season_slug
  limit 1;

  if v_season_id is null then
    raise exception 'Season not found for slug %', p_season_slug;
  end if;

  delete from epl.draft_sessions
  where season_id = v_season_id;

  delete from epl.draft_picks
  where draft_board_id in (
    select id from epl.draft_boards where season_id = v_season_id
  );

  delete from epl.draft_rounds
  where draft_board_id in (
    select id from epl.draft_boards where season_id = v_season_id
  );

  delete from epl.draft_pool
  where draft_board_id in (
    select id from epl.draft_boards where season_id = v_season_id
  );

  delete from epl.draft_boards
  where season_id = v_season_id;

  update epl.season_registrations
  set
    team_id = null,
    updated_at = now()
  where season_id = v_season_id;
end;
$$;

grant execute on function public.epl_reset_draft_for_season(text) to anon, authenticated, service_role;

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
  v_round_id uuid;
  v_team_slot integer;
  v_team_id uuid;
  v_registration_id uuid;
  v_player_profile_id uuid;
  v_overall integer := 0;
  v_round integer;
  v_slot integer;
  v_team_count integer;
  v_pick_slots integer := 72;
  v_round_count integer := 12;
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

  if v_team_count <> 6 then
    raise exception 'Season % must have exactly 6 active draft teams. Found %.', p_season_slug, v_team_count;
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
      sr.registration_status = 'paid'
      or (sr.registration_status = 'approved' and coalesce(sr.waived_fee, false) = true)
    )
  limit v_pick_slots;

  if not exists (select 1 from tmp_draft_players) then
    raise exception 'No approved/paid draftable players found for season %', p_season_slug;
  end if;

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
    'Fixed 72-pick, 12-round, 6-team snake draft'
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

    for v_slot in 1..6 loop
      v_overall := ((v_round - 1) * 6) + v_slot;

      if p_snake and mod(v_round, 2) = 0 then
        v_team_slot := (6 - v_slot) + 1;
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

      if v_registration_id is not null and v_player_profile_id is not null then
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
      end if;
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
    v_pick_slots,
    false,
    p_auto_interval_seconds,
    true,
    true,
    true
  )
  returning id into v_session_id;

  return v_session_id;
end;
$$;

commit;
