create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.evntszn_pulse_posts (
  id uuid primary key default gen_random_uuid(),
  visibility text not null default 'public' check (visibility in ('public', 'internal')),
  status text not null default 'published' check (status in ('draft', 'published', 'archived')),
  title text not null,
  body text not null,
  city text,
  source_type text,
  source_label text,
  pulse_score numeric(4, 1),
  reservation_signal text,
  sponsor_account_id uuid references public.evntszn_sponsor_accounts (id) on delete set null,
  created_by_user_id uuid,
  is_featured boolean not null default false,
  bolt_only boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.evntszn_pulse_posts
  add column if not exists moderation_state text not null default 'clear'
    check (moderation_state in ('clear', 'flagged', 'hidden', 'removed', 'restored')),
  add column if not exists moderation_reason text,
  add column if not exists moderation_note text,
  add column if not exists moderated_by_user_id uuid,
  add column if not exists moderated_at timestamptz,
  add column if not exists escalated_to_user_id uuid;

create index if not exists evntszn_pulse_posts_visibility_idx
  on public.evntszn_pulse_posts (visibility, status, created_at desc);

drop trigger if exists evntszn_pulse_posts_set_updated_at on public.evntszn_pulse_posts;
create trigger evntszn_pulse_posts_set_updated_at
before update on public.evntszn_pulse_posts
for each row execute function public.set_updated_at();

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

create table if not exists public.evntszn_message_threads (
  id uuid primary key default gen_random_uuid(),
  thread_type text not null check (thread_type in ('public', 'internal')),
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved', 'closed')),
  subject text not null,
  created_by_user_id uuid,
  owner_user_id uuid,
  assigned_to_user_id uuid,
  related_entity_type text,
  related_entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists evntszn_message_threads_type_idx
  on public.evntszn_message_threads (thread_type, status, updated_at desc);

drop trigger if exists evntszn_message_threads_set_updated_at on public.evntszn_message_threads;
create trigger evntszn_message_threads_set_updated_at
before update on public.evntszn_message_threads
for each row execute function public.set_updated_at();

create table if not exists public.evntszn_thread_participants (
  thread_id uuid not null references public.evntszn_message_threads (id) on delete cascade,
  user_id uuid not null,
  role_label text,
  is_internal boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (thread_id, user_id)
);

create index if not exists evntszn_thread_participants_user_idx
  on public.evntszn_thread_participants (user_id, created_at desc);

create table if not exists public.evntszn_thread_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.evntszn_message_threads (id) on delete cascade,
  sender_user_id uuid,
  sender_label text,
  body text not null,
  is_internal boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists evntszn_thread_messages_thread_idx
  on public.evntszn_thread_messages (thread_id, created_at asc);

create table if not exists public.evntszn_reserve_venues (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  venue_id uuid not null unique references public.evntszn_venues(id) on delete cascade,
  is_active boolean not null default true,
  settings jsonb not null default '{}'::jsonb
);

create table if not exists public.evntszn_reserve_slots (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  reserve_venue_id uuid not null references public.evntszn_reserve_venues(id) on delete cascade,
  day_of_week integer not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  capacity_limit integer not null default 0,
  is_active boolean not null default true
);

create table if not exists public.evntszn_reserve_bookings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  reserve_venue_id uuid not null references public.evntszn_reserve_venues(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  guest_name text not null,
  guest_email text not null,
  guest_phone text,
  booking_date date not null,
  booking_time time not null,
  party_size integer not null default 1,
  status text not null default 'confirmed' check (status in ('confirmed', 'waitlisted', 'checked_in', 'no_show', 'cancelled')),
  internal_notes text,
  metadata jsonb not null default '{}'::jsonb
);

alter table public.evntszn_reserve_bookings
  add column if not exists requested_status text,
  add column if not exists seated_at timestamptz,
  add column if not exists source_channel text not null default 'reserve',
  add column if not exists revenue_amount_usd numeric(10,2) not null default 0,
  add column if not exists attended_guest_count integer not null default 0;

create index if not exists evntszn_reserve_slots_lookup_idx
  on public.evntszn_reserve_slots (reserve_venue_id, day_of_week, start_time, is_active);

create index if not exists evntszn_reserve_bookings_lookup_idx
  on public.evntszn_reserve_bookings (reserve_venue_id, booking_date, booking_time, status);

drop trigger if exists evntszn_reserve_venues_set_updated_at on public.evntszn_reserve_venues;
create trigger evntszn_reserve_venues_set_updated_at
before update on public.evntszn_reserve_venues
for each row execute function public.set_updated_at();

drop trigger if exists evntszn_reserve_slots_set_updated_at on public.evntszn_reserve_slots;
create trigger evntszn_reserve_slots_set_updated_at
before update on public.evntszn_reserve_slots
for each row execute function public.set_updated_at();

drop trigger if exists evntszn_reserve_bookings_set_updated_at on public.evntszn_reserve_bookings;
create trigger evntszn_reserve_bookings_set_updated_at
before update on public.evntszn_reserve_bookings
for each row execute function public.set_updated_at();
