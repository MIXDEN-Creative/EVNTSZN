begin;

with season_row as (
  select s.id as season_id, s.league_id
  from epl.seasons s
  join epl.leagues l on l.id = s.league_id
  where l.slug = 'epl'
    and s.slug = 'season-1'
  limit 1
),

profiles as (
  insert into epl.player_profiles (
    first_name,
    last_name,
    email,
    phone,
    age,
    hometown,
    preferred_position,
    secondary_position,
    jersey_name,
    preferred_jersey_number_1,
    preferred_jersey_number_2,
    jersey_name_policy_accepted,
    status
  )
  values
    (
      'Jayden',
      'Carter',
      'jayden.carter@epl.com',
      '4105550001',
      24,
      'Baltimore, MD',
      'WR',
      'DB',
      'FLASH',
      1,
      11,
      true,
      'prospect'::epl.epl_player_status
    ),
    (
      'Marcus',
      'Reed',
      'marcus.reed@epl.com',
      '4105550002',
      27,
      'Baltimore, MD',
      'QB',
      'WR',
      'MARC',
      7,
      10,
      true,
      'prospect'::epl.epl_player_status
    ),
    (
      'Tyrese',
      'Bennett',
      'tyrese.bennett@epl.com',
      '4105550003',
      '22',
      'Baltimore, MD',
      'DB',
      'WR',
      'LOCK',
      3,
      23,
      true,
      'prospect'::epl.epl_player_status
    )
  on conflict do nothing
  returning id, email, first_name, last_name, phone, age, preferred_position, secondary_position, jersey_name, preferred_jersey_number_1, preferred_jersey_number_2
),

all_profiles as (
  select
    pp.id,
    pp.email,
    pp.first_name,
    pp.last_name,
    pp.phone,
    pp.age,
    pp.preferred_position,
    pp.secondary_position,
    pp.jersey_name,
    pp.preferred_jersey_number_1,
    pp.preferred_jersey_number_2
  from epl.player_profiles pp
  where pp.email in (
    'jayden.carter@epl.com',
    'marcus.reed@epl.com',
    'tyrese.bennett@epl.com'
  )
),

applications as (
  insert into epl.player_applications (
    league_id,
    season_id,
    player_profile_id,
    first_name,
    last_name,
    email,
    phone,
    age,
    city,
    state,
    position_primary,
    position_secondary,
    experience_level,
    jersey_name_requested,
    preferred_jersey_number_1,
    preferred_jersey_number_2,
    jersey_name_policy_accepted,
    status,
    source
  )
  select
    sr.league_id,
    sr.season_id,
    p.id,
    p.first_name,
    p.last_name,
    p.email,
    p.phone,
    p.age,
    'Baltimore',
    'MD',
    p.preferred_position,
    p.secondary_position,
    'Competitive',
    p.jersey_name,
    p.preferred_jersey_number_1,
    p.preferred_jersey_number_2,
    true,
    'approved'::epl.epl_application_status,
    'admin_seed'
  from all_profiles p
  cross join season_row sr
  where not exists (
    select 1
    from epl.player_applications pa
    where pa.season_id = sr.season_id
      and lower(pa.email) = lower(p.email)
  )
  returning id, player_profile_id
),

all_applications as (
  select
    pa.id,
    pa.player_profile_id
  from epl.player_applications pa
  join season_row sr on sr.season_id = pa.season_id
  where lower(pa.email) in (
    'jayden.carter@epl.com',
    'marcus.reed@epl.com',
    'tyrese.bennett@epl.com'
  )
),

registrations as (
  insert into epl.season_registrations (
    league_id,
    season_id,
    player_profile_id,
    application_id,
    registration_status,
    player_status,
    payment_amount_cents,
    waived_fee,
    currency_code
  )
  select
    sr.league_id,
    sr.season_id,
    p.id,
    a.id,
    'approved'::epl.epl_registration_status,
    'prospect'::epl.epl_player_status,
    0,
    true,
    'usd'
  from all_profiles p
  join all_applications a on a.player_profile_id = p.id
  cross join season_row sr
  where not exists (
    select 1
    from epl.season_registrations reg
    where reg.season_id = sr.season_id
      and reg.player_profile_id = p.id
  )
  returning id
)

select count(*) as inserted_players from registrations;

commit;
