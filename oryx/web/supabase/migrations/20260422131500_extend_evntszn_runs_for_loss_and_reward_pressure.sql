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
    'night_run',
    'Night Run',
    'Lock in a live night by opening discovery, checking a venue lane, and making one reserve-aware move before the window closes.',
    'nightlife',
    'daily',
    3,
    85,
    'night_runner',
    'weekend_run',
    '{"actions":["discover_view","city_explored","reserve_view"],"expires":"night","urgencyLabel":"Ends tonight"}'::jsonb
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
  metadata = excluded.metadata,
  is_active = true,
  updated_at = timezone('utc', now());

update public.evntszn_engagement_runs
set metadata = coalesce(metadata, '{}'::jsonb) || '{"expires":"weekend","urgencyLabel":"Ends Sunday night"}'::jsonb,
    updated_at = timezone('utc', now())
where run_key = 'weekend_run';

update public.evntszn_engagement_runs
set metadata = coalesce(metadata, '{}'::jsonb) || '{"expires":"weekly","urgencyLabel":"Resets this week"}'::jsonb,
    updated_at = timezone('utc', now())
where run_key in ('city_run', 'pulse_run');
