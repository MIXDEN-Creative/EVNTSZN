with check_in_template as (
  insert into epl.staff_role_templates (
    title,
    role_code,
    department,
    role_type,
    summary,
    responsibilities,
    requirements,
    volunteer_perks,
    default_operational_tags,
    access_track,
    is_active,
    sort_order
  )
  select
    'League Check-In Crew',
    'league_check_in',
    'Scanner',
    'volunteer',
    'Work the front gate, move check-in fast, and keep arrival clean on league night.',
    array[
      'Welcome players and supporters at check-in',
      'Verify entry and keep the gate moving',
      'Coordinate with scanner and event operations leads'
    ]::text[],
    array[
      'Reliable arrival before game windows open',
      'Comfortable working with guests and player traffic',
      'Able to stay sharp during active check-in periods'
    ]::text[],
    array[
      'free admission',
      'team credential',
      'staff appreciation perks',
      'future paid-role priority'
    ]::text[],
    array['scanner','league_night']::text[],
    'scanner',
    true,
    20
  where not exists (
    select 1 from epl.staff_role_templates where role_code = 'league_check_in'
  )
  returning id
),
league_ops_template as (
  insert into epl.staff_role_templates (
    title,
    role_code,
    department,
    role_type,
    summary,
    responsibilities,
    requirements,
    volunteer_perks,
    default_operational_tags,
    access_track,
    is_active,
    sort_order
  )
  select
    'League Operations Crew',
    'league_operations',
    'Operations',
    'volunteer',
    'Support field flow, sideline communication, and league-night execution from setup through close.',
    array[
      'Support setup, field flow, and sideline coordination',
      'Help league leads keep games on schedule',
      'Handle league-night operational needs as they come up'
    ]::text[],
    array[
      'Comfortable in live event environments',
      'Able to stay organized during active game windows',
      'Ready to support players, staff, and league leads'
    ]::text[],
    array[
      'free admission',
      'food provided',
      'networking access',
      'future paid-role priority'
    ]::text[],
    array['operations','league_night']::text[],
    'limited_ops',
    true,
    30
  where not exists (
    select 1 from epl.staff_role_templates where role_code = 'league_operations'
  )
  returning id
),
season_scope as (
  select id
  from epl.seasons
  where slug = 'season-1'
  order by created_at desc
  limit 1
),
city_scope as (
  select *
  from (
    values
      ('Baltimore','MD'),
      ('Atlanta','GA'),
      ('New York','NY'),
      ('Miami','FL'),
      ('Washington','DC'),
      ('Dover','DE')
  ) as cities(city, state)
),
templates as (
  select id, role_code, summary, volunteer_perks, access_track
  from epl.staff_role_templates
  where role_code in ('league_check_in', 'league_operations')
)
insert into epl.staff_positions (
  role_template_id,
  season_id,
  city,
  state,
  position_status,
  visibility,
  slots_needed,
  slots_filled,
  priority,
  notes,
  publicly_listed,
  volunteer_perks,
  access_track
)
select
  templates.id,
  season_scope.id,
  city_scope.city,
  city_scope.state,
  'open',
  'public',
  2,
  0,
  case when templates.role_code = 'league_check_in' then 30 else 40 end,
  templates.summary,
  true,
  templates.volunteer_perks,
  templates.access_track
from templates
cross join city_scope
left join season_scope on true
where not exists (
  select 1
  from epl.staff_positions position
  where position.role_template_id = templates.id
    and coalesce(position.city, '') = city_scope.city
    and coalesce(position.state, '') = city_scope.state
    and coalesce(position.season_id, '00000000-0000-0000-0000-000000000000'::uuid) = coalesce(season_scope.id, '00000000-0000-0000-0000-000000000000'::uuid)
);
