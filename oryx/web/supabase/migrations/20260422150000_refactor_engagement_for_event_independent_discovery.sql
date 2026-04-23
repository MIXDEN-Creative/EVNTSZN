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
    'build_your_night',
    'Build your night',
    'Save a real four-stop night plan so EVNTSZN becomes part of the plan, not just the browse.',
    'planning',
    'weekly',
    'night_plan_created',
    1,
    75,
    'night_planner',
    50,
    '{"surface":"discover"}'::jsonb
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
  metadata = excluded.metadata,
  is_active = true,
  updated_at = timezone('utc', now());

update public.evntszn_engagement_runs
set metadata = jsonb_build_object(
      'actions', jsonb_build_array('saved_item', 'saved_item', 'night_plan_created', 'pulse_view'),
      'expires', 'weekend',
      'urgencyLabel', 'Ends Sunday night'
    ),
    updated_at = timezone('utc', now())
where run_key = 'weekend_run';

update public.evntszn_engagement_runs
set metadata = jsonb_build_object(
      'actions', jsonb_build_array('city_explored', 'discovery_lane_explored', 'city_explored'),
      'expires', 'weekly',
      'urgencyLabel', 'Resets this week'
    ),
    updated_at = timezone('utc', now())
where run_key = 'city_run';

update public.evntszn_engagement_runs
set metadata = jsonb_build_object(
      'actions', jsonb_build_array('pulse_view', 'pulse_view', 'pulse_posted'),
      'expires', 'weekly',
      'urgencyLabel', 'Resets this week'
    ),
    updated_at = timezone('utc', now())
where run_key = 'pulse_run';
