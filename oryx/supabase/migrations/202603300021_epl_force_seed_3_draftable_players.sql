begin;

do $$
declare
  v_league_id uuid;
  v_season_id uuid;

  v_p1 uuid;
  v_p2 uuid;
  v_p3 uuid;

  v_a1 uuid;
  v_a2 uuid;
  v_a3 uuid;
begin
  select l.id, s.id
    into v_league_id, v_season_id
  from epl.leagues l
  join epl.seasons s on s.league_id = l.id
  where l.slug = 'epl'
    and s.slug = 'season-1'
  limit 1;

  if v_season_id is null then
    raise exception 'Season 1 not found';
  end if;

  -- PLAYER 1
  select id into v_p1
  from epl.player_profiles
  where lower(email) = 'jayden.carter@epl.com'
  limit 1;

  if v_p1 is null then
    insert into epl.player_profiles (
      first_name, last_name, email, phone, age, hometown,
      preferred_position, secondary_position, jersey_name,
      preferred_jersey_number_1, preferred_jersey_number_2,
      jersey_name_policy_accepted, status
    )
    values (
      'Jayden', 'Carter', 'jayden.carter@epl.com', '4105550001', 24, 'Baltimore, MD',
      'WR', 'DB', 'FLASH',
      1, 11,
      true, 'prospect'::epl.epl_player_status
    )
    returning id into v_p1;
  end if;

  -- PLAYER 2
  select id into v_p2
  from epl.player_profiles
  where lower(email) = 'marcus.reed@epl.com'
  limit 1;

  if v_p2 is null then
    insert into epl.player_profiles (
      first_name, last_name, email, phone, age, hometown,
      preferred_position, secondary_position, jersey_name,
      preferred_jersey_number_1, preferred_jersey_number_2,
      jersey_name_policy_accepted, status
    )
    values (
      'Marcus', 'Reed', 'marcus.reed@epl.com', '4105550002', 27, 'Baltimore, MD',
      'QB', 'WR', 'MARC',
      7, 10,
      true, 'prospect'::epl.epl_player_status
    )
    returning id into v_p2;
  end if;

  -- PLAYER 3
  select id into v_p3
  from epl.player_profiles
  where lower(email) = 'tyrese.bennett@epl.com'
  limit 1;

  if v_p3 is null then
    insert into epl.player_profiles (
      first_name, last_name, email, phone, age, hometown,
      preferred_position, secondary_position, jersey_name,
      preferred_jersey_number_1, preferred_jersey_number_2,
      jersey_name_policy_accepted, status
    )
    values (
      'Tyrese', 'Bennett', 'tyrese.bennett@epl.com', '4105550003', 22, 'Baltimore, MD',
      'DB', 'WR', 'LOCK',
      3, 23,
      true, 'prospect'::epl.epl_player_status
    )
    returning id into v_p3;
  end if;

  -- APPLICATIONS
  select id into v_a1
  from epl.player_applications
  where season_id = v_season_id and lower(email) = 'jayden.carter@epl.com'
  limit 1;

  if v_a1 is null then
    insert into epl.player_applications (
      league_id, season_id, player_profile_id,
      first_name, last_name, email, phone, age,
      city, state,
      position_primary, position_secondary,
      experience_level, jersey_name_requested,
      preferred_jersey_number_1, preferred_jersey_number_2,
      jersey_name_policy_accepted, status, source
    )
    values (
      v_league_id, v_season_id, v_p1,
      'Jayden', 'Carter', 'jayden.carter@epl.com', '4105550001', 24,
      'Baltimore', 'MD',
      'WR', 'DB',
      'Competitive', 'FLASH',
      1, 11,
      true, 'approved'::epl.epl_application_status, 'admin_seed'
    )
    returning id into v_a1;
  end if;

  select id into v_a2
  from epl.player_applications
  where season_id = v_season_id and lower(email) = 'marcus.reed@epl.com'
  limit 1;

  if v_a2 is null then
    insert into epl.player_applications (
      league_id, season_id, player_profile_id,
      first_name, last_name, email, phone, age,
      city, state,
      position_primary, position_secondary,
      experience_level, jersey_name_requested,
      preferred_jersey_number_1, preferred_jersey_number_2,
      jersey_name_policy_accepted, status, source
    )
    values (
      v_league_id, v_season_id, v_p2,
      'Marcus', 'Reed', 'marcus.reed@epl.com', '4105550002', 27,
      'Baltimore', 'MD',
      'QB', 'WR',
      'Competitive', 'MARC',
      7, 10,
      true, 'approved'::epl.epl_application_status, 'admin_seed'
    )
    returning id into v_a2;
  end if;

  select id into v_a3
  from epl.player_applications
  where season_id = v_season_id and lower(email) = 'tyrese.bennett@epl.com'
  limit 1;

  if v_a3 is null then
    insert into epl.player_applications (
      league_id, season_id, player_profile_id,
      first_name, last_name, email, phone, age,
      city, state,
      position_primary, position_secondary,
      experience_level, jersey_name_requested,
      preferred_jersey_number_1, preferred_jersey_number_2,
      jersey_name_policy_accepted, status, source
    )
    values (
      v_league_id, v_season_id, v_p3,
      'Tyrese', 'Bennett', 'tyrese.bennett@epl.com', '4105550003', 22,
      'Baltimore', 'MD',
      'DB', 'WR',
      'Competitive', 'LOCK',
      3, 23,
      true, 'approved'::epl.epl_application_status, 'admin_seed'
    )
    returning id into v_a3;
  end if;

  -- REGISTRATIONS
  insert into epl.season_registrations (
    league_id, season_id, player_profile_id, application_id,
    registration_status, player_status,
    payment_amount_cents, waived_fee, currency_code,
    draft_eligible, draft_eligibility_reason, draft_eligibility_set_at
  )
  select
    v_league_id, v_season_id, x.player_profile_id, x.application_id,
    'approved'::epl.epl_registration_status,
    'draft_pool'::epl.epl_player_status,
    0, true, 'usd',
    true, 'Commissioner override for Season 1 draft', now()
  from (
    values
      (v_p1, v_a1),
      (v_p2, v_a2),
      (v_p3, v_a3)
  ) as x(player_profile_id, application_id)
  where not exists (
    select 1
    from epl.season_registrations sr
    where sr.season_id = v_season_id
      and sr.player_profile_id = x.player_profile_id
  );

  -- FORCE THEM ALL INTO DRAFT-READY STATE
  update epl.season_registrations sr
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
  where sr.season_id = v_season_id
    and sr.player_profile_id in (v_p1, v_p2, v_p3);

end $$;

commit;
