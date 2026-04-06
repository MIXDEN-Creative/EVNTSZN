begin;

create table if not exists epl.draft_action_log (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references epl.leagues(id) on delete cascade,
  season_id uuid not null references epl.seasons(id) on delete cascade,
  draft_session_id uuid null references epl.draft_sessions(id) on delete set null,
  action_type text not null,
  action_label text not null,
  actor_user_id uuid null references auth.users(id) on delete set null,
  related_pick_id uuid null references epl.draft_picks(id) on delete set null,
  related_team_id uuid null references epl.teams(id) on delete set null,
  related_player_profile_id uuid null references epl.player_profiles(id) on delete set null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_epl_draft_action_log_season_created
  on epl.draft_action_log(season_id, created_at desc);

create index if not exists idx_epl_draft_action_log_session_created
  on epl.draft_action_log(draft_session_id, created_at desc);

create or replace function public.epl_log_draft_action(
  p_season_slug text,
  p_action_type text,
  p_action_label text,
  p_draft_session_id uuid default null,
  p_actor_user_id uuid default null,
  p_related_pick_id uuid default null,
  p_related_team_id uuid default null,
  p_related_player_profile_id uuid default null,
  p_details jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, epl
as $$
declare
  v_league_id uuid;
  v_season_id uuid;
  v_id uuid;
begin
  select l.id, s.id
    into v_league_id, v_season_id
  from epl.seasons s
  join epl.leagues l on l.id = s.league_id
  where l.slug = 'epl'
    and s.slug = p_season_slug
  limit 1;

  if v_season_id is null then
    raise exception 'Season not found for slug %', p_season_slug;
  end if;

  insert into epl.draft_action_log (
    league_id,
    season_id,
    draft_session_id,
    action_type,
    action_label,
    actor_user_id,
    related_pick_id,
    related_team_id,
    related_player_profile_id,
    details
  )
  values (
    v_league_id,
    v_season_id,
    p_draft_session_id,
    p_action_type,
    p_action_label,
    p_actor_user_id,
    p_related_pick_id,
    p_related_team_id,
    p_related_player_profile_id,
    coalesce(p_details, '{}'::jsonb)
  )
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.epl_log_draft_action(
  text, text, text, uuid, uuid, uuid, uuid, uuid, jsonb
) to anon, authenticated, service_role;

create or replace view epl.v_admin_player_pool as
select
  s.name as season_name,
  s.slug as season_slug,
  sr.id as season_registration_id,
  sr.player_profile_id,
  pp.first_name,
  pp.last_name,
  trim(pp.first_name || ' ' || pp.last_name) as player_name,
  pp.email,
  pp.phone,
  pp.preferred_position,
  pp.secondary_position,
  pp.jersey_name,
  pp.preferred_jersey_number_1,
  pp.preferred_jersey_number_2,
  pp.headshot_storage_path,
  sr.registration_status,
  sr.player_status,
  sr.waived_fee,
  sr.payment_amount_cents,
  sr.draft_eligible,
  sr.draft_eligibility_reason,
  sr.team_id,
  case
    when sr.team_id is null then false
    else true
  end as assigned_to_team,
  pa.id as application_id,
  pa.status as application_status,
  pa.submitted_at as application_submitted_at,
  sr.created_at as registration_created_at,
  sr.updated_at as registration_updated_at
from epl.season_registrations sr
join epl.seasons s on s.id = sr.season_id
join epl.player_profiles pp on pp.id = sr.player_profile_id
left join epl.player_applications pa on pa.id = sr.application_id;

create or replace view public.epl_v_admin_player_pool as
select *
from epl.v_admin_player_pool;

grant select on public.epl_v_admin_player_pool to anon, authenticated, service_role;

create or replace view epl.v_admin_full_draft_board as
select
  ds.id as draft_session_id,
  ds.title as draft_title,
  ds.status as draft_status,
  s.name as season_name,
  s.slug as season_slug,
  dp.id as draft_pick_id,
  dp.round_number,
  dp.pick_number_in_round,
  dp.overall_pick_number,
  t.id as team_id,
  t.display_name as team_name,
  t.logo_url as team_logo_url,
  pp.id as player_profile_id,
  trim(pp.first_name || ' ' || pp.last_name) as player_name,
  pp.preferred_position,
  pp.secondary_position,
  pp.jersey_name,
  pp.headshot_storage_path,
  sr.id as season_registration_id
from epl.draft_sessions ds
join epl.seasons s on s.id = ds.season_id
join epl.draft_picks dp on dp.draft_board_id = ds.draft_board_id
left join epl.teams t on t.id = dp.team_id
left join epl.player_profiles pp on pp.id = dp.player_profile_id
left join epl.season_registrations sr on sr.id = dp.season_registration_id;

create or replace view public.epl_v_admin_full_draft_board as
select *
from epl.v_admin_full_draft_board;

grant select on public.epl_v_admin_full_draft_board to anon, authenticated, service_role;

create or replace view epl.v_admin_draft_action_log as
select
  dal.id,
  s.name as season_name,
  s.slug as season_slug,
  dal.draft_session_id,
  dal.action_type,
  dal.action_label,
  dal.actor_user_id,
  dal.related_pick_id,
  dal.related_team_id,
  t.display_name as related_team_name,
  dal.related_player_profile_id,
  trim(pp.first_name || ' ' || pp.last_name) as related_player_name,
  dal.details,
  dal.created_at
from epl.draft_action_log dal
join epl.seasons s on s.id = dal.season_id
left join epl.teams t on t.id = dal.related_team_id
left join epl.player_profiles pp on pp.id = dal.related_player_profile_id;

create or replace view public.epl_v_admin_draft_action_log as
select *
from epl.v_admin_draft_action_log;

grant select on public.epl_v_admin_draft_action_log to anon, authenticated, service_role;

commit;
