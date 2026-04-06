begin;

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
