begin;

create table if not exists epl.team_war_room_notes (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references epl.seasons(id) on delete cascade,
  team_id uuid not null references epl.teams(id) on delete cascade,
  title text not null,
  note text not null,
  priority text not null default 'normal',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists epl.player_scouting_notes (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references epl.seasons(id) on delete cascade,
  player_profile_id uuid not null references epl.player_profiles(id) on delete cascade,
  title text not null,
  note text not null,
  score numeric(5,2) null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists epl.draft_operator_roles (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references epl.seasons(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role_code text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_epl_draft_operator_roles_unique
  on epl.draft_operator_roles(season_id, user_id, role_code);

alter table epl.draft_sessions
  add column if not exists lower_third_text text null;

alter table epl.draft_sessions
  add column if not exists countdown_seconds integer not null default 0;

alter table epl.draft_sessions
  add column if not exists sound_cue_enabled boolean not null default false;

alter table epl.draft_sessions
  add column if not exists sound_cue_key text null;

alter table epl.draft_sessions
  add column if not exists on_clock_team_id uuid null references epl.teams(id) on delete set null;

create or replace function public.epl_create_trade(
  p_season_slug text,
  p_draft_session_id uuid,
  p_from_team_id uuid,
  p_to_team_id uuid,
  p_from_pick_id uuid default null,
  p_to_pick_id uuid default null,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, epl
as $$
declare
  v_trade_id uuid;
begin
  insert into epl.draft_trades (
    season_id,
    draft_session_id,
    from_team_id,
    to_team_id,
    from_pick_id,
    to_pick_id,
    trade_status,
    notes
  )
  select
    s.id,
    p_draft_session_id,
    p_from_team_id,
    p_to_team_id,
    p_from_pick_id,
    p_to_pick_id,
    'proposed',
    p_notes
  from epl.seasons s
  join epl.leagues l on l.id = s.league_id
  where l.slug = 'epl'
    and s.slug = p_season_slug
  returning id into v_trade_id;

  perform public.epl_log_draft_action(
    p_season_slug,
    'trade',
    'Trade Proposed',
    p_draft_session_id,
    null,
    p_from_pick_id,
    p_from_team_id,
    null,
    jsonb_build_object(
      'trade_id', v_trade_id,
      'to_team_id', p_to_team_id,
      'to_pick_id', p_to_pick_id,
      'notes', p_notes
    )
  );

  return v_trade_id;
end;
$$;

grant execute on function public.epl_create_trade(text, uuid, uuid, uuid, uuid, uuid, text) to anon, authenticated, service_role;

create or replace function public.epl_approve_trade(
  p_trade_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, epl
as $$
declare
  v_from_pick uuid;
  v_to_pick uuid;
  v_session_id uuid;
  v_season_slug text;
begin
  select
    from_pick_id,
    to_pick_id,
    draft_session_id
  into
    v_from_pick,
    v_to_pick,
    v_session_id
  from epl.draft_trades
  where id = p_trade_id
  limit 1;

  if v_from_pick is not null and v_to_pick is not null then
    perform public.epl_swap_draft_picks(v_from_pick, v_to_pick, 'Approved trade');
  end if;

  update epl.draft_trades
  set
    trade_status = 'approved',
    updated_at = now()
  where id = p_trade_id;

  select s.slug
    into v_season_slug
  from epl.draft_sessions ds
  join epl.seasons s on s.id = ds.season_id
  where ds.id = v_session_id
  limit 1;

  perform public.epl_log_draft_action(
    v_season_slug,
    'trade',
    'Trade Approved',
    v_session_id,
    null,
    v_from_pick,
    null,
    null,
    jsonb_build_object('trade_id', p_trade_id, 'to_pick_id', v_to_pick)
  );
end;
$$;

grant execute on function public.epl_approve_trade(uuid) to anon, authenticated, service_role;

create or replace function public.epl_reject_trade(
  p_trade_id uuid,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public, epl
as $$
declare
  v_session_id uuid;
  v_season_slug text;
begin
  update epl.draft_trades
  set
    trade_status = 'rejected',
    notes = coalesce(notes, '') || case when p_reason is not null then E'\nRejected: ' || p_reason else '' end,
    updated_at = now()
  where id = p_trade_id
  returning draft_session_id into v_session_id;

  select s.slug
    into v_season_slug
  from epl.draft_sessions ds
  join epl.seasons s on s.id = ds.season_id
  where ds.id = v_session_id
  limit 1;

  perform public.epl_log_draft_action(
    v_season_slug,
    'trade',
    'Trade Rejected',
    v_session_id,
    null,
    null,
    null,
    null,
    jsonb_build_object('trade_id', p_trade_id, 'reason', p_reason)
  );
end;
$$;

grant execute on function public.epl_reject_trade(uuid, text) to anon, authenticated, service_role;

create or replace function public.epl_upsert_team_war_room_note(
  p_season_slug text,
  p_team_id uuid,
  p_title text,
  p_note text,
  p_priority text default 'normal'
)
returns uuid
language plpgsql
security definer
set search_path = public, epl
as $$
declare
  v_note_id uuid;
  v_season_id uuid;
begin
  select s.id into v_season_id
  from epl.seasons s
  join epl.leagues l on l.id = s.league_id
  where l.slug = 'epl' and s.slug = p_season_slug
  limit 1;

  insert into epl.team_war_room_notes (
    season_id, team_id, title, note, priority
  )
  values (
    v_season_id, p_team_id, p_title, p_note, p_priority
  )
  returning id into v_note_id;

  return v_note_id;
end;
$$;

grant execute on function public.epl_upsert_team_war_room_note(text, uuid, text, text, text) to anon, authenticated, service_role;

create or replace function public.epl_upsert_player_scouting_note(
  p_season_slug text,
  p_player_profile_id uuid,
  p_title text,
  p_note text,
  p_score numeric default null
)
returns uuid
language plpgsql
security definer
set search_path = public, epl
as $$
declare
  v_note_id uuid;
  v_season_id uuid;
begin
  select s.id into v_season_id
  from epl.seasons s
  join epl.leagues l on l.id = s.league_id
  where l.slug = 'epl' and s.slug = p_season_slug
  limit 1;

  insert into epl.player_scouting_notes (
    season_id, player_profile_id, title, note, score
  )
  values (
    v_season_id, p_player_profile_id, p_title, p_note, p_score
  )
  returning id into v_note_id;

  return v_note_id;
end;
$$;

grant execute on function public.epl_upsert_player_scouting_note(text, uuid, text, text, numeric) to anon, authenticated, service_role;

drop view if exists public.epl_v_admin_draft_trades;
create view public.epl_v_admin_draft_trades as
select
  dt.id,
  s.slug as season_slug,
  dt.draft_session_id,
  dt.trade_status,
  dt.notes,
  dt.created_at,
  dt.updated_at,
  tf.display_name as from_team_name,
  tt.display_name as to_team_name,
  dt.from_team_id,
  dt.to_team_id,
  dt.from_pick_id,
  dt.to_pick_id
from epl.draft_trades dt
join epl.seasons s on s.id = dt.season_id
left join epl.teams tf on tf.id = dt.from_team_id
left join epl.teams tt on tt.id = dt.to_team_id;

grant select on public.epl_v_admin_draft_trades to anon, authenticated, service_role;

drop view if exists public.epl_v_admin_team_war_room_notes;
create view public.epl_v_admin_team_war_room_notes as
select
  s.slug as season_slug,
  n.id,
  n.team_id,
  t.display_name as team_name,
  n.title,
  n.note,
  n.priority,
  n.created_at,
  n.updated_at
from epl.team_war_room_notes n
join epl.seasons s on s.id = n.season_id
join epl.teams t on t.id = n.team_id;

grant select on public.epl_v_admin_team_war_room_notes to anon, authenticated, service_role;

drop view if exists public.epl_v_admin_player_scouting_notes;
create view public.epl_v_admin_player_scouting_notes as
select
  s.slug as season_slug,
  n.id,
  n.player_profile_id,
  trim(pp.first_name || ' ' || pp.last_name) as player_name,
  n.title,
  n.note,
  n.score,
  n.created_at,
  n.updated_at
from epl.player_scouting_notes n
join epl.seasons s on s.id = n.season_id
join epl.player_profiles pp on pp.id = n.player_profile_id;

grant select on public.epl_v_admin_player_scouting_notes to anon, authenticated, service_role;

commit;
