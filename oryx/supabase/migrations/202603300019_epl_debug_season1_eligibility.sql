begin;

create or replace view public.epl_debug_season1_registrations as
select
  sr.id as registration_id,
  sr.player_profile_id,
  pp.email,
  s.slug as season_slug,
  sr.registration_status,
  sr.player_status,
  sr.waived_fee,
  sr.draft_eligible,
  sr.draft_eligibility_reason,
  sr.team_id
from epl.season_registrations sr
join epl.seasons s on s.id = sr.season_id
left join epl.player_profiles pp on pp.id = sr.player_profile_id
where s.slug = 'season-1';

grant select on public.epl_debug_season1_registrations to anon, authenticated, service_role;

commit;
