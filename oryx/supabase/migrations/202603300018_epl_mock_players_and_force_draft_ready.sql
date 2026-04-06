begin;

with season_row as (
  select s.id as season_id, s.league_id
  from epl.seasons s
  join epl.leagues l on l.id = s.league_id
  where l.slug = 'epl'
    and s.slug = 'season-1'
  limit 1
),

seed_players as (
  select *
  from (
    values
      ('Jayden','Carter','jayden.carter@epl.com','4105550001',24,'Baltimore, MD','WR','DB','FLASH',1,11),
      ('Marcus','Reed','marcus.reed@epl.com','4105550002',27,'Baltimore, MD','QB','WR','MARC',7,10),
      ('Tyrese','Bennett','tyrese.bennett@epl.com','4105550003',22,'Baltimore, MD','DB','WR','LOCK',3,23)
  ) as x(
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
    preferred_jersey_number_2
  )
),

insert_profiles as (
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
  select
    sp.first_name,
    sp.last_name,
    sp.email,
    sp.phone,
    sp.age,
    sp.hometown,
    sp.preferred_position,
    sp.secondary_position,
    sp.jersey_name,
    sp.preferred_jersey_number_1,
    sp.preferred_jersey_number_2,
    true,
    'prospect'::epl.epl_player_status
  from seed_players sp
  where not exists (
    select 1
    from epl.player_profiles pp
    where lower(pp.email) = lower(sp.email)
  )
  returning id
),

all_profiles as (
  select
    pp.id,
    pp.first_name,
    pp.last_name,
    pp.email,
    pp.phone,
    pp.age,
    pp.preferred_position,
    pp.secondary_position,
    pp.jersey_name,
    pp.preferred_jersey_number_1,
    pp.preferred_jersey_number_2
  from epl.player_profiles pp
  where lower(pp.email) in (
    'jayden.carter@epl.com',
    'marcus.reed@epl.com',
    'tyrese.bennett@epl.com'
  )
),

insert_applications as (
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
    ap.id,
    ap.first_name,
    ap.last_name,
    ap.email,
    ap.phone,
    ap.age,
    'Baltimore',
    'MD',
    ap.preferred_position,
    ap.secondary_position,
    'Competitive',
    ap.jersey_name,
    ap.preferred_jersey_number_1,
    ap.preferred_jersey_number_2,
    true,
    'approved'::epl.epl_application_status,
    'admin_seed'
  from all_profiles ap
  cross join season_row sr
  where not exists (
    select 1
    from epl.player_applications pa
    where pa.season_id = sr.season_id
      and lower(pa.email) = lower(ap.email)
  )
  returning id
),

all_applications as (
  select
    pa.id,
    pa.player_profile_id,
    pa.email
  from epl.player_applications pa
  join season_row sr on sr.season_id = pa.season_id
  where lower(pa.email) in (
    'jayden.carter@epl.com',
    'marcus.reed@epl.com',
    'tyrese.bennett@epl.com'
  )
),

insert_registrations as (
  insert into epl.season_registrations (
    league_id,
    season_id,
    player_profile_id,
    application_id,
    registration_status,
    player_status,
    payment_amount_cents,
    waived_fee,
    currency_code,
    draft_eligible,
    draft_eligibility_reason,
    draft_eligibility_set_at
  )
  select
    sr.league_id,
    sr.season_id,
    ap.id,
    aa.id,
    'approved'::epl.epl_registration_status,
    'draft_pool'::epl.epl_player_status,
    0,
    true,
    'usd',
    true,
    'Commissioner override for Season 1 draft',
    now()
  from all_profiles ap
  join all_applications aa on aa.player_profile_id = ap.id
  cross join season_row sr
  where not exists (
    select 1
    from epl.season_registrations reg
    where reg.season_id = sr.season_id
      and reg.player_profile_id = ap.id
  )
  returning id
)

update epl.season_registrations reg
set
  registration_status = 'approved'::epl.epl_registration_status,
  player_status = 'draft_pool'::epl.epl_player_status,
  payment_amount_cents = 0,
  waived_fee = true,
  draft_eligible = true,
  draft_eligibility_reason = 'Commissioner override for Season 1 draft',
  draft_eligibility_set_at = now(),
  team_id = null,
  updated_at = now()
from epl.player_profiles pp
join epl.seasons s on s.slug = 'season-1'
where reg.player_profile_id = pp.id
  and reg.season_id = s.id
  and lower(pp.email) in (
    'jayden.carter@epl.com',
    'marcus.reed@epl.com',
    'tyrese.bennett@epl.com'
  );

commit;
