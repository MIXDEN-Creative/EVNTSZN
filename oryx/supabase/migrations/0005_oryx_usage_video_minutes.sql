-- ORYX v5: Usage metering for video/audio participant-minutes
-- Supports: free tier allowance per org, package caps, overage rating, and invoicing hooks

create extension if not exists pgcrypto;

-- 1) Define org usage limits and pricing
-- You can store your package allowances here (e.g., Core 10k, Pro 20k, Studio 50k, etc.)
create table if not exists public.org_usage_limits (
  org_id uuid primary key references public.organizations(id) on delete cascade,

  -- participant-minutes per month (video/audio combined) included
  included_minutes_per_month integer not null default 10000,

  -- $ per participant-minute after included cap
  overage_rate numeric(12,6) not null default 0.001500,

  currency text not null default 'USD',

  -- if true, block sessions when cap reached. if false, allow and bill overages.
  hard_cap boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2) Track usage events (append-only ledger)
-- Every call session reports participant-minutes here
create table if not exists public.video_usage_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,

  -- identify the session/room
  session_id text not null,
  provider text not null default 'webrtc', -- daily, twilio, agora, etc.

  -- metering
  participants integer not null default 1,
  duration_seconds integer not null default 0,
  participant_minutes numeric(18,4) not null default 0,

  started_at timestamptz,
  ended_at timestamptz,

  -- links to optional objects
  conversation_id uuid references public.conversations(id) on delete set null,
  event_id uuid references public.events(id) on delete set null,

  meta jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now()
);

create index if not exists idx_video_usage_org_created on public.video_usage_events(org_id, created_at);
create index if not exists idx_video_usage_session on public.video_usage_events(org_id, session_id);

-- 3) Monthly rollups for fast billing queries
create table if not exists public.org_usage_monthly (
  org_id uuid not null references public.organizations(id) on delete cascade,
  month_start date not null, -- first day of month

  participant_minutes numeric(18,4) not null default 0,
  included_minutes integer not null default 0,
  overage_minutes numeric(18,4) not null default 0,
  overage_amount numeric(18,2) not null default 0,

  currency text not null default 'USD',
  last_calculated_at timestamptz not null default now(),

  primary key (org_id, month_start)
);

-- 4) Helper: calculate participant-minutes precisely
create or replace function public.calc_participant_minutes(participants int, duration_seconds int)
returns numeric
language sql
immutable
as $$
  select (greatest(participants, 0)::numeric * greatest(duration_seconds, 0)::numeric) / 60.0;
$$;

-- 5) Recalc monthly usage for an org for a given month
-- (We call this from an Edge Function or admin job)
create or replace function public.recalc_org_usage_monthly(target_org uuid, target_month_start date)
returns void
language plpgsql
as $$
declare
  month_end date := (target_month_start + interval '1 month')::date;
  total_minutes numeric(18,4);
  included int;
  rate numeric(12,6);
  currency_code text;
  over_minutes numeric(18,4);
  over_amount numeric(18,2);
begin
  select coalesce(sum(e.participant_minutes),0)
    into total_minutes
  from public.video_usage_events e
  where e.org_id = target_org
    and e.created_at >= target_month_start::timestamptz
    and e.created_at < month_end::timestamptz;

  select l.included_minutes_per_month, l.overage_rate, l.currency
    into included, rate, currency_code
  from public.org_usage_limits l
  where l.org_id = target_org;

  if included is null then
    -- default allowance if no record exists
    included := 10000;
    rate := 0.001500;
    currency_code := 'USD';
  end if;

  over_minutes := greatest(total_minutes - included::numeric, 0);
  over_amount := round((over_minutes * rate)::numeric, 2);

  insert into public.org_usage_monthly (org_id, month_start, participant_minutes, included_minutes, overage_minutes, overage_amount, currency, last_calculated_at)
  values (target_org, target_month_start, total_minutes, included, over_minutes, over_amount, currency_code, now())
  on conflict (org_id, month_start) do update
    set participant_minutes = excluded.participant_minutes,
        included_minutes = excluded.included_minutes,
        overage_minutes = excluded.overage_minutes,
        overage_amount = excluded.overage_amount,
        currency = excluded.currency,
        last_calculated_at = now();
end;
$$;

-- 6) Seed: default limits for existing orgs (optional)
-- You can update per org when they buy a package.
insert into public.org_usage_limits (org_id)
select o.id
from public.organizations o
left join public.org_usage_limits l on l.org_id = o.id
where l.org_id is null;
