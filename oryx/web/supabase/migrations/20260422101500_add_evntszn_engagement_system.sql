create table if not exists public.evntszn_member_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  total_xp integer not null default 0,
  current_level integer not null default 1,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  city_participation_score integer not null default 0,
  trust_score integer not null default 0,
  reputation_score integer not null default 0,
  saved_count integer not null default 0,
  pulse_posts_count integer not null default 0,
  reserve_actions_count integer not null default 0,
  crew_requests_count integer not null default 0,
  epl_actions_count integer not null default 0,
  sponsor_perk_actions_count integer not null default 0,
  stayops_actions_count integer not null default 0,
  city_collection_count integer not null default 0,
  last_activity_date date,
  last_city text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.evntszn_activity_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  event_type text not null,
  city text,
  reference_type text,
  reference_id text,
  value numeric(12,2),
  dedupe_key text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists evntszn_activity_events_user_dedupe_idx
  on public.evntszn_activity_events (user_id, dedupe_key)
  where user_id is not null and dedupe_key is not null;

create index if not exists evntszn_activity_events_user_occurred_idx
  on public.evntszn_activity_events (user_id, occurred_at desc);

create table if not exists public.evntszn_member_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  badge_key text not null,
  badge_label text not null,
  badge_description text,
  tone text not null default 'city',
  metadata jsonb not null default '{}'::jsonb,
  awarded_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists evntszn_member_badges_user_badge_idx
  on public.evntszn_member_badges (user_id, badge_key);

create index if not exists evntszn_member_badges_user_awarded_idx
  on public.evntszn_member_badges (user_id, awarded_at desc);

create table if not exists public.evntszn_engagement_missions (
  mission_key text primary key,
  title text not null,
  description text not null,
  category text not null,
  frequency text not null,
  action_key text not null,
  target_count integer not null default 1,
  xp_reward integer not null default 0,
  badge_reward_key text,
  sort_order integer not null default 100,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.evntszn_member_mission_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mission_key text not null references public.evntszn_engagement_missions(mission_key) on delete cascade,
  period_key text not null,
  progress_count integer not null default 0,
  target_count integer not null default 1,
  completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists evntszn_member_mission_progress_user_period_idx
  on public.evntszn_member_mission_progress (user_id, mission_key, period_key);

create index if not exists evntszn_member_mission_progress_user_updated_idx
  on public.evntszn_member_mission_progress (user_id, updated_at desc);

create table if not exists public.evntszn_member_collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  collection_key text not null,
  item_key text not null,
  city text,
  metadata jsonb not null default '{}'::jsonb,
  unlocked_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists evntszn_member_collections_user_item_idx
  on public.evntszn_member_collections (user_id, collection_key, item_key);

insert into public.evntszn_engagement_missions (
  mission_key,
  title,
  description,
  category,
  frequency,
  action_key,
  target_count,
  xp_reward,
  badge_reward_key,
  sort_order,
  metadata
) values
  (
    'complete_profile',
    'Complete your profile',
    'Set your EVNTSZN profile so the platform can tailor cities, nights, and status to you.',
    'identity',
    'one_time',
    'profile_completed',
    1,
    80,
    'profile_built',
    10,
    '{"surface":"account"}'::jsonb
  ),
  (
    'save_three_this_week',
    'Save 3 plans this week',
    'Build your weekend run by saving three events, venues, or reserve options.',
    'discovery',
    'weekly',
    'saved_item',
    3,
    90,
    'city_planner',
    20,
    '{"surface":"discover"}'::jsonb
  ),
  (
    'explore_two_cities',
    'Explore 2 city lanes',
    'Move through two city contexts to build a broader EVNTSZN map.',
    'city',
    'weekly',
    'city_explored',
    2,
    70,
    'city_scout',
    30,
    '{"surface":"discover"}'::jsonb
  ),
  (
    'post_pulse_signal',
    'Post 1 Pulse signal',
    'Add one useful city signal to the public momentum layer.',
    'pulse',
    'daily',
    'pulse_posted',
    1,
    60,
    'pulse_contributor',
    40,
    '{"surface":"pulse"}'::jsonb
  ),
  (
    'submit_reserve_request',
    'Make 1 reserve move',
    'Join a waitlist or submit a reservation to keep your night moving.',
    'reserve',
    'weekly',
    'reserve_requested',
    1,
    75,
    'night_planner',
    50,
    '{"surface":"reserve"}'::jsonb
  ),
  (
    'follow_epl',
    'Follow your EPL lane',
    'Watch a league city or team so game-week movement becomes part of your feed.',
    'epl',
    'weekly',
    'epl_followed',
    1,
    55,
    'supporter_status',
    60,
    '{"surface":"epl"}'::jsonb
  ),
  (
    'book_or_inquire_crew',
    'Open a crew request',
    'Send one marketplace request to unlock pro-requester momentum.',
    'crew',
    'weekly',
    'crew_requested',
    1,
    85,
    'crew_connector',
    70,
    '{"surface":"crew"}'::jsonb
  ),
  (
    'unlock_sponsor_perk',
    'Unlock a sponsor perk',
    'Open a sponsor-backed offer or featured placement path.',
    'perks',
    'weekly',
    'sponsor_perk_viewed',
    1,
    45,
    'perk_unlocked',
    80,
    '{"surface":"sponsors"}'::jsonb
  ),
  (
    'start_stayops_pipeline',
    'Start a StayOps intake',
    'Move a property into the StayOps revenue system.',
    'stayops',
    'one_time',
    'stayops_intake_submitted',
    1,
    100,
    'asset_operator',
    90,
    '{"surface":"stayops"}'::jsonb
  )
on conflict (mission_key) do update
set
  title = excluded.title,
  description = excluded.description,
  category = excluded.category,
  frequency = excluded.frequency,
  action_key = excluded.action_key,
  target_count = excluded.target_count,
  xp_reward = excluded.xp_reward,
  badge_reward_key = excluded.badge_reward_key,
  sort_order = excluded.sort_order,
  is_active = true,
  metadata = excluded.metadata,
  updated_at = timezone('utc', now());
