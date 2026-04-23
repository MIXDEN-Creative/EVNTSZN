create table if not exists public.evntszn_night_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  city text,
  title text not null,
  vibe_lane text,
  start_stop text,
  mid_stop text,
  peak_stop text,
  late_stop text,
  status text not null default 'draft',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists evntszn_night_plans_user_created_idx
  on public.evntszn_night_plans (user_id, created_at desc);
