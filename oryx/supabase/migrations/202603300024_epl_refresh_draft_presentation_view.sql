begin;

drop view if exists public.epl_v_draft_presentation_picks;
drop view if exists epl.v_draft_presentation_picks;

create view epl.v_draft_presentation_picks as
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
  pp.headshot_storage_path as headshot_storage_path,
  sr.id as season_registration_id
from epl.draft_sessions ds
join epl.draft_picks dp on dp.draft_board_id = ds.draft_board_id
join epl.teams t on t.id = dp.team_id
join epl.player_profiles pp on pp.id = dp.player_profile_id
join epl.season_registrations sr on sr.id = dp.season_registration_id
join epl.seasons s on s.id = ds.season_id;

create view public.epl_v_draft_presentation_picks as
select *
from epl.v_draft_presentation_picks;

grant select on public.epl_v_draft_presentation_picks to anon, authenticated, service_role;

commit;
