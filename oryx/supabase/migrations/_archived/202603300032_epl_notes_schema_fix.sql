begin;

alter table epl.team_war_room_notes
  add column if not exists title text;

alter table epl.team_war_room_notes
  add column if not exists priority text not null default 'normal';

alter table epl.player_scouting_notes
  add column if not exists title text;

alter table epl.player_scouting_notes
  add column if not exists score numeric(5,2);

update epl.team_war_room_notes
set title = coalesce(title, 'War Room Note')
where title is null;

update epl.player_scouting_notes
set title = coalesce(title, 'Scouting Note')
where title is null;

alter table epl.team_war_room_notes
  alter column title set not null;

alter table epl.player_scouting_notes
  alter column title set not null;

drop view if exists public.epl_v_admin_team_war_room_notes;
create view public.epl_v_admin_team_war_room_notes as
select
  s.slug as season_slug,
  n.id,
  n.team_id,
  t.display_name as team_name,
  n.title,
  n.note,
  n.priority,
  n.created_at,
  n.updated_at
from epl.team_war_room_notes n
join epl.seasons s on s.id = n.season_id
join epl.teams t on t.id = n.team_id;

grant select on public.epl_v_admin_team_war_room_notes to anon, authenticated, service_role;

drop view if exists public.epl_v_admin_player_scouting_notes;
create view public.epl_v_admin_player_scouting_notes as
select
  s.slug as season_slug,
  n.id,
  n.player_profile_id,
  trim(pp.first_name || ' ' || pp.last_name) as player_name,
  n.title,
  n.note,
  n.score,
  n.created_at,
  n.updated_at
from epl.player_scouting_notes n
join epl.seasons s on s.id = n.season_id
join epl.player_profiles pp on pp.id = n.player_profile_id;

grant select on public.epl_v_admin_player_scouting_notes to anon, authenticated, service_role;

commit;
