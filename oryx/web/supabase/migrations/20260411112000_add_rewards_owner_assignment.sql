alter table public.merch_reward_settings
add column if not exists assigned_manager_user_id uuid null references public.evntszn_profiles(user_id) on delete set null;
