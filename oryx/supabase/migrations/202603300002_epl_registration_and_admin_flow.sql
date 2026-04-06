begin;

create schema if not exists epl;

alter table if exists epl.player_profiles
  add column if not exists preferred_jersey_number_1 integer null check (preferred_jersey_number_1 between 0 and 99),
  add column if not exists preferred_jersey_number_2 integer null check (preferred_jersey_number_2 between 0 and 99),
  add column if not exists jersey_name_policy_accepted boolean not null default false;

alter table if exists epl.player_applications
  add column if not exists preferred_jersey_number_1 integer null check (preferred_jersey_number_1 between 0 and 99),
  add column if not exists preferred_jersey_number_2 integer null check (preferred_jersey_number_2 between 0 and 99),
  add column if not exists jersey_name_policy_accepted boolean not null default false;

alter table if exists epl.season_registrations
  add column if not exists registration_source text not null default 'website',
  add column if not exists currency_code text not null default 'usd',
  add column if not exists stripe_checkout_session_id text null,
  add column if not exists stripe_payment_intent_id text null;

create unique index if not exists idx_epl_season_application_email_unique
  on epl.player_applications (season_id, lower(email));

create unique index if not exists idx_epl_player_profile_email_unique
  on epl.player_profiles (lower(email))
  where email is not null;

create or replace function epl.validate_jersey_number_pair()
returns trigger
language plpgsql
as $$
begin
  if new.preferred_jersey_number_1 is not null
     and new.preferred_jersey_number_2 is not null
     and new.preferred_jersey_number_1 = new.preferred_jersey_number_2 then
    raise exception 'Preferred jersey numbers must be different.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_epl_validate_profile_jersey_numbers on epl.player_profiles;
create trigger trg_epl_validate_profile_jersey_numbers
before insert or update on epl.player_profiles
for each row execute function epl.validate_jersey_number_pair();

drop trigger if exists trg_epl_validate_application_jersey_numbers on epl.player_applications;
create trigger trg_epl_validate_application_jersey_numbers
before insert or update on epl.player_applications
for each row execute function epl.validate_jersey_number_pair();

create or replace view epl.v_admin_applications as
select
  a.id as application_id,
  a.application_number,
  a.league_id,
  a.season_id,
  l.name as league_name,
  s.name as season_name,
  a.first_name,
  a.last_name,
  a.email,
  a.phone,
  a.age,
  a.city,
  a.state,
  a.position_primary,
  a.position_secondary,
  a.experience_level,
  a.jersey_name_requested,
  a.preferred_jersey_number_1,
  a.preferred_jersey_number_2,
  a.jersey_name_policy_accepted,
  a.status as application_status,
  a.submitted_at,
  a.reviewed_at,
  r.id as registration_id,
  r.registration_status,
  r.player_status,
  r.payment_amount_cents,
  r.paid_at,
  r.approved_at,
  r.registration_code,
  r.team_id,
  p.id as player_profile_id
from epl.player_applications a
join epl.leagues l on l.id = a.league_id
join epl.seasons s on s.id = a.season_id
left join epl.season_registrations r on r.application_id = a.id
left join epl.player_profiles p on p.id = r.player_profile_id;

create or replace function epl.approve_application(
  p_application_id uuid,
  p_approved_by uuid default null
)
returns void
language plpgsql
as $$
begin
  update epl.player_applications
     set status = 'approved',
         reviewed_at = now(),
         reviewed_by = p_approved_by,
         updated_at = now()
   where id = p_application_id;

  update epl.season_registrations
     set registration_status = case
         when coalesce(paid_at, null) is not null then 'approved'::epl.epl_registration_status
         else registration_status
       end,
         player_status = 'draft_pool',
         approved_at = now(),
         approved_by = p_approved_by,
         check_in_eligible = true,
         updated_at = now()
   where application_id = p_application_id;

  update epl.player_profiles
     set status = 'draft_pool',
         updated_at = now()
   where id in (
     select player_profile_id
     from epl.season_registrations
     where application_id = p_application_id
   );
end;
$$;

create or replace function epl.waitlist_application(
  p_application_id uuid,
  p_reviewed_by uuid default null
)
returns void
language plpgsql
as $$
begin
  update epl.player_applications
     set status = 'waitlisted',
         reviewed_at = now(),
         reviewed_by = p_reviewed_by,
         updated_at = now()
   where id = p_application_id;

  update epl.season_registrations
     set registration_status = 'waitlisted',
         updated_at = now()
   where application_id = p_application_id;
end;
$$;

create or replace function epl.decline_application(
  p_application_id uuid,
  p_reviewed_by uuid default null
)
returns void
language plpgsql
as $$
begin
  update epl.player_applications
     set status = 'declined',
         reviewed_at = now(),
         reviewed_by = p_reviewed_by,
         updated_at = now()
   where id = p_application_id;

  update epl.season_registrations
     set registration_status = 'declined',
         check_in_eligible = false,
         updated_at = now()
   where application_id = p_application_id;
end;
$$;

commit;
