begin;

create or replace view epl.v_admin_players_master as
with base as (
  select
    coalesce(pp.id::text, lower(pa.email)) as player_key,
    pp.id as player_profile_id,
    coalesce(trim(pp.first_name || ' ' || pp.last_name), trim(pa.first_name || ' ' || pa.last_name)) as player_name,
    coalesce(pp.email, pa.email) as email,
    coalesce(pp.phone, pa.phone) as phone,
    pp.preferred_position,
    pp.secondary_position,
    pp.jersey_name,
    pp.preferred_jersey_number_1,
    pp.preferred_jersey_number_2,
    pa.id as application_id,
    pa.status as application_status,
    sr.registration_status,
    sr.payment_amount_cents,
    sr.paid_at,
    pa.submitted_at,
    s.name as season_name,
    s.slug as season_slug
  from epl.player_applications pa
  left join epl.player_profiles pp
    on pp.id = pa.player_profile_id
  left join epl.season_registrations sr
    on sr.application_id = pa.id
  left join epl.seasons s
    on s.id = pa.season_id
)

select
  player_key,

  -- SAFE UUID HANDLING
  max(player_profile_id::text)::uuid as player_profile_id,

  max(player_name) as player_name,
  max(email) as email,
  max(phone) as phone,
  max(preferred_position) as preferred_position,
  max(secondary_position) as secondary_position,
  max(jersey_name) as jersey_name,
  max(preferred_jersey_number_1) as preferred_jersey_number_1,
  max(preferred_jersey_number_2) as preferred_jersey_number_2,

  count(application_id) as total_applications,

  count(*) filter (where application_status = 'approved') as approved_applications,
  count(*) filter (where application_status = 'waitlisted') as waitlisted_applications,
  count(*) filter (where application_status = 'declined') as declined_applications,

  count(*) filter (where paid_at is not null) as paid_seasons,

  -- 🔥 CLEAN DISPLAY (NO SLUGS)
  string_agg(distinct season_name, ' • ' order by season_name) as seasons,

  -- KEEP SLUGS INTERNAL (NOT FOR UI)
  array_agg(distinct season_slug order by season_slug) as season_slugs,

  max(submitted_at) as last_submitted_at,
  max(paid_at) as last_paid_at

from base
group by player_key;

create or replace view public.epl_v_admin_players_master as
select *
from epl.v_admin_players_master;

grant select on public.epl_v_admin_players_master to anon, authenticated, service_role;

commit;
