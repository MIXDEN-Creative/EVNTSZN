alter table epl.player_applications
  add column if not exists assigned_reviewer_user_id uuid references auth.users(id) on delete set null;

create index if not exists epl_player_applications_assigned_reviewer_idx
  on epl.player_applications(assigned_reviewer_user_id, submitted_at desc);

create table if not exists epl.waiver_webhook_submissions (
  id uuid primary key default gen_random_uuid(),
  tally_event_id text not null unique,
  submission_id text,
  form_id text,
  form_name text,
  respondent_id text,
  signature_verified boolean not null default false,
  email text,
  first_name text,
  last_name text,
  match_status text not null default 'unmatched' check (match_status in ('matched', 'ambiguous', 'unmatched')),
  matched_application_id uuid references epl.player_applications(id) on delete set null,
  candidate_application_ids jsonb not null default '[]'::jsonb,
  notes text,
  submitted_at timestamptz,
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists epl_waiver_webhook_submissions_match_status_idx
  on epl.waiver_webhook_submissions(match_status, created_at desc);

create index if not exists epl_waiver_webhook_submissions_matched_application_idx
  on epl.waiver_webhook_submissions(matched_application_id, created_at desc);

drop trigger if exists epl_waiver_webhook_submissions_set_updated_at on epl.waiver_webhook_submissions;
create trigger epl_waiver_webhook_submissions_set_updated_at
before update on epl.waiver_webhook_submissions
for each row execute function public.set_updated_at_column();
