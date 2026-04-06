begin;

with season_row as (
  select
    s.id as season_id,
    s.league_id
  from epl.seasons s
  join epl.leagues l on l.id = s.league_id
  where l.slug = 'epl'
    and s.slug = 'season-1'
  limit 1
)
insert into epl.teams (
  league_id,
  season_id,
  slug,
  name,
  short_name,
  display_name,
  status,
  is_public,
  sort_order,
  primary_color,
  secondary_color,
  accent_color
)
select
  sr.league_id,
  sr.season_id,
  x.slug,
  x.name,
  x.short_name,
  x.display_name,
  'active',
  true,
  x.sort_order,
  '#000000',
  '#F5F5F5',
  '#A259FF'
from season_row sr
cross join (
  values
    ('chargers', 'Chargers', 'CHG', 'Chargers', 1),
    ('raiders', 'Raiders', 'RDR', 'Raiders', 2),
    ('rebels', 'Rebels', 'RBL', 'Rebels', 3),
    ('royals', 'Royals', 'RYL', 'Royals', 4),
    ('sentinels', 'Sentinels', 'SNT', 'Sentinels', 5),
    ('titans', 'Titans', 'TTN', 'Titans', 6)
) as x(slug, name, short_name, display_name, sort_order)
where not exists (
  select 1
  from epl.teams t
  where t.season_id = sr.season_id
    and t.slug = x.slug
);

commit;
