create or replace view public.epl_v_admin_player_pool as
select
  sr.id as season_registration_id,
  sr.id as registration_id,
  sr.season_id,
  s.slug as season_slug,
  sr.player_profile_id,
  pa.id as application_id,
  pa.status as application_status,
  concat_ws(' ', pp.first_name, pp.last_name) as player_name,
  pp.email,
  pp.phone,
  pp.jersey_name,
  pp.preferred_position,
  pp.secondary_position,
  pp.preferred_jersey_number_1,
  pp.preferred_jersey_number_2,
  pp.headshot_storage_path,
  sr.registration_status,
  sr.player_status,
  sr.waived_fee,
  sr.payment_amount_cents,
  sr.paid_at,
  sr.updated_at as registration_updated_at,
  pp.is_draft_eligible as draft_eligible,
  pp.draft_eligibility_reason,
  exists (
    select 1
    from epl.draft_picks dp
    where dp.season_id = sr.season_id
      and dp.player_profile_id = sr.player_profile_id
  ) as assigned_to_team
from epl.season_registrations sr
join epl.player_profiles pp on pp.id = sr.player_profile_id
join epl.seasons s on s.id = sr.season_id
left join epl.player_applications pa on pa.id = sr.application_id;

update storage.buckets
set public = true
where id = 'epl-player-photos';

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
          coalesce(sr.paid_at, sr.updated_at, sr.created_at, timezone('utc', now())),
          pp.last_name,
          pp.first_name
      ) as rn
    from epl.season_registrations sr
    join epl.player_profiles pp on pp.id = sr.player_profile_id
    where sr.season_id = v_season.id
      and pp.is_draft_eligible = true
      and (
        sr.registration_status = 'paid'
        or (sr.registration_status = 'approved' and sr.waived_fee = true)
      )
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

create or replace function public.epl_manual_assign_pick_player(
  p_draft_pick_id uuid,
  p_player_profile_id uuid,
  p_note text default null
)
returns void
language plpgsql
as $$
declare
  v_pick_season_id uuid;
  v_existing_pick_id uuid;
begin
  select season_id into v_pick_season_id
  from epl.draft_picks
  where id = p_draft_pick_id;

  if v_pick_season_id is null then
    raise exception 'Draft pick not found';
  end if;

  select id into v_existing_pick_id
  from epl.draft_picks
  where season_id = v_pick_season_id
    and player_profile_id = p_player_profile_id
    and id <> p_draft_pick_id
  limit 1;

  if v_existing_pick_id is not null then
    raise exception 'Player is already assigned to another pick';
  end if;

  update epl.draft_picks
  set
    player_profile_id = p_player_profile_id,
    selection_method = 'manual',
    selection_note = p_note
  where id = p_draft_pick_id;
end;
$$;
