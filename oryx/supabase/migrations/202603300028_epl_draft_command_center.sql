begin;

create table if not exists epl.team_draft_needs (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references epl.teams(id) on delete cascade,
  season_id uuid not null references epl.seasons(id) on delete cascade,
  need_rank integer not null default 1,
  position_code text not null,
  note text null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_epl_team_draft_needs_unique_rank
  on epl.team_draft_needs(team_id, season_id, need_rank);

create table if not exists epl.draft_pick_overrides (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references epl.seasons(id) on delete cascade,
  draft_session_id uuid not null references epl.draft_sessions(id) on delete cascade,
  draft_pick_id uuid not null references epl.draft_picks(id) on delete cascade,
  override_type text not null,
  from_player_profile_id uuid null references epl.player_profiles(id) on delete set null,
  to_player_profile_id uuid null references epl.player_profiles(id) on delete set null,
  note text null,
  created_at timestamptz not null default now()
);

create table if not exists epl.draft_trades (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references epl.seasons(id) on delete cascade,
  draft_session_id uuid not null references epl.draft_sessions(id) on delete cascade,
  from_team_id uuid not null references epl.teams(id) on delete cascade,
  to_team_id uuid not null references epl.teams(id) on delete cascade,
  from_pick_id uuid null references epl.draft_picks(id) on delete set null,
  to_pick_id uuid null references epl.draft_picks(id) on delete set null,
  trade_status text not null default 'proposed',
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table epl.draft_sessions
  add column if not exists production_state text not null default 'ready';

alter table epl.draft_sessions
  add column if not exists production_message text null;

alter table epl.draft_sessions
  add column if not exists reveal_duration_ms integer not null default 7000;

alter table epl.draft_sessions
  add column if not exists sponsor_message text null;

create or replace view epl.v_admin_team_draft_needs as
select
  s.slug as season_slug,
  s.name as season_name,
  t.id as team_id,
  t.slug as team_slug,
  t.display_name as team_name,
  t.logo_url as team_logo_url,
  n.id as need_id,
  n.need_rank,
  n.position_code,
  n.note,
  n.is_active,
  n.created_at,
  n.updated_at
from epl.team_draft_needs n
join epl.teams t on t.id = n.team_id
join epl.seasons s on s.id = n.season_id;

create or replace view public.epl_v_admin_team_draft_needs as
select * from epl.v_admin_team_draft_needs;

grant select on public.epl_v_admin_team_draft_needs to anon, authenticated, service_role;

create or replace view epl.v_admin_team_roster_summary as
select
  s.slug as season_slug,
  t.id as team_id,
  t.slug as team_slug,
  t.display_name as team_name,
  t.logo_url as team_logo_url,
  count(sr.id) filter (where sr.team_id = t.id) as roster_count
from epl.teams t
join epl.seasons s on s.id = t.season_id
left join epl.season_registrations sr on sr.team_id = t.id and sr.season_id = s.id
group by s.slug, t.id, t.slug, t.display_name, t.logo_url;

create or replace view public.epl_v_admin_team_roster_summary as
select * from epl.v_admin_team_roster_summary;

grant select on public.epl_v_admin_team_roster_summary to anon, authenticated, service_role;

create or replace function public.epl_set_player_draft_eligibility(
  p_season_slug text,
  p_player_profile_id uuid,
  p_is_eligible boolean,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public, epl
as $$
declare
  v_season_id uuid;
begin
  select s.id into v_season_id
  from epl.seasons s
  join epl.leagues l on l.id = s.league_id
  where l.slug = 'epl' and s.slug = p_season_slug
  limit 1;

  if v_season_id is null then
    raise exception 'Season not found for slug %', p_season_slug;
  end if;

  update epl.season_registrations
  set
    draft_eligible = p_is_eligible,
    draft_eligibility_reason = p_reason,
    draft_eligibility_set_at = now(),
    updated_at = now()
  where season_id = v_season_id
    and player_profile_id = p_player_profile_id;
end;
$$;

grant execute on function public.epl_set_player_draft_eligibility(text, uuid, boolean, text) to anon, authenticated, service_role;

create or replace function public.epl_manual_assign_pick_player(
  p_draft_pick_id uuid,
  p_player_profile_id uuid,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = public, epl
as $$
declare
  v_season_registration_id uuid;
  v_session_id uuid;
  v_season_slug text;
  v_old_player uuid;
begin
  select dp.player_profile_id
    into v_old_player
  from epl.draft_picks dp
  where dp.id = p_draft_pick_id;

  select sr.id
    into v_season_registration_id
  from epl.season_registrations sr
  join epl.draft_picks dp on dp.season_registration_id = sr.id
  where dp.id = p_draft_pick_id
  limit 1;

  if v_season_registration_id is null then
    select sr.id
      into v_season_registration_id
    from epl.season_registrations sr
    join epl.draft_picks dp on dp.team_id = sr.team_id
    join epl.draft_boards db on db.id = dp.draft_board_id
    where dp.id = p_draft_pick_id
      and sr.player_profile_id = p_player_profile_id
    limit 1;
  end if;

  update epl.draft_picks
  set
    player_profile_id = p_player_profile_id,
    season_registration_id = coalesce(v_season_registration_id, season_registration_id)
  where id = p_draft_pick_id;

  select ds.id, s.slug
    into v_session_id, v_season_slug
  from epl.draft_picks dp
  join epl.draft_boards db on db.id = dp.draft_board_id
  join epl.draft_sessions ds on ds.draft_board_id = db.id
  join epl.seasons s on s.id = ds.season_id
  where dp.id = p_draft_pick_id
  limit 1;

  insert into epl.draft_pick_overrides (
    season_id,
    draft_session_id,
    draft_pick_id,
    override_type,
    from_player_profile_id,
    to_player_profile_id,
    note
  )
  select
    ds.season_id,
    ds.id,
    p_draft_pick_id,
    'manual_assign',
    v_old_player,
    p_player_profile_id,
    p_note
  from epl.draft_sessions ds
  where ds.id = v_session_id;

  perform public.epl_log_draft_action(
    v_season_slug,
    'override',
    'Manual Pick Assignment',
    v_session_id,
    null,
    p_draft_pick_id,
    null,
    p_player_profile_id,
    jsonb_build_object('note', p_note, 'from_player_profile_id', v_old_player, 'to_player_profile_id', p_player_profile_id)
  );
end;
$$;

grant execute on function public.epl_manual_assign_pick_player(uuid, uuid, text) to anon, authenticated, service_role;

create or replace function public.epl_swap_draft_picks(
  p_pick_a uuid,
  p_pick_b uuid,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = public, epl
as $$
declare
  a_player uuid;
  a_reg uuid;
  b_player uuid;
  b_reg uuid;
  v_session_id uuid;
  v_season_slug text;
begin
  select player_profile_id, season_registration_id
    into a_player, a_reg
  from epl.draft_picks
  where id = p_pick_a;

  select player_profile_id, season_registration_id
    into b_player, b_reg
  from epl.draft_picks
  where id = p_pick_b;

  update epl.draft_picks
  set
    player_profile_id = b_player,
    season_registration_id = b_reg
  where id = p_pick_a;

  update epl.draft_picks
  set
    player_profile_id = a_player,
    season_registration_id = a_reg
  where id = p_pick_b;

  select ds.id, s.slug
    into v_session_id, v_season_slug
  from epl.draft_picks dp
  join epl.draft_boards db on db.id = dp.draft_board_id
  join epl.draft_sessions ds on ds.draft_board_id = db.id
  join epl.seasons s on s.id = ds.season_id
  where dp.id = p_pick_a
  limit 1;

  perform public.epl_log_draft_action(
    v_season_slug,
    'override',
    'Swap Draft Picks',
    v_session_id,
    null,
    p_pick_a,
    null,
    null,
    jsonb_build_object('pick_a', p_pick_a, 'pick_b', p_pick_b, 'note', p_note)
  );
end;
$$;

grant execute on function public.epl_swap_draft_picks(uuid, uuid, text) to anon, authenticated, service_role;

create or replace function public.epl_set_production_state(
  p_session_id uuid,
  p_state text,
  p_message text default null,
  p_sponsor_message text default null,
  p_reveal_duration_ms integer default null
)
returns void
language plpgsql
security definer
set search_path = public, epl
as $$
declare
  v_season_slug text;
begin
  update epl.draft_sessions
  set
    production_state = p_state,
    production_message = p_message,
    sponsor_message = p_sponsor_message,
    reveal_duration_ms = coalesce(p_reveal_duration_ms, reveal_duration_ms),
    updated_at = now()
  where id = p_session_id;

  select s.slug
    into v_season_slug
  from epl.draft_sessions ds
  join epl.seasons s on s.id = ds.season_id
  where ds.id = p_session_id
  limit 1;

  perform public.epl_log_draft_action(
    v_season_slug,
    'production',
    'Set Production State',
    p_session_id,
    null,
    null,
    null,
    null,
    jsonb_build_object(
      'state', p_state,
      'message', p_message,
      'sponsor_message', p_sponsor_message,
      'reveal_duration_ms', p_reveal_duration_ms
    )
  );
end;
$$;

grant execute on function public.epl_set_production_state(uuid, text, text, text, integer) to anon, authenticated, service_role;

commit;
