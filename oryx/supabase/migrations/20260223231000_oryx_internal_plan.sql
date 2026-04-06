-- ORYX: Ensure INTERNAL plan exists for FK usage
-- This must exist before any plan_modules row references 'internal'

insert into public.plan_catalog (
  plan_key,
  plan_name,
  monthly_price_cents,
  annual_price_cents,
  max_seats,
  max_video_participant_minutes
)
values (
  'internal',
  'Internal (MIXDEN)',
  0,
  0,
  1000000,
  1000000000
)
on conflict (plan_key) do nothing;
