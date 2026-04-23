create table if not exists public.evntszn_engagement_runs (
  run_key text primary key,
  title text not null,
  description text not null,
  category text not null,
  frequency text not null default 'weekly',
  target_steps integer not null default 3,
  xp_reward integer not null default 0,
  badge_reward_key text,
  next_run_key text,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.evntszn_member_run_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  run_key text not null references public.evntszn_engagement_runs(run_key) on delete cascade,
  period_key text not null,
  progress_count integer not null default 0,
  target_steps integer not null default 3,
  started_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists evntszn_member_run_progress_user_idx
  on public.evntszn_member_run_progress (user_id, run_key, period_key);

create table if not exists public.evntszn_engagement_collections (
  collection_key text primary key,
  title text not null,
  description text not null,
  category text not null,
  target_count integer not null default 3,
  xp_reward integer not null default 0,
  badge_reward_key text,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.evntszn_member_collection_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  collection_key text not null references public.evntszn_engagement_collections(collection_key) on delete cascade,
  progress_count integer not null default 0,
  target_count integer not null default 3,
  completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists evntszn_member_collection_progress_user_idx
  on public.evntszn_member_collection_progress (user_id, collection_key);

insert into public.evntszn_engagement_runs (
  run_key,
  title,
  description,
  category,
  frequency,
  target_steps,
  xp_reward,
  badge_reward_key,
  next_run_key,
  metadata
) values
  (
    'weekend_run',
    'Weekend Run',
    'Save two plans, open a venue lane, and move one reserve action before the night gets away from you.',
    'discovery',
    'weekly',
    4,
    120,
    'weekend_operator',
    'city_run',
    '{"actions":["saved_item","saved_item","city_explored","reserve_requested"],"surfaces":["discover","reserve"]}'::jsonb
  ),
  (
    'city_run',
    'City Run',
    'Explore three neighborhoods or cities and follow the movement instead of waiting for one listing to do all the work.',
    'city',
    'weekly',
    3,
    100,
    'city_runner',
    'pulse_run',
    '{"actions":["city_explored","city_explored","city_explored"],"surfaces":["discover"]}'::jsonb
  ),
  (
    'pulse_run',
    'Pulse Run',
    'Open the Pulse lane, read the city, and add one useful signal back into the system.',
    'pulse',
    'weekly',
    3,
    95,
    'signal_runner',
    'weekend_run',
    '{"actions":["pulse_view","pulse_view","pulse_posted"],"surfaces":["pulse"]}'::jsonb
  )
on conflict (run_key) do update
set
  title = excluded.title,
  description = excluded.description,
  category = excluded.category,
  frequency = excluded.frequency,
  target_steps = excluded.target_steps,
  xp_reward = excluded.xp_reward,
  badge_reward_key = excluded.badge_reward_key,
  next_run_key = excluded.next_run_key,
  is_active = true,
  metadata = excluded.metadata,
  updated_at = timezone('utc', now());

insert into public.evntszn_engagement_collections (
  collection_key,
  title,
  description,
  category,
  target_count,
  xp_reward,
  badge_reward_key,
  metadata
) values
  (
    'rooftop_circuit',
    'Rooftop Circuit',
    'Build a premium rooftop shortlist by saving and opening elevated city plans.',
    'nightlife',
    5,
    90,
    'rooftop_unlocked',
    '{"matchTypes":["event","reserve","venue"],"keywords":["rooftop","skyline","terrace"]}'::jsonb
  ),
  (
    'nightlife_circuit',
    'Nightlife Circuit',
    'Complete a core city nightlife set through repeated discovery actions.',
    'city',
    6,
    105,
    'nightlife_insider',
    '{"matchTypes":["event","reserve","pulse"],"cityDriven":true}'::jsonb
  ),
  (
    'downtown_unlock',
    'Downtown Unlock',
    'Complete a concentrated city-center loop through discovery and reserve pressure.',
    'neighborhood',
    4,
    80,
    'downtown_unlocked',
    '{"keywords":["downtown","center city","midtown"]}'::jsonb
  )
on conflict (collection_key) do update
set
  title = excluded.title,
  description = excluded.description,
  category = excluded.category,
  target_count = excluded.target_count,
  xp_reward = excluded.xp_reward,
  badge_reward_key = excluded.badge_reward_key,
  is_active = true,
  metadata = excluded.metadata,
  updated_at = timezone('utc', now());
