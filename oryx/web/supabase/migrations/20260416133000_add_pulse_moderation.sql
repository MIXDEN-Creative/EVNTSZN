alter table public.evntszn_pulse_posts
  add column if not exists moderation_state text not null default 'clear'
    check (moderation_state in ('clear', 'flagged', 'hidden', 'removed', 'restored')),
  add column if not exists moderation_reason text,
  add column if not exists moderation_note text,
  add column if not exists moderated_by_user_id uuid,
  add column if not exists moderated_at timestamptz,
  add column if not exists escalated_to_user_id uuid;

create table if not exists public.evntszn_pulse_moderators (
  user_id uuid primary key,
  scope_type text not null default 'city' check (scope_type in ('global', 'city', 'custom')),
  city_scope text[] not null default '{}'::text[],
  is_active boolean not null default true,
  can_assign boolean not null default false,
  can_override boolean not null default false,
  note text,
  granted_by_user_id uuid,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.evntszn_pulse_user_controls (
  user_id uuid primary key,
  is_muted boolean not null default false,
  is_suspended boolean not null default false,
  city_scope text[] not null default '{}'::text[],
  reason text,
  note text,
  updated_by_user_id uuid,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.evntszn_pulse_moderation_actions (
  id uuid primary key default gen_random_uuid(),
  pulse_post_id uuid references public.evntszn_pulse_posts (id) on delete set null,
  target_user_id uuid,
  moderator_user_id uuid,
  action_type text not null check (
    action_type in (
      'flag',
      'review_flag',
      'hide',
      'remove',
      'restore',
      'mute_user',
      'unmute_user',
      'suspend_user',
      'restore_user',
      'assign_moderator',
      'remove_moderator',
      'escalate'
    )
  ),
  action_state text not null default 'completed' check (action_state in ('pending', 'completed', 'overridden')),
  city text,
  scope_type text,
  reason text,
  note text,
  assigned_to_user_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists evntszn_pulse_moderators_active_idx
  on public.evntszn_pulse_moderators (is_active, scope_type, updated_at desc);

create index if not exists evntszn_pulse_user_controls_state_idx
  on public.evntszn_pulse_user_controls (is_muted, is_suspended, updated_at desc);

create index if not exists evntszn_pulse_moderation_actions_post_idx
  on public.evntszn_pulse_moderation_actions (pulse_post_id, created_at desc);

create index if not exists evntszn_pulse_moderation_actions_target_idx
  on public.evntszn_pulse_moderation_actions (target_user_id, created_at desc);

drop trigger if exists evntszn_pulse_moderators_set_updated_at on public.evntszn_pulse_moderators;
create trigger evntszn_pulse_moderators_set_updated_at
before update on public.evntszn_pulse_moderators
for each row execute function public.set_updated_at();

drop trigger if exists evntszn_pulse_user_controls_set_updated_at on public.evntszn_pulse_user_controls;
create trigger evntszn_pulse_user_controls_set_updated_at
before update on public.evntszn_pulse_user_controls
for each row execute function public.set_updated_at();
