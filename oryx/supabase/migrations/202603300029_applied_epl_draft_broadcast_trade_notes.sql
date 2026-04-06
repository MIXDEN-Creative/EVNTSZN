begin;

create table if not exists epl.team_war_room_notes (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references epl.seasons(id) on delete cascade,
  team_id uuid not null references epl.teams(id) on delete cascade,
  note text not null,
  created_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists epl.player_scouting_notes (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references epl.seasons(id) on delete cascade,
  player_profile_id uuid not null references epl.player_profiles(id) on delete cascade,
  note text not null,
  grade text null,
  tags text[] not null default '{}',
  created_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table epl.draft_sessions
  add column if not exists broadcast_lower_third text null;

alter table epl.draft_sessions
  add column if not exists countdown_seconds integer not null default 0;

alter table epl.draft_sessions
  add column if not exists sound_cue text null;

alter table epl.draft_sessions
  add column if not exists operator_mode text not null default 'commissioner';

create table if not exists epl.draft_operator_roles (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references epl.seasons(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role_code text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_epl_draft_operator_roles_unique
  on epl.draft_operator_roles(season_id, user_id, role_code);

create or replace view epl.v_admin_team_war_room_notes as
select
  s.slug as season_slug,
  s.name as season_name,
  t.id as team_id,
  t.slug as team_slug,
  t.display_name as team_name,
  n.id as note_id,
  n.note,
  n.created_by,
  n.created_at,
  n.updated_at
from epl.team_war_room_notes n
join epl.seasons s on s.id = n.season_id
join epl.teams t on t.id = n.team_id;

create or replace view public.epl_v_admin_team_war_room_notes as
select * from epl.v_admin_team_war_room_notes;

grant select on public.epl_v_admin_team_war_room_notes to anon, authenticated, service_role;

create or replace view epl.v_admin_player_scouting_notes as
select
  s.slug as season_slug,
  s.name as season_name,
  p.id as player_profile_id,
  trim(p.first_name || ' ' || p.last_name) as player_name,
  p.email,
  n.id as note_id,
  n.note,
  n.grade,
  n.tags,
  n.created_by,
  n.created_at,
  n.updated_at
from epl.player_scouting_notes n
join epl.seasons s on s.id = n.season_id
join epl.player_profiles p on p.id = n.player_profile_id;

create or replace view public.epl_v_admin_player_scouting_notes as
select * from epl.v_admin_player_scouting_notes;

grant select on public.epl_v_admin_player_scouting_notes to anon, authenticated, service_role;

create or replace view epl.v_admin_draft_trades as
select
  s.slug as season_slug,
  s.name as season_name,
  tr.id as trade_id,
  tr.draft_session_id,
  tr.trade_status,
  tr.notes,
  tr.created_at,
  tr.updated_at,
  ft.display_name as from_team_name,
  tt.display_name as to_team_name,
  fp.overall_pick_number as from_pick_overall,
  tp.overall_pick_number as to_pick_overall,
  tr.from_pick_id,
  tr.to_pick_id
from epl.draft_trades tr
join epl.seasons s on s.id = tr.season_id
join epl.teams ft on ft.id = tr.from_team_id
join epl.teams tt on tt.id = tr.to_team_id
left join epl.draft_picks fp on fp.id = tr.from_pick_id
left join epl.draft_picks tp on tp.id = tr.to_pick_id;

create or replace view public.epl_v_admin_draft_trades as
select * from epl.v_admin_draft_trades;

grant select on public.epl_v_admin_draft_trades to anon, authenticated, service_role;

create or replace function public.epl_add_team_war_room_note(
  p_season_slug text,
  p_team_id uuid,
  p_note text
)
returns uuid
language plpgsql
security definer
set search_path = public, epl
as $$
declare
  v_season_id uuid;
  v_id uuid;
begin
  select s.id into v_season_id
  from epl.seasons s
  join epl.leagues l on l.id = s.league_id
  where l.slug = 'epl' and s.slug = p_season_slug
  limit 1;

  insert into epl.team_war_room_notes (season_id, team_id, note)
  values (v_season_id, p_team_id, p_note)
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.epl_add_team_war_room_note(text, uuid, text) to anon, authenticated, service_role;

create or replace function public.epl_add_player_scouting_note(
  p_season_slug text,
  p_player_profile_id uuid,
  p_note text,
  p_grade text default null,
  p_tags text[] default '{}'
)
returns uuid
language plpgsql
security definer
set search_path = public, epl
as $$
declare
  v_season_id uuid;
  v_id uuid;
begin
  select s.id into v_season_id
  from epl.seasons s
  join epl.leagues l on l.id = s.league_id
  where l.slug = 'epl' and s.slug = p_season_slug
  limit 1;

  insert into epl.player_scouting_notes (season_id, player_profile_id, note, grade, tags)
  values (v_season_id, p_player_profile_id, p_note, p_grade, coalesce(p_tags, '{}'))
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.epl_add_player_scouting_note(text, uuid, text, text, text[]) to anon, authenticated, service_role;

create or replace function public.epl_propose_trade(
  p_season_slug text,
  p_draft_session_id uuid,
  p_from_team_id uuid,
  p_to_team_id uuid,
  p_from_pick_id uuid,
  p_to_pick_id uuid,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, epl
as $$
declare
  v_season_id uuid;
  v_id uuid;
begin
  select s.id into v_season_id
  from epl.seasons s
  join epl.leagues l on l.id = s.league_id
  where l.slug = 'epl' and s.slug = p_season_slug
  limit 1;

  insert into epl.draft_trades (
    season_id, draft_session_id, from_team_id, to_team_id, from_pick_id, to_pick_id, trade_status, notes
  )
  values (
    v_season_id, p_draft_session_id, p_from_team_id, p_to_team_id, p_from_pick_id, p_to_pick_id, 'proposed', p_notes
  )
  returning id into v_id;

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
      'trade_id', v_id,
      'to_team_id', p_to_team_id,
      'to_pick_id', p_to_pick_id,
      'notes', p_notes
    )
  );

  return v_id;
end;
$$;

grant execute on function public.epl_propose_trade(text, uuid, uuid, uuid, uuid, uuid, text) to anon, authenticated, service_role;

create or replace function public.epl_resolve_trade(
  p_trade_id uuid,
  p_resolution text,
  p_note text default null
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
  select from_pick_id, to_pick_id, draft_session_id, s.slug
    into v_from_pick, v_to_pick, v_session_id, v_season_slug
  from epl.draft_trades tr
  join epl.seasons s on s.id = tr.season_id
  where tr.id = p_trade_id
  limit 1;

  if p_resolution = 'approved' then
    update epl.draft_trades
    set trade_status = 'approved',
        notes = coalesce(notes, '') || case when p_note is not null then E'\n' || p_note else '' end,
        updated_at = now()
    where id = p_trade_id;

    if v_from_pick is not null and v_to_pick is not null then
      perform public.epl_swap_draft_picks(v_from_pick, v_to_pick, coalesce(p_note, 'Trade approved'));
    end if;

    perform public.epl_log_draft_action(
      v_season_slug,
      'trade',
      'Trade Approved',
      v_session_id,
      null,
      v_from_pick,
      null,
      null,
      jsonb_build_object('trade_id', p_trade_id, 'note', p_note)
    );
  else
    update epl.draft_trades
    set trade_status = 'rejected',
        notes = coalesce(notes, '') || case when p_note is not null then E'\n' || p_note else '' end,
        updated_at = now()
    where id = p_trade_id;

    perform public.epl_log_draft_action(
      v_season_slug,
      'trade',
      'Trade Rejected',
      v_session_id,
      null,
      v_from_pick,
      null,
      null,
      jsonb_build_object('trade_id', p_trade_id, 'note', p_note)
    );
  end if;
end;
$$;

grant execute on function public.epl_resolve_trade(uuid, text, text) to anon, authenticated, service_role;

commit;
