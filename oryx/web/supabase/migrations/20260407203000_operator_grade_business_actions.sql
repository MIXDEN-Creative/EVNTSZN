alter table public.evntszn_sponsor_accounts
  add column if not exists relationship_owner_user_id uuid references auth.users(id) on delete set null,
  add column if not exists starts_at timestamptz,
  add column if not exists ends_at timestamptz,
  add column if not exists activation_status text not null default 'prospect',
  add column if not exists fulfillment_status text not null default 'not_started',
  add column if not exists asset_ready boolean not null default false,
  add column if not exists epl_category text,
  add column if not exists history jsonb not null default '[]'::jsonb;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'evntszn_sponsor_accounts_activation_status_check'
  ) then
    alter table public.evntszn_sponsor_accounts
      add constraint evntszn_sponsor_accounts_activation_status_check
      check (activation_status in ('prospect', 'contracting', 'active', 'paused', 'ended'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'evntszn_sponsor_accounts_fulfillment_status_check'
  ) then
    alter table public.evntszn_sponsor_accounts
      add constraint evntszn_sponsor_accounts_fulfillment_status_check
      check (fulfillment_status in ('not_started', 'collecting_assets', 'ready', 'live', 'fulfilled'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'evntszn_sponsor_accounts_epl_category_check'
  ) then
    alter table public.evntszn_sponsor_accounts
      add constraint evntszn_sponsor_accounts_epl_category_check
      check (
        epl_category is null
        or epl_category in (
          'league_partner',
          'presenting_partner',
          'game_day_partner',
          'community_partner',
          'apparel_equipment_partner'
        )
      );
  end if;
end $$;

alter table public.evntszn_program_members
  add column if not exists referral_code text,
  add column if not exists referral_slug text,
  add column if not exists referred_count integer not null default 0,
  add column if not exists activation_readiness text not null default 'review_needed',
  add column if not exists performance_stage text not null default 'new';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'evntszn_program_members_activation_readiness_check'
  ) then
    alter table public.evntszn_program_members
      add constraint evntszn_program_members_activation_readiness_check
      check (activation_readiness in ('not_ready', 'review_needed', 'ready', 'active'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'evntszn_program_members_performance_stage_check'
  ) then
    alter table public.evntszn_program_members
      add constraint evntszn_program_members_performance_stage_check
      check (performance_stage in ('new', 'developing', 'active', 'high_potential'));
  end if;
end $$;

create unique index if not exists evntszn_program_members_referral_code_idx
  on public.evntszn_program_members (lower(referral_code))
  where referral_code is not null;

create unique index if not exists evntszn_program_members_referral_slug_idx
  on public.evntszn_program_members (lower(referral_slug))
  where referral_slug is not null;
